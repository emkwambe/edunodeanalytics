# EduNode Demo Mode Fix — Blueprint for Claude Code

## Project Location
`C:\Users\HP\Documents\edunodeanalytics`

## Branch
`claude/edunode-analytics-saas-9l0uE`

---

## Technical Problem Description

### Problem 1: Subscription Context Race Condition

**File:** `src/contexts/subscription-context.tsx`

**Root cause:** The `SubscriptionProvider` uses `useParams()` to get `school_slug`, then
reads `getSchoolSeed(schoolSlug)` inside a `useState` initializer. The problem:

```tsx
// BROKEN — useParams() returns undefined on first render
const schoolSlug = params?.school_slug as string; // undefined on SSR/first render

const [subscription, setSubscription] = React.useState<SubscriptionState>(() => {
  const schoolSeed = schoolSlug ? getSchoolSeed(schoolSlug) : null;
  // schoolSlug is undefined here → falls back to DEFAULT_SUBSCRIPTION (starter tier)
  // even though academy-tomorrow is enterprise in seed data
});
```

**Effect:** Every school shows "Starter" plan on first render, triggering upgrade banners
and feature gates regardless of the seed tier. The `NEXT_PUBLIC_DEMO_MODE` env var
cannot be reliably read inside `useState` initializers because Turbopack may not have
substituted it yet at that execution point.

**Fix:** Move tier resolution out of `useState` initializer into a `useEffect` that fires
after params resolve. Use a loading state to prevent premature rendering.

---

### Problem 2: PowerShell String Replace Failures

**Root cause:** All patch attempts using `$content.Replace($old, $new)` fail silently
because:
- Files on disk use CRLF line endings (Windows git default)
- PowerShell heredoc strings use LF
- `.Replace()` returns original string unchanged when no match found
- No match verification was done — `Write-Host "✓"` ran regardless

**Effect:** Multiple patches that appeared to succeed actually changed nothing.
The subscription context never received the demo mode override despite many attempts.

---

### Problem 3: Student Picker Blinking

**File:** `src/components/interventions/mtss-intervention-form.tsx` — `StudentPicker` component

**Root cause:** `useEffect` refires on every render because `schoolId` is `null` initially
(while school resolves), then becomes a string. This causes:
1. First fetch: `schoolId = null` → skipped
2. Second fetch: `schoolId = "academy-tomorrow"` → fires, students load
3. Component re-renders → `schoolId` reference changes → fires again → blinking

**Fix:** Use a `useRef` to track whether fetch has been initiated for a given `schoolId`,
preventing duplicate fetches.

---

### Problem 4: `useSchool` Hook Using Wrong Endpoint

**File:** `src/lib/hooks/use-schools.ts`

**Root cause:** `useSchool(schoolIdOrSlug)` was calling `/api/schools/${slug}` which
doesn't exist (returns 404). Correct endpoint for slugs is `/api/schools/by-slug/${slug}`.
A UUID regex check was added but the `useSchoolBySlug` in `use-school-context.ts` still
uses `by-slug` correctly — the issue is only in `use-schools.ts`.

---

## What Has Been Done (Do Not Redo)

- ✅ `src/app/api/schools/[schoolId]/risk/_shared/auth.ts` — slug resolution + demo auth bypass added (working)
- ✅ `src/app/api/schools/by-slug/[slug]/route.ts` — returns seed data when slug matches
- ✅ `src/lib/features/feature-gates.ts` — `hasFeatureAccess` returns true in demo mode
- ✅ `src/lib/hooks/use-schools.ts` — `useSchool` now uses by-slug endpoint for non-UUIDs
- ✅ `src/app/api/schools/[schoolId]/students/route.ts` — accepts slugs via auth middleware

---

## Required Fixes (Claude Code Tasks)

### Task 1 — Fix Subscription Context (HIGHEST PRIORITY)

**File:** `src/contexts/subscription-context.tsx`

**Requirements:**
1. Keep `useParams()` for slug
2. Move tier resolution to `useEffect` (not `useState` initializer)
3. Add `isLoading: true` as initial state while slug resolves
4. When `schoolSlug` resolves, call `getSchoolSeed(schoolSlug)` and set tier from seed
5. Add demo mode override: if `process.env.NEXT_PUBLIC_DEMO_MODE === 'true'`, always
   return `'enterprise'` tier regardless of school
6. Preserve all existing exports: `useSubscription`, `SubscriptionProvider`,
   `SubscriptionState`, `SubscriptionContextValue`
7. Do NOT break the `refreshSubscription`, `openBillingPortal`, `startUpgrade` functions

**Pattern to implement:**
```tsx
export function SubscriptionProvider({ children, initialTier }) {
  const params = useParams();
  const schoolSlug = params?.school_slug as string;

  // Start with loading state — do NOT try to read seed in useState initializer
  const [subscription, setSubscription] = React.useState<SubscriptionState>({
    ...DEFAULT_SUBSCRIPTION,
    status: 'loading',
  });

  // Resolve tier from seed after params are available
  React.useEffect(() => {
    if (!schoolSlug) return;

    // Demo mode override
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      setSubscription({
        ...DEFAULT_SUBSCRIPTION,
        tier: 'enterprise',
        status: 'active',
        studentCount: 487,
        staffSeats: 25,
      });
      return;
    }

    // Resolve from seed data
    const seed = getSchoolSeed(schoolSlug);
    if (seed) {
      setSubscription({
        ...DEFAULT_SUBSCRIPTION,
        tier: seed.subscriptionTier as SubscriptionTier,
        status: 'active',
        studentCount: seed.studentCount,
        staffSeats: 25,
      });
      return;
    }

    // Fall back to initialTier or default
    if (initialTier) {
      setSubscription({ ...DEFAULT_SUBSCRIPTION, tier: initialTier, status: 'active' });
    }
  }, [schoolSlug, initialTier]);

  // ... rest of provider unchanged
}
```

---

### Task 2 — Fix Student Picker Blinking

**File:** `src/components/interventions/mtss-intervention-form.tsx`

**Find the `StudentPicker` function component. Fix the `useEffect` that fetches students:**

```tsx
// CURRENT (broken — refires on every render)
useEffect(() => {
  if (!schoolId) return;
  setIsLoading(true);
  fetch(`/api/schools/${schoolId}/students?limit=500...`)
  ...
}, [schoolId]);

// FIX — use a ref to prevent duplicate fetches
const fetchedForRef = useRef<string | null>(null);

useEffect(() => {
  if (!schoolId) return;
  if (fetchedForRef.current === schoolId) return; // already fetched for this school
  fetchedForRef.current = schoolId;
  setIsLoading(true);
  fetch(`/api/schools/${schoolId}/students?limit=500&sortBy=last_name&sortOrder=asc`)
    .then((r) => r.json())
    .then((d) => {
      setAllStudents(d.data || []);
      setIsLoading(false);
    })
    .catch(() => setIsLoading(false));
}, [schoolId]);
```

Also add `useRef` to the imports at the top of the file if not already present.

---

### Task 3 — Verify Demo Mode Works for All Schools

After Tasks 1 and 2, test these URLs and confirm:
- `http://localhost:3001/academy-tomorrow/interventions` — no upgrade banner, enterprise tier
- `http://localhost:3001/academy-charter/interventions` — no upgrade banner, enterprise tier
- `http://localhost:3001/academy-tomorrow/interventions/new` — student picker loads grades 6/7/8
- Student picker: click Grade 6 → teachers appear → click teacher → students appear

---

### Task 4 — Remove Stale Debug Code (optional, low priority)

In `src/contexts/subscription-context.tsx`, remove any leftover:
- `const { schoolId: _originalId, ..._ } = { schoolId, _: null };` style debug lines
- `Object.assign(params, ...)` calls if any remain

---

## Environment

- Windows PowerShell 7.6.1
- Next.js 16.2.1 with Turbopack
- `.env.local` contains: `NEXT_PUBLIC_DEMO_MODE=true` and `DEMO_MODE=true`
- Always use `[System.IO.File]::WriteAllText(path, content, UTF8)` for file writes
- Never use `cd` + relative paths — always absolute paths
- After edits, verify with `Get-Content -LiteralPath <path> | Select-String -Pattern <term>`
- Restart dev server after `.env.local` changes: `taskkill /F /IM node.exe` then `npm run dev`

---

## Verification Commands

```powershell
# Check subscription context has useEffect tier resolution
Get-Content -LiteralPath "C:\Users\HP\Documents\edunodeanalytics\src\contexts\subscription-context.tsx" | Select-String -Pattern "useEffect|DEMO_MODE|getSchoolSeed"

# Check student picker has fetchedForRef
Get-Content -LiteralPath "C:\Users\HP\Documents\edunodeanalytics\src\components\interventions\mtss-intervention-form.tsx" | Select-String -Pattern "fetchedForRef|useRef"

# Test API directly in browser console
# fetch('/api/schools/academy-tomorrow/students?limit=5').then(r=>r.json()).then(console.log)
```

---

## Files to Read Before Editing

1. `src/contexts/subscription-context.tsx` — read fully before editing
2. `src/components/interventions/mtss-intervention-form.tsx` — read StudentPicker section
3. `src/lib/data/seed-data.ts` lines 574-650 — school seed definitions

---

## Success Criteria

- [ ] No "Upgrade to Pro/Enterprise" banner on any seed school
- [ ] Subscription tier matches seed data (academy-tomorrow = enterprise, academy-charter = pro → overridden to enterprise in demo mode)
- [ ] Student picker loads without blinking
- [ ] Grade → Teacher → Student drill-down works
- [ ] No 404s for `/api/schools/[slug]` (should use `/api/schools/by-slug/[slug]`)
- [ ] All changes committed to branch `claude/edunode-analytics-saas-9l0uE`
