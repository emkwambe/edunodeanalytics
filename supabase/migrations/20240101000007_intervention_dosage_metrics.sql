-- MIGRATION: Intervention Dosage Metrics
-- EduNode Analytics - Sprint 5
-- Tracks intervention session delivery, compliance, and fidelity

-- ==============================================
-- DOSAGE SESSIONS TABLE
-- ==============================================
-- Individual session records for tracking actual delivery

CREATE TABLE IF NOT EXISTS public.intervention_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,

  -- Session timing
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME,
  scheduled_duration_minutes INTEGER NOT NULL DEFAULT 30,

  -- Actual delivery
  actual_date DATE,
  actual_start_time TIME,
  actual_duration_minutes INTEGER,

  -- Session status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'completed', 'partial', 'cancelled', 'no_show', 'rescheduled')
  ),
  cancellation_reason TEXT,

  -- Delivery details
  delivered_by UUID REFERENCES public.users(id),
  location TEXT,
  modality TEXT CHECK (modality IN ('in_person', 'virtual', 'hybrid', 'async')),
  group_size INTEGER DEFAULT 1,

  -- Fidelity tracking
  fidelity_checklist JSONB DEFAULT '[]'::jsonb,  -- [{item: string, completed: boolean}]
  fidelity_score NUMERIC(4,3),                    -- 0-1
  fidelity_notes TEXT,

  -- Student engagement
  student_engaged BOOLEAN DEFAULT true,
  engagement_notes TEXT,

  -- Session outcomes
  session_notes TEXT,
  skills_practiced JSONB DEFAULT '[]'::jsonb,
  homework_assigned TEXT,
  parent_communication BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_intervention ON public.intervention_sessions(intervention_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON public.intervention_sessions(student_id, school_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.intervention_sessions(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.intervention_sessions(intervention_id, status);

-- ==============================================
-- DOSAGE METRICS TABLE
-- ==============================================
-- Aggregated dosage metrics per intervention (computed from sessions)

CREATE TABLE IF NOT EXISTS public.intervention_dosage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE UNIQUE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,

  -- Dosage plan (target)
  planned_sessions_per_week NUMERIC(3,1) NOT NULL DEFAULT 3,
  planned_minutes_per_session INTEGER NOT NULL DEFAULT 30,
  planned_total_weeks INTEGER NOT NULL DEFAULT 8,
  planned_total_sessions INTEGER GENERATED ALWAYS AS (
    CEIL(planned_sessions_per_week * planned_total_weeks)
  ) STORED,
  planned_total_minutes INTEGER GENERATED ALWAYS AS (
    CEIL(planned_sessions_per_week * planned_total_weeks * planned_minutes_per_session)
  ) STORED,

  -- Actual delivery (computed from sessions)
  actual_sessions_completed INTEGER NOT NULL DEFAULT 0,
  actual_sessions_partial INTEGER NOT NULL DEFAULT 0,
  actual_sessions_cancelled INTEGER NOT NULL DEFAULT 0,
  actual_sessions_no_show INTEGER NOT NULL DEFAULT 0,
  actual_total_minutes INTEGER NOT NULL DEFAULT 0,

  -- Compliance metrics
  session_completion_rate NUMERIC(5,4),          -- 0-1 (completed / planned to date)
  dosage_compliance_rate NUMERIC(5,4),           -- 0-1 (actual minutes / planned minutes to date)
  attendance_rate NUMERIC(5,4),                  -- 0-1 (attended / scheduled to date)

  -- Fidelity metrics
  average_fidelity_score NUMERIC(4,3),           -- 0-1
  fidelity_trend TEXT CHECK (fidelity_trend IN ('improving', 'stable', 'declining')),

  -- Pace metrics
  weeks_elapsed INTEGER NOT NULL DEFAULT 0,
  sessions_behind_schedule INTEGER NOT NULL DEFAULT 0,
  minutes_behind_schedule INTEGER NOT NULL DEFAULT 0,
  on_track BOOLEAN GENERATED ALWAYS AS (
    sessions_behind_schedule <= 2
  ) STORED,

  -- Engagement metrics
  average_engagement_rate NUMERIC(4,3),          -- 0-1 based on session engagement flags

  -- Dosage status
  dosage_status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    dosage_status IN ('not_started', 'on_track', 'behind', 'critical', 'completed', 'discontinued')
  ),

  -- Inference flags (from dosage analyzer rules)
  inference_flags JSONB DEFAULT '[]'::jsonb,
  -- Example: [{rule: 'chronic_no_show', severity: 'warning', message: '...', detectedAt: '...'}]

  -- Timestamps
  first_session_date DATE,
  last_session_date DATE,
  next_session_date DATE,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dosage_school ON public.intervention_dosage_metrics(school_id);
CREATE INDEX IF NOT EXISTS idx_dosage_student ON public.intervention_dosage_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_dosage_status ON public.intervention_dosage_metrics(school_id, dosage_status);
CREATE INDEX IF NOT EXISTS idx_dosage_behind ON public.intervention_dosage_metrics(school_id, on_track) WHERE on_track = false;

-- ==============================================
-- DOSAGE PLAN IN INTERVENTIONS.METADATA
-- ==============================================
-- Add a structured dosage_plan object to intervention metadata

COMMENT ON COLUMN public.interventions.metadata IS
'JSON object containing:
- templateId: string (if created from template)
- milestones: array (workflow milestones)
- resources: array (attached resources)
- dosagePlan: {
    sessionsPerWeek: number,
    minutesPerSession: number,
    totalWeeks: number,
    modality: "in_person" | "virtual" | "hybrid" | "async",
    groupSize: number,
    deliveredBy: string[],
    fidelityChecklist: string[]
  }
';

-- ==============================================
-- RLS POLICIES
-- ==============================================

ALTER TABLE public.intervention_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select" ON public.intervention_sessions
  FOR SELECT USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));

CREATE POLICY "sessions_insert" ON public.intervention_sessions
  FOR INSERT WITH CHECK (school_id IN (SELECT public.get_user_school_ids(auth.uid())));

CREATE POLICY "sessions_update" ON public.intervention_sessions
  FOR UPDATE USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));

CREATE POLICY "sessions_delete" ON public.intervention_sessions
  FOR DELETE USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));

CREATE POLICY "sessions_service" ON public.intervention_sessions
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.intervention_dosage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dosage_metrics_select" ON public.intervention_dosage_metrics
  FOR SELECT USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));

CREATE POLICY "dosage_metrics_insert" ON public.intervention_dosage_metrics
  FOR INSERT WITH CHECK (school_id IN (SELECT public.get_user_school_ids(auth.uid())));

CREATE POLICY "dosage_metrics_update" ON public.intervention_dosage_metrics
  FOR UPDATE USING (school_id IN (SELECT public.get_user_school_ids(auth.uid())));

CREATE POLICY "dosage_metrics_service" ON public.intervention_dosage_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- TRIGGERS
-- ==============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_intervention_sessions') THEN
    CREATE TRIGGER set_updated_at_intervention_sessions
      BEFORE UPDATE ON public.intervention_sessions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_dosage_metrics') THEN
    CREATE TRIGGER set_updated_at_dosage_metrics
      BEFORE UPDATE ON public.intervention_dosage_metrics
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ==============================================
-- VIEWS
-- ==============================================

-- Active dosage overview for dashboard
CREATE OR REPLACE VIEW public.active_dosage_overview AS
SELECT
  dm.school_id,
  dm.student_id,
  dm.intervention_id,
  i.title AS intervention_title,
  i.type AS intervention_type,
  i.status AS intervention_status,
  s.display_name AS student_name,
  s.grade_level,
  dm.planned_sessions_per_week,
  dm.planned_minutes_per_session,
  dm.planned_total_sessions,
  dm.actual_sessions_completed,
  dm.session_completion_rate,
  dm.dosage_compliance_rate,
  dm.average_fidelity_score,
  dm.dosage_status,
  dm.on_track,
  dm.sessions_behind_schedule,
  dm.next_session_date,
  dm.inference_flags,
  dm.computed_at
FROM public.intervention_dosage_metrics dm
JOIN public.interventions i ON i.id = dm.intervention_id
JOIN public.students s ON s.id = dm.student_id
WHERE i.status IN ('planned', 'in_progress')
  AND s.is_active = true;

-- Dosage compliance by intervention type
CREATE OR REPLACE VIEW public.dosage_compliance_by_type AS
SELECT
  dm.school_id,
  i.type AS intervention_type,
  COUNT(*) AS total_interventions,
  COUNT(*) FILTER (WHERE dm.on_track = true) AS on_track_count,
  COUNT(*) FILTER (WHERE dm.on_track = false) AS behind_count,
  AVG(dm.session_completion_rate) AS avg_session_completion,
  AVG(dm.dosage_compliance_rate) AS avg_dosage_compliance,
  AVG(dm.average_fidelity_score) AS avg_fidelity
FROM public.intervention_dosage_metrics dm
JOIN public.interventions i ON i.id = dm.intervention_id
WHERE i.status IN ('planned', 'in_progress')
GROUP BY dm.school_id, i.type;

-- ==============================================
-- SEED DOSAGE METRICS FOR EXISTING INTERVENTIONS
-- ==============================================

INSERT INTO public.intervention_dosage_metrics (
  intervention_id,
  school_id,
  student_id,
  planned_sessions_per_week,
  planned_minutes_per_session,
  planned_total_weeks,
  dosage_status
)
SELECT
  i.id,
  i.school_id,
  i.student_id,
  3,  -- default 3 sessions/week
  30, -- default 30 min/session
  8,  -- default 8 weeks
  CASE
    WHEN i.status = 'planned' THEN 'not_started'
    WHEN i.status = 'in_progress' THEN 'on_track'
    WHEN i.status = 'completed' THEN 'completed'
    WHEN i.status = 'cancelled' THEN 'discontinued'
    ELSE 'not_started'
  END
FROM public.interventions i
WHERE NOT EXISTS (
  SELECT 1 FROM public.intervention_dosage_metrics dm
  WHERE dm.intervention_id = i.id
);
