# VitaPlate Core

> AI-powered biomarker-driven meal planning platform — fully owned stack, zero vendor lock-in.

## Architecture

```
vitaplate-core/
├── backend/          # Node.js + Express + Prisma + Postgres
│   ├── src/
│   │   ├── index.js          # Express server entry
│   │   ├── routes/           # All API endpoints
│   │   ├── services/ai.js    # Claude integration (Haiku/Sonnet routing)
│   │   ├── middleware/auth.js # Supabase JWT verification
│   │   ├── lib/              # Prisma + Redis clients
│   │   └── jobs/             # Seeder scripts
│   └── prisma/schema.prisma  # Full DB schema
└── frontend/         # React + Vite + Tailwind + shadcn/ui
    └── src/
        ├── api/base44Client.js  # Drop-in API client (replaces Base44 SDK)
        ├── lib/AuthContext.jsx  # Supabase auth
        └── pages/ + components/ (unchanged from original)
```

## AI Cost Strategy

| Operation | Model | Cost Tier |
|---|---|---|
| Meal plan generation | Claude Sonnet | Credits (1 free / 3 Pro / ∞ Premium) |
| Nova coach chat | Claude Haiku | ~10x cheaper than Sonnet |
| Meal swap | Claude Haiku | Free (no credit cost) |
| Grocery list | Claude Haiku | Free |
| Supplements | Rules engine | Always free ($0 AI) |
| Health alerts | Rules engine | Always free ($0 AI) |
| Cached/template plan | None | Always free ($0 AI) |

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Postgres database (Supabase recommended)
- Upstash Redis account (free tier)
- Anthropic API key
- Stripe account

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npx prisma db push        # Create tables
npm run seed:templates    # Pre-generate plan templates (~$5-10 one-time)
npm run dev               # Start API on port 3001
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in your .env values
npm install
npm run dev               # Start on port 5173
```

### 4. Run Both Together (from root)
```bash
npm install
npm run install:all
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe dashboard → Webhooks |
| `STRIPE_PRICE_PRO` | `price_1TGBR1COuE09SydQb6vFoZEX` |
| `STRIPE_PRICE_PREMIUM` | `price_1TGBR1COuE09SydQUiKVWxEx` |
| `REDIS_URL` | Upstash Redis URL |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `FRONTEND_URL` | `https://vitaplate.ai` |
| `JWT_SECRET` | Long random string |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_URL` | Backend URL (e.g. `https://api.vitaplate.ai`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

## Deployment

### Backend → Railway
1. Create new project in Railway
2. Connect this GitHub repo, select `/backend` as root
3. Add all environment variables
4. Railway auto-detects Node.js and deploys

### Frontend → Vercel
1. Import repo in Vercel
2. Set root directory to `/frontend`
3. Add environment variables
4. Deploy — Vercel handles builds automatically

### Update Stripe Webhook
After deploying backend, go to Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-api.railway.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### Supabase Auth Setup
1. Enable Email + Google OAuth providers in Supabase Dashboard
2. Add your domain to allowed redirect URLs
3. (Optional) Set up email templates for magic links

## Seeding Templates

Run once after first deployment to pre-generate 20+ meal plan templates:
```bash
cd backend
npm run seed:templates
```

This costs ~$5-10 once and saves hundreds in AI costs. Users with matching biomarker profiles get served instantly at $0.

## API Endpoints

### Meal Plans
- `GET    /api/meal-plans`              — list user's plans
- `POST   /api/meal-plans/generate`    — generate with cache-first strategy
- `POST   /api/meal-plans/:id/swap-meal` — swap a single meal (Haiku, free)
- `POST   /api/meal-plans/:id/grocery-list` — generate grocery list
- `DELETE /api/meal-plans/:id`          — delete plan

### Coach
- `GET    /api/coach/messages`         — load history
- `POST   /api/coach/chat`             — chat with Nova (Haiku)
- `DELETE /api/coach/messages`         — clear history

### Labs
- `GET    /api/labs`                   — list lab results
- `POST   /api/labs`                   — add lab result
- `GET    /api/labs/supplements`       — supplement recommendations (free, rules-based)

### User
- `GET    /api/user/me`                — full user profile
- `GET/PUT /api/user/preferences`      — health profile
- `GET/PUT /api/user/settings`         — subscription + notification settings

### Other
- `GET/POST /api/progress`             — progress entries
- `GET/POST /api/check-ins`            — daily check-ins (updates streak)
- `GET      /api/grocery-lists`        — grocery lists
- `GET/POST /api/pantry`               — pantry items
- `GET      /api/alerts`               — health alerts
- `GET      /api/notifications`        — notifications
- `POST     /api/stripe/create-checkout` — start subscription
- `POST     /api/stripe/webhook`       — Stripe events (raw body)
- `GET      /health`                   — health check

## Credits & Attribution

Built on top of [culinary-compass](https://github.com/robesonw/culinary-compass) — a Base44 application.
Migrated to a fully self-hosted stack with enhanced AI cost optimization.

---

## Docker Local Deployment

The fastest way to run VitaPlate locally — Postgres, Redis, backend, and frontend all spin up together.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- That's it

### 1. Fill in your secrets

```bash
# Backend — only fill in the 4 marked secrets (DB + Redis are pre-configured)
nano backend/.env.local

# Frontend — fill in Supabase URL + anon key
nano frontend/.env.local
```

Minimum required to boot:
| File | Variable | Where to get it |
|---|---|---|
| `backend/.env.local` | `SUPABASE_URL` | supabase.com → project → Settings → API |
| `backend/.env.local` | `SUPABASE_SERVICE_ROLE_KEY` | same page |
| `backend/.env.local` | `ANTHROPIC_API_KEY` | console.anthropic.com |
| `frontend/.env.local` | `VITE_SUPABASE_URL` | same as above |
| `frontend/.env.local` | `VITE_SUPABASE_ANON_KEY` | supabase.com → project → Settings → API |

Stripe + Resend can be added later — the app boots without them.

### 2. Start everything

```bash
make up
```

That's it. Docker will:
- Pull Postgres 16 + Redis 7
- Build backend and frontend images
- Run `prisma db push` to create all tables
- Start hot-reload dev servers

### 3. Open the app

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3001 |
| **Health check** | http://localhost:3001/health |
| **DB Studio** | `make db-studio` → http://localhost:5555 |

### Common Commands

```bash
make up              # Start all services
make down            # Stop all services
make logs            # Watch live logs
make logs-backend    # Backend logs only
make restart         # Restart backend (after code changes if hot-reload misses)
make db-studio       # Open Prisma Studio (visual DB browser)
make seed            # Pre-generate meal plan templates (~$8 one-time)
make shell-backend   # SSH into backend container
make shell-db        # Open psql prompt
make reset           # Nuke DB and start fresh (⚠️ destroys data)
make status          # See container health
```

### Architecture (local docker)

```
Browser
  │
  ├─ http://localhost:5173  ──► frontend (Vite dev server, hot-reload)
  │                                │
  └─ http://localhost:3001  ──► backend (Node + Express, hot-reload)
                                   │
                      ┌────────────┴────────────┐
                      ▼                         ▼
              postgres:5432             redis:6379
          (vitaplate database)      (plan cache + sessions)
```

### After first boot

```bash
# Seed meal plan templates (run once — costs ~$8 in AI, saves hundreds)
make seed

# Browse your database visually
make db-studio
```

### Stripe webhook in local dev

To test Stripe payments locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Copy the webhook secret it prints → paste into `STRIPE_WEBHOOK_SECRET` in `backend/.env.local` → `make restart`
