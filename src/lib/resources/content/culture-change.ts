/**
 * Culture Change Playbook
 * =======================
 *
 * Modules for building a data-informed organizational culture.
 */

import { LearningModule } from '../types';

export const CULTURE_CHANGE_MODULES: LearningModule[] = [
  // ===========================================
  // MODULE 1: Building Buy-In
  // ===========================================
  {
    id: 'cc-001',
    slug: 'building-buy-in',
    title: 'Building Buy-In for Data Culture',
    description: 'Strategies for gaining organizational support for data-informed practices, from skeptics to champions.',
    category: 'culture_change',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    outcomes: [
      'Identify and address common sources of data resistance',
      'Craft messaging that connects data to teacher values',
      'Build a coalition of early adopters and champions',
      'Sequence change initiatives for sustainable adoption',
    ],
    sections: [
      {
        id: 'cc-001-01',
        title: 'Understanding Resistance',
        format: 'article',
        content: `
# Why Data Initiatives Fail

Most data initiatives don't fail because of bad tools or insufficient data. They fail because of people—specifically, because leaders underestimate the legitimate concerns that drive resistance.

## The Five Fears

When teachers resist data use, they're usually expressing one of five fears:

### 1. Fear of Exposure
"This data will be used to judge me, not help me."

*Reality check:* This fear is often justified. If data has been weaponized in performance reviews, trust is broken.

*Solution:* Separate data for improvement from data for evaluation. Be explicit about when each is being used.

### 2. Fear of Reductionism
"You can't capture what I do in a spreadsheet."

*Reality check:* They're right. Data captures outcomes, not the nuance of teaching.

*Solution:* Position data as one input among many. Always pair quantitative data with qualitative conversation.

### 3. Fear of Extra Work
"This is just another thing on my plate."

*Reality check:* If data use requires manual entry, report generation, or extra meetings, it is more work.

*Solution:* Automate data collection. Replace existing reports, don't add new ones. Protect time.

### 4. Fear of Incompetence
"I'm not a numbers person. I don't understand statistics."

*Reality check:* Math anxiety is real, and data dashboards can be intimidating.

*Solution:* Invest in data literacy training. Design dashboards for clarity, not sophistication.

### 5. Fear of Lost Autonomy
"You're going to tell me exactly what to do based on an algorithm."

*Reality check:* Over-prescriptive data systems do undermine professional judgment.

*Solution:* Position data as informing decisions, not making them. Preserve teacher agency.

---

## Diagnosing Your Context

Before launching a data initiative, audit your context:

- Has data been used punitively in the past?
- What's the current state of data literacy?
- Which stakeholders are early adopters vs. skeptics?
- What's the current workload burden?

The answers shape your change strategy.
        `,
        keyTakeaways: [
          'Resistance usually stems from legitimate fears, not stubbornness',
          'Address the fear directly rather than dismissing it',
          'Audit your context before launching initiatives',
        ],
        reflectionQuestions: [
          'Which of the five fears is most present in your organization?',
          'Has data been used punitively in the past? How might that affect current trust?',
        ],
      },
      {
        id: 'cc-001-02',
        title: 'Messaging That Connects',
        format: 'article',
        content: `
# Framing Data for Educators

How you talk about data shapes how people receive it. Here's how to frame data initiatives in ways that connect to educator values.

## From "Accountability" to "Insight"

**Don't say:** "We need to track student outcomes for accountability."
**Do say:** "We want to know sooner when students need help, so we can intervene before it's too late."

The first framing triggers fear of exposure. The second connects to the care educators feel for students.

## From "Data-Driven" to "Data-Informed"

**Don't say:** "We're becoming a data-driven school."
**Do say:** "We're adding data to our toolkit for making decisions."

"Data-driven" implies data is in the driver's seat. "Data-informed" keeps humans in control.

## From "Monitoring" to "Understanding"

**Don't say:** "We're implementing a monitoring system."
**Do say:** "We want to understand what's happening with our students in real-time."

"Monitoring" sounds like surveillance. "Understanding" sounds like empathy.

## From "Numbers" to "Stories"

**Don't say:** "Let's look at the numbers."
**Do say:** "Let's see what the data tells us about how our students are doing."

Numbers are abstract. Students are people. Keep the human at the center.

---

## The Purpose Bridge

Every data point should connect to purpose. Build the bridge explicitly:

| Data Point | → | Purpose |
|------------|---|---------|
| Attendance rate | → | Every day counts for learning |
| Intervention minutes | → | Students get the support they need |
| Formative scores | → | We know what to teach next |

When the "why" is clear, the "what" becomes meaningful.
        `,
        keyTakeaways: [
          'Language shapes reception—choose words that connect to educator values',
          '"Data-informed" keeps humans in control, "data-driven" implies they\'re not',
          'Always bridge data points to purpose and students',
        ],
      },
      {
        id: 'cc-001-03',
        title: 'Coalition Building',
        format: 'article',
        content: `
# Finding and Cultivating Champions

Culture change doesn't happen through mandates. It happens through movements—and movements need champions.

## The Adoption Curve

In any organization, people fall on a spectrum:

| Segment | % | Characteristics | Strategy |
|---------|---|-----------------|----------|
| **Innovators** | ~5% | Love new things, will try anything | Recruit as pilot participants |
| **Early Adopters** | ~15% | Open to change, need to see value | These are your champions |
| **Early Majority** | ~35% | Pragmatic, want proof it works | Win them with success stories |
| **Late Majority** | ~35% | Skeptical, need peer pressure | Win them with critical mass |
| **Laggards** | ~10% | Resist until forced | Don't fight; focus elsewhere |

**Strategic insight:** Most change efforts fail by trying to convince everyone at once. Instead, focus on building momentum with early adopters, then leverage their success to move the majority.

## Identifying Champions

Champions aren't always the loudest or most senior people. Look for:

- **Respect among peers:** When they speak, others listen
- **Quiet competence:** Consistently get results without drama
- **Growth orientation:** Interested in improving, not defending status quo
- **Relationship capital:** Well-connected across the organization

## Activating Champions

Once identified, equip champions to lead:

1. **Early access:** Give them the tools first. Let them explore and provide feedback.
2. **Success scaffolding:** Ensure their early experiences are positive.
3. **Voice:** Create platforms for them to share their experiences with peers.
4. **Recognition:** Acknowledge their contribution without making others feel excluded.

## The 10-80-10 Rule

In most organizations:
- 10% will embrace change enthusiastically
- 80% are persuadable but watching
- 10% will resist regardless

Don't waste energy on the resistant 10%. Focus on the enthusiastic 10% to sway the persuadable 80%.
        `,
        keyTakeaways: [
          'Focus on early adopters first—they move the majority',
          'Champions have respect, competence, and relationship capital',
          'Apply the 10-80-10 rule: don\'t waste energy on hard resisters',
        ],
        practiceActivity: {
          title: 'Champion Identification Exercise',
          instructions: 'List 3-5 potential data champions in your organization. For each, note: Why you selected them, their sphere of influence, and one way you could equip them to advocate for data use.',
          estimatedMinutes: 15,
          deliverable: 'Champion identification list with activation strategies',
        },
      },
    ],
  },

  // ===========================================
  // MODULE 2: Running Effective Data Meetings
  // ===========================================
  {
    id: 'cc-002',
    slug: 'effective-data-meetings',
    title: 'Running Effective Data Meetings',
    description: 'Transform data meetings from report-outs into action-oriented sessions that drive student outcomes.',
    category: 'culture_change',
    targetRoles: ['teacher', 'school_leader'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    outcomes: [
      'Design data meeting agendas that drive action',
      'Facilitate discussions that surface insights, not just numbers',
      'Avoid common data meeting pitfalls',
      'Close meetings with clear commitments and accountability',
    ],
    sections: [
      {
        id: 'cc-002-01',
        title: 'Anatomy of a Great Data Meeting',
        format: 'article',
        content: `
# The 45-Minute Data Protocol

Most data meetings fail because they're unstructured. Here's a protocol that works:

## Before the Meeting (5-10 min prep)

1. **Select focus.** One metric, one question, one cohort. Don't try to cover everything.
2. **Prepare visuals.** Have the relevant dashboard or chart ready to display.
3. **Pre-identify outliers.** Note 2-3 specific students or data points to discuss.

## Opening (5 min)

- State the purpose: "Today we're looking at [X] to decide [Y]"
- Show the big picture data briefly
- Don't interpret yet—just display

## Deep Dive (15 min)

Use the **See-Think-Wonder** protocol:

**SEE (3 min):** What do you notice? Just observations, no interpretation.
- "Scores are lower in November than October"
- "Three students dropped significantly"

**THINK (7 min):** What might explain this? What hypotheses?
- "November had the holiday break—less instructional time"
- "Those three students were out for extended absences"

**WONDER (5 min):** What questions does this raise? What do we need to know?
- "Were the absent students offered make-up support?"
- "Is this pattern consistent with previous years?"

## Action Planning (15 min)

**For each insight, define:**
- **What** action will be taken
- **Who** is responsible
- **When** it will happen
- **How** we'll know it worked

**Be specific.** Not "we'll provide intervention" but "Ms. Johnson will pull Aiden, Marcus, and Sophia for 30-minute small group during intervention block starting Monday."

## Close (5 min)

- Read back commitments
- Schedule follow-up check (usually 2-4 weeks)
- Thank participants for engagement

---

## The 3-2-1 Exit

End every data meeting with a quick 3-2-1 reflection:
- **3** things learned
- **2** actions committed to
- **1** question remaining
        `,
        keyTakeaways: [
          'Focus on one metric, one question, one cohort per meeting',
          'Use See-Think-Wonder to structure discussion',
          'Close with specific commitments: who does what by when',
        ],
      },
      {
        id: 'cc-002-02',
        title: 'Common Data Meeting Pitfalls',
        format: 'article',
        content: `
# Seven Mistakes That Kill Data Meetings

## 1. The Data Dump

**Symptom:** Someone presents 47 slides of charts with no clear throughline.

**Fix:** One focus area per meeting. If people want more data, schedule another meeting.

## 2. The Blame Game

**Symptom:** Discussion turns to why numbers are bad and whose fault it is.

**Fix:** Establish ground rules upfront. Data is for learning, not judging. Use "what can we do" language, not "why did this happen."

## 3. The Excusal

**Symptom:** Every data point is explained away. "Those students don't count because..."

**Fix:** Acknowledge context, but don't use it to dismiss data. Ask: "Given this context, what can we still do?"

## 4. The Tangent Train

**Symptom:** One data point leads to a story which leads to a complaint which leads to an unrelated policy discussion.

**Fix:** Use a "parking lot" for off-topic items. Facilitator gently redirects: "That's important—let's capture it for later."

## 5. The No-Action Meeting

**Symptom:** Lots of interesting discussion, but no commitments made.

**Fix:** Reserve the final third of every meeting for action planning. Don't adjourn without commitments.

## 6. The Expert Monologue

**Symptom:** One person (often the leader) interprets all the data while others listen.

**Fix:** Use protocols that distribute voice. Ask questions before offering interpretations.

## 7. The Annual Event

**Symptom:** Data meetings happen once a semester or year, making them high-stakes and inactionable.

**Fix:** Brief, frequent check-ins (weekly or biweekly) are more effective than lengthy quarterly reviews.

---

## Facilitator Self-Check

After each data meeting, ask yourself:
- Did everyone contribute, or did a few people dominate?
- Did we end with clear actions, or just "awareness"?
- Did the tone feel curious and constructive, or defensive?
        `,
        keyTakeaways: [
          'The most common failure is leaving without clear action commitments',
          'Blame kills learning; reframe toward "what can we do"',
          'Frequent brief meetings beat infrequent lengthy ones',
        ],
        practiceActivity: {
          title: 'Meeting Redesign',
          instructions: 'Think about your last data meeting. Which of the seven pitfalls were present? Design an agenda for your next data meeting using the 45-minute protocol.',
          estimatedMinutes: 20,
          deliverable: 'Redesigned data meeting agenda',
        },
      },
      {
        id: 'cc-002-03',
        title: 'Facilitation Techniques',
        format: 'article',
        content: `
# Facilitation Moves for Data Discussions

Great data meetings don't happen by accident. Here are techniques to elevate your facilitation:

## Distributing Voice

**The Whip:** Go around the room, each person shares one observation in 30 seconds or less.

**Think-Pair-Share:** Individual reflection → Partner discussion → Full group share. Ensures introverts process before extroverts dominate.

**Equity Sticks:** Names on popsicle sticks, draw randomly to determine who speaks. Removes self-selection bias.

## Deepening Thinking

**Ask, Don't Tell:** Resist the urge to interpret first. Ask "What do you see here?" before offering your view.

**Probe Gently:** When someone makes a claim, ask "What in the data leads you to that interpretation?"

**Name the Pattern:** "I'm hearing several people mention [X]. Is that a theme?"

## Managing Disagreement

**Validate Both:** "So Maria sees X, and James sees Y. Let's explore both."

**Return to Data:** "That's an interpretation. What data point supports it?"

**Agree on Next Steps:** "We may not agree on the cause, but can we agree on what to try?"

## Keeping on Track

**Time Calls:** "We have 10 minutes left. Let's move to action planning."

**Parking Lot:** "Important point—let's capture it for follow-up."

**Focus Redirect:** "How does that connect to our focus question today?"

## Creating Safety

**Normalize Struggle:** "It's okay if numbers aren't where we want them. The question is what we do next."

**Model Curiosity:** Ask questions you genuinely don't know the answer to.

**Celebrate Honesty:** "Thank you for naming that—it's important we can have honest conversations."
        `,
        keyTakeaways: [
          'Use protocols to distribute voice and prevent domination',
          'Ask before telling—let the group discover insights',
          'Create psychological safety by normalizing struggle and celebrating honesty',
        ],
      },
    ],
  },

  // ===========================================
  // MODULE 3: Change Management Framework
  // ===========================================
  {
    id: 'cc-003',
    slug: 'change-management-framework',
    title: 'Leading Organizational Change',
    description: 'A practical framework for managing the human side of data transformation initiatives.',
    category: 'culture_change',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'advanced',
    estimatedMinutes: 40,
    outcomes: [
      'Apply a change management framework to data initiatives',
      'Anticipate and address change fatigue',
      'Build sustainable systems rather than hero-dependent ones',
      'Measure and communicate progress on culture change',
    ],
    sections: [
      {
        id: 'cc-003-01',
        title: 'The ADKAR Framework',
        format: 'article',
        content: `
# ADKAR: A Model for Individual Change

Organizational change happens one person at a time. The ADKAR model tracks individual readiness:

## A – Awareness

"I understand why we're doing this."

**Building awareness requires:**
- Clear communication of the problem we're solving
- Connection to shared values (student outcomes, not compliance)
- Honesty about current state without blame

**Signals of missing awareness:**
- "Why are we doing this again?"
- "Is this a priority?"
- "Sounds like another initiative"

## D – Desire

"I want to be part of this change."

**Building desire requires:**
- Answering "What's in it for me?" authentically
- Addressing fears and concerns
- Creating early wins that feel rewarding

**Signals of missing desire:**
- "I'm too busy for this"
- "Let me know when it's mandatory"
- Passive resistance

## K – Knowledge

"I know how to do what's being asked."

**Building knowledge requires:**
- Training that's practical, not theoretical
- Just-in-time learning near point of application
- Ongoing support, not one-shot PD

**Signals of missing knowledge:**
- "I don't know how to use this"
- "The dashboard is confusing"
- Errors in interpretation

## A – Ability

"I can actually do this in practice."

**Building ability requires:**
- Practice with feedback
- Time and space to struggle and learn
- Adjusting workload to enable new behaviors

**Signals of missing ability:**
- "I tried but it didn't work"
- "There's no time"
- "It's too hard"

## R – Reinforcement

"This new way is now how we do things."

**Building reinforcement requires:**
- Celebrating successes
- Incorporating into ongoing systems (not a side project)
- Leadership modeling the behaviors

**Signals of missing reinforcement:**
- "We used to do that"
- "That was a phase"
- Drift back to old patterns

---

## Diagnosing ADKAR Gaps

When adoption is stalling, identify which element is the bottleneck:

| If people say... | The gap is probably... |
|-----------------|------------------------|
| "Why are we doing this?" | Awareness |
| "I don't see the point" | Desire |
| "I don't know how" | Knowledge |
| "I can't make it work" | Ability |
| "We don't do that anymore" | Reinforcement |

Address gaps in order. Knowledge training won't help if desire is missing.
        `,
        keyTakeaways: [
          'ADKAR tracks individual change readiness: Awareness, Desire, Knowledge, Ability, Reinforcement',
          'Address gaps in order—earlier gaps block later stages',
          'Diagnose resistance by listening to what people say',
        ],
        reflectionQuestions: [
          'For your current data initiative, which ADKAR stage is the biggest bottleneck?',
          'What would it take to move your most resistant stakeholders to the next stage?',
        ],
      },
      {
        id: 'cc-003-02',
        title: 'Avoiding Change Fatigue',
        format: 'article',
        content: `
# When People Are Tired of Changing

Schools suffer from chronic initiative overload. Every year brings new programs, new tools, new mandates. Change fatigue is real—and it undermines even good initiatives.

## Signs of Change Fatigue

- Eye rolls at new announcements
- "This too shall pass" mentality
- Minimal compliance, zero enthusiasm
- High performer disengagement
- Increased turnover

## The Initiative Inventory

Before launching any new data practice, conduct an honest inventory:

1. **List all current initiatives** (not just yours—all of them)
2. **Estimate time burden** of each
3. **Assess alignment** with core mission
4. **Identify overlaps** and conflicts

If the list is overwhelming to read, imagine living it.

## The Substitution Principle

**Never add without subtracting.**

For every new practice you introduce:
- What existing practice does it replace?
- What meeting does it eliminate or shorten?
- What report does it make obsolete?

If you can't answer these questions, you're adding burden, not value.

## Integration Over Addition

Instead of creating new data workflows, integrate into existing ones:

| Instead of... | Integrate into... |
|---------------|-------------------|
| New data meetings | Existing team meetings |
| New dashboard login | Morning routine already established |
| New reports | Replacing existing reports |
| New goal-setting process | Existing PD structures |

## The Long Game

Culture change takes 2-3 years, not 2-3 months. Plan for:

**Year 1:** Build foundation—awareness, early adopters, basic skills
**Year 2:** Expand practice—majority adoption, deepening skills
**Year 3:** Embed in culture—reinforcement, continuous improvement

Rushing the timeline creates backlash and shallow adoption.
        `,
        keyTakeaways: [
          'Change fatigue is real—audit existing initiatives before adding new ones',
          'Never add without subtracting something else',
          'Culture change takes 2-3 years; plan for the long game',
        ],
      },
      {
        id: 'cc-003-03',
        title: 'Measuring Culture Change',
        format: 'article',
        content: `
# How Do You Know If Culture Is Changing?

Culture is hard to measure, but not impossible. Here are indicators at multiple levels:

## Leading Indicators (Early signals)

| Indicator | How to Measure |
|-----------|----------------|
| Meeting attendance & engagement | Are data meetings well-attended? Are people participating? |
| Dashboard logins | Are people actually using the tools? |
| Questions being asked | Are people bringing data questions to discussions? |
| Voluntary sharing | Are teachers sharing data wins unprompted? |

## Process Indicators (Behaviors changing)

| Indicator | How to Measure |
|-----------|----------------|
| Decision references | Are data points cited in decision discussions? |
| Meeting agendas | Do meeting agendas include data review? |
| Student conversations | Do teachers reference data when discussing students? |
| Action follow-through | Are commitments from data meetings being completed? |

## Lagging Indicators (Outcomes improving)

| Indicator | How to Measure |
|-----------|----------------|
| Intervention effectiveness | Are interventions showing impact? |
| Early identification | Are at-risk students identified sooner? |
| Student outcomes | Are achievement metrics improving? |
| Staff retention | Are teachers staying because they feel effective? |

---

## The Culture Pulse Survey

Periodically (quarterly or biannually), survey staff:

1. "I understand how data use connects to student success" (Awareness)
2. "I find data helpful in my daily work" (Desire)
3. "I feel confident interpreting the data I see" (Knowledge)
4. "I have time and support to use data effectively" (Ability)
5. "Our school genuinely values data-informed practice" (Reinforcement)

Track trends over time. Celebrate improvement; investigate decline.

## The Walk-Through Test

Walk through your building and listen:
- Are data conversations happening informally?
- Is data displayed (and discussed, not just posted)?
- When you ask "how's it going?" do people reference data?

Culture lives in hallways, not just meetings.
        `,
        keyTakeaways: [
          'Measure culture through leading (engagement), process (behavior), and lagging (outcome) indicators',
          'Periodic pulse surveys track ADKAR progress',
          'Culture shows up in hallways—walk around and listen',
        ],
        practiceActivity: {
          title: 'Culture Measurement Plan',
          instructions: 'Design a simple culture measurement approach for your organization. Select 3 leading indicators, 2 process indicators, and 1 lagging indicator. Define how you\'ll collect data on each.',
          estimatedMinutes: 25,
          deliverable: 'Culture measurement plan with 6 indicators and collection methods',
        },
      },
    ],
  },

  // ===========================================
  // MODULE 4: Teacher Data Conversations
  // ===========================================
  {
    id: 'cc-004',
    slug: 'teacher-data-conversations',
    title: 'Data Conversations with Teachers',
    description: 'How to use data in coaching and observation conversations without triggering defensiveness.',
    category: 'culture_change',
    targetRoles: ['school_leader'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    outcomes: [
      'Frame data conversations as collaborative inquiry',
      'Use data to surface questions rather than deliver judgments',
      'Support teachers in setting data-informed goals',
      'Navigate difficult conversations when data reveals problems',
    ],
    sections: [
      {
        id: 'cc-004-01',
        title: 'The Collaborative Inquiry Stance',
        format: 'article',
        content: `
# From Evaluation to Exploration

The difference between a productive data conversation and a defensive one is stance.

## The Evaluative Stance (Avoid)

"I looked at your data. Your students aren't making adequate progress. What are you going to do about it?"

This stance:
- Positions the leader as judge
- Puts the teacher on defense
- Shuts down thinking
- Damages trust

## The Inquiry Stance (Use)

"I've been looking at the data for your class and I'm curious about a few things. Can we explore together?"

This stance:
- Positions both as learners
- Opens space for reflection
- Enables thinking
- Builds partnership

## The Language Shift

| Evaluative | Inquiry |
|------------|---------|
| "Your scores are..." | "I noticed that..." |
| "Why didn't you..." | "I'm curious about..." |
| "You need to..." | "What might happen if..." |
| "The data shows you failed to..." | "The data raises a question about..." |

## The 80/20 Rule

In data conversations:
- Teacher should talk 80%
- Leader should listen 80%

If you're doing most of the talking, you're telling, not coaching.
        `,
        keyTakeaways: [
          'Stance determines outcome—inquiry opens, evaluation closes',
          'Use curious language: "I noticed," "I wonder," "What if"',
          'Teacher should talk 80% of the time',
        ],
      },
      {
        id: 'cc-004-02',
        title: 'The Data Conversation Protocol',
        format: 'article',
        content: `
# A Structure for Data Conversations

## Step 1: Set the Frame (2 min)

"I'd like to look at some data together—not to evaluate, but to think together about what it might tell us and what we might try."

Make the purpose explicit. Reduce anxiety upfront.

## Step 2: Share the Data (3 min)

Present data neutrally:
- "Here's what I'm seeing..."
- "This shows..."
- Don't interpret yet

Give the teacher time to look and absorb.

## Step 3: Invite Observations (5 min)

"What do you notice? What stands out to you?"

Let the teacher speak first. They may notice things you missed. They may anticipate your concerns. Either way, you learn.

## Step 4: Explore Together (10 min)

Ask open questions:
- "What might be contributing to this pattern?"
- "What have you tried?"
- "What's your hypothesis?"

Listen. Paraphrase. Ask follow-ups.

## Step 5: Generate Possibilities (5 min)

"Given what we're seeing, what might we try?"

Note: "we," not "you." This is collaborative.

Offer ideas as options, not directives:
- "One thing that's worked for others is..."
- "Have you considered...?"

## Step 6: Commit to Action (3 min)

"What will you try? How will we know if it's working? When should we check back?"

Get specific commitments. Schedule follow-up.

## Step 7: Close with Support (2 min)

"What do you need from me to make this work?"

End with support, not surveillance.
        `,
        keyTakeaways: [
          'Follow a structured protocol to avoid improvised evaluation',
          'Let the teacher observe and interpret first',
          'Close with support: "What do you need from me?"',
        ],
        practiceActivity: {
          title: 'Conversation Roleplay',
          instructions: 'With a colleague, practice a data conversation using this protocol. One person plays the teacher, one the leader. Swap roles and debrief: What worked? What felt uncomfortable?',
          estimatedMinutes: 30,
          deliverable: 'Reflection notes from roleplay exercise',
        },
      },
    ],
  },
];

/**
 * Get all culture change modules
 */
export function getCultureChangeModules(): LearningModule[] {
  return CULTURE_CHANGE_MODULES;
}

/**
 * Get a specific module by slug
 */
export function getCultureChangeModuleBySlug(slug: string): LearningModule | undefined {
  return CULTURE_CHANGE_MODULES.find((m) => m.slug === slug);
}
