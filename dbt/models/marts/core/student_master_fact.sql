-- ==============================================
-- Student Master Fact Table
-- The unified student view joining Demographics, Attendance, and Assessments
-- ==============================================
--
-- Purpose:
-- This is the primary analytical table for student-level reporting.
-- It pre-calculates key metrics to enable fast dashboard queries:
-- - Chronic Absenteeism (< 90% attendance rate)
-- - Academic Growth Percentile (from NWEA/MAP or equivalent)
-- - Risk Level Classification (On-Track, At-Risk, Critical)
--
-- Grain: One row per student per snapshot_date
-- Refresh: Daily
-- ==============================================

{{
  config(
    materialized='table',
    schema='marts',
    partition_by={
      'field': 'snapshot_date',
      'data_type': 'date',
      'granularity': 'month'
    },
    cluster_by=['school_id', 'grade_level', 'risk_level'],
    tags=['marts', 'core', 'student']
  )
}}

WITH students AS (
    SELECT * FROM {{ ref('stg_sis_students') }}
    WHERE enrollment_status = 'active'
),

-- Aggregate attendance to student-level YTD metrics
attendance_ytd AS (
    SELECT
        student_id,
        COUNT(*) AS total_school_days,
        SUM(is_present) AS days_present,
        SUM(is_absent) AS days_absent,
        SUM(is_absent_unexcused) AS days_absent_unexcused,
        SUM(is_tardy) AS days_tardy,

        -- Attendance rate calculation
        SAFE_DIVIDE(SUM(is_present), COUNT(*)) AS attendance_rate,

        -- Chronic absenteeism flag (< 90% attendance)
        CASE
            WHEN SAFE_DIVIDE(SUM(is_present), COUNT(*)) < {{ var('chronic_absence_threshold') }}
            THEN TRUE
            ELSE FALSE
        END AS is_chronically_absent,

        -- Attendance tier for early warning
        CASE
            WHEN SAFE_DIVIDE(SUM(is_present), COUNT(*)) >= {{ var('attendance_warning_threshold') }}
                THEN 'on_track'
            WHEN SAFE_DIVIDE(SUM(is_present), COUNT(*)) >= {{ var('attendance_critical_threshold') }}
                THEN 'at_risk'
            ELSE 'critical'
        END AS attendance_tier,

        -- Recent attendance trend (last 10 days)
        SUM(CASE WHEN attendance_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 10 DAY) THEN is_absent ELSE 0 END) AS absences_last_10_days,

        -- Monthly breakdown for trend analysis
        MAX(attendance_date) AS last_attendance_date

    FROM {{ ref('stg_sis_attendance') }}
    WHERE
        academic_year = '{{ var("academic_year") }}'
    GROUP BY student_id
),

-- Get most recent assessment scores by subject
latest_reading_scores AS (
    SELECT
        student_id,
        scale_score AS reading_scale_score,
        national_percentile AS reading_percentile,
        growth_percentile AS reading_growth_percentile,
        achievement_level AS reading_achievement_level,
        is_proficient AS reading_is_proficient,
        lexile_score,
        test_date AS reading_test_date,
        test_window AS reading_test_window,
        ROW_NUMBER() OVER (
            PARTITION BY student_id
            ORDER BY test_date DESC, created_at DESC
        ) AS rn
    FROM {{ ref('stg_assessment_scores') }}
    WHERE
        subject = 'reading'
        AND academic_year = '{{ var("academic_year") }}'
),

latest_math_scores AS (
    SELECT
        student_id,
        scale_score AS math_scale_score,
        national_percentile AS math_percentile,
        growth_percentile AS math_growth_percentile,
        achievement_level AS math_achievement_level,
        is_proficient AS math_is_proficient,
        quantile_score,
        test_date AS math_test_date,
        test_window AS math_test_window,
        ROW_NUMBER() OVER (
            PARTITION BY student_id
            ORDER BY test_date DESC, created_at DESC
        ) AS rn
    FROM {{ ref('stg_assessment_scores') }}
    WHERE
        subject = 'math'
        AND academic_year = '{{ var("academic_year") }}'
),

-- Calculate composite growth percentile
growth_composite AS (
    SELECT
        COALESCE(r.student_id, m.student_id) AS student_id,
        r.reading_growth_percentile,
        m.math_growth_percentile,

        -- Composite growth: average of reading and math growth percentiles
        COALESCE(
            SAFE_DIVIDE(
                COALESCE(r.reading_growth_percentile, 0) + COALESCE(m.math_growth_percentile, 0),
                CASE
                    WHEN r.reading_growth_percentile IS NOT NULL AND m.math_growth_percentile IS NOT NULL THEN 2
                    WHEN r.reading_growth_percentile IS NOT NULL OR m.math_growth_percentile IS NOT NULL THEN 1
                    ELSE NULL
                END
            ),
            NULL
        ) AS composite_growth_percentile,

        -- Growth tier classification
        CASE
            WHEN COALESCE(r.reading_growth_percentile, m.math_growth_percentile) >= 50 THEN 'on_track'
            WHEN COALESCE(r.reading_growth_percentile, m.math_growth_percentile) >= 25 THEN 'at_risk'
            WHEN COALESCE(r.reading_growth_percentile, m.math_growth_percentile) IS NOT NULL THEN 'critical'
            ELSE 'no_data'
        END AS growth_tier

    FROM latest_reading_scores r
    FULL OUTER JOIN latest_math_scores m ON r.student_id = m.student_id AND m.rn = 1
    WHERE r.rn = 1 OR r.student_id IS NULL
),

-- Final student master fact
final AS (
    SELECT
        -- Snapshot metadata
        CURRENT_DATE() AS snapshot_date,
        '{{ var("academic_year") }}' AS academic_year,

        -- Student identifiers
        s.student_id,
        s.tenant_id,
        s.sis_student_id,
        s.state_student_id,
        s.school_id,

        -- Demographics
        s.display_name,
        s.first_name,
        s.last_name,
        s.grade_level,
        s.age,
        s.gender,
        s.ethnicity,
        s.is_hispanic_latino,

        -- Program flags
        s.has_iep,
        s.has_504_plan,
        s.is_english_learner,
        s.is_economically_disadvantaged,
        s.is_homeless,
        s.is_foster_care,

        -- Enrollment
        s.enrollment_status,
        s.enrollment_date,
        s.homeroom_teacher_id,
        s.homeroom_name,

        -- === ATTENDANCE METRICS ===
        COALESCE(a.total_school_days, 0) AS total_school_days,
        COALESCE(a.days_present, 0) AS days_present,
        COALESCE(a.days_absent, 0) AS days_absent,
        COALESCE(a.days_absent_unexcused, 0) AS days_absent_unexcused,
        COALESCE(a.days_tardy, 0) AS days_tardy,
        ROUND(COALESCE(a.attendance_rate, 1.0), 4) AS attendance_rate,
        ROUND(COALESCE(a.attendance_rate, 1.0) * 100, 1) AS attendance_rate_pct,
        COALESCE(a.is_chronically_absent, FALSE) AS is_chronically_absent,
        COALESCE(a.attendance_tier, 'no_data') AS attendance_tier,
        COALESCE(a.absences_last_10_days, 0) AS absences_last_10_days,

        -- === READING ASSESSMENT METRICS ===
        r.reading_scale_score,
        r.reading_percentile,
        r.reading_growth_percentile,
        r.reading_achievement_level,
        COALESCE(r.reading_is_proficient, 0) AS reading_is_proficient,
        r.lexile_score,
        r.reading_test_date,
        r.reading_test_window,

        -- === MATH ASSESSMENT METRICS ===
        m.math_scale_score,
        m.math_percentile,
        m.math_growth_percentile,
        m.math_achievement_level,
        COALESCE(m.math_is_proficient, 0) AS math_is_proficient,
        m.quantile_score,
        m.math_test_date,
        m.math_test_window,

        -- === COMPOSITE METRICS ===
        g.composite_growth_percentile,
        g.growth_tier,

        -- Combined proficiency (both reading AND math)
        CASE
            WHEN r.reading_is_proficient = 1 AND m.math_is_proficient = 1 THEN TRUE
            ELSE FALSE
        END AS is_proficient_both_subjects,

        -- === OVERALL RISK LEVEL ===
        -- Combines attendance and academic indicators into a single risk classification
        CASE
            -- Critical: Chronic absence OR critical growth OR both subjects below proficient
            WHEN a.is_chronically_absent = TRUE THEN 'critical'
            WHEN g.growth_tier = 'critical' THEN 'critical'
            WHEN COALESCE(a.attendance_tier, 'on_track') = 'critical' THEN 'critical'

            -- At-Risk: Warning attendance OR at-risk growth OR one subject below proficient
            WHEN COALESCE(a.attendance_tier, 'on_track') = 'at_risk' THEN 'at_risk'
            WHEN g.growth_tier = 'at_risk' THEN 'at_risk'
            WHEN COALESCE(r.reading_is_proficient, 1) = 0 OR COALESCE(m.math_is_proficient, 1) = 0 THEN 'at_risk'

            -- On-Track: Good attendance AND on-track growth
            ELSE 'on_track'
        END AS risk_level,

        -- Risk score (0-100, higher = more at risk)
        ROUND(
            (
                -- Attendance component (40% weight)
                (1 - COALESCE(a.attendance_rate, 1.0)) * 40 +
                -- Growth component (40% weight)
                CASE
                    WHEN g.composite_growth_percentile IS NULL THEN 0
                    ELSE (1 - g.composite_growth_percentile / 100) * 40
                END +
                -- Proficiency component (20% weight)
                CASE
                    WHEN r.reading_is_proficient = 0 OR m.math_is_proficient = 0 THEN 20
                    ELSE 0
                END
            ),
            1
        ) AS risk_score,

        -- Metadata
        CURRENT_TIMESTAMP() AS created_at,
        CURRENT_TIMESTAMP() AS updated_at

    FROM students s
    LEFT JOIN attendance_ytd a ON s.student_id = a.student_id
    LEFT JOIN latest_reading_scores r ON s.student_id = r.student_id AND r.rn = 1
    LEFT JOIN latest_math_scores m ON s.student_id = m.student_id AND m.rn = 1
    LEFT JOIN growth_composite g ON s.student_id = g.student_id
)

SELECT * FROM final
