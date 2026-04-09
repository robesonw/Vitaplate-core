import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router  = Router();
const APP_URL = process.env.FRONTEND_URL || 'https://www.vitaplate.ai';
const API_URL = process.env.BACKEND_URL  || 'https://vitaplate-core-production.up.railway.app';

// ─── Provider Configuration ───────────────────────────────────────────────────
const PROVIDERS = {
  fitbit: {
    name:          'Fitbit',
    clientId:      process.env.FITBIT_CLIENT_ID,
    clientSecret:  process.env.FITBIT_CLIENT_SECRET,
    authUrl:       'https://www.fitbit.com/oauth2/authorize',
    tokenUrl:      'https://api.fitbit.com/oauth2/token',
    scopes:        ['activity', 'heartrate', 'sleep', 'weight', 'nutrition'],
    dataFn:        fetchFitbitData,
  },
  oura: {
    name:          'Oura Ring',
    clientId:      process.env.OURA_CLIENT_ID,
    clientSecret:  process.env.OURA_CLIENT_SECRET,
    authUrl:       'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl:      'https://api.ouraring.com/oauth/token',
    scopes:        ['daily', 'heartrate', 'workout', 'session'],
    dataFn:        fetchOuraData,
  },
  whoop: {
    name:          'WHOOP',
    clientId:      process.env.WHOOP_CLIENT_ID,
    clientSecret:  process.env.WHOOP_CLIENT_SECRET,
    authUrl:       'https://api.prod.whoop.com/oauth/oauth2/auth',
    tokenUrl:      'https://api.prod.whoop.com/oauth/oauth2/token',
    scopes:        ['read:recovery', 'read:cycles', 'read:sleep', 'read:workout'],
    dataFn:        fetchWhoopData,
  },
  dexcom: {
    name:          'Dexcom',
    clientId:      process.env.DEXCOM_CLIENT_ID,
    clientSecret:  process.env.DEXCOM_CLIENT_SECRET,
    authUrl:       'https://api.dexcom.com/v2/oauth2/login',
    tokenUrl:      'https://api.dexcom.com/v2/oauth2/token',
    scopes:        ['offline_access'],
    dataFn:        fetchDexcomData,
  },
};

// ── GET /api/wearables/auth-url/:provider ─────────────────────────────────────
router.get('/auth-url/:provider', requireAuth, (req, res) => {
  const provider = PROVIDERS[req.params.provider];
  if (!provider) return res.status(404).json({ error: 'Unknown provider' });

  if (!provider.clientId) {
    return res.status(503).json({
      error:   `${provider.name} not configured`,
      setup:   `Add ${req.params.provider.toUpperCase()}_CLIENT_ID and ${req.params.provider.toUpperCase()}_CLIENT_SECRET to Railway environment variables`,
      docsUrl: getDocsUrl(req.params.provider),
    });
  }

  const params = new URLSearchParams({
    client_id:     provider.clientId,
    redirect_uri:  `${API_URL}/api/wearables/callback/${req.params.provider}`,
    response_type: 'code',
    scope:         provider.scopes.join(' '),
    state:         req.userId,
  });

  // Fitbit needs additional params
  if (req.params.provider === 'fitbit') {
    params.set('expires_in', '604800');
  }

  res.json({ url: `${provider.authUrl}?${params}` });
});

// ── GET /api/wearables/callback/:provider — OAuth callback ────────────────────
router.get('/callback/:provider', async (req, res) => {
  const providerKey = req.params.provider;
  const provider    = PROVIDERS[providerKey];
  if (!provider) return res.redirect(`${APP_URL}/Integrations?error=unknown_provider`);

  const { code, state: userId, error } = req.query;
  if (error || !code) return res.redirect(`${APP_URL}/Integrations?${providerKey}=error`);

  try {
    const tokenRes = await fetch(provider.tokenUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type:   'authorization_code',
        redirect_uri: `${API_URL}/api/wearables/callback/${providerKey}`,
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Store tokens in DB keyed by provider
    const tokenKey = `${providerKey}Tokens`;
    await prisma.userSettings.upsert({
      where:  { userId },
      create: { userId, [tokenKey]: JSON.stringify(tokens) },
      update: {           [tokenKey]: JSON.stringify(tokens) },
    });

    // Trigger initial sync
    try { await provider.dataFn(userId, tokens.access_token); } catch {}

    res.redirect(`${APP_URL}/Integrations?${providerKey}=connected`);
  } catch (err) {
    console.error(`${providerKey} OAuth error:`, err.message);
    res.redirect(`${APP_URL}/Integrations?${providerKey}=error&msg=${encodeURIComponent(err.message)}`);
  }
});

// ── GET /api/wearables/status — all provider connection statuses ──────────────
router.get('/status', requireAuth, async (req, res) => {
  const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
  const status   = {};

  for (const key of Object.keys(PROVIDERS)) {
    const tokenKey = `${key}Tokens`;
    const tokens   = settings?.[tokenKey] ? JSON.parse(settings[tokenKey]) : null;
    status[key] = {
      connected:    !!tokens?.access_token,
      configured:   !!PROVIDERS[key].clientId,
      lastSync:     settings?.[`${key}LastSync`] || null,
    };
  }

  res.json(status);
});

// ── DELETE /api/wearables/disconnect/:provider ────────────────────────────────
router.delete('/disconnect/:provider', requireAuth, async (req, res) => {
  const providerKey = req.params.provider;
  if (!PROVIDERS[providerKey]) return res.status(404).json({ error: 'Unknown provider' });

  const tokenKey = `${providerKey}Tokens`;
  await prisma.userSettings.update({
    where: { userId: req.userId },
    data:  { [tokenKey]: null },
  });

  res.json({ success: true, message: `${PROVIDERS[providerKey].name} disconnected` });
});

// ── POST /api/wearables/sync/:provider — manual sync ─────────────────────────
router.post('/sync/:provider', requireAuth, async (req, res) => {
  const providerKey = req.params.provider;
  const provider    = PROVIDERS[providerKey];
  if (!provider) return res.status(404).json({ error: 'Unknown provider' });

  const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
  const tokenKey = `${providerKey}Tokens`;
  const tokens   = settings?.[tokenKey] ? JSON.parse(settings[tokenKey]) : null;

  if (!tokens) return res.status(400).json({ error: `${provider.name} not connected` });

  try {
    const data = await provider.dataFn(req.userId, tokens.access_token);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Provider data fetchers ───────────────────────────────────────────────────
async function fetchFitbitData(userId, accessToken) {
  const today = new Date().toISOString().split('T')[0];
  const [activityRes, sleepRes, heartRes] = await Promise.all([
    fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }),
    fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${today}.json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }),
    fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }),
  ]);

  const [activity, sleep, heart] = await Promise.all([
    activityRes.json(), sleepRes.json(), heartRes.json(),
  ]);

  const wearableData = {
    steps:           activity?.summary?.steps || 0,
    calories:        activity?.summary?.caloriesOut || 0,
    activeMinutes:   (activity?.summary?.fairlyActiveMinutes || 0) + (activity?.summary?.veryActiveMinutes || 0),
    sleepMinutes:    sleep?.summary?.totalMinutesAsleep || 0,
    sleepScore:      sleep?.sleep?.[0]?.efficiency || null,
    restingHeartRate:heart?.['activities-heart']?.[0]?.value?.restingHeartRate || null,
    syncDate:        today,
    provider:        'fitbit',
  };

  await saveWearableSync(userId, wearableData);
  return wearableData;
}

async function fetchOuraData(userId, accessToken) {
  const today    = new Date().toISOString().split('T')[0];
  const yesterday= new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [dailyRes, sleepRes] = await Promise.all([
    fetch(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${yesterday}&end_date=${today}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${yesterday}&end_date=${today}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }),
  ]);

  const [daily, sleep] = await Promise.all([dailyRes.json(), sleepRes.json()]);
  const latestDaily = daily?.data?.[daily.data.length - 1] || {};
  const latestSleep = sleep?.data?.[sleep.data.length - 1] || {};

  const wearableData = {
    steps:         latestDaily.steps || 0,
    calories:      latestDaily.active_calories || 0,
    activeMinutes: Math.round((latestDaily.high_activity_time || 0) / 60),
    sleepScore:    latestSleep.score || null,
    sleepMinutes:  Math.round((latestSleep.total_sleep_duration || 0) / 60),
    readiness:     latestSleep.readiness_score_delta || null,
    hrv:           latestSleep.average_hrv || null,
    syncDate:      today,
    provider:      'oura',
  };

  await saveWearableSync(userId, wearableData);
  return wearableData;
}

async function fetchWhoopData(userId, accessToken) {
  const [cycleRes, recoveryRes, sleepRes] = await Promise.all([
    fetch('https://api.prod.whoop.com/developer/v1/cycle?limit=1',
      { headers: { Authorization: `Bearer ${accessToken}` } }),
    fetch('https://api.prod.whoop.com/developer/v1/recovery?limit=1',
      { headers: { Authorization: `Bearer ${accessToken}` } }),
    fetch('https://api.prod.whoop.com/developer/v1/activity/sleep?limit=1',
      { headers: { Authorization: `Bearer ${accessToken}` } }),
  ]);

  const [cycle, recovery, sleep] = await Promise.all([
    cycleRes.json(), recoveryRes.json(), sleepRes.json(),
  ]);

  const latestCycle    = cycle?.records?.[0] || {};
  const latestRecovery = recovery?.records?.[0] || {};
  const latestSleep    = sleep?.records?.[0] || {};

  const wearableData = {
    strain:          latestCycle.score?.strain || null,
    calories:        latestCycle.score?.kilojoule ? Math.round(latestCycle.score.kilojoule / 4.184) : null,
    recoveryScore:   latestRecovery.score?.recovery_score || null,
    hrv:             latestRecovery.score?.hrv_rmssd_milli || null,
    restingHeartRate:latestRecovery.score?.resting_heart_rate || null,
    sleepPerformance:latestSleep.score?.sleep_performance_percentage || null,
    sleepMinutes:    latestSleep.score ? Math.round(latestSleep.score.total_in_bed_time_milli / 60000) : null,
    syncDate:        new Date().toISOString().split('T')[0],
    provider:        'whoop',
  };

  await saveWearableSync(userId, wearableData);
  return wearableData;
}

async function fetchDexcomData(userId, accessToken) {
  const endDate   = new Date().toISOString();
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://api.dexcom.com/v2/users/self/egvs?startDate=${startDate}&endDate=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  const egvs = data?.egvs || [];

  if (egvs.length === 0) return { message: 'No glucose readings in last 24h' };

  const values   = egvs.map(e => e.value);
  const avgGlucose = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const minGlucose = Math.min(...values);
  const maxGlucose = Math.max(...values);
  const inRange    = values.filter(v => v >= 70 && v <= 180).length;
  const timeInRange= Math.round((inRange / values.length) * 100);

  const wearableData = {
    avgGlucose,
    minGlucose,
    maxGlucose,
    timeInRange,
    readings:  egvs.length,
    syncDate:  new Date().toISOString().split('T')[0],
    provider:  'dexcom',
    trend:     egvs[egvs.length - 1]?.trend || null,
    lastReading: egvs[egvs.length - 1]?.value || null,
  };

  await saveWearableSync(userId, wearableData);
  return wearableData;
}

async function saveWearableSync(userId, data) {
  const today = new Date().toISOString().split('T')[0];
  await prisma.dailyCheckIn.upsert({
    where:  { userId_checkInDate: { userId, checkInDate: today } },
    create: { userId, checkInDate: today, notes: `Auto-synced from ${data.provider}` },
    update: { notes: `Auto-synced from ${data.provider} at ${new Date().toLocaleTimeString()}` },
  }).catch(() => {});
}

function getDocsUrl(provider) {
  const urls = {
    fitbit: 'https://dev.fitbit.com/build/reference/web-api/developer-guide/getting-started/',
    oura:   'https://cloud.ouraring.com/docs/authentication',
    whoop:  'https://developer.whoop.com/api',
    dexcom: 'https://developer.dexcom.com/getting-started',
  };
  return urls[provider] || '';
}

export default router;
