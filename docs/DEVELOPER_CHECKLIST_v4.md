# EduNode Analytics - Developer Checklist v4.0
## MTSS Early Warning and Intervention Platform

**Last Updated:** March 7, 2026
**Branch:** `claude/edunode-analytics-saas-9l0uE`
**Stack:** Next.js 16.1.6 | Supabase (Postgres) | TypeScript | Clerk | Stripe | Vitest

---

## Changelog from v3.0

| Section | Change |
|---------|--------|
| Sprint 1A | Marked COMPLETE with commit references |
| Sprint 1B | Marked COMPLETE with commit references |
| Sprint 2 | Updated with implemented API endpoints |
| Sprint 3 | Added dosage analysis tasks |
| Sprint 4 | Added dashboard component tasks |
| Section G | Expanded with component specifications |
| New Section I | Added Alignment Matrix reference |

---

## Scope

**In scope:** Data Integration > Risk Engine > Alerts > Intervention Workflow > Dosage Analysis > Evidence/Compliance > Early Warning Dashboard

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
- [ ] **BLOCKER:** `database.types.ts` must be regenerated via Supabase CLI
  - Current file is stale (missing 5 risk engine tables + views)
  - Supabase CLI auth required: `npx supabase login` then `npx supabase gen types`
  - Once regenerated: remove `@ts-nocheck` from 7 files
- [ ] 7 files have `@ts-nocheck` due to missing table types:
  - `src/lib/risk/detection-engine.ts` (Sprint 1B - needs risk tables)
  - `src/lib/risk/early-warning.ts` (Sprint 1B - needs risk tables)
  - `src/lib/compliance/evidence-logger.ts` (pre-existing)
  - `src/lib/compliance/ferpa-compliance.ts` (pre-existing)
  - `src/lib/data/integration/orchestrator.ts` (pre-existing)
  - `src/lib/data/integration/pipeline.ts` (pre-existing)
  - `src/lib/interventions/workflow-manager.ts` (pre-existing)

### A4. Runtime
- [x] `npm run dev` starts cleanly
- [x] `/api/health`, `/api/health/ready`, `/api/health/live` return expected responses
- [x] `.env.local` present with 20 environment variables validated
- [x] Node v22.18.0, npm 11.7.0

---

## B) Data Integration Layer

### B1. Adapter Registry (COMPLETE)
- [x] 8 adapters: Canvas, PowerSchool, Clever, ClassLink, Google Classroom, NWEA MAP, iReady, Renaissance STAR
- [x] Registry pattern: `src/lib/data/sources/registry.ts`
- [x] Integration orchestrator and pipeline
- [ ] Adapter shared contract verification (testConnection, syncRosters)
- [ ] Adapter error standardization

### B2. Sync Reliability
- [x] Cron endpoints exist and are idempotent
- [x] `sync_history` table tracks sync operations
- [ ] Partial failure isolation (per-source)
- [ ] Rate limiting and backoff for external APIs

### B3. Data Fallback
- [ ] CSV import path for students (Sprint 5)
- [ ] CSV import path for rosters (Sprint 5)
- [ ] CSV import path for attendance (Sprint 5)
- [ ] Import validates schema and logs row-level errors

### B4. Data Quality Score
- [x] `student_metrics.data_completeness` field exists (NUMERIC 0-1)
- [x] Bootstrap query calculates completeness from 8 indicators
- [ ] Dashboard widget showing per-school data completeness (Sprint 4)
- [ ] "What's missing" plain-language display (Sprint 4)

---

## C) Risk Detection Engine

### C1. Database Foundation (SPRINT 1A - COMPLETE)
- [x] `risk_model_configs` table - per-school weights, thresholds, indicator params
- [x] `student_metrics` table - 27 columns of normalized indicators
- [x] `student_metric_history` table - weekly snapshots for trend regression
- [x] `risk_evaluations` table - immutable audit trail with factor snapshots
- [x] `risk_alerts` table - full lifecycle (new/acknowledged/in_review/resolved/dismissed)
- [x] `current_risk_scores` view - latest evaluation per active student
- [x] `get_user_school_ids()` SECURITY DEFINER function
- [x] 15 RLS policies (school-scoped + service role bypass)
- [x] 11 performance indexes
- [x] 3 `updated_at` triggers
- [x] `risk_level` enum extended with `watch` tier
- [x] Migration: `supabase/migrations/00006_risk_engine_tables.sql`

**Commits:** `eb14189`, `98943dc`

### C2. Engine Core (SPRINT 1B - COMPLETE)
- [x] `src/lib/risk-engine/types.ts` - 326 lines of bridge types
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
- [x] Legacy 3-tier fallback when no DB config

**Commits:** `c0dbea4`, `e528b13`

### C3. Batch Orchestration (SPRINT 2 - COMPLETE)
- [x] `src/lib/risk-engine/metrics-aggregator.ts` - 455 lines
- [x] `src/lib/risk-engine/orchestrator.ts` - 230 lines
- [x] `evaluateSchoolRisk()` coordinates full pipeline
- [x] Nightly batch cron: `/api/cron/risk-evaluation`

### C4. Configurability
- [x] Weights configurable per school (stored in `risk_model_configs`)
- [x] Thresholds configurable per school
- [x] Indicator parameters configurable
- [x] Weights constrained to sum to 1.0 (CHECK constraint)
- [x] Thresholds constrained to ascending order (CHECK constraint)
- [x] Defaults work out of the box
- [ ] Admin UI for config editing (`/[school_slug]/settings/risk-model`) - Sprint 5

### C5. Trend Detection
- [x] `student_metric_history` table exists for weekly snapshots
- [x] Trajectory detection from evaluation history (improving/stable/declining)
- [ ] Linear regression slope computation over configurable lookback window (Sprint 3)
- [ ] Trend-based flagging before threshold breach (Sprint 3)
- [x] Weekly snapshot creation in metrics-aggregator

### C6. Missing Indicators (Future)
- [ ] `missing_assignment_rate` - needs LMS sync to populate
- [ ] `behavior_incident_count` - needs PBIS connector
- [ ] `suspensions_count` - needs SIS discipline data
- [ ] Assignment completion factor in risk calculation
- [ ] Behavior factor in risk calculation

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

### D3. Alert API (SPRINT 2 - COMPLETE)
- [x] `GET /api/schools/[schoolId]/risk/alerts` - list with filters
- [x] `PATCH /api/schools/[schoolId]/risk/alerts/[alertId]` - acknowledge/resolve/dismiss

### D4. Notification Center
- [x] `notifications` table exists (18 columns)
- [x] Notifications API: `/api/schools/[schoolId]/notifications`
- [x] Mark as read / resolved
- [ ] Alert deduplication visible in UI (Sprint 4)
- [ ] Notification preferences respected (Sprint 5)

---

## E) MTSS Workflow: Tiering and Interventions

### E1. Intervention System (EXISTING - STRONG)
- [x] `interventions` table (25 columns)
- [x] Full CRUD API endpoints
- [x] Stale intervention detection cron
- [x] Intervention workflow manager (23.1 KB)
- [x] Team collaboration module (15.8 KB)
- [x] Progress notes, baseline/target/current values
- [x] `was_successful` outcome tracking
- [x] Intervention page: `/[school_slug]/interventions`

### E2. Tier Placement
- [x] Pattern detected: tier references in codebase
- [ ] Explicit MTSS tier state field on intervention
- [ ] Tier change requires reason + evidence snapshot + approver
- [ ] Tier history preserved
- [ ] Tier placement workflow UI

### E3. Intervention Templates
- [x] Pattern detected: intervention templates referenced
- [ ] Template library (academic, attendance, behavior, SEL)
- [ ] Create intervention from template in <30 seconds
- [ ] Template management UI

### E4. Dosage Analysis (Sprint 3)
- [ ] `intervention_dosage_metrics` table migration
- [ ] `dosage-analyzer.ts` core computation
- [ ] 10 inference rules implemented
- [ ] Session logging in progress_notes
- [ ] DosagePlan validation in interventions.metadata
- [ ] Dosage API endpoints
- [ ] Dashboard dosage widgets

---

## F) Evidence, Compliance, and Auditability

### F1. Audit Trail (STRONG)
- [x] `audit_logs` table (12 columns)
- [x] Admin audit logs page: `/admin/audit-logs`
- [x] Evidence logger module
- [x] Risk evaluations provide immutable audit trail
- [ ] Audit log export endpoint (CSV/JSON) - Sprint 5
- [ ] Risk evaluation export endpoint - Sprint 5

### F2. FERPA Compliance (STRONG)
- [x] FERPA compliance module
- [x] FERPA page: `/ferpa`
- [x] FERPA audit API
- [x] Privacy audit API
- [x] No-cache headers on student data routes

### F3. Privacy and Access Control (STRONG)
- [x] PII anonymizer module
- [x] Secure AI proxy
- [x] RBAC module
- [x] `school_memberships` with role-based access
- [x] RLS on all risk engine tables
- [ ] Data retention rules documented
- [ ] Consent tracking

---

## G) Early Warning Dashboard

### G1. Existing Dashboard Infrastructure
- [x] Dashboard page: `/[school_slug]/dashboard`
- [x] Dashboard sub-pages: pulse, momentum, assessments, attendance, reports, students
- [x] Student 360 view: `/[school_slug]/student-360/[student_id]`
- [x] Charts: attendance trend, confidence band, mastery curve, maturity radar
- [x] Banners: confounding risk, data freshness, weak data pulse

### G2. Risk API Endpoints (SPRINT 2 - COMPLETE)
- [x] `GET /api/schools/[schoolId]/risk/scores` - paginated, filterable, enriched with interventions
- [x] `GET /api/schools/[schoolId]/risk/distribution` - tier counts, grade breakdown, weekly trend
- [x] `GET /api/schools/[schoolId]/risk/drivers` - aggregated factors
- [x] `GET /api/schools/[schoolId]/risk/config` - read model config
- [x] `PUT /api/schools/[schoolId]/risk/config` - update model config
- [x] `GET /api/schools/[schoolId]/risk/alerts` - alert list with filters
- [x] `PATCH /api/schools/[schoolId]/risk/alerts/[alertId]` - acknowledge/resolve
- [x] `GET /api/schools/[schoolId]/risk/history/[studentId]` - score history

### G3. Early Warning Dashboard Page (Sprint 4)

**Route:** `/[school_slug]/dashboard/early-warning`

**Required Components:**
- [ ] `RiskDistributionChart` - donut chart of tier counts
- [ ] `RiskTrendChart` - stacked bar over time (weekly)
- [ ] `StudentRiskTable` - sortable, filterable list of at-risk students
- [ ] `AlertFeed` - real-time alert list with acknowledge/resolve
- [ ] `RiskDriverBreakdown` - top drivers school-wide
- [ ] `InterventionPipeline` - visual workflow: planned/active/stale
- [ ] `StudentRiskCard` - individual student with factors + actions
- [ ] `MeetingPrepExport` - generate MTSS agenda

**Required Hooks:**
- [ ] `useRiskScores(schoolId, filters)` - fetch paginated scores
- [ ] `useRiskDistribution(schoolId)` - fetch distribution + trends
- [ ] `useRiskAlerts(schoolId, filters)` - fetch alerts
- [ ] `useRiskConfig(schoolId)` - fetch/update config

**Interpretation Layer:**
- [ ] `src/lib/risk-engine/interpreter.ts` - plain language converter
- [ ] `interpretRiskScore()` - "Maria needs support"
- [ ] `interpretFactor()` - "Attendance is the primary concern (72%)"
- [ ] `interpretTrajectory()` - "Getting worse - was on track 4 weeks ago"
- [ ] `interpretConfidence()` - "Limited data - connect your LMS"
- [ ] `generateActionPrompt()` - "Schedule family meeting"

### G4. Dashboard Answers These Questions
- [ ] **How many students are at risk today?** - distribution counts
- [ ] **Who are the top 20 highest risk?** - sortable table
- [ ] **Why are they at risk?** - driver breakdown per student
- [ ] **What are we doing about it?** - intervention pipeline

---

## H) Testing and QA

### H1. Test Infrastructure
- [x] Vitest configured
- [x] Test directories exist with existing tests
- [x] Existing tests: interventions, stripe webhook, students, RBAC, feature gates

### H2. Risk Engine Tests (Sprint 5)
- [ ] Unit tests for each normalizer function
- [ ] Unit tests for composite score calculator
- [ ] Unit tests for threshold classification (4-tier)
- [ ] Unit tests for trend detection
- [ ] Unit tests for dosage inference rules
- [ ] Integration test for batch evaluation
- [ ] Integration test for alert generation
- [ ] Integration test for API endpoints

### H3. Demo and Seed Data
- [ ] Seed data generator with realistic scenarios
- [ ] Demo school walkthrough flow
- [ ] Student flagged > alert > tier decision > intervention > outcome

---

## I) Alignment Status

See `docs/ALIGNMENT_MATRIX.md` for full cross-reference of documentation vs implementation.

**Summary:**
- 27 items IMPLEMENTED
- 17 items PARTIAL
- 37 items MISSING
- 0 CONFLICTS between documents

**Top Priority Gaps:**
1. Early Warning Dashboard page
2. Plain language interpretation layer
3. Dosage analysis foundation
4. Mobility/placement tracking
5. database.types.ts regeneration

---

## Go/No-Go Criteria (Pilot Readiness)

| Criteria | Status | Sprint | Blocker |
|----------|--------|--------|---------|
| Risk is computed automatically and explainable | PASS | 1B | None |
| Alerts trigger on risk changes | PASS | 1B | None |
| Risk API endpoints operational | PASS | 2 | None |
| Dashboard gives clear who/why/what-next view | NOT STARTED | 4 | **BLOCKER** |
| Plain language interpretation | NOT STARTED | 4 | **BLOCKER** |
| Dosage analysis computed | NOT STARTED | 3 | Enhancement |
| Audit logs persist and export | PARTIAL | 5 | None |
| Seed data for demo school | NOT STARTED | 5 | None |
| database.types.ts regenerated | BLOCKED | 2 | Supabase CLI |

---

## Database Tables (31 total)

### Original (21 tables)
`ai_usage`, `ai_usage_limits`, `audit_logs`, `authorizers`, `dashboard_configs`, `data_sources`, `generated_reports`, `interventions`, `notifications`, `payments`, `resource_progress`, `scheduled_reports`, `school_memberships`, `schools`, `students`, `sync_history`, `user_preferences`, `users`, `webhook_events`

Views: `v_ai_usage_monthly`, `v_report_summary`

### Sprint 1A (5 new tables)
`risk_model_configs`, `student_metrics`, `student_metric_history`, `risk_evaluations`, `risk_alerts`

View: `current_risk_scores`

Function: `get_user_school_ids()`

### Sprint 3 (Planned - 1 new table)
`intervention_dosage_metrics`

### Tables Still Missing from DB (Referenced in Code)
`compliance_events`, `consent_records`, `compliance_reports`, `directory_opt_outs`, `section_enrollments`, `sections`, `iep_team_members`, `amendment_requests`, `school_data_sources`, `data_quality_issues`, `intervention_comments`, `intervention_audit_log`, `ferpa_audit_log`

---

## Key File Inventory

### Risk Engine (Sprint 1-2)
| File | Lines | Status |
|------|-------|--------|
| `src/lib/risk-engine/types.ts` | 326 | NEW |
| `src/lib/risk-engine/metrics-aggregator.ts` | 455 | NEW |
| `src/lib/risk-engine/orchestrator.ts` | 230 | NEW |
| `src/lib/risk-engine/index.ts` | 11 | NEW |
| `src/lib/risk/detection-engine.ts` | 680 | REFACTORED |
| `src/lib/risk/early-warning.ts` | 569 | REFACTORED |
| `src/lib/risk/index.ts` | 24 | UPDATED |
| `supabase/migrations/00006_risk_engine_tables.sql` | 391 | NEW |

### Risk API Routes (Sprint 2)
| Route | Method | Status |
|-------|--------|--------|
| `/api/schools/[schoolId]/risk/scores` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/distribution` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/drivers` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/config` | GET, PUT | COMPLETE |
| `/api/schools/[schoolId]/risk/alerts` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/alerts/[alertId]` | PATCH | COMPLETE |
| `/api/schools/[schoolId]/risk/history/[studentId]` | GET | COMPLETE |
| `/api/cron/risk-evaluation` | GET | COMPLETE |

---

*Document Version: 4.0*
*Previous: v3.0 (March 6, 2026)*
