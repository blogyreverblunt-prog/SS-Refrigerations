# Remediation Plan — First Production Deployment

| | |
|---|---|
| **Status** | Rev 1.0 |
| **Date** | 2026-10-12 |
| **Deployment** | https://ss-refrigeration.vercel.app — live, public |
| **Project** | `ss-refrigeration`, Vercel team `managekalt-5790`, Hobby plan |
| **Language** | ASD-STE100 Simplified Technical English (approximately 80 percent) |

---

## 1. Purpose

This document records the first production deployment of the site. It lists each problem that the
deployment found. For each problem it gives the cause, the effect, and the fix.

Record the cause, not only the symptom. A symptom tells you what to patch today. A cause tells you
what will occur again next month.

---

## 2. What works

The deployment is live. These items are correct:

- All 22 routes build and render. Five product pages come from the Neon database.
- A headless Chrome check passed on 18 route and viewport combinations. The stylesheet attaches.
  No console error occurs. No request fails. No page overflows horizontally.
- The site sets no cookie and loads no third-party origin. Therefore the no-consent-banner
  decision stays correct.
- `sitemap.xml` and `robots.txt` show the production domain.
- Both cron jobs are registered. `/api/cron/*` returns 401 without the secret.

---

## 3. Problems

Seven problems remain. P1 to P3 block the business purpose of the site. P4 to P7 are operational.

### P1 — The enquiry form rejects every visitor

**Symptom.** A POST to `/api/leads` returns HTTP 400.

```
{"error":{"code":"captcha_failed","message":"Bot defence is not configured on this deployment"}}
```

**Cause.** The Turnstile bot defence is half-built. The server half exists. The browser half does
not.

`src/lib/adapters/captcha.ts` fails closed when `NODE_ENV` is `production`. That behaviour is
correct on its own. An unconfigured bot defence in production is a misconfiguration.

But no Turnstile widget exists in any component. The field `captchaToken` appears only in
`src/modules/leads/schema.ts` and `src/modules/leads/service.ts`. No code writes it.

Therefore both paths fail:

| `TURNSTILE_SECRET_KEY` | Result |
|---|---|
| Not set | `Bot defence is not configured on this deployment` |
| Set | `Missing verification token` — the form sends no token |

**Set the secret and the form still fails.** This is the important point. The problem is a missing
browser widget, not a missing environment variable.

**Effect.** The site captures no leads. Lead capture is the only revenue path. Therefore the site
has no business value in this state.

**Why it reached production.** `next build` passes. Every page renders. The failure occurs only
when a visitor submits the form. No test covers the lead path from end to end.

**Fix.** Two options:

| Option | Work | Result |
|---|---|---|
| **A — Complete Turnstile** | Add the Cloudflare widget to both forms. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to `src/lib/env.ts`. Send the token in the POST body. | Correct. The bot defence operates as designed. |
| **B — Defer the fail-closed branch** | Let the verifier pass when Turnstile is unconfigured. Put that behind an explicit flag. | Fast. The form accepts spam. |

Select option A. The honeypot and the per-IP rate limit already exist, so option B is less exposed
than it looks. But option B leaves a documented defence switched off.

**Effort.** Option A: half a day. You also need a Cloudflare Turnstile site key.

---

### P2 — No person receives a lead

**Symptom.** `/api/health` reports `mail: false`, `telegram: false` and `whatsapp: false`.

**Cause.** `RESEND_API_KEY`, `SALES_INBOX`, `TELEGRAM_BOT_TOKEN` and the WhatsApp keys are empty.

**Effect.** P1 hides this problem. When you correct P1, the lead commits to the database. But no
person is told. The sales desk must read the database by hand.

**Fix.** Set `RESEND_API_KEY`, `MAIL_FROM` and `SALES_INBOX` in Vercel. Add Telegram for the
instant sales alert. The notification registry already falls through from one channel to the next,
so no code change is necessary.

**Effort.** One hour, after the client supplies a Resend account and a sales mailbox.

---

### P3 — The Hobby plan does not permit this deployment

**Symptom.** The site runs on a Vercel Hobby account.

**Cause.** `HLD-FREE-TIER.md` §0.1 states this risk. That document ranks it as risk number one.
The deployment went to Hobby.

> *"Hobby teams are restricted to non-commercial personal use only."*
> — Vercel Fair Use Guidelines

**Effect.** A client B2B lead-generation site is commercial use. Vercel can suspend the account. A
suspension stops the lead pipeline.

The risk was theoretical while the site was a demo. The site is now public, so the risk is real.

**Fix.** Three options, as §0.1 already describes:

| Option | Cost | Permitted |
|---|---|---|
| **A** — Move to Vercel Pro | 20 USD per month | Yes |
| **B** — Move to Cloudflare Workers with `@opennextjs/cloudflare` | 0 USD | Yes |
| **C** — Stay on Hobby | 0 USD | No |

The code is host-agnostic by design, so option B stays a one-day change.

**This needs a decision from the client.** It is a commercial decision, not a technical one.

---

### P4 — A prebuilt deployment from Windows fails

**Symptom.** The first deployment attempt failed:

```
ENOENT: no such file or directory, stat '/vercel/path0/.vercel/output/functions/_not-found.func'
```

**Cause.** `vercel build` removes duplicate serverless functions. It replaces each duplicate with
a symbolic link to one shared directory. On Windows it writes the link target with backslashes,
for example `products\[slug].func`.

Vercel builds on Linux. On Linux a backslash is not a directory separator. Therefore all 30 links
point to nothing, and `stat` fails.

**Effect.** `vercel deploy --prebuilt` cannot run from a Windows machine.

**Fix.** The repository needs no fix. The GitHub Actions workflows run on `ubuntu-latest`, which
writes forward slashes. Keep `--prebuilt` there.

**Rule.** Do not run a prebuilt deployment from Windows. Deploy from source, or let GitHub Actions
deploy.

---

### P5 — The deployed code is not in version control

**Symptom.** `git ls-remote origin` returns no reference. The GitHub repository is empty.

**Cause.** Nobody pushed the code. The whole Next.js application exists on the local branch
`feat/nextjs-platform`. The local branch `main` is two commits behind. It holds only the old demo.

**Effect.** This is the most serious operational risk in this list.

- Nobody can reproduce the live site from source.
- A disk failure on the development machine destroys the application.
- GitHub Actions cannot deploy, because no code is present to deploy.
- The live site and the repository do not agree. No record shows the difference.

**Fix.** Commit the working tree. Push it. Point `main` at the Next.js application. Then add the
three GitHub secrets.

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | the client token, from Account Settings → Tokens |
| `VERCEL_ORG_ID` | the `orgId` in `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | the `projectId` in the same file |

**Effort.** 30 minutes. Do this first.

---

### P6 — `APP_URL` defaults to localhost

**Symptom.** None in production. The deployment set the correct value before the build.

**Cause.** `src/lib/env.ts` gives `APP_URL` the default `http://localhost:3000`. The build
succeeds with that default. Every page uses `revalidate = false`, so the value becomes part of the
static output.

**Effect, if the value is wrong.** `sitemap.xml`, `robots.txt`, every canonical URL and every
OpenGraph URL point to localhost. Google then indexes nothing. QStash job callbacks go to
localhost.

The build stays green. Only a person who reads the output finds the fault.

**Fix.** Remove the default. Make `APP_URL` a required variable when `NODE_ENV` is `production`. A
build that cannot name its own origin must stop. It must not guess.

**Effort.** 15 minutes.

---

### P7 — Placeholder business data is public

**Symptom.** The live site shows TEMPLATE badges. The telephone number renders as
`+91 00000 00000`. The GSTIN and one testimonial are placeholders.

**Cause.** `src/content/site.ts` sets `isTemplate: true`. This is the designed behaviour. It marks
each value that the client must still supply.

**Effect.** The behaviour is correct. The context is not. Placeholder contact details are now on a
public URL, and a search engine can index them.

**Fix.** Collect the real values from the client. Then set `isTemplate: false`. Until then, keep
the site out of the search index, or accept that the placeholders are visible.

**Effort.** This depends on the client, not on the code.

---

## 4. Order of work

Do the work in this order. Each step removes a risk that a later step would otherwise repeat.

| Step | Task | Problem | Unblocks |
|---|---|---|---|
| 1 | Commit and push. Point `main` at the application. | P5 | Everything |
| 2 | Add the three GitHub secrets. Confirm the workflow deploys. | P5 | Repeatable deployment |
| 3 | Complete the Turnstile widget. | P1 | Lead capture |
| 4 | Set Resend, and Telegram for sales alerts. | P2 | Lead delivery |
| 5 | Make `APP_URL` required in production. | P6 | Silent SEO fault |
| 6 | Agree the hosting plan with the client. | P3 | Legal compliance |
| 7 | Replace the placeholder content. | P7 | Launch |

Steps 1 and 2 give a deployment that any person can repeat. Steps 3 and 4 give a site that
performs its business purpose. Step 6 needs a decision from the client, so start that conversation
early. It has a long lead time.

---

## 5. The test gap that allowed P1

P1 is the important lesson. The site had:

- a green `next build`,
- a clean typecheck and lint,
- 18 passing headless-browser checks,
- HTTP 200 on every route.

All of these passed while the only revenue path was broken.

**Cause.** Every check tested rendering. No check submitted the form.

**Fix.** Build the synthetic lead probe. `HLD.md` §11 risk 2 specifies it. `HLD-FREE-TIER.md` §3.3
specifies it. Neither version is built.

A probe that POSTs a real lead and asserts a 2xx response finds P1 before a deployment. Run it as
a GitHub Actions schedule against production.

---

## 6. Corrections made to the HLD documents

This deployment found places where the design documents and the code disagree. Each document now
starts with an **Implementation status** section:

- `docs/hld/HLD.md`
- `docs/hld/HLD-FREE-TIER.md`

The documents describe the intended design. Several items are not built yet. That is correct for a
phased plan. The corrections cover only the statements that contradict the code.
