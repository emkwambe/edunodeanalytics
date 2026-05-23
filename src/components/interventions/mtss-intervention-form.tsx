'use client';

import * as React from 'react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  AlertCircle, Plus, X, ChevronDown, ChevronUp, Settings2,
  Users, Target, Clock, Calendar, TrendingUp, ClipboardCheck,
  UserCheck, FileText, ChevronRight, Check, Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StrategySelector } from './strategy-selector';
import { cn } from '@/lib/utils';
import { useStudents } from '@/lib/hooks/use-students';
import {
  type MTSSInterventionFormState,
  type InterventionTier,
  type TeamMember,
  type CustomField,
  type MonitoringFrequency,
  type InterventionSetting,
  DEFAULT_MTSS_FORM_STATE,
  TIER_2_DEFAULTS,
  TIER_3_DEFAULTS,
} from '@/lib/mtss/types';
import { calculateDosage, getTierRequiredFields } from '@/lib/mtss/validation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';
const LABEL_CLASS = 'block text-sm font-medium text-slate-300 mb-1';

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

const TIERS: { value: InterventionTier; label: string; description: string }[] = [
  { value: 2, label: 'Tier 2 - Targeted', description: 'Small group interventions (3-6 students)' },
  { value: 3, label: 'Tier 3 - Intensive', description: 'Individualized support with team involvement' },
];

const SETTINGS: { value: InterventionSetting; label: string }[] = [
  { value: 'small_group', label: 'Small Group' },
  { value: 'one_on_one', label: 'One-on-One' },
  { value: 'general_education', label: 'General Education Classroom' },
  { value: 'resource_room', label: 'Resource Room' },
  { value: 'virtual', label: 'Virtual/Online' },
  { value: 'home', label: 'Home' },
  { value: 'other', label: 'Other' },
];

const MONITORING_FREQUENCIES: { value: MonitoringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text Message' },
  { value: 'in_person', label: 'In Person' },
] as const;

const STEPS = [
  { id: 1, label: 'Student & Tier', icon: UserCheck },
  { id: 2, label: 'Details & Plan', icon: FileText },
  { id: 3, label: 'Goals & Dosage', icon: TrendingUp },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MTSSInterventionFormProps {
  schoolId: string | null;
  initialValues?: Partial<MTSSInterventionFormState>;
  onSubmit: (data: MTSSInterventionFormState) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

interface ValidationErrors {
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Student Drill-Down Picker
// ---------------------------------------------------------------------------

interface StudentPickerProps {
  schoolId: string | null;
  selectedStudentId: string;
  onSelect: (studentId: string, displayName: string, grade: number, riskLevel: string) => void;
  error?: string;
}

function StudentPicker({ schoolId, selectedStudentId, onSelect, error }: StudentPickerProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(!selectedStudentId);
  const [selectedName, setSelectedName] = useState('');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    if (fetchedForRef.current === schoolId) return;
    fetchedForRef.current = schoolId;
    setIsLoading(true);
    fetch(`/api/schools/${schoolId}/students?limit=500&sortBy=last_name&sortOrder=asc`)
      .then((r) => r.json())
      .then((d) => { setAllStudents(d.data || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [schoolId]);

  // Derive unique grades
  const grades = useMemo(() => {
    const g = [...new Set(allStudents.map((s: any) => s.grade_level))].sort((a: any, b: any) => a - b);
    return g as number[];
  }, [allStudents]);

  // Derive teachers for selected grade
  const teachers = useMemo(() => {
    if (selectedGrade === null) return [];
    const filtered = allStudents.filter((s: any) => s.grade_level === selectedGrade && s.homeroom_teacher);
    return [...new Set(filtered.map((s: any) => s.homeroom_teacher as string))].sort();
  }, [allStudents, selectedGrade]);

  const displayStudents = useMemo(() => {
    let list = allStudents;
    if (selectedGrade !== null) list = list.filter((s: any) => s.grade_level === selectedGrade);
    if (selectedTeacher) list = list.filter((s: any) => s.homeroom_teacher === selectedTeacher);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s: any) =>
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.display_name?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 50);
  }, [allStudents, selectedGrade, selectedTeacher, search]);

  const handleSelect = (s: typeof allStudents[0]) => {
    onSelect(s.id, s.display_name, s.grade_level, s.risk_level);
    setSelectedName(s.display_name);
    setShowPicker(false);
  };

  const handleChange = () => {
    setShowPicker(true);
  };

  if (!showPicker && selectedStudentId) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{selectedName || 'Selected Student'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Student selected</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleChange}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className={cn(INPUT_CLASS, 'pl-9')}
        />
      </div>

      {/* Grade filter */}
      <div>
        <p className={LABEL_CLASS}>Filter by Grade</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setSelectedGrade(null); setSelectedTeacher(null); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              selectedGrade === null
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
            )}
          >
            All Grades
          </button>
          {grades.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { setSelectedGrade(g); setSelectedTeacher(null); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                selectedGrade === g
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
              )}
            >
              Grade {g}
            </button>
          ))}
        </div>
      </div>

      {/* Teacher/Class filter */}
      {selectedGrade !== null && teachers.length > 0 && (
        <div>
          <p className={LABEL_CLASS}>Filter by Class / Teacher</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTeacher(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                selectedTeacher === null
                  ? 'bg-cyan-700 text-white'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
              )}
            >
              All Classes
            </button>
            {teachers.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTeacher(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  selectedTeacher === t
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Student list */}
      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-700 divide-y divide-slate-700/60">
        {isLoading ? (
          <div className="px-4 py-6 text-center text-slate-500 text-sm">Loading students...</div>
        ) : displayStudents.length === 0 ? (
          <div className="px-4 py-6 text-center text-slate-500 text-sm">No students found</div>
        ) : (
          displayStudents.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left"
            >
              <div>
                <p className="text-white text-sm font-medium">{s.display_name}</p>
                <p className="text-xs text-slate-400">
                  Grade {s.grade_level}
                  {s.homeroom_teacher ? ` · ${s.homeroom_teacher}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  s.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                  s.risk_level === 'at_risk' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                )}>
                  {s.risk_level === 'on_track' ? 'On Track' : s.risk_level === 'at_risk' ? 'At Risk' : 'Critical'}
                </span>
                {selectedStudentId === s.id && <Check className="w-4 h-4 text-indigo-400" />}
              </div>
            </button>
          ))
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Progress Bar
// ---------------------------------------------------------------------------

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                done ? 'bg-indigo-600 border-indigo-600' :
                active ? 'bg-slate-800 border-indigo-500' :
                'bg-slate-800 border-slate-600'
              )}>
                {done ? <Check className="w-4 h-4 text-white" /> : <Icon className={cn('w-4 h-4', active ? 'text-indigo-400' : 'text-slate-500')} />}
              </div>
              <span className={cn('text-xs mt-1 font-medium whitespace-nowrap', active ? 'text-white' : done ? 'text-indigo-400' : 'text-slate-500')}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 mb-5 transition-all', done ? 'bg-indigo-600' : 'bg-slate-700')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MTSSInterventionForm({
  schoolId,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
}: MTSSInterventionFormProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<MTSSInterventionFormState>({
    ...DEFAULT_MTSS_FORM_STATE,
    ...initialValues,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tier3: form.tier === 3,
    customization: false,
  });

  const updateField = useCallback(<K extends keyof MTSSInterventionFormState>(
    key: K, value: MTSSInterventionFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }, [errors]);

  const handleTierChange = useCallback((newTier: InterventionTier) => {
    const defaults = newTier === 3 ? TIER_3_DEFAULTS : TIER_2_DEFAULTS;
    setForm((prev) => ({
      ...prev,
      tier: newTier,
      groupSize: defaults.groupSize,
      monitoringFrequency: defaults.monitoringFrequency,
      setting: defaults.setting,
      ...(newTier === 3 && { fidelityImplementedAsDesigned: true, teamStaff: prev.teamStaff || [] }),
    }));
    setExpandedSections((prev) => ({ ...prev, tier3: newTier === 3 }));
  }, []);

  const derivedDosage = useMemo(() => calculateDosage(
    form.sessionsPerWeek, form.minutesPerSession, form.totalWeeks,
    form.customizationEnabled ? { totalSessions: form.overrideTotalSessions, totalMinutes: form.overrideTotalMinutes } : undefined
  ), [form.sessionsPerWeek, form.minutesPerSession, form.totalWeeks, form.customizationEnabled, form.overrideTotalSessions, form.overrideTotalMinutes]);

  const validateStep = useCallback((s: number): ValidationErrors => {
    const e: ValidationErrors = {};
    if (s === 1) {
      if (!form.studentId) e.studentId = 'Please select a student.';
    }
    if (s === 2) {
      if (!form.title.trim()) e.title = 'Title is required.';
      if (!form.description.trim()) e.description = 'Description is required.';
      if (!form.strategy) e.strategy = 'Strategy is required.';
      if (!form.startDate) e.startDate = 'Start date is required.';
      if (form.startDate && form.targetEndDate && form.targetEndDate < form.startDate)
        e.targetEndDate = 'Target end date must be after start date.';
      if (form.tier === 3 && !form.setting) e.setting = 'Setting is required for Tier 3.';
      if (form.tier === 3 && (!form.teamStaff || form.teamStaff.length === 0))
        e.teamStaff = 'At least one team member is required for Tier 3.';
      if (form.tier === 3 && !form.parentContactName?.trim())
        e.parentContactName = 'Parent/guardian contact is required for Tier 3.';
      if (form.tier === 3 && !form.parentContactRelationship?.trim())
        e.parentContactRelationship = 'Relationship is required.';
    }
    if (s === 3) {
      if (!form.primaryGoalDescription.trim()) e.primaryGoalDescription = 'Goal description is required.';
      if (!form.monitoringTool.trim()) e.monitoringTool = 'Monitoring tool is required.';
      if (form.sessionsPerWeek < 1 || form.sessionsPerWeek > 7) e.sessionsPerWeek = 'Must be 1-7.';
      if (form.minutesPerSession < 5 || form.minutesPerSession > 180) e.minutesPerSession = 'Must be 5-180 min.';
      if (form.totalWeeks < 1 || form.totalWeeks > 52) e.totalWeeks = 'Must be 1-52 weeks.';
      if (form.tier === 3 && form.monitoringFrequency === 'monthly')
        e.monitoringFrequency = 'Tier 3 requires at least biweekly monitoring.';
      if (form.tier === 2 && form.groupSize > 8) e.groupSize = 'Tier 2 typically has 8 or fewer students.';
    }
    return e;
  }, [form]);

  const goNext = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const e3 = validateStep(3);
    setErrors(e3);
    if (Object.keys(e3).length > 0) return;
    await onSubmit(form);
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />{errors[key]}
      </p>
    ) : null;

  const addTeamMember = () => setForm((prev) => ({ ...prev, teamStaff: [...(prev.teamStaff || []), { name: '', role: '' }] }));
  const removeTeamMember = (i: number) => setForm((prev) => ({ ...prev, teamStaff: prev.teamStaff?.filter((_, idx) => idx !== i) }));
  const updateTeamMember = (i: number, field: keyof TeamMember, value: string) =>
    setForm((prev) => ({ ...prev, teamStaff: prev.teamStaff?.map((m, idx) => idx === i ? { ...m, [field]: value } : m) }));

  const addCustomField = () => setForm((prev) => ({ ...prev, customFields: [...(prev.customFields || []), { key: '', value: '', type: 'text' }] }));
  const removeCustomField = (i: number) => setForm((prev) => ({ ...prev, customFields: prev.customFields?.filter((_, idx) => idx !== i) }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <StepBar current={step} total={3} />

      {/* ── STEP 1: Student & Tier ── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Student Picker */}
          <Card variant="solid">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span className="text-base font-semibold text-white">Select Student</span>
                <span className="text-red-400 text-sm">*</span>
              </div>
              <StudentPicker
                schoolId={schoolId}
                selectedStudentId={form.studentId}
                onSelect={(id, name, grade, risk) => {
                  updateField('studentId', id);
                  setSelectedStudentName(name);
                }}
                error={errors.studentId}
              />
            </CardContent>
          </Card>

          {/* Tier Selection */}
          <Card variant="solid">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <span className="text-base font-semibold text-white">Intervention Tier</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => handleTierChange(tier.value)}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      form.tier === tier.value
                        ? tier.value === 3 ? 'border-rose-500 bg-rose-500/10' : 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{tier.label}</span>
                      {form.tier === tier.value && (
                        <Badge variant={tier.value === 3 ? 'destructive' : 'warning'} size="sm">Selected</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{tier.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── STEP 2: Details & Plan ── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Intervention Details */}
          <Card variant="solid">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="text-base font-semibold text-white">Intervention Details</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className={LABEL_CLASS}>Title <span className="text-red-400">*</span></label>
                  <input id="title" type="text" value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className={cn(INPUT_CLASS, errors.title && 'border-red-500')}
                    placeholder="e.g., Small Group Reading Instruction" />
                  {fieldError('title')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="type" className={LABEL_CLASS}>Type</label>
                    <select id="type" value={form.type}
                      onChange={(e) => updateField('type', e.target.value as typeof form.type)}
                      className={INPUT_CLASS}>
                      {INTERVENTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="priority" className={LABEL_CLASS}>Priority</label>
                    <select id="priority" value={form.priority}
                      onChange={(e) => updateField('priority', e.target.value as typeof form.priority)}
                      className={INPUT_CLASS}>
                      {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="description" className={LABEL_CLASS}>Description <span className="text-red-400">*</span></label>
                  <textarea id="description" value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3} className={cn(INPUT_CLASS, errors.description && 'border-red-500')}
                    placeholder="Describe the intervention plan and expected approach..." />
                  {fieldError('description')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Details */}
          <Card variant="solid">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span className="text-base font-semibold text-white">Plan Details</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLASS}>Strategy <span className="text-red-400">*</span></label>
                  <StrategySelector schoolId={schoolId} value={form.strategy}
                    onChange={(value) => updateField('strategy', value)}
                    category={form.type} error={errors.strategy} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="setting" className={LABEL_CLASS}>
                      Setting {form.tier === 3 && <span className="text-red-400">*</span>}
                    </label>
                    <select id="setting" value={form.setting}
                      onChange={(e) => updateField('setting', e.target.value as InterventionSetting)}
                      className={cn(INPUT_CLASS, errors.setting && 'border-red-500')}>
                      {SETTINGS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {fieldError('setting')}
                  </div>
                  <div>
                    <label htmlFor="groupSize" className={LABEL_CLASS}>Group Size</label>
                    <input id="groupSize" type="number" min={1} max={30} value={form.groupSize}
                      onChange={(e) => updateField('groupSize', parseInt(e.target.value) || 1)}
                      className={cn(INPUT_CLASS, errors.groupSize && 'border-red-500')} />
                    {fieldError('groupSize')}
                    <p className="mt-1 text-xs text-slate-500">
                      {form.tier === 2 ? 'Tier 2: Typically 3-6 students' : 'Tier 3: Usually 1 (individualized)'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className={LABEL_CLASS}>Start Date <span className="text-red-400">*</span></label>
                    <input id="startDate" type="date" value={form.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className={cn(INPUT_CLASS, errors.startDate && 'border-red-500')} />
                    {fieldError('startDate')}
                  </div>
                  <div>
                    <label htmlFor="targetEndDate" className={LABEL_CLASS}>Target End Date</label>
                    <input id="targetEndDate" type="date" value={form.targetEndDate}
                      onChange={(e) => updateField('targetEndDate', e.target.value)}
                      className={cn(INPUT_CLASS, errors.targetEndDate && 'border-red-500')} />
                    {fieldError('targetEndDate')}
                  </div>
                </div>
                <div>
                  <label htmlFor="nextReviewDate" className={LABEL_CLASS}>Next Review Date</label>
                  <input id="nextReviewDate" type="date" value={form.nextReviewDate}
                    onChange={(e) => updateField('nextReviewDate', e.target.value)}
                    className={INPUT_CLASS} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier 3 Team & Fidelity */}
          {form.tier === 3 && (
            <Card variant="solid" className="border-rose-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-rose-400" />
                  <span className="text-base font-semibold text-white">Tier 3: Team & Fidelity</span>
                  <Badge variant="destructive" size="sm">Required</Badge>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-rose-400" />Fidelity Tracking
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="fidelityImplementedAsDesigned"
                          checked={form.fidelityImplementedAsDesigned ?? true}
                          onChange={(e) => updateField('fidelityImplementedAsDesigned', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-rose-600 focus:ring-rose-500" />
                        <label htmlFor="fidelityImplementedAsDesigned" className="text-sm text-slate-300">
                          Intervention implemented as designed
                        </label>
                      </div>
                      <div>
                        <label htmlFor="fidelityNotes" className={LABEL_CLASS}>Fidelity Notes</label>
                        <textarea id="fidelityNotes" value={form.fidelityNotes || ''}
                          onChange={(e) => updateField('fidelityNotes', e.target.value)}
                          rows={2} className={INPUT_CLASS}
                          placeholder="Document any deviations from the intervention plan..." />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-rose-400" />Team Members <span className="text-red-400">*</span>
                    </h4>
                    <div className="space-y-3">
                      {(form.teamStaff || []).map((member, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <input type="text" value={member.name}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                            className={cn(INPUT_CLASS, 'flex-1')} placeholder="Name" />
                          <input type="text" value={member.role}
                            onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                            className={cn(INPUT_CLASS, 'flex-1')} placeholder="Role (e.g., Teacher, Counselor)" />
                          <Button type="button" variant="ghost" size="icon"
                            onClick={() => removeTeamMember(index)}
                            className="shrink-0 text-slate-400 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                        <Plus className="w-3 h-3 mr-1" />Add Team Member
                      </Button>
                      {fieldError('teamStaff')}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-400" />Parent/Guardian Contact <span className="text-red-400">*</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="parentContactName" className={LABEL_CLASS}>Name <span className="text-red-400">*</span></label>
                        <input id="parentContactName" type="text" value={form.parentContactName || ''}
                          onChange={(e) => updateField('parentContactName', e.target.value)}
                          className={cn(INPUT_CLASS, errors.parentContactName && 'border-red-500')}
                          placeholder="Parent/guardian name" />
                        {fieldError('parentContactName')}
                      </div>
                      <div>
                        <label htmlFor="parentContactRelationship" className={LABEL_CLASS}>Relationship <span className="text-red-400">*</span></label>
                        <input id="parentContactRelationship" type="text" value={form.parentContactRelationship || ''}
                          onChange={(e) => updateField('parentContactRelationship', e.target.value)}
                          className={cn(INPUT_CLASS, errors.parentContactRelationship && 'border-red-500')}
                          placeholder="e.g., Mother, Father, Guardian" />
                        {fieldError('parentContactRelationship')}
                      </div>
                      <div>
                        <label htmlFor="parentContactPhone" className={LABEL_CLASS}>Phone</label>
                        <input id="parentContactPhone" type="tel" value={form.parentContactPhone || ''}
                          onChange={(e) => updateField('parentContactPhone', e.target.value)}
                          className={INPUT_CLASS} placeholder="(555) 123-4567" />
                      </div>
                      <div>
                        <label htmlFor="parentContactEmail" className={LABEL_CLASS}>Email</label>
                        <input id="parentContactEmail" type="email" value={form.parentContactEmail || ''}
                          onChange={(e) => updateField('parentContactEmail', e.target.value)}
                          className={INPUT_CLASS} placeholder="parent@email.com" />
                      </div>
                      <div>
                        <label htmlFor="parentPreferredContact" className={LABEL_CLASS}>Preferred Contact Method</label>
                        <select id="parentPreferredContact" value={form.parentPreferredContact || ''}
                          onChange={(e) => updateField('parentPreferredContact', e.target.value as typeof form.parentPreferredContact)}
                          className={INPUT_CLASS}>
                          <option value="">Select...</option>
                          {CONTACT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label htmlFor="teamNotes" className={LABEL_CLASS}>Team Notes</label>
                      <textarea id="teamNotes" value={form.teamNotes || ''}
                        onChange={(e) => updateField('teamNotes', e.target.value)}
                        rows={2} className={INPUT_CLASS}
                        placeholder="Additional notes about team coordination..." />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── STEP 3: Goals & Dosage ── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Goals */}
          <Card variant="solid">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-base font-semibold text-white">Goals & Metrics</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="primaryGoalDescription" className={LABEL_CLASS}>
                    Primary Goal <span className="text-red-400">*</span>
                  </label>
                  <input id="primaryGoalDescription" type="text" value={form.primaryGoalDescription}
                    onChange={(e) => updateField('primaryGoalDescription', e.target.value)}
                    className={cn(INPUT_CLASS, errors.primaryGoalDescription && 'border-red-500')}
                    placeholder="e.g., Improve reading fluency from 85 to 120 WPM" />
                  {fieldError('primaryGoalDescription')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="baseline" className={LABEL_CLASS}>Baseline Value</label>
                    <input id="baseline" type="number" value={form.baseline}
                      onChange={(e) => updateField('baseline', parseFloat(e.target.value) || 0)}
                      className={INPUT_CLASS} placeholder="e.g., 85" />
                  </div>
                  <div>
                    <label htmlFor="target" className={LABEL_CLASS}>Target Value</label>
                    <input id="target" type="number" value={form.target}
                      onChange={(e) => updateField('target', parseFloat(e.target.value) || 0)}
                      className={INPUT_CLASS} placeholder="e.g., 120" />
                  </div>
                  <div>
                    <label htmlFor="unit" className={LABEL_CLASS}>Unit</label>
                    <input id="unit" type="text" value={form.unit || '%'}
                      onChange={(e) => updateField('unit', e.target.value)}
                      className={INPUT_CLASS} placeholder="e.g., WPM, %, score" />
                  </div>
                </div>
                <div>
                  <label htmlFor="successCriteria" className={LABEL_CLASS}>Success Criteria <span className="text-slate-500 text-xs">(optional)</span></label>
                  <textarea id="successCriteria" value={form.successCriteria}
                    onChange={(e) => updateField('successCriteria', e.target.value)}
                    rows={2} className={INPUT_CLASS}
                    placeholder="e.g., Student reads at 120+ WPM with 95% accuracy on three consecutive probes" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Monitoring */}
          <Card variant="solid">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span className="text-base font-semibold text-white">Progress Monitoring</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="monitoringTool" className={LABEL_CLASS}>
                      Monitoring Tool <span className="text-red-400">*</span>
                    </label>
                    <input id="monitoringTool" type="text" value={form.monitoringTool}
                      onChange={(e) => updateField('monitoringTool', e.target.value)}
                      className={cn(INPUT_CLASS, errors.monitoringTool && 'border-red-500')}
                      placeholder="e.g., DIBELS, AIMSweb, CBM" />
                    {fieldError('monitoringTool')}
                  </div>
                  <div>
                    <label htmlFor="monitoringFrequency" className={LABEL_CLASS}>
                      Frequency {form.tier === 3 && <span className="text-rose-400 text-xs">(Biweekly min.)</span>}
                    </label>
                    <select id="monitoringFrequency" value={form.monitoringFrequency}
                      onChange={(e) => updateField('monitoringFrequency', e.target.value as MonitoringFrequency)}
                      className={cn(INPUT_CLASS, errors.monitoringFrequency && 'border-red-500')}>
                      {MONITORING_FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}
                          disabled={form.tier === 3 && f.value === 'monthly'}>{f.label}</option>
                      ))}
                    </select>
                    {fieldError('monitoringFrequency')}
                  </div>
                </div>
                <div>
                  <label htmlFor="monitoringNotes" className={LABEL_CLASS}>Notes <span className="text-slate-500 text-xs">(optional)</span></label>
                  <textarea id="monitoringNotes" value={form.monitoringNotes}
                    onChange={(e) => updateField('monitoringNotes', e.target.value)}
                    rows={2} className={INPUT_CLASS}
                    placeholder="Additional notes about progress monitoring procedures..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dosage */}
          <Card variant="solid">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-base font-semibold text-white">Dosage Plan</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">How frequently and for how long the intervention will be delivered.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="sessionsPerWeek" className={LABEL_CLASS}>Sessions / Week</label>
                    <input id="sessionsPerWeek" type="number" min={1} max={7} value={form.sessionsPerWeek}
                      onChange={(e) => updateField('sessionsPerWeek', parseInt(e.target.value) || 1)}
                      className={cn(INPUT_CLASS, errors.sessionsPerWeek && 'border-red-500')} />
                    {fieldError('sessionsPerWeek')}
                  </div>
                  <div>
                    <label htmlFor="minutesPerSession" className={LABEL_CLASS}>Minutes / Session</label>
                    <input id="minutesPerSession" type="number" min={5} max={180} value={form.minutesPerSession}
                      onChange={(e) => updateField('minutesPerSession', parseInt(e.target.value) || 5)}
                      className={cn(INPUT_CLASS, errors.minutesPerSession && 'border-red-500')} />
                    {fieldError('minutesPerSession')}
                  </div>
                  <div>
                    <label htmlFor="totalWeeks" className={LABEL_CLASS}>Total Weeks</label>
                    <input id="totalWeeks" type="number" min={1} max={52} value={form.totalWeeks}
                      onChange={(e) => updateField('totalWeeks', parseInt(e.target.value) || 1)}
                      className={cn(INPUT_CLASS, errors.totalWeeks && 'border-red-500')} />
                    {fieldError('totalWeeks')}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3">
                  <p className="text-sm text-slate-300">
                    Total dosage:{' '}
                    <span className="font-semibold text-white">{derivedDosage.totalSessions} sessions</span>{' '}
                    over <span className="font-semibold text-white">{form.totalWeeks} weeks</span>
                    {' ('}
                    {derivedDosage.totalMinutes.toLocaleString()} total minutes
                    {')'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customization (optional, collapsed by default) */}
          <Card variant="solid" className={cn(form.customizationEnabled && 'border-indigo-500/30')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-400" />
                  <span className="text-base font-semibold text-white">Customize Intervention</span>
                  <span className="text-xs text-slate-500">(optional)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.customizationEnabled}
                    onChange={(e) => updateField('customizationEnabled', e.target.checked)}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              {form.customizationEnabled && (
                <div className="space-y-6 pt-4 border-t border-slate-700">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Custom Fields</h4>
                    <div className="space-y-2">
                      {(form.customFields || []).map((field, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <input type="text" value={field.key}
                            onChange={(e) => {
                              const f = [...(form.customFields || [])];
                              f[index] = { ...f[index], key: e.target.value };
                              updateField('customFields', f);
                            }}
                            className={cn(INPUT_CLASS, 'w-1/3')} placeholder="Field name" />
                          <input type="text" value={field.value as string}
                            onChange={(e) => {
                              const f = [...(form.customFields || [])];
                              f[index] = { ...f[index], value: e.target.value };
                              updateField('customFields', f);
                            }}
                            className={cn(INPUT_CLASS, 'flex-1')} placeholder="Value" />
                          <Button type="button" variant="ghost" size="icon"
                            onClick={() => removeCustomField(index)}
                            className="shrink-0 text-slate-400 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                        <Plus className="w-3 h-3 mr-1" />Add Custom Field
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Dosage Overrides</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="overrideTotalSessions" className={LABEL_CLASS}>Override Total Sessions</label>
                        <input id="overrideTotalSessions" type="number" value={form.overrideTotalSessions || ''}
                          onChange={(e) => updateField('overrideTotalSessions', e.target.value ? parseInt(e.target.value) : undefined)}
                          className={INPUT_CLASS} placeholder={`Calculated: ${derivedDosage.calculatedTotalSessions}`} />
                      </div>
                      <div>
                        <label htmlFor="overrideTotalMinutes" className={LABEL_CLASS}>Override Total Minutes</label>
                        <input id="overrideTotalMinutes" type="number" value={form.overrideTotalMinutes || ''}
                          onChange={(e) => updateField('overrideTotalMinutes', e.target.value ? parseInt(e.target.value) : undefined)}
                          className={INPUT_CLASS} placeholder={`Calculated: ${derivedDosage.calculatedTotalMinutes}`} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="extendedNotes" className={LABEL_CLASS}>Extended Notes</label>
                    <textarea id="extendedNotes" value={form.extendedNotes || ''}
                      onChange={(e) => updateField('extendedNotes', e.target.value)}
                      rows={4} className={INPUT_CLASS}
                      placeholder="Additional documentation, observations, or context..." />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700">
        <Button type="button" variant="secondary" size="lg"
          onClick={step === 1 ? onCancel : goBack}>
          {step === 1 ? 'Cancel' : '← Back'}
        </Button>
        {step < 3 ? (
          <Button type="button" size="lg" onClick={goNext}>
            Next →
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : mode === 'create' ? 'Create Intervention' : 'Save Changes'}
          </Button>
        )}
      </div>
    </form>
  );
}

export default MTSSInterventionForm;