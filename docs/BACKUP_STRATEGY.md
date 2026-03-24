# EduNode Analytics — Backup & Recovery Strategy

**Last Updated:** March 24, 2026  
**Owner:** Eddy Mkwambe (Technical Director)  
**Status:** Pilot-ready

---

## Current Backup Configuration

| Setting | Value |
|---------|-------|
| Provider | Supabase (managed PostgreSQL) |
| Backup Type | Physical (daily, automated) |
| Schedule | Daily around midnight UTC |
| Retention | 7 days (verified March 24, 2026) |
| Storage Objects | NOT included in database backups |
| PITR (Point-in-Time Recovery) | Not enabled (Pro Plan add-on, available but deferred) |

## What Is Backed Up

- All PostgreSQL tables, indexes, and constraints
- Row-Level Security (RLS) policies
- Functions, triggers, and extensions
- User data: schools, students, memberships, risk scores, interventions, dosage metrics, audit logs

## What Is NOT Backed Up

- Files uploaded via Supabase Storage API (only metadata is included)
- Edge Function code (managed via Git/deployment pipeline)
- Environment variables and secrets (managed in Vercel dashboard)

## Restore Procedure

### From Scheduled Backup (Daily Snapshot)

1. Log into Supabase Dashboard → Settings → Database → Backups
2. Select the target backup date from the list
3. Click **Restore**
4. Supabase replaces the current database with the selected snapshot
5. Verify data integrity by running: `SELECT COUNT(*) FROM students; SELECT COUNT(*) FROM risk_scores;`
6. Confirm application health: hit `/api/health/ready`

**WARNING:** Restore is destructive — it replaces the current database entirely. Any data written after the backup timestamp will be lost.

### Estimated Recovery Time

| Metric | Estimate |
|--------|----------|
| Time to initiate restore | < 5 minutes (dashboard access) |
| Restore duration | 5-15 minutes (depends on database size) |
| Total RTO (Recovery Time Objective) | < 30 minutes |
| RPO (Recovery Point Objective) | Up to 24 hours (daily backup interval) |

## Risk Assessment

### Accepted Risk: No PITR

Point-in-Time Recovery is available as a Supabase Pro Plan add-on but is not enabled. This means:

- **Worst case data loss:** Up to 24 hours of data (between daily backups)
- **Mitigation:** For pilot scale (<200 students), a full day's data can be re-entered manually if needed
- **Trigger to enable PITR:** When any of these are true:
  - First paying school is onboarded
  - Daily data volume exceeds what can be manually re-entered (>50 transactions/day)
  - A school contract requires RPO < 1 hour

### Accepted Risk: Storage Objects Not Included

Database backups do not include files stored via Supabase Storage. Currently EduNode does not store files in Supabase Storage (CSV imports are processed and discarded), so this is not a risk for pilot.

**Trigger to mitigate:** If file uploads (IEP documents, report exports, etc.) are stored in Supabase Storage, implement a separate backup via Supabase Storage API or external backup tool.

## Pre-Pilot Verification Checklist

- [x] Daily backups are running (verified March 24, 2026)
- [x] 7-day retention confirmed
- [x] Restore procedure documented
- [ ] Test restore performed on a staging project (recommended before first school)
- [x] PITR decision documented with trigger criteria
- [x] RPO/RTO communicated to stakeholders

## Escalation

If a data loss event occurs during pilot:

1. **Assess scope** — which tables/records are affected?
2. **Check backup list** — identify the most recent clean backup
3. **Notify the school** — provide timeline for recovery
4. **Restore** — follow the procedure above
5. **Post-incident** — document root cause, update this strategy if needed
