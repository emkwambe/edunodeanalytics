# EduNode Analytics — Debt to Production Blueprint

**Version:** 1.0  
**Date:** March 23, 2026  
**Author:** Claude Chat (Lead Architect) + Eddy Mkwambe (Technical Director)  
**Context:** 92% feature readiness (v8 checklist), ~60% infrastructure readiness  
**Goal:** First charter school pilot with real student PII

---

## Sorting Philosophy

Every item is filtered through one question:

> **"What must be true before a real school puts real student PII into this system?"**

This eliminates noise. A 200-student charter school pilot does NOT need multi-region failover, LaunchDarkly, SOC 2 certification, or a public status page. It DOES need: data doesn't get lost, PII doesn't leak, the app doesn't crash silently, and an MTSS coordinator can actually use it.

---

## Tier Map

| Tier | Name | Gate | Timeline |
|------|------|------|----------|
| **T0** | Foundation Fix | Must pass before any new code | Week 1 |
| **T1** | Security & Data Safety | Must pass before any school touches it | Weeks 1-2 |
| **T2** | Observability & Reliability | Must pass before pilot launch | Weeks 2-3 |
| **T3** | CI/CD & Developer Velocity | Must pass before sustained development | Weeks 3-4 |
| **T4** | Demo & Onboarding Polish | Must pass before first school meeting | Week 4 |
| **T5** | Post-Pilot Hardening | After pilot begins, before renewal | Weeks 5-12 |
| **ICE** | Icebox | Not needed for pilot | Backlog |

---

## T0 — Foundation Fix (Week 1)

**Gate:** Build is clean, types are real, test infrastructure exists.

These are blockers. Nothing else moves until T0 is green.

| # | Item | Source | Why Now |
|---|------|--------|---------|
| T0.1 | **Regenerate `database.types.ts`** via Supabase CLI | v8 BLOCKER | 7 tables missing. Every type assertion downstream is a lie. Risk engine types, dosage tables — all fake-typed right now. |
| T0.2 | **Remove all `@ts-nocheck`** from 5 files after types are real | v8 A3 | `evidence-logger.ts`, `ferpa-compliance.ts`, `orchestrator.ts`, `pipeline.ts`, `workflow-manager.ts` — these are compliance and data pipeline files. You cannot ship compliance code that bypasses type checking. |
| T0.3 | **`npx tsc --noEmit` passes clean** | v8 A2 | Proves the entire codebase compiles without hidden type errors. |
| T0.4 | **Add test infrastructure** to `package.json` | Gap list | Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`. Add `"test": "vitest"` script. Confirm `vitest run` executes existing 6 test files. |
| T0.5 | **Commit unstaged `database.types.ts`** and get `git status` clean | v8 A1 | Sprint discipline — no dirty working tree. |
| T0.6 | **`npm run lint` passes** (fix or suppress with documented justification) | v8 A2 | Lint failures hide real bugs. |

### T0 Verification Checklist (30 points)

```
### T0: Foundation Fix (30 points)

- [ ] (5) `database.types.ts` regenerated, includes risk_scores, risk_alerts, 
      risk_config, student_risk_history, risk_evaluation_runs, 
      intervention_sessions, dosage_metrics
- [ ] (5) Zero `@ts-nocheck` directives in entire codebase
- [ ] (5) `npx tsc --noEmit` exits with code 0
- [ ] (5) `vitest run` executes and existing tests pass
- [ ] (5) `npm run lint` exits with code 0 (or documented suppressions only)
- [ ] (5) `git status` shows clean working tree

Score: __/30
Gate: ALL must be ✅ before T1
```

---

## T1 — Security & Data Safety (Weeks 1-2)

**Gate:** PII is protected. An attacker scanning your Vercel deployment can't exfiltrate student data.

| # | Item | Source | Why Now |
|---|------|--------|---------|
| T1.1 | **Tighten CORS** — replace `Access-Control-Allow-Origin: *` with specific domains | Gap Critical | Wide-open CORS on a FERPA app is a compliance failure. Lock to your Vercel domain(s) + localhost for dev. |
| T1.2 | **Add Content-Security-Policy header** | Gap High | Prevents XSS injection. Schools will ask about this. Authorizers will ask about this. |
| T1.3 | **Add CSRF protection** on all mutation endpoints | Gap High | Without this, a malicious page can trigger actions on behalf of a logged-in user. |
| T1.4 | **Env var validation at startup** | Gap High | If `SUPABASE_URL` or `CLERK_SECRET_KEY` is missing, the app should crash immediately with a clear error — not fail silently on the first API call 20 minutes later. Use Zod (already in stack). |
| T1.5 | **Document and verify Supabase backup strategy** | Gap Critical | Before any school's data goes in, you must know: are backups on? What's the retention? Can you restore? Write it in `docs/BACKUP_STRATEGY.md`. |
| T1.6 | **Verify Supabase PITR** (Point-in-Time Recovery) is enabled | Gap High | This is a Supabase dashboard check + documentation. If on Free tier, PITR isn't available — document the risk and mitigation (manual pg_dump schedule). |
| T1.7 | **FERPA audit logging on all student data endpoints** | Gap High | Currently partial. Every `GET/POST/PUT/DELETE` on student PII must hit the compliance logger. |

### T1 Verification Checklist (35 points)

```
### T1: Security & Data Safety (35 points)

- [ ] (5) CORS restricted to explicit domain list in vercel.json / next.config
- [ ] (5) CSP header present on all responses (verify with browser DevTools)
- [ ] (5) CSRF token required on all POST/PUT/DELETE API routes
- [ ] (5) App crashes with clear error if any required env var is missing
- [ ] (5) docs/BACKUP_STRATEGY.md exists with backup schedule, 
      retention period, and tested restore procedure
- [ ] (5) Supabase PITR status documented (enabled or risk-mitigated)
- [ ] (5) FERPA audit log fires on all /api/schools/[id]/students/* endpoints
      (verify via Supabase logs or audit table query)

Score: __/35
Gate: ALL must be ✅ before T2
```

---

## T2 — Observability & Reliability (Weeks 2-3)

**Gate:** When something breaks in production, you know about it before the school does.

| # | Item | Source | Why Now |
|---|------|--------|---------|
| T2.1 | **Install Sentry SDK** (replace stubbed code) | Gap Critical | Currently mock. Real errors vanish silently. Install `@sentry/nextjs`, configure DSN, verify error capture. |
| T2.2 | **Uptime monitoring** | Gap High | Set up Better Uptime or UptimeRobot on `/api/health/live`. Free tier is fine. Get Slack/email alerts. |
| T2.3 | **Cron job failure alerting** | Gap Medium | `/api/cron/risk-evaluation` is the heartbeat. If it fails, risk scores go stale and nobody knows. Add Sentry cron monitoring or a simple webhook-on-failure. |
| T2.4 | **Webhook retry logic** for SIS sync failures | Gap High | If a Clever/ClassLink sync fails mid-batch, what happens? Currently: data loss. Need: retry with exponential backoff, dead letter logging. |
| T2.5 | **Health check expansion** — verify Stripe, external API connectivity | Gap Medium | `/api/health/ready` should confirm database AND Stripe AND Clerk are reachable. |

### T2 Verification Checklist (25 points)

```
### T2: Observability & Reliability (25 points)

- [ ] (5) Sentry captures a test error (throw in dev, verify in Sentry dashboard)
- [ ] (5) Uptime monitor configured, sends alert on /api/health/live failure
- [ ] (5) Risk evaluation cron failure triggers Sentry alert or webhook notification
- [ ] (5) SIS sync adapter retries on failure (test with simulated 500 response)
- [ ] (5) /api/health/ready checks DB + Clerk + Stripe connectivity

Score: __/25
Gate: ALL must be ✅ before T3
```

---

## T3 — CI/CD & Developer Velocity (Weeks 3-4)

**Gate:** Code changes are automatically tested and safely deployed.

| # | Item | Source | Why Now |
|---|------|--------|---------|
| T3.1 | **GitHub Actions CI workflow** — lint, typecheck, test, build on every PR | Gap Critical | Right now, broken code can merge uncaught. Create `.github/workflows/ci.yml`. |
| T3.2 | **Vercel preview deployments** on PR branches | Gap High | Every PR gets a preview URL. Free with Vercel Pro. |
| T3.3 | **Automated Supabase migration** in CI (or documented manual procedure) | Gap High | Migrations exist but aren't applied automatically. At minimum: document the exact steps in the deploy runbook. |
| T3.4 | **Unit test coverage target: critical paths** | Gap High | Don't chase 70% blanket coverage. Write tests for: risk scoring calculation, dosage inference rules, RBAC permission checks, CSV import validation. Target: 40+ tests covering these 4 areas. |
| T3.5 | **Enable Dependabot** for dependency scanning | Gap Medium | One YAML file in `.github/`. Free. Catches vulnerable packages. |

### T3 Verification Checklist (25 points)

```
### T3: CI/CD & Developer Velocity (25 points)

- [ ] (5) GitHub Actions runs lint + typecheck + test + build on PR
- [ ] (5) Vercel preview deployment triggers on PR (verify URL in PR comment)
- [ ] (5) Database migration procedure documented or automated
- [ ] (5) 40+ unit tests covering risk scoring, dosage rules, RBAC, CSV import
- [ ] (5) Dependabot enabled and first scan complete

Score: __/25
Gate: ALL must be ✅ before T4
```

---

## T4 — Demo & Onboarding Polish (Week 4)

**Gate:** An MTSS coordinator can sit down, see the dashboard, and understand it in 5 minutes.

| # | Item | Source | Why Now |
|---|------|--------|---------|
| T4.1 | **Seed data script** — realistic demo school with 150 students | Demo need | You cannot demo with empty dashboards. Need: attendance patterns, risk distribution (60% on-track, 20% watch, 15% at-risk, 5% critical), active interventions, dosage sessions. |
| T4.2 | **CSV import happy path** polished — upload students, attendance, assessments | v8 B3 | Already built. Verify it works end-to-end with real-format CSVs from PowerSchool export templates. |
| T4.3 | **Loading skeletons consistent** across all dashboard pages | Gap Low | 7 exist but coverage is spotty. First impression matters in a demo. |
| T4.4 | **Error states** — friendly messages when data is missing or API fails | UX | "Something went wrong" is not acceptable when a principal is watching. Show: "No attendance data imported yet. Upload your roster to get started." |
| T4.5 | **Onboarding wizard** — verify the flow from sign-up → school created → first data import | Existing | Already scaffolded. Verify it actually works end-to-end. |
| T4.6 | **Operations runbook** — `docs/RUNBOOK.md` | Gap High | What to do when: Sentry fires, cron fails, school reports data mismatch, new school onboards. |

### T4 Verification Checklist (30 points)

```
### T4: Demo & Onboarding Polish (30 points)

- [ ] (5) Seed script populates demo school with realistic risk distribution
- [ ] (5) CSV import: upload 150-student roster → students appear in dashboard
- [ ] (5) All dashboard pages show loading skeletons (no blank screens)
- [ ] (5) Missing data shows helpful empty states (not errors or blank cards)
- [ ] (5) Onboarding: sign up → create school → import CSV → see dashboard
- [ ] (5) docs/RUNBOOK.md covers: incident response, onboarding, cron failure

Score: __/30
Gate: ALL must be ✅ before scheduling first school demo
```

---

## T5 — Post-Pilot Hardening (Weeks 5-12)

These matter but can wait until the pilot is running. Prioritize based on pilot feedback.

| # | Item | Priority | Notes |
|---|------|----------|-------|
| T5.1 | Structured JSON logging + log aggregation | Medium | Replace console.log. Axiom free tier or Vercel Logs. |
| T5.2 | E2E tests with Playwright | Medium | Cover: login → dashboard → student 360 → intervention create. |
| T5.3 | Load testing with k6 | Medium | Simulate 50 concurrent users (realistic for a single school). |
| T5.4 | PII encryption at rest | Medium | Supabase TDE or column-level encryption for SSN/IEP data. |
| T5.5 | API documentation (OpenAPI spec) | Medium | Needed when districts want to integrate. |
| T5.6 | Data retention policy automation | Medium | Auto-archive/purge after configurable period. |
| T5.7 | Migration rollback procedures | Medium | Document how to undo each migration. |
| T5.8 | Circuit breakers for external APIs | Medium | Prevent cascade failures when PowerSchool/Clever is down. |
| T5.9 | Incident response plan | Medium | Formal FERPA breach notification procedure. |
| T5.10 | SOC 2 control mapping | Medium | Start documenting for enterprise/district sales. |

---

## ICE — Icebox (Not Needed for Pilot)

These are real items but have zero impact on pilot success:

| Item | Why Iceboxed |
|------|-------------|
| Multi-region failover | Single Vercel region is fine for <500 users |
| Public status page | No external customers yet |
| LaunchDarkly / feature flag service | Local feature gates work fine at this scale |
| PWA / offline support | Schools have WiFi. Mobile is out of scope for V1. |
| Redis HA | Only needed if rate limiting becomes an issue |
| API versioning strategy | One customer. No breaking change risk yet. |
| SAST scanning (CodeQL/SonarQube) | Nice to have. Dependabot covers the critical path. |
| Secrets management (Vault/AWS SM) | Vercel env vars are sufficient for pilot scale |
| Docker security scanning | Only relevant if self-hosting, which isn't the pilot path |
| APM / Datadog | Sentry + Vercel Analytics covers pilot needs |
| Connection pooling verification | Supabase handles this. Verify only if you see connection errors. |

---

## Sprint Sequence Summary

```
T0 ──→ T1 ──→ T2 ──→ T3 ──→ T4 ──→ PILOT LAUNCH
 │       │       │       │       │
 │       │       │       │       └─ Demo-ready
 │       │       │       └─ Safe to iterate
 │       │       └─ You'll know when it breaks
 │       └─ PII is protected
 └─ Codebase compiles honestly
                                    T5 ──→ runs during pilot
```

**Total points across T0-T4:** 145 points  
**Estimated calendar:** 4 weeks of focused sprints  
**Estimated Claude Code sprints:** 8-10 (some tiers split into 2 sprints)

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Vercel over Cloudflare for hosting | Next.js 16 native support, preview deploys, built-in analytics. Cloudflare Pages has Next.js gaps. |
| Sentry over Datadog for monitoring | Free tier is generous, Next.js SDK is mature, covers errors + cron monitoring. |
| Vitest over Jest | Already referenced in v8 checklist, faster, native ESM support. |
| CORS + CSP before CI/CD | A security hole in production is worse than a broken PR check. |
| Targeted tests over blanket coverage | 40 tests on risk scoring + RBAC + CSV import > 200 tests on UI components. |
| Seed data script over manual demo | Reproducible demos. Reset and re-seed before every school meeting. |

---

## What's NOT in This Blueprint

This blueprint covers **infrastructure debt**. It does NOT cover:

- **Feature development** (new dashboard widgets, new adapters, predictive analytics)
- **Business execution** (pilot outreach, pricing, contracts, partnership agreements)
- **Landing page / marketing site**
- **RealityDB integration** for synthetic test data

Those are separate workstreams. This blueprint is purely: **"Make what exists safe, observable, testable, and demo-ready."**

---

## Next Action

**Eddy decides:** Do we start T0 now?

If yes, I'll produce the exact Claude Code sprint prompt for T0.1 (regenerate `database.types.ts`) and the PowerShell commands for Eddy to run locally.

One sprint. One checklist. 100% pass. Then T0.2.
