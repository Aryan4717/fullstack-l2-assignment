# AI-Assisted Content Moderation Platform

A production-grade full-stack web application for moderating user-submitted articles and comments with AI-powered toxicity and sentiment analysis.

## Live URL

[https://repoweb-production-4b94.up.railway.app](https://repoweb-production-4b94.up.railway.app)

## Services

![Services](assets/services.png)

The platform runs as three isolated containers on Railway, each with a single responsibility and a hard boundary between them.

**Postgres** is the source of truth. PostgreSQL 16 backed by a persistent volume so data survives deploys and restarts. The schema is managed entirely through Prisma migrations — the API container runs `prisma migrate deploy` on every startup, which means schema and application code are always in lockstep with zero manual intervention. Five tables: `users`, `submissions`, `ai_analyses`, `moderation_logs`, and `audit_logs`. No direct external access — only the API talks to it.

**@repo/api** owns all business logic and is the only service that touches the database. Express.js on port 4000 with a strict layered architecture: routes → controllers → services → repositories → Prisma. Authentication is JWT-based with access tokens (15 min) and refresh tokens (7 days), both stored in `httpOnly` cookies — inaccessible to JavaScript, eliminating the XSS attack surface entirely. Status transitions are wrapped in `prisma.$transaction` so a submission update and its audit log entry are atomic — either both commit or neither does. The AI analysis layer calls OpenAI, caches the result immediately, and has a graceful fallback that stores `errorFlag: true` rather than surfacing a 500 to the user. Every significant action — login, failed auth, 403, submission create, status change, AI trigger, admin seed — is written to the `audit_logs` table with IP address, user-agent, and timestamp.

**@repo/web** is a pure presentation layer — it owns no state and holds no secrets. Next.js 14 App Router with server components for data fetching and client components only where interactivity is required. The JWT lives in an `httpOnly` cookie the browser cannot read, so client-side code cannot attach it to outbound requests. The solution: all mutation requests go through Next.js server-side route handlers (`/api/proxy/*`) which read the cookie server-side and forward it as a `Bearer` token to the API. The browser never sees the token. Data flows one way — server components fetch on the server, render HTML, ship it to the client.



---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| AI | OpenAI GPT-4o-mini (Chat Completions) |
| Observability | Langfuse (LLM tracing), Sentry (error monitoring, performance, session replay) |
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
git clone https://github.com/Aryan4717/fullstack-l2-assignment
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

### Sentry — Application Error Monitoring & Performance (Bonus)
Sentry is integrated across the entire monorepo (Express API + Next.js frontend). This was not required by the assignment spec — it was added to demonstrate production-grade application observability.

**Why Sentry?**
In production, errors are invisible without an error monitoring tool. Langfuse tells you what the AI did; Sentry tells you what the application did — unhandled exceptions, slow database queries, front-end crashes, and full session replays showing exactly what a user did before something broke.

**What is monitored:**

| Signal | Detail |
|--------|--------|
| **Error monitoring** | All unhandled Express exceptions and React component errors captured with full stack traces |
| **Performance tracing** | Express route transactions with Prisma DB spans (`db.submission.list`, `db.analysis.*`) |
| **Session replay** | 10% of browser sessions recorded; 100% of sessions that hit a JavaScript error |
| **User context** | `Sentry.setUser({ id, email, role })` set on every authenticated request |
| **Sensitive data scrubbing** | `beforeSend` strips `request.cookies` and `Authorization` headers before any event is shipped |
| **Smart error filtering** | 4xx `AppError`s (auth, validation) are breadcrumbed only — 5xx and unexpected errors are fully captured |
| **Error boundaries** | `global-error.tsx` (root) and `dashboard/error.tsx` catch React render errors |

**Graceful degradation:** If `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are not set, Sentry is never initialised and the app works normally without any Sentry credentials.

**Architecture:** The API Sentry client is a singleton in `apps/api/src/lib/sentry.client.ts`, mirroring the Langfuse singleton pattern exactly. `initSentry()` is called as the very first import in `server.ts` so Node.js instrumentation patches HTTP, Express, and Prisma automatically.

---

### Langfuse — LLM Observability (Bonus)
Langfuse is integrated as an observability layer over every AI moderation call. This was not required by the assignment spec — it was added to demonstrate production-grade LLM engineering awareness.

**Why Langfuse?**
In production, AI calls are opaque — you cannot see what prompt was sent, what the model returned, how long it took, or whether quality is degrading over time. Langfuse solves this by capturing every LLM interaction as a structured, searchable trace.

**What is being traced:**

| Signal | Detail |
|--------|--------|
| **Trace** | One per moderation request — tagged with `ContentType` (ARTICLE / COMMENT) |
| **Generation** | The OpenAI API call — full input prompt, model name (`gpt-4o-mini`), raw JSON output, latency |
| **Score: `toxicity`** | `toxicityScore ÷ 10` (normalised 0–1) — lets you chart average toxicity over time in Langfuse UI |
| **Tags** | Sentiment (`POSITIVE` / `NEUTRAL` / `NEGATIVE`) and recommendation (`APPROVE` / `REVIEW` / `REJECT`) per trace |
| **Error tracking** | When OpenAI fails and the fallback fires, the trace is marked with `error: true` metadata |

**Graceful degradation:** If `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` are not set, the client returns `null` and all tracing is silently skipped — the app works normally without any Langfuse credentials.

**Architecture:** The Langfuse client is a singleton in `apps/api/src/lib/langfuse.client.ts`. The `AnalysisService` calls it — no changes were made to `IAnalysisProvider`, `OpenAIProvider`, or any other interface, keeping the integration non-invasive and SOLID-compliant.

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





---

## Database Schema

> All 5 tables, columns, types, and relationships — derived directly from `packages/database/prisma/schema.prisma`.

```mermaid
erDiagram
    users {
        string id PK
        string email UK
        string passwordHash
        enum role "ADMIN | MODERATOR"
        datetime createdAt
    }

    submissions {
        string id PK
        string title
        string body
        string authorName
        enum type "ARTICLE | COMMENT"
        enum status "PENDING | APPROVED | REJECTED"
        datetime submittedAt
    }

    moderation_logs {
        string id PK
        string submissionId FK
        string moderatorId FK
        enum action "APPROVED | REJECTED"
        string reason
        datetime createdAt
    }

    ai_analyses {
        string id PK
        string submissionId FK "UNIQUE"
        float toxicityScore
        enum sentiment "POSITIVE | NEUTRAL | NEGATIVE"
        string summary
        enum recommendation "APPROVE | REVIEW | REJECT"
        string rawPrompt
        boolean errorFlag
        datetime createdAt
    }

    audit_logs {
        string id PK
        string userId FK "nullable"
        string userEmail
        string userRole
        enum action "LOGIN | LOGIN_FAILED | LOGOUT | AUTH_FAILED | UNAUTHORIZED_ACCESS | SUBMISSION_CREATED | SUBMISSION_STATUS_CHANGED | AI_ANALYSIS_TRIGGERED | AI_ANALYSIS_FAILED | ADMIN_SEED"
        string entityType
        string entityId
        json oldValues
        json newValues
        string ipAddress
        string userAgent
        boolean success
        json metadata
        datetime createdAt
    }

    users ||--o{ moderation_logs : "moderates"
    users ||--o{ audit_logs : "tracked in"
    submissions ||--o{ moderation_logs : "has logs"
    submissions ||--o| ai_analyses : "analysed by"
```

### Relationships & Constraints

| Relationship | Cardinality | On Delete |
|---|---|---|
| `users` → `moderation_logs` | One-to-Many | **RESTRICT** — user cannot be deleted while moderation logs exist |
| `users` → `audit_logs` | One-to-Many | **SET NULL** — audit trail is retained even after user deletion |
| `submissions` → `moderation_logs` | One-to-Many | **CASCADE** — logs are deleted when submission is deleted |
| `submissions` → `ai_analyses` | One-to-One (optional) | **CASCADE** — analysis is deleted when submission is deleted |

---

## Data Flow

How data moves through the system for each core operation.

### 1. Login

```mermaid
flowchart TD
    A[POST /api/auth/login] --> B[READ users\nWHERE email = ?]
    B --> C{Password valid?}
    C -- No --> D[WRITE audit_logs\naction = LOGIN_FAILED\nsuccess = false]
    C -- Yes --> E[Sign JWT in memory\naccess 15m · refresh 7d]
    E --> F[Set httpOnly cookies\non response]
    F --> G[WRITE audit_logs\naction = LOGIN\nsuccess = true]
```

### 2. Create Submission

```mermaid
flowchart TD
    A[POST /api/submissions] --> B[authenticate middleware\nverify JWT from cookie]
    B --> C[WRITE submissions\nstatus = PENDING by default]
    C --> D[WRITE audit_logs\naction = SUBMISSION_CREATED\nnewValues = title · type · authorName]
```

### 3. Trigger AI Analysis

```mermaid
flowchart TD
    A[POST /api/analyse/:id] --> B[READ ai_analyses\nWHERE submissionId = ?]
    B --> C{Already cached?}
    C -- Yes --> D[Return cached result\nno re-analysis]
    C -- No --> E[READ submissions\nWHERE id = ?]
    E --> F[Call OpenAI API\ngpt-4o-mini]
    F --> G{Provider success?}
    G -- Yes --> H[WRITE ai_analyses\nerrorFlag = false\nreal scores]
    G -- No --> I[WRITE ai_analyses\nerrorFlag = true\nfallback values]
    H --> J[WRITE audit_logs\naction = AI_ANALYSIS_TRIGGERED]
    I --> K[WRITE audit_logs\naction = AI_ANALYSIS_FAILED]
```

### 4. Update Submission Status

```mermaid
flowchart TD
    A[PATCH /api/submissions/:id/status] --> B[READ submissions\nWHERE id = ?]
    B --> C{status == PENDING?}
    C -- No --> D[Throw\nInvalidStatusTransitionError]
    C -- Yes --> E[prisma.$transaction\nboth or neither]
    E --> F[UPDATE submissions\nSET status = APPROVED / REJECTED]
    E --> G[WRITE moderation_logs\nsubmissionId · moderatorId · action · reason]
    F & G --> H[WRITE audit_logs\naction = SUBMISSION_STATUS_CHANGED\noldValues · newValues]
```

### 5. Admin Seed

```mermaid
flowchart TD
    A[POST /api/admin/seed] --> B[authorize ADMIN role]
    B --> C[Promise.all — 20 parallel inserts\nWRITE submissions\nstatus = PENDING]
    C --> D[WRITE audit_logs\naction = ADMIN_SEED\nnewValues = count 20]
```

---