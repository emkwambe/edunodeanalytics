import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from dataclasses import dataclass, field
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings('ignore')

st.set_page_config(page_title="MTSS Limited Prerequisites Simulator", page_icon="📊", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
<style>
    .main-header { font-size: 2.2rem; font-weight: 700; background: linear-gradient(135deg, #0ea5e9, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0; }
    .sub-header { font-size: 1rem; color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.5; }
    .metric-card { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 12px; padding: 1.2rem; text-align: center; }
    .metric-card h4 { color: #94a3b8; font-size: 0.85rem; margin: 0 0 0.5rem 0; }
    .grade-A { color: #22c55e; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-B { color: #22c55e; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-C { color: #eab308; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-D { color: #f97316; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .grade-F { color: #ef4444; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .insight-box { background: #0f172a; border-left: 4px solid #0ea5e9; padding: 1rem 1.2rem; margin: 0.8rem 0; border-radius: 0 8px 8px 0; }
    .insight-box h4 { color: #e2e8f0; margin: 0 0 0.4rem 0; }
    .insight-box p { color: #94a3b8; margin: 0.2rem 0; font-size: 0.95rem; }
    .insight-box strong { color: #e2e8f0; }
    .diagnostic-box { background: linear-gradient(135deg, #0c1a2e, #0f172a); border: 1px solid #1d4ed8; border-radius: 12px; padding: 1.2rem; margin: 1rem 0; }
    .diagnostic-box h4 { color: #60a5fa; margin: 0 0 0.5rem 0; }
    .diagnostic-box p { color: #94a3b8; margin: 0.2rem 0; }
    .hierarchy-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 0.8rem 1rem; margin: 0.3rem 0; }
    .hierarchy-box .rank { font-size: 1.4rem; font-weight: 800; }
    .stat-tiny { font-size: 0.8rem; color: #64748b; margin: 0; }
    .green { color: #22c55e; font-weight: 700; }
    .red { color: #ef4444; font-weight: 700; }
    .amber { color: #eab308; font-weight: 700; }
    .blue { color: #3b82f6; font-weight: 700; }
    .purple { color: #a855f7; font-weight: 700; }
</style>
""", unsafe_allow_html=True)

PACE_TO_LEVEL = {'Intensive Remediation': 1, 'Targeted Remediation': 2, 'Grade Level': 3, 'Accelerated': 4}
LEVEL_TO_PACE = {v: k for k, v in PACE_TO_LEVEL.items()}

@dataclass
class SchoolParameters:
    total_students: int = 500
    weeks_in_year: int = 36
    avg_class_size: int = 25
    num_teachers: int = 20
    pace_levels: List[str] = field(default_factory=lambda: ['Intensive Remediation', 'Targeted Remediation', 'Grade Level', 'Accelerated'])
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
    placement_strategy: str = 'none'
    placement_accuracy: float = 0.0
    mtss_identification_boost: float = 0.0
    placement_update_frequency: int = 6
    differentiation_waste: float = 0.25
    proficiency_weight: float = 0.80
    growth_weight: float = 0.20

class Student:
    __slots__ = ['id','true_skill','true_pct','skill','pct','assigned_pace','assigned_tier','has_lp','lp_cause','growth_history','pct_history']
    def __init__(self, sid, true_skill, true_pct, has_lp, lp_cause):
        self.id = sid; self.true_skill = true_skill; self.true_pct = true_pct
        self.skill = true_skill; self.pct = true_pct
        self.assigned_pace = None; self.assigned_tier = None
        self.has_lp = has_lp; self.lp_cause = lp_cause
        self.growth_history = []; self.pct_history = [true_pct]
    @property
    def correct_pace(self):
        return LEVEL_TO_PACE.get(min(max(self.skill, 1), 4), 'Grade Level')
    def growth_multiplier(self, params):
        if self.has_lp:
            return params.limited_prereq_correct_placement_multiplier if self.assigned_pace == self.correct_pace else params.limited_prereq_misplaced_multiplier
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
    def step(self, cq, iq, params):
        match = self.assigned_pace == self.correct_pace
        if match: cg = 0.4 * cq
        else:
            gap = abs(PACE_TO_LEVEL.get(self.assigned_pace, 3) - self.skill)
            cg = 0.2 * cq * max(1 - 0.3 * gap, 0.1)
        cg *= self.growth_multiplier(params)
        tier = self.assigned_tier or 1
        if tier > 1 and tier == self.need_tier(): ib = 0.2 * iq
        elif tier > 1: ib = 0.1 * iq
        else: ib = 0
        growth = cg + ib
        self.pct = np.clip(self.pct + growth, 0, 100)
        self.update_skill()
        self.growth_history.append(growth)
        self.pct_history.append(self.pct)

class Simulation:
    def __init__(self, params):
        self.p = params; self.rng = np.random.RandomState(42)
        self.students = self._make_students()
        self._assign_classrooms(); self._assign_mtss(); self.history = []
    def _make_students(self):
        levels = ([(1,0,20)]*int(self.p.pct_2plus_years_behind*self.p.total_students)+
                  [(2,20,40)]*int(self.p.pct_1_year_behind*self.p.total_students)+
                  [(3,40,70)]*int(self.p.pct_on_grade*self.p.total_students)+
                  [(4,70,100)]*int(self.p.pct_above_grade*self.p.total_students))
        causes = list(self.p.prerequisite_causes.keys())
        weights = list(self.p.prerequisite_causes.values())
        students = []
        for i,(lvl,lo,hi) in enumerate(levels):
            pct = self.rng.uniform(lo, hi)
            has_lp = (lvl in [1,2]) and (self.rng.random() < self.p.pct_limited_prerequisites)
            cause = self.rng.choice(causes, p=weights) if has_lp else None
            students.append(Student(i, lvl, pct, has_lp, cause))
        return students
    def _noisy_placement(self, s):
        if self.p.placement_strategy == 'none': return 'Grade Level'
        if self.rng.random() < self.p.placement_accuracy: return s.correct_pace
        true_level = s.skill
        if true_level < 3: misplaced = min(true_level + 1, 3)
        elif true_level > 3: misplaced = max(true_level - 1, 3)
        else: misplaced = 3
        return LEVEL_TO_PACE.get(misplaced, 'Grade Level')
    def _assign_classrooms(self):
        for s in self.students: s.assigned_pace = self._noisy_placement(s)
    def _assign_mtss(self):
        eff = min(self.p.screener_sensitivity + self.p.mtss_identification_boost, 0.98)
        for s in self.students:
            need = s.true_skill in [1,2]
            flagged = self.rng.random() < eff if need else self.rng.random() > self.p.screener_specificity
            if flagged: s.assigned_tier = 3 if s.true_skill == 1 else self.rng.choice([2,3])
            else: s.assigned_tier = 1
    def _cq(self):
        spc = len(self.students)/max(self.p.num_teachers,1)
        ol = max(0,(spc-self.p.avg_class_size)/self.p.avg_class_size)
        return max(0.85-ol*0.3-self.p.differentiation_waste*0.2, 0.4)
    def _iq(self):
        t23 = sum(1 for s in self.students if (s.assigned_tier or 1)>1)
        cap = self.p.interventionist_capacity*self.p.students_per_interventionist
        load = t23/cap if cap else 1.0
        return max(0.9-max(0,(load-1.0)*0.2), 0.4)
    def _dynamic_review(self):
        if self.p.placement_strategy == 'none': return
        for s in self.students:
            if s.assigned_pace != s.correct_pace:
                if self.rng.random() < self.p.placement_accuracy: s.assigned_pace = s.correct_pace
    def _record(self, week):
        n = len(self.students)
        lp = [s for s in self.students if s.has_lp]
        nlp = [s for s in self.students if not s.has_lp]
        prof = sum(1 for s in self.students if s.skill >= 3)/n
        growth = sum(s.pct-s.true_pct for s in self.students)/n
        lp_g = sum(s.pct-s.true_pct for s in lp)/len(lp) if lp else 0
        nlp_g = sum(s.pct-s.true_pct for s in nlp)/len(nlp) if nlp else 0
        self.history.append({
            'week': week, 'proficiency_rate': prof, 'mean_growth': growth,
            'lp_gap_closure': lp_g - nlp_g,
            'lp_misplaced': sum(1 for s in lp if s.assigned_pace!=s.correct_pace)/len(lp) if lp else 0,
            'class_error': sum(1 for s in self.students if s.assigned_pace!=s.correct_pace)/n,
            'mtss_error': sum(1 for s in self.students if (s.assigned_tier or 1)!=s.need_tier())/n,
            'lp_identified': sum(1 for s in lp if (s.assigned_tier or 1)>1)/len(lp) if lp else 0,
            'lp_correct_placement': sum(1 for s in lp if s.assigned_pace==s.correct_pace)/len(lp) if lp else 0,
        })
    def run(self):
        cq, iq = self._cq(), self._iq()
        for w in range(1, self.p.weeks_in_year+1):
            for s in self.students: s.step(cq, iq, self.p)
            if w % self.p.placement_update_frequency == 0: self._dynamic_review()
            self._record(w)
        return pd.DataFrame(self.history)
    def get_lp_breakdown(self):
        lp = [s for s in self.students if s.has_lp]
        causes = {}
        for s in lp: causes[s.lp_cause] = causes.get(s.lp_cause, 0) + 1
        return {
            'total': len(lp), 'pct': len(lp)/len(self.students),
            'causes': dict(sorted(causes.items(), key=lambda x: -x[1])),
            'correct_placement': sum(1 for s in lp if s.assigned_pace==s.correct_pace)/len(lp) if lp else 0,
            'identified': sum(1 for s in lp if (s.assigned_tier or 1)>1)/len(lp) if lp else 0,
        }

SCENARIO_CONFIGS = {
    'A: Traditional': dict(label='No Grouping (Traditional)', desc='Everyone in grade-level. Screener flags some for MTSS.', placement_strategy='none', placement_accuracy=0.0, mtss_boost=0.0, waste=0.25, data_src='None — grade-level for all'),
    'B: Lagged Data': dict(label='Prior EOG + Grades (~70%)', desc='Last year\'s state test + current grades. 6-12 months stale.', placement_strategy='lagged', placement_accuracy=0.70, mtss_boost=0.05, waste=0.20, data_src='Prior year EOG, course grades, teacher rec'),
    'C: Universal Screener': dict(label='MAP / iReady Screener (~80%)', desc='Current-year normed snapshot. Tells you "Level 2" not "missing which skills."', placement_strategy='screener', placement_accuracy=0.80, mtss_boost=0.15, waste=0.15, data_src='Universal screener — current year'),
    'D: CBM Diagnostic': dict(label='Curriculum-Based Measures (~92%)', desc='Tests actual scope & sequence. "Missing fraction operations from 4th grade."', placement_strategy='cbm', placement_accuracy=0.92, mtss_boost=0.25, waste=0.10, data_src='CBM — tests specific prerequisite skills'),
}
COLORS = {'A: Traditional': '#ef4444', 'B: Lagged Data': '#f97316', 'C: Universal Screener': '#a855f7', 'D: CBM Diagnostic': '#22c55e'}
CAUSE_LABELS = {'mobile': '🚚 Mobile (changed schools)', 'chronic_absence': '📅 Chronic Absence', 'el_status': '🌐 English Learner', 'previous_ineffective': '📉 Ineffective Prior Instruction', 'no_prek': '🎒 No Pre-K', 'cumulative_loss': '📆 Cumulative Summer Loss', 'curriculum_misalignment': '📐 Curriculum Misalignment'}

def letter_grade(s):
    if s >= 85: return 'A','grade-A'
    if s >= 70: return 'B','grade-B'
    if s >= 60: return 'C','grade-C'
    if s >= 50: return 'D','grade-D'
    return 'F','grade-F'

@st.cache_data(ttl=120)
def run_scenarios(pt):
    p = dict(pt); results = {}
    for name, cfg in SCENARIO_CONFIGS.items():
        sp = SchoolParameters()
        sp.avg_class_size = p['avg_class_size']; sp.num_teachers = p['num_teachers']
        sp.screener_sensitivity = p['screener_sensitivity']
        sp.pct_limited_prerequisites = p['pct_lp']
        sp.limited_prereq_correct_placement_multiplier = p['lp_correct']
        sp.limited_prereq_misplaced_multiplier = p['lp_misplaced']
        sp.placement_strategy = cfg['placement_strategy']
        sp.mtss_identification_boost = cfg['mtss_boost']
        sp.differentiation_waste = cfg['waste']
        if name == 'B: Lagged Data': sp.placement_accuracy = p['lagged_acc']
        elif name == 'C: Universal Screener': sp.placement_accuracy = p['screener_acc']
        elif name == 'D: CBM Diagnostic': sp.placement_accuracy = p['cbm_acc']
        else: sp.placement_accuracy = cfg['placement_accuracy']
        sim = Simulation(sp); results[name] = (sim.run(), sim.get_lp_breakdown())
    return results

def dark_chart(figsize=(12,5)):
    fig, ax = plt.subplots(figsize=figsize)
    fig.patch.set_facecolor('#0f172a'); ax.set_facecolor('#0f172a')
    ax.tick_params(colors='#64748b'); ax.grid(True, alpha=0.15, color='#334155')
    for sp in ax.spines.values(): sp.set_color('#334155')
    return fig, ax

def main():
    st.markdown('<p class="main-header">📊 MTSS Limited Prerequisites Simulator</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Modeling the impact of <strong>diagnostic data quality</strong> on placement accuracy, student growth, and school performance.</p>', unsafe_allow_html=True)

    with st.sidebar:
        st.markdown("## 🎛️ Parameters"); st.divider()
        st.markdown("### 🏫 School")
        cs = st.slider("Class Size", 15, 30, 25)
        nt = st.slider("Teachers", 15, 35, 20)
        st.markdown("### 🎯 Base Screener")
        scr = st.slider("Sensitivity", 0.40, 0.95, 0.549, 0.01, help="NC baseline: 54.9%")
        st.markdown("### 📊 Placement Accuracy by Data Source")
        st.caption("How accurately each source identifies correct pace level")
        la = st.slider("B: Prior EOG + Grades", 0.50, 0.85, 0.70, 0.01)
        sa = st.slider("C: Universal Screener", 0.65, 0.90, 0.80, 0.01)
        ca = st.slider("D: CBM Diagnostic", 0.80, 0.98, 0.92, 0.01)
        st.markdown("### 📚 Limited Prerequisites")
        plp = st.slider("LP % of Level 1/2", 0.50, 1.00, 0.80, 0.01)
        c1,c2 = st.columns(2)
        with c1: lpc = st.slider("Growth Boost", 1.0, 1.8, 1.3, 0.05)
        with c2: lpm = st.slider("Misplace Pen.", 0.3, 1.0, 0.6, 0.05)
        st.divider()
        run = st.button("🚀 Run Simulation", type="primary", use_container_width=True)

    pt = tuple(sorted({'screener_sensitivity':scr,'avg_class_size':cs,'num_teachers':nt,'pct_lp':plp,'lp_correct':lpc,'lp_misplaced':lpm,'lagged_acc':la,'screener_acc':sa,'cbm_acc':ca}.items()))

    if not run:
        st.markdown("""<div class="diagnostic-box"><h4>🔬 Why Diagnostic Data Quality Matters</h4>
        <p>A <strong>screener</strong> tells you a student is at Level 1. A <strong>curriculum-based diagnostic</strong> tells you <em>why</em> — and that determines correct placement.</p>
        <p>You cannot group students by skill level without data about their skill level. The question is: <strong>how good is that data?</strong></p></div>""", unsafe_allow_html=True)
        st.markdown("### 📐 Data Quality Hierarchy")
        for rank, color, title, desc, detail in [
            ("1","#ef4444","No Data (Traditional)","Everyone in grade-level classes. ~0% placement accuracy.","Teacher gut feel, grade-level assumption"),
            ("2","#f97316","Lagged Data (Prior EOG + Grades)","6-12 months stale. ~70% accuracy.","Conflated with effort/homework. Doesn't distinguish exposure gaps from skill deficits."),
            ("3","#a855f7","Universal Screener (MAP/iReady/STAR)","Current-year normed snapshot. ~80% accuracy.","Identifies THAT a student is behind, not WHY."),
            ("4","#22c55e","Curriculum-Based Measures (CBM)","Tests actual scope & sequence. ~90-95% accuracy.","'Missing fraction operations from 4th grade' — drives correct placement AND targeted intervention."),
        ]:
            st.markdown(f'<div class="hierarchy-box"><span class="rank" style="color:{color};">{rank}</span> <strong style="color:#e2e8f0;">{title}</strong><p style="color:#94a3b8;margin:0.3rem 0 0.1rem 0;">{desc}</p><p style="color:#64748b;font-size:0.85rem;margin:0;">{detail}</p></div>', unsafe_allow_html=True)
        st.markdown(''); st.markdown("""<div class="insight-box"><h4>💡 The Key Insight</h4>
        <p><strong>80% of Level 1/2 students have normal cognitive capacity.</strong> They need diagnostic identification of specific gaps, then correct placement to unlock 1.3x growth.</p>
        <p>👈 Adjust parameters and click <strong>Run Simulation</strong>.</p></div>""", unsafe_allow_html=True)
        return

    with st.spinner("Simulating 500 students × 36 weeks × 4 scenarios..."):
        results = run_scenarios(pt)

    st.markdown("## 📈 Final School Grades")
    cols = st.columns(4)
    for i,(name,(df,bd)) in enumerate(results.items()):
        score = df['proficiency_rate'].iloc[-1]*100; g,cls = letter_grade(score)
        growth = df['mean_growth'].iloc[-1]; gap = df['lp_gap_closure'].iloc[-1]
        gc = 'green' if gap > 0 else 'red'
        with cols[i]:
            st.markdown(f'<div class="metric-card"><h4>{SCENARIO_CONFIGS[name]["label"]}</h4><p class="{cls}">{g}</p><p class="stat-tiny">Proficiency: {score:.0f}%</p><p class="stat-tiny">Growth: <span class="green">+{growth:.1f}</span> pts</p><p class="stat-tiny">LP Gap: <span class="{gc}">{gap:+.1f}</span> pts</p><p class="stat-tiny">LP Placement: <span class="blue">{bd["correct_placement"]*100:.0f}%</span> correct</p></div>', unsafe_allow_html=True)

    st.markdown("## 📉 Proficiency Over Time")
    fig,ax = dark_chart()
    for name,(df,_) in results.items():
        ax.plot(df['week'], df['proficiency_rate']*100, label=SCENARIO_CONFIGS[name]['label'], linewidth=2.5, color=COLORS[name])
    ax.axhline(y=70, color='#3b82f6', linestyle='--', alpha=0.4, label='C Threshold')
    ax.axhline(y=80, color='#22c55e', linestyle='--', alpha=0.4, label='B Threshold')
    ax.set_xlabel('Week', color='#94a3b8'); ax.set_ylabel('Proficiency Rate (%)', color='#94a3b8')
    ax.legend(loc='lower right', fontsize=9, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
    st.pyplot(fig); plt.close()

    st.markdown("## 🎯 Limited Prerequisites Students")
    c1,c2 = st.columns(2)
    with c1:
        fig,ax = dark_chart((10,4.5))
        for name,(df,_) in results.items(): ax.plot(df['week'], df['lp_gap_closure'], label=SCENARIO_CONFIGS[name]['label'], linewidth=2, color=COLORS[name])
        ax.axhline(y=0, color='#ef4444', linestyle='--', alpha=0.4)
        ax.set_xlabel('Week', color='#94a3b8'); ax.set_ylabel('Gap Closure (LP − Non-LP)', color='#94a3b8')
        ax.set_title('Are LP Students Catching Up?', color='#e2e8f0', fontsize=12)
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()
    with c2:
        fig,ax = dark_chart((10,4.5))
        for name,(df,_) in results.items(): ax.plot(df['week'], df['lp_correct_placement']*100, label=SCENARIO_CONFIGS[name]['label'], linewidth=2, color=COLORS[name])
        ax.set_xlabel('Week', color='#94a3b8'); ax.set_ylabel('Correct Placement (%)', color='#94a3b8')
        ax.set_title('LP Students Correctly Placed', color='#e2e8f0', fontsize=12)
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()

    st.markdown("## 🔬 Data Quality → Placement → Outcomes")
    c1,c2 = st.columns(2)
    with c1:
        fig,ax = dark_chart((10,4.5))
        for name,(df,_) in results.items(): ax.plot(df['week'], df['class_error']*100, label=SCENARIO_CONFIGS[name]['label'], linewidth=2, color=COLORS[name])
        ax.set_xlabel('Week', color='#94a3b8'); ax.set_ylabel('Placement Error (%)', color='#94a3b8')
        ax.set_title('Students in Wrong Classroom', color='#e2e8f0', fontsize=12)
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()
    with c2:
        fig,ax = dark_chart((10,4.5))
        for name,(df,_) in results.items(): ax.plot(df['week'], df['lp_identified']*100, label=SCENARIO_CONFIGS[name]['label'], linewidth=2, color=COLORS[name])
        ax.set_xlabel('Week', color='#94a3b8'); ax.set_ylabel('LP Identified (%)', color='#94a3b8')
        ax.set_title('LP Students Flagged for MTSS', color='#e2e8f0', fontsize=12)
        ax.legend(fontsize=8, facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()

    st.markdown("## 📊 Final Week Comparison")
    rows = []
    for name,(df,bd) in results.items():
        s = df['proficiency_rate'].iloc[-1]*100; g,_ = letter_grade(s)
        rows.append({'Scenario': SCENARIO_CONFIGS[name]['label'], 'Data Source': SCENARIO_CONFIGS[name]['data_src'],
            'Grade': f"{g} ({s:.0f})", 'Growth': f"+{df['mean_growth'].iloc[-1]:.1f}", 'LP Gap': f"{df['lp_gap_closure'].iloc[-1]:+.1f}",
            'LP Placed': f"{bd['correct_placement']*100:.0f}%", 'LP ID\'d': f"{bd['identified']*100:.0f}%", 'Error': f"{df['class_error'].iloc[-1]*100:.0f}%"})
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    st.markdown("## 📋 Root Causes (LP Students)")
    _,(_, bdb) = list(results.items())[-1]
    if bdb['causes']:
        st.dataframe(pd.DataFrame([{'Root Cause': CAUSE_LABELS.get(k,k), 'Count': v, 'Share': f"{v/bdb['total']*100:.0f}%",
            'What CBM Reveals': {'mobile':'Specific content gaps from scope misalignment between schools','chronic_absence':'Exact units missed during absence','el_status':'Skills blocked by language vs truly missing','previous_ineffective':'Skills taught but never mastered','no_prek':'Foundational gaps in number sense','cumulative_loss':'Which skills decay fastest over summer','curriculum_misalignment':'Standards that don\'t map to current sequence'}.get(k,'Specific gaps for targeted intervention')} for k,v in bdb['causes'].items()]), use_container_width=True, hide_index=True)

    st.markdown("## 💡 Key Insights")
    t,l,s,c = [results[k][0] for k in results]
    ts,ls,ss,cs = [d['proficiency_rate'].iloc[-1]*100 for d in [t,l,s,c]]
    tg,cg = t['lp_gap_closure'].iloc[-1], c['lp_gap_closure'].iloc[-1]
    tbd,cbd = results['A: Traditional'][1], results['D: CBM Diagnostic'][1]
    st.markdown(f"""
    <div class="insight-box"><h4>📊 The Data Quality Gradient</h4>
    <p>No Data: <span class="red">{ts:.0f}%</span> → Lagged: <span class="amber">{ls:.0f}%</span> → Screener: <span class="purple">{ss:.0f}%</span> → CBM: <span class="green">{cs:.0f}%</span></p>
    <p>Biggest jump: no grouping → any grouping (+{ls-ts:.0f} pts). Second: screener → CBM (+{cs-ss:.0f} pts).</p></div>
    <div class="insight-box"><h4>🔬 Why CBM Is the Gold Standard</h4>
    <p>CBM says "missing fraction operations from 4th grade" — not just "Level 2."</p>
    <p>• Correct placement: <span class="red">{tbd['correct_placement']*100:.0f}%</span> → <span class="green">{cbd['correct_placement']*100:.0f}%</span></p>
    <p>• Identification: <span class="red">{tbd['identified']*100:.0f}%</span> → <span class="green">{cbd['identified']*100:.0f}%</span></p>
    <p>• LP gap: <span class="red">{tg:+.1f}</span> (falling behind) → <span class="green">{cg:+.1f}</span> (catching up)</p></div>
    <div class="insight-box"><h4>🚫 SPED Referral Prevention</h4>
    <p>Without diagnostics, LP students look like they have learning disabilities. With CBM, they're identified as <strong>exposure gaps</strong> — get targeted remediation, grow 1.3x faster, close gaps in 1-2 years.</p>
    <p>Unnecessary referrals prevented: <strong>~{int(cbd['total']*0.5*(1-cbd['correct_placement']))}</strong> (CBM) vs <strong>~{int(tbd['total']*0.5)}</strong> at risk (Traditional)</p></div>
    """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(f"""<div class="diagnostic-box"><h4>🔗 EduNode Analytics Connection</h4>
    <p>EduNode's risk engine is the <strong>screener layer</strong> (Scenario B/C). The simulation shows the next leap comes from <strong>connecting diagnostic data to placement</strong> (Scenario D).</p>
    <p>When EduNode surfaces root cause context alongside risk scores, coordinators make CBM-quality placement decisions. <strong>The platform bridges screener-level identification and diagnostic-level placement.</strong></p></div>""", unsafe_allow_html=True)

if __name__ == "__main__": main()
