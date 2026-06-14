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

# Run as non-root user — prevents container escape privilege escalation
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs nodeuser
USER nodeuser

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["sh", "-c", "prisma migrate deploy --schema /app/packages/database/prisma/schema.prisma && node /app/packages/database/dist/prisma/seed.js && node --require ./dist/instrument.js dist/server.js"]
