/**
 * Strategic Data Taxonomy
 * =======================
 *
 * Defines the complete data architecture for educational institutions.
 * Categorizes data into functional domains mapped to institutional outcomes.
 *
 * Based on the Strategic Data Solutions Blueprint methodology.
 */

export type DataCategory = 'foundational' | 'academic' | 'operational' | 'culture' | 'strategic';

export type DataPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type AnalyticsLevel = 'Descriptive' | 'Diagnostic' | 'Predictive' | 'Prescriptive';

export interface DataItem {
  id: string;
  title: string;
  priority: DataPriority;
  usage: string;
  tags: string[];
  analyticsLevel: AnalyticsLevel;
  sources?: string[];
}

export interface DataCategoryDefinition {
  id: DataCategory;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  items: DataItem[];
}

/**
 * Complete Strategic Data Taxonomy
 */
export const DATA_TAXONOMY: Record<DataCategory, DataCategoryDefinition> = {
  foundational: {
    id: 'foundational',
    name: 'Foundational',
    subtitle: 'Compliance & Reporting',
    description: 'Core data required for regulatory compliance, state reporting, and basic operational needs.',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    items: [
      {
        id: 'demographics',
        title: 'Demographic Data',
        priority: 'Critical',
        usage: 'State reporting, Title I compliance, equity analysis',
        tags: ['Compliance', 'Required', 'Student-level'],
        analyticsLevel: 'Descriptive',
        sources: ['SIS', 'PowerSchool', 'Clever'],
      },
      {
        id: 'enrollment',
        title: 'Enrollment Records',
        priority: 'Critical',
        usage: 'Entry/exit tracking, residency verification, immunization compliance',
        tags: ['Compliance', 'Legal', 'Audit'],
        analyticsLevel: 'Descriptive',
        sources: ['SIS', 'Manual Entry'],
      },
      {
        id: 'attendance',
        title: 'Period-Level Attendance',
        priority: 'High',
        usage: 'ADA calculation, chronic absenteeism monitoring, truancy intervention',
        tags: ['Compliance', 'Financial', 'Safety'],
        analyticsLevel: 'Descriptive',
        sources: ['SIS', 'PowerSchool', 'ClassLink'],
      },
      {
        id: 'licensure',
        title: 'Staff Licensure',
        priority: 'High',
        usage: 'HQT compliance, certification tracking, renewal alerts',
        tags: ['HR', 'Compliance', 'Staff'],
        analyticsLevel: 'Descriptive',
        sources: ['HRIS', 'Manual Entry'],
      },
      {
        id: 'iep-504',
        title: 'IEP/504 Status',
        priority: 'Critical',
        usage: 'IDEA compliance, service delivery tracking, accommodation monitoring',
        tags: ['SpEd', 'Compliance', 'Legal'],
        analyticsLevel: 'Descriptive',
        sources: ['SpEd System', 'SIS'],
      },
    ],
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    subtitle: 'Performance & Instruction',
    description: 'Data that drives instructional decisions, tracks student progress, and measures academic outcomes.',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    items: [
      {
        id: 'formative',
        title: 'Formative Assessments',
        priority: 'High',
        usage: 'Immediate instructional adjustment, skill-gap identification',
        tags: ['Leading', 'Student-level', 'Real-time'],
        analyticsLevel: 'Diagnostic',
        sources: ['NWEA MAP', 'i-Ready', 'Renaissance STAR'],
      },
      {
        id: 'summative',
        title: 'Standardized Growth',
        priority: 'Medium',
        usage: 'Curriculum efficacy, accountability metrics, charter renewal',
        tags: ['Lagging', 'Benchmark', 'State'],
        analyticsLevel: 'Descriptive',
        sources: ['State Assessment', 'NWEA', 'SAT/ACT'],
      },
      {
        id: 'credit-accumulation',
        title: 'Credit Accumulation',
        priority: 'High',
        usage: 'Graduation rate forecasting, off-track identification',
        tags: ['Secondary', 'Predictive', 'Intervention'],
        analyticsLevel: 'Predictive',
        sources: ['SIS', 'Gradebook'],
      },
      {
        id: 'mtss-rti',
        title: 'Tier 2/3 Interventions',
        priority: 'High',
        usage: 'RTI/MTSS tracking, intervention efficacy, resource allocation',
        tags: ['Process', 'Real-time', 'Intervention'],
        analyticsLevel: 'Diagnostic',
        sources: ['Intervention Platform', 'Manual Logging'],
      },
      {
        id: 'grading-equity',
        title: 'Teacher Grading Patterns',
        priority: 'Low',
        usage: 'Internal bias identification, grading calibration',
        tags: ['Culture', 'Bias', 'Equity'],
        analyticsLevel: 'Diagnostic',
        sources: ['LMS', 'Gradebook'],
      },
      {
        id: 'course-progress',
        title: 'Real-Time GPA & D/F Lists',
        priority: 'High',
        usage: 'Early warning, academic support targeting',
        tags: ['Real-time', 'Intervention', 'Student-level'],
        analyticsLevel: 'Predictive',
        sources: ['SIS', 'LMS'],
      },
    ],
  },
  operational: {
    id: 'operational',
    name: 'Operational',
    subtitle: 'Finance & Viability',
    description: 'Data essential for financial health, resource management, and organizational sustainability.',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    items: [
      {
        id: 'ada',
        title: 'ADA (Daily Attendance)',
        priority: 'Critical',
        usage: 'Revenue forecasting, state funding calculation',
        tags: ['Compliance', 'Financial', 'Daily'],
        analyticsLevel: 'Descriptive',
        sources: ['SIS', 'Attendance System'],
      },
      {
        id: 'cash-flow',
        title: 'Cash Flow Run Rate',
        priority: 'Critical',
        usage: 'Bankruptcy prevention, liquidity monitoring',
        tags: ['Finance', 'Vitality', 'Board'],
        analyticsLevel: 'Predictive',
        sources: ['Accounting System', 'Bank Feeds'],
      },
      {
        id: 'enrollment-pipeline',
        title: 'Enrollment Pipeline',
        priority: 'High',
        usage: 'Budget planning, marketing ROI, capacity planning',
        tags: ['Predictive', 'Marketing', 'Strategic'],
        analyticsLevel: 'Predictive',
        sources: ['CRM', 'Application System'],
      },
      {
        id: 'facility-compliance',
        title: 'Facility Compliance',
        priority: 'Medium',
        usage: 'Safety audits, lease adherence, maintenance planning',
        tags: ['Risk', 'Legal', 'Operations'],
        analyticsLevel: 'Descriptive',
        sources: ['Work Order System', 'Manual'],
      },
      {
        id: 'hr-attrition',
        title: 'HR Attrition Rates',
        priority: 'High',
        usage: 'Human capital stability, recruitment planning',
        tags: ['Operational', 'Staff', 'Predictive'],
        analyticsLevel: 'Predictive',
        sources: ['HRIS', 'Exit Surveys'],
      },
      {
        id: 'personnel',
        title: 'Personnel & PD Hours',
        priority: 'Medium',
        usage: 'Teacher effectiveness, salary benchmarking',
        tags: ['HR', 'Development', 'Budget'],
        analyticsLevel: 'Descriptive',
        sources: ['HRIS', 'PD Platform'],
      },
    ],
  },
  culture: {
    id: 'culture',
    name: 'Culture & SEL',
    subtitle: 'Contextual & Social-Emotional',
    description: 'Data that captures the human elements: behavior, sentiment, and social-emotional development.',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    items: [
      {
        id: 'sel-screeners',
        title: 'SEL Screeners',
        priority: 'High',
        usage: 'Identifying non-academic barriers, counselor prioritization',
        tags: ['Wellness', 'Diagnostic', 'Intervention'],
        analyticsLevel: 'Diagnostic',
        sources: ['Panorama', 'DESSA', 'Manual'],
      },
      {
        id: 'behavior-incidents',
        title: 'Behavioral Incidents',
        priority: 'High',
        usage: 'Safety monitoring, PBIS effectiveness, equity analysis',
        tags: ['Behavior', 'Safety', 'Compliance'],
        analyticsLevel: 'Descriptive',
        sources: ['SIS', 'SWIS', 'Manual'],
      },
      {
        id: 'incident-recidivism',
        title: 'Incident Recidivism',
        priority: 'Medium',
        usage: 'Evaluating behavior program success, restorative practice outcomes',
        tags: ['Behavior', 'Trending', 'Intervention'],
        analyticsLevel: 'Diagnostic',
        sources: ['SIS', 'Calculated'],
      },
      {
        id: 'parent-sentiment',
        title: 'Parent NPS/Sentiment',
        priority: 'Medium',
        usage: 'Market satisfaction, retention forecasting',
        tags: ['Engagement', 'Qualitative', 'Retention'],
        analyticsLevel: 'Diagnostic',
        sources: ['Survey Platform', 'ThoughtExchange'],
      },
      {
        id: 'teacher-climate',
        title: 'Teacher Climate',
        priority: 'High',
        usage: 'Predicting staff turnover, leadership effectiveness',
        tags: ['Leadership', 'Leading', 'Retention'],
        analyticsLevel: 'Predictive',
        sources: ['Survey Platform', 'Gallup Q12'],
      },
      {
        id: 'student-voice',
        title: 'Student Voice Surveys',
        priority: 'Medium',
        usage: 'Instructional feedback, belonging measurement',
        tags: ['Engagement', 'Qualitative', 'Student'],
        analyticsLevel: 'Diagnostic',
        sources: ['Panorama', 'YouthTruth'],
      },
    ],
  },
  strategic: {
    id: 'strategic',
    name: 'Strategic Intelligence',
    subtitle: 'Predictive & Prescriptive',
    description: 'Advanced analytics that combine multiple data sources to forecast outcomes and prescribe actions.',
    color: 'text-rose-700',
    bgColor: 'bg-rose-100',
    items: [
      {
        id: 'program-roi',
        title: 'Program ROI Analysis',
        priority: 'High',
        usage: 'Correlating instructional spend with academic growth',
        tags: ['Analysis', 'Financial', 'Decision'],
        analyticsLevel: 'Prescriptive',
        sources: ['Calculated', 'Multiple'],
      },
      {
        id: 'ews',
        title: 'Early Warning Score (EWS)',
        priority: 'Critical',
        usage: 'Weighted ABC index predicting dropout/non-renewal risk',
        tags: ['Predictive', 'Combined', 'Intervention'],
        analyticsLevel: 'Predictive',
        sources: ['Calculated', 'Multiple'],
      },
      {
        id: 'retention-forecast',
        title: 'Retention Forecasts',
        priority: 'High',
        usage: 'Predicting family/teacher departure based on historical patterns',
        tags: ['Predictive', 'Retention', 'ML'],
        analyticsLevel: 'Predictive',
        sources: ['Historical Data', 'Survey Data'],
      },
      {
        id: 'cost-per-student',
        title: 'Cost-Per-Student (CPS)',
        priority: 'High',
        usage: 'Program ROI analysis, budget optimization',
        tags: ['Analysis', 'Financial', 'Strategic'],
        analyticsLevel: 'Prescriptive',
        sources: ['Accounting', 'SIS'],
      },
      {
        id: 'demographic-drift',
        title: 'Demographic Drift',
        priority: 'Medium',
        usage: 'Long-term facilities & mission planning',
        tags: ['Census', 'Strategic', 'Long-term'],
        analyticsLevel: 'Predictive',
        sources: ['Census', 'Enrollment History'],
      },
      {
        id: 'closure-risk',
        title: 'Risk of Closure Score',
        priority: 'Critical',
        usage: 'Consolidated health dashboard for board/authorizer',
        tags: ['Combined', 'Dashboard', 'Executive'],
        analyticsLevel: 'Prescriptive',
        sources: ['All Sources', 'Calculated'],
      },
    ],
  },
};

/**
 * Maturity Model Scores
 * Represents typical vs strategic data maturity across domains
 */
export const MATURITY_MODEL = {
  labels: ['Academics', 'Finance', 'Operations', 'Culture', 'Compliance', 'Analytics'],
  typicalSchool: [65, 40, 70, 30, 90, 20],
  strategicSolution: [95, 95, 90, 85, 95, 90],
};

/**
 * Analytics Levels with descriptions
 */
export const ANALYTICS_LEVELS: Record<AnalyticsLevel, { description: string; question: string }> = {
  Descriptive: {
    description: 'Historical data that shows what happened',
    question: 'What happened?',
  },
  Diagnostic: {
    description: 'Analysis that explains why something happened',
    question: 'Why did it happen?',
  },
  Predictive: {
    description: 'Models that forecast what will happen',
    question: 'What will happen?',
  },
  Prescriptive: {
    description: 'Recommendations for what to do next',
    question: 'What should we do?',
  },
};

/**
 * Get all data items across all categories
 */
export function getAllDataItems(): DataItem[] {
  return Object.values(DATA_TAXONOMY).flatMap((category) => category.items);
}

/**
 * Get data items by priority
 */
export function getDataItemsByPriority(priority: DataPriority): DataItem[] {
  return getAllDataItems().filter((item) => item.priority === priority);
}

/**
 * Get data items by analytics level
 */
export function getDataItemsByLevel(level: AnalyticsLevel): DataItem[] {
  return getAllDataItems().filter((item) => item.analyticsLevel === level);
}

/**
 * Calculate category completion based on available data sources
 */
export function getCategoryCompletion(
  category: DataCategory,
  availableSources: string[]
): number {
  const categoryDef = DATA_TAXONOMY[category];
  if (!categoryDef) return 0;

  const items = categoryDef.items;
  const coveredItems = items.filter((item) =>
    item.sources?.some((source) => availableSources.includes(source))
  );

  return Math.round((coveredItems.length / items.length) * 100);
}
