/**
 * Mock Data Generator for EduNode Analytics
 *
 * Generates realistic sample data for development and demos
 */

import type { Student360Data } from '@/components/dashboard/student-360-card';
import type { AttendanceTrendDataPoint } from '@/components/charts/attendance-trend-chart';
import type { RiskDistributionData } from '@/components/charts/risk-distribution-chart';
import type { MasterySubjectData } from '@/components/charts/mastery-curve-chart';
import { EDUNODE_COLORS } from '@/components/charts/chart-config';

// Random helpers
const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Name data
const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Elijah', 'Sophia', 'Lucas',
  'Isabella', 'Mason', 'Mia', 'Ethan', 'Charlotte', 'Aiden', 'Amelia', 'James',
  'Harper', 'Benjamin', 'Evelyn', 'William', 'Abigail', 'Alexander', 'Emily',
  'Michael', 'Madison', 'Daniel', 'Scarlett', 'Henry', 'Victoria', 'Jackson',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
];

type StatusLevel = 'on_track' | 'watch' | 'at_risk' | 'critical' | 'no_data';

/**
 * Generate mock student data
 */
export function generateMockStudents(count: number, gradeLevel?: number): Student360Data[] {
  const students: Student360Data[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = pickRandom(FIRST_NAMES);
    const lastName = pickRandom(LAST_NAMES);
    const grade = gradeLevel ?? randomBetween(6, 12);

    // Generate correlated metrics
    const attendanceRate = randomFloat(0.75, 1.0);
    const isChronicallyAbsent = attendanceRate < 0.9;
    const totalDays = randomBetween(80, 100);
    const daysPresent = Math.round(totalDays * attendanceRate);

    // Academic metrics
    const readingPercentile = randomBetween(15, 95);
    const mathPercentile = randomBetween(15, 95);
    const readingGrowthPercentile = randomBetween(10, 90);
    const mathGrowthPercentile = randomBetween(10, 90);

    // Calculate risk level based on metrics
    let riskLevel: StatusLevel;
    let riskScore: number;

    if (attendanceRate < 0.85 || readingGrowthPercentile < 25) {
      riskLevel = 'critical';
      riskScore = randomBetween(60, 85);
    } else if (attendanceRate < 0.92 || readingGrowthPercentile < 40) {
      riskLevel = 'at_risk';
      riskScore = randomBetween(30, 60);
    } else {
      riskLevel = 'on_track';
      riskScore = randomBetween(5, 30);
    }

    const attendanceTier: StatusLevel =
      attendanceRate >= 0.95 ? 'on_track' :
      attendanceRate >= 0.9 ? 'at_risk' : 'critical';

    const growthTier: StatusLevel =
      readingGrowthPercentile >= 50 ? 'on_track' :
      readingGrowthPercentile >= 25 ? 'at_risk' : 'critical';

    students.push({
      id: `student-${i + 1}`,
      firstName,
      lastName,
      displayName: `${lastName}, ${firstName}`,
      gradeLevel: grade,
      riskLevel,
      riskScore,
      attendanceRate,
      attendanceTier,
      daysAbsent: totalDays - daysPresent,
      daysPresent,
      isChronicallyAbsent,
      readingPercentile,
      mathPercentile,
      readingGrowthPercentile,
      mathGrowthPercentile,
      growthTier,
      hasIep: Math.random() < 0.12,
      has504Plan: Math.random() < 0.08,
      isEnglishLearner: Math.random() < 0.15,
      homeroomTeacher: `Ms. ${pickRandom(LAST_NAMES)}`,
    });
  }

  return students;
}

/**
 * Generate mock attendance trend data
 */
export function generateMockAttendanceTrend(weeks: number = 16): AttendanceTrendDataPoint[] {
  const data: AttendanceTrendDataPoint[] = [];
  let baseRate = 0.95;

  // Realistic date range
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - Math.floor(weeks / 4));

  for (let i = 0; i < weeks; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);

    // Add some variation with a slight downward drift (typical for schools)
    const variation = randomFloat(-0.02, 0.015);
    baseRate = Math.min(0.98, Math.max(0.88, baseRate + variation));

    // Higher chronic absence as attendance drops
    const chronicRate = Math.max(0, (0.95 - baseRate) * 2.5 + randomFloat(-0.02, 0.02));

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attendanceRate: baseRate,
      targetRate: 0.95,
      chronicAbsenceRate: chronicRate,
    });
  }

  return data;
}

/**
 * Generate mock risk distribution data (4-tier MTSS model)
 */
export function generateMockRiskDistribution(totalStudents: number = 450): RiskDistributionData {
  // Typical distribution: 60% on-track, 15% watch, 15% at-risk, 10% critical
  const onTrackPct = randomFloat(0.55, 0.65);
  const watchPct = randomFloat(0.12, 0.18);
  const criticalPct = randomFloat(0.08, 0.12);
  const atRiskPct = 1 - onTrackPct - watchPct - criticalPct;

  return {
    onTrack: Math.round(totalStudents * onTrackPct),
    watch: Math.round(totalStudents * watchPct),
    atRisk: Math.round(totalStudents * atRiskPct),
    critical: Math.round(totalStudents * criticalPct),
  };
}

/**
 * Generate mock mastery curve data
 */
export function generateMockMasteryData(weeks: number = 12): MasterySubjectData[] {
  const generateSubjectData = (
    subject: string,
    color: string,
    startMastery: number
  ): MasterySubjectData => {
    const data: MasterySubjectData['data'] = [];
    let mastery = startMastery;

    for (let i = 0; i < weeks; i++) {
      // Gradual improvement with some variation
      const change = randomFloat(-0.03, 0.06);
      mastery = Math.min(0.95, Math.max(0.45, mastery + change));

      data.push({
        week: `Week ${i + 1}`,
        masteryRate: mastery,
        assessmentCount: randomBetween(2, 5),
      });
    }

    return {
      subject,
      data,
      color,
      targetMastery: 0.8,
    };
  };

  return [
    generateSubjectData('ELA', EDUNODE_COLORS.cyan[500], randomFloat(0.55, 0.7)),
    generateSubjectData('Math', EDUNODE_COLORS.emerald[500], randomFloat(0.5, 0.65)),
    generateSubjectData('Science', EDUNODE_COLORS.indigo[500], randomFloat(0.6, 0.75)),
  ];
}

/**
 * Generate mock metrics summary
 */
export function generateMockMetrics() {
  return {
    totalEnrollment: randomBetween(380, 520),
    attendanceRate: randomFloat(0.91, 0.96),
    chronicAbsenceCount: randomBetween(35, 65),
    avgGrowthPercentile: randomBetween(48, 62),
    proficiencyRate: randomFloat(0.55, 0.72),
    teacherCount: randomBetween(28, 42),
  };
}

/**
 * Full mock dashboard data
 */
export function generateMockDashboardData() {
  const metrics = generateMockMetrics();

  return {
    metrics,
    students: generateMockStudents(metrics.totalEnrollment),
    attendanceTrend: generateMockAttendanceTrend(),
    riskDistribution: generateMockRiskDistribution(metrics.totalEnrollment),
    masteryData: generateMockMasteryData(),
  };
}
