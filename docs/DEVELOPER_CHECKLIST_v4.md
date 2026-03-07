# EduNode Developer Checklist v4.0
## MTSS Early Warning Platform — Pilot Readiness

**Updated:** 2026-03-06
**Sprint 1:** Complete (Database + Engine Refactor)
**Sprint 2:** In Progress (API Routes + Orchestrator)

---

## Scope Statement

**In scope:** Data Integration → Risk Engine → Alerts → Intervention Workflow → Evidence/Compliance → Early Warning Dashboard

**Out of scope (this phase):** Parent portal, parent notifications, multilingual parent messaging, SMS/push

---

## A) Repo and Build Health

### A1. Source control

- [x] git status shows clean working tree
- [x] Branch naming consistent (`claude/edunode-analytics-saas-9l0uE`)
- [x] build-info.json generated and served from /build-info.json
- [x] Commit message convention used (feat/fix/chore)

### A2. Local build must succeed

- [x] npm ci completes
- [x] npm run build succeeds (compiled successfully)
- [x] TypeScript passes (with @ts-nocheck on known files — see A5)
- [ ] npm run lint succeeds
- [ ] npx tsc --noEmit succeeds (blocked by @ts-nocheck removals)
- [x] BigQuery optional import handled cleanly (warning only)

### A3. Runtime checks

- [x] npm run dev starts cleanly
- [x] /api/health, /api/health/ready, /api/health/live return expected responses
- [x] .env.local present and validated (20 vars)

### A4. Database types

- [x] database.types.ts regenerated via Supabase CLI (includes all 26 tables)
- [x] Convenience aliases added (School, Student, Intervention, Notification, Payment, etc.)
- [ ] Remove @ts-nocheck from detection-engine.ts and early-warning.ts (risk tables now in types)
- [ ] Audit and fix remaining @ts-nocheck files (20 files total — see A5)

### A5. Known @ts-nocheck Files (Tech Debt)

**Risk engine files (removable now — tables are in database.types.ts):**
- [ ] `src/lib/risk/detection-engine.ts` — remove @ts-nocheck, should compile clean
- [ ] `src/lib/risk/early-warning.ts` — remove @ts-nocheck, should compile clean

**Pre-existing missing table refs (need their own migrations):**
- [ ] `src/lib/compliance/evidence-logger.ts` — compliance_events, consent_records, compliance_reports
- [ ] `src/lib/compliance/ferpa-compliance.ts` — directory_opt_outs, amendment_requests, section_enrollments, sections, iep_team_members
- [ ] `src/app/api/ferpa-audit/route.ts` — ferpa_audit_log
- [ ] `src/lib/data/integration/orchestrator.ts` — school_data_sources
- [ ] `src/lib/data/integration/pipeline.ts` — data_quality_issues
- [ ] `src/lib/interventions/team-collaboration.ts` — intervention_comments
- [ ] `src/lib/interventions/workflow-manager.ts` — intervention_audit_log

**Demo data strict typing (regen side effect):**
- [ ] `src/lib/db/queries/audit.ts`
- [ ] `src/lib/db/queries/dashboards.ts`
- [ ] `src/lib/db/queries/data-sources.ts`
- [ ] `src/lib/db/queries/interventions.ts`
- [ ] `src/lib/db/queries/notifications.ts`
- [ ] `src/lib/db/queries/payments.ts`
- [ ] `src/lib/db/queries/resource-progress.ts`
- [ ] `src/lib/db/queries/schools.ts`
- [ ] `src/lib/db/queries/students.ts`
- [ ] `src/lib/db/queries/users.ts`
- [ ] `src/lib/db/queries/webhook-events.ts`

---

## B) Data Integration Layer (Adapters + Sync)

### B1. Adapter registry + contracts

- [x] Adapters implement shared contract (testConnection, syncRosters, etc.)
- [x] Canvas adapter
- [x] Clever adapter
- [x] ClassLink adapter
- [x] PowerSchool adapter
- [x] NWEA MAP adapter
- [x] iReady adapter
- [x] Renaissance STAR adapter
- [x] Google Classroom adapter
- [x] Adapter errors standardized
- [x] Returns normalized data shapes

### B2. Sync reliability

- [x] Cron endpoints exist and are idempotent: /api/cron/sync-rosters
- [x] Scheduled reports cron
- [x] Stale interventions cron
- [x] Sync status persisted (sync_history table)
- [ ] Partial failures isolated per-source
- [ ] Rate limiting and backoff for external APIs

### B3. Data fallback

- [ ] CSV import path for students
- [ ] CSV import path for rosters
- [ ] CSV import path for attendance
- [ ] Import validates schema and logs row-level errors

### B4. Data quality score

- [x] Data completeness computed per student (student_metrics.data_completeness)
- [ ] Per-school Data Completeness Score (0-100)
- [ ] Dashboard shows "what's missing" plainly

---

## C) Automated Risk Detection Engine (Core Value)

### C1. Risk model readiness

- [x] Risk score is computed, not manually set
- [x] Multi-indicator aggregation: attendance
- [x] Multi-indicator aggregation: academic performance
- [x] Multi-indicator aggregation: academic growth
- [x] Multi-indicator aggregation: engagement
- [x] Multi-indicator aggregation: chronic absence
- [ ] Multi-indicator aggregation: assignments/missing work (field exists, normalizer pending)
- [ ] Multi-indicator aggregation: behavior incidents (field exists, normalizer pending)
- [x] Risk factors are explainable (name, category, rawValue, normalizedScore, weight, description, trend)

### C2. Configurability

- [x] Config stored in database (risk_model_configs table)
- [x] Per-school configuration
- [x] Configurable weights (attendance, academic, assignments, behavior, trend)
- [x] Configurable thresholds (on_track, watch, at_risk, critical)
- [x] Configurable indicator parameters (attendance_floor, assessment_floor_pct, etc.)
- [x] Defaults exist and work out of the box (3 schools seeded)
- [x] Weights auto-normalize to sum 1.0
- [x] CHECK constraint ensures weights sum and thresholds ordered

### C3. Trend detection

- [x] student_metric_history table for weekly snapshots
- [x] Trajectory computed from risk_evaluations history (improving/stable/declining)
- [ ] Linear regression slope computation (trend-detector.ts — Sprint 2)
- [ ] Student can be flagged for declining trend before threshold breach

### C4. Recalculation strategy

- [x] risk_evaluations stores every computation (immutable audit trail)
- [x] trigger_type tracked (sync_event, batch_nightly, manual, config_change)
- [ ] Nightly batch cron (/api/cron/risk-evaluation — Sprint 2, created)
- [ ] Post-sync hook triggers risk recalculation
- [ ] Manual "recompute now" admin action
- [x] Recompute is deterministic and logged

### C5. Level change tracking (NEW — Sprint 1B)

- [x] previous_level stored on each evaluation
- [x] level_changed boolean flag
- [x] 4-tier classification: on_track, watch, at_risk, critical
- [x] 'watch' added to risk_level Postgres enum

---

## D) Alerts and Trigger System

### D1. Trigger events

- [x] Alert on risk threshold breach
- [x] Alert on chronic absence detected
- [x] Alert on attendance drop (change detection)
- [x] Alert on grade decline
- [x] Alert on consecutive absences
- [x] Alert on critical risk level
- [x] Alerts have severity (info, warning, urgent, critical) and alert_type
- [x] Alerts stored in risk_alerts table (replaces missing early_warning_alerts)

### D2. Notifications center

- [x] Staff notifications created in notifications table
- [x] Role-based notification dispatch (via school_memberships)
- [x] Cooldown deduplication (in-memory + DB-level via cooldown_key)
- [x] Alert acknowledge workflow
- [x] Alert resolve workflow (with resolution_notes)
- [x] Alert dismiss workflow
- [ ] Alert linked to intervention (intervention_id FK exists, workflow pending)

### D3. Audit trail

- [x] risk_evaluations: immutable record of every computation
- [x] metrics_snapshot JSONB on each evaluation
- [x] risk_factors JSONB with full explainability
- [x] config_id links evaluation to the config used

---

## E) MTSS Workflow: Tiering + Interventions

### E1. Tier placement workflow

- [x] Student has risk_level (on_track, watch, at_risk, critical)
- [x] Level changes tracked (previous_level, level_changed)
- [ ] Tier change requires reason and evidence snapshot
- [ ] Tier change requires approver/owner (role-based)
- [ ] Tier history preserved as separate records

### E2. Intervention management

- [x] Interventions table with full lifecycle (25 columns)
- [x] Status tracking (intervention_status enum)
- [x] Type classification (intervention_type enum)
- [x] Priority levels (notification_priority enum)
- [x] Assigned to user
- [x] Stale intervention detection (is_stale, cron job)
- [ ] Intervention templates library
- [ ] Creating intervention from template < 30 seconds

### E3. Monitoring + outcomes

- [x] Goals: baseline_value, target_value, current_value
- [x] progress_notes (JSONB, timestamped)
- [x] success_criteria field
- [x] outcome_summary field
- [x] was_successful boolean
- [ ] Effectiveness metrics: pre/post risk score delta
- [ ] Attendance delta computation
- [ ] Assessment delta computation

---

## F) Evidence, Compliance, and Auditability

### F1. Audit logs

- [x] audit_logs table with action, resource_type, resource_id, old/new values
- [x] IP address and user_agent captured
- [ ] Audit log viewer UI for admins (page exists at /admin/audit-logs)
- [ ] Export endpoint (CSV/JSON) for interventions, tier history, alerts, evaluations

### F2. Privacy and access control

- [x] RBAC via school_memberships.role
- [x] RLS on all risk engine tables (15 policies)
- [x] SECURITY DEFINER function to avoid RLS recursion
- [x] PII anonymization (pii-anonymizer.ts, 14.8 KB)
- [x] Secure AI proxy (secure-ai-proxy.ts, 21.6 KB)
- [x] FERPA compliance infrastructure (ferpa-compliance.ts, 17.2 KB)
- [x] Evidence logger (evidence-logger.ts, 18.5 KB)
- [ ] Data retention rules documented
- [ ] Consent tracking (consent_records table pending)

---

## G) Early Warning Dashboard

### G1. Dashboard must answer 4 questions instantly

- [ ] How many students are at risk today? (counts by tier + risk band)
- [ ] Who are the top 20 highest risk? (sortable table)
- [ ] Why are they at risk? (driver breakdown)
- [ ] What are we doing about it? (interventions pipeline)

### G2. API endpoints for dashboard (Sprint 2)

- [x] GET /api/schools/[schoolId]/risk/scores — paginated, filterable
- [x] GET /api/schools/[schoolId]/risk/distribution — counts by tier, trend, by grade
- [x] GET /api/schools/[schoolId]/risk/drivers — aggregated risk factors
- [x] GET+PUT /api/schools/[schoolId]/risk/config — read/update config
- [x] GET+PATCH /api/schools/[schoolId]/risk/alerts — list + manage alerts
- [ ] GET /api/schools/[schoolId]/risk/history/[studentId] — student risk history

### G3. Dashboard UI components (Sprint 4)

- [ ] Early warning page (/[school_slug]/dashboard/early-warning)
- [ ] Risk distribution visualization (donut + trend chart)
- [ ] At-risk student table with sort/filter
- [ ] Risk driver breakdown panel
- [ ] Alert feed component
- [ ] "No intervention yet" list
- [ ] Intervention pipeline view (planned/in progress/completed/stale)

---

## H) Testing and QA Gates

### H1. Automated tests

- [x] Test framework configured (Vitest)
- [x] Existing tests: API tests (interventions, stripe webhook, students)
- [x] Existing tests: Component tests (metric-card, page-feature-gate)
- [x] Existing tests: Lib tests (errors, validation, rbac, feature-gates, fetcher)
- [ ] Unit tests for risk scoring normalizers
- [ ] Unit tests for threshold evaluation
- [ ] Unit tests for trend detection
- [ ] Integration tests for risk API routes
- [ ] Smoke tests for dashboard page loads

### H2. Demo data / demo mode

- [ ] Seed data with realistic school scenarios (chronic absence, declining math, missing assignments)
- [ ] Demo school workflow: student flagged → alert → tier decision → intervention → outcome
- [ ] Demo mode accessible without real data connections

---

## I) Deployment (Staging → Pilot)

- [x] Vercel deployment configured (vercel.json, output: standalone)
- [x] Docker configuration (Dockerfile, docker-compose.yml)
- [x] Security headers configured (X-Frame-Options, CSP, etc.)
- [x] FERPA cache headers on student data routes
- [x] Stripe webhook endpoint
- [ ] Staging environment configured
- [x] DB migrations tracked (supabase/migrations/ — 6 files)
- [x] Secrets managed (not in repo, .env.local)
- [ ] Error monitoring enabled (Sentry configured in code, deployment pending)
- [ ] Feature flags for optional connectors

---

## J) Sprint Completion Tracker

### Sprint 1A: Database Foundation — COMPLETE
- [x] risk_model_configs table + 3 school configs seeded
- [x] student_metrics table
- [x] student_metric_history table
- [x] risk_evaluations table
- [x] risk_alerts table
- [x] current_risk_scores view
- [x] get_user_school_ids() SECURITY DEFINER function
- [x] 15 RLS policies
- [x] 11 indexes
- [x] 3 updated_at triggers
- [x] 'watch' added to risk_level enum
- [x] Migration: supabase/migrations/00006_risk_engine_tables.sql

### Sprint 1B: Engine Refactor — COMPLETE
- [x] src/lib/risk-engine/types.ts (bridge types)
- [x] detection-engine.ts loads config from risk_model_configs
- [x] detection-engine.ts writes to risk_evaluations
- [x] detection-engine.ts tracks previousLevel/levelChanged
- [x] detection-engine.ts calculateTrajectory reads risk_evaluations
- [x] early-warning.ts writes to risk_alerts
- [x] early-warning.ts DB cooldown via cooldown_key
- [x] early-warning.ts reads student_metric_history
- [x] early-warning.ts uses school_memberships for notifications
- [x] index.ts re-exports all new types
- [x] Build passes clean

### Sprint 2: API + Orchestrator — IN PROGRESS
- [x] database.types.ts regenerated
- [x] Convenience type aliases added
- [x] Risk scores API route
- [x] Risk distribution API route (needs weeklyTrend fix)
- [x] Risk drivers API route
- [x] Risk config API route
- [x] Risk alerts API route
- [x] Metrics aggregator (needs cast fixes)
- [x] Batch orchestrator
- [x] Nightly cron route
- [ ] Build passes clean (blocking: metrics-aggregator.ts cast, distribution weeklyTrend)
- [ ] Remove @ts-nocheck from risk engine files
- [ ] All routes tested

### Sprint 3: Early Warning Dashboard — NOT STARTED
### Sprint 4: Demo + Polish — NOT STARTED

---

## Go/No-Go Criteria (5 Gates)

| Gate | Status | Notes |
|------|--------|-------|
| Risk computed automatically and explainable | PASS | Engine refactored, writes to risk_evaluations with full factors |
| Alerts trigger on risk changes | PASS | 6 alert rules, DB persistence, cooldown dedup |
| Tiering + interventions fully tracked | PARTIAL | Level changes tracked, intervention linking pending |
| Dashboard gives clear who/why/what-next | NOT YET | API routes built, UI pending (Sprint 3) |
| Audit logs persist and export | PARTIAL | risk_evaluations audit trail complete, export endpoint pending |

**Current readiness: 2.5/5 gates passed. Target: 5/5 by Sprint 4.**
