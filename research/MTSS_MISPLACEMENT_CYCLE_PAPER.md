# Breaking the Misplacement-Differentiation Cycle: A Simulation Study of Diagnostic Data Quality, Classroom Placement, and MTSS Effectiveness in Charter Schools

**Eddy Mkwambe**  
Mpingo Systems LLC | Charlotte, NC  
MS Strategic Analytics, Brandeis University  
MS Mathematical Modeling

**Draft:** March 2026  
**Status:** Working Paper

---

## Abstract

Multi-Tiered Systems of Support (MTSS) are widely adopted in K-12 education, yet their effectiveness is constrained by a reinforcing cycle that has received insufficient attention: poor diagnostic data leads to student misplacement, which increases the differentiation burden on classroom teachers, which degrades instructional quality, which produces the poor outcomes that MTSS is designed to prevent. This paper presents an agent-based simulation of 500 students across 36 weeks of instruction, modeling four compounding data quality factors — timing delay, placement accuracy, student motivation effects, and assessment actionability — across five diagnostic data scenarios ranging from no grouping to curriculum-based measurement (CBM) diagnostics. Results demonstrate three key findings: (1) the structural decision to implement flexible grouping is the single largest lever, producing a 14 percentage point gain in proficiency even with imprecise placement data; (2) assessment timing matters as much as accuracy, with immediate teacher judgment (50% accuracy, 0-week delay) outperforming lagged state test data (70% accuracy, 6-week delay); and (3) CBM diagnostics dominate on both dimensions, achieving the highest accuracy (92%) with the shortest delay (1 week), yielding an 18 percentage point proficiency swing over traditional grade-level placement. The simulation further demonstrates that 80% of students performing below grade level have exposure gaps rather than cognitive deficits — limited prerequisites students who grow 1.3x faster when correctly placed but 0.6x slower when misplaced. These findings have direct implications for charter school accountability, SPED referral reduction, and the design of data-driven early warning systems.

**Keywords:** MTSS, flexible grouping, curriculum-based measurement, student placement, differentiation, charter school accountability, early warning systems, limited prerequisites

---

## 1. Introduction

### 1.1 The Promise and Reality of MTSS

Multi-Tiered Systems of Support (MTSS) represent the dominant framework for identifying and supporting struggling students in K-12 education. The core premise is straightforward: universal screening identifies students at risk, data-driven decision-making guides intervention selection, and progress monitoring evaluates effectiveness. When implemented with fidelity, MTSS has demonstrated meaningful improvements in student outcomes across multiple meta-analyses.

However, the gap between MTSS as designed and MTSS as implemented in charter schools reveals a structural problem that existing literature has not adequately addressed. Charter schools face unique pressures: accountability metrics that determine charter renewal, limited administrative capacity (the national school counselor ratio is 477:1 versus the ASCA-recommended 250:1), and student populations with high mobility rates and diverse prerequisite gaps. In this context, the quality of the data informing MTSS decisions becomes the critical variable — and the evidence suggests that data quality is frequently inadequate.

### 1.2 The Reinforcing Cycle Hypothesis

This paper proposes and tests the following hypothesis:

> **Misplacement and overdifferentiation — driven by inadequate diagnostic data and constrained by class size and the inherent limits of differentiated instruction — create a reinforcing cycle that degrades MTSS effectiveness and thereby student outcomes. Targeted improvements in placement accuracy, instructional capacity, and differentiation efficiency yield substantial gains in school performance grades.**

The hypothesized cycle operates as follows:

1. **Poor diagnostic data** (stale, norm-referenced, motivation-contaminated) leads to inaccurate student placement decisions.
2. **Misplaced students** cannot access grade-level content (placed too high) or are under-challenged (placed too low), producing minimal growth.
3. **Teachers attempt to differentiate** within mixed-ability classrooms to compensate for misplacement, increasing workload and reducing instructional efficiency.
4. **Overdifferentiation degrades quality** for all students, as teacher attention and instructional time are fragmented across multiple ability levels.
5. **Students flagged for MTSS intervention** receive Tier 2/3 support, but intervention cannot compensate for a fundamental placement error — the student still spends 80% of instructional time in the wrong classroom.
6. **Stagnant students are referred for special education evaluation**, consuming additional resources and potentially misidentifying students with exposure gaps as having cognitive disabilities.
7. **The cycle reinforces**: more misplacement → more differentiation burden → lower quality → more students struggling → more MTSS referrals → more strain on an already overloaded system.

### 1.3 The Limited Prerequisites Compartment

Central to this model is the distinction between students who are behind due to **cognitive deficits** and those who are behind due to **exposure gaps** — what we term "limited prerequisites" (LP) students. Research on special education referral patterns suggests that a substantial proportion of students identified as struggling have typical cognitive capacity but lack prerequisite skills due to factors including:

- **Student mobility** (25%): Changing schools disrupts curriculum sequences, creating specific content gaps.
- **Chronic absence** (20%): Missing instructional days means missing instructional units.
- **English Learner status** (15%): Language barriers can mask content knowledge, leading to misidentification of skill deficits.
- **Ineffective prior instruction** (15%): Skills that were "taught" but never mastered due to poor instructional quality.
- **No pre-kindergarten education** (10%): Entering formal schooling without foundational skills.
- **Cumulative summer loss** (10%): Repeated summer regression compounds over multiple years.
- **Curriculum misalignment** (5%): Transferring between schools or districts with different scope and sequence.

The simulation estimates that 80% of students performing at Level 1 (2+ years below grade level) and Level 2 (1 year below) fall into this limited prerequisites category. The critical insight is that these students have fundamentally different growth trajectories depending on placement: when correctly placed in targeted remediation that addresses their specific gaps, they grow at an accelerated rate (modeled at 1.3x typical growth); when misplaced in grade-level classrooms where they cannot access the content, they grow at a severely reduced rate (0.6x typical).

### 1.4 The Role of Diagnostic Data Quality

The quality of data informing placement decisions is not a binary variable. This paper models a hierarchy of diagnostic data sources, each characterized by four compounding factors:

1. **Timing delay**: How many weeks into the school year before data is available to inform placement. During the delay, students default to grade-level placement.
2. **Base accuracy**: The probability that the assessment correctly identifies a student's true instructional level.
3. **Motivation noise**: The degree to which student effort (or lack thereof) on low-stakes assessments degrades measurement accuracy.
4. **Actionability**: Whether the assessment provides rank-order information only (norm-referenced) or specific skill-gap information (criterion-referenced) that can drive targeted placement and intervention.

---

## 2. Literature Review

### 2.1 Universal Screening Accuracy

The accuracy of universal screening instruments in identifying students who need support is a foundational concern for MTSS implementation. A North Carolina high school study found that the universal screener correctly identified only 55% of students who actually needed support (sensitivity = 0.549), while maintaining high specificity (0.967) — meaning the screener was better at confirming who did NOT need help than identifying who did (Study cited in NC MTSS research parameters). A 2025 meta-analysis of 127 studies found a moderate average correlation (r = 0.51) between screening tools and outcomes, with "very high" variability across different tools, meaning prediction is often weak (Meta-analysis of screening validity, 2025).

### 2.2 Low-Stakes Assessment and Student Motivation

A critical and often overlooked factor in assessment-based placement is student motivation. Wise and DeMars (2005) conducted a comprehensive review of 12 studies encompassing 25 comparisons between motivated and less-motivated test-takers on low-stakes assessments. The average effect size was d = 0.59 — a substantial difference indicating that unmotivated students scored more than half a standard deviation below their true proficiency level. Liu, Bridgeman, and Adler (2012) found that simply increasing the perceived stakes of a test (telling students their scores could be shared with faculty or employers) produced a d = 0.41 improvement in performance.

This finding has direct implications for assessments used in placement decisions. Instruments like MAP Growth and iReady are explicitly low-stakes for students — they do not affect grades, GPA, or course placement from the student's perspective. As Wise and DeMars note, "test scores can be seen as a combination of skill (ability) and will (motivation)," meaning that placement decisions based on low-stakes screener data are systematically contaminated by unmeasured variation in student effort.

### 2.3 Curriculum-Based Measurement Validity

Curriculum-based measurement (CBM) represents a fundamentally different approach to educational assessment. CBM probes are brief (1-3 minutes per administration; Deno, 2003), teacher-administered, and aligned to the specific curriculum the student is expected to master. McGlinchey and Hixson (2004) reported a correlation of r = 0.67 between CBM probes and state reading assessment performance. Marston (1989) and Reschly et al. (2009) found correlations ranging from "large to nearly perfect" between CBM reading fluency measures and both criterion-referenced and norm-referenced tests.

Critically, CBM differs from universal screeners on all four data quality dimensions simultaneously: it is administered quickly (minimal delay), tests specific skills (criterion-referenced actionability), is brief and teacher-administered (reducing motivation noise), and directly maps to the instructional curriculum (higher placement accuracy).

### 2.4 Teacher Judgment Accuracy

Teacher judgment represents the most readily available but least precise placement data. Eckert, Dunn, Codding, Begeny, and Kleinmann (2006) examined the relationship between teacher judgment and student performance across reading and mathematics. In reading, correlations were large to very large (r = 0.59 to 0.83); in mathematics, however, correlations were medium or lower (r = 0.09 to 0.32). Notably, teachers tended to overestimate the performance of typically performing students, suggesting that reliance on teacher judgment alone may systematically fail to identify students who appear to be performing adequately but have critical prerequisite gaps.

### 2.5 Assessment Timing and the Cost of Delay

NWEA documentation indicates that MAP Growth testing typically begins around week 4 of the school year, with a 3-week testing window and results available within 24 hours of individual test completion (NWEA, 2024). However, the practical timeline from school start to data-informed placement decisions is substantially longer: schools must schedule testing, administer over a multi-week window, aggregate results, and convene data meetings before acting. For lagged data (prior year state assessments), the delay is even more severe — state EOG results are typically not available for a minimum of three months after administration (NWEA FAQ).

Current research and North Carolina guidance suggest that decisions about an intervention's effectiveness should not be made until a student has been in it for at least 10 weeks with 7-10 data points (NC MTSS guidance). This creates a tension: the system requires weeks of data to validate placement, but every week of misplacement costs the student growth that cannot be recovered.

### 2.6 Norm-Referenced vs. Criterion-Referenced Assessment

A fundamental limitation of norm-referenced assessments for placement purposes is well-documented: they provide rank-order information ("this student is at the 32nd percentile") without specifying what the student can and cannot do. As noted in the assessment literature, "the major reason for using norm-referenced assessment is to produce a rank order... an obvious disadvantage is that it gives little information about what a test-taker actually knows or can do and cannot measure students' progress or learning outcomes" (ResearchGate review of assessment types). Criterion-referenced assessments, by contrast, "provide a clear picture of what a student has mastered and what areas need improvement," enabling "educators to tailor their instruction and resources to meet individual student needs" (Classtime, 2024).

---

## 3. Methodology

### 3.1 Model Architecture

The simulation employs an agent-based model with 500 student agents, each characterized by:

- **True skill level** (1-4, corresponding to performance levels on state assessments)
- **True percentile** (continuous, within the range appropriate to their skill level)
- **Limited prerequisites status** (boolean, determined probabilistically for Level 1 and Level 2 students)
- **Prerequisite cause** (categorical, drawn from the seven root cause categories for LP students)
- **Assigned classroom pace** (determined by the scenario's placement mechanism)
- **Assigned MTSS tier** (determined by the screener sensitivity parameter)

The student population is distributed across four skill levels: 20% at Level 1 (2+ years below grade level), 30% at Level 2 (1 year below), 35% at Level 3 (on grade level), and 15% at Level 4 (above grade level).

### 3.2 Growth Model

Student growth per week is determined by:

**Classroom growth** = base_rate × classroom_quality × placement_match × LP_multiplier

Where:
- base_rate = 0.4 if correctly placed, 0.2 × (1 - 0.3 × pace_gap) if misplaced
- classroom_quality = 0.85 - overload_penalty - differentiation_waste_penalty
- LP_multiplier = 1.3 if LP student correctly placed, 0.6 if misplaced, 1.0 otherwise

**Intervention boost** = tier_rate × intervention_quality × actionability_bonus

Where:
- tier_rate = 0.2 if correctly assigned, 0.1 if in wrong tier, 0 if Tier 1
- intervention_quality = 0.9 - overload_penalty (based on interventionist capacity)
- actionability_bonus = 1 + (actionability × 0.15), reflecting criterion-referenced targeting

### 3.3 Placement Mechanism

Each scenario implements placement through a noisy decision function:

```
P(correct_placement) = base_accuracy × (1 - motivation_noise)
```

If the placement decision is incorrect, students are biased toward grade-level placement (the default when uncertain). During the timing delay period (scenario-specific), all students remain in grade-level classrooms regardless of data quality.

Dynamic review occurs every 6 weeks, applying the same accuracy function to re-evaluate misplaced students. This means higher-accuracy scenarios converge to correct placement faster, while lower-accuracy scenarios accumulate more correction over time.

### 3.4 Scenario Definitions

Five scenarios represent the hierarchy of diagnostic data quality available to schools:

| Scenario | Strategy | Base Accuracy | Delay | Motivation Noise | Actionability | Eff. Accuracy |
|----------|----------|--------------|-------|-------------------|---------------|--------------|
| A: No Grouping | Grade-level for all | N/A | 0 wk | N/A | 0.0 | 0% |
| A+: Teacher Judgment | Teacher recommendation | 50% | 0 wk | 0% | 0.1 | 50% |
| B: Lagged Data | Prior year EOG + grades | 70% | 6 wk | 15% | 0.2 | 60% |
| C: Universal Screener | MAP/iReady (current year) | 80% | 5 wk | 12% | 0.5 | 70% |
| D: CBM Diagnostic | Curriculum-based measures | 92% | 1 wk | 2% | 1.0 | 90% |

Parameter justifications:

- **Teacher judgment accuracy (50%)**: Derived from Eckert et al. (2006) mathematics correlations (r = 0.09-0.32). Teacher judgment in math is substantially weaker than in reading, and for a four-level placement decision (intensive/targeted/grade-level/accelerated), correlations in this range translate to roughly chance-level accuracy for the below-grade-level students who matter most.
- **Lagged data accuracy (70%)**: Prior year state assessments provide a reasonable but stale signal. The 6-week delay reflects the practical timeline of school start → data retrieval → data meeting → action.
- **Lagged motivation noise (15%)**: Based on Wise and DeMars (2005) d = 0.59 effect. Students who were unmotivated during the prior year's state test have systematically underestimated scores, leading to misplacement.
- **Universal screener accuracy (80%)**: Current-year screeners like MAP Growth provide better data but remain norm-referenced. The 5-week delay reflects NWEA's recommended BOY window starting at week 4 plus processing and action time.
- **Screener motivation noise (12%)**: MAP/iReady are explicitly low-stakes for students. The 50-minute computer-administered format provides ample opportunity for disengagement. Effect reduced slightly from lagged data because the test is current-year and computer-adaptive (adjusting difficulty may sustain engagement somewhat).
- **CBM accuracy (92%)**: Based on CBM validity coefficients of r = 0.67+ against criterion measures. CBM directly tests the skills needed for placement decisions.
- **CBM motivation noise (2%)**: ESTIMATED, not research-derived. The structural characteristics of CBM — 1-3 minute probes, teacher-administered face-to-face, embedded in the instructional routine — substantially reduce the conditions that produce low-stakes disengagement. We conservatively estimate residual noise at 2%.
- **CBM delay (1 week)**: CBMs can be administered and scored on the same day. A 1-week delay allows for administration across all students and a placement meeting.

### 3.5 Outcome Metrics

The simulation tracks the following metrics at each weekly time step:

- **Proficiency rate**: Proportion of students at or above Level 3
- **Mean growth**: Average percentile point gain across all students
- **LP gap closure**: Difference in mean growth between LP and non-LP students (positive = LP catching up)
- **Placement accuracy**: Proportion of LP students in the correct classroom pace
- **Differentiation load**: Proportion of all students in the wrong classroom (proxy for teacher differentiation burden)
- **SPED referral risk**: Proportion of LP students still below Level 3 at year end

---

## 4. Results

### 4.1 Proficiency Outcomes by Scenario

| Scenario | Final Proficiency | Growth | LP Gap Closure | LP Placed Correctly | Diff. Load | SPED Risk |
|----------|------------------|--------|----------------|--------------------|-----------:|----------:|
| A: No Grouping | 59% (D) | +8.2 pts | -3.9 | 16% | 54% | 84% |
| A+: Teacher Judgment | 73% (B) | +12.3 pts | +2.8 | 85% | 8% | 54% |
| B: Lagged Data | 72% (B) | +12.0 pts | +2.0 | 90% | 5% | 56% |
| C: Universal Screener | 74% (B) | +13.0 pts | +3.7 | 94% | 3% | 51% |
| D: CBM Diagnostic | 77% (B) | +14.2 pts | +5.5 | 99% | 1% | 45% |

### 4.2 Finding 1: The Structural Decision to Group Is the Largest Lever

The single largest gain in the simulation occurs between Scenario A (no grouping) and Scenario A+ (teacher judgment grouping): **+14 percentage points in proficiency** (59% → 73%). This gain exceeds the combined effect of all subsequent improvements in data quality (A+ → D: +4 points).

This finding is intuitive but underappreciated in practice. Many schools invest in better screeners (B → C) or more sophisticated data systems without first making the structural commitment to organize classrooms by pace level. The simulation suggests that no amount of data quality improvement can compensate for the foundational decision to group.

The mechanism is straightforward: in a non-grouped classroom, the teacher must differentiate across 4 skill levels simultaneously. The simulation models this as a differentiation waste parameter (25%), representing the proportion of instructional effort that fails to reach students at their level. When students are grouped by pace, the differentiation burden drops dramatically — even imprecise grouping (50% accuracy) reduces the differentiation load from 54% to 8%.

### 4.3 Finding 2: Timing Matters as Much as Accuracy

A counterintuitive result emerges when comparing Scenario A+ (teacher judgment: 50% accuracy, 0-week delay) with Scenario B (lagged data: 70% accuracy, 6-week delay): **teacher judgment outperforms lagged data by 1 percentage point** (73% vs 72%) despite having 20 percentage points lower accuracy.

The explanation lies in the compounding cost of delay. During the 6-week delay period in Scenario B, all students remain in grade-level placement — the same condition as Scenario A. For LP students, this means 6 weeks at 0.6x growth rate instead of 1.3x. Each week of misplacement costs approximately 0.7 percentile points of growth that cannot be recovered. Over 6 weeks, this amounts to ~4.2 percentile points of lost growth per LP student.

Meanwhile, teacher judgment in Scenario A+ — despite its imprecision — begins producing correct placements on day 1. Even at 50% accuracy, half of the LP students immediately begin growing at the accelerated rate. The 6-week review cycle then corrects some initial errors, and by week 12, the two scenarios converge in placement accuracy.

This finding has significant implications for assessment policy. Schools using prior year EOG data for placement may be better served by a quick teacher-administered diagnostic — even a crude one — at the start of the year, followed by refinement as more precise data becomes available.

### 4.4 Finding 3: CBM Diagnostics Dominate on Both Dimensions

Scenario D (CBM diagnostic) achieves the highest proficiency (77%) by combining the shortest delay (1 week) with the highest effective accuracy (90%). Unlike the trade-off between timing and accuracy observed in A+ vs. B, CBM faces no trade-off: the assessments are fast to administer, produce immediate results, and test criterion-referenced skills rather than norm-referenced rankings.

The additional contribution of CBM's criterion-referenced actionability is visible in the intervention quality channel. When a coordinator knows that a student is "missing fraction operations from 4th grade," the resulting intervention is more targeted than when the data says "student is at the 32nd percentile." The simulation models this as a 15% boost to intervention effectiveness for fully actionable data, contributing approximately 1 percentage point to the final proficiency difference between C and D.

### 4.5 The Reinforcing Cycle: Empirical Evidence

The simulation provides direct evidence for the reinforcing cycle hypothesis:

**Scenario A (Traditional):**
- 54% of students are misplaced → teacher differentiation burden is maximal
- LP students grow at 0.6x rate when misplaced → stagnation
- 84% of LP students remain below grade level at year end → SPED referral risk
- Differentiation waste compounds: quality drops for ALL students, not just those misplaced

**Scenario D (CBM Diagnostic):**
- 1% differentiation load → teacher can focus instruction at the correct level
- LP students grow at 1.3x rate when correctly placed → accelerated catch-up
- 45% of LP students remain below grade level (still significant — one year of correct placement is necessary but not sufficient for students 2+ years behind)
- SPED referral risk reduced from 84% to 45% — a 39 percentage point reduction in unnecessary evaluations

### 4.6 The Limited Prerequisites Population

Across all scenarios, 200 of 500 students (40% of total, 80% of Level 1/2) are identified as having limited prerequisites. The root cause distribution remains constant:

| Root Cause | Count | Share | Implication for Placement |
|-----------|-------|-------|--------------------------|
| Student mobility | 51 | 26% | Specific content gaps from curriculum sequence misalignment |
| Chronic absence | 45 | 22% | Exact instructional units missed during absence periods |
| Ineffective prior instruction | 30 | 15% | Skills taught but never mastered — need explicit reteaching |
| English Learner status | 29 | 14% | Language barriers masking content knowledge |
| Cumulative summer loss | 25 | 12% | Skill decay patterns across multiple years |
| No pre-kindergarten | 14 | 7% | Foundational gaps in number sense and literacy |
| Curriculum misalignment | 6 | 3% | Standards that do not map between prior and current school |

The critical observation is that none of these root causes are cognitive disabilities. Every LP student in the model has typical cognitive capacity — they simply lack specific prerequisite skills that, when correctly identified and addressed, produce accelerated growth.

---

## 5. Discussion

### 5.1 Implications for Charter School Accountability

For charter schools operating under accountability frameworks that weight proficiency (typically 80%) and growth (20%), the simulation results translate directly to school performance grades. The 18 percentage point proficiency swing between Scenario A (59%, grade D) and Scenario D (77%, grade B) represents the difference between a school facing non-renewal and a school demonstrating strong performance.

Importantly, this swing is achieved without changing the student population, the curriculum, or the teaching staff. The intervention is entirely in the quality of diagnostic data informing placement decisions and the structural commitment to flexible grouping.

### 5.2 Implications for SPED Referral Reduction

The reduction in SPED referral risk from 84% to 45% of LP students has significant resource implications. In a school of 500 students with 200 LP students, the traditional model would place approximately 168 students on a SPED evaluation trajectory. With CBM-informed placement, that number drops to 90 — a reduction of 78 potential evaluations. Given that each SPED evaluation requires 30-60 hours of professional time (psychologist, special educator, administration), this represents a substantial reallocation of resources from evaluation to instruction.

### 5.3 Implications for Data-Driven Early Warning Systems

Platforms like EduNode Analytics operate at the screener level (Scenarios B/C), identifying who is at risk using attendance, grades, and assessment data. The simulation suggests that the next frontier in early warning system design is **root cause contextualization** — moving from "this student is at-risk" to "this student is at-risk because of [specific exposure gap], which is consistent with [mobility/absence/EL] patterns, and research suggests [specific remediation strategy]."

This does not require schools to administer a separate CBM diagnostic. If the early warning system can detect patterns consistent with specific root causes — for example, correlating a student's risk flag with enrollment history (mobility), attendance records (chronic absence), or EL classification — it can approximate CBM-level placement intelligence through data pattern recognition.

### 5.4 Limitations

Several limitations should be noted:

1. **Growth multipliers are estimated, not empirically derived.** The 1.3x and 0.6x multipliers for LP students are model calibration parameters. While the direction is consistent with research on the impact of instructional match, the precise magnitudes require empirical validation.

2. **CBM motivation noise is estimated.** No direct research quantifies the motivation effect specifically for CBM probes compared to longer assessments. The near-zero estimate is based on structural argument (short duration, teacher administration), not experimental evidence.

3. **The model assumes static student populations.** Real schools experience mid-year enrollment changes, teacher turnover, and evolving student needs that the simulation does not capture.

4. **Classroom quality is simplified.** The model uses a single quality parameter per scenario; real classrooms vary substantially in instructional quality, teacher skill, and student-teacher relationships.

5. **The LP percentage (80%) is a research-informed estimate.** While consistent with literature on SPED over-identification, the precise proportion will vary by school demographics and context.

6. **The simulation does not model student behavior or socio-emotional factors**, which can independently affect both assessment performance and intervention response.

### 5.5 Future Research Directions

Several extensions of this work are warranted:

1. **Empirical validation** of the growth multiplier parameters using longitudinal student data from schools implementing flexible grouping with and without CBM diagnostics.
2. **Sensitivity analysis** across the LP percentage parameter to determine at what threshold the findings hold.
3. **Multi-year simulation** to model cumulative effects of correct placement over 2-3 years, which the research suggests is the timeline for LP students to close gaps fully.
4. **Integration with real school data** through platforms like EduNode Analytics, which could provide the observational data needed to calibrate and validate model parameters.
5. **Cost-benefit analysis** comparing the cost of implementing CBM diagnostics against the savings from reduced differentiation burden, fewer SPED referrals, and improved accountability outcomes.

---

## 6. Conclusion

This paper demonstrates through simulation that the quality of diagnostic data informing student placement decisions is a primary — and modifiable — driver of school performance outcomes. The reinforcing cycle of misplacement, overdifferentiation, and MTSS ineffectiveness is not inevitable; it can be broken at the placement decision point through better data.

Three findings stand out. First, the structural decision to implement flexible grouping by skill level is the largest single lever available to school leaders, producing a 14-point proficiency gain even with imprecise placement data. Second, the timing of placement data matters as much as its accuracy — schools using stale data may be inadvertently choosing delay over precision when immediate, imprecise action would yield better outcomes. Third, curriculum-based measurement diagnostics represent the gold standard by optimizing on both dimensions simultaneously: highest accuracy, shortest delay, lowest motivation contamination, and full criterion-referenced actionability.

For the 80% of below-grade-level students who have exposure gaps rather than cognitive deficits, correct placement is not merely beneficial — it is transformative. These students grow at 1.3x the rate of their peers when correctly placed, closing gaps that might otherwise lead to years of remediation, unnecessary SPED referrals, and ultimately, a failure of the educational system to recognize that the problem was never the student's capacity but the system's ability to identify and address specific prerequisite gaps.

Charter schools, with their accountability pressures and limited resources, are the ideal testing ground for these findings. An 18 percentage point proficiency swing — from a D to a B — is the difference between a school fighting for survival and a school demonstrating the model that others should replicate.

---

## References

Deno, S. L. (2003). Developments in curriculum-based measurement. *Journal of Special Education*, 37(3), 184-192.

Eckert, T. L., Dunn, E. K., Codding, R. S., Begeny, J. C., & Kleinmann, A. E. (2006). Assessment of mathematics and reading performance: An examination of the correspondence between direct assessment of student performance and teacher report. *Psychology in the Schools*, 43(3), 247-265.

Liu, O. L., Bridgeman, B., & Adler, R. M. (2012). Measuring learning outcomes in higher education: Motivation matters. *Educational Researcher*, 41(9), 352-362.

Marston, D. (1989). A curriculum-based measurement approach to assessing academic performance: What it is and why do it. In M. R. Shinn (Ed.), *Curriculum-based measurement: Assessing special children* (pp. 18-78). New York: Guilford Press.

McGlinchey, M. T., & Hixson, M. D. (2004). Using curriculum-based measurement to predict performance on state assessments in reading. *School Psychology Review*, 33(2), 193-203.

NWEA. (2024). *Guidance for administering MAP Growth assessments to improve measurement*. Portland, OR: NWEA.

Reschly, A. L., Busch, T. W., Betts, J., Deno, S. L., & Long, J. D. (2009). Curriculum-based measurement oral reading as an indicator of reading achievement: A meta-analysis of the correlational evidence. *Journal of School Psychology*, 47(6), 427-462.

Shapiro, E. S., & Gebhardt, S. N. (2012). Comparing computer-adaptive and curriculum-based measurement methods of assessment. *School Psychology Review*, 41(3), 295-305.

Wise, S. L., & DeMars, C. E. (2005). Low examinee effort in low-stakes assessment: Problems and potential solutions. *Educational Assessment*, 10(1), 1-17.

---

## Appendix A: Simulation Code

The complete simulation code is available in the research repository at:  
`research/simulations/mtss_simulator.py`

The interactive Streamlit dashboard allows parameter adjustment and scenario comparison.

## Appendix B: Parameter Source Table

| Parameter | Value | Source | Grounding |
|-----------|-------|--------|-----------|
| Screener Sensitivity | 54.9% | NC high school study | Research |
| Screener Specificity | 96.7% | NC high school study | Research |
| Screener Validity (general) | r = 0.51 | 2025 meta-analysis (127 studies) | Research |
| Low-stakes Motivation Effect | d = 0.59 | Wise & DeMars (2005) | Research |
| Stakes Manipulation Effect | d = 0.41 | Liu, Bridgeman & Adler (2012) | Research |
| CBM Validity | r = 0.67+ | McGlinchey & Hixson (2004) | Research |
| CBM Probe Duration | 1-3 minutes | Deno (2003) | Research |
| MAP BOY Window | Week 4 | NWEA administration guidance | Research |
| MAP Results Available | 24 hours | NWEA documentation | Research |
| State EOG Results Lag | 3+ months | NWEA FAQ | Research |
| Teacher Judgment (Math) | r = 0.09-0.32 | Eckert et al. (2006) | Research |
| Intervention Min Duration | 10 weeks, 7-10 data points | NC MTSS guidance | Research |
| Counselor Ratio | 477:1 national avg | ASCA data | Research |
| LP % of Level 1/2 | 80% | SPED referral literature | Informed Estimate |
| LP Growth Boost (correct) | 1.3x | Model calibration | Estimate |
| LP Misplacement Penalty | 0.6x | Model calibration | Estimate |
| CBM Motivation Noise | ~2% | Structural argument | Estimate |
| Teacher Judgment Accuracy | ~50% | Derived from r = 0.09-0.32 | Derived Estimate |
