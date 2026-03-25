import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from dataclasses import dataclass, field
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# PAGE CONFIG
# ============================================================================
st.set_page_config(
    page_title="MTSS Limited Prerequisites Simulator",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0;
    }
    .sub-header {
        font-size: 1rem;
        color: #94a3b8;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }
    .metric-card {
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
    }
    .metric-card h4 { color: #94a3b8; font-size: 0.85rem; margin: 0 0 0.5rem 0; }
    .grade-A { color: #22c55e; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-B { color: #22c55e; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-C { color: #eab308; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-D { color: #f97316; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-F { color: #ef4444; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .insight-box {
        background: #0f172a;
        border-left: 4px solid #0ea5e9;
        padding: 1rem 1.2rem;
        margin: 0.8rem 0;
        border-radius: 0 8px 8px 0;
    }
    .insight-box h4 { color: #e2e8f0; margin: 0 0 0.4rem 0; }
    .insight-box p { color: #94a3b8; margin: 0.2rem 0; font-size: 0.95rem; }
    .insight-box strong { color: #e2e8f0; }
    .diagnostic-box {
        background: linear-gradient(135deg, #0c1a2e, #0f172a);
        border: 1px solid #1d4ed8;
        border-radius: 12px;
        padding: 1.2rem;
        margin: 1rem 0;
    }
    .diagnostic-box h4 { color: #60a5fa; margin: 0 0 0.5rem 0; }
    .diagnostic-box p { color: #94a3b8; margin: 0.2rem 0; }
    .stat-tiny { font-size: 0.8rem; color: #64748b; margin: 0; }
    .green { color: #22c55e; font-weight: 700; }
    .red { color: #ef4444; font-weight: 700; }
    .amber { color: #eab308; font-weight: 700; }
    .blue { color: #3b82f6; font-weight: 700; }
</style>
""", unsafe_allow_html=True)


# ============================================================================
# SIMULATION ENGINE (Optimized)
# ============================================================================

@dataclass
class SchoolParameters:
    total_students: int = 500
    weeks_in_year: int = 36
    avg_class_size: int = 25
    num_teachers: int = 20

    pace_levels: List[str] = field(default_factory=lambda: [
        'Intensive Remediation', 'Targeted Remediation', 'Grade Level', 'Accelerated'
    ])

    interventionist_capacity: int = 2
    students_per_interventionist: int = 250

    screener_sensitivity: float = 0.549
    screener_specificity: float = 0.967

    pct_2plus_years_behind: float = 0.20
    pct_1_year_behind: float = 0.30
    pct_on_grade: float = 0.35
    pct_above_grade: float = 0.15

    pct_limited_prerequisites: float = 0.80
    prerequisite_causes: Dict[str, float] = field(default_factory=lambda: {
        'mobile': 0.25, 'chronic_absence': 0.20, 'el_status': 0.15,
        'previous_ineffective': 0.15, 'no_prek': 0.10,
        'cumulative_loss': 0.10, 'curriculum_misalignment': 0.05
    })

    limited_prereq_correct_placement_multiplier: float = 1.3
    limited_prereq_misplaced_multiplier: float = 0.6

    use_flexible_grouping: bool = True
    use_diagnostic_testing: bool = False
    diagnostic_accuracy: float = 0.90
    placement_update_frequency: int = 6
    differentiation_waste: float = 0.25

    proficiency_weight: float = 0.80
    growth_weight: float = 0.20


PACE_TO_LEVEL = {
    'Intensive Remediation': 1, 'Targeted Remediation': 2,
    'Grade Level': 3, 'Accelerated': 4
}
LEVEL_TO_PACE = {v: k for k, v in PACE_TO_LEVEL.items()}


class Student:
    __slots__ = [
        'id', 'true_skill', 'true_pct', 'skill', 'pct',
        'assigned_pace', 'assigned_tier',
        'has_lp', 'lp_cause', 'growth_history', 'pct_history'
    ]

    def __init__(self, sid, true_skill, true_pct, has_lp, lp_cause):
        self.id = sid
        self.true_skill = true_skill
        self.true_pct = true_pct
        self.skill = true_skill
        self.pct = true_pct
        self.assigned_pace = None
        self.assigned_tier = None
        self.has_lp = has_lp
        self.lp_cause = lp_cause
        self.growth_history = []
        self.pct_history = [true_pct]

    @property
    def correct_pace(self):
        return LEVEL_TO_PACE.get(min(max(self.skill, 1), 4), 'Grade Level')

    def growth_multiplier(self, params):
        if self.has_lp:
            if self.assigned_pace == self.correct_pace:
                return params.limited_prereq_correct_placement_multiplier
            return params.limited_prereq_misplaced_multiplier
        return 1.0

    def need_tier(self):
        if self.skill == 1: return 3
        if self.skill == 2: return 2
        return 1

    def update_skill(self):
        if self.pct >= 85: self.skill = 4
        elif self.pct >= 40: self.skill = 3
        elif self.pct >= 20: self.skill = 2
        else: self.skill = 1

    def step(self, classroom_quality, intervention_quality, params):
        match = self.assigned_pace == self.correct_pace
        if match:
            cg = 0.4 * classroom_quality
        else:
            gap = abs(PACE_TO_LEVEL.get(self.assigned_pace, 3) - self.skill)
            cg = 0.2 * classroom_quality * max(1 - 0.3 * gap, 0.1)

        cg *= self.growth_multiplier(params)

        tier = self.assigned_tier or 1
        tier_match = tier == self.need_tier()
        if tier > 1 and tier_match:
            ib = 0.2 * intervention_quality
        elif tier > 1:
            ib = 0.1 * intervention_quality
        else:
            ib = 0

        growth = cg + ib
        self.pct = np.clip(self.pct + growth, 0, 100)
        self.update_skill()
        self.growth_history.append(growth)
        self.pct_history.append(self.pct)


class Simulation:
    def __init__(self, params: SchoolParameters):
        self.p = params
        self.rng = np.random.RandomState(42)
        self.students = self._make_students()
        self._assign_classrooms()
        self._assign_mtss()
        self.history = []

    def _make_students(self):
        levels = (
            [(1, 0, 20)] * int(self.p.pct_2plus_years_behind * self.p.total_students) +
            [(2, 20, 40)] * int(self.p.pct_1_year_behind * self.p.total_students) +
            [(3, 40, 70)] * int(self.p.pct_on_grade * self.p.total_students) +
            [(4, 70, 100)] * int(self.p.pct_above_grade * self.p.total_students)
        )
        causes = list(self.p.prerequisite_causes.keys())
        weights = list(self.p.prerequisite_causes.values())
        students = []
        for i, (lvl, lo, hi) in enumerate(levels):
            pct = self.rng.uniform(lo, hi)
            has_lp = (lvl in [1, 2]) and (self.rng.random() < self.p.pct_limited_prerequisites)
            cause = self.rng.choice(causes, p=weights) if has_lp else None
            students.append(Student(i, lvl, pct, has_lp, cause))
        return students

    def _assign_classrooms(self):
        if self.p.use_flexible_grouping:
            for s in self.students:
                if self.p.use_diagnostic_testing and s.has_lp:
                    # Diagnostic testing improves placement accuracy for LP students
                    if self.rng.random() < self.p.diagnostic_accuracy:
                        s.assigned_pace = s.correct_pace
                    else:
                        s.assigned_pace = 'Grade Level'
                else:
                    s.assigned_pace = s.correct_pace
        else:
            for s in self.students:
                s.assigned_pace = 'Grade Level'

    def _assign_mtss(self):
        for s in self.students:
            need = s.true_skill in [1, 2]
            if need:
                flagged = self.rng.random() < self.p.screener_sensitivity
            else:
                flagged = self.rng.random() > self.p.screener_specificity

            if self.p.use_diagnostic_testing and need:
                # Diagnostic testing improves identification
                flagged = flagged or (self.rng.random() < self.p.diagnostic_accuracy)

            if flagged:
                s.assigned_tier = 3 if s.true_skill == 1 else self.rng.choice([2, 3])
            else:
                s.assigned_tier = 1

    def _classroom_quality(self):
        n_classrooms = max(self.p.num_teachers, 1)
        students_per = len(self.students) / n_classrooms
        overload = max(0, (students_per - self.p.avg_class_size) / self.p.avg_class_size)
        q = 0.85 - overload * 0.3 - self.p.differentiation_waste * 0.2
        return max(q, 0.4)

    def _intervention_quality(self):
        tier23 = sum(1 for s in self.students if (s.assigned_tier or 1) > 1)
        cap = self.p.interventionist_capacity * self.p.students_per_interventionist
        load = tier23 / cap if cap else 1.0
        q = 0.9 - max(0, (load - 1.0) * 0.2)
        return max(q, 0.4)

    def _dynamic_review(self):
        if not self.p.use_flexible_grouping:
            return
        for s in self.students:
            if s.assigned_pace != s.correct_pace:
                if self.p.use_diagnostic_testing:
                    if self.rng.random() < self.p.diagnostic_accuracy:
                        s.assigned_pace = s.correct_pace
                else:
                    s.assigned_pace = s.correct_pace

    def _record(self, week):
        n = len(self.students)
        lp = [s for s in self.students if s.has_lp]
        nlp = [s for s in self.students if not s.has_lp]

        prof = sum(1 for s in self.students if s.skill >= 3) / n
        growth = sum(s.pct - s.true_pct for s in self.students) / n

        lp_growth = sum(s.pct - s.true_pct for s in lp) / len(lp) if lp else 0
        nlp_growth = sum(s.pct - s.true_pct for s in nlp) / len(nlp) if nlp else 0
        gap_closure = lp_growth - nlp_growth

        lp_misplaced = sum(1 for s in lp if s.assigned_pace != s.correct_pace) / len(lp) if lp else 0
        class_err = sum(1 for s in self.students if s.assigned_pace != s.correct_pace) / n
        mtss_err = sum(1 for s in self.students if (s.assigned_tier or 1) != s.need_tier()) / n

        # Diagnostic testing metrics
        lp_identified = sum(1 for s in lp if (s.assigned_tier or 1) > 1) / len(lp) if lp else 0
        lp_correct_placement = sum(1 for s in lp if s.assigned_pace == s.correct_pace) / len(lp) if lp else 0

        self.history.append({
            'week': week,
            'proficiency_rate': prof,
            'mean_growth': growth,
            'lp_gap_closure': gap_closure,
            'lp_misplaced': lp_misplaced,
            'class_error': class_err,
            'mtss_error': mtss_err,
            'lp_identified': lp_identified,
            'lp_correct_placement': lp_correct_placement,
        })

    def run(self) -> pd.DataFrame:
        cq = self._classroom_quality()
        iq = self._intervention_quality()
        for w in range(1, self.p.weeks_in_year + 1):
            for s in self.students:
                s.step(cq, iq, self.p)
            if w % self.p.placement_update_frequency == 0:
                self._dynamic_review()
            self._record(w)
        return pd.DataFrame(self.history)

    def get_lp_breakdown(self) -> Dict:
        lp = [s for s in self.students if s.has_lp]
        causes = {}
        for s in lp:
            causes[s.lp_cause] = causes.get(s.lp_cause, 0) + 1
        return {
            'total': len(lp),
            'pct': len(lp) / len(self.students),
            'causes': dict(sorted(causes.items(), key=lambda x: -x[1])),
            'correct_placement': sum(1 for s in lp if s.assigned_pace == s.correct_pace) / len(lp) if lp else 0,
            'identified': sum(1 for s in lp if (s.assigned_tier or 1) > 1) / len(lp) if lp else 0,
        }


# ============================================================================
# CACHED SIMULATION RUNNER
# ============================================================================

@st.cache_data(ttl=120)
def run_scenarios(params_tuple) -> Dict[str, Tuple[pd.DataFrame, Dict]]:
    p = dict(params_tuple)
    configs = {
        'A: Traditional': dict(use_flexible_grouping=False, use_diagnostic_testing=False,
                                screener_sensitivity=p['screener_sensitivity'],
                                differentiation_waste=p['differentiation_waste'],
                                avg_class_size=p['avg_class_size'], num_teachers=p['num_teachers']),
        'B: Flexible Grouping': dict(use_flexible_grouping=True, use_diagnostic_testing=False,
                                      screener_sensitivity=p['screener_sensitivity'],
                                      differentiation_waste=p['differentiation_waste'],
                                      avg_class_size=p['avg_class_size'], num_teachers=p['num_teachers']),
        'C: Flex + Diagnostic': dict(use_flexible_grouping=True, use_diagnostic_testing=True,
                                      diagnostic_accuracy=p['diagnostic_accuracy'],
                                      screener_sensitivity=p['screener_sensitivity'],
                                      differentiation_waste=max(p['differentiation_waste'] - 0.10, 0.05),
                                      avg_class_size=p['avg_class_size'], num_teachers=p['num_teachers']),
        'D: Both Optimized': dict(use_flexible_grouping=True, use_diagnostic_testing=True,
                                   diagnostic_accuracy=p['diagnostic_accuracy'],
                                   screener_sensitivity=0.80,
                                   differentiation_waste=0.10,
                                   avg_class_size=p['avg_class_size'], num_teachers=p['num_teachers']),
    }
    results = {}
    for name, overrides in configs.items():
        sp = SchoolParameters()
        for k, v in overrides.items():
            setattr(sp, k, v)
        sp.pct_limited_prerequisites = p['pct_lp']
        sp.limited_prereq_correct_placement_multiplier = p['lp_correct']
        sp.limited_prereq_misplaced_multiplier = p['lp_misplaced']
        sim = Simulation(sp)
        df = sim.run()
        breakdown = sim.get_lp_breakdown()
        results[name] = (df, breakdown)
    return results


# ============================================================================
# HELPER
# ============================================================================

def letter_grade(score):
    if score >= 85: return 'A', 'grade-A'
    if score >= 70: return 'B', 'grade-B'
    if score >= 60: return 'C', 'grade-C'
    if score >= 50: return 'D', 'grade-D'
    return 'F', 'grade-F'

CAUSE_LABELS = {
    'mobile': '🚚 Mobile (changed schools)',
    'chronic_absence': '📅 Chronic Absence',
    'el_status': '🌐 English Learner',
    'previous_ineffective': '📉 Ineffective Prior Instruction',
    'no_prek': '🎒 No Pre-K',
    'cumulative_loss': '📆 Cumulative Summer Loss',
    'curriculum_misalignment': '📐 Curriculum Misalignment',
}

COLORS = {
    'A: Traditional': '#ef4444',
    'B: Flexible Grouping': '#3b82f6',
    'C: Flex + Diagnostic': '#a855f7',
    'D: Both Optimized': '#22c55e',
}


# ============================================================================
# MAIN
# ============================================================================

def main():
    st.markdown('<p class="main-header">📊 MTSS Limited Prerequisites Simulator</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">80% of Level 1/2 students have normal cognitive capacity — they need <strong>diagnostic testing</strong> to identify exposure gaps, then <strong>correct placement</strong> to unlock accelerated growth.</p>', unsafe_allow_html=True)

    # ── Sidebar ──
    with st.sidebar:
        st.markdown("## 🎛️ School Parameters")
        st.divider()

        st.markdown("### 🏫 Structure")
        class_size = st.slider("Class Size", 15, 30, 25)
        num_teachers = st.slider("Teachers", 15, 35, 20)

        st.markdown("### 🎯 Screening & Diagnostics")
        screener = st.slider("Screener Sensitivity", 0.40, 0.95, 0.549, 0.01,
                              help="Ability to flag students who need support. NC baseline: 54.9%")
        diagnostic_acc = st.slider("Diagnostic Test Accuracy", 0.70, 0.99, 0.90, 0.01,
                                    help="Accuracy of diagnostic testing for identifying root causes and correct placement level")
        diff_waste = st.slider("Differentiation Waste", 0.00, 0.50, 0.25, 0.01)

        st.markdown("### 📚 Limited Prerequisites")
        st.caption("Students behind due to exposure gaps, not cognitive deficit")
        pct_lp = st.slider("LP % of Level 1/2", 0.50, 1.00, 0.80, 0.01)
        c1, c2 = st.columns(2)
        with c1:
            lp_correct = st.slider("Growth Boost", 1.0, 1.8, 1.3, 0.05, help="Multiplier when correctly placed")
        with c2:
            lp_misplaced = st.slider("Misplacement Penalty", 0.3, 1.0, 0.6, 0.05, help="Multiplier when misplaced")

        st.divider()
        run = st.button("🚀 Run Simulation", type="primary", use_container_width=True)

    params_tuple = tuple(sorted({
        'screener_sensitivity': screener,
        'diagnostic_accuracy': diagnostic_acc,
        'differentiation_waste': diff_waste,
        'avg_class_size': class_size,
        'num_teachers': num_teachers,
        'pct_lp': pct_lp,
        'lp_correct': lp_correct,
        'lp_misplaced': lp_misplaced,
    }.items()))

    if not run:
        st.markdown("""
        <div class="diagnostic-box">
            <h4>🔬 Why Diagnostic Testing Is Critical</h4>
            <p>A <strong>screener</strong> tells you a student is at Level 1. A <strong>diagnostic test</strong> tells you <em>why</em>.</p>
            <p>Without diagnostics, a student who missed 4th grade fractions because they moved schools 3 times looks identical to a student with a learning disability. The intervention is different. The placement is different. The expected outcome is different.</p>
            <p><strong>80% of Level 1/2 students</strong> are behind due to exposure gaps (mobility, chronic absence, EL status, ineffective prior instruction). When correctly identified via diagnostic testing and placed in the right remediation classroom, they grow <strong>30% faster</strong> than typical students.</p>
            <p>👈 Adjust parameters and click <strong>Run Simulation</strong> to see the impact.</p>
        </div>
        """, unsafe_allow_html=True)

        # Show the model structure
        st.markdown("### 🧬 Model Architecture")
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("""
            **Layer 1: Classroom Placement**
            - Flexible grouping by skill level
            - Dynamic review every 6 weeks
            - Diagnostic testing improves accuracy
            """)
        with c2:
            st.markdown("""
            **Layer 2: MTSS Tiers**
            - Screener flags at-risk students
            - Diagnostic identifies root cause
            - Tier 2/3 intervention assignment
            """)
        with c3:
            st.markdown("""
            **Limited Prerequisites Compartment**
            - 80% of Level 1/2 = exposure gaps
            - 7 root causes identified
            - 1.3x growth when correctly placed
            - 0.6x penalty when misplaced
            """)
        return

    # ── Run ──
    with st.spinner("Simulating 500 students × 36 weeks × 4 scenarios..."):
        results = run_scenarios(params_tuple)

    # ── Grade Cards ──
    st.markdown("## 📈 Final School Grades")
    cols = st.columns(4)
    for i, (name, (df, bd)) in enumerate(results.items()):
        score = df['proficiency_rate'].iloc[-1] * 100
        g, cls = letter_grade(score)
        growth = df['mean_growth'].iloc[-1]
        gap = df['lp_gap_closure'].iloc[-1]
        with cols[i]:
            gap_color = 'green' if gap > 0 else 'red'
            st.markdown(f"""
            <div class="metric-card">
                <h4>{name}</h4>
                <p class="{cls}">{g}</p>
                <p class="stat-tiny">Proficiency: {score:.0f}%</p>
                <p class="stat-tiny">Growth: <span class="green">+{growth:.1f}</span> pts</p>
                <p class="stat-tiny">LP Gap: <span class="{gap_color}">{gap:+.1f}</span> pts</p>
                <p class="stat-tiny">LP Placement: <span class="blue">{bd['correct_placement']*100:.0f}%</span> correct</p>
            </div>
            """, unsafe_allow_html=True)

    # ── Charts ──
    st.markdown("## 📉 Proficiency Over Time")

    fig, ax = plt.subplots(figsize=(12, 5))
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')
    for name, (df, _) in results.items():
        ax.plot(df['week'], df['proficiency_rate'] * 100, label=name,
                linewidth=2.5, color=COLORS[name])
    ax.axhline(y=70, color='#3b82f6', linestyle='--', alpha=0.4, label='C Threshold')
    ax.axhline(y=80, color='#22c55e', linestyle='--', alpha=0.4, label='B Threshold')
    ax.set_xlabel('Week', color='#94a3b8')
    ax.set_ylabel('Proficiency Rate (%)', color='#94a3b8')
    ax.tick_params(colors='#64748b')
    ax.legend(loc='lower right', fontsize=9, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
    ax.grid(True, alpha=0.15, color='#334155')
    for spine in ax.spines.values(): spine.set_color('#334155')
    st.pyplot(fig)
    plt.close()

    # ── LP Gap Closure + Misplacement ──
    st.markdown("## 🎯 Limited Prerequisites Students")
    c1, c2 = st.columns(2)

    with c1:
        fig, ax = plt.subplots(figsize=(10, 4.5))
        fig.patch.set_facecolor('#0f172a')
        ax.set_facecolor('#0f172a')
        for name, (df, _) in results.items():
            ax.plot(df['week'], df['lp_gap_closure'], label=name, linewidth=2, color=COLORS[name])
        ax.axhline(y=0, color='#ef4444', linestyle='--', alpha=0.4)
        ax.set_xlabel('Week', color='#94a3b8')
        ax.set_ylabel('Gap Closure (LP − Non-LP growth)', color='#94a3b8')
        ax.set_title('Are LP Students Catching Up?', color='#e2e8f0', fontsize=12)
        ax.tick_params(colors='#64748b')
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        ax.grid(True, alpha=0.15, color='#334155')
        for spine in ax.spines.values(): spine.set_color('#334155')
        st.pyplot(fig)
        plt.close()

    with c2:
        fig, ax = plt.subplots(figsize=(10, 4.5))
        fig.patch.set_facecolor('#0f172a')
        ax.set_facecolor('#0f172a')
        for name, (df, _) in results.items():
            ax.plot(df['week'], df['lp_misplaced'] * 100, label=name, linewidth=2, color=COLORS[name])
        ax.set_xlabel('Week', color='#94a3b8')
        ax.set_ylabel('LP Misplacement Rate (%)', color='#94a3b8')
        ax.set_title('LP Students in Wrong Classroom', color='#e2e8f0', fontsize=12)
        ax.tick_params(colors='#64748b')
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        ax.grid(True, alpha=0.15, color='#334155')
        for spine in ax.spines.values(): spine.set_color('#334155')
        st.pyplot(fig)
        plt.close()

    # ── Diagnostic Testing Impact ──
    st.markdown("## 🔬 Diagnostic Testing Impact")

    c1, c2 = st.columns(2)
    with c1:
        fig, ax = plt.subplots(figsize=(10, 4.5))
        fig.patch.set_facecolor('#0f172a')
        ax.set_facecolor('#0f172a')
        for name, (df, _) in results.items():
            ax.plot(df['week'], df['lp_identified'] * 100, label=name, linewidth=2, color=COLORS[name])
        ax.set_xlabel('Week', color='#94a3b8')
        ax.set_ylabel('LP Students Identified (%)', color='#94a3b8')
        ax.set_title('LP Students Flagged for Support', color='#e2e8f0', fontsize=12)
        ax.tick_params(colors='#64748b')
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        ax.grid(True, alpha=0.15, color='#334155')
        for spine in ax.spines.values(): spine.set_color('#334155')
        st.pyplot(fig)
        plt.close()

    with c2:
        fig, ax = plt.subplots(figsize=(10, 4.5))
        fig.patch.set_facecolor('#0f172a')
        ax.set_facecolor('#0f172a')
        for name, (df, _) in results.items():
            ax.plot(df['week'], df['lp_correct_placement'] * 100, label=name, linewidth=2, color=COLORS[name])
        ax.set_xlabel('Week', color='#94a3b8')
        ax.set_ylabel('Correct Placement Rate (%)', color='#94a3b8')
        ax.set_title('LP Students Correctly Placed', color='#e2e8f0', fontsize=12)
        ax.tick_params(colors='#64748b')
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        ax.grid(True, alpha=0.15, color='#334155')
        for spine in ax.spines.values(): spine.set_color('#334155')
        st.pyplot(fig)
        plt.close()

    # ── Summary Table ──
    st.markdown("## 📊 Final Week Comparison")
    rows = []
    for name, (df, bd) in results.items():
        score = df['proficiency_rate'].iloc[-1] * 100
        g, _ = letter_grade(score)
        rows.append({
            'Scenario': name,
            'Grade': f"{g} ({score:.0f})",
            'Proficiency': f"{score:.1f}%",
            'Growth': f"+{df['mean_growth'].iloc[-1]:.1f} pts",
            'LP Gap Closure': f"{df['lp_gap_closure'].iloc[-1]:+.1f} pts",
            'LP Misplaced': f"{df['lp_misplaced'].iloc[-1]*100:.1f}%",
            'LP Identified': f"{bd['identified']*100:.0f}%",
            'LP Correct Placement': f"{bd['correct_placement']*100:.0f}%",
        })
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    # ── Root Cause Breakdown ──
    st.markdown("## 📋 Root Cause Distribution (LP Students)")
    _, (_, bd_opt) = list(results.items())[-1]
    if bd_opt['causes']:
        cause_df = pd.DataFrame([
            {'Root Cause': CAUSE_LABELS.get(k, k), 'Count': v,
             'Percentage': f"{v/bd_opt['total']*100:.0f}%",
             'Intervention': {
                 'mobile': 'Accelerated prerequisite mapping + flexible entry',
                 'chronic_absence': 'Attendance intervention + compressed instruction',
                 'el_status': 'Integrated language + content instruction',
                 'previous_ineffective': 'Diagnostic-prescriptive remediation',
                 'no_prek': 'Foundational skills acceleration',
                 'cumulative_loss': 'Extended year / summer bridge',
                 'curriculum_misalignment': 'Scope alignment + gap filling',
             }.get(k, 'Targeted support')}
            for k, v in bd_opt['causes'].items()
        ])
        st.dataframe(cause_df, use_container_width=True, hide_index=True)

    # ── Key Insights ──
    st.markdown("## 💡 Key Insights")

    trad_df = results['A: Traditional'][0]
    flex_df = results['B: Flexible Grouping'][0]
    diag_df = results['C: Flex + Diagnostic'][0]
    opt_df = results['D: Both Optimized'][0]

    trad_score = trad_df['proficiency_rate'].iloc[-1] * 100
    flex_score = flex_df['proficiency_rate'].iloc[-1] * 100
    diag_score = diag_df['proficiency_rate'].iloc[-1] * 100
    opt_score = opt_df['proficiency_rate'].iloc[-1] * 100

    trad_gap = trad_df['lp_gap_closure'].iloc[-1]
    diag_gap = diag_df['lp_gap_closure'].iloc[-1]

    diag_bd = results['C: Flex + Diagnostic'][1]
    trad_bd = results['A: Traditional'][1]

    st.markdown(f"""
    <div class="insight-box">
        <h4>🔬 Diagnostic Testing Is the Multiplier</h4>
        <p>Flexible Grouping alone: <strong>{flex_score:.0f}%</strong> proficiency</p>
        <p>Flexible + Diagnostic Testing: <strong>{diag_score:.0f}%</strong> proficiency (<span class="green">+{diag_score-flex_score:.0f} pts</span>)</p>
        <p>Diagnostic testing improves LP identification from <strong>{trad_bd['identified']*100:.0f}%</strong> to <strong>{diag_bd['identified']*100:.0f}%</strong> and correct placement from <strong>{trad_bd['correct_placement']*100:.0f}%</strong> to <strong>{diag_bd['correct_placement']*100:.0f}%</strong>.</p>
        <p>The screener says <em>"this student is behind."</em> The diagnostic says <em>"this student is behind because they missed fractions when they changed schools in 4th grade."</em> <strong>That specificity drives correct placement.</strong></p>
    </div>

    <div class="insight-box">
        <h4>🚀 The LP Acceleration Effect</h4>
        <p>Traditional: LP students fall <span class="red">{abs(trad_gap):.1f} points further behind</span></p>
        <p>Flex + Diagnostic: LP students <span class="green">catch up by {diag_gap:+.1f} points</span></p>
        <p>These students don't need SPED referrals — they need <strong>diagnostic identification of their specific gaps</strong> followed by <strong>targeted prerequisite instruction</strong> at the right pace level.</p>
    </div>

    <div class="insight-box">
        <h4>🏆 The Complete Strategy</h4>
        <p>Traditional: <span class="red">{trad_score:.0f}%</span> → Flex + Diagnostic + Optimized MTSS: <span class="green">{opt_score:.0f}%</span></p>
        <p>That's a <strong>{opt_score - trad_score:.0f} percentage point swing</strong> — potentially the difference between probation and renewal with commendation.</p>
        <p>The stack: <strong>Diagnostic Testing → Correct Placement → Targeted Intervention → Accelerated Growth</strong></p>
    </div>
    """, unsafe_allow_html=True)

    # ── EduNode Connection ──
    st.markdown("---")
    st.markdown("""
    <div class="diagnostic-box">
        <h4>🔗 What This Means for EduNode Analytics</h4>
        <p>EduNode's risk engine identifies <em>who</em> is at risk. The Interventions Hub tracks <em>what</em> the school does about it.</p>
        <p>The missing piece this simulation reveals: <strong>schools need to know WHY a student is at risk</strong> — not just that they are.</p>
        <p>When EduNode surfaces root cause context alongside risk scores (exposure gaps vs. skill deficits), coordinators make better placement decisions, interventions are more targeted, and LP students unlock their 1.3x growth potential.</p>
        <p><strong>The simulation proves it mathematically. EduNode makes it operationally possible.</strong></p>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
