/**
 * EduNode Analytics - Demo Data Seeding Script
 *
 * Populates the database with realistic demo data for development/demos.
 * Run with: npx tsx supabase/seed-demo-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo school IDs (must match schools from migration 00001)
const DEMO_SCHOOLS = {
  'academy-charter': { name: 'Academy Charter School' },
  'innovation-prep': { name: 'Innovation Prep Academy' },
  'stem-scholars': { name: 'STEM Scholars Charter' },
};

// Sample first names
const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery', 'Jackson',
  'Ella', 'Sebastian', 'Scarlett', 'Aiden', 'Grace', 'Matthew', 'Chloe', 'Samuel',
  'Victoria', 'David', 'Riley', 'Joseph', 'Aria', 'Carter', 'Lily', 'Owen',
  'Aurora', 'Wyatt', 'Zoey', 'John',
];

// Sample last names
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

// Homeroom teachers
const TEACHERS = [
  'Ms. Johnson', 'Mr. Williams', 'Ms. Garcia', 'Mr. Davis', 'Ms. Martinez',
  'Mr. Anderson', 'Ms. Thomas', 'Mr. Taylor', 'Ms. Moore', 'Mr. Jackson',
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function generateStudent(schoolId: string, gradeLevel: number, index: number) {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const displayName = `${firstName} ${lastName}`;

  // Generate realistic attendance
  const daysInYear = 180;
  const attendanceRate = randomFloat(75, 100);
  const daysPresent = Math.round((attendanceRate / 100) * daysInYear);
  const daysAbsent = daysInYear - daysPresent;
  const isChronicallyAbsent = attendanceRate < 90;

  // Generate academic metrics
  const proficiencyLevel = randomFloat(20, 95);
  const growthPercentile = randomInt(1, 99);

  // Calculate risk
  let riskLevel: 'on_track' | 'at_risk' | 'critical' = 'on_track';
  let riskScore = 0;
  const riskFactors: string[] = [];

  if (attendanceRate < 85) {
    riskScore += 20;
    riskFactors.push('Low attendance rate');
  }
  if (isChronicallyAbsent) {
    riskScore += 15;
    riskFactors.push('Chronically absent');
  }
  if (proficiencyLevel < 40) {
    riskScore += 25;
    riskFactors.push('Below proficiency');
  }
  if (growthPercentile < 25) {
    riskScore += 15;
    riskFactors.push('Low growth trajectory');
  }

  if (riskScore >= 50) {
    riskLevel = 'critical';
  } else if (riskScore >= 25) {
    riskLevel = 'at_risk';
  }

  // Program flags
  const hasIep = Math.random() < 0.12;
  const has504Plan = Math.random() < 0.08;
  const isEnglishLearner = Math.random() < 0.15;

  if (hasIep) riskFactors.push('Has IEP');
  if (isEnglishLearner) riskFactors.push('English learner');

  // Generate assessment scores
  const baseRit = 180 + (gradeLevel * 8) + randomInt(-20, 20);
  const readingScores = {
    fallRit: baseRit,
    winterRit: baseRit + randomInt(2, 8),
    springRit: baseRit + randomInt(5, 15),
    growthPoints: randomInt(3, 15),
    growthPercentile: randomInt(10, 90),
  };

  const mathScores = {
    fallRit: baseRit + randomInt(-10, 10),
    winterRit: baseRit + randomInt(0, 12),
    springRit: baseRit + randomInt(8, 18),
    growthPoints: randomInt(5, 18),
    growthPercentile: randomInt(15, 95),
  };

  return {
    school_id: schoolId,
    sis_student_id: `STU-${gradeLevel.toString().padStart(2, '0')}-${index.toString().padStart(4, '0')}`,
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    grade_level: gradeLevel,
    has_iep: hasIep,
    has_504_plan: has504Plan,
    is_english_learner: isEnglishLearner,
    is_gifted: Math.random() < 0.05,
    is_free_reduced_lunch: Math.random() < 0.45,
    homeroom_teacher: randomChoice(TEACHERS),
    attendance_rate: attendanceRate,
    days_present: daysPresent,
    days_absent: daysAbsent,
    is_chronically_absent: isChronicallyAbsent,
    proficiency_level: proficiencyLevel,
    growth_percentile: growthPercentile,
    risk_level: riskLevel,
    risk_score: riskScore,
    risk_factors: riskFactors,
    reading_scores: readingScores,
    math_scores: mathScores,
    is_active: true,
  };
}

function generateIntervention(
  schoolId: string,
  studentId: string,
  type: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement'
) {
  const titles: Record<string, string[]> = {
    academic: ['Math tutoring', 'Reading intervention', 'After-school support', 'Small group instruction'],
    attendance: ['Attendance contract', 'Morning check-ins', 'Parent outreach', 'Transportation support'],
    behavior: ['Behavior plan', 'Counseling referral', 'Positive reinforcement', 'Check-in/check-out'],
    sel: ['Social skills group', 'Mindfulness practice', 'Peer mentoring', 'Emotional regulation support'],
    family_engagement: ['Home visit', 'Family conference', 'Resource connection', 'Parent workshop'],
  };

  const statuses: ('planned' | 'in_progress' | 'completed')[] = ['planned', 'in_progress', 'completed'];
  const status = randomChoice(statuses);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - randomInt(10, 60));

  const targetEndDate = new Date(startDate);
  targetEndDate.setDate(targetEndDate.getDate() + randomInt(30, 90));

  return {
    school_id: schoolId,
    student_id: studentId,
    type,
    title: randomChoice(titles[type]),
    description: `Intervention to support student success in ${type} area.`,
    status,
    priority: randomChoice(['low', 'medium', 'high', 'urgent'] as const),
    start_date: startDate.toISOString().split('T')[0],
    target_end_date: targetEndDate.toISOString().split('T')[0],
    actual_end_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
    goal: `Improve ${type} outcomes`,
    success_criteria: `Student shows measurable improvement in ${type} metrics`,
    baseline_value: randomFloat(30, 60),
    target_value: randomFloat(70, 90),
    current_value: status === 'completed' ? randomFloat(65, 95) : randomFloat(40, 70),
    was_successful: status === 'completed' ? Math.random() > 0.3 : null,
  };
}

async function seedDemoData() {
  console.log('Starting demo data seeding...\n');

  // Get school IDs
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, slug')
    .in('slug', Object.keys(DEMO_SCHOOLS));

  if (schoolsError) {
    console.error('Error fetching schools:', schoolsError);
    return;
  }

  if (!schools || schools.length === 0) {
    console.error('No demo schools found. Run migration 00001 first.');
    return;
  }

  console.log(`Found ${schools.length} demo schools\n`);

  for (const school of schools) {
    console.log(`\nSeeding data for ${school.slug}...`);

    // Generate students for grades K-8 (grade 0 = K)
    const students: ReturnType<typeof generateStudent>[] = [];
    let studentIndex = 1;

    for (let grade = 0; grade <= 8; grade++) {
      const studentsPerGrade = randomInt(25, 35);
      for (let i = 0; i < studentsPerGrade; i++) {
        students.push(generateStudent(school.id, grade, studentIndex++));
      }
    }

    console.log(`  Generated ${students.length} students`);

    // Insert students in batches of 50
    const batchSize = 50;
    const insertedStudentIds: string[] = [];

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const { data: inserted, error } = await supabase
        .from('students')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`  Error inserting students batch ${i / batchSize + 1}:`, error);
      } else if (inserted) {
        insertedStudentIds.push(...inserted.map((s) => s.id));
      }
    }

    console.log(`  Inserted ${insertedStudentIds.length} students`);

    // Generate interventions for at-risk students
    const { data: atRiskStudents } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', school.id)
      .in('risk_level', ['at_risk', 'critical'])
      .limit(50);

    if (atRiskStudents && atRiskStudents.length > 0) {
      const interventionTypes: ('academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement')[] = [
        'academic',
        'attendance',
        'behavior',
        'sel',
        'family_engagement',
      ];

      const interventions = atRiskStudents.flatMap((student) => {
        const numInterventions = randomInt(1, 3);
        const selectedTypes = interventionTypes
          .sort(() => Math.random() - 0.5)
          .slice(0, numInterventions);

        return selectedTypes.map((type) =>
          generateIntervention(school.id, student.id, type)
        );
      });

      const { error: interventionsError } = await supabase
        .from('interventions')
        .insert(interventions);

      if (interventionsError) {
        console.error('  Error inserting interventions:', interventionsError);
      } else {
        console.log(`  Inserted ${interventions.length} interventions`);
      }
    }

    // Generate data sources
    const dataSources = [
      {
        school_id: school.id,
        name: 'Clever Roster Sync',
        type: 'sis' as const,
        provider: 'clever' as const,
        sync_enabled: true,
        sync_frequency_hours: 24,
        sync_status: 'completed' as const,
        records_synced: students.length,
        last_record_count: students.length,
        is_active: true,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      },
      {
        school_id: school.id,
        name: 'NWEA MAP Assessments',
        type: 'assessment' as const,
        provider: 'nwea_map' as const,
        sync_enabled: true,
        sync_frequency_hours: 168,
        sync_status: 'completed' as const,
        records_synced: students.length * 3,
        last_record_count: students.length,
        is_active: true,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      },
    ];

    const { error: dataSourcesError } = await supabase
      .from('data_sources')
      .upsert(dataSources, { onConflict: 'school_id,provider' });

    if (dataSourcesError) {
      console.error('  Error inserting data sources:', dataSourcesError);
    } else {
      console.log(`  Inserted ${dataSources.length} data sources`);
    }
  }

  console.log('\n\nDemo data seeding complete!');
}

seedDemoData().catch(console.error);
