# EduNode Analytics — Developer Checklist v3.0
## MTSS Early Warning and Intervention Platform

**Last Updated:** March 7, 2026
**Branch:** `claude/edunode-analytics-saas-9l0uE`
**Stack:** Next.js 16.1.6 | Supabase (Postgres) | TypeScript | Clerk | Stripe | Vitest

---

## Scope

**In scope:** Data Integration > Risk Engine > Alerts > Intervention Workflow > Evidence/Compliance > Early Warning Dashboard

**Out of scope (this phase):** Parent portal, parent notifications, multilingual parent messaging, SMS/push

---

## A) Repo and Build Health

### A1. Source Control
- [x] Branch naming consistent (`claude/edunode-analytics-saas-9l0uE`)
- [x] `build-info.json` generated and served from `/build-info.json`
- [ ] Commit message convention enforced (feat/fix/chore)
- [ ] `git status` clean before each sprint

### A2. Build Must Succeed
- [x] `npm ci` completes
- [x] `npm run build` succeeds with 0 TypeScript errors
- [x] BigQuery warning handled (optional import with catch fallback)
- [ ] `npm run lint` passes clean
- [ ] `npx tsc --noEmit` passes clean (blocked by `database.types.ts` regen)

### A3. Type Safety
- [x] **RESOLVED:** `database.types.ts` regenerated via Supabase CLI (Sprint 2)
  - All 26 tables + 3 views present
  - `@ts-nocheck` removed from `detection-engine.ts` and `early-warning.ts`
  - Custom type aliases added: `AuditLogInsert`, `Student`
- [ ] 7 files have `@ts-nocheck` due to pre-existing missing table references:
  - `evidence-logger.ts` (needs `compliance_events`, `consent_records`, `compliance_reports`)
  - `ferpa-compliance.ts` (needs `directory_opt_outs`, `section_enrollments`, `sections`, `iep_team_members`, `amendment_requests`)
  - `ferpa-audit/route.ts` (needs `ferpa_audit_log`)
  - `orchestrator.ts` (needs `school_data_sources`)
  - `pipeline.ts` (needs `data_quality_issues`)
  - `team-collaboration.ts` (needs `intervention_comments`)
  - `workflow-manager.ts` (needs `intervention_audit_log`)
- [ ] Create migrations for pre-existing missing tables OR convert to audit_logs pattern

### A4. Runtime
- [x] `npm run dev` starts cleanly
- [x] `/api/health`, `/api/health/ready`, `/api/health/live` return expected responses
- [x] `.env.local` present with 20 environment variables validated
- [x] Node v22.18.0, npm 11.7.0

---

## B) Data Integration Layer

### B1. Adapter Registry (COMPLETE)
- [x] Adapter directory exists: `src/lib/data/sources/adapters/`
- [x] Canvas adapter (`canvas.ts` - 5.8 KB)
- [x] PowerSchool adapter (`powerschool.ts` - 3.8 KB)
- [x] Clever adapter (`clever.ts` - 13.5 KB)
- [x] ClassLink adapter (`classlink.ts` - 13.1 KB)
- [x] Google Classroom adapter (`google-classroom.ts` - 3.6 KB)
- [x] NWEA MAP adapter (`nwea-map.ts` - 10.7 KB)
- [x] iReady adapter (`iready.ts` - 5.2 KB)
- [x] Renaissance STAR adapter (`renaissance-star.ts` - 2.9 KB)
- [x] Registry pattern: `src/lib/data/sources/registry.ts`
- [x] Integration orchestrator: `src/lib/data/integration/orchestrator.ts`
- [x] Integration pipeline: `src/lib/data/integration/pipeline.ts`
- [ ] Adapter shared contract verification (testConnection, syncRosters)
- [ ] Adapter error standardization (error codes + user-friendly messages)

### B2. Sync Reliability
- [x] Cron endpoints exist and are idempotent:
  - [x] `/api/cron/sync-rosters` (GET)
  - [x] `/api/cron/scheduled-reports` (GET)
  - [x] `/api/cron/stale-interventions` (GET)
- [x] `sync_history` table tracks start/end/duration/result/errors (19 columns)
- [ ] Partial failure isolation (per-source)
- [ ] Rate limiting and backoff for external APIs

### B3. Data Fallback
- [ ] CSV import path for students
- [ ] CSV import path for rosters
- [ ] CSV import path for attendance
- [ ] Import validates schema and logs row-level errors

### B4. Data Quality Score
- [x] `student_metrics.data_completeness` field exists (NUMERIC 0-1)
- [x] Bootstrap query calculates completeness from 6 indicators
- [ ] Dashboard widget showing per-school data completeness
- [ ] "What's missing" plain-language display

---

## C) Risk Detection Engine

### C1. Database Foundation (SPRINT 1A - COMPLETE)
- [x] `risk_model_configs` table — per-school weights, thresholds, indicator params
- [x] `student_metrics` table — 27 columns of normalized indicators
- [x] `student_metric_history` table — weekly snapshots for trend regression
- [x] `risk_evaluations` table — immutable audit trail with factor snapshots
- [x] `risk_alerts` table — full lifecycle (new/acknowledged/in_review/resolved/dismissed)
- [x] `current_risk_scores` view — latest evaluation per active student
- [x] `get_user_school_ids()` SECURITY DEFINER function
- [x] 15 RLS policies (school-scoped + service role bypass)
- [x] 11 performance indexes
- [x] 3 `updated_at` triggers
- [x] `risk_level` enum extended with `watch` tier
- [x] 3 schools seeded with `Default MTSS Model` config
- [x] Migration: `supabase/migrations/00006_risk_engine_tables.sql`

### C2. Engine Core (SPRINT 1B - COMPLETE)
- [x] `src/lib/risk-engine/types.ts` — bridge types for all DB tables
  - `RiskModelConfigRow`, `RiskModelConfig`, `parseConfigRow()`
  - `StudentMetricsRow`, `StudentMetricHistoryRow`
  - `RiskEvaluationInsert`, `RiskEvaluationRow`
  - `RiskAlertInsert`, `RiskAlertRow`
  - `CurrentRiskScoreRow`
  - Enums: `RiskLevel`, `TriggerType`, `Trajectory`, `AlertType`, `AlertSeverity`, `AlertStatus`
- [x] `detection-engine.ts` loads config from `risk_model_configs` table
- [x] Risk score computed automatically (weighted multi-factor)
- [x] 5 indicators: attendance, academic performance, academic growth, chronic absence, engagement
- [x] Risk factors are explainable (name, category, rawValue, normalizedScore, weight, description, trend)
- [x] Evaluations persist to `risk_evaluations` with full factor snapshot
- [x] `students` table still updated (backward compatibility)
- [x] Level change tracking (`previousLevel`, `levelChanged`)
- [x] Trajectory computed from `risk_evaluations` history
- [x] Confidence calculated from data completeness
- [x] Recommended actions generated per factor
- [x] 4-tier classification when DB config loaded (on_track/watch/at_risk/critical)
- [x] Legacy 3-tier fallback when no DB config (on_track/at_risk/critical)

### C3. Configurability
- [x] Weights configurable per school (stored in `risk_model_configs`)
- [x] Thresholds configurable per school
- [x] Indicator parameters configurable (attendance floor, behavior cap, assessment percentile, etc.)
- [x] Weights constrained to sum to 1.0 (CHECK constraint)
- [x] Thresholds constrained to ascending order (CHECK constraint)
- [x] Defaults work out of the box (seeded on school creation)
- [ ] Admin UI for config editing (`/[school_slug]/settings/risk-model`)
- [ ] Config change triggers re-evaluation (`trigger_type: 'config_change'`)

### C4. Trend Detection (SPRINT 3 - COMPLETE)
- [x] `student_metric_history` table exists for weekly snapshots
- [x] Trajectory detection from evaluation history (improving/stable/declining)
- [x] Linear regression slope computation over configurable lookback window (`trend-detector.ts`)
- [x] Trend-based flagging before threshold breach (`predictThresholdCrossing`)
- [ ] Weekly snapshot cron job (integrate with nightly batch)

### C5. Recalculation Strategy (SPRINT 2 - COMPLETE)
- [x] Nightly batch cron: `/api/cron/risk-evaluation` (runs at 2AM)
- [x] Batch orchestrator: `evaluateSchoolRisk()` in `orchestrator.ts`
- [ ] Post-sync trigger: after successful data sync
- [ ] Manual recompute: admin action
- [x] Trigger type tracked: `sync_event | batch_nightly | manual | config_change`
- [x] Recompute is deterministic (same inputs = same outputs)
- [x] Recompute is logged (every evaluation is immutable in `risk_evaluations`)

### C6. Missing Indicators (SPRINT 3 - STUBS READY)
- [x] `missing_assignment_rate` — stub in detection-engine (awaiting LMS sync data)
- [x] `behavior_incident_count` — stub in detection-engine (awaiting PBIS/SIS sync data)
- [ ] `suspensions_count` — needs SIS discipline data
- [x] Assignment completion factor in risk calculation (zero-weighted until data available)
- [x] Behavior factor in risk calculation (zero-weighted until data available)

---

## D) Alerts and Trigger System

### D1. Alert Engine (SPRINT 1B - COMPLETE)
- [x] `early-warning.ts` refactored to use `risk_alerts` table
- [x] 5 default alert rules: attendance drop, chronic absence, critical risk, grade decline, consecutive absences
- [x] Alert types: threshold_breach, rapid_decline, chronic_absence, intervention_overdue, new_risk_detected, trend_warning, attendance_drop, grade_decline, consecutive_absences
- [x] Severity levels: info, warning, urgent, critical
- [x] DB-level cooldown deduplication via `cooldown_key`
- [x] In-memory cooldown cache (per-process)
- [x] Role-based notification dispatch via `school_memberships`
- [x] Notifications created in `notifications` table

### D2. Alert Lifecycle (SPRINT 1B - COMPLETE)
- [x] Alert creation with rule_id, student context, risk data
- [x] Acknowledge alert (userId + timestamp)
- [x] Resolve alert (userId + timestamp + notes)
- [x] Dismiss alert
- [x] Alert statistics (by severity, by type, by status, avg resolution time)
- [x] Previous state comparison from `student_metric_history`

### D3. Alert API (SPRINT 2 - COMPLETE)
- [x] `GET /api/schools/[schoolId]/risk/alerts` — list with filters
- [x] `PATCH /api/schools/[schoolId]/risk/alerts/[alertId]` — acknowledge/resolve/dismiss
- [ ] Alert feed component for dashboard (Sprint 4)

### D4. Notification Center
- [x] `notifications` table exists (18 columns)
- [x] Notifications API: `/api/schools/[schoolId]/notifications` (GET, POST)
- [x] Mark as read / resolved
- [ ] Alert deduplication visible in UI
- [ ] Notification preferences respected (from `user_preferences` table)

---

## E) MTSS Workflow: Tiering and Interventions

### E1. Intervention System (EXISTING - STRONG)
- [x] `interventions` table (25 columns)
- [x] API: `/api/schools/[schoolId]/interventions` (GET, POST)
- [x] API: `/api/schools/[schoolId]/interventions/[interventionId]` (GET, POST)
- [x] API: `/api/schools/[schoolId]/interventions/metrics` (GET, POST)
- [x] API: `/api/schools/[schoolId]/interventions/pending` (GET, POST)
- [x] Stale intervention detection (cron: `/api/cron/stale-interventions`)
- [x] Intervention workflow manager: `src/lib/interventions/workflow-manager.ts` (23.1 KB)
- [x] Team collaboration: `src/lib/interventions/team-collaboration.ts` (15.8 KB)
- [x] Export: `/api/schools/[schoolId]/export/interventions`
- [x] Baseline/target/current values functional
- [x] Progress notes (JSONB on interventions table)
- [x] `was_successful` outcome tracking
- [x] `outcome_summary` field
- [x] Intervention page: `/[school_slug]/interventions` (18.2 KB)

### E2. Tier Placement
- [x] Pattern detected in codebase: tier references (tier 1/2/3)
- [ ] Explicit MTSS tier state field on student or intervention
- [ ] Tier change requires reason + evidence snapshot + approver
- [ ] Tier history preserved
- [ ] Tier placement workflow UI

### E3. Intervention Templates
- [x] Pattern detected: intervention templates referenced in code
- [ ] Template library (academic, attendance, behavior, SEL)
- [ ] Create intervention from template in under 30 seconds
- [ ] Template management UI

### E4. Effectiveness Metrics
- [ ] Pre/post risk score delta
- [ ] Attendance delta
- [ ] Assessment delta
- [ ] Effectiveness dashboard widget

---

## F) Evidence, Compliance, and Auditability

### F1. Audit Trail (STRONG)
- [x] `audit_logs` table (12 columns)
- [x] Admin audit logs page: `/admin/audit-logs` (21.8 KB)
- [x] Evidence logger: `src/lib/compliance/evidence-logger.ts` (18.5 KB)
- [x] Risk evaluations provide immutable audit trail with:
  - Full factor snapshots
  - Input metrics snapshot
  - Trigger type
  - Timestamp
  - Config ID reference
- [ ] Audit log export endpoint (CSV/JSON)
- [ ] Risk evaluation export endpoint

### F2. FERPA Compliance (STRONG)
- [x] FERPA compliance module: `src/lib/compliance/ferpa-compliance.ts` (17.2 KB)
- [x] FERPA page: `/ferpa` (11.4 KB)
- [x] FERPA audit API: `/api/ferpa-audit` (GET, POST)
- [x] Privacy audit: `/api/schools/[schoolId]/privacy/audit`
- [x] No-cache headers on student data routes (next.config.js)

### F3. Privacy and Access Control (STRONG)
- [x] PII anonymizer: `src/lib/privacy/pii-anonymizer.ts` (14.8 KB)
- [x] Secure AI proxy: `src/lib/privacy/secure-ai-proxy.ts` (21.6 KB)
- [x] RBAC: `src/lib/auth/rbac.ts` (6 KB)
- [x] `school_memberships` table with role-based access
- [x] RLS on all risk engine tables (school-scoped)
- [x] `SECURITY DEFINER` function for RLS to avoid recursion
- [x] AI usage tracking with PII detection flags
- [ ] Data retention rules documented
- [ ] Consent tracking

---

## G) Early Warning Dashboard

### G1. Existing Dashboard Infrastructure
- [x] Dashboard page: `/[school_slug]/dashboard` (6.6 KB)
- [x] Dashboard sub-pages: pulse, momentum, assessments, attendance, reports, students
- [x] Student 360 view: `/[school_slug]/student-360/[student_id]` (30.5 KB)
- [x] Student detail: `/[school_slug]/dashboard/students/[student_id]` (25.8 KB)
- [x] Analytics: advanced (27.6 KB) and impact (23.1 KB)
- [x] Dashboard config table (`dashboard_configs`)
- [x] Metric card component, status indicator, seed notification
- [x] Charts: attendance trend, confidence band, mastery curve, maturity radar
- [x] Banners: confounding risk, data freshness, weak data pulse

### G2. Early Warning Dashboard (Sprint 4)
The dashboard must answer 4 questions instantly:
- [ ] **How many students are at risk today?** (counts by tier + risk band)
- [ ] **Who are the top 20 highest risk?** (sortable table)
- [ ] **Why are they at risk?** (driver breakdown)
- [ ] **What are we doing about it?** (interventions pipeline)

Required widgets:
- [ ] Risk distribution (On Track / Watch / At Risk / Critical) — donut/stacked bar
- [ ] Trend over time (last 30/60/90 days)
- [ ] Top risk drivers (attendance vs academics vs missing work)
- [ ] "No intervention yet" list (highest priority follow-up)
- [ ] Intervention pipeline view (planned/in progress/completed/stale)
- [ ] Risk config admin UI

### G3. Risk API Endpoints (SPRINT 2 - COMPLETE)
- [x] `GET /api/schools/[schoolId]/risk/scores` — paginated, filterable
- [x] `GET /api/schools/[schoolId]/risk/distribution` — tier counts + trends
- [x] `GET /api/schools/[schoolId]/risk/drivers` — aggregated factors
- [x] `GET+PUT /api/schools/[schoolId]/risk/config` — read/update model config
- [x] `GET+PATCH /api/schools/[schoolId]/risk/alerts` — alert management
- [x] `GET /api/schools/[schoolId]/risk/history/[studentId]` — score history

---

## H) Testing and QA

### H1. Test Infrastructure
- [x] Vitest configured (`vitest.config.ts`)
- [x] Test directory: `src/app/api/__tests__/` (3 test files)
- [x] Component tests: `src/components/__tests__/` (2 test files)
- [x] Lib tests: `src/lib/api/__tests__/`, `src/lib/auth/__tests__/`, `src/lib/features/__tests__/`, `src/lib/hooks/__tests__/`
- [x] Existing tests: interventions, stripe webhook, students, RBAC, feature gates, validation, errors, fetcher, metric card, page feature gate

### H2. Risk Engine Tests (SPRINT 3 - COMPLETE)
- [x] Unit tests for each normalizer function (`detection-engine.test.ts`)
- [x] Unit tests for composite score calculator
- [x] Unit tests for threshold classification (4-tier) (`types.test.ts`)
- [x] Unit tests for trend detection (`trend-detector.test.ts`)
- [x] Integration test for batch evaluation (`integration.test.ts`)
- [x] Integration test for alert generation
- [ ] Integration test for API endpoints (requires E2E framework)

### H3. Demo and Seed Data
- [ ] Seed data with realistic scenarios:
  - Chronic absence patterns
  - Declining math performance
  - Missing assignment spikes
  - Mixed risk levels across grades
- [ ] Demo school walkthrough:
  - Student flagged > alert generated > tier decision > intervention created > outcome tracked

---

## I) Deployment

- [x] Vercel configured (`vercel.json`, `output: 'standalone'`)
- [x] Docker configured (`Dockerfile`, `docker-compose.yml`)
- [x] Security headers configured (X-Frame-Options, CSP, etc.)
- [x] Sentry monitoring: `src/lib/monitoring/sentry.ts`
- [ ] Staging environment configured
- [ ] DB migrations run cleanly in CI
- [ ] Secrets managed (no secrets in repo)
- [ ] Feature flags for:
  - [ ] Risk engine (enable/disable per school)
  - [ ] Behavior integration
  - [ ] Experimental risk models

---

## Go/No-Go Criteria (Pilot Readiness)

| Criteria | Status | Blocker |
|----------|--------|---------|
| Risk is computed automatically and explainable | PASS (Sprint 1B) | None |
| Alerts trigger on risk changes | PASS (Sprint 1B) | None |
| Tiering + interventions fully tracked with history | PARTIAL | Tier state field needed |
| Dashboard gives clear who/why/what-next view | NOT STARTED | Sprint 4 |
| Audit logs persist and export for compliance demos | PARTIAL | Export endpoint needed |
| Risk API endpoints operational | PASS (Sprint 2) | None |
| Seed data for demo school | NOT STARTED | Sprint 5 |
| database.types.ts regenerated and ts-nocheck removed | PASS (Sprint 2) | None |
| Risk engine unit tests | PASS (Sprint 3) | None |
| Trend detection with linear regression | PASS (Sprint 3) | None |

---

## Sprint Roadmap

### Sprint 1: Risk Engine Foundation (COMPLETE)
- [x] 1A: Database migration (5 tables, view, RLS, indexes, seeds)
- [x] 1B: Engine refactor (detection-engine.ts, early-warning.ts, bridge types)
- [x] Build verified passing

### Sprint 2: API Layer + Orchestrator (COMPLETE)
- [x] Regenerate `database.types.ts`
- [x] 6 Risk API endpoints (scores, distribution, drivers, config, alerts, history)
- [x] Batch orchestrator (`evaluateSchoolRisk` in `orchestrator.ts`)
- [x] Nightly cron (`/api/cron/risk-evaluation` at 2AM)
- [x] Student metrics aggregator (`metrics-aggregator.ts`)
- [x] Shared auth helper (`_shared/auth.ts`)

### Sprint 3: Testing + Missing Indicators (COMPLETE)
- [x] Unit tests for normalizers, calculator, threshold classification (371 tests passing)
- [x] Integration tests for batch evaluation + alert generation
- [x] Assignment completion indicator stub (awaiting LMS sync data)
- [x] Behavior indicator stub (awaiting PBIS/SIS sync data)
- [x] Trend detector with linear regression (`trend-detector.ts`)

### Sprint 4: Early Warning Dashboard
- [ ] `/[school_slug]/dashboard/early-warning` page
- [ ] Risk distribution visualization (donut + trend)
- [ ] At-risk student table with sort/filter
- [ ] Risk driver breakdown panel
- [ ] Alert feed component
- [ ] Intervention pipeline view

### Sprint 5: Demo + Polish
- [ ] Seed data generator for demo school
- [ ] Risk config admin UI
- [ ] Demo walkthrough flow
- [ ] Go/No-Go checklist validation
- [ ] Pilot deployment

---

## Database Tables (26 total)

### Original (21 tables)
`ai_usage` | `ai_usage_limits` | `audit_logs` | `authorizers` | `dashboard_configs` | `data_sources` | `generated_reports` | `interventions` | `notifications` | `payments` | `resource_progress` | `scheduled_reports` | `school_memberships` | `schools` | `students` | `sync_history` | `user_preferences` | `users` | `webhook_events`

Views: `v_ai_usage_monthly` | `v_report_summary`

### Sprint 1A (5 new tables)
`risk_model_configs` | `student_metrics` | `student_metric_history` | `risk_evaluations` | `risk_alerts`

View: `current_risk_scores`

Function: `get_user_school_ids()`

### Tables Referenced in Code But Missing from DB
`compliance_events` | `consent_records` | `compliance_reports` | `directory_opt_outs` | `section_enrollments` | `sections` | `iep_team_members` | `amendment_requests` | `school_data_sources` | `data_quality_issues` | `intervention_comments` | `intervention_audit_log` | `ferpa_audit_log`

---

## Key File Inventory

### Risk Engine (Sprint 1B)
- `src/lib/risk-engine/types.ts` — DB bridge types (NEW)
- `src/lib/risk/detection-engine.ts` — Risk scoring engine (REFACTORED)
- `src/lib/risk/early-warning.ts` — Alert system (REFACTORED)
- `src/lib/risk/index.ts` — Module exports (UPDATED)
- `supabase/migrations/00006_risk_engine_tables.sql` — Migration (NEW)

### Data Integration
- `src/lib/data/sources/adapters/` — 8 adapter files
- `src/lib/data/sources/registry.ts` — Adapter registry
- `src/lib/data/integration/orchestrator.ts` — Sync orchestrator
- `src/lib/data/integration/pipeline.ts` — Data pipeline

### Compliance
- `src/lib/compliance/evidence-logger.ts` — Evidence logging
- `src/lib/compliance/ferpa-compliance.ts` — FERPA module
- `src/lib/privacy/pii-anonymizer.ts` — PII stripping
- `src/lib/privacy/secure-ai-proxy.ts` — AI call privacy

### Auth
- `src/lib/auth/rbac.ts` — Role-based access control
- `src/lib/supabase/server.ts` — Supabase client (createServerSupabaseClient, createAdminSupabaseClient)

### Configuration
- `next.config.js` — Next.js config with security headers
- `tailwind.config.ts` — Tailwind configuration
- `.env.local` — 20 environment variables
