# EduNode Analytics — MTSS Risk Scoring Engine
## Technical Architecture & Specification

**Version:** 1.0  
**Date:** March 5, 2026  
**Author:** Mpingo Systems — CTO Office  
**Classification:** Internal Technical Specification

---

## Executive Summary

This document defines the complete technical architecture for EduNode's **Automated MTSS Risk Scoring Engine** — the single most important feature required to transform EduNode from a student data dashboard into a **proactive early warning and intervention platform**.

The architecture is designed to:

- Deploy initially at **independent charter schools** (single-tenant simplicity)
- Scale to **multi-school networks and districts** without re-architecture
- Support **configurable scoring models** per school or district
- Integrate with EduNode's existing Next.js / Supabase / TypeScript stack
- Remain **FERPA-compliant** at every layer

---

## 1. Architecture Overview

### 1.1 Design Principles

1. **Charter-first, district-ready.** Every schema includes `school_id` and `district_id` from day one. Single-school deployments simply ignore the district layer. When a network or district onboards, the data model is already partitioned.

2. **Configurable, not hardcoded.** Risk weights, thresholds, indicator sets, and tier boundaries are stored as configuration — not embedded in application logic. Each school can tune the model without code changes.

3. **Event-driven computation.** Risk scores recompute when new data arrives (sync events) AND on a nightly batch schedule. This provides both real-time responsiveness and consistency guarantees.

4. **Explainable scores.** Every risk score carries a `risk_factors` JSON array documenting exactly which indicators contributed and by how much. Educators must understand WHY a student is flagged — black-box scores destroy trust.

5. **Auditability.** Every score computation is logged with timestamp, input snapshot, and output. This satisfies FERPA evidence requirements and supports intervention documentation.

---

### 1.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                         │
│  PowerSchool │ Canvas │ Google Classroom │ MAP │ iReady │ PBIS  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATA INTEGRATION LAYER                          │
│            (Existing Adapter Registry + Sync Jobs)               │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ SIS      │ │ LMS      │ │ Assess.  │ │ Behavior │           │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │             │            │             │                  │
│       └─────────────┴────────────┴─────────────┘                 │
│                          │                                       │
│                    Sync Event Bus                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              STUDENT METRICS AGGREGATION LAYER                   │
│                                                                  │
│  Raw sync data → Normalized indicators per student               │
│  Writes to: student_metrics, student_metric_history              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                RISK COMPUTATION ENGINE                            │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │ Indicator    │  │ Composite    │  │ Trend          │         │
│  │ Normalizers  │  │ Score Calc   │  │ Detector       │         │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘         │
│         │                │                   │                   │
│         └────────────────┴───────────────────┘                   │
│                          │                                       │
│              ┌───────────┴───────────┐                           │
│              │   Score + Factors     │                           │
│              │   risk_evaluations    │                           │
│              └───────────┬───────────┘                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ALERT & TRIGGER ENGINE                            │
│                                                                  │
│  Threshold breach detection                                      │
│  Tier transition recommendations                                 │
│  Notification dispatch (staff, future: parent)                   │
│  Intervention auto-creation (optional)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              EARLY WARNING DASHBOARD + API                        │
│                                                                  │
│  /api/schools/[schoolId]/risk/scores                             │
│  /api/schools/[schoolId]/risk/alerts                             │
│  /api/schools/[schoolId]/risk/distribution                       │
│  /api/schools/[schoolId]/risk/drivers                            │
│  /[school_slug]/dashboard/early-warning                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

All tables use Supabase (Postgres). RLS policies follow the existing EduNode pattern with `SECURITY DEFINER` helper functions to avoid recursion.

### 2.1 Risk Configuration

```sql
-- ============================================================
-- RISK MODEL CONFIGURATION
-- Stores per-school scoring configuration
-- Districts can set defaults; schools can override
-- ============================================================

CREATE TABLE risk_model_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id),
  district_id     UUID REFERENCES districts(id),
  
  -- Model identity
  name            TEXT NOT NULL DEFAULT 'Default MTSS Model',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  
  -- Indicator weights (must sum to 1.0)
  weight_attendance       NUMERIC(4,3) NOT NULL DEFAULT 0.25,
  weight_academic         NUMERIC(4,3) NOT NULL DEFAULT 0.30,
  weight_assignments      NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  weight_behavior         NUMERIC(4,3) NOT NULL DEFAULT 0.15,
  weight_trend            NUMERIC(4,3) NOT NULL DEFAULT 0.10,
  
  -- Tier thresholds
  threshold_on_track      NUMERIC(4,3) NOT NULL DEFAULT 0.30,
  threshold_watch         NUMERIC(4,3) NOT NULL DEFAULT 0.60,
  threshold_at_risk       NUMERIC(4,3) NOT NULL DEFAULT 0.80,
  -- Above at_risk threshold = Critical
  
  -- Indicator-specific thresholds
  attendance_floor        NUMERIC(5,2) NOT NULL DEFAULT 90.0,
  attendance_critical     NUMERIC(5,2) NOT NULL DEFAULT 75.0,
  assignment_missing_warn NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  behavior_incident_cap   INTEGER NOT NULL DEFAULT 5,
  assessment_floor_pct    INTEGER NOT NULL DEFAULT 50,
  trend_lookback_weeks    INTEGER NOT NULL DEFAULT 4,
  trend_decline_threshold NUMERIC(4,3) NOT NULL DEFAULT -0.05,
  
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id),
  
  CONSTRAINT weights_sum CHECK (
    ABS(weight_attendance + weight_academic + weight_assignments 
        + weight_behavior + weight_trend - 1.0) < 0.01
  ),
  CONSTRAINT threshold_order CHECK (
    threshold_on_track < threshold_watch 
    AND threshold_watch < threshold_at_risk
  )
);

-- One active config per school
CREATE UNIQUE INDEX idx_risk_config_active 
  ON risk_model_configs(school_id) 
  WHERE is_active = true;
```

### 2.2 Student Metrics (Normalized Indicators)

```sql
-- ============================================================
-- STUDENT METRICS
-- Normalized, current-state indicators per student
-- Updated by sync jobs and metric aggregation pipeline
-- ============================================================

CREATE TABLE student_metrics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id         UUID NOT NULL REFERENCES schools(id),
  
  -- Attendance indicators
  attendance_rate           NUMERIC(5,2),  -- 0-100
  attendance_trend          NUMERIC(6,4),  -- slope over lookback period
  days_absent_last_30       INTEGER DEFAULT 0,
  chronic_absence_flag      BOOLEAN DEFAULT false,
  
  -- Academic indicators
  gpa_current               NUMERIC(4,3),  -- 0.000 - 4.000+
  gpa_trend                 NUMERIC(6,4),
  math_assessment_pct       INTEGER,        -- percentile 0-99
  reading_assessment_pct    INTEGER,        -- percentile 0-99
  assessment_trend          NUMERIC(6,4),
  
  -- Assignment indicators
  missing_assignment_rate   NUMERIC(4,3),  -- 0.000 - 1.000
  missing_assignments_count INTEGER DEFAULT 0,
  total_assignments_count   INTEGER DEFAULT 0,
  assignment_trend          NUMERIC(6,4),
  
  -- Behavior indicators
  behavior_incident_count   INTEGER DEFAULT 0,
  behavior_incident_trend   NUMERIC(6,4),
  suspensions_count         INTEGER DEFAULT 0,
  
  -- Data quality
  data_completeness         NUMERIC(4,3),  -- 0-1, how many indicators have data
  last_sis_sync             TIMESTAMPTZ,
  last_lms_sync             TIMESTAMPTZ,
  last_assessment_sync      TIMESTAMPTZ,
  
  -- Metadata
  computed_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_student_metrics UNIQUE (student_id, school_id)
);

CREATE INDEX idx_student_metrics_school ON student_metrics(school_id);
CREATE INDEX idx_student_metrics_student ON student_metrics(student_id);
```

### 2.3 Metric History (for Trend Detection)

```sql
-- ============================================================
-- STUDENT METRIC HISTORY
-- Weekly snapshots for trend computation
-- Partitioned by school for query performance at scale
-- ============================================================

CREATE TABLE student_metric_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id       UUID NOT NULL REFERENCES schools(id),
  
  snapshot_date   DATE NOT NULL,
  snapshot_week   INTEGER NOT NULL,  -- ISO week number
  snapshot_year   INTEGER NOT NULL,
  
  -- Snapshot values (same indicators as student_metrics)
  attendance_rate           NUMERIC(5,2),
  gpa_current               NUMERIC(4,3),
  math_assessment_pct       INTEGER,
  reading_assessment_pct    INTEGER,
  missing_assignment_rate   NUMERIC(4,3),
  behavior_incident_count   INTEGER,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_weekly_snapshot 
    UNIQUE (student_id, school_id, snapshot_year, snapshot_week)
);

CREATE INDEX idx_metric_history_lookup 
  ON student_metric_history(student_id, school_id, snapshot_date DESC);
```

### 2.4 Risk Evaluations (Computed Scores)

```sql
-- ============================================================
-- RISK EVALUATIONS
-- Every risk computation is stored as an immutable record
-- Supports audit trail, trend analysis, and FERPA evidence
-- ============================================================

CREATE TABLE risk_evaluations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id       UUID NOT NULL REFERENCES schools(id),
  config_id       UUID NOT NULL REFERENCES risk_model_configs(id),
  
  -- Computed output
  risk_score      NUMERIC(4,3) NOT NULL,  -- 0.000 - 1.000
  risk_level      TEXT NOT NULL CHECK (
    risk_level IN ('on_track', 'watch', 'at_risk', 'critical')
  ),
  previous_level  TEXT CHECK (
    previous_level IN ('on_track', 'watch', 'at_risk', 'critical')
  ),
  level_changed   BOOLEAN NOT NULL DEFAULT false,
  
  -- Explainability: what drove this score
  risk_factors    JSONB NOT NULL DEFAULT '[]',
  /*
    Example risk_factors:
    [
      {
        "indicator": "attendance",
        "raw_value": 78.5,
        "normalized": 0.383,
        "weight": 0.25,
        "weighted_contribution": 0.096,
        "description": "Attendance rate 78.5% is below 90% floor"
      },
      {
        "indicator": "academic",
        "raw_value": 35,
        "normalized": 0.300,
        "weight": 0.30,
        "weighted_contribution": 0.090,
        "description": "Math assessment at 35th percentile"
      }
    ]
  */
  
  -- Input snapshot (for audit reproducibility)
  metrics_snapshot JSONB NOT NULL,
  
  -- Computation metadata
  trigger_type    TEXT NOT NULL CHECK (
    trigger_type IN ('sync_event', 'batch_nightly', 'manual', 'config_change')
  ),
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_eval_student 
  ON risk_evaluations(student_id, school_id, computed_at DESC);
CREATE INDEX idx_risk_eval_school_level 
  ON risk_evaluations(school_id, risk_level, computed_at DESC);
CREATE INDEX idx_risk_eval_level_changed 
  ON risk_evaluations(school_id, level_changed, computed_at DESC)
  WHERE level_changed = true;

-- Current risk view (latest evaluation per student)
CREATE VIEW current_risk_scores AS
SELECT DISTINCT ON (student_id, school_id)
  id,
  student_id,
  school_id,
  risk_score,
  risk_level,
  previous_level,
  level_changed,
  risk_factors,
  computed_at
FROM risk_evaluations
ORDER BY student_id, school_id, computed_at DESC;
```

### 2.5 Risk Alerts

```sql
-- ============================================================
-- RISK ALERTS
-- Generated by the alert engine when conditions are met
-- Links to interventions and notifications
-- ============================================================

CREATE TABLE risk_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id   UUID NOT NULL REFERENCES risk_evaluations(id),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id       UUID NOT NULL REFERENCES schools(id),
  
  -- Alert details
  alert_type      TEXT NOT NULL CHECK (
    alert_type IN (
      'threshold_breach',     -- crossed into higher risk tier
      'rapid_decline',        -- significant score increase in short period
      'chronic_absence',      -- attendance pattern trigger
      'intervention_overdue', -- existing intervention needs review
      'new_risk_detected',    -- first time student flagged
      'trend_warning'         -- declining trend before threshold breach
    )
  ),
  severity        TEXT NOT NULL CHECK (
    severity IN ('info', 'warning', 'urgent', 'critical')
  ),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  
  -- Risk context
  risk_score      NUMERIC(4,3) NOT NULL,
  risk_level      TEXT NOT NULL,
  risk_factors    JSONB NOT NULL DEFAULT '[]',
  
  -- Workflow state
  status          TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'acknowledged', 'in_review', 'resolved', 'dismissed')
  ),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by     UUID REFERENCES auth.users(id),
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,
  
  -- Linked intervention (if one is created from this alert)
  intervention_id UUID REFERENCES interventions(id),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_alerts_school_status 
  ON risk_alerts(school_id, status, created_at DESC);
CREATE INDEX idx_risk_alerts_student 
  ON risk_alerts(student_id, school_id, created_at DESC);
```

---

## 3. Risk Computation Engine — TypeScript Implementation

### 3.1 Core Types

```typescript
// src/lib/risk-engine/types.ts

export interface RiskModelConfig {
  id: string;
  schoolId: string;
  districtId?: string;
  
  weights: {
    attendance: number;
    academic: number;
    assignments: number;
    behavior: number;
    trend: number;
  };
  
  thresholds: {
    onTrack: number;    // 0 - this = on track
    watch: number;      // onTrack - this = watch
    atRisk: number;     // watch - this = at risk, above = critical
  };
  
  indicators: {
    attendanceFloor: number;
    attendanceCritical: number;
    assignmentMissingWarn: number;
    behaviorIncidentCap: number;
    assessmentFloorPct: number;
    trendLookbackWeeks: number;
    trendDeclineThreshold: number;
  };
}

export interface StudentMetrics {
  studentId: string;
  schoolId: string;
  
  attendanceRate: number | null;
  attendanceTrend: number | null;
  daysAbsentLast30: number;
  chronicAbsenceFlag: boolean;
  
  gpaCurrent: number | null;
  gpaTrend: number | null;
  mathAssessmentPct: number | null;
  readingAssessmentPct: number | null;
  assessmentTrend: number | null;
  
  missingAssignmentRate: number | null;
  assignmentTrend: number | null;
  
  behaviorIncidentCount: number;
  behaviorIncidentTrend: number | null;
  
  dataCompleteness: number;
}

export interface RiskFactor {
  indicator: 'attendance' | 'academic' | 'assignments' | 'behavior' | 'trend';
  rawValue: number | null;
  normalized: number;
  weight: number;
  weightedContribution: number;
  description: string;
}

export type RiskLevel = 'on_track' | 'watch' | 'at_risk' | 'critical';

export interface RiskEvaluation {
  studentId: string;
  schoolId: string;
  configId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  riskFactors: RiskFactor[];
  metricsSnapshot: StudentMetrics;
  triggerType: 'sync_event' | 'batch_nightly' | 'manual' | 'config_change';
}
```

### 3.2 Indicator Normalizers

```typescript
// src/lib/risk-engine/normalizers.ts

import { RiskModelConfig, StudentMetrics, RiskFactor } from './types';

/**
 * Each normalizer converts a raw indicator into a 0-1 risk value.
 * 
 * 0 = no risk signal
 * 1 = maximum risk signal
 * 
 * All normalizers are pure functions with no side effects.
 * All handle null/missing data gracefully.
 */

export function normalizeAttendance(
  metrics: StudentMetrics,
  config: RiskModelConfig
): RiskFactor {
  const { attendanceRate } = metrics;
  const { attendanceFloor, attendanceCritical } = config.indicators;
  
  let normalized = 0;
  let description = '';
  
  if (attendanceRate === null) {
    normalized = 0;
    description = 'No attendance data available';
  } else if (attendanceRate >= attendanceFloor) {
    normalized = 0;
    description = `Attendance ${attendanceRate}% meets ${attendanceFloor}% floor`;
  } else {
    // Linear scale from floor to critical
    const range = attendanceFloor - attendanceCritical;
    normalized = Math.min(1, Math.max(0, (attendanceFloor - attendanceRate) / range));
    description = `Attendance ${attendanceRate}% is below ${attendanceFloor}% floor`;
    
    if (metrics.chronicAbsenceFlag) {
      description += ' (chronic absence detected)';
    }
  }
  
  return {
    indicator: 'attendance',
    rawValue: attendanceRate,
    normalized,
    weight: config.weights.attendance,
    weightedContribution: normalized * config.weights.attendance,
    description,
  };
}

export function normalizeAcademic(
  metrics: StudentMetrics,
  config: RiskModelConfig
): RiskFactor {
  const { mathAssessmentPct, readingAssessmentPct, gpaCurrent } = metrics;
  const { assessmentFloorPct } = config.indicators;
  
  // Use assessment percentiles as primary academic indicator
  // Fall back to GPA if no assessment data
  const scores: number[] = [];
  
  if (mathAssessmentPct !== null) scores.push(mathAssessmentPct);
  if (readingAssessmentPct !== null) scores.push(readingAssessmentPct);
  
  let normalized = 0;
  let rawValue: number | null = null;
  let description = '';
  
  if (scores.length > 0) {
    // Use lowest assessment score as the risk signal
    rawValue = Math.min(...scores);
    
    if (rawValue >= assessmentFloorPct) {
      normalized = 0;
      description = `Assessment scores at or above ${assessmentFloorPct}th percentile`;
    } else {
      normalized = Math.min(1, Math.max(0, (assessmentFloorPct - rawValue) / assessmentFloorPct));
      const subject = rawValue === mathAssessmentPct ? 'Math' : 'Reading';
      description = `${subject} assessment at ${rawValue}th percentile (below ${assessmentFloorPct}th)`;
    }
  } else if (gpaCurrent !== null) {
    // Fallback: GPA-based risk (below 2.0 = risk signal)
    rawValue = gpaCurrent;
    if (gpaCurrent >= 2.0) {
      normalized = 0;
      description = `GPA ${gpaCurrent.toFixed(2)} — no assessment data available`;
    } else {
      normalized = Math.min(1, Math.max(0, (2.0 - gpaCurrent) / 2.0));
      description = `GPA ${gpaCurrent.toFixed(2)} below 2.0 threshold — no assessment data`;
    }
  } else {
    normalized = 0;
    description = 'No academic performance data available';
  }
  
  return {
    indicator: 'academic',
    rawValue,
    normalized,
    weight: config.weights.academic,
    weightedContribution: normalized * config.weights.academic,
    description,
  };
}

export function normalizeAssignments(
  metrics: StudentMetrics,
  config: RiskModelConfig
): RiskFactor {
  const { missingAssignmentRate } = metrics;
  const { assignmentMissingWarn } = config.indicators;
  
  let normalized = 0;
  let description = '';
  
  if (missingAssignmentRate === null) {
    normalized = 0;
    description = 'No assignment data available';
  } else if (missingAssignmentRate <= assignmentMissingWarn * 0.5) {
    normalized = 0;
    description = `Missing assignment rate ${(missingAssignmentRate * 100).toFixed(1)}% is acceptable`;
  } else {
    // Scale from 0 at half-warning to 1 at 100% missing
    normalized = Math.min(1, Math.max(0, missingAssignmentRate));
    description = `Missing ${(missingAssignmentRate * 100).toFixed(1)}% of assignments`;
    
    if (missingAssignmentRate > 0.5) {
      description += ' — significant completion gap';
    }
  }
  
  return {
    indicator: 'assignments',
    rawValue: missingAssignmentRate,
    normalized,
    weight: config.weights.assignments,
    weightedContribution: normalized * config.weights.assignments,
    description,
  };
}

export function normalizeBehavior(
  metrics: StudentMetrics,
  config: RiskModelConfig
): RiskFactor {
  const { behaviorIncidentCount, suspensionsCount } = metrics;
  const { behaviorIncidentCap } = config.indicators;
  
  // Suspensions are weighted 2x regular incidents
  const effectiveCount = behaviorIncidentCount + (suspensionsCount * 2);
  const normalized = Math.min(1, effectiveCount / behaviorIncidentCap);
  
  let description = '';
  if (effectiveCount === 0) {
    description = 'No behavior incidents recorded';
  } else {
    description = `${behaviorIncidentCount} behavior incident(s)`;
    if (suspensionsCount > 0) {
      description += `, ${suspensionsCount} suspension(s)`;
    }
  }
  
  return {
    indicator: 'behavior',
    rawValue: effectiveCount,
    normalized,
    weight: config.weights.behavior,
    weightedContribution: normalized * config.weights.behavior,
    description,
  };
}

export function normalizeTrend(
  metrics: StudentMetrics,
  config: RiskModelConfig
): RiskFactor {
  const { trendDeclineThreshold } = config.indicators;
  
  // Aggregate trend signals across available indicators
  const trends: number[] = [];
  if (metrics.attendanceTrend !== null) trends.push(metrics.attendanceTrend);
  if (metrics.gpaTrend !== null) trends.push(metrics.gpaTrend);
  if (metrics.assessmentTrend !== null) trends.push(metrics.assessmentTrend);
  if (metrics.assignmentTrend !== null) trends.push(-metrics.assignmentTrend); // Invert: rising missing rate = negative
  if (metrics.behaviorIncidentTrend !== null) trends.push(-metrics.behaviorIncidentTrend); // Invert: rising incidents = negative
  
  let normalized = 0;
  let rawValue: number | null = null;
  let description = '';
  
  if (trends.length === 0) {
    description = 'Insufficient data for trend analysis';
  } else {
    // Average of all declining trends (only count negatives)
    const decliningTrends = trends.filter(t => t < trendDeclineThreshold);
    
    if (decliningTrends.length === 0) {
      rawValue = 0;
      description = 'No declining trends detected';
    } else {
      const avgDecline = decliningTrends.reduce((a, b) => a + b, 0) / decliningTrends.length;
      rawValue = avgDecline;
      
      // Normalize: threshold to 3x threshold maps to 0-1
      normalized = Math.min(1, Math.max(0, 
        Math.abs(avgDecline) / (Math.abs(trendDeclineThreshold) * 3)
      ));
      
      description = `Declining trends in ${decliningTrends.length} indicator(s)`;
    }
  }
  
  return {
    indicator: 'trend',
    rawValue,
    normalized,
    weight: config.weights.trend,
    weightedContribution: normalized * config.weights.trend,
    description,
  };
}
```

### 3.3 Composite Score Calculator

```typescript
// src/lib/risk-engine/calculator.ts

import { 
  RiskModelConfig, 
  StudentMetrics, 
  RiskEvaluation, 
  RiskFactor, 
  RiskLevel 
} from './types';
import {
  normalizeAttendance,
  normalizeAcademic,
  normalizeAssignments,
  normalizeBehavior,
  normalizeTrend,
} from './normalizers';

/**
 * Core risk score computation.
 * 
 * Pure function: same inputs always produce same outputs.
 * No database calls, no side effects.
 */
export function computeRiskScore(
  metrics: StudentMetrics,
  config: RiskModelConfig,
  previousLevel: RiskLevel | null,
  triggerType: RiskEvaluation['triggerType']
): RiskEvaluation {
  
  // Step 1: Normalize each indicator
  const factors: RiskFactor[] = [
    normalizeAttendance(metrics, config),
    normalizeAcademic(metrics, config),
    normalizeAssignments(metrics, config),
    normalizeBehavior(metrics, config),
    normalizeTrend(metrics, config),
  ];
  
  // Step 2: Compute composite score (weighted sum)
  const riskScore = Math.min(1, Math.max(0,
    factors.reduce((sum, f) => sum + f.weightedContribution, 0)
  ));
  
  // Step 3: Apply data completeness penalty
  // If we have very little data, we don't want to classify as "on track"
  // with false confidence. Instead, bump toward "watch" if completeness < 50%.
  const adjustedScore = applyCompletenessPenalty(riskScore, metrics.dataCompleteness);
  
  // Step 4: Classify risk level
  const riskLevel = classifyRiskLevel(adjustedScore, config);
  
  // Step 5: Detect level change
  const levelChanged = previousLevel !== null && previousLevel !== riskLevel;
  
  return {
    studentId: metrics.studentId,
    schoolId: metrics.schoolId,
    configId: config.id,
    riskScore: Math.round(adjustedScore * 1000) / 1000, // 3 decimal places
    riskLevel,
    previousLevel,
    levelChanged,
    riskFactors: factors.sort((a, b) => b.weightedContribution - a.weightedContribution),
    metricsSnapshot: metrics,
    triggerType,
  };
}

function classifyRiskLevel(score: number, config: RiskModelConfig): RiskLevel {
  if (score >= config.thresholds.atRisk) return 'critical';
  if (score >= config.thresholds.watch) return 'at_risk';
  if (score >= config.thresholds.onTrack) return 'watch';
  return 'on_track';
}

/**
 * If data completeness is below 50%, apply a floor to prevent
 * false "on track" classifications due to missing data.
 * 
 * This ensures a student with no data doesn't look safe.
 */
function applyCompletenessPenalty(score: number, completeness: number): number {
  if (completeness >= 0.5) return score;
  
  // Below 50% completeness: ensure score is at least 0.15
  // (nudges toward "watch" territory to prompt data collection)
  const minScore = 0.15 * (1 - completeness);
  return Math.max(score, minScore);
}
```

### 3.4 Trend Detection Module

```typescript
// src/lib/risk-engine/trend-detector.ts

import { supabaseAdmin } from '@/lib/supabase-admin';

interface TrendResult {
  slope: number;        // rate of change per week
  direction: 'improving' | 'stable' | 'declining';
  confidence: number;   // 0-1 based on data points available
  dataPoints: number;
}

/**
 * Computes linear regression slope over weekly metric snapshots.
 * Used to populate trend fields in student_metrics before risk computation.
 */
export async function computeMetricTrend(
  studentId: string,
  schoolId: string,
  metricField: string,
  lookbackWeeks: number = 4
): Promise<TrendResult> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (lookbackWeeks * 7));
  
  const { data: snapshots, error } = await supabaseAdmin
    .from('student_metric_history')
    .select(`snapshot_date, ${metricField}`)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .gte('snapshot_date', cutoffDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });
  
  if (error || !snapshots || snapshots.length < 2) {
    return {
      slope: 0,
      direction: 'stable',
      confidence: 0,
      dataPoints: snapshots?.length ?? 0,
    };
  }
  
  // Filter out null values
  const points = snapshots
    .filter(s => s[metricField] !== null)
    .map((s, i) => ({ x: i, y: Number(s[metricField]) }));
  
  if (points.length < 2) {
    return { slope: 0, direction: 'stable', confidence: 0, dataPoints: points.length };
  }
  
  // Simple linear regression
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 
    ? (n * sumXY - sumX * sumY) / denominator 
    : 0;
  
  // Confidence based on data points (4+ weeks = full confidence)
  const confidence = Math.min(1, points.length / lookbackWeeks);
  
  // Normalize slope relative to mean value
  const meanY = sumY / n;
  const normalizedSlope = meanY !== 0 ? slope / Math.abs(meanY) : slope;
  
  let direction: TrendResult['direction'] = 'stable';
  if (normalizedSlope < -0.02) direction = 'declining';
  if (normalizedSlope > 0.02) direction = 'improving';
  
  return {
    slope: normalizedSlope,
    direction,
    confidence,
    dataPoints: points.length,
  };
}
```

### 3.5 Batch Orchestrator

```typescript
// src/lib/risk-engine/orchestrator.ts

import { supabaseAdmin } from '@/lib/supabase-admin';
import { computeRiskScore } from './calculator';
import { computeMetricTrend } from './trend-detector';
import { RiskModelConfig, StudentMetrics, RiskEvaluation, RiskLevel } from './types';
import { generateAlerts } from './alert-engine';

interface BatchResult {
  schoolId: string;
  studentsProcessed: number;
  levelChanges: number;
  alertsGenerated: number;
  duration: number;
  errors: string[];
}

/**
 * Runs risk evaluation for all students in a school.
 * 
 * Called by:
 * - Nightly cron job (batch_nightly)
 * - Post-sync webhook (sync_event)
 * - Admin trigger (manual)
 * - Config change (config_change)
 */
export async function evaluateSchoolRisk(
  schoolId: string,
  triggerType: RiskEvaluation['triggerType']
): Promise<BatchResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  // 1. Load active risk config
  const config = await loadActiveConfig(schoolId);
  if (!config) {
    return {
      schoolId,
      studentsProcessed: 0,
      levelChanges: 0,
      alertsGenerated: 0,
      duration: Date.now() - startTime,
      errors: ['No active risk model configuration found'],
    };
  }
  
  // 2. Load all student metrics for this school
  const { data: metricsRows, error: metricsError } = await supabaseAdmin
    .from('student_metrics')
    .select('*')
    .eq('school_id', schoolId);
  
  if (metricsError || !metricsRows) {
    return {
      schoolId,
      studentsProcessed: 0,
      levelChanges: 0,
      alertsGenerated: 0,
      duration: Date.now() - startTime,
      errors: [`Failed to load metrics: ${metricsError?.message}`],
    };
  }
  
  // 3. Load previous risk levels for comparison
  const previousLevels = await loadPreviousLevels(schoolId);
  
  // 4. Compute risk for each student
  const evaluations: RiskEvaluation[] = [];
  
  for (const row of metricsRows) {
    try {
      const metrics = mapRowToMetrics(row);
      const previousLevel = previousLevels.get(metrics.studentId) ?? null;
      
      const evaluation = computeRiskScore(
        metrics,
        config,
        previousLevel,
        triggerType
      );
      
      evaluations.push(evaluation);
    } catch (err) {
      errors.push(`Student ${row.student_id}: ${(err as Error).message}`);
    }
  }
  
  // 5. Persist evaluations
  await persistEvaluations(evaluations);
  
  // 6. Generate alerts for level changes and threshold breaches
  const alerts = await generateAlerts(evaluations, config);
  
  // 7. Log batch run
  const levelChanges = evaluations.filter(e => e.levelChanged).length;
  
  return {
    schoolId,
    studentsProcessed: evaluations.length,
    levelChanges,
    alertsGenerated: alerts.length,
    duration: Date.now() - startTime,
    errors,
  };
}

async function loadActiveConfig(schoolId: string): Promise<RiskModelConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('risk_model_configs')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    schoolId: data.school_id,
    districtId: data.district_id,
    weights: {
      attendance: Number(data.weight_attendance),
      academic: Number(data.weight_academic),
      assignments: Number(data.weight_assignments),
      behavior: Number(data.weight_behavior),
      trend: Number(data.weight_trend),
    },
    thresholds: {
      onTrack: Number(data.threshold_on_track),
      watch: Number(data.threshold_watch),
      atRisk: Number(data.threshold_at_risk),
    },
    indicators: {
      attendanceFloor: Number(data.attendance_floor),
      attendanceCritical: Number(data.attendance_critical),
      assignmentMissingWarn: Number(data.assignment_missing_warn),
      behaviorIncidentCap: Number(data.behavior_incident_cap),
      assessmentFloorPct: Number(data.assessment_floor_pct),
      trendLookbackWeeks: Number(data.trend_lookback_weeks),
      trendDeclineThreshold: Number(data.trend_decline_threshold),
    },
  };
}

async function loadPreviousLevels(schoolId: string): Promise<Map<string, RiskLevel>> {
  const { data } = await supabaseAdmin
    .from('current_risk_scores')
    .select('student_id, risk_level')
    .eq('school_id', schoolId);
  
  const map = new Map<string, RiskLevel>();
  data?.forEach(row => map.set(row.student_id, row.risk_level as RiskLevel));
  return map;
}

async function persistEvaluations(evaluations: RiskEvaluation[]): Promise<void> {
  // Batch insert in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < evaluations.length; i += chunkSize) {
    const chunk = evaluations.slice(i, i + chunkSize);
    
    const rows = chunk.map(e => ({
      student_id: e.studentId,
      school_id: e.schoolId,
      config_id: e.configId,
      risk_score: e.riskScore,
      risk_level: e.riskLevel,
      previous_level: e.previousLevel,
      level_changed: e.levelChanged,
      risk_factors: e.riskFactors,
      metrics_snapshot: e.metricsSnapshot,
      trigger_type: e.triggerType,
    }));
    
    await supabaseAdmin.from('risk_evaluations').insert(rows);
  }
}

function mapRowToMetrics(row: Record<string, unknown>): StudentMetrics {
  return {
    studentId: row.student_id as string,
    schoolId: row.school_id as string,
    attendanceRate: row.attendance_rate as number | null,
    attendanceTrend: row.attendance_trend as number | null,
    daysAbsentLast30: (row.days_absent_last_30 as number) ?? 0,
    chronicAbsenceFlag: (row.chronic_absence_flag as boolean) ?? false,
    gpaCurrent: row.gpa_current as number | null,
    gpaTrend: row.gpa_trend as number | null,
    mathAssessmentPct: row.math_assessment_pct as number | null,
    readingAssessmentPct: row.reading_assessment_pct as number | null,
    assessmentTrend: row.assessment_trend as number | null,
    missingAssignmentRate: row.missing_assignment_rate as number | null,
    assignmentTrend: row.assignment_trend as number | null,
    behaviorIncidentCount: (row.behavior_incident_count as number) ?? 0,
    behaviorIncidentTrend: row.behavior_incident_trend as number | null,
    dataCompleteness: (row.data_completeness as number) ?? 0,
  };
}
```

---

## 4. API Routes

### 4.1 Route Map

```
/api/schools/[schoolId]/risk/
  ├── config          GET, PUT    — Risk model configuration
  ├── evaluate        POST        — Trigger risk evaluation
  ├── scores          GET         — Current risk scores (paginated)
  ├── scores/[studentId]  GET     — Single student risk detail
  ├── distribution    GET         — Risk level distribution
  ├── drivers         GET         — Aggregated risk drivers
  ├── alerts          GET, PATCH  — Alert management
  ├── alerts/[alertId] PATCH      — Acknowledge/resolve alert
  └── history/[studentId]  GET    — Risk score history for student
```

### 4.2 Key Endpoint Specifications

**GET /api/schools/[schoolId]/risk/scores**

Query parameters:
- `level` — filter by risk level (`on_track`, `watch`, `at_risk`, `critical`)
- `sort` — `risk_score_desc` (default), `risk_score_asc`, `level_changed`, `name`
- `page`, `limit` — pagination
- `grade` — filter by grade level
- `search` — student name search

Response:
```json
{
  "students": [
    {
      "studentId": "uuid",
      "studentName": "Maria Lopez",
      "grade": 7,
      "riskScore": 0.82,
      "riskLevel": "critical",
      "previousLevel": "at_risk",
      "levelChanged": true,
      "topFactors": [
        { "indicator": "attendance", "description": "Attendance 78.5% below 90% floor" },
        { "indicator": "academic", "description": "Math at 35th percentile" }
      ],
      "activeIntervention": { "id": "uuid", "tier": 2, "type": "academic" },
      "computedAt": "2026-03-05T14:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 142 },
  "summary": {
    "onTrack": 420,
    "watch": 85,
    "atRisk": 40,
    "critical": 12,
    "levelChangesToday": 7
  }
}
```

**GET /api/schools/[schoolId]/risk/distribution**

Response:
```json
{
  "current": {
    "on_track": { "count": 420, "percentage": 75.4 },
    "watch": { "count": 85, "percentage": 15.3 },
    "at_risk": { "count": 40, "percentage": 7.2 },
    "critical": { "count": 12, "percentage": 2.2 }
  },
  "trend": [
    { "week": "2026-W08", "on_track": 425, "watch": 82, "at_risk": 38, "critical": 12 },
    { "week": "2026-W09", "on_track": 422, "watch": 83, "at_risk": 39, "critical": 13 },
    { "week": "2026-W10", "on_track": 420, "watch": 85, "at_risk": 40, "critical": 12 }
  ],
  "byGrade": {
    "6": { "on_track": 140, "watch": 25, "at_risk": 10, "critical": 3 },
    "7": { "on_track": 138, "watch": 30, "at_risk": 15, "critical": 5 },
    "8": { "on_track": 142, "watch": 30, "at_risk": 15, "critical": 4 }
  }
}
```

**GET /api/schools/[schoolId]/risk/drivers**

Response:
```json
{
  "drivers": [
    { "indicator": "attendance", "studentsAffected": 32, "avgContribution": 0.18 },
    { "indicator": "assignments", "studentsAffected": 26, "avgContribution": 0.14 },
    { "indicator": "academic", "studentsAffected": 18, "avgContribution": 0.22 },
    { "indicator": "behavior", "studentsAffected": 11, "avgContribution": 0.09 },
    { "indicator": "trend", "studentsAffected": 45, "avgContribution": 0.06 }
  ],
  "systemicFlags": [
    {
      "type": "grade_concentration",
      "description": "Grade 7 has 2.3x higher at-risk rate than school average",
      "affectedStudents": 20
    }
  ]
}
```

---

## 5. Scaling Strategy: Charter → Network → District

### 5.1 Data Isolation Model

```
Level 1: Single Charter School
  └── school_id is the only partition key
  └── One risk_model_config
  └── All queries filter by school_id
  └── RLS enforces school-level access

Level 2: Charter Network (3-15 schools)
  └── district_id groups schools
  └── Network admin can view cross-school dashboards
  └── Each school retains its own risk config (can inherit network defaults)
  └── New API routes: /api/networks/[networkId]/risk/aggregate

Level 3: District (50+ schools)
  └── Same model, larger scale
  └── District-level config templates
  └── School-level overrides
  └── Additional: batch job parallelization, read replicas, metric caching
```

### 5.2 What Changes at Each Level

| Component | Charter (L1) | Network (L2) | District (L3) |
|-----------|-------------|--------------|----------------|
| Schema | No changes needed | Add `districts` table, FK on schools | Same |
| Risk Config | One per school | Network defaults + school overrides | District templates + school overrides |
| Batch Eval | Sequential per school | Parallel across schools | Worker queue with concurrency control |
| Dashboard | Single school view | Cross-school comparison view | District-wide analytics layer |
| Auth/RBAC | School admin, teacher | + Network admin role | + District admin, superintendent roles |
| Caching | Not required | Redis for cross-school aggregations | Redis + materialized views |
| Data Volume | ~500 students | ~2,000-7,500 students | 10,000+ students |
| DB Strategy | Single Supabase instance | Same, with read replica | Connection pooling, partitioned tables |

### 5.3 What You Build Now (and What You Don't)

**Build now for charter launch:**
- `school_id` on every table (already done)
- `district_id` as nullable FK on `risk_model_configs` and `schools`
- Single-school dashboard views
- Batch evaluation per school
- Alert system with email notifications

**Build later for network expansion:**
- Network admin role and cross-school views
- Config inheritance (network → school)
- Parallel batch processing
- Aggregate dashboards

**Build later for district:**
- Worker queue architecture (BullMQ or similar)
- Read replicas
- Materialized views for distribution stats
- SSO/SAML integration (partially built already)
- Data warehouse exports (BigQuery adapter exists)

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create database migration: `risk_model_configs`, `student_metrics`, `student_metric_history`
- [ ] Create database migration: `risk_evaluations`, `risk_alerts`
- [ ] Create `current_risk_scores` view
- [ ] RLS policies for all new tables
- [ ] Seed default risk model config
- [ ] TypeScript types and Supabase-generated types update

### Phase 2: Engine Core (Weeks 2-3)
- [ ] Implement all 5 normalizer functions with unit tests
- [ ] Implement `computeRiskScore` calculator with unit tests
- [ ] Implement `computeMetricTrend` with unit tests
- [ ] Implement batch orchestrator
- [ ] Implement alert generation logic

### Phase 3: Metrics Aggregation (Week 3-4)
- [ ] Student metrics aggregator (computes `student_metrics` from raw sync data)
- [ ] Weekly snapshot job for `student_metric_history`
- [ ] Data completeness calculator
- [ ] Wire sync event → metrics update → risk evaluation pipeline

### Phase 4: API Layer (Week 4)
- [ ] Risk scores endpoint (paginated, filterable)
- [ ] Risk distribution endpoint
- [ ] Risk drivers endpoint
- [ ] Risk config CRUD endpoints
- [ ] Alert management endpoints
- [ ] Student risk history endpoint

### Phase 5: Dashboard UI (Weeks 5-6)
- [ ] Early Warning Dashboard page (`/[school_slug]/dashboard/early-warning`)
- [ ] Risk distribution visualization (donut + trend chart)
- [ ] At-risk student table with sort/filter
- [ ] Risk driver breakdown panel
- [ ] Student risk detail view (integrated into existing student-360)
- [ ] Alert feed component
- [ ] Risk config admin UI (`/[school_slug]/settings/risk-model`)

### Phase 6: Automation & Polish (Week 6-7)
- [ ] Nightly cron job for batch evaluation
- [ ] Post-sync hook to trigger incremental evaluation
- [ ] Email notification system for alerts
- [ ] Intervention auto-suggestion from alerts
- [ ] Seed data generator for demo environments

---

## 7. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Score storage | Immutable evaluation records | Audit trail, FERPA evidence, trend analysis |
| Trend method | Linear regression over weekly snapshots | Simple, interpretable, sufficient for 4-8 week windows |
| Missing data | Completeness penalty, not zero-fill | Prevents false "on track" when data is absent |
| Config scope | Per-school with district defaults | Charters need autonomy; districts need consistency |
| Alert persistence | Database table, not ephemeral | Alerts must be tracked through resolution for compliance |
| Score precision | 3 decimal places | Sufficient for differentiation without false precision |
| Batch strategy | Sequential per school, parallel across schools | Simple for charter launch, scales with worker queues later |
| Risk factors | Sorted by weighted contribution | Highest-impact factor first aids educator decision-making |

---

## Appendix A: Example Risk Evaluation

**Student:** Maria Lopez, Grade 7  
**Config:** Default MTSS Model (Union Day School)

| Indicator | Raw Value | Normalized | Weight | Contribution |
|-----------|-----------|------------|--------|-------------|
| Attendance | 78.5% | 0.383 | 0.25 | 0.096 |
| Academic | 35th pct (Math) | 0.300 | 0.30 | 0.090 |
| Assignments | 32% missing | 0.320 | 0.20 | 0.064 |
| Behavior | 2 incidents | 0.400 | 0.15 | 0.060 |
| Trend | -0.08 slope | 0.533 | 0.10 | 0.053 |

**Composite Score:** 0.363  
**Classification:** Watch (0.30 – 0.60)  
**Top Factor:** Attendance — 78.5% below 90% floor  
**Trend Signal:** Declining across 2 indicators  

---

## Appendix B: RLS Policy Template

```sql
-- Risk evaluations: school-scoped access
CREATE POLICY "school_risk_evaluations_select" ON risk_evaluations
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM get_user_school_access(auth.uid())
    )
  );

-- Risk config: school admin only
CREATE POLICY "school_risk_config_update" ON risk_model_configs
  FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM get_user_admin_access(auth.uid())
    )
  );
```

---

*End of specification.*
