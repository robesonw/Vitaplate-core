import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router  = Router();
const APP_URL = process.env.FRONTEND_URL || 'https://www.vitaplate.ai';

// ─── Google OAuth Config ──────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI         = `${process.env.BACKEND_URL || 'https://vitaplate-core-production.up.railway.app'}/api/calendar/callback`;
const SCOPES               = ['https://www.googleapis.com/auth/calendar.events'];

// ── GET /api/calendar/auth-url — get OAuth consent URL ───────────────────────
router.get('/auth-url', requireAuth, (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      error: 'Google Calendar not configured',
      setup: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Railway environment variables',
    });
  }

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         SCOPES.join(' '),
    access_type:   'offline',
    prompt:        'consent',
    state:         req.userId, // pass userId through OAuth flow
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

// ── GET /api/calendar/callback — handle OAuth callback ───────────────────────
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId, error } = req.query;

    if (error || !code) {
      return res.redirect(`${APP_URL}/Integrations?calendar=error`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Store tokens securely in DB
    await prisma.userSettings.upsert({
      where:  { userId },
      create: { userId, googleCalendarTokens: JSON.stringify(tokens) },
      update: {           googleCalendarTokens: JSON.stringify(tokens) },
    });

    res.redirect(`${APP_URL}/Integrations?calendar=connected`);
  } catch (err) {
    console.error('Calendar OAuth error:', err.message);
    res.redirect(`${APP_URL}/Integrations?calendar=error&msg=${encodeURIComponent(err.message)}`);
  }
});

// ── GET /api/calendar/status — check if connected ────────────────────────────
router.get('/status', requireAuth, async (req, res) => {
  const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
  const tokens   = settings?.googleCalendarTokens ? JSON.parse(settings.googleCalendarTokens) : null;
  res.json({ connected: !!tokens?.access_token, hasRefreshToken: !!tokens?.refresh_token });
});

// ── DELETE /api/calendar/disconnect ──────────────────────────────────────────
router.delete('/disconnect', requireAuth, async (req, res) => {
  await prisma.userSettings.update({
    where: { userId: req.userId },
    data:  { googleCalendarTokens: null },
  });
  res.json({ success: true });
});

// ── POST /api/calendar/sync — push meal plan to Google Calendar ──────────────
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { planId, calendarId = 'primary' } = req.body;
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    const tokens   = settings?.googleCalendarTokens ? JSON.parse(settings.googleCalendarTokens) : null;

    if (!tokens) return res.status(400).json({ error: 'Google Calendar not connected', redirect: '/Integrations' });

    // Refresh token if needed
    let accessToken = tokens.access_token;
    if (tokens.refresh_token && isTokenExpired(tokens)) {
      accessToken = await refreshAccessToken(tokens.refresh_token, req.userId);
    }

    const plan = await prisma.mealPlan.findFirst({ where: { id: planId, userId: req.userId } });
    if (!plan) return res.status(404).json({ error: 'Meal plan not found' });

    const days  = plan.days || [];
    const today = new Date();
    const created = [];

    for (let i = 0; i < days.length; i++) {
      const date      = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr   = date.toISOString().split('T')[0];
      const dayPlan   = days[i];

      const mealSchedule = [
        { meal: dayPlan.breakfast, hour: 8,  type: 'Breakfast' },
        { meal: dayPlan.lunch,     hour: 12, type: 'Lunch'     },
        { meal: dayPlan.dinner,    hour: 18, type: 'Dinner'    },
        { meal: dayPlan.snacks,    hour: 15, type: 'Snack'     },
      ];

      for (const { meal, hour, type } of mealSchedule) {
        if (!meal?.name) continue;

        const start = new Date(`${dateStr}T${String(hour).padStart(2,'0')}:00:00`);
        const end   = new Date(start.getTime() + 30 * 60000); // 30 min

        const description = [
          meal.healthBenefit && `💚 ${meal.healthBenefit}`,
          meal.calories && `🔥 ${meal.calories} calories`,
          meal.prepTime && `⏱️ Prep: ${meal.prepTime}`,
          meal.prepSteps?.length && `\nSteps:\n${meal.prepSteps.map((s, i) => `${i+1}. ${s}`).join('\n')}`,
        ].filter(Boolean).join('\n');

        const event = {
          summary:     `🥗 ${type}: ${meal.name}`,
          description,
          start:       { dateTime: start.toISOString(), timeZone: 'America/New_York' },
          end:         { dateTime: end.toISOString(),   timeZone: 'America/New_York' },
          colorId:     type === 'Breakfast' ? '7' : type === 'Lunch' ? '9' : type === 'Dinner' ? '6' : '5',
          reminders:   { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
        };

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method:  'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify(event),
          }
        );

        if (response.ok) {
          created.push({ type, meal: meal.name, date: dateStr });
        }
      }
    }

    res.json({
      success:      true,
      eventsCreated: created.length,
      message:      `${created.length} meals added to your Google Calendar!`,
    });
  } catch (err) {
    console.error('Calendar sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Token helpers ────────────────────────────────────────────────────────────
function isTokenExpired(tokens) {
  if (!tokens.expiry_date) return false;
  return Date.now() > tokens.expiry_date - 60000; // refresh 1 min early
}

async function refreshAccessToken(refreshToken, userId) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  });
  const newTokens = await res.json();
  await prisma.userSettings.update({
    where: { userId },
    data:  { googleCalendarTokens: JSON.stringify({ ...newTokens, refresh_token: refreshToken }) },
  });
  return newTokens.access_token;
}

export default router;
