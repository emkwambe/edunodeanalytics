# Claude Code Sprint — EduNode Demo Mode Fix

## Read First
Read `DEMO-MODE-FIX-BLUEPRINT.md` in full before touching any file.
Then read each file listed in "Files to Read Before Editing" before editing it.

## Your Job
Fix 2 bugs in the EduNode Analytics codebase at:
`C:\Users\HP\Documents\edunodeanalytics`

---

## Task 1 — Fix Subscription Context (start here)

Read the full file first:
```
src/contexts/subscription-context.tsx
```

Then rewrite the `SubscriptionProvider` function to:
1. Start with `status: 'loading'` as initial state
2. Resolve tier in a `useEffect` after `schoolSlug` is available
3. Check `process.env.NEXT_PUBLIC_DEMO_MODE === 'true'` → set `'enterprise'`
4. Otherwise check `getSchoolSeed(schoolSlug)` → set seed tier
5. Otherwise use `initialTier` prop or default

Keep all existing exports, types, and helper functions intact.
See blueprint for exact pattern.

Verify after: `Get-Content -LiteralPath "C:\Users\HP\Documents\edunodeanalytics\src\contexts\subscription-context.tsx" | Select-String -Pattern "useEffect|DEMO_MODE"`

---

## Task 2 — Fix Student Picker Blinking

Read the StudentPicker component in:
```
src/components/interventions/mtss-intervention-form.tsx
```

Add a `useRef` guard to the fetch `useEffect` to prevent it firing multiple times
for the same `schoolId`. See blueprint for exact pattern.

Verify after: `Get-Content -LiteralPath "C:\Users\HP\Documents\edunodeanalytics\src\components\interventions\mtss-intervention-form.tsx" | Select-String -Pattern "fetchedForRef"`

---

## Task 3 — Test and Commit

After both fixes:

1. Check dev server is running on port 3001
2. Verify in browser:
   - `http://localhost:3001/academy-tomorrow/interventions` — no upgrade banner
   - `http://localhost:3001/academy-tomorrow/interventions/new` — grade buttons appear, no blinking
3. Commit:
```powershell
cd C:\Users\HP\Documents\edunodeanalytics
git add -A
git commit -m "fix: subscription context useEffect tier resolution, student picker debounced fetch"
```

---

## Environment Rules
- Windows PowerShell only
- Always use absolute paths
- File writes: `[System.IO.File]::WriteAllText(path, content, [System.Text.Encoding]::UTF8)`
- Verify every edit with `Get-Content -LiteralPath` + `Select-String`
- Do NOT run `pnpm add` or `pnpm remove` in `apps/cli/`
- Do NOT restart the dev server unless `.env.local` changed
