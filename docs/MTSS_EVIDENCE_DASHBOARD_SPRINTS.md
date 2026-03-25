# EduNode Analytics — MTSS Evidence Dashboard Restructure

**Version:** 1.0  
**Date:** March 24, 2026  
**Author:** Claude Chat (Lead Architect) + Eddy Mkwambe (Technical Director)  
**Prerequisite:** T0-T4 complete (145/145). 629 tests. Build clean.  
**Reference:** docs/DEBT_TO_PRODUCTION_BLUEPRINT.md, EDUNODE_DASHBOARD_REEVALUATION.md

---

## The Problem

The dashboards were built sprint-by-sprint as features shipped. They work, but they don't tell a unified story. Each page shows data — but doesn't frame it around the accountability question that charter schools must answer:

> "We identified students who needed help, we responded quickly, we followed through consistently, and students improved."

That story is the product's core value. It must be visible to three audiences at three levels of detail:

| Audience | Where They See It | What They Need | Frequency |
|----------|-------------------|----------------|-----------|
| **Principal / Admin** | Pulse Dashboard | Operational metrics — am I on track? Who needs a nudge? | Daily |
| **MTSS Coordinator** | Early Warning + Interventions Hub | Tactical view — which students need action today? | 2-3x/week |
| **Authorizer** | Authorizer Page + Exported Report | Evidence summary — does this school have a system? | 1-2x/year |

The data already exists in the database. This restructure is **UI/narrative work**, not backend work.

---

## Architecture: Shared Metrics, Role-Specific Framing

### New Shared Component: MTSS Evidence Metrics

Create `src/components/dashboard/mtss-evidence-metrics.tsx` — a single component that computes and displays four core metrics:

| Metric | Computation | Source |
|--------|-------------|--------|
| **Students Identified** | COUNT of students with risk_level IN (watch, at_risk, critical) in current term | risk_scores |
| **Response Rate** | % of flagged students with at least one active intervention | risk_scores + interventions |
| **Avg Dosage Compliance** | Mean dosage compliance across all active interventions | dosage_metrics |
| **Improvement Rate** | % of flagged students whose risk_level decreased since first flag | student_risk_history |

This component accepts a `variant` prop to control presentation:

- `variant="operational"` — for Pulse (shows targets, trend arrows, action links)
- `variant="summary"` — for Authorizer (read-only, export-friendly, no action buttons)
- `variant="compact"` — for embedding in other pages (smaller, no charts)

### Access Control

| Page | Roles That See It |
|------|-------------------|
| Pulse Dashboard | school_admin, principal, data_manager |
| Early Warning | school_admin, principal, teacher, counselor, data_manager |
| Interventions Hub | school_admin, principal, counselor, data_manager |
| Student 360 | school_admin, principal, teacher (own students), counselor |
| Authorizer View | school_admin, principal, authorizer |

Teachers see Early Warning and their own students' 360 views. They do NOT see the Authorizer page or school-wide intervention effectiveness. This protects against the "dosage compliance leaderboard" being visible to peers — only admins see staff-level compliance.

---

## Sprint Plan

### Sprint 5A — MTSS Evidence Metrics Component + API (Backend-for-frontend)

**Scope:** Build the shared metrics computation and the reusable component. No page changes yet.

**Why first:** Every subsequent sprint depends on this component. Build it once, verify it, then surface it everywhere.

**Requirements:**

1. Create `src/app/api/schools/[schoolId]/mtss-summary/route.ts`
   - GET endpoint returning JSON:
     ```json
     {
       "students_identified": 47,
       "students_flagged_no_intervention": 7,
       "response_rate": 0.81,
       "avg_time_to_action_days": 4.2,
       "avg_dosage_compliance": 0.84,
       "improvement_rate": 0.58,
       "students_improved": 22,
       "students_maintained": 6,
       "students_worsened": 3,
       "period": "2025-2026",
       "last_updated": "2026-03-24T..."
     }
     ```
   - Computed from: risk_scores, interventions, intervention_sessions, dosage_metrics, student_risk_history
   - Must respect RLS (school-scoped)
   - FERPA audit log on access

2. Create `src/components/dashboard/mtss-evidence-metrics.tsx`
   - Accepts `variant` prop: "operational" | "summary" | "compact"
   - Accepts `schoolId` prop
   - Fetches from `/api/schools/[schoolId]/mtss-summary`
   - Shows loading skeleton while fetching
   - Shows empty state if no data
   - Operational variant: metrics + trend arrows + target comparisons + "View Details" links
   - Summary variant: metrics only, styled for export/authorizer (no interactive elements)
   - Compact variant: single row of 4 numbers for embedding

3. Create `src/lib/hooks/use-mtss-summary.ts` — SWR/fetch hook for the endpoint

4. Write tests:
   - API route: valid response shape, RLS enforcement, empty school returns zeros
   - Component: renders all three variants, handles loading, handles empty state

**Verification:**
- npm run build succeeds
- npm run test passes (629 + new tests)
- API returns valid JSON for demo school
- Component renders in all 3 variants (verify via test)

---

### Sprint 5B — Pulse Dashboard Restructure

**Scope:** Add MTSS operational metrics to the Pulse page. This is what the principal sees daily.

**Why second:** Pulse is the landing page after login. The first impression in every demo.

**Current state:** ~6-13KB page (the main dashboard page.tsx at 6713 bytes). Shows general school metrics.

**Requirements:**

1. Add the MTSS Evidence Metrics component (operational variant) as the FIRST section on the Pulse page — above any existing content

2. Add a "Needs Immediate Action" alert card below the metrics:
   - Shows count of students flagged with NO intervention
   - "7 students flagged with no active intervention" → [View in Early Warning] button
   - Only shows if count > 0

3. Add Response Rate gauge or progress bar:
   - Current rate vs target (default target: 90%)
   - Color-coded: green (>85%), amber (70-85%), red (<70%)

4. Add "This Week" summary card:
   - New risk alerts this week
   - Interventions created this week
   - Students who changed risk level this week
   - Keep it to 3-4 bullet points maximum

5. Do NOT remove existing Pulse content — add above it. Existing charts and metrics stay.

**Verification:**
- Build succeeds, tests pass
- Pulse page shows MTSS metrics first, then existing content
- Empty state works when no risk data exists

---

### Sprint 5C — Early Warning Actionability Tiers

**Scope:** Restructure the Early Warning page from a flat student list into actionability tiers.

**Why third:** This is the "money slide" in demos — where the MTSS coordinator lives.

**Current state:** 16KB page. List of at-risk students with risk scores and dosage widgets.

**Requirements:**

1. Group students into three visual sections (collapsible):

   **Section 1: "Needs Immediate Action"** (red accent)
   - Students flagged at_risk or critical with NO active intervention
   - Show: student name, risk level, risk score, days since flag, top risk driver
   - Action button: [Create Intervention]
   - Sort by: risk score descending (worst first)

   **Section 2: "Intervention Needs Attention"** (amber accent)
   - Students with active intervention BUT dosage compliance < 60% OR declining trend
   - Show: student name, risk level, intervention name, dosage compliance %, sessions missed
   - Action button: [View Intervention]
   - Sort by: dosage compliance ascending (worst first)

   **Section 3: "Responding & Improving"** (green accent)
   - Students with active intervention AND positive trend (risk decreasing or dosage >80%)
   - Show: student name, previous risk → current risk, dosage compliance %, intervention name
   - Action button: [View Details]
   - Collapsed by default (expand to see success stories)

2. Add section headers with counts: "Needs Immediate Action (7)" / "Needs Attention (8)" / "Improving (12)"

3. Add "Export MTSS Meeting Prep" button at the top — downloads CSV with all flagged students, their risk drivers, intervention status, and dosage compliance

4. Keep existing filters (grade, risk level) — add new filter: "Has Intervention: Yes/No"

5. Add compact MTSS Evidence Metrics (compact variant) at the top of the page

**Verification:**
- Build succeeds, tests pass
- Students correctly grouped into 3 tiers
- Export button generates valid CSV
- Existing filters still work
- Empty state per section when no students match

---

### Sprint 5D — Interventions Hub Effectiveness Summary

**Scope:** Add school-wide intervention effectiveness metrics to the Interventions page.

**Why fourth:** Answers "Is our MTSS program working?" — critical for both admin and authorizer.

**Current state:** 27KB main page + 23KB detail page + 16KB new intervention page. Already substantial.

**Requirements:**

1. Add an "MTSS Program Effectiveness" summary card at the top of the interventions list page:
   - Total active interventions
   - Average dosage compliance (with color-coded gauge)
   - Outcomes breakdown: X improved (%), Y maintained (%), Z worsened (%)
   - Best performing strategy: "[Strategy name] — 70% improvement rate"

2. Add intervention type comparison table:
   - Group interventions by strategy/type
   - For each: count, avg dosage compliance, improvement rate
   - Sort by improvement rate descending
   - This answers: "Which strategies should we invest more in?"

3. Add "Evidence of Response" to each intervention card in the list:
   - Current dosage compliance badge (green/amber/red)
   - Student risk trajectory since intervention start (↑ improving, → stable, ↓ worsening)

4. Accessible to: school_admin, principal, counselor, data_manager

**Verification:**
- Build succeeds, tests pass
- Summary card shows correct aggregate metrics
- Strategy comparison table renders with real data
- Individual intervention cards show dosage badge

---

### Sprint 5E — Authorizer Page Enhancement

**Scope:** Add the MTSS evidence section to the existing authorizer page and enhance the AI narrative generator.

**Why fifth:** Builds on all previous sprints. The authorizer page is the capstone — it pulls everything together.

**Current state:** 36KB page. Already has KPIs, radar chart, compliance checklist, renewal probability, subgroup equity analysis, and AI narrative generator. This is already strong.

**Requirements:**

1. Add "Evidence of Systematic MTSS Process" section between the KPI cards and the radar chart:
   - Use MTSS Evidence Metrics component (summary variant)
   - Four cards in a row: Students Identified | Response Rate | Dosage Compliance | Improvement Rate
   - Below the cards: a single sentence auto-generated summary:
     "This year, [school] identified [N] students requiring additional support. [X%] received targeted intervention within [Y] days on average, with [Z%] showing measurable improvement."

2. Add "Intervention Outcomes" section after the MTSS evidence section:
   - Horizontal bar chart: students improved vs maintained vs worsened
   - Strategy effectiveness ranking (top 3 strategies by improvement rate)

3. Add "Risk Trend" section:
   - Area chart showing risk distribution over time (weekly)
   - Shows the proportion of on_track/watch/at_risk/critical over the school year
   - This is the "are things getting better?" visual

4. Enhance the AI Charter Narrative Generator:
   - Include MTSS summary data in the prompt context sent to Gemini
   - The generated narrative should reference: students identified, response rate, dosage compliance, improvement rate
   - Example output: "The school's MTSS early warning system identified 47 students requiring Tier 2/3 support. 81% received intervention within 5 business days, demonstrating systematic responsiveness. Intervention dosage compliance averaged 84%, with 58% of flagged students improving to a lower risk tier."

5. "Export Evidence Pack" button enhancement:
   - Include MTSS metrics in the export
   - Include intervention outcomes summary
   - Include risk distribution trend data

6. Access control: school_admin, principal, authorizer roles only

**Verification:**
- Build succeeds, tests pass
- MTSS evidence section renders with correct data
- AI narrative includes MTSS metrics in generated text
- Export includes MTSS data
- Authorizer role can view (read-only), cannot edit

---

### Sprint 5F — Student 360 Timeline (Optional, Post-Demo)

**Scope:** Add the chronological timeline to the Student 360 view.

**Why last:** This is the most complex change (41KB page) and is individually powerful but not required for the school-wide demo story. It matters most for individual student conversations and parent conferences.

**Requirements:**

1. Add a "Student Journey Timeline" component showing chronological events:
   - Enrollment date
   - Each risk level change (with date, old level → new level, top driver)
   - Each intervention created (with date, strategy name, assigned staff)
   - Dosage milestones (e.g., "reached 80% compliance" or "3 consecutive missed sessions")
   - Risk improvements (e.g., "moved from at_risk to watch")

2. Visual: vertical timeline with icons per event type:
   - Blue dot: enrollment
   - Amber triangle: risk flag
   - Green check: intervention created
   - Red exclamation: risk escalation
   - Green arrow: risk improvement

3. Show the timeline below the existing student info and above the detailed metrics

4. Intervention effectiveness section per student:
   - For each intervention: dosage %, sessions attended/scheduled, risk change since start

**Verification:**
- Build succeeds, tests pass
- Timeline renders in correct chronological order
- Handles students with no events gracefully
- Handles students with many events (>20) without performance issues

---

## Sprint Sequence & Dependencies

```
5A (Shared Metrics API + Component)
 ├──→ 5B (Pulse Dashboard)
 ├──→ 5C (Early Warning Tiers)
 ├──→ 5D (Interventions Effectiveness)
 └──→ 5E (Authorizer Enhancement)
              └──→ 5F (Student 360 Timeline) [optional]
```

5A is the foundation — everything else depends on it.
5B, 5C, 5D can run in parallel after 5A (but sequential is safer for one developer).
5E depends on 5A but benefits from 5D being done first (intervention outcomes data).
5F is independent and optional for first demo.

## Recommended Execution Order

| Sprint | Est. Effort | Demo Impact |
|--------|-------------|-------------|
| 5A | Medium | None (infrastructure) |
| 5B | Low-Medium | High (first impression) |
| 5C | Medium | Highest (the money slide) |
| 5E | Medium-High | Highest (authorizer proof) |
| 5D | Medium | Medium (supporting evidence) |
| 5F | High | Medium (individual stories) |

**For first demo, ship: 5A → 5B → 5C → 5E.** That gives you the Pulse → Early Warning → Authorizer flow — the complete accountability story in three clicks.

5D and 5F can follow after the first demo based on feedback.

---

## Design Principles (Reference for All Sprints)

1. **Lead with the answer, not the data.** "78% response rate (target: 90%)" not just "78%"
2. **Color is semantic.** Green = on track / improving / >80%. Amber = watch / needs attention / 60-80%. Red = at risk / critical / <60%. Consistent across every page.
3. **Every problem has an action button.** "7 unaddressed students" → [View in Early Warning]
4. **Exportable by default.** Every section gets a small export icon where it makes sense.
5. **Don't remove what works.** Add MTSS evidence sections above or alongside existing content. Existing charts and data stay unless explicitly redundant.
6. **Loading skeletons match layout.** Every new section has a skeleton that matches its shape.
