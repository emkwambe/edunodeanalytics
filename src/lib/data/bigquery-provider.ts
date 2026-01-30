/**
 * EduNode Analytics - BigQuery Mock Provider
 * ==========================================
 *
 * Provides data access layer that mimics BigQuery queries.
 * In production, replace with actual BigQuery client.
 *
 * Current implementation uses in-memory seed data with
 * "Independent Excellence" strategic narrative.
 */

import {
  getSchoolSeed,
  toStudent360Data,
  type SchoolSeedConfig,
  type StudentSeedData,
  type SchoolMetrics,
} from './seed-data';
import type { Student360Data } from '@/components/dashboard/student-360-card';

// =============================================================================
// TYPES
// =============================================================================

export interface QueryResult<T> {
  data: T;
  metadata: {
    cached: boolean;
    queryTime: number;
    rowCount: number;
    source: 'bigquery' | 'mock';
  };
}

export interface AttendanceTrendPoint {
  date: string;
  attendanceRate: number;
  chronicAbsenceRate: number;
  targetRate: number;
}

export interface MasteryDataPoint {
  week: string;
  masteryRate: number;
  assessmentCount: number;
}

export interface SubjectMasteryData {
  subject: string;
  data: MasteryDataPoint[];
  color: string;
  targetMastery: number;
}

export interface RenewalRadarMetrics {
  growthPercentile: number;
  proficiencyRate: number;
  attendanceRate: number;
  chronicAbsenceRate: number;
  enrollmentTrend: number;
  teacherRetention: number;
  parentSatisfaction: number;
  complianceScore: number;
}

// =============================================================================
// BIGQUERY MOCK PROVIDER
// =============================================================================

class BigQueryProvider {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get school metrics for dashboard overview
   */
  async getSchoolMetrics(schoolSlug: string): Promise<QueryResult<SchoolMetrics | null>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: null,
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    return {
      data: school.metrics,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: 1,
        source: 'mock',
      },
    };
  }

  /**
   * Get all students for Student 360 view
   */
  async getStudents(
    schoolSlug: string,
    options: {
      riskLevel?: 'on_track' | 'at_risk' | 'critical';
      gradeLevel?: number;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<QueryResult<Student360Data[]>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: [],
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    let students = school.students;

    // Apply filters
    if (options.riskLevel) {
      students = students.filter((s) => s.riskLevel === options.riskLevel);
    }
    if (options.gradeLevel) {
      students = students.filter((s) => s.gradeLevel === options.gradeLevel);
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || students.length;
    students = students.slice(offset, offset + limit);

    // Convert to UI format
    const data = students.map(toStudent360Data);

    return {
      data,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: data.length,
        source: 'mock',
      },
    };
  }

  /**
   * Get a single student by ID
   */
  async getStudentById(
    schoolSlug: string,
    studentId: string
  ): Promise<QueryResult<Student360Data | null>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: null,
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    const student = school.students.find((s) => s.id === studentId);

    return {
      data: student ? toStudent360Data(student) : null,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: student ? 1 : 0,
        source: 'mock',
      },
    };
  }

  /**
   * Get chronically absent students for Early Warning System
   */
  async getChronicallyAbsentStudents(
    schoolSlug: string
  ): Promise<QueryResult<Student360Data[]>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: [],
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    const chronicStudents = school.students
      .filter((s) => s.isChronicallyAbsent)
      .map(toStudent360Data);

    return {
      data: chronicStudents,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: chronicStudents.length,
        source: 'mock',
      },
    };
  }

  /**
   * Get attendance trend data for charts
   */
  async getAttendanceTrend(
    schoolSlug: string,
    weeks: number = 16
  ): Promise<QueryResult<AttendanceTrendPoint[]>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: [],
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    // Generate realistic attendance trend
    const data: AttendanceTrendPoint[] = [];
    const baseRate = school.metrics.attendanceRate;
    const baseChronicRate = school.metrics.chronicAbsenceRate;

    const startDate = new Date('2025-08-18');

    for (let i = 0; i < weeks; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * 7);

      // Add some realistic variation
      const variation = (Math.sin(i * 0.5) * 0.02) + ((Math.random() - 0.5) * 0.01);
      const weekRate = Math.min(0.99, Math.max(0.88, baseRate + variation));

      // Chronic absence tends to increase slightly over time
      const chronicVariation = (i * 0.002) + ((Math.random() - 0.5) * 0.01);
      const weekChronic = Math.min(0.25, Math.max(0.05, baseChronicRate + chronicVariation));

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attendanceRate: Math.round(weekRate * 1000) / 1000,
        chronicAbsenceRate: Math.round(weekChronic * 1000) / 1000,
        targetRate: 0.95,
      });
    }

    return {
      data,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: data.length,
        source: 'mock',
      },
    };
  }

  /**
   * Get mastery curve data for Instructional Pulse
   */
  async getMasteryData(
    schoolSlug: string,
    weeks: number = 12
  ): Promise<QueryResult<SubjectMasteryData[]>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: [],
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    // Use school's growth percentile to inform mastery trajectory
    const avgGrowth = school.metrics.avgGrowthPercentile;
    const growthFactor = avgGrowth / 100;

    const generateSubjectData = (
      subject: string,
      color: string,
      startMastery: number
    ): SubjectMasteryData => {
      const data: MasteryDataPoint[] = [];
      let mastery = startMastery;

      for (let i = 0; i < weeks; i++) {
        // High growth schools show steeper improvement curve
        const weeklyGrowth = (0.01 + growthFactor * 0.03) + ((Math.random() - 0.3) * 0.02);
        mastery = Math.min(0.92, Math.max(0.40, mastery + weeklyGrowth));

        data.push({
          week: `Week ${i + 1}`,
          masteryRate: Math.round(mastery * 1000) / 1000,
          assessmentCount: 2 + Math.floor(Math.random() * 3),
        });
      }

      return {
        subject,
        data,
        color,
        targetMastery: 0.80,
      };
    };

    const data = [
      generateSubjectData('ELA', '#06b6d4', 0.52),
      generateSubjectData('Math', '#10b981', 0.48),
      generateSubjectData('Science', '#6366f1', 0.55),
    ];

    return {
      data,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: data.length,
        source: 'mock',
      },
    };
  }

  /**
   * Get Renewal Radar metrics for Authorizer view
   * STRATEGIC: Emphasizes high growth to demonstrate charter value
   */
  async getRenewalRadarMetrics(
    schoolSlug: string
  ): Promise<QueryResult<RenewalRadarMetrics>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: {
          growthPercentile: 0,
          proficiencyRate: 0,
          attendanceRate: 0,
          chronicAbsenceRate: 0,
          enrollmentTrend: 0,
          teacherRetention: 0,
          parentSatisfaction: 0,
          complianceScore: 0,
        },
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    // STRATEGIC: Growth percentile is the key value proposition
    const data: RenewalRadarMetrics = {
      growthPercentile: school.metrics.avgGrowthPercentile,
      proficiencyRate: school.metrics.avgProficiency,
      attendanceRate: school.metrics.attendanceRate * 100,
      chronicAbsenceRate: school.metrics.chronicAbsenceRate * 100,
      enrollmentTrend: 3.2 + Math.random() * 2, // Slight growth
      teacherRetention: 85 + Math.random() * 10,
      parentSatisfaction: 82 + Math.random() * 12,
      complianceScore: 95 + Math.random() * 5,
    };

    return {
      data,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: 1,
        source: 'mock',
      },
    };
  }

  /**
   * Get risk distribution data
   */
  async getRiskDistribution(
    schoolSlug: string
  ): Promise<QueryResult<{ onTrack: number; atRisk: number; critical: number }>> {
    const startTime = performance.now();
    const school = getSchoolSeed(schoolSlug);

    if (!school) {
      return {
        data: { onTrack: 0, atRisk: 0, critical: 0 },
        metadata: {
          cached: false,
          queryTime: performance.now() - startTime,
          rowCount: 0,
          source: 'mock',
        },
      };
    }

    return {
      data: school.metrics.riskDistribution,
      metadata: {
        cached: false,
        queryTime: performance.now() - startTime,
        rowCount: 1,
        source: 'mock',
      },
    };
  }

  /**
   * Check if school has data seeded
   */
  async hasSchoolData(schoolSlug: string): Promise<boolean> {
    const school = getSchoolSeed(schoolSlug);
    return school !== null;
  }

  /**
   * Get school branding/colors
   */
  async getSchoolBranding(schoolSlug: string): Promise<{
    name: string;
    colors: { primary: string; secondary: string; accent: string };
  } | null> {
    const school = getSchoolSeed(schoolSlug);
    if (!school) return null;

    return {
      name: school.name,
      colors: school.colors,
    };
  }
}

// Export singleton instance
export const bigQueryProvider = new BigQueryProvider();

// Export types
export type { SchoolSeedConfig, StudentSeedData, SchoolMetrics };
