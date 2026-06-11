# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml* pnpm-lock.yaml* turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client
RUN cd packages/database && pnpm exec prisma generate

# Build TypeScript
RUN pnpm --filter @repo/api run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-workspace.yaml* pnpm-lock.yaml* ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY packages/database/prisma ./packages/database/prisma

WORKDIR /app/apps/api

EXPOSE 4000

CMD sh -c "npx prisma migrate deploy --schema ../../packages/database/prisma/schema.prisma && node dist/server.js"
