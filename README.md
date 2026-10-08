# KALT / SS Commercial Refrigeration

Next.js 15 modular monolith, built to [`docs/hld/HLD.md`](docs/hld/HLD.md) and
[`docs/hld/HLD-FREE-TIER.md`](docs/hld/HLD-FREE-TIER.md).

**Status: backend scaffold.** The data model, the lead path, the async backbone
and the adapter layer are in place and verified. The frontend is the next phase.

---

## Run it

```bash
cp .env.example .env     # fill in DATABASE_URL at minimum
npm install
npm run db:generate      # only after changing src/db/schema
npm run db:migrate       # applies drizzle/ to the database in DATABASE_URL
npm run dev
```

`DATABASE_URL` is the only required variable. Every integration is optional and
degrades on purpose — see **Degradation** below.

```bash
npm run check            # typecheck + lint, what CI runs
npm run db:studio        # browse the database
```

---

## Layout

```
src/
├── app/api/             ROUTES ONLY — thin, no business logic, no SQL
│   ├── leads/           the one hot write endpoint
│   ├── jobs/[task]/     QStash delivery target, signature-verified
│   ├── cron/[job]/      Vercel Cron + GitHub Actions target
│   ├── revalidate/      publish webhook → revalidateTag
│   └── health/          liveness + which integrations are live
│
├── core/                PURE ABSTRACTIONS. No vendor SDK, no database.
│   ├── ports.ts         the interfaces every module depends on
│   └── errors.ts        DomainError hierarchy; each carries its own status
│
├── modules/             THE SEAMS. One folder = one future service.
│   ├── catalog/         category/product/variant reads
│   ├── leads/           schema · repository · service · reference
│   ├── notify/          channels (Strategy) + dispatcher (Chain)
│   └── outbox/          repository · publisher · sweeper
│
├── lib/
│   ├── container.ts     THE COMPOSITION ROOT — the only file that picks
│   │                    concrete classes
│   ├── env.ts           zod-validated; the only reader of process.env
│   ├── db.ts            Drizzle + Neon, primary/replica split
│   ├── http.ts          transport edge: problem(), clientIp(), secretsMatch()
│   └── adapters/        storage(R2) · queue(QStash) · cache(Upstash) ·
│                        mail(Resend) · captcha(Turnstile)
└── db/schema/           five bounded contexts, mirroring HLD.md §7
```

### Dependency direction

```
app/  ──▶  modules/  ──▶  core/
  │                        ▲
  └──▶  lib/  ─────────────┘        lib/ implements core's ports
```

Arrows only point inward. `core/` depends on nothing.

---

## The boundaries are enforced, not documented

[`eslint.config.mjs`](eslint.config.mjs) makes each of these a **build error**:

| Rule | Why |
|---|---|
| No `@/modules/*/*` deep imports | A module's surface is its `index.ts`. When `search` becomes its own service, only that file changes. |
| Modules may not import `@/app/*` | Dependencies point inward. |
| `core/` may not import `lib/`, `modules/`, `db/`, or any vendor SDK | Keeps the abstractions abstract. |
| Only `lib/env.ts` may read `process.env` | One place to look when a deploy is misconfigured. |

Verified by writing deliberate violations and confirming all three were caught.

---

## Design notes worth knowing before changing anything

**The transactional outbox is the durability boundary.** `LeadService.persist`
writes the lead, its line items and the outbox event in *one* transaction. Only
after it commits does anything try to notify. `QueuePort.publish` therefore
**never throws** — if QStash is down the lead is already safe and the sweeper
delivers it late. A SaaS outage delays notification; it never loses the lead.

**The sweeper is gated on Redis.** Neon Free gives 100 CU-hours/month and
scale-to-zero cannot be disabled, so any poll tighter than ~15 minutes keeps the
database awake 24/7 and blows the budget by 1.8×. The sweeper asks Redis "is
there work?" — a ~1 ms command that never wakes Postgres — and only connects
when the answer is yes.

**The variant, not the product, is the unit of truth for specs.** One product
page, many model codes. Collapsing them is what forces a schema rewrite the
first time someone asks for a price list.

**Pricing is pre-cut, not built.** `product_variant.mrp_inr` exists and is NULL.
Switching pricing on is a template change, not a migration.

**Notification channels are a Strategy chain.** Each channel decides for itself
whether it may act — WhatsApp only inside the 24-hour window the customer
opened. Adding SMS means adding a class and registering it; no existing file
changes.

---

## Degradation

Only `DATABASE_URL` is required. Everything else degrades deliberately:

| Missing | Effect |
|---|---|
| QStash | Outbox still commits; the sweeper delivers late |
| Redis | Rate limiting and idempotency fail **open**; the lead still lands |
| Telegram / WhatsApp | Channel deregisters; the dispatcher falls through to email |
| Resend | Console adapter logs instead of sending |
| R2 | Media operations fail with a `NotConfiguredError` naming the variables; nothing else breaks |
| Turnstile | Passes in development, **fails closed in production** |

`GET /api/health` reports exactly which are live. Booleans only — never a
credential.

---

## Verified

- `npm run typecheck` — clean
- `npm run lint` — clean, and the three boundary rules provably reject violations
- `npm run build` — all five API routes compile as dynamic
- Migration generates 18 tables with the index strategy from HLD.md §7.3 #6:
  GiST on `category.path` and `installation.geo`, GIN on `product.specs` /
  `search_tsv` / `news_post.tags`, BRIN on the append-only time columns, and
  partial indexes on `outbox WHERE published_at IS NULL` and the lead triage queue
- Endpoints smoke-tested: validation returns field-level issues, cron rejects a
  missing secret, the job route fails closed on an unsigned call

---

## Not built yet

Frontend (next phase) · `/admin` + Auth.js · media derive pipeline ·
`tsvector` search queries · careers · the `audit_log` INSERT-only grant ·
`vercel.json` cron schedules · the GitHub Actions lead probe.

`media-derive`, `search-reindex` and `purge` are registered in
`/api/jobs/[task]` and return `{ skipped: true }` rather than failing, so the
queue wiring can be exercised before the handlers exist.

### One thing to check on first migrate

The migration creates four extensions: `ltree`, `pg_trgm`, `citext` and
`postgis`. Neon supports all four, but if `postgis` is unavailable on your plan
the migration will stop there — `installation.geo` is the only column that uses
it, and it belongs to a Phase-2 feature, so it can be dropped from the schema
without touching anything else.
