/**
 * Implementation Guides
 * =====================
 *
 * Practical guides for deploying EduNode and driving adoption.
 */

import { LearningModule } from '../types';

export const IMPLEMENTATION_MODULES: LearningModule[] = [
  // ===========================================
  // MODULE 1: EduNode Quick Start
  // ===========================================
  {
    id: 'im-001',
    slug: 'edunode-quick-start',
    title: 'EduNode Quick Start Guide',
    description: 'Get your school connected and your first dashboard running in under an hour.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'beginner',
    estimatedMinutes: 45,
    outcomes: [
      'Connect your first data source',
      'Understand the data sync process',
      'Navigate the core dashboards',
      'Set up initial user accounts',
    ],
    sections: [
      {
        id: 'im-001-01',
        title: 'Before You Begin',
        format: 'checklist',
        content: `
# Pre-Implementation Checklist

Before connecting EduNode, gather the following:

## Required Access

- [ ] **Student Information System admin credentials** (Clever, PowerSchool, or other SIS)
- [ ] **Assessment platform login** (NWEA, iReady, Renaissance, etc.)
- [ ] **List of initial users** (emails and roles for first admin accounts)

## Information Needed

- [ ] **School ID/identifier** used in your SIS
- [ ] **Current school year dates** (start date, end date, grading periods)
- [ ] **Grade levels served** (K-5, 6-8, 9-12, etc.)
- [ ] **Estimated student count** (for licensing verification)

## Stakeholder Alignment

- [ ] **Executive sponsor identified** (principal or head of school)
- [ ] **Technical point of contact** (for integration troubleshooting)
- [ ] **Initial user group** (who will access first?)

## Timeline Expectations

| Phase | Duration | Activities |
|-------|----------|------------|
| Integration setup | 1-2 days | Connect data sources, run initial sync |
| Data validation | 2-3 days | Verify student records, check completeness |
| User onboarding | 1 week | Train initial user group |
| Pilot period | 2-4 weeks | Use with subset before full rollout |

---

## Common Blockers

**"Our SIS doesn't support API access"**
→ Most modern SIS platforms support Clever or direct API. Contact support for verification.

**"We can't share student data externally"**
→ EduNode is FERPA-compliant. Review our Data Processing Agreement with your legal team.

**"Our data is messy"**
→ That's normal. EduNode helps identify and surface data quality issues.
        `,
        keyTakeaways: [
          'Gather credentials and access before starting',
          'Identify stakeholders and point people upfront',
          'Expect 2-4 weeks from start to pilot',
        ],
      },
      {
        id: 'im-001-02',
        title: 'Connecting Data Sources',
        format: 'article',
        content: `
# Step-by-Step: Connecting Your First Data Source

## Option A: Clever (Recommended)

If your school uses Clever for rostering, this is the easiest path.

1. **Navigate to Settings → Integrations**
2. **Click "Connect" next to Clever**
3. **You'll be redirected to Clever's authorization page**
4. **Log in with your Clever admin credentials**
5. **Approve data sharing for:**
   - Students
   - Teachers
   - Sections
   - Schools
6. **Click "Authorize"**
7. **Return to EduNode—sync will begin automatically**

Initial sync typically takes 5-15 minutes depending on school size.

## Option B: PowerSchool Direct

If you use PowerSchool without Clever:

1. **Navigate to Settings → Integrations**
2. **Click "Connect" next to PowerSchool**
3. **Enter your PowerSchool details:**
   - Server URL (e.g., https://yourdistrict.powerschool.com)
   - Client ID (from PowerSchool plugin configuration)
   - Client Secret
4. **Click "Test Connection"**
5. **If successful, click "Connect"**
6. **Select which data tables to sync**
7. **Click "Start Sync"**

## Option C: Assessment Platforms

After connecting your SIS, add assessment data:

1. **Navigate to Settings → Integrations**
2. **Find your assessment platform** (NWEA, iReady, Renaissance)
3. **Click "Connect"**
4. **Enter credentials:**
   - For NWEA: Partner ID and API Key
   - For iReady: District ID and API Token
   - For Renaissance: Account ID and Secret Key
5. **Select grade levels and assessments to sync**
6. **Click "Start Sync"**

Assessment syncs match students via name and ID. Review the match report for any unmatched records.

---

## Sync Status

After connecting, you can monitor sync status:

- **Green checkmark:** Sync complete, data current
- **Yellow spinner:** Sync in progress
- **Red alert:** Sync error—click for details

Syncs run daily by default. You can trigger manual sync anytime.
        `,
        keyTakeaways: [
          'Clever is the easiest connection path if available',
          'Assessment platforms connect after SIS for student matching',
          'Monitor sync status on the Integrations page',
        ],
      },
      {
        id: 'im-001-03',
        title: 'First Dashboard Walkthrough',
        format: 'article',
        content: `
# Navigating Your Dashboard

Once data syncs, your dashboard populates. Here's what you'll see:

## Overview Panel

The main dashboard shows school-wide health at a glance:

- **Enrollment:** Current student count, trend arrows
- **Attendance:** Current rate, chronic absenteeism count
- **At-Risk Summary:** Students flagged by Risk Index
- **Momentum Distribution:** How students are trending

## Student Roster

Access via Dashboard → Students

- **Search:** Find students by name
- **Filters:** Grade level, teacher, risk level, MTSS tier
- **Sort:** By any column (name, risk, momentum, cohort sync)
- **Click any student** for detailed profile

## Key Metrics

Each metric card is interactive:

- **Hover** for definitions
- **Click** to drill into detail view
- **Arrow icons** show trend direction

## Role-Based Views

What you see depends on your role:

| Role | Default View |
|------|--------------|
| Teacher | My students only |
| School Leader | Full school |
| CMO Executive | Network overview (Enterprise) |

You can adjust filters to expand or narrow your view.

---

## First Actions to Take

1. **Verify student count** matches your expectations
2. **Spot-check 5 random students** for data accuracy
3. **Note any missing data fields** (we'll address in data quality review)
4. **Bookmark the dashboard** for daily access
        `,
        keyTakeaways: [
          'Dashboard shows school health at a glance',
          'Click metrics and students to drill into details',
          'Verify data accuracy with spot checks before relying on insights',
        ],
        practiceActivity: {
          title: 'Dashboard Exploration',
          instructions: 'Spend 15 minutes exploring your dashboard. Find: (1) Your highest-risk students, (2) Students with the best momentum, (3) Any data gaps or anomalies.',
          estimatedMinutes: 15,
          deliverable: 'List of initial observations and any data quality concerns',
        },
      },
    ],
  },

  // ===========================================
  // MODULE 2: Rollout Planning
  // ===========================================
  {
    id: 'im-002',
    slug: 'rollout-planning',
    title: 'Rollout Planning Guide',
    description: 'How to plan a phased rollout that builds momentum without overwhelming your team.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    outcomes: [
      'Design a phased rollout timeline',
      'Identify pilot groups and success criteria',
      'Plan training and support structures',
      'Anticipate and mitigate rollout risks',
    ],
    sections: [
      {
        id: 'im-002-01',
        title: 'The Three-Phase Rollout',
        format: 'article',
        content: `
# Phased Rollout Strategy

Avoid the "big bang" rollout where everyone gets access on day one. Instead, use a phased approach that builds capability and confidence incrementally.

## Phase 1: Foundation (Weeks 1-4)

**Goal:** Establish technical foundation and train core team

**Activities:**
- Complete all data source integrations
- Validate data accuracy
- Train 2-3 admin super-users
- Configure initial settings and customizations
- Run first data quality audit

**Success criteria:**
- All data sources connected and syncing
- >95% student record match rate
- Super-users can navigate independently
- Initial data issues documented

**Who's involved:** IT, school leadership, implementation team

## Phase 2: Pilot (Weeks 5-10)

**Goal:** Test with real users, gather feedback, refine

**Activities:**
- Onboard pilot user group (15-25% of eventual users)
- Run weekly data meetings with pilot group
- Collect structured feedback
- Iterate on training based on struggles
- Document common questions and answers

**Success criteria:**
- Pilot users logging in weekly
- At least one action taken based on data
- Feedback indicates "useful" rating
- Training materials refined

**Who's involved:** Pilot teachers/leaders, school leadership, implementation team

## Phase 3: Scale (Weeks 11-16)

**Goal:** Expand to full staff with proven practices

**Activities:**
- Roll out to all intended users
- Peer mentoring (pilot users support new users)
- Integrate into existing meeting structures
- Establish ongoing support channels
- Sunset any replaced reports/tools

**Success criteria:**
- >80% of users logging in monthly
- Data referenced in key meetings
- Support requests declining over time
- Positive pulse survey results

**Who's involved:** All staff, with leadership reinforcement

---

## Timeline Flexibility

Phases can compress or extend based on:
- School size and complexity
- Existing data culture maturity
- Competing priorities and calendar (avoid launching phase 2 during state testing)
        `,
        keyTakeaways: [
          'Three phases: Foundation (setup), Pilot (test), Scale (expand)',
          'Each phase has clear success criteria before moving forward',
          'Avoid launching during high-stress periods (testing, start of year)',
        ],
      },
      {
        id: 'im-002-02',
        title: 'Selecting Pilot Groups',
        format: 'article',
        content: `
# Choosing Your Pilot Users

Pilot selection determines early success. Choose wisely.

## Ideal Pilot Characteristics

**Include:**
- Early adopters (open to new tools)
- Respected voices (whose opinion matters to peers)
- Diverse roles (teachers, coaches, AP)
- Diverse contexts (different grade levels, subjects)
- At least one skeptic who's open to being persuaded

**Avoid:**
- Only enthusiasts (won't surface real problems)
- Only leaders (doesn't test teacher experience)
- One grade level/subject only (limits generalizability)
- People already overloaded (won't engage fully)

## Pilot Size

| School Size | Recommended Pilot |
|-------------|-------------------|
| <200 students | 3-5 people |
| 200-500 students | 5-10 people |
| 500-1000 students | 10-15 people |
| >1000 students | 15-25 people |

For CMO networks, consider piloting with 1-2 schools before network-wide rollout.

## Setting Pilot Expectations

Be explicit with pilot participants about:

**Time commitment:**
- Training session (2-3 hours)
- Weekly usage expectation (30-60 min)
- Feedback sessions (30 min/week during pilot)

**Their role:**
- Test the tool honestly
- Surface problems (we want to know!)
- Provide structured feedback
- Eventually mentor others

**What they get:**
- Early access and influence
- Additional support during pilot
- Recognition as early adopters
- Input on how rollout is designed

---

## Pilot Feedback Structure

Weekly pilot meetings should cover:
1. **Wins:** What worked this week?
2. **Struggles:** What was confusing or difficult?
3. **Ideas:** What would make this better?
4. **Questions:** What do you still not understand?

Document everything. This shapes training for scale phase.
        `,
        keyTakeaways: [
          'Include early adopters, respected voices, and at least one open skeptic',
          'Size pilot at 10-15% of eventual users',
          'Set clear expectations and gather structured feedback weekly',
        ],
      },
      {
        id: 'im-002-03',
        title: 'Training Design',
        format: 'article',
        content: `
# Designing Effective Training

Traditional PD fails. Here's what works for technology adoption:

## Principles of Effective Training

**Just-in-time, not just-in-case**
- Train people right before they'll use the skill
- Don't frontload everything in a 4-hour session
- Short sessions close to application moments

**Practice, not presentation**
- Less talking, more doing
- Hands-on exploration with real data
- Mistakes are learning opportunities

**Contextualized, not generic**
- Use your school's actual data
- Reference familiar students and situations
- Connect to decisions they already make

**Ongoing, not one-shot**
- Initial training + follow-up sessions
- Office hours and drop-in support
- Peer mentoring and buddy systems

## Training Session Design

### Session 1: Orientation (90 min)

**Purpose:** Build awareness and foundational navigation

- Why we're using EduNode (connect to mission)
- Tour of main dashboard
- Finding and filtering students
- Understanding key metrics (definitions only)
- Practice: Find 3 specific students

### Session 2: Interpretation (60 min)

**Purpose:** Build data interpretation skills

- Deep dive on one metric (e.g., Risk Index)
- Practice interpreting real student profiles
- Common misinterpretations and how to avoid
- Practice: Write an action based on one insight

### Session 3: Action Planning (60 min)

**Purpose:** Connect data to decisions

- Using data in intervention planning
- The data conversation protocol
- Documenting actions and tracking impact
- Practice: Role-play a data conversation

### Ongoing Support

- Weekly office hours (30 min, optional)
- Slack/Teams channel for questions
- Peer mentors available by request
- Monthly refresher focusing on underused features

---

## Training Don'ts

- Don't train on everything at once
- Don't use hypothetical data when real data is available
- Don't skip practice time to cover more content
- Don't treat training as a one-time event
        `,
        keyTakeaways: [
          'Train just-in-time, not all at once upfront',
          'Prioritize practice over presentation',
          'Use your own school\'s data, not generic examples',
        ],
        practiceActivity: {
          title: 'Training Session Draft',
          instructions: 'Draft an agenda for your first training session (90 min). Include: objectives, activities, practice exercises, and materials needed.',
          estimatedMinutes: 30,
          deliverable: 'Training session agenda with timing',
        },
      },
    ],
  },

  // ===========================================
  // MODULE 3: Data Quality Management
  // ===========================================
  {
    id: 'im-003',
    slug: 'data-quality-management',
    title: 'Data Quality Management',
    description: 'How to identify, address, and prevent data quality issues that undermine trust in analytics.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    outcomes: [
      'Conduct a data quality audit',
      'Prioritize data issues by impact',
      'Establish data hygiene practices',
      'Build a data quality improvement plan',
    ],
    sections: [
      {
        id: 'im-003-01',
        title: 'Common Data Quality Issues',
        format: 'article',
        content: `
# The Five Data Quality Dimensions

## 1. Completeness
**Question:** Is all expected data present?

**Common issues:**
- Missing student records (not synced from SIS)
- Blank fields (no assessment score, no attendance record)
- Partial school years (historical data not loaded)

**Impact:** Missing data leads to undercounting, excluded students, incomplete pictures.

## 2. Accuracy
**Question:** Is the data correct?

**Common issues:**
- Typos in names or IDs
- Wrong grade level assignments
- Outdated enrollment status (students who left)
- Incorrect assessment score entry

**Impact:** Wrong data is worse than missing data—it leads to wrong decisions.

## 3. Consistency
**Question:** Is the same thing represented the same way?

**Common issues:**
- Name variations ("John Smith" vs "Smith, John" vs "Johnny Smith")
- ID mismatches across systems
- Different date formats
- Inconsistent grade level coding (5 vs "5th" vs "Grade 5")

**Impact:** Inconsistency causes matching failures and duplicate records.

## 4. Timeliness
**Question:** Is the data current?

**Common issues:**
- Syncs failing without notification
- Data entry delays (teachers entering grades late)
- Assessments not uploaded promptly

**Impact:** Stale data means interventions come too late.

## 5. Relevance
**Question:** Is this the right data for our questions?

**Common issues:**
- Tracking metrics that don't connect to action
- Missing key data points for decisions being made
- Data that was relevant last year but not this year

**Impact:** Irrelevant data wastes time and attention.

---

## The 80/20 Rule of Data Quality

You can't fix everything. Focus on:
- The 20% of issues causing 80% of the problems
- Issues affecting high-stakes decisions
- Root causes, not symptoms
        `,
        keyTakeaways: [
          'Five dimensions: completeness, accuracy, consistency, timeliness, relevance',
          'Focus on issues that affect high-stakes decisions first',
          'Root cause fixes prevent recurring problems',
        ],
      },
      {
        id: 'im-003-02',
        title: 'Data Quality Audit Process',
        format: 'checklist',
        content: `
# Conducting a Data Quality Audit

## Step 1: Scope the Audit

Define what you're auditing:
- [ ] Which data sources? (SIS, assessments, behavior?)
- [ ] Which time period? (Current year? Historical?)
- [ ] Which student population? (All? Specific grades?)

## Step 2: Check Completeness

- [ ] **Record count match:** Does student count match enrollment?
- [ ] **Field population:** What % of records have each key field populated?
- [ ] **Historical coverage:** How far back does data go?

**Key metrics to calculate:**
- Total students in EduNode vs. official enrollment
- % of students with attendance records
- % of students with assessment scores

## Step 3: Check Accuracy

- [ ] **Sample validation:** Pull 20 random students, verify against source systems
- [ ] **Outlier review:** Look at extreme values (999 days absent?)
- [ ] **Logic checks:** Grade 5 students with high school courses?

**Key questions:**
- Do 5 random students show correct current info?
- Are there any obviously impossible values?
- Do aggregates match known school-level statistics?

## Step 4: Check Consistency

- [ ] **Duplicate search:** Same student appearing multiple times?
- [ ] **ID matching:** Do student IDs match across sources?
- [ ] **Naming conventions:** Are names consistently formatted?

## Step 5: Check Timeliness

- [ ] **Sync status:** When was each source last synced?
- [ ] **Data currency:** What's the date of most recent records?
- [ ] **Entry lag:** How long between event and data entry?

## Step 6: Document and Prioritize

For each issue found:
- [ ] Describe the issue
- [ ] Estimate scope (how many records affected?)
- [ ] Assess impact (what decisions does this affect?)
- [ ] Identify root cause
- [ ] Assign owner and target date

---

## Audit Frequency

- **Comprehensive audit:** Annually (start of year ideal)
- **Spot checks:** Monthly
- **Sync monitoring:** Daily (automated alerts)
        `,
        keyTakeaways: [
          'Audit completeness, accuracy, consistency, and timeliness',
          'Sample validation catches accuracy issues quickly',
          'Document issues with scope, impact, and owners',
        ],
        practiceActivity: {
          title: 'Mini Audit Exercise',
          instructions: 'Conduct a quick completeness check: Compare your student count in EduNode to your official enrollment. Note any discrepancy and hypothesize causes.',
          estimatedMinutes: 15,
          deliverable: 'Enrollment count comparison with notes on discrepancies',
        },
      },
    ],
  },

  // ===========================================
  // MODULE 4: Sustaining Adoption
  // ===========================================
  {
    id: 'im-004',
    slug: 'sustaining-adoption',
    title: 'Sustaining Long-Term Adoption',
    description: 'How to maintain momentum and prevent regression after initial implementation.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'advanced',
    estimatedMinutes: 30,
    outcomes: [
      'Build data use into organizational routines',
      'Maintain engagement over time',
      'Handle staff turnover without losing capability',
      'Continuously improve data practices',
    ],
    sections: [
      {
        id: 'im-004-01',
        title: 'Embedding in Routines',
        format: 'article',
        content: `
# Making Data Use Automatic

Sustainable adoption happens when data use is embedded in existing routines, not added as an extra.

## The Routine Integration Framework

For each existing meeting or routine, identify:
1. Where data could inform the conversation
2. What specific data would be relevant
3. How to display/access data in that moment
4. Who is responsible for bringing data

### Example: Grade-Level Team Meetings

**Before:** Discuss student concerns based on teacher observations
**After:** Start with Risk Index overview, then discuss teacher observations for context

**Integration steps:**
- Add 10-min data review to standing agenda
- Grade-level lead pulls Risk Report before meeting
- Team discusses high-risk students first
- Actions documented in EduNode

### Example: Principal Walk-Throughs

**Before:** Observe instruction, provide feedback
**After:** Review class data before walk-through, reference student needs during debrief

**Integration steps:**
- Principal reviews classroom momentum before observing
- Note which students are at risk and look for engagement
- Reference data in post-observation conversation

### Example: Parent Conferences

**Before:** Share grades and anecdotes
**After:** Show growth trajectory, celebrate momentum, set data-informed goals

**Integration steps:**
- Teachers pull student profile before conference
- Share momentum and growth visuals with families
- Set goals with specific metrics to track

---

## The Replacement Principle

For every data routine added, remove something:
- New report replaces old report
- Data discussion replaces another agenda item
- Dashboard check replaces spreadsheet update

If you don't remove, you're adding burden.
        `,
        keyTakeaways: [
          'Embed data use in existing routines, don\'t add separate data events',
          'For each routine, define what data, who brings it, and how it\'s used',
          'Replace old practices with new ones; don\'t pile on',
        ],
      },
      {
        id: 'im-004-02',
        title: 'Handling Staff Turnover',
        format: 'article',
        content: `
# Knowledge Continuity Through Turnover

Staff turnover is inevitable. Don't let capability walk out the door.

## The Documentation Imperative

**Document:**
- How each data source is configured
- Where credentials are stored (securely)
- Common troubleshooting steps
- Training materials and recordings
- Historical decisions and their rationale

**Format:** A simple wiki or shared folder, updated continuously.

## Onboarding New Staff

### For New Teachers

**Week 1:**
- Intro to dashboard (15 min with mentor)
- Access provisioning
- "Start here" guide to finding their students

**Month 1:**
- Formal training session
- Paired with data mentor
- Expected to attend data team meeting

**Quarter 1:**
- Full independent use expected
- Check-in with coach on data use

### For New Leaders

**Week 1:**
- Deep dive on school metrics and history
- Introduction to data culture norms
- Access to all relevant dashboards

**Month 1:**
- Shadow data meetings
- Meet with implementation team
- Review historical data decisions

## The Mentor Network

Establish ongoing mentor relationships:
- Each new staff member assigned a data mentor
- Mentors are recognized and supported (not just extra work)
- Regular mentor check-ins during first quarter

## Knowledge Transfer Checklist

When someone leaves:
- [ ] Are their dashboards/reports documented?
- [ ] Is their role in data processes assigned to someone else?
- [ ] Have they transferred any tribal knowledge?
- [ ] Is system access revoked appropriately?
        `,
        keyTakeaways: [
          'Document everything so knowledge doesn\'t leave with people',
          'Structure onboarding to build data capability from day one',
          'Use mentors to transfer tacit knowledge',
        ],
      },
      {
        id: 'im-004-03',
        title: 'Continuous Improvement Cycle',
        format: 'article',
        content: `
# The Data Practice Improvement Loop

Mature data cultures don't just use data—they improve their data use over time.

## Quarterly Review Process

Each quarter, reflect:

1. **What's working?**
   - Which data practices are driving decisions?
   - Where are we seeing impact?
   - What should we do more of?

2. **What's struggling?**
   - Which practices are being skipped or avoided?
   - Where is adoption stalled?
   - What barriers exist?

3. **What's next?**
   - What new features or reports should we explore?
   - What training needs have emerged?
   - What data sources should we add?

## Metrics for Data Practice Health

**Engagement:**
- Dashboard login frequency (are people using it?)
- Feature adoption (which features get used?)
- Support ticket volume (is it declining?)

**Quality:**
- Data accuracy scores (from periodic audits)
- Sync reliability (how often do syncs fail?)
- User confidence survey (do people trust the data?)

**Impact:**
- Actions documented per week
- Interventions initiated from data
- Leading indicator improvements

## Annual Data Strategy Review

Once per year, conduct a comprehensive review:

- How has our data culture evolved?
- What's our vision for next year?
- What investment (time, money, training) is needed?
- How does this align with school improvement goals?

---

## Celebrating Progress

Don't forget to celebrate:
- Acknowledge teams that exemplify data use
- Share success stories school-wide
- Mark milestones (1 year anniversary, etc.)
- Connect data wins to student outcome improvements
        `,
        keyTakeaways: [
          'Quarterly reviews keep data practice improving',
          'Measure engagement, quality, and impact to track health',
          'Annual strategy reviews align data work with school goals',
        ],
        practiceActivity: {
          title: 'Practice Health Assessment',
          instructions: 'Rate your current data practices on engagement, quality, and impact (1-5 each). Identify one area to focus on improving this quarter.',
          estimatedMinutes: 15,
          deliverable: 'Self-assessment with improvement priority',
        },
      },
    ],
  },
];

/**
 * Get all implementation modules
 */
export function getImplementationModules(): LearningModule[] {
  return IMPLEMENTATION_MODULES;
}

/**
 * Get a specific module by slug
 */
export function getImplementationModuleBySlug(slug: string): LearningModule | undefined {
  return IMPLEMENTATION_MODULES.find((m) => m.slug === slug);
}
