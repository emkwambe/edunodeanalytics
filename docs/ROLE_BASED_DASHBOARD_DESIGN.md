# EduNode Analytics — Role-Based Dashboard Design
## MTSS Early Warning Platform

**Purpose:** Define distinct dashboard experiences per role so each user sees exactly what they need to act on — no noise, no missing context.

---

## The Core Insight

MTSS breaks down when everyone sees the same dashboard. A teacher drowning in 150 students doesn't need the same view as a principal tracking school-wide trends. A counselor managing tier 2/3 caseloads needs a different workflow than a district superintendent comparing schools.

**The rule:** Each dashboard answers the question that role asks every morning.

---

## Role Classification

| Role | Morning Question | Decision Authority | Data Scope |
|------|-----------------|-------------------|------------|
| Teacher | "Which of MY students need attention today?" | Flag concerns, add notes, request support | Own students/classes only |
| MTSS Coordinator | "Who needs to be discussed at the next meeting?" | Assign tiers, create interventions, schedule reviews | School-wide |
| Counselor | "Which interventions need follow-up?" | Manage caseload, update progress, connect services | Assigned students + referrals |
| School Admin / Principal | "Is our support system working?" | Approve resources, review effectiveness, set priorities | School-wide + trends |
| Authorizer / Network Lead | "Which schools need attention?" | Compare schools, allocate resources, set expectations | Multi-school aggregate |
| District Superintendent | "Are we moving the needle?" | Policy decisions, budget allocation, accountability | District-wide |

---

## 1. Teacher Dashboard

### The Question
"Which of my students need attention today, and what should I do about it?"

### Layout

```
+----------------------------------------------------------+
| Good morning, Ms. Rodriguez           [Period 3 ▾] [Today]|
+----------------------------------------------------------+
|                                                          |
|  MY CLASS AT A GLANCE                                    |
|  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   |
|  │ 22       │ │ 3        │ │ 1        │ │ 2        │   |
|  │ On Track │ │ Watch    │ │ At Risk  │ │ Critical │   |
|  └──────────┘ └──────────┘ └──────────┘ └──────────┘   |
|                                                          |
|  NEEDS YOUR ATTENTION (sorted by urgency)                |
|  ┌──────────────────────────────────────────────────┐   |
|  │ ! Maria L.  │ Critical │ Attendance 72% ↓       │   |
|  │             │          │ Absent 3 days straight  │   |
|  │             │ [View] [Flag for MTSS] [Add Note]  │   |
|  ├──────────────────────────────────────────────────┤   |
|  │ △ James C.  │ At Risk  │ Math 28th pctl ↓       │   |
|  │             │          │ Missing 4 assignments   │   |
|  │             │ [View] [Flag for MTSS] [Add Note]  │   |
|  ├──────────────────────────────────────────────────┤   |
|  │ ~ Aisha P.  │ Watch    │ Engagement declining    │   |
|  │             │          │ Was On Track 2 weeks ago│   |
|  │             │ [View] [Flag for MTSS] [Add Note]  │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  ACTIVE INTERVENTIONS (my students)                      |
|  ┌──────────────────────────────────────────────────┐   |
|  │ Maria L. │ Attendance Mentor │ Week 3/6 │ ●●●○○○│   |
|  │ David K. │ Math Tutoring     │ Week 5/8 │ ●●●●●○│   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  RECENT ALERTS                       [Mark All Read]     |
|  • Maria Lopez absent again today (3rd consecutive)      |
|  • James Chen math score dropped below 30th percentile   |
+----------------------------------------------------------+
```

### Key Features
- **Class selector** — dropdown to switch between periods/sections
- **Only their students** — no school-wide data, no overwhelm
- **Action-oriented cards** — every student card has "Flag for MTSS", "Add Note", "View 360"
- **Simple risk indicators** — color-coded, plain language ("Attendance 72% ↓")
- **No configuration** — teachers don't set thresholds or weights
- **Intervention progress** — visual progress bars for active interventions they're involved in

### Data Sources
- `students` filtered by `homeroom_teacher` or `school_memberships` class assignments
- `current_risk_scores` view
- `risk_alerts` where `student_id` in their class
- `interventions` where `assigned_to_user_id` = teacher or student is in their class

---

## 2. MTSS Coordinator Dashboard

### The Question
"Who needs to be triered, reviewed, or escalated before our next meeting?"

### Layout

```
+----------------------------------------------------------+
| MTSS Command Center              [Next Meeting: Tue 2pm] |
+----------------------------------------------------------+
|                                                          |
|  SCHOOL RISK SNAPSHOT                                    |
|  ┌─────────────────────────────┐  ┌───────────────────┐ |
|  │ [====    DONUT CHART   ====]│  │ This Week:        │ |
|  │                             │  │ +3 new at-risk    │ |
|  │  On Track: 420 (75%)       │  │ -1 improved       │ |
|  │  Watch:     85 (15%)       │  │ 2 level changes   │ |
|  │  At Risk:   40 (7%)        │  │ 5 alerts pending  │ |
|  │  Critical:  12 (2%)        │  │                   │ |
|  └─────────────────────────────┘  └───────────────────┘ |
|                                                          |
|  TIER PIPELINE                                           |
|  ┌──────────┐  ┌──────────┐  ┌──────────┐              |
|  │ Flagged  │→ │ Under    │→ │ Tier     │              |
|  │ (8)      │  │ Review(5)│  │ Assigned │              |
|  └──────────┘  └──────────┘  │ T2: 32   │              |
|                               │ T3: 7    │              |
|                               └──────────┘              |
|                                                          |
|  NEEDS ACTION                                            |
|  ┌──────────────────────────────────────────────────┐   |
|  │ LEVEL CHANGES (review required)                   │   |
|  │ Maria L.  On Track → Critical  (attendance crash) │   |
|  │ James C.  Watch → At Risk      (math decline)     │   |
|  │ [Schedule Review] [Assign Tier] [Create Interv.]  │   |
|  ├──────────────────────────────────────────────────┤   |
|  │ STALE INTERVENTIONS (no update in 14+ days)       │   |
|  │ David K.  Math Tutoring  │ Last note: 18 days ago │   |
|  │ [Nudge Owner] [Review] [Close]                    │   |
|  ├──────────────────────────────────────────────────┤   |
|  │ UNASSIGNED HIGH RISK (no intervention)            │   |
|  │ Sarah M.  Risk: 0.74  │ At Risk │ No intervention │   |
|  │ [Create Intervention] [Assign to Team]            │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  RISK DRIVERS (school-wide)                              |
|  Attendance decline:  32 students (top driver)           |
|  Missing assignments: 26 students                        |
|  Academic performance: 18 students                       |
|  Behavior incidents:  11 students                        |
|                                                          |
|  MEETING PREP                    [Generate MTSS Report]  |
|  Students to discuss: 8                                  |
|  Interventions to review: 5                              |
|  [Export Agenda] [Print Summaries]                       |
+----------------------------------------------------------+
```

### Key Features
- **Tier pipeline** — visual workflow: Flagged → Under Review → Tier Assigned
- **Level change alerts** — students who crossed thresholds since last check
- **Unassigned high risk** — critical gap: at-risk students with no intervention
- **Stale interventions** — interventions with no progress notes in 14+ days
- **Meeting prep tools** — generate agenda, export summaries, print student cards
- **Risk driver analysis** — what's causing risk school-wide (systemic view)
- **School-wide scope** — sees all students, all tiers, all interventions

### Data Sources
- `current_risk_scores` where `school_id` = their school
- `risk_evaluations` where `level_changed = true` (recent)
- `risk_alerts` grouped by type
- `interventions` where `is_stale = true` or no intervention for at-risk students
- `student_metrics` aggregated for driver analysis

---

## 3. Counselor Dashboard

### The Question
"Which students on my caseload need follow-up, and are our interventions working?"

### Layout

```
+----------------------------------------------------------+
| My Caseload                    [Active: 24] [Pending: 3] |
+----------------------------------------------------------+
|                                                          |
|  CASELOAD OVERVIEW                                       |
|  ┌──────────┐ ┌──────────┐ ┌──────────┐                |
|  │ Tier 2   │ │ Tier 3   │ │ Improving│                |
|  │ 17       │ │ 7        │ │ 9        │                |
|  └──────────┘ └──────────┘ └──────────┘                |
|                                                          |
|  PRIORITY FOLLOW-UPS                                     |
|  ┌──────────────────────────────────────────────────┐   |
|  │ Maria L. │ Critical │ Intervention stale (18d)   │   |
|  │          │ Tier 3   │ Risk: 0.82 ↑ (was 0.71)   │   |
|  │          │ [Update Progress] [Schedule Meeting]   │   |
|  ├──────────────────────────────────────────────────┤   |
|  │ David K. │ At Risk  │ Goal review due tomorrow   │   |
|  │          │ Tier 2   │ Risk: 0.58 ↓ (improving)   │   |
|  │          │ [Update Progress] [Adjust Goals]       │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  INTERVENTION EFFECTIVENESS                              |
|  ┌──────────────────────────────────────────────────┐   |
|  │ Intervention    │ Students │ Avg Risk Change      │   |
|  │ Math Tutoring   │ 8       │ -0.12 (improving)    │   |
|  │ Attend. Mentor  │ 5       │ -0.08 (slight)       │   |
|  │ Behavior Plan   │ 3       │ +0.04 (not working)  │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  UPCOMING                                                |
|  • MTSS Review: Maria L. — Tuesday 2pm                  |
|  • Goal check: David K. — Wednesday                     |
|  • Parent meeting: Aisha P. — Thursday 3:30pm           |
+----------------------------------------------------------+
```

### Key Features
- **Caseload-centric** — only students assigned to this counselor
- **Priority queue** — sorted by urgency (stale interventions, goal reviews due, risk increases)
- **Effectiveness tracking** — are interventions actually reducing risk scores?
- **Progress update workflow** — one-click to add progress notes
- **Calendar integration** — upcoming meetings, review dates, deadlines
- **Risk trajectory** — is each student improving, stable, or declining?

### Data Sources
- `interventions` where `assigned_to_user_id` = counselor
- `current_risk_scores` for assigned students
- `risk_evaluations` history for trajectory
- `student_metrics` for detailed indicators

---

## 4. School Admin / Principal Dashboard

### The Question
"Is our support system working, and where should I allocate resources?"

### Layout

```
+----------------------------------------------------------+
| Charlotte Lab School               [2025-26] [This Month]|
+----------------------------------------------------------+
|                                                          |
|  SCHOOL HEALTH SCORE                                     |
|  ┌─────────────────────────────────────────────────────┐|
|  │     [====== 78% ======]  Good (up from 74%)        │|
|  │  Composite of: risk distribution, intervention      │|
|  │  success rate, data completeness, alert response    │|
|  └─────────────────────────────────────────────────────┘|
|                                                          |
|  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ |
|  │ Risk Trend    │  │ Intervention  │  │ Response    │ |
|  │ [LINE CHART]  │  │ Success: 67%  │  │ Time: 1.2d  │ |
|  │ 12-week view  │  │ (target: 75%) │  │ (target: 1d)│ |
|  └───────────────┘  └───────────────┘  └─────────────┘ |
|                                                          |
|  GRADE-LEVEL COMPARISON                                  |
|  ┌──────────────────────────────────────────────────┐   |
|  │ Grade │ Students│ At Risk % │ Trend  │ Top Driver│   |
|  │   6   │  178    │  8.4%     │  ↓     │ Attendance│   |
|  │   7   │  185    │  12.1%    │  ↑↑    │ Math      │   |
|  │   8   │  172    │  6.9%     │  →     │ Behavior  │   |
|  └──────────────────────────────────────────────────┘   |
|  ⚠ Grade 7 at-risk rate is 2.3x school average          |
|                                                          |
|  RESOURCE ALLOCATION                                     |
|  ┌──────────────────────────────────────────────────┐   |
|  │ Tier 2 students: 40  │ Counselor caseload avg: 13│   |
|  │ Tier 3 students: 12  │ Interventions active: 47   │   |
|  │ Unassigned:      5   │ Stale interventions: 3     │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  COMPLIANCE STATUS                                       |
|  FERPA audits: current │ Data retention: compliant       |
|  Consent records: 98%  │ PII incidents: 0 this month     |
|                                                          |
|  [Download School Report] [Configure Risk Model]         |
+----------------------------------------------------------+
```

### Key Features
- **School Health Score** — single composite metric (risk + interventions + data quality + response time)
- **Grade-level comparison** — which grades are struggling and why
- **Systemic pattern detection** — "Grade 7 has 2.3x the at-risk rate" (auto-flagged)
- **Resource allocation view** — caseloads, unassigned students, stale interventions
- **Trend over time** — 12-week risk distribution trend line
- **Compliance dashboard** — FERPA status, audit currency, PII incidents
- **Config access** — can adjust risk model weights and thresholds
- **Export** — school-level reports for board meetings, authorizer reporting

### Data Sources
- `current_risk_scores` aggregated by grade
- `risk_evaluations` for trend data
- `interventions` for success rates and caseloads
- `risk_alerts` for response time metrics
- `audit_logs` for compliance
- `risk_model_configs` for admin settings

---

## 5. Authorizer / Network Lead Dashboard

### The Question
"Which of our schools need support, and are they implementing MTSS effectively?"

### Layout

```
+----------------------------------------------------------+
| Network Overview              [3 Schools] [2025-26 YTD]  |
+----------------------------------------------------------+
|                                                          |
|  NETWORK HEALTH                                          |
|  ┌──────────────────────────────────────────────────┐   |
|  │ School           │ Health │ At Risk│ Trend │ Flag│   |
|  │ Charlotte Lab    │  78%   │  9.2%  │  →    │     │   |
|  │ Union Day        │  71%   │ 14.1%  │  ↑    │ ⚠   │   |
|  │ Innovation Acad  │  82%   │  6.8%  │  ↓    │     │   |
|  └──────────────────────────────────────────────────┘   |
|  ⚠ Union Day: at-risk rate increased 3.2% this month    |
|                                                          |
|  CROSS-SCHOOL COMPARISON                                 |
|  ┌──────────────────────────────────────────────────┐   |
|  │ [MULTI-LINE CHART: Risk % over time per school]  │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  MTSS IMPLEMENTATION METRICS                             |
|  ┌──────────────────────────────────────────────────┐   |
|  │ Metric              │ CLS   │ UDS   │ IA        │   |
|  │ Avg alert response  │ 1.2d  │ 2.8d  │ 0.9d     │   |
|  │ Intervention rate   │ 87%   │ 71%   │ 92%      │   |
|  │ Intervention success│ 67%   │ 54%   │ 72%      │   |
|  │ Data completeness   │ 89%   │ 76%   │ 91%      │   |
|  │ Stale interventions │  3    │  8    │  1       │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  ACCOUNTABILITY                                          |
|  • Union Day: 8 stale interventions (above threshold)    |
|  • Union Day: data completeness below 80% target         |
|  • Charlotte Lab: 5 unassigned at-risk students          |
|                                                          |
|  [Generate Network Report] [Schedule Review]             |
+----------------------------------------------------------+
```

### Key Features
- **School comparison table** — health score, at-risk rate, trend, flags
- **MTSS implementation metrics** — are schools actually using the system?
  - Alert response time (are they acknowledging alerts?)
  - Intervention assignment rate (are at-risk students getting interventions?)
  - Intervention success rate (are interventions working?)
  - Data completeness (are they connecting data sources?)
- **Accountability flags** — auto-flagged when schools miss targets
- **Cross-school trend chart** — visual comparison over time
- **No individual student data** — aggregate only (FERPA appropriate)
- **Network-level reports** — for board presentations

### Data Sources
- `current_risk_scores` aggregated per school
- `risk_alerts` response time per school
- `interventions` rates and outcomes per school
- `student_metrics` completeness per school
- `schools` for metadata

---

## 6. District Superintendent Dashboard

### The Question
"Are we moving the needle across the district, and where should we invest?"

### Layout

```
+----------------------------------------------------------+
| District Dashboard               [52 Schools] [2025-26]  |
+----------------------------------------------------------+
|                                                          |
|  DISTRICT RISK OVERVIEW                                  |
|  ┌─────────────────────────────────────────────────────┐|
|  │  Total Students: 28,400                              │|
|  │  On Track: 21,300 (75%) │ Watch: 4,260 (15%)        │|
|  │  At Risk:  2,272 (8%)   │ Critical: 568 (2%)        │|
|  │  [========= STACKED BAR OVER TIME =========]        │|
|  └─────────────────────────────────────────────────────┘|
|                                                          |
|  TOP CONCERNS                                            |
|  ┌──────────────────────────────────────────────────┐   |
|  │ 1. 6th grade math proficiency declining district- │   |
|  │    wide (affects 12 schools, 340 students)        │   |
|  │ 2. Chronic absence up 2.1% vs last year           │   |
|  │ 3. 4 schools below 70% intervention assignment    │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  SCHOOL HEATMAP                                          |
|  ┌──────────────────────────────────────────────────┐   |
|  │ [HEATMAP: Schools x Metrics]                      │   |
|  │ Rows: Schools (sorted by health score)            │   |
|  │ Cols: Risk% | Response | Success | Data Quality   │   |
|  │ Color: Green (good) → Yellow → Red (needs help)   │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  INVESTMENT IMPACT                                       |
|  ┌──────────────────────────────────────────────────┐   |
|  │ Program          │ Schools │ Avg Risk Δ │ Cost/  │   |
|  │                  │         │            │ Student│   |
|  │ Math Tutoring    │ 28      │ -0.14      │ $420   │   |
|  │ Attend. Coaches  │ 15      │ -0.09      │ $280   │   |
|  │ SEL Curriculum   │ 22      │ -0.06      │ $180   │   |
|  │ Behavior Mentors │ 12      │ -0.11      │ $350   │   |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  [Board Report] [Budget Impact Analysis] [Compare YoY]   |
+----------------------------------------------------------+
```

### Key Features
- **District-wide aggregates only** — no individual student data
- **Systemic pattern detection** — "6th grade math declining across 12 schools"
- **School heatmap** — at-a-glance health of every school on key metrics
- **Investment impact analysis** — which interventions are most cost-effective?
- **Year-over-year comparison** — are we improving?
- **Board-ready reports** — one-click export for governance presentations
- **Budget allocation data** — cost per student per intervention type

### Data Sources
- All tables aggregated at district level
- No PII exposed at this level

---

## Implementation Priority

### Phase 1 (MVP — Sprint 4-5)
Build the **MTSS Coordinator Dashboard** first. This is the primary buyer persona for charter schools. It's also the most complex and proves the full MTSS workflow.

### Phase 2 (Pilot Polish)
Add the **Teacher Dashboard**. Teachers are the daily users — if they don't use it, the data doesn't flow. Keep it dead simple.

### Phase 3 (Network Expansion)
Build the **School Admin Dashboard** and **Authorizer Dashboard** when the first charter network signs up.

### Phase 4 (District Scale)
Build the **District Superintendent Dashboard** when pursuing district contracts. This is the upsell view.

The **Counselor Dashboard** can be derived from the MTSS Coordinator view with caseload filtering — it doesn't need a separate build, just a role-filtered version of the same components.

---

## RBAC Mapping

| Role | `school_memberships.role` | Dashboard Route | Data Scope |
|------|--------------------------|-----------------|------------|
| Teacher | `teacher` | `/[slug]/dashboard` | Own students |
| MTSS Coordinator | `mtss_coordinator` | `/[slug]/dashboard/early-warning` | School-wide |
| Counselor | `counselor` | `/[slug]/dashboard/caseload` | Assigned students |
| School Admin | `admin` | `/[slug]/dashboard/admin` | School-wide + config |
| Authorizer | (via `authorizers` table) | `/[slug]/authorizer` | Multi-school |
| Network/District | `district_admin` | `/network` | All schools |

### Route Structure

```
/[school_slug]/dashboard/                    → Teacher (default)
/[school_slug]/dashboard/early-warning       → MTSS Coordinator
/[school_slug]/dashboard/caseload            → Counselor
/[school_slug]/dashboard/school-health       → Principal/Admin
/[school_slug]/authorizer                    → Authorizer (exists)
/[school_slug]/network                       → Network Lead (exists)
```

The existing `page-feature-gate.tsx` component (8.8 KB) and `locked-feature.tsx` already handle role-based page access. Dashboard components render conditionally based on the user's role from `school_memberships`.

---

## Shared Components (Build Once, Use Across Roles)

| Component | Used By | Description |
|-----------|---------|-------------|
| `RiskDistributionChart` | All except Teacher | Donut/bar chart of risk levels |
| `StudentRiskCard` | Teacher, Coordinator, Counselor | Student card with risk score, factors, actions |
| `AlertFeed` | Coordinator, Admin | Real-time alert list |
| `InterventionPipeline` | Coordinator, Counselor | Visual pipeline: planned → active → completed |
| `RiskDriverBreakdown` | Coordinator, Admin | What's causing risk school-wide |
| `TrendLineChart` | Admin, Authorizer, District | Risk % over time |
| `SchoolComparisonTable` | Authorizer, District | Multi-school metrics |
| `EffectivenessTable` | Counselor, Admin | Intervention success rates |
| `MeetingPrepExport` | Coordinator | Generate MTSS meeting agenda |
| `DataCompletenessWidget` | Admin, Authorizer | What data is missing |
