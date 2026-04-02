import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { chatWithNova } from '../services/ai.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const FREE_MESSAGE_LIMIT = 3;

// GET /api/coach/messages — load conversation history
router.get('/messages', requireAuth, async (req, res) => {
  try {
    const messages = await prisma.coachMessage.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'asc' },
      take:    50, // last 50 messages
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/chat — send a message to Nova
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    // Check free message limit
    const settings = req.user.settings;
    const isPaid   = ['pro', 'premium'].includes(settings?.subscriptionPlan);

    if (!isPaid) {
      const messageCount = await prisma.coachMessage.count({
        where: { userId: req.userId, role: 'user' },
      });
      if (messageCount >= FREE_MESSAGE_LIMIT) {
        return res.status(402).json({
          error:   `You've used your ${FREE_MESSAGE_LIMIT} free messages. Upgrade to Pro for unlimited coaching.`,
          paywall: true,
          upgrade: '/Pricing',
        });
      }
    }

    // Save user message
    await prisma.coachMessage.create({
      data: { userId: req.userId, role: 'user', message },
    });

    // Build context for Nova
    const [preferences, labResults, recentPlan] = await Promise.all([
      prisma.userPreferences.findUnique({ where: { userId: req.userId } }),
      prisma.labResult.findMany({ where: { userId: req.userId }, orderBy: { createdDate: 'desc' }, take: 1 }),
      prisma.mealPlan.findFirst({ where: { userId: req.userId }, orderBy: { createdDate: 'desc' } }),
    ]);

    const userContext = {
      name:        req.user.fullName,
      healthGoal:  preferences?.healthGoal,
      conditions:  { diabetes: preferences?.diabetesType, heart: preferences?.heartCondition, kidney: preferences?.kidneyStage, thyroid: preferences?.thyroidCondition },
      latestLabs:  labResults[0]?.biomarkers ?? {},
      currentPlan: recentPlan?.name,
      macros:      recentPlan?.macros,
    };

    // Get last 10 messages for context
    const history = await prisma.coachMessage.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'asc' },
      take:    10,
    });

    const response = await chatWithNova({
      messages:    [...history, { role: 'user', message }],
      userContext,
    });

    // Save Nova's response
    const saved = await prisma.coachMessage.create({
      data: {
        userId:    req.userId,
        role:      'assistant',
        message:   response.message,
        tokensUsed: response.tokensUsed,
      },
    });

    res.json({ message: saved, tokensUsed: response.tokensUsed });
  } catch (err) {
    console.error('Coach chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coach/messages — clear conversation
router.delete('/messages', requireAuth, async (req, res) => {
  try {
    await prisma.coachMessage.deleteMany({ where: { userId: req.userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
