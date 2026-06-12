# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-workspace.yaml* pnpm-lock.yaml* turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY packages/database ./packages/database
COPY apps/api ./apps/api

RUN cd packages/database && pnpm exec prisma generate

RUN pnpm --filter @repo/api run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api/dist ./apps/api/dist

COPY package.json pnpm-workspace.yaml* turbo.json ./
COPY apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 4000

CMD sh -c "npx prisma migrate deploy --schema ../../packages/database/prisma/schema.prisma && node dist/server.js"
