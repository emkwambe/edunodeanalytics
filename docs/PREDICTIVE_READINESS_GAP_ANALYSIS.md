# EduNode Analytics — Predictive Readiness Gap Analysis
## Evaluation Against K-12 Data-Driven Best Practices

**Date:** March 6, 2026
**Context:** End-of-session audit comparing EduNode's current state against the K-12 predictive analytics framework covering data domains, ingestion architecture, real-time signals, and ethical guardrails.

---

## Scorecard

| Domain | Status | Score | Gap Description |
|--------|--------|-------|-----------------|
| Academic Performance Data | Strong | 85% | Grades, assessments, growth tracked. Missing: formative assessment ingestion, exit ticket data. |
| Engagement Data ("The How") | Weak | 25% | Only generic engagement_score from JSONB. No LMS activity signals, time-on-task, login frequency. |
| Behavioral and Contextual Data | Moderate | 60% | Attendance and behavior incidents tracked. Missing: SEL survey data, discipline referral detail, minute-level attendance. |
| Standardized Ingestion (Ed-Fi/CEDS) | Not Started | 10% | Adapters normalize per-source but no Ed-Fi UDM or CEDS conformance. |
| Real-Time Micro-Signals | Not Started | 5% | Batch-only architecture. No xAPI/Caliper ingestion. No streaming pipeline. |
| Ethical Guardrails / Bias Auditing | Partial | 40% | PII anonymization strong. No bias feature flagging, no fairness audit on risk scores. |
| Cross-Subject Correlation | Documented | 50% | Guide written, correlation matrix defined. Not yet implemented in the risk engine code. |
| Entry Diagnostic Protocol | Documented | 50% | Guide written with workflow. Not yet codified in the platform (no temporary placement flag in schema). |
| Dosage Analysis | Documented | 30% | Full spec written with 10 inference rules. Not yet built (Sprint 3-4). |
| Data Literacy Content | Strong | 80% | Two comprehensive guides produced. Not yet integrated into the platform's resource modules. |

**Overall Predictive Readiness: 43%**

---

## Detailed Gap Analysis and Recommendations

### Gap 1: Engagement Data — The Leading Indicator We're Not Capturing

**Current state:** The `student_metrics` table has a single `engagement_score` field (NUMERIC 0-1) populated from `students.purpose_driven_metrics` JSONB. This is a composite score with no granularity.

**What's missing:**
- LMS login frequency (daily/weekly active sessions)
- Time-on-task per assignment
- Assignment submission timing (on time, late, day-of-deadline, not submitted)
- Video/content interaction patterns (pause, rewind, skip)
- Discussion forum participation
- Help-seeking behavior (how often student accesses support resources)

**Why it matters:** Engagement data is the strongest **leading** indicator. A student whose LMS logins drop from 5x/week to 1x/week is showing disengagement BEFORE grades decline. By the time the grade drops, it's a trailing indicator. Engagement data gives the 2-4 week early warning advantage that makes the difference between catching a student and losing them.

**Recommendation:**

Sprint priority: Medium (Sprint 4-5)

1. Add structured engagement fields to `student_metrics`:
```sql
-- Engagement indicators (add to student_metrics)
lms_login_count_7d          INTEGER,     -- logins in last 7 days
lms_login_count_30d         INTEGER,     -- logins in last 30 days
lms_login_trend             NUMERIC(6,4),-- weekly login slope
avg_time_on_task_minutes    NUMERIC(5,1),-- avg time per assignment
assignment_on_time_rate     NUMERIC(4,3),-- % submitted on time
assignment_late_rate        NUMERIC(4,3),-- % submitted late
assignment_not_submitted    INTEGER,     -- count not submitted
last_lms_activity           TIMESTAMPTZ, -- most recent LMS interaction
days_since_last_activity    INTEGER,     -- calculated from above
```

2. Enhance the Canvas and Google Classroom adapters to pull activity-level data (not just grades).

3. Add an "engagement" normalizer to the risk engine that detects:
   - Login frequency decline (week-over-week)
   - Assignment submission pattern changes
   - Extended inactivity periods

4. Add engagement as a 6th indicator in the risk scoring model (adjust weights from 5 to 6 factors).

---

### Gap 2: SEL (Social-Emotional Learning) Data

**Current state:** Not captured at all. No schema fields, no ingestion path, no assessment integration.

**What's missing:**
- SEL survey results (e.g., Panorama SEL surveys, CASEL-aligned instruments)
- Student self-reported wellbeing indicators
- Teacher-reported social-emotional observations
- Peer relationship indicators

**Why it matters:** SEL data is the strongest predictor of "quiet dropouts" — students who are present, completing work, but emotionally disengaging. These students don't trigger attendance or academic alerts but are at high risk of sudden decline.

**Recommendation:**

Sprint priority: Low (Sprint 6+)

1. Add SEL fields to `student_metrics`:
```sql
sel_self_awareness           NUMERIC(4,3), -- 0-1 from SEL survey
sel_self_management          NUMERIC(4,3),
sel_social_awareness         NUMERIC(4,3),
sel_relationship_skills      NUMERIC(4,3),
sel_responsible_decisions     NUMERIC(4,3),
sel_composite                NUMERIC(4,3), -- average of above
sel_survey_date              DATE,
sel_data_source              TEXT,         -- which instrument
```

2. Build a generic SEL survey adapter that maps common instruments to these fields.

3. Consider SEL as a future risk factor (not in MVP — data availability is too inconsistent across schools).

---

### Gap 3: Ed-Fi / CEDS Standardization

**Current state:** Each adapter normalizes data into EduNode's internal schema. But "attendance_rate" in EduNode may not mean exactly what "attendance_rate" means in state reporting. There's no formal mapping to Ed-Fi UDM or CEDS definitions.

**What's missing:**
- Ed-Fi UDM alignment for student, enrollment, attendance, assessment, and discipline entities
- CEDS element mapping for state reporting alignment
- Standard vocabularies for things like attendance codes, behavior incident types, assessment score types

**Why it matters for charter schools specifically:** Charter authorizers often require data in Ed-Fi format for accountability reporting. A charter school using EduNode that can export Ed-Fi-compliant data reduces their reporting burden. This is a competitive advantage.

**Recommendation:**

Sprint priority: Medium-Low (Sprint 5-6)

1. Create a mapping document: EduNode internal schema to Ed-Fi UDM entities.
2. Add Ed-Fi export capability for key entities (students, enrollments, attendance, assessments).
3. Consider adopting Ed-Fi element naming conventions for new schema additions.
4. This is NOT a rebuild — it's a translation layer on top of existing data.

---

### Gap 4: Real-Time Micro-Signals (xAPI/Caliper)

**Current state:** EduNode operates on a batch architecture. Data syncs via cron jobs (roster sync, stale intervention check, scheduled reports). The risk engine evaluates nightly or post-sync.

**What's missing:**
- xAPI (Experience API) stream ingestion
- Caliper Analytics event processing
- Real-time event pipeline (student starts assignment, student submits late, student absent today)
- Stream processing for immediate risk signal detection

**Why it matters:** Micro-signals like "student spent 10 minutes on a problem then abandoned it" or "student hasn't logged into the LMS since Tuesday" are the earliest possible warning signs. They precede grade changes by days or weeks.

**Recommendation:**

Sprint priority: Low (future architecture evolution)

This is an architecture-level change, not a feature addition. The current batch architecture is correct for the MVP and first 10-20 charter school deployments. Real-time streaming adds infrastructure cost and complexity that isn't justified until:
- Schools are actually generating xAPI/Caliper events (most aren't yet)
- The batch cycle (nightly) becomes too slow for the intervention workflow
- Customer demand explicitly requests real-time alerting

When the time comes:
1. Add a webhook ingestion endpoint for LMS events
2. Process events through a lightweight queue (Supabase Realtime or BullMQ)
3. Trigger incremental risk recalculation on significant events
4. Keep the nightly batch as the authoritative full recalculation

**Do NOT build this now.** It's premature optimization for the charter school market.

---

### Gap 5: Bias Auditing on Risk Scores

**Current state:** PII anonymization is strong. FERPA compliance is strong. But the risk engine does not audit whether its risk scores exhibit demographic bias.

**What's missing:**
- Fairness audit: Are students of certain demographics disproportionately flagged as "at risk"?
- Feature bias check: Does including zip code, ethnicity, or free/reduced lunch status in the data create discriminatory patterns?
- Disparate impact analysis: Is the risk distribution significantly different across demographic groups?

**Why it matters:** A risk engine that disproportionately flags Black male students or English learners as "at risk" — even if the underlying indicators are real — can reinforce systemic inequities rather than address them. Schools need to know whether the risk model is identifying need or reproducing bias.

**Recommendation:**

Sprint priority: Medium (Sprint 5)

1. Add a bias audit report to the risk distribution endpoint:
```json
{
  "fairness_audit": {
    "by_ethnicity": {
      "White": { "at_risk_rate": 0.08, "critical_rate": 0.02 },
      "Black": { "at_risk_rate": 0.14, "critical_rate": 0.04 },
      "Hispanic": { "at_risk_rate": 0.12, "critical_rate": 0.03 }
    },
    "disparity_flag": true,
    "disparity_note": "At-risk rate for Black students is 1.75x the rate for White students. Review whether indicator weights or thresholds contribute to disparate impact."
  }
}
```

2. The risk engine currently does NOT use demographic features as inputs (it uses attendance, academic, assignments, behavior, trend). This is correct — demographics should NOT be risk factors. But the outputs should be audited by demographic group to detect indirect bias.

3. Add a "Fairness Dashboard" widget for principals showing risk distribution by demographic subgroup.

4. Include this in the Data Literacy Guide: "Risk scores should identify need, not reproduce inequity. If certain groups are disproportionately flagged, investigate whether the indicators themselves are biased before assuming the students are truly at higher risk."

---

### Gap 6: Cross-Subject Correlation Engine (Code Implementation)

**Current state:** The Whole Student Context Guide documents the reading-math correlation, the geometry-language correlation, and provides a correlation matrix. But this logic is NOT implemented in the risk engine code.

**What's missing:**
- Automated detection of cross-subject patterns
- Language-demand flagging on math/science risk factors for EL students
- Recommendation to test math ability using reduced-language methods
- Cross-subject root cause analysis in the risk factor output

**Recommendation:**

Sprint priority: Medium (Sprint 4)

Add cross-subject correlation logic to the risk engine:

```typescript
// In the risk factor generation
if (student.is_english_learner && academicFactor.normalizedScore > 0.3 && readingFactor.normalizedScore > 0.3) {
  factors.push({
    name: 'Language-Academic Correlation',
    category: 'other',
    rawValue: readingFactor.normalizedScore,
    normalizedScore: 0, // Don't add to risk score — this is informational
    weight: 0,
    weightedScore: 0,
    description: 'Math/science performance may be affected by English language demands. Consider assessing math ability using reduced-language methods.',
    trend: 'stable',
  });
}
```

This adds an informational factor to the risk assessment without changing the score — it provides context for educators interpreting the data.

---

### Gap 7: Entry Diagnostic Temporary Placement Flag

**Current state:** The Whole Student Context Guide describes a temporary vs confirmed placement protocol, but the schema doesn't support it.

**What's missing:**
- `placement_status` field on students or student_metrics (temporary/confirmed)
- `enrolled_at` is used but no `placement_confirmed_at`
- No automated 4-6 week review reminder
- No mobility tracking (number of prior schools)

**Recommendation:**

Sprint priority: Medium (Sprint 4)

Add to `student_metrics`:
```sql
placement_status         TEXT DEFAULT 'temporary' CHECK (
  placement_status IN ('temporary', 'under_review', 'confirmed')
),
placement_confirmed_at   DATE,
enrollment_date          DATE,
prior_school_count       INTEGER DEFAULT 0,
mobility_flag            BOOLEAN DEFAULT false,
days_since_enrollment    INTEGER, -- computed
```

Add a risk alert rule:
```
IF placement_status = 'temporary'
   AND days_since_enrollment >= 30
THEN create alert: "Placement review due for {student_name} — 
     enrolled {days} days ago with temporary placement"
```

---

### Gap 8: Minute-Level Attendance (Not Just Daily)

**Current state:** `student_metrics.attendance_rate` is a percentage, `days_absent_last_30` is a count. These capture daily-level attendance.

**What's missing:**
- Period-level attendance (present for math but absent for English)
- Tardy tracking (late to school, late to class)
- Early departure tracking
- Minutes of instruction received vs scheduled

**Why it matters:** A student who is present for morning classes but consistently absent for afternoon classes has a different risk profile than a student who misses full days. Period-level attendance can reveal subject-specific avoidance patterns.

**Recommendation:**

Sprint priority: Low (Sprint 6+, depends on SIS granularity)

Most SIS systems (PowerSchool, Infinite Campus) can report period-level attendance. The adapter architecture supports this. Add to a future `student_attendance_detail` table when schools request this level of granularity.

---

## Prioritized Improvement Roadmap

| Priority | Gap | Sprint | Impact |
|----------|-----|--------|--------|
| 1 | Engagement data fields + LMS adapter enhancement | Sprint 4-5 | High — adds leading indicators |
| 2 | Bias auditing on risk distribution | Sprint 5 | High — equity and trust |
| 3 | Cross-subject correlation engine | Sprint 4 | Medium — prevents misdiagnosis |
| 4 | Temporary placement flag + mobility tracking | Sprint 4 | Medium — protects new students |
| 5 | Dosage analysis implementation | Sprint 3-4 | High — intervention effectiveness |
| 6 | Ed-Fi export layer | Sprint 5-6 | Medium — authorizer reporting |
| 7 | SEL data fields + adapter | Sprint 6+ | Low for MVP — high for maturity |
| 8 | xAPI/Caliper real-time signals | Future | Low for charter — high for district |
| 9 | Minute-level attendance | Sprint 6+ | Low — depends on SIS capability |

---

## What We Got Right

Despite the gaps, the session produced a strong foundation:

1. **Architecture is correct for the target market.** Batch processing with nightly evaluation is appropriate for charter schools. Real-time streaming is premature optimization.

2. **The risk engine uses multiple indicators, not just grades.** This avoids the "trailing indicator" trap described in the framework.

3. **Configurability is built in from the start.** Per-school weights and thresholds mean each school can tune the model to their context.

4. **Explainability is non-negotiable.** Every risk score carries factor-level detail. This builds educator trust and prevents black-box decisions.

5. **FERPA compliance is strong.** PII anonymization, RLS, audit trails, and SECURITY DEFINER functions are production-grade.

6. **The data literacy content addresses the most common misuses.** The MAP winter score scenario, the norm vs criterion trap, and the cross-subject correlation guide are content that no competitor ships.

7. **Dosage analysis is a genuine differentiator.** The full spec with 10 inference rules and 73 test items is ready for implementation.

8. **The product philosophy is clear.** "Meaningful educational analytics, accessible and affordable" drives every architectural decision.

---

## Session Deliverables Summary

| Document | Purpose | Status |
|----------|---------|--------|
| Technical Spec (Risk Engine) | Architecture + schema + API design | Complete |
| Developer Checklist v3 | Full project state with Sprint 1 completion | Complete |
| Discovery Report | Project scan + gap analysis (63.2%) | Complete |
| Role-Based Dashboard Design | 6 role-specific dashboard specs | Complete |
| Product Philosophy | Mission, Layer 1-6 framework, design principles | Complete |
| Intervention Dosage Analysis | Feature spec + 10 inference rules + 73 test items | Complete |
| Data Literacy Guide | DOs/DONTs per assessment type + data cadence | Complete |
| Whole Student Context Guide | Mobility, entry diagnostics, cross-subject correlations | Complete |
| Predictive Readiness Gap Analysis | This document — what's missing + prioritized roadmap | Complete |
| Sprint 1A Migration SQL | 5 tables + view + RLS + indexes + seeds | Applied and committed |
| Sprint 1B Refactored Engine | detection-engine.ts + early-warning.ts + bridge types | Applied and committed |
