# EduNode Analytics — MTSS Metrics Loading Bug

## Bug Report & Fix Instructions

> **Status:** Open · **Priority:** P1 · **Date:** April 7, 2026
> **Repo:** `github.com/emkwambe/edunodeanalytics` · **Branch:** `claude/edunode-analytics-saas-9l0uE`
> **Supabase Project:** `cfpongyknrdrudetjhdq`

---

## Problem Statement

The MTSS-related pages (Instructional Pulse, Momentum, MTSS Interventions, Impact Analyzer) fail to load data with the error "Unable to load MTSS metrics." The Dashboard Overview page works correctly — enrollment, attendance, risk distribution all render. But every page that uses the `useMtssSummary` hook fails.

**Console errors show:**
```
Failed to load resource: 400 (Bad Request)
  :3000/api/schools/de_rter/mtss-summary
  :3000/api/schools/de_s/weekly-activity
```

The URL contains garbled strings (`de_rter`, `de_s`) instead of the school UUID (`1e3bee7f-8b7d-4c06-b39f-f376f3e98aec`).

---

## Root Cause Analysis

### Architecture Flow

```
URL: /academy-charter/dashboard/pulse
       │
       ▼
Page Component (Server Component)
  params: { school_slug: "academy-charter" }
       │
       ▼
Client Components (PulseMtssSection, etc.)
  Need schoolId (UUID) to call API routes
       │
       ▼
useCurrentSchool(slug) → useSchoolBySlug(slug)
  calls: /api/schools/by-slug/academy-charter
  returns: { id: "1e3bee7f-...", name: "Academy Charter School", ... }
       │
       ▼
useMtssSummary(schoolId)
  calls: /api/schools/${schoolId}/mtss-summary
  EXPECTED: /api/schools/1e3bee7f-8b7d-4c06-b39f-f376f3e98aec/mtss-summary
  ACTUAL:   /api/schools/de_rter/mtss-summary  ← GARBLED
```

### The Bug

The `schoolId` passed to `useMtssSummary` is NOT the UUID resolved from `useSchoolBySlug`. It is a garbled/truncated value. This means one of:

1. **The client components receive `schoolId` from a different source** — not from `useCurrentSchool`. They may be extracting it from the URL params, a layout context, or a prop that hasn't been updated to pass the UUID.

2. **Race condition** — `useSchoolBySlug` returns `null` initially (SWR loading), but some components render with a stale/undefined value and the URL gets constructed with garbage.

3. **Server Component → Client Component handoff issue** — the page is a Server Component (`async function PulsePage`) that resolves `params.school_slug`. If it passes the slug (not UUID) to client components, and those components use it as `schoolId`, the API call would use the slug instead of UUID. But the slug is `academy-charter`, not `de_rter` — so this alone doesn't explain the garbled value.

4. **Encryption/encoding** — Clerk middleware or Next.js proxy middleware may be transforming the school parameter. The `de_rter` and `de_s` patterns look like partial base64 or URL-encoded fragments.

### Most Likely Cause

The pulse page (`src/app/[school_slug]/dashboard/pulse/page.tsx`) is a **Server Component** that gets `school_slug` from params. It renders `<PulseMtssSection>` which is a **Client Component** that calls `useMtssSummary(schoolId)`. 

The question is: **where does `PulseMtssSection` get its `schoolId`?**

If it gets it from a prop passed by the server component, it's likely the slug (not UUID).
If it gets it from `useCurrentSchool`, there may be a slug → UUID resolution issue.
If it gets it from a layout context, the context may not be set correctly.

---

## Investigation Steps (for Claude Code)

### Step 1: Trace schoolId in PulseMtssSection

```bash
# Read the PulseMtssSection component to see where schoolId comes from
cat src/components/dashboard/pulse-mtss-section.tsx | head -60
```

Look for:
- Does it receive `schoolId` as a prop?
- Does it call `useCurrentSchool(slug)` or `useSchoolBySlug(slug)`?
- Does it extract from URL params via `useParams()`?

### Step 2: Trace schoolId in the Pulse page

```bash
# Read the full pulse page
cat src/app/\[school_slug\]/dashboard/pulse/page.tsx
```

Look for:
- What props does it pass to `<PulseMtssSection>`?
- Does it pass `school_slug` (string) or resolve to UUID first?

### Step 3: Check the dashboard layout for context providers

```bash
# The layout may provide schoolId via context
cat src/app/\[school_slug\]/dashboard/layout.tsx | head -80
```

Look for:
- SchoolProvider, SchoolContext, or similar
- Does the layout resolve slug → UUID and provide it to children?

### Step 4: Check what `de_rter` actually is

```bash
# Search for any encryption, encoding, or ID transformation
grep -r "encrypt\|encode\|obfuscate\|mask.*id" src/lib/ --include="*.ts" -l
```

### Step 5: Check ALL components that call useMtssSummary

```bash
# These are the 6 components that call useMtssSummary:
grep -n "useMtssSummary\|schoolId" src/components/dashboard/mtss-evidence-metrics.tsx | head -20
grep -n "useMtssSummary\|schoolId" src/components/dashboard/pulse-mtss-section.tsx | head -20
```

For each one, verify: **where does `schoolId` come from?**

---

## Fix Strategy

### Option A: Ensure slug → UUID resolution in every client component

Every client component that calls `useMtssSummary(schoolId)` should get `schoolId` from `useCurrentSchool(slug)`, NOT from props or URL params directly.

```tsx
// WRONG: Using slug or prop directly
function PulseMtssSection({ schoolId }: { schoolId: string }) {
  const { data } = useMtssSummary(schoolId); // schoolId might be slug!
}

// RIGHT: Resolve slug → UUID via hook
function PulseMtssSection({ schoolSlug }: { schoolSlug: string }) {
  const { schoolId } = useCurrentSchool(schoolSlug);
  const { data } = useMtssSummary(schoolId); // schoolId is always UUID
}
```

### Option B: Add UUID resolution at the layout level

The dashboard layout (`src/app/[school_slug]/dashboard/layout.tsx`) should resolve the slug to a UUID once and provide it via React Context to all child components.

```tsx
// In layout.tsx
export default function DashboardLayout({ params, children }) {
  const { school_slug } = await params;
  // Server-side: resolve slug → school data
  const school = await getSchoolBySlug(school_slug);
  
  return (
    <SchoolProvider schoolId={school.id} schoolSlug={school_slug}>
      {children}
    </SchoolProvider>
  );
}
```

Then every client component just does:
```tsx
const { schoolId } = useSchoolContext(); // Always UUID
```

### Option C: Make API routes accept both slug and UUID

The simplest fix — modify the API routes to accept either format:

```typescript
// In each API route
export async function GET(request, { params }) {
  let { schoolId } = await params;
  
  // If it's a slug (not UUID format), resolve it
  if (!schoolId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/)) {
    const { data } = await adminSupabase
      .from('schools')
      .select('id')
      .eq('slug', schoolId)
      .single();
    if (!data) return NextResponse.json({ error: 'School not found' }, { status: 404 });
    schoolId = data.id;
  }
  
  // ... rest of the route
}
```

**Recommended:** Option B (layout-level resolution) is the cleanest architecture. Option C is the quickest fix.

---

## Verification After Fix

1. Navigate to `/academy-charter/dashboard/pulse`
2. Open browser DevTools → Network tab
3. Verify API calls go to `/api/schools/1e3bee7f-8b7d-4c06-b39f-f376f3e98aec/mtss-summary` (UUID, not slug or garbled string)
4. MTSS Evidence Metrics card should show real numbers
5. Check all pages: Pulse, Momentum, MTSS Interventions, Impact Analyzer

---

## Data Confirmation

The data in Supabase is correct and verified:

| Table | Rows | Status |
|-------|------|--------|
| students | 1,426 | ✅ Verified |
| student_metrics | 1,426 | ✅ Verified |
| student_metric_history | 8,008 | ✅ Verified |
| risk_evaluations | 1,426 | ✅ Verified |
| interventions | 708 | ✅ Verified |
| intervention_sessions | 4,955 | ✅ Verified |
| intervention_dosage_metrics | 708 | ✅ Verified |
| risk_alerts | 569 | ✅ Verified |
| users | 92 | ✅ Verified |
| notifications | 143 | ✅ Verified |

The `current_risk_scores` view should return data — it joins `risk_evaluations` with `students`. Verify:

```sql
SELECT COUNT(*) FROM current_risk_scores WHERE school_id = '1e3bee7f-8b7d-4c06-b39f-f376f3e98aec';
-- Expected: ~486 rows (Academy Charter students with risk evaluations)
```

---

## Files to Inspect

| File | Why |
|------|-----|
| `src/app/[school_slug]/dashboard/layout.tsx` | Layout may provide schoolId context |
| `src/app/[school_slug]/dashboard/pulse/page.tsx` | Server component that renders MTSS sections |
| `src/components/dashboard/pulse-mtss-section.tsx` | Client component calling useMtssSummary |
| `src/components/dashboard/mtss-evidence-metrics.tsx` | Client component calling useMtssSummary |
| `src/lib/hooks/use-school-context.ts` | Hook that resolves slug → UUID |
| `src/lib/hooks/use-mtss-summary.ts` | Hook that calls the API |
| `src/app/api/schools/[schoolId]/mtss-summary/route.ts` | API route expecting UUID |
| `proxy.ts` or `middleware.ts` | May transform URLs |

---

## Claude Code Prompt

Copy this to start a Claude Code session:

```
Fix the MTSS metrics loading bug in EduNode Analytics.

Problem: Pages that use useMtssSummary(schoolId) are passing garbled strings 
instead of UUIDs to the API. Console shows requests to /api/schools/de_rter/mtss-summary 
instead of /api/schools/1e3bee7f-8b7d-4c06-b39f-f376f3e98aec/mtss-summary.

The Dashboard Overview page works fine. Only MTSS-specific pages fail.

Root cause: The schoolId passed to useMtssSummary is not being resolved from 
slug → UUID correctly. Trace the schoolId value through:
1. src/app/[school_slug]/dashboard/pulse/page.tsx (server component)
2. src/components/dashboard/pulse-mtss-section.tsx (client component)  
3. src/lib/hooks/use-school-context.ts (slug → UUID resolver)

Fix: Ensure every client component that calls useMtssSummary receives a 
properly resolved UUID, either via useCurrentSchool(slug) or a layout-level 
SchoolProvider context.

Test: Navigate to /academy-charter/dashboard/pulse and verify the MTSS 
Evidence Metrics card loads with real data from Supabase.
```

---

*EduNode Analytics Bug Report v1.0*
*© 2026 Mpingo Systems LLC*
