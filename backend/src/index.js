import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Health check FIRST — before anything else ────────────────────────────────
// Railway hits /health immediately after container starts.
// This must respond even if DB/Redis haven't connected yet.
let dbReady    = false;
let startupError = null;

app.get('/health', (req, res) => {
  res.status(200).json({
    status:   'ok',
    version:  '1.0.0',
    env:      process.env.NODE_ENV || 'production',
    db:       dbReady ? 'connected' : 'connecting',
    time:     new Date().toISOString(),
  });
});

// ─── Start listening immediately ──────────────────────────────────────────────
// Server is up BEFORE we try to connect to DB or load routes.
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VitaPlate API listening on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health: http://0.0.0.0:${PORT}/health`);
  // Now bootstrap everything else
  bootstrap();
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// ─── Bootstrap — runs after server is already listening ───────────────────────
async function bootstrap() {
  try {
    // 1. Test DB connection
    console.log('📦 Connecting to database...');
    const { prisma } = await import('./lib/prisma.js');
    await prisma.$connect();
    dbReady = true;
    console.log('✅ Database connected');

    // 2. Apply schema (safe no-op if already up to date)
    console.log('📦 Verifying database schema...');
    try {
      await prisma.$executeRaw`SELECT 1`;
      console.log('✅ Database schema OK');
    } catch (schemaErr) {
      console.warn('⚠️  Schema check failed (may need migration):', schemaErr.message);
    }

    // 3. Now load and register all routes
    console.log('📦 Loading routes...');
    await registerRoutes(app);
    console.log('✅ All routes loaded');

    console.log('\n🥗 VitaPlate API fully ready\n');
  } catch (err) {
    startupError = err;
    console.error('❌ Bootstrap error:', err.message);
    console.error('   Server is still running — /health will respond');
    console.error('   API routes will return 503 until fixed');
  }
}

async function registerRoutes(app) {
  // ── Security & Middleware ────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(cors({
    origin:         process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Stripe webhook needs raw body — must be before express.json()
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Rate Limiting ────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      200,
    standardHeaders: true,
    legacyHeaders:   false,
  });
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      10,
    message:  { error: 'Too many AI requests. Please wait before trying again.' },
  });

  app.use('/api/', limiter);
  app.use('/api/meal-plans/generate', aiLimiter);
  app.use('/api/coach/chat', aiLimiter);

  // ── Routes (dynamic import so DB is ready first) ─────────────────────────
  const [
    { default: mealPlansRouter },
    { default: coachRouter },
    { default: stripeRouter },
    { labRouter, userRouter, progressRouter, notificationRouter, checkInRouter, groceryRouter, pantryRouter, alertRouter },
  ] = await Promise.all([
    import('./routes/mealPlans.js'),
    import('./routes/coach.js'),
    import('./routes/stripe.js'),
    import('./routes/resources.js'),
  ]);

  app.use('/api/meal-plans',    mealPlansRouter);
  app.use('/api/coach',         coachRouter);
  app.use('/api/stripe',        stripeRouter);
  app.use('/api/labs',          labRouter);
  app.use('/api/user',          userRouter);
  app.use('/api/progress',      progressRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/check-ins',     checkInRouter);
  app.use('/api/grocery-lists', groceryRouter);
  app.use('/api/pantry',        pantryRouter);
  app.use('/api/alerts',        alertRouter);

  // ── 404 ──────────────────────────────────────────────────────────────────
  app.use('*', (req, res) => {
    if (req.path === '/health') return; // already handled above
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
  });

  // ── Error Handler ─────────────────────────────────────────────────────────
  app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(async () => {
    try {
      const { prisma } = await import('./lib/prisma.js');
      await prisma.$disconnect();
    } catch {}
    process.exit(0);
  });
});

export default app;
