# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-workspace.yaml* pnpm-lock.yaml* turbo.json ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web

# NEXT_PUBLIC_* vars are baked in at build time — must be passed as build args
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm --filter @repo/web run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["node", "server.js"]
