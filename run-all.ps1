#=======================================================================
# run-all.ps1
# EduNode Analytics - Project Discovery Toolkit
# Mpingo Systems CTO Office
#
# Usage:   cd C:\Users\HP\Documents\edunodeanalytics
#          Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#          .\run-all.ps1
#
# Output:  .discovery/discovery-report.md
#=======================================================================

$ErrorActionPreference = "Continue"

if (-not (Test-Path "package.json")) {
    Write-Host "package.json not found. Run from project root." -ForegroundColor Red
    exit 1
}

$projectRoot = Get-Location

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  EDUNODE ANALYTICS - PROJECT DISCOVERY TOOLKIT" -ForegroundColor Cyan
Write-Host "  Mpingo Systems CTO Office" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Path ".discovery" -Force | Out-Null

$startTime = Get-Date

# ---- Load environment variables ----
$envVars = @{}
$envPath = Join-Path $projectRoot ".env.local"
if (Test-Path $envPath) {
    Get-Content $envPath | Where-Object { $_ -match "^[A-Z_]+=.+" -and $_ -notmatch "^#" } | ForEach-Object {
        $parts = $_ -split "=", 2
        $envVars[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
    }
    Write-Host "[OK] .env.local loaded ($($envVars.Count) vars)" -ForegroundColor Green
} else {
    Write-Host "[WARN] .env.local not found" -ForegroundColor Yellow
}

# ---- Shared config ----
$ignoreList = @(
    "node_modules", "\.git", "\.next", "\.turbo", "dist", "build", "out",
    "\.vs", "\.idea", "\.vscode", "coverage", "__pycache__"
)
$excludeRegex = ($ignoreList -join "|")

# =============================================================
# STEP 1: PROJECT STRUCTURE
# =============================================================
Write-Host ""
Write-Host "--- STEP 1: PROJECT STRUCTURE ---" -ForegroundColor Cyan
$out1 = ".discovery/01-project-structure.txt"

$lines1 = @()
$lines1 += "# EDUNODE ANALYTICS - PROJECT STRUCTURE"
$lines1 += "# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$lines1 += "# Root: $projectRoot"
$lines1 += ""

# Top level files
$lines1 += "## TOP-LEVEL FILES"
Get-ChildItem -Path $projectRoot -File | Where-Object { $_.Name -notmatch $excludeRegex } | ForEach-Object {
    $lines1 += "  $($_.Name) ($([math]::Round($_.Length / 1KB, 1)) KB)"
}
$lines1 += ""

# Src directory scan
$lines1 += "## SRC DIRECTORY SCAN"
$srcPath = Join-Path $projectRoot "src"
if (Test-Path $srcPath) {
    $keyDirs = @("app", "components", "lib", "hooks", "types", "utils", "services", "config", "middleware")
    foreach ($dir in $keyDirs) {
        $dirPath = Join-Path $srcPath $dir
        if (Test-Path $dirPath) {
            $files = Get-ChildItem -Path $dirPath -File -Recurse | Where-Object { $_.FullName -notmatch $excludeRegex }
            $lines1 += ""
            $lines1 += "### src/$dir/ ($($files.Count) files)"
            foreach ($f in $files) {
                $relPath = $f.FullName.Substring($srcPath.Length + 1)
                $lines1 += "  $relPath ($([math]::Round($f.Length / 1KB, 1)) KB)"
            }
        }
    }
} else {
    $lines1 += "  [MISSING] src/ directory not found"
}

# File statistics
$allFiles = Get-ChildItem -Path $projectRoot -File -Recurse | Where-Object { $_.FullName -notmatch $excludeRegex }
$byExt = $allFiles | Group-Object Extension | Sort-Object Count -Descending
$lines1 += ""
$lines1 += "## FILE STATISTICS"
$lines1 += "  Total files: $($allFiles.Count)"
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum
$lines1 += "  Total size: $([math]::Round($totalSize / 1MB, 2)) MB"
$lines1 += ""
foreach ($ext in $byExt) {
    $lines1 += "  $($ext.Name): $($ext.Count) files"
}

# Key file checks
$lines1 += ""
$lines1 += "## KEY FILE CHECK"
$keyFiles = @(
    "next.config.ts", "next.config.js", "next.config.mjs", "tsconfig.json",
    "tailwind.config.ts", "package.json", ".env.local",
    "src/middleware.ts", "middleware.ts",
    "src/lib/supabase.ts", "src/lib/supabase-admin.ts",
    "src/lib/risk-engine/types.ts", "src/lib/risk-engine/calculator.ts",
    "src/lib/risk-engine/normalizers.ts", "src/lib/risk-engine/orchestrator.ts",
    "src/app/api/health/route.ts", "public/build-info.json"
)
foreach ($kf in $keyFiles) {
    $exists = Test-Path (Join-Path $projectRoot $kf)
    $icon = if ($exists) { "[EXISTS]" } else { "[MISSING]" }
    $lines1 += "  $icon $kf"
}

$content1 = $lines1 -join "`r`n"
[System.IO.File]::WriteAllText((Join-Path $projectRoot $out1), $content1, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] $out1" -ForegroundColor Green


# =============================================================
# STEP 2: TECH STACK AUDIT
# =============================================================
Write-Host ""
Write-Host "--- STEP 2: TECH STACK AUDIT ---" -ForegroundColor Cyan
$out2 = ".discovery/02-techstack-audit.txt"

$lines2 = @()
$lines2 += "# EDUNODE ANALYTICS - TECH STACK AUDIT"
$lines2 += "# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$lines2 += ""

$pkgPath = Join-Path $projectRoot "package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json

    $lines2 += "## PACKAGE INFO"
    $lines2 += "  Name: $($pkg.name)"
    $lines2 += "  Version: $($pkg.version)"
    $lines2 += ""

    $lines2 += "## SCRIPTS"
    $pkg.scripts.PSObject.Properties | ForEach-Object {
        $lines2 += "  $($_.Name): $($_.Value)"
    }
    $lines2 += ""

    $lines2 += "## DEPENDENCIES ($($pkg.dependencies.PSObject.Properties.Count))"
    $pkg.dependencies.PSObject.Properties | Sort-Object Name | ForEach-Object {
        $lines2 += "  $($_.Name): $($_.Value)"
    }
    $lines2 += ""

    $lines2 += "## DEV DEPENDENCIES ($($pkg.devDependencies.PSObject.Properties.Count))"
    $pkg.devDependencies.PSObject.Properties | Sort-Object Name | ForEach-Object {
        $lines2 += "  $($_.Name): $($_.Value)"
    }
}

# Env var keys only
if (Test-Path $envPath) {
    $lines2 += ""
    $lines2 += "## ENVIRONMENT VARIABLES (keys only)"
    Get-Content $envPath | Where-Object { $_ -match "^[A-Z_]+=.*" -and $_ -notmatch "^#" } | ForEach-Object {
        $keyName = ($_ -split "=")[0]
        $lines2 += "  $keyName"
    }
}

# Next config
$nextConfigs = @("next.config.ts", "next.config.js", "next.config.mjs")
foreach ($nc in $nextConfigs) {
    $ncPath = Join-Path $projectRoot $nc
    if (Test-Path $ncPath) {
        $lines2 += ""
        $lines2 += "## NEXT.JS CONFIG ($nc)"
        $lines2 += (Get-Content $ncPath -Raw)
        break
    }
}

# Runtime versions
$nodeVer = node --version 2>&1
$npmVer = npm --version 2>&1
$lines2 += ""
$lines2 += "## RUNTIME"
$lines2 += "  Node: $nodeVer"
$lines2 += "  npm: $npmVer"

$content2 = $lines2 -join "`r`n"
[System.IO.File]::WriteAllText((Join-Path $projectRoot $out2), $content2, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] $out2" -ForegroundColor Green


# =============================================================
# STEP 3: DATABASE DISCOVERY
# =============================================================
Write-Host ""
Write-Host "--- STEP 3: DATABASE DISCOVERY ---" -ForegroundColor Cyan
$out3 = ".discovery/03-database-schema.txt"

$supabaseUrl = $envVars["NEXT_PUBLIC_SUPABASE_URL"]
$serviceKey  = $envVars["SUPABASE_SERVICE_ROLE_KEY"]

if ($supabaseUrl -and $serviceKey) {
    $dbScript = ".discovery/_db-query.mjs"
    $dbCode = @'
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json'
};

async function main() {
  const report = [];
  report.push('# EDUNODE ANALYTICS - DATABASE SCHEMA');
  report.push('# Generated: ' + new Date().toISOString());
  report.push('# Supabase: ' + SUPABASE_URL);
  report.push('');

  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/', {
      headers: { ...headers, 'Accept': 'application/openapi+json' }
    });

    if (res.ok) {
      const schema = await res.json();
      const defs = schema.definitions || {};
      const tableNames = Object.keys(defs).sort();

      report.push('## TABLES (' + tableNames.length + ' found)');
      report.push('');

      for (const name of tableNames) {
        const props = defs[name].properties || {};
        const required = defs[name].required || [];
        const cols = Object.entries(props).sort(([a],[b]) => a.localeCompare(b));

        report.push('### ' + name + ' (' + cols.length + ' columns)');
        for (const [col, def] of cols) {
          const type = def.format || def.type || 'unknown';
          const nullable = required.includes(col) ? 'NOT NULL' : 'NULL';
          report.push('  ' + col.padEnd(35) + type.padEnd(20) + nullable);
        }
        report.push('');
      }
    } else {
      report.push('## SCHEMA FETCH FAILED: HTTP ' + res.status);
    }
  } catch (err) {
    report.push('## SCHEMA FETCH ERROR: ' + err.message);
  }

  report.push('');
  report.push('## ROW COUNTS');
  const tables = [
    'schools', 'students', 'enrollments', 'interventions',
    'notifications', 'audit_logs', 'data_sources', 'sync_logs',
    'users', 'profiles', 'risk_model_configs', 'student_metrics',
    'student_metric_history', 'risk_evaluations', 'risk_alerts'
  ];

  for (const table of tables) {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/' + table + '?select=count',
        { headers: { ...headers, 'Prefer': 'count=estimated' }, method: 'HEAD' }
      );
      if (res.ok) {
        const range = res.headers.get('content-range') || '?';
        report.push('  ' + table.padEnd(30) + range);
      } else {
        report.push('  ' + table.padEnd(30) + 'NOT FOUND (HTTP ' + res.status + ')');
      }
    } catch (e) {
      report.push('  ' + table.padEnd(30) + 'ERROR: ' + e.message);
    }
  }

  report.push('');
  report.push('## RISK ENGINE TABLE STATUS');
  const riskTables = [
    'risk_model_configs', 'student_metrics', 'student_metric_history',
    'risk_evaluations', 'risk_alerts'
  ];
  for (const t of riskTables) {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/' + t + '?limit=0', { headers });
      const icon = res.ok ? '[EXISTS]' : '[MISSING]';
      report.push('  ' + icon + ' ' + t);
    } catch (e) {
      report.push('  [MISSING] ' + t);
    }
  }

  console.log(report.join('\n'));
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
'@

    [System.IO.File]::WriteAllText((Join-Path $projectRoot $dbScript), $dbCode, [System.Text.UTF8Encoding]::new($false))

    $env:SUPABASE_URL = $supabaseUrl
    $env:SUPABASE_SERVICE_KEY = $serviceKey

    try {
        $dbOutput = & node $dbScript 2>&1
        $dbText = $dbOutput -join "`r`n"
        [System.IO.File]::WriteAllText((Join-Path $projectRoot $out3), $dbText, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  [OK] $out3" -ForegroundColor Green
    } catch {
        $fallback = "# DATABASE DISCOVERY FAILED`r`n# Error: $($_.Exception.Message)"
        [System.IO.File]::WriteAllText((Join-Path $projectRoot $out3), $fallback, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  [WARN] DB query failed" -ForegroundColor Yellow
    }

    Remove-Item Env:\SUPABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:\SUPABASE_SERVICE_KEY -ErrorAction SilentlyContinue
} else {
    $noDb = "# DATABASE DISCOVERY SKIPPED`r`n# Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local"
    [System.IO.File]::WriteAllText((Join-Path $projectRoot $out3), $noDb, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [WARN] Skipped - missing Supabase creds" -ForegroundColor Yellow
}


# =============================================================
# STEP 4: ROUTE AND API INVENTORY
# =============================================================
Write-Host ""
Write-Host "--- STEP 4: ROUTE AND API INVENTORY ---" -ForegroundColor Cyan
$out4 = ".discovery/04-route-api-inventory.txt"

$lines4 = @()
$lines4 += "# EDUNODE ANALYTICS - ROUTE AND API INVENTORY"
$lines4 += "# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$lines4 += ""

$appDir = Join-Path $projectRoot "src/app"
if (Test-Path $appDir) {
    # Pages
    $pages = Get-ChildItem -Path $appDir -Recurse -File | Where-Object { $_.Name -eq "page.tsx" -or $_.Name -eq "page.ts" }
    $lines4 += "## PAGE ROUTES ($($pages.Count))"
    foreach ($p in ($pages | Sort-Object FullName)) {
        $route = $p.Directory.FullName.Substring($appDir.Length).Replace("\", "/")
        if ($route -eq "") { $route = "/" }
        $lines4 += "  $route"
    }
    $lines4 += ""

    # API routes
    $apiFiles = Get-ChildItem -Path $appDir -Recurse -File | Where-Object { $_.Name -eq "route.ts" -or $_.Name -eq "route.tsx" }
    $lines4 += "## API ROUTES ($($apiFiles.Count))"

    foreach ($apiFile in ($apiFiles | Sort-Object FullName)) {
        $route = $apiFile.Directory.FullName.Substring($appDir.Length).Replace("\", "/")
        $fileContent = Get-Content $apiFile.FullName -Raw

        $methods = @()
        if ($fileContent -match "export\s+(async\s+)?function\s+GET")    { $methods += "GET" }
        if ($fileContent -match "export\s+(async\s+)?function\s+POST")   { $methods += "POST" }
        if ($fileContent -match "export\s+(async\s+)?function\s+PUT")    { $methods += "PUT" }
        if ($fileContent -match "export\s+(async\s+)?function\s+PATCH")  { $methods += "PATCH" }
        if ($fileContent -match "export\s+(async\s+)?function\s+DELETE") { $methods += "DELETE" }

        $methodStr = $methods -join ", "
        $lines4 += "  $route  [$methodStr]"
    }
    $lines4 += ""

    # Layouts
    $layouts = Get-ChildItem -Path $appDir -Recurse -File | Where-Object { $_.Name -match "^layout\.(ts|tsx)$" }
    $lines4 += "## LAYOUTS ($($layouts.Count))"
    foreach ($l in ($layouts | Sort-Object FullName)) {
        $lpath = $l.FullName.Substring($appDir.Length).Replace("\", "/")
        $lines4 += "  $lpath"
    }
    $lines4 += ""

    # Risk engine routes check
    $lines4 += "## RISK ENGINE ROUTES CHECK"
    $riskRoutes = @(
        "api/schools/[schoolId]/risk",
        "api/schools/[schoolId]/risk/scores",
        "api/schools/[schoolId]/risk/distribution",
        "api/schools/[schoolId]/risk/drivers",
        "api/schools/[schoolId]/risk/alerts",
        "api/schools/[schoolId]/risk/config"
    )
    foreach ($rr in $riskRoutes) {
        $rrPath = Join-Path $appDir $rr
        $exists = (Test-Path "$rrPath/route.ts") -or (Test-Path "$rrPath/route.tsx")
        $icon = if ($exists) { "[EXISTS]" } else { "[MISSING]" }
        $lines4 += "  $icon $rr"
    }
}

$content4 = $lines4 -join "`r`n"
[System.IO.File]::WriteAllText((Join-Path $projectRoot $out4), $content4, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] $out4" -ForegroundColor Green


# =============================================================
# STEP 5: RISK ENGINE GAP ANALYSIS
# =============================================================
Write-Host ""
Write-Host "--- STEP 5: GAP ANALYSIS ---" -ForegroundColor Cyan
$out5 = ".discovery/05-risk-engine-gap.txt"

$lines5 = @()
$lines5 += "# EDUNODE ANALYTICS - RISK ENGINE GAP ANALYSIS"
$lines5 += "# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$lines5 += ""

# Scan all TypeScript code
$allTsFiles = @()
$srcDir = Join-Path $projectRoot "src"
if (Test-Path $srcDir) {
    $allTsFiles = Get-ChildItem -Path $srcDir -Recurse -File | Where-Object { $_.Extension -match "\.(ts|tsx)$" }
}

$allCode = ""
foreach ($tsf in $allTsFiles) {
    try {
        $fileText = Get-Content $tsf.FullName -Raw -ErrorAction SilentlyContinue
        if ($fileText) { $allCode += $fileText + "`n" }
    } catch {}
}

$totalChecks = 0
$passedChecks = 0
$failedItems = @()

# A) BUILD HEALTH
$lines5 += "## A) BUILD HEALTH"

$buildChecks = @(
    @{ Desc = "package.json"; Test = (Test-Path (Join-Path $projectRoot "package.json")) },
    @{ Desc = "tsconfig.json"; Test = (Test-Path (Join-Path $projectRoot "tsconfig.json")) },
    @{ Desc = ".env.local"; Test = (Test-Path (Join-Path $projectRoot ".env.local")) },
    @{ Desc = "build-info.json"; Test = (Test-Path (Join-Path $projectRoot "public/build-info.json")) }
)
foreach ($c in $buildChecks) {
    $totalChecks++
    if ($c.Test) { $passedChecks++; $lines5 += "  [PASS] Build - $($c.Desc)" }
    else { $lines5 += "  [FAIL] Build - $($c.Desc)"; $failedItems += "Build | $($c.Desc)" }
}
$lines5 += ""

# B) DATA INTEGRATION
$lines5 += "## B) DATA INTEGRATION"
$adapterPaths = @("src/lib/data", "src/lib/adapters", "src/lib/integrations", "src/lib/connectors")
$foundAdapter = $adapterPaths | Where-Object { Test-Path (Join-Path $projectRoot $_) } | Select-Object -First 1
$totalChecks++
if ($foundAdapter) { $passedChecks++; $lines5 += "  [PASS] Data - Adapter directory exists" }
else { $lines5 += "  [FAIL] Data - Adapter directory exists"; $failedItems += "Data | Adapter directory" }

$totalChecks++
$syncExists = Test-Path (Join-Path $projectRoot "src/app/api/cron/sync-rosters/route.ts")
if ($syncExists) { $passedChecks++; $lines5 += "  [PASS] Data - Sync cron routes" }
else { $lines5 += "  [FAIL] Data - Sync cron routes"; $failedItems += "Data | Sync cron routes" }
$lines5 += ""

# C) RISK ENGINE
$lines5 += "## C) RISK ENGINE (CORE)"
$riskDir = Join-Path $projectRoot "src/lib/risk-engine"
$totalChecks++
if (Test-Path $riskDir) { $passedChecks++; $lines5 += "  [PASS] Risk - risk-engine directory" }
else { $lines5 += "  [FAIL] Risk - risk-engine directory"; $failedItems += "Risk | risk-engine directory" }

$riskFiles = @("types.ts", "normalizers.ts", "calculator.ts", "trend-detector.ts", "orchestrator.ts", "alert-engine.ts")
foreach ($rf in $riskFiles) {
    $totalChecks++
    $rfExists = Test-Path (Join-Path $riskDir $rf)
    if ($rfExists) { $passedChecks++; $lines5 += "  [PASS] Risk - risk-engine/$rf" }
    else { $lines5 += "  [FAIL] Risk - risk-engine/$rf"; $failedItems += "Risk | risk-engine/$rf" }
}

$riskPatterns = @(
    @{ Name = "Risk score computation"; Pattern = "risk.?score|computeRisk|calculateRisk" },
    @{ Name = "Weighted indicator model"; Pattern = "weight.*attendance|weight.*academic|weighted.*contribution" },
    @{ Name = "Threshold classification"; Pattern = "on_track|at_risk|risk_level" },
    @{ Name = "Trend detection logic"; Pattern = "trend.*detect|slope.*metric|linear.*regression" },
    @{ Name = "Alert generation"; Pattern = "risk.*alert|threshold.*breach|generateAlert" },
    @{ Name = "Batch evaluation"; Pattern = "batch.*evaluat|evaluateSchool" },
    @{ Name = "Configurable thresholds"; Pattern = "risk.*config|model.*config" },
    @{ Name = "Data completeness handling"; Pattern = "data.?completeness|completeness.*score" }
)
foreach ($rp in $riskPatterns) {
    $totalChecks++
    $found = $allCode -match $rp.Pattern
    if ($found) { $passedChecks++; $lines5 += "  [PASS] Risk - $($rp.Name)" }
    else { $lines5 += "  [FAIL] Risk - $($rp.Name)"; $failedItems += "Risk | $($rp.Name)" }
}
$lines5 += ""

# D) ALERTS
$lines5 += "## D) ALERTS"
$totalChecks++
$notifExists = Test-Path (Join-Path $projectRoot "src/app/api/schools/[schoolId]/notifications/route.ts")
if ($notifExists) { $passedChecks++; $lines5 += "  [PASS] Alerts - Notifications API" }
else { $lines5 += "  [FAIL] Alerts - Notifications API"; $failedItems += "Alerts | Notifications API" }

$totalChecks++
$sevFound = $allCode -match "severity.*(info|warning|urgent|critical)"
if ($sevFound) { $passedChecks++; $lines5 += "  [PASS] Alerts - Severity levels" }
else { $lines5 += "  [FAIL] Alerts - Severity levels"; $failedItems += "Alerts | Severity levels" }

$totalChecks++
$dedupFound = $allCode -match "dedup|existing.*alert"
if ($dedupFound) { $passedChecks++; $lines5 += "  [PASS] Alerts - Deduplication" }
else { $lines5 += "  [FAIL] Alerts - Deduplication"; $failedItems += "Alerts | Deduplication" }
$lines5 += ""

# E) MTSS WORKFLOW
$lines5 += "## E) MTSS WORKFLOW"
$mtssChecks = @(
    @{ Desc = "Interventions API"; Test = (Test-Path (Join-Path $projectRoot "src/app/api/schools/[schoolId]/interventions/route.ts")) },
    @{ Desc = "Tier placement"; Test = ($allCode -match "tier.*[123]|tier_level|mtss.*tier") },
    @{ Desc = "Progress monitoring"; Test = ($allCode -match "progress.*note|baseline.*target") },
    @{ Desc = "Intervention templates"; Test = ($allCode -match "intervention.*template|template.*library") }
)
foreach ($mc in $mtssChecks) {
    $totalChecks++
    if ($mc.Test) { $passedChecks++; $lines5 += "  [PASS] MTSS - $($mc.Desc)" }
    else { $lines5 += "  [FAIL] MTSS - $($mc.Desc)"; $failedItems += "MTSS | $($mc.Desc)" }
}
$lines5 += ""

# F) COMPLIANCE
$lines5 += "## F) COMPLIANCE"
$compChecks = @(
    @{ Desc = "FERPA infrastructure"; Test = ($allCode -match "ferpa|family.*educational") },
    @{ Desc = "PII anonymization"; Test = ($allCode -match "anonymiz|pii.*strip|redact") },
    @{ Desc = "RBAC"; Test = ($allCode -match "rbac|role.*based|user.*role") },
    @{ Desc = "Audit logs"; Test = ($allCode -match "audit.*log|audit_logs") }
)
foreach ($cc in $compChecks) {
    $totalChecks++
    if ($cc.Test) { $passedChecks++; $lines5 += "  [PASS] Compliance - $($cc.Desc)" }
    else { $lines5 += "  [FAIL] Compliance - $($cc.Desc)"; $failedItems += "Compliance | $($cc.Desc)" }
}
$lines5 += ""

# G) EARLY WARNING DASHBOARD
$lines5 += "## G) EARLY WARNING DASHBOARD"
$dashChecks = @(
    @{ Desc = "Dashboard page"; Test = (Test-Path (Join-Path $projectRoot "src/app/[school_slug]/dashboard/page.tsx")) },
    @{ Desc = "Early warning page"; Test = (Test-Path (Join-Path $projectRoot "src/app/[school_slug]/dashboard/early-warning")) },
    @{ Desc = "Risk distribution widget"; Test = ($allCode -match "risk.*distribution|donut.*risk") },
    @{ Desc = "At-risk student table"; Test = ($allCode -match "at.?risk.*table|flagged.*student") }
)
foreach ($dc in $dashChecks) {
    $totalChecks++
    if ($dc.Test) { $passedChecks++; $lines5 += "  [PASS] Dashboard - $($dc.Desc)" }
    else { $lines5 += "  [FAIL] Dashboard - $($dc.Desc)"; $failedItems += "Dashboard | $($dc.Desc)" }
}
$lines5 += ""

# H) TESTING
$lines5 += "## H) TESTING"
$testDirs = @("__tests__", "tests", "test", "src/__tests__")
$foundTests = $testDirs | Where-Object { Test-Path (Join-Path $projectRoot $_) } | Select-Object -First 1
$totalChecks++
if ($foundTests) { $passedChecks++; $lines5 += "  [PASS] Testing - Test directory exists" }
else { $lines5 += "  [FAIL] Testing - Test directory exists"; $failedItems += "Testing | Test directory" }

$totalChecks++
$riskTestFound = $allCode -match "test.*risk|describe.*risk.*scor"
if ($riskTestFound) { $passedChecks++; $lines5 += "  [PASS] Testing - Risk scoring tests" }
else { $lines5 += "  [FAIL] Testing - Risk scoring tests"; $failedItems += "Testing | Risk scoring tests" }
$lines5 += ""

# Summary
$score = 0
if ($totalChecks -gt 0) { $score = [math]::Round(($passedChecks / $totalChecks) * 100, 1) }

$lines5 += "## ========================================"
$lines5 += "## SUMMARY"
$lines5 += "##   Total: $totalChecks  Passed: $passedChecks  Failed: $($totalChecks - $passedChecks)"
$lines5 += "##   Score: ${score}%"
$lines5 += "## ========================================"
$lines5 += ""
$lines5 += "## FAILED ITEMS (Build Priority):"
foreach ($fi in $failedItems) {
    $lines5 += "  -> $fi"
}
$lines5 += ""

# Go/No-Go
$lines5 += "## GO/NO-GO CRITERIA:"
$g1 = if ($allCode -match "risk.?score|computeRisk") { "[PASS]" } else { "[FAIL]" }
$g2 = if ($allCode -match "risk.*alert|threshold.*breach") { "[PASS]" } else { "[FAIL]" }
$g3 = if ($allCode -match "tier.*[123]|intervention") { "[PASS]" } else { "[FAIL]" }
$g4 = if ($allCode -match "risk.*distribution|early.*warning") { "[PASS]" } else { "[FAIL]" }
$g5 = if ($allCode -match "audit.*log|audit_logs") { "[PASS]" } else { "[FAIL]" }
$lines5 += "  $g1 Risk computed automatically"
$lines5 += "  $g2 Alerts trigger on changes"
$lines5 += "  $g3 Tiering and interventions tracked"
$lines5 += "  $g4 Dashboard who/why/what-next"
$lines5 += "  $g5 Audit logs persist"

$content5 = $lines5 -join "`r`n"
[System.IO.File]::WriteAllText((Join-Path $projectRoot $out5), $content5, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] $out5" -ForegroundColor Green
$scoreColor = if ($score -ge 60) { "Green" } elseif ($score -ge 30) { "Yellow" } else { "Red" }
Write-Host "  Score: ${score}% (${passedChecks}/${totalChecks})" -ForegroundColor $scoreColor


# =============================================================
# STEP 6: AGGREGATE REPORT
# =============================================================
Write-Host ""
Write-Host "--- STEP 6: MASTER REPORT ---" -ForegroundColor Cyan
$outFinal = ".discovery/discovery-report.md"

$reportLines = @()
$reportLines += "# EduNode Analytics - Discovery Report"
$reportLines += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$reportLines += "Project: edunodeanalytics"
$reportLines += "Gap Score: ${score}% (${passedChecks}/${totalChecks} checks passed)"
$reportLines += ""
$reportLines += "---"

$parts = @(
    @{ File = $out1; Title = "Project Structure" },
    @{ File = $out2; Title = "Tech Stack" },
    @{ File = $out3; Title = "Database Schema" },
    @{ File = $out4; Title = "Routes and API" },
    @{ File = $out5; Title = "Gap Analysis" }
)

foreach ($part in $parts) {
    $reportLines += ""
    $reportLines += "---"
    $reportLines += ""
    $reportLines += "# $($part.Title)"
    $reportLines += ""
    $partPath = Join-Path $projectRoot $part.File
    if (Test-Path $partPath) {
        $reportLines += (Get-Content $partPath -Raw)
    } else {
        $reportLines += "  (not generated)"
    }
}

$reportLines += ""
$reportLines += "---"
$reportLines += ""
$reportLines += "# Recommended Sprint Plan"
$reportLines += ""
$reportLines += "## Sprint 1: Risk Engine Foundation (Week 1-2)"
$reportLines += "- [ ] Supabase migration for risk tables"
$reportLines += "- [ ] src/lib/risk-engine/types.ts"
$reportLines += "- [ ] src/lib/risk-engine/normalizers.ts"
$reportLines += "- [ ] src/lib/risk-engine/calculator.ts"
$reportLines += "- [ ] Unit tests for normalizers and calculator"
$reportLines += ""
$reportLines += "## Sprint 2: Engine Integration (Week 2-3)"
$reportLines += "- [ ] src/lib/risk-engine/trend-detector.ts"
$reportLines += "- [ ] src/lib/risk-engine/orchestrator.ts"
$reportLines += "- [ ] src/lib/risk-engine/alert-engine.ts"
$reportLines += "- [ ] Nightly cron and post-sync hooks"
$reportLines += "- [ ] Student metrics aggregator"
$reportLines += ""
$reportLines += "## Sprint 3: API Layer (Week 3-4)"
$reportLines += "- [ ] GET /api/schools/[schoolId]/risk/scores"
$reportLines += "- [ ] GET /api/schools/[schoolId]/risk/distribution"
$reportLines += "- [ ] GET /api/schools/[schoolId]/risk/drivers"
$reportLines += "- [ ] GET+PUT /api/schools/[schoolId]/risk/config"
$reportLines += "- [ ] GET+PATCH /api/schools/[schoolId]/risk/alerts"
$reportLines += ""
$reportLines += "## Sprint 4: Early Warning Dashboard (Week 4-5)"
$reportLines += "- [ ] /[school_slug]/dashboard/early-warning page"
$reportLines += "- [ ] Risk distribution chart"
$reportLines += "- [ ] At-risk student table"
$reportLines += "- [ ] Risk driver panel"
$reportLines += "- [ ] Alert feed and intervention pipeline"
$reportLines += ""
$reportLines += "## Sprint 5: Demo and Polish (Week 5-6)"
$reportLines += "- [ ] Seed data generator"
$reportLines += "- [ ] Risk config admin UI"
$reportLines += "- [ ] Demo school walkthrough"
$reportLines += "- [ ] Go/No-Go checklist validation"
$reportLines += ""
$reportLines += "---"
$reportLines += ""
$reportLines += "Upload this file as context for Sprint 1."

$reportContent = $reportLines -join "`r`n"
[System.IO.File]::WriteAllText((Join-Path $projectRoot $outFinal), $reportContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] $outFinal" -ForegroundColor Green


# =============================================================
# DONE
# =============================================================
$duration = (Get-Date) - $startTime

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  DISCOVERY COMPLETE" -ForegroundColor Green
Write-Host "  Time: $([math]::Round($duration.TotalSeconds, 1))s" -ForegroundColor Green
Write-Host "  Score: ${score}% (${passedChecks}/${totalChecks})" -ForegroundColor Green
Write-Host "  Report: .discovery/discovery-report.md" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  NEXT:" -ForegroundColor Yellow
Write-Host "  1. Review .discovery/discovery-report.md" -ForegroundColor Yellow
Write-Host "  2. Upload to next Claude session" -ForegroundColor Yellow
Write-Host "  3. Say: Start Sprint 1 - Risk Engine Foundation" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
