/**
 * Data Literacy Fundamentals
 * ==========================
 *
 * Learning modules for building data literacy skills across all roles.
 */

import { LearningModule } from '../types';

export const DATA_LITERACY_MODULES: LearningModule[] = [
  // ===========================================
  // MODULE 1: Reading Data Like an Educator
  // ===========================================
  {
    id: 'dl-001',
    slug: 'reading-data-like-educator',
    title: 'Reading Data Like an Educator',
    description: 'Learn to interpret educational metrics with purpose, avoiding common pitfalls that lead to misguided decisions.',
    category: 'data_literacy',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    difficulty: 'beginner',
    estimatedMinutes: 25,
    outcomes: [
      'Distinguish between different types of educational metrics',
      'Identify when data is actionable vs. merely interesting',
      'Avoid the three most common data misinterpretation traps',
      'Ask better questions before diving into dashboards',
    ],
    sections: [
      {
        id: 'dl-001-01',
        title: 'The Purpose of Data in Schools',
        format: 'article',
        content: `
# Why We Collect Data

Data in schools serves one purpose: **to improve outcomes for students**. Every metric, every report, every dashboard should connect back to this mission.

Yet too often, data becomes:
- A compliance checkbox rather than a decision tool
- A weapon for blame rather than a lens for improvement
- A source of overwhelm rather than clarity

This module reframes how we approach data—not as numbers to report, but as signals to interpret.

## The Three Questions

Before looking at any data point, ask:

1. **What decision will this inform?** If the answer is "none," reconsider whether you need this data.
2. **What would I do differently if this number were higher or lower?** If nothing, the metric isn't actionable.
3. **Who needs to see this to take action?** Data sitting in a dashboard helps no one.

## Types of Educational Metrics

| Type | Purpose | Examples | Frequency |
|------|---------|----------|-----------|
| **Lagging** | Measure outcomes | State test scores, graduation rates | Annual |
| **Leading** | Predict outcomes | Attendance trends, formative assessments | Weekly |
| **Process** | Monitor implementation | Intervention minutes, lesson completion | Daily |

The mistake most schools make: obsessing over lagging indicators while ignoring the leading ones that could change outcomes.
        `,
        keyTakeaways: [
          'Data exists to improve student outcomes, not to generate reports',
          'Always ask "what decision will this inform?" before analyzing',
          'Leading indicators are more actionable than lagging ones',
        ],
        reflectionQuestions: [
          'What data do you currently collect that doesn\'t inform any decisions?',
          'Which leading indicators could predict your most important lagging outcomes?',
        ],
      },
      {
        id: 'dl-001-02',
        title: 'Common Data Traps',
        format: 'article',
        content: `
# Three Traps That Derail Data-Informed Decisions

## Trap 1: Confusing Correlation with Causation

**The mistake:** Students who eat breakfast score higher on tests, so we mandate breakfast programs.

**The reality:** Breakfast eating might correlate with other factors (stable home environments, parental engagement) that actually drive test scores.

**The fix:** Before assuming X causes Y, ask "What else could explain this relationship?"

## Trap 2: Cherry-Picking Time Windows

**The mistake:** "Our math scores improved 15% this quarter!" (Selected because it's the best quarter in two years)

**The reality:** Single data points can be noise. Is this improvement sustainable or an anomaly?

**The fix:** Always look at trends over time. Compare to the same period in prior years. Use confidence intervals when available.

## Trap 3: Averaging Away the Story

**The mistake:** "Our average reading level is at grade level." (50% are two grades above, 50% are two grades below)

**The reality:** Averages hide distributions. A school can be "on track" while half its students struggle.

**The fix:** Always disaggregate. Look at distributions, not just means. Ask "who is being hidden by this average?"

---

## Practice: Spot the Trap

Read each claim and identify which trap is at play:

1. "Schools that use our curriculum have 20% higher test scores" → _____
2. "We improved attendance by 5% between October and November" → _____
3. "Our average GPA is 3.2, so students are performing well" → _____

*(Answers: 1-Correlation/Causation, 2-Cherry-picking, 3-Averaging)*
        `,
        keyTakeaways: [
          'Correlation is not causation—always look for alternative explanations',
          'Single data points are often noise; trends over time are more reliable',
          'Averages can hide important variation; always disaggregate',
        ],
        practiceActivity: {
          title: 'Audit Your Current Reports',
          instructions: 'Take one report you regularly use. Identify whether any of the three traps might be present. Write down one change you would make to the report to address the trap.',
          estimatedMinutes: 15,
          deliverable: 'One revised interpretation or report recommendation',
        },
      },
      {
        id: 'dl-001-03',
        title: 'From Data to Insight to Action',
        format: 'article',
        content: `
# The Data → Insight → Action Pipeline

Raw data is not useful. Insights without action are wasted. The goal is to build a consistent pipeline:

\`\`\`
Data Point → Context → Insight → Decision → Action → Measure Impact
\`\`\`

## Step-by-Step Example

**Data Point:** 23% of 8th graders are chronically absent (15+ days)

**Context:**
- This is up from 18% last year
- The district average is 20%
- Most absences are concentrated in 3 classrooms

**Insight:** Chronic absenteeism is increasing and clustering—this isn't random, there's likely a systemic driver

**Decision:** Investigate the three classrooms. Determine if it's student composition, teacher factors, or environmental (e.g., bus route issues)

**Action:** Based on root cause analysis, implement targeted intervention (could be bus schedule change, could be teacher support, could be family outreach)

**Measure Impact:** Track weekly attendance in those classrooms, compare to baseline

---

## The Insight Test

A good insight passes three tests:

1. **Surprising:** It reveals something not already obvious
2. **Specific:** It points to particular students, classrooms, or time periods
3. **Actionable:** There's something concrete someone can do about it

If your "insight" is "we need to improve reading scores," it fails all three tests. That's not an insight—it's a goal statement.
        `,
        keyTakeaways: [
          'Data must flow through context and insight before becoming action',
          'Good insights are surprising, specific, and actionable',
          'Always close the loop by measuring the impact of your action',
        ],
        reflectionQuestions: [
          'Think of a recent "insight" you shared. Did it pass all three tests?',
          'What prevented action from being taken the last time you analyzed data?',
        ],
      },
    ],
  },

  // ===========================================
  // MODULE 2: Understanding Visualizations
  // ===========================================
  {
    id: 'dl-002',
    slug: 'understanding-visualizations',
    title: 'Understanding Visualizations',
    description: 'Master the art of reading charts, graphs, and dashboards to extract meaning quickly and accurately.',
    category: 'data_literacy',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    difficulty: 'beginner',
    estimatedMinutes: 20,
    outcomes: [
      'Read common chart types used in educational analytics',
      'Identify misleading visualizations and design flaws',
      'Know which chart type fits which question',
      'Extract key insights from dashboards in under 60 seconds',
    ],
    sections: [
      {
        id: 'dl-002-01',
        title: 'Chart Types and When to Use Them',
        format: 'article',
        content: `
# The Right Chart for the Right Question

Every chart type answers a specific kind of question. Using the wrong chart obscures rather than reveals.

## Bar Charts: Comparing Categories

**Best for:** "How does X compare to Y?"

- Compare schools, grade levels, demographic groups
- Show discrete categories (not continuous data)
- Horizontal bars work better when you have many categories or long labels

**Watch out for:** Starting the Y-axis at a value other than zero—this exaggerates differences

## Line Charts: Showing Change Over Time

**Best for:** "How has X changed?"

- Track trends across weeks, months, quarters, years
- Show trajectory and momentum
- Multiple lines can show comparisons over time

**Watch out for:** Too many lines make the chart unreadable (max 4-5)

## Scatter Plots: Showing Relationships

**Best for:** "Is there a relationship between X and Y?"

- Plot two variables against each other
- Identify clusters, outliers, and correlations
- Often used for assessment vs. growth analysis

**Watch out for:** Don't assume causation from correlation

## Distribution Charts (Histograms, Box Plots)

**Best for:** "How is X distributed?"

- See the spread of scores or metrics
- Identify outliers, skew, and bimodality
- More informative than averages alone

**Watch out for:** Different bin sizes can make the same data look very different
        `,
        keyTakeaways: [
          'Bar charts compare categories, line charts show change over time',
          'Scatter plots reveal relationships, histograms show distributions',
          'Using the wrong chart type can mislead even with accurate data',
        ],
      },
      {
        id: 'dl-002-02',
        title: 'Spotting Misleading Visualizations',
        format: 'article',
        content: `
# Red Flags in Data Visualization

Even with accurate data, charts can mislead. Know what to look for:

## 1. Truncated Y-Axis

When a bar chart starts at 50 instead of 0, a 10% difference looks like a 200% difference.

**How to spot it:** Look at the axis labels. If bars don't start at zero, mentally rescale.

## 2. 3D Effects and Decoration

3D pie charts, elaborate graphics, and "infographic" styling often distort proportions.

**Rule:** The simpler the chart, the more honest it usually is.

## 3. Inconsistent Intervals

A timeline with uneven spacing (Jan, Feb, Mar, Jun, Dec) can create false slopes.

**How to spot it:** Check that intervals are consistent before interpreting trends.

## 4. Missing Context

A chart showing "15% improvement" is meaningless without:
- Starting baseline
- Comparison group
- Statistical significance
- Time period

## 5. Cherry-Picked Ranges

Showing only the date range where results look good, ignoring surrounding context.

**How to spot it:** Ask "What happened before and after this window?"

---

## Quick Audit Checklist

Before trusting any visualization, check:

- [ ] Does the Y-axis start at an appropriate value?
- [ ] Are the intervals consistent?
- [ ] Is there a comparison or baseline?
- [ ] Is the time range reasonable and not cherry-picked?
- [ ] Is the chart type appropriate for the question?
        `,
        keyTakeaways: [
          'Truncated axes exaggerate small differences—always check where axes start',
          'Simpler charts are typically more honest than elaborate infographics',
          'Always look for baseline, comparison, and context before trusting a visual',
        ],
        practiceActivity: {
          title: 'Chart Audit Exercise',
          instructions: 'Find a chart from a recent report or presentation. Use the Quick Audit Checklist to evaluate it. Note any issues you find and how you would redesign the chart.',
          estimatedMinutes: 10,
          deliverable: 'Written analysis of one chart with improvement recommendations',
        },
      },
    ],
  },

  // ===========================================
  // MODULE 3: EduNode Metrics Deep Dive
  // ===========================================
  {
    id: 'dl-003',
    slug: 'edunode-metrics-deep-dive',
    title: 'EduNode Metrics Deep Dive',
    description: 'Understand the purpose-driven metrics in EduNode Analytics and how to act on each one.',
    category: 'data_literacy',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    outcomes: [
      'Explain what each EduNode metric measures and why',
      'Identify appropriate actions based on metric thresholds',
      'Connect metrics to student intervention decisions',
      'Use metrics in data conversations with colleagues',
    ],
    sections: [
      {
        id: 'dl-003-01',
        title: 'Momentum Score',
        format: 'article',
        content: `
# Momentum Score: Measuring Trajectory, Not Just Position

## What It Measures

The Momentum Score tracks a student's **rate of progress** across assessments over time. Unlike a single test score that shows where a student is, Momentum shows where they're heading.

**Scale:** -100 to +100
- **Positive values** = accelerating (growing faster than expected)
- **Zero** = maintaining pace (on track)
- **Negative values** = decelerating (falling behind expected trajectory)

## How It's Calculated

The Momentum Score combines:
1. **Slope of recent assessments** (are scores going up or down?)
2. **Comparison to expected growth** (based on starting point)
3. **Consistency of trajectory** (steady growth vs. volatile)

## How to Use It

| Score Range | Signal | Action |
|-------------|--------|--------|
| +50 to +100 | Exceptional acceleration | Consider advancement opportunities, challenge enrichment |
| +10 to +49 | Positive momentum | Continue current approach, monitor for sustainability |
| -10 to +10 | Stable | Review if current tier is appropriate, look for stuck students |
| -49 to -10 | Warning sign | Increase intervention intensity, investigate barriers |
| -100 to -50 | Urgent | Immediate escalation, consider tier change, family conference |

## Common Misinterpretations

**Mistake:** "This student has a low test score, so their momentum must be bad."

**Reality:** A student scoring in the 30th percentile but with +40 momentum is on a great trajectory. Position and velocity are different.

**Mistake:** "Momentum is positive, so we're done."

**Reality:** Momentum can be positive but insufficient. A student two grade levels behind needs *more* momentum than peers, not just positive momentum.
        `,
        keyTakeaways: [
          'Momentum measures trajectory, not position—a struggling student can have great momentum',
          'Use momentum to identify who is accelerating vs. plateauing',
          'Positive momentum isn\'t enough if students started far behind',
        ],
      },
      {
        id: 'dl-003-02',
        title: 'Risk Index',
        format: 'article',
        content: `
# Risk Index: Early Warning for Disengagement

## What It Measures

The Risk Index is a composite score predicting likelihood of **academic disengagement or failure**—dropout risk for older students, falling behind for younger ones.

**Scale:** 0-100 (higher = more risk)

## Contributing Factors

The Risk Index weights multiple signals:

| Factor | Weight | Rationale |
|--------|--------|-----------|
| Attendance trend | 30% | #1 predictor of dropout |
| Grade trajectory | 25% | Academic struggle compounds |
| Behavior incidents | 20% | Discipline often signals disengagement |
| Assessment decline | 15% | Skills gaps widen over time |
| Course failures | 10% | Failed courses = credit deficiency |

## Thresholds and Actions

| Risk Level | Score | Population | Response |
|------------|-------|------------|----------|
| Low | 0-25 | ~60% of students | Standard monitoring |
| Moderate | 26-50 | ~25% of students | Check-in with advisor, review in data team |
| High | 51-75 | ~12% of students | Intervention plan required, case management |
| Critical | 76-100 | ~3% of students | Immediate intervention, family contact, SST |

## Important Nuances

**The Risk Index is probabilistic, not deterministic.** A score of 70 doesn't mean the student *will* disengage—it means they share characteristics with students who historically did.

**Risk can change quickly.** A single strong mentor relationship or resolved home situation can shift risk dramatically. The score updates weekly.

**Don't treat the number as the student.** Use Risk Index to prioritize attention, but understand the individual story before acting.
        `,
        keyTakeaways: [
          'Risk Index combines attendance, grades, behavior, and assessments into one early warning score',
          'Higher scores mean prioritize attention, not inevitable failure',
          'Risk changes—weekly updates reflect current trajectory, not permanent labels',
        ],
        reflectionQuestions: [
          'Who are your current high-risk students? Do you know why their risk is elevated?',
          'How does your school currently use attendance data for early intervention?',
        ],
      },
      {
        id: 'dl-003-03',
        title: 'Cohort Sync',
        format: 'article',
        content: `
# Cohort Sync: Grade-Level Alignment

## What It Measures

Cohort Sync indicates how **aligned a student's performance is with grade-level peers**. It answers: "Is this student where a typical student in their grade should be?"

**Scale:** Percentage (0-100%)
- **90-100%** = Fully aligned with grade-level expectations
- **70-89%** = Minor gaps, addressable with tier 1 interventions
- **50-69%** = Significant gaps, likely needs tier 2 support
- **Below 50%** = Major gaps, tier 3 intervention indicated

## Difference from Momentum

| Metric | Question Answered | Use Case |
|--------|-------------------|----------|
| **Momentum** | "Is this student improving?" | Track progress |
| **Cohort Sync** | "Is this student at grade level?" | Identify gaps |

A student can have:
- **High Momentum + Low Cohort Sync** = Catching up but not there yet
- **Low Momentum + High Cohort Sync** = At level but plateauing (risk of falling behind)
- **High Momentum + High Cohort Sync** = On track and accelerating (potential for advancement)
- **Low Momentum + Low Cohort Sync** = Falling further behind (urgent intervention needed)

## Using Cohort Sync for Grouping

Cohort Sync helps form intervention groups:
- Students with similar sync percentages and skill gaps can receive targeted small-group instruction
- Avoid grouping students with vastly different sync levels together

## Grade-Level Expectations

Cohort Sync is benchmarked against research-based grade-level expectations, not just class averages. This means:
- A high-performing school's "below average" students might still be at grade level
- A struggling school's "top" students might still have gaps
        `,
        keyTakeaways: [
          'Cohort Sync measures grade-level alignment, separate from growth trajectory',
          'Combine with Momentum to get the full picture: position AND velocity',
          'Use Cohort Sync for forming intervention groups with similar needs',
        ],
        practiceActivity: {
          title: 'Student Profile Analysis',
          instructions: 'Select three students from your roster. Look at their Momentum Score and Cohort Sync together. For each student, determine which quadrant they fall into (High/Low Momentum × High/Low Sync) and what that implies for intervention.',
          estimatedMinutes: 20,
          deliverable: 'Three student profiles with quadrant classification and intervention recommendation',
        },
      },
    ],
  },

  // ===========================================
  // MODULE 4: Data-Informed Decision Making
  // ===========================================
  {
    id: 'dl-004',
    slug: 'data-informed-decisions',
    title: 'Data-Informed Decision Making',
    description: 'A framework for systematically incorporating data into school leadership decisions.',
    category: 'data_literacy',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'advanced',
    estimatedMinutes: 35,
    outcomes: [
      'Apply a structured decision-making framework to school challenges',
      'Balance data with professional judgment and context',
      'Communicate data-informed decisions to stakeholders',
      'Build decision audit trails for continuous improvement',
    ],
    sections: [
      {
        id: 'dl-004-01',
        title: 'The OODA Loop for School Leaders',
        format: 'article',
        content: `
# Observe → Orient → Decide → Act

Originally developed for military strategy, the OODA loop provides a powerful framework for data-informed school leadership.

## Observe: Gathering Signal

The first step is collecting relevant data. Key questions:
- What metrics are relevant to this decision?
- What's the current state and recent trend?
- What additional context do I need (qualitative, environmental)?

**EduNode helps here** with dashboards showing current metrics, trends, and alerts.

## Orient: Making Sense

Raw data needs interpretation. This is where expertise matters:
- What does this data mean in our context?
- What patterns or anomalies stand out?
- What don't I know that I need to know?

**EduNode helps here** with Purpose-Driven Intelligence that pre-interprets metrics and surfaces insights.

## Decide: Committing to Action

With understanding, choose a path:
- What options are available?
- What are the tradeoffs of each?
- What reversibility does each option have?

**Critical principle:** "Decide with data, but don't let data decide." Data informs; leaders decide.

## Act: Executing with Fidelity

Implementation matters as much as the decision:
- Who needs to do what by when?
- How will we know if it's working?
- What checkpoints will we use to reassess?

**EduNode helps here** with progress tracking and impact measurement.

---

## The Loop Continues

OODA is not linear—it's a continuous cycle. The results of your action become new observations, starting the loop again.

Fast OODA loops (quickly observing results and adapting) beat slow ones. Schools that wait until end-of-year data lose the ability to course-correct.
        `,
        keyTakeaways: [
          'OODA provides a structured framework: Observe, Orient, Decide, Act',
          'Data informs decisions but doesn\'t make them—leaders do',
          'Fast feedback loops (weekly data) enable course correction',
        ],
      },
      {
        id: 'dl-004-02',
        title: 'Balancing Data and Judgment',
        format: 'article',
        content: `
# When Data and Intuition Conflict

Sometimes the numbers say one thing and your gut says another. Here's how to navigate:

## Data Has Limitations

Data captures what's measurable, not everything that matters. It may miss:
- Recent changes not yet reflected in metrics
- Qualitative factors (student motivation, family circumstances)
- Context only visible on the ground
- Small sample sizes that make statistics unreliable

## Intuition Has Limitations

Professional judgment, while valuable, can be biased by:
- Recency bias (overweighting recent events)
- Confirmation bias (seeking data that confirms beliefs)
- Availability bias (overweighting vivid examples)
- Sunk cost fallacy (continuing failing programs because of past investment)

## The Resolution Framework

When data and intuition conflict:

1. **Name the tension explicitly.** "The Risk Index says X, but I believe Y because Z."

2. **Investigate the gap.** Is there data you're missing? Is there context the data doesn't capture?

3. **Seek additional perspectives.** What do teachers closest to the situation observe?

4. **Make a provisional decision with checkpoints.** "We'll proceed with X, but revisit in two weeks with fresh data."

5. **Document your reasoning.** If you override data, write down why. This builds organizational learning.

## The Red Line Rule

Some decisions should be data-driven, period:
- Student safety issues
- Legal compliance matters
- Resource allocation at scale

Other decisions benefit more from judgment:
- Individual student interventions (data informs, relationship decides)
- Staff coaching and development
- Community and family engagement strategies
        `,
        keyTakeaways: [
          'Both data and intuition have blind spots—use them together',
          'When they conflict, investigate the gap before deciding',
          'Document reasoning for overriding data to build organizational learning',
        ],
        reflectionQuestions: [
          'Think of a recent decision where data and intuition conflicted. How did you resolve it?',
          'What decisions in your context should be data-driven vs. judgment-led?',
        ],
      },
    ],
  },
];

/**
 * Get all data literacy modules
 */
export function getDataLiteracyModules(): LearningModule[] {
  return DATA_LITERACY_MODULES;
}

/**
 * Get a specific module by slug
 */
export function getDataLiteracyModuleBySlug(slug: string): LearningModule | undefined {
  return DATA_LITERACY_MODULES.find((m) => m.slug === slug);
}
