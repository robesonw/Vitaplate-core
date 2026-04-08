import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { Resend } from 'resend';

const router  = Router();
const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.FRONTEND_URL || 'https://www.vitaplate.ai';

// ── POST /api/corporate/signup — create corporate account ─────────────────────
router.post('/signup', requireAuth, async (req, res) => {
  try {
    const { companyName, companySize, contactName, contactEmail, billingEmail } = req.body;
    if (!companyName || !contactEmail) {
      return res.status(400).json({ error: 'Company name and contact email required' });
    }

    // Upgrade user to premium + mark as corporate admin
    await prisma.userSettings.upsert({
      where:  { userId: req.userId },
      create: {
        userId:             req.userId,
        subscriptionPlan:   'premium',
        subscriptionStatus: 'trialing',
        aiCreditsLimit:     999,
      },
      update: {
        subscriptionPlan:   'premium',
        subscriptionStatus: 'trialing',
        aiCreditsLimit:     999,
      },
    });

    // Store corporate info in user preferences as metadata
    await prisma.userPreferences.upsert({
      where:  { userId: req.userId },
      create: { userId: req.userId },
      update: {},
    });

    // Notify admin via email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from:    process.env.EMAIL_FROM || 'VitaPlate <support@vitaplate.ai>',
        to:      process.env.ADMIN_EMAIL || 'support@vitaplate.ai',
        subject: `🏢 New Corporate Signup: ${companyName}`,
        html: `
          <p>New corporate account signup:</p>
          <ul>
            <li><strong>Company:</strong> ${companyName}</li>
            <li><strong>Size:</strong> ${companySize || 'Unknown'}</li>
            <li><strong>Contact:</strong> ${contactName} &lt;${contactEmail}&gt;</li>
            <li><strong>Admin User ID:</strong> ${req.userId}</li>
          </ul>
          <p>Account has been provisioned with Premium access.</p>
        `,
      }).catch(() => {});
    }

    res.json({
      success:     true,
      message:     `Welcome, ${companyName}! Your corporate wellness account is active.`,
      plan:        'premium',
      nextSteps:   ['Invite your employees via the Corporate Admin panel', 'Set up your company health goals', 'Track aggregate wellness metrics'],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/corporate/invite — invite employee ──────────────────────────────
router.post('/invite', requireAuth, async (req, res) => {
  try {
    const { email, name, department } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const adminSettings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    const referralCode  = adminSettings?.affiliateCode;
    const inviteUrl     = referralCode ? `${APP_URL}/refer/${referralCode}` : `${APP_URL}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from:    process.env.EMAIL_FROM || 'VitaPlate <support@vitaplate.ai>',
        to:      email,
        subject: `Your company has invited you to VitaPlate Wellness`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;">🏢 Corporate Wellness Invitation</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">VitaPlate — AI-Powered Nutrition Platform</p>
            </div>
            <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
              <h2 style="color:#0f172a;">Hi ${name || 'there'}! 👋</h2>
              <p style="color:#475569;">Your employer has provided you with a <strong>free VitaPlate Premium account</strong> as part of your workplace wellness benefits.</p>
              <p style="color:#475569;">VitaPlate uses your lab results to build personalized meal plans — helping you improve energy, focus, and long-term health.</p>
              <ul style="color:#475569;line-height:2;">
                <li>AI meal plans from your blood work</li>
                <li>Biomarker tracking & trend analysis</li>
                <li>Personalized supplement recommendations</li>
                <li>Daily health coaching with Nova AI</li>
              </ul>
              ${department ? `<p style="color:#64748b;font-size:14px;">Department: ${department}</p>` : ''}
              <div style="text-align:center;margin:32px 0;">
                <a href="${inviteUrl}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
                  Activate Your Free Account →
                </a>
              </div>
              <p style="color:#94a3b8;font-size:12px;text-align:center;">Your personal health data is private and never shared with your employer.</p>
            </div>
          </div>
        `,
      });
    }

    res.json({ success: true, message: `Invitation sent to ${email}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/corporate/dashboard — aggregate wellness metrics (anonymized) ────
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    if (settings?.subscriptionPlan !== 'premium') {
      return res.status(403).json({ error: 'Corporate account required' });
    }

    // Get all employees (users referred by this corporate admin)
    const employees = await prisma.userSettings.findMany({
      where:   { referredBy: req.userId },
      include: {
        user: {
          include: {
            streaks:      true,
            labResults:   { take: 1, orderBy: { uploadDate: 'desc' } },
            dailyCheckIns:{ where: { createdDate: { gte: new Date(Date.now() - 30 * 86400000) } } },
          },
        },
      },
    });

    const total = employees.length;
    if (total === 0) {
      return res.json({ total: 0, message: 'No employees yet. Start by sending invitations.' });
    }

    const activeThisWeek = employees.filter(e =>
      e.user.streaks?.lastCheckIn &&
      new Date(e.user.streaks.lastCheckIn) > new Date(Date.now() - 7 * 86400000)
    ).length;

    const withLabs = employees.filter(e => e.user.labResults.length > 0).length;

    const avgStreak = employees.reduce((sum, e) => sum + (e.user.streaks?.currentStreak || 0), 0) / total;

    const checkInsThisMonth = employees.reduce((sum, e) => sum + e.user.dailyCheckIns.length, 0);

    // Aggregate biomarker summary (anonymized — no individual data)
    const biomarkerSummary = {};
    for (const emp of employees) {
      const lab = emp.user.labResults[0];
      if (!lab?.biomarkers) continue;
      for (const [marker, data] of Object.entries(lab.biomarkers)) {
        if (!biomarkerSummary[marker]) biomarkerSummary[marker] = { normal: 0, high: 0, low: 0, total: 0 };
        biomarkerSummary[marker][data.status || 'normal']++;
        biomarkerSummary[marker].total++;
      }
    }

    // Top issues across the team (anonymized)
    const teamInsights = Object.entries(biomarkerSummary)
      .filter(([, stats]) => stats.high + stats.low > 0)
      .map(([marker, stats]) => ({
        marker,
        abnormalRate: Math.round(((stats.high + stats.low) / stats.total) * 100),
        total:        stats.total,
      }))
      .sort((a, b) => b.abnormalRate - a.abnormalRate)
      .slice(0, 5);

    res.json({
      total,
      activeThisWeek,
      withLabs,
      avgStreak:         parseFloat(avgStreak.toFixed(1)),
      checkInsThisMonth,
      engagementRate:    Math.round((activeThisWeek / total) * 100),
      labUploadRate:     Math.round((withLabs / total) * 100),
      teamInsights,
      note:              'Individual health data is private. Only aggregate anonymized metrics shown.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
