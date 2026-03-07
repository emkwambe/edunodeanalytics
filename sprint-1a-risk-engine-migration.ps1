#=======================================================================
# sprint-1a-risk-engine-migration.ps1
# EduNode Analytics - Sprint 1A: Risk Engine Database Foundation
# Mpingo Systems CTO Office
#
# What this script does:
#   1. Creates the migration SQL file
#   2. Creates a Node.js script to execute it against Supabase
#   3. Runs the migration
#   4. Verifies all tables were created
#   5. Seeds default risk config for existing schools
#
# Usage:
#   cd C:\Users\HP\Documents\edunodeanalytics
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\sprint-1a-risk-engine-migration.ps1
#=======================================================================

$ErrorActionPreference = "Stop"
$projectRoot = Get-Location

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SPRINT 1A: RISK ENGINE DATABASE MIGRATION" -ForegroundColor Cyan
Write-Host "  EduNode Analytics - Mpingo Systems" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Validate prerequisites ----
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] Not in project root." -ForegroundColor Red
    exit 1
}

$envPath = Join-Path $projectRoot ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERROR] .env.local not found." -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content $envPath | Where-Object { $_ -match "^[A-Z_]+=.+" -and $_ -notmatch "^#" } | ForEach-Object {
    $parts = $_ -split "=", 2
    $envVars[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
}

$supabaseUrl = $envVars["NEXT_PUBLIC_SUPABASE_URL"]
$serviceKey = $envVars["SUPABASE_SERVICE_ROLE_KEY"]

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host "[ERROR] Missing SUPABASE_URL or SERVICE_ROLE_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Prerequisites verified" -ForegroundColor Green
Write-Host "  Supabase: $supabaseUrl" -ForegroundColor Gray

# ================================================================
# STEP 1: Create Migration SQL
# ================================================================
Write-Host ""
Write-Host "--- STEP 1: Creating migration SQL ---" -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationDir = Join-Path $projectRoot "supabase/migrations"
New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null

$migrationFile = Join-Path $migrationDir "${timestamp}_risk_engine_tables.sql"

$migrationSQL = @'
-- ============================================================
-- MIGRATION: Risk Engine Foundation Tables
-- EduNode Analytics - Sprint 1A
-- 
-- Creates:
--   1. risk_model_configs  (per-school scoring configuration)
--   2. student_metrics     (normalized current indicators)
--   3. student_metric_history (weekly snapshots for trends)
--   4. risk_evaluations    (immutable score audit trail)
--   5. risk_alerts         (alert lifecycle management)
--   6. current_risk_scores (view: latest eval per student)
--   7. RLS policies for all tables
--   8. Indexes for query performance
--
-- Integrates with existing tables:
--   - schools (id, slug)
--   - students (id, school_id, risk_score, risk_level)
--   - interventions (id)
--   - school_memberships (user_id, school_id, role)
--   - public.risk_level enum (on_track, at_risk, critical)
-- ============================================================

-- ============================================================
-- 0. PREREQUISITES: Add 'watch' to risk_level enum if missing
-- The existing enum has: on_track, at_risk, critical
-- The spec adds 'watch' between on_track and at_risk
-- ============================================================

DO $$
BEGIN
  -- Check if 'watch' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'watch' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'risk_level')
  ) THEN
    -- Add 'watch' after 'on_track' 
    ALTER TYPE public.risk_level ADD VALUE IF NOT EXISTS 'watch' AFTER 'on_track';
  END IF;
END
$$;


-- ============================================================
-- 1. RISK MODEL CONFIGURATION
-- Stores per-school scoring weights, thresholds, and params.
-- Replaces in-memory constructor args in RiskDetectionEngine.
-- Districts can set defaults; schools can override.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.risk_model_configs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id               UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Model identity
  name                    TEXT NOT NULL DEFAULT 'Default MTSS Model',
  is_active               BOOLEAN NOT NULL DEFAULT true,
  
  -- Indicator weights (must sum to ~1.0)
  -- Aligned with existing RiskWeights interface in detection-engine.ts
  weight_attendance       NUMERIC(4,3) NOT NULL DEFAULT 0.250,
  weight_academic         NUMERIC(4,3) NOT NULL DEFAULT 0.300,
  weight_assignments      NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  weight_behavior         NUMERIC(4,3) NOT NULL DEFAULT 0.150,
  weight_trend            NUMERIC(4,3) NOT NULL DEFAULT 0.100,
  
  -- Tier thresholds (score boundaries)
  -- Existing engine: critical >= 0.7, at_risk >= 0.4
  -- New: on_track < 0.30, watch 0.30-0.60, at_risk 0.60-0.80, critical >= 0.80
  threshold_on_track      NUMERIC(4,3) NOT NULL DEFAULT 0.300,
  threshold_watch         NUMERIC(4,3) NOT NULL DEFAULT 0.600,
  threshold_at_risk       NUMERIC(4,3) NOT NULL DEFAULT 0.800,
  
  -- Indicator-specific parameters
  attendance_floor        NUMERIC(5,2) NOT NULL DEFAULT 90.00,
  attendance_critical     NUMERIC(5,2) NOT NULL DEFAULT 75.00,
  assignment_missing_warn NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  behavior_incident_cap   INTEGER NOT NULL DEFAULT 5,
  assessment_floor_pct    INTEGER NOT NULL DEFAULT 50,
  trend_lookback_weeks    INTEGER NOT NULL DEFAULT 4,
  trend_decline_threshold NUMERIC(4,3) NOT NULL DEFAULT -0.050,
  
  -- Metadata
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID REFERENCES public.users(id),
  
  -- Constraints
  CONSTRAINT risk_config_weights_sum CHECK (
    ABS(weight_attendance + weight_academic + weight_assignments 
        + weight_behavior + weight_trend - 1.0) < 0.01
  ),
  CONSTRAINT risk_config_threshold_order CHECK (
    threshold_on_track < threshold_watch 
    AND threshold_watch < threshold_at_risk
    AND threshold_at_risk <= 1.0
  )
);

-- Only one active config per school
CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_config_active_school 
  ON public.risk_model_configs(school_id) 
  WHERE is_active = true;

COMMENT ON TABLE public.risk_model_configs IS 
  'Per-school risk scoring configuration. Weights, thresholds, and indicator params.';


-- ============================================================
-- 2. STUDENT METRICS
-- Normalized, current-state indicators per student.
-- Aggregated from sync data. Fed into the risk engine.
-- Replaces raw reads from students table in detection-engine.ts.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_metrics (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id                  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id                   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Attendance indicators
  attendance_rate             NUMERIC(5,2),    -- 0.00-100.00
  attendance_trend            NUMERIC(6,4),    -- slope over lookback
  days_absent_last_30         INTEGER DEFAULT 0,
  chronic_absence_flag        BOOLEAN DEFAULT false,
  
  -- Academic indicators
  gpa_current                 NUMERIC(4,3),    -- 0.000-4.000+
  gpa_trend                   NUMERIC(6,4),
  math_assessment_pct         INTEGER,          -- percentile 0-99
  reading_assessment_pct      INTEGER,          -- percentile 0-99
  assessment_trend            NUMERIC(6,4),
  proficiency_level           NUMERIC(3,1),    -- mirrors students.proficiency_level
  growth_percentile           INTEGER,          -- mirrors students.growth_percentile
  
  -- Assignment indicators
  missing_assignment_rate     NUMERIC(4,3),    -- 0.000-1.000
  missing_assignments_count   INTEGER DEFAULT 0,
  total_assignments_count     INTEGER DEFAULT 0,
  assignment_trend            NUMERIC(6,4),
  
  -- Behavior indicators
  behavior_incident_count     INTEGER DEFAULT 0,
  behavior_incident_trend     NUMERIC(6,4),
  suspensions_count           INTEGER DEFAULT 0,
  
  -- Engagement (from purpose_driven_metrics on students table)
  engagement_score            NUMERIC(4,3),    -- 0.000-1.000
  
  -- Data quality
  data_completeness           NUMERIC(4,3),    -- 0.000-1.000
  last_sis_sync               TIMESTAMPTZ,
  last_lms_sync               TIMESTAMPTZ,
  last_assessment_sync        TIMESTAMPTZ,
  
  -- Metadata
  computed_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_student_metrics UNIQUE (student_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_student_metrics_school 
  ON public.student_metrics(school_id);
CREATE INDEX IF NOT EXISTS idx_student_metrics_student 
  ON public.student_metrics(student_id);

COMMENT ON TABLE public.student_metrics IS 
  'Normalized current-state indicators per student. Updated by sync pipeline.';


-- ============================================================
-- 3. STUDENT METRIC HISTORY
-- Weekly snapshots for trend computation.
-- Enables linear regression in trend-detector.ts.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_metric_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  
  snapshot_date     DATE NOT NULL,
  snapshot_week     INTEGER NOT NULL,    -- ISO week number
  snapshot_year     INTEGER NOT NULL,
  
  -- Snapshot values
  attendance_rate             NUMERIC(5,2),
  gpa_current                 NUMERIC(4,3),
  math_assessment_pct         INTEGER,
  reading_assessment_pct      INTEGER,
  missing_assignment_rate     NUMERIC(4,3),
  behavior_incident_count     INTEGER,
  proficiency_level           NUMERIC(3,1),
  growth_percentile           INTEGER,
  engagement_score            NUMERIC(4,3),
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_weekly_snapshot 
    UNIQUE (student_id, school_id, snapshot_year, snapshot_week)
);

CREATE INDEX IF NOT EXISTS idx_metric_history_lookup 
  ON public.student_metric_history(student_id, school_id, snapshot_date DESC);

COMMENT ON TABLE public.student_metric_history IS 
  'Weekly metric snapshots for trend detection via linear regression.';


-- ============================================================
-- 4. RISK EVALUATIONS
-- Immutable record of every risk computation.
-- Replaces the missing risk_assessments table that
-- detection-engine.ts already references.
-- Provides FERPA-compliant audit trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.risk_evaluations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  config_id         UUID NOT NULL REFERENCES public.risk_model_configs(id),
  
  -- Computed output
  risk_score        NUMERIC(4,3) NOT NULL,    -- 0.000-1.000
  risk_level        public.risk_level NOT NULL,
  previous_level    public.risk_level,
  level_changed     BOOLEAN NOT NULL DEFAULT false,
  
  -- Explainability (what drove this score)
  risk_factors      JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structure matches existing RiskFactor interface:
  -- [{
  --   name, category, rawValue, normalizedScore, 
  --   weight, weightedScore, description, trend
  -- }]
  
  -- Trajectory and confidence (from existing engine)
  trajectory        TEXT CHECK (trajectory IN ('improving', 'stable', 'declining')),
  confidence_level  NUMERIC(4,3),
  
  -- Recommended actions (from existing engine)
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Full input snapshot for audit reproducibility
  metrics_snapshot  JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Computation metadata
  trigger_type      TEXT NOT NULL DEFAULT 'batch_nightly' CHECK (
    trigger_type IN ('sync_event', 'batch_nightly', 'manual', 'config_change')
  ),
  
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_eval_student_latest 
  ON public.risk_evaluations(student_id, school_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_eval_school_level 
  ON public.risk_evaluations(school_id, risk_level, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_eval_level_changed 
  ON public.risk_evaluations(school_id, level_changed, computed_at DESC)
  WHERE level_changed = true;
CREATE INDEX IF NOT EXISTS idx_risk_eval_computed 
  ON public.risk_evaluations(school_id, computed_at DESC);

COMMENT ON TABLE public.risk_evaluations IS 
  'Immutable audit trail of every risk score computation. FERPA evidence.';


-- ============================================================
-- 5. RISK ALERTS
-- Replaces the missing early_warning_alerts table that
-- early-warning.ts already references.
-- Full lifecycle: new -> acknowledged -> resolved/dismissed.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.risk_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id     UUID REFERENCES public.risk_evaluations(id),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Alert details (aligned with existing AlertRule interface)
  rule_id           TEXT,                      -- matches AlertRule.id
  alert_type        TEXT NOT NULL CHECK (
    alert_type IN (
      'threshold_breach',
      'rapid_decline',
      'chronic_absence',
      'intervention_overdue',
      'new_risk_detected',
      'trend_warning',
      'attendance_drop',
      'grade_decline',
      'consecutive_absences'
    )
  ),
  severity          TEXT NOT NULL CHECK (
    severity IN ('info', 'warning', 'urgent', 'critical')
  ),
  title             TEXT NOT NULL,
  message           TEXT NOT NULL,
  
  -- Risk context
  risk_score        NUMERIC(4,3),
  risk_level        public.risk_level,
  data              JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Workflow state (aligned with existing Alert interface)
  status            TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'acknowledged', 'in_review', 'resolved', 'dismissed')
  ),
  acknowledged_by   UUID REFERENCES public.users(id),
  acknowledged_at   TIMESTAMPTZ,
  resolved_by       UUID REFERENCES public.users(id),
  resolved_at       TIMESTAMPTZ,
  resolution_notes  TEXT,
  
  -- Link to intervention (if created from this alert)
  intervention_id   UUID REFERENCES public.interventions(id),
  
  -- Deduplication support (existing cooldown logic)
  cooldown_key      TEXT,    -- rule_id:student_id for dedup
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_alerts_school_status 
  ON public.risk_alerts(school_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_student 
  ON public.risk_alerts(student_id, school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_cooldown 
  ON public.risk_alerts(cooldown_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_unresolved 
  ON public.risk_alerts(school_id, created_at DESC)
  WHERE resolved_at IS NULL;

COMMENT ON TABLE public.risk_alerts IS 
  'Early warning alerts with full lifecycle tracking. Replaces early_warning_alerts.';


-- ============================================================
-- 6. CURRENT RISK SCORES VIEW
-- Latest evaluation per student for dashboard queries.
-- ============================================================

CREATE OR REPLACE VIEW public.current_risk_scores AS
SELECT DISTINCT ON (re.student_id, re.school_id)
  re.id AS evaluation_id,
  re.student_id,
  re.school_id,
  re.risk_score,
  re.risk_level,
  re.previous_level,
  re.level_changed,
  re.risk_factors,
  re.trajectory,
  re.confidence_level,
  re.recommended_actions,
  re.computed_at,
  s.display_name AS student_name,
  s.grade_level,
  s.first_name,
  s.last_name,
  s.is_chronically_absent,
  s.has_iep,
  s.has_504_plan
FROM public.risk_evaluations re
JOIN public.students s ON s.id = re.student_id AND s.is_active = true
ORDER BY re.student_id, re.school_id, re.computed_at DESC;

COMMENT ON VIEW public.current_risk_scores IS 
  'Latest risk evaluation per active student. Primary dashboard query source.';


-- ============================================================
-- 7. HELPER FUNCTION: Get user school access
-- Used by RLS policies. Uses SECURITY DEFINER to avoid
-- infinite recursion (same pattern as existing EduCore ISMS).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_school_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT school_id 
  FROM public.school_memberships 
  WHERE user_id = user_uuid 
    AND is_active = true;
$$;

COMMENT ON FUNCTION public.get_user_school_ids IS 
  'SECURITY DEFINER helper for RLS. Returns school IDs for a user.';


-- ============================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- Pattern: school-scoped access via school_memberships.
-- Uses SECURITY DEFINER function to avoid RLS recursion.
-- ============================================================

-- risk_model_configs
ALTER TABLE public.risk_model_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_config_select" ON public.risk_model_configs
  FOR SELECT USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

CREATE POLICY "risk_config_insert" ON public.risk_model_configs
  FOR INSERT WITH CHECK (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

CREATE POLICY "risk_config_update" ON public.risk_model_configs
  FOR UPDATE USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

-- Service role bypass for batch operations
CREATE POLICY "risk_config_service" ON public.risk_model_configs
  FOR ALL USING (auth.role() = 'service_role');


-- student_metrics
ALTER TABLE public.student_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_metrics_select" ON public.student_metrics
  FOR SELECT USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

CREATE POLICY "student_metrics_service" ON public.student_metrics
  FOR ALL USING (auth.role() = 'service_role');


-- student_metric_history
ALTER TABLE public.student_metric_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metric_history_select" ON public.student_metric_history
  FOR SELECT USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

CREATE POLICY "metric_history_service" ON public.student_metric_history
  FOR ALL USING (auth.role() = 'service_role');


-- risk_evaluations
ALTER TABLE public.risk_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_eval_select" ON public.risk_evaluations
  FOR SELECT USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

CREATE POLICY "risk_eval_service" ON public.risk_evaluations
  FOR ALL USING (auth.role() = 'service_role');


-- risk_alerts
ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_alerts_select" ON public.risk_alerts
  FOR SELECT USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

CREATE POLICY "risk_alerts_update" ON public.risk_alerts
  FOR UPDATE USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
  );

CREATE POLICY "risk_alerts_service" ON public.risk_alerts
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 9. UPDATED_AT TRIGGER
-- Auto-update updated_at on modification.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to tables with updated_at
DO $$
BEGIN
  -- risk_model_configs
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_risk_model_configs'
  ) THEN
    CREATE TRIGGER set_updated_at_risk_model_configs
      BEFORE UPDATE ON public.risk_model_configs
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  -- student_metrics
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_student_metrics'
  ) THEN
    CREATE TRIGGER set_updated_at_student_metrics
      BEFORE UPDATE ON public.student_metrics
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  -- risk_alerts
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_risk_alerts'
  ) THEN
    CREATE TRIGGER set_updated_at_risk_alerts
      BEFORE UPDATE ON public.risk_alerts
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;


-- ============================================================
-- 10. SEED DEFAULT CONFIG FOR EXISTING SCHOOLS
-- Creates one active risk_model_config per school.
-- Uses all defaults from the column definitions above.
-- ============================================================

INSERT INTO public.risk_model_configs (school_id, name, is_active)
SELECT s.id, 'Default MTSS Model', true
FROM public.schools s
WHERE s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.risk_model_configs rmc 
    WHERE rmc.school_id = s.id AND rmc.is_active = true
  );


-- ============================================================
-- 11. BOOTSTRAP STUDENT_METRICS FROM EXISTING STUDENTS DATA
-- Populates student_metrics for all active students using
-- current values from the students table.
-- This gives the risk engine something to work with immediately.
-- ============================================================

INSERT INTO public.student_metrics (
  student_id, school_id,
  attendance_rate, chronic_absence_flag,
  proficiency_level, growth_percentile,
  engagement_score, data_completeness
)
SELECT 
  s.id,
  s.school_id,
  s.attendance_rate,
  COALESCE(s.is_chronically_absent, false),
  s.proficiency_level,
  s.growth_percentile,
  -- Extract engagement from purpose_driven_metrics JSONB
  CASE 
    WHEN s.purpose_driven_metrics IS NOT NULL 
      AND (s.purpose_driven_metrics->>'engagement') IS NOT NULL
    THEN (s.purpose_driven_metrics->>'engagement')::NUMERIC(4,3)
    ELSE NULL
  END,
  -- Calculate data completeness (count non-null indicators / total indicators)
  (
    (CASE WHEN s.attendance_rate IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN s.proficiency_level IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN s.growth_percentile IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN s.math_scores IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN s.reading_scores IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN s.is_chronically_absent IS NOT NULL THEN 1 ELSE 0 END)
  )::NUMERIC / 6.0
FROM public.students s
WHERE s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.student_metrics sm 
    WHERE sm.student_id = s.id AND sm.school_id = s.school_id
  );


-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
'@

[System.IO.File]::WriteAllText($migrationFile, $migrationSQL, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] Migration SQL created: $migrationFile" -ForegroundColor Green


# ================================================================
# STEP 2: Create execution script
# ================================================================
Write-Host ""
Write-Host "--- STEP 2: Creating execution script ---" -ForegroundColor Cyan

$execScript = Join-Path $projectRoot ".discovery/_run-migration.mjs"
New-Item -ItemType Directory -Path (Join-Path $projectRoot ".discovery") -Force | Out-Null

$execCode = @'
// .discovery/_run-migration.mjs
// Executes SQL migration against Supabase via the Management API
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MIGRATION_FILE = process.env.MIGRATION_FILE;

if (!SUPABASE_URL || !SERVICE_KEY || !MIGRATION_FILE) {
  console.error('Missing required env vars');
  process.exit(1);
}

const sql = readFileSync(MIGRATION_FILE, 'utf-8');

// Split into individual statements for safer execution
// We'll use the Supabase REST RPC or direct SQL endpoint
async function executeMigration() {
  console.log('Executing migration against: ' + SUPABASE_URL);
  console.log('SQL length: ' + sql.length + ' chars');
  console.log('');

  // Use the Supabase SQL endpoint (requires service role)
  // POST to /rest/v1/rpc with a custom function, or use the 
  // pg_net extension. Safest approach: use supabase-js.

  // Strategy: Execute the entire SQL as one statement via
  // the Supabase Management API SQL endpoint
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  // Try the direct SQL execution endpoint
  // Supabase exposes this at /pg/query for service role
  const endpoints = [
    '/rest/v1/rpc/exec_sql',
    '/pg/query'  
  ];

  let success = false;

  // Method 1: Try exec_sql RPC (if it exists)
  try {
    console.log('Attempting exec_sql RPC...');
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: sql })
    });

    if (res.ok) {
      console.log('[OK] Migration executed via exec_sql RPC');
      success = true;
    } else {
      const errText = await res.text();
      console.log('exec_sql not available: ' + res.status + ' ' + errText.substring(0, 200));
    }
  } catch (e) {
    console.log('exec_sql failed: ' + e.message);
  }

  // Method 2: Use supabase-js client with raw SQL
  if (!success) {
    try {
      console.log('Attempting via supabase-js...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      // supabase-js doesn't have a direct SQL method,
      // but we can use the REST API to create a temporary function
      // that runs our migration

      // Actually, the best approach is to split and run statements
      // via individual table creation calls. But for a migration this
      // complex, we need raw SQL access.
      
      // Method 2b: Use the Supabase Dashboard SQL API
      // Extract project ref from URL
      const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
      
      console.log('');
      console.log('=== MANUAL MIGRATION REQUIRED ===');
      console.log('');
      console.log('The migration SQL has been created but cannot be auto-executed');
      console.log('without the Supabase Management API key.');
      console.log('');
      console.log('Please run the migration manually:');
      console.log('');
      console.log('OPTION A: Supabase Dashboard');
      console.log('  1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql');
      console.log('  2. Paste the contents of: ' + MIGRATION_FILE);
      console.log('  3. Click "Run"');
      console.log('');
      console.log('OPTION B: Supabase CLI');
      console.log('  supabase db push');
      console.log('');
      console.log('OPTION C: psql direct connection');
      console.log('  psql "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" -f ' + MIGRATION_FILE);
      console.log('');

      success = true; // Don't fail, just inform
    } catch (e) {
      console.log('supabase-js import failed: ' + e.message);
    }
  }

  if (!success) {
    console.error('All execution methods failed.');
    process.exit(1);
  }
}

executeMigration().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
'@

[System.IO.File]::WriteAllText($execScript, $execCode, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] Execution script created" -ForegroundColor Green


# ================================================================
# STEP 3: Run migration
# ================================================================
Write-Host ""
Write-Host "--- STEP 3: Running migration ---" -ForegroundColor Cyan

$env:SUPABASE_URL = $supabaseUrl
$env:SUPABASE_SERVICE_KEY = $serviceKey
$env:MIGRATION_FILE = $migrationFile

try {
    $output = & node $execScript 2>&1
    $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} catch {
    Write-Host "[WARN] Execution script failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Remove-Item Env:\SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\SUPABASE_SERVICE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\MIGRATION_FILE -ErrorAction SilentlyContinue


# ================================================================
# STEP 4: Verification script
# ================================================================
Write-Host ""
Write-Host "--- STEP 4: Creating verification script ---" -ForegroundColor Cyan

$verifyScript = Join-Path $projectRoot ".discovery/_verify-migration.mjs"

$verifyCode = @'
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json'
};

async function verify() {
  console.log('Verifying risk engine tables...');
  console.log('');

  const tables = [
    'risk_model_configs',
    'student_metrics', 
    'student_metric_history',
    'risk_evaluations',
    'risk_alerts'
  ];

  let allGood = true;

  for (const table of tables) {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/' + table + '?select=count',
        { headers: { ...headers, 'Prefer': 'count=estimated' }, method: 'HEAD' }
      );
      if (res.ok) {
        const range = res.headers.get('content-range') || '?';
        console.log('  [OK] ' + table.padEnd(30) + range);
      } else {
        console.log('  [MISSING] ' + table.padEnd(30) + 'HTTP ' + res.status);
        allGood = false;
      }
    } catch (e) {
      console.log('  [ERROR] ' + table.padEnd(30) + e.message);
      allGood = false;
    }
  }

  // Check view
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/current_risk_scores?limit=0',
      { headers }
    );
    if (res.ok) {
      console.log('  [OK] current_risk_scores (view)');
    } else {
      console.log('  [MISSING] current_risk_scores (view)    HTTP ' + res.status);
      allGood = false;
    }
  } catch (e) {
    console.log('  [ERROR] current_risk_scores view: ' + e.message);
    allGood = false;
  }

  // Check if configs were seeded
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/risk_model_configs?is_active=eq.true&select=id,school_id,name',
      { headers }
    );
    if (res.ok) {
      const configs = await res.json();
      console.log('');
      console.log('  Seeded configs: ' + configs.length);
      for (const c of configs) {
        console.log('    ' + c.school_id + ' -> ' + c.name);
      }
    }
  } catch (e) {}

  // Check if student_metrics were bootstrapped
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/student_metrics?select=count',
      { headers: { ...headers, 'Prefer': 'count=estimated' }, method: 'HEAD' }
    );
    if (res.ok) {
      const range = res.headers.get('content-range') || '?';
      console.log('  Bootstrapped student_metrics: ' + range);
    }
  } catch (e) {}

  console.log('');
  if (allGood) {
    console.log('[OK] All risk engine tables verified.');
  } else {
    console.log('[FAIL] Some tables missing. Run migration manually.');
  }
}

verify().catch(console.error);
'@

[System.IO.File]::WriteAllText($verifyScript, $verifyCode, [System.Text.UTF8Encoding]::new($false))

# Run verification
$env:SUPABASE_URL = $supabaseUrl
$env:SUPABASE_SERVICE_KEY = $serviceKey

Write-Host ""
Write-Host "--- Verifying tables ---" -ForegroundColor Cyan
try {
    $verifyOutput = & node $verifyScript 2>&1
    $verifyOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} catch {
    Write-Host "[WARN] Verification failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Remove-Item Env:\SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\SUPABASE_SERVICE_KEY -ErrorAction SilentlyContinue


# ================================================================
# STEP 5: Update .gitignore
# ================================================================
$gitignorePath = Join-Path $projectRoot ".gitignore"
if (Test-Path $gitignorePath) {
    $gitignore = Get-Content $gitignorePath -Raw
    if ($gitignore -notmatch "\.discovery") {
        Add-Content -Path $gitignorePath -Value "`n# Discovery toolkit outputs`n.discovery/"
        Write-Host ""
        Write-Host "[OK] Added .discovery/ to .gitignore" -ForegroundColor Green
    }
}


# ================================================================
# DONE
# ================================================================
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  SPRINT 1A COMPLETE" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Created files:" -ForegroundColor Yellow
Write-Host "    $migrationFile" -ForegroundColor Gray
Write-Host "    .discovery/_run-migration.mjs" -ForegroundColor Gray
Write-Host "    .discovery/_verify-migration.mjs" -ForegroundColor Gray
Write-Host ""
Write-Host "  IF TABLES SHOW [MISSING]:" -ForegroundColor Yellow
Write-Host "    1. Open Supabase Dashboard -> SQL Editor" -ForegroundColor Gray
Write-Host "    2. Paste contents of: $migrationFile" -ForegroundColor Gray
Write-Host "    3. Click Run" -ForegroundColor Gray
Write-Host "    4. Re-run verification:" -ForegroundColor Gray
Write-Host "       node .discovery/_verify-migration.mjs" -ForegroundColor Gray
Write-Host ""
Write-Host "  NEXT: Sprint 1B - Refactor detection-engine.ts" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
