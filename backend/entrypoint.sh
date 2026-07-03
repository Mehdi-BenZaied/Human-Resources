#!/bin/sh
# Exit immediately on any error
set -e

echo ""
echo "================================================"
echo "  HR Portal API — Container startup"
echo "================================================"

# Wait for MySQL to be fully ready (compose healthcheck should handle this,
# but an extra guard avoids rare race conditions on slow hosts)
echo "⏳  Verifying database connectivity…"
python - <<'EOF'
import time, sys
from sqlalchemy import create_engine, text
from app.core.settings import settings

for attempt in range(1, 31):
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"✅  Database ready (attempt {attempt})")
        sys.exit(0)
    except Exception as e:
        print(f"   [{attempt}/30] Waiting for DB… ({e})")
        time.sleep(2)

print("❌  Database not reachable after 60s — aborting.")
sys.exit(1)
EOF

echo ""
echo "⏳  Running Alembic migrations…"
alembic upgrade head
echo "✅  Migrations complete"

echo ""
echo "🌱  Seeding database (no-op if already seeded)…"
python seed.py || true

echo ""
echo "🚀  Starting FastAPI on 0.0.0.0:${PORT:-4000}"
echo "    Docs  →  http://localhost:${PORT:-4000}/api/docs"
echo "    Health→  http://localhost:${PORT:-4000}/api/health"
echo "================================================"
echo ""

exec uvicorn main:app \
    --host 0.0.0.0 \
    --port "${PORT:-4000}" \
    --workers 2 \
    --no-access-log
