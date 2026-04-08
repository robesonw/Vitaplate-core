import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import {
  checkAndAwardBadges,
  useStreakFreeze,
  getLeaderboard,
  calculateHealthScore,
  BADGES,
} from '../services/gamification.js';

const router = Router();

// GET /api/gamification/profile — full gamification profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const [streak, badges, healthScore] = await Promise.all([
      prisma.userStreak.findUnique({ where: { userId: req.userId } }),
      prisma.userBadge.findMany({
        where:   { userId: req.userId },
        orderBy: { earnedAt: 'desc' },
      }),
      calculateHealthScore(req.userId),
    ]);

    // Check and award any newly earned badges
    await checkAndAwardBadges(req.userId);

    const earnedBadgeIds = new Set(badges.map(b => b.badgeId));
    const allBadges = Object.entries(BADGES).map(([id, def]) => ({
      id,
      ...def,
      earned:   earnedBadgeIds.has(id),
      earnedAt: badges.find(b => b.badgeId === id)?.earnedAt || null,
    }));

    const thisMonth = new Date().toISOString().slice(0, 7);
    const lastFreezeMonth = streak?.lastFreezeUsed?.toISOString().slice(0, 7);
    const freezeAvailable = lastFreezeMonth !== thisMonth;

    res.json({
      streak: {
        current:       streak?.currentStreak || 0,
        longest:       streak?.longestStreak || 0,
        lastCheckIn:   streak?.lastCheckIn,
        points:        streak?.totalPoints || 0,
        freezeAvailable,
        lastFreezeUsed: streak?.lastFreezeUsed,
      },
      healthScore,
      badges:       allBadges,
      earnedCount:  badges.length,
      totalBadges:  Object.keys(BADGES).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gamification/check-badges — trigger badge check manually
router.post('/check-badges', requireAuth, async (req, res) => {
  try {
    const newBadges = await checkAndAwardBadges(req.userId);
    res.json({ newBadges: newBadges.filter(Boolean), count: newBadges.filter(Boolean).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gamification/freeze — use streak freeze
router.post('/freeze', requireAuth, async (req, res) => {
  try {
    const result = await useStreakFreeze(req.userId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gamification/leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const leaders = await getLeaderboard(limit);

    // Find current user's rank
    const userStreak = await prisma.userStreak.findUnique({ where: { userId: req.userId } });
    const userPoints = userStreak?.totalPoints || 0;
    const userRank = await prisma.userStreak.count({
      where: { totalPoints: { gt: userPoints } },
    });

    res.json({
      leaders,
      currentUser: {
        rank:    userRank + 1,
        points:  userPoints,
        streak:  userStreak?.currentStreak || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gamification/health-score
router.get('/health-score', requireAuth, async (req, res) => {
  try {
    const score = await calculateHealthScore(req.userId);
    res.json({ score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
