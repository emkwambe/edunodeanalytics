# EduNode Analytics - Priority Adjustments
## Top 5 Changes to Align Implementation with Product Vision

**Date:** March 7, 2026
**Context:** Based on alignment matrix analysis of 11 documentation artifacts against current codebase state.

---

## Priority 1: Build the Early Warning Dashboard Page

### What to Change
Create `/[school_slug]/dashboard/early-warning` page with:
- Risk distribution visualization (donut + stacked bar)
- Sortable at-risk student table with top factors
- Intervention pipeline view (planned/active/stale)
- Alert feed component with acknowledge/resolve actions
- Risk driver breakdown (school-wide aggregates)

### Why It Matters for Charter School Pilots
**This is the MVP entry point.** Charter school MTSS coordinators need to answer four questions daily:
1. How many students are at risk?
2. Who are they?
3. Why are they at risk?
4. What are we doing about it?

Without this page, the risk engine has no user interface. The API endpoints exist (`/api/schools/[schoolId]/risk/scores`, `/distribution`, `/alerts`), but there's no visual consumption layer. A charter pilot cannot begin until coordinators can see the data.

### Implementation Priority
**Sprint 4 - Week 1-2** (Highest priority)

### Files to Create/Modify
```
src/app/[school_slug]/dashboard/early-warning/page.tsx
src/components/risk/RiskDistributionChart.tsx
src/components/risk/StudentRiskTable.tsx
src/components/risk/AlertFeed.tsx
src/components/risk/InterventionPipeline.tsx
src/components/risk/RiskDriverBreakdown.tsx
src/hooks/useRiskScores.ts
src/hooks/useRiskDistribution.ts
src/hooks/useRiskAlerts.ts
```

### API Dependencies (Already Implemented)
- `GET /api/schools/[schoolId]/risk/scores` - paginated, filterable
- `GET /api/schools/[schoolId]/risk/distribution` - tier counts + trends
- `GET /api/schools/[schoolId]/risk/alerts` - alert list
- `PATCH /api/schools/[schoolId]/risk/alerts/[alertId]` - acknowledge/resolve

---

## Priority 2: Add Plain Language Interpretation Layer

### What to Change
Transform machine output into human-readable dashboard content:

| Machine Output | Dashboard Display |
|----------------|-------------------|
| `risk_score: 0.73` | "Maria needs support - she's at risk" |
| `risk_level: 'critical'` | Red badge, sorted to top |
| `risk_factors: [{attendance: 0.38}]` | "Attendance is the primary concern (72%)" |
| `trajectory: 'declining'` | "Getting worse - was on track 4 weeks ago" |
| `confidence_level: 0.65` | "Limited data - connect your LMS for clearer picture" |

### Why It Matters for Charter School Pilots
Product philosophy states: "A teacher with no analytics training should open their dashboard and immediately understand which students need attention, why, and what to do about it."

Current implementation stores `risk_factors` with `description` fields, but:
1. Descriptions are technical ("78.5% attendance rate")
2. No threshold context ("is 78.5% good or bad?")
3. No trajectory context ("was it worse last week?")
4. No action prompt ("what should I do?")

Charter school teachers don't have time to interpret raw numbers. They need: "Maria is struggling - attendance dropped 15% this month. Schedule family meeting."

### Implementation Priority
**Sprint 4 - Week 2** (Part of dashboard build)

### Files to Create/Modify
```
src/lib/risk-engine/interpreter.ts       # New: converts factors to plain language
src/components/risk/StudentRiskCard.tsx  # Uses interpreter for display
src/components/risk/RiskInsightPanel.tsx # New: summary sentences per student
```

### Key Functions to Implement
```typescript
// src/lib/risk-engine/interpreter.ts
export function interpretRiskScore(score: number, level: RiskLevel): string;
export function interpretFactor(factor: RiskFactor, config: RiskModelConfig): string;
export function interpretTrajectory(trajectory: Trajectory, weeksData: number): string;
export function interpretConfidence(confidence: number): string;
export function generateActionPrompt(factors: RiskFactor[], level: RiskLevel): string[];
```

---

## Priority 3: Implement Dosage Analysis Foundation

### What to Change
Build the intervention effectiveness measurement system per `INTERVENTION_DOSAGE_ANALYSIS.md`:

1. Create `intervention_dosage_metrics` table migration
2. Add `DosagePlan` structure validation in `interventions.metadata`
3. Implement `src/lib/risk-engine/dosage-analyzer.ts`
4. Add session-level fields to progress notes schema
5. Create dosage computation in weekly batch cron

### Why It Matters for Charter School Pilots
Charter renewal depends on demonstrating MTSS effectiveness. Authorizers ask:
- "Did you intervene?" (Yes - interventions table)
- "Was the intervention appropriate?" (Dosage sufficiency)
- "Did it work?" (Risk score delta)
- "Can you prove it?" (Audit trail)

Without dosage analysis, charter schools can only say "we tried." With dosage analysis, they can say "we delivered 18 sessions of math tutoring at 85% fidelity, resulting in a 0.14 risk score reduction over 6 weeks."

This is the documentation that keeps charter schools open.

### Implementation Priority
**Sprint 3 - Week 2 through Sprint 4 - Week 1**

### Files to Create
```
supabase/migrations/00007_intervention_dosage.sql
src/lib/risk-engine/dosage-analyzer.ts
src/app/api/schools/[schoolId]/interventions/[id]/dosage/route.ts
src/app/api/schools/[schoolId]/interventions/dosage/summary/route.ts
```

### Database Schema (from spec)
```sql
CREATE TABLE public.intervention_dosage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL REFERENCES interventions(id),
  student_id UUID NOT NULL REFERENCES students(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  planned_sessions INTEGER NOT NULL DEFAULT 0,
  delivered_sessions INTEGER NOT NULL DEFAULT 0,
  fidelity_rate NUMERIC(4,3),
  risk_score_at_start NUMERIC(4,3),
  risk_score_current NUMERIC(4,3),
  risk_score_delta NUMERIC(5,3),
  weeks_elapsed INTEGER DEFAULT 0,
  response_status TEXT,
  recommended_action TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Priority 4: Add Mobility and Placement Tracking

### What to Change
Extend `student_metrics` schema to support the Whole Student Context Guide:

```sql
-- Add to student_metrics table
ALTER TABLE student_metrics ADD COLUMN IF NOT EXISTS
  placement_status TEXT DEFAULT 'confirmed'
    CHECK (placement_status IN ('temporary', 'under_review', 'confirmed'));
ALTER TABLE student_metrics ADD COLUMN IF NOT EXISTS placement_confirmed_at DATE;
ALTER TABLE student_metrics ADD COLUMN IF NOT EXISTS enrollment_date DATE;
ALTER TABLE student_metrics ADD COLUMN IF NOT EXISTS prior_school_count INTEGER DEFAULT 0;
ALTER TABLE student_metrics ADD COLUMN IF NOT EXISTS mobility_flag BOOLEAN DEFAULT false;
ALTER TABLE student_metrics ADD COLUMN IF NOT EXISTS days_since_enrollment INTEGER;
```

Add alert rule for placement review:
```typescript
// In early-warning.ts DEFAULT_ALERT_RULES
{
  id: 'placement-review-due',
  name: 'Placement Review Due',
  description: 'Student enrolled 30+ days with temporary placement',
  condition: {
    type: 'threshold',
    field: 'days_since_enrollment',
    operator: 'gte',
    value: 30
  },
  severity: 'info',
  alertType: 'trend_warning',
  enabled: true,
  cooldownMinutes: 10080,
  notifyRoles: ['coordinator', 'counselor'],
}
```

### Why It Matters for Charter School Pilots
Charter schools have higher mobility rates than traditional public schools. Per the Whole Student Context Guide:
- Mobile students' first diagnostic scores systematically underestimate ability
- Treating first-day diagnostics as permanent placement damages student trajectories
- 4-6 week review reminder prevents "temporary" becoming "permanent"

A charter school that can demonstrate mobility-aware data practices shows authorizers it understands its population and doesn't mislabel struggling students.

### Implementation Priority
**Sprint 4 - Week 2**

### Files to Modify
```
supabase/migrations/00008_mobility_tracking.sql  # New migration
src/lib/risk-engine/metrics-aggregator.ts        # Compute days_since_enrollment
src/lib/risk/early-warning.ts                    # Add placement review rule
src/components/risk/StudentRiskCard.tsx          # Show mobility badge
```

---

## Priority 5: Regenerate database.types.ts

### What to Change
Run Supabase CLI to regenerate TypeScript types:
```bash
npx supabase login
npx supabase gen types typescript --project-id <project-ref> > src/lib/database.types.ts
```

Then remove `@ts-nocheck` from:
- `src/lib/risk/detection-engine.ts`
- `src/lib/risk/early-warning.ts`
- `src/lib/compliance/evidence-logger.ts`
- `src/lib/compliance/ferpa-compliance.ts`
- `src/lib/data/integration/orchestrator.ts`
- `src/lib/data/integration/pipeline.ts`
- `src/lib/interventions/workflow-manager.ts`

### Why It Matters for Charter School Pilots
The current `database.types.ts` is stale (missing Sprint 1A tables). This causes:
1. TypeScript errors when building without `@ts-nocheck`
2. No IDE autocomplete for new tables
3. Risk of runtime type mismatches
4. Blocks proper type safety across the codebase

While the app builds today, the technical debt accumulates. Every new feature touching risk engine tables requires manual type definitions or `as unknown as` casts.

### Implementation Priority
**Sprint 2 - Immediate (Blocker)**

### Prerequisites
- Supabase CLI installed
- Project linked: `npx supabase link --project-ref <ref>`
- Logged in: `npx supabase login`

### Files to Modify
```
src/lib/database.types.ts                         # Regenerated
src/lib/risk/detection-engine.ts                  # Remove @ts-nocheck
src/lib/risk/early-warning.ts                     # Remove @ts-nocheck
src/lib/compliance/evidence-logger.ts             # Remove @ts-nocheck
src/lib/compliance/ferpa-compliance.ts            # Remove @ts-nocheck
src/lib/data/integration/orchestrator.ts          # Remove @ts-nocheck
src/lib/data/integration/pipeline.ts              # Remove @ts-nocheck
src/lib/interventions/workflow-manager.ts         # Remove @ts-nocheck
```

---

## Summary: Priority Order for Pilot Readiness

| Priority | Change | Sprint | Pilot Blocker? |
|----------|--------|--------|----------------|
| 1 | Early Warning Dashboard | Sprint 4 Week 1-2 | **YES** |
| 2 | Plain Language Interpreter | Sprint 4 Week 2 | YES |
| 3 | Dosage Analysis Foundation | Sprint 3-4 | NO (differentiator) |
| 4 | Mobility/Placement Tracking | Sprint 4 Week 2 | NO (enhancement) |
| 5 | database.types.ts Regen | Sprint 2 Immediate | TECH DEBT |

**Minimum Viable Pilot:** Priorities 1, 2, and 5 must be complete before the first charter school can use EduNode effectively.

---

*Generated: March 7, 2026*
