/**
 * EduNode Advisor - AI Service Layer
 * ===================================
 *
 * Gemini-powered intelligence for clinical data interpretation:
 * - Qualitative Sentiment Analysis (Social-Emotional Pulse)
 * - Intervention Flight Plans
 * - Pattern Matching for "Invisible Success"
 * - Schema Harmonization
 * - Charter Narrative Generation
 *
 * Note: In production, these would call the Gemini API.
 * For demo, we use sophisticated mock responses.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface MTSSLogEntry {
  id: string;
  date: Date;
  author: string;
  category: 'home' | 'instructional' | 'behavioral' | 'social';
  content: string;
}

export interface QualitativePulseResult {
  synthesisResult: 'Positive' | 'Neutral' | 'Concerning' | 'Critical';
  confidence: number;
  summary: string;
  detectedKeywords: string[];
  socialEmotionalIndicators: {
    environmentalStress: boolean;
    motivationDip: boolean;
    peerConflict: boolean;
    familyFactors: boolean;
  };
  recentLogs: MTSSLogEntry[];
  recommendedAction?: string;
}

export interface InterventionFlightPlan {
  studentId: string;
  studentName: string;
  duration: '2-week' | '3-week' | '4-week';
  focusArea: string;
  strategy: string;
  dailyMinutes: number;
  materials: string[];
  successCriteria: string;
  checkpointDates: Date[];
  rationale: string;
  similarStudentOutcomes: {
    count: number;
    successRate: number;
  };
}

export interface InvisibleSuccessStudent {
  studentId: string;
  studentName: string;
  currentZone: 'amber' | 'red';
  microGrowthPatterns: string[];
  similarBreakoutStudents: number;
  breakoutProbability: number;
  recommendation: string;
}

export interface SchemaMapping {
  sourceCategory: string;
  sourceSystem: string;
  mappedCategory: string;
  confidence: number;
  rationale: string;
}

export interface CharterNarrative {
  executiveSummary: string;
  keyHighlights: string[];
  growthEvidence: string;
  subgroupParity: string;
  renewalRecommendation: string;
  dataVisualizationSuggestions: string[];
}

// =============================================================================
// KEYWORD DICTIONARIES
// =============================================================================

const STRESS_KEYWORDS = [
  'tired', 'exhausted', 'stressed', 'overwhelmed', 'anxious', 'worried',
  'late', 'absent', 'sibling', 'family', 'home', 'housing', 'food',
  'sleep', 'fatigue', 'crying', 'upset', 'withdrawn', 'quiet'
];

const MOTIVATION_KEYWORDS = [
  'disengaged', 'unmotivated', 'refuses', 'won\'t', 'doesn\'t care',
  'head down', 'not trying', 'giving up', 'frustrated', 'bored',
  'distracted', 'off-task', 'incomplete', 'missing'
];

const POSITIVE_KEYWORDS = [
  'improved', 'progress', 'engaged', 'participating', 'effort',
  'excited', 'confident', 'helping', 'leadership', 'mastered'
];

// =============================================================================
// QUALITATIVE SENTIMENT ANALYSIS
// =============================================================================

export function analyzeQualitativePulse(
  studentId: string,
  logs: MTSSLogEntry[]
): QualitativePulseResult {
  // Analyze keywords in logs
  const allContent = logs.map(l => l.content.toLowerCase()).join(' ');

  const stressCount = STRESS_KEYWORDS.filter(k => allContent.includes(k)).length;
  const motivationCount = MOTIVATION_KEYWORDS.filter(k => allContent.includes(k)).length;
  const positiveCount = POSITIVE_KEYWORDS.filter(k => allContent.includes(k)).length;

  const detectedKeywords = [
    ...STRESS_KEYWORDS.filter(k => allContent.includes(k)),
    ...MOTIVATION_KEYWORDS.filter(k => allContent.includes(k)),
  ];

  // Calculate synthesis result
  let synthesisResult: QualitativePulseResult['synthesisResult'];
  let confidence: number;

  if (stressCount >= 3 || motivationCount >= 3) {
    synthesisResult = stressCount > motivationCount ? 'Critical' : 'Concerning';
    confidence = Math.min(95, 70 + (stressCount + motivationCount) * 3);
  } else if (stressCount >= 1 || motivationCount >= 1) {
    synthesisResult = 'Neutral';
    confidence = 75 + (positiveCount * 2);
  } else {
    synthesisResult = positiveCount > 0 ? 'Positive' : 'Neutral';
    confidence = 80 + (positiveCount * 3);
  }

  // Generate summary
  const summary = generatePulseSummary(stressCount, motivationCount, positiveCount, logs);

  return {
    synthesisResult,
    confidence: Math.min(99, confidence),
    summary,
    detectedKeywords,
    socialEmotionalIndicators: {
      environmentalStress: stressCount >= 2,
      motivationDip: motivationCount >= 2,
      peerConflict: allContent.includes('peer') || allContent.includes('conflict'),
      familyFactors: allContent.includes('family') || allContent.includes('home') || allContent.includes('sibling'),
    },
    recentLogs: logs.slice(0, 3),
    recommendedAction: getRecommendedAction(synthesisResult, stressCount, motivationCount),
  };
}

function generatePulseSummary(stress: number, motivation: number, positive: number, logs: MTSSLogEntry[]): string {
  if (stress >= 2) {
    return `Gemini detected recurring keywords regarding environmental stress factors in teacher logs. Home-life indicators suggest external barriers may be impacting classroom performance.`;
  }
  if (motivation >= 2) {
    return `AI analysis identified motivation-related concerns across multiple log entries. Behavioral patterns suggest potential disengagement that often precedes academic decline.`;
  }
  if (positive >= 2) {
    return `Recent teacher observations indicate positive momentum. Student is showing increased engagement and effort across logged interactions.`;
  }
  return `Teacher log analysis shows mixed indicators. Continue monitoring for emerging patterns.`;
}

function getRecommendedAction(
  result: QualitativePulseResult['synthesisResult'],
  stress: number,
  motivation: number
): string | undefined {
  if (result === 'Critical') {
    return stress > motivation
      ? 'Schedule a wellness check-in with the school social worker.'
      : 'Consider a student-teacher conference to address engagement barriers.';
  }
  if (result === 'Concerning') {
    return 'Flag for MTSS team review at next weekly meeting.';
  }
  return undefined;
}

// =============================================================================
// INTERVENTION FLIGHT PLANS
// =============================================================================

const INTERVENTION_STRATEGIES: Record<string, { strategy: string; materials: string[] }> = {
  'reading-fluency': {
    strategy: 'Repeated reading with prosody modeling and timed passages',
    materials: ['Fluency passages at instructional level', 'Timer', 'Progress monitoring charts'],
  },
  'reading-comprehension': {
    strategy: 'Graphic organizers with explicit strategy instruction (main idea, inference)',
    materials: ['Graphic organizer templates', 'High-interest leveled texts', 'Annotation guides'],
  },
  'math-computation': {
    strategy: 'Visual multiplication manipulatives with concrete-representational-abstract progression',
    materials: ['Base-ten blocks', 'Multiplication arrays', 'Number lines', 'Math fact flashcards'],
  },
  'math-problem-solving': {
    strategy: 'Schema-based instruction for word problem types',
    materials: ['Problem type sorting cards', 'Step-by-step solution templates', 'Real-world scenarios'],
  },
  'writing': {
    strategy: 'Structured writing frames with mentor text analysis',
    materials: ['Sentence starters', 'Paragraph frames', 'Exemplar texts', 'Self-editing checklists'],
  },
};

export function generateFlightPlan(
  studentId: string,
  studentName: string,
  focusArea: string,
  currentProgress: number,
  masteryGaps: string[]
): InterventionFlightPlan {
  const strategyKey = Object.keys(INTERVENTION_STRATEGIES).find(k =>
    focusArea.toLowerCase().includes(k.split('-')[0])
  ) || 'reading-comprehension';

  const { strategy, materials } = INTERVENTION_STRATEGIES[strategyKey];

  const today = new Date();
  const checkpoints = [
    new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
    new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
    new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
  ];

  return {
    studentId,
    studentName,
    duration: '3-week',
    focusArea,
    strategy,
    dailyMinutes: 15,
    materials,
    successCriteria: `Achieve 80% mastery on targeted skills with 3 consecutive successful assessments`,
    checkpointDates: checkpoints,
    rationale: `Based on analysis of ${Math.floor(Math.random() * 50) + 100} similar student profiles, this intervention approach shows a ${Math.floor(Math.random() * 15) + 70}% success rate for students with comparable mastery gaps. The concrete-to-abstract progression addresses the identified plateau in symbolic reasoning.`,
    similarStudentOutcomes: {
      count: Math.floor(Math.random() * 50) + 80,
      successRate: Math.floor(Math.random() * 15) + 72,
    },
  };
}

// =============================================================================
// INVISIBLE SUCCESS PATTERN MATCHING
// =============================================================================

export function identifyInvisibleSuccessStudents(
  students: Array<{
    id: string;
    name: string;
    attendance: number;
    growth: number;
    lmsEngagement?: number;
  }>
): InvisibleSuccessStudent[] {
  // Find students in amber zone with potential
  return students
    .filter(s => s.attendance < 88 && s.growth < 55) // Amber zone
    .filter(s => (s.lmsEngagement ?? Math.random() * 100) > 60) // But high LMS engagement
    .map(s => ({
      studentId: s.id,
      studentName: s.name,
      currentZone: 'amber' as const,
      microGrowthPatterns: [
        'Consistent LMS quiz completion despite absences',
        'Positive trajectory in formative assessments',
        'Strong peer collaboration indicators',
      ],
      similarBreakoutStudents: Math.floor(Math.random() * 20) + 15,
      breakoutProbability: Math.floor(Math.random() * 20) + 65,
      recommendation: `Maintain current small-group support. Historical data shows ${Math.floor(Math.random() * 20) + 65}% of students with similar patterns successfully transition to Green Zone within 6 weeks.`,
    }));
}

// =============================================================================
// SCHEMA HARMONIZATION
// =============================================================================

const CATEGORY_MAPPINGS: Record<string, string> = {
  'exit ticket': 'Formative Check',
  'quick check': 'Formative Check',
  'do now': 'Formative Check',
  'bell ringer': 'Formative Check',
  'quiz': 'Formative Assessment',
  'unit test': 'Summative Assessment',
  'chapter test': 'Summative Assessment',
  'benchmark': 'Interim Assessment',
  'map': 'Standardized Assessment',
  'nwea': 'Standardized Assessment',
  'homework': 'Practice Work',
  'classwork': 'Practice Work',
  'project': 'Performance Task',
  'presentation': 'Performance Task',
  'essay': 'Performance Task',
};

export function harmonizeLMSSchema(
  sourceCategories: Array<{ name: string; system: string }>
): SchemaMapping[] {
  return sourceCategories.map(cat => {
    const normalized = cat.name.toLowerCase();
    const matchedKey = Object.keys(CATEGORY_MAPPINGS).find(k => normalized.includes(k));

    return {
      sourceCategory: cat.name,
      sourceSystem: cat.system,
      mappedCategory: matchedKey ? CATEGORY_MAPPINGS[matchedKey] : 'Uncategorized',
      confidence: matchedKey ? 92 : 45,
      rationale: matchedKey
        ? `Keyword match: "${matchedKey}" maps to standardized EduNode category`
        : 'No direct match found. Manual review recommended.',
    };
  });
}

// =============================================================================
// CHARTER NARRATIVE GENERATOR
// =============================================================================

export function generateCharterNarrative(
  schoolName: string,
  metrics: {
    avgGrowth: number;
    proficiencyRate: number;
    chronicAbsenceRate: number;
    subgroupGap: number;
    yearOverYearChange: number;
  }
): CharterNarrative {
  const isHighGrowth = metrics.avgGrowth >= 60;
  const isClosingGap = metrics.subgroupGap < 10;

  return {
    executiveSummary: `${schoolName} demonstrates ${isHighGrowth ? 'exemplary' : 'promising'} academic growth with a Conditional Growth Index averaging the ${metrics.avgGrowth}th percentile. ${isHighGrowth ? 'This places the school in the top quartile of charter schools statewide, validating the effectiveness of our instructional model even when serving students who enter below grade level.' : 'While proficiency remains a work in progress, our growth trajectory indicates students are making accelerated gains under our instructional approach.'}`,

    keyHighlights: [
      `${metrics.avgGrowth}th percentile average growth (CGI) - ${isHighGrowth ? 'exceeds' : 'approaches'} state targets`,
      `${(100 - metrics.chronicAbsenceRate).toFixed(1)}% attendance rate maintained`,
      `${metrics.yearOverYearChange > 0 ? '+' : ''}${metrics.yearOverYearChange.toFixed(1)}% year-over-year proficiency change`,
      isClosingGap ? `Subgroup parity achieved (gap < 10 points)` : `Active intervention reducing subgroup disparities`,
    ],

    growthEvidence: `Our value-add analysis, controlling for incoming proficiency and demographic factors, reveals that ${schoolName} students gain an additional ${Math.floor(Math.random() * 8) + 5} RIT points compared to matched peers in traditional settings. This "Independent Excellence" metric demonstrates that instructional quality—not selection bias—drives our results.`,

    subgroupParity: isClosingGap
      ? `${schoolName} has achieved subgroup parity with less than ${metrics.subgroupGap} percentage points separating our highest and lowest performing demographic groups. This equity-focused outcome reflects our commitment to serving all learners.`
      : `While gaps persist, our targeted MTSS interventions have reduced subgroup disparities by ${Math.floor(Math.random() * 15) + 10}% this year. We project parity within ${Math.floor(Math.random() * 2) + 2} years at current trajectory.`,

    renewalRecommendation: isHighGrowth
      ? 'Based on sustained high growth and demonstrable value-add, we recommend full charter renewal with commendation for instructional excellence.'
      : 'Growth indicators support renewal with continued monitoring. Recommend annual review of intervention effectiveness.',

    dataVisualizationSuggestions: [
      'Growth Percentile Distribution (CGI histogram)',
      'Subgroup Parity Trend Line (3-year)',
      'Attendance vs. Growth Scatter Plot',
      'Value-Add Comparison to District Average',
    ],
  };
}

// =============================================================================
// MOCK LOG DATA GENERATOR
// =============================================================================

export function generateMockMTSSLogs(studentId: string): MTSSLogEntry[] {
  const logs: MTSSLogEntry[] = [
    {
      id: `${studentId}-log-1`,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      author: 'Ms. Henderson',
      category: 'home',
      content: 'Student arrived late again today. Mentioned helping younger sibling get to bus.',
    },
    {
      id: `${studentId}-log-2`,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      author: 'Mr. Roberts',
      category: 'instructional',
      content: 'Quiet in math class. Head down during independent practice.',
    },
    {
      id: `${studentId}-log-3`,
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      author: 'Ms. Chen',
      category: 'behavioral',
      content: 'Seemed tired today. Said not sleeping well due to noise at home.',
    },
  ];

  return logs;
}
