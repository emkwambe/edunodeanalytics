# EduNode Analytics — Project Discovery Toolkit
## PowerShell Scripts + Execution Guide

**Purpose:** Systematically discover the current state of the EduNode codebase, query the Supabase database schema, map the tech stack, and produce a gap analysis against the MTSS Risk Engine spec and Developer Checklist.

**Run these scripts in order.** Each one produces a report file. The final script aggregates everything into a single `discovery-report.md`.

---

## Execution Order

```
Step 1: 01-project-structure.ps1      → Maps file tree + architecture
Step 2: 02-techstack-audit.ps1        → Analyzes dependencies + config
Step 3: 03-database-discovery.ps1     → Queries Supabase schema
Step 4: 04-route-api-inventory.ps1    → Maps all routes + API endpoints
Step 5: 05-risk-engine-gap.ps1        → Gap analysis vs spec
Step 6: 06-generate-report.ps1        → Aggregates into discovery-report.md
```

---

## Prerequisites

Before running, ensure:

```powershell
# 1. You're in the project root
cd C:\Users\HP\Documents\edunodeanalytics

# 2. Create discovery output directory
New-Item -ItemType Directory -Path ".discovery" -Force

# 3. Verify .env.local exists and has Supabase creds
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local found" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local missing — database discovery will fail" -ForegroundColor Red
}

# 4. Ensure Node is available (for Supabase queries)
node --version
npx --version
```

---

## Script 1: Project Structure Scanner

**File:** `scripts/discovery/01-project-structure.ps1`

```powershell
#=======================================================================
# scripts/discovery/01-project-structure.ps1
# Purpose: Deep scan of project architecture, file counts, directory
#          layout, and key file identification for EduNode Analytics.
# Output:  .discovery/01-project-structure.txt
#=======================================================================

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location
$outputFile = ".discovery/01-project-structure.txt"

# Ensure output directory exists
New-Item -ItemType Directory -Path ".discovery" -Force | Out-Null

Write-Host "`n🔍 STEP 1: PROJECT STRUCTURE DISCOVERY" -ForegroundColor Cyan
Write-Host "=" * 60

# ── Ignore patterns ──
$ignorePatterns = @(
    "node_modules", ".git", ".next", ".turbo", "dist", "build", "out",
    ".vs", ".idea", ".vscode", "coverage", "__pycache__",
    "*.lock", "*.log", "*.png", "*.jpg", "*.jpeg", "*.gif",
    "*.ico", "*.svg", "*.pdf", "*.zip", "*.woff", "*.woff2", "*.ttf"
)
$excludeRegex = ($ignorePatterns | ForEach-Object {
    [Regex]::Escape($_).Replace('\*', '.*')
}) -join "|"

# ── Header ──
$header = @"
# ============================================================
# EDUNODE ANALYTICS — PROJECT STRUCTURE REPORT
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Root: $projectRoot
# ============================================================

"@

[System.IO.File]::WriteAllText(
    (Join-Path $projectRoot $outputFile),
    $header,
    [System.Text.Encoding]::UTF8
)

# ── Section 1: Top-level files ──
$topFiles = Get-ChildItem -Path $projectRoot -File |
    Where-Object { $_.Name -notmatch $excludeRegex }

$section1 = @"

## 1. TOP-LEVEL FILES (Config + Entry Points)
$("-" * 50)
$($topFiles | ForEach-Object {
    "  $($_.Name) ($([math]::Round($_.Length / 1KB, 1)) KB)"
} | Out-String)
"@
Add-Content -Path $outputFile -Value $section1

# ── Section 2: Directory tree (3 levels deep) ──
$section2Header = @"

## 2. DIRECTORY TREE (3 levels)
$("-" * 50)
"@
Add-Content -Path $outputFile -Value $section2Header

function Get-TreeView {
    param([string]$Path, [int]$Depth = 0, [int]$MaxDepth = 3)
    if ($Depth -ge $MaxDepth) { return }

    $items = Get-ChildItem -Path $Path -Directory |
        Where-Object { $_.Name -notmatch "^(node_modules|\.git|\.next|\.turbo|dist|build|out|coverage)$" } |
        Sort-Object Name

    foreach ($item in $items) {
        $indent = "  " * $Depth
        $fileCount = (Get-ChildItem -Path $item.FullName -File -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch $excludeRegex }).Count
        $line = "${indent}├── $($item.Name)/ ($fileCount files)"
        Add-Content -Path $outputFile -Value $line
        Get-TreeView -Path $item.FullName -Depth ($Depth + 1) -MaxDepth $MaxDepth
    }
}

Get-TreeView -Path $projectRoot

# ── Section 3: src/ deep scan ──
$section3Header = @"

## 3. SRC DIRECTORY DEEP SCAN
$("-" * 50)
"@
Add-Content -Path $outputFile -Value $section3Header

$srcPath = Join-Path $projectRoot "src"
if (Test-Path $srcPath) {
    # Key directories
    $keyDirs = @("app", "components", "lib", "hooks", "types", "utils", "middleware", "services", "config")

    foreach ($dir in $keyDirs) {
        $dirPath = Join-Path $srcPath $dir
        if (Test-Path $dirPath) {
            $files = Get-ChildItem -Path $dirPath -File -Recurse |
                Where-Object { $_.FullName -notmatch $excludeRegex }
            $tsFiles = $files | Where-Object { $_.Extension -match "\.(ts|tsx)$" }

            $dirInfo = @"

### src/$dir/
  Total files: $($files.Count)
  TypeScript:  $($tsFiles.Count)
  Files:
$($files | ForEach-Object {
    $relPath = $_.FullName.Substring($srcPath.Length + 1)
    "    $relPath ($([math]::Round($_.Length / 1KB, 1)) KB)"
} | Out-String)
"@
            Add-Content -Path $outputFile -Value $dirInfo
        }
    }
} else {
    Add-Content -Path $outputFile -Value "  ❌ src/ directory not found"
}

# ── Section 4: File statistics ──
$allFiles = Get-ChildItem -Path $projectRoot -File -Recurse |
    Where-Object { $_.FullName -notmatch $excludeRegex }

$byExtension = $allFiles | Group-Object Extension | Sort-Object Count -Descending

$section4 = @"

## 4. FILE STATISTICS
$("-" * 50)
  Total files (excluding ignored): $($allFiles.Count)
  Total size: $([math]::Round(($allFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB

  By extension:
$($byExtension | ForEach-Object {
    "    $($_.Name): $($_.Count) files"
} | Out-String)
"@
Add-Content -Path $outputFile -Value $section4

# ── Section 5: Key files existence check ──
$keyFiles = @(
    "next.config.ts", "next.config.js", "next.config.mjs",
    "tsconfig.json", "tailwind.config.ts", "tailwind.config.js",
    "package.json", ".env.local", ".env.example",
    "middleware.ts", "src/middleware.ts",
    "supabase/config.toml", "supabase/migrations",
    "src/lib/supabase.ts", "src/lib/supabase-admin.ts",
    "src/lib/auth.ts", "src/lib/risk-engine",
    "src/app/api/health/route.ts",
    "public/build-info.json"
)

$section5 = @"

## 5. KEY FILE EXISTENCE CHECK
$("-" * 50)
$($keyFiles | ForEach-Object {
    $exists = Test-Path (Join-Path $projectRoot $_)
    $icon = if ($exists) { "✅" } else { "❌" }
    "  $icon $_"
} | Out-String)
"@
Add-Content -Path $outputFile -Value $section5

Write-Host "✅ Structure scan complete → $outputFile" -ForegroundColor Green
```

---

## Script 2: Tech Stack Audit

**File:** `scripts/discovery/02-techstack-audit.ps1`

```powershell
#=======================================================================
# scripts/discovery/02-techstack-audit.ps1
# Purpose: Analyze package.json, tsconfig, next.config, and all
#          dependencies to produce a complete tech stack profile.
# Output:  .discovery/02-techstack-audit.txt
#=======================================================================

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location
$outputFile = ".discovery/02-techstack-audit.txt"

New-Item -ItemType Directory -Path ".discovery" -Force | Out-Null

Write-Host "`n🔍 STEP 2: TECH STACK AUDIT" -ForegroundColor Cyan
Write-Host "=" * 60

$header = @"
# ============================================================
# EDUNODE ANALYTICS — TECH STACK AUDIT
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================

"@

[System.IO.File]::WriteAllText(
    (Join-Path $projectRoot $outputFile),
    $header,
    [System.Text.Encoding]::UTF8
)

# ── Section 1: package.json analysis ──
$pkgPath = Join-Path $projectRoot "package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json

    $section1 = @"

## 1. PACKAGE.JSON OVERVIEW
$("-" * 50)
  Name:    $($pkg.name)
  Version: $($pkg.version)
  Private: $($pkg.private)

### Scripts:
$($pkg.scripts.PSObject.Properties | ForEach-Object {
    "  $($_.Name): $($_.Value)"
} | Out-String)

### Dependencies ($($pkg.dependencies.PSObject.Properties.Count)):
$($pkg.dependencies.PSObject.Properties | Sort-Object Name | ForEach-Object {
    "  $($_.Name): $($_.Value)"
} | Out-String)

### Dev Dependencies ($($pkg.devDependencies.PSObject.Properties.Count)):
$($pkg.devDependencies.PSObject.Properties | Sort-Object Name | ForEach-Object {
    "  $($_.Name): $($_.Value)"
} | Out-String)
"@
    Add-Content -Path $outputFile -Value $section1

    # ── Categorize dependencies ──
    $deps = $pkg.dependencies.PSObject.Properties | ForEach-Object { $_.Name }

    $categories = @{
        "Framework"     = $deps | Where-Object { $_ -match "^(next|react|react-dom)$" }
        "Auth"          = $deps | Where-Object { $_ -match "(clerk|auth|next-auth|supabase.*auth)" }
        "Database"      = $deps | Where-Object { $_ -match "(supabase|prisma|drizzle|postgres|pg)" }
        "UI"            = $deps | Where-Object { $_ -match "(radix|shadcn|tailwind|lucide|framer|headless)" }
        "Charts"        = $deps | Where-Object { $_ -match "(recharts|chart|d3|plotly|nivo)" }
        "Forms"         = $deps | Where-Object { $_ -match "(react-hook-form|formik|zod|yup)" }
        "State"         = $deps | Where-Object { $_ -match "(zustand|redux|jotai|recoil)" }
        "API/Data"      = $deps | Where-Object { $_ -match "(axios|swr|tanstack|react-query)" }
        "AI/ML"         = $deps | Where-Object { $_ -match "(openai|anthropic|langchain|ai)" }
        "Payment"       = $deps | Where-Object { $_ -match "(stripe)" }
        "Email"         = $deps | Where-Object { $_ -match "(resend|sendgrid|nodemailer|postmark)" }
        "Testing"       = $deps | Where-Object { $_ -match "(jest|vitest|playwright|cypress|testing)" }
        "EdTech"        = $deps | Where-Object { $_ -match "(clever|classlink|oneroster|lti)" }
    }

    $section1b = @"

### Dependency Categories:
$($categories.GetEnumerator() | ForEach-Object {
    $items = $_.Value -join ", "
    if ($items) { "  [$($_.Key)]: $items" }
} | Out-String)
"@
    Add-Content -Path $outputFile -Value $section1b

} else {
    Add-Content -Path $outputFile -Value "  ❌ package.json not found"
}

# ── Section 2: TypeScript config ──
$tsconfigPath = Join-Path $projectRoot "tsconfig.json"
if (Test-Path $tsconfigPath) {
    $tsRaw = Get-Content $tsconfigPath -Raw
    $section2 = @"

## 2. TSCONFIG.JSON
$("-" * 50)
$tsRaw
"@
    Add-Content -Path $outputFile -Value $section2
}

# ── Section 3: Next.js config ──
$nextConfigs = @("next.config.ts", "next.config.js", "next.config.mjs")
foreach ($nc in $nextConfigs) {
    $ncPath = Join-Path $projectRoot $nc
    if (Test-Path $ncPath) {
        $ncRaw = Get-Content $ncPath -Raw
        $section3 = @"

## 3. NEXT.JS CONFIG ($nc)
$("-" * 50)
$ncRaw
"@
        Add-Content -Path $outputFile -Value $section3
        break
    }
}

# ── Section 4: Environment variables template ──
$envFiles = @(".env.local", ".env.example", ".env")
foreach ($ef in $envFiles) {
    $efPath = Join-Path $projectRoot $ef
    if (Test-Path $efPath) {
        # Only extract KEY names, not values (security)
        $envKeys = Get-Content $efPath | Where-Object {
            $_ -match "^[A-Z_]+=.*" -and $_ -notmatch "^#"
        } | ForEach-Object {
            ($_ -split "=")[0]
        }

        $section4 = @"

## 4. ENVIRONMENT VARIABLES ($ef — keys only, no values)
$("-" * 50)
$($envKeys | ForEach-Object { "  $_" } | Out-String)

  Total env vars: $($envKeys.Count)
"@
        Add-Content -Path $outputFile -Value $section4
    }
}

# ── Section 5: Supabase config check ──
$supaDir = Join-Path $projectRoot "supabase"
$section5 = @"

## 5. SUPABASE CONFIGURATION
$("-" * 50)
"@

if (Test-Path $supaDir) {
    $migrationPath = Join-Path $supaDir "migrations"
    if (Test-Path $migrationPath) {
        $migrations = Get-ChildItem -Path $migrationPath -File | Sort-Object Name
        $section5 += @"

  Migrations found: $($migrations.Count)
$($migrations | ForEach-Object {
    "    $($_.Name) ($([math]::Round($_.Length / 1KB, 1)) KB)"
} | Out-String)
"@
    }

    $configToml = Join-Path $supaDir "config.toml"
    if (Test-Path $configToml) {
        $section5 += "`n  ✅ supabase/config.toml exists"
    }
} else {
    $section5 += "`n  ⚠️  No supabase/ directory found (using hosted Supabase?)"
}

Add-Content -Path $outputFile -Value $section5

# ── Section 6: Node + npm versions ──
$section6 = @"

## 6. RUNTIME VERSIONS
$("-" * 50)
  Node.js: $(node --version 2>&1)
  npm:     $(npm --version 2>&1)
  npx:     $(npx --version 2>&1)
"@
Add-Content -Path $outputFile -Value $section6

Write-Host "✅ Tech stack audit complete → $outputFile" -ForegroundColor Green
```

---

## Script 3: Database Schema Discovery

**File:** `scripts/discovery/03-database-discovery.ps1`

This is the critical one — it queries your live Supabase instance to map every table, column, RLS policy, function, and view.

```powershell
#=======================================================================
# scripts/discovery/03-database-discovery.ps1
# Purpose: Query Supabase Postgres to discover all tables, columns,
#          views, functions, RLS policies, and indexes.
# Output:  .discovery/03-database-schema.txt
# Prereq:  .env.local must contain NEXT_PUBLIC_SUPABASE_URL and
#          SUPABASE_SERVICE_ROLE_KEY
#=======================================================================

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location
$outputFile = ".discovery/03-database-schema.txt"
$queryScript = ".discovery/_db-query-runner.mjs"

New-Item -ItemType Directory -Path ".discovery" -Force | Out-Null

Write-Host "`n🔍 STEP 3: DATABASE SCHEMA DISCOVERY" -ForegroundColor Cyan
Write-Host "=" * 60

# ── Load env vars ──
$envPath = Join-Path $projectRoot ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env.local not found. Cannot query database." -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content $envPath | Where-Object { $_ -match "^[A-Z_]+=.+" -and $_ -notmatch "^#" } | ForEach-Object {
    $parts = $_ -split "=", 2
    $envVars[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
}

$supabaseUrl = $envVars["NEXT_PUBLIC_SUPABASE_URL"]
$serviceKey  = $envVars["SUPABASE_SERVICE_ROLE_KEY"]

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host "❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "  Supabase URL: $supabaseUrl" -ForegroundColor Gray

# ── Create Node.js query runner ──
# Uses Supabase REST API to execute raw SQL via the pg_catalog
$queryRunnerContent = @"
// .discovery/_db-query-runner.mjs
// Purpose: Execute SQL queries against Supabase via REST RPC
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const queries = {
  // 1. All tables in public schema
  tables: `
    SELECT table_name, 
           (SELECT COUNT(*) FROM information_schema.columns c 
            WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `,

  // 2. All columns with types
  columns: `
    SELECT table_name, column_name, data_type, is_nullable, column_default,
           character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `,

  // 3. All views
  views: `
    SELECT table_name as view_name, view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `,

  // 4. All functions
  functions: `
    SELECT routine_name, routine_type, data_type as return_type,
           security_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    ORDER BY routine_name;
  `,

  // 5. RLS policies
  rls_policies: `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `,

  // 6. Indexes
  indexes: `
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `,

  // 7. Foreign keys
  foreign_keys: `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `,

  // 8. Row counts for all tables
  row_counts: `
    SELECT relname as table_name, n_live_tup as estimated_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC;
  `,

  // 9. Enums
  enums: `
    SELECT t.typname as enum_name,
           string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    GROUP BY t.typname
    ORDER BY t.typname;
  `,

  // 10. Check if risk-engine tables exist
  risk_tables_check: `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'risk_model_configs', 'student_metrics', 'student_metric_history',
        'risk_evaluations', 'risk_alerts'
      )
    ORDER BY table_name;
  `
};

async function runQueries() {
  const results = {};

  for (const [name, sql] of Object.entries(queries)) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });

      if (error) {
        // Fallback: try direct fetch via PostgREST
        // Some Supabase instances don't have exec_sql RPC
        results[name] = { error: error.message };
      } else {
        results[name] = data;
      }
    } catch (err) {
      results[name] = { error: err.message };
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

runQueries().catch(console.error);
"@

[System.IO.File]::WriteAllText(
    (Join-Path $projectRoot $queryScript),
    $queryRunnerContent,
    [System.Text.Encoding]::UTF8
)

# ── Alternative: Direct REST API approach (no RPC needed) ──
$directQueryScript = ".discovery/_db-direct-query.mjs"
$directContent = @"
// .discovery/_db-direct-query.mjs
// Purpose: Query Supabase schema using PostgREST metadata endpoints
// This approach works WITHOUT needing an exec_sql RPC function

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function fetchSchema() {
  const report = [];

  // 1. Get OpenAPI schema (lists all tables and their columns)
  report.push('# ============================================================');
  report.push('# EDUNODE ANALYTICS — DATABASE SCHEMA REPORT');
  report.push('# Generated: ' + new Date().toISOString());
  report.push('# ============================================================\n');

  try {
    // Fetch the OpenAPI spec from PostgREST
    const schemaRes = await fetch(SUPABASE_URL + '/rest/v1/', {
      headers: { ...headers, 'Accept': 'application/openapi+json' }
    });

    if (schemaRes.ok) {
      const schema = await schemaRes.json();
      const definitions = schema.definitions || {};

      report.push('## 1. TABLES AND COLUMNS');
      report.push('-'.repeat(50));

      for (const [tableName, tableDef] of Object.entries(definitions).sort()) {
        const props = tableDef.properties || {};
        const required = tableDef.required || [];
        const colCount = Object.keys(props).length;

        report.push('\n### ' + tableName + ' (' + colCount + ' columns)');

        for (const [colName, colDef] of Object.entries(props).sort()) {
          const nullable = !required.includes(colName) ? 'NULL' : 'NOT NULL';
          const type = colDef.format || colDef.type || 'unknown';
          const desc = colDef.description ? '  -- ' + colDef.description : '';
          report.push('  ' + colName.padEnd(35) + type.padEnd(20) + nullable + desc);
        }
      }
    } else {
      report.push('  ⚠️  Could not fetch OpenAPI schema: ' + schemaRes.status);

      // Fallback: just list tables by querying each known endpoint
      report.push('\n## 1. TABLES (Fallback — querying known endpoints)');
      const knownTables = [
        'schools', 'students', 'users', 'interventions', 'notifications',
        'audit_logs', 'data_sources', 'sync_logs', 'assessments',
        'risk_model_configs', 'student_metrics', 'risk_evaluations', 'risk_alerts'
      ];

      for (const table of knownTables) {
        try {
          const res = await fetch(
            SUPABASE_URL + '/rest/v1/' + table + '?limit=0',
            { headers, method: 'HEAD' }
          );
          const status = res.ok ? '✅ EXISTS' : '❌ NOT FOUND (' + res.status + ')';
          report.push('  ' + table.padEnd(30) + status);
        } catch (e) {
          report.push('  ' + table.padEnd(30) + '❌ ERROR: ' + e.message);
        }
      }
    }
  } catch (err) {
    report.push('  ❌ Schema fetch failed: ' + err.message);
  }

  // 2. Row count estimates (query each table)
  report.push('\n\n## 2. TABLE ROW COUNTS (estimates)');
  report.push('-'.repeat(50));

  const tablesToCount = [
    'schools', 'students', 'interventions', 'notifications',
    'audit_logs', 'data_sources', 'sync_logs'
  ];

  for (const table of tablesToCount) {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/' + table + '?select=count',
        {
          headers: {
            ...headers,
            'Prefer': 'count=estimated'
          },
          method: 'HEAD'
        }
      );
      const count = res.headers.get('content-range') || 'unknown';
      report.push('  ' + table.padEnd(30) + count);
    } catch (e) {
      report.push('  ' + table.padEnd(30) + 'ERROR');
    }
  }

  // 3. Check for risk engine tables specifically
  report.push('\n\n## 3. RISK ENGINE TABLE STATUS');
  report.push('-'.repeat(50));

  const riskTables = [
    'risk_model_configs',
    'student_metrics',
    'student_metric_history',
    'risk_evaluations',
    'risk_alerts'
  ];

  for (const table of riskTables) {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/' + table + '?limit=0',
        { headers, method: 'HEAD' }
      );
      const exists = res.ok;
      const icon = exists ? '✅' : '❌';
      report.push('  ' + icon + ' ' + table.padEnd(30) + (exists ? 'EXISTS' : 'MISSING — needs migration'));
    } catch (e) {
      report.push('  ❌ ' + table.padEnd(30) + 'MISSING — needs migration');
    }
  }

  console.log(report.join('\n'));
}

fetchSchema().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
"@

[System.IO.File]::WriteAllText(
    (Join-Path $projectRoot $directQueryScript),
    $directContent,
    [System.Text.Encoding]::UTF8
)

# ── Execute the direct query script ──
Write-Host "  Running database schema discovery..." -ForegroundColor Yellow

$env:SUPABASE_URL = $supabaseUrl
$env:SUPABASE_SERVICE_KEY = $serviceKey

try {
    $dbOutput = & node $directQueryScript 2>&1
    [System.IO.File]::WriteAllText(
        (Join-Path $projectRoot $outputFile),
        ($dbOutput -join "`n"),
        [System.Text.Encoding]::UTF8
    )
    Write-Host "✅ Database discovery complete → $outputFile" -ForegroundColor Green
} catch {
    $errorContent = @"
# DATABASE DISCOVERY — ERROR
# Could not connect to Supabase.
# Error: $($_.Exception.Message)
#
# MANUAL ALTERNATIVE:
# Run this SQL in Supabase SQL Editor (Dashboard → SQL):
#
# -- List all tables
# SELECT table_name FROM information_schema.tables
# WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
# ORDER BY table_name;
#
# -- List all columns
# SELECT table_name, column_name, data_type, is_nullable
# FROM information_schema.columns
# WHERE table_schema = 'public'
# ORDER BY table_name, ordinal_position;
"@
    [System.IO.File]::WriteAllText(
        (Join-Path $projectRoot $outputFile),
        $errorContent,
        [System.Text.Encoding]::UTF8
    )
    Write-Host "⚠️  Database query failed — manual SQL provided in $outputFile" -ForegroundColor Yellow
}

# Clean up env vars
Remove-Item Env:\SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\SUPABASE_SERVICE_KEY -ErrorAction SilentlyContinue
```

---

## Script 4: Route & API Inventory

**File:** `scripts/discovery/04-route-api-inventory.ps1`

```powershell
#=======================================================================
# scripts/discovery/04-route-api-inventory.ps1
# Purpose: Inventory all Next.js app routes, API endpoints, middleware,
#          and their HTTP methods / handler structure.
# Output:  .discovery/04-route-api-inventory.txt
#=======================================================================

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location
$outputFile = ".discovery/04-route-api-inventory.txt"

New-Item -ItemType Directory -Path ".discovery" -Force | Out-Null

Write-Host "`n🔍 STEP 4: ROUTE & API INVENTORY" -ForegroundColor Cyan
Write-Host "=" * 60

$header = @"
# ============================================================
# EDUNODE ANALYTICS — ROUTE & API INVENTORY
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================

"@

[System.IO.File]::WriteAllText(
    (Join-Path $projectRoot $outputFile),
    $header,
    [System.Text.Encoding]::UTF8
)

$appDir = Join-Path $projectRoot "src/app"

if (-not (Test-Path $appDir)) {
    Add-Content -Path $outputFile -Value "❌ src/app directory not found"
    exit 0
}

# ── Section 1: Page routes ──
$pageFiles = Get-ChildItem -Path $appDir -Recurse -File |
    Where-Object { $_.Name -eq "page.tsx" -or $_.Name -eq "page.ts" }

$section1 = @"

## 1. PAGE ROUTES ($($pageFiles.Count) pages)
$("-" * 50)
$($pageFiles | ForEach-Object {
    $route = $_.Directory.FullName.Substring($appDir.Length).Replace("\", "/")
    if ($route -eq "") { $route = "/" }
    $sizeKb = [math]::Round($_.Length / 1KB, 1)
    "  $route  ($sizeKb KB)"
} | Sort-Object | Out-String)
"@
Add-Content -Path $outputFile -Value $section1

# ── Section 2: API routes with HTTP methods ──
$apiFiles = Get-ChildItem -Path $appDir -Recurse -File |
    Where-Object { $_.Name -eq "route.ts" -or $_.Name -eq "route.tsx" }

$section2Header = @"

## 2. API ROUTES ($($apiFiles.Count) endpoints)
$("-" * 50)
"@
Add-Content -Path $outputFile -Value $section2Header

foreach ($apiFile in ($apiFiles | Sort-Object FullName)) {
    $route = $apiFile.Directory.FullName.Substring($appDir.Length).Replace("\", "/")
    $content = Get-Content $apiFile.FullName -Raw

    # Extract HTTP methods
    $methods = @()
    if ($content -match "export\s+(async\s+)?function\s+GET")    { $methods += "GET" }
    if ($content -match "export\s+(async\s+)?function\s+POST")   { $methods += "POST" }
    if ($content -match "export\s+(async\s+)?function\s+PUT")    { $methods += "PUT" }
    if ($content -match "export\s+(async\s+)?function\s+PATCH")  { $methods += "PATCH" }
    if ($content -match "export\s+(async\s+)?function\s+DELETE") { $methods += "DELETE" }

    $methodStr = $methods -join ", "
    $sizeKb = [math]::Round($apiFile.Length / 1KB, 1)

    # Check for auth/middleware patterns
    $hasAuth = $content -match "(getAuth|auth\(\)|currentUser|requireAuth|verifyToken|getServerSession)"
    $hasRLS = $content -match "(supabase|supabaseAdmin|createClient)"
    $authIcon = if ($hasAuth) { "🔒" } else { "🔓" }

    Add-Content -Path $outputFile -Value "  $authIcon $route"
    Add-Content -Path $outputFile -Value "     Methods: $methodStr  |  Size: $sizeKb KB  |  DB: $hasRLS"
}

# ── Section 3: Layout files ──
$layoutFiles = Get-ChildItem -Path $appDir -Recurse -File |
    Where-Object { $_.Name -eq "layout.tsx" -or $_.Name -eq "layout.ts" }

$section3 = @"

## 3. LAYOUT FILES ($($layoutFiles.Count))
$("-" * 50)
$($layoutFiles | ForEach-Object {
    $path = $_.FullName.Substring($appDir.Length).Replace("\", "/")
    "  $path ($([math]::Round($_.Length / 1KB, 1)) KB)"
} | Sort-Object | Out-String)
"@
Add-Content -Path $outputFile -Value $section3

# ── Section 4: Middleware ──
$middlewareFiles = @(
    "src/middleware.ts",
    "middleware.ts",
    "src/middleware.js",
    "middleware.js"
)

$section4 = @"

## 4. MIDDLEWARE
$("-" * 50)
"@

foreach ($mf in $middlewareFiles) {
    $mfPath = Join-Path $projectRoot $mf
    if (Test-Path $mfPath) {
        $mfContent = Get-Content $mfPath -Raw
        $mfSize = [math]::Round((Get-Item $mfPath).Length / 1KB, 1)

        # Extract matcher config
        $matchers = @()
        if ($mfContent -match "matcher:\s*\[([^\]]+)\]") {
            $matchers = $Matches[1] -split "," | ForEach-Object { $_.Trim().Trim("'`"") }
        }

        $section4 += @"

  ✅ Found: $mf ($mfSize KB)
  Matchers:
$($matchers | ForEach-Object { "    $_" } | Out-String)
"@
        break
    }
}

Add-Content -Path $outputFile -Value $section4

# ── Section 5: Risk engine routes check ──
$riskRoutes = @(
    "src/app/api/schools/[schoolId]/risk",
    "src/app/api/schools/[schoolId]/risk/scores",
    "src/app/api/schools/[schoolId]/risk/distribution",
    "src/app/api/schools/[schoolId]/risk/drivers",
    "src/app/api/schools/[schoolId]/risk/alerts",
    "src/app/api/schools/[schoolId]/risk/config"
)

$section5 = @"

## 5. RISK ENGINE ROUTES CHECK
$("-" * 50)
$($riskRoutes | ForEach-Object {
    $routePath = Join-Path $projectRoot $_
    $exists = (Test-Path "$routePath/route.ts") -or (Test-Path "$routePath/route.tsx")
    $icon = if ($exists) { "✅" } else { "❌" }
    "  $icon $_"
} | Out-String)
"@
Add-Content -Path $outputFile -Value $section5

# ── Section 6: Risk engine source files ──
$riskEngineDir = Join-Path $projectRoot "src/lib/risk-engine"
$section6 = @"

## 6. RISK ENGINE SOURCE FILES
$("-" * 50)
"@

if (Test-Path $riskEngineDir) {
    $reFiles = Get-ChildItem -Path $riskEngineDir -File -Recurse
    $section6 += @"

  ✅ src/lib/risk-engine/ exists ($($reFiles.Count) files)
$($reFiles | ForEach-Object {
    $relPath = $_.FullName.Substring($riskEngineDir.Length + 1)
    "    $relPath ($([math]::Round($_.Length / 1KB, 1)) KB)"
} | Out-String)
"@
} else {
    $section6 += "`n  ❌ src/lib/risk-engine/ does not exist — needs to be created"
}

Add-Content -Path $outputFile -Value $section6

Write-Host "✅ Route inventory complete → $outputFile" -ForegroundColor Green
```

---

## Script 5: Risk Engine Gap Analysis

**File:** `scripts/discovery/05-risk-engine-gap.ps1`

```powershell
#=======================================================================
# scripts/discovery/05-risk-engine-gap.ps1
# Purpose: Systematic gap analysis against the MTSS Risk Engine spec
#          and Developer Checklist. Checks for file existence, key
#          patterns, and required implementations.
# Output:  .discovery/05-risk-engine-gap.txt
#=======================================================================

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location
$outputFile = ".discovery/05-risk-engine-gap.txt"

New-Item -ItemType Directory -Path ".discovery" -Force | Out-Null

Write-Host "`n🔍 STEP 5: RISK ENGINE GAP ANALYSIS" -ForegroundColor Cyan
Write-Host "=" * 60

$header = @"
# ============================================================
# EDUNODE ANALYTICS — RISK ENGINE GAP ANALYSIS
# Measured against: Technical Spec v1.0 + Developer Checklist
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================

"@

[System.IO.File]::WriteAllText(
    (Join-Path $projectRoot $outputFile),
    $header,
    [System.Text.Encoding]::UTF8
)

$totalChecks = 0
$passedChecks = 0
$failedItems = @()

function Test-Check {
    param([string]$Category, [string]$Description, [bool]$Passed, [string]$Detail = "")
    $script:totalChecks++
    if ($Passed) {
        $script:passedChecks++
        $icon = "✅"
    } else {
        $icon = "❌"
        $script:failedItems += "[$Category] $Description"
    }
    $line = "  $icon $Description"
    if ($Detail) { $line += " — $Detail" }
    Add-Content -Path $outputFile -Value $line
}

# ─────────────────────────────────────────────
# A) REPO & BUILD HEALTH
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## A) REPO & BUILD HEALTH`n"

Test-Check "Build" "package.json exists" (Test-Path (Join-Path $projectRoot "package.json"))
Test-Check "Build" "tsconfig.json exists" (Test-Path (Join-Path $projectRoot "tsconfig.json"))
Test-Check "Build" ".env.local exists" (Test-Path (Join-Path $projectRoot ".env.local"))
Test-Check "Build" "build-info.json exists" (Test-Path (Join-Path $projectRoot "public/build-info.json"))

$nextConfigs = @("next.config.ts", "next.config.js", "next.config.mjs")
$hasNextConfig = $nextConfigs | Where-Object { Test-Path (Join-Path $projectRoot $_) }
Test-Check "Build" "next.config exists" ($null -ne $hasNextConfig)

# ─────────────────────────────────────────────
# B) DATA INTEGRATION LAYER
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## B) DATA INTEGRATION LAYER`n"

$adapterDir = Join-Path $projectRoot "src/lib/data"
$adapterPaths = @(
    "src/lib/data", "src/lib/adapters", "src/services/adapters",
    "src/lib/integrations", "src/lib/connectors"
)

$foundAdapterDir = $adapterPaths | Where-Object { Test-Path (Join-Path $projectRoot $_) } | Select-Object -First 1
Test-Check "Data" "Adapter directory exists" ($null -ne $foundAdapterDir) $foundAdapterDir

if ($foundAdapterDir) {
    $adapterFiles = Get-ChildItem -Path (Join-Path $projectRoot $foundAdapterDir) -File -Recurse
    $adapterContent = $adapterFiles | ForEach-Object { Get-Content $_.FullName -Raw }
    $allAdapterText = $adapterContent -join "`n"

    $adapters = @{
        "Canvas"           = "canvas"
        "PowerSchool"      = "powerschool|power.?school"
        "Clever"           = "clever"
        "ClassLink"        = "classlink|class.?link"
        "Google Classroom" = "google.?classroom"
        "MAP/NWEA"         = "nwea|map.?growth"
        "iReady"           = "iready|i.?ready"
        "Renaissance/STAR" = "renaissance|star.?assessment"
    }

    foreach ($adapter in $adapters.GetEnumerator()) {
        $found = $allAdapterText -match $adapter.Value
        Test-Check "Data" "Adapter: $($adapter.Key)" $found
    }
}

# Sync cron endpoints
$cronPaths = @(
    "src/app/api/cron/sync-rosters/route.ts",
    "src/app/api/cron/scheduled-reports/route.ts",
    "src/app/api/cron/stale-interventions/route.ts"
)
foreach ($cp in $cronPaths) {
    Test-Check "Data" "Cron: $cp" (Test-Path (Join-Path $projectRoot $cp))
}

# ─────────────────────────────────────────────
# C) RISK DETECTION ENGINE (THE BIG ONE)
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## C) RISK DETECTION ENGINE`n"

$riskEnginePath = "src/lib/risk-engine"
$riskDir = Join-Path $projectRoot $riskEnginePath
Test-Check "Risk" "Risk engine directory exists ($riskEnginePath)" (Test-Path $riskDir)

$riskFiles = @{
    "types.ts"          = "Type definitions (RiskModelConfig, StudentMetrics, etc.)"
    "normalizers.ts"    = "Indicator normalizer functions"
    "calculator.ts"     = "Composite score calculator"
    "trend-detector.ts" = "Trend detection (linear regression)"
    "orchestrator.ts"   = "Batch evaluation orchestrator"
    "alert-engine.ts"   = "Alert generation logic"
}

foreach ($rf in $riskFiles.GetEnumerator()) {
    $filePath = Join-Path $riskDir $rf.Key
    Test-Check "Risk" "File: $($rf.Key) — $($rf.Value)" (Test-Path $filePath)
}

# Check for risk computation patterns in entire codebase
$allTsFiles = Get-ChildItem -Path (Join-Path $projectRoot "src") -Recurse -File |
    Where-Object { $_.Extension -match "\.(ts|tsx)$" }
$allCode = $allTsFiles | ForEach-Object { Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue }
$allCodeText = $allCode -join "`n"

$riskPatterns = @{
    "Risk score computation"    = "risk.?score|computeRisk|calculateRisk"
    "Weighted indicator model"  = "weight.*attendance|weight.*academic|weighted.*contribution"
    "Threshold classification"  = "on_track|at_risk|critical.*threshold|risk_level"
    "Trend detection"           = "trend.*detect|slope.*metric|linear.*regression|week.*over.*week"
    "Alert generation"          = "risk.*alert|threshold.*breach|alert.*trigger"
    "Batch evaluation"          = "batch.*evaluat|evaluateSchool|nightly.*batch"
    "Data completeness"         = "data.?completeness|completeness.*score|missing.*data.*penalty"
    "Configurable thresholds"   = "risk.*config|model.*config|threshold.*config"
}

foreach ($rp in $riskPatterns.GetEnumerator()) {
    $found = $allCodeText -match $rp.Value
    Test-Check "Risk" "Pattern: $($rp.Key)" $found
}

# ─────────────────────────────────────────────
# D) ALERTS & TRIGGERS
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## D) ALERTS & TRIGGER SYSTEM`n"

$notifRoute = "src/app/api/schools/[schoolId]/notifications/route.ts"
Test-Check "Alerts" "Notifications API exists" (Test-Path (Join-Path $projectRoot $notifRoute))

$alertPatterns = @{
    "Alert severity levels"   = "severity.*(info|warning|urgent|critical)"
    "Alert deduplication"     = "dedup|existing.*alert|already.*alerted"
    "Mark as read/resolved"   = "mark.*read|resolve.*alert|acknowledge"
    "Alert audit logging"     = "audit.*alert|alert.*log|evidence.*snapshot"
}

foreach ($ap in $alertPatterns.GetEnumerator()) {
    $found = $allCodeText -match $ap.Value
    Test-Check "Alerts" "Pattern: $($ap.Key)" $found
}

# ─────────────────────────────────────────────
# E) MTSS WORKFLOW
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## E) MTSS WORKFLOW (Tiering + Interventions)`n"

$interventionRoute = "src/app/api/schools/[schoolId]/interventions/route.ts"
Test-Check "MTSS" "Interventions API exists" (Test-Path (Join-Path $projectRoot $interventionRoute))

$mtssPatterns = @{
    "Tier placement (1/2/3)"   = "tier.*[123]|tier_level|mtss.*tier"
    "Intervention templates"   = "intervention.*template|template.*library"
    "Progress monitoring"      = "progress.*note|baseline.*target|goal.*tracking"
    "Effectiveness metrics"    = "effectiveness|pre.*post.*delta|outcome.*metric"
    "Tier change history"      = "tier.*history|tier.*change|tier.*transition"
}

foreach ($mp in $mtssPatterns.GetEnumerator()) {
    $found = $allCodeText -match $mp.Value
    Test-Check "MTSS" "Pattern: $($mp.Key)" $found
}

# ─────────────────────────────────────────────
# F) COMPLIANCE & AUDIT
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## F) COMPLIANCE & AUDIT`n"

$compliancePatterns = @{
    "FERPA infrastructure"     = "ferpa|family.*educational.*rights"
    "PII anonymization"        = "anonymiz|pii.*strip|redact.*pii"
    "RBAC access control"      = "rbac|role.*based|user.*role.*check"
    "Audit log persistence"    = "audit.*log|audit_logs|create.*audit"
    "Audit log viewer UI"      = "audit.*viewer|audit.*log.*page|audit.*dashboard"
    "Export endpoint"          = "export.*csv|export.*json|download.*report"
}

foreach ($cp in $compliancePatterns.GetEnumerator()) {
    $found = $allCodeText -match $cp.Value
    Test-Check "Compliance" "Pattern: $($cp.Key)" $found
}

# ─────────────────────────────────────────────
# G) EARLY WARNING DASHBOARD
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## G) EARLY WARNING DASHBOARD`n"

$dashboardPages = @(
    "src/app/[school_slug]/dashboard/page.tsx",
    "src/app/[school_slug]/dashboard/early-warning",
    "src/app/[school_slug]/dashboard/pulse/page.tsx",
    "src/app/[school_slug]/dashboard/momentum/page.tsx",
    "src/app/[school_slug]/dashboard/students/page.tsx"
)

foreach ($dp in $dashboardPages) {
    $dpPath = Join-Path $projectRoot $dp
    $exists = (Test-Path $dpPath) -or (Test-Path "$dpPath/page.tsx")
    Test-Check "Dashboard" "Page: $dp" $exists
}

$dashboardPatterns = @{
    "Risk distribution widget"    = "risk.*distribution|donut.*chart.*risk|risk.*breakdown"
    "At-risk student table"       = "at.?risk.*table|risk.*student.*list|flagged.*students"
    "Risk driver breakdown"       = "risk.*driver|driver.*breakdown|top.*factors"
    "Intervention pipeline view"  = "intervention.*pipeline|pipeline.*view|intervention.*status"
    "Trend over time chart"       = "trend.*chart|risk.*over.*time|historical.*risk"
    "No intervention list"        = "no.*intervention|unassigned.*risk|needs.*intervention"
}

foreach ($dp in $dashboardPatterns.GetEnumerator()) {
    $found = $allCodeText -match $dp.Value
    Test-Check "Dashboard" "Pattern: $($dp.Key)" $found
}

# ─────────────────────────────────────────────
# H) TESTING
# ─────────────────────────────────────────────
Add-Content -Path $outputFile -Value "`n## H) TESTING`n"

$testDirs = @("__tests__", "tests", "test", "src/__tests__", "src/lib/risk-engine/__tests__")
$foundTestDir = $testDirs | Where-Object { Test-Path (Join-Path $projectRoot $_) } | Select-Object -First 1
Test-Check "Testing" "Test directory exists" ($null -ne $foundTestDir) $foundTestDir

$testPatterns = @{
    "Risk scoring unit tests"   = "test.*risk.*scor|describe.*risk|it.*should.*compute.*risk"
    "Threshold evaluation tests" = "test.*threshold|test.*classify|test.*risk.*level"
    "Trend detection tests"      = "test.*trend|test.*slope|test.*decline"
    "Adapter integration tests"  = "test.*adapter|test.*sync|test.*connector"
}

foreach ($tp in $testPatterns.GetEnumerator()) {
    $found = $allCodeText -match $tp.Value
    Test-Check "Testing" "Pattern: $($tp.Key)" $found
}

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
$score = if ($totalChecks -gt 0) { [math]::Round(($passedChecks / $totalChecks) * 100, 1) } else { 0 }

$summary = @"

## ═══════════════════════════════════════════════
## SUMMARY
## ═══════════════════════════════════════════════

  Total checks:  $totalChecks
  Passed:        $passedChecks
  Failed:        $($totalChecks - $passedChecks)
  Score:         $score%

## FAILED ITEMS (Build Priority):
$($failedItems | ForEach-Object { "  → $_" } | Out-String)

## GO/NO-GO CRITERIA:
  $( if ($allCodeText -match "risk.?score|computeRisk") { "✅" } else { "❌" } ) Risk is computed automatically and explainable
  $( if ($allCodeText -match "risk.*alert|threshold.*breach") { "✅" } else { "❌" } ) Alerts trigger on risk changes
  $( if ($allCodeText -match "tier.*[123]|intervention.*lifecycle") { "✅" } else { "❌" } ) Tiering + interventions tracked with history
  $( if ($allCodeText -match "risk.*distribution|early.*warning") { "✅" } else { "❌" } ) Dashboard gives who/why/what-next view
  $( if ($allCodeText -match "audit.*log|audit_logs") { "✅" } else { "❌" } ) Audit logs persist and export
"@

Add-Content -Path $outputFile -Value $summary

Write-Host "✅ Gap analysis complete → $outputFile" -ForegroundColor Green
Write-Host "   Score: $score% ($passedChecks / $totalChecks checks passed)" -ForegroundColor $(if ($score -ge 70) { "Green" } elseif ($score -ge 40) { "Yellow" } else { "Red" })
```

---

## Script 6: Aggregate Discovery Report

**File:** `scripts/discovery/06-generate-report.ps1`

```powershell
#=======================================================================
# scripts/discovery/06-generate-report.ps1
# Purpose: Merge all discovery outputs into a single discovery-report.md
# Output:  .discovery/discovery-report.md
#=======================================================================

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location
$outputFile = ".discovery/discovery-report.md"

Write-Host "`n📋 STEP 6: GENERATING FINAL DISCOVERY REPORT" -ForegroundColor Cyan
Write-Host "=" * 60

$reportHeader = @"
# EduNode Analytics — Full Discovery Report
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Project:** edunodeanalytics
**Purpose:** Pre-sprint discovery for MTSS Risk Engine build

---

> This report was auto-generated by the EduNode Discovery Toolkit.
> Use this as the context document for all sprint planning sessions.

---

"@

[System.IO.File]::WriteAllText(
    (Join-Path $projectRoot $outputFile),
    $reportHeader,
    [System.Text.Encoding]::UTF8
)

$sections = @(
    @{ File = ".discovery/01-project-structure.txt"; Title = "Part 1: Project Structure" },
    @{ File = ".discovery/02-techstack-audit.txt";   Title = "Part 2: Tech Stack" },
    @{ File = ".discovery/03-database-schema.txt";   Title = "Part 3: Database Schema" },
    @{ File = ".discovery/04-route-api-inventory.txt"; Title = "Part 4: Routes & API" },
    @{ File = ".discovery/05-risk-engine-gap.txt";   Title = "Part 5: Gap Analysis" }
)

foreach ($section in $sections) {
    $filePath = Join-Path $projectRoot $section.File

    $sectionHeader = @"

---

# $($section.Title)

"@
    Add-Content -Path $outputFile -Value $sectionHeader

    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        Add-Content -Path $outputFile -Value $content
        Write-Host "  ✅ Included: $($section.File)" -ForegroundColor Green
    } else {
        Add-Content -Path $outputFile -Value "  ⚠️  File not found: $($section.File) — run the corresponding script first."
        Write-Host "  ⚠️  Missing: $($section.File)" -ForegroundColor Yellow
    }
}

# ── Append next steps ──
$nextSteps = @"

---

# Part 6: Recommended Next Steps

Based on the discovery results above, here is the recommended build order:

## Sprint 0 (Discovery Complete → This Document)
- [x] Project structure mapped
- [x] Tech stack audited
- [x] Database schema discovered
- [x] Routes inventoried
- [x] Gap analysis completed

## Sprint 1: Risk Engine Foundation
- [ ] Create Supabase migration for risk tables
- [ ] Implement TypeScript types (risk-engine/types.ts)
- [ ] Implement normalizer functions (risk-engine/normalizers.ts)
- [ ] Implement composite calculator (risk-engine/calculator.ts)
- [ ] Unit tests for all normalizers + calculator

## Sprint 2: Engine Integration
- [ ] Implement trend detector (risk-engine/trend-detector.ts)
- [ ] Implement batch orchestrator (risk-engine/orchestrator.ts)
- [ ] Implement alert engine (risk-engine/alert-engine.ts)
- [ ] Wire sync events → metrics update → risk evaluation
- [ ] Nightly cron job for batch evaluation

## Sprint 3: API Layer
- [ ] Risk scores endpoint (GET /api/schools/[schoolId]/risk/scores)
- [ ] Risk distribution endpoint
- [ ] Risk drivers endpoint
- [ ] Risk config CRUD endpoints
- [ ] Alert management endpoints

## Sprint 4: Early Warning Dashboard
- [ ] Dashboard page (/[school_slug]/dashboard/early-warning)
- [ ] Risk distribution visualization
- [ ] At-risk student table
- [ ] Risk driver breakdown panel
- [ ] Alert feed component

## Sprint 5: Polish + Demo
- [ ] Risk config admin UI
- [ ] Seed data for demo school
- [ ] Demo walkthrough flow
- [ ] Go/No-Go checklist validation

---

*Upload this file to your next Claude session to maintain full context.*
"@

Add-Content -Path $outputFile -Value $nextSteps

Write-Host "`n✅ DISCOVERY REPORT COMPLETE → $outputFile" -ForegroundColor Green
Write-Host "📄 Upload .discovery/discovery-report.md to your next session for full context." -ForegroundColor Yellow
```

---

## Master Runner Script

**File:** `scripts/discovery/run-all.ps1`

```powershell
#=======================================================================
# scripts/discovery/run-all.ps1
# Purpose: Execute all discovery scripts in sequence
# Usage:   .\scripts\discovery\run-all.ps1
#=======================================================================

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot\..\..

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║     EDUNODE ANALYTICS — PROJECT DISCOVERY TOOLKIT       ║
║     Mpingo Systems | CTO Office                         ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$startTime = Get-Date

$scripts = @(
    "scripts/discovery/01-project-structure.ps1",
    "scripts/discovery/02-techstack-audit.ps1",
    "scripts/discovery/03-database-discovery.ps1",
    "scripts/discovery/04-route-api-inventory.ps1",
    "scripts/discovery/05-risk-engine-gap.ps1",
    "scripts/discovery/06-generate-report.ps1"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        & $script
    } else {
        Write-Host "⚠️  Script not found: $script" -ForegroundColor Yellow
    }
}

$duration = (Get-Date) - $startTime

Write-Host @"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL DISCOVERY STEPS COMPLETE
⏱️  Total time: $([math]::Round($duration.TotalSeconds, 1)) seconds
📂 All outputs in: .discovery/
📄 Final report:   .discovery/discovery-report.md

NEXT:
  1. Review .discovery/discovery-report.md
  2. Upload it to your next Claude session
  3. Begin Sprint 1: Risk Engine Foundation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Green
```

---

## Quick Start

```powershell
# From project root:
cd C:\Users\HP\Documents\edunodeanalytics

# Create the scripts directory
New-Item -ItemType Directory -Path "scripts/discovery" -Force

# After saving all 7 script files above, run:
.\scripts\discovery\run-all.ps1

# When complete, review:
code .discovery/discovery-report.md
```

---

## What Each Script Produces

| Script | Output File | What It Tells You |
|--------|------------|-------------------|
| 01 | `01-project-structure.txt` | Full file tree, key file existence, file stats |
| 02 | `02-techstack-audit.txt` | Dependencies, categories, configs, env vars |
| 03 | `03-database-schema.txt` | Tables, columns, row counts, risk table status |
| 04 | `04-route-api-inventory.txt` | All pages, API routes, HTTP methods, auth status |
| 05 | `05-risk-engine-gap.txt` | Checklist gap analysis, score, failed items |
| 06 | `discovery-report.md` | **Master report** — all above merged + sprint plan |

---

## After Discovery: The Handover Protocol

Once `discovery-report.md` is generated:

1. **Review** the gap analysis score and failed items
2. **Upload** `discovery-report.md` to your next Claude session
3. **State:** "I'm starting Sprint 1. Here's the discovery report. Build the risk engine foundation."
4. Claude will have full context to generate production code as PowerShell automation scripts per your Communication Protocols v2.0

The discovery report becomes your **System Restore Point** for every future session.
