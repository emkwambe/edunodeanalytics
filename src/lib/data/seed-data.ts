/**
 * EduNode Analytics - Strategic Seed Data
 * ========================================
 *
 * "Independent Excellence" Narrative:
 * High Growth + Medium-Low Proficiency = Charter Value Demonstration
 *
 * This data proves to authorizers that the charter school is adding value
 * even when students enter below grade level.
 */

import type { Student360Data } from '@/components/dashboard/student-360-card';

// =============================================================================
// SCHOOL CONFIGURATIONS
// =============================================================================

export interface SchoolSeedConfig {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: 'starter' | 'pro' | 'enterprise';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  metrics: SchoolMetrics;
  students: StudentSeedData[];
}

export interface SchoolMetrics {
  totalEnrollment: number;
  attendanceRate: number;
  chronicAbsenceCount: number;
  chronicAbsenceRate: number;
  avgGrowthPercentile: number;
  avgProficiency: number;
  riskDistribution: {
    onTrack: number;
    atRisk: number;
    critical: number;
  };
}

export interface StudentSeedData {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gradeLevel: number;
  attendanceRate: number;
  isChronicallyAbsent: boolean;
  daysAbsent: number;
  daysPresent: number;
  proficiencyLevel: number;
  growthPercentile: number;
  riskLevel: 'on_track' | 'at_risk' | 'critical';
  riskScore: number;
  hasIep: boolean;
  has504Plan: boolean;
  isEnglishLearner: boolean;
  homeroomTeacher: string;
  reading: AssessmentScores;
  math: AssessmentScores;
  /** Purpose-Driven Intelligence metrics */
  purposeDriven?: PurposeDrivenMetrics;
}

export interface AssessmentScores {
  fallRit: number;
  winterRit: number;
  projectedSpringRit: number;
  growthPoints: number;
  growthPercentile: number;
  nationalPercentile: number;
}

// =============================================================================
// PURPOSE-DRIVEN INTELLIGENCE EXTENSIONS
// =============================================================================

export interface AssessmentHistory {
  date: Date;
  score: number;
  subject: 'reading' | 'math';
  assessmentType: 'formative' | 'interim' | 'benchmark';
}

export interface InterventionSession {
  id: string;
  date: Date;
  durationMinutes: number;
  interventionType: string;
  subject: 'reading' | 'math' | 'behavior' | 'attendance';
  engagementScore?: number;
  notes?: string;
}

export interface MobilityRecord {
  enrollmentDate: Date;
  previousSchool?: string;
  exitDate?: Date;
  newSchool?: string;
  daysEnrolled: number;
}

export interface PurposeDrivenMetrics {
  /** Assessment score history for volatility calculation */
  assessmentHistory: AssessmentHistory[];
  /** Intervention sessions for dosage tracking */
  interventionSessions: InterventionSession[];
  /** Mobility/enrollment records */
  mobilityRecord: MobilityRecord;
  /** Last data update timestamp */
  lastDataUpdate: Date;
  /** Target intervention minutes per 21-day window */
  targetInterventionMinutes: number;
  /** Expected growth (RIT points) per 9-week window */
  expectedGrowthPoints: number;
}

// =============================================================================
// NAME POOLS
// =============================================================================

const FIRST_NAMES = [
  'Jayden', 'Aaliyah', 'Mateo', 'Zoe', 'Malik', 'Elena', 'Isaiah', 'Sofia',
  'Marcus', 'Aria', 'DeShawn', 'Luna', 'Xavier', 'Mia', 'Aiden', 'Camila',
  'Elijah', 'Valentina', 'Josiah', 'Gabriella', 'Khalil', 'Stella', 'Damian',
  'Bella', 'Jaxon', 'Natalia', 'Kayden', 'Layla', 'Brandon', 'Penelope',
  'Tyler', 'Riley', 'Jordan', 'Avery', 'Cameron', 'Harper', 'Mason', 'Evelyn',
  'Ethan', 'Abigail', 'Noah', 'Emily', 'Liam', 'Madison', 'Lucas', 'Chloe',
];

const LAST_NAMES = [
  'Smith', 'Garcia', 'Johnson', 'Williams', 'Chen', 'Rodriguez', 'Martinez',
  'Brown', 'Davis', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore',
  'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
];

const TEACHERS = [
  'Ms. Johnson', 'Mr. Chen', 'Ms. Rodriguez', 'Mr. Williams',
  'Ms. Davis', 'Mr. Thompson', 'Ms. Martinez', 'Mr. Lee',
];

// =============================================================================
// SEEDED RANDOM (Deterministic for consistency)
// =============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// =============================================================================
// STRATEGIC DATA GENERATION
// =============================================================================

function calculateRiskLevel(
  proficiency: number,
  growth: number,
  attendance: number
): 'on_track' | 'at_risk' | 'critical' {
  let riskScore = 0;

  // Proficiency factor
  if (proficiency < 30) riskScore += 35;
  else if (proficiency < 45) riskScore += 25;
  else if (proficiency < 60) riskScore += 15;
  else riskScore += 5;

  // Growth factor (protective)
  if (growth >= 80) riskScore -= 20;
  else if (growth >= 60) riskScore -= 10;
  else if (growth >= 40) riskScore += 5;
  else riskScore += 15;

  // Attendance factor
  if (attendance < 0.85) riskScore += 30;
  else if (attendance < 0.90) riskScore += 20;
  else if (attendance < 0.95) riskScore += 10;

  if (riskScore >= 50) return 'critical';
  if (riskScore >= 30) return 'at_risk';
  return 'on_track';
}

function calculateRiskScore(
  proficiency: number,
  growth: number,
  attendance: number,
  hasIep: boolean,
  isEll: boolean
): number {
  let score = 0;
  score += Math.max(0, (60 - proficiency) * 0.5);
  score -= (growth - 50) * 0.25;
  if (attendance < 0.90) score += (0.90 - attendance) * 200;
  if (hasIep) score += 5;
  if (isEll) score += 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateNweaScores(
  rng: SeededRandom,
  grade: number,
  proficiency: number,
  growth: number
): AssessmentScores {
  const baseRit: Record<number, number> = {
    6: 210, 7: 215, 8: 220, 9: 222, 10: 225, 11: 227, 12: 228,
  };

  const base = baseRit[grade] || 215;
  const proficiencyAdjustment = (proficiency - 50) * 0.3;
  const fallRit = Math.round(base + proficiencyAdjustment + rng.nextInt(-3, 3));
  const growthPoints = Math.round(growth * 0.12);
  const winterRit = fallRit + Math.round(growthPoints * 0.6) + rng.nextInt(-1, 2);
  const projectedSpringRit = fallRit + growthPoints + rng.nextInt(-2, 3);

  return {
    fallRit,
    winterRit,
    projectedSpringRit,
    growthPoints: winterRit - fallRit,
    growthPercentile: growth,
    nationalPercentile: Math.min(99, Math.max(1, proficiency + rng.nextInt(-5, 5))),
  };
}

function generatePurposeDrivenMetrics(
  rng: SeededRandom,
  reading: AssessmentScores,
  math: AssessmentScores,
  riskLevel: 'on_track' | 'at_risk' | 'critical',
  hasIep: boolean
): PurposeDrivenMetrics {
  const now = new Date();
  const schoolYearStart = new Date(now.getFullYear(), 7, 15); // Aug 15

  // Generate assessment history with some volatility
  const assessmentHistory: AssessmentHistory[] = [];
  const volatilityFactor = riskLevel === 'critical' ? 8 : riskLevel === 'at_risk' ? 5 : 2;

  // Reading assessments
  const readingScores = [
    { date: new Date(schoolYearStart.getTime() + 14 * 24 * 60 * 60 * 1000), score: reading.fallRit },
    { date: new Date(schoolYearStart.getTime() + 45 * 24 * 60 * 60 * 1000), score: reading.fallRit + rng.nextInt(-volatilityFactor, volatilityFactor + 2) },
    { date: new Date(schoolYearStart.getTime() + 75 * 24 * 60 * 60 * 1000), score: reading.fallRit + rng.nextInt(0, volatilityFactor + 3) },
    { date: new Date(schoolYearStart.getTime() + 105 * 24 * 60 * 60 * 1000), score: reading.winterRit - rng.nextInt(0, 2) },
    { date: new Date(schoolYearStart.getTime() + 120 * 24 * 60 * 60 * 1000), score: reading.winterRit },
  ];

  readingScores.forEach((s) => {
    assessmentHistory.push({
      date: s.date,
      score: s.score,
      subject: 'reading',
      assessmentType: s.date.getTime() === schoolYearStart.getTime() + 14 * 24 * 60 * 60 * 1000 ? 'benchmark' : 'formative',
    });
  });

  // Math assessments
  const mathScores = [
    { date: new Date(schoolYearStart.getTime() + 14 * 24 * 60 * 60 * 1000), score: math.fallRit },
    { date: new Date(schoolYearStart.getTime() + 50 * 24 * 60 * 60 * 1000), score: math.fallRit + rng.nextInt(-volatilityFactor, volatilityFactor + 1) },
    { date: new Date(schoolYearStart.getTime() + 80 * 24 * 60 * 60 * 1000), score: math.fallRit + rng.nextInt(1, volatilityFactor + 2) },
    { date: new Date(schoolYearStart.getTime() + 110 * 24 * 60 * 60 * 1000), score: math.winterRit - rng.nextInt(0, 3) },
    { date: new Date(schoolYearStart.getTime() + 120 * 24 * 60 * 60 * 1000), score: math.winterRit },
  ];

  mathScores.forEach((s) => {
    assessmentHistory.push({
      date: s.date,
      score: s.score,
      subject: 'math',
      assessmentType: s.date.getTime() === schoolYearStart.getTime() + 14 * 24 * 60 * 60 * 1000 ? 'benchmark' : 'formative',
    });
  });

  // Generate intervention sessions for at-risk and critical students
  const interventionSessions: InterventionSession[] = [];
  const targetMinutes = hasIep ? 600 : riskLevel === 'critical' ? 450 : riskLevel === 'at_risk' ? 300 : 0;

  if (targetMinutes > 0) {
    const numSessions = rng.nextInt(8, 18);
    const interventionTypes = ['Small Group Reading', 'Math Tutoring', 'Phonics Intervention', 'Fluency Practice'];
    const subjects: Array<'reading' | 'math'> = ['reading', 'math'];

    for (let i = 0; i < numSessions; i++) {
      const sessionDate = new Date(schoolYearStart.getTime() + (30 + i * 5) * 24 * 60 * 60 * 1000);
      interventionSessions.push({
        id: `int_${rng.nextInt(10000, 99999)}`,
        date: sessionDate,
        durationMinutes: rng.nextInt(20, 45),
        interventionType: rng.pick(interventionTypes),
        subject: rng.pick(subjects),
        engagementScore: rng.nextInt(60, 100),
      });
    }
  }

  // Mobility record
  const enrollmentDate = new Date(schoolYearStart.getTime() - rng.nextInt(0, 30) * 24 * 60 * 60 * 1000);
  const daysEnrolled = Math.floor((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));

  // Last data update (simulate some staleness for demo)
  const stalenessFactor = rng.nextInt(0, 14);
  const lastDataUpdate = new Date(now.getTime() - stalenessFactor * 24 * 60 * 60 * 1000);

  return {
    assessmentHistory,
    interventionSessions,
    mobilityRecord: {
      enrollmentDate,
      daysEnrolled,
      previousSchool: rng.next() < 0.15 ? 'Previous District School' : undefined,
    },
    lastDataUpdate,
    targetInterventionMinutes: targetMinutes,
    expectedGrowthPoints: Math.round((reading.projectedSpringRit - reading.fallRit) / 3), // Per 9-week window
  };
}

function generateStudent(
  rng: SeededRandom,
  schoolId: string,
  gradeLevels: number[],
  index: number
): StudentSeedData {
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  const grade = rng.pick(gradeLevels);

  // STRATEGIC BIAS: High Growth, Medium-Low Proficiency
  const roll = rng.next();
  let proficiency: number;
  let growth: number;

  if (roll < 0.70) {
    // High Growth Cohort (70% - demonstrates charter value)
    proficiency = rng.nextInt(30, 55);
    growth = rng.nextInt(75, 95);
  } else if (roll < 0.90) {
    // Steady Progress Cohort (20%)
    proficiency = rng.nextInt(50, 70);
    growth = rng.nextInt(50, 70);
  } else {
    // High Achievers (10%)
    proficiency = rng.nextInt(65, 85);
    growth = rng.nextInt(40, 80);
  }

  // 15% chronic absence rate
  const isChronic = rng.next() < 0.15;
  const attendanceRate = isChronic
    ? rng.nextInt(75, 89) / 100
    : rng.nextInt(92, 99) / 100;

  const daysEnrolled = rng.nextInt(85, 95);
  const daysPresent = Math.round(daysEnrolled * attendanceRate);

  const hasIep = rng.next() < 0.14;
  const has504Plan = rng.next() < 0.08 && !hasIep;
  const isEll = rng.next() < 0.18;

  const riskLevel = calculateRiskLevel(proficiency, growth, attendanceRate);
  const riskScore = calculateRiskScore(proficiency, growth, attendanceRate, hasIep, isEll);

  const mathProficiency = proficiency + rng.nextInt(-10, 10);
  const mathGrowth = growth + rng.nextInt(-10, 10);

  const readingScores = generateNweaScores(rng, grade, proficiency, growth);
  const mathScores = generateNweaScores(rng, grade, mathProficiency, mathGrowth);

  return {
    id: `stu_${schoolId.slice(0, 4)}_${index.toString().padStart(4, '0')}`,
    firstName,
    lastName,
    displayName: `${lastName}, ${firstName}`,
    gradeLevel: grade,
    attendanceRate,
    isChronicallyAbsent: isChronic,
    daysAbsent: daysEnrolled - daysPresent,
    daysPresent,
    proficiencyLevel: proficiency,
    growthPercentile: growth,
    riskLevel,
    riskScore,
    hasIep,
    has504Plan,
    isEnglishLearner: isEll,
    homeroomTeacher: rng.pick(TEACHERS),
    reading: readingScores,
    math: mathScores,
    purposeDriven: generatePurposeDrivenMetrics(rng, readingScores, mathScores, riskLevel, hasIep),
  };
}

export function generateSchoolSeed(
  schoolId: string,
  name: string,
  slug: string,
  studentCount: number,
  gradeLevels: number[],
  colors: { primary: string; secondary: string; accent: string },
  subscriptionTier: 'starter' | 'pro' | 'enterprise' = 'pro',
  seed: number = 42
): SchoolSeedConfig {
  const rng = new SeededRandom(seed);
  const students: StudentSeedData[] = [];

  for (let i = 0; i < studentCount; i++) {
    students.push(generateStudent(rng, schoolId, gradeLevels, i));
  }

  // Calculate metrics
  const totalEnrollment = students.length;
  const attendanceRate = students.reduce((s, st) => s + st.attendanceRate, 0) / totalEnrollment;
  const chronicAbsenceCount = students.filter((s) => s.isChronicallyAbsent).length;
  const avgGrowthPercentile = students.reduce((s, st) => s + st.growthPercentile, 0) / totalEnrollment;
  const avgProficiency = students.reduce((s, st) => s + st.proficiencyLevel, 0) / totalEnrollment;

  const onTrack = students.filter((s) => s.riskLevel === 'on_track').length;
  const atRisk = students.filter((s) => s.riskLevel === 'at_risk').length;
  const critical = students.filter((s) => s.riskLevel === 'critical').length;

  return {
    id: schoolId,
    name,
    slug,
    subscriptionTier,
    colors,
    metrics: {
      totalEnrollment,
      attendanceRate: Math.round(attendanceRate * 1000) / 1000,
      chronicAbsenceCount,
      chronicAbsenceRate: Math.round((chronicAbsenceCount / totalEnrollment) * 1000) / 1000,
      avgGrowthPercentile: Math.round(avgGrowthPercentile * 10) / 10,
      avgProficiency: Math.round(avgProficiency * 10) / 10,
      riskDistribution: { onTrack, atRisk, critical },
    },
    students,
  };
}

// =============================================================================
// PRE-GENERATED SCHOOL SEEDS
// =============================================================================

export const SCHOOL_SEEDS: Record<string, SchoolSeedConfig> = {
  // Enterprise tier - full access to all features including network view
  'academy-tomorrow': generateSchoolSeed(
    'sch_academy_tomorrow_001',
    'Academy of Tomorrow Charter',
    'academy-tomorrow',
    487,
    [6, 7, 8],
    { primary: '#6366f1', secondary: '#06b6d4', accent: '#10b981' },
    'enterprise',
    12345
  ),
  // Starter tier - basic compliance features only (demo feature gating)
  'innovation-prep': generateSchoolSeed(
    'sch_innovation_prep_002',
    'Innovation Prep Academy',
    'innovation-prep',
    312,
    [9, 10, 11, 12],
    { primary: '#8b5cf6', secondary: '#06b6d4', accent: '#10b981' },
    'starter',
    67890
  ),
  // Professional tier - Student 360, Intervention Hub, AI features
  'stem-scholars': generateSchoolSeed(
    'sch_stem_scholars_003',
    'STEM Scholars Charter',
    'stem-scholars',
    628,
    [6, 7, 8, 9, 10, 11, 12],
    { primary: '#0ea5e9', secondary: '#10b981', accent: '#f59e0b' },
    'pro',
    11111
  ),
  // Professional tier - Demo school
  'academy-charter': generateSchoolSeed(
    'sch_academy_charter_demo',
    'Academy Charter School',
    'academy-charter',
    487,
    [6, 7, 8],
    { primary: '#6366f1', secondary: '#06b6d4', accent: '#10b981' },
    'pro',
    42424
  ),
};

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert seed data to Student360Data format for UI components
 */
export function toStudent360Data(student: StudentSeedData): Student360Data {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    displayName: student.displayName,
    gradeLevel: student.gradeLevel,
    avatarUrl: undefined,
    riskLevel: student.riskLevel,
    riskScore: student.riskScore,
    attendanceRate: student.attendanceRate,
    attendanceTier: student.attendanceRate >= 0.95 ? 'on_track' :
                    student.attendanceRate >= 0.90 ? 'at_risk' : 'critical',
    daysAbsent: student.daysAbsent,
    daysPresent: student.daysPresent,
    isChronicallyAbsent: student.isChronicallyAbsent,
    readingPercentile: student.reading.nationalPercentile,
    mathPercentile: student.math.nationalPercentile,
    readingGrowthPercentile: student.reading.growthPercentile,
    mathGrowthPercentile: student.math.growthPercentile,
    growthTier: student.growthPercentile >= 60 ? 'on_track' :
                student.growthPercentile >= 40 ? 'at_risk' : 'critical',
    hasIep: student.hasIep,
    has504Plan: student.has504Plan,
    isEnglishLearner: student.isEnglishLearner,
    homeroomTeacher: student.homeroomTeacher,
  };
}

/**
 * Get school seed data by slug (with fallback)
 */
export function getSchoolSeed(slug: string): SchoolSeedConfig | null {
  return SCHOOL_SEEDS[slug] || null;
}

/**
 * Get all available school slugs
 */
export function getAvailableSchoolSlugs(): string[] {
  return Object.keys(SCHOOL_SEEDS);
}
