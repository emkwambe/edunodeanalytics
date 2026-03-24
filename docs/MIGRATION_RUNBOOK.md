# Database Migration Runbook

**Last Updated:** March 24, 2026
**Purpose:** Document procedures for applying, verifying, and rolling back Supabase database migrations.

---

## Overview

EduNode Analytics uses Supabase as the database provider with SQL migrations managed in the `supabase/migrations/` directory. This runbook covers local development, production deployment, verification, and rollback procedures.

---

## Current Migrations

| Migration | Description |
|-----------|-------------|
| `00001_initial_schema.sql` | Core schema: schools, users, enums (subscription_tier, school_role, platform_role) |
| `00002_students_interventions_resources.sql` | Students, interventions, data sources, notifications, resource progress tables |
| `00003_billing_stripe_integration.sql` | Stripe integration fields on schools table (customer_id, subscription_id, billing period) |
| `00004_data_integration_sync_history.sql` | Sync history table for tracking individual data sync runs |
| `00005_reports_and_ai_usage.sql` | Scheduled reports and AI usage tracking tables |
| `00006_risk_engine_tables.sql` | Risk engine foundation: risk_model_configs, risk_scores, risk_alerts, risk_evaluation_runs |
| `00007_intervention_dosage_metrics.sql` | Intervention sessions and dosage metrics tables for tracking delivery fidelity |
| `00008_integration_service_costs.sql` | Integration pricing table for billing schools per integration |

---

## Local Development

### Apply Migrations Locally

```bash
# Ensure Supabase CLI is installed
supabase --version

# Start local Supabase (if not running)
supabase start

# Apply all pending migrations
npx supabase db push

# Alternative: Reset and reapply all migrations
npx supabase db reset
```

### Create a New Migration

```bash
# Generate a new migration file
npx supabase migration new <migration_name>

# Edit the generated file in supabase/migrations/
# Then apply it locally
npx supabase db push
```

### Verify Local Migration

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres

# List all tables
\dt

# Check specific table structure
\d+ students

# Exit psql
\q
```

---

## Production Deployment

### Pre-Deployment Checklist

1. **Backup verification**: Confirm PITR (Point-in-Time Recovery) is enabled in Supabase dashboard
2. **Test locally**: Ensure migration runs successfully on local Supabase
3. **Review changes**: Double-check the SQL for destructive operations (DROP, ALTER, DELETE)
4. **Schedule window**: Deploy during low-traffic hours when possible

### Apply Migrations to Production

**Option A: Supabase Dashboard (Recommended for single migrations)**

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Select the EduNode project
3. Navigate to **Database** > **Migrations**
4. Click **Run migrations** or manually execute SQL in the SQL Editor

**Option B: Supabase CLI with Remote Connection**

```bash
# Link to remote project (one-time setup)
npx supabase link --project-ref <project-ref>

# Push migrations to production
npx supabase db push --linked

# Alternative: Execute specific migration
npx supabase db execute -f supabase/migrations/<migration_file>.sql --linked
```

### Verify Production Migration

```bash
# Use Supabase CLI to inspect remote schema
npx supabase db diff --linked

# Or connect via psql using connection string from Supabase dashboard
psql "<connection_string_from_dashboard>"
```

In the Supabase Dashboard:
1. Navigate to **Table Editor** to verify new tables exist
2. Check **Database** > **Tables** for schema changes
3. Run a test query in **SQL Editor** to verify data integrity

---

## Verification Procedures

### After Any Migration

1. **Schema check**: Verify all expected tables/columns exist
2. **Constraint check**: Verify foreign keys and indexes are in place
3. **Data integrity**: Run sample queries to ensure existing data wasn't corrupted
4. **Application test**: Hit critical API endpoints to ensure the app functions

### Sample Verification Queries

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verify risk_scores table (from migration 00006)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'risk_scores';

-- Verify intervention_sessions table (from migration 00007)
SELECT count(*) FROM intervention_sessions;

-- Check foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
AND conrelid::regclass::text LIKE '%students%';
```

---

## Rollback Procedures

### Important Notes

- **Supabase does not support automatic rollback**. Each rollback must be done manually.
- **Always test rollback scripts locally** before applying to production.
- **PITR is your safety net**: If a migration breaks production catastrophically, contact Supabase support for point-in-time recovery.

### Manual Rollback Steps

1. **Identify the issue**: Determine which migration caused the problem
2. **Write rollback SQL**: Create inverse operations (DROP added tables, recreate dropped columns, etc.)
3. **Test locally**: Apply the rollback SQL to your local database first
4. **Apply to production**: Execute the rollback SQL via Supabase SQL Editor or CLI

### Example Rollback Scripts

**Rollback migration 00007 (intervention_sessions)**:
```sql
-- WARNING: This drops all intervention session data
DROP TABLE IF EXISTS public.intervention_sessions CASCADE;
DROP TABLE IF EXISTS public.dosage_metrics CASCADE;
```

**Rollback migration 00006 (risk engine)**:
```sql
-- WARNING: This drops all risk scoring data
DROP TABLE IF EXISTS public.risk_alerts CASCADE;
DROP TABLE IF EXISTS public.risk_scores CASCADE;
DROP TABLE IF EXISTS public.student_risk_history CASCADE;
DROP TABLE IF EXISTS public.risk_evaluation_runs CASCADE;
DROP TABLE IF EXISTS public.risk_model_configs CASCADE;
```

### If Migration Breaks Production

1. **Immediate**: If the app is down, consider restoring from PITR backup
2. **Contact Supabase Support**: For PITR restoration, go to Support in dashboard
3. **Hotfix**: If possible, deploy a hotfix migration that corrects the issue
4. **Post-mortem**: Document what went wrong and update this runbook

---

## Best Practices

1. **One change per migration**: Keep migrations atomic and focused
2. **Use IF EXISTS/IF NOT EXISTS**: Make migrations idempotent when possible
3. **Never modify applied migrations**: Create new migrations for fixes
4. **Test on local/staging first**: Never apply untested migrations to production
5. **Document breaking changes**: Note any migration that requires app code changes
6. **Backup before destructive ops**: Extra caution for DROP/DELETE operations

---

## Emergency Contacts

- **Supabase Support**: Available in dashboard or support@supabase.io
- **Point-in-Time Recovery**: Request via Supabase dashboard > Support
- **Internal escalation**: Contact the EduNode engineering lead

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-03-24 | Initial runbook creation | Claude Code |
