import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiRequest(method, path, body = null) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : null,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw Object.assign(new Error(error.error || 'Request failed'), { status: response.status, data: error });
  }
  return response.json();
}

const get  = (path)       => apiRequest('GET', path);
const post = (path, body) => apiRequest('POST', path, body);
const put  = (path, body) => apiRequest('PUT', path, body);
const del  = (path)       => apiRequest('DELETE', path);

// Safe stub — returns empty data for unimplemented entities, never crashes
const stub = (name) => ({
  list:   (...args) => Promise.resolve([]),
  filter: (...args) => Promise.resolve([]),
  create: (data)   => Promise.resolve({ ...data, id: crypto.randomUUID() }),
  update: (id, d)  => Promise.resolve({ id, ...d }),
  delete: (id)     => Promise.resolve({ success: true }),
});

export const auth = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return get('/api/user/me').catch(() => ({
      id: user.id, email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
    }));
  },
  signInWithGoogle: () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/Dashboard` },
  }),
  signInWithEmail:  (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signUpWithEmail:  (email, password, fullName) => supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
  signOut:          () => supabase.auth.signOut(),
  onAuthStateChange:(cb) => supabase.auth.onAuthStateChange(cb),
};

export const entities = {
  // ── Fully implemented ────────────────────────────────────────────────────────
  MealPlan:        { list: () => get('/api/meal-plans'), filter: () => get('/api/meal-plans'), create: d => post('/api/meal-plans', d), update: (id, d) => put(`/api/meal-plans/${id}`, d), delete: id => del(`/api/meal-plans/${id}`) },
  LabResult:       { 
    list:   () => get('/api/labs'),
    filter: () => get('/api/labs'),
    create: d => post('/api/labs', d),
    update: (id, d) => put(`/api/labs/${id}`, d),
    delete: id => del(`/api/labs/${id}`),
    trends: () => get('/api/labs/trends'),
  },
  CoachMessage:    { list: () => get('/api/coach/messages'), filter: () => get('/api/coach/messages'), create: d => post('/api/coach/chat', d) },
  UserPreferences: { list: () => get('/api/user/preferences').then(r => r ? [r] : []), filter: () => get('/api/user/preferences').then(r => r ? [r] : []), create: d => put('/api/user/preferences', d), update: (_, d) => put('/api/user/preferences', d) },
  UserSettings:    { list: () => get('/api/user/settings').then(r => r ? [r] : []), filter: () => get('/api/user/settings').then(r => r ? [r] : []), create: d => put('/api/user/settings', d), update: (_, d) => put('/api/user/settings', d) },
  ProgressEntry:   { list: () => get('/api/progress'), filter: () => get('/api/progress'), create: d => post('/api/progress', d) },
  Notification:    { list: () => get('/api/notifications'), filter: () => get('/api/notifications'), update: (id, d) => put(`/api/notifications/${id}/read`, d) },
  DailyCheckIn:    { list: () => get('/api/check-ins'), filter: () => get('/api/check-ins'), create: d => post('/api/check-ins', d) },
  GroceryList:     { list: () => get('/api/grocery-lists'), filter: () => get('/api/grocery-lists'), update: (id, d) => put(`/api/grocery-lists/${id}`, d) },
  PantryItem:      { list: () => get('/api/pantry'), filter: () => get('/api/pantry'), create: d => post('/api/pantry', d), update: (id, d) => put(`/api/pantry/${id}`, d), delete: id => del(`/api/pantry/${id}`) },
  HealthAlert:     { list: () => get('/api/alerts'), filter: () => get('/api/alerts'), update: (id, d) => put(`/api/alerts/${id}/acknowledge`, d) },
  UserStreak:      { list: () => get('/api/user/me').then(u => u?.streaks ? [u.streaks] : []), filter: () => get('/api/user/me').then(u => u?.streaks ? [u.streaks] : []) },
  UserBadge:       { list: () => get('/api/user/me').then(u => u?.badges ?? []), filter: () => get('/api/user/me').then(u => u?.badges ?? []) },
  WeightLog:       { list: () => get('/api/weight-logs').catch(() => []), filter: () => get('/api/weight-logs').catch(() => []), create: d => post('/api/weight-logs', d) },
  User:            { list: () => get('/api/user/me').then(u => u ? [u] : []), filter: () => get('/api/user/me').then(u => u ? [u] : []) },

  // ── Stubbed — return empty data, never crash ──────────────────────────────
  SharedMealPlan:          stub('SharedMealPlan'),
  SharedRecipe:            stub('SharedRecipe'),
  SharedProgress:          stub('SharedProgress'),
  FavoriteMeal:            stub('FavoriteMeal'),
  NutritionLog:            stub('NutritionLog'),
  NutritionGoal:           stub('NutritionGoal'),
  Feedback:                stub('Feedback'),
  ForumPost:               stub('ForumPost'),
  ForumComment:            stub('ForumComment'),
  Review:                  stub('Review'),
  RecipeComment:           stub('RecipeComment'),
  ProgressComment:         stub('ProgressComment'),
  UserFollow:              stub('UserFollow'),
  UserInteraction:         stub('UserInteraction'),
  ScoreShare:              stub('ScoreShare'),
  Referral:                stub('Referral'),
  AffiliateClick:          stub('AffiliateClick'),
  NotificationSettings:    stub('NotificationSettings'),
  WearableConnection:      stub('WearableConnection'),
  WearableSync:            stub('WearableSync'),
  PractitionerApplication: stub('PractitionerApplication'),
  PractitionerClient:      stub('PractitionerClient'),
  PractitionerConsent:     stub('PractitionerConsent'),
  PractitionerEarning:     stub('PractitionerEarning'),
  PractitionerMessage:     stub('PractitionerMessage'),
  PractitionerNote:        stub('PractitionerNote'),
  CorporateAccount:        stub('CorporateAccount'),
  CorporateEmployee:       stub('CorporateEmployee'),
};

export const functions = {
  invoke: async (name, data) => {
    const map = {
      generateMealPlan:                  () => post('/api/meal-plans/generate', data),
      exportMealPlanPDF:                 () => post(`/api/meal-plans/${data?.planId}/export-pdf`, data),
      generateSupplementPlan:            () => get('/api/labs/supplements'),
      generateSupplementRecommendations: () => get('/api/labs/supplements'),
      createCheckoutSession:             () => post('/api/stripe/create-checkout', data),
      importFHIRLabResults:              () => post('/api/labs/import-fhir', data),
    };
    const fn = map[name];
    if (!fn) { console.warn(`Function ${name} not implemented`); return null; }
    return fn();
  },
};

export const base44 = { auth, entities, functions };
export default base44;


// ─── Missing Base44 namespaces — prevents crashes on any page ────────────────

// Wires InvokeLLM to our backend AI endpoint
async function invokeLLM({ prompt, response_json_schema, max_tokens }) {
  try {
    const result = await post('/api/ai/invoke', { prompt, response_json_schema, max_tokens });
    return result?.text || result?.content || '';
  } catch {
    return '';
  }
}

export const integrations = {
  Core: {
    InvokeLLM:     invokeLLM,
    SendEmail:     async (opts) => { console.log('Email stubbed:', opts?.subject); return { success: true }; },
    UploadFile:    async (opts) => ({ file_url: '', success: false, message: 'File upload not configured' }),
    GenerateImage: async (opts) => ({ url: '', success: false }),
  },
};

export const asServiceRole = {
  entities: {
    ...Object.fromEntries(
      Object.entries(entities).map(([k, v]) => [k, v])
    ),
  },
};

export const connectors = {
  connectAppUser:    async (name) => { console.log('Connector stub:', name); return null; },
  disconnectAppUser: async (name) => { console.log('Connector stub:', name); return null; },
};

export const appLogs = {
  logUserInApp: async (page) => { /* no-op */ },
};

// Re-export base44 with all namespaces
Object.assign(base44, { integrations, asServiceRole, connectors, appLogs });
