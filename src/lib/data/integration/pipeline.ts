// Table data_quality_issues is defined but not yet migrated to DB
/**
 * Data Integration Pipeline
 * =========================
 *
 * Layer 1: Unified data pipeline for ingesting, transforming, and loading
 * student data from multiple sources into the analytics platform.
 *
 * Features:
 * - Multi-source data ingestion (SIS, LMS, Assessment platforms)
 * - Data validation and cleansing
 * - Schema normalization
 * - Incremental and full sync support
 * - Real-time and batch processing
 * - Conflict resolution strategies
 * - Retry with exponential backoff on failures
 * - Sentry integration for monitoring
 */

import { DataSourceRegistry, type DataSourceAdapter, type SyncResult } from '../sources/registry';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type _Student = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];
import { withRetry, logToDeadLetter } from '@/lib/data/retry';
import { addBreadcrumb, captureException } from '@/lib/monitoring/sentry';

// Pipeline configuration
export interface PipelineConfig {
  schoolId: string;
  sources: string[];
  syncMode: 'full' | 'incremental' | 'realtime';
  conflictResolution: 'latest_wins' | 'source_priority' | 'merge';
  validateData: boolean;
  transformations: DataTransformation[];
}

export interface DataTransformation {
  field: string;
  type: 'normalize' | 'clean' | 'derive' | 'map';
  config: Record<string, unknown>;
}

export interface PipelineResult {
  success: boolean;
  sourceResults: Map<string, SyncResult>;
  totalRecordsProcessed: number;
  totalRecordsCreated: number;
  totalRecordsUpdated: number;
  totalRecordsSkipped: number;
  errors: PipelineError[];
  startedAt: Date;
  completedAt: Date;
  duration: number;
}

export interface PipelineError {
  source: string;
  code: string;
  message: string;
  recordId?: string;
  recoverable: boolean;
}

// Data validation rules
export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'enum' | 'custom';
  config: Record<string, unknown>;
  message: string;
}

const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'first_name', type: 'required', config: {}, message: 'First name is required' },
  { field: 'last_name', type: 'required', config: {}, message: 'Last name is required' },
  { field: 'grade_level', type: 'range', config: { min: -1, max: 12 }, message: 'Grade level must be between PK (-1) and 12' },
  { field: 'attendance_rate', type: 'range', config: { min: 0, max: 1 }, message: 'Attendance rate must be between 0 and 1' },
];

/**
 * Data Integration Pipeline
 *
 * Orchestrates data flow from multiple sources into unified student records
 */
export class DataIntegrationPipeline {
  private config: PipelineConfig;
  private adapters: Map<string, DataSourceAdapter> = new Map();
  private validationRules: ValidationRule[] = DEFAULT_VALIDATION_RULES;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    for (const sourceId of this.config.sources) {
      const adapter = DataSourceRegistry.get(sourceId);
      if (adapter) {
        this.adapters.set(sourceId, adapter);
      } else {
        console.warn(`[Pipeline] Unknown data source: ${sourceId}`);
      }
    }
  }

  /**
   * Execute the data integration pipeline with retry logic
   */
  async execute(credentials: Map<string, Record<string, string>>): Promise<PipelineResult> {
    const startedAt = new Date();
    const sourceResults = new Map<string, SyncResult>();
    const errors: PipelineError[] = [];
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    console.log(`[Pipeline] Starting integration for school ${this.config.schoolId}`);
    console.log(`[Pipeline] Sources: ${Array.from(this.adapters.keys()).join(', ')}`);
    console.log(`[Pipeline] Mode: ${this.config.syncMode}`);

    addBreadcrumb({
      category: 'pipeline',
      message: `Starting integration pipeline`,
      level: 'info',
      data: {
        schoolId: this.config.schoolId,
        sources: Array.from(this.adapters.keys()),
        mode: this.config.syncMode,
      },
    });

    // Phase 1: Extract data from all sources with retry
    const _extractedData = new Map<string, unknown[]>();

    for (const [sourceId, adapter] of this.adapters) {
      try {
        const sourceCreds = credentials.get(sourceId) || {};

        addBreadcrumb({
          category: 'pipeline',
          message: `Syncing source: ${sourceId}`,
          level: 'info',
          data: { sourceId, schoolId: this.config.schoolId },
        });

        // Execute sync with retry logic
        const retryResult = await withRetry(
          () => adapter.sync(
            this.config.schoolId,
            sourceCreds,
            { fullSync: this.config.syncMode === 'full' }
          ),
          {
            maxRetries: 3,
            baseDelayMs: 1000,
            context: {
              adapterName: sourceId,
              schoolId: this.config.schoolId,
              operation: 'pipeline_sync',
            },
          }
        );

        if (retryResult.success && retryResult.data) {
          const result = retryResult.data;
          sourceResults.set(sourceId, result);
          totalProcessed += result.recordsProcessed;
          totalCreated += result.recordsCreated;
          totalUpdated += result.recordsUpdated;
          totalSkipped += result.recordsSkipped;

          if (!result.success) {
            errors.push({
              source: sourceId,
              code: 'SYNC_FAILED',
              message: `Sync failed for ${sourceId}: ${result.errors[0]?.message || 'Unknown error'}`,
              recoverable: true,
            });
          }
        } else {
          // All retries failed
          const errorMessage = retryResult.error?.message || 'Unknown error after retries';
          errors.push({
            source: sourceId,
            code: 'SYNC_FAILED_AFTER_RETRIES',
            message: `Sync failed for ${sourceId} after ${retryResult.attempts} attempts: ${errorMessage}`,
            recoverable: false,
          });

          // Log to dead letter
          await logToDeadLetter({
            adapterName: sourceId,
            schoolId: this.config.schoolId,
            operation: 'pipeline_sync',
            error: errorMessage,
            attempts: retryResult.attempts,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          source: sourceId,
          code: 'ADAPTER_ERROR',
          message: `Adapter error for ${sourceId}: ${message}`,
          recoverable: false,
        });

        // Capture unexpected errors to Sentry
        captureException(error, {
          sourceId,
          schoolId: this.config.schoolId,
          operation: 'pipeline_execute',
        });
      }
    }

    // Phase 2: Post-processing and data quality checks
    if (this.config.validateData) {
      await this.runDataQualityChecks();
    }

    const completedAt = new Date();

    return {
      success: errors.filter((e) => !e.recoverable).length === 0,
      sourceResults,
      totalRecordsProcessed: totalProcessed,
      totalRecordsCreated: totalCreated,
      totalRecordsUpdated: totalUpdated,
      totalRecordsSkipped: totalSkipped,
      errors,
      startedAt,
      completedAt,
      duration: completedAt.getTime() - startedAt.getTime(),
    };
  }

  /**
   * Run data quality checks on integrated data
   */
  private async runDataQualityChecks(): Promise<void> {
    const supabase = createAdminSupabaseClient();

    // Check for data quality issues
    const { data: students } = await (supabase as any)
      .from('students')
      .select('id, first_name, last_name, grade_level, attendance_rate')
      .eq('school_id', this.config.schoolId)
      .is('is_active', true);

    if (!students) return;

    const issues: DataQualityIssue[] = [];

    for (const student of students) {
      for (const rule of this.validationRules) {
        const value = student[rule.field as keyof typeof student];
        const issue = this.validateField(student.id, rule, value);
        if (issue) {
          issues.push(issue);
        }
      }
    }

    if (issues.length > 0) {
      console.log(`[Pipeline] Found ${issues.length} data quality issues`);
      await this.logDataQualityIssues(issues);
    }
  }

  private validateField(
    recordId: string,
    rule: ValidationRule,
    value: unknown
  ): DataQualityIssue | null {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return { recordId, field: rule.field, rule: rule.type, message: rule.message };
        }
        break;
      case 'range':
        if (typeof value === 'number') {
          const { min, max } = rule.config as { min: number; max: number };
          if (value < min || value > max) {
            return { recordId, field: rule.field, rule: rule.type, message: rule.message };
          }
        }
        break;
    }
    return null;
  }

  private async logDataQualityIssues(issues: DataQualityIssue[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    // Store issues for review
    await (supabase as any).from('data_quality_issues').insert(
      issues.map((issue) => ({
        school_id: this.config.schoolId,
        record_id: issue.recordId,
        field: issue.field,
        rule: issue.rule,
        message: issue.message,
        severity: 'warning',
        status: 'open',
      }))
    );
  }

  /**
   * Add custom validation rules
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Get pipeline status
   */
  getStatus(): PipelineStatus {
    return {
      schoolId: this.config.schoolId,
      sources: this.config.sources,
      adapterCount: this.adapters.size,
      syncMode: this.config.syncMode,
      lastRun: null,
    };
  }
}

interface DataQualityIssue {
  recordId: string;
  field: string;
  rule: string;
  message: string;
}

interface PipelineStatus {
  schoolId: string;
  sources: string[];
  adapterCount: number;
  syncMode: string;
  lastRun: Date | null;
}

/**
 * Data Transformation Service
 *
 * Applies transformations to normalize data across sources
 */
export class DataTransformationService {
  /**
   * Normalize student names (proper case, trim whitespace)
   */
  static normalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Normalize grade level from various formats
   */
  static normalizeGradeLevel(grade: string | number): number {
    if (typeof grade === 'number') return grade;

    const gradeMap: Record<string, number> = {
      'pk': -1, 'pre-k': -1, 'prek': -1,
      'k': 0, 'kindergarten': 0,
      '1st': 1, '2nd': 2, '3rd': 3,
      '4th': 4, '5th': 5, '6th': 6,
      '7th': 7, '8th': 8, '9th': 9,
      '10th': 10, '11th': 11, '12th': 12,
    };

    const normalized = grade.toLowerCase().trim();
    if (gradeMap[normalized] !== undefined) {
      return gradeMap[normalized];
    }

    const numeric = parseInt(normalized, 10);
    return isNaN(numeric) ? 0 : numeric;
  }

  /**
   * Normalize attendance rate to decimal (0-1)
   */
  static normalizeAttendanceRate(rate: number | string): number {
    const numeric = typeof rate === 'string' ? parseFloat(rate) : rate;
    if (isNaN(numeric)) return 0;

    // If > 1, assume it's a percentage
    return numeric > 1 ? numeric / 100 : numeric;
  }

  /**
   * Generate display name from first and last name
   */
  static generateDisplayName(firstName: string, lastName: string): string {
    const first = this.normalizeName(firstName);
    const lastInitial = lastName.trim().charAt(0).toUpperCase();
    return `${first} ${lastInitial}.`;
  }

  /**
   * Transform raw student data to normalized format
   */
  static transformStudentData(
    raw: Record<string, unknown>,
    schoolId: string
  ): Partial<StudentInsert> {
    const firstName = String(raw.first_name || raw.firstName || '');
    const lastName = String(raw.last_name || raw.lastName || '');

    const gradeValue = raw.grade_level ?? raw.grade ?? 0;
    const attendanceValue = raw.attendance_rate ?? 0;

    return {
      school_id: schoolId,
      first_name: this.normalizeName(firstName),
      last_name: this.normalizeName(lastName),
      display_name: this.generateDisplayName(firstName, lastName),
      grade_level: this.normalizeGradeLevel(gradeValue as string | number),
      attendance_rate: this.normalizeAttendanceRate(attendanceValue as string | number),
      sis_student_id: String(raw.sis_id || raw.sisId || raw.student_id || ''),
      has_iep: Boolean(raw.has_iep || raw.hasIep || false),
      has_504_plan: Boolean(raw.has_504 || raw.has504 || raw.has_504_plan || false),
      is_english_learner: Boolean(raw.is_ell || raw.isEll || raw.is_english_learner || false),
    };
  }
}

/**
 * Data Conflict Resolution Service
 *
 * Handles conflicts when multiple sources provide data for the same student
 */
export class ConflictResolutionService {
  /**
   * Resolve conflicts using latest-wins strategy
   */
  static latestWins<T extends { updated_at?: string }>(records: T[]): T {
    return records.reduce((latest, current) => {
      if (!latest.updated_at) return current;
      if (!current.updated_at) return latest;
      return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
    });
  }

  /**
   * Resolve conflicts using source priority
   */
  static sourcePriority<T extends { source?: string }>(
    records: T[],
    priorities: string[]
  ): T {
    return records.reduce((best, current) => {
      const bestPriority = priorities.indexOf(best.source || '');
      const currentPriority = priorities.indexOf(current.source || '');

      if (currentPriority === -1) return best;
      if (bestPriority === -1) return current;
      return currentPriority < bestPriority ? current : best;
    });
  }

  /**
   * Merge records, preferring non-null values
   */
  static merge<T extends Record<string, unknown>>(records: T[]): T {
    const merged = { ...records[0] };

    for (const record of records.slice(1)) {
      for (const [key, value] of Object.entries(record)) {
        if (value !== null && value !== undefined && merged[key] === null) {
          (merged as Record<string, unknown>)[key] = value;
        }
      }
    }

    return merged as T;
  }
}

/**
 * Create a new data integration pipeline
 */
export function createPipeline(config: Partial<PipelineConfig> & { schoolId: string }): DataIntegrationPipeline {
  const fullConfig: PipelineConfig = {
    schoolId: config.schoolId,
    sources: config.sources || ['clever', 'powerschool'],
    syncMode: config.syncMode || 'incremental',
    conflictResolution: config.conflictResolution || 'latest_wins',
    validateData: config.validateData ?? true,
    transformations: config.transformations || [],
  };

  return new DataIntegrationPipeline(fullConfig);
}
