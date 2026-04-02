# VitaPlate — Docker Shortcuts
# Usage: make <command>

.PHONY: up down restart logs shell-backend shell-db db-studio seed migrate reset

# ── Start / Stop ──────────────────────────────────────────────────────────────

up:
	@echo "🚀 Starting VitaPlate..."
	docker compose up -d
	@echo ""
	@echo "✅ Running at:"
	@echo "   Frontend  → http://localhost:5173"
	@echo "   Backend   → http://localhost:3001"
	@echo "   Health    → http://localhost:3001/health"
	@echo ""
	@echo "Run 'make logs' to watch logs, 'make db-studio' to open DB GUI"

down:
	@echo "🛑 Stopping VitaPlate..."
	docker compose down

restart:
	docker compose restart backend

logs:
	docker compose logs -f backend frontend

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

# ── Database ──────────────────────────────────────────────────────────────────

migrate:
	@echo "📦 Running DB migrations..."
	docker compose exec backend npx prisma db push

db-studio:
	@echo "🗄️  Opening Prisma Studio at http://localhost:5555"
	docker compose --profile tools up prisma-studio -d
	@sleep 2
	open http://localhost:5555 || xdg-open http://localhost:5555 || echo "Open http://localhost:5555"

seed:
	@echo "🌱 Seeding meal plan templates (~$8 one-time AI cost)..."
	docker compose exec backend node src/jobs/seedTemplates.js

reset:
	@echo "⚠️  Resetting database (all data will be lost)..."
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker compose down -v
	docker compose up -d
	@echo "✅ Database reset complete"

# ── Dev Utilities ─────────────────────────────────────────────────────────────

shell-backend:
	docker compose exec backend sh

shell-db:
	docker compose exec postgres psql -U vitaplate -d vitaplate

shell-redis:
	docker compose exec redis redis-cli -a vitaplate_redis_secret

status:
	docker compose ps

build:
	docker compose build --no-cache

# ── Production ────────────────────────────────────────────────────────────────

prod-up:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down
