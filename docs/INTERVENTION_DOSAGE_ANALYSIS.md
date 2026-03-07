# EduNode Analytics — Intervention Dosage Analysis
## Feature Specification, Architecture Evaluation, and Inspection Checklist

**Version:** 1.0
**Date:** March 6, 2026
**Author:** Mpingo Systems — CTO Office

---

## 1. What Dosage Analysis Is and Why It Matters

### The Problem

Schools assign interventions. They rarely evaluate whether the intervention is working at the right intensity.

A student at critical risk (0.82) receiving 30 minutes of math tutoring once a week is undertreated. A student at watch level (0.35) receiving daily pull-out sessions is overtreated — consuming resources that could help a more at-risk student. Neither school knows this because they track *existence* of interventions, not *effectiveness relative to intensity*.

MTSS requires tiered support with increasing intensity. But "increasing intensity" is subjective without dosage data. How much is enough? How do you know when to escalate? When is an intervention working slowly vs not working at all?

### What Dosage Means in Education

Dosage is the combination of:

- **Frequency** — how many sessions per week
- **Duration** — how many minutes per session
- **Span** — how many total weeks of intervention
- **Fidelity** — what percentage of planned sessions actually occurred
- **Type match** — whether the intervention type addresses the primary risk driver

Dosage effectiveness is measured by:

- **Risk score response** — did the composite risk score decline?
- **Indicator response** — did the specific indicator the intervention targets improve?
- **Time to response** — how many weeks before measurable improvement?
- **Sustained response** — does improvement hold after intervention reduces or ends?

### Why This Is a Differentiator

Most MTSS platforms (Panorama, Branching Minds, Illuminate) track intervention existence and status. Some track progress notes. Almost none compute dosage effectiveness — the relationship between intervention intensity and student outcome change over time.

EduNode can do this because it has both sides of the equation:

1. **Intervention data** — type, dates, progress notes, baseline/current values (from `interventions` table)
2. **Outcome data** — timestamped risk scores and indicator-level metrics (from `risk_evaluations` and `student_metric_history`)

The connection between these two datasets is the dosage analysis engine.

---

## 2. Architecture Evaluation — What Already Exists

### 2.1 Existing Data Infrastructure

#### Interventions Table (25 columns — EXISTING)

| Column | Type | Dosage Relevance |
|--------|------|-----------------|
| `start_date` | date | Span start |
| `target_end_date` | date | Planned span |
| `actual_end_date` | date | Actual span |
| `baseline_value` | numeric | Pre-intervention measurement |
| `target_value` | numeric | Goal |
| `current_value` | numeric | Latest measurement |
| `progress_notes` | jsonb | Session-level data (frequency, fidelity) |
| `status` | enum | active/completed/paused/cancelled |
| `is_stale` | boolean | No update in 14+ days |
| `was_successful` | boolean | Outcome |
| `outcome_summary` | text | Narrative outcome |
| `type` | enum | academic/attendance/behavior/sel |
| `priority` | enum | Urgency level |
| `metadata` | jsonb | Extensible — can store dosage config |

**Assessment:** The interventions table has strong bones for dosage analysis. The `baseline_value`/`target_value`/`current_value` triplet enables progress measurement. The `progress_notes` JSONB can store session-level dosage data. The `metadata` JSONB can store dosage configuration (planned frequency, duration per session). The `start_date`/`target_end_date` pair defines the planned span.

**Gap:** No structured fields for frequency (sessions/week), duration (minutes/session), or fidelity (actual sessions / planned sessions). These are currently either absent or buried in unstructured `progress_notes` JSONB.

#### Risk Evaluations Table (SPRINT 1A — EXISTING)

| Column | Dosage Relevance |
|--------|-----------------|
| `risk_score` | Outcome measurement per evaluation |
| `risk_level` | Tier classification |
| `risk_factors` | Indicator-level breakdown |
| `trajectory` | Improving/stable/declining |
| `computed_at` | Timestamp for time-series analysis |
| `metrics_snapshot` | Full indicator state at time of evaluation |

**Assessment:** This is the outcome side of the dosage equation. Every risk evaluation is timestamped and carries the full factor breakdown. By comparing evaluations before, during, and after an intervention, we can compute the intervention's effect on each risk indicator.

#### Student Metric History (SPRINT 1A — EXISTING)

| Column | Dosage Relevance |
|--------|-----------------|
| `attendance_rate` | Weekly attendance for attendance interventions |
| `math_assessment_pct` | Assessment response for academic interventions |
| `reading_assessment_pct` | Assessment response for reading interventions |
| `missing_assignment_rate` | Assignment completion for academic interventions |
| `behavior_incident_count` | Behavior response for behavior interventions |
| `snapshot_date` | Weekly timestamp |

**Assessment:** This provides weekly indicator-level data aligned to intervention timelines. Critical for measuring whether a specific indicator responded to a targeted intervention.

#### Workflow Manager (23.1 KB — EXISTING)

`src/lib/interventions/workflow-manager.ts` — manages intervention lifecycle including:
- Creation and assignment
- Status transitions
- Stale detection
- Progress note management

**Assessment:** The workflow manager handles lifecycle but does not compute dosage metrics. It is the right place to integrate dosage calculations because it already manages the intervention state machine.

#### Team Collaboration (15.8 KB — EXISTING)

`src/lib/interventions/team-collaboration.ts` — manages team assignments, comments, and shared visibility.

**Assessment:** Relevant for dosage fidelity — team members can report session completion. Not a primary integration point for dosage computation.

### 2.2 Existing Workflow

```
Current MTSS Intervention Workflow:

Student flagged (risk engine)
    |
    v
MTSS team reviews (meeting)
    |
    v
Intervention created (type + assignment + goals)
    |
    v
Progress notes added (manual, periodic)
    |
    v
Stale detection (14-day check via cron)
    |
    v
Manual review (is it working?)          <-- THIS IS THE GAP
    |
    v
Close / extend / escalate (gut decision)
```

**The gap is at "is it working?"** — currently answered by subjective judgment in a meeting. Dosage analysis replaces this with computed evidence.

### 2.3 What Needs to Be Added

```
Enhanced MTSS Intervention Workflow with Dosage Analysis:

Student flagged (risk engine)
    |
    v
MTSS team reviews
    |
    v
Intervention created WITH dosage plan
  (type + frequency + duration + span + target indicator)
    |
    v
Session logging (progress notes with session data)
    |
    v
Dosage computation (automatic, weekly)
    |                                    
    |--- Fidelity check: sessions delivered vs planned
    |--- Response check: risk score / indicator change
    |--- Sufficiency check: dosage vs risk severity match
    |--- Time-to-response: weeks to first measurable change
    |
    v
Dosage inference engine
    |
    |--- WORKING: risk declining, indicator improving
    |       Action: continue, document success
    |
    |--- SLOW RESPONSE: minimal change after adequate time
    |       Action: increase frequency or duration
    |
    |--- NOT RESPONDING: no change or worsening
    |       Action: change intervention type or escalate tier
    |
    |--- UNDERTREATED: dosage below severity-appropriate level
    |       Action: alert coordinator, recommend increase
    |
    |--- FIDELITY ISSUE: planned sessions not delivered
    |       Action: alert assigned staff, investigate barriers
    |
    |--- SUSTAINED: improvement holds after dosage reduction
    |       Action: prepare for tier step-down
    |
    v
Automated alerts + recommendations
    |
    v
Evidence-based decision in MTSS meeting
```

---

## 3. Data Model Extensions

### 3.1 Dosage Configuration (on existing interventions table)

No new table needed. Extend the `metadata` JSONB field on `interventions` with a structured `dosage_plan`:

```typescript
// Structure stored in interventions.metadata.dosage_plan
interface DosagePlan {
  planned_frequency_per_week: number;    // e.g., 3
  planned_duration_minutes: number;       // e.g., 45
  planned_span_weeks: number;             // e.g., 8
  target_indicator: string;               // e.g., 'attendance_rate', 'math_assessment_pct'
  intensity_level: 'low' | 'moderate' | 'high' | 'intensive';
  total_planned_sessions: number;         // frequency * span
  started_at: string;                     // ISO date
}
```

### 3.2 Session Log (extend progress_notes JSONB)

Each progress note entry can include session data:

```typescript
// Structure stored in interventions.progress_notes array entries
interface ProgressNoteEntry {
  id: string;
  date: string;
  author_id: string;
  note: string;
  
  // Dosage fields (new)
  session_delivered: boolean;              // was the session held?
  session_duration_minutes?: number;       // actual duration
  session_type?: 'individual' | 'small_group' | 'classroom';
  student_attended?: boolean;              // did the student show up?
  cancellation_reason?: string;            // if session_delivered = false
}
```

### 3.3 Dosage Metrics (new table)

```sql
CREATE TABLE IF NOT EXISTS public.intervention_dosage_metrics (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id         UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  student_id              UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id               UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Dosage delivery metrics
  planned_sessions        INTEGER NOT NULL DEFAULT 0,
  delivered_sessions      INTEGER NOT NULL DEFAULT 0,
  attended_sessions       INTEGER NOT NULL DEFAULT 0,
  fidelity_rate           NUMERIC(4,3),        -- delivered / planned (0-1)
  attendance_rate         NUMERIC(4,3),        -- attended / delivered (0-1)
  total_minutes_delivered INTEGER DEFAULT 0,
  avg_session_minutes     NUMERIC(5,1),
  
  -- Response metrics
  risk_score_at_start     NUMERIC(4,3),
  risk_score_current      NUMERIC(4,3),
  risk_score_delta        NUMERIC(5,3),        -- negative = improving
  target_indicator_start  NUMERIC(8,3),
  target_indicator_current NUMERIC(8,3),
  target_indicator_delta  NUMERIC(8,3),
  
  -- Trajectory
  weeks_elapsed           INTEGER DEFAULT 0,
  weeks_to_first_response INTEGER,             -- NULL if no response yet
  response_status         TEXT CHECK (response_status IN (
    'too_early',           -- less than 2 weeks of data
    'responding',          -- measurable improvement
    'slow_response',       -- minimal improvement after adequate time
    'not_responding',      -- no change or worsening
    'sustained',           -- improvement holds after reduction
    'regression'           -- was improving, now declining
  )),
  
  -- Sufficiency assessment
  dosage_sufficiency      TEXT CHECK (dosage_sufficiency IN (
    'appropriate',         -- dosage matches risk severity
    'undertreated',        -- dosage below recommended for risk level
    'overtreated',         -- dosage above necessary for risk level
    'unknown'              -- insufficient data to assess
  )),
  
  -- Inference
  recommended_action      TEXT CHECK (recommended_action IN (
    'continue',            -- working, maintain current dosage
    'increase_frequency',  -- add more sessions per week
    'increase_duration',   -- longer sessions
    'change_type',         -- different intervention approach
    'escalate_tier',       -- move to higher tier
    'reduce_dosage',       -- improvement sustained, can step down
    'investigate_fidelity', -- sessions not being delivered
    'close_intervention'   -- goals met, can close
  )),
  recommended_action_reason TEXT,
  
  -- Metadata
  computed_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dosage_metrics_intervention 
  ON public.intervention_dosage_metrics(intervention_id);
CREATE INDEX IF NOT EXISTS idx_dosage_metrics_student 
  ON public.intervention_dosage_metrics(student_id, school_id);
CREATE INDEX IF NOT EXISTS idx_dosage_metrics_response 
  ON public.intervention_dosage_metrics(school_id, response_status);
```

---

## 4. Dosage Inference Engine

### 4.1 Inference Rules

The dosage inference engine evaluates each active intervention weekly and produces a `response_status`, `dosage_sufficiency`, and `recommended_action`.

#### Rule 1: Too Early
```
IF weeks_elapsed < 2
THEN response_status = 'too_early'
     recommended_action = 'continue'
     reason = 'Less than 2 weeks of data — continue current plan'
```

#### Rule 2: Responding
```
IF risk_score_delta < -0.05
   AND target_indicator trending in desired direction
THEN response_status = 'responding'
     recommended_action = 'continue'
     reason = 'Risk score declining by {delta} — intervention is working'
```

#### Rule 3: Slow Response
```
IF weeks_elapsed >= 4
   AND risk_score_delta BETWEEN -0.05 AND 0.02
   AND fidelity_rate >= 0.75
THEN response_status = 'slow_response'
     recommended_action = 'increase_frequency'
     reason = 'Minimal change after {weeks} weeks despite {fidelity}% fidelity — consider increasing dosage'
```

#### Rule 4: Not Responding
```
IF weeks_elapsed >= 6
   AND risk_score_delta >= 0
   AND fidelity_rate >= 0.75
THEN response_status = 'not_responding'
     recommended_action = 'change_type'
     reason = 'No improvement after {weeks} weeks — current intervention type may not address root cause'
```

#### Rule 5: Not Responding + High Risk
```
IF weeks_elapsed >= 4
   AND risk_score_delta > 0.05
   AND risk_score_current >= 0.70
THEN response_status = 'not_responding'
     recommended_action = 'escalate_tier'
     reason = 'Risk increasing despite intervention — recommend tier escalation'
```

#### Rule 6: Fidelity Issue
```
IF fidelity_rate < 0.60
   AND weeks_elapsed >= 2
THEN response_status = 'not_responding'  -- can't assess response without fidelity
     recommended_action = 'investigate_fidelity'
     reason = 'Only {fidelity}% of planned sessions delivered — investigate barriers before assessing response'
```

#### Rule 7: Undertreated
```
IF risk_score_current >= 0.70 (critical)
   AND planned_frequency_per_week <= 2
   AND planned_duration_minutes <= 30
THEN dosage_sufficiency = 'undertreated'
     reason = 'Critical risk level ({score}) with low-intensity dosage — standard is 3-5x/week, 30-45min for Tier 3'
```

#### Rule 8: Overtreated
```
IF risk_score_current < 0.30 (on_track)
   AND intervention is still active
   AND risk_score_delta < -0.15
THEN dosage_sufficiency = 'overtreated'
     recommended_action = 'reduce_dosage'
     reason = 'Student is now on track — consider stepping down intervention intensity'
```

#### Rule 9: Sustained Response
```
IF intervention was reduced (frequency or duration decreased)
   AND weeks since reduction >= 3
   AND risk_score has not increased
THEN response_status = 'sustained'
     recommended_action = 'close_intervention'
     reason = 'Improvement maintained for {weeks} weeks after dosage reduction — ready to close'
```

#### Rule 10: Regression
```
IF response_status was previously 'responding'
   AND risk_score_delta for last 2 weeks > 0.05
THEN response_status = 'regression'
     recommended_action = 'increase_frequency'
     reason = 'Student was improving but risk is now increasing — may need dosage increase'
```

### 4.2 Dosage-to-Severity Mapping

Research-based recommended dosages by tier:

| Risk Level | MTSS Tier | Recommended Frequency | Recommended Duration | Recommended Span |
|-----------|-----------|----------------------|---------------------|-----------------|
| On Track | Tier 1 | Universal (classroom) | N/A | Ongoing |
| Watch | Tier 1+ | 1-2x/week | 20-30 min | 4-6 weeks |
| At Risk | Tier 2 | 2-3x/week | 30-45 min | 6-12 weeks |
| Critical | Tier 3 | 3-5x/week | 30-60 min | 8-16 weeks |

These defaults are stored in `risk_model_configs.metadata` and are configurable per school. The inference engine uses them for the `dosage_sufficiency` assessment.

---

## 5. Actions and Triggers

### 5.1 Automated Triggers

| Trigger Event | Action | Notification Target |
|--------------|--------|-------------------|
| `response_status = 'not_responding'` after 6 weeks | Create risk alert (type: `intervention_overdue`) | MTSS coordinator, assigned staff |
| `dosage_sufficiency = 'undertreated'` | Create risk alert (type: `trend_warning`) with dosage recommendation | MTSS coordinator |
| `fidelity_rate < 0.60` for 2+ weeks | Create risk alert (type: `intervention_overdue`) with fidelity flag | Assigned staff, coordinator |
| `response_status = 'responding'` | Update intervention status, add auto-generated progress note | Assigned staff (positive notification) |
| `recommended_action = 'escalate_tier'` | Flag for MTSS meeting agenda, create tier review item | MTSS coordinator, admin |
| `recommended_action = 'close_intervention'` | Prompt assigned staff to confirm closure with outcome summary | Assigned staff |
| `risk_score_current` drops below `threshold_on_track` | Suggest intervention step-down | Assigned staff, coordinator |

### 5.2 Dashboard Inferences

These are computed values displayed on role-specific dashboards:

#### Teacher Dashboard
- "Maria's math tutoring is showing results — risk score dropped 12% in 3 weeks"
- "James's attendance mentor sessions are only happening 1x/week (planned 3x) — check in with the mentor"

#### MTSS Coordinator Dashboard
- "5 interventions are not producing measurable improvement after 4+ weeks"
- "3 students are undertreated — critical risk with Tier 2 dosage"
- "School average time-to-response: 3.2 weeks for academic interventions, 5.1 weeks for attendance"

#### Counselor Dashboard
- "Your caseload effectiveness: 67% responding, 20% slow response, 13% not responding"
- "Most effective intervention type for your students: small group math (avg risk delta: -0.14)"

#### Principal Dashboard
- "School-wide intervention effectiveness: math tutoring (-0.14 avg risk delta) outperforms attendance coaching (-0.06)"
- "Fidelity concern: 4 interventions below 60% session delivery rate"

### 5.3 MTSS Meeting Integration

Before each MTSS meeting, the system auto-generates:

```
MTSS Meeting Prep — Dosage Report
==================================

STUDENTS TO DISCUSS (sorted by urgency):

1. Maria Lopez — NOT RESPONDING
   Intervention: Math Tutoring (Tier 2)
   Dosage: 2x/week, 30min, 6 weeks elapsed
   Fidelity: 83%
   Risk delta: +0.03 (worsening)
   Recommendation: Change intervention type or escalate to Tier 3
   
2. James Chen — UNDERTREATED  
   Intervention: Attendance Mentor (Tier 2)
   Dosage: 1x/week, 20min, 3 weeks elapsed
   Fidelity: 100%
   Risk: 0.74 (critical)
   Recommendation: Increase to 3x/week — dosage insufficient for critical risk

3. Aisha Patel — FIDELITY ISSUE
   Intervention: Reading Support (Tier 2)
   Dosage planned: 3x/week, 30min
   Dosage actual: 1.2x/week (40% fidelity)
   Recommendation: Investigate delivery barriers before assessing response

POSITIVE OUTCOMES:

4. David Kim — RESPONDING
   Intervention: Math Tutoring (Tier 2)
   Dosage: 3x/week, 45min, 4 weeks elapsed
   Risk delta: -0.18 (improving)
   Recommendation: Continue current plan, review at week 8

5. Sarah Moore — SUSTAINED
   Intervention: Behavior Plan (Tier 3, reduced to Tier 2 dosage)
   Risk stable at 0.28 for 3 weeks since reduction
   Recommendation: Close intervention, return to Tier 1
```

---

## 6. Integration with Existing Architecture

### 6.1 Where Dosage Computation Runs

The dosage metrics are computed by a new module:

```
src/lib/risk-engine/dosage-analyzer.ts
```

This module is called:
1. **Weekly** — by the nightly batch cron (after risk evaluation)
2. **On progress note submission** — when staff adds a session note
3. **On intervention status change** — when an intervention is created, paused, or closed

### 6.2 Data Flow

```
Progress note submitted
    |
    v
workflow-manager.ts (existing)
    |
    v
dosage-analyzer.ts (new)
    |-- reads: intervention record (dosage plan + progress notes)
    |-- reads: risk_evaluations (risk scores over intervention period)
    |-- reads: student_metric_history (indicator values over intervention period)
    |
    |-- computes: fidelity_rate, risk_score_delta, indicator_delta
    |-- infers: response_status, dosage_sufficiency, recommended_action
    |
    |-- writes: intervention_dosage_metrics
    |-- writes: risk_alerts (if trigger conditions met)
    |-- writes: notifications (if action needed)
    |
    v
Dashboard queries intervention_dosage_metrics for display
```

### 6.3 API Endpoints

```
/api/schools/[schoolId]/interventions/[interventionId]/dosage
  GET  — current dosage metrics for this intervention
  
/api/schools/[schoolId]/interventions/dosage/summary
  GET  — school-wide dosage effectiveness summary

/api/schools/[schoolId]/interventions/dosage/alerts
  GET  — interventions needing dosage adjustment

/api/schools/[schoolId]/risk/effectiveness
  GET  — intervention type effectiveness comparison
```

---

## 7. Inspection and Testing Checklist

### 7.1 Data Layer Verification

- [ ] `intervention_dosage_metrics` table exists in Supabase
- [ ] RLS policies applied (school-scoped + service role)
- [ ] Indexes on `intervention_id`, `student_id`, `response_status`
- [ ] `updated_at` trigger configured
- [ ] `interventions.metadata` JSONB accepts `dosage_plan` structure
- [ ] `interventions.progress_notes` JSONB accepts session-level entries

### 7.2 Dosage Plan Creation

- [ ] When creating intervention, UI allows setting frequency, duration, span
- [ ] Dosage plan defaults exist based on risk level (Tier mapping)
- [ ] `dosage_plan` stored in `interventions.metadata`
- [ ] `total_planned_sessions` computed from frequency x span
- [ ] `target_indicator` linked to primary risk factor for the student

### 7.3 Session Logging

- [ ] Progress note form includes `session_delivered` checkbox
- [ ] Progress note form includes `session_duration_minutes`
- [ ] Progress note form includes `student_attended` checkbox
- [ ] Cancelled sessions logged with reason
- [ ] Session count increments in dosage metrics on note submission

### 7.4 Dosage Computation (Core)

- [ ] `computeDosageMetrics(interventionId)` function exists
- [ ] Fidelity rate computed: `delivered_sessions / planned_sessions`
- [ ] Attendance rate computed: `attended_sessions / delivered_sessions`
- [ ] Risk score at start captured from `risk_evaluations` nearest to `start_date`
- [ ] Risk score current captured from latest `risk_evaluations`
- [ ] Risk score delta computed: `current - start` (negative = improving)
- [ ] Target indicator start/current/delta computed from `student_metric_history`
- [ ] Weeks elapsed computed from `start_date` to now
- [ ] Weeks to first response computed (first week where delta < -0.03)
- [ ] Computation runs weekly via batch cron
- [ ] Computation runs on progress note submission
- [ ] Results persisted to `intervention_dosage_metrics`

### 7.5 Inference Rules

- [ ] Rule 1 (Too Early): returns `too_early` when `weeks_elapsed < 2`
- [ ] Rule 2 (Responding): detects `risk_score_delta < -0.05`
- [ ] Rule 3 (Slow Response): detects minimal change after 4+ weeks with good fidelity
- [ ] Rule 4 (Not Responding): detects no improvement after 6+ weeks
- [ ] Rule 5 (Not Responding + High Risk): detects worsening at critical level
- [ ] Rule 6 (Fidelity Issue): detects `fidelity_rate < 0.60` for 2+ weeks
- [ ] Rule 7 (Undertreated): detects critical risk with low-intensity dosage
- [ ] Rule 8 (Overtreated): detects on-track risk with high-intensity dosage
- [ ] Rule 9 (Sustained): detects stable improvement after dosage reduction
- [ ] Rule 10 (Regression): detects reversal of previous improvement
- [ ] Each rule produces correct `response_status`
- [ ] Each rule produces correct `dosage_sufficiency`
- [ ] Each rule produces correct `recommended_action`
- [ ] Each rule produces human-readable `recommended_action_reason`

### 7.6 Automated Triggers

- [ ] `not_responding` after 6 weeks creates `risk_alert` (type: `intervention_overdue`)
- [ ] `undertreated` creates `risk_alert` (type: `trend_warning`) with dosage recommendation
- [ ] `fidelity_rate < 0.60` for 2+ weeks creates fidelity alert
- [ ] `responding` generates positive notification to assigned staff
- [ ] `escalate_tier` flags student for MTSS meeting agenda
- [ ] `close_intervention` prompts assigned staff to confirm closure
- [ ] Alerts deduplicate via `cooldown_key` (no repeat alerts within cooldown period)
- [ ] Notifications sent to correct roles based on alert type

### 7.7 Dashboard Display

- [ ] Teacher sees dosage status for interventions on their students
- [ ] Coordinator sees school-wide dosage effectiveness summary
- [ ] Coordinator sees "not responding" and "undertreated" lists
- [ ] Counselor sees caseload-level fidelity and response rates
- [ ] Principal sees intervention type comparison (which types work best)
- [ ] MTSS meeting prep export includes dosage report
- [ ] Plain language descriptions (not raw numbers)
- [ ] Color coding: green (responding), yellow (slow/too early), red (not responding/fidelity issue)

### 7.8 API Endpoints

- [ ] `GET /api/schools/[schoolId]/interventions/[interventionId]/dosage` returns current metrics
- [ ] `GET /api/schools/[schoolId]/interventions/dosage/summary` returns school-wide summary
- [ ] `GET /api/schools/[schoolId]/interventions/dosage/alerts` returns interventions needing attention
- [ ] `GET /api/schools/[schoolId]/risk/effectiveness` returns intervention type comparison
- [ ] All endpoints validate `schoolId` and user membership
- [ ] All endpoints return proper error responses
- [ ] Pagination supported on list endpoints

### 7.9 Edge Cases

- [ ] Student with no `risk_evaluations` before intervention start — uses `baseline_value` from intervention record
- [ ] Intervention with no progress notes — `fidelity_rate = 0`, triggers fidelity alert after 2 weeks
- [ ] Multiple interventions for same student — each analyzed independently
- [ ] Intervention paused and resumed — weeks_elapsed counts only active periods
- [ ] Intervention type changed mid-course — treated as new intervention for dosage analysis
- [ ] Student transfers schools — dosage metrics archived, not deleted
- [ ] Risk model config changes during intervention — risk deltas use consistent scoring
- [ ] Zero planned sessions (missing dosage plan) — `dosage_sufficiency = 'unknown'`, prompt to configure

### 7.10 Unit Tests

- [ ] `computeFidelityRate` with various delivered/planned ratios
- [ ] `computeRiskDelta` with improving, stable, and worsening scenarios
- [ ] `assessResponseStatus` for each of the 10 inference rules
- [ ] `assessDosageSufficiency` for each tier/dosage combination
- [ ] `generateRecommendation` produces correct action and reason
- [ ] Edge case: intervention with zero weeks elapsed
- [ ] Edge case: intervention with perfect fidelity but no risk change
- [ ] Edge case: student improving without intervention (spontaneous recovery)

### 7.11 Integration Tests

- [ ] End-to-end: create intervention with dosage plan > add 4 progress notes > compute dosage > verify metrics
- [ ] Batch computation: run weekly dosage analysis across all active interventions
- [ ] Alert generation: verify `not_responding` intervention creates correct alert
- [ ] Dashboard query: verify school-wide dosage summary aggregates correctly
- [ ] Meeting prep: verify export includes dosage report for flagged students

---

## 8. Sprint Integration

### Where This Fits in the Roadmap

Dosage analysis spans Sprint 3-4:

**Sprint 3 additions:**
- [ ] `intervention_dosage_metrics` migration
- [ ] `dosage-analyzer.ts` core computation
- [ ] Inference rules engine
- [ ] Integration with weekly batch cron

**Sprint 4 additions:**
- [ ] Dosage API endpoints
- [ ] Dashboard widgets for dosage display
- [ ] MTSS meeting prep export with dosage report
- [ ] Session logging UI enhancements

**Sprint 5:**
- [ ] School-wide effectiveness comparison
- [ ] Dosage configuration admin UI
- [ ] Historical dosage trend analysis

---

## 9. The Business Case

### What Schools Can Say to Authorizers

Without EduNode:
> "We provided math tutoring to struggling students."

With EduNode:
> "We identified 12 students at critical risk through our early warning system. Within 48 hours, we assigned targeted interventions matched to each student's primary risk driver. After 6 weeks, 8 of 12 showed measurable improvement in risk scores. The 4 non-responders were escalated to Tier 3 with increased dosage (3x/week to 5x/week) within 2 weeks of the system flagging non-response. Our average time-to-response was 3.2 weeks. Documentation for every decision is available."

### What This Means for Charter Renewal

Authorizers evaluate:
1. Did the school identify at-risk students? (Risk engine: yes, automatically)
2. Did the school intervene? (Intervention tracking: yes, documented)
3. Was the intervention appropriate? (Dosage sufficiency: yes, severity-matched)
4. Was the intervention delivered with fidelity? (Fidelity tracking: yes, measured)
5. Did the school adjust when interventions weren't working? (Inference engine: yes, automatically flagged)
6. Can the school prove all of the above? (Audit trail: yes, every record is immutable and timestamped)

**This is the documentation that keeps charter schools open.**

The dosage analysis feature doesn't just help students. It produces the evidence trail that authorizers need to see when deciding whether to renew a charter. It transforms "we tried our best" into "here is exactly what we did, when we did it, how much we did it, and what happened as a result."

That is the difference between a school that loses its charter and a school that gets renewed.
