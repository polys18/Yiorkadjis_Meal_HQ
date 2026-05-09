# Meal HQ

A small family meal voting app. Eleni proposes lunch and dinner options each day; the family votes; Eleni decides what to cook based on the tally.

## Local development

Requirements: Node ≥ 20, pnpm ≥ 9, Docker.

```bash
pnpm install
docker compose up -d              # local Postgres on port 5433
pnpm db:migrate
pnpm db:seed                      # seeds 5 family members with PIN 0000
pnpm dev                          # http://localhost:3000
```

Log in with any family name and PIN `0000`. Eleni can reset PINs from `/admin`.

## Tests

```bash
pnpm test                         # unit + integration (Vitest, ~3s)
pnpm e2e                          # Playwright E2E (~12s, runs its own dev server on :3001)
```

## Deployment (Vercel + Neon)

### Region pinning matters

The household lives in Greece (`TZ=Europe/Athens`). Pin both Neon and Vercel to **EU (Frankfurt)** so the database and API serverless functions are co-located. Family members in other timezones still see the app feel snappy because static assets are served from the Vercel edge.

### One-time setup

1. **Neon project** in `eu-central-1` (Frankfurt). Note the pooled connection string.
2. **Apply schema and seed** to the Neon DB from your laptop:
   ```bash
   DATABASE_URL='<neon-url>' pnpm db:migrate
   DATABASE_URL='<neon-url>' pnpm db:seed
   ```
3. **Push this repo to GitHub.**
4. **Import on Vercel.** Set the deployment region to **Frankfurt (fra1)**.
5. **Vercel environment variables** (Production):
   | Var | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `COOKIE_SECRET` | 32-byte hex; generate with `openssl rand -hex 32` |
   | `BCRYPT_ROUNDS` | `12` |
   | `TZ` | `Europe/Athens` |
6. **Deploy.** First production build kicks off automatically.
7. **First login.** Open the deployed URL on a phone, sign in as Eleni with PIN `0000`, then go to `/admin` and set real PINs for everyone.

### What's deployed

- Next.js 16 App Router with Node.js runtime middleware (the session HMAC uses `node:crypto`)
- 5 protected pages (`/`, `/round/[id]`, `/round/new`, `/history`, `/admin`)
- 9 API routes (auth, rounds CRUD, voting, options edit, SSE stream, admin)
- PWA manifest + service worker (production-only); installable to home screen on iOS/Android

## Project layout

```
src/
├── app/              # routes (UI + API)
├── components/       # UI components
├── db/               # Drizzle schema, client, migrations
├── lib/
│   ├── auth/         # PIN, session cookie, cooldown, current-user
│   ├── rounds/       # queries, mutations, voting
│   ├── events/       # in-process pub/sub for SSE
│   ├── audit/        # audit log writer
│   └── validation/   # zod schemas
├── tests/            # Vitest helpers + DB fixtures
└── middleware.ts     # auth gate
e2e/                  # Playwright specs
docs/superpowers/     # design spec + implementation plan
```

## Reference docs

- **Design spec:** `docs/superpowers/specs/2026-05-08-meal-hq-design.md`
- **Implementation plan:** `docs/superpowers/plans/2026-05-08-meal-hq.md`
