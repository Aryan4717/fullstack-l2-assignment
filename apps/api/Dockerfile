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
RUN pnpm --filter @repo/database run build

RUN pnpm --filter @repo/api run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

# Install prisma CLI globally so it's always on PATH regardless of pnpm symlink issues
RUN npm install -g prisma@5.22.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api/dist ./apps/api/dist

COPY package.json pnpm-workspace.yaml* turbo.json ./
COPY apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["sh", "-c", "prisma migrate deploy --schema /app/packages/database/prisma/schema.prisma && node /app/packages/database/dist/prisma/seed.js && node --require ./dist/instrument.js dist/server.js"]
