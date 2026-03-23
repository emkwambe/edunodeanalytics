'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { MTSSInterventionForm } from '@/components/interventions';
import type { MTSSInterventionFormState, MTSSInterventionMetadata } from '@/lib/mtss/types';
import { calculateDosage } from '@/lib/mtss/validation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

  // Selected student state (step 1)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentError, setStudentError] = useState<string>('');

  // Mutation hook
  const { createIntervention, isCreating } = useCreateIntervention(schoolId ?? '');

  // Get selected student info
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Handle MTSS form submission
  const handleFormSubmit = useCallback(async (formData: MTSSInterventionFormState) => {
    if (!schoolId) {
      toast.error('School not found', 'Unable to resolve the current school.');
      return;
    }

    // Build the enhanced metadata structure
    const dosage = calculateDosage(
      formData.sessionsPerWeek,
      formData.minutesPerSession,
      formData.totalWeeks,
      formData.customizationEnabled
        ? { totalSessions: formData.overrideTotalSessions, totalMinutes: formData.overrideTotalMinutes }
        : undefined
    );

    const metadata: MTSSInterventionMetadata = {
      tier: formData.tier,
      groupSize: formData.groupSize,
      strategy: formData.strategy,
      setting: formData.setting,
      primaryGoal: {
        description: formData.primaryGoalDescription,
        baseline: formData.baseline,
        target: formData.target,
        unit: formData.unit,
        successCriteria: formData.successCriteria,
      },
      progressMonitoring: {
        tool: formData.monitoringTool,
        frequency: formData.monitoringFrequency,
        notes: formData.monitoringNotes,
        showGraph: formData.showProgressGraph,
      },
      dosagePlan: {
        sessionsPerWeek: formData.sessionsPerWeek,
        minutesPerSession: formData.minutesPerSession,
        totalWeeks: formData.totalWeeks,
        totalSessions: dosage.totalSessions,
        totalMinutes: dosage.totalMinutes,
      },
      nextReviewDate: formData.nextReviewDate || undefined,
    };

    // Tier 3 specific fields
    if (formData.tier === 3) {
      metadata.fidelityTracking = {
        implementedAsDesigned: formData.fidelityImplementedAsDesigned ?? true,
        missedSessions: 0,
        notes: formData.fidelityNotes,
      };
      metadata.teamInvolvement = {
        staffList: formData.teamStaff || [],
        parentContact: {
          name: formData.parentContactName || '',
          relationship: formData.parentContactRelationship || '',
          phone: formData.parentContactPhone,
          email: formData.parentContactEmail,
          preferredContactMethod: formData.parentPreferredContact,
        },
        notes: formData.teamNotes,
      };
    }

    // Customization
    if (formData.customizationEnabled) {
      metadata.customization = {
        enabled: true,
        customFields: formData.customFields,
        extendedNotes: formData.extendedNotes,
        dosageOverrides: {
          totalSessions: formData.overrideTotalSessions,
          totalMinutes: formData.overrideTotalMinutes,
        },
      };
    }

    try {
      await createIntervention({
        student_id: selectedStudentId,
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.startDate || undefined,
        target_end_date: formData.targetEndDate || undefined,
        goal: formData.primaryGoalDescription.trim() || undefined,
        success_criteria: formData.successCriteria.trim() || undefined,
        baseline_value: formData.baseline || undefined,
        target_value: formData.target || undefined,
        metadata,
      } as Record<string, unknown>);

      toast.success('Intervention created', `"${formData.title}" has been created successfully.`);
      router.push(`/${schoolSlug}/interventions`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error('Failed to create intervention', message);
    }
  }, [schoolId, selectedStudentId, createIntervention, toast, router, schoolSlug]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(`/${schoolSlug}/interventions`);
  }, [router, schoolSlug]);

  // Handle student selection
  const handleStudentSelect = useCallback((id: string) => {
    setSelectedStudentId(id);
    setStudentError('');
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageFeatureGate featureKey="intervention_hub">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
            <h1 className="text-3xl font-black text-white">New MTSS Intervention</h1>
            <p className="text-slate-400 mt-1">
              Create a Tier 2 or Tier 3 intervention with comprehensive planning and monitoring.
            </p>
          </div>
        </div>

        {isLoadingSchool ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="ml-2 text-slate-400">Loading school data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Student Selection */}
            <Card variant="solid">
              <CardContent className="pt-6">
                <fieldset>
                  <legend className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-400" />
                    Select Student
                  </legend>

                  <div>
                    <label className={LABEL_CLASS}>Student <span className="text-red-400">*</span></label>
                    <StudentSelector
                      students={students}
                      selectedId={selectedStudentId}
                      onSelect={handleStudentSelect}
                    />
                    {studentError && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {studentError}
                      </p>
                    )}
                  </div>

                  {/* Selected student info */}
                  {selectedStudent && (
                    <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-white">{selectedStudent.displayName}</span>
                          <span className="text-xs text-slate-500 ml-2">Grade {selectedStudent.gradeLevel}</span>
                        </div>
                        <Badge variant={RISK_BADGE_VARIANT[selectedStudent.riskLevel]} size="sm">
                          {formatRiskLevel(selectedStudent.riskLevel)}
                        </Badge>
                      </div>
                      {(selectedStudent.hasIep || selectedStudent.has504Plan) && (
                        <div className="mt-2 flex gap-2">
                          {selectedStudent.hasIep && (
                            <Badge variant="primary" size="sm">IEP</Badge>
                          )}
                          {selectedStudent.has504Plan && (
                            <Badge variant="secondary" size="sm">504</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </fieldset>
              </CardContent>
            </Card>

            {/* Step 2: MTSS Intervention Form (shown after student selection) */}
            {selectedStudentId ? (
              <MTSSInterventionForm
                schoolId={schoolId}
                initialValues={{ studentId: selectedStudentId }}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isSubmitting={isCreating}
                mode="create"
              />
            ) : (
              <Card variant="solid" className="border-dashed border-slate-600">
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-400 mb-2">Select a Student First</h3>
                  <p className="text-sm text-slate-500">
                    Choose a student above to begin creating the intervention plan.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageFeatureGate>
  );
}
