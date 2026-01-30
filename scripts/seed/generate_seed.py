#!/usr/bin/env python3
"""
EduNode Analytics - Mock Data Engine
=====================================

Generates high-fidelity "Independent Excellence" narrative seed data.
Strategic bias: High Growth + Medium-Low Proficiency = Charter Value Demonstration

This data proves to authorizers that the charter school is adding value
even when students enter below grade level.

Usage:
    python generate_seed.py

Outputs:
    - bigquery_mock_data.json (for BigQuery fallback/mock provider)
    - supabase_seed.sql (for Supabase metadata)
"""

import json
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

# =============================================================================
# CONFIGURATION
# =============================================================================

SCHOOLS = [
    {
        "name": "Academy of Tomorrow Charter",
        "slug": "academy-tomorrow",
        "student_count": 487,
        "grade_levels": [6, 7, 8],
        "colors": {"primary": "#6366f1", "secondary": "#06b6d4", "accent": "#10b981"}
    },
    {
        "name": "Innovation Prep Academy",
        "slug": "innovation-prep",
        "student_count": 312,
        "grade_levels": [9, 10, 11, 12],
        "colors": {"primary": "#8b5cf6", "secondary": "#06b6d4", "accent": "#10b981"}
    },
    {
        "name": "STEM Scholars Charter",
        "slug": "stem-scholars",
        "student_count": 628,
        "grade_levels": [6, 7, 8, 9, 10, 11, 12],
        "colors": {"primary": "#0ea5e9", "secondary": "#10b981", "accent": "#f59e0b"}
    }
]

ACADEMIC_YEAR_START = datetime(2025, 8, 15)
CURRENT_DATE = datetime(2026, 1, 30)

# Name pools for realistic data
FIRST_NAMES = [
    "Jayden", "Aaliyah", "Mateo", "Zoe", "Malik", "Elena", "Isaiah", "Sofia",
    "Marcus", "Aria", "DeShawn", "Luna", "Xavier", "Mia", "Aiden", "Camila",
    "Elijah", "Valentina", "Josiah", "Gabriella", "Khalil", "Stella", "Damian",
    "Bella", "Jaxon", "Natalia", "Kayden", "Layla", "Brandon", "Penelope",
    "Tyler", "Riley", "Jordan", "Avery", "Cameron", "Harper", "Mason", "Evelyn",
    "Ethan", "Abigail", "Noah", "Emily", "Liam", "Madison", "Lucas", "Chloe"
]

LAST_NAMES = [
    "Smith", "Garcia", "Johnson", "Williams", "Chen", "Rodriguez", "Martinez",
    "Brown", "Davis", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore",
    "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez",
    "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams"
]

TEACHERS = [
    {"name": "Ms. Johnson", "subject": "Mathematics", "department": "Math"},
    {"name": "Mr. Chen", "subject": "English Language Arts", "department": "ELA"},
    {"name": "Ms. Rodriguez", "subject": "Science", "department": "Science"},
    {"name": "Mr. Williams", "subject": "Social Studies", "department": "Social Studies"},
    {"name": "Ms. Davis", "subject": "Mathematics", "department": "Math"},
    {"name": "Mr. Thompson", "subject": "English Language Arts", "department": "ELA"},
]

# =============================================================================
# DATA GENERATORS
# =============================================================================

def generate_student_id() -> str:
    return f"stu_{uuid.uuid4().hex[:12]}"

def generate_attendance_rate(is_chronic: bool = False) -> float:
    """Generate realistic attendance rate with chronic absence bias."""
    if is_chronic:
        return round(random.uniform(0.75, 0.89), 3)
    return round(random.uniform(0.92, 0.99), 3)

def calculate_risk_level(proficiency: int, growth: int, attendance: float) -> str:
    """
    Calculate student risk level based on multiple factors.
    Strategic: High growth can offset low proficiency.
    """
    risk_score = 0

    # Proficiency factor (0-40 points)
    if proficiency < 30:
        risk_score += 35
    elif proficiency < 45:
        risk_score += 25
    elif proficiency < 60:
        risk_score += 15
    else:
        risk_score += 5

    # Growth factor (can reduce risk significantly) (-20 to +20 points)
    if growth >= 80:
        risk_score -= 20  # High growth = protective factor
    elif growth >= 60:
        risk_score -= 10
    elif growth >= 40:
        risk_score += 5
    else:
        risk_score += 15

    # Attendance factor (0-30 points)
    if attendance < 0.85:
        risk_score += 30
    elif attendance < 0.90:
        risk_score += 20
    elif attendance < 0.95:
        risk_score += 10

    # Classify
    if risk_score >= 50:
        return "critical"
    elif risk_score >= 30:
        return "at_risk"
    return "on_track"

def generate_nwea_scores(grade: int, proficiency: int, growth: int) -> Dict[str, Any]:
    """
    Generate NWEA MAP-style RIT scores.
    Shows Fall -> Winter -> Spring progression with growth.
    """
    # Base RIT by grade (approximate national norms)
    base_rit = {
        6: 210, 7: 215, 8: 220, 9: 222, 10: 225, 11: 227, 12: 228
    }

    base = base_rit.get(grade, 215)

    # Adjust for proficiency (below grade level students)
    proficiency_adjustment = (proficiency - 50) * 0.3
    fall_rit = int(base + proficiency_adjustment + random.randint(-3, 3))

    # Growth determines improvement
    growth_points = int(growth * 0.12)  # High growth = 9-11 point gain
    winter_rit = fall_rit + int(growth_points * 0.6) + random.randint(-1, 2)
    projected_spring_rit = fall_rit + growth_points + random.randint(-2, 3)

    return {
        "fall_rit": fall_rit,
        "winter_rit": winter_rit,
        "projected_spring_rit": projected_spring_rit,
        "growth_points": winter_rit - fall_rit,
        "growth_percentile": growth,
        "national_percentile": min(99, max(1, proficiency + random.randint(-5, 5)))
    }

def generate_student(school_id: str, school_config: Dict, index: int) -> Dict[str, Any]:
    """Generate a single student with the 'Independent Excellence' profile."""
    student_id = generate_student_id()
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    grade = random.choice(school_config["grade_levels"])

    # STRATEGIC BIAS: High Growth, Medium-Low Proficiency
    # 70% of students: Low proficiency (30-55), High growth (70-95)
    # 20% of students: Medium proficiency (50-70), Medium growth (50-70)
    # 10% of students: Higher proficiency (65-85), Variable growth

    roll = random.random()
    if roll < 0.70:
        # High Growth Cohort (demonstrates charter value)
        proficiency = random.randint(30, 55)
        growth = random.randint(75, 95)
    elif roll < 0.90:
        # Steady Progress Cohort
        proficiency = random.randint(50, 70)
        growth = random.randint(50, 70)
    else:
        # High Achievers
        proficiency = random.randint(65, 85)
        growth = random.randint(40, 80)

    # 15% chronic absence rate (for Early Warning demo)
    is_chronic = random.random() < 0.15
    attendance_rate = generate_attendance_rate(is_chronic)

    # Program flags
    has_iep = random.random() < 0.14  # ~14% special ed
    has_504 = random.random() < 0.08 if not has_iep else False
    is_ell = random.random() < 0.18  # ~18% ELL
    is_frpl = random.random() < 0.72  # 72% free/reduced lunch (typical charter)

    # Calculate risk
    risk_level = calculate_risk_level(proficiency, growth, attendance_rate)

    # Assign homeroom teacher
    homeroom = random.choice(TEACHERS)

    # Generate assessment scores
    reading_scores = generate_nwea_scores(grade, proficiency, growth)
    math_proficiency = proficiency + random.randint(-10, 10)
    math_growth = growth + random.randint(-10, 10)
    math_scores = generate_nwea_scores(grade, math_proficiency, math_growth)

    return {
        "id": student_id,
        "school_id": school_id,
        "first_name": first_name,
        "last_name": last_name,
        "display_name": f"{last_name}, {first_name}",
        "grade_level": grade,
        "enrollment_date": (ACADEMIC_YEAR_START - timedelta(days=random.randint(0, 30))).isoformat(),
        "status": "active",

        # Demographics
        "has_iep": has_iep,
        "has_504_plan": has_504,
        "is_english_learner": is_ell,
        "is_frpl": is_frpl,

        # Attendance
        "attendance_rate": attendance_rate,
        "is_chronically_absent": is_chronic,
        "days_enrolled": random.randint(85, 95),
        "days_present": int(random.randint(85, 95) * attendance_rate),

        # Academic Performance
        "proficiency_level": proficiency,
        "growth_percentile": growth,
        "risk_level": risk_level,

        # Reading Assessment
        "reading": reading_scores,

        # Math Assessment
        "math": math_scores,

        # Homeroom
        "homeroom_teacher": homeroom["name"],
        "homeroom_teacher_id": f"teacher_{homeroom['name'].lower().replace(' ', '_').replace('.', '')}",

        # Computed risk score (0-100, higher = more risk)
        "risk_score": calculate_risk_score(proficiency, growth, attendance_rate, has_iep, is_ell)
    }

def calculate_risk_score(prof: int, growth: int, att: float, iep: bool, ell: bool) -> int:
    """Calculate numeric risk score 0-100."""
    score = 0

    # Proficiency (30 points max)
    score += max(0, (60 - prof) * 0.5)

    # Growth (protective, can subtract up to 20)
    score -= (growth - 50) * 0.25

    # Attendance (30 points max)
    if att < 0.90:
        score += (0.90 - att) * 200

    # Program factors (10 points max)
    if iep:
        score += 5
    if ell:
        score += 3

    return max(0, min(100, int(score)))

def generate_attendance_log(student: Dict, days: int = 90) -> List[Dict]:
    """Generate daily attendance records."""
    logs = []
    current_date = ACADEMIC_YEAR_START

    for day in range(days):
        # Skip weekends
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue

        # Determine if present based on student's attendance rate
        is_present = random.random() < student["attendance_rate"]

        logs.append({
            "student_id": student["id"],
            "date": current_date.strftime("%Y-%m-%d"),
            "status": "present" if is_present else random.choice(["absent_excused", "absent_unexcused", "tardy"]),
            "school_id": student["school_id"]
        })

        current_date += timedelta(days=1)

    return logs

def generate_school_data(school_config: Dict) -> Dict[str, Any]:
    """Generate all data for a single school."""
    school_id = str(uuid.uuid4())

    students = []
    all_attendance = []
    assessments = []

    for i in range(school_config["student_count"]):
        student = generate_student(school_id, school_config, i)
        students.append(student)

        # Generate assessment records
        assessments.append({
            "student_id": student["id"],
            "school_id": school_id,
            "subject": "Reading",
            "assessment_type": "MAP Growth",
            "test_window": "Winter 2025-26",
            **student["reading"]
        })
        assessments.append({
            "student_id": student["id"],
            "school_id": school_id,
            "subject": "Mathematics",
            "assessment_type": "MAP Growth",
            "test_window": "Winter 2025-26",
            **student["math"]
        })

    # Calculate school-level metrics
    total_students = len(students)
    avg_attendance = sum(s["attendance_rate"] for s in students) / total_students
    chronic_count = sum(1 for s in students if s["is_chronically_absent"])
    avg_growth = sum(s["growth_percentile"] for s in students) / total_students
    avg_proficiency = sum(s["proficiency_level"] for s in students) / total_students

    on_track = sum(1 for s in students if s["risk_level"] == "on_track")
    at_risk = sum(1 for s in students if s["risk_level"] == "at_risk")
    critical = sum(1 for s in students if s["risk_level"] == "critical")

    return {
        "school": {
            "id": school_id,
            "name": school_config["name"],
            "slug": school_config["slug"],
            "settings": {
                "colors": school_config["colors"],
                "timezone": "America/New_York",
                "academic_year": "2025-26"
            }
        },
        "metrics": {
            "total_enrollment": total_students,
            "attendance_rate": round(avg_attendance, 3),
            "chronic_absence_count": chronic_count,
            "chronic_absence_rate": round(chronic_count / total_students, 3),
            "avg_growth_percentile": round(avg_growth, 1),
            "avg_proficiency": round(avg_proficiency, 1),
            "risk_distribution": {
                "on_track": on_track,
                "at_risk": at_risk,
                "critical": critical
            }
        },
        "students": students,
        "assessments": assessments,
        "generated_at": datetime.now().isoformat()
    }

def generate_supabase_sql(schools_data: List[Dict]) -> str:
    """Generate Supabase seed SQL."""
    sql_parts = [
        "-- EduNode Analytics - Supabase Seed Data",
        "-- Generated with 'Independent Excellence' strategic narrative",
        f"-- Generated at: {datetime.now().isoformat()}",
        "",
        "-- Clear existing seed data (for re-seeding)",
        "-- DELETE FROM audit_logs WHERE metadata->>'type' = 'seed';",
        "-- DELETE FROM students WHERE school_id IN (SELECT id FROM schools WHERE slug LIKE '%-seed');",
        "",
        "BEGIN;",
        ""
    ]

    for school_data in schools_data:
        school = school_data["school"]
        sql_parts.append(f"-- ========== {school['name']} ==========")
        sql_parts.append("")

        # Insert school
        sql_parts.append(f"""
INSERT INTO schools (id, name, slug, primary_color, secondary_color, accent_color,
                     subscription_tier, subscription_status, timezone, contact_email, is_active)
VALUES (
    '{school['id']}',
    '{school['name']}',
    '{school['slug']}',
    '{school['settings']['colors']['primary']}',
    '{school['settings']['colors']['secondary']}',
    '{school['settings']['colors']['accent']}',
    'pro',
    'active',
    'America/New_York',
    'admin@{school['slug'].replace('-', '')}.org',
    true
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color;
""")

        # Insert sample students (first 10 for SQL brevity)
        sql_parts.append(f"-- Sample students for {school['name']}")
        for student in school_data["students"][:10]:
            sql_parts.append(f"""
INSERT INTO students (id, school_id, first_name, last_name, grade_level, status,
                      has_iep, has_504_plan, is_english_learner)
VALUES (
    '{student['id']}',
    '{school['id']}',
    '{student['first_name']}',
    '{student['last_name']}',
    {student['grade_level']},
    'active',
    {str(student['has_iep']).lower()},
    {str(student['has_504_plan']).lower()},
    {str(student['is_english_learner']).lower()}
) ON CONFLICT (id) DO NOTHING;
""")

        sql_parts.append("")

    sql_parts.append("COMMIT;")
    sql_parts.append("")
    sql_parts.append("-- Audit log for seed")
    sql_parts.append("""
INSERT INTO audit_logs (action, resource_type, metadata)
VALUES ('seed_import', 'system', '{"type": "seed", "version": "1.0", "narrative": "independent_excellence"}');
""")

    return "\n".join(sql_parts)

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    print("🚀 EduNode Mock Data Engine")
    print("=" * 50)
    print("Strategic Narrative: Independent Excellence")
    print("Profile: High Growth + Medium-Low Proficiency")
    print("=" * 50)
    print()

    all_schools_data = []

    for school_config in SCHOOLS:
        print(f"📚 Generating data for: {school_config['name']}")
        school_data = generate_school_data(school_config)
        all_schools_data.append(school_data)

        metrics = school_data["metrics"]
        print(f"   Students: {metrics['total_enrollment']}")
        print(f"   Attendance Rate: {metrics['attendance_rate']*100:.1f}%")
        print(f"   Chronic Absence: {metrics['chronic_absence_count']} students ({metrics['chronic_absence_rate']*100:.1f}%)")
        print(f"   Avg Growth Percentile: {metrics['avg_growth_percentile']}th")
        print(f"   Avg Proficiency: {metrics['avg_proficiency']}")
        print(f"   Risk Distribution: ✅ {metrics['risk_distribution']['on_track']} | ⚠️ {metrics['risk_distribution']['at_risk']} | 🚨 {metrics['risk_distribution']['critical']}")
        print()

    # Output BigQuery JSON
    bigquery_output = {
        "generated_at": datetime.now().isoformat(),
        "narrative": "independent_excellence",
        "schools": all_schools_data
    }

    with open('scripts/seed/bigquery_mock_data.json', 'w') as f:
        json.dump(bigquery_output, f, indent=2)
    print("✅ Generated: scripts/seed/bigquery_mock_data.json")

    # Output Supabase SQL
    sql_content = generate_supabase_sql(all_schools_data)
    with open('scripts/seed/supabase_seed.sql', 'w') as f:
        f.write(sql_content)
    print("✅ Generated: scripts/seed/supabase_seed.sql")

    # Summary
    total_students = sum(s["metrics"]["total_enrollment"] for s in all_schools_data)
    avg_growth = sum(s["metrics"]["avg_growth_percentile"] for s in all_schools_data) / len(all_schools_data)

    print()
    print("=" * 50)
    print("📊 SEED SUMMARY")
    print(f"   Total Schools: {len(all_schools_data)}")
    print(f"   Total Students: {total_students}")
    print(f"   Platform Avg Growth: {avg_growth:.1f}th percentile")
    print("=" * 50)
    print()
    print("🎯 Strategic Value Demonstrated:")
    print("   → High growth proves charter is accelerating student learning")
    print("   → Lower proficiency reflects incoming student population")
    print("   → This narrative supports charter renewal with authorizers")

if __name__ == "__main__":
    main()
