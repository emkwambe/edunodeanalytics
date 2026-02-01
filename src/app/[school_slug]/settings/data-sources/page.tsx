'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  harmonizeLMSSchema,
  type SchemaMapping,
} from '@/lib/ai/edunode-advisor';
import {
  Database,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Zap,
  RefreshCw,
  ChevronLeft,
  Upload,
  FileJson,
  Link2,
  Eye,
  Save,
  ExternalLink,
  BrainCircuit,
  Wand2,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';

/**
 * AI Schema Harmonization Page
 *
 * Helps schools map their LMS data fields to EduNode's expected schema.
 * Uses AI to suggest intelligent field mappings based on field names and sample data.
 *
 * Supported LMS Platforms:
 * - Canvas
 * - Schoology
 * - Google Classroom
 * - PowerSchool
 * - Infinite Campus
 */

type LMSPlatform = 'canvas' | 'schoology' | 'google_classroom' | 'powerschool' | 'infinite_campus' | 'custom';

const LMS_PLATFORMS: { id: LMSPlatform; name: string; icon: string; fields: string[] }[] = [
  {
    id: 'canvas',
    name: 'Canvas LMS',
    icon: 'C',
    fields: ['user_id', 'course_id', 'assignment_score', 'submission_date', 'grade_level', 'enrollment_status'],
  },
  {
    id: 'schoology',
    name: 'Schoology',
    icon: 'S',
    fields: ['uid', 'section_id', 'grade', 'due_date', 'grading_period', 'student_grade'],
  },
  {
    id: 'google_classroom',
    name: 'Google Classroom',
    icon: 'G',
    fields: ['studentId', 'courseId', 'assignmentGrade', 'dueDate', 'gradeCategory', 'enrollmentCode'],
  },
  {
    id: 'powerschool',
    name: 'PowerSchool',
    icon: 'P',
    fields: ['DCID', 'SectionID', 'Score', 'AssignedDate', 'GradeLevel', 'EnrollmentStatus'],
  },
  {
    id: 'infinite_campus',
    name: 'Infinite Campus',
    icon: 'IC',
    fields: ['personID', 'sectionID', 'scorePoints', 'assignDate', 'gradeNum', 'activeStatus'],
  },
  {
    id: 'custom',
    name: 'Custom/Other',
    icon: '?',
    fields: [],
  },
];

// EduNode's expected schema fields
const EDUNODE_SCHEMA = [
  { field: 'student_id', description: 'Unique student identifier', required: true },
  { field: 'course_id', description: 'Course or section identifier', required: true },
  { field: 'assessment_score', description: 'Numerical score (0-100)', required: true },
  { field: 'assessment_date', description: 'Date of assessment (ISO 8601)', required: true },
  { field: 'grade_level', description: 'Student grade (K-12)', required: true },
  { field: 'enrollment_status', description: 'Active/Inactive/Withdrawn', required: false },
  { field: 'teacher_id', description: 'Instructor identifier', required: false },
  { field: 'subject_area', description: 'Math, ELA, Science, etc.', required: false },
  { field: 'assessment_type', description: 'Formative, Summative, Diagnostic', required: false },
];

export default function DataSourcesPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [selectedPlatform, setSelectedPlatform] = React.useState<LMSPlatform | null>(null);
  const [customFields, setCustomFields] = React.useState<string>('');
  const [isHarmonizing, setIsHarmonizing] = React.useState(false);
  const [harmonizationResult, setHarmonizationResult] = React.useState<SchemaMapping[] | null>(null);
  const [editedMappings, setEditedMappings] = React.useState<SchemaMapping[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSelectPlatform = (platformId: LMSPlatform) => {
    setSelectedPlatform(platformId);
    setHarmonizationResult(null);
    setEditedMappings([]);
  };

  const handleHarmonize = async () => {
    if (!selectedPlatform) return;

    setIsHarmonizing(true);

    // Get source fields based on platform or custom input
    let sourceFields: string[];
    if (selectedPlatform === 'custom') {
      sourceFields = customFields.split(',').map((f) => f.trim()).filter(Boolean);
    } else {
      const platform = LMS_PLATFORMS.find((p) => p.id === selectedPlatform);
      sourceFields = platform?.fields ?? [];
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get AI harmonization result
    const sourceCategories = sourceFields.map((field) => ({
      name: field,
      system: selectedPlatform || 'custom',
    }));
    const result = harmonizeLMSSchema(sourceCategories);
    setHarmonizationResult(result);
    setEditedMappings(result);

    setIsHarmonizing(false);
  };

  const handleMappingChange = (index: number, mappedCategory: string) => {
    setEditedMappings((prev) =>
      prev.map((m, i) =>
        i === index
          ? {
              ...m,
              mappedCategory,
              confidence: m.sourceCategory === mappedCategory ? 100 : 80,
            }
          : m
      )
    );
  };

  const handleApproveMapping = (index: number) => {
    setEditedMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, confidence: 100 } : m))
    );
  };

  const handleSaveMappings = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    // In production, this would save to Supabase
  };

  const allMappingsConfirmed = editedMappings.every((m) => m.confidence === 100);
  const requiredFieldsMapped = EDUNODE_SCHEMA.filter((f) => f.required).every((f) =>
    editedMappings.some((m) => m.mappedCategory === f.field && m.confidence >= 70)
  );

  return (
    <>
      <PageHeader
        title="Data Sources & Schema Harmonization"
        description="Connect your LMS and map fields to EduNode's analytics schema"
        actions={
          <Link href={`/${school_slug}/settings`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        }
      />

      {/* AI Schema Harmonization Banner */}
      <div className="mb-8 bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-cyan-900/20 border-l-4 border-violet-500 p-6 rounded-r-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-violet-500/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              AI Schema Harmonization
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
                GEMINI POWERED
              </Badge>
            </h2>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          EduNode uses AI to automatically map your LMS data fields to our analytics schema.
          Select your platform below, and our AI will suggest intelligent field mappings based on
          field names, data types, and common patterns. You can review and adjust mappings before finalizing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Platform Selection */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Select LMS Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {LMS_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleSelectPlatform(platform.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left',
                    selectedPlatform === platform.id
                      ? 'border-cyan-500 bg-cyan-900/10'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
                      selectedPlatform === platform.id
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{platform.name}</div>
                    <div className="text-xs text-slate-500">
                      {platform.id === 'custom'
                        ? 'Provide your own field list'
                        : `${platform.fields.length} standard fields`}
                    </div>
                  </div>
                  {selectedPlatform === platform.id && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Custom Fields Input */}
          {selectedPlatform === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-amber-400" />
                  Custom Field Names
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={customFields}
                  onChange={(e) => setCustomFields(e.target.value)}
                  placeholder="Enter field names, comma-separated:&#10;student_id, course_code, score, date_completed..."
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Paste your CSV headers or list your database field names
                </p>
              </CardContent>
            </Card>
          )}

          {/* Harmonize Button */}
          {selectedPlatform && (
            <Button
              onClick={handleHarmonize}
              disabled={isHarmonizing || (selectedPlatform === 'custom' && !customFields.trim())}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isHarmonizing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  AI Analyzing Fields...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Run AI Harmonization
                </>
              )}
            </Button>
          )}
        </div>

        {/* Mapping Results */}
        <div className="lg:col-span-8 space-y-4">
          {!harmonizationResult && !isHarmonizing && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <div className="p-4 bg-slate-800/50 rounded-2xl inline-block mb-4">
                  <Link2 className="w-12 h-12 text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Mappings Yet</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Select your LMS platform and click &quot;Run AI Harmonization&quot; to generate
                  intelligent field mappings.
                </p>
              </div>
            </Card>
          )}

          {isHarmonizing && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <div className="p-4 bg-violet-500/20 rounded-2xl inline-block mb-4 animate-pulse">
                  <BrainCircuit className="w-12 h-12 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Analyzing Schema...</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Gemini is analyzing field names, patterns, and common conventions to suggest optimal mappings.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-violet-400">
                  <span className="animate-pulse">•</span>
                  <span>Analyzing semantic similarity</span>
                </div>
              </div>
            </Card>
          )}

          {harmonizationResult && !isHarmonizing && (
            <>
              {/* Summary Card */}
              <Card className="bg-slate-800/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <Zap className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">AI Confidence Score</div>
                        <div className="text-2xl font-black text-white">
                          {Math.round(harmonizationResult.reduce((sum, m) => sum + m.confidence, 0) / harmonizationResult.length)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-emerald-400">
                          {editedMappings.filter((m) => m.confidence >= 90).length}
                        </div>
                        <div className="text-xs text-slate-500">High Confidence</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-400">
                          {editedMappings.filter((m) => m.confidence >= 60 && m.confidence < 90).length}
                        </div>
                        <div className="text-xs text-slate-500">Review Needed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-rose-400">
                          {editedMappings.filter((m) => m.confidence < 60).length}
                        </div>
                        <div className="text-xs text-slate-500">Manual Required</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Field Mappings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-400" />
                      Field Mappings
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> AI Suggested
                      <span className="w-2 h-2 rounded-full bg-slate-500 ml-2" /> Manual
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <div className="col-span-4">Source Field</div>
                      <div className="col-span-1 text-center">→</div>
                      <div className="col-span-4">EduNode Field</div>
                      <div className="col-span-2 text-center">Confidence</div>
                      <div className="col-span-1 text-center">Action</div>
                    </div>

                    {editedMappings.map((mapping, index) => (
                      <div
                        key={index}
                        className={cn(
                          'grid grid-cols-12 gap-4 p-4 rounded-xl border transition',
                          mapping.confidence >= 90
                            ? 'bg-emerald-900/10 border-emerald-500/20'
                            : mapping.confidence >= 60
                            ? 'bg-amber-900/10 border-amber-500/20'
                            : 'bg-rose-900/10 border-rose-500/20'
                        )}
                      >
                        <div className="col-span-4 flex items-center gap-2">
                          <code className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300 font-mono">
                            {mapping.sourceCategory}
                          </code>
                          {mapping.confidence >= 80 && (
                            <Sparkles className="w-3 h-3 text-violet-400" />
                          )}
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="col-span-4">
                          <select
                            value={mapping.mappedCategory}
                            onChange={(e) => handleMappingChange(index, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">-- Skip this field --</option>
                            {EDUNODE_SCHEMA.map((field) => (
                              <option key={field.field} value={field.field}>
                                {field.field}
                                {field.required ? ' *' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Badge
                            className={cn(
                              'text-xs',
                              mapping.confidence >= 90
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : mapping.confidence >= 60
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            )}
                          >
                            {mapping.confidence}%
                          </Badge>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {mapping.confidence < 100 ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveMapping(index)}
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Unmapped Required Fields Warning */}
                  {!requiredFieldsMapped && (
                    <div className="mt-4 p-4 bg-rose-900/20 border border-rose-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-rose-400 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-bold text-sm">Missing Required Fields</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        The following required fields need mappings:{' '}
                        {EDUNODE_SCHEMA.filter((f) => f.required)
                          .filter((f) => !editedMappings.some((m) => m.mappedCategory === f.field && m.confidence >= 70))
                          .map((f) => f.field)
                          .join(', ')}
                      </p>
                    </div>
                  )}

                  {/* AI Rationale Summary */}
                  {harmonizationResult.some(m => m.rationale) && (
                    <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <BrainCircuit className="w-4 h-4" />
                        <span className="font-bold text-sm">AI Mapping Rationale</span>
                      </div>
                      <ul className="space-y-1">
                        {harmonizationResult.filter(m => m.confidence < 90).slice(0, 3).map((mapping, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-indigo-400">•</span>
                            <span>{mapping.sourceCategory} → {mapping.mappedCategory}: {mapping.rationale}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <HelpCircle className="w-4 h-4" />
                  <span>
                    {allMappingsConfirmed
                      ? 'All mappings confirmed - ready to save'
                      : 'Review and confirm all mappings before saving'}
                  </span>
                </div>
                <Button
                  onClick={handleSaveMappings}
                  disabled={isSaving || !requiredFieldsMapped}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Schema Mapping
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* EduNode Schema Reference */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileJson className="w-5 h-5 text-cyan-400" />
              EduNode Schema Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EDUNODE_SCHEMA.map((field) => (
                <div
                  key={field.field}
                  className="p-3 bg-slate-800/30 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-cyan-400">{field.field}</code>
                    {field.required && (
                      <Badge className="bg-rose-500/20 text-rose-400 text-[10px]">Required</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{field.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
