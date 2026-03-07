# ============================================================
# SPRINT 2 - MASTER EXECUTION SCRIPT
# EduNode Analytics - Mpingo Systems
# ============================================================
#
# PURPOSE: Runs all Sprint 2 deliverables in dependency order.
# Execute each priority independently or run this file for full delivery.
#
# DEPENDENCY ORDER:
#   1. Priority 1 — Regen database.types.ts (unblocks everything)
#   2. Priority 5 — Metrics Aggregator (must exist before orchestrator)
#   3. Priority 3 — Batch Orchestrator (depends on aggregator + engine)
#   4. Priority 2 — API Routes (depends on orchestrator for some endpoints)
#   5. Priority 4 — Nightly Cron (depends on orchestrator)
#
# RUN FROM: C:\Users\HP\Documents\edunodeanalytics
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\HP\Documents\edunodeanalytics"

Set-Location $projectRoot

Write-Host @"

  ╔══════════════════════════════════════════════════╗
  ║       EDUNODE ANALYTICS - SPRINT 2 LAUNCH       ║
  ║       MTSS Risk Engine API Layer                 ║
  ║       Mpingo Systems                             ║
  ╚══════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# -------------------------------------------------------
# EXECUTION ORDER (run each .ps1 from this directory)
# -------------------------------------------------------

Write-Host "  EXECUTION ORDER:" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "  1. 01_regen_database_types.ps1  (Priority 1 - MANUAL: requires Supabase CLI auth)" -ForegroundColor White
Write-Host "  2. 02_metrics_aggregator.ps1    (Priority 5 - Metrics Aggregator)" -ForegroundColor White
Write-Host "  3. 03_batch_orchestrator.ps1    (Priority 3 - Batch Orchestrator)" -ForegroundColor White
Write-Host "  4. 04_risk_api_routes.ps1       (Priority 2 - 6 API Endpoints)" -ForegroundColor White
Write-Host "  5. 05_nightly_cron.ps1          (Priority 4 - Nightly Cron)" -ForegroundColor White
Write-Host "  ─────────────────────────────────────────`n" -ForegroundColor Gray

Write-Host "  IMPORTANT: Run Priority 1 first (requires interactive Supabase login)." -ForegroundColor Magenta
Write-Host "  Priorities 2-5 can be run as a batch after Priority 1 completes.`n" -ForegroundColor Gray

# -------------------------------------------------------
# Prompt to run non-interactive scripts
# -------------------------------------------------------
$runBatch = Read-Host "  Run Priorities 2-5 now? (y/n)"

if ($runBatch -eq 'y') {
    Write-Host "`n  Running Priority 5 (Metrics Aggregator)..." -ForegroundColor Cyan
    & "$PSScriptRoot\02_metrics_aggregator.ps1"
    
    Write-Host "`n  Running Priority 3 (Batch Orchestrator)..." -ForegroundColor Cyan
    & "$PSScriptRoot\03_batch_orchestrator.ps1"
    
    Write-Host "`n  Running Priority 2 (API Routes)..." -ForegroundColor Cyan
    & "$PSScriptRoot\04_risk_api_routes.ps1"
    
    Write-Host "`n  Running Priority 4 (Nightly Cron)..." -ForegroundColor Cyan
    & "$PSScriptRoot\05_nightly_cron.ps1"
    
    Write-Host "`n  ─────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  All scripts executed. Running build..." -ForegroundColor Cyan
    Write-Host "  ─────────────────────────────────────────`n" -ForegroundColor Gray
    
    npm run build 2>&1 | Tee-Object -Variable buildOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n  ✅ BUILD PASSED - Sprint 2 Delivery Complete!" -ForegroundColor Green
    } else {
        Write-Host "`n  ❌ BUILD FAILED - Review errors above." -ForegroundColor Red
    }
} else {
    Write-Host "`n  Run each script individually in the order listed above." -ForegroundColor Gray
}

# -------------------------------------------------------
# FILES CREATED SUMMARY
# -------------------------------------------------------
Write-Host @"

  ╔══════════════════════════════════════════════════╗
  ║             FILES CREATED (SPRINT 2)            ║
  ╠══════════════════════════════════════════════════╣
  ║                                                  ║
  ║  RISK ENGINE CORE:                               ║
  ║  • src/lib/risk-engine/metrics-aggregator.ts     ║
  ║  • src/lib/risk-engine/orchestrator.ts           ║
  ║  • src/lib/risk-engine/index.ts (updated)        ║
  ║                                                  ║
  ║  API ROUTES:                                     ║
  ║  • api/schools/[schoolId]/risk/_shared/auth.ts   ║
  ║  • api/schools/[schoolId]/risk/scores/route.ts   ║
  ║  • api/schools/[schoolId]/risk/distribution/     ║
  ║  • api/schools/[schoolId]/risk/drivers/route.ts  ║
  ║  • api/schools/[schoolId]/risk/config/route.ts   ║
  ║  • api/schools/[schoolId]/risk/alerts/route.ts   ║
  ║  • api/schools/[schoolId]/risk/alerts/[alertId]/ ║
  ║  • api/schools/[schoolId]/risk/history/          ║
  ║    [studentId]/route.ts                          ║
  ║                                                  ║
  ║  CRON:                                           ║
  ║  • api/cron/risk-evaluation/route.ts             ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
