/**
 * LMS Fidelity Monitor
 * ====================
 *
 * Purpose-Driven Data Enforcement: Tracks whether teachers are meeting
 * the school's codified assessment cadence requirements.
 *
 * Key Concept: "Weak Data Pulse" Alert
 * ------------------------------------
 * If a classroom's quiz/test entries fall below the cadence threshold,
 * the Instructional Pulse dashboard must display a warning that the
 * growth data for that classroom may be unreliable.
 *
 * Thresholds:
 * - Weekly Cadence: Minimum 2 formative entries per teacher per week
 * - Bi-Weekly Cadence: Minimum 2 formative entries per teacher per 2 weeks
 */

export type AssessmentCadence = 'weekly' | 'biweekly' | 'monthly';

export interface TeacherFidelityRecord {
  teacherId: string;
  teacherName: string;
  classroom: string;
  gradeLevel: number;
  subject: string;
  entriesThisWeek: number;
  entriesThisPeriod: number;
  lastEntryDate: Date | null;
  cadenceTarget: number;
  fidelityStatus: 'compliant' | 'warning' | 'non_compliant';
  dataQualityScore: number; // 0-100
}

export interface SchoolFidelityReport {
  schoolId: string;
  reportDate: Date;
  cadenceSetting: AssessmentCadence;
  totalTeachers: number;
  compliantTeachers: number;
  warningTeachers: number;
  nonCompliantTeachers: number;
  overallFidelityRate: number;
  weeklyTrend: 'improving' | 'stable' | 'declining';
  teacherRecords: TeacherFidelityRecord[];
}

export interface DataPulseAlert {
  type: 'weak_pulse' | 'critical_gap' | 'stale_data';
  severity: 'warning' | 'critical';
  classroom: string;
  teacherName: string;
  message: string;
  recommendation: string;
  daysSinceLastEntry: number;
}

// Cadence thresholds (entries per period)
const CADENCE_THRESHOLDS: Record<AssessmentCadence, { target: number; warningThreshold: number }> = {
  weekly: { target: 2, warningThreshold: 1 },
  biweekly: { target: 2, warningThreshold: 1 },
  monthly: { target: 3, warningThreshold: 2 },
};

/**
 * Calculate fidelity status based on entries vs target
 */
export function calculateFidelityStatus(
  entries: number,
  cadence: AssessmentCadence
): TeacherFidelityRecord['fidelityStatus'] {
  const { target, warningThreshold } = CADENCE_THRESHOLDS[cadence];

  if (entries >= target) return 'compliant';
  if (entries >= warningThreshold) return 'warning';
  return 'non_compliant';
}

/**
 * Calculate data quality score (0-100)
 * Based on: entry frequency, recency, and consistency
 */
export function calculateDataQualityScore(
  entriesThisPeriod: number,
  daysSinceLastEntry: number,
  cadence: AssessmentCadence
): number {
  const { target } = CADENCE_THRESHOLDS[cadence];

  // Frequency component (40% weight)
  const frequencyScore = Math.min((entriesThisPeriod / target) * 40, 40);

  // Recency component (40% weight)
  const recencyScore = daysSinceLastEntry <= 3 ? 40
    : daysSinceLastEntry <= 7 ? 30
    : daysSinceLastEntry <= 14 ? 20
    : daysSinceLastEntry <= 21 ? 10
    : 0;

  // Base consistency bonus (20% if any entries)
  const consistencyScore = entriesThisPeriod > 0 ? 20 : 0;

  return Math.round(frequencyScore + recencyScore + consistencyScore);
}

/**
 * Generate Weak Data Pulse alerts for non-compliant classrooms
 */
export function generateDataPulseAlerts(
  teacherRecords: TeacherFidelityRecord[]
): DataPulseAlert[] {
  const alerts: DataPulseAlert[] = [];

  for (const record of teacherRecords) {
    const daysSinceEntry = record.lastEntryDate
      ? Math.floor((Date.now() - record.lastEntryDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (record.fidelityStatus === 'non_compliant') {
      alerts.push({
        type: daysSinceEntry > 21 ? 'stale_data' : 'weak_pulse',
        severity: daysSinceEntry > 21 ? 'critical' : 'warning',
        classroom: record.classroom,
        teacherName: record.teacherName,
        daysSinceLastEntry: daysSinceEntry,
        message: daysSinceEntry > 21
          ? `No formative data in ${daysSinceEntry} days. Growth predictions for this classroom are unreliable.`
          : `Only ${record.entriesThisPeriod} entries this period (target: ${record.cadenceTarget}). Data pulse is weak.`,
        recommendation: daysSinceEntry > 21
          ? 'Immediate data entry required to restore predictive accuracy.'
          : 'Increase formative assessment frequency to meet cadence requirements.',
      });
    } else if (record.fidelityStatus === 'warning') {
      alerts.push({
        type: 'weak_pulse',
        severity: 'warning',
        classroom: record.classroom,
        teacherName: record.teacherName,
        daysSinceLastEntry: daysSinceEntry,
        message: `Approaching cadence threshold: ${record.entriesThisPeriod}/${record.cadenceTarget} entries.`,
        recommendation: 'Add at least one more formative entry to maintain compliance.',
      });
    }
  }

  // Sort by severity (critical first) then by days since entry
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return b.daysSinceLastEntry - a.daysSinceLastEntry;
  });
}

/**
 * Generate mock teacher fidelity data for demo purposes
 */
export function generateMockFidelityData(
  schoolId: string,
  cadence: AssessmentCadence = 'weekly'
): SchoolFidelityReport {
  const teachers = [
    { id: 't1', name: 'Sarah Mitchell', classroom: 'Room 101', grade: 3, subject: 'ELA' },
    { id: 't2', name: 'Marcus Johnson', classroom: 'Room 102', grade: 4, subject: 'Math' },
    { id: 't3', name: 'Emily Chen', classroom: 'Room 103', grade: 3, subject: 'Science' },
    { id: 't4', name: 'David Rodriguez', classroom: 'Room 104', grade: 5, subject: 'ELA' },
    { id: 't5', name: 'Lisa Thompson', classroom: 'Room 105', grade: 4, subject: 'Math' },
    { id: 't6', name: 'James Wilson', classroom: 'Room 106', grade: 3, subject: 'Social Studies' },
    { id: 't7', name: 'Jennifer Brown', classroom: 'Room 107', grade: 5, subject: 'Science' },
    { id: 't8', name: 'Robert Taylor', classroom: 'Room 108', grade: 4, subject: 'ELA' },
  ];

  const { target } = CADENCE_THRESHOLDS[cadence];

  const teacherRecords: TeacherFidelityRecord[] = teachers.map((teacher) => {
    // Simulate varying compliance levels
    const entriesThisPeriod = Math.floor(Math.random() * 4); // 0-3 entries
    const entriesThisWeek = Math.min(entriesThisPeriod, Math.floor(Math.random() * 3));
    const daysSinceEntry = entriesThisPeriod > 0 ? Math.floor(Math.random() * 14) : Math.floor(Math.random() * 30);
    const lastEntryDate = entriesThisPeriod > 0
      ? new Date(Date.now() - daysSinceEntry * 24 * 60 * 60 * 1000)
      : null;

    const fidelityStatus = calculateFidelityStatus(entriesThisPeriod, cadence);
    const dataQualityScore = calculateDataQualityScore(entriesThisPeriod, daysSinceEntry, cadence);

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      classroom: teacher.classroom,
      gradeLevel: teacher.grade,
      subject: teacher.subject,
      entriesThisWeek,
      entriesThisPeriod,
      lastEntryDate,
      cadenceTarget: target,
      fidelityStatus,
      dataQualityScore,
    };
  });

  const compliantTeachers = teacherRecords.filter((r) => r.fidelityStatus === 'compliant').length;
  const warningTeachers = teacherRecords.filter((r) => r.fidelityStatus === 'warning').length;
  const nonCompliantTeachers = teacherRecords.filter((r) => r.fidelityStatus === 'non_compliant').length;

  return {
    schoolId,
    reportDate: new Date(),
    cadenceSetting: cadence,
    totalTeachers: teachers.length,
    compliantTeachers,
    warningTeachers,
    nonCompliantTeachers,
    overallFidelityRate: Math.round((compliantTeachers / teachers.length) * 100),
    weeklyTrend: compliantTeachers >= teachers.length * 0.75 ? 'improving'
      : compliantTeachers >= teachers.length * 0.5 ? 'stable'
      : 'declining',
    teacherRecords,
  };
}

/**
 * Check if the school's overall data freshness is concerning
 * Used for system-wide "Data Latency" banner
 */
export interface DataFreshnessStatus {
  isStale: boolean;
  lastRefreshDate: Date | null;
  hoursSinceRefresh: number;
  message: string;
}

export function checkDataFreshness(lastRefreshDate: Date | null): DataFreshnessStatus {
  if (!lastRefreshDate) {
    return {
      isStale: true,
      lastRefreshDate: null,
      hoursSinceRefresh: 999,
      message: 'No data refresh timestamp available. Data may be outdated.',
    };
  }

  const hoursSinceRefresh = Math.floor(
    (Date.now() - lastRefreshDate.getTime()) / (1000 * 60 * 60)
  );

  const isStale = hoursSinceRefresh > 24;

  return {
    isStale,
    lastRefreshDate,
    hoursSinceRefresh,
    message: isStale
      ? `Data has not refreshed in ${hoursSinceRefresh} hours. Analytics may not reflect the latest information.`
      : `Data last refreshed ${hoursSinceRefresh} hour${hoursSinceRefresh === 1 ? '' : 's'} ago.`,
  };
}
