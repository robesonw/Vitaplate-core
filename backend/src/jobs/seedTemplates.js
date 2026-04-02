/**
 * VitaPlate Template Seeder
 * 
 * Generates ~50 base meal plan templates covering the most common biomarker/condition combos.
 * Run once after deployment: npm run seed:templates
 * 
 * Cost estimate: ~$5-10 in Anthropic API usage
 * Benefit:       Serves majority of users with $0 AI cost forever after
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The most common condition/biomarker combos seen in VitaPlate's target market
const SEED_PROFILES = [
  // ── Diabetes profiles ─────────────────────────────────────────────────────
  { label: 'Prediabetes + High LDL',          conditions: { diabetesType: 'pre_diabetes', heartCondition: 'high_cholesterol' }, biomarkers: { Glucose: { value: 110, status: 'high' }, 'LDL Cholesterol': { value: 145, status: 'high' } }, dietType: 'low-sugar', goal: 'blood_sugar_control' },
  { label: 'Type 2 Diabetes + Overweight',     conditions: { diabetesType: 'type2' }, biomarkers: { Glucose: { value: 160, status: 'high' }, HbA1c: { value: 7.2, status: 'high' } }, dietType: 'low-sugar', goal: 'blood_sugar_control' },
  { label: 'Prediabetes + General Wellness',   conditions: { diabetesType: 'pre_diabetes' }, biomarkers: { Glucose: { value: 105, status: 'high' } }, dietType: 'low-sugar', goal: 'weight_loss' },

  // ── Heart health profiles ─────────────────────────────────────────────────
  { label: 'High LDL + High Triglycerides',    conditions: { heartCondition: 'high_cholesterol' }, biomarkers: { 'LDL Cholesterol': { value: 160, status: 'high' }, Triglycerides: { value: 220, status: 'high' } }, dietType: 'liver-centric', goal: 'heart_health' },
  { label: 'Hypertension',                     conditions: { heartCondition: 'hypertension' }, biomarkers: { Sodium: { value: 145, status: 'high' } }, dietType: 'liver-centric', goal: 'heart_health' },
  { label: 'High CRP + Inflammation',          conditions: {}, biomarkers: { CRP: { value: 4.5, status: 'high' } }, dietType: 'liver-centric', goal: 'anti_inflammatory' },

  // ── Vitamin deficiency profiles ───────────────────────────────────────────
  { label: 'Low Vitamin D',                    conditions: {}, biomarkers: { 'Vitamin D': { value: 15, status: 'low' } }, dietType: 'custom', goal: 'immune_support' },
  { label: 'Low B12 + Low Iron',               conditions: {}, biomarkers: { 'Vitamin B12': { value: 200, status: 'low' }, Iron: { value: 50, status: 'low' } }, dietType: 'custom', goal: 'energy_boost' },
  { label: 'Low Vitamin D + High CRP',         conditions: {}, biomarkers: { 'Vitamin D': { value: 18, status: 'low' }, CRP: { value: 3.2, status: 'high' } }, dietType: 'custom', goal: 'anti_inflammatory' },

  // ── Kidney health ─────────────────────────────────────────────────────────
  { label: 'Early Kidney Disease (Stage 2)',   conditions: { kidneyStage: 'stage_2' }, biomarkers: { eGFR: { value: 72, status: 'low' }, Creatinine: { value: 1.4, status: 'high' } }, dietType: 'custom', goal: 'kidney_health' },
  { label: 'CKD Stage 3',                      conditions: { kidneyStage: 'stage_3' }, biomarkers: { eGFR: { value: 45, status: 'low' }, Potassium: { value: 5.2, status: 'high' } }, dietType: 'custom', goal: 'kidney_health' },

  // ── Thyroid profiles ──────────────────────────────────────────────────────
  { label: 'Hypothyroidism (High TSH)',         conditions: { thyroidCondition: 'hypothyroid' }, biomarkers: { TSH: { value: 6.5, status: 'high' } }, dietType: 'custom', goal: 'energy_boost' },
  { label: 'Hashimotos Thyroiditis',            conditions: { thyroidCondition: 'hashimotos' }, biomarkers: { TSH: { value: 5.8, status: 'high' } }, dietType: 'custom', goal: 'anti_inflammatory' },

  // ── General wellness ──────────────────────────────────────────────────────
  { label: 'General Wellness - Mediterranean', conditions: {}, biomarkers: {}, dietType: 'custom', culturalStyle: 'mediterranean', goal: 'general_wellness' },
  { label: 'General Wellness - Asian',         conditions: {}, biomarkers: {}, dietType: 'custom', culturalStyle: 'asian', goal: 'general_wellness' },
  { label: 'General Wellness - Vegetarian',    conditions: {}, biomarkers: {}, dietType: 'vegetarian', goal: 'general_wellness' },
  { label: 'Weight Loss - Low Sugar',          conditions: {}, biomarkers: {}, dietType: 'low-sugar', goal: 'weight_loss' },
  { label: 'Muscle Gain - High Protein',       conditions: {}, biomarkers: {}, dietType: 'custom', goal: 'muscle_gain' },
  { label: 'Anti-Inflammatory Baseline',       conditions: {}, biomarkers: { CRP: { value: 2.0, status: 'high' } }, dietType: 'custom', goal: 'anti_inflammatory' },

  // ── Combined conditions ───────────────────────────────────────────────────
  { label: 'Diabetic + Kidney Stage 2',        conditions: { diabetesType: 'type2', kidneyStage: 'stage_2' }, biomarkers: { Glucose: { value: 145, status: 'high' }, eGFR: { value: 68, status: 'low' } }, dietType: 'low-sugar', goal: 'blood_sugar_control' },
  { label: 'Heart + Inflammation',             conditions: { heartCondition: 'high_cholesterol' }, biomarkers: { 'LDL Cholesterol': { value: 150, status: 'high' }, CRP: { value: 3.0, status: 'high' } }, dietType: 'liver-centric', goal: 'heart_health' },
];

const SYSTEM_PROMPT = `You are VitaPlate's clinical nutrition AI. Generate personalized 7-day meal plans.
Respond ONLY with valid JSON — no prose, no markdown, no explanation.
Every meal must include: name, calories(string), protein(number,g), carbs(number,g), fat(number,g), nutrients(string), prepTip(string), prepSteps(array of strings), prepTime(string), difficulty(easy|medium|hard), equipment(array), healthBenefit(string)`;

function buildHash(profile) {
  const key = JSON.stringify({
    goal:    profile.goal,
    diet:    profile.dietType,
    culture: profile.culturalStyle || 'none',
    conditions: profile.conditions,
    markers: Object.entries(profile.biomarkers || {}).reduce((acc, [k, v]) => {
      acc[k] = v?.status || 'normal';
      return acc;
    }, {}),
  });
  return crypto.createHash('md5').update(key).digest('hex');
}

function buildPrompt(profile) {
  const abnormal = Object.entries(profile.biomarkers || {})
    .filter(([, v]) => v.status !== 'normal')
    .map(([k, v]) => `${k}: ${v.value} (${v.status})`)
    .join(', ');

  const conditions = Object.entries(profile.conditions || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return `Generate a 7-day meal plan for:
- Health goal: ${profile.goal}
- Diet type: ${profile.dietType}
- Cultural style: ${profile.culturalStyle || 'any'}
- Conditions: ${conditions || 'none'}
- Abnormal biomarkers to address: ${abnormal || 'none (general wellness)'}
- Budget: $100/week, skill: intermediate, 1 person

Return JSON:
{
  "name": "...",
  "days": [{ "day": "Monday", "breakfast": {meal object}, "lunch": {meal object}, "dinner": {meal object}, "snacks": {meal object} }, ...7 days],
  "macros": { "protein": 0, "carbs": 0, "fat": 0 },
  "estimated_cost": 0,
  "grocery_list": {}
}`;
}

async function seedTemplates() {
  console.log(`\n🌱 VitaPlate Template Seeder`);
  console.log(`📋 Generating ${SEED_PROFILES.length} templates...\n`);

  let generated = 0;
  let skipped   = 0;
  let failed    = 0;

  for (const profile of SEED_PROFILES) {
    const hash = buildHash(profile);

    // Skip if already exists
    const existing = await prisma.mealPlanTemplate.findUnique({ where: { profileHash: hash } });
    if (existing) {
      console.log(`⏭️  Skipping "${profile.label}" (already exists)`);
      skipped++;
      continue;
    }

    try {
      console.log(`🤖 Generating: "${profile.label}"...`);
      const response = await anthropic.messages.create({
        model:      'claude-sonnet-4-5',
        max_tokens: 4096,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: buildPrompt(profile) }],
      });

      const plan = JSON.parse(response.content[0].text);

      await prisma.mealPlanTemplate.create({
        data: {
          profileHash:     hash,
          conditions:      Object.values(profile.conditions || {}).filter(Boolean),
          biomarkerBuckets: Object.entries(profile.biomarkers || {}).reduce((acc, [k, v]) => { acc[k] = v.status; return acc; }, {}),
          dietType:        profile.dietType,
          plan,
          useCount:        0,
          reviewedByRd:    false,
        },
      });

      console.log(`   ✅ "${profile.label}" — ${plan.days?.length} days generated`);
      generated++;

      // Polite delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`   ❌ Failed "${profile.label}": ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Seeding complete:`);
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ⏭️  Skipped:   ${skipped}`);
  console.log(`   ❌ Failed:    ${failed}`);
  console.log(`\n💡 These templates will be served to users with matching profiles — $0 AI cost per match.\n`);

  await prisma.$disconnect();
}

seedTemplates().catch(console.error);
