# Meal HQ — Family Meal Voting App (Design Spec)

**Date:** 2026-05-08
**Author:** Polys (with Claude)
**Status:** Approved (brainstorming) — pending implementation plan

## 1. Overview

A small web app for the Yiorkadjis family. Eleni (mom) creates meal options for **lunch** and **dinner** each day. Family members — Eleni, Polys, Mary, Fotini, Constantinos — vote on the options. Eleni closes voting and explicitly records what she's cooking, with discretion to cook **1 or 2 meals** when votes are split.

The app prioritizes warmth, simplicity, and zero-friction daily use over feature breadth.

## 2. Goals & Non-Goals

### Goals
- Phones, anywhere (internet-hosted, family logs in from any network)
- Open voting: each person sees who voted for what (live tally)
- Eleni keeps final say: she decides what to cook based on the tally
- Daily, twice-a-day cadence (lunch + dinner rounds)
- Polished "Warm Mediterranean" aesthetic; feels cared-for

### Non-Goals (deferred or out of scope)
- Push notifications (in-app banners only)
- Real OAuth / email auth (PIN per person is enough)
- Photos on meal options
- Meal autocomplete from history
- Meal favorites / weekly meal planning
- Multi-family / multi-tenancy
- Native iOS / Android apps (PWA "add to home screen" is sufficient)
- Internationalization (English only)

## 3. Family Members & Roles

5 seeded users, never created at runtime:

| Person | Role | Color |
|---|---|---|
| Eleni | `mom` | terracotta `#C77D49` |
| Mary | `kid` | rosewater `#D08585` |
| Polys | `kid` | olive `#7B8754` |
| Fotini | `kid` | mustard `#D4A847` |
| Constantinos | `kid` | midnight blue `#4A6B7C` |

Only `mom` can: create rounds, close rounds, decide what's being cooked, reset PINs, delete rounds.
Everyone (including Eleni) can: vote, change their vote before close, browse history.

## 4. Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui components
- **PWA:** Manifest + service worker so family can "add to home screen" and the app feels native-ish
- **Backend:** Next.js Route Handlers (no separate API server)
- **Database:** Neon Postgres + Drizzle ORM (typesafe queries)
- **Live updates:** Server-Sent Events on round detail; 5-second polling fallback
- **Auth:** Custom PIN flow; signed HTTP-only cookie holds `userId` (durable session)
- **Hosting:** Vercel free tier
- **Observability:** Vercel logs + a custom `audit_log` table for mutations

## 5. Data Model

```sql
users
  id            uuid pk
  name          text not null unique
  pin_hash      text not null         -- bcrypt
  role          text not null         -- 'mom' | 'kid'
  color         text not null         -- hex string
  created_at    timestamptz default now()
  -- 5 rows seeded at init time

rounds
  id                uuid pk
  meal_type         text not null     -- 'lunch' | 'dinner'
  date              date not null
  status            text not null     -- 'open' | 'closed' | 'deleted'
  opened_by         uuid not null references users(id)
  opened_at         timestamptz default now()
  closed_at         timestamptz
  cooking_decision  jsonb             -- array of meal_option ids: ["uuid1", "uuid2"]
  UNIQUE (date, meal_type) where status != 'deleted'  -- one active round per slot

meal_options
  id          uuid pk
  round_id    uuid not null references rounds(id) on delete cascade
  name        text not null            -- 1-60 chars
  note        text                     -- optional, max 100 chars
  position    int not null             -- ordering within the round
  created_at  timestamptz default now()

votes
  id              uuid pk
  round_id        uuid not null references rounds(id) on delete cascade
  meal_option_id  uuid not null references meal_options(id) on delete cascade
  user_id         uuid not null references users(id)
  created_at      timestamptz default now()
  updated_at      timestamptz default now()
  UNIQUE (round_id, user_id)           -- one vote per person per round; UPSERT on change

audit_log
  id          uuid pk
  user_id     uuid references users(id)
  action      text not null            -- 'create_round', 'vote', 'change_vote', 'close_round', 'reopen_round', 'delete_round', 'edit_options', 'reset_pin'
  round_id    uuid references rounds(id)
  payload     jsonb                    -- contextual data
  created_at  timestamptz default now()

login_attempts
  id            uuid pk
  user_id       uuid not null references users(id)
  successful    boolean not null
  attempted_at  timestamptz default now()
  -- queried for cooldown logic; periodically pruned
```

**Notes:**
- `cooking_decision` is JSONB on `rounds` (not a separate table). Closed rounds with a decision = "what got cooked"; matches the actual semantics cleanly.
- Unique partial index on `(date, meal_type)` excluding `deleted` so Eleni can soft-delete and re-create a round for the same slot.
- No "meal catalog" table — meal options are scoped per round. Future autocomplete (out of scope) would query historical `meal_options.name`.

## 6. Routes & Screens

| Route | Who | Purpose |
|---|---|---|
| `/login` | logged-out | Tap name → PIN keypad |
| `/` | everyone | Today: lunch + dinner cards |
| `/round/[id]` | everyone | Vote / see tally / (Eleni only) close |
| `/round/new?meal=lunch\|dinner` | Eleni only | Create round + add options |
| `/history` | everyone | Past rounds list, last 30 days |
| `/admin` | Eleni only | Reset PINs, view audit log |

**Today (`/`)** — primary landing screen:
- Stacked: Lunch card on top, Dinner card below (mobile-first)
- Each card has 3 states: `not-opened` (Eleni sees "+ Add lunch options"), `open` (running tally summary, "Tap to vote" CTA), `closed` ("Cooking: …" with collapsed breakdown)
- Soft banner if yesterday's round is still open: "Yesterday's dinner is still open — close it?"

**Round detail (`/round/[id]`)** — heart of the app:
- Header: "Dinner · Friday May 8" + status pill (Open / Closed)
- Each meal option as a tappable card row:
  - Name + note
  - Vote count + voter chips (avatars + colored initials) — open voting
  - Tap = cast or change your vote
  - Your current vote is visually distinct (filled border, subtle accent shade)
- **Live updates via SSE**: when anyone votes, the tally on every open phone updates within ~1 second
- For Eleni when status=open: floating "**Close & decide cooking**" button at bottom; an "Edit options" affordance lets her add new meal options or remove existing ones (with confirm if votes exist) without recreating the round
- For Eleni when status=closed: a "Reopen round" affordance (used rarely — for "I closed too early" cases). Reopening clears `closed_at` and `cooking_decision`, returns status to `open`

**Close & decide flow** (Eleni only):
1. Tap "Close & decide cooking"
2. Modal slides up: final tally, checkboxes next to each meal option
3. Eleni ticks 1 or 2 meals → "Confirm — I'm cooking these"
4. Round closes; cooking decision recorded; family sees "Cooking: …" on next view

**Create round (`/round/new`)** (Eleni only):
- Form: list of inputs, each row = one meal option (Name + optional Note)
- "+ Add another option" / trash icon to remove
- Validation: ≥ 1 meal option, names 1-60 chars, notes ≤ 100 chars
- Save → round goes live, family sees banner

**Login flow:**
- 5 large face/name buttons on `/login` (color-coded per `users.color`)
- Tap your name → 4-digit PIN keypad screen → submit → cookie set → land on Today
- Brute-force: 5 wrong PINs in 60s on the same name → 5-minute cooldown for that name (DB-tracked via `login_attempts`)

**History (`/history`):**
- Reverse-chronological list, last 30 days
- Each row: date, meal type, what was cooked, vote breakdown (collapsed; expandable)

**Admin (`/admin`)** (Eleni only):
- "Reset PIN" for any family member (sets a new PIN; bcrypt hashed)
- View last 100 audit log entries (for "who closed that round?" diagnostics)

## 7. Visual Design — Warm Mediterranean

**Color tokens** (CSS variables):

```
--bg:           #FAF5EC
--surface:      #FFFEF9
--surface-2:    #F4EBD9
--primary:      #C77D49
--primary-dark: #A05A2C
--accent:       #7B8754
--text:         #3D2914
--text-muted:   #8B6F5A
--border:       #E8DCC8
--success:      #6B8E4E
```

**Typography:**
- Headings: **Fraunces** (warm serif)
- Body & UI: **Inter**
- Vote counts: tabular-numerals so digits don't shift width as numbers tick up

**Component look:**
- Cards: soft shadow `0 4px 14px rgba(61,41,20,0.06)`, 14px radius, 1px sandstone border
- Buttons: 12px radius, slight tactile press effect, terracotta primary
- Voter chips: small rounded pills with the voter's color and initials
- Subtle paper-grain texture on page background (very faint)

**Animation:**
- Vote tap → quick scale bounce (haptic-like)
- Tally number → animated count-up
- Round close → small confetti burst (~1s, classy)

## 8. Round Lifecycle

```
[doesn't exist] --create--> [open] --close--> [closed]
                                ↑               |
                                └──reopen───────┘
                                |
                            (mom only)
                                ↓
                            [deleted]   (soft delete)
```

- Lunch and dinner rounds are independent — Eleni can have both open simultaneously
- Reopen is supported for "oops I closed too early" cases (clears `closed_at` and `cooking_decision`)
- Soft delete (`status='deleted'`) keeps history clean and doesn't break foreign keys

## 9. Edge Cases & Error Handling

| Situation | Behavior |
|---|---|
| Eleni opens dinner before closing lunch | Allowed — independent rounds |
| Round left open overnight | Soft banner on next-day Today: "Yesterday's dinner is still open — close it?" |
| Eleni closes round with zero votes | Allowed; she picks what to cook anyway |
| Eleni closes without selecting cooking decision | Confirm dialog: "Close without recording what you're cooking?" — allowed but discouraged |
| Family member tries to vote after close | Round goes read-only; "Voting closed" pill |
| Eleni deletes a meal option that has votes | Confirm: "X people voted for this. Remove anyway?" → cascade deletes votes |
| Eleni deletes the whole round | Soft-delete (`status='deleted'`); doesn't appear in history |
| Forgotten PIN | Eleni resets via `/admin` |
| PIN brute-force | 5 wrong attempts in 60s → 5-min cooldown for that name |
| SSE connection drops | Auto-reconnect; falls back to 5s polling after 3 SSE refusals |
| Concurrent votes | UNIQUE (round_id, user_id) makes UPSERT race-safe |
| Stale page (round closed elsewhere) | Server returns 409 → UI reloads round in read-only |
| Validation: name too long / empty | Inline form error; submit blocked until valid |

## 10. Testing & Verification

- **Unit tests** (Vitest): vote logic, close-round logic, PIN cooldown logic
- **Integration tests**: full round lifecycle hitting a real local Postgres (no DB mocks — too easy to drift from prod behavior)
- **E2E** (Playwright) — 3 critical paths:
  1. Eleni creates round → adds 3 options → kid votes → Eleni closes & decides → final state correct
  2. Two kids vote concurrently → both votes counted, no race conditions
  3. Vote change before close → final tally reflects last vote, not first
- **Manual smoke** on real iPhone + Android before family rollout: PWA install, tap targets, mobile keyboards, SSE behavior on cellular

## 11. Initial Configuration / First Run

- Database migrations idempotent
- Seed script creates the 5 users with placeholder PINs (`0000` for everyone); Eleni resets all of them via `/admin` on first login
- Environment variables: `DATABASE_URL` (Neon), `COOKIE_SECRET` (signing key), `BCRYPT_ROUNDS` (default 12)

## 12. Out of Scope / Future Ideas (do not build now)

- Push notifications via FCM
- Photo uploads on meal options
- Meal autocomplete from history
- Meal favorites / "we've had this 3 times this week" warnings
- Weekly meal planning
- Recipe links / ingredients per meal
- Multi-family support
