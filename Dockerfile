# ==============================================================================
#  NICOMAN TOURISM — MULTI-STAGE PRODUCTION DOCKERFILE
# ==============================================================================
#  Freezes Node.js LTS, Alpine Linux, and dependencies for 100% long-term stability.
#  Builds both the main client and booking-demo sub-app, then runs the Express server.
# ==============================================================================

# ── STAGE 1: Build Frontend Assets ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root, client, booking-demo, and server package manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY booking-demo/package*.json ./booking-demo/
COPY server/package*.json ./server/

# Install dependencies across all workspaces
RUN npm install
RUN npm --prefix client install
RUN npm --prefix booking-demo install
RUN npm --prefix server install

# Copy application source code
COPY . .

# Build both booking-demo and main client, merging into client/dist
RUN node build.js

# ── STAGE 2: Lightweight Production Runtime ──────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl for container healthchecks
RUN apk add --no-cache curl

# Copy production dependencies and server code
COPY package*.json ./
COPY server/package*.json ./server/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server ./server

# Copy compiled frontend distribution
COPY --from=builder /app/client/dist ./client/dist

# Expose application port
EXPOSE 5000

# Built-in container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the full-stack server
CMD ["node", "server/server.js"]
