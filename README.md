# Fastify-API — Technical Curator

A full-stack API management dashboard built with Fastify 5, Next.js 16, Neon Postgres, and Clerk Auth.

![Technical Curator](banner.html)

## Stack

| Layer | Tech |
|-------|------|
| **Backend** | Fastify 5, TypeScript, Drizzle ORM |
| **Database** | Neon Postgres (serverless) + Authorize RLS |
| **Auth** | Clerk (JWT + JWKS) |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS v4 |
| **Design** | "Technical Curator" — deep indigo, glassmorphism, editorial typography |

## Features

- **Live Dashboard** — Real-time metrics computed from actual API traffic (not mock data)
- **API Documentation** — Interactive endpoint docs with syntax-highlighted JSON examples
- **User Management** — Role-based access control (Admin, Developer, Viewer) with Clerk auth
- **Logs & Monitoring** — Request log stream, latency charts, critical event detection
- **Webhooks** — CRUD + HMAC-signed delivery for `log.error`, `log.slow`, `health.degraded`, `ingestion.error`
- **Log Ingestion** — `POST /api/ingest` to push external service logs (single or batch up to 100)
- **Rate Limiting** — 30 req/min reads, 10 req/min writes, auto-ban after 5 violations
- **Neon Authorize** — Row-Level Security policies enforced at the database level via Drizzle ORM
- **Immersive Sign-In** — Constellation animation + glassmorphism auth card

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Live metrics, sparklines, endpoints, status codes, instance health |
| `/api-docs` | Endpoint documentation, parameters, example payloads |
| `/users` | User table, role badges, stats, role definitions |
| `/logs` | Log stream, latency chart, critical events, payload inspector |
| `/settings` | API keys, webhook config, ingestion docs, rate limits |
| `/support` | FAQ, tech stack, documentation links |
| `/sign-in` | Immersive auth with constellation bg |

## API Endpoints

```
GET    /api/health          — System health with DB ping
GET    /api/metrics          — Live computed metrics (dashboard, status_codes, instance, users, logs)
GET    /api/metrics/sparkline — Time-series sparkline data (12 x 5min buckets)
GET    /api/endpoints        — Registered endpoints with live latency stats
POST   /api/endpoints        — Register new endpoint
GET    /api/users            — Paginated users (filterable by role, status)
POST   /api/users            — Create user
PATCH  /api/users/:id        — Update user
GET    /api/logs             — Paginated request logs (filterable by method, status, latency)
GET    /api/events           — Critical events derived from error/slow logs
GET    /api/auth/status      — Auth check
GET    /api/auth/me          — Current user profile (requires auth)
POST   /api/auth/sync        — Sync Clerk user to DB
GET    /api/webhooks         — List webhooks
POST   /api/webhooks         — Create webhook
PATCH  /api/webhooks/:id     — Update webhook
DELETE /api/webhooks/:id     — Delete webhook
POST   /api/webhooks/:id/test — Test webhook delivery
POST   /api/ingest           — Push external logs (single or batch)
GET    /api/ingest            — Query ingestion logs
GET    /api/ingest/stats      — Ingestion statistics
```

## Setup

### Prerequisites
- Node.js 18+
- Neon Postgres database
- Clerk account (optional, works without)

### Backend
```bash
cd backend
cp ../.env.example .env  # fill in DATABASE_URL, CLERK_DOMAIN, CLERK_SECRET_KEY
npm install
npm run db:seed          # seed users + endpoints
npm run dev              # starts on :4000
```

### Frontend
```bash
cd frontend
cp ../.env.example .env.local  # fill in Clerk keys
npm install
npm run dev              # starts on :3000
```

### Database
```bash
cd backend
npx tsx src/migrate.ts   # create tables
npx tsx src/seed.ts      # seed data
```

## Design System

The "Technical Curator" design system follows an editorial aesthetic:
- **Base**: Deep indigo `#0b1326`
- **Primary**: Soft blue `#b0c6ff`
- **Tertiary**: Electric green `#00e475`
- **No-Line Rule**: Borders are replaced by tonal background shifts
- **Glassmorphism**: Floating elements use backdrop-blur
- **Fonts**: Manrope (headlines), Inter (body), JetBrains Mono (code)

## License

MIT
