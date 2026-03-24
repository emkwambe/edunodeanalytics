'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Settings2,
  Users,
  Target,
  Clock,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  UserCheck,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StrategySelector } from './strategy-selector';
import { cn } from '@/lib/utils';
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
  { value: 'community', label: 'Community' },
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

// ---------------------------------------------------------------------------
// Validation Errors Type
// ---------------------------------------------------------------------------

interface ValidationErrors {
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MTSSInterventionForm({
  schoolId,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
}: MTSSInterventionFormProps) {
  // Form state
  const [form, setForm] = useState<MTSSInterventionFormState>({
    ...DEFAULT_MTSS_FORM_STATE,
    ...initialValues,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    plan: true,
    goals: true,
    monitoring: true,
    dosage: true,
    tier3: form.tier === 3,
    customization: false,
  });

  // Update field helper
  const updateField = useCallback(<K extends keyof MTSSInterventionFormState>(
    key: K,
    value: MTSSInterventionFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [errors]);

  // Handle tier change - apply defaults
  const handleTierChange = useCallback((newTier: InterventionTier) => {
    const defaults = newTier === 3 ? TIER_3_DEFAULTS : TIER_2_DEFAULTS;
    setForm((prev) => ({
      ...prev,
      tier: newTier,
      groupSize: defaults.groupSize,
      monitoringFrequency: defaults.monitoringFrequency,
      setting: defaults.setting,
      // Initialize Tier 3 fields if needed
      ...(newTier === 3 && {
        fidelityImplementedAsDesigned: true,
        teamStaff: prev.teamStaff || [],
      }),
    }));
    // Expand Tier 3 section when Tier 3 is selected
    setExpandedSections((prev) => ({ ...prev, tier3: newTier === 3 }));
  }, []);

  // Calculate derived dosage values
  const derivedDosage = useMemo(() => {
    return calculateDosage(
      form.sessionsPerWeek,
      form.minutesPerSession,
      form.totalWeeks,
      form.customizationEnabled
        ? {
            totalSessions: form.overrideTotalSessions,
            totalMinutes: form.overrideTotalMinutes,
          }
        : undefined
    );
  }, [
    form.sessionsPerWeek,
    form.minutesPerSession,
    form.totalWeeks,
    form.customizationEnabled,
    form.overrideTotalSessions,
    form.overrideTotalMinutes,
  ]);

  // Get required fields based on tier
  const _requiredFields = useMemo(() => getTierRequiredFields(form.tier), [form.tier]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Validate form
  const validate = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Required fields
    if (!form.studentId) errors.studentId = 'Please select a student.';
    if (!form.title.trim()) errors.title = 'Title is required.';
    if (!form.description.trim()) errors.description = 'Description is required.';
    if (!form.strategy) errors.strategy = 'Strategy is required.';
    if (!form.startDate) errors.startDate = 'Start date is required.';
    if (!form.primaryGoalDescription.trim()) errors.primaryGoalDescription = 'Goal description is required.';
    if (!form.monitoringTool.trim()) errors.monitoringTool = 'Monitoring tool is required.';

    // Date validation
    if (form.startDate && form.targetEndDate && form.targetEndDate < form.startDate) {
      errors.targetEndDate = 'Target end date must be after start date.';
    }

    // Dosage validation
    if (form.sessionsPerWeek < 1 || form.sessionsPerWeek > 7) {
      errors.sessionsPerWeek = 'Sessions per week must be between 1 and 7.';
    }
    if (form.minutesPerSession < 5 || form.minutesPerSession > 180) {
      errors.minutesPerSession = 'Minutes per session must be between 5 and 180.';
    }
    if (form.totalWeeks < 1 || form.totalWeeks > 52) {
      errors.totalWeeks = 'Total weeks must be between 1 and 52.';
    }

    // Tier 3 specific validations
    if (form.tier === 3) {
      if (!form.setting) {
        errors.setting = 'Setting is required for Tier 3 interventions.';
      }
      if (!form.teamStaff || form.teamStaff.length === 0) {
        errors.teamStaff = 'At least one team member is required for Tier 3.';
      }
      if (!form.parentContactName?.trim()) {
        errors.parentContactName = 'Parent/guardian contact is required for Tier 3.';
      }
      if (!form.parentContactRelationship?.trim()) {
        errors.parentContactRelationship = 'Relationship is required.';
      }
      // Biweekly minimum for Tier 3
      if (form.monitoringFrequency === 'monthly') {
        errors.monitoringFrequency = 'Tier 3 requires at least biweekly progress monitoring.';
      }
    }

    // Tier 2 group size check
    if (form.tier === 2 && form.groupSize > 8) {
      errors.groupSize = 'Tier 2 small groups typically have 8 or fewer students.';
    }

    return errors;
  }, [form]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Find first error and scroll to it
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorKey);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    await onSubmit(form);
  };

  // Add team member
  const addTeamMember = () => {
    const newMember: TeamMember = { name: '', role: '' };
    setForm((prev) => ({
      ...prev,
      teamStaff: [...(prev.teamStaff || []), newMember],
    }));
  };

  // Remove team member
  const removeTeamMember = (index: number) => {
    setForm((prev) => ({
      ...prev,
      teamStaff: prev.teamStaff?.filter((_, i) => i !== index),
    }));
  };

  // Update team member
  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setForm((prev) => ({
      ...prev,
      teamStaff: prev.teamStaff?.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  // Add custom field
  const addCustomField = () => {
    const newField: CustomField = { key: '', value: '', type: 'text' };
    setForm((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
  };

  // Remove custom field
  const removeCustomField = (index: number) => {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields?.filter((_, i) => i !== index),
    }));
  };

  // Error display helper
  const fieldError = (key: string) =>
    submitted && errors[key] ? (
      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {errors[key]}
      </p>
    ) : null;

  // Section header helper
  const SectionHeader = ({
    icon,
    title,
    section,
    badge,
  }: {
    icon: React.ReactNode;
    title: string;
    section: string;
    badge?: string;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-2"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-base font-semibold text-white">{title}</span>
        {badge && (
          <Badge variant="warning" size="sm">
            {badge}
          </Badge>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                    ? tier.value === 3
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{tier.label}</span>
                  {form.tier === tier.value && (
                    <Badge
                      variant={tier.value === 3 ? 'destructive' : 'warning'}
                      size="sm"
                    >
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400">{tier.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intervention Details */}
      <Card variant="solid">
        <CardContent className="pt-6">
          <SectionHeader
            icon={<FileText className="w-5 h-5 text-indigo-400" />}
            title="Intervention Details"
            section="details"
          />
          {expandedSections.details && (
            <div className="space-y-4 mt-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className={LABEL_CLASS}>
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={cn(INPUT_CLASS, errors.title && 'border-red-500')}
                  placeholder="e.g., Small Group Reading Instruction"
                />
                {fieldError('title')}
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className={LABEL_CLASS}>
                    Type
                  </label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => updateField('type', e.target.value as typeof form.type)}
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
                    onChange={(e) => updateField('priority', e.target.value as typeof form.priority)}
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

              {/* Description */}
              <div>
                <label htmlFor="description" className={LABEL_CLASS}>
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className={cn(INPUT_CLASS, errors.description && 'border-red-500')}
                  placeholder="Describe the intervention plan, strategies, and expected approach..."
                />
                {fieldError('description')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Details */}
      <Card variant="solid">
        <CardContent className="pt-6">
          <SectionHeader
            icon={<Calendar className="w-5 h-5 text-cyan-400" />}
            title="Plan Details"
            section="plan"
          />
          {expandedSections.plan && (
            <div className="space-y-4 mt-4">
              {/* Strategy */}
              <div>
                <label className={LABEL_CLASS}>
                  Strategy <span className="text-red-400">*</span>
                </label>
                <StrategySelector
                  schoolId={schoolId}
                  value={form.strategy}
                  onChange={(value) => updateField('strategy', value)}
                  category={form.type}
                  error={submitted ? errors.strategy : undefined}
                />
              </div>

              {/* Setting & Group Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="setting" className={LABEL_CLASS}>
                    Setting {form.tier === 3 && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    id="setting"
                    value={form.setting}
                    onChange={(e) => updateField('setting', e.target.value as InterventionSetting)}
                    className={cn(INPUT_CLASS, errors.setting && 'border-red-500')}
                  >
                    {SETTINGS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {fieldError('setting')}
                </div>
                <div>
                  <label htmlFor="groupSize" className={LABEL_CLASS}>
                    Group Size
                  </label>
                  <input
                    id="groupSize"
                    type="number"
                    min={1}
                    max={30}
                    value={form.groupSize}
                    onChange={(e) => updateField('groupSize', parseInt(e.target.value) || 1)}
                    className={cn(INPUT_CLASS, errors.groupSize && 'border-red-500')}
                  />
                  {fieldError('groupSize')}
                  <p className="mt-1 text-xs text-slate-500">
                    {form.tier === 2 ? 'Tier 2: Typically 3-6 students' : 'Tier 3: Usually 1 (individualized)'}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className={LABEL_CLASS}>
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className={cn(INPUT_CLASS, errors.startDate && 'border-red-500')}
                  />
                  {fieldError('startDate')}
                </div>
                <div>
                  <label htmlFor="targetEndDate" className={LABEL_CLASS}>
                    Target End Date
                  </label>
                  <input
                    id="targetEndDate"
                    type="date"
                    value={form.targetEndDate}
                    onChange={(e) => updateField('targetEndDate', e.target.value)}
                    className={cn(INPUT_CLASS, errors.targetEndDate && 'border-red-500')}
                  />
                  {fieldError('targetEndDate')}
                </div>
              </div>

              {/* Next Review Date */}
              <div>
                <label htmlFor="nextReviewDate" className={LABEL_CLASS}>
                  Next Review Date
                </label>
                <input
                  id="nextReviewDate"
                  type="date"
                  value={form.nextReviewDate}
                  onChange={(e) => updateField('nextReviewDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals & Metrics */}
      <Card variant="solid">
        <CardContent className="pt-6">
          <SectionHeader
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
            title="Goals & Metrics"
            section="goals"
          />
          {expandedSections.goals && (
            <div className="space-y-4 mt-4">
              {/* Primary Goal */}
              <div>
                <label htmlFor="primaryGoalDescription" className={LABEL_CLASS}>
                  Primary Goal <span className="text-red-400">*</span>
                </label>
                <input
                  id="primaryGoalDescription"
                  type="text"
                  value={form.primaryGoalDescription}
                  onChange={(e) => updateField('primaryGoalDescription', e.target.value)}
                  className={cn(INPUT_CLASS, errors.primaryGoalDescription && 'border-red-500')}
                  placeholder="e.g., Improve reading fluency from 85 to 120 WPM"
                />
                {fieldError('primaryGoalDescription')}
              </div>

              {/* Baseline, Target, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="baseline" className={LABEL_CLASS}>
                    Baseline Value
                  </label>
                  <input
                    id="baseline"
                    type="number"
                    value={form.baseline}
                    onChange={(e) => updateField('baseline', parseFloat(e.target.value) || 0)}
                    className={INPUT_CLASS}
                    placeholder="e.g., 85"
                  />
                </div>
                <div>
                  <label htmlFor="target" className={LABEL_CLASS}>
                    Target Value
                  </label>
                  <input
                    id="target"
                    type="number"
                    value={form.target}
                    onChange={(e) => updateField('target', parseFloat(e.target.value) || 0)}
                    className={INPUT_CLASS}
                    placeholder="e.g., 120"
                  />
                </div>
                <div>
                  <label htmlFor="unit" className={LABEL_CLASS}>
                    Unit
                  </label>
                  <input
                    id="unit"
                    type="text"
                    value={form.unit}
                    onChange={(e) => updateField('unit', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="e.g., WPM, %, score"
                  />
                </div>
              </div>

              {/* Success Criteria */}
              <div>
                <label htmlFor="successCriteria" className={LABEL_CLASS}>
                  Success Criteria
                </label>
                <textarea
                  id="successCriteria"
                  value={form.successCriteria}
                  onChange={(e) => updateField('successCriteria', e.target.value)}
                  rows={2}
                  className={INPUT_CLASS}
                  placeholder="e.g., Student reads at 120+ WPM with 95% accuracy on three consecutive probes"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Monitoring */}
      <Card variant="solid">
        <CardContent className="pt-6">
          <SectionHeader
            icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
            title="Progress Monitoring"
            section="monitoring"
          />
          {expandedSections.monitoring && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="monitoringTool" className={LABEL_CLASS}>
                    Monitoring Tool <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="monitoringTool"
                    type="text"
                    value={form.monitoringTool}
                    onChange={(e) => updateField('monitoringTool', e.target.value)}
                    className={cn(INPUT_CLASS, errors.monitoringTool && 'border-red-500')}
                    placeholder="e.g., DIBELS, AIMSweb, CBM"
                  />
                  {fieldError('monitoringTool')}
                </div>
                <div>
                  <label htmlFor="monitoringFrequency" className={LABEL_CLASS}>
                    Frequency {form.tier === 3 && <span className="text-rose-400">(Biweekly min.)</span>}
                  </label>
                  <select
                    id="monitoringFrequency"
                    value={form.monitoringFrequency}
                    onChange={(e) => updateField('monitoringFrequency', e.target.value as MonitoringFrequency)}
                    className={cn(INPUT_CLASS, errors.monitoringFrequency && 'border-red-500')}
                  >
                    {MONITORING_FREQUENCIES.map((f) => (
                      <option
                        key={f.value}
                        value={f.value}
                        disabled={form.tier === 3 && f.value === 'monthly'}
                      >
                        {f.label}
                      </option>
                    ))}
                  </select>
                  {fieldError('monitoringFrequency')}
                </div>
              </div>

              <div>
                <label htmlFor="monitoringNotes" className={LABEL_CLASS}>
                  Notes
                </label>
                <textarea
                  id="monitoringNotes"
                  value={form.monitoringNotes}
                  onChange={(e) => updateField('monitoringNotes', e.target.value)}
                  rows={2}
                  className={INPUT_CLASS}
                  placeholder="Additional notes about progress monitoring procedures..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showProgressGraph"
                  checked={form.showProgressGraph}
                  onChange={(e) => updateField('showProgressGraph', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="showProgressGraph" className="text-sm text-slate-300">
                  Display progress graph on intervention dashboard
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dosage Plan */}
      <Card variant="solid">
        <CardContent className="pt-6">
          <SectionHeader
            icon={<Clock className="w-5 h-5 text-purple-400" />}
            title="Dosage Plan"
            section="dosage"
          />
          {expandedSections.dosage && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-slate-400 -mt-2">
                Define how frequently and for how long the intervention will be delivered.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="sessionsPerWeek" className={LABEL_CLASS}>
                    Sessions / Week
                  </label>
                  <input
                    id="sessionsPerWeek"
                    type="number"
                    min={1}
                    max={7}
                    value={form.sessionsPerWeek}
                    onChange={(e) => updateField('sessionsPerWeek', parseInt(e.target.value) || 1)}
                    className={cn(INPUT_CLASS, errors.sessionsPerWeek && 'border-red-500')}
                  />
                  {fieldError('sessionsPerWeek')}
                </div>
                <div>
                  <label htmlFor="minutesPerSession" className={LABEL_CLASS}>
                    Minutes / Session
                  </label>
                  <input
                    id="minutesPerSession"
                    type="number"
                    min={5}
                    max={180}
                    value={form.minutesPerSession}
                    onChange={(e) => updateField('minutesPerSession', parseInt(e.target.value) || 5)}
                    className={cn(INPUT_CLASS, errors.minutesPerSession && 'border-red-500')}
                  />
                  {fieldError('minutesPerSession')}
                </div>
                <div>
                  <label htmlFor="totalWeeks" className={LABEL_CLASS}>
                    Total Weeks
                  </label>
                  <input
                    id="totalWeeks"
                    type="number"
                    min={1}
                    max={52}
                    value={form.totalWeeks}
                    onChange={(e) => updateField('totalWeeks', parseInt(e.target.value) || 1)}
                    className={cn(INPUT_CLASS, errors.totalWeeks && 'border-red-500')}
                  />
                  {fieldError('totalWeeks')}
                </div>
              </div>

              {/* Dosage Summary */}
              <div className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3">
                <div className="text-sm text-slate-300">
                  Total dosage:{' '}
                  <span className="font-semibold text-white">
                    {derivedDosage.totalSessions} sessions
                  </span>{' '}
                  over <span className="font-semibold text-white">{form.totalWeeks} weeks</span>
                  {' ('}
                  {derivedDosage.totalMinutes.toLocaleString()} total minutes
                  {')'}
                </div>
                {derivedDosage.isOverridden && (
                  <p className="text-xs text-amber-400 mt-1">
                    Calculated values have been overridden.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier 3 Specific: Fidelity & Team */}
      {form.tier === 3 && (
        <Card variant="solid" className="border-rose-500/30">
          <CardContent className="pt-6">
            <SectionHeader
              icon={<Users className="w-5 h-5 text-rose-400" />}
              title="Tier 3: Team & Fidelity"
              section="tier3"
              badge="Required"
            />
            {expandedSections.tier3 && (
              <div className="space-y-6 mt-4">
                {/* Fidelity Tracking */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-rose-400" />
                    Fidelity Tracking
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="fidelityImplementedAsDesigned"
                        checked={form.fidelityImplementedAsDesigned ?? true}
                        onChange={(e) => updateField('fidelityImplementedAsDesigned', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-rose-600 focus:ring-rose-500"
                      />
                      <label htmlFor="fidelityImplementedAsDesigned" className="text-sm text-slate-300">
                        Intervention implemented as designed
                      </label>
                    </div>
                    <div>
                      <label htmlFor="fidelityNotes" className={LABEL_CLASS}>
                        Fidelity Notes
                      </label>
                      <textarea
                        id="fidelityNotes"
                        value={form.fidelityNotes || ''}
                        onChange={(e) => updateField('fidelityNotes', e.target.value)}
                        rows={2}
                        className={INPUT_CLASS}
                        placeholder="Document any deviations from the intervention plan..."
                      />
                    </div>
                  </div>
                </div>

                {/* Team Involvement */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-rose-400" />
                    Team Members <span className="text-red-400">*</span>
                  </h4>
                  <div className="space-y-3">
                    {(form.teamStaff || []).map((member, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                          className={cn(INPUT_CLASS, 'flex-1')}
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                          className={cn(INPUT_CLASS, 'flex-1')}
                          placeholder="Role (e.g., Teacher, Counselor)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMember(index)}
                          className="shrink-0 text-slate-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Team Member
                    </Button>
                    {fieldError('teamStaff')}
                  </div>
                </div>

                {/* Parent Contact */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-400" />
                    Parent/Guardian Contact <span className="text-red-400">*</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="parentContactName" className={LABEL_CLASS}>
                        Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="parentContactName"
                        type="text"
                        value={form.parentContactName || ''}
                        onChange={(e) => updateField('parentContactName', e.target.value)}
                        className={cn(INPUT_CLASS, errors.parentContactName && 'border-red-500')}
                        placeholder="Parent/guardian name"
                      />
                      {fieldError('parentContactName')}
                    </div>
                    <div>
                      <label htmlFor="parentContactRelationship" className={LABEL_CLASS}>
                        Relationship <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="parentContactRelationship"
                        type="text"
                        value={form.parentContactRelationship || ''}
                        onChange={(e) => updateField('parentContactRelationship', e.target.value)}
                        className={cn(INPUT_CLASS, errors.parentContactRelationship && 'border-red-500')}
                        placeholder="e.g., Mother, Father, Guardian"
                      />
                      {fieldError('parentContactRelationship')}
                    </div>
                    <div>
                      <label htmlFor="parentContactPhone" className={LABEL_CLASS}>
                        Phone
                      </label>
                      <input
                        id="parentContactPhone"
                        type="tel"
                        value={form.parentContactPhone || ''}
                        onChange={(e) => updateField('parentContactPhone', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="parentContactEmail" className={LABEL_CLASS}>
                        Email
                      </label>
                      <input
                        id="parentContactEmail"
                        type="email"
                        value={form.parentContactEmail || ''}
                        onChange={(e) => updateField('parentContactEmail', e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="parent@email.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="parentPreferredContact" className={LABEL_CLASS}>
                        Preferred Contact Method
                      </label>
                      <select
                        id="parentPreferredContact"
                        value={form.parentPreferredContact || ''}
                        onChange={(e) =>
                          updateField('parentPreferredContact', e.target.value as typeof form.parentPreferredContact)
                        }
                        className={INPUT_CLASS}
                      >
                        <option value="">Select...</option>
                        {CONTACT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="teamNotes" className={LABEL_CLASS}>
                      Team Notes
                    </label>
                    <textarea
                      id="teamNotes"
                      value={form.teamNotes || ''}
                      onChange={(e) => updateField('teamNotes', e.target.value)}
                      rows={2}
                      className={INPUT_CLASS}
                      placeholder="Additional notes about team coordination..."
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customization Toggle */}
      <Card variant="solid" className={cn(form.customizationEnabled && 'border-indigo-500/30')}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              <span className="text-base font-semibold text-white">Customize Intervention</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.customizationEnabled}
                onChange={(e) => updateField('customizationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {form.customizationEnabled && (
            <div className="space-y-6 mt-4 pt-4 border-t border-slate-700">
              {/* Custom Fields */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Custom Fields</h4>
                <div className="space-y-2">
                  {(form.customFields || []).map((field, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => {
                          const newFields = [...(form.customFields || [])];
                          newFields[index] = { ...newFields[index], key: e.target.value };
                          updateField('customFields', newFields);
                        }}
                        className={cn(INPUT_CLASS, 'w-1/3')}
                        placeholder="Field name"
                      />
                      <input
                        type="text"
                        value={field.value as string}
                        onChange={(e) => {
                          const newFields = [...(form.customFields || [])];
                          newFields[index] = { ...newFields[index], value: e.target.value };
                          updateField('customFields', newFields);
                        }}
                        className={cn(INPUT_CLASS, 'flex-1')}
                        placeholder="Value"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomField(index)}
                        className="shrink-0 text-slate-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Custom Field
                  </Button>
                </div>
              </div>

              {/* Dosage Overrides */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Dosage Overrides</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="overrideTotalSessions" className={LABEL_CLASS}>
                      Override Total Sessions
                    </label>
                    <input
                      id="overrideTotalSessions"
                      type="number"
                      value={form.overrideTotalSessions || ''}
                      onChange={(e) =>
                        updateField('overrideTotalSessions', e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      className={INPUT_CLASS}
                      placeholder={`Calculated: ${derivedDosage.calculatedTotalSessions}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="overrideTotalMinutes" className={LABEL_CLASS}>
                      Override Total Minutes
                    </label>
                    <input
                      id="overrideTotalMinutes"
                      type="number"
                      value={form.overrideTotalMinutes || ''}
                      onChange={(e) =>
                        updateField('overrideTotalMinutes', e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      className={INPUT_CLASS}
                      placeholder={`Calculated: ${derivedDosage.calculatedTotalMinutes}`}
                    />
                  </div>
                </div>
              </div>

              {/* Extended Notes */}
              <div>
                <label htmlFor="extendedNotes" className={LABEL_CLASS}>
                  Extended Notes
                </label>
                <textarea
                  id="extendedNotes"
                  value={form.extendedNotes || ''}
                  onChange={(e) => updateField('extendedNotes', e.target.value)}
                  rows={4}
                  className={INPUT_CLASS}
                  placeholder="Additional documentation, observations, or context..."
                />
              </div>

              {/* File URLs */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Supporting File URLs</h4>
                <p className="text-xs text-slate-400 mb-2">
                  Add URLs to supporting documents (stored externally).
                </p>
                <div className="space-y-2">
                  {(form.supportingFileUrls || []).map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...(form.supportingFileUrls || [])];
                          newUrls[index] = e.target.value;
                          updateField('supportingFileUrls', newUrls);
                        }}
                        className={cn(INPUT_CLASS, 'flex-1')}
                        placeholder="https://..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newUrls = (form.supportingFileUrls || []).filter((_, i) => i !== index);
                          updateField('supportingFileUrls', newUrls);
                        }}
                        className="shrink-0 text-slate-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateField('supportingFileUrls', [...(form.supportingFileUrls || []), ''])}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add File URL
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">...</span>
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : mode === 'create' ? (
            'Create Intervention'
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default MTSSInterventionForm;
