-- ==============================================
-- Staging: SIS Students (Demographics)
-- Source: Clever/ClassLink roster sync
-- ==============================================

{{
  config(
    materialized='view',
    schema='staging',
    tags=['staging', 'sis', 'students']
  )
}}

WITH source AS (
    SELECT * FROM {{ source('sis_raw', 'students') }}
    WHERE _tenant_id = '{{ var("tenant_id") }}'
),

renamed AS (
    SELECT
        -- Primary identifiers
        id AS student_id,
        _tenant_id AS tenant_id,

        -- SIS identifiers (for cross-system matching)
        sis_id AS sis_student_id,
        state_id AS state_student_id,

        -- Demographics
        first_name,
        middle_name,
        last_name,
        CONCAT(last_name, ', ', first_name) AS display_name,

        -- Birth and grade
        date_of_birth,
        DATE_DIFF(CURRENT_DATE(), date_of_birth, YEAR) AS age,
        grade_level,

        -- Enrollment
        school_id,
        enrollment_status,
        enrollment_date,
        exit_date,
        exit_reason,

        -- Demographics (for disaggregation)
        gender,
        ethnicity,
        race,
        is_hispanic_latino,

        -- Program flags (FERPA protected - handle with care)
        is_iep AS has_iep,
        is_504 AS has_504_plan,
        is_ell AS is_english_learner,
        is_free_reduced_lunch AS is_economically_disadvantaged,
        is_homeless,
        is_foster_care,
        is_migrant,

        -- Contact (masked by default in views)
        primary_contact_name,
        primary_contact_phone,
        primary_contact_email,

        -- Homeroom/Advisory
        homeroom_teacher_id,
        homeroom_name,

        -- Metadata
        created_at,
        updated_at,
        _synced_at

    FROM source
    WHERE
        -- Only active or recently exited students
        (enrollment_status = 'active'
         OR (enrollment_status = 'exited' AND exit_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)))
)

SELECT * FROM renamed
