# EduNode Analytics — Architecture Alignment Audit
## Mapping Against the Ideal K-12 Data Strategy Framework

**Date:** March 6, 2026
**Purpose:** Final session audit ensuring EduNode's architecture aligns with best practices for scale-agnostic, modular, privacy-first K-12 data strategy.

---

## Framework Alignment Scorecard

| Framework Principle | EduNode Status | Score | Notes |
|---|---|---|---|
| Scale-agnostic architecture | Aligned | 90% | Same platform serves 200-student charter and 5K-student district. Supabase + RLS handles multi-tenant. |
| Modular data strategy | Aligned | 85% | Adapter registry is modular. Schools enable what they have. |
| Thin integration layer (OneRoster/Ed-Fi) | Gap | 30% | Custom adapters per vendor. No OneRoster/Ed-Fi standardized intake. |
| Tiered data maturity model | Partially aligned | 60% | Works at Medium tier. Low tier (CSV) and High tier (xAPI) not fully supported. |
| Edge-friendly / offline collection | Not addressed | 10% | Cloud-only. No offline caching. No async burst upload. |
| Privacy-first data vault (hub-and-spoke) | Aligned | 80% | RLS enforces school-scoped access. PII anonymization. Service role separation. Missing: spoke-level insight-only access. |
| Actionable insight loop (auto-triggers) | Aligned | 85% | Risk engine triggers alerts, notifications route to staff by role. Missing: SMS/push, Slack integration. |
| Data validation ("Wash Station") | Partial | 40% | Adapters normalize per-source. No generic validation layer for CSV imports. No fuzzy matching. |
| Golden template for CSV import | Not built | 5% | CSV fallback mentioned in checklist but not implemented. |
| Defaulting (graceful degradation) | Aligned | 85% | Risk engine handles missing indicators via data completeness score. Confidence adjusts down. Score still computes. |
| Standardize > Automate > Humanize | Aligned | 75% | Automation strong (risk engine, alerts, cron jobs). Humanization strong (plain language, recommendations). Standardization weak (no Ed-Fi). |

**Overall Alignment: 59%**

---

## What's Already Right (Don't Change)

### 1. Graceful Degradation with Missing Data
The framework says: "If a school fails to provide behavior data, the system should run prediction based on Attendance and Grades rather than failing entirely."

**EduNode does this.** The risk engine computes with whatever indicators are available. The `data_completeness` score (0-1) reflects how many indicators have data. The completeness penalty nudges low-data students toward "watch" rather than falsely classifying them as "on track." When behavior data is absent, the engine scores on attendance + academic + assignments + trend. This is exactly right.

### 2. Weighted Risk Scoring Model
The framework defines: Risk = (w1 x A) + (w2 x B) + (w3 x C)

**EduNode implements this.** The composite risk score uses configurable weights stored in `risk_model_configs`:
- weight_attendance (0.250)
- weight_academic (0.300)  
- weight_assignments (0.200)
- weight_behavior (0.150)
- weight_trend (0.100)

Schools can adjust weights. Weights are constrained to sum to 1.0 via CHECK constraint. This matches the framework exactly and goes further by making it configurable per school.

### 3. Threshold Triggers with Automated Alerts
The framework says: "If Risk > 0.7, an automated alert is sent to the counselor."

**EduNode does this.** The `risk_alerts` table captures threshold breaches, and the `EarlyWarningSystem` dispatches notifications to staff by role via `school_memberships`. Alert deduplication prevents spam. Cooldown periods prevent re-alerting. This is production-grade.

### 4. Privacy-First Architecture
The framework recommends a hub-and-spoke model where schools access only insights for their students.

**EduNode implements this via RLS.** Every table has school-scoped Row Level Security. The `get_user_school_ids()` SECURITY DEFINER function ensures users only see data for schools they belong to. PII anonymization strips student identifiers before AI calls. FERPA compliance module exists. The "blast radius" of a compromised account is limited to one school's data.

### 5. Humanized Output
The framework says: "Interventions, not just charts."

**EduNode's entire design philosophy centers on this.** The product philosophy document states: "Insights, not data. Show what to do, not what the numbers are." The risk engine generates recommended actions. The dosage analysis spec produces plain-language recommendations ("Maria's math tutoring is showing results" not "risk_delta: -0.12"). The Data Literacy Guide translates machine output to human language.

---

## What Needs to Improve

### Gap 1: OneRoster / Ed-Fi Thin Integration Layer

**Framework says:** Don't build custom connectors for every app. Demand OneRoster or Ed-Fi compatibility.

**EduNode's current approach:** 8 custom adapters (Canvas, Clever, ClassLink, PowerSchool, MAP, iReady, Renaissance, Google Classroom). Each adapter has its own normalization logic.

**The problem:** This is the "resource killer" the framework warns about. Every new vendor requires a new adapter. When a school switches LMS, a new adapter must be built.

**The fix:**

Add a OneRoster 1.1/1.2 ingestion endpoint as the PRIMARY intake path. Most major K-12 systems support OneRoster export. This covers:
- Rosters (students, teachers, classes, enrollments)
- Gradebook (scores, assignments, categories)
- Demographics

The existing custom adapters become FALLBACK paths for vendors that don't support OneRoster or for schools that need deeper integration than OneRoster provides.

Architecture change:
```
Current:  School -> [Canvas Adapter] -> EduNode Schema
          School -> [PowerSchool Adapter] -> EduNode Schema

Improved: School -> [OneRoster Intake] -> EduNode Schema (primary)
          School -> [Canvas Adapter] -> EduNode Schema (fallback/enhanced)
```

**Sprint priority:** Sprint 5-6. This is a strategic improvement, not a blocker for charter pilots.

### Gap 2: CSV "Golden Template" for Low-Resource Schools

**Framework says:** Provide schools with a standardized CSV header. Reject files that don't match with specific errors.

**EduNode's current state:** The Developer Checklist notes "CSV import path" as incomplete. No template exists. No validation logic exists.

**Why this matters for charter schools:** Some charter schools, especially newer or smaller ones, don't have SIS systems that support API integration. They export data to spreadsheets. If EduNode can't ingest that data, those schools can't use the platform.

**The fix:**

Create standardized CSV templates for:

1. **Students** (required: student_id, first_name, last_name, grade_level, school_id)
2. **Attendance** (required: student_id, date, status [present/absent/tardy])
3. **Grades** (required: student_id, subject, grade_value, term)
4. **Assessments** (required: student_id, assessment_type, score, percentile, test_date)

Build a validation endpoint:
```
POST /api/schools/[schoolId]/data/import
  - Accepts CSV file
  - Validates against golden template
  - Returns specific errors ("Row 47: student_id is missing")
  - On success: normalizes and inserts into student_metrics
```

Add fuzzy matching for student names to prevent ghost duplicates.

**Sprint priority:** Sprint 4. This is a pilot-readiness item — the first charter school may not have API-ready systems.

### Gap 3: Tiered Data Maturity Support

**Framework defines three tiers:**

| Tier | Focus | Predictive Capability |
|------|-------|----------------------|
| Low (Manual) | SIS + Assessment data | Descriptive: "Who failed?" |
| Medium (Automated) | LMS + Attendance integration | Early Warning: "Who is trending toward failure?" |
| High (Adaptive) | Real-time xAPI + SEL | Prescriptive: "What intervention will work?" |

**EduNode currently operates at Medium tier.** Adapter-based automated ingestion of SIS, LMS, and assessment data. Nightly risk evaluation. Early warning alerts.

**To support Low tier (manual schools):**
- CSV import with golden templates (Gap 2 above)
- Manual data entry UI for attendance and grades
- Risk engine works even with only 2-3 indicators (already supported)

**To support High tier (advanced districts):**
- xAPI/Caliper stream ingestion (future)
- SEL survey integration (future)
- Prescriptive analytics: "This intervention type has 72% success rate for students with this risk profile" (dosage analysis provides the foundation)

**EduNode should explicitly brand these tiers** in its onboarding flow. When a school signs up, they select their maturity level, and the platform configures accordingly:

- **Starter:** CSV uploads + basic risk scoring
- **Connected:** API adapters + full risk engine + alerts
- **Advanced:** Real-time signals + dosage analysis + prescriptive recommendations

**Sprint priority:** Sprint 5 for Starter tier. Advanced tier is a roadmap item.

### Gap 4: Edge-Friendly / Offline Support

**Framework says:** Data should cache locally and burst to cloud when bandwidth is available.

**EduNode's current state:** Cloud-only. Requires internet for all operations.

**Reality check for charter schools:** Most charter schools in urban settings have reliable internet. This is a real concern for rural districts but not the initial target market.

**Recommendation:** Defer. This is a district-expansion feature, not a charter-pilot feature. When EduNode moves into rural markets, consider:
- Progressive Web App (PWA) with offline capability
- Local data caching with sync-on-reconnect
- Background sync using Service Workers

**Sprint priority:** Not in current roadmap. Revisit for rural expansion.

### Gap 5: Data Validation "Wash Station"

**Framework describes:** Constraint checks, null handling, fuzzy matching, standardization.

**EduNode's current state:** Each adapter does its own normalization. No centralized validation layer. No fuzzy matching.

**The fix:**

Create a `DataValidator` module that sits between ingestion and storage:

```typescript
// src/lib/data/validator.ts

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  cleaned: Record<string, unknown>;
}

class DataValidator {
  // Constraint checks
  validateGrade(value: string): number  // "A+" -> 4.0, "105" -> rejected
  validateAttendanceRate(value: number): number  // 0-100, reject negatives
  validatePercentile(value: number): number  // 0-99, clamp outliers
  
  // Null handling
  handleMissingAttendance(studentId: string, date: string): 'absent' | 'unknown'
  
  // Fuzzy matching
  matchStudentName(firstName: string, lastName: string, schoolId: string): string | null
  
  // Standardization
  normalizeGradeScale(value: string, sourceScale: string): number
}
```

This module is called by every adapter and the CSV import path, ensuring consistent data quality regardless of source.

**Sprint priority:** Sprint 4. Build alongside the CSV import path.

---

## What the Framework Gets Wrong (for Charter Schools)

Two items in the framework are bad advice for EduNode's target market:

### 1. "Demand OneRoster from vendors"

The framework says schools should demand OneRoster compatibility. For a 200-student charter school, they have zero leverage to demand anything from PowerSchool or Canvas. They use what's available.

**EduNode's correct approach:** Build adapters that work with whatever the school has, including CSV fallback. OneRoster intake is an optimization, not a requirement.

### 2. "Use Snowflake / Databricks for storage"

The framework's "high-resource" column suggests Snowflake or Databricks. This is wrong for charter schools and unnecessary for districts under 10K students.

**EduNode's correct approach:** Supabase (Postgres) handles everything at the charter and small-district scale. It's affordable, the SQL is standard, RLS is built-in, and it scales to hundreds of thousands of rows without enterprise infrastructure costs. The platform's pricing model depends on keeping infrastructure costs low. Snowflake would destroy the unit economics.

---

## Final Architecture Assessment

EduNode's architecture is fundamentally sound for its target market. The gaps are real but none are blockers for charter school pilots. The prioritized fix order is:

1. **Sprint 3-4:** Dosage analysis (already spec'd)
2. **Sprint 4:** CSV golden templates + data validator
3. **Sprint 4:** Cross-subject correlation engine (code implementation)
4. **Sprint 4:** Temporary placement flag + mobility tracking
5. **Sprint 5:** Engagement data fields + LMS adapter enhancement
6. **Sprint 5:** Bias auditing on risk distribution
7. **Sprint 5-6:** OneRoster intake endpoint
8. **Sprint 5-6:** Tiered maturity branding in onboarding
9. **Future:** Ed-Fi export, SEL data, xAPI streaming, offline support

The architecture is **charter-first and district-ready** — which is exactly right. The framework's advice applies at scale, but EduNode correctly prioritizes what matters for a 200-student school run by a principal who is also the MTSS coordinator and the 7th grade math teacher.

---

## Complete Session Output Inventory

| # | Document | Type | Filename |
|---|----------|------|----------|
| 1 | Risk Engine Technical Spec | Architecture | `edunode-risk-engine-technical-spec.md` |
| 2 | Discovery Toolkit | Scripts + Guide | `edunode-discovery-toolkit.md` + `run-all.ps1` |
| 3 | Sprint 1A Migration | SQL | `risk_engine_migration.sql` |
| 4 | Sprint 1B Refactor | PowerShell Script | `sprint-1b-risk-engine-refactor.ps1` |
| 5 | Developer Checklist v3 | Project State | `DEVELOPER_CHECKLIST_v3.md` |
| 6 | Role-Based Dashboard Design | Product Design | `ROLE_BASED_DASHBOARD_DESIGN.md` |
| 7 | Product Philosophy | Strategy | `PRODUCT_PHILOSOPHY.md` |
| 8 | Intervention Dosage Analysis | Feature Spec | `INTERVENTION_DOSAGE_ANALYSIS.md` |
| 9 | Data Literacy Guide | Content | `DATA_LITERACY_GUIDE.md` |
| 10 | Whole Student Context Guide | Content | `WHOLE_STUDENT_CONTEXT_GUIDE.md` |
| 11 | Predictive Readiness Gap Analysis | Audit | `PREDICTIVE_READINESS_GAP_ANALYSIS.md` |
| 12 | Architecture Alignment Audit | Final Audit | `ARCHITECTURE_ALIGNMENT_AUDIT.md` |

**Git commits this session:**
```
eb14189 feat: Sprint 1A - risk engine migration SQL (00006)
98943dc chore: discovery toolkit + Sprint 1A complete
c0dbea4 feat: Sprint 1B - refactor risk engine to use DB tables
e528b13 feat: Sprint 1B complete - risk engine refactored, build verified
```
