# EduNode Analytics - Strategic Alignment Matrix
## Documentation vs. Implementation Cross-Reference

**Date:** March 7, 2026
**Purpose:** Map each documentation artifact against actual codebase state, flagging gaps for prioritized action.

---

## Legend

| Status | Meaning |
|--------|---------|
| **[IMPLEMENTED]** | Code exists and matches documented requirements |
| **[PARTIAL]** | Some aspects implemented, gaps remain |
| **[MISSING]** | Documented but no implementation exists |
| **[CONFLICTS]** | Implementation differs from documented design |

---

## 1. SPRINT_PLAN.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Sprint 1 (Legal Foundation) | [PARTIAL] | `/ferpa`, `/accessibility`, `/cookies` pages exist (discovered in discovery report). `/terms`, `/privacy` pages need verification |
| Sprint 2 (Marketing Foundation) | [PARTIAL] | `/demo`, `/contact`, `/about` pages exist. FAQ page needs verification |
| Sprint 3 (Product Documentation) | [MISSING] | No `/docs` landing page, no `/changelog` system API, no `/status` page found |
| Sprint 4 (Sales Enablement) | [MISSING] | No ROI calculator, no plan comparison, no A/B testing infrastructure |
| Legal footer links | [PARTIAL] | Some pages link to legal, needs comprehensive audit |

**Gap Priority:** LOW - This sprint plan is for marketing/legal pages, not core MTSS functionality. The real sprint work is in the Risk Engine sprints.

---

## 2. risk_engine_migration.sql (Sprint 1A)

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| `risk_model_configs` table | [IMPLEMENTED] | Migration applied: `supabase/migrations/00006_risk_engine_tables.sql` |
| `student_metrics` table (27 columns) | [IMPLEMENTED] | Table created with full schema per migration |
| `student_metric_history` table | [IMPLEMENTED] | Weekly snapshot table with unique constraint |
| `risk_evaluations` table | [IMPLEMENTED] | Immutable audit trail with factor snapshots |
| `risk_alerts` table | [IMPLEMENTED] | Full lifecycle status (new/acknowledged/resolved/dismissed) |
| `current_risk_scores` view | [IMPLEMENTED] | View joins evaluations with students |
| `get_user_school_ids()` function | [IMPLEMENTED] | SECURITY DEFINER RLS helper |
| 15 RLS policies | [IMPLEMENTED] | School-scoped + service role bypass |
| 11 performance indexes | [IMPLEMENTED] | Per migration SQL |
| Default config seeding | [IMPLEMENTED] | 3 schools seeded with Default MTSS Model |
| `risk_level` enum with 'watch' | [IMPLEMENTED] | 4-tier: on_track/watch/at_risk/critical |

**Gap Priority:** N/A - Sprint 1A is COMPLETE.

---

## 3. edunode-discovery-toolkit.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Discovery scripts (01-06) | [IMPLEMENTED] | Scripts generated `.discovery/` output files |
| Discovery report generation | [IMPLEMENTED] | `.discovery/discovery-report.md` exists (63.2% gap score) |
| Project structure scan | [IMPLEMENTED] | 232 TypeScript files catalogued |
| Database schema discovery | [IMPLEMENTED] | 26 tables + views documented |
| Route/API inventory | [IMPLEMENTED] | All routes mapped |

**Gap Priority:** N/A - Discovery toolkit is COMPLETE and operational.

---

## 4. ARCHITECTURE_ALIGNMENT_AUDIT.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Graceful degradation (missing data) | [IMPLEMENTED] | `data_completeness` field in `student_metrics`, confidence penalty in risk engine |
| Weighted risk scoring model | [IMPLEMENTED] | `detection-engine.ts:212-214` computes weighted sum |
| Threshold triggers with alerts | [IMPLEMENTED] | `early-warning.ts` with 5 default rules |
| Privacy-first architecture (RLS) | [IMPLEMENTED] | 15 RLS policies per migration |
| Humanized output | [PARTIAL] | Risk factors include `description` field; dashboard not yet showing plain language |
| OneRoster/Ed-Fi integration | [MISSING] | Custom adapters only; no standardized intake |
| CSV golden template import | [MISSING] | No CSV import path implemented |
| Tiered data maturity branding | [MISSING] | No Starter/Connected/Advanced tier selection in onboarding |
| Edge/offline support | [MISSING] | Cloud-only (correctly deferred per doc) |
| Data validation "Wash Station" | [PARTIAL] | Per-adapter normalization; no generic validator |

**Key Gaps:**
- CSV import for low-resource schools [Sprint 4 priority]
- Data validator module [Sprint 4 priority]
- OneRoster intake endpoint [Sprint 5-6]

---

## 5. DATA_LITERACY_GUIDE.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Data cadence framework | [MISSING] | Content documented; not integrated into platform UX |
| Assessment type DOs/DONTs | [MISSING] | Content documented; no in-app education system |
| Score margin of error display | [PARTIAL] | Risk factors show raw values; no SEM range display |
| Data misuse red flag alerts | [MISSING] | No alert when data is being misused |
| Resource module integration | [MISSING] | Guide mentions `/[school_slug]/resources/modules/data-literacy` route; not implemented |

**Gap Priority:** MEDIUM - Content is excellent but not surfaced in the product. Needs `/resources/modules` route and content rendering.

---

## 6. ROLE_BASED_DASHBOARD_DESIGN.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Teacher Dashboard | [PARTIAL] | Main dashboard exists at `/[school_slug]/dashboard`; not role-filtered |
| MTSS Coordinator Dashboard | [MISSING] | No `/dashboard/early-warning` page exists |
| Counselor Dashboard | [MISSING] | No `/dashboard/caseload` page exists |
| School Admin Dashboard | [PARTIAL] | `/admin` pages exist; no school health score widget |
| Authorizer Dashboard | [PARTIAL] | `/[school_slug]/authorizer` exists per discovery report |
| Network Dashboard | [PARTIAL] | `/[school_slug]/network` exists per discovery report |
| Shared components (RiskDistributionChart, etc.) | [MISSING] | Components not built yet |
| RBAC route structure | [PARTIAL] | `school_memberships.role` exists; routes don't filter by role |

**Key Gaps:**
- **CRITICAL:** `/[school_slug]/dashboard/early-warning` page for MTSS coordinators [Sprint 4]
- Shared risk visualization components [Sprint 4]
- Role-based view filtering [Sprint 4]

---

## 7. DEVELOPER_CHECKLIST_v3.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Section A (Build Health) | [PARTIAL] | Build passes; `database.types.ts` needs regen; 7 files with `@ts-nocheck` |
| Section B (Data Integration) | [IMPLEMENTED] | 8 adapters, registry, orchestrator, pipeline |
| Section C (Risk Detection Engine) | [IMPLEMENTED] | Sprint 1A/1B complete per checklist |
| Section D (Alerts/Triggers) | [IMPLEMENTED] | Alert engine refactored; lifecycle complete |
| Section E (MTSS Workflow) | [PARTIAL] | Interventions strong; tier state field missing |
| Section F (Compliance) | [PARTIAL] | FERPA module exists; export endpoints missing |
| Section G (Early Warning Dashboard) | [MISSING] | Page not built; API endpoints exist |
| Section H (Testing) | [PARTIAL] | Vitest configured; risk engine tests not written |
| Sprint 2 items | [PARTIAL] | API endpoints exist; cron route exists; some items pending |

**Key Gaps:**
- `database.types.ts` regeneration BLOCKED on Supabase CLI auth
- Tier state field on students/interventions
- Risk engine unit tests
- Dashboard page implementation

---

## 8. INTERVENTION_DOSAGE_ANALYSIS.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| `intervention_dosage_metrics` table | [MISSING] | Migration not created |
| `DosagePlan` structure in interventions.metadata | [MISSING] | JSONB field exists but schema not enforced |
| Session logging in progress_notes | [MISSING] | No `session_delivered`, `session_duration_minutes` fields |
| Dosage computation engine | [MISSING] | `dosage-analyzer.ts` not built |
| 10 inference rules | [MISSING] | Documented rules not implemented |
| Dosage API endpoints | [MISSING] | No `/interventions/dosage` routes |
| Dashboard dosage widgets | [MISSING] | No effectiveness display |
| MTSS meeting prep with dosage report | [MISSING] | Export doesn't include dosage |

**Gap Priority:** HIGH - This is a key differentiator. Spec is complete (743 lines). Implementation is Sprint 3-4.

---

## 9. PREDICTIVE_READINESS_GAP_ANALYSIS.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Engagement data fields | [MISSING] | `engagement_score` exists but no LMS activity fields (login count, time-on-task) |
| SEL data fields | [MISSING] | No SEL survey integration |
| Ed-Fi/CEDS standardization | [MISSING] | No Ed-Fi mapping or export |
| Real-time xAPI/Caliper | [MISSING] | Batch-only (correctly deferred) |
| Bias auditing on risk scores | [MISSING] | No fairness audit by demographic |
| Cross-subject correlation engine | [MISSING] | Documented logic not implemented in `detection-engine.ts` |
| Temporary placement flag | [MISSING] | No `placement_status` field in schema |
| Mobility tracking | [MISSING] | No `prior_school_count` field |

**Key Gaps:**
- Engagement data fields in `student_metrics` [Sprint 4-5]
- Cross-subject correlation in risk factors [Sprint 4]
- Placement status + mobility tracking [Sprint 4]
- Bias auditing [Sprint 5]

---

## 10. PRODUCT_PHILOSOPHY.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| No analyst required | [PARTIAL] | System works automatically; dashboard needs plain language layer |
| No data team required | [IMPLEMENTED] | Adapter-based automated ingestion |
| No implementation consultants | [PARTIAL] | Defaults work; onboarding flow not complete |
| Affordable by design | [IMPLEMENTED] | Supabase + Vercel architecture |
| Layer 1-6 framework | [PARTIAL] | Layers 1-4 automated; Layers 5-6 (interpretation + action) need dashboard |
| Plain language over jargon | [MISSING] | Risk scores shown as numbers, not interpreted text |
| Role-appropriate views | [MISSING] | Single dashboard for all roles |

**Key Gaps:**
- Plain language interpretation layer in dashboard [Sprint 4]
- Role-based dashboard routing [Sprint 4]

---

## 11. WHOLE_STUDENT_CONTEXT_GUIDE.md

| Documented Item | Implementation Status | Evidence |
|-----------------|----------------------|----------|
| Mobility profile (prior school count) | [MISSING] | No field in schema |
| Entry diagnostic temporary placement | [MISSING] | No `placement_status` field |
| 4-6 week review reminder | [MISSING] | No alert rule for placement review |
| Cross-subject correlation detection | [MISSING] | No correlation logic in risk engine |
| Language-academic correlation flag | [MISSING] | No EL-specific risk factor generation |
| Data strategy pyramid | [PARTIAL] | Triangulation via multi-indicator scoring; interpretation layer missing |

**Key Gaps:**
- `placement_status`, `prior_school_count`, `days_since_enrollment` fields [Sprint 4]
- Placement review alert rule [Sprint 4]
- Cross-subject correlation factor in risk output [Sprint 4]

---

## Summary: Gap Count by Document

| Document | IMPLEMENTED | PARTIAL | MISSING | CONFLICTS |
|----------|-------------|---------|---------|-----------|
| SPRINT_PLAN.md | 0 | 2 | 2 | 0 |
| risk_engine_migration.sql | 11 | 0 | 0 | 0 |
| edunode-discovery-toolkit.md | 5 | 0 | 0 | 0 |
| ARCHITECTURE_ALIGNMENT_AUDIT.md | 5 | 2 | 4 | 0 |
| DATA_LITERACY_GUIDE.md | 0 | 1 | 4 | 0 |
| ROLE_BASED_DASHBOARD_DESIGN.md | 0 | 4 | 3 | 0 |
| DEVELOPER_CHECKLIST_v3.md | 4 | 4 | 1 | 0 |
| INTERVENTION_DOSAGE_ANALYSIS.md | 0 | 0 | 8 | 0 |
| PREDICTIVE_READINESS_GAP_ANALYSIS.md | 0 | 0 | 8 | 0 |
| PRODUCT_PHILOSOPHY.md | 2 | 3 | 2 | 0 |
| WHOLE_STUDENT_CONTEXT_GUIDE.md | 0 | 1 | 5 | 0 |

**Total: 27 IMPLEMENTED, 17 PARTIAL, 37 MISSING, 0 CONFLICTS**

---

## Cross-Document Contradictions

None detected. All documents are internally consistent and reference the same:
- 4-tier risk model (on_track/watch/at_risk/critical)
- Charter-first, district-ready strategy
- Database schema from Sprint 1A migration
- Role definitions from `school_memberships`

---

*Generated: March 7, 2026*
