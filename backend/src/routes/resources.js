import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { generateSupplementRecommendations } from '../services/ai.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Lab Results ──────────────────────────────────────────────────────────────
export const labRouter = Router();

labRouter.get('/', requireAuth, async (req, res) => {
  try {
    const labs = await prisma.labResult.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
    });
    res.json(labs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

labRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { uploadDate, fileUrl, biomarkers, notes } = req.body;
    const lab = await prisma.labResult.create({
      data: { userId: req.userId, uploadDate: uploadDate || new Date().toISOString().split('T')[0], fileUrl, biomarkers: biomarkers || {}, notes },
    });
    res.status(201).json(lab);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

labRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const lab = await prisma.labResult.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!lab) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.labResult.update({ where: { id: lab.id }, data: req.body });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

labRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const lab = await prisma.labResult.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!lab) return res.status(404).json({ error: 'Not found' });
    await prisma.labResult.delete({ where: { id: lab.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Supplement recommendations from latest lab
labRouter.get('/supplements', requireAuth, async (req, res) => {
  try {
    const latest = await prisma.labResult.findFirst({ where: { userId: req.userId }, orderBy: { createdDate: 'desc' } });
    if (!latest) return res.status(404).json({ error: 'No lab results found' });
    const result = generateSupplementRecommendations(latest.biomarkers);
    res.json({ ...result, labDate: latest.uploadDate });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── User Profile & Preferences ───────────────────────────────────────────────
export const userRouter = Router();

userRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.userId },
      include: { preferences: true, settings: true, streaks: true },
    });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

userRouter.get('/preferences', requireAuth, async (req, res) => {
  try {
    const prefs = await prisma.userPreferences.findUnique({ where: { userId: req.userId } });
    res.json(prefs ?? {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// Only these fields exist in the UserPreferences schema
const VALID_PREF_FIELDS = new Set([
  'age','gender','height','weight','healthGoal','dietaryRestrictions',
  'foodsLiked','foodsAvoided','allergens','cuisinePreferences',
  'cookingTime','skillLevel','numPeople','weeklyBudget',
  'diabetesType','heartCondition','kidneyStage','thyroidCondition',
]);

function sanitizePrefs(body) {
  const clean = {};
  for (const [k, v] of Object.entries(body)) {
    if (VALID_PREF_FIELDS.has(k)) clean[k] = v;
  }
  return clean;
}

// POST /api/user/preferences — create or upsert
userRouter.post('/preferences', requireAuth, async (req, res) => {
  try {
    const data  = sanitizePrefs(req.body);
    const prefs = await prisma.userPreferences.upsert({
      where:  { userId: req.userId },
      create: { userId: req.userId, ...data },
      update: data,
    });
    res.status(201).json(prefs);
  } catch (err) { 
    console.error('Preferences POST error:', err.message);
    res.status(500).json({ error: err.message }); 
  }
});

userRouter.put('/preferences', requireAuth, async (req, res) => {
  try {
    const data  = sanitizePrefs(req.body);
    const prefs = await prisma.userPreferences.upsert({
      where:  { userId: req.userId },
      create: { userId: req.userId, ...data },
      update: data,
    });
    res.json(prefs);
  } catch (err) { 
    console.error('Preferences PUT error:', err.message);
    res.status(500).json({ error: err.message }); 
  }
});

userRouter.get('/settings', requireAuth, async (req, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    res.json(settings ?? {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

userRouter.put('/settings', requireAuth, async (req, res) => {
  try {
    // Don't allow clients to set subscription fields directly
    const { subscriptionPlan, subscriptionStatus, stripeCustomerId, stripeSubscriptionId, aiCreditsUsed, ...safe } = req.body;
    const settings = await prisma.userSettings.upsert({
      where:  { userId: req.userId },
      create: { userId: req.userId, ...safe },
      update: safe,
    });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// Complete onboarding
userRouter.post('/onboarding/complete', requireAuth, async (req, res) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where:  { userId: req.userId },
      create: { userId: req.userId, onboardingCompletedAt: new Date() },
      update: { onboardingCompletedAt: new Date(), onboardingStep: 'complete' },
    });
    res.json({ success: true, completedAt: settings.onboardingCompletedAt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update onboarding step
userRouter.post('/onboarding/step', requireAuth, async (req, res) => {
  try {
    const { step } = req.body;
    await prisma.userSettings.upsert({
      where:  { userId: req.userId },
      create: { userId: req.userId, onboardingStep: step },
      update: { onboardingStep: step },
    });
    res.json({ success: true, step });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─── Progress ─────────────────────────────────────────────────────────────────
export const progressRouter = Router();

progressRouter.get('/', requireAuth, async (req, res) => {
  try {
    const entries = await prisma.progressEntry.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
      take:    90,
    });
    res.json(entries);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

progressRouter.post('/', requireAuth, async (req, res) => {
  try {
    const entry = await prisma.progressEntry.create({
      data: { userId: req.userId, ...req.body, logDate: req.body.logDate || new Date().toISOString().split('T')[0] },
    });
    res.status(201).json(entry);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationRouter = Router();

notificationRouter.get('/', requireAuth, async (req, res) => {
  try {
    const notes = await prisma.notification.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
      take:    20,
    });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

notificationRouter.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const n = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!n) return res.status(404).json({ error: 'Not found' });
    await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

notificationRouter.put('/read-all', requireAuth, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Daily Check-ins ──────────────────────────────────────────────────────────
export const checkInRouter = Router();

checkInRouter.get('/', requireAuth, async (req, res) => {
  try {
    const checkIns = await prisma.dailyCheckIn.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
      take:    30,
    });
    res.json(checkIns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

checkInRouter.post('/', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await prisma.dailyCheckIn.findFirst({ where: { userId: req.userId, checkInDate: today } });

    let checkIn;
    if (existing) {
      checkIn = await prisma.dailyCheckIn.update({ where: { id: existing.id }, data: req.body });
    } else {
      checkIn = await prisma.dailyCheckIn.create({ data: { userId: req.userId, checkInDate: today, ...req.body } });
      // Update streak
      await updateStreak(req.userId);
    }
    res.json(checkIn);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function updateStreak(userId) {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  const today  = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (streak) {
    const continued = streak.lastCheckIn === yesterday;
    const newStreak = continued ? streak.currentStreak + 1 : 1;
    await prisma.userStreak.update({
      where: { userId },
      data:  {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastCheckIn:   today,
        totalPoints:   { increment: 10 },
      },
    });
  } else {
    await prisma.userStreak.create({ data: { userId, currentStreak: 1, longestStreak: 1, lastCheckIn: today, totalPoints: 10 } });
  }
}

// ─── Grocery Lists ────────────────────────────────────────────────────────────
export const groceryRouter = Router();

groceryRouter.get('/', requireAuth, async (req, res) => {
  try {
    const lists = await prisma.groceryList.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
    });
    res.json(lists);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

groceryRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const list = await prisma.groceryList.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!list) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.groceryList.update({ where: { id: list.id }, data: req.body });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Pantry ───────────────────────────────────────────────────────────────────
export const pantryRouter = Router();

pantryRouter.get('/', requireAuth, async (req, res) => {
  try {
    const items = await prisma.pantryItem.findMany({ where: { userId: req.userId }, orderBy: { name: 'asc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pantryRouter.post('/', requireAuth, async (req, res) => {
  try {
    const item = await prisma.pantryItem.create({ data: { userId: req.userId, ...req.body } });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pantryRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.pantryItem.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.pantryItem.update({ where: { id: item.id }, data: req.body });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pantryRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.pantryItem.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await prisma.pantryItem.delete({ where: { id: item.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─── Nutrition Logs ────────────────────────────────────────────────────────────
export const nutritionLogRouter = Router();

nutritionLogRouter.get('/', requireAuth, async (req, res) => {
  try {
    const logs = await prisma.nutritionLog.findMany({
      where: { userId: req.userId },
      orderBy: { logDate: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

nutritionLogRouter.post('/', requireAuth, async (req, res) => {
  try {
    const log = await prisma.nutritionLog.create({
      data: { userId: req.userId, logDate: req.body.logDate || new Date().toISOString().split('T')[0], ...req.body },
    });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

nutritionLogRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const log = await prisma.nutritionLog.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!log) return res.status(404).json({ error: 'Not found' });
    await prisma.nutritionLog.delete({ where: { id: log.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─── Health Alerts ────────────────────────────────────────────────────────────
export const alertRouter = Router();

alertRouter.get('/', requireAuth, async (req, res) => {
  try {
    const alerts = await prisma.healthAlert.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
      take:    10,
    });
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

alertRouter.put('/:id/acknowledge', requireAuth, async (req, res) => {
  try {
    const alert = await prisma.healthAlert.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!alert) return res.status(404).json({ error: 'Not found' });
    await prisma.healthAlert.update({ where: { id: alert.id }, data: { acknowledged: true } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
