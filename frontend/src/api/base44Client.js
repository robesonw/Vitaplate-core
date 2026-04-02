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
    method,
    headers,
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

export const auth = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return get('/api/user/me');
  },
  signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/Dashboard` } }),
  signInWithEmail:  (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signUpWithEmail:  (email, password, fullName) => supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
  signOut:          () => supabase.auth.signOut(),
  onAuthStateChange:(cb) => supabase.auth.onAuthStateChange(cb),
};

export const entities = {
  MealPlan:        { list: () => get('/api/meal-plans'), filter: () => get('/api/meal-plans'), create: d => post('/api/meal-plans', d), update: (id, d) => put(`/api/meal-plans/${id}`, d), delete: id => del(`/api/meal-plans/${id}`) },
  LabResult:       { list: () => get('/api/labs'), filter: () => get('/api/labs'), create: d => post('/api/labs', d), update: (id, d) => put(`/api/labs/${id}`, d), delete: id => del(`/api/labs/${id}`) },
  CoachMessage:    { list: () => get('/api/coach/messages'), filter: () => get('/api/coach/messages'), create: d => post('/api/coach/chat', d) },
  UserPreferences: { list: () => get('/api/user/preferences').then(r => [r]), filter: () => get('/api/user/preferences').then(r => [r]), create: d => put('/api/user/preferences', d), update: (_, d) => put('/api/user/preferences', d) },
  UserSettings:    { list: () => get('/api/user/settings').then(r => [r]), filter: () => get('/api/user/settings').then(r => [r]), create: d => put('/api/user/settings', d), update: (_, d) => put('/api/user/settings', d) },
  ProgressEntry:   { list: () => get('/api/progress'), filter: () => get('/api/progress'), create: d => post('/api/progress', d) },
  Notification:    { list: () => get('/api/notifications'), filter: () => get('/api/notifications'), update: (id, d) => put(`/api/notifications/${id}/read`, d) },
  DailyCheckIn:    { list: () => get('/api/check-ins'), filter: () => get('/api/check-ins'), create: d => post('/api/check-ins', d) },
  GroceryList:     { list: () => get('/api/grocery-lists'), filter: () => get('/api/grocery-lists'), update: (id, d) => put(`/api/grocery-lists/${id}`, d) },
  PantryItem:      { list: () => get('/api/pantry'), filter: () => get('/api/pantry'), create: d => post('/api/pantry', d), update: (id, d) => put(`/api/pantry/${id}`, d), delete: id => del(`/api/pantry/${id}`) },
  HealthAlert:     { list: () => get('/api/alerts'), filter: () => get('/api/alerts'), update: (id, d) => put(`/api/alerts/${id}/acknowledge`, d) },
  UserStreak:      { list: () => get('/api/user/me').then(u => [u?.streaks].filter(Boolean)), filter: () => get('/api/user/me').then(u => [u?.streaks].filter(Boolean)) },
  UserBadge:       { list: () => get('/api/user/me').then(u => u?.badges ?? []), filter: () => get('/api/user/me').then(u => u?.badges ?? []) },
  WeightLog:       { list: () => get('/api/weight-logs'), filter: () => get('/api/weight-logs'), create: d => post('/api/weight-logs', d) },
};

export const functions = {
  invoke: async (name, data) => {
    const map = {
      generateMealPlan:                  () => post('/api/meal-plans/generate', data),
      exportMealPlanPDF:                 () => post(`/api/meal-plans/${data.planId}/export-pdf`, data),
      generateSupplementPlan:            () => get('/api/labs/supplements'),
      generateSupplementRecommendations: () => get('/api/labs/supplements'),
      createCheckoutSession:             () => post('/api/stripe/create-checkout', data),
      importFHIRLabResults:              () => post('/api/labs/import-fhir', data),
    };
    const fn = map[name];
    if (!fn) throw new Error(`Function ${name} not mapped`);
    return fn();
  },
};

export const base44 = { auth, entities, functions };
export default base44;
