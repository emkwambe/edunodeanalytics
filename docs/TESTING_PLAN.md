# EduNode Analytics — Manual Testing Plan
## Pre-Pilot QA Checklist

**Purpose:** Systematically test every user-facing feature before demoing to Union Day School.
**Tester:** Eddy Kwambe (Founder/CTO)
**Environment:** localhost:3000 with dev server (`npm run dev`)
**Schools available:** Academy Charter (`academy-charter`), Innovation Prep (`innovation-prep`), STEM Scholars (`stem-scholars`)

---

## How to Use This Plan

1. Start `npm run dev`
2. Sign in via Clerk at `/sign-in`
3. Work through each section in order
4. Mark each item: PASS / FAIL / SKIP (with notes)
5. Fix FAILs, retest, repeat until all PASS

---

## T1: Authentication and Access

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T1.1 | Sign up new account | `/sign-up` | Account created, redirected to school selection | |
| T1.2 | Sign in existing account | `/sign-in` | Successful login | |
| T1.3 | School selection | `/select-school` | Shows list of accessible schools | |
| T1.4 | Navigate to school dashboard | `/academy-charter/dashboard` | Dashboard loads without errors | |
| T1.5 | Unauthorized access | `/unauthorized` | Shows unauthorized message | |
| T1.6 | Sign out | Click user avatar > sign out | Returns to sign-in page | |

**After T1:** Ensure you have a user record in Supabase with `platform_admin` role and memberships on all 3 schools. If not, run this SQL in Supabase Dashboard:

```sql
-- Replace YOUR_CLERK_ID with your actual Clerk user ID
-- Find it in Clerk Dashboard > Users
INSERT INTO users (clerk_user_id, email, first_name, last_name, platform_role, is_active)
VALUES ('YOUR_CLERK_ID', 'your@email.com', 'Eddy', 'Kwambe', 'platform_admin', true)
ON CONFLICT (clerk_user_id) DO UPDATE SET platform_role = 'platform_admin';

-- Get your user ID
-- Then add memberships for all 3 schools
INSERT INTO school_memberships (user_id, school_id, role, is_active, is_primary)
SELECT u.id, s.id, 'admin', true, true
FROM users u, schools s
WHERE u.clerk_user_id = 'YOUR_CLERK_ID'
ON CONFLICT DO NOTHING;
```

---

## T2: Dashboard Overview

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T2.1 | Main dashboard loads | `/academy-charter/dashboard` | No errors, shows overview metrics | |
| T2.2 | Sidebar navigation visible | All pages | All menu items render: Overview, Pulse, Momentum, Student 360, Early Warning, Interventions, etc. | |
| T2.3 | School name in header | All pages | Shows "Academy Charter..." in top-left | |
| T2.4 | Switch between schools | Navigate to `/innovation-prep/dashboard` | Different school loads | |

---

## T3: Early Warning Dashboard (CRITICAL — demo centerpiece)

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T3.1 | Page loads | `/academy-charter/dashboard/early-warning` | No errors, renders risk overview | |
| T3.2 | Risk distribution shows | Same | Shows On Track / Watch / At Risk / Critical counts | |
| T3.3 | Student risk table renders | Same | Shows student list with scores, levels, factors | |
| T3.4 | Dosage summary widget | Same | Shows intervention compliance metrics | |
| T3.5 | Dosage alerts widget | Same | Shows dosage-specific alerts | |
| T3.6 | No console errors | Same | Check browser DevTools > Console | |
| T3.7 | No hydration errors | Same | No red hydration error overlay | |

---

## T4: Student 360

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T4.1 | Student list loads | `/academy-charter/dashboard/students` | Shows paginated student list | |
| T4.2 | Student detail page | Click any student | `/academy-charter/student-360/[id]` loads | |
| T4.3 | Risk score visible | Student detail | Shows current risk score and level badge | |
| T4.4 | Risk factors shown | Student detail | Lists contributing risk factors | |
| T4.5 | Risk history chart | Student detail | Shows risk trend over time (if data exists) | |
| T4.6 | Back navigation | Click back | Returns to student list | |

---

## T5: MTSS Interventions

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T5.1 | Interventions page loads | `/academy-charter/interventions` | Shows intervention hub with stats | |
| T5.2 | No hydration errors | Same | No red overlay (Math.random fix verified) | |
| T5.3 | Filter by tier | Click Tier 2 / Tier 3 buttons | List filters correctly | |
| T5.4 | Filter by status | Click Valid / Stale buttons | List filters correctly | |
| T5.5 | New Intervention button | Click "+ New Intervention" | Navigates to `/interventions/new` | |
| T5.6 | New intervention form | `/academy-charter/interventions/new` | Form renders with all fields | |
| T5.7 | Form validation | Submit empty form | Title field shows required | |
| T5.8 | Cancel button | Click Cancel | Returns to interventions list | |
| T5.9 | AI Flight Plan button | Click on any intervention | Opens AI analysis (or shows placeholder) | |
| T5.10 | 3-Week Rule banner | Interventions page | Shows data validity warning | |

---

## T6: Momentum Dashboard

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T6.1 | Page loads without hooks error | `/academy-charter/dashboard/momentum` | No "Rendered more hooks" error | |
| T6.2 | Volatility metrics show | Same | Shows aggregate volatility index | |
| T6.3 | Momentum scores show | Same | Shows momentum calculations | |
| T6.4 | Student cards render | Same | Individual student momentum cards | |

---

## T7: Instructional Pulse

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T7.1 | Page loads | `/academy-charter/dashboard/pulse` | No errors | |
| T7.2 | Metrics display | Same | Shows pulse metrics | |

---

## T8: Attendance Dashboard

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T8.1 | Page loads | `/academy-charter/dashboard/attendance` | No errors | |
| T8.2 | Attendance data shows | Same | Shows attendance metrics/charts | |

---

## T9: Assessments Dashboard

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T9.1 | Page loads | `/academy-charter/dashboard/assessments` | No errors | |
| T9.2 | Assessment data shows | Same | Shows assessment metrics | |

---

## T10: Settings Pages

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T10.1 | Settings page loads | `/academy-charter/settings` | Shows settings overview | |
| T10.2 | Risk Model Config | `/academy-charter/settings/risk-model` | Shows weight sliders and thresholds | |
| T10.3 | Adjust weights | Drag sliders | Total updates live, stays at 100% | |
| T10.4 | Preview calculator | Change weights | "With these settings..." preview updates | |
| T10.5 | Save changes | Click Save | Success message (or API call completes) | |
| T10.6 | Reset to defaults | Click Reset | Values return to defaults | |
| T10.7 | CSV Import page | `/academy-charter/settings/import` | Shows file upload UI | |
| T10.8 | Drag and drop zone | Same | Drop zone is visible and responsive | |
| T10.9 | Upload students CSV | Upload test file | Parses and shows preview | |
| T10.10 | Data sources page | `/academy-charter/settings/data-sources` | Shows connector list | |
| T10.11 | Billing page | `/academy-charter/settings/billing` | Shows subscription info | |
| T10.12 | API settings | `/academy-charter/settings/api` | Shows API keys/docs | |
| T10.13 | SSO settings | `/academy-charter/settings/sso` | Shows SSO config | |
| T10.14 | Integrations | `/academy-charter/settings/integrations` | Shows integration options | |

---

## T11: CSV Import Flow (CRITICAL — pilot onboarding)

Create a test CSV file first:

```csv
sis_student_id,first_name,last_name,grade_level,homeroom_teacher,is_english_learner,is_free_reduced_lunch,has_iep,has_504_plan
TEST001,Maria,Lopez,7,Johnson,false,true,false,false
TEST002,James,Chen,8,Williams,false,false,true,false
TEST003,Aisha,Patel,7,Johnson,true,true,false,false
TEST004,Brandon,Davis,8,Williams,false,false,false,true
TEST005,Sofia,Rodriguez,7,Johnson,false,true,false,false
```

Save as `test-students.csv` on your Desktop.

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T11.1 | Select Students import type | `/academy-charter/settings/import` | Students tab selected | |
| T11.2 | Shows expected format | Same | Column format guide visible | |
| T11.3 | Upload test CSV | Drag or click to upload | File accepted, parsing starts | |
| T11.4 | Preview shows first rows | Same | Shows 5 test students | |
| T11.5 | Validation passes | Same | No row errors | |
| T11.6 | Confirm import | Click confirm/import button | Import processes | |
| T11.7 | Success summary | Same | Shows: 5 processed, 5 created, 0 errors | |
| T11.8 | Students appear | Navigate to student list | Test students visible | |
| T11.9 | Risk scores generated | Early warning dashboard | Test students have risk scores | |
| T11.10 | Re-upload same file | Import again | Updates (no duplicates) — idempotent | |

---

## T12: API Health Checks

Test these in browser or with PowerShell:

```powershell
# Run these while dev server is running
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/health/ready
Invoke-RestMethod http://localhost:3000/api/health/live
```

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T12.1 | Health check | `/api/health` | Returns OK/status JSON | |
| T12.2 | Ready check | `/api/health/ready` | Returns ready status | |
| T12.3 | Live check | `/api/health/live` | Returns live status | |

---

## T13: Risk API Endpoints

Test with PowerShell (replace school ID):

```powershell
$schoolId = "1e3bee7f-8b7d-4c06-b39f-f376f3e98aec"
$base = "http://localhost:3000/api/schools/$schoolId"

Invoke-RestMethod "$base/risk/scores" | ConvertTo-Json -Depth 3
Invoke-RestMethod "$base/risk/distribution" | ConvertTo-Json -Depth 3
Invoke-RestMethod "$base/risk/drivers" | ConvertTo-Json -Depth 3
Invoke-RestMethod "$base/risk/config" | ConvertTo-Json -Depth 3
Invoke-RestMethod "$base/risk/alerts" | ConvertTo-Json -Depth 3
```

| # | Test | Expected | Status |
|---|------|----------|--------|
| T13.1 | Risk scores | Returns paginated student scores | |
| T13.2 | Distribution | Returns tier counts | |
| T13.3 | Drivers | Returns aggregated risk factors | |
| T13.4 | Config | Returns active risk model config | |
| T13.5 | Alerts | Returns alert list | |

---

## T14: Dosage API Endpoints

```powershell
$schoolId = "1e3bee7f-8b7d-4c06-b39f-f376f3e98aec"
Invoke-RestMethod "http://localhost:3000/api/schools/$schoolId/dosage" | ConvertTo-Json -Depth 3
```

| # | Test | Expected | Status |
|---|------|----------|--------|
| T14.1 | Dosage summary | Returns school dosage overview | |

---

## T15: Public Pages (no auth required)

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T15.1 | Landing page | `/` | Loads without errors | |
| T15.2 | Pricing | `/pricing` | Shows tier comparison | |
| T15.3 | Demo request | `/demo` | Shows demo request form | |
| T15.4 | FERPA page | `/ferpa` | Shows FERPA compliance info | |
| T15.5 | Security page | `/security` | Shows security details | |
| T15.6 | Privacy page | `/privacy` | Shows privacy policy | |
| T15.7 | Terms | `/terms` | Shows terms of service | |
| T15.8 | Status | `/status` | Shows system status | |
| T15.9 | Docs | `/docs` | Shows documentation | |
| T15.10 | Blog | `/blog` | Shows blog posts | |

---

## T16: Admin Pages

| # | Test | URL | Expected | Status |
|---|------|-----|----------|--------|
| T16.1 | Admin dashboard | `/admin` | Shows admin overview | |
| T16.2 | Audit logs | `/admin/audit-logs` | Shows audit log viewer | |
| T16.3 | System admin | `/admin/system` | Shows system settings | |

---

## T17: Cross-Browser and Responsive

| # | Test | Expected | Status |
|---|------|----------|--------|
| T17.1 | Chrome desktop | All pages render correctly | |
| T17.2 | Firefox desktop | All pages render correctly | |
| T17.3 | Chrome mobile (DevTools) | Responsive layout, no overflow | |
| T17.4 | Sidebar collapse on mobile | Sidebar collapses/toggles | |

---

## T18: Error Handling

| # | Test | Expected | Status |
|---|------|----------|--------|
| T18.1 | 404 page | Navigate to `/academy-charter/nonexistent` | Shows custom 404 | |
| T18.2 | Invalid school slug | Navigate to `/fake-school/dashboard` | Handles gracefully | |
| T18.3 | No console errors on any tested page | Check DevTools throughout testing | |

---

## T19: Performance

| # | Test | Expected | Status |
|---|------|----------|--------|
| T19.1 | Dashboard initial load | Under 3 seconds | |
| T19.2 | Page navigation | Under 1 second (client-side) | |
| T19.3 | CSV import (5 rows) | Under 5 seconds | |
| T19.4 | No memory leaks | DevTools > Performance monitor stable | |

---

## Test Summary

| Section | Tests | Pass | Fail | Skip |
|---------|-------|------|------|------|
| T1: Auth | 6 | | | |
| T2: Dashboard | 4 | | | |
| T3: Early Warning | 7 | | | |
| T4: Student 360 | 6 | | | |
| T5: Interventions | 10 | | | |
| T6: Momentum | 4 | | | |
| T7: Pulse | 2 | | | |
| T8: Attendance | 2 | | | |
| T9: Assessments | 2 | | | |
| T10: Settings | 14 | | | |
| T11: CSV Import | 10 | | | |
| T12: API Health | 3 | | | |
| T13: Risk API | 5 | | | |
| T14: Dosage API | 1 | | | |
| T15: Public Pages | 10 | | | |
| T16: Admin | 3 | | | |
| T17: Cross-Browser | 4 | | | |
| T18: Error Handling | 3 | | | |
| T19: Performance | 4 | | | |
| **TOTAL** | **100** | | | |

---

## Priority for Demo

If time is limited, test these first (the demo path):

1. **T1.1-T1.4** — Can you sign in and access a school?
2. **T11.1-T11.9** — Can you import students via CSV?
3. **T3.1-T3.7** — Does the Early Warning Dashboard show risk data?
4. **T5.1-T5.6** — Do interventions work?
5. **T10.2-T10.6** — Can you configure the risk model?

These 5 flows ARE the demo. Everything else is supporting infrastructure.

---

*Save to: `docs/TESTING_PLAN.md`*
*Update status columns as you test.*
