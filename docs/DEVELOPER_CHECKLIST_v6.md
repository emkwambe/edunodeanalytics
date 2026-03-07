# EduNode Analytics - Developer Checklist v6.0
## MTSS Early Warning and Intervention Platform

**Last Updated:** March 7, 2026
**Branch:** `claude/edunode-analytics-saas-9l0uE`
**Stack:** Next.js 16.1.6 | Supabase (Postgres) | TypeScript | Clerk | Stripe | Vitest

---

## Changelog from v5.0

| Section | Change |
|---------|--------|
| G3 | Early Warning Dashboard page verified complete with navigation link |
| G5 | NEW: Student 360 risk integration added |
| F1 | Audit export endpoint added: `/api/schools/[schoolId]/export/risk-evaluations` |
| H2 | Risk engine unit tests complete: 238 tests passing |
| H3 | Risk seed data generator created: `src/lib/data/risk-seed-data.ts` |
| A3 | Risk engine files confirmed type-safe (no @ts-nocheck needed) |
| J | Sprint 3 marked COMPLETE with all deliverables |

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
  - Once regenerated: remove `@ts-nocheck` from remaining files
- [x] Risk engine files are type-safe (no `@ts-nocheck`):
  - `src/lib/risk/detection-engine.ts` - CLEAN
  - `src/lib/risk/early-warning.ts` - CLEAN
  - `src/lib/risk-engine/*.ts` - CLEAN
- [ ] 5 files still have `@ts-nocheck` (pre-existing, unrelated to risk engine):
  - `src/lib/compliance/evidence-logger.ts`
  - `src/lib/compliance/ferpa-compliance.ts`
  - `src/lib/data/integration/orchestrator.ts`
  - `src/lib/data/integration/pipeline.ts`
  - `src/lib/interventions/workflow-manager.ts`

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
- [ ] Dashboard widget showing per-school data completeness (Sprint 5)
- [ ] "What's missing" plain-language display (Sprint 5)

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
- [x] **RiskSystem unified class** - `src/lib/risk-engine/risk-system.ts` (619 lines)
  - Factory: `RiskSystem.forSchool(schoolId)`
  - Methods: `evaluateAll()`, `evaluateStudent()`, `getStudentProfile()`, `getDashboardData()`

### C3. Batch Orchestration (SPRINT 2 - COMPLETE)
- [x] `src/lib/risk-engine/metrics-aggregator.ts` - 455 lines
- [x] `src/lib/risk-engine/orchestrator.ts` - 281 lines
- [x] `evaluateSchoolRisk()` coordinates full 4-phase pipeline
- [x] Nightly batch cron: `/api/cron/risk-evaluation`
- [x] Phase 1: Metrics aggregation
- [x] Phase 2: Risk evaluation
- [x] Phase 3: Alert generation
- [x] Phase 4: Trend detection (nightly batch only)

### C4. Configurability
- [x] Weights configurable per school (stored in `risk_model_configs`)
- [x] Thresholds configurable per school
- [x] Indicator parameters configurable
- [x] Weights constrained to sum to 1.0 (CHECK constraint)
- [x] Thresholds constrained to ascending order (CHECK constraint)
- [x] Defaults work out of the box
- [ ] Admin UI for config editing (`/[school_slug]/settings/risk-model`) - Sprint 5

### C5. Trend Detection (SPRINT 3 - COMPLETE)
- [x] `student_metric_history` table exists for weekly snapshots
- [x] Trajectory detection from evaluation history (improving/stable/declining)
- [x] `src/lib/risk-engine/trend-detector.ts` - 411 lines
  - `linearRegression()` - OLS slope calculation
  - `TrendDetector` class with configurable lookback
  - `analyzeStudentTrends()` - per-student multi-metric analysis
  - `analyzeSchoolTrends()` - school-wide aggregation
  - `predictThresholdCrossing()` - weeks-ahead prediction
- [x] Linear regression slope computation over configurable lookback window
- [x] Trend-based flagging before threshold breach (`earlyWarningFlags`)
- [x] Weekly snapshot creation in metrics-aggregator
- [x] Trend detection integrated into orchestrator Phase 4

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
- [ ] Alert deduplication visible in UI (Sprint 5)
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

### E4. Dosage Analysis (Sprint 5)
- [ ] `intervention_dosage_metrics` table migration
- [ ] `dosage-analyzer.ts` core computation
- [ ] 10 inference rules implemented
- [ ] Session logging in progress_notes
- [ ] DosagePlan validation in interventions.metadata
- [ ] Dosage API endpoints
- [ ] Dashboard dosage widgets

---

## F) Evidence, Compliance, and Auditability

### F1. Audit Trail (COMPLETE)
- [x] `audit_logs` table (12 columns)
- [x] Admin audit logs page: `/admin/audit-logs`
- [x] Evidence logger module
- [x] Risk evaluations provide immutable audit trail
- [x] **Risk evaluation export endpoint:** `GET /api/schools/[schoolId]/export/risk-evaluations`
  - CSV and JSON format support
  - Date range filtering
  - Anonymization option for external auditors
  - Rate limited for security

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
- [x] `RiskSystem.getStudentProfile()` - complete student risk profile
- [x] `RiskSystem.getDashboardData()` - aggregated dashboard data

### G3. Early Warning Dashboard Page (SPRINT 3 - COMPLETE)

**Route:** `/[school_slug]/dashboard/early-warning`

**Navigation:** Added to sidebar between "Student 360" and "MTSS Interventions"

**Required Components:**
- [x] `RiskDistributionChart` - donut chart of tier counts
- [x] `RiskTrendChart` - stacked bar over time (weekly)
- [x] `StudentRiskTable` - sortable, filterable list of at-risk students
- [x] `AlertFeed` - real-time alert list with acknowledge/resolve
- [x] `RiskDriverBreakdown` - top drivers school-wide
- [x] `InterventionPipeline` - visual workflow: planned/active/stale
- [x] `StudentRiskCard` - individual student with factors + actions
- [x] `MeetingPrepExport` - generate MTSS agenda

**Required Hooks:**
- [x] `useRiskScores(schoolId, filters)` - `src/lib/hooks/use-risk.ts:148`
- [x] `useDetailedRiskDistribution(schoolId)` - `src/lib/hooks/use-risk.ts:110`
- [x] `useRiskAlerts(schoolId, filters)` - `src/lib/hooks/use-risk.ts:248`
- [x] `useRiskConfig(schoolId)` - `src/lib/hooks/use-risk.ts:361`
- [x] `useStudentRiskProfile(schoolId, studentId)` - `src/lib/hooks/use-risk.ts:183`
- [x] `useStudentRiskHistory(schoolId, studentId)` - `src/lib/hooks/use-risk.ts:200`
- [x] `useRiskDrivers(schoolId)` - `src/lib/hooks/use-risk.ts:127`

**Interpretation Layer:**
- [x] `src/lib/risk-engine/interpreter.ts` - plain language converter (380 lines)
- [x] `interpretRiskScore()` - "Maria needs support"
- [x] `interpretFactor()` - "Attendance is the primary concern (72%)"
- [x] `interpretTrajectory()` - "Getting worse - was on track 4 weeks ago"
- [x] `interpretConfidence()` - "Limited data - connect your LMS"
- [x] `generateActionPrompt()` - "Schedule family meeting"

### G4. Dashboard Answers These Questions
- [x] **How many students are at risk today?** - distribution counts
- [x] **Who are the top 20 highest risk?** - sortable table
- [x] **Why are they at risk?** - driver breakdown per student
- [x] **What are we doing about it?** - intervention pipeline

### G5. Student 360 Risk Integration (SPRINT 3 - COMPLETE)
- [x] Risk profile card showing score, level, trajectory
- [x] Top risk factors with weighted scores
- [x] Level change indicator
- [x] Active alerts section
- [x] Risk history visualization
- [x] Links to intervention creation

---

## H) Testing and QA

### H1. Test Infrastructure
- [x] Vitest configured
- [x] Test directories exist with existing tests
- [x] Existing tests: interventions, stripe webhook, students, RBAC, feature gates

### H2. Risk Engine Tests (SPRINT 3 - COMPLETE)
- [x] Unit tests for normalizer functions (`detection-engine.test.ts`)
- [x] Unit tests for composite score calculator (`detection-engine.test.ts`)
- [x] Unit tests for threshold classification (4-tier) (`risk-system.test.ts`)
- [x] Unit tests for trend detection (`trend-detector.test.ts`)
- [x] Unit tests for metrics extraction (`metrics-aggregator.test.ts`)
- [x] Unit tests for interpreter functions (`interpreter.test.ts`)
- [x] Unit tests for type parsing (`types.test.ts`)
- [x] Integration tests for risk flow (`integration.test.ts`)

**Test Coverage:** 238 tests passing across 7 test files

### H3. Demo and Seed Data (SPRINT 3 - COMPLETE)
- [x] Seed data generator: `src/lib/data/risk-seed-data.ts` (528 lines)
  - `generateRiskSeedData(schoolSlug)` - evaluations, alerts, metrics
  - `getRiskDistribution(schoolSlug)` - tier summary
  - `getTopRiskDrivers(schoolSlug)` - factor aggregation
- [x] Realistic risk factor generation with trajectory
- [x] Alert templates with severity and status
- [ ] Demo school walkthrough flow (Sprint 5)
- [ ] Student flagged > alert > tier decision > intervention > outcome (Sprint 5)

---

## I) Alignment Status

See `docs/ALIGNMENT_MATRIX.md` for full cross-reference of documentation vs implementation.

**Summary:**
- 37 items IMPLEMENTED (+5 from v5)
- 11 items PARTIAL (-3 from v5)
- 33 items MISSING (-2 from v5)
- 0 CONFLICTS between documents

**Priority Gaps Remaining:**
1. database.types.ts regeneration (BLOCKER)
2. Dosage analysis foundation
3. Tier placement workflow
4. Demo walkthrough flow

---

## J) Sprint Completion Tracker

| Sprint | Focus | Status | Key Deliverables |
|--------|-------|--------|------------------|
| 1A | DB Foundation | **COMPLETE** | 5 tables, 1 view, 15 RLS policies, migration |
| 1B | Engine Core | **COMPLETE** | detection-engine, early-warning, types, 4-tier model |
| 2 | Orchestration & API | **COMPLETE** | metrics-aggregator, orchestrator, 8 API endpoints, cron |
| 3 | Trend Detection & Dashboard | **COMPLETE** | trend-detector, early-warning page, navigation, export, seed data, 238 tests |
| 4 | Dashboard Components | **COMPLETE** | 8 components, 7 hooks, interpreter, Student 360 integration |
| 5 | Polish & QA | NOT STARTED | CSV import, admin UI, demo walkthrough |

---

## Go/No-Go Criteria (Pilot Readiness)

| Criteria | Status | Sprint | Blocker |
|----------|--------|--------|---------|
| Risk is computed automatically and explainable | **PASS** | 1B | None |
| Alerts trigger on risk changes | **PASS** | 1B | None |
| Risk API endpoints operational | **PASS** | 2 | None |
| Dashboard gives clear who/why/what-next view | **PASS** | 4 | None |
| Plain language interpretation | **PASS** | 4 | None |
| Trend detection with predictive flagging | **PASS** | 3 | None |
| Audit logs persist and export | **PASS** | 3 | None |
| Seed data for demo school | **PASS** | 3 | None |
| Unit test coverage for risk engine | **PASS** | 3 | None |
| Dosage analysis computed | NOT STARTED | 5 | Enhancement |
| database.types.ts regenerated | **BLOCKED** | - | Supabase CLI |

**Pilot Readiness Score: 9/11 gates PASS (82%)**

---

## Database Tables (31 total)

### Original (21 tables)
`ai_usage`, `ai_usage_limits`, `audit_logs`, `authorizers`, `dashboard_configs`, `data_sources`, `generated_reports`, `interventions`, `notifications`, `payments`, `resource_progress`, `scheduled_reports`, `school_memberships`, `schools`, `students`, `sync_history`, `user_preferences`, `users`, `webhook_events`

Views: `v_ai_usage_monthly`, `v_report_summary`

### Sprint 1A (5 new tables)
`risk_model_configs`, `student_metrics`, `student_metric_history`, `risk_evaluations`, `risk_alerts`

View: `current_risk_scores`

Function: `get_user_school_ids()`

### Sprint 5 (Planned - 1 new table)
`intervention_dosage_metrics`

### Tables Still Missing from DB (Referenced in Code)
`compliance_events`, `consent_records`, `compliance_reports`, `directory_opt_outs`, `section_enrollments`, `sections`, `iep_team_members`, `amendment_requests`, `school_data_sources`, `data_quality_issues`, `intervention_comments`, `intervention_audit_log`, `ferpa_audit_log`

---

## Key File Inventory

### Risk Engine (Sprint 1-4)
| File | Lines | Status |
|------|-------|--------|
| `src/lib/risk-engine/types.ts` | 326 | COMPLETE |
| `src/lib/risk-engine/metrics-aggregator.ts` | 455 | COMPLETE |
| `src/lib/risk-engine/orchestrator.ts` | 281 | COMPLETE |
| `src/lib/risk-engine/trend-detector.ts` | 411 | COMPLETE |
| `src/lib/risk-engine/interpreter.ts` | 380 | COMPLETE |
| `src/lib/risk-engine/risk-system.ts` | 619 | COMPLETE |
| `src/lib/risk-engine/index.ts` | 109 | COMPLETE |
| `src/lib/risk/detection-engine.ts` | 680 | COMPLETE |
| `src/lib/risk/early-warning.ts` | 569 | COMPLETE |
| `src/lib/risk/index.ts` | 24 | UPDATED |
| `src/lib/hooks/use-risk.ts` | 418 | COMPLETE |
| `src/lib/data/risk-seed-data.ts` | 528 | NEW |
| `supabase/migrations/00006_risk_engine_tables.sql` | 391 | COMPLETE |

### Risk API Routes (Sprint 2-3)
| Route | Method | Status |
|-------|--------|--------|
| `/api/schools/[schoolId]/risk/scores` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/distribution` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/drivers` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/config` | GET, PUT | COMPLETE |
| `/api/schools/[schoolId]/risk/alerts` | GET | COMPLETE |
| `/api/schools/[schoolId]/risk/alerts/[alertId]` | PATCH | COMPLETE |
| `/api/schools/[schoolId]/risk/history/[studentId]` | GET | COMPLETE |
| `/api/schools/[schoolId]/export/risk-evaluations` | GET | NEW |
| `/api/cron/risk-evaluation` | GET | COMPLETE |

### Risk Engine Tests
| File | Tests | Status |
|------|-------|--------|
| `src/lib/risk-engine/__tests__/detection-engine.test.ts` | 42 | COMPLETE |
| `src/lib/risk-engine/__tests__/interpreter.test.ts` | 52 | COMPLETE |
| `src/lib/risk-engine/__tests__/trend-detector.test.ts` | 32 | COMPLETE |
| `src/lib/risk-engine/__tests__/types.test.ts` | 25 | COMPLETE |
| `src/lib/risk-engine/__tests__/integration.test.ts` | 27 | COMPLETE |
| `src/lib/risk-engine/__tests__/metrics-aggregator.test.ts` | 33 | NEW |
| `src/lib/risk-engine/__tests__/risk-system.test.ts` | 27 | NEW |

---

*Document Version: 6.0*
*Previous: v5.0 (March 7, 2026)*
*Audit completed: March 7, 2026*
