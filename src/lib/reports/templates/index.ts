/**
 * State-Specific Report Templates
 *
 * Pre-built report formats matching requirements from major charter authorizers.
 * Each template defines sections, required data points, and formatting rules.
 */

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  dataPoints: string[];
  format: 'narrative' | 'table' | 'chart' | 'checklist' | 'mixed';
}

export interface StateReportTemplate {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  authorizer: string;
  description: string;
  renewalCycle: number; // years
  sections: ReportSection[];
  requiredAttachments: string[];
  submissionDeadlines: {
    initial: string; // e.g., "October 1"
    final: string;
  };
  scoringRubric?: {
    academic: number;
    financial: number;
    organizational: number;
    compliance: number;
  };
}

// California State Board of Education Template
export const californiaTemplate: StateReportTemplate = {
  id: 'ca-sbe-renewal',
  name: 'California Charter Renewal Petition',
  state: 'California',
  stateCode: 'CA',
  authorizer: 'State Board of Education',
  description: 'Standard renewal petition format for California charter schools per Education Code Section 47607',
  renewalCycle: 5,
  sections: [
    {
      id: 'academic-performance',
      title: 'Academic Performance',
      description: 'Dashboard indicators, CAASPP results, and growth metrics',
      required: true,
      dataPoints: [
        'caaspp_ela_proficiency',
        'caaspp_math_proficiency',
        'academic_growth_percentile',
        'graduation_rate',
        'college_career_indicator',
        'chronic_absence_rate',
        'suspension_rate',
        'english_learner_progress',
      ],
      format: 'mixed',
    },
    {
      id: 'subgroup-performance',
      title: 'Subgroup Performance & Equity',
      description: 'Performance gaps and progress for student subgroups',
      required: true,
      dataPoints: [
        'subgroup_ela_gaps',
        'subgroup_math_gaps',
        'socioeconomically_disadvantaged',
        'english_learners',
        'students_with_disabilities',
        'foster_youth',
        'homeless_youth',
      ],
      format: 'table',
    },
    {
      id: 'fiscal-health',
      title: 'Fiscal Health and Sustainability',
      description: 'Financial statements and long-term viability',
      required: true,
      dataPoints: [
        'current_ratio',
        'days_cash_on_hand',
        'debt_to_asset_ratio',
        'net_income_margin',
        'enrollment_variance',
        'three_year_budget_projection',
      ],
      format: 'mixed',
    },
    {
      id: 'governance',
      title: 'Governance and Operations',
      description: 'Board composition, policies, and organizational health',
      required: true,
      dataPoints: [
        'board_composition',
        'meeting_compliance',
        'conflict_of_interest',
        'brown_act_compliance',
        'facility_status',
      ],
      format: 'checklist',
    },
    {
      id: 'special-populations',
      title: 'Services for Special Populations',
      description: 'SPED, ELL, and at-risk student services',
      required: true,
      dataPoints: [
        'sped_population_served',
        'sped_compliance_rate',
        'ell_reclassification_rate',
        'intervention_effectiveness',
        'mtss_implementation',
      ],
      format: 'narrative',
    },
  ],
  requiredAttachments: [
    'Audited Financial Statements (3 years)',
    'Board Meeting Minutes',
    'LCAP and Annual Update',
    'WASC Accreditation Status',
    'Facility Lease/Ownership Documentation',
    'Insurance Certificates',
    'Employee Background Check Certification',
  ],
  submissionDeadlines: {
    initial: 'September 1',
    final: 'December 1',
  },
  scoringRubric: {
    academic: 40,
    financial: 25,
    organizational: 20,
    compliance: 15,
  },
};

// Texas Education Agency Template
export const texasTemplate: StateReportTemplate = {
  id: 'tx-tea-renewal',
  name: 'Texas Charter Renewal Application',
  state: 'Texas',
  stateCode: 'TX',
  authorizer: 'Texas Education Agency',
  description: 'Renewal application per Texas Administrative Code Chapter 100',
  renewalCycle: 5,
  sections: [
    {
      id: 'accountability-rating',
      title: 'State Accountability Rating',
      description: 'A-F accountability system performance',
      required: true,
      dataPoints: [
        'overall_rating',
        'student_achievement_domain',
        'school_progress_domain',
        'closing_gaps_domain',
        'distinction_designations',
      ],
      format: 'mixed',
    },
    {
      id: 'staar-performance',
      title: 'STAAR Performance',
      description: 'State assessment results by subject and grade',
      required: true,
      dataPoints: [
        'staar_reading_approaches',
        'staar_reading_meets',
        'staar_reading_masters',
        'staar_math_approaches',
        'staar_math_meets',
        'staar_math_masters',
        'staar_growth_measure',
      ],
      format: 'table',
    },
    {
      id: 'financial-integrity',
      title: 'Financial Integrity Rating (FIRST)',
      description: 'Financial accountability rating and indicators',
      required: true,
      dataPoints: [
        'first_rating',
        'fund_balance_ratio',
        'cash_flow_status',
        'audit_findings',
        'expenditure_per_pupil',
      ],
      format: 'mixed',
    },
    {
      id: 'governance-compliance',
      title: 'Governance and Legal Compliance',
      description: 'Board governance and charter contract compliance',
      required: true,
      dataPoints: [
        'board_training_hours',
        'open_meetings_compliance',
        'nepotism_compliance',
        'conflict_of_interest_disclosures',
        'charter_amendment_history',
      ],
      format: 'checklist',
    },
    {
      id: 'operational-performance',
      title: 'Operational Performance',
      description: 'Enrollment, attendance, and operational metrics',
      required: true,
      dataPoints: [
        'enrollment_trends',
        'attendance_rate',
        'dropout_rate',
        'teacher_retention',
        'staff_qualifications',
      ],
      format: 'table',
    },
  ],
  requiredAttachments: [
    'Annual Financial Report',
    'Independent Audit Report',
    'Board Resolution for Renewal',
    'Updated Charter Document',
    'Facility Documentation',
    'Certificate of Occupancy',
  ],
  submissionDeadlines: {
    initial: 'January 15',
    final: 'March 15',
  },
  scoringRubric: {
    academic: 50,
    financial: 25,
    organizational: 15,
    compliance: 10,
  },
};

// New York State Education Department Template
export const newYorkTemplate: StateReportTemplate = {
  id: 'ny-nysed-renewal',
  name: 'New York Charter Renewal Application',
  state: 'New York',
  stateCode: 'NY',
  authorizer: 'SUNY Charter Schools Institute',
  description: 'Renewal application per New York Education Law Article 56',
  renewalCycle: 5,
  sections: [
    {
      id: 'accountability-goals',
      title: 'Academic Achievement Goals',
      description: 'Progress toward charter accountability plan goals',
      required: true,
      dataPoints: [
        'ela_absolute_measure',
        'math_absolute_measure',
        'science_absolute_measure',
        'comparative_measure',
        'growth_measure',
        'college_readiness',
      ],
      format: 'mixed',
    },
    {
      id: 'benchmark-comparison',
      title: 'Benchmark Comparison',
      description: 'Performance compared to district and state benchmarks',
      required: true,
      dataPoints: [
        'vs_state_average',
        'vs_district_average',
        'vs_similar_schools',
        'trend_analysis',
      ],
      format: 'chart',
    },
    {
      id: 'fiscal-soundness',
      title: 'Fiscal Soundness',
      description: 'Financial health and sustainability indicators',
      required: true,
      dataPoints: [
        'composite_financial_score',
        'near_term_indicators',
        'sustainability_indicators',
        'budget_variance',
        'audit_opinion',
      ],
      format: 'mixed',
    },
    {
      id: 'organizational-capacity',
      title: 'Organizational Capacity',
      description: 'Governance, leadership, and operational effectiveness',
      required: true,
      dataPoints: [
        'board_effectiveness',
        'leadership_stability',
        'staff_retention',
        'parent_satisfaction',
        'student_retention',
      ],
      format: 'narrative',
    },
    {
      id: 'legal-compliance',
      title: 'Legal and Regulatory Compliance',
      description: 'Adherence to charter terms and applicable law',
      required: true,
      dataPoints: [
        'charter_compliance',
        'ferpa_compliance',
        'civil_rights_compliance',
        'special_education_compliance',
        'health_safety_compliance',
      ],
      format: 'checklist',
    },
  ],
  requiredAttachments: [
    'Annual Reports (5 years)',
    'Audited Financial Statements',
    'Board Self-Evaluation',
    'School Improvement Plan',
    'BEDS Data Verification',
    'Fire Safety Inspection',
  ],
  submissionDeadlines: {
    initial: 'August 1',
    final: 'November 1',
  },
  scoringRubric: {
    academic: 50,
    financial: 20,
    organizational: 20,
    compliance: 10,
  },
};

// Ohio Department of Education Template
export const ohioTemplate: StateReportTemplate = {
  id: 'oh-ode-renewal',
  name: 'Ohio Community School Renewal',
  state: 'Ohio',
  stateCode: 'OH',
  authorizer: 'Ohio Department of Education',
  description: 'Renewal application per Ohio Revised Code 3314',
  renewalCycle: 5,
  sections: [
    {
      id: 'report-card',
      title: 'State Report Card Performance',
      description: 'Ohio School Report Card indicators and ratings',
      required: true,
      dataPoints: [
        'overall_grade',
        'achievement_component',
        'progress_component',
        'gap_closing_component',
        'graduation_rate_component',
        'improving_at_risk_k3_literacy',
      ],
      format: 'mixed',
    },
    {
      id: 'ost-performance',
      title: 'Ohio State Test Performance',
      description: 'OST results by subject, grade, and subgroup',
      required: true,
      dataPoints: [
        'ela_performance_index',
        'math_performance_index',
        'science_proficiency',
        'value_added_composite',
        'subgroup_performance',
      ],
      format: 'table',
    },
    {
      id: 'financial-responsibility',
      title: 'Fiscal Responsibility',
      description: 'Financial audits and fiscal management',
      required: true,
      dataPoints: [
        'audit_opinion',
        'audit_findings',
        'fiscal_caution_flags',
        'five_year_forecast',
        'fund_balance',
      ],
      format: 'mixed',
    },
    {
      id: 'sponsor-evaluation',
      title: 'Sponsor Evaluation Results',
      description: 'Authorizer oversight and evaluation findings',
      required: true,
      dataPoints: [
        'sponsor_rating',
        'compliance_monitoring',
        'intervention_history',
        'corrective_action_status',
      ],
      format: 'narrative',
    },
  ],
  requiredAttachments: [
    'Annual Audits (5 years)',
    'Five-Year Fiscal Forecast',
    'Sponsor Compliance Reports',
    'Intervention Documentation',
    'Board Policies Manual',
  ],
  submissionDeadlines: {
    initial: 'March 1',
    final: 'June 1',
  },
  scoringRubric: {
    academic: 45,
    financial: 30,
    organizational: 15,
    compliance: 10,
  },
};

// Florida Department of Education Template
export const floridaTemplate: StateReportTemplate = {
  id: 'fl-fldoe-renewal',
  name: 'Florida Charter School Renewal',
  state: 'Florida',
  stateCode: 'FL',
  authorizer: 'Florida Department of Education',
  description: 'Renewal application per Florida Statutes 1002.33',
  renewalCycle: 5,
  sections: [
    {
      id: 'school-grade',
      title: 'School Grade History',
      description: 'Florida school grades and improvement trends',
      required: true,
      dataPoints: [
        'current_school_grade',
        'school_grade_history',
        'achievement_points',
        'learning_gains_points',
        'acceleration_points',
        'graduation_rate_points',
      ],
      format: 'mixed',
    },
    {
      id: 'fsa-performance',
      title: 'FSA/FAST Performance',
      description: 'Florida Standards Assessment results',
      required: true,
      dataPoints: [
        'ela_proficiency',
        'math_proficiency',
        'science_proficiency',
        'learning_gains_ela',
        'learning_gains_math',
        'lowest_quartile_gains',
      ],
      format: 'table',
    },
    {
      id: 'financial-condition',
      title: 'Financial Condition',
      description: 'Financial health and audit results',
      required: true,
      dataPoints: [
        'financial_condition_ratio',
        'unrestricted_net_assets',
        'operating_margin',
        'audit_findings',
        'management_letter_items',
      ],
      format: 'mixed',
    },
    {
      id: 'charter-contract',
      title: 'Charter Contract Compliance',
      description: 'Adherence to charter agreement terms',
      required: true,
      dataPoints: [
        'contract_compliance_status',
        'amendment_history',
        'complaint_history',
        'corrective_actions',
      ],
      format: 'checklist',
    },
  ],
  requiredAttachments: [
    'Audited Financial Statements',
    'Board Meeting Documentation',
    'School Improvement Plan',
    'Parent Survey Results',
    'Facility Master Plan',
  ],
  submissionDeadlines: {
    initial: 'December 1',
    final: 'February 1',
  },
  scoringRubric: {
    academic: 50,
    financial: 25,
    organizational: 15,
    compliance: 10,
  },
};

// Arizona State Board for Charter Schools Template
export const arizonaTemplate: StateReportTemplate = {
  id: 'az-asbcs-renewal',
  name: 'Arizona Charter Renewal Application',
  state: 'Arizona',
  stateCode: 'AZ',
  authorizer: 'Arizona State Board for Charter Schools',
  description: 'Renewal application per Arizona Revised Statutes 15-183',
  renewalCycle: 5,
  sections: [
    {
      id: 'academic-dashboard',
      title: 'Academic Dashboard',
      description: 'ASBCS Academic Dashboard performance',
      required: true,
      dataPoints: [
        'overall_rating',
        'student_median_growth_percentile',
        'student_median_growth_percentile_bottom_25',
        'percent_proficient',
        'subgroup_ela',
        'subgroup_math',
        'graduation_rate',
      ],
      format: 'mixed',
    },
    {
      id: 'azmerit-performance',
      title: 'AzMERIT/AASA Performance',
      description: 'State assessment results',
      required: true,
      dataPoints: [
        'ela_proficiency_rate',
        'math_proficiency_rate',
        'ela_growth',
        'math_growth',
        'science_proficiency',
      ],
      format: 'table',
    },
    {
      id: 'financial-dashboard',
      title: 'Financial Dashboard',
      description: 'ASBCS Financial Dashboard indicators',
      required: true,
      dataPoints: [
        'overall_financial_rating',
        'going_concern',
        'unrestricted_days_liquidity',
        'default_measures',
        'debt_service_coverage_ratio',
      ],
      format: 'mixed',
    },
    {
      id: 'operational-dashboard',
      title: 'Operational Dashboard',
      description: 'ASBCS Operational Dashboard compliance',
      required: true,
      dataPoints: [
        'overall_operational_rating',
        'measure_compliance',
        'board_compliance',
        'student_safety',
        'fingerprint_compliance',
      ],
      format: 'checklist',
    },
  ],
  requiredAttachments: [
    'Annual Financial Reports',
    'Board Meeting Minutes',
    'Curriculum Samples',
    'Renewal Narrative',
    'Demonstration of Sufficient Progress',
  ],
  submissionDeadlines: {
    initial: 'April 1',
    final: 'September 30',
  },
  scoringRubric: {
    academic: 50,
    financial: 25,
    organizational: 15,
    compliance: 10,
  },
};

// Colorado Department of Education Template
export const coloradoTemplate: StateReportTemplate = {
  id: 'co-cde-renewal',
  name: 'Colorado Charter Renewal Application',
  state: 'Colorado',
  stateCode: 'CO',
  authorizer: 'Colorado Department of Education',
  description: 'Renewal application per Colorado Charter Schools Act',
  renewalCycle: 5,
  sections: [
    {
      id: 'performance-framework',
      title: 'Performance Framework Results',
      description: 'Academic, financial, and organizational performance',
      required: true,
      dataPoints: [
        'academic_rating',
        'financial_rating',
        'organizational_rating',
        'overall_rating',
      ],
      format: 'mixed',
    },
    {
      id: 'cmas-performance',
      title: 'CMAS Performance',
      description: 'Colorado Measures of Academic Success results',
      required: true,
      dataPoints: [
        'ela_proficiency',
        'math_proficiency',
        'science_proficiency',
        'median_growth_percentile',
        'adequate_growth',
      ],
      format: 'table',
    },
    {
      id: 'spf-results',
      title: 'School Performance Framework',
      description: 'SPF rating and indicators',
      required: true,
      dataPoints: [
        'spf_overall_rating',
        'achievement_indicators',
        'growth_indicators',
        'postsecondary_readiness',
      ],
      format: 'mixed',
    },
    {
      id: 'financial-review',
      title: 'Financial Review',
      description: 'Financial health and sustainability',
      required: true,
      dataPoints: [
        'audit_results',
        'financial_health_indicators',
        'enrollment_projections',
        'budget_management',
      ],
      format: 'mixed',
    },
  ],
  requiredAttachments: [
    'Unified Improvement Plan',
    'Audited Financial Statements',
    'Board Governance Documents',
    'Enrollment Projections',
    'Facility Documentation',
  ],
  submissionDeadlines: {
    initial: 'November 1',
    final: 'February 1',
  },
  scoringRubric: {
    academic: 50,
    financial: 20,
    organizational: 20,
    compliance: 10,
  },
};

// All available templates
export const stateTemplates: StateReportTemplate[] = [
  californiaTemplate,
  texasTemplate,
  newYorkTemplate,
  ohioTemplate,
  floridaTemplate,
  arizonaTemplate,
  coloradoTemplate,
];

// Get template by state code
export function getTemplateByState(stateCode: string): StateReportTemplate | undefined {
  return stateTemplates.find(t => t.stateCode === stateCode);
}

// Get template by ID
export function getTemplateById(id: string): StateReportTemplate | undefined {
  return stateTemplates.find(t => t.id === id);
}

// Get all templates for a state (multiple authorizers)
export function getTemplatesForState(stateCode: string): StateReportTemplate[] {
  return stateTemplates.filter(t => t.stateCode === stateCode);
}
