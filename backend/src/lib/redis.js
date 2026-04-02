import Redis from 'ioredis';

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
  redis.on('error', (err) => console.error('Redis error:', err.message));
} else {
  // In-memory fallback — fine for dev, not for production
  const store = new Map();
  redis = {
    get: async (key) => store.get(key) ?? null,
    set: async (key, val) => { store.set(key, val); return 'OK'; },
    setex: async (key, _ttl, val) => { store.set(key, val); return 'OK'; },
    del: async (key) => { store.delete(key); return 1; },
    keys: async (pattern) => [...store.keys()].filter(k => k.includes(pattern.replace('*', ''))),
  };
  console.warn('⚠️  REDIS_URL not set — using in-memory cache (dev only)');
}

export { redis };

export const CACHE_TTL = {
  MEAL_PLAN: 60 * 60 * 24 * 7,   // 7 days
  TEMPLATE:  60 * 60 * 24 * 30,  // 30 days
  USER:      60 * 60,             // 1 hour
};

export async function getCached(key) {
  try {
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export async function setCached(key, value, ttl = CACHE_TTL.MEAL_PLAN) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (e) {
    console.error('Cache set error:', e.message);
  }
}

export async function deleteCached(key) {
  try { await redis.del(key); } catch {}
}
