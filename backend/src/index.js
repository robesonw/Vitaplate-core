import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import mealPlansRouter from './routes/mealPlans.js';
import coachRouter from './routes/coach.js';
import stripeRouter from './routes/stripe.js';
import {
  labRouter,
  userRouter,
  progressRouter,
  notificationRouter,
  checkInRouter,
  groceryRouter,
  pantryRouter,
  alertRouter,
} from './routes/resources.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin:      process.env.FRONTEND_URL || '*',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      10,
  message:  { error: 'Too many AI requests. Please wait before trying again.' },
});

app.use('/api/', limiter);
app.use('/api/meal-plans/generate', aiLimiter);
app.use('/api/coach/chat', aiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
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

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    version: '1.0.0',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error:   process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack:   process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`
🥗 VitaPlate API running on port ${PORT}
📦 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health: http://localhost:${PORT}/health
  `);
});

export default app;
