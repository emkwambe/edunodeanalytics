/**
 * Purpose-Driven Intelligence Metrics
 *
 * Clinical analytics utilities for EduNode Analytics Platform
 * Implements: Volatility Index, Confidence Bands, Momentum Score,
 * Time-to-Impact, and Dosage calculations
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VolatilityMetrics {
  /** Volatility Index (1-10 scale) - lower is more stable */
  volatilityIndex: number;
  /** Standard deviation of assessment scores */
  standardDeviation: number;
  /** Classification: 'stable' | 'moderate' | 'fragile' */
  classification: 'stable' | 'moderate' | 'fragile';
  /** Human-readable label */
  label: string;
  /** Alert message if fragile growth detected */
  alertMessage?: string;
}

export interface ConfidenceBand {
  /** Upper bound (mean + 1.96 * SEM) */
  upperBound: number;
  /** Lower bound (mean - 1.96 * SEM) */
  lowerBound: number;
  /** Standard Error of Measurement */
  sem: number;
  /** Confidence level (default 95%) */
  confidenceLevel: number;
  /** Whether the confidence band is considered "wide" (uncertain) */
  isUncertain: boolean;
}

export interface MomentumScore {
  /** Momentum value (-100 to +100) */
  value: number;
  /** Classification: 'accelerating' | 'steady' | 'decelerating' | 'stalled' */
  classification: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
  /** Delta from expected growth */
  deltaFromExpected: number;
  /** Growth velocity (points per week) */
  velocityPerWeek: number;
  /** Arrow indicator: '↑' | '→' | '↓' */
  arrow: '↑' | '→' | '↓';
  /** Color indicator */
  color: 'emerald' | 'amber' | 'red';
}

export interface TimeToImpact {
  /** Estimated days until target is reached */
  daysToTarget: number;
  /** Target RIT/score being projected towards */
  targetScore: number;
  /** Current trajectory slope (points per day) */
  slope: number;
  /** Whether the trajectory is on track to meet target */
  onTrack: boolean;
  /** Human-readable estimate */
  estimate: string;
  /** Confidence level in the estimate */
  confidence: 'high' | 'medium' | 'low';
}

export interface DosageMetrics {
  /** Target intervention minutes (per diagnostic window) */
  targetMinutes: number;
  /** Actual minutes delivered */
  actualMinutes: number;
  /** Percentage of target achieved */
  percentComplete: number;
  /** Classification: 'on_track' | 'behind' | 'critical' */
  classification: 'on_track' | 'behind' | 'critical';
  /** Sessions completed vs planned */
  sessionsCompleted: number;
  sessionsPlanned: number;
  /** Average session duration */
  avgSessionDuration: number;
}

export interface InstructionalExposure {
  /** Subject area */
  subject: string;
  /** Total minutes in diagnostic window */
  totalMinutes: number;
  /** Target minutes */
  targetMinutes: number;
  /** Percentage of target */
  percentOfTarget: number;
  /** Sessions count */
  sessionCount: number;
  /** Quality score (engagement/effectiveness) */
  qualityScore: number;
}

export interface MetricVitality {
  /** Days since last data update */
  daysSinceUpdate: number;
  /** Freshness classification */
  freshness: 'fresh' | 'stale' | 'expired';
  /** Opacity value for visual degradation (0.5 for stale, 0.3 for expired) */
  opacity: number;
  /** Warning message */
  warningMessage?: string;
  /** Last update timestamp */
  lastUpdated: Date | null;
}

export interface MobilityEvent {
  /** Event type */
  type: 'enrollment' | 'exit' | 'transfer_in' | 'transfer_out';
  /** Event date */
  date: Date;
  /** Previous school (for transfers) */
  previousSchool?: string;
  /** New school (for transfers out) */
  newSchool?: string;
  /** Days enrolled at current school */
  daysEnrolled: number;
  /** Impact on data sufficiency */
  dataSufficiencyImpact: 'minimal' | 'moderate' | 'significant';
}

// ============================================================================
// VOLATILITY INDEX CALCULATIONS
// ============================================================================

/**
 * Calculate Volatility Index from a series of assessment scores
 *
 * Volatility measures the stability/fragility of student growth.
 * A high volatility (7-10) indicates "Fragile Growth" - the student
 * may show growth but it's inconsistent and at risk of reversal.
 *
 * @param scores Array of assessment scores (RIT, percentiles, etc.)
 * @param options Configuration options
 */
export function calculateVolatilityIndex(
  scores: number[],
  options: {
    /** Scale maximum (default 10) */
    maxScale?: number;
    /** Expected standard deviation for "normal" volatility */
    expectedStdDev?: number;
    /** Minimum data points required */
    minDataPoints?: number;
  } = {}
): VolatilityMetrics {
  const { maxScale = 10, expectedStdDev: _expectedStdDev = 8, minDataPoints = 3 } = options;

  // Handle insufficient data
  if (scores.length < minDataPoints) {
    return {
      volatilityIndex: -1,
      standardDeviation: 0,
      classification: 'moderate',
      label: 'Insufficient Data',
      alertMessage: `Need at least ${minDataPoints} data points to calculate volatility`,
    };
  }

  // Calculate standard deviation
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map((score) => Math.pow(score - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Calculate coefficient of variation for scale-independent measure
  const coefficientOfVariation = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  // Map to 1-10 scale based on coefficient of variation
  // CV < 5% = very stable (1-2), CV 5-10% = stable (3-4), CV 10-15% = moderate (5-6)
  // CV 15-25% = volatile (7-8), CV > 25% = fragile (9-10)
  let volatilityIndex: number;
  if (coefficientOfVariation < 5) {
    volatilityIndex = 1 + (coefficientOfVariation / 5);
  } else if (coefficientOfVariation < 10) {
    volatilityIndex = 2 + ((coefficientOfVariation - 5) / 5) * 2;
  } else if (coefficientOfVariation < 15) {
    volatilityIndex = 4 + ((coefficientOfVariation - 10) / 5) * 2;
  } else if (coefficientOfVariation < 25) {
    volatilityIndex = 6 + ((coefficientOfVariation - 15) / 10) * 2;
  } else {
    volatilityIndex = Math.min(8 + ((coefficientOfVariation - 25) / 15) * 2, maxScale);
  }

  // Determine classification
  let classification: 'stable' | 'moderate' | 'fragile';
  let label: string;
  let alertMessage: string | undefined;

  if (volatilityIndex <= 3) {
    classification = 'stable';
    label = 'Stable Growth';
  } else if (volatilityIndex <= 6) {
    classification = 'moderate';
    label = 'Moderate Variance';
  } else {
    classification = 'fragile';
    label = 'Fragile Growth';
    alertMessage = 'High variance detected. Growth trajectory may not be sustainable.';
  }

  return {
    volatilityIndex: Math.round(volatilityIndex * 10) / 10,
    standardDeviation: Math.round(stdDev * 100) / 100,
    classification,
    label,
    alertMessage,
  };
}

// ============================================================================
// CONFIDENCE BAND CALCULATIONS
// ============================================================================

/**
 * Calculate Confidence Bands using Standard Error of Measurement
 *
 * Confidence bands help visualize uncertainty in assessments.
 * They show the range where the "true" score likely falls.
 *
 * @param score The observed score
 * @param sem Standard Error of Measurement (typically 3-5 for RIT scores)
 * @param confidenceLevel Confidence level (default 0.95 for 95%)
 */
export function calculateConfidenceBand(
  score: number,
  sem: number = 4,
  confidenceLevel: number = 0.95
): ConfidenceBand {
  // Z-score for confidence level
  const zScore = confidenceLevel === 0.95 ? 1.96 :
                 confidenceLevel === 0.99 ? 2.576 :
                 confidenceLevel === 0.90 ? 1.645 : 1.96;

  const margin = zScore * sem;
  const upperBound = Math.round((score + margin) * 10) / 10;
  const lowerBound = Math.round((score - margin) * 10) / 10;

  // Consider "uncertain" if confidence band spans more than 15 points
  const bandWidth = upperBound - lowerBound;
  const isUncertain = bandWidth > 15;

  return {
    upperBound,
    lowerBound,
    sem,
    confidenceLevel,
    isUncertain,
  };
}

/**
 * Generate confidence bands for a series of scores
 */
export function calculateConfidenceBandSeries(
  scores: number[],
  sem: number = 4,
  confidenceLevel: number = 0.95
): { upper: number[]; lower: number[] } {
  const bands = scores.map((score) => calculateConfidenceBand(score, sem, confidenceLevel));
  return {
    upper: bands.map((b) => b.upperBound),
    lower: bands.map((b) => b.lowerBound),
  };
}

// ============================================================================
// MOMENTUM SCORE CALCULATIONS
// ============================================================================

/**
 * Calculate Instructional Momentum Score
 *
 * Momentum measures the rate and direction of student growth
 * relative to expectations. A positive momentum indicates
 * growth exceeding projections.
 *
 * @param currentScore Current assessment score
 * @param previousScore Previous assessment score
 * @param expectedGrowth Expected growth between assessments
 * @param weeksBetween Number of weeks between assessments
 */
export function calculateMomentumScore(
  currentScore: number,
  previousScore: number,
  expectedGrowth: number,
  weeksBetween: number = 9
): MomentumScore {
  const actualGrowth = currentScore - previousScore;
  const deltaFromExpected = actualGrowth - expectedGrowth;
  const velocityPerWeek = weeksBetween > 0 ? actualGrowth / weeksBetween : 0;

  // Calculate momentum as percentage of expected growth achieved
  // 100 = meeting expectations, >100 = exceeding, <100 = behind
  const rawMomentum = expectedGrowth !== 0
    ? (actualGrowth / expectedGrowth) * 100
    : actualGrowth > 0 ? 100 : 0;

  // Normalize to -100 to +100 scale (0 = meeting expectations)
  const normalizedMomentum = Math.max(-100, Math.min(100, rawMomentum - 100));

  // Classify
  let classification: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
  let arrow: '↑' | '→' | '↓';
  let color: 'emerald' | 'amber' | 'red';

  if (normalizedMomentum >= 20) {
    classification = 'accelerating';
    arrow = '↑';
    color = 'emerald';
  } else if (normalizedMomentum >= -10) {
    classification = 'steady';
    arrow = '→';
    color = 'emerald';
  } else if (normalizedMomentum >= -40) {
    classification = 'decelerating';
    arrow = '↓';
    color = 'amber';
  } else {
    classification = 'stalled';
    arrow = '↓';
    color = 'red';
  }

  return {
    value: Math.round(normalizedMomentum),
    classification,
    deltaFromExpected: Math.round(deltaFromExpected * 10) / 10,
    velocityPerWeek: Math.round(velocityPerWeek * 100) / 100,
    arrow,
    color,
  };
}

// ============================================================================
// TIME-TO-IMPACT CALCULATIONS
// ============================================================================

/**
 * Calculate Time-to-Impact estimate
 *
 * Projects when a student will reach their target score based
 * on current growth trajectory (CGI slope).
 *
 * @param currentScore Current assessment score
 * @param targetScore Target score to reach
 * @param growthHistory Array of {score, date} history for slope calculation
 */
export function calculateTimeToImpact(
  currentScore: number,
  targetScore: number,
  growthHistory: Array<{ score: number; date: Date }>
): TimeToImpact {
  // Need at least 2 data points to calculate slope
  if (growthHistory.length < 2) {
    return {
      daysToTarget: -1,
      targetScore,
      slope: 0,
      onTrack: false,
      estimate: 'Insufficient data',
      confidence: 'low',
    };
  }

  // Sort by date
  const sorted = [...growthHistory].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate slope using linear regression
  const n = sorted.length;
  const startDate = sorted[0].date.getTime();
  const xs = sorted.map((p) => (p.date.getTime() - startDate) / (1000 * 60 * 60 * 24)); // Days
  const ys = sorted.map((p) => p.score);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // If slope is zero or negative, can't reach target
  if (slope <= 0 && currentScore < targetScore) {
    return {
      daysToTarget: -1,
      targetScore,
      slope: Math.round(slope * 1000) / 1000,
      onTrack: false,
      estimate: 'Not on trajectory',
      confidence: 'high',
    };
  }

  // Calculate days to target
  const scoreGap = targetScore - currentScore;
  const daysToTarget = slope !== 0 ? Math.ceil(scoreGap / slope) : -1;

  // Determine confidence based on data consistency
  const variance = calculateVolatilityIndex(ys);
  let confidence: 'high' | 'medium' | 'low';
  if (variance.volatilityIndex <= 3 && n >= 4) {
    confidence = 'high';
  } else if (variance.volatilityIndex <= 6 || n >= 3) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Format estimate
  let estimate: string;
  if (daysToTarget < 0) {
    estimate = 'Not on trajectory';
  } else if (daysToTarget <= 7) {
    estimate = `~${daysToTarget} days`;
  } else if (daysToTarget <= 30) {
    estimate = `~${Math.ceil(daysToTarget / 7)} weeks`;
  } else {
    estimate = `~${Math.ceil(daysToTarget / 30)} months`;
  }

  return {
    daysToTarget,
    targetScore,
    slope: Math.round(slope * 1000) / 1000,
    onTrack: daysToTarget > 0 && daysToTarget <= 90, // On track if reachable within a quarter
    estimate,
    confidence,
  };
}

// ============================================================================
// DOSAGE CALCULATIONS
// ============================================================================

/**
 * Calculate intervention dosage metrics
 *
 * Tracks the delivery of intervention minutes against targets
 * within a diagnostic window (typically 21 days).
 *
 * @param sessions Array of intervention sessions with duration
 * @param targetMinutesPerWindow Target total minutes per diagnostic window
 * @param targetSessionsPerWindow Target number of sessions per window
 */
export function calculateDosageMetrics(
  sessions: Array<{ date: Date; durationMinutes: number }>,
  targetMinutesPerWindow: number = 450, // Default: 3 x 30min x 5 days = 450min/3weeks
  targetSessionsPerWindow: number = 15
): DosageMetrics {
  const actualMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const sessionsCompleted = sessions.length;
  const percentComplete = targetMinutesPerWindow > 0
    ? Math.round((actualMinutes / targetMinutesPerWindow) * 100)
    : 0;
  const avgSessionDuration = sessionsCompleted > 0
    ? Math.round(actualMinutes / sessionsCompleted)
    : 0;

  let classification: 'on_track' | 'behind' | 'critical';
  if (percentComplete >= 85) {
    classification = 'on_track';
  } else if (percentComplete >= 60) {
    classification = 'behind';
  } else {
    classification = 'critical';
  }

  return {
    targetMinutes: targetMinutesPerWindow,
    actualMinutes,
    percentComplete,
    classification,
    sessionsCompleted,
    sessionsPlanned: targetSessionsPerWindow,
    avgSessionDuration,
  };
}

/**
 * Calculate instructional exposure by subject
 */
export function calculateInstructionalExposure(
  sessions: Array<{ subject: string; date: Date; durationMinutes: number; engagementScore?: number }>,
  targetMinutesPerSubject: Record<string, number> = { reading: 200, math: 200 }
): InstructionalExposure[] {
  // Group by subject
  const bySubject = sessions.reduce((acc, session) => {
    if (!acc[session.subject]) {
      acc[session.subject] = [];
    }
    acc[session.subject].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  return Object.entries(bySubject).map(([subject, subjectSessions]) => {
    const totalMinutes = subjectSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const target = targetMinutesPerSubject[subject.toLowerCase()] || 200;
    const avgEngagement = subjectSessions
      .filter((s) => s.engagementScore !== undefined)
      .reduce((sum, s, _, arr) => sum + (s.engagementScore || 0) / arr.length, 0);

    return {
      subject,
      totalMinutes,
      targetMinutes: target,
      percentOfTarget: Math.round((totalMinutes / target) * 100),
      sessionCount: subjectSessions.length,
      qualityScore: Math.round(avgEngagement * 10) / 10 || 75, // Default to 75% if no engagement data
    };
  });
}

// ============================================================================
// METRIC VITALITY / DEGRADATION
// ============================================================================

/**
 * Calculate metric vitality (freshness/staleness)
 *
 * Implements visible metric degradation - metrics fade as they
 * become stale, signaling reduced reliability.
 *
 * @param lastUpdated Date of last data update
 * @param now Current date (defaults to now)
 * @param thresholds Custom thresholds for freshness
 */
export function calculateMetricVitality(
  lastUpdated: Date | null,
  now: Date = new Date(),
  thresholds: { freshDays: number; staleDays: number } = { freshDays: 7, staleDays: 21 }
): MetricVitality {
  if (!lastUpdated) {
    return {
      daysSinceUpdate: -1,
      freshness: 'expired',
      opacity: 0.3,
      warningMessage: 'No data available',
      lastUpdated: null,
    };
  }

  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
  );

  let freshness: 'fresh' | 'stale' | 'expired';
  let opacity: number;
  let warningMessage: string | undefined;

  if (daysSinceUpdate <= thresholds.freshDays) {
    freshness = 'fresh';
    opacity = 1;
  } else if (daysSinceUpdate <= thresholds.staleDays) {
    freshness = 'stale';
    opacity = 0.5;
    warningMessage = `Data is ${daysSinceUpdate} days old. Consider refreshing.`;
  } else {
    freshness = 'expired';
    opacity = 0.3;
    warningMessage = `Data is ${daysSinceUpdate} days old. Metrics may not reflect current state.`;
  }

  return {
    daysSinceUpdate,
    freshness,
    opacity,
    warningMessage,
    lastUpdated,
  };
}

// ============================================================================
// MOBILITY EVENT TRACKING
// ============================================================================

/**
 * Analyze mobility events and their impact on data sufficiency
 *
 * Students who transfer in mid-year have less data, affecting
 * the reliability of analytics.
 *
 * @param enrollmentDate Date student enrolled at current school
 * @param exitDate Date student exited (if applicable)
 * @param diagnosticWindowDays Days required for full data sufficiency
 */
export function analyzeMobilityEvent(
  enrollmentDate: Date,
  exitDate: Date | null = null,
  diagnosticWindowDays: number = 45
): MobilityEvent {
  const now = new Date();
  const endDate = exitDate || now;
  const daysEnrolled = Math.floor(
    (endDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let dataSufficiencyImpact: 'minimal' | 'moderate' | 'significant';
  if (daysEnrolled >= diagnosticWindowDays * 2) {
    dataSufficiencyImpact = 'minimal';
  } else if (daysEnrolled >= diagnosticWindowDays) {
    dataSufficiencyImpact = 'moderate';
  } else {
    dataSufficiencyImpact = 'significant';
  }

  return {
    type: exitDate ? 'exit' : 'enrollment',
    date: exitDate || enrollmentDate,
    daysEnrolled,
    dataSufficiencyImpact,
  };
}

// ============================================================================
// DATA SUFFICIENCY CALCULATIONS
// ============================================================================

export interface DataSufficiency {
  /** Percentage of required data points available (0-100) */
  percentage: number;
  /** Classification: 'sufficient' | 'partial' | 'insufficient' */
  classification: 'sufficient' | 'partial' | 'insufficient';
  /** Required number of data points */
  requiredDataPoints: number;
  /** Available data points */
  availableDataPoints: number;
  /** Message for UI display */
  message: string;
  /** Whether to show warning badge */
  showWarning: boolean;
}

/**
 * Calculate data sufficiency for reliable analytics
 *
 * @param availableDataPoints Number of available data points
 * @param requiredDataPoints Minimum required for reliable analytics
 */
export function calculateDataSufficiency(
  availableDataPoints: number,
  requiredDataPoints: number = 3
): DataSufficiency {
  const percentage = Math.min(100, Math.round((availableDataPoints / requiredDataPoints) * 100));

  let classification: 'sufficient' | 'partial' | 'insufficient';
  let message: string;
  let showWarning: boolean;

  if (percentage >= 100) {
    classification = 'sufficient';
    message = 'Data sufficient for reliable analysis';
    showWarning = false;
  } else if (percentage >= 50) {
    classification = 'partial';
    message = `${availableDataPoints}/${requiredDataPoints} data points available`;
    showWarning = true;
  } else {
    classification = 'insufficient';
    message = `Insufficient data (${availableDataPoints}/${requiredDataPoints} points)`;
    showWarning = true;
  }

  return {
    percentage,
    classification,
    requiredDataPoints,
    availableDataPoints,
    message,
    showWarning,
  };
}

// ============================================================================
// SIGNAL → RESPONSE → OUTCOME NARRATIVE
// ============================================================================

export interface SignalResponseOutcome {
  /** The detected signal (what was observed) */
  signal: string;
  /** The response taken (intervention applied) */
  response: string;
  /** The outcome measured (result observed) */
  outcome: string;
  /** Effectiveness rating */
  effectiveness: 'effective' | 'partial' | 'ineffective' | 'pending';
  /** Confidence in the attribution */
  attributionConfidence: 'high' | 'medium' | 'low';
}

/**
 * Generate Signal → Response → Outcome narrative for an intervention
 */
export function generateSRONarrative(
  signalType: string,
  intervention: { name: string; sessions: number; outcomes?: { metric: string; change: number }[] }
): SignalResponseOutcome {
  const signal = `Detected ${signalType}`;
  const response = `Applied ${intervention.name} intervention (${intervention.sessions} sessions)`;

  let outcome = 'Pending outcome measurement';
  let effectiveness: SignalResponseOutcome['effectiveness'] = 'pending';
  let attributionConfidence: SignalResponseOutcome['attributionConfidence'] = 'low';

  if (intervention.outcomes && intervention.outcomes.length > 0) {
    const primaryOutcome = intervention.outcomes[0];
    const changeDirection = primaryOutcome.change > 0 ? '+' : '';
    outcome = `${primaryOutcome.metric}: ${changeDirection}${primaryOutcome.change}`;

    if (primaryOutcome.change > 5) {
      effectiveness = 'effective';
      attributionConfidence = intervention.sessions >= 10 ? 'high' : 'medium';
    } else if (primaryOutcome.change > 0) {
      effectiveness = 'partial';
      attributionConfidence = 'medium';
    } else {
      effectiveness = 'ineffective';
      attributionConfidence = intervention.sessions >= 10 ? 'medium' : 'low';
    }
  }

  return {
    signal,
    response,
    outcome,
    effectiveness,
    attributionConfidence,
  };
}
