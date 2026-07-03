# ─────────────────────────────────────────────────────────────────────────────
# HR Portal — Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help build up down restart logs shell-backend shell-db \
        migrate seed clean prune ps

# Default target
help:
	@echo ""
	@echo "  HR Portal Docker commands"
	@echo "  ─────────────────────────────────────────────"
	@echo "  make build          Build all images"
	@echo "  make up             Start all services (detached)"
	@echo "  make down           Stop and remove containers"
	@echo "  make down-v         Stop, remove containers + DB volume"
	@echo "  make restart        Rebuild and restart all services"
	@echo "  make logs           Tail logs for all services"
	@echo "  make logs-backend   Tail backend logs only"
	@echo "  make logs-frontend  Tail frontend logs only"
	@echo "  make ps             Show running containers"
	@echo "  make shell-backend  Open shell inside backend container"
	@echo "  make shell-db       Open MySQL shell"
	@echo "  make migrate        Run Alembic migrations manually"
	@echo "  make seed           Run seed script manually"
	@echo "  make clean          Remove stopped containers + dangling images"
	@echo "  make prune          Full Docker system prune (use with care)"
	@echo ""

# ── Build ──────────────────────────────────────────────────────────────────────
build:
	docker compose build

build-backend:
	docker compose build backend

build-frontend:
	docker compose build frontend

# ── Lifecycle ─────────────────────────────────────────────────────────────────
up:
	docker compose up -d

up-build:
	docker compose up --build -d

down:
	docker compose down

down-v:
	docker compose down -v

restart:
	docker compose down
	docker compose up --build -d

# ── Logs ──────────────────────────────────────────────────────────────────────
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f db

# ── Status ────────────────────────────────────────────────────────────────────
ps:
	docker compose ps

# ── Exec ──────────────────────────────────────────────────────────────────────
shell-backend:
	docker compose exec backend sh

shell-db:
	docker compose exec db mysql -u hr_user -phr_password hr_portal

# ── Database operations ────────────────────────────────────────────────────────
migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python seed.py

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	docker container prune -f
	docker image prune -f

prune:
	@echo "⚠️  This removes ALL unused Docker data. Press Ctrl-C to cancel."
	@sleep 3
	docker system prune -af --volumes
