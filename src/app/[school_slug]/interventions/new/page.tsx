'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, User, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import { useSchoolBySlug } from '@/lib/hooks/use-school-context';
import { useCreateIntervention } from '@/lib/hooks/use-interventions';
import { useToast } from '@/lib/hooks/use-toast';
import { getSchoolSeed, type StudentSeedData } from '@/lib/data/seed-data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERVENTION_TYPES = [
  { value: 'academic', label: 'Academic' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'sel', label: 'Social-Emotional (SEL)' },
  { value: 'family_engagement', label: 'Family Engagement' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

const TIERS = [
  { value: 2, label: 'Tier 2 - Targeted' },
  { value: 3, label: 'Tier 3 - Intensive' },
] as const;

const RISK_BADGE_VARIANT: Record<string, 'on-track' | 'watch' | 'at-risk' | 'critical'> = {
  on_track: 'on-track',
  watch: 'watch',
  at_risk: 'at-risk',
  critical: 'critical',
};

const RISK_LABEL: Record<string, string> = {
  on_track: 'On Track',
  watch: 'Watch',
  at_risk: 'At Risk',
  critical: 'Critical',
};

// ---------------------------------------------------------------------------
// Form state type
// ---------------------------------------------------------------------------

interface FormState {
  student_id: string;
  title: string;
  type: string;
  priority: string;
  description: string;
  goal: string;
  success_criteria: string;
  baseline_value: string;
  target_value: string;
  start_date: string;
  target_end_date: string;
  tier: number;
  sessions_per_week: string;
  minutes_per_session: string;
  total_weeks: string;
  status: 'planned' | 'in_progress';
}

const INITIAL_FORM: FormState = {
  student_id: '',
  title: '',
  type: 'academic',
  priority: 'medium',
  description: '',
  goal: '',
  success_criteria: '',
  baseline_value: '',
  target_value: '',
  start_date: new Date().toISOString().slice(0, 10),
  target_end_date: '',
  tier: 2,
  sessions_per_week: '3',
  minutes_per_session: '30',
  total_weeks: '8',
  status: 'planned',
};

// ---------------------------------------------------------------------------
// Shared input class strings
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';

const LABEL_CLASS = 'block text-sm font-medium text-slate-300 mb-1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRiskLevel(level: string): string {
  return RISK_LABEL[level] ?? level;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StudentSelector({
  students,
  selectedId,
  onSelect,
}: {
  students: StudentSeedData[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
    );
  }, [students, query]);

  const selected = students.find((s) => s.id === selectedId);

  return (
    <div className="relative">
      {selected && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${INPUT_CLASS} flex items-center justify-between text-left`}
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>{selected.displayName}</span>
            <span className="text-slate-500 text-xs">Grade {selected.gradeLevel}</span>
            <Badge variant={RISK_BADGE_VARIANT[selected.riskLevel]} size="sm">
              {formatRiskLevel(selected.riskLevel)}
            </Badge>
          </span>
          <span className="text-slate-500 text-xs">Change</span>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search students by name..."
            className={`${INPUT_CLASS} pl-9`}
            autoComplete="off"
          />
        </div>
      )}

      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">No students found</div>
            ) : (
              filtered.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => {
                    onSelect(student.id);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700/60 transition-colors ${
                    student.id === selectedId ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {student.displayName}
                      </span>
                      <Badge variant={RISK_BADGE_VARIANT[student.riskLevel]} size="sm">
                        {formatRiskLevel(student.riskLevel)}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Grade {student.gradeLevel} &middot; {student.homeroomTeacher}
                      {student.hasIep && ' \u00B7 IEP'}
                      {student.has504Plan && ' \u00B7 504'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface ValidationErrors {
  student_id?: string;
  title?: string;
  target_end_date?: string;
  baseline_value?: string;
  target_value?: string;
  sessions_per_week?: string;
  minutes_per_session?: string;
  total_weeks?: string;
}

function validate(form: FormState): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!form.student_id) {
    errors.student_id = 'Please select a student.';
  }

  if (!form.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (form.target_end_date && form.start_date && form.target_end_date < form.start_date) {
    errors.target_end_date = 'Target end date must be after the start date.';
  }

  if (form.baseline_value && isNaN(Number(form.baseline_value))) {
    errors.baseline_value = 'Must be a number.';
  }

  if (form.target_value && isNaN(Number(form.target_value))) {
    errors.target_value = 'Must be a number.';
  }

  const spw = Number(form.sessions_per_week);
  if (form.sessions_per_week && (isNaN(spw) || spw < 1 || spw > 7)) {
    errors.sessions_per_week = 'Must be between 1 and 7.';
  }

  const mps = Number(form.minutes_per_session);
  if (form.minutes_per_session && (isNaN(mps) || mps < 5 || mps > 180)) {
    errors.minutes_per_session = 'Must be between 5 and 180.';
  }

  const tw = Number(form.total_weeks);
  if (form.total_weeks && (isNaN(tw) || tw < 1 || tw > 52)) {
    errors.total_weeks = 'Must be between 1 and 52.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function NewInterventionPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const schoolSlug = params.school_slug as string;

  const { schoolId, isLoading: isLoadingSchool } = useSchoolBySlug(schoolSlug);

  // Seed data for student selector
  const schoolSeed = getSchoolSeed(schoolSlug);
  const students = schoolSeed?.students ?? [];

  // Form state
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Mutation hook - schoolId may be null while loading, pass empty string as
  // fallback since the hook won't fire without a valid ID anyway.
  const { createIntervention, isCreating } = useCreateIntervention(schoolId ?? '');

  // Helpers
  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (errors[key as keyof ValidationErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof ValidationErrors];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!schoolId) {
      toast.error('School not found', 'Unable to resolve the current school.');
      return;
    }

    try {
      await createIntervention({
        student_id: form.student_id,
        type: form.type as 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement',
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority as 'low' | 'medium' | 'high' | 'urgent',
        start_date: form.start_date || undefined,
        target_end_date: form.target_end_date || undefined,
        goal: form.goal.trim() || undefined,
        success_criteria: form.success_criteria.trim() || undefined,
        baseline_value: form.baseline_value ? Number(form.baseline_value) : undefined,
        target_value: form.target_value ? Number(form.target_value) : undefined,
        metadata: {
          tier: form.tier,
          dosage_plan: {
            sessions_per_week: Number(form.sessions_per_week) || 3,
            minutes_per_session: Number(form.minutes_per_session) || 30,
            total_weeks: Number(form.total_weeks) || 8,
          },
        },
      } as Record<string, unknown>);

      toast.success('Intervention created', `"${form.title}" has been created successfully.`);
      router.push(`/${schoolSlug}/interventions`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error('Failed to create intervention', message);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const fieldError = (key: keyof ValidationErrors) =>
    submitted && errors[key] ? (
      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {errors[key]}
      </p>
    ) : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageFeatureGate featureKey="intervention_hub">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${schoolSlug}/interventions`)}
            aria-label="Back to interventions"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-white">New Intervention</h1>
            <p className="text-slate-400 mt-1">
              Create a Tier 2 or Tier 3 intervention for a student.
            </p>
          </div>
        </div>

        {isLoadingSchool ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="ml-2 text-slate-400">Loading school data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* ---- Student ---- */}
            <Card variant="solid">
              <CardContent className="pt-6">
                <fieldset>
                  <legend className="text-base font-semibold text-white mb-4">Student</legend>

                  <div>
                    <label className={LABEL_CLASS}>Select Student</label>
                    <StudentSelector
                      students={students}
                      selectedId={form.student_id}
                      onSelect={(id) => updateField('student_id', id)}
                    />
                    {fieldError('student_id')}
                  </div>
                </fieldset>
              </CardContent>
            </Card>

            {/* ---- Intervention Details ---- */}
            <Card variant="solid">
              <CardContent className="pt-6">
                <fieldset className="space-y-4">
                  <legend className="text-base font-semibold text-white mb-4">
                    Intervention Details
                  </legend>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className={LABEL_CLASS}>
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., Small Group Reading Instruction"
                    />
                    {fieldError('title')}
                  </div>

                  {/* Type & Priority row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="type" className={LABEL_CLASS}>
                        Type
                      </label>
                      <select
                        id="type"
                        value={form.type}
                        onChange={(e) => updateField('type', e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {INTERVENTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="priority" className={LABEL_CLASS}>
                        Priority
                      </label>
                      <select
                        id="priority"
                        value={form.priority}
                        onChange={(e) => updateField('priority', e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tier & Status row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tier" className={LABEL_CLASS}>
                        Tier
                      </label>
                      <select
                        id="tier"
                        value={form.tier}
                        onChange={(e) => updateField('tier', Number(e.target.value))}
                        className={INPUT_CLASS}
                      >
                        {TIERS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="status" className={LABEL_CLASS}>
                        Initial Status
                      </label>
                      <select
                        id="status"
                        value={form.status}
                        onChange={(e) =>
                          updateField('status', e.target.value as 'planned' | 'in_progress')
                        }
                        className={INPUT_CLASS}
                      >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className={LABEL_CLASS}>
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={3}
                      className={INPUT_CLASS}
                      placeholder="Describe the intervention plan, strategies, and expected approach..."
                    />
                  </div>

                  {/* Dates row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_date" className={LABEL_CLASS}>
                        Start Date
                      </label>
                      <input
                        id="start_date"
                        type="date"
                        value={form.start_date}
                        onChange={(e) => updateField('start_date', e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="target_end_date" className={LABEL_CLASS}>
                        Target End Date
                      </label>
                      <input
                        id="target_end_date"
                        type="date"
                        value={form.target_end_date}
                        onChange={(e) => updateField('target_end_date', e.target.value)}
                        className={INPUT_CLASS}
                      />
                      {fieldError('target_end_date')}
                    </div>
                  </div>
                </fieldset>
              </CardContent>
            </Card>

            {/* ---- Goals & Metrics ---- */}
            <Card variant="solid">
              <CardContent className="pt-6">
                <fieldset className="space-y-4">
                  <legend className="text-base font-semibold text-white mb-4">
                    Goals &amp; Metrics
                  </legend>

                  {/* Goal */}
                  <div>
                    <label htmlFor="goal" className={LABEL_CLASS}>
                      Goal
                    </label>
                    <input
                      id="goal"
                      type="text"
                      value={form.goal}
                      onChange={(e) => updateField('goal', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="e.g., Improve reading fluency from 85 to 120 WPM"
                    />
                  </div>

                  {/* Success Criteria */}
                  <div>
                    <label htmlFor="success_criteria" className={LABEL_CLASS}>
                      Success Criteria
                    </label>
                    <textarea
                      id="success_criteria"
                      value={form.success_criteria}
                      onChange={(e) => updateField('success_criteria', e.target.value)}
                      rows={2}
                      className={INPUT_CLASS}
                      placeholder="e.g., Student reads at 120+ WPM with 95% accuracy on three consecutive probes"
                    />
                  </div>

                  {/* Baseline & Target row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="baseline_value" className={LABEL_CLASS}>
                        Baseline Value
                      </label>
                      <input
                        id="baseline_value"
                        type="number"
                        value={form.baseline_value}
                        onChange={(e) => updateField('baseline_value', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="e.g., 85"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Current performance level before intervention
                      </p>
                      {fieldError('baseline_value')}
                    </div>
                    <div>
                      <label htmlFor="target_value" className={LABEL_CLASS}>
                        Target Value
                      </label>
                      <input
                        id="target_value"
                        type="number"
                        value={form.target_value}
                        onChange={(e) => updateField('target_value', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="e.g., 120"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Expected performance level after intervention
                      </p>
                      {fieldError('target_value')}
                    </div>
                  </div>
                </fieldset>
              </CardContent>
            </Card>

            {/* ---- Dosage Plan ---- */}
            <Card variant="solid">
              <CardContent className="pt-6">
                <fieldset className="space-y-4">
                  <legend className="text-base font-semibold text-white mb-4">Dosage Plan</legend>
                  <p className="text-sm text-slate-400 -mt-2 mb-2">
                    Define how frequently and for how long the intervention will be delivered.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="sessions_per_week" className={LABEL_CLASS}>
                        Sessions / Week
                      </label>
                      <input
                        id="sessions_per_week"
                        type="number"
                        min={1}
                        max={7}
                        value={form.sessions_per_week}
                        onChange={(e) => updateField('sessions_per_week', e.target.value)}
                        className={INPUT_CLASS}
                      />
                      {fieldError('sessions_per_week')}
                    </div>
                    <div>
                      <label htmlFor="minutes_per_session" className={LABEL_CLASS}>
                        Minutes / Session
                      </label>
                      <input
                        id="minutes_per_session"
                        type="number"
                        min={5}
                        max={180}
                        value={form.minutes_per_session}
                        onChange={(e) => updateField('minutes_per_session', e.target.value)}
                        className={INPUT_CLASS}
                      />
                      {fieldError('minutes_per_session')}
                    </div>
                    <div>
                      <label htmlFor="total_weeks" className={LABEL_CLASS}>
                        Total Weeks
                      </label>
                      <input
                        id="total_weeks"
                        type="number"
                        min={1}
                        max={52}
                        value={form.total_weeks}
                        onChange={(e) => updateField('total_weeks', e.target.value)}
                        className={INPUT_CLASS}
                      />
                      {fieldError('total_weeks')}
                    </div>
                  </div>

                  {/* Summary */}
                  {form.sessions_per_week && form.minutes_per_session && form.total_weeks && (
                    <div className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-300">
                      Total dosage:{' '}
                      <span className="font-semibold text-white">
                        {Number(form.sessions_per_week) * Number(form.total_weeks)} sessions
                      </span>{' '}
                      over{' '}
                      <span className="font-semibold text-white">{form.total_weeks} weeks</span> (
                      {(
                        Number(form.sessions_per_week) *
                        Number(form.minutes_per_session) *
                        Number(form.total_weeks)
                      ).toLocaleString()}{' '}
                      total minutes)
                    </div>
                  )}
                </fieldset>
              </CardContent>
            </Card>

            {/* ---- Actions ---- */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isCreating || !schoolId} size="lg">
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Intervention'
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => router.push(`/${schoolSlug}/interventions`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageFeatureGate>
  );
}
