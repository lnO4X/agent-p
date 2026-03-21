# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# ── Stage 2: Build ──
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# sharp needs these for Alpine
RUN apk add --no-cache python3 make g++ && \
    npm rebuild sharp

# Build args for NEXT_PUBLIC_* (inlined at build time by Next.js)
ARG NEXT_PUBLIC_APP_NAME=GameTan
ARG NEXT_PUBLIC_APP_URL=https://game.weda.ai
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Turbopack build
RUN npm run build

# ── Stage 3: Production runner ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install curl for healthcheck
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
# next/og (satori) requires files not traced by standalone
COPY --from=builder /app/node_modules/next/dist/compiled/@vercel/og/satori \
  ./node_modules/next/dist/compiled/@vercel/og/satori
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets (covers, etc.)
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime env vars are injected via docker-compose env_file, NOT baked into image.
# Only NEXT_PUBLIC_* vars need to be set at build time (they get inlined by Next.js).

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/auth/captcha || exit 1

CMD ["node", "server.js"]
