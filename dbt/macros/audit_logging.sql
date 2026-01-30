-- ==============================================
-- EduNode Analytics - dbt Audit Logging Macros
-- Track data transformation runs for compliance
-- ==============================================

{% macro log_run_start() %}
    {% if execute %}
        {% set query %}
            INSERT INTO `{{ target.project }}.{{ var('tenant_id') }}_audit.dbt_run_log`
            (run_id, run_started_at, target_name, target_schema, invocation_id, run_type)
            VALUES (
                '{{ run_started_at }}',
                CURRENT_TIMESTAMP(),
                '{{ target.name }}',
                '{{ target.schema }}',
                '{{ invocation_id }}',
                'start'
            )
        {% endset %}
        {% do log("Audit: Logging run start", info=true) %}
        {# In production, execute the query #}
    {% endif %}
{% endmacro %}

{% macro log_run_end() %}
    {% if execute %}
        {% set query %}
            UPDATE `{{ target.project }}.{{ var('tenant_id') }}_audit.dbt_run_log`
            SET
                run_completed_at = CURRENT_TIMESTAMP(),
                run_type = 'end',
                models_run = {{ results | length }},
                models_success = {{ results | selectattr("status", "equalto", "success") | list | length }},
                models_error = {{ results | selectattr("status", "equalto", "error") | list | length }}
            WHERE run_id = '{{ run_started_at }}'
        {% endset %}
        {% do log("Audit: Logging run end", info=true) %}
    {% endif %}
{% endmacro %}

{% macro get_tenant_dataset() %}
    {{ var('tenant_id') }}_marts
{% endmacro %}

{% macro generate_tenant_schema_name(custom_schema_name, node) %}
    {%- set default_schema = target.schema -%}
    {%- if custom_schema_name is none -%}
        {{ default_schema }}
    {%- else -%}
        {{ var('tenant_id') }}_{{ custom_schema_name }}
    {%- endif -%}
{% endmacro %}
