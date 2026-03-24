# EduNode Analytics - Operations Runbook

**Version:** 1.0
**Last Updated:** March 24, 2026
**Audience:** Operations, DevOps, On-call Engineers

---

## Table of Contents

1. [Uptime Monitoring Configuration](#uptime-monitoring-configuration)
2. [Health Endpoints](#health-endpoints)
3. [Incident Response](#incident-response)
4. [Cron Job Monitoring](#cron-job-monitoring)
5. [SIS Sync Failures](#sis-sync-failures)
6. [Sentry Alert Handling](#sentry-alert-handling)
7. [School Onboarding](#school-onboarding)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Running Demo Seed Script](#running-demo-seed-script)
10. [Resetting a Demo School](#resetting-a-demo-school)
11. [Checking Backup Status](#checking-backup-status)

---

## Uptime Monitoring Configuration

### Recommended Setup

Configure an external uptime monitor (Better Uptime, UptimeRobot, Pingdom, etc.) to monitor the following endpoints:

#### Primary Ping Endpoint

```
URL: https://your-domain.com/api/health/ping
Method: GET or HEAD
Interval: 1-5 minutes
Expected Response: HTTP 200
Expected Body: { "status": "ok", "timestamp": "..." }
Alert Threshold: 2 consecutive failures
```

#### Readiness Endpoint (Deeper Check)

```
URL: https://your-domain.com/api/health/ready
Method: GET
Interval: 5-10 minutes
Expected Response: HTTP 200
Expected Body: { "ready": true, "overall": "ok", ... }
Alert Threshold: 3 consecutive failures
```

### Alert Configuration

| Severity | Condition | Notification |
|----------|-----------|--------------|
| Critical | `/api/health/ping` down for 5+ minutes | PagerDuty, SMS, Slack #alerts |
| Warning | `/api/health/ready` returns "degraded" | Slack #alerts |
| Info | Response time > 2 seconds | Slack #monitoring |

---

## Health Endpoints

### `/api/health/ping`

**Purpose:** Lightweight liveness check for uptime monitors.

- No authentication required
- No database calls
- Returns `{ status: "ok", timestamp: "ISO-8601" }`
- Should respond in < 100ms

### `/api/health/live`

**Purpose:** Process liveness check.

- No authentication required
- Returns `{ alive: true, timestamp: "...", pid: ... }`
- Used by Kubernetes liveness probes

### `/api/health/ready`

**Purpose:** Application readiness check with service verification.

**Checks performed:**
1. **Database (Supabase):** Executes `SELECT 1` equivalent
2. **Clerk API:** Validates API key and connectivity
3. **Stripe API:** Lists 1 customer to verify connectivity

**Response format:**
```json
{
  "ready": true,
  "timestamp": "2026-03-24T10:00:00.000Z",
  "services": {
    "database": { "status": "ok", "latencyMs": 45 },
    "clerk": { "status": "ok", "latencyMs": 120 },
    "stripe": { "status": "ok", "latencyMs": 200 }
  },
  "overall": "ok"
}
```

**Status codes:**
- `200 OK`: All services healthy or degraded but functional
- `503 Service Unavailable`: All services down

**Overall status logic:**
- `ok`: All services healthy
- `degraded`: At least one service down, but not all
- `error`: All services down

---

## Incident Response

### P1: Application Down (All Health Checks Failing)

1. **Verify the issue:**
   ```bash
   curl https://your-domain.com/api/health/ping
   curl https://your-domain.com/api/health/ready
   ```

2. **Check Vercel deployment status:**
   - Vercel Dashboard > Project > Deployments
   - Look for recent failed deployments

3. **Check Sentry for errors:**
   - Look for spike in error rate
   - Check for unhandled exceptions in server runtime

4. **Rollback if necessary:**
   ```bash
   # Via Vercel CLI
   vercel rollback
   ```

5. **Communicate:**
   - Update status page
   - Notify affected schools if data is inaccessible

### P2: Service Degraded (Partial Health Check Failure)

1. **Identify failing service from `/api/health/ready` response**

2. **For Database failures:**
   - Check Supabase dashboard for service status
   - Verify connection pooling limits
   - Check for long-running queries

3. **For Clerk failures:**
   - Check Clerk status page: https://status.clerk.com
   - Verify API keys haven't been rotated

4. **For Stripe failures:**
   - Check Stripe status page: https://status.stripe.com
   - Verify API keys are valid

5. **Document incident in Sentry or incident tracker**

### P3: Performance Degraded (Slow Response Times)

1. **Check Vercel Analytics for slow functions**
2. **Check Sentry for performance traces**
3. **Review database query performance in Supabase dashboard**
4. **Check for memory/CPU pressure**

---

## Cron Job Monitoring

### Cron Jobs Overview

| Job | Schedule | Monitor Slug | Max Runtime |
|-----|----------|--------------|-------------|
| Risk Evaluation | Daily 2 AM UTC | `risk-evaluation` | 10 min |
| Roster Sync | Daily 6 AM UTC | `sync-rosters` | 15 min |
| Scheduled Reports | Hourly | `scheduled-reports` | 10 min |
| Stale Interventions | Weekly Monday 8 AM | `stale-interventions` | 5 min |

### Sentry Cron Monitoring

All cron jobs report check-ins to Sentry Crons. If a job:
- **Misses a scheduled run:** Sentry alerts after check-in margin (5 min)
- **Exceeds max runtime:** Sentry alerts
- **Reports error status:** Sentry captures as error event

**To view cron status:**
1. Sentry > Crons
2. Filter by project: `edunode-analytics`
3. View check-in history and status

### Manual Cron Execution

To manually trigger a cron job (for testing or recovery):

```bash
# Risk Evaluation
curl -X GET https://your-domain.com/api/cron/risk-evaluation \
  -H "Authorization: Bearer $CRON_SECRET"

# Roster Sync
curl -X GET https://your-domain.com/api/cron/sync-rosters \
  -H "Authorization: Bearer $CRON_SECRET"

# Scheduled Reports
curl -X GET https://your-domain.com/api/cron/scheduled-reports \
  -H "Authorization: Bearer $CRON_SECRET"

# Stale Interventions
curl -X GET https://your-domain.com/api/cron/stale-interventions \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Cron Failure Recovery

1. **Check Sentry for error details**
2. **Review cron response in Vercel logs**
3. **Fix underlying issue (data, permissions, etc.)**
4. **Manually re-run the cron job**
5. **Verify successful completion in Sentry Crons**

---

## SIS Sync Failures

### Retry Behavior

SIS sync adapters (Clever, ClassLink, PowerSchool, etc.) use exponential backoff:

| Attempt | Delay Before Retry |
|---------|-------------------|
| 1 | Immediate |
| 2 | 1 second |
| 3 | 2 seconds |
| 4 (final) | 4 seconds |

After all retries fail, the operation is logged to the "dead letter" concept (Sentry event with `dead_letter: true` tag).

### Diagnosing Sync Failures

1. **Check Sentry for dead letter events:**
   ```
   Sentry > Issues > Filter: dead_letter:true
   ```

2. **Review sync history in database:**
   ```sql
   SELECT * FROM sync_history
   WHERE school_id = 'xxx'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Check data source status:**
   ```sql
   SELECT * FROM data_sources
   WHERE school_id = 'xxx';
   ```

4. **Verify credentials are valid:**
   - Clever: Check OAuth token expiry
   - ClassLink: Verify API key
   - PowerSchool: Check plugin status

### Recovery Steps

1. **Fix the underlying issue** (credentials, API limits, data format)
2. **Update data source status:**
   ```sql
   UPDATE data_sources
   SET sync_status = 'pending', sync_error = NULL
   WHERE id = 'xxx';
   ```
3. **Trigger manual sync via admin UI or cron endpoint**
4. **Monitor for successful completion**

---

## Sentry Alert Handling

### Alert Triage

| Alert Type | Response |
|------------|----------|
| `Error rate spike` | Investigate immediately, may indicate deployment issue |
| `New issue in production` | Review within 1 hour, assess severity |
| `Cron check-in missed` | Check Vercel cron logs, may need manual re-run |
| `Dead letter logged` | Review and fix sync issue within 24 hours |

### Key Sentry Tags

- `school_slug`: Identifies affected school
- `school_id`: Database ID of school
- `cron_job`: Which cron job (if applicable)
- `dead_letter: true`: Failed sync after all retries
- `sync_adapter`: Which SIS adapter failed

### Resolving Sentry Issues

1. **Assign issue to owner**
2. **Investigate root cause**
3. **Apply fix and deploy**
4. **Mark issue as resolved with commit reference**

---

## School Onboarding

### New School Setup Checklist

1. **Create school record:**
   - Via admin dashboard: `/admin/schools/new`
   - Or via database insert

2. **Configure data sources:**
   - Add Clever/ClassLink credentials
   - Set sync frequency
   - Test connection

3. **Initial data import:**
   - CSV upload for students, attendance, assessments
   - Or trigger SIS sync

4. **Configure risk model:**
   - Review default weights
   - Adjust thresholds if needed

5. **Add staff members:**
   - Invite via Clerk
   - Assign roles (admin, teacher, viewer)

6. **Verify data flow:**
   - Check risk scores are calculating
   - Verify alerts are generating
   - Confirm dashboard displays data

### Post-Onboarding Verification

Run these checks after onboarding:

```bash
# Verify health
curl https://your-domain.com/api/health/ready

# Verify school data
# (via database query or admin dashboard)
```

---

## Common Issues & Solutions

### Issue: Risk scores not updating

**Symptoms:** Risk scores show old dates, dashboard shows stale data

**Solution:**
1. Check risk evaluation cron status in Sentry
2. Manually trigger: `POST /api/cron/risk-evaluation`
3. Verify student_metrics table has recent data

### Issue: CSV import failing

**Symptoms:** Import button shows error, no data appears

**Solution:**
1. Check file format matches template
2. Verify file size < 5000 rows
3. Check for duplicate `sis_student_id` values
4. Review audit_logs for specific errors

### Issue: Login failures

**Symptoms:** Users can't sign in, redirect loop

**Solution:**
1. Check Clerk status page
2. Verify `NEXT_PUBLIC_CLERK_*` env vars are set
3. Check browser console for errors
4. Clear cookies and retry

### Issue: Stripe payments failing

**Symptoms:** Subscription not activating, payment errors

**Solution:**
1. Check Stripe dashboard for failed payments
2. Verify webhook endpoint is receiving events
3. Check webhook signature validation
4. Review Sentry for Stripe-related errors

### Issue: SIS sync stuck in "syncing"

**Symptoms:** Data source shows "syncing" status for hours

**Solution:**
1. Reset status:
   ```sql
   UPDATE data_sources SET sync_status = 'pending' WHERE id = 'xxx';
   ```
2. Trigger new sync
3. Monitor for completion or error

---

## Running Demo Seed Script

### Purpose
The demo seed script populates "Lighthouse Charter Academy" with realistic data for sales demos and testing.

### Prerequisites
- Node.js 18+ installed
- Environment variables configured:
  - `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Execution

```bash
# From project root
npm run seed:demo

# Or directly with tsx
npx tsx scripts/seed-demo.ts
```

### Expected Output
```
Starting EduNode Analytics Demo Seed...

Cleaning up existing demo data...
Creating school: Lighthouse Charter Academy
Creating user memberships...
Generating 150 students...
Generating 30 days of attendance data...
Creating 20 active interventions...
Generating risk evaluations and alerts...

========================================
Demo Seed Complete!
========================================
School: Lighthouse Charter Academy (lighthouse-demo)

Seeded:
  - 150 students across grades 6-8
  - ~2,500 attendance records (30 days)
  - 20 active interventions
  - 150 risk evaluations
  - Risk alerts

Risk Distribution:
  - On Track: ~60%
  - Watch: ~20%
  - At Risk: ~15%
  - Critical: ~5%

Demo Users:
  - admin@lighthouse.edu (school_admin)
  - coordinator@lighthouse.edu (counselor)
  - teacher@lighthouse.edu (teacher)

========================================
Access the demo at: /lighthouse-demo/dashboard
========================================
```

### Idempotency
The script is idempotent — running it multiple times will:
1. Delete existing demo school data
2. Re-create with fresh seed data
3. Not create duplicates

---

## Resetting a Demo School

### When to Reset
- Before a sales demo
- After demo with prospect-specific customizations
- When data becomes stale or inconsistent

### Reset Procedure

```bash
# Option 1: Re-run seed script (full reset)
npm run seed:demo

# Option 2: Manual cleanup via Supabase SQL
# (Use Supabase Dashboard > SQL Editor)
```

### Manual SQL Reset (if needed)

```sql
-- Delete all data for demo school
DELETE FROM risk_alerts WHERE school_id = 'sch_lighthouse_demo_001';
DELETE FROM risk_scores WHERE school_id = 'sch_lighthouse_demo_001';
DELETE FROM intervention_sessions WHERE school_id = 'sch_lighthouse_demo_001';
DELETE FROM interventions WHERE school_id = 'sch_lighthouse_demo_001';
DELETE FROM attendance_records WHERE school_id = 'sch_lighthouse_demo_001';
DELETE FROM students WHERE school_id = 'sch_lighthouse_demo_001';
DELETE FROM school_memberships WHERE school_id = 'sch_lighthouse_demo_001';
DELETE FROM schools WHERE id = 'sch_lighthouse_demo_001';
```

Then run `npm run seed:demo` to recreate.

---

## Checking Backup Status

### Supabase Backup Configuration

**Current Tier:** Pro (or higher)

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Daily Backup | Every 24 hours | 7 days |
| Point-in-Time Recovery | Continuous | 7 days |

### Verifying Backup Status

1. **Supabase Dashboard:**
   - Navigate to: Project Settings > Database > Backups
   - Verify "Last successful backup" timestamp
   - Check backup size trending

2. **CLI Check:**
   ```bash
   # List recent backups (requires Supabase CLI)
   supabase db remote backup list
   ```

### Recovery Procedure

**For Point-in-Time Recovery:**
1. Contact Supabase support with desired recovery timestamp
2. They will provision a new database instance
3. Update application environment variables to point to recovered instance

**For Daily Backup Restore:**
1. Download backup from Supabase dashboard
2. Create new database instance
3. Restore using `pg_restore`

### Backup Verification (Monthly)

1. Download latest backup
2. Restore to staging environment
3. Run data integrity checks:
   ```sql
   SELECT COUNT(*) FROM schools;
   SELECT COUNT(*) FROM students;
   SELECT COUNT(*) FROM risk_scores;
   ```
4. Verify restored data matches production counts

---

## Contact Information

- **Technical Director:** Eddy Mkwambe (email TBD)
- **On-call escalation:** [Configure in PagerDuty]
- **Sentry project:** [edunode-analytics]
- **Vercel project:** [edunode-analytics]
- **Supabase project:** [edunode-xxx]
- **Slack channel:** #edunode-alerts

---

*This runbook is maintained by the EduNode Engineering team. Last reviewed: March 2026.*
