# AI-Assisted Content Moderation Platform

A production-grade full-stack web application for moderating user-submitted articles and comments with AI-powered toxicity and sentiment analysis.

## Live URL

> **[https://your-app.railway.app](https://your-app.railway.app)**  
> *(Update with actual deployment URL after deploying to Railway)*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| AI | OpenAI GPT-4o-mini (Chat Completions) |
| Infrastructure | Docker, Docker Compose, Railway |
| Testing | Vitest, Supertest |

---

## Local Setup

### Prerequisites
- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker & Docker Compose

### Option A — Docker Compose (recommended, runs everything)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/fullstack-l2-assignment.git
cd fullstack-l2-assignment

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in JWT_SECRET, JWT_REFRESH_SECRET, OPENAI_API_KEY

# 3. Start all services (Postgres, API on :4000, Web on :3000)
docker compose up --build

# 4. Access the app
open http://localhost:3000
```

### Option B — Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit DATABASE_URL to point to your local Postgres instance

# Run database migrations and seed
cd packages/database
pnpm exec prisma migrate deploy
pnpm exec prisma db seed

# Start both apps concurrently (from root)
pnpm dev
```

---

## Seeded Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@platform.com | admin123 | ADMIN |
| mod1@platform.com | mod123 | MODERATOR |
| mod2@platform.com | mod123 | MODERATOR |

Seed 20 test submissions by calling:
```bash
POST /api/admin/seed
Authorization: Bearer <admin-token>
```

---

## Running Tests

```bash
# From root — runs all tests across workspaces
pnpm test

# From API workspace only
cd apps/api
npm run test

# With coverage report
npm run test:coverage
```

The test suite covers:
- AuthService: login success, wrong password, user not found
- SubmissionService: create, status transitions, invalid transition guard
- AnalysisService: cache hit, cache miss, graceful fallback on provider failure
- Integration: auth routes (200/401), submission routes (CRUD/403), analysis routes (cache/404/401)
- Repository: status filter, title search, pagination offset

---

## API Reference

| Method | Endpoint | Auth | Role | Description |
|--------|---------|------|------|-------------|
| POST | `/api/auth/login` | No | — | Login, returns JWT in httpOnly cookie + body |
| POST | `/api/auth/logout` | Yes | Any | Clears auth cookies |
| GET | `/api/submissions` | Yes | Any | List with `?status=&type=&search=&page=&limit=` |
| GET | `/api/submissions/:id` | Yes | Any | Single submission with analysis + audit log |
| POST | `/api/submissions` | Yes | Any | Create submission (status defaults to PENDING) |
| PATCH | `/api/submissions/:id/status` | Yes | Any | Approve/reject (PENDING only) |
| POST | `/api/analyse/:id` | Yes | Any | Run AI analysis (or return cached result) |
| GET | `/api/stats` | Yes | Any | Aggregate counts |
| POST | `/api/admin/seed` | Yes | ADMIN | Seed 20 test submissions |

All responses follow the shape:
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "...", "error": "..." }
```

---

## Architecture Decisions

### Authentication: JWT (not Session)
**Choice:** JWT with short-lived access tokens (15 min) and long-lived refresh tokens (7 days), both stored in `httpOnly`, `secure`, `sameSite=strict` cookies.

**Rationale:** The frontend (Next.js on port 3000) and the API (Express on port 4000) are separate services. Session-based auth would require shared storage (e.g., Redis) adding infrastructure complexity. JWT is stateless and fits well with this architecture.

**Trade-off:** A compromised access token cannot be instantly invalidated before its TTL expires. Mitigated by the 15-minute TTL and the fact that tokens are in `httpOnly` cookies (not accessible to JavaScript, reducing XSS risk).

### Monorepo: Turborepo + pnpm Workspaces
Three packages: `apps/api`, `apps/web`, `packages/database`. The database package owns the Prisma schema and is imported by the API. This keeps schema migrations centralised and allows the frontend to import shared TypeScript types in the future.

### Clean Architecture: Repository → Service → Controller
Business logic never touches Prisma directly. The `SubmissionService` holds the status-transition guard; `AnalysisService` holds the cache-first and graceful-fallback logic. Controllers are thin wrappers that call services and format responses.

### AI Strategy Pattern
`IAnalysisProvider` is an interface. `OpenAIProvider` is one implementation. If the project needs to swap to a different LLM (Claude, Gemini), only the provider class changes — `AnalysisService` is untouched. This satisfies OCP (Open/Closed Principle).

---

## Assumptions

1. The `/api/submissions/:id/status` endpoint is accessible to both ADMIN and MODERATOR roles (the spec says "Moderator+" which I interpreted as both roles).
2. The `/api/stats` endpoint is a separate route; the spec's endpoint reference lists it under `/api/stats` not `/api/submissions/stats`.
3. Text search is performed on the `title` field only (as specified), using PostgreSQL `ILIKE` via Prisma's `contains` + `mode: insensitive`.
4. The AI prompt is stored in `rawPrompt` of the `AIAnalysis` record for auditability.
5. Re-running analysis on an already-analysed submission is supported via "Re-run Analysis" on the UI, which is handled server-side by the cache-hit logic (returns cached). A forced re-run would require deleting the cached record — left as a known limitation.

---

## Known Limitations

- **Token invalidation on logout:** The access token cookie is cleared, but if a token was copied and used directly, it remains valid until TTL expiry. Production would add a token blocklist (e.g., Redis set).
- **Forced re-analysis:** Clicking "Trigger AI Analysis" on an already-analysed submission returns the cached result. To force a fresh analysis, the cached record would need to be deleted — not exposed via UI.
- **No real-time updates:** The dashboard does not use WebSockets. Status changes by other moderators require a manual page refresh.

---

## AI in My Workflow

I used Claude Code (claude.ai/code) extensively throughout this assignment. For the initial architecture planning, it helped me quickly compare JWT vs session-based auth trade-offs and recommended the Repository + Strategy pattern combination that maps cleanly onto the SOLID principles the assignment requires.

Specific speed improvements: generating the Prisma schema boilerplate (enums, relations, indexes) took minutes instead of half an hour; Vitest mock setup for Prisma is notoriously verbose and the AI produced a correct mock structure on the first attempt.

One example where the suggestion was wrong: Claude initially suggested storing the access token in `localStorage` in the frontend, which is a well-known XSS vulnerability. I caught this immediately, rejected the suggestion, and switched to `httpOnly` cookies — which is the correct, secure approach. This reinforced that AI suggestions for security-sensitive code must always be critically reviewed rather than applied blindly. The AI is a speed multiplier, not a replacement for security judgment.
