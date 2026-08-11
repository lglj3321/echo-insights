# Cloud architecture

Echo Insights runs as a serverless application on Vercel with a managed
PostgreSQL database on Neon. This document records the deployment topology and
the reasoning behind the decisions that shaped it — most of them forced by the
serverless execution model rather than chosen freely.

## Topology

```text
                    ┌──────────────────────────────┐
   Consumer         │        Vercel Edge CDN       │
   (phone, QR) ────▶│  static client bundle        │
                    │  SPA fallback rewrite        │
   Operator         └──────────────┬───────────────┘
   (dashboard) ────▶               │ /api/*
                                   ▼
                    ┌──────────────────────────────┐
                    │  Vercel Serverless Function  │
                    │  api/index.ts                │
                    │  ├─ cold start: registerRoutes│
                    │  └─ warm: reuse Express app  │
                    └──────────────┬───────────────┘
                                   │ WebSocket
                                   ▼
                    ┌──────────────────────────────┐
                    │   Neon PostgreSQL (pooled)   │
                    │   schema managed by Drizzle  │
                    └──────────────────────────────┘
```

Two entry points sit on top of one Express application:

| Entry | Environment | Responsibility |
| --- | --- | --- |
| `api/index.ts` | Vercel | Wraps the app as a serverless handler. Never listens on a port. |
| `server/dev.ts` | Local | Listens on a port and attaches Vite in middleware mode for HMR. |

All routing, storage and business logic live in `api/_lib`. Keeping both entry
points thin is what stops local and deployed behaviour from drifting apart.

## Decisions

### 1. Neon's serverless driver over a conventional PostgreSQL client

**Context.** Serverless functions are frozen between invocations and may be
created and destroyed per request. A conventional `pg` client opens a TCP
connection and expects to pool it across a long-lived process.

**Problem.** That pool cannot survive a freeze. Each cold start would open a new
connection, and a traffic spike would exhaust the database's connection limit
long before it exhausted compute.

**Decision.** Use `@neondatabase/serverless`, which reaches PostgreSQL over a
WebSocket to Neon's proxy, combined with Neon's pooled endpoint so connection
management happens server-side rather than in the function.

**Consequence.** The driver choice is dictated by the deployment target, not by
preference. It also means the local development path exercises the same driver,
so connection behaviour does not differ between environments. See
`api/_lib/db.ts`.

### 2. Route registration memoised across warm invocations

**Context.** `registerRoutes` is asynchronous and mounts roughly fifty handlers.
Express accumulates middleware; registering twice on the same instance would
stack duplicate handlers.

**Problem.** A serverless handler is invoked once per request, but the module
scope persists while the instance stays warm. Registering on every invocation
would both waste cold-start budget and duplicate routes.

**Decision.** `api/index.ts` guards registration with a module-scope flag, so
routes are mounted on the first request an instance handles and reused
thereafter.

**Consequence.** Cold starts pay the registration cost once; warm invocations
skip it. The trade-off is that module-scope state is per-instance and invisible
to other instances, which drives decision 3.

### 3. Stateless JWT authentication rather than server-side sessions

**Context.** The application originally used `express-session` with an
in-process `MemoryStore`.

**Problem.** That store lives in one function instance's memory. Vercel runs
many instances concurrently and recycles them freely, so a session written by
one instance is invisible to the next — users would appear randomly logged out.
Moving to a shared session store would add a second stateful dependency purely
to hold session data.

**Decision.** Issue signed JWTs (`api/_lib/jwt.ts`) and verify them per request
in `requireAuth`. Nothing about a session is stored server-side.

**Consequence.** Any instance can serve any request, which is the property
horizontal scaling requires. The cost is the usual one for stateless tokens:
revocation is not immediate, so token lifetime is kept short and re-issued on
login. The `express-session` dependency was removed.

### 4. SPA fallback handled at the CDN

**Context.** The client uses history-based routing, so `/qr-codes` and
`/survey/:id` are valid application routes with no corresponding file.

**Problem.** A static host returns 404 for those paths, which breaks deep links
— including the QR code links, which are the product's primary entry point.

**Decision.** `vercel.json` rewrites `/api/*` to the serverless function and
everything else to `index.html`, letting the client router resolve the path.

**Consequence.** Deep links and QR codes resolve correctly, and the rewrite
order matters: the API rule must precede the catch-all or every API call would
return the HTML shell. The same ordering constraint exists locally, which is why
`server/dev.ts` attaches Vite only after the API routes.

## Storage adapters

`IStorage` has two implementations, selected by whether `DATABASE_URL` is set:

- **PostgreSQL** via Drizzle — the deployed configuration.
- **In-memory** — used when no database is configured.

The in-memory adapter is a development and test convenience, not a deployment
mode: in a serverless environment its contents are per-instance and vanish on
recycle. It exists so the test suite can run without a database — CI needs no
secrets — and so the application can be started locally with one command.

## Schema management

`shared/schema.ts` declares the Drizzle tables once. `drizzle-zod` derives the
insert validators the API enforces, and the inferred types flow into the React
client, so a column change propagates to request validation and client types
together.

Schema changes reach the database through `npm run db:push`, which applies the
schema directly. This is convenient during development and unsuitable for
production data — generated, reviewable migrations are the outstanding item
before this could carry data that matters.

## Security posture

Authentication is JWT-based; authorization is enforced by `requireAuth` and
`requireProjectOwnership` in `api/_lib/auth.ts`.

An earlier revision applied these checks route by route and several mutating
endpoints were left without any middleware — a project could be renamed, and its
metrics modified or deleted, with no credentials at all. The checks are now
centralised in middleware, and `api/_lib/authorization.test.ts` covers each
previously reachable request so the gap cannot silently reopen.

The consumer survey path is deliberately anonymous: reading a project's survey
questions, recording a QR scan and submitting a response all work without an
account, because respondents are members of the public. Survey responses carry
no identifiers.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Deployment | Neon connection string; absent, the in-memory adapter is used |
| `JWT_SECRET` | Deployment | Token signing key |
| `JWT_EXPIRES_IN` | No | Token lifetime, default `7d` |
| `PORT` | No | Local dev server port, default `3000` |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | OpenAI-compatible endpoint for classification |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | No | Key for the above |

Without the AI variables, project classification falls back to keyword matching
rather than failing.

## Deploying

```bash
vercel link
vercel env add DATABASE_URL     # Neon pooled connection string
vercel env add JWT_SECRET       # openssl rand -base64 32
npm run db:push                 # apply the schema to Neon
vercel deploy --prod
```

`vercel.json` needs no build command: Vercel runs `npm run build` for the client
and compiles `api/index.ts` into a function automatically.
