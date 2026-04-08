import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import routes synchronously — no async, no race condition
import mealPlansRouter from './routes/mealPlans.js';
import aiRouter from './routes/ai.js';
import labsRouter from './routes/labs.js';
import gamificationRouter from './routes/gamification.js';
import referralRouter from './routes/referral.js';
import practitionerRouter from './routes/practitioner.js';
import { ensureStorageBucket } from './services/labUpload.js';
import { startAllJobs } from './jobs/scheduler.js';
import coachRouter from './routes/coach.js';
import stripeRouter from './routes/stripe.js';
import {
  userRouter, progressRouter, notificationRouter,
  checkInRouter, groceryRouter, pantryRouter, alertRouter,
} from './routes/resources.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS — first, before everything ─────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.vitaplate.ai',
  'https://vitaplate.ai',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.railway.app')
    ) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Disable caching on all API routes ───────────────────────────────────────
app.use('/api/', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
});


// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('combined'));
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use('/api/meal-plans/generate', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }));
app.use('/api/coach/chat', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── Routes — registered synchronously at startup ────────────────────────────
app.use('/api/meal-plans',    mealPlansRouter);
app.use('/api/ai',            aiRouter);
app.use('/api/coach',         coachRouter);
app.use('/api/stripe',        stripeRouter);
app.use('/api/labs',          labsRouter);
app.use('/api/user',          userRouter);
app.use('/api/progress',      progressRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/check-ins',     checkInRouter);
app.use('/api/grocery-lists', groceryRouter);
app.use('/api/pantry',        pantryRouter);
app.use('/api/alerts',        alertRouter);
app.use('/api/gamification',  gamificationRouter);
app.use('/api/referral',      referralRouter);
app.use('/api/practitioner',  practitionerRouter);

// ─── 404 + Error handler ──────────────────────────────────────────────────────
app.use('*', (req, res) => res.status(404).json({ error: `${req.method} ${req.originalUrl} not found` }));
app.use((err, req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// ─── Start server then connect DB in background ───────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VitaPlate API on port ${PORT} — routes ready`);
  connectDB();
});

async function connectDB() {
  // Set up Supabase storage bucket for lab PDFs
  try { await ensureStorageBucket(); } catch {}

  try {
    const { prisma } = await import('./lib/prisma.js');
    await prisma.$connect();
    console.log('✅ Database connected');
    startAllJobs();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    console.error('   Check DATABASE_URL in Railway Variables');
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  process.exit(0);
});

export default app;
// This line intentionally left blank
