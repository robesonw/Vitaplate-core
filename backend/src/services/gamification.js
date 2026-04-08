import { prisma } from '../lib/prisma.js';
import { safeEmail } from './email.js';

// ─── Badge Definitions ────────────────────────────────────────────────────────
export const BADGES = {
  // Streak badges
  first_flame:     { name: 'First Flame',     emoji: '🔥', desc: '1-day check-in streak',       points: 50  },
  week_warrior:    { name: 'Week Warrior',     emoji: '⭐', desc: '7-day streak',                points: 150 },
  fortnight_focus: { name: 'Fortnight Focus',  emoji: '🎯', desc: '14-day streak',               points: 300 },
  diamond_habit:   { name: 'Diamond Habit',    emoji: '💎', desc: '30-day streak',               points: 750 },
  century_strong:  { name: 'Century Strong',   emoji: '🏆', desc: '100-day streak',              points: 2500 },
  // Lab badges
  lab_legend:      { name: 'Lab Legend',       emoji: '🧬', desc: 'Upload first lab results',    points: 200 },
  double_tested:   { name: 'Double Tested',    emoji: '🔬', desc: 'Upload 2+ lab results',       points: 300 },
  trend_tracker:   { name: 'Trend Tracker',    emoji: '📈', desc: 'Lab results show improvement',points: 500 },
  // Meal plan badges
  plan_pioneer:    { name: 'Plan Pioneer',     emoji: '🥗', desc: 'Generate first meal plan',    points: 100 },
  biomarker_eater: { name: 'Biomarker Eater',  emoji: '🎯', desc: 'Generate plan from lab data', points: 300 },
  plan_follower:   { name: 'Plan Follower',    emoji: '📅', desc: 'Log meals for 5 days straight',points: 200 },
  // Coach badges
  coach_pet:       { name: "Coach's Pet",      emoji: '💬', desc: 'Ask Nova 20 questions',       points: 150 },
  // Shopping badges
  smart_shopper:   { name: 'Smart Shopper',    emoji: '🛒', desc: 'Generate 4 grocery lists',    points: 100 },
  // Social badges
  referral_pro:    { name: 'Referral Pro',     emoji: '🤝', desc: 'Refer 3 friends',             points: 500 },
  // Health badges
  supplement_smart:{ name: 'Supplement Smart', emoji: '💊', desc: 'View supplement recs',         points: 50  },
  alert_aware:     { name: 'Alert Aware',      emoji: '🏥', desc: 'Acknowledge a health alert',   points: 75  },
};

// ─── Award a badge (idempotent - safe to call multiple times) ─────────────────
export async function awardBadge(userId, badgeId) {
  const badge = BADGES[badgeId];
  if (!badge) return null;

  // Check if already earned
  const existing = await prisma.userBadge.findFirst({
    where: { userId, badgeId },
  });
  if (existing) return null; // Already has it

  // Award the badge
  const awarded = await prisma.userBadge.create({
    data: {
      userId,
      badgeId,
      badgeName: badge.name,
      earnedAt:  new Date(),
    },
  });

  // Add points to streak record
  await prisma.userStreak.upsert({
    where:  { userId },
    create: { userId, totalPoints: badge.points },
    update: { totalPoints: { increment: badge.points } },
  });

  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type:      'badge_earned',
      title:     `${badge.emoji} Badge Unlocked: ${badge.name}`,
      message:   `You earned the "${badge.name}" badge — ${badge.desc}. +${badge.points} points!`,
      actionUrl: '/MyProgress',
      read:      false,
    },
  });

  return { badge, awarded };
}

// ─── Check and award all applicable badges for a user ────────────────────────
export async function checkAndAwardBadges(userId) {
  const newBadges = [];

  try {
    const [user, streak, labCount, planCount, coachCount, groceryCount, badgeCount, alertCount] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.userStreak.findUnique({ where: { userId } }),
        prisma.labResult.count({ where: { userId } }),
        prisma.mealPlan.count({ where: { userId } }),
        prisma.coachMessage.count({ where: { userId, role: 'user' } }),
        prisma.groceryList.count({ where: { userId } }),
        prisma.userBadge.count({ where: { userId } }),
        prisma.healthAlert.count({ where: { userId, acknowledged: true } }),
      ]);

    const currentStreak = streak?.currentStreak || 0;

    // Streak badges
    if (currentStreak >= 1)   newBadges.push(await awardBadge(userId, 'first_flame'));
    if (currentStreak >= 7)   newBadges.push(await awardBadge(userId, 'week_warrior'));
    if (currentStreak >= 14)  newBadges.push(await awardBadge(userId, 'fortnight_focus'));
    if (currentStreak >= 30)  newBadges.push(await awardBadge(userId, 'diamond_habit'));
    if (currentStreak >= 100) newBadges.push(await awardBadge(userId, 'century_strong'));

    // Lab badges
    if (labCount >= 1) newBadges.push(await awardBadge(userId, 'lab_legend'));
    if (labCount >= 2) newBadges.push(await awardBadge(userId, 'double_tested'));

    // Check for lab improvement
    if (labCount >= 2) {
      const labs = await prisma.labResult.findMany({
        where: { userId }, orderBy: { uploadDate: 'desc' }, take: 2,
      });
      if (labs.length === 2) {
        const improved = checkLabImprovement(labs[0].biomarkers, labs[1].biomarkers);
        if (improved) newBadges.push(await awardBadge(userId, 'trend_tracker'));
      }
    }

    // Meal plan badges
    if (planCount >= 1) newBadges.push(await awardBadge(userId, 'plan_pioneer'));
    const biomarkerPlan = await prisma.mealPlan.findFirst({
      where: { userId, fromTemplate: false, profileHash: { not: null } },
    });
    if (biomarkerPlan) newBadges.push(await awardBadge(userId, 'biomarker_eater'));

    // Coach badge
    if (coachCount >= 20) newBadges.push(await awardBadge(userId, 'coach_pet'));

    // Grocery badge
    if (groceryCount >= 4) newBadges.push(await awardBadge(userId, 'smart_shopper'));

    // Alert badge
    if (alertCount >= 1) newBadges.push(await awardBadge(userId, 'alert_aware'));

    // Supplement badge
    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    // Referral badge
    const referralCount = await prisma.user.count({
      where: { settings: { referredBy: userId } },
    });
    if (referralCount >= 3) newBadges.push(await awardBadge(userId, 'referral_pro'));

  } catch (err) {
    console.error('Badge check error:', err.message);
  }

  return newBadges.filter(Boolean);
}

// ─── Check if labs improved between two results ───────────────────────────────
function checkLabImprovement(latest, previous) {
  if (!latest || !previous) return false;
  const LOWER_IS_BETTER = new Set(['LDL Cholesterol', 'Triglycerides', 'Glucose', 'HbA1c', 'CRP', 'TSH']);
  let improvedCount = 0;

  for (const [marker, data] of Object.entries(latest)) {
    const prev = previous[marker];
    if (!prev || data.value == null || prev.value == null) continue;
    const delta = data.value - prev.value;
    if (LOWER_IS_BETTER.has(marker) ? delta < 0 : delta > 0) improvedCount++;
  }
  return improvedCount >= 2;
}

// ─── Streak Freeze (1 per month) ─────────────────────────────────────────────
export async function useStreakFreeze(userId) {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (!streak) return { success: false, error: 'No streak found' };

  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const lastFreezeMonth = streak.lastFreezeUsed?.toISOString().slice(0, 7);

  if (lastFreezeMonth === thisMonth) {
    return { success: false, error: 'Streak freeze already used this month' };
  }

  // Extend last check-in by 1 day to bridge the gap
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  await prisma.userStreak.update({
    where: { userId },
    data:  {
      lastCheckIn:    yesterday,
      lastFreezeUsed: new Date(),
      totalPoints:    { decrement: 10 }, // Small cost for using freeze
    },
  });

  return { success: true, message: `Streak freeze used! Your ${streak.currentStreak}-day streak is safe.` };
}

// ─── Get leaderboard ──────────────────────────────────────────────────────────
export async function getLeaderboard(limit = 10) {
  const leaders = await prisma.userStreak.findMany({
    where:   { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: 'desc' },
    take:    limit,
    include: {
      user: { select: { fullName: true, email: true } },
    },
  });

  return leaders.map((l, i) => ({
    rank:          i + 1,
    name:          l.user.fullName || l.user.email?.split('@')[0] || 'Anonymous',
    points:        l.totalPoints,
    streak:        l.currentStreak,
    longestStreak: l.longestStreak,
  }));
}

// ─── Calculate health score (0-100) ──────────────────────────────────────────
export async function calculateHealthScore(userId) {
  const [streak, labCount, planCount, checkIns, badges] = await Promise.all([
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.labResult.count({ where: { userId } }),
    prisma.mealPlan.count({ where: { userId } }),
    prisma.dailyCheckIn.count({
      where: { userId, createdDate: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
    prisma.userBadge.count({ where: { userId } }),
  ]);

  let score = 0;
  score += Math.min(30, (streak?.currentStreak || 0) * 2);  // Up to 30pts from streak
  score += Math.min(20, labCount * 10);                       // Up to 20pts from labs
  score += Math.min(20, planCount * 5);                       // Up to 20pts from plans
  score += Math.min(20, checkIns * 2);                        // Up to 20pts from check-ins
  score += Math.min(10, badges * 2);                          // Up to 10pts from badges

  return Math.min(100, Math.round(score));
}
