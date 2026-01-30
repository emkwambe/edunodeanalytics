-- ==============================================
-- Staging: SIS Attendance (Daily Records)
-- Source: Clever/ClassLink or direct SIS integration
-- ==============================================

{{
  config(
    materialized='view',
    schema='staging',
    tags=['staging', 'sis', 'attendance']
  )
}}

WITH source AS (
    SELECT * FROM {{ source('sis_raw', 'attendance') }}
    WHERE _tenant_id = '{{ var("tenant_id") }}'
),

renamed AS (
    SELECT
        -- Primary identifiers
        id AS attendance_id,
        _tenant_id AS tenant_id,
        student_id,
        school_id,

        -- Date
        attendance_date,
        EXTRACT(YEAR FROM attendance_date) AS calendar_year,
        EXTRACT(MONTH FROM attendance_date) AS calendar_month,
        EXTRACT(DAYOFWEEK FROM attendance_date) AS day_of_week,

        -- Academic calendar context
        academic_year,
        term,
        grading_period,

        -- Attendance status (standardized)
        CASE
            WHEN UPPER(status) IN ('P', 'PRESENT', 'IN ATTENDANCE') THEN 'present'
            WHEN UPPER(status) IN ('A', 'ABSENT', 'UNEXCUSED') THEN 'absent_unexcused'
            WHEN UPPER(status) IN ('E', 'EXCUSED', 'EXCUSED ABSENCE') THEN 'absent_excused'
            WHEN UPPER(status) IN ('T', 'TARDY', 'LATE') THEN 'tardy'
            WHEN UPPER(status) IN ('ISS', 'IN-SCHOOL SUSPENSION') THEN 'suspension_in_school'
            WHEN UPPER(status) IN ('OSS', 'OUT-OF-SCHOOL SUSPENSION') THEN 'suspension_out_school'
            WHEN UPPER(status) IN ('H', 'HOMEBOUND') THEN 'homebound'
            ELSE 'other'
        END AS attendance_status,

        -- Binary indicators for easy aggregation
        CASE
            WHEN UPPER(status) IN ('P', 'PRESENT', 'IN ATTENDANCE', 'T', 'TARDY', 'LATE')
            THEN 1 ELSE 0
        END AS is_present,

        CASE
            WHEN UPPER(status) IN ('A', 'ABSENT', 'UNEXCUSED', 'E', 'EXCUSED', 'EXCUSED ABSENCE',
                                   'ISS', 'OSS', 'IN-SCHOOL SUSPENSION', 'OUT-OF-SCHOOL SUSPENSION')
            THEN 1 ELSE 0
        END AS is_absent,

        CASE
            WHEN UPPER(status) IN ('A', 'ABSENT', 'UNEXCUSED')
            THEN 1 ELSE 0
        END AS is_absent_unexcused,

        CASE
            WHEN UPPER(status) IN ('T', 'TARDY', 'LATE')
            THEN 1 ELSE 0
        END AS is_tardy,

        -- Instructional day flag
        is_school_day,

        -- Period-level attendance (if available)
        period,
        class_id,

        -- Notes (redacted in most views)
        absence_reason,

        -- Metadata
        created_at,
        updated_at,
        _synced_at

    FROM source
    WHERE
        is_school_day = TRUE
        AND attendance_date <= CURRENT_DATE()
)

SELECT * FROM renamed
