-- MIGRATION: Risk Engine Foundation Tables
-- EduNode Analytics - Sprint 1A

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'watch' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'risk_level')
  ) THEN
    ALTER TYPE public.risk_level ADD VALUE IF NOT EXISTS 'watch' AFTER 'on_track';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.risk_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default MTSS Model',
  is_active BOOLEAN NOT NULL DEFAULT true,
  weight_attendance NUMERIC(4,3) NOT NULL DEFAULT 0.250,
  weight_academic NUMERIC(4,3) NOT NULL DEFAULT 0.300,
  weight_assignments NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  weight_behavior NUMERIC(4,3) NOT NULL DEFAULT 0.150,
  weight_trend NUMERIC(4,3) NOT NULL DEFAULT 0.100,
  threshold_on_track NUMERIC(4,3) NOT NULL DEFAULT 0.300,
  threshold_watch NUMERIC(4,3) NOT NULL DEFAULT 0.600,
  threshold_at_risk NUMERIC(4,3) NOT NULL DEFAULT 0.800,
  attendance_floor NUMERIC(5,2) NOT NULL DEFAULT 90.00,
  attendance_critical NUMERIC(5,2) NOT NULL DEFAULT 75.00,
  assignment_missing_warn NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  behavior_incident_cap INTEGER NOT NULL DEFAULT 5,
  assessment_floor_pct INTEGER NOT NULL DEFAULT 50,
  trend_lookback_weeks INTEGER NOT NULL DEFAULT 4,
  trend_decline_threshold NUMERIC(4,3) NOT NULL DEFAULT -0.050,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id),
  CONSTRAINT risk_config_weights_sum CHECK (
    ABS(weight_attendance + weight_academic + weight_assignments + weight_behavior + weight_trend - 1.0) < 0.01
  ),
  CONSTRAINT risk_config_threshold_order CHECK (
    threshold_on_track < threshold_watch AND threshold_watch < threshold_at_risk AND threshold_at_risk <= 1.0
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_config_active_school ON public.risk_model_configs(school_id) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.student_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  attendance_rate NUMERIC(5,2),
  attendance_trend NUMERIC(6,4),
  days_absent_last_30 INTEGER DEFAULT 0,
  chronic_absence_flag BOOLEAN DEFAULT false,
  gpa_current NUMERIC(4,3),
  gpa_trend NUMERIC(6,4),
  math_assessment_pct INTEGER,
  reading_assessment_pct INTEGER,
  assessment_trend NUMERIC(6,4),
  proficiency_level NUMERIC(3,1),
  growth_percentile INTEGER,
  missing_assignment_rate NUMERIC(4,3),
  missing_assignments_count INTEGER DEFAULT 0,
  total_assignments_count INTEGER DEFAULT 0,
  assignment_trend NUMERIC(6,4),
  behavior_incident_count INTEGER DEFAULT 0,
  behavior_incident_trend NUMERIC(6,4),
  suspensions_count INTEGER DEFAULT 0,
  engagement_score NUMERIC(4,3),
  data_completeness NUMERIC(4,3),
  last_sis_sync TIMESTAMPTZ,
  last_lms_sync TIMESTAMPTZ,
  last_assessment_sync TIMESTAMPTZ,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_metrics UNIQUE (student_id, school_id)
);
CREATE INDEX IF NOT EXISTS idx_student_metrics_school ON public.student_metrics(school_id);
CREATE INDEX IF NOT EXISTS idx_student_metrics_student ON public.student_metrics(student_id);

CREATE TABLE IF NOT EXISTS public.student_metric_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_week INTEGER NOT NULL,
  snapshot_year INTEGER NOT NULL,
  attendance_rate NUMERIC(5,2),
  gpa_current NUMERIC(4,3),
  math_assessment_pct INTEGER,
  reading_assessment_pct INTEGER,
  missing_assignment_rate NUMERIC(4,3),
  behavior_incident_count INTEGER,
  proficiency_level NUMERIC(3,1),
  growth_percentile INTEGER,
  engagement_score NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_weekly_snapshot UNIQUE (student_id, school_id, snapshot_year, snapshot_week)
);
CREATE INDEX IF NOT EXISTS idx_metric_history_lookup ON public.student_metric_history(student_id, school_id, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS public.risk_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.risk_model_configs(id),
  risk_score NUMERIC(4,3) NOT NULL,
  risk_level public.risk_level NOT NULL,
  previous_level public.risk_level,
  level_changed BOOLEAN NOT NULL DEFAULT false,
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  trajectory TEXT CHECK (trajectory IN ('improving', 'stable', 'declining')),
  confidence_level NUMERIC(4,3),
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  trigger_type TEXT NOT NULL DEFAULT 'batch_nightly' CHECK (
    trigger_type IN ('sync_event', 'batch_nightly', 'manual', 'config_change')
  ),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_risk_eval_student_latest ON public.risk_evaluations(student_id, school_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_eval_school_level ON public.risk_evaluations(school_id, risk_level, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_eval_level_changed ON public.risk_evaluations(school_id, level_changed, computed_at DESC) WHERE level_changed = true;
CREATE INDEX IF NOT EXISTS idx_risk_eval_computed ON public.risk_evaluations(school_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS public.risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.risk_evaluations(id),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  rule_id TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_breach','rapid_decline','chronic_absence','intervention_overdue','new_risk_detected','trend_warning','attendance_drop','grade_decline','consecutive_absences')),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','urgent','critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  risk_score NUMERIC(4,3),
  risk_level public.risk_level,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','acknowledged','in_review','resolved','dismissed')),
  acknowledged_by UUID REFERENCES public.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  intervention_id UUID REFERENCES public.interventions(id),
  cooldown_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_school_status ON public.risk_alerts(school_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_student ON public.risk_alerts(student_id, school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_cooldown ON public.risk_alerts(cooldown_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_unresolved ON public.risk_alerts(school_id, created_at DESC) WHERE resolved_at IS NULL;

CREATE OR REPLACE VIEW public.current_risk_scores AS
SELECT DISTINCT ON (re.student_id, re.school_id)
  re.id AS evaluation_id, re.student_id, re.school_id, re.risk_score, re.risk_level,
  re.previous_level, re.level_changed, re.risk_factors, re.trajectory,
  re.confidence_level, re.recommended_actions, re.computed_at,
  s.display_name AS student_name, s.grade_level, s.first_name, s.last_name,
  s.is_chronically_absent, s.has_iep, s.has_504_plan
FROM public.risk_evaluations re
JOIN public.students s ON s.id = re.student_id AND s.is_active = true
ORDER BY re.student_id, re.school_id, re.computed_at DESC;

CREATE OR REPLACE FUNCTION public.get_user_school_ids(user_uuid UUID)
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT school_id FROM public.school_memberships WHERE user_id = user_uuid AND is_active = true;
$$;

ALTER TABLE public.risk_model_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_config_select" ON public.risk_model_configs FOR SELECT USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "risk_config_insert" ON public.risk_model_configs FOR INSERT WITH CHECK (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "risk_config_update" ON public.risk_model_configs FOR UPDATE USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "risk_config_service" ON public.risk_model_configs FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.student_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_metrics_select" ON public.student_metrics FOR SELECT USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "student_metrics_service" ON public.student_metrics FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.student_metric_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metric_history_select" ON public.student_metric_history FOR SELECT USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "metric_history_service" ON public.student_metric_history FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.risk_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_eval_select" ON public.risk_evaluations FOR SELECT USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "risk_eval_service" ON public.risk_evaluations FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_alerts_select" ON public.risk_alerts FOR SELECT USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "risk_alerts_update" ON public.risk_alerts FOR UPDATE USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));
CREATE POLICY "risk_alerts_service" ON public.risk_alerts FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_risk_model_configs') THEN
    CREATE TRIGGER set_updated_at_risk_model_configs BEFORE UPDATE ON public.risk_model_configs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_student_metrics') THEN
    CREATE TRIGGER set_updated_at_student_metrics BEFORE UPDATE ON public.student_metrics FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_risk_alerts') THEN
    CREATE TRIGGER set_updated_at_risk_alerts BEFORE UPDATE ON public.risk_alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

INSERT INTO public.risk_model_configs (school_id, name, is_active)
SELECT s.id, 'Default MTSS Model', true FROM public.schools s
WHERE s.is_active = true AND NOT EXISTS (
  SELECT 1 FROM public.risk_model_configs rmc WHERE rmc.school_id = s.id AND rmc.is_active = true
);

INSERT INTO public.student_metrics (student_id, school_id, attendance_rate, chronic_absence_flag, proficiency_level, growth_percentile, engagement_score, data_completeness)
SELECT s.id, s.school_id, s.attendance_rate, COALESCE(s.is_chronically_absent, false), s.proficiency_level, s.growth_percentile,
  CASE WHEN s.purpose_driven_metrics IS NOT NULL AND (s.purpose_driven_metrics->>'engagement') IS NOT NULL
    THEN (s.purpose_driven_metrics->>'engagement')::NUMERIC(4,3) ELSE NULL END,
  ((CASE WHEN s.attendance_rate IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN s.proficiency_level IS NOT NULL THEN 1 ELSE 0 END) +
   (CASE WHEN s.growth_percentile IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN s.math_scores IS NOT NULL THEN 1 ELSE 0 END) +
   (CASE WHEN s.reading_scores IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN s.is_chronically_absent IS NOT NULL THEN 1 ELSE 0 END))::NUMERIC / 6.0
FROM public.students s WHERE s.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.student_metrics sm WHERE sm.student_id = s.id AND sm.school_id = s.school_id);