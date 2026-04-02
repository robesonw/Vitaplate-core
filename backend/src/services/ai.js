import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { getCached, setCached, CACHE_TTL } from '../lib/redis.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model routing — Sonnet for complex generation, Haiku for everything else
const MODELS = {
  SONNET: 'claude-sonnet-4-5',
  HAIKU:  'claude-haiku-4-5-20251001',
};

const AI_CREDIT_LIMITS = {
  free:    1,
  pro:     3,
  premium: 999,
};

// ─── Profile Hashing ──────────────────────────────────────────────────────────
// Buckets biomarkers into ranges so similar profiles share a cache key
function bucketBiomarker(name, value) {
  if (value == null) return 'N/A';
  const rules = {
    LDL:          v => v < 100 ? 'optimal' : v < 130 ? 'borderline' : 'high',
    HDL:          v => v < 40  ? 'low'     : 'normal',
    Glucose:      v => v < 100 ? 'normal'  : v < 126 ? 'prediabetic' : 'diabetic',
    'Vitamin D':  v => v < 20  ? 'deficient': v < 30 ? 'insufficient': 'optimal',
    CRP:          v => v < 1   ? 'normal'  : v < 3   ? 'elevated'    : 'high',
    Triglycerides:v => v < 150 ? 'normal'  : v < 200 ? 'borderline'  : 'high',
    HbA1c:        v => v < 5.7 ? 'normal'  : v < 6.5 ? 'prediabetic' : 'diabetic',
    TSH:          v => v < 0.4 ? 'low'     : v < 4   ? 'normal'      : 'high',
    'Vitamin B12':v => v < 300 ? 'low'     : 'normal',
  };
  const fn = rules[name];
  return fn ? fn(value) : value < 50 ? 'low' : 'normal';
}

export function buildProfileHash(preferences, biomarkers = {}) {
  const bucketed = Object.entries(biomarkers).reduce((acc, [k, v]) => {
    acc[k] = bucketBiomarker(k, v?.value ?? v);
    return acc;
  }, {});

  const key = JSON.stringify({
    goal:    preferences?.healthGoal ?? 'general_wellness',
    diet:    preferences?.dietType   ?? 'custom',
    culture: preferences?.culturalStyle ?? 'none',
    stage:   preferences?.lifeStage  ?? 'general',
    markers: bucketed,
    diabetes: preferences?.diabetesType   ?? 'none',
    heart:    preferences?.heartCondition ?? 'none',
    kidney:   preferences?.kidneyStage    ?? 'none',
    thyroid:  preferences?.thyroidCondition ?? 'none',
  });

  return crypto.createHash('md5').update(key).digest('hex');
}

// ─── Credit Management ────────────────────────────────────────────────────────
export async function checkAndDecrementCredits(userId) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) return { allowed: false, reason: 'No settings found' };

  const plan  = settings.subscriptionPlan;
  const limit = AI_CREDIT_LIMITS[plan] ?? 1;

  // Reset credits monthly
  const lastReset  = new Date(settings.lastCreditReset);
  const now        = new Date();
  const monthApart = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

  if (monthApart) {
    await prisma.userSettings.update({
      where: { userId },
      data: { aiCreditsUsed: 0, lastCreditReset: now },
    });
    settings.aiCreditsUsed = 0;
  }

  if (settings.aiCreditsUsed >= limit) {
    return {
      allowed:   false,
      reason:    `You've used all ${limit} AI generation${limit > 1 ? 's' : ''} this month`,
      used:      settings.aiCreditsUsed,
      limit,
      plan,
    };
  }

  await prisma.userSettings.update({
    where:  { userId },
    data:   { aiCreditsUsed: { increment: 1 } },
  });

  return { allowed: true, used: settings.aiCreditsUsed + 1, limit, plan };
}

// ─── Meal Plan Generation ─────────────────────────────────────────────────────
const MEAL_PLAN_SYSTEM = `You are VitaPlate's clinical nutrition AI. Generate personalized 7-day meal plans based on biomarkers and health goals.

RULES:
- Respond ONLY with valid JSON — no prose, no markdown fences
- Every meal must have: name, calories(string), protein(number,g), carbs(number,g), fat(number,g), nutrients(string), prepTip(string), prepSteps(array), prepTime(string), difficulty(easy|medium|hard), equipment(array), healthBenefit(string)
- Prioritize foods that directly address the user's abnormal biomarkers
- Keep meals practical and ingredient-accessible
- Respect all allergens and dietary restrictions strictly`;

export async function generateMealPlan({ preferences, biomarkers, labSummary }) {
  const profileHash = buildProfileHash(preferences, biomarkers);

  // 1. Check template cache first (free)
  const cached = await getCached(`template:${profileHash}`);
  if (cached) {
    console.log(`✅ Cache hit for profile ${profileHash}`);
    return { ...cached, fromCache: true, profileHash };
  }

  // 2. Check DB for existing template
  const dbTemplate = await prisma.mealPlanTemplate.findUnique({
    where: { profileHash },
  });
  if (dbTemplate) {
    await prisma.mealPlanTemplate.update({
      where: { profileHash },
      data:  { useCount: { increment: 1 } },
    });
    await setCached(`template:${profileHash}`, dbTemplate.plan, CACHE_TTL.TEMPLATE);
    return { ...dbTemplate.plan, fromTemplate: true, profileHash };
  }

  // 3. Generate with AI (Sonnet — complex task)
  const prompt = buildMealPlanPrompt(preferences, biomarkers, labSummary);

  const response = await anthropic.messages.create({
    model:      MODELS.SONNET,
    max_tokens: 4096,
    system:     MEAL_PLAN_SYSTEM,
    messages:   [{ role: 'user', content: prompt }],
  });

  const raw  = response.content[0].text;
  const plan = JSON.parse(raw);

  // 4. Store as template for future users with same profile
  await prisma.mealPlanTemplate.upsert({
    where:  { profileHash },
    create: {
      profileHash,
      conditions:      extractConditions(preferences),
      biomarkerBuckets: bucketAllBiomarkers(biomarkers),
      dietType:        preferences?.dietType ?? 'custom',
      plan,
      useCount:        1,
    },
    update: { plan, useCount: { increment: 1 } },
  });

  await setCached(`template:${profileHash}`, plan, CACHE_TTL.TEMPLATE);

  return { ...plan, fromCache: false, fromTemplate: false, profileHash };
}

function buildMealPlanPrompt(prefs, biomarkers, labSummary) {
  const abnormal = Object.entries(biomarkers || {})
    .filter(([, v]) => v?.status && v.status !== 'normal')
    .map(([k, v]) => `${k}: ${v.value} ${v.unit} (${v.status})`)
    .join(', ');

  return `Generate a 7-day personalized meal plan as JSON.

HEALTH PROFILE:
- Goal: ${prefs?.healthGoal ?? 'general wellness'}
- Diet: ${prefs?.dietType ?? 'balanced'}
- Culture: ${prefs?.culturalStyle ?? 'any'}
- Conditions: diabetes=${prefs?.diabetesType ?? 'none'}, heart=${prefs?.heartCondition ?? 'none'}, kidney=${prefs?.kidneyStage ?? 'none'}, thyroid=${prefs?.thyroidCondition ?? 'none'}
- Allergens: ${(prefs?.allergens ?? []).join(', ') || 'none'}
- Avoid: ${prefs?.foodsAvoided ?? 'none'}
- Budget: $${prefs?.weeklyBudget ?? 100}/week
- Cooking time: ${prefs?.cookingTime ?? 'any'}
- Skill: ${prefs?.skillLevel ?? 'intermediate'}
- People: ${prefs?.numPeople ?? 1}

ABNORMAL BIOMARKERS TO ADDRESS: ${abnormal || 'none — general wellness focus'}
LAB CONTEXT: ${labSummary ?? 'No recent labs'}

Return JSON matching exactly:
{
  "name": "string",
  "days": [
    {
      "day": "Monday",
      "breakfast": { "name":"","calories":"","protein":0,"carbs":0,"fat":0,"nutrients":"","prepTip":"","prepSteps":[],"prepTime":"","difficulty":"","equipment":[],"healthBenefit":"" },
      "lunch": { same structure },
      "dinner": { same structure },
      "snacks": { same structure }
    }
  ],
  "macros": { "protein": 0, "carbs": 0, "fat": 0 },
  "estimated_cost": 0,
  "grocery_list": {}
}`;
}

function extractConditions(prefs) {
  return [
    prefs?.diabetesType    && `diabetes:${prefs.diabetesType}`,
    prefs?.heartCondition  && `heart:${prefs.heartCondition}`,
    prefs?.kidneyStage     && `kidney:${prefs.kidneyStage}`,
    prefs?.thyroidCondition&& `thyroid:${prefs.thyroidCondition}`,
  ].filter(Boolean);
}

function bucketAllBiomarkers(biomarkers = {}) {
  return Object.entries(biomarkers).reduce((acc, [k, v]) => {
    acc[k] = bucketBiomarker(k, v?.value ?? v);
    return acc;
  }, {});
}

// ─── Nova Coach (Haiku — conversational) ──────────────────────────────────────
const NOVA_SYSTEM = `You are Nova, VitaPlate's AI nutrition coach. You are warm, knowledgeable, and evidence-based.
You have access to the user's health profile, recent lab results, and meal plan history.
Keep responses concise, practical, and encouraging. Use markdown formatting for clarity.
Never provide medical diagnoses. Recommend consulting healthcare providers for medical decisions.`;

export async function chatWithNova({ messages, userContext }) {
  const systemWithContext = `${NOVA_SYSTEM}

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}`;

  const response = await anthropic.messages.create({
    model:      MODELS.HAIKU,    // 10x cheaper for chat
    max_tokens: 1024,
    system:     systemWithContext,
    messages:   messages.map(m => ({ role: m.role, content: m.message })),
  });

  return {
    message:    response.content[0].text,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

// ─── Grocery List Generation (Haiku — simple task) ────────────────────────────
export async function generateGroceryList(mealPlan) {
  const response = await anthropic.messages.create({
    model:      MODELS.HAIKU,
    max_tokens: 1024,
    system:     'You are a grocery list generator. Respond ONLY with valid JSON — no prose, no fences.',
    messages:   [{
      role:    'user',
      content: `Extract a categorized grocery list from this meal plan. Return JSON:
{ "produce": ["item1"], "proteins": [], "dairy": [], "grains": [], "pantry": [], "frozen": [] }

Meal plan: ${JSON.stringify(mealPlan?.days?.slice(0, 3))}`,
    }],
  });

  return JSON.parse(response.content[0].text);
}

// ─── Single Meal Swap (Haiku) ─────────────────────────────────────────────────
export async function swapMeal({ mealToReplace, dayContext, userPrefs, biomarkers }) {
  const abnormal = Object.entries(biomarkers || {})
    .filter(([, v]) => v?.status !== 'normal')
    .map(([k, v]) => `${k}:${v.status}`)
    .join(', ');

  const response = await anthropic.messages.create({
    model:      MODELS.HAIKU,
    max_tokens: 512,
    system:     'You are a meal swap assistant. Respond ONLY with valid JSON — no prose.',
    messages:   [{
      role:    'user',
      content: `Suggest one alternative meal to replace: ${JSON.stringify(mealToReplace)}
User conditions: ${abnormal || 'none'}
Allergens: ${(userPrefs?.allergens ?? []).join(', ') || 'none'}
Return same JSON structure as input meal.`,
    }],
  });

  return JSON.parse(response.content[0].text);
}

// ─── Supplement Recommendations (Rules Engine — FREE) ─────────────────────────
const SUPPLEMENT_RULES = [
  { name: 'Vitamin D3 + K2', condition: b => b['Vitamin D']?.value < 30, dose: '5,000 IU D3 + 100mcg K2 daily', why: b => `Your Vitamin D is ${b['Vitamin D']?.value} ng/mL — below optimal (40-80).`, priority: 'HIGH', amazonSearch: 'Vitamin D3 K2 5000 IU softgel', estimatedCost: 40 },
  { name: 'Omega-3 Fish Oil', condition: b => b['Triglycerides']?.value > 150, dose: '2-4g EPA+DHA daily', why: b => `Your triglycerides are ${b['Triglycerides']?.value} — elevated.`, priority: 'HIGH', amazonSearch: 'Omega-3 Fish Oil 2000mg EPA DHA', estimatedCost: 35 },
  { name: 'Curcumin + Piperine', condition: b => b['CRP']?.value > 1.0, dose: '500-1000mg curcumin + piperine', why: b => `Your CRP is ${b['CRP']?.value} — indicating inflammation.`, priority: 'HIGH', amazonSearch: 'Curcumin BioPerine 1000mg', estimatedCost: 30 },
  { name: 'CoQ10', condition: b => b['LDL Cholesterol']?.value > 130, dose: '100-200mg daily with food', why: b => `Your LDL is ${b['LDL Cholesterol']?.value} — CoQ10 supports cardiovascular health.`, priority: 'MEDIUM', amazonSearch: 'CoQ10 200mg ubiquinol', estimatedCost: 40 },
  { name: 'Magnesium Glycinate', condition: b => b['Magnesium']?.value < 1.8, dose: '300-400mg before bed', why: b => `Your magnesium is ${b['Magnesium']?.value} — low.`, priority: 'MEDIUM', amazonSearch: 'Magnesium Glycinate 400mg', estimatedCost: 25 },
  { name: 'Methylcobalamin B12', condition: b => b['Vitamin B12']?.value < 300, dose: '1,000mcg sublingual daily', why: b => `Your B12 is ${b['Vitamin B12']?.value} — below optimal.`, priority: 'HIGH', amazonSearch: 'Methylcobalamin B12 1000mcg sublingual', estimatedCost: 20 },
  { name: 'Iron Bisglycinate', condition: b => b['Ferritin']?.value < 12 || b['Iron']?.value < 60, dose: '25-36mg with Vitamin C', why: () => `Your iron stores are low.`, priority: 'HIGH', amazonSearch: 'Iron Bisglycinate 25mg', estimatedCost: 25 },
  { name: 'Iodine + Selenium', condition: b => b['TSH']?.value > 4.0, dose: '150mcg Iodine + 200mcg Selenium', why: b => `Your TSH is ${b['TSH']?.value} — thyroid support needed.`, priority: 'MEDIUM', amazonSearch: 'Iodine Selenium thyroid support', estimatedCost: 30 },
];

export function generateSupplementRecommendations(biomarkers) {
  const recs = SUPPLEMENT_RULES
    .filter(r => { try { return r.condition(biomarkers); } catch { return false; } })
    .map(r => ({ name: r.name, dose: r.dose, why: r.why(biomarkers), priority: r.priority, amazonSearch: r.amazonSearch, estimatedMonthlyCost: r.estimatedCost }));

  recs.sort((a, b) => ({ HIGH: 0, MEDIUM: 1 }[a.priority] - ({ HIGH: 0, MEDIUM: 1 }[b.priority])));

  return {
    recommendations:    recs,
    totalMonthlyCost:   recs.reduce((s, r) => s + r.estimatedMonthlyCost, 0),
    recommendationCount: recs.length,
  };
}
