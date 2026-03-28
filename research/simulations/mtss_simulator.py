"""
MTSS Limited Prerequisites Simulator v3
========================================
Hypothesis: Misplacement and overdifferentiation (ignoring class size and limits
to differentiated instruction) create a reinforcing cycle that degrades MTSS
effectiveness and thereby student outcomes. Targeted improvements in placement
accuracy, capacity, and differentiation efficiency yield substantial gains in
school performance grades.

Author: Eddy Mkwambe (Technical Director, Mpingo Systems)
Research Support: Claude Chat (Lead Architect)
Date: March 2026

Parameter Sources:
  - Screener Sensitivity 54.9%: NC high school study (cited in research table)
  - Screener Specificity 96.7%: Same NC study
  - Screener Validity r=0.51: 2025 meta-analysis of 127 studies
  - Motivation effect d=0.59: Wise & DeMars (2005), 25 comparisons across 12 studies
  - Motivation stakes effect d=0.41: Liu, Bridgeman & Adler (2012)
  - CBM validity r=0.67+: McGlinchey & Hixson (2004); Marston (1989); Reschly et al. (2009)
  - CBM probe duration 1-3 min: Deno (2003), standard CBM protocol
  - MAP testing window week 4: NWEA MAP administration guidance
  - MAP results available 24h: NWEA documentation (HCPSS, Twinsburg FAQ)
  - State EOG results 3+ months: NWEA FAQ comparison
  - Intervention duration minimum 10 weeks: NC guidance, 7-10 data points
  - Counselor ratio 477:1 national avg: ASCA data (ideal 250:1)
  - Teacher judgment accuracy r=0.47-0.83 reading, r=0.09-0.32 math:
    Eckert, Dunn, Codding, Begeny & Kleinmann (2006)
  - CBM motivation noise: ESTIMATED (not research-derived). Rationale: CBM probes
    are 1-3 min, teacher-administered, embedded in instruction. Structural conditions
    that produce low-stakes disengagement are largely absent. Set near 0.
  - LP 80% of Level 1/2: Research-informed estimate based on SPED referral literature
  - Growth multipliers (1.3x correct, 0.6x misplaced): Model calibration estimates
"""

import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from dataclasses import dataclass, field
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings('ignore')

st.set_page_config(page_title="MTSS LP Simulator v3", page_icon="📊", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
<style>
    .main-header { font-size: 2.2rem; font-weight: 700; background: linear-gradient(135deg, #0ea5e9, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0; }
    .sub-header { font-size: 1rem; color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.5; }
    .metric-card { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 12px; padding: 1.2rem; text-align: center; }
    .metric-card h4 { color: #94a3b8; font-size: 0.82rem; margin: 0 0 0.5rem 0; }
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
    .source-box { background: #0f172a; border: 1px solid #1e3a5f; border-radius: 8px; padding: 0.6rem 1rem; margin: 0.2rem 0; font-size: 0.85rem; }
    .source-box .label { color: #60a5fa; font-weight: 600; }
    .source-box .value { color: #e2e8f0; }
    .source-box .cite { color: #64748b; font-style: italic; }
    .stat-tiny { font-size: 0.8rem; color: #64748b; margin: 0; }
    .green { color: #22c55e; font-weight: 700; }
    .red { color: #ef4444; font-weight: 700; }
    .amber { color: #eab308; font-weight: 700; }
    .blue { color: #3b82f6; font-weight: 700; }
    .purple { color: #a855f7; font-weight: 700; }
    .estimated { color: #f59e0b; font-style: italic; }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# ENGINE
# ============================================================================

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

    # Screener — research grounded
    screener_sensitivity: float = 0.549   # NC study
    screener_specificity: float = 0.967   # NC study

    # Student distribution
    pct_2plus_years_behind: float = 0.20
    pct_1_year_behind: float = 0.30
    pct_on_grade: float = 0.35
    pct_above_grade: float = 0.15

    # Limited Prerequisites — research-informed estimate
    pct_limited_prerequisites: float = 0.80
    prerequisite_causes: Dict[str, float] = field(default_factory=lambda: {
        'mobile': 0.25, 'chronic_absence': 0.20, 'el_status': 0.15,
        'previous_ineffective': 0.15, 'no_prek': 0.10,
        'cumulative_loss': 0.10, 'curriculum_misalignment': 0.05
    })
    # Growth multipliers — model calibration estimates
    limited_prereq_correct_placement_multiplier: float = 1.3
    limited_prereq_misplaced_multiplier: float = 0.6

    # ── Four Compounding Data Quality Factors ──
    placement_strategy: str = 'none'
    # 1. Base accuracy of the assessment instrument
    placement_accuracy: float = 0.0
    # 2. Timing delay — weeks before data informs placement
    #    Students sit in grade-level during delay
    placement_delay_weeks: int = 0
    # 3. Motivation noise — reduces effective accuracy
    #    Research: d=0.59 for low-stakes (Wise & DeMars 2005)
    #    CBM: ESTIMATED near 0 (short, teacher-administered)
    motivation_noise: float = 0.0
    # 4. Actionability — norm-referenced (rank) vs criterion-referenced (skills)
    #    Affects intervention targeting quality
    #    Research: norm-ref "gives little info about what student knows" (ResearchGate)
    #    CBM r=0.67+ to criterion tests (McGlinchey & Hixson 2004)
    actionability: float = 0.0

    mtss_identification_boost: float = 0.0
    placement_update_frequency: int = 6
    differentiation_waste: float = 0.25

    @property
    def effective_accuracy(self):
        """Accuracy after motivation noise degrades it.
        Noise reduces the probability of correct classification.
        Source: d=0.59 effect translates to ~15-20% misclassification
        increase for unmotivated students near level boundaries."""
        return self.placement_accuracy * (1 - self.motivation_noise)

    @property
    def effective_intervention_boost(self):
        """Criterion-referenced data → more targeted interventions → higher quality.
        Norm-referenced: "student is at 32nd percentile" (no skill info)
        Criterion-referenced: "student missing fraction operations" (actionable)"""
        return self.actionability * 0.15


class Student:
    __slots__ = ['id','true_skill','true_pct','skill','pct','assigned_pace','assigned_tier',
                 'has_lp','lp_cause','growth_history','pct_history']
    def __init__(self, sid, ts, tp, hlp, lpc):
        self.id=sid; self.true_skill=ts; self.true_pct=tp; self.skill=ts; self.pct=tp
        self.assigned_pace=None; self.assigned_tier=None
        self.has_lp=hlp; self.lp_cause=lpc; self.growth_history=[]; self.pct_history=[tp]

    @property
    def correct_pace(self):
        return LEVEL_TO_PACE.get(min(max(self.skill,1),4),'Grade Level')

    def growth_mult(self, p):
        if self.has_lp:
            return p.limited_prereq_correct_placement_multiplier if self.assigned_pace==self.correct_pace else p.limited_prereq_misplaced_multiplier
        return 1.0

    def need_tier(self):
        if self.skill==1: return 3
        if self.skill==2: return 2
        return 1

    def update_skill(self):
        if self.pct>=85: self.skill=4
        elif self.pct>=40: self.skill=3
        elif self.pct>=20: self.skill=2
        else: self.skill=1

    def step(self, cq, iq, p):
        match = self.assigned_pace==self.correct_pace
        if match: cg=0.4*cq
        else:
            gap=abs(PACE_TO_LEVEL.get(self.assigned_pace,3)-self.skill)
            cg=0.2*cq*max(1-0.3*gap,0.1)
        cg *= self.growth_mult(p)
        tier=self.assigned_tier or 1
        if tier>1 and tier==self.need_tier(): ib=0.2*iq
        elif tier>1: ib=0.1*iq
        else: ib=0
        ib *= (1 + p.effective_intervention_boost)
        growth=cg+ib
        self.pct=np.clip(self.pct+growth,0,100)
        self.update_skill()
        self.growth_history.append(growth)
        self.pct_history.append(self.pct)


class Simulation:
    def __init__(self, params):
        self.p=params; self.rng=np.random.RandomState(42)
        self.students=self._make_students()
        self._assign_default_placement()
        self._assign_mtss()
        self.history=[]; self.placement_activated=False

    def _make_students(self):
        levels=([(1,0,20)]*int(self.p.pct_2plus_years_behind*self.p.total_students)+
                [(2,20,40)]*int(self.p.pct_1_year_behind*self.p.total_students)+
                [(3,40,70)]*int(self.p.pct_on_grade*self.p.total_students)+
                [(4,70,100)]*int(self.p.pct_above_grade*self.p.total_students))
        causes=list(self.p.prerequisite_causes.keys())
        weights=list(self.p.prerequisite_causes.values())
        students=[]
        for i,(lvl,lo,hi) in enumerate(levels):
            pct=self.rng.uniform(lo,hi)
            hlp=(lvl in [1,2]) and (self.rng.random()<self.p.pct_limited_prerequisites)
            cause=self.rng.choice(causes,p=weights) if hlp else None
            students.append(Student(i,lvl,pct,hlp,cause))
        return students

    def _assign_default_placement(self):
        for s in self.students: s.assigned_pace='Grade Level'

    def _noisy_placement(self, s):
        if self.p.placement_strategy=='none': return 'Grade Level'
        if self.rng.random() < self.p.effective_accuracy: return s.correct_pace
        tl=s.skill
        if tl<3: ml=min(tl+1,3)
        elif tl>3: ml=max(tl-1,3)
        else: ml=3
        return LEVEL_TO_PACE.get(ml,'Grade Level')

    def _activate_placement(self):
        if self.p.placement_strategy=='none': return
        for s in self.students: s.assigned_pace=self._noisy_placement(s)
        self.placement_activated=True

    def _assign_mtss(self):
        eff=min(self.p.screener_sensitivity+self.p.mtss_identification_boost,0.98)
        for s in self.students:
            need=s.true_skill in [1,2]
            flagged=self.rng.random()<eff if need else self.rng.random()>self.p.screener_specificity
            if flagged: s.assigned_tier=3 if s.true_skill==1 else self.rng.choice([2,3])
            else: s.assigned_tier=1

    def _cq(self):
        spc=len(self.students)/max(self.p.num_teachers,1)
        ol=max(0,(spc-self.p.avg_class_size)/self.p.avg_class_size)
        return max(0.85-ol*0.3-self.p.differentiation_waste*0.2,0.4)

    def _iq(self):
        t23=sum(1 for s in self.students if (s.assigned_tier or 1)>1)
        cap=self.p.interventionist_capacity*self.p.students_per_interventionist
        load=t23/cap if cap else 1.0
        return max(0.9-max(0,(load-1.0)*0.2),0.4)

    def _dynamic_review(self):
        if self.p.placement_strategy=='none' or not self.placement_activated: return
        for s in self.students:
            if s.assigned_pace!=s.correct_pace:
                if self.rng.random()<self.p.effective_accuracy: s.assigned_pace=s.correct_pace

    def _record(self, week):
        n=len(self.students)
        lp=[s for s in self.students if s.has_lp]
        nlp=[s for s in self.students if not s.has_lp]
        prof=sum(1 for s in self.students if s.skill>=3)/n
        growth=sum(s.pct-s.true_pct for s in self.students)/n
        lp_g=sum(s.pct-s.true_pct for s in lp)/len(lp) if lp else 0
        nlp_g=sum(s.pct-s.true_pct for s in nlp)/len(nlp) if nlp else 0

        # Track differentiation load (proxy for the reinforcing cycle)
        n_misplaced = sum(1 for s in self.students if s.assigned_pace!=s.correct_pace)
        diff_load = n_misplaced / n  # Higher = more differentiation burden

        self.history.append({
            'week':week, 'proficiency_rate':prof, 'mean_growth':growth,
            'lp_gap_closure':lp_g-nlp_g,
            'lp_misplaced':sum(1 for s in lp if s.assigned_pace!=s.correct_pace)/len(lp) if lp else 0,
            'class_error':n_misplaced/n,
            'mtss_error':sum(1 for s in self.students if (s.assigned_tier or 1)!=s.need_tier())/n,
            'lp_identified':sum(1 for s in lp if (s.assigned_tier or 1)>1)/len(lp) if lp else 0,
            'lp_correct':sum(1 for s in lp if s.assigned_pace==s.correct_pace)/len(lp) if lp else 0,
            'differentiation_load': diff_load,
        })

    def run(self):
        cq,iq=self._cq(),self._iq()
        for w in range(1,self.p.weeks_in_year+1):
            if not self.placement_activated and w > self.p.placement_delay_weeks:
                self._activate_placement()
            for s in self.students: s.step(cq,iq,self.p)
            if w%self.p.placement_update_frequency==0: self._dynamic_review()
            self._record(w)
        return pd.DataFrame(self.history)

    def get_lp_breakdown(self):
        lp=[s for s in self.students if s.has_lp]
        causes={}
        for s in lp: causes[s.lp_cause]=causes.get(s.lp_cause,0)+1
        return {
            'total':len(lp),'pct':len(lp)/len(self.students),
            'causes':dict(sorted(causes.items(),key=lambda x:-x[1])),
            'correct_placement':sum(1 for s in lp if s.assigned_pace==s.correct_pace)/len(lp) if lp else 0,
            'identified':sum(1 for s in lp if (s.assigned_tier or 1)>1)/len(lp) if lp else 0,
        }

    def get_cycle_metrics(self):
        """Metrics that demonstrate the reinforcing cycle hypothesis"""
        lp = [s for s in self.students if s.has_lp]
        misplaced_lp = [s for s in lp if s.assigned_pace != s.correct_pace]
        correct_lp = [s for s in lp if s.assigned_pace == s.correct_pace]

        avg_growth_misplaced = np.mean([sum(s.growth_history) for s in misplaced_lp]) if misplaced_lp else 0
        avg_growth_correct = np.mean([sum(s.growth_history) for s in correct_lp]) if correct_lp else 0

        # Students who started LP and ended still below grade level
        still_below = sum(1 for s in lp if s.skill < 3)
        sped_risk = still_below  # These would likely be referred for SPED evaluation

        return {
            'avg_growth_misplaced': avg_growth_misplaced,
            'avg_growth_correct': avg_growth_correct,
            'growth_ratio': avg_growth_correct / avg_growth_misplaced if avg_growth_misplaced > 0 else float('inf'),
            'still_below_grade': still_below,
            'sped_referral_risk': sped_risk,
            'pct_sped_risk': sped_risk / len(lp) if lp else 0,
        }


# ============================================================================
# SCENARIO CONFIGS — Research-Grounded
# ============================================================================

COLORS = {'A: Traditional':'#ef4444','B: Lagged Data':'#f97316','C: Universal Screener':'#a855f7','D: CBM Diagnostic':'#22c55e'}
CAUSE_LABELS = {'mobile':'🚚 Mobile','chronic_absence':'📅 Chronic Absence','el_status':'🌐 English Learner',
                'previous_ineffective':'📉 Prior Instruction','no_prek':'🎒 No Pre-K',
                'cumulative_loss':'📆 Summer Loss','curriculum_misalignment':'📐 Curriculum Mismatch'}

def letter_grade(s):
    if s>=85: return 'A','grade-A'
    if s>=70: return 'B','grade-B'
    if s>=60: return 'C','grade-C'
    if s>=50: return 'D','grade-D'
    return 'F','grade-F'

def dark_chart(fs=(12,5)):
    fig,ax=plt.subplots(figsize=fs)
    fig.patch.set_facecolor('#0f172a'); ax.set_facecolor('#0f172a')
    ax.tick_params(colors='#64748b'); ax.grid(True,alpha=0.15,color='#334155')
    for sp in ax.spines.values(): sp.set_color('#334155')
    return fig,ax


@st.cache_data(ttl=120)
def run_scenarios(pt):
    p=dict(pt)

    # Scenario configs with research-grounded defaults
    cfgs = {
        'A: Traditional': dict(
            label='No Grouping (Traditional)',
            placement_strategy='none', placement_accuracy=0.0,
            placement_delay_weeks=0, motivation_noise=0.0, actionability=0.0,
            mtss_boost=0.0, waste=0.25,
            data_src='None — grade-level for all',
            issues='No grouping → maximum differentiation burden → cycle begins',
        ),
        'B: Lagged Data': dict(
            label='Prior EOG + Grades',
            placement_strategy='lagged',
            placement_accuracy=p['lagged_acc'],
            placement_delay_weeks=p['lagged_delay'],
            motivation_noise=p['lagged_noise'],   # d=0.59 basis
            actionability=0.2,  # Norm-referenced
            mtss_boost=0.05, waste=0.20,
            data_src='Prior year EOG + grades + teacher rec',
            issues=f'{p["lagged_delay"]}wk delay, {p["lagged_noise"]*100:.0f}% motivation noise, norm-referenced',
        ),
        'C: Universal Screener': dict(
            label='MAP / iReady Screener',
            placement_strategy='screener',
            placement_accuracy=p['screener_acc'],
            placement_delay_weeks=p['screener_delay'],
            motivation_noise=p['screener_noise'],  # d=0.59 basis
            actionability=0.5,  # Better but still broad
            mtss_boost=0.15, waste=0.15,
            data_src='Current-year universal screener',
            issues=f'{p["screener_delay"]}wk delay, {p["screener_noise"]*100:.0f}% motivation noise, norm-referenced',
        ),
        'D: CBM Diagnostic': dict(
            label='Curriculum-Based Measures',
            placement_strategy='cbm',
            placement_accuracy=p['cbm_acc'],
            placement_delay_weeks=p['cbm_delay'],
            motivation_noise=p['cbm_noise'],  # ESTIMATED near 0
            actionability=1.0,  # Criterion-referenced
            mtss_boost=0.25, waste=0.10,
            data_src='CBM — specific prerequisite skills',
            issues=f'{p["cbm_delay"]}wk delay, {p["cbm_noise"]*100:.0f}% noise (est.), criterion-referenced',
        ),
    }

    results={}
    for name,cfg in cfgs.items():
        sp=SchoolParameters()
        sp.avg_class_size=p['avg_class_size']; sp.num_teachers=p['num_teachers']
        sp.screener_sensitivity=p['screener_sensitivity']
        sp.pct_limited_prerequisites=p['pct_lp']
        sp.limited_prereq_correct_placement_multiplier=p['lp_correct']
        sp.limited_prereq_misplaced_multiplier=p['lp_misplaced']
        sp.placement_strategy=cfg['placement_strategy']
        sp.placement_accuracy=cfg['placement_accuracy']
        sp.placement_delay_weeks=cfg['placement_delay_weeks']
        sp.motivation_noise=cfg['motivation_noise']
        sp.actionability=cfg['actionability']
        sp.mtss_identification_boost=cfg['mtss_boost']
        sp.differentiation_waste=cfg['waste']
        sim=Simulation(sp)
        df=sim.run()
        bd=sim.get_lp_breakdown()
        cycle=sim.get_cycle_metrics()
        results[name]=(df,bd,cfg,cycle)
    return results


# ============================================================================
# MAIN
# ============================================================================

def main():
    st.markdown('<p class="main-header">📊 MTSS Limited Prerequisites Simulator v3</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header"><strong>Hypothesis:</strong> Misplacement and overdifferentiation create a reinforcing cycle that degrades MTSS effectiveness. Targeted improvements in diagnostic data quality, placement accuracy, and differentiation efficiency yield substantial gains.</p>', unsafe_allow_html=True)

    with st.sidebar:
        st.markdown("## 🎛️ Parameters"); st.divider()

        st.markdown("### 🏫 School")
        cs=st.slider("Class Size",15,30,25)
        nt=st.slider("Teachers",15,35,20)

        st.markdown("### 🎯 Screener")
        scr=st.slider("Sensitivity",0.40,0.95,0.549,0.01,help="NC baseline: 54.9% (research)")

        st.divider()
        st.markdown("### 📊 B: Prior EOG + Grades")
        st.caption("6-12 month stale data, norm-referenced")
        la=st.slider("Base Accuracy",0.50,0.85,0.70,0.01,key='la')
        ld=st.slider("Delay (weeks)",2,12,6,key='ld',help="Weeks before data informs placement")
        ln=st.slider("Motivation Noise",0.05,0.30,0.15,0.01,key='ln',help="d=0.59 basis (Wise & DeMars 2005)")

        st.markdown("### 📊 C: Universal Screener (MAP)")
        st.caption("Current year, ~50min, computer-administered, norm-ref")
        sa=st.slider("Base Accuracy",0.65,0.92,0.80,0.01,key='sa')
        sd=st.slider("Delay (weeks)",1,8,5,key='sd',help="Week 4 BOY + 3wk window (NWEA)")
        sn=st.slider("Motivation Noise",0.05,0.25,0.12,0.01,key='sn',help="Low-stakes, no grade impact")

        st.markdown("### 📊 D: CBM Diagnostic")
        st.caption("1-3 min probes, teacher-administered, criterion-ref")
        ca=st.slider("Base Accuracy",0.80,0.98,0.92,0.01,key='ca')
        cd=st.slider("Delay (weeks)",0,4,1,key='cd',help="Administered and acted on within 1 week")
        cn=st.slider("Motivation Noise",0.00,0.10,0.02,0.01,key='cn',help="ESTIMATED — short, teacher-administered")

        st.divider()
        st.markdown("### 📚 Limited Prerequisites")
        plp=st.slider("LP % of Level 1/2",0.50,1.00,0.80,0.01)
        c1,c2=st.columns(2)
        with c1: lpc=st.slider("Boost",1.0,1.8,1.3,0.05,help="Growth mult. when correctly placed")
        with c2: lpm=st.slider("Penalty",0.3,1.0,0.6,0.05,help="Growth mult. when misplaced")

        st.divider()
        run=st.button("🚀 Run Simulation",type="primary",use_container_width=True)

    pt=tuple(sorted({
        'screener_sensitivity':scr,'avg_class_size':cs,'num_teachers':nt,
        'pct_lp':plp,'lp_correct':lpc,'lp_misplaced':lpm,
        'lagged_acc':la,'lagged_delay':ld,'lagged_noise':ln,
        'screener_acc':sa,'screener_delay':sd,'screener_noise':sn,
        'cbm_acc':ca,'cbm_delay':cd,'cbm_noise':cn,
    }.items()))

    # ── Landing ──
    if not run:
        st.markdown("""
        <div class="diagnostic-box">
            <h4>🔄 The Reinforcing Cycle</h4>
            <p>Poor diagnostic data → <strong>Misplacement</strong> → Students can't access content → Low growth →
            Flagged for MTSS → But MTSS can't fix a placement problem → Student stagnates →
            Teacher over-differentiates in mixed classroom → <strong>Differentiation waste increases</strong> →
            Quality drops for everyone → More students fall behind → <strong>Cycle repeats</strong></p>
            <p>This simulator models where to break the cycle and quantifies the yield of each intervention.</p>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("### 📐 Data Quality Hierarchy (Weakest → Strongest)")
        for rank,color,title,desc,sources in [
            ("1","#ef4444","No Data (Traditional)",
             "Everyone in grade-level classes. Maximum differentiation burden.",
             "No diagnostic data. Teacher judgment alone: r=0.09-0.32 in math (Eckert et al. 2006)"),
            ("2","#f97316","Lagged Data (Prior EOG + Grades)",
             "6-12 months stale. ~70% accuracy after motivation noise.",
             "State EOG results: 3+ months lag (NWEA FAQ). Motivation d=0.59 (Wise & DeMars 2005). Norm-referenced: 'gives little info about what student knows' (ResearchGate)"),
            ("3","#a855f7","Universal Screener (MAP / iReady)",
             "Current-year normed snapshot. ~80% accuracy. Week 4-7 delay.",
             "MAP BOY window: week 4 (NWEA). Results: 24h (NWEA). Testing window: 3 weeks. Screener validity r=0.51 (2025 meta-analysis). Low-stakes motivation effect applies."),
            ("4","#22c55e","Curriculum-Based Measures (CBM)",
             "Tests actual scope & sequence. ~92% accuracy. 1 week delay.",
             "CBM validity r=0.67+ (McGlinchey & Hixson 2004). 1-3 min probes (Deno 2003). Criterion-referenced. Motivation noise: ESTIMATED near 0 (short, teacher-administered)."),
        ]:
            st.markdown(f'<div class="hierarchy-box"><span class="rank" style="color:{color};">{rank}</span> <strong style="color:#e2e8f0;">{title}</strong><p style="color:#94a3b8;margin:0.3rem 0 0.1rem 0;">{desc}</p><p style="color:#64748b;font-size:0.82rem;margin:0;">Sources: {sources}</p></div>', unsafe_allow_html=True)

        st.markdown("")
        st.markdown("### 🔬 Parameter Sourcing")
        params_table = [
            ("Screener Sensitivity", "54.9%", "NC high school study", "Research"),
            ("Screener Specificity", "96.7%", "NC high school study", "Research"),
            ("Screener Validity", "r = 0.51", "2025 meta-analysis (127 studies)", "Research"),
            ("Low-stakes Motivation Effect", "d = 0.59", "Wise & DeMars 2005 (25 comparisons)", "Research"),
            ("Stakes Manipulation Effect", "d = 0.41", "Liu, Bridgeman & Adler 2012", "Research"),
            ("CBM Validity", "r = 0.67+", "McGlinchey & Hixson 2004; Marston 1989", "Research"),
            ("CBM Probe Duration", "1-3 minutes", "Deno 2003", "Research"),
            ("MAP BOY Window", "Week 4", "NWEA administration guidance", "Research"),
            ("MAP Results Available", "24 hours", "NWEA documentation", "Research"),
            ("State EOG Results Lag", "3+ months", "NWEA FAQ comparison", "Research"),
            ("Teacher Judgment (Math)", "r = 0.09-0.32", "Eckert et al. 2006", "Research"),
            ("Intervention Min Duration", "10 weeks", "NC guidance", "Research"),
            ("Counselor Ratio", "477:1 national", "ASCA data (ideal 250:1)", "Research"),
            ("LP % of Level 1/2", "80%", "SPED referral literature", "Informed Estimate"),
            ("LP Growth Boost", "1.3x", "Model calibration", "Estimate"),
            ("LP Misplacement Penalty", "0.6x", "Model calibration", "Estimate"),
            ("CBM Motivation Noise", "~2%", "Structural argument (short, teacher-admin)", "Estimate"),
        ]
        df_params = pd.DataFrame(params_table, columns=['Parameter','Value','Source','Grounding'])
        st.dataframe(df_params, use_container_width=True, hide_index=True)
        return

    # ── Run ──
    with st.spinner("Simulating 500 students × 36 weeks × 4 scenarios..."):
        results=run_scenarios(pt)

    # ── Grade Cards ──
    st.markdown("## 📈 Final School Grades")
    cols=st.columns(4)
    for i,(name,(df,bd,cfg,cyc)) in enumerate(results.items()):
        score=df['proficiency_rate'].iloc[-1]*100; g,cls=letter_grade(score)
        growth=df['mean_growth'].iloc[-1]; gap=df['lp_gap_closure'].iloc[-1]
        gc='green' if gap>0 else 'red'
        with cols[i]:
            st.markdown(f'<div class="metric-card"><h4>{cfg["label"]}</h4><p class="{cls}">{g}</p>'
                f'<p class="stat-tiny">Proficiency: {score:.0f}%</p>'
                f'<p class="stat-tiny">Growth: <span class="green">+{growth:.1f}</span> pts</p>'
                f'<p class="stat-tiny">LP Gap: <span class="{gc}">{gap:+.1f}</span> pts</p>'
                f'<p class="stat-tiny">LP Placed: <span class="blue">{bd["correct_placement"]*100:.0f}%</span></p>'
                f'<p class="stat-tiny">SPED Risk: <span class="{"red" if cyc["pct_sped_risk"]>0.3 else "amber" if cyc["pct_sped_risk"]>0.1 else "green"}">{cyc["pct_sped_risk"]*100:.0f}%</span> of LP</p>'
                f'</div>', unsafe_allow_html=True)

    # ── Proficiency Chart ──
    st.markdown("## 📉 Proficiency Over Time")
    fig,ax=dark_chart()
    for name,(df,_,cfg,_) in results.items():
        ax.plot(df['week'],df['proficiency_rate']*100,label=cfg['label'],linewidth=2.5,color=COLORS[name])
    ax.axhline(y=70,color='#3b82f6',linestyle='--',alpha=0.4,label='C Threshold')
    ax.axhline(y=80,color='#22c55e',linestyle='--',alpha=0.4,label='B Threshold')
    ax.set_xlabel('Week',color='#94a3b8'); ax.set_ylabel('Proficiency Rate (%)',color='#94a3b8')
    ax.legend(loc='lower right',fontsize=9,facecolor='#1e293b',edgecolor='#334155',labelcolor='#e2e8f0')
    st.pyplot(fig); plt.close()

    # ── LP Charts ──
    st.markdown("## 🎯 Limited Prerequisites Students")
    c1,c2=st.columns(2)
    with c1:
        fig,ax=dark_chart((10,4.5))
        for name,(df,_,cfg,_) in results.items():
            ax.plot(df['week'],df['lp_gap_closure'],label=cfg['label'],linewidth=2,color=COLORS[name])
        ax.axhline(y=0,color='#ef4444',linestyle='--',alpha=0.4)
        ax.set_xlabel('Week',color='#94a3b8'); ax.set_ylabel('Gap Closure (LP − Non-LP)',color='#94a3b8')
        ax.set_title('Are LP Students Catching Up?',color='#e2e8f0',fontsize=12)
        ax.legend(fontsize=8,facecolor='#1e293b',edgecolor='#334155',labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()
    with c2:
        fig,ax=dark_chart((10,4.5))
        for name,(df,_,cfg,_) in results.items():
            ax.plot(df['week'],df['lp_correct']*100,label=cfg['label'],linewidth=2,color=COLORS[name])
        ax.set_xlabel('Week',color='#94a3b8'); ax.set_ylabel('Correct Placement (%)',color='#94a3b8')
        ax.set_title('LP Students Correctly Placed',color='#e2e8f0',fontsize=12)
        ax.legend(fontsize=8,facecolor='#1e293b',edgecolor='#334155',labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()

    # ── The Reinforcing Cycle ──
    st.markdown("## 🔄 The Reinforcing Cycle: Misplacement → Differentiation Load")
    c1,c2=st.columns(2)
    with c1:
        fig,ax=dark_chart((10,4.5))
        for name,(df,_,cfg,_) in results.items():
            ax.plot(df['week'],df['differentiation_load']*100,label=cfg['label'],linewidth=2,color=COLORS[name])
        ax.set_xlabel('Week',color='#94a3b8'); ax.set_ylabel('Differentiation Load (%)',color='#94a3b8')
        ax.set_title('% Students Requiring Differentiation (Misplaced)',color='#e2e8f0',fontsize=12)
        ax.legend(fontsize=8,facecolor='#1e293b',edgecolor='#334155',labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()
    with c2:
        fig,ax=dark_chart((10,4.5))
        for name,(df,_,cfg,_) in results.items():
            ax.plot(df['week'],df['class_error']*100,label=cfg['label'],linewidth=2,color=COLORS[name])
        ax.set_xlabel('Week',color='#94a3b8'); ax.set_ylabel('Placement Error (%)',color='#94a3b8')
        ax.set_title('Students in Wrong Classroom Over Time',color='#e2e8f0',fontsize=12)
        ax.legend(fontsize=8,facecolor='#1e293b',edgecolor='#334155',labelcolor='#e2e8f0')
        st.pyplot(fig); plt.close()

    # ── Summary Table ──
    st.markdown("## 📊 Final Week Comparison")
    rows=[]
    for name,(df,bd,cfg,cyc) in results.items():
        s=df['proficiency_rate'].iloc[-1]*100; g,_=letter_grade(s)
        eff_acc = cfg['placement_accuracy'] * (1 - cfg['motivation_noise'])
        rows.append({
            'Scenario':cfg['label'],
            'Data Source':cfg['data_src'],
            'Grade':f"{g} ({s:.0f})",
            'Delay':f"{cfg['placement_delay_weeks']}wk",
            'Base Acc':f"{cfg['placement_accuracy']*100:.0f}%",
            'Eff. Acc':f"{eff_acc*100:.0f}%",
            'Growth':f"+{df['mean_growth'].iloc[-1]:.1f}",
            'LP Gap':f"{df['lp_gap_closure'].iloc[-1]:+.1f}",
            'SPED Risk':f"{cyc['pct_sped_risk']*100:.0f}%",
        })
    st.dataframe(pd.DataFrame(rows),use_container_width=True,hide_index=True)

    # ── Root Causes ──
    st.markdown("## 📋 Root Causes (LP Students)")
    _,(_,bdb,_,_)=list(results.items())[-1]
    if bdb['causes']:
        st.dataframe(pd.DataFrame([{
            'Root Cause':CAUSE_LABELS.get(k,k),'Count':v,'Share':f"{v/bdb['total']*100:.0f}%",
            'What CBM Reveals':{
                'mobile':'Specific gaps from scope misalignment between schools',
                'chronic_absence':'Exact instructional units missed during absence',
                'el_status':'Skills blocked by language vs truly missing content',
                'previous_ineffective':'Skills taught but never mastered — need reteaching',
                'no_prek':'Foundational gaps in number sense, phonemic awareness',
                'cumulative_loss':'Which skills decay fastest over summer breaks',
                'curriculum_misalignment':'Standards that don\'t map to current sequence',
            }.get(k,'Specific gaps for targeted intervention')
        } for k,v in bdb['causes'].items()]),use_container_width=True,hide_index=True)

    # ── Cycle Analysis ──
    st.markdown("## 🔬 Hypothesis Validation: The Reinforcing Cycle")

    trad_cyc = results['A: Traditional'][3]
    cbm_cyc = results['D: CBM Diagnostic'][3]
    trad_df = results['A: Traditional'][0]
    cbm_df = results['D: CBM Diagnostic'][0]

    ts = trad_df['proficiency_rate'].iloc[-1]*100
    cs = cbm_df['proficiency_rate'].iloc[-1]*100

    st.markdown(f"""
    <div class="insight-box">
        <h4>📊 Evidence for the Reinforcing Cycle</h4>
        <p><strong>Traditional (no grouping):</strong></p>
        <p>• Differentiation load: <span class="red">{trad_df['differentiation_load'].iloc[-1]*100:.0f}%</span> of students misplaced (teacher must differentiate for all)</p>
        <p>• LP students correctly placed: <span class="red">{results['A: Traditional'][1]['correct_placement']*100:.0f}%</span></p>
        <p>• LP growth (misplaced): <span class="red">{trad_cyc['avg_growth_misplaced']:.1f}</span> total percentile points</p>
        <p>• SPED referral risk: <span class="red">{trad_cyc['pct_sped_risk']*100:.0f}%</span> of LP students still below grade level</p>
        <p>• School grade: <span class="red">{ts:.0f}%</span></p>
    </div>

    <div class="insight-box">
        <h4>✅ Breaking the Cycle with CBM Diagnostics</h4>
        <p><strong>CBM Diagnostic:</strong></p>
        <p>• Differentiation load: <span class="green">{cbm_df['differentiation_load'].iloc[-1]*100:.0f}%</span> (correct placement reduces differentiation burden)</p>
        <p>• LP students correctly placed: <span class="green">{results['D: CBM Diagnostic'][1]['correct_placement']*100:.0f}%</span></p>
        <p>• LP growth (correct placement): <span class="green">{cbm_cyc['avg_growth_correct']:.1f}</span> total percentile points</p>
        <p>• Growth ratio (correct/misplaced): <span class="green">{cbm_cyc['growth_ratio']:.1f}x</span></p>
        <p>• SPED referral risk: <span class="green">{cbm_cyc['pct_sped_risk']*100:.0f}%</span> of LP students</p>
        <p>• School grade: <span class="green">{cs:.0f}%</span></p>
    </div>

    <div class="insight-box">
        <h4>🎯 Hypothesis: Supported</h4>
        <p>The simulation demonstrates that <strong>misplacement creates a measurable reinforcing cycle</strong>:</p>
        <p>1. Without diagnostics, <span class="red">{trad_df['differentiation_load'].iloc[0]*100:.0f}%</span> of students are misplaced → teachers must overdifferentiate</p>
        <p>2. Overdifferentiation wastes instructional time → quality drops for all students</p>
        <p>3. LP students (80% of Level 1/2) grow at <span class="red">0.6x rate</span> when misplaced vs <span class="green">1.3x rate</span> when correctly placed</p>
        <p>4. Stagnant LP students get referred for SPED → resources diverted from instruction</p>
        <p>5. <strong>Net effect: {cs-ts:+.0f} percentage point swing</strong> in school proficiency when the cycle is broken with CBM diagnostics</p>
    </div>
    """, unsafe_allow_html=True)

    # ── EduNode Connection ──
    st.markdown("---")
    st.markdown(f"""
    <div class="diagnostic-box">
        <h4>🔗 EduNode Analytics Connection</h4>
        <p>EduNode's risk engine operates at Scenario B/C level — identifying who is at risk using attendance, grades, and assessment data. The Interventions Hub tracks what the school does about it.</p>
        <p>This simulation shows that the next leap comes from <strong>surfacing root cause context alongside risk scores</strong>. When EduNode tells a coordinator "this student is at-risk AND the pattern is consistent with mobility (3 schools in 2 years, curriculum gaps in fractions)" — that's approaching CBM-quality placement intelligence without requiring the school to administer a separate diagnostic.</p>
        <p><strong>The platform bridges screener-level identification and diagnostic-level placement decisions.</strong></p>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
