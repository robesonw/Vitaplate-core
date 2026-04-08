import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { checkAndAwardBadges } from '../services/gamification.js';

const router = Router();

// GET /api/progress — list progress entries
router.get('/', requireAuth, async (req, res) => {
  try {
    const entries = await prisma.progressEntry.findMany({
      where:   { userId: req.userId },
      orderBy: { logDate: 'desc' },
      take:    90,
    });
    res.json(entries);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/progress — log a progress entry
router.post('/', requireAuth, async (req, res) => {
  try {
    const entry = await prisma.progressEntry.create({
      data: {
        userId:  req.userId,
        logDate: req.body.logDate || new Date().toISOString().split('T')[0],
        ...req.body,
      },
    });
    // Weight log separate table for cleaner trend analysis
    if (req.body.weight) {
      await prisma.weightLog.upsert({
        where:  { userId_logDate: { userId: req.userId, logDate: entry.logDate } },
        create: { userId: req.userId, weight: req.body.weight, logDate: entry.logDate, notes: req.body.notes },
        update: { weight: req.body.weight },
      }).catch(() => {}); // Ignore if unique constraint doesn't exist
    }
    // Check for new badges
    checkAndAwardBadges(req.userId).catch(() => {});
    res.status(201).json(entry);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/progress/trends — weight + metric trends with lab correlation
router.get('/trends', requireAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const since = new Date(Date.now() - days * 86400000);

    const [entries, labResults] = await Promise.all([
      prisma.progressEntry.findMany({
        where:   { userId: req.userId, createdDate: { gte: since } },
        orderBy: { logDate: 'asc' },
      }),
      prisma.labResult.findMany({
        where:   { userId: req.userId },
        orderBy: { uploadDate: 'desc' },
        take:    5,
      }),
    ]);

    if (entries.length === 0) {
      return res.json({ hasData: false, message: 'Log progress entries to see trends' });
    }

    // Weight trend
    const weightData = entries.filter(e => e.weight).map(e => ({
      date:   e.logDate,
      weight: e.weight,
    }));

    const firstWeight = weightData[0]?.weight;
    const lastWeight  = weightData[weightData.length - 1]?.weight;
    const weightDelta = firstWeight && lastWeight ? parseFloat((lastWeight - firstWeight).toFixed(1)) : null;

    // Energy & mood averages
    const energyData = entries.filter(e => e.energy).map(e => ({ date: e.logDate, energy: e.energy }));
    const moodData   = entries.filter(e => e.mood).map(e => ({ date: e.logDate, mood: e.mood }));

    const avgEnergy = energyData.length ? energyData.reduce((s, e) => s + e.energy, 0) / energyData.length : null;
    const avgMood   = moodData.length   ? moodData.reduce((s, e) => s + e.mood, 0) / moodData.length : null;

    // Milestone detection
    const milestones = [];
    if (weightDelta && Math.abs(weightDelta) >= 2) {
      milestones.push({
        type:    weightDelta < 0 ? 'weight_loss' : 'weight_gain',
        value:   Math.abs(weightDelta),
        unit:    'kg',
        message: weightDelta < 0
          ? `🎉 Lost ${Math.abs(weightDelta)}kg over the last ${days} days!`
          : `📈 Gained ${weightDelta}kg over the last ${days} days`,
      });
    }
    if (entries.length >= 30) milestones.push({ type: 'consistency', message: '🔥 30+ days of progress tracking!' });
    if (entries.length >= 7)  milestones.push({ type: 'week', message: '⭐ 7-day tracking streak!' });

    // Lab correlation — show biomarker changes alongside weight trend
    const labCorrelation = labResults.length >= 2
      ? Object.entries(labResults[0].biomarkers || {})
          .filter(([name]) => ['LDL Cholesterol', 'Glucose', 'HbA1c', 'Triglycerides', 'CRP'].includes(name))
          .map(([name, latest]) => {
            const prev = labResults[1].biomarkers?.[name];
            if (!prev) return null;
            const delta = latest.value - prev.value;
            return { name, current: latest.value, previous: prev.value, unit: latest.unit, delta: parseFloat(delta.toFixed(1)) };
          })
          .filter(Boolean)
      : [];

    res.json({
      hasData:        true,
      days,
      entryCount:     entries.length,
      weight:         { data: weightData, delta: weightDelta, first: firstWeight, last: lastWeight },
      energy:         { data: energyData, average: avgEnergy ? parseFloat(avgEnergy.toFixed(1)) : null },
      mood:           { data: moodData, average: avgMood ? parseFloat(avgMood.toFixed(1)) : null },
      milestones,
      labCorrelation,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/progress/stats — summary stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [total, thisWeek, latestEntry, earliestEntry] = await Promise.all([
      prisma.progressEntry.count({ where: { userId: req.userId } }),
      prisma.progressEntry.count({
        where: { userId: req.userId, createdDate: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
      prisma.progressEntry.findFirst({ where: { userId: req.userId }, orderBy: { logDate: 'desc' } }),
      prisma.progressEntry.findFirst({ where: { userId: req.userId }, orderBy: { logDate: 'asc' } }),
    ]);

    const weightEntries = await prisma.progressEntry.findMany({
      where:   { userId: req.userId, weight: { not: null } },
      orderBy: { logDate: 'desc' },
      take:    2,
      select:  { weight: true, logDate: true },
    });

    res.json({
      totalEntries: total,
      thisWeek,
      daysTracked:  earliestEntry ? Math.ceil((Date.now() - new Date(earliestEntry.logDate)) / 86400000) : 0,
      latestEntry,
      weightChange: weightEntries.length === 2
        ? parseFloat((weightEntries[0].weight - weightEntries[weightEntries.length - 1].weight).toFixed(1))
        : null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add unique constraint to weight log for upsert (via migration note)
// Prisma model needs: @@unique([userId, logDate])

export default router;
