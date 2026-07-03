# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
#   Installs all Python dependencies into an isolated virtual environment.
#   A full slim image is used here so build tools (gcc, libssl-dev…) are
#   available for compiled wheels (cryptography, bcrypt).
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

# Build-time system deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        gcc \
        libffi-dev \
        libssl-dev \
        pkg-config \
 && rm -rf /var/lib/apt/lists/*

# Isolated virtualenv — easy to copy as a single directory
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Layer-cache: reinstall only when requirements.txt changes
COPY requirements.txt .
RUN pip install --upgrade pip --no-cache-dir \
 && pip install --no-cache-dir -r requirements.txt


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime
#   Copies only the virtualenv + application code.
#   No gcc, no -dev headers, no pip cache → smallest possible image.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/venv/bin:$PATH" \
    APP_ENV=production \
    PORT=4000

# Runtime-only shared libraries (no -dev packages)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        libssl3 \
        libffi8 \
        curl \
 && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --gid 1001 appgroup \
 && useradd  --uid 1001 --gid appgroup --shell /bin/sh --create-home appuser

WORKDIR /app

# ① Copy the virtualenv from the builder stage
COPY --from=builder /venv /venv

# ② Copy application source (owned by non-root user)
COPY --chown=appuser:appgroup . .

# ③ Make entrypoint executable BEFORE switching to non-root
RUN chmod +x /app/entrypoint.sh

USER appuser

EXPOSE 4000

# Healthcheck — curl is installed in the runtime stage
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:4000/api/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
