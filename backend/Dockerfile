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

# ── Development ────────────────────────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
EXPOSE 3001
CMD ["node", "--watch", "src/index.js"]

# ── Production ─────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "src/index.js"]
