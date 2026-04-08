import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { safeEmail } from '../services/email.js';
import { Resend } from 'resend';

const router  = Router();
const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.FRONTEND_URL || 'https://www.vitaplate.ai';

// Middleware — ensure user has practitioner role or premium subscription
async function requirePractitioner(req, res, next) {
  const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
  const isPractitioner = req.user.role === 'admin' ||
    settings?.subscriptionPlan === 'premium' ||
    settings?.isPractitioner === true;

  if (!isPractitioner) {
    return res.status(403).json({
      error:   'Practitioner access required',
      upgrade: '/PractitionerPricing',
    });
  }
  next();
}

// ── GET /api/practitioner/clients ─────────────────────────────────────────────
router.get('/clients', requireAuth, requirePractitioner, async (req, res) => {
  try {
    // Get all users referred by this practitioner
    const clients = await prisma.userSettings.findMany({
      where:   { referredBy: req.userId },
      include: {
        user: {
          include: {
            preferences:  true,
            labResults:   { orderBy: { uploadDate: 'desc' }, take: 1 },
            mealPlans:    { orderBy: { createdDate: 'desc' }, take: 1 },
            streaks:      true,
          },
        },
      },
    });

    const formatted = clients.map(c => ({
      id:              c.user.id,
      name:            c.user.fullName || c.user.email?.split('@')[0],
      email:           c.user.email,
      joinedAt:        c.user.createdDate,
      subscription:    c.subscriptionPlan,
      healthGoal:      c.user.preferences?.healthGoal,
      conditions:      {
        diabetes: c.user.preferences?.diabetesType,
        heart:    c.user.preferences?.heartCondition,
        kidney:   c.user.preferences?.kidneyStage,
        thyroid:  c.user.preferences?.thyroidCondition,
      },
      latestLab:       c.user.labResults[0]?.uploadDate || null,
      biomarkerCount:  c.user.labResults[0] ? Object.keys(c.user.labResults[0].biomarkers || {}).length : 0,
      abnormalCount:   c.user.labResults[0]
        ? Object.values(c.user.labResults[0].biomarkers || {}).filter(v => v.status !== 'normal').length
        : 0,
      currentPlan:     c.user.mealPlans[0]?.name || null,
      streak:          c.user.streaks?.currentStreak || 0,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/practitioner/clients/:clientId ───────────────────────────────────
router.get('/clients/:clientId', requireAuth, requirePractitioner, async (req, res) => {
  try {
    const client = await prisma.user.findUnique({
      where:   { id: req.params.clientId },
      include: {
        preferences:    true,
        settings:       true,
        labResults:     { orderBy: { uploadDate: 'desc' }, take: 5 },
        mealPlans:      { orderBy: { createdDate: 'desc' }, take: 3 },
        progressEntries:{ orderBy: { createdDate: 'desc' }, take: 30 },
        streaks:        true,
        badges:         { orderBy: { earnedAt: 'desc' } },
      },
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Verify this practitioner has access
    const clientSettings = await prisma.userSettings.findUnique({ where: { userId: client.id } });
    if (clientSettings?.referredBy !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/practitioner/invite ─────────────────────────────────────────────
router.post('/invite', requireAuth, requirePractitioner, async (req, res) => {
  try {
    const { email, name, message } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    const referralCode = settings?.affiliateCode || req.userId.slice(0, 8).toUpperCase();
    const inviteUrl = `${APP_URL}/refer/${referralCode}`;

    // Send invitation email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from:    process.env.EMAIL_FROM || 'VitaPlate <support@vitaplate.ai>',
        to:      email,
        subject: `${req.user.fullName || 'Your nutritionist'} has invited you to VitaPlate`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
              <h1 style="color:#fff;margin:0;font-size:24px;">🥗 VitaPlate</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">AI-Powered Biomarker Nutrition</p>
            </div>
            <h2 style="color:#0f172a;">You've been invited!</h2>
            <p style="color:#475569;">${req.user.fullName || 'Your nutritionist'} has invited you to join VitaPlate — the only nutrition platform that builds your meal plan from your actual lab results.</p>
            ${message ? `<div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;color:#475569;font-style:italic;">"${message}"</div>` : ''}
            <p style="color:#475569;"><strong>What you'll get:</strong></p>
            <ul style="color:#475569;line-height:2;">
              <li>AI meal plans built around your biomarkers</li>
              <li>Lab result upload & trend tracking</li>
              <li>Direct messaging with ${req.user.fullName || 'your nutritionist'}</li>
              <li>Personalized supplement recommendations</li>
            </ul>
            <div style="text-align:center;margin:32px 0;">
              <a href="${inviteUrl}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
                Accept Invitation →
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;">Powered by VitaPlate · ${APP_URL}</p>
          </div>
        `,
      });
    }

    // Log the invitation
    await prisma.notification.create({
      data: {
        userId:    req.userId,
        type:      'client_invited',
        title:     `Client invitation sent`,
        message:   `Invitation sent to ${email}${name ? ` (${name})` : ''}`,
        actionUrl: '/MyClients',
        read:      false,
      },
    });

    res.json({ success: true, message: `Invitation sent to ${email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/practitioner/clients/:clientId/plan — push plan to client ───────
router.post('/clients/:clientId/plan', requireAuth, requirePractitioner, async (req, res) => {
  try {
    const { planName, planData, notes } = req.body;
    const clientId = req.params.clientId;

    // Verify access
    const clientSettings = await prisma.userSettings.findUnique({ where: { userId: clientId } });
    if (clientSettings?.referredBy !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create the meal plan for the client
    const plan = await prisma.mealPlan.create({
      data: {
        userId:   clientId,
        name:     planName || `Plan from ${req.user.fullName || 'your nutritionist'}`,
        dietType: planData?.dietType || 'custom',
        days:     planData?.days || [],
        preferences: { practitionerNote: notes, createdBy: req.user.email },
        macros:   planData?.macros || {},
      },
    });

    // Notify the client
    await prisma.notification.create({
      data: {
        userId:    clientId,
        type:      'plan_assigned',
        title:     `📋 New meal plan from your nutritionist`,
        message:   `${req.user.fullName || 'Your nutritionist'} has created a new meal plan for you: "${plan.name}"${notes ? `. Note: ${notes}` : ''}`,
        actionUrl: '/MealPlans',
        read:      false,
      },
    });

    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET/POST /api/practitioner/clients/:clientId/notes ────────────────────────
router.get('/clients/:clientId/notes', requireAuth, requirePractitioner, async (req, res) => {
  try {
    // Store notes as notifications with type 'practitioner_note'
    const notes = await prisma.notification.findMany({
      where:   { userId: req.params.clientId, type: 'practitioner_note' },
      orderBy: { createdDate: 'desc' },
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clients/:clientId/notes', requireAuth, requirePractitioner, async (req, res) => {
  try {
    const { note } = req.body;
    const saved = await prisma.notification.create({
      data: {
        userId:    req.params.clientId,
        type:      'practitioner_note',
        title:     `Note from ${req.user.fullName || 'your nutritionist'}`,
        message:   note,
        actionUrl: '/Dashboard',
        read:      false,
      },
    });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/practitioner/dashboard — practitioner overview ───────────────────
router.get('/dashboard', requireAuth, requirePractitioner, async (req, res) => {
  try {
    const clients = await prisma.userSettings.findMany({
      where: { referredBy: req.userId },
      include: { user: { include: { streaks: true, labResults: { take: 1, orderBy: { uploadDate: 'desc' } } } } },
    });

    const activeClients   = clients.filter(c => c.user.streaks?.currentStreak > 0).length;
    const clientsWithLabs = clients.filter(c => c.user.labResults.length > 0).length;
    const totalClients    = clients.length;

    res.json({
      totalClients,
      activeClients,
      clientsWithLabs,
      engagementRate: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
      recentActivity: clients
        .filter(c => c.user.streaks?.lastCheckIn)
        .sort((a, b) => (b.user.streaks?.lastCheckIn || '').localeCompare(a.user.streaks?.lastCheckIn || ''))
        .slice(0, 5)
        .map(c => ({
          name:       c.user.fullName || c.user.email?.split('@')[0],
          lastActive: c.user.streaks?.lastCheckIn,
          streak:     c.user.streaks?.currentStreak || 0,
        })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
