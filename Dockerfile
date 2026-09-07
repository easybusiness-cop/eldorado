# ==============================================================================
# Rufflo Agent Fleet - Multi-Stage Container Runtime
# Optimized for isolated agent simulation, testing, and production deployment
# ==============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Install build prerequisites
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build Vite frontend and bundled backend server into dist/
RUN npm run build

# Prune dev dependencies for lean runtime
RUN npm prune --production

# ==============================================================================
# Runner Stage
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: Run as non-root node user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 rufflo

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/company_db.json* ./

# Set ownership
RUN chown -R rufflo:nodejs /app

USER rufflo

# Port 3000 is the designated application ingress port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Launch compiled CommonJS server
CMD ["node", "dist/server.cjs"]
