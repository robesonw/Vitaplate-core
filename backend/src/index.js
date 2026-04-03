import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS — configured before EVERYTHING including health check ───────────────
// Allow all vitaplate.ai origins + Railway preview domains
const ALLOWED_ORIGINS = [
  'https://www.vitaplate.ai',
  'https://vitaplate.ai',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Also allow any Railway preview domain dynamically
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.up.railway.app') ||
      origin.endsWith('.railway.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some browsers (IE11) choke on 204
};

// Apply CORS globally — this handles ALL preflight OPTIONS requests immediately
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicit OPTIONS handler for all routes

// ─── Health check — responds before DB connects ───────────────────────────────
let dbReady = false;

app.get('/health', (req, res) => {
  res.status(200).json({
    status:  'ok',
    version: '1.0.0',
    env:     process.env.NODE_ENV || 'production',
    db:      dbReady ? 'connected' : 'connecting',
    time:    new Date().toISOString(),
  });
});

// ─── Start listening immediately (Railway healthcheck needs this fast) ─────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VitaPlate API listening on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'production'}`);
  bootstrap();
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// ─── Bootstrap — registers all middleware + routes after server is up ──────────
async function bootstrap() {
  try {
    // Security & logging
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use(compression());
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // Stripe webhook needs raw body — before express.json()
    app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    });
    const aiLimiter = rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 10,
      message: { error: 'Too many AI requests. Please wait before trying again.' },
    });
    app.use('/api/', limiter);
    app.use('/api/meal-plans/generate', aiLimiter);
    app.use('/api/coach/chat', aiLimiter);

    // DB connection
    console.log('📦 Connecting to database...');
    const { prisma } = await import('./lib/prisma.js');
    await prisma.$connect();
    dbReady = true;
    console.log('✅ Database connected');

    // Load and register all routes
    const [
      { default: mealPlansRouter },
      { default: coachRouter },
      { default: stripeRouter },
      { labRouter, userRouter, progressRouter, notificationRouter,
        checkInRouter, groceryRouter, pantryRouter, alertRouter },
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

    // 404
    app.use('*', (req, res) => {
      res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
    });

    // Error handler
    app.use((err, req, res, _next) => {
      if (err.message?.startsWith('CORS:')) {
        return res.status(403).json({ error: err.message });
      }
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      });
    });

    console.log('✅ All routes loaded — API fully ready\n');
  } catch (err) {
    console.error('❌ Bootstrap error:', err.message);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM — shutting down');
  server.close(async () => {
    try { const { prisma } = await import('./lib/prisma.js'); await prisma.$disconnect(); } catch {}
    process.exit(0);
  });
});

export default app;
