# ── Stage 1: build the Angular app ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build for production (SSR output)
RUN npm run build

# ── Stage 2: run the SSR server ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4200

# Only the compiled dist + a minimal express server are needed at runtime
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev

EXPOSE 4200

CMD ["node", "dist/DevopsMastering/server/server.mjs"]
