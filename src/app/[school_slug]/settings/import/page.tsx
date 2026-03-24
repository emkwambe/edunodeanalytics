'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { PageHeader } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSchoolBySlug } from '@/lib/hooks/use-school-context';
import {
  Upload,
  FileText,
  Users,
  Calendar,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Download,
} from 'lucide-react';

/**
 * CSV Import Page
 *
 * Allows schools to import:
 * - Students: Basic student roster data
 * - Attendance: Attendance rates and days present/absent
 * - Assessments: Assessment scores and growth percentiles
 */

type ImportType = 'students' | 'attendance' | 'assessments';

interface ImportConfig {
  id: ImportType;
  label: string;
  description: string;
  icon: React.ReactNode;
  columns: string[];
  example: string;
  requiredColumns: string[];
}

const IMPORT_CONFIGS: ImportConfig[] = [
  {
    id: 'students',
    label: 'Students',
    description: 'Import student roster with demographic data',
    icon: <Users className="w-5 h-5" />,
    columns: [
      'sis_student_id',
      'first_name',
      'last_name',
      'grade_level',
      'homeroom_teacher',
      'is_english_learner',
      'is_free_reduced_lunch',
      'has_iep',
      'has_504_plan',
    ],
    requiredColumns: ['sis_student_id', 'first_name', 'last_name', 'grade_level'],
    example: `sis_student_id,first_name,last_name,grade_level,homeroom_teacher,is_english_learner,is_free_reduced_lunch,has_iep,has_504_plan
STU001,Maria,Lopez,7,Johnson,false,true,false,false
STU002,James,Chen,8,Williams,false,false,true,false`,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Update student attendance records',
    icon: <Calendar className="w-5 h-5" />,
    columns: ['sis_student_id', 'days_present', 'days_absent', 'attendance_rate'],
    requiredColumns: ['sis_student_id', 'attendance_rate'],
    example: `sis_student_id,days_present,days_absent,attendance_rate
STU001,85,10,0.895
STU002,90,5,0.947`,
  },
  {
    id: 'assessments',
    label: 'Assessments',
    description: 'Import assessment scores and growth data',
    icon: <GraduationCap className="w-5 h-5" />,
    columns: [
      'sis_student_id',
      'math_score',
      'reading_score',
      'growth_percentile',
      'proficiency_level',
    ],
    requiredColumns: ['sis_student_id'],
    example: `sis_student_id,math_score,reading_score,growth_percentile,proficiency_level
STU001,245,232,45,2
STU002,267,255,72,3`,
  },
];

interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

interface ValidationError {
  row: number;
  column?: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  importType: string;
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  errors: Array<{ row: number; message: string }>;
  importedStudentIds?: string[];
  riskAnalysis?: {
    studentsEvaluated: number;
    atRiskCount: number;
    criticalCount: number;
    alertsGenerated: number;
    evaluationTimeMs: number;
  };
}

export default function CSVImportPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.school_slug as string;
  const { school, isLoading: schoolLoading } = useSchoolBySlug(schoolSlug);
  const schoolId = school?.id ?? null;

  // State
  const [selectedType, setSelectedType] = React.useState<ImportType | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedData, setParsedData] = React.useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [step, setStep] = React.useState<'select' | 'upload' | 'preview' | 'result'>('select');

  const selectedConfig = IMPORT_CONFIGS.find((c) => c.id === selectedType);

  // Handle file selection and parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      transform: (value: string) => value.trim(),
      complete: (results) => {
        const data = results.data as ParsedRow[];

        // Transform and validate data
        const transformed = data.map((row) => {
          const newRow: ParsedRow = {};
          Object.entries(row).forEach(([key, value]) => {
            // Convert boolean strings
            if (value === 'true' || value === 'TRUE') {
              newRow[key] = true;
            } else if (value === 'false' || value === 'FALSE') {
              newRow[key] = false;
            // Convert numbers
            } else if (key.includes('rate') || key.includes('percentile') || key.includes('score') ||
                       key.includes('days') || key.includes('level') || key === 'grade_level') {
              const num = parseFloat(value as string);
              newRow[key] = isNaN(num) ? null : num;
            } else {
              newRow[key] = value || null;
            }
          });
          return newRow;
        });

        setParsedData(transformed);
        validateData(transformed);
        setStep('preview');
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  // Validate parsed data
  const validateData = (data: ParsedRow[]) => {
    if (!selectedConfig) return;

    const errors: ValidationError[] = [];

    // Check headers
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const missingRequired = selectedConfig.requiredColumns.filter(
      (col) => !headers.includes(col)
    );
    if (missingRequired.length > 0) {
      errors.push({
        row: 0,
        message: `Missing required columns: ${missingRequired.join(', ')}`,
      });
    }

    // Validate each row
    data.forEach((row, index) => {
      // Check required fields
      selectedConfig.requiredColumns.forEach((col) => {
        if (row[col] === null || row[col] === undefined || row[col] === '') {
          errors.push({
            row: index + 1,
            column: col,
            message: `Missing required value for ${col}`,
          });
        }
      });

      // Type-specific validation
      if (selectedType === 'students') {
        const gradeLevel = row.grade_level as number;
        if (gradeLevel !== null && (gradeLevel < 0 || gradeLevel > 12)) {
          errors.push({
            row: index + 1,
            column: 'grade_level',
            message: `Invalid grade level: ${gradeLevel}. Must be 0-12.`,
          });
        }
      }

      if (selectedType === 'attendance') {
        const rate = row.attendance_rate as number;
        if (rate !== null && (rate < 0 || rate > 1)) {
          errors.push({
            row: index + 1,
            column: 'attendance_rate',
            message: `Invalid attendance rate: ${rate}. Must be between 0 and 1.`,
          });
        }
      }
    });

    setValidationErrors(errors);
  };

  // Submit import
  const handleImport = async () => {
    if (!schoolId || !selectedType || parsedData.length === 0) return;

    setIsUploading(true);
    try {
      const response = await fetch(`/api/schools/${schoolId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importType: selectedType,
          data: parsedData,
        }),
      });

      const result: ImportResult = await response.json();
      setImportResult(result);
      setStep('result');
      // Risk evaluation is handled by the API - no need for separate call
    } catch (err) {
      setImportResult({
        success: false,
        importType: selectedType,
        rowsProcessed: 0,
        rowsCreated: 0,
        rowsUpdated: 0,
        errors: [{ row: 0, message: err instanceof Error ? err.message : 'Unknown error' }],
      });
      setStep('result');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset flow
  const handleReset = () => {
    setSelectedType(null);
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    setStep('select');
  };

  // Download template
  const downloadTemplate = (config: ImportConfig) => {
    const blob = new Blob([config.example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.id}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (schoolLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Import Data"
        description="Import student, attendance, or assessment data from CSV files"
        breadcrumbs={[
          { label: 'Settings', href: `/${schoolSlug}/settings` },
          { label: 'Import Data' },
        ]}
        actions={
          step !== 'select' && (
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          )
        }
      />

      {/* Step 1: Select Import Type */}
      {step === 'select' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Import Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {IMPORT_CONFIGS.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => {
                      setSelectedType(config.id);
                      setStep('upload');
                    }}
                    className={cn(
                      'p-4 rounded-xl border-2 transition text-left',
                      'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        {config.icon}
                      </div>
                      <h3 className="font-bold text-white">{config.label}</h3>
                    </div>
                    <p className="text-sm text-slate-400">{config.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Before You Import</h3>
                  <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                    <li>Re-importing the same file will update existing records (idempotent)</li>
                    <li>Students are matched by their SIS Student ID</li>
                    <li>Maximum 5,000 rows per import</li>
                    <li>After import, risk scores will be recalculated automatically</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 'upload' && selectedConfig && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Import {selectedConfig.label}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(selectedConfig)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expected format */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Expected Columns</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedConfig.columns.map((col) => (
                    <Badge
                      key={col}
                      className={cn(
                        'text-xs',
                        selectedConfig.requiredColumns.includes(col)
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-slate-700 text-slate-300'
                      )}
                    >
                      {col}
                      {selectedConfig.requiredColumns.includes(col) && ' *'}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">* Required columns</p>
              </div>

              {/* Example format */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Example Format</h4>
                <pre className="p-3 rounded-lg bg-slate-900 text-xs text-slate-300 overflow-x-auto">
                  {selectedConfig.example}
                </pre>
              </div>

              {/* File upload */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center transition',
                  'border-slate-700 hover:border-cyan-500/50',
                  'cursor-pointer'
                )}
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-400">CSV files only, max 5,000 rows</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Preview Data */}
      {step === 'preview' && selectedConfig && (
        <div className="space-y-6">
          {/* Validation Summary */}
          <Card className={cn(
            validationErrors.length > 0
              ? 'bg-red-900/10 border-red-500/30'
              : 'bg-emerald-900/10 border-emerald-500/30'
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {validationErrors.length > 0 ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  <div>
                    <h3 className="font-bold text-white">
                      {validationErrors.length > 0
                        ? `${validationErrors.length} Validation Error${validationErrors.length > 1 ? 's' : ''}`
                        : 'Validation Passed'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {file?.name} - {parsedData.length} rows
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={isUploading || validationErrors.some((e) => e.row === 0)}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {parsedData.length} Rows
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-400">Validation Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {validationErrors.slice(0, 20).map((error, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">
                        {error.row === 0 ? 'Header: ' : `Row ${error.row}: `}
                        {error.message}
                      </span>
                    </div>
                  ))}
                  {validationErrors.length > 20 && (
                    <p className="text-sm text-slate-500">
                      ...and {validationErrors.length - 20} more errors
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Preview (First 10 Rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {parsedData.length > 0 &&
                        Object.keys(parsedData[0]).map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase"
                          >
                            {col}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        {Object.entries(row).map(([_key, value], j) => (
                          <td key={j} className="px-3 py-2 text-slate-300">
                            {value === null ? (
                              <span className="text-slate-500">-</span>
                            ) : typeof value === 'boolean' ? (
                              value ? 'true' : 'false'
                            ) : (
                              String(value)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 10 && (
                <p className="mt-3 text-sm text-slate-500">
                  Showing 10 of {parsedData.length} rows
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && importResult && (
        <div className="space-y-6">
          <Card
            className={cn(
              importResult.success
                ? 'bg-emerald-900/10 border-emerald-500/30'
                : 'bg-amber-900/10 border-amber-500/30'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                {importResult.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {importResult.success ? 'Import Complete' : 'Import Completed with Errors'}
                  </h3>
                  <p className="text-slate-400">
                    {importResult.rowsProcessed} rows processed
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {importResult.rowsCreated}
                  </div>
                  <div className="text-xs text-slate-500">Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    {importResult.rowsUpdated}
                  </div>
                  <div className="text-xs text-slate-500">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {importResult.errors.length}
                  </div>
                  <div className="text-xs text-slate-500">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Analysis Results */}
          {importResult.riskAnalysis && (
            <Card className="bg-cyan-900/10 border-cyan-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white">Risk Analysis Complete</h3>
                </div>
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {importResult.riskAnalysis.studentsEvaluated}
                    </div>
                    <div className="text-xs text-slate-500">Students Evaluated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {importResult.riskAnalysis.atRiskCount}
                    </div>
                    <div className="text-xs text-slate-500">At Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {importResult.riskAnalysis.criticalCount}
                    </div>
                    <div className="text-xs text-slate-500">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      {importResult.riskAnalysis.alertsGenerated}
                    </div>
                    <div className="text-xs text-slate-500">Alerts Generated</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Risk scores have been calculated and alerts generated for flagged students.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-amber-400">Import Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importResult.errors.map((error, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">
                        Row {error.row}: {error.message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleReset}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import More Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${schoolSlug}/dashboard/early-warning`)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Early Warning Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${schoolSlug}/students`)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Students
                </Button>
              </div>
              {importResult.success && importResult.importedStudentIds && importResult.importedStudentIds.length > 0 && (
                <p className="mt-4 text-sm text-slate-400">
                  Risk scores are being recalculated for {importResult.importedStudentIds.length} students.
                  This may take a few moments.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
