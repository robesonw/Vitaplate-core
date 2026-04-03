import { createClient } from '@supabase/supabase-js';
import { prisma } from '../lib/prisma.js';

let supabase;

function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Upsert user in DB
    const dbUser = await prisma.user.upsert({
      where:  { email: user.email },
      create: {
        id:       user.id,
        email:    user.email,
        fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email.split('@')[0],
        settings: {
          create: {
            subscriptionPlan:   'free',
            subscriptionStatus: 'inactive',
            aiCreditsUsed:      0,
            aiCreditsLimit:     1,
          }
        }
      },
      update: {},
      include: { settings: true },
    });

    req.user   = dbUser;
    req.userId = dbUser.id;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    // Return specific error to help debug
    res.status(500).json({
      error:   'Authentication error',
      detail:  err.message,  // visible in network tab response
      hint:    'Check DATABASE_URL and SUPABASE_* variables in Railway',
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await getSupabase().auth.getUser(token);
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where:   { email: user.email },
        include: { settings: true }
      });
      req.user   = dbUser;
      req.userId = dbUser?.id;
    }
  } catch {}
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
