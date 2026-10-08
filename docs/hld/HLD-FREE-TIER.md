# HLD — Vercel Hobby & Free-Tier Optimised

**Phase 1 of the [main HLD](HLD.md), re-costed to $0/month.**

| | |
|---|---|
| **Status** | Draft for review, Rev 1.0 |
| **Date** | 2026-10-07 |
| **Target** | A single developer ships and maintains this. Total infrastructure spend: **$0**. |
| **Constraint** | Must scale by *swapping services*, never by rewriting application code. |
| **Supersedes** | §10 Phase 1 of [HLD.md](HLD.md). Everything in §7 (data model) and §8 (ADR-0001, why PostgreSQL) carries over **unchanged** — that is the point. |
| **Diagram** | [`ss-refrigeration-free-tier.excalidraw`](ss-refrigeration-free-tier.excalidraw) · [`.svg`](ss-refrigeration-free-tier.svg) |

---

## 0. Read this first: one blocker and three corrected numbers

### 0.1 Vercel Hobby forbids commercial use

> *"Hobby teams are restricted to non-commercial personal use only. All commercial usage of the
> platform requires either a Pro or Enterprise plan."*
> — [Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines), and the same
> wording appears in the [Terms of Service](https://vercel.com/legal/terms).

A client's B2B lead-generation site is commercial use. Building and demoing on Hobby is fine — it is
your project until handover. **Launching the client's live site on Hobby risks suspension**, and a
suspension takes the lead pipeline down with it.

Three honest options, in the order I would take them:

| Option | Cost | Commercially permitted | Code change |
|---|---|---|---|
| **A** — Build on Hobby, launch on **Vercel Pro** | $20/mo (includes $20 usage credit, so effectively the floor) | Yes | None |
| **B** — Build on Hobby, launch on **Cloudflare Workers** via `@opennextjs/cloudflare` | $0 | Yes | `next.config` adapter + deploy pipeline. One day of work, done once. |
| **C** — Launch on Hobby anyway | $0 | **No** | None, until the suspension email |

**Recommendation: design for B, develop on Hobby.** Everything below is host-agnostic Next.js —
no Vercel-proprietary API is on a critical path — specifically so that option B stays a one-day
change rather than a rewrite. If the client will pay $20/mo at launch, take option A and skip the
OpenNext work entirely.

The rest of this document assumes Vercel Hobby as you asked, and flags every place where the host
actually matters.

### 0.2 Corrected free-tier numbers (verified 2026-10-07)

Three of the four bottlenecks in your brief are different from what you assumed — one is worse,
two are better, and the worse one changes the architecture.

| | Your brief | Verified reality | Consequence |
|---|---|---|---|
| Neon / Supabase DB | 500 MB | Neon: **1 GB storage**, but **100 CU-hours/month** | Storage was never the binding limit. **Compute time is.** See §4. |
| Upstash Redis | 10k requests/**day** | **500K commands/month** (≈ 16.6k/day), 256 MB | Comfortable — *if* Redis never touches a GET. See §4.4. |
| Vercel Blob | 250 MB | Correct, and irrelevant — we are not using it | R2 gives 10 GB **with free egress**. See §2. |
| Background workers | "Vercel Hobby lacks long-running workers" | Correct, plus: **Hobby cron runs once per day, ±59 min**, functions cap at **60s** | Drives the QStash design in §3. |

---

## 1. The verified free-tier ledger

Every number below was read from the provider's own pricing or limits page on **2026-10-07**.
Re-verify before launch; these move.

| Service | Role | Free allowance | The limit that will actually bite |
|---|---|---|---|
| **Vercel Hobby** | Next.js host + CDN | 100 GB-ish bandwidth allotment, 100 deploys/day, 100 builds/hour, 45 min build | Functions: **10s default / 60s max**. Cron: **once per day, ±59 min**. Runtime logs kept **1 hour**. Non-commercial only (§0.1). |
| **Cloudflare R2** | All media, documents, CVs, DB backups | **10 GB-month**, 1M Class A ops/mo, 10M Class B ops/mo, **egress free** | Class A (writes/lists) at 1M/mo — irrelevant here |
| **Neon** | PostgreSQL | **1 GB storage/project** (20 GB across projects), **100 CU-hours/project/mo**, 10 branches, 5 GB egress, autoscale ≤ 2 CU | **100 CU-hours**, and **scale-to-zero after 5 min cannot be disabled**. Also: history window **6 h**, **no scheduled backups**, 1 manual snapshot. |
| **Upstash QStash** | Job queue + scheduler | **1,000 messages/day**, 1 MB max message, DLQ 7 days, 1 URL group | **Every delivery attempt counts** — a retry is a second message. Scheduled fires count too. |
| **Upstash Redis** | Rate limits + work-pending flag only | **500K commands/mo**, 256 MB, 10 GB bandwidth | Only breached if you cache GETs here. Don't. |
| **WhatsApp Cloud API** | Primary customer channel — enquiry + acknowledgement | **1,000 service messages/mo per business phone number**, free. No platform fee; Meta never charges for user→business messages. | Only applies **inside a 24-h window the customer opened**. Cold outreach is a paid Utility template. See §3.4. |
| **Resend** | Email fallback + admin magic links | **3,000/mo but 100/day**, 3 domains, 30-day retention | **100/day** — but only ~22/day used once acknowledgements move to WhatsApp |
| **Telegram / Slack webhook** | Internal sales alerts | Unlimited | Replaces 80 notification emails/day |
| **Cloudflare Turnstile** | Bot defence on forms | Unlimited | — |
| **Cloudflare Web Analytics** | Traffic analytics | Unlimited, cookieless | No funnel attribution; GA4 free covers that |
| **GitHub Actions** | CI + the sub-hourly cron Vercel can't do | 2,000 min/mo (private repos), unlimited (public) | A 15-min cron × ~20s = 48 min/mo. Negligible. |
| **Sentry** | Error tracking | 5,000 errors/mo | Fine unless you are shipping bugs |
| *(Inngest — considered, not chosen)* | *Durable steps* | *50k executions/mo; **execution pauses at quota**, no overage* | *A hard stop mid-incident is worse than a bill. See §3.5.* |

**Total: $0/month.** The nearest thing to a cost is Vercel Pro at launch if you take option A.

---

## 2. Storage and image delivery — 8 GB of media at $0

### 2.1 The core swap, and why it matters more than the 250 MB

Vercel Blob's 250 MB is the obvious problem. The *non-obvious* problem is **bandwidth**. A
photo-heavy catalogue served through Vercel consumes the Hobby bandwidth allotment quickly, and
Vercel Image Optimization on Hobby caps at 1,000 source images/month — we have ~2,800.

**Cloudflare R2 solves both at once: 10 GB free storage and, critically, *zero egress charges,
forever, at any volume*.** Put a custom domain on the bucket (`cdn.kalt.example`) and Cloudflare's
CDN serves every byte from the edge for free.

This splits traffic cleanly:

```
cdn.kalt.example   → Cloudflare R2 + Cloudflare CDN   → all images, PDFs, CVs.  Unlimited, $0.
kalt.example       → Vercel edge CDN                  → HTML only, ~15–40 KB/page.
```

Vercel's bandwidth is now spent on text. At 300k pageviews × 40 KB that is ~12 GB/month — a
fraction of the allotment, with the heavy 300 KB-per-page of imagery billed to a service that
charges nothing for it.

### 2.2 Replacing Vercel Image Optimization: pre-generated variants + a custom loader

Do not transform images at request time. Transform them **once, at upload time**, store every
variant in R2, and let Next.js pick one.

```
Upload (admin)  →  POST /api/media  →  store original to R2 `incoming/`
                                     →  INSERT asset + outbox('media.uploaded')
                                     →  QStash job  →  POST /api/jobs/media-derive
                                                        sharp → AVIF at 400/800/1200/1600/2400
                                                        + one WebP at 800 (legacy fallback)
                                                        + blurhash → asset.variants jsonb
                                                        → DELETE the original from `incoming/`
```

The derive job runs in a normal Vercel function. Five `sharp` resizes of a 2400px source take
roughly 3–5 seconds — comfortably inside the 60s Hobby cap, and it runs out of band so the editor's
upload returns immediately.

`src/lib/image-loader.ts` — **this is the entire image-optimization layer, and the Phase-2 swap point:**

```ts
// next.config.ts →  images: { loader: 'custom', loaderFile: './src/lib/image-loader.ts' }
const WIDTHS = [400, 800, 1200, 1600, 2400] as const;
const CDN = process.env.NEXT_PUBLIC_CDN_URL!;        // https://cdn.kalt.example

export default function loader({ src, width }: { src: string; width: number }) {
  // src is the R2 key, e.g. 'products/blast-freezer/hero'
  const w = WIDTHS.find((c) => c >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `${CDN}/${src}/${w}.avif`;
}
```

`<Image>` keeps working exactly as it does today — `srcset`, lazy loading, `sizes`, priority hints,
the blurhash placeholder. The only thing that changed is where the bytes come from. **Phase 2 is a
four-line edit to this one file** to point at Cloudflare Images or Vercel's optimizer.

> Cloudflare also offers runtime image transformations with a free monthly allowance. It is a valid
> alternative to pre-generation, but the allowance has changed twice in two years — **verify the
> current number before depending on it.** Pre-generation has no quota at all, which is why it is
> the default here.

### 2.3 The 10 GB budget, allocated

Your 8 GB estimate assumed storing full-resolution originals plus a datasheet per SKU. Neither is
necessary, and the difference is 3.4 GB of headroom.

| Bucket prefix | Contents | Budget | Policy |
|---|---|---|---|
| `products/` | 2,800 images × 5 AVIF widths + 1 WebP ≈ 600 KB/image | **1.7 GB** | The 2400px AVIF *is* the master. No TIFFs, no PSDs, no originals. |
| `docs/` | Catalogues, datasheets, manuals, certificates | **2.5 GB** | Datasheets are per *range*, not per SKU — ~80 PDFs, not 700. Enforce an 8 MB cap. |
| `cv/` | Job applications | **1.2 GB** | Lifecycle rule: **delete after 12 months.** This is a DPDP retention requirement, not just a storage one. |
| `backups/` | Nightly `pg_dump.gz`, 30 retained | **1.0 GB** | Lifecycle rule: delete after 30 days |
| `archive/` | Revisions and audit rows evicted from Postgres (§4.3) | **0.2 GB** | Append-only JSONL |
| *Headroom* | | **3.4 GB** | |
| **Total** | | **10 GB** | |

Enforced in code, not by hope — `modules/media` rejects an upload if the bucket is over 85 %, and
the nightly guardrail cron (§7) reports actual usage.

### 2.4 Why not the alternatives

| Option | Verdict |
|---|---|
| **Vercel Blob** | 250 MB. Thirty-two times too small, and bandwidth bills to Vercel. |
| **Supabase Storage** | 1 GB free, and the project **pauses after 1 week of inactivity** — unacceptable for a site whose traffic is lumpy around trade shows. |
| **Cloudinary free** | Generous transformations, but a credit-based model that conflates storage, bandwidth and transforms. Harder to reason about, and the egress is not free. |
| **GitHub repo / LFS** | Works until it doesn't. LFS bandwidth is metered, and binaries in git make every clone slower forever. |
| **Cloudflare R2** | **Chosen.** 10 GB, free egress, S3-compatible API — so the Phase-2 swap to paid R2 or to S3 is an environment-variable change. |

---

## 3. Async jobs at $0 — replacing Debezium, Kafka, SQS and workers

### 3.1 What survives from the paid design: the outbox

The transactional outbox is a **table**, so it costs nothing and it stays. It remains the durability
boundary. What changes is only the *relay* — Debezium + Kafka become an HTTP call to QStash.

```
             PAID DESIGN                              FREE DESIGN
  txn: business row + outbox row            txn: business row + outbox row     ← identical
  Debezium reads the WAL                    opportunistic POST to QStash
  Kafka topic                               QStash queue (retries + DLQ built in)
  autoscaled consumer pods                  Next.js route handler  /api/jobs/[task]
  SQS DLQ                                   QStash DLQ (7 days) + hourly sweeper
```

Same guarantees, same code shape, a different line in `lib/queue.ts`.

### 3.2 Opportunistic dispatch with a sweeper backstop

The pattern that makes this reliable without a long-running worker:

```ts
// modules/leads/mutations.ts
export async function createLead(input: LeadInput) {
  const { lead, event } = await db.transaction(async (tx) => {
    const lead  = await tx.insert(leads).values(input).returning();
    const event = await tx.insert(outbox).values({
      aggregateType: 'lead', aggregateId: lead.id, eventType: 'lead.created',
      payload: { leadId: lead.id },
    }).returning();
    return { lead, event };
  });
  // Committed. The lead is now safe no matter what happens next.

  await queue.publish('lead-created', { outboxId: event.id }).catch(() => {
    // Swallowed on purpose. The row is in the outbox; the sweeper will find it.
  });

  return lead;                                    // 202 to the browser in < 300 ms
}
```

If QStash is down, slow, or over quota, the lead is **already committed** and the hourly sweeper
delivers it late. Nothing is lost. This is the same property the paid design gives you, achieved
with one HTTP call and a cron instead of a CDC pipeline.

### 3.3 The scheduling layer — and why Vercel Cron alone cannot do it

**Vercel Hobby cron runs once per day, with ±59 minutes of scheduling slop.** That is fine for a
nightly backup and useless for anything a customer is waiting on. Three schedulers, each doing what
it is cheapest at:

| Schedule | Runs on | Cadence | Job | Budget cost |
|---|---|---|---|---|
| Outbox sweeper | **QStash Schedules** | every 15 min | Gate on Redis, drain unpublished outbox rows | 96 QStash msgs/day |
| Synthetic lead probe | **GitHub Actions** | every 15 min | End-to-end POST + assert it lands | ~48 GH min/mo |
| Nightly maintenance | **Vercel Cron** | 03:00 daily | `pg_dump` → R2, prune outbox/revisions/audit, guardrail report | 1 invocation |
| Sitemap + IndexNow | **Vercel Cron** | 04:00 daily | Regenerate, ping search engines | 1 invocation |

QStash daily budget at full load:

```
Scheduled sweeper      15 min          →   96 msgs/day
Lead jobs              80 leads × 2    →  160 msgs/day   (ack email, CRM/webhook push)
Media derive           ~20 uploads     →   20 msgs/day
Publish fan-out        ~5 publishes×2  →   10 msgs/day
Retries                ~5 % of above   →   15 msgs/day
                                          ───────────
                                          301 / 1,000   ← 30 % utilised
```

### 3.4 Notifications — WhatsApp first, email as the fallback

**Resend free is 3,000/month *but only 100/day*.** The naive design — customer acknowledgement plus
sales notification — sends 160/day at 80 leads and fails by lunchtime. Routing the sales alert to
Telegram fixes half of it; the customer acknowledgement is the remaining 80/day, and it is 93 % of
the budget.

In the Indian B2B market the right answer is not a bigger email plan. It is **WhatsApp** — it is
where these buyers already transact, and Williams' own site leads with a phone number for exactly
this reason.

#### The rule that decides the whole design

Verified against [Meta's WhatsApp Business Platform pricing](https://developers.facebook.com/docs/whatsapp/pricing/)
(page updated 30 Sep 2026; per-message pricing has applied since 1 Jul 2025):

| | Who starts it | Message type | Cost |
|---|---|---|---|
| **A** | **The customer** messages or calls you | A 24-hour **customer service window** opens. Your replies are free-form **Service** messages. | **First 1,000 service messages/month per business phone number are free.** Resets monthly, no rollover. |
| **B** | **You** reach out cold (a form was submitted, but they never messaged you) | No window is open, so it must be a **Utility template** | **Paid from message one.** No free tier. |
| **C** | Customer arrives via a **Click-to-WhatsApp ad** or Facebook Page CTA | Your reply opens a **Free Entry Point window, up to 7 days** | **Everything is free in that window** — marketing, utility, auth and service |

Meta never charges for user→business messages, and only charges on *delivered* messages.

**A website form submission is path B.** So WhatsApp only replaces the email acknowledgement if the
customer opens the conversation — which means inverting the call to action, not bolting a channel
onto the back of the existing form.

#### The design

```
PRIMARY CTA, on every product page and in the header
  "Enquire on WhatsApp"  →  wa.me/<number>?text=Enquiry about <model_code> (ref <page>)
  Customer taps, their app sends the prefilled text, the 24-h window opens,
  our auto-reply is a free Service message. Lead row created from the inbound webhook.

SECONDARY, for people who prefer a form
  The existing /contact and RFQ form, unchanged.
  Success screen shows a one-tap "Continue on WhatsApp" button, lead ref prefilled.
  → tapped  : window opens, ack sent on WhatsApp, free.      (expect the majority)
  → ignored : after 10 min a QStash job sends the email ack. (the fallback)
```

The form still writes `lead + outbox` in one transaction exactly as in §3.2 — the durability
boundary does not move. Only the *notification channel* is chosen later, by what the customer did.

#### Revised notification budget

| Message | Channel | Volume at 80 leads/day |
|---|---|---|
| Customer acknowledgement, WhatsApp-initiated | **WhatsApp Service message** | ~64/day — free up to 1,000/month |
| Customer acknowledgement, form-only fallback | **Resend** | ~16/day |
| Instant sales alert | **Telegram / Slack webhook** | Unlimited, free |
| Sales digest, 6 pm | **Resend** | 1/day |
| Admin magic-link login | **Resend** | ~5/day |
| **Total on Resend** | | **~22/day of 100 — was 86** |

Resend drops from 86 % utilisation to 22 %, and stops being the thing that breaks first.

#### What this costs honestly

WhatsApp's free tier is **1,000 service messages/month ≈ 33/day**, and a real conversation is more
than one message. At launch volume (5–20 leads/day) you are comfortably inside it. At 80 leads/day
with two or three replies each you are not — you will be paying Meta's published India rate on the
overflow.

That is the right trade, and it is worth stating plainly: **this swap does not make notification
free forever, it replaces a hard cliff with a soft cost.** Resend's 100/day is a wall that drops
acknowledgements on the floor at 101. WhatsApp's overflow is a few hundred rupees a month that
scales with lead volume — i.e. with revenue. A lead worth a ₹2 lakh cabinet order justifies a
fraction of a rupee.

#### Two caveats before you commit to this

1. **Setup is not a free-tier toggle.** The WhatsApp Business Platform needs a Meta Business
   account, **business verification** (days, with document review), and a dedicated phone number
   that is **not already registered on consumer WhatsApp**. Budget a week of calendar time and get
   the client's documents early — this is the long pole, not the code.
2. **Go direct to the Meta Cloud API, not through a BSP.** Meta hosts the Cloud API with no
   platform fee; you pay only per message. Gupshup, Twilio and 360dialog add a per-message markup
   or a monthly minimum on top. For this volume, direct is both cheaper and simpler.

The earlier draft of this document routed sales alerts through Gupshup/Twilio. That is superseded:
sales alerts go to Telegram (free), and customer conversations go direct to Meta Cloud API.

#### Guardrails

A counter in Redis tracks both channels. Resend warns at 70/day and auto-degrades to digest-only at
90/day. The WhatsApp counter warns when the monthly service-message tier passes 800 of 1,000, so a
cost appearing on the Meta invoice is never a surprise. If email volume ever does grow back, Resend
Pro is $20/mo for 50,000/month, and Brevo's free tier allows 300/day.

### 3.5 Why QStash and not Inngest

Inngest is the nicer developer experience — durable step functions, typed events, a good UI — and
its free tier is 50k executions/month, which is plenty here.

**It is not chosen for one reason: on the free plan there is no metered overage. Execution *pauses*
when you hit the quota and stays paused until you upgrade.** A queue that silently stops during a
trade-show traffic spike is worse than a queue that costs $4. QStash's free tier degrades the same
way, but at 30 % utilisation (§3.3) with a Postgres-backed outbox behind it, a QStash outage is a
delay, not a loss.

Keep Inngest on the list for Phase 2, when a paid plan removes the cliff and the step-function model
starts earning its keep.

---

## 4. Database and caching — the real constraint is compute, not storage

### 4.1 The finding that reshapes the design

Neon's free plan gives **100 CU-hours per project per month**. The smallest compute is 0.25 CU, so:

```
100 CU-hours ÷ 0.25 CU = 400 hours of active database time per month
A month is 720 hours                    → a 55 % uptime budget
Scale-to-zero fires after 5 min idle    → and cannot be disabled on Free
⇒ every isolated burst of DB activity costs AT LEAST 5 minutes of compute
⇒ 400 h ÷ 5 min ≈ 4,800 isolated wakes/month ≈ 160/day
```

Two consequences, and the second one is the non-obvious one:

**(a) Any polling loop tighter than ~15 minutes keeps the database awake 24/7.**
A 5-minute poll = 720 h/month = **180 CU-hours = 1.8× over budget**, on an idle site. This is why
the sweeper in §3.3 runs every 15 minutes *and* is gated on Redis (§4.4) so it only wakes Postgres
when there is genuinely work to do.

**(b) Time-based ISR is a background database poll in disguise.**
400 pages with `revalidate: 3600` means ~400 regenerations an hour trickling in across the day, each
one a database read. The compute never sleeps. **So: on-demand revalidation only.**

```ts
// app/products/[category]/[slug]/page.tsx
export const revalidate = false;   // never expires on a timer
export const dynamicParams = true;
// Freshness comes from revalidateTag('product:<id>'), fired by the publish event.
```

Pages are static until something actually changes. The database sleeps between writes. This single
decision is what makes the free tier work, and it is *also* the better design — it is exactly the
surrogate-key purge strategy from [HLD.md §5](HLD.md), just enforced by a quota instead of taste.

### 4.2 The resulting compute budget

| Activity | Wakes/month | CU-hours |
|---|---|---|
| Lead + application writes (clustered in business hours) | ~2,700 writes, ~400 effective wakes | ~33 |
| Sweeper (15 min, Redis-gated → only wakes on real work) | ~150 | ~12 |
| Content publishes + ISR regeneration | ~90 | ~8 |
| Nightly `pg_dump` + maintenance | 30 | ~3 |
| Build-time SSG reads (one full catalogue read per deploy) | ~60 | ~5 |
| **Total** | | **~61 of 100** |

~39 CU-hours of headroom. The guardrail cron (§7) alerts if projected month-end usage exceeds 80.

**Cold-start honesty:** after 5 minutes idle, the first query waits ~500 ms for Neon to resume. This
is invisible to visitors — they are served static pages — but it is felt on the *first* form submit
after a quiet period, and in the admin UI. Budget 900 ms TTFB for an admin cold start; the public
SLO is unaffected.

### 4.3 Staying under 1 GB of storage

The paid design's "full JSONB snapshot per revision" is the one choice that does not survive contact
with a 1 GB cap. Revised retention, enforced by the nightly cron:

| Table | Policy | Steady-state size |
|---|---|---|
| `product`, `product_variant`, `category`, `feature_block` | Keep all | ~12 MB |
| `content_revision` | **Keep the latest 10 per entity in Postgres; older ones → `archive/` in R2 as JSONL, row replaced by a pointer** | ~25 MB |
| `audit_log` | Monthly partitions; export + `DROP PARTITION` after 90 days | ~12 MB |
| `outbox` | `DELETE WHERE published_at < now() - interval '7 days'` | < 1 MB |
| `lead`, `lead_item` | Keep 24 months (DPDP retention), then anonymise | ~115 MB |
| `application` | Keep 12 months, then delete (CV in R2 deleted by lifecycle rule) | ~15 MB |
| Indexes + bloat (~1.6×) | `VACUUM` nightly | — |
| **Projected at 12 months** | | **≈ 290 MB of 1 GB** |

Rollback still works: the last 10 revisions cover every realistic "undo", and anything older is one
R2 `GetObject` away.

**Neon Free has no scheduled backups and a 6-hour history window.** So the nightly `pg_dump` to R2
is not belt-and-braces, it *is* the backup. It is the single most important cron job in the system.
Restore is drilled monthly into a Neon branch (Free includes 10 branches per project).

### 4.4 Caching: four tiers, and Redis is not on the read path

| Tier | Mechanism | Cost | Serves |
|---|---|---|---|
| 0 | **SSG at build** | $0 | Home, about, quality, sustainability, industries, contact |
| 1 | **ISR, on-demand revalidation only** | $0 | ~400 product, category, news, installation pages |
| 2 | **`unstable_cache` / Next.js Data Cache** | $0 | Search results, faceted listings — 60s TTL |
| 3 | **Upstash Redis** | $0 | **Writes only:** rate-limit buckets, idempotency keys, the sweeper's work-pending flag, the Resend daily counter |

The rule that keeps everything inside quota: **a GET request never touches Redis and never touches
Postgres.** It is answered by the CDN from a page that was rendered when the content last changed.

Redis budget:

```
Sweeper gate       96/day × 1 GET                                    →    2,880/mo
Rate limiting      ~600 POST attempts/day × 2 commands               →   36,000/mo
Idempotency        80 leads/day × 2                                  →    4,800/mo
Email counter      ~90/day × 2                                       →    5,400/mo
                                                                        ──────────
                                                                        49,080 / 500,000   ← 10 %
```

The sweeper gate deserves its own note, because it is what protects the Neon compute budget:

```ts
// modules/outbox/sweeper.ts  —  called by the 15-minute QStash schedule
const pending = await redis.get<number>('outbox:pending');
if (!pending) return { skipped: true };     // Postgres stays asleep. This is the point.
await drainOutbox();                        // only now do we wake the database
```

`outbox:pending` is incremented by the same code path that inserts the outbox row, and reset when
the sweeper drains. Redis is doing the one job it is uniquely good at — being cheap to ask.

**Sub-400 ms TTFB** falls out of this almost for free: tiers 0 and 1 are static files on Vercel's
edge network, typically 40–120 ms TTFB in India with no origin involvement at all. The only requests
that reach a function are form POSTs and the admin UI.

### 4.5 Neon over Supabase

Both are Postgres, so [ADR-0001](HLD.md#8-adr-0001--database-selection) is unaffected. Within that:

| | Neon Free | Supabase Free |
|---|---|---|
| Storage | **1 GB/project**, 20 GB across projects | 500 MB |
| Inactivity | Scale-to-zero after 5 min, **resumes in ~500 ms** | **Project paused after 1 week** — manual resume |
| Branches | 10/project — a real database per preview deploy | Not offered on free |
| Compute | 100 CU-hours/month (the constraint) | Shared CPU, 500 MB RAM |

The deciding factor is the inactivity behaviour. A B2B site with lumpy, campaign-driven traffic can
easily go a week without a write in January; waking up to a *paused* production database is not an
acceptable failure mode. Neon's scale-to-zero is a 500 ms cold start, not an outage.

Supabase remains the better pick if you want its Auth, Storage and Realtime as a bundle — but we are
using R2 for storage and Auth.js for auth, so that bundle is not worth 500 MB and a pause timer.

---

## 5. Repository structure — a modular monolith one person can hold in their head

### 5.1 The shape

```
src/
├── app/                              # ROUTES ONLY. Thin. No business logic, no SQL.
│   ├── (marketing)/                  #   SSG      — home, about, quality, sustainability
│   ├── (catalog)/
│   │   ├── products/[category]/page.tsx
│   │   └── products/[category]/[slug]/page.tsx    # ISR, on-demand revalidation
│   ├── (resources)/downloads/        #   ISR      — the resource centre
│   ├── industries/[slug]/
│   ├── installations/[slug]/
│   ├── news/[slug]/
│   ├── careers/[slug]/
│   ├── admin/                        #   SSR      — auth-gated, server actions
│   └── api/
│       ├── leads/route.ts            #   the one hot write endpoint
│       ├── revalidate/route.ts       #   publish webhook → revalidateTag
│       ├── jobs/[task]/route.ts      #   QStash delivery target (signature-verified)
│       └── cron/[job]/route.ts       #   Vercel Cron + GitHub Actions target
│
├── modules/                          # THE MONOLITH'S SEAMS. One folder = one future service.
│   ├── catalog/     ├── queries.ts  mutations.ts  schema.ts  types.ts  index.ts
│   ├── content/     │
│   ├── leads/       │   Every module exposes ONLY index.ts.
│   ├── careers/     │   Nothing outside the module may import its internals.
│   ├── media/       │   Modules talk to each other through index.ts, or not at all.
│   ├── search/      │
│   ├── notify/      │
│   └── outbox/      └── publish.ts  sweeper.ts  index.ts
│
├── lib/                              # ADAPTERS. Each file is a Phase-2 swap point (§6).
│   ├── db.ts                         #   Drizzle client + Neon driver
│   ├── storage.ts                    #   R2 via the S3 API
│   ├── queue.ts                      #   QStash
│   ├── cache.ts                      #   Next.js Data Cache (+ Redis later)
│   ├── mail.ts                       #   Resend
│   ├── ratelimit.ts                  #   Upstash Redis
│   ├── image-loader.ts               #   R2 pre-generated variants
│   └── env.ts                        #   zod-validated, fails the build on a missing var
│
└── db/
    ├── schema/                       # one file per bounded context, mirroring HLD.md §7
    └── migrations/                   # drizzle-kit, checked in
```

### 5.2 The one rule that makes it modular

A folder is not a module boundary unless something enforces it. Add this to `eslint.config.js` on
day one, before there is anything to untangle:

```js
'no-restricted-imports': ['error', {
  patterns: [
    { group: ['@/modules/*/*'], message: 'Import from the module root: @/modules/catalog' },
    { group: ['@/app/*'],       message: 'Modules must never import from app/' },
  ],
}],
```

That is the whole discipline. When Phase 3 arrives and `modules/search` becomes its own service, the
only thing that changes is the body of `modules/search/index.ts` — every call site already goes
through it.

### 5.3 Stack picks, chosen for one developer

| Choice | Why, specifically for this constraint |
|---|---|
| **Drizzle ORM** over Prisma | No binary query engine → cold starts measured in milliseconds, which matters when Neon is also cold-starting. SQL-first, so the DDL in [HLD.md §7.2](HLD.md#72-representative-ddl) translates almost literally. |
| **Server Actions** for the admin | No API layer to write for CRUD. Roughly 60 % less code than route handlers for the same screens. |
| **Auth.js** + Resend magic link | Three staff users. Do not build a password system for three users. |
| **Custom `/admin`, not Payload/Strapi** | Payload on Postgres is excellent and adds ~80 MB of schema plus a heavier build. At this scale, eight server-action-backed forms are less code, less storage and less to learn. Revisit at Phase 2. |
| **Marketing copy in MDX, in git** | Zero database rows, zero CU-hours, and `git revert` is the rollback. Only *structured* content (products, news, jobs) needs the database. |
| **Tailwind + shadcn/ui** | The existing [`assets/css/styles.css`](../../assets/css/styles.css) design tokens port to Tailwind theme variables directly. |

### 5.4 Suggested build order

| Week | Deliverable | Proves |
|---|---|---|
| 1 | Repo skeleton, `lib/*` adapters as stubs, Drizzle schema, Neon connected, one product page rendering from the DB | The spine works end to end |
| 2 | R2 + media derive job + `image-loader.ts`, migrate the existing WebP assets | The hardest free-tier problem is solved first |
| 3 | Catalogue: categories, products, variants, feature blocks, the resource centre | The bulk of the content model |
| 4 | Leads: form, Turnstile, outbox, QStash, Telegram alert, ack email | The revenue path, with its probe |
| 5 | `/admin` CRUD + Auth.js + publish → `revalidateTag` | The client can self-serve |
| 6 | Careers, news, installations, search (`tsvector`) | Feature-complete |
| 7 | Crons, guardrails, backup + restore drill, Lighthouse budgets, SEO redirect map | Operable |
| 8 | Content load, performance pass, launch | — |

---

## 6. Scaling seams map

**The contract: every row below is an environment variable or a single adapter file. No row requires
touching `app/` or `modules/`.**

| # | Concern | Phase 1 — free | What breaks | Phase 2 — paid | What you change |
|---|---|---|---|---|---|
| 1 | **Host** | Vercel Hobby | Commercial-use policy (§0.1); 60s functions; daily cron | Vercel Pro, **or** Cloudflare Workers | Nothing, **or** add `@opennextjs/cloudflare` |
| 2 | **Media storage** | R2 free, 10 GB | > 8.5 GB stored | R2 paid — $0.015/GB-mo | Nothing. Same bucket, same keys, a card on file. |
| 3 | **Image transforms** | Pre-generated AVIF in R2 | Need per-request crops or art direction | Cloudflare Images / Vercel Optimizer | `lib/image-loader.ts` — 4 lines |
| 4 | **Database** | Neon Free, 1 GB / 100 CU-h | > 80 CU-hours, or > 800 MB | Neon Launch/Scale, or RDS | `DATABASE_URL` |
| 5 | **Read scaling** | None — the CDN is the read replica | p95 DB CPU > 60 % | Neon read replica | `DATABASE_URL_RO` + `lib/db.ts` picks it for reads |
| 6 | **Queue** | QStash, 1k msgs/day | > 700/day sustained | QStash pay-as-you-go ($1/100k), or Inngest, or SQS | `lib/queue.ts` — one `publish()` function |
| 7 | **Scheduler** | QStash Schedules + GitHub Actions + daily Vercel Cron | Need sub-minute precision | Vercel Pro cron (per-minute) | `vercel.json` cron expressions |
| 8 | **Workers** | Next.js route handlers, ≤ 60s | A job that needs > 60s (bulk import, large PDF) | Cloudflare Queues consumer, or a Railway worker | The job body moves; `modules/*` is unchanged |
| 9 | **Cache** | ISR + Data Cache; Redis for writes only | > 350k Redis commands/mo | Upstash pay-as-you-go ($0.20/100k) | Nothing — billing only |
| 10 | **Search** | Postgres `tsvector` + `pg_trgm` | Need facets, typo tolerance, PDF text | Typesense Cloud / OpenSearch | `lib/search.ts` — same `search(q, facets)` signature |
| 11 | **Notifications** | WhatsApp Cloud API (1,000 free service msgs/mo) + Telegram for sales + Resend as fallback | WhatsApp > 1,000 service msgs/mo; Resend > 70/day for 3 days | Pay Meta's per-message India rate; Resend Pro $20/mo for 50k | Nothing — `lib/notify.ts` already picks the channel per lead |
| 12 | **Analytics** | Cloudflare Web Analytics + GA4 | Need funnel attribution on leads | PostHog / ClickHouse | `lib/analytics.ts` |
| 13 | **Error tracking** | Sentry free, 5k/mo | > 5k errors/mo | Sentry Team | Billing only |
| 14 | **Logs** | Vercel Hobby keeps logs **1 hour** | Any incident older than an hour | Vercel Pro (1 day), or Axiom free (500 MB/mo) | `lib/logger.ts` transport |
| 15 | **Backups** | Nightly `pg_dump` → R2 | RPO of 24 h is unacceptable | Neon paid: PITR to the second | Delete the cron job |

### 6.1 The two adapters that do the most work

`src/lib/queue.ts` — swap QStash for anything without the callers noticing:

```ts
import { Client } from '@upstash/qstash';
const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export const queue = {
  async publish(task: JobName, body: unknown) {
    await qstash.publishJSON({
      url: `${process.env.APP_URL}/api/jobs/${task}`,
      body,
      retries: 3,
      // PHASE 2: swap the three lines above for an SQS SendMessage or an
      // inngest.send(). The signature of publish() does not change, so
      // nothing in modules/ or app/ is touched.
    });
  },
};
```

`src/lib/storage.ts` — R2 is S3-compatible, so the Phase-2 migration is configuration:

```ts
import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,     // R2 today; AWS or paid R2 tomorrow
  credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! },
});
export const publicUrl = (key: string) => `${process.env.NEXT_PUBLIC_CDN_URL}/${key}`;
```

---

## 7. Guardrails — know before the client does

Free tiers fail *silently and completely*. Build the monitoring in week 7, not after the first
outage. One nightly cron, one Telegram message:

```
GET /api/cron/guardrails     (Vercel Cron, 03:30 daily)

  R2 bucket size               6.6 GB / 10 GB      66 %   ok
  Neon CU-hours (projected)     61 / 100           61 %   ok
  WhatsApp service msgs (mo)   480 / 1,000        48 %   ok
  QStash messages today        301 / 1,000        30 %   ok
  Neon storage                 291 MB / 1 GB      28 %   ok
  Resend sends today            22 / 100          22 %   ok
  Upstash commands this month   49k / 500k        10 %   ok
  Vercel bandwidth (projected)  12 GB              —     ok
  Leads in the last 24 h        74                 —     ok
  Outbox DLQ depth               0                 —     ok
  Last successful pg_dump        7 h ago           —     ok

  → warn at 70 %, page at 85 %, auto-degrade at 95 %
```

The last three lines are the ones that matter most: **zero leads in a business day and a non-empty
DLQ are the two signals that money is being lost.**

### 7.1 What breaks first, in order

Ranked by risk, not purely by utilisation — a limit that can spike without warning outranks one
that grows predictably.

| Rank | Limit | Utilisation at launch | Fix | Cost |
|---|---|---|---|---|
| 1 | **Vercel Hobby commercial-use policy** | **Non-compliant from day one** | Vercel Pro, or Cloudflare Workers | $20/mo or **$0** |
| 2 | **Neon 100 CU-hours** | 61 % — and can spike with a traffic event | Lengthen the sweeper interval, then Neon paid | ~$5–20/mo |
| 3 | **R2 10 GB** | 66 % — but grows slowly and predictably | Lifecycle rules (already built), then paid R2 | ~$0.05/mo |
| 4 | **WhatsApp 1,000 service msgs/mo** | ~48 % at launch volume; exceeded at ~80 leads/day | Nothing to do — it becomes a small per-message cost, not a cliff | a few hundred ₹/mo |
| 5 | **QStash 1,000/day** | 30 % | Pay-as-you-go | $1/100k |
| 6 | Resend 100 emails/day | 22 % — **was 86 % before §3.4** | Digest mode, then Resend Pro | $20/mo |
| 7 | Upstash 500k commands/mo | 10 % | — | — |

Two things worth noting about this ranking:

**The policy limit is now #1.** It bites before every technical limit, and it is the only one with
a deadline rather than a threshold. That is the honest headline of this document.

**Moving acknowledgements to WhatsApp (§3.4) removed the old #1.** Resend fell from 86 % to 22 %,
and the limit that replaced it at #4 behaves better: Resend's 100/day is a wall that silently drops
the 101st acknowledgement, whereas WhatsApp's overflow is a metered cost that scales with lead
volume — which is to say, with revenue.

---

## 8. What you are giving up versus the paid design

Every one of these is a conscious trade, recoverable by the matching row in §6. State them to the
client before launch, not after an incident.

| [HLD.md](HLD.md) target | Free-tier reality | Recovered by |
|---|---|---|
| RPO 5 min | **RPO 6 h** (Neon Free history window) / **24 h** (nightly dump) | Seam 15 |
| RTO 30 min, drilled quarterly | RTO ~2 h — restoring a dump by hand | Seam 15 |
| Site availability 99.9 % | **No contractual SLA on any free tier.** Realistically ~99.9 %, but with no credits and no support queue | Seams 1, 4 |
| Lead POST 99.95 % | Held — the outbox is the guarantee, and it does not depend on a paid plan | — |
| TTFB p75 < 400 ms | **Held**, and comfortably — static edge delivery | — |
| LCP p75 < 2.0 s | **Held** — pre-generated AVIF is faster than runtime optimisation | — |
| Publish → live p95 < 30 s | Held for on-demand revalidation; a missed webhook waits up to 15 min for the sweeper | Seam 7 |
| Faceted, typo-tolerant search | `tsvector` only: no facet counts, no fuzzy matching beyond trigram | Seam 10 |
| Incident debugging | **Logs retained 1 hour.** This is the sharpest everyday pain | Seam 14 |
| Multi-AZ failover | Single Neon compute. A regional outage is an outage | Seam 4 |
| Deploy previews with isolated data | Neon branches work on Free (10/project) — **this one you keep** | — |

---

## 9. Summary

The brief asked for four bottlenecks to be solved. Three of them dissolve once the right free tier
is chosen, and the fourth turns out to be a different problem than it looked:

1. **Storage and images** — Cloudflare R2's 10 GB *with free egress*, plus upload-time AVIF variants
   behind a 6-line custom loader. The egress is the real prize; it also protects Vercel's bandwidth.
2. **Async** — the outbox table survives untouched; only the relay changes, from Debezium+Kafka to
   one `fetch` to QStash. Opportunistic dispatch plus a 15-minute sweeper gives the same
   no-lost-events guarantee at 30 % of a free quota.
3. **Database and caching** — storage was never the binding limit; **100 CU-hours** is. That forces
   on-demand-only ISR and a Redis-gated sweeper, which keeps Postgres asleep. Redis never touches a
   GET and lands at 10 % of its quota. Sub-400 ms TTFB is a side effect of the pages being static.
4. **Structure** — `app/` for routes, `modules/` for seams, `lib/` for swappable adapters, with one
   ESLint rule holding the boundary.

And one bottleneck that was not in the brief but turned out to be the worst of them: **Resend's
100 emails/day**, 93 % of which was a single acknowledgement message. Moving the customer
conversation to **WhatsApp** (§3.4) drops Resend to 22 % — but only by inverting the call to
action, because Meta's free tier applies solely to conversations the *customer* opens. This is the
right channel for Indian B2B anyway; the email path survives as the fallback.

And the thing that was not in the brief: **Vercel Hobby does not permit commercial use.** Build on
it, but plan to launch on Vercel Pro or Cloudflare Workers. That is seam #1, and it is the only one
with a deadline.
