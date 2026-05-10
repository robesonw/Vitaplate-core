# ── Base ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install deps first (layer cached unless package.json changes)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ── Production ─────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
EXPOSE 3001

# Schema sync runs in Railway preDeployCommand (see railway.json) so the
# server can bind immediately and pass /health checks.
CMD ["node", "src/index.js"]
