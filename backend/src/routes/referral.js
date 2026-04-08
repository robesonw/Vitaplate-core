import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { awardBadge } from '../services/gamification.js';
import crypto from 'crypto';

const router = Router();

// Generate a unique referral code for a user
function generateCode(email) {
  return crypto.createHash('md5').update(email + Date.now()).digest('hex').slice(0, 8).toUpperCase();
}

// GET /api/referral/my-code — get or create user's referral code
router.get('/my-code', requireAuth, async (req, res) => {
  try {
    let settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });

    // Generate code if doesn't exist
    if (!settings?.affiliateCode) {
      const code = generateCode(req.user.email);
      settings = await prisma.userSettings.upsert({
        where:  { userId: req.userId },
        create: { userId: req.userId, affiliateCode: code },
        update: { affiliateCode: code },
      });
    }

    // Count referrals
    const referralCount = await prisma.userSettings.count({
      where: { referredBy: req.userId },
    });
    const convertedCount = await prisma.userSettings.count({
      where: {
        referredBy:         req.userId,
        subscriptionStatus: { in: ['active', 'trialing'] },
      },
    });

    const referralUrl = `${process.env.FRONTEND_URL || 'https://www.vitaplate.ai'}/refer/${settings.affiliateCode}`;

    res.json({
      code:           settings.affiliateCode,
      url:            referralUrl,
      referralCount,
      convertedCount,
      rewardPerReferral: '1 free month of Pro',
      totalRewards:   `${convertedCount} free month${convertedCount !== 1 ? 's' : ''} earned`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referral/apply — apply a referral code during signup
router.post('/apply', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Referral code required' });

    // Check user hasn't already applied a code
    const mySettings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    if (mySettings?.referredBy) {
      return res.status(400).json({ error: 'You have already applied a referral code' });
    }

    // Find the referrer
    const referrerSettings = await prisma.userSettings.findFirst({
      where:   { affiliateCode: code.toUpperCase() },
      include: { user: true },
    });

    if (!referrerSettings) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    if (referrerSettings.userId === req.userId) {
      return res.status(400).json({ error: "You can't use your own referral code" });
    }

    // Apply code to new user
    await prisma.userSettings.upsert({
      where:  { userId: req.userId },
      create: { userId: req.userId, referredBy: referrerSettings.userId },
      update: { referredBy: referrerSettings.userId },
    });

    // Check if referrer has hit a reward milestone
    const totalReferrals = await prisma.userSettings.count({
      where: { referredBy: referrerSettings.userId },
    });

    // Every 3 referrals = 1 free month (extend subscription or add credit)
    if (totalReferrals % 3 === 0) {
      await processReferralReward(referrerSettings.userId, totalReferrals);
    }

    // Check referral badge
    if (totalReferrals >= 3) {
      await awardBadge(referrerSettings.userId, 'referral_pro');
    }

    res.json({
      success:      true,
      message:      'Referral code applied! Your friend will be notified.',
      referredBy:   referrerSettings.user.fullName || 'a friend',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function processReferralReward(referrerId, totalReferrals) {
  try {
    // Extend subscription by 1 month or give AI credits
    const settings = await prisma.userSettings.findUnique({ where: { userId: referrerId } });

    if (settings?.subscriptionStatus === 'active' || settings?.subscriptionStatus === 'trialing') {
      // Give bonus AI credits (30 extra = ~1 month's worth)
      await prisma.userSettings.update({
        where: { userId: referrerId },
        data:  { aiCreditsLimit: { increment: 3 } },
      });
    }

    // Notify referrer
    await prisma.notification.create({
      data: {
        userId:    referrerId,
        type:      'referral_reward',
        title:     '🎉 Referral Reward Unlocked!',
        message:   `You've referred ${totalReferrals} friends! You earned a bonus reward — 3 extra AI plan generations added to your account.`,
        actionUrl: '/ReferFriend',
        read:      false,
      },
    });
  } catch (err) {
    console.error('Referral reward error:', err.message);
  }
}

// GET /api/referral/stats — referral dashboard stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });

    const [referrals, converted] = await Promise.all([
      prisma.userSettings.findMany({
        where:   { referredBy: req.userId },
        include: { user: { select: { fullName: true, email: true, createdDate: true } } },
        orderBy: { user: { createdDate: 'desc' } },
      }),
      prisma.userSettings.count({
        where: { referredBy: req.userId, subscriptionStatus: { in: ['active', 'trialing'] } },
      }),
    ]);

    res.json({
      code:          settings?.affiliateCode,
      url:           `${process.env.FRONTEND_URL}/refer/${settings?.affiliateCode}`,
      total:         referrals.length,
      converted,
      conversionRate: referrals.length > 0 ? Math.round((converted / referrals.length) * 100) : 0,
      rewardsEarned: Math.floor(referrals.length / 3),
      nextRewardAt:  3 - (referrals.length % 3),
      referrals:     referrals.map(r => ({
        name:      r.user.fullName || r.user.email?.split('@')[0],
        joinedAt:  r.user.createdDate,
        converted: ['active', 'trialing'].includes(r.subscriptionStatus),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
