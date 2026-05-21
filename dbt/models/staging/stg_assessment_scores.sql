-- ==============================================
-- Staging: Assessment Scores (NWEA/MAP, iReady, etc.)
-- Source: Assessment vendor data feeds
-- ==============================================

{{
  config(
    materialized='view',
    schema='staging',
    tags=['staging', 'assessments']
  )
}}

WITH source AS (
    SELECT * FROM {{ source('assessments_raw', 'scores') }}
    WHERE _tenant_id = '{{ var("tenant_id") }}'
),

renamed AS (
    SELECT
        -- Primary identifiers
        id AS score_id,
        _tenant_id AS tenant_id,
        student_id,
        school_id,

        -- Assessment identification
        assessment_vendor,  -- 'nwea', 'iready', 'renaissance', 'illuminate'
        assessment_name,    -- 'MAP Growth Reading', 'iReady Diagnostic Math'
        assessment_type,    -- 'diagnostic', 'interim', 'summative', 'formative'
        subject,            -- 'reading', 'math', 'language', 'science'

        -- Test administration
        test_date,
        test_window,        -- 'fall', 'winter', 'spring', 'summer'
        academic_year,
        grade_level_tested,

        -- Scale scores (standardized across vendors)
        scale_score,
        scale_score_error,  -- Standard error of measurement

        -- Normative comparisons
        national_percentile,
        national_stanine,

        -- Growth metrics (where available)
        growth_percentile,  -- Student Growth Percentile (SGP)
        growth_target,      -- Projected score for "typical" growth
        growth_projection,  -- Projected end-of-year score
        met_growth_target,  -- Boolean: did student meet typical growth?

        -- Achievement levels
        achievement_level,  -- 'below_basic', 'basic', 'proficient', 'advanced'
        CASE
            WHEN achievement_level IN ('proficient', 'advanced', 'meets', 'exceeds') THEN 1
            ELSE 0
        END AS is_proficient,

        -- Lexile/Quantile (where applicable)
        lexile_score,
        quantile_score,

        -- Domain/strand scores (JSON for flexibility)
        domain_scores,  -- JSONB: {"Reading Foundations": 210, "Literary Text": 215, ...}

        -- Prior scores for growth calculation
        prior_score_id,
        prior_scale_score,
        prior_test_window,

        -- Raw growth calculation
        CASE
            WHEN prior_scale_score IS NOT NULL
            THEN scale_score - prior_scale_score
            ELSE NULL
        END AS score_change,

        -- Metadata
        is_valid_score,  -- Exclude invalidated tests
        created_at,
        updated_at,
        _synced_at

    FROM source
    WHERE
        is_valid_score = TRUE
        AND test_date <= CURRENT_DATE()
)

SELECT * FROM renamed
