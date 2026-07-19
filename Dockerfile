# ConVol production image.
#
# Multi-stage build:
#   1. deps    — install all npm dependencies (including devDeps needed for build)
#   2. builder — run `next build`
#   3. runner  — copy only what's needed to run; drop devDeps; run as non-root
#
# The runtime stage is intentionally full-node_modules (not Next.js standalone
# output) because ConVol doesn't set `output: 'standalone'` in next.config.ts
# and we don't want this Dockerfile change to depend on a config change.
# Switching to standalone output is a follow-up optimization, not blocking.

# ---- 1. Dependencies ------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Install with a clean, reproducible resolution based on the lockfile.
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2. Build -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js reads NEXT_PUBLIC_* at build time; downstream compose stack is
# expected to provide them via --build-arg or an .env file at build.
RUN npm run build

# ---- 3. Runtime -----------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Non-root user. Alpine's node image ships with a `node` user (uid 1000).
USER node

COPY --chown=node:node --from=builder /app/public         ./public
COPY --chown=node:node --from=builder /app/.next          ./.next
COPY --chown=node:node --from=builder /app/node_modules   ./node_modules
COPY --chown=node:node --from=builder /app/package.json   ./package.json
COPY --chown=node:node --from=builder /app/migrations     ./migrations

EXPOSE 3000

# Simple readiness probe — the compose file also declares a healthcheck so
# other services can depend_on this one with condition: service_healthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["npm", "start"]
