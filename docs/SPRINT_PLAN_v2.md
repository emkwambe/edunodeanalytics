# EduNode Analytics - Sprint Plan v2.0
## MTSS Risk Engine & Early Warning Dashboard

**Last Updated:** March 7, 2026
**Previous Version:** SPRINT_PLAN.md (focused on marketing/legal pages)
**This Version:** Risk engine and pilot readiness focused

---

## Executive Summary

**Current State:**
- Sprint 1A (DB Migration) - COMPLETE
- Sprint 1B (Engine Refactor) - COMPLETE
- Sprint 2 (API Layer + Orchestrator) - IN PROGRESS
- Build verified passing (March 6, 2026)

**Next Milestone:** Charter school pilot in 4 weeks

**Philosophy:** Charter-first, district-ready. Ship working MTSS workflow for 200-student schools before adding enterprise features.

---

## Sprint History

### Sprint 1A: Risk Engine Database (COMPLETE - March 5, 2026)

| Task | Status | Commit |
|------|--------|--------|
| Create `risk_model_configs` table | Done | eb14189 |
| Create `student_metrics` table (27 columns) | Done | eb14189 |
| Create `student_metric_history` table | Done | eb14189 |
| Create `risk_evaluations` table | Done | eb14189 |
| Create `risk_alerts` table | Done | eb14189 |
| Create `current_risk_scores` view | Done | eb14189 |
| Create `get_user_school_ids()` RLS function | Done | eb14189 |
| Add 15 RLS policies | Done | eb14189 |
| Add 11 performance indexes | Done | eb14189 |
| Seed default configs for 3 schools | Done | eb14189 |
| Bootstrap `student_metrics` from existing students | Done | eb14189 |

**Deliverable:** `supabase/migrations/00006_risk_engine_tables.sql`

---

### Sprint 1B: Risk Engine Refactor (COMPLETE - March 6, 2026)

| Task | Status | Commit |
|------|--------|--------|
| Create `src/lib/risk-engine/types.ts` bridge types | Done | c0dbea4 |
| Refactor `detection-engine.ts` to load config from DB | Done | c0dbea4 |
| Refactor `detection-engine.ts` to persist to `risk_evaluations` | Done | c0dbea4 |
| Add level change detection (previousLevel, levelChanged) | Done | c0dbea4 |
| Add trajectory computation from evaluation history | Done | c0dbea4 |
| Add confidence calculation from data completeness | Done | c0dbea4 |
| Add recommended actions generation | Done | c0dbea4 |
| Refactor `early-warning.ts` to use `risk_alerts` table | Done | c0dbea4 |
| Add DB-level cooldown deduplication via `cooldown_key` | Done | c0dbea4 |
| Add role-based notification dispatch | Done | c0dbea4 |
| Maintain backward compatibility with `students` table | Done | c0dbea4 |
| Verify build passes | Done | e528b13 |

**Deliverables:**
- `src/lib/risk-engine/types.ts` (326 lines)
- `src/lib/risk/detection-engine.ts` (refactored)
- `src/lib/risk/early-warning.ts` (refactored)

---

### Sprint 2: API Layer + Orchestrator (IN PROGRESS)

**Duration:** March 6-14, 2026

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Create `src/lib/risk-engine/metrics-aggregator.ts` | Done | - | 455 lines |
| Create `src/lib/risk-engine/orchestrator.ts` | Done | - | 230 lines |
| Create batch evaluation cron route | Done | - | `/api/cron/risk-evaluation` |
| Create 6 Risk API endpoints | Done | - | All routes implemented |
| - `GET /api/schools/[schoolId]/risk/scores` | Done | - | Paginated, filterable |
| - `GET /api/schools/[schoolId]/risk/distribution` | Done | - | Tier counts + trends |
| - `GET /api/schools/[schoolId]/risk/drivers` | Done | - | Aggregated factors |
| - `GET+PUT /api/schools/[schoolId]/risk/config` | Done | - | Read/update config |
| - `GET+PATCH /api/schools/[schoolId]/risk/alerts` | Done | - | Alert list + update |
| - `GET /api/schools/[schoolId]/risk/history/[studentId]` | Done | - | Score history |
| Regenerate `database.types.ts` | **BLOCKED** | - | Needs Supabase CLI auth |
| Remove `@ts-nocheck` from 7 files | BLOCKED | - | Depends on types regen |

**Sprint 2 Blockers:**
1. `database.types.ts` regeneration requires Supabase CLI authentication
2. 7 files retain `@ts-nocheck` until types are regenerated

---

## Sprint 3: Dosage Analysis Foundation (PLANNED)

**Duration:** March 14-21, 2026

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Create dosage migration | P1 | M | `intervention_dosage_metrics` table |
| Build dosage-analyzer.ts | P1 | L | Core computation engine |
| Implement 10 inference rules | P1 | L | Response status, sufficiency, recommendations |
| Add session fields to progress notes | P2 | S | `session_delivered`, `session_duration_minutes` |
| Add DosagePlan validation | P2 | S | JSONB schema in interventions.metadata |
| Integrate with weekly batch cron | P2 | M | Call dosage computation after risk eval |
| Add dosage API endpoints | P3 | M | `/interventions/dosage/*` routes |

**Definition of Done:**
- Dosage metrics computed for all active interventions
- Response status categorized (responding/slow_response/not_responding)
- Sufficiency assessed (appropriate/undertreated/overtreated)
- Automated alerts for non-responding interventions

---

## Sprint 4: Early Warning Dashboard (PLANNED)

**Duration:** March 21 - April 4, 2026 (2 weeks)

### Week 1: Core Dashboard Components

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Create `/dashboard/early-warning` page | P1 | L | MTSS coordinator dashboard |
| Build RiskDistributionChart component | P1 | M | Donut + stacked bar |
| Build StudentRiskTable component | P1 | L | Sortable, filterable table |
| Build AlertFeed component | P1 | M | Real-time alerts with actions |
| Build RiskDriverBreakdown component | P2 | M | School-wide factor aggregates |
| Create useRiskScores hook | P1 | S | Data fetching for scores |
| Create useRiskDistribution hook | P1 | S | Data fetching for distribution |
| Create useRiskAlerts hook | P1 | S | Data fetching for alerts |

### Week 2: Interpretation Layer + Polish

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Build plain language interpreter | P1 | M | Convert factors to sentences |
| Build StudentRiskCard component | P1 | M | Individual student display |
| Build InterventionPipeline component | P2 | M | Visual workflow status |
| Add mobility tracking migration | P2 | S | placement_status, prior_school_count |
| Add placement review alert rule | P2 | S | 30-day temporary placement check |
| Build MeetingPrepExport component | P3 | M | MTSS agenda generation |
| Role-based view filtering | P2 | M | Teacher vs Coordinator views |

**Definition of Done:**
- MTSS coordinator can see all at-risk students
- Plain language explanations for all risk factors
- Alerts can be acknowledged/resolved from dashboard
- Intervention status visible per student
- Meeting prep exportable

---

## Sprint 5: Testing + Polish (PLANNED)

**Duration:** April 4-11, 2026

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Write risk engine unit tests | P1 | L | Normalizers, calculator, thresholds |
| Write dosage analyzer unit tests | P1 | M | Inference rules, edge cases |
| Write dashboard component tests | P2 | M | Render, interaction, accessibility |
| Create seed data generator | P1 | M | Realistic demo scenarios |
| Build risk config admin UI | P2 | M | `/settings/risk-model` page |
| Bias auditing on risk distribution | P2 | M | Fairness report by demographic |
| CSV import path (golden template) | P3 | L | Fallback for low-resource schools |
| Cross-subject correlation factor | P3 | M | EL-specific risk factor logic |

**Definition of Done:**
- 80%+ test coverage on risk engine
- Demo school with realistic data
- Admin can configure risk model weights
- CSV import works for basic data

---

## Sprint 6: Pilot Launch (PLANNED)

**Duration:** April 11-18, 2026

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Pilot school onboarding | P1 | L | Connect data sources, train users |
| Data completeness audit | P1 | S | Ensure indicators populated |
| Performance optimization | P2 | M | Query tuning, caching |
| Feedback collection system | P2 | S | In-app feedback mechanism |
| Documentation for end users | P2 | M | Quick start guide |
| Go/No-Go checklist validation | P1 | S | Final readiness check |

**Definition of Done:**
- First charter school actively using EduNode
- MTSS coordinator can run a meeting from the dashboard
- Support documentation available
- Feedback loop established

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| database.types.ts blocked | Medium | High | Manual types work; prioritize CLI auth |
| Pilot school data incomplete | High | Medium | CSV import fallback; data completeness warnings |
| Dashboard performance with 500+ students | Medium | Low | Pagination + virtual scrolling implemented |
| Supabase rate limits on batch eval | Medium | Low | Chunked processing in orchestrator |

---

## Success Metrics

| Sprint | Key Metrics |
|--------|-------------|
| Sprint 2 | All 6 API endpoints return valid responses |
| Sprint 3 | Dosage computed for 100% of active interventions |
| Sprint 4 | Dashboard loads in <2s, shows all risk data |
| Sprint 5 | 80%+ test coverage, demo school functional |
| Sprint 6 | Pilot school using dashboard daily |

---

## Resource Requirements

- Frontend Developer: 1 FTE (Sprint 4-5 focus)
- Backend Developer: 0.5 FTE (Sprint 2-3 focus)
- Design: 0.25 FTE (Sprint 4 dashboard layouts)
- QA: 0.25 FTE (Sprint 5 testing)

---

## Effort Estimates

- XS = 1-2 hours
- S = 0.5-1 day
- M = 2-3 days
- L = 1 week

---

*Document Version: 2.0*
*Previous: SPRINT_PLAN.md (marketing/legal focus)*
*This Version: Risk engine and pilot readiness focus*
