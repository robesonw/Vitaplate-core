import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getCached, setCached, deleteCached, CACHE_TTL } from '../lib/redis.js';
import {
  generateMealPlan,
  buildProfileHash,
  checkAndDecrementCredits,
  generateGroceryList,
  swapMeal,
} from '../services/ai.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/meal-plans — list user's plans
router.get('/', requireAuth, async (req, res) => {
  try {
    const plans = await prisma.mealPlan.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meal-plans/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const plan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meal-plans/generate — main AI generation with cache-first strategy
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { preferences, biomarkers, labSummary, name } = req.body;

    // 1. Build profile hash
    const profileHash = buildProfileHash(preferences, biomarkers);

    // 2. Check if there's a cached plan for this exact profile hash
    const cachedPlan = await getCached(`mealplan:user:${req.userId}:${profileHash}`);
    if (cachedPlan) {
      return res.json({ ...cachedPlan, source: 'cache', message: 'Loaded from your saved plan' });
    }

    // 3. Check AI credits before generating
    const creditCheck = await checkAndDecrementCredits(req.userId);
    if (!creditCheck.allowed) {
      // Still try to serve from template even if out of credits
      const template = await getCached(`template:${profileHash}`);
      if (template) {
        return res.json({ ...template, source: 'template', message: 'Served from our curated plan library' });
      }
      return res.status(402).json({
        error:   creditCheck.reason,
        used:    creditCheck.used,
        limit:   creditCheck.limit,
        plan:    creditCheck.plan,
        upgrade: '/Pricing',
      });
    }

    // 4. Generate (checks template DB + Redis before calling AI)
    const generated = await generateMealPlan({ preferences, biomarkers, labSummary });

    // 5. Save to DB
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId:       req.userId,
        name:         name || generated.name || 'My Meal Plan',
        dietType:     preferences?.dietType ?? 'custom',
        culturalStyle:preferences?.culturalStyle,
        lifeStage:    preferences?.lifeStage ?? 'general',
        days:         generated.days ?? [],
        preferences:  preferences ?? {},
        macros:       generated.macros ?? {},
        estimatedCost:generated.estimated_cost,
        groceryList:  generated.grocery_list,
        profileHash,
        fromTemplate: generated.fromTemplate ?? false,
      },
    });

    // 6. Cache user's plan
    await setCached(`mealplan:user:${req.userId}:${profileHash}`, mealPlan);

    res.json({
      ...mealPlan,
      source:      generated.fromCache    ? 'cache'    :
                   generated.fromTemplate ? 'template' : 'ai',
      creditsUsed: creditCheck.used,
      creditsLeft: creditCheck.limit - creditCheck.used,
    });
  } catch (err) {
    console.error('Meal plan generation error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'AI returned invalid response. Please try again.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meal-plans/:id/swap-meal — swap a single meal (Haiku, no credit cost)
router.post('/:id/swap-meal', requireAuth, async (req, res) => {
  try {
    const { mealToReplace, dayIndex, mealType, biomarkers } = req.body;
    const plan = await prisma.mealPlan.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const prefs = plan.preferences;
    const newMeal = await swapMeal({ mealToReplace, dayContext: plan.days[dayIndex], userPrefs: prefs, biomarkers });

    // Update the plan with the swapped meal
    const days = [...plan.days];
    if (days[dayIndex]) days[dayIndex][mealType] = newMeal;

    const updated = await prisma.mealPlan.update({
      where: { id: plan.id },
      data:  { days },
    });

    // Bust cache for this plan
    await deleteCached(`mealplan:user:${req.userId}:${plan.profileHash}`);

    res.json({ meal: newMeal, plan: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meal-plans/:id/grocery-list — generate/refresh grocery list
router.post('/:id/grocery-list', requireAuth, async (req, res) => {
  try {
    const plan = await prisma.mealPlan.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const cacheKey = `grocery:${plan.id}`;
    const cached   = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const groceryList = await generateGroceryList(plan);

    await prisma.mealPlan.update({ where: { id: plan.id }, data: { groceryList } });
    await setCached(cacheKey, groceryList, CACHE_TTL.MEAL_PLAN);

    // Also save as a GroceryList entity
    await prisma.groceryList.create({
      data: {
        userId:    req.userId,
        mealPlanId: plan.id,
        name:      `Grocery list for ${plan.name}`,
        items:     groceryList,
      },
    });

    res.json(groceryList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meal-plans/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const plan = await prisma.mealPlan.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    await prisma.mealPlan.delete({ where: { id: plan.id } });
    await deleteCached(`mealplan:user:${req.userId}:${plan.profileHash}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
