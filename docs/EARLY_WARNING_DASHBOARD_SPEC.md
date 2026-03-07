# EduNode Analytics - Early Warning Dashboard Component Specification
## Route: `/[school_slug]/dashboard/early-warning`

**Date:** March 7, 2026
**Target Sprint:** Sprint 4
**Primary User:** MTSS Coordinator
**Secondary Users:** Principal, Counselor

---

## Overview

The Early Warning Dashboard is the primary interface for MTSS coordinators to monitor student risk, manage alerts, and track intervention effectiveness. It must answer four questions instantly:

1. **How many students are at risk today?**
2. **Who are the top highest-risk students?**
3. **Why are they at risk?**
4. **What are we doing about it?**

---

## Component Tree

```
EarlyWarningDashboard (page.tsx)
├── PageHeader
│   ├── Title: "Early Warning Dashboard"
│   ├── SchoolSelector (if multi-school access)
│   └── DateRangeFilter
│
├── SummaryCards (4 cards)
│   ├── TotalStudentsCard
│   ├── AtRiskCountCard
│   ├── NewAlertsCard
│   └── StaleInterventionsCard
│
├── MainContent (grid layout)
│   ├── LeftColumn (2/3 width)
│   │   ├── RiskDistributionChart
│   │   │   ├── DonutChart (current distribution)
│   │   │   └── StackedBarChart (weekly trend)
│   │   │
│   │   ├── StudentRiskTable
│   │   │   ├── TableFilters
│   │   │   │   ├── RiskLevelFilter
│   │   │   │   ├── GradeLevelFilter
│   │   │   │   ├── SearchInput
│   │   │   │   └── SortDropdown
│   │   │   ├── TableHeader
│   │   │   ├── TableBody
│   │   │   │   └── StudentRiskRow (repeated)
│   │   │   │       ├── StudentInfo
│   │   │   │       ├── RiskBadge
│   │   │   │       ├── TopFactors
│   │   │   │       ├── TrajectoryIndicator
│   │   │   │       ├── InterventionStatus
│   │   │   │       └── ActionButtons
│   │   │   └── TablePagination
│   │   │
│   │   └── RiskDriverBreakdown
│   │       └── DriverBarChart (horizontal)
│   │
│   └── RightColumn (1/3 width)
│       ├── AlertFeed
│       │   ├── AlertFeedHeader
│       │   │   ├── Title: "Recent Alerts"
│       │   │   └── FilterDropdown (severity)
│       │   ├── AlertList
│       │   │   └── AlertCard (repeated)
│       │   │       ├── SeverityBadge
│       │   │       ├── StudentName
│       │   │       ├── AlertMessage
│       │   │       ├── Timestamp
│       │   │       └── ActionButtons
│       │   │           ├── AcknowledgeButton
│       │   │           ├── ResolveButton
│       │   │           └── DismissButton
│       │   └── ViewAllLink
│       │
│       └── InterventionPipeline
│           ├── PipelineHeader
│           ├── PipelineStages
│           │   ├── PlannedStage (count + expand)
│           │   ├── ActiveStage (count + expand)
│           │   ├── StaleStage (count + expand, highlighted)
│           │   └── CompletedStage (count)
│           └── QuickActions
│               └── CreateInterventionButton
│
└── MeetingPrepPanel (collapsible bottom panel)
    ├── PanelHeader: "MTSS Meeting Prep"
    ├── SelectedStudentsList
    ├── GenerateAgendaButton
    └── ExportOptions (PDF, Print)
```

---

## Page Component

### File: `src/app/[school_slug]/dashboard/early-warning/page.tsx`

```typescript
// Page props
interface PageProps {
  params: { school_slug: string };
  searchParams: {
    level?: RiskLevel;
    grade?: string;
    search?: string;
    page?: string;
  };
}

// Page component
export default async function EarlyWarningDashboard({ params, searchParams }: PageProps) {
  // Server-side auth check
  const school = await getSchoolBySlug(params.school_slug);
  const user = await getCurrentUser();

  // Verify user has coordinator/admin/counselor role
  const membership = await getUserMembership(user.id, school.id);
  if (!['admin', 'mtss_coordinator', 'counselor'].includes(membership.role)) {
    redirect(`/${params.school_slug}/dashboard`);
  }

  return (
    <DashboardLayout school={school}>
      <EarlyWarningContent schoolId={school.id} initialFilters={searchParams} />
    </DashboardLayout>
  );
}
```

---

## Data Fetching Hooks

### `useRiskScores`

```typescript
// File: src/hooks/useRiskScores.ts

interface UseRiskScoresOptions {
  schoolId: string;
  level?: RiskLevel;
  grade?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'risk_score' | 'student_name' | 'grade_level';
  sortOrder?: 'asc' | 'desc';
}

interface RiskScoreData {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  riskScore: number;
  riskLevel: RiskLevel;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  trajectory: Trajectory;
  confidenceLevel: number;
  topFactors: {
    name: string;
    category: string;
    score: number;
    description: string;
  }[];
  activeIntervention: {
    id: string;
    title: string;
    status: string;
  } | null;
  hasIep: boolean;
  has504Plan: boolean;
  isChronicallyAbsent: boolean;
  computedAt: string;
}

interface UseRiskScoresResult {
  data: RiskScoreData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRiskScores(options: UseRiskScoresOptions): UseRiskScoresResult {
  // Calls: GET /api/schools/[schoolId]/risk/scores
  // With query params from options
}
```

### `useRiskDistribution`

```typescript
// File: src/hooks/useRiskDistribution.ts

interface UseRiskDistributionOptions {
  schoolId: string;
  weeks?: number; // default 8
}

interface RiskDistributionData {
  distribution: {
    on_track: number;
    watch: number;
    at_risk: number;
    critical: number;
    total: number;
  };
  byGrade: {
    grade: number;
    on_track: number;
    watch: number;
    at_risk: number;
    critical: number;
  }[];
  weeklyTrend: {
    weekStart: string;
    on_track: number;
    watch: number;
    at_risk: number;
    critical: number;
  }[];
}

export function useRiskDistribution(options: UseRiskDistributionOptions): {
  data: RiskDistributionData | null;
  isLoading: boolean;
  error: Error | null;
} {
  // Calls: GET /api/schools/[schoolId]/risk/distribution?weeks=N
}
```

### `useRiskAlerts`

```typescript
// File: src/hooks/useRiskAlerts.ts

interface UseRiskAlertsOptions {
  schoolId: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  limit?: number;
}

interface RiskAlertData {
  id: string;
  studentId: string;
  studentName: string;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  createdAt: string;
  acknowledgedAt: string | null;
}

export function useRiskAlerts(options: UseRiskAlertsOptions): {
  data: RiskAlertData[];
  isLoading: boolean;
  error: Error | null;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string, notes?: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
} {
  // Calls: GET /api/schools/[schoolId]/risk/alerts
  // Mutations call: PATCH /api/schools/[schoolId]/risk/alerts/[alertId]
}
```

### `useRiskDrivers`

```typescript
// File: src/hooks/useRiskDrivers.ts

interface UseRiskDriversOptions {
  schoolId: string;
}

interface RiskDriverData {
  category: string;
  count: number;
  percentage: number;
  avgContribution: number;
}

export function useRiskDrivers(options: UseRiskDriversOptions): {
  data: RiskDriverData[];
  isLoading: boolean;
  error: Error | null;
} {
  // Calls: GET /api/schools/[schoolId]/risk/drivers
}
```

---

## Key Components

### RiskDistributionChart

```typescript
// File: src/components/risk/RiskDistributionChart.tsx

interface RiskDistributionChartProps {
  distribution: {
    on_track: number;
    watch: number;
    at_risk: number;
    critical: number;
    total: number;
  };
  weeklyTrend: {
    weekStart: string;
    on_track: number;
    watch: number;
    at_risk: number;
    critical: number;
  }[];
  onLevelClick?: (level: RiskLevel) => void;
}

// Features:
// - Donut chart showing current distribution (uses recharts or chart.js)
// - Color coding: green (on_track), yellow (watch), orange (at_risk), red (critical)
// - Click on segment filters the table below
// - Stacked bar chart showing 8-week trend
// - Responsive: stacks vertically on mobile
```

### StudentRiskTable

```typescript
// File: src/components/risk/StudentRiskTable.tsx

interface StudentRiskTableProps {
  schoolId: string;
  initialFilters?: {
    level?: RiskLevel;
    grade?: number;
    search?: string;
  };
  onStudentSelect?: (studentId: string) => void;
}

// Features:
// - Server-side pagination via API
// - Column sort: risk score, name, grade
// - Filter pills for level, grade
// - Search by student name
// - Each row shows:
//   - Student name + grade
//   - Risk badge (color-coded)
//   - Top 3 factors (abbreviated)
//   - Trajectory arrow (up/down/steady)
//   - Intervention status badge
//   - Action menu (view, flag, create intervention)
// - Checkbox selection for meeting prep
```

### StudentRiskRow

```typescript
// File: src/components/risk/StudentRiskRow.tsx

interface StudentRiskRowProps {
  student: RiskScoreData;
  selected?: boolean;
  onSelect?: () => void;
  onAction?: (action: 'view' | 'flag' | 'intervene') => void;
}

// Renders single row with:
// - Checkbox for selection
// - Avatar + name + grade badges (IEP, 504)
// - Risk score with level badge
// - Plain-language factor summary (uses interpreter)
// - Trajectory indicator with tooltip
// - Intervention status or "No intervention" badge
// - Action dropdown
```

### AlertFeed

```typescript
// File: src/components/risk/AlertFeed.tsx

interface AlertFeedProps {
  schoolId: string;
  limit?: number;
  severityFilter?: AlertSeverity;
}

// Features:
// - Real-time polling (every 30 seconds)
// - Severity color coding (critical=red, urgent=orange, warning=yellow, info=blue)
// - Acknowledge button (marks alert as seen)
// - Resolve button (opens modal for notes)
// - Dismiss button (with confirmation)
// - Click alert to navigate to student detail
// - "View All" link to full alerts page
```

### AlertCard

```typescript
// File: src/components/risk/AlertCard.tsx

interface AlertCardProps {
  alert: RiskAlertData;
  onAcknowledge: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}

// Renders:
// - Severity badge (icon + color)
// - Student name as link
// - Plain-language message
// - Relative time ("2 hours ago")
// - Quick action buttons
// - Expand to show full details
```

### InterventionPipeline

```typescript
// File: src/components/risk/InterventionPipeline.tsx

interface InterventionPipelineProps {
  schoolId: string;
  onStageClick?: (stage: 'planned' | 'active' | 'stale' | 'completed') => void;
}

// Features:
// - Visual pipeline: Planned → Active → Completed
// - Stale interventions highlighted in red
// - Count badges on each stage
// - Click stage to expand list of interventions
// - Quick actions: nudge owner, review, close
// - "No intervention yet" count for at-risk students
```

### RiskDriverBreakdown

```typescript
// File: src/components/risk/RiskDriverBreakdown.tsx

interface RiskDriverBreakdownProps {
  schoolId: string;
}

// Features:
// - Horizontal bar chart
// - Categories: Attendance, Academic, Behavior, Assignments, Engagement
// - Shows count of students where this is primary driver
// - Color intensity by severity
// - Click to filter table by driver category
```

### MeetingPrepExport

```typescript
// File: src/components/risk/MeetingPrepExport.tsx

interface MeetingPrepExportProps {
  schoolId: string;
  selectedStudentIds: string[];
  onExport: (format: 'pdf' | 'print') => void;
}

// Features:
// - Selected students list with remove button
// - "Generate Agenda" button
// - Produces structured document with:
//   - Student summaries
//   - Risk factors
//   - Current interventions
//   - Recommended actions
// - Export to PDF or print
```

---

## Plain Language Interpreter

```typescript
// File: src/lib/risk-engine/interpreter.ts

import type { RiskLevel, Trajectory, RiskFactor, RiskModelConfig } from './types';

/**
 * Convert a risk score to human-readable text
 */
export function interpretRiskScore(score: number, level: RiskLevel): string {
  const levelText = {
    on_track: 'is on track',
    watch: 'needs monitoring',
    at_risk: 'needs support',
    critical: 'needs immediate attention',
  };

  return `${levelText[level]}`;
}

/**
 * Convert a risk factor to plain language
 */
export function interpretFactor(factor: RiskFactor, config?: RiskModelConfig): string {
  switch (factor.category) {
    case 'attendance':
      const rate = Math.round(factor.rawValue * 100);
      if (rate < 75) return `Attendance is critically low at ${rate}%`;
      if (rate < 85) return `Attendance is concerning at ${rate}%`;
      if (rate < 90) return `Attendance is below target at ${rate}%`;
      return `Attendance is acceptable at ${rate}%`;

    case 'academic':
      if (factor.name === 'Academic Performance') {
        const level = factor.rawValue;
        if (level <= 1) return 'Performing well below grade level';
        if (level === 2) return 'Approaching grade level standards';
        if (level === 3) return 'Meeting grade level standards';
        return 'Exceeding grade level standards';
      }
      if (factor.name === 'Academic Growth') {
        const pctl = factor.rawValue;
        if (pctl < 25) return `Growth is in bottom quartile (${pctl}th percentile)`;
        if (pctl < 50) return `Growth is below average (${pctl}th percentile)`;
        return `Growth is on target (${pctl}th percentile)`;
      }
      return factor.description;

    case 'engagement':
      const engagement = Math.round(factor.rawValue * 100);
      if (engagement < 30) return 'Engagement is very low';
      if (engagement < 50) return 'Engagement is below expectations';
      if (engagement < 70) return 'Engagement is moderate';
      return 'Engagement is strong';

    default:
      return factor.description;
  }
}

/**
 * Convert trajectory to plain language
 */
export function interpretTrajectory(trajectory: Trajectory, previousLevel?: RiskLevel): string {
  switch (trajectory) {
    case 'improving':
      return previousLevel
        ? `Improving - was ${previousLevel.replace('_', ' ')} recently`
        : 'Trend is improving';
    case 'declining':
      return previousLevel
        ? `Getting worse - was ${previousLevel.replace('_', ' ')} recently`
        : 'Trend is declining';
    case 'stable':
      return 'Holding steady';
    default:
      return '';
  }
}

/**
 * Convert confidence level to plain language
 */
export function interpretConfidence(confidence: number): string {
  if (confidence >= 0.8) return '';  // Don't show if high confidence
  if (confidence >= 0.6) return 'Some data missing - assessment may be incomplete';
  if (confidence >= 0.4) return 'Limited data available - connect more sources for accuracy';
  return 'Very limited data - risk assessment is unreliable';
}

/**
 * Generate action prompts based on factors
 */
export function generateActionPrompts(
  factors: RiskFactor[],
  level: RiskLevel,
  hasIntervention: boolean
): string[] {
  const actions: string[] = [];

  // Sort factors by weighted score
  const sorted = [...factors].sort((a, b) => b.weightedScore - a.weightedScore);
  const topFactor = sorted[0];

  if (level === 'critical') {
    actions.push('Schedule Student Support Team meeting urgently');
  }

  if (topFactor?.category === 'attendance' && topFactor.weightedScore > 0.2) {
    actions.push('Contact family about attendance');
    actions.push('Consider attendance mentor assignment');
  }

  if (topFactor?.category === 'academic' && topFactor.weightedScore > 0.15) {
    actions.push('Review for academic intervention placement');
    actions.push('Consider tutoring or small group instruction');
  }

  if (!hasIntervention && (level === 'at_risk' || level === 'critical')) {
    actions.push('Assign intervention immediately');
  }

  return actions.slice(0, 3);
}

/**
 * Generate a single-sentence summary for a student
 */
export function generateStudentSummary(
  studentName: string,
  score: number,
  level: RiskLevel,
  factors: RiskFactor[],
  trajectory: Trajectory
): string {
  const sorted = [...factors].sort((a, b) => b.weightedScore - a.weightedScore);
  const topFactor = sorted[0];
  const topFactorText = topFactor ? interpretFactor(topFactor) : '';

  const trajectoryText = trajectory === 'declining'
    ? ' and getting worse'
    : trajectory === 'improving'
    ? ' but improving'
    : '';

  return `${studentName} ${interpretRiskScore(score, level)}${trajectoryText}. ${topFactorText}.`;
}
```

---

## API Endpoint Reference

| Endpoint | Method | Used By | Purpose |
|----------|--------|---------|---------|
| `/api/schools/[schoolId]/risk/scores` | GET | `useRiskScores`, `StudentRiskTable` | Paginated student risk list |
| `/api/schools/[schoolId]/risk/distribution` | GET | `useRiskDistribution`, `RiskDistributionChart` | Tier counts + trends |
| `/api/schools/[schoolId]/risk/drivers` | GET | `useRiskDrivers`, `RiskDriverBreakdown` | Factor aggregates |
| `/api/schools/[schoolId]/risk/alerts` | GET | `useRiskAlerts`, `AlertFeed` | Alert list |
| `/api/schools/[schoolId]/risk/alerts/[alertId]` | PATCH | `useRiskAlerts` | Acknowledge/resolve/dismiss |
| `/api/schools/[schoolId]/risk/config` | GET | `useRiskConfig` | Model configuration |
| `/api/schools/[schoolId]/risk/history/[studentId]` | GET | Student detail modal | Score history |
| `/api/schools/[schoolId]/interventions` | GET | `InterventionPipeline` | Pipeline counts |

---

## Styling Guidelines

### Color Palette (Risk Levels)
```css
--risk-on-track: #22c55e;     /* green-500 */
--risk-watch: #eab308;         /* yellow-500 */
--risk-at-risk: #f97316;       /* orange-500 */
--risk-critical: #ef4444;      /* red-500 */
```

### Alert Severity Colors
```css
--alert-info: #3b82f6;         /* blue-500 */
--alert-warning: #eab308;      /* yellow-500 */
--alert-urgent: #f97316;       /* orange-500 */
--alert-critical: #ef4444;     /* red-500 */
```

### Trajectory Indicators
```css
--trajectory-improving: #22c55e;  /* green-500 - arrow up */
--trajectory-stable: #6b7280;     /* gray-500 - arrow right */
--trajectory-declining: #ef4444;  /* red-500 - arrow down */
```

### Component Spacing
- Card padding: 1.5rem (24px)
- Section gap: 1.5rem (24px)
- Grid gap: 1rem (16px)
- Table row height: 64px minimum

---

## Accessibility Requirements

- All charts have text alternatives
- Color is never the only indicator (add icons, patterns)
- Keyboard navigation for all interactive elements
- ARIA labels on action buttons
- Focus indicators visible
- Screen reader announcements for alert updates
- Minimum contrast ratio 4.5:1

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column, stacked sections |
| 768px - 1024px | 2 columns, table scrolls horizontally |
| > 1024px | Full 3-column layout as designed |

---

## Performance Targets

- Initial page load: < 2 seconds
- Table pagination: < 500ms
- Alert actions: < 200ms
- Chart rendering: < 300ms
- Use React.memo for table rows
- Virtual scrolling if > 100 visible rows

---

## File Structure

```
src/
├── app/
│   └── [school_slug]/
│       └── dashboard/
│           └── early-warning/
│               └── page.tsx
│
├── components/
│   └── risk/
│       ├── RiskDistributionChart.tsx
│       ├── StudentRiskTable.tsx
│       ├── StudentRiskRow.tsx
│       ├── AlertFeed.tsx
│       ├── AlertCard.tsx
│       ├── InterventionPipeline.tsx
│       ├── RiskDriverBreakdown.tsx
│       ├── MeetingPrepExport.tsx
│       └── index.ts
│
├── hooks/
│   ├── useRiskScores.ts
│   ├── useRiskDistribution.ts
│   ├── useRiskAlerts.ts
│   ├── useRiskDrivers.ts
│   └── useRiskConfig.ts
│
└── lib/
    └── risk-engine/
        └── interpreter.ts
```

---

*Generated: March 7, 2026*
*Based on: ROLE_BASED_DASHBOARD_DESIGN.md, WHOLE_STUDENT_CONTEXT_GUIDE.md, PRODUCT_PHILOSOPHY.md*
