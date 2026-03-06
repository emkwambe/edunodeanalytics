# EduNode Analytics - Discovery Report
Generated: 2026-03-05 21:07:18
Project: edunodeanalytics
Gap Score: 63.2% (24/38 checks passed)

---

---

# Project Structure

# EDUNODE ANALYTICS - PROJECT STRUCTURE
# Generated: 2026-03-05 21:06:52
# Root: C:\Users\HP\Documents\edunodeanalytics

## TOP-LEVEL FILES
  .dockerignore (0.4 KB)
  .env.example (2.9 KB)
  .env.local (1.7 KB)
  docker-compose.yml (1.3 KB)
  Dockerfile (1.2 KB)
  next-env.d.ts (0.2 KB)
  next.config.js (3.3 KB)
  package-lock.json (394.5 KB)
  package.json (2.2 KB)
  postcss.config.js (0.1 KB)
  run-all.ps1 (28.6 KB)
  tailwind.config.ts (3.3 KB)
  tsconfig.json (0.8 KB)
  vercel.json (1 KB)
  vitest.config.ts (0.6 KB)

## SRC DIRECTORY SCAN

### src/app/ (80 files)
  app\error.tsx (5.2 KB)
  app\globals.css (6.6 KB)
  app\not-found.tsx (4.1 KB)
  app\page.tsx (13.5 KB)
  app\robots.ts (1.5 KB)
  app\sitemap.ts (1.8 KB)
  app\accessibility\page.tsx (9.7 KB)
  app\admin\loading.tsx (2.9 KB)
  app\admin\page.tsx (17.6 KB)
  app\admin\audit-logs\page.tsx (21.8 KB)
  app\admin\system\page.tsx (18.7 KB)
  app\api\__tests__\interventions.test.ts (11.1 KB)
  app\api\__tests__\stripe-webhook.test.ts (4.5 KB)
  app\api\__tests__\students.test.ts (8.3 KB)
  app\blog\loading.tsx (2.5 KB)
  app\blog\page.tsx (12.8 KB)
  app\careers\page.tsx (12.6 KB)
  app\case-studies\page.tsx (23.3 KB)
  app\changelog\page.tsx (11.8 KB)
  app\compare-plans\page.tsx (18.4 KB)
  app\contact\page.tsx (18.2 KB)
  app\cookies\page.tsx (9.6 KB)
  app\data-blueprint\page.tsx (13.3 KB)
  app\demo\page.tsx (15.6 KB)
  app\docs\loading.tsx (2.3 KB)
  app\docs\page.tsx (6.3 KB)
  app\docs\api\page.tsx (13.5 KB)
  app\docs\getting-started\page.tsx (9.3 KB)
  app\faq\page.tsx (17 KB)
  app\feedback\page.tsx (19.4 KB)
  app\ferpa\page.tsx (11.4 KB)
  app\help\page.tsx (14.7 KB)
  app\integrations\page.tsx (20.3 KB)
  app\onboarding\page.tsx (20.8 KB)
  app\partners\page.tsx (12.2 KB)
  app\pricing\loading.tsx (2.2 KB)
  app\pricing\page.tsx (20.2 KB)
  app\privacy\page.tsx (10.5 KB)
  app\roi-calculator\page.tsx (22.2 KB)
  app\security\page.tsx (17.8 KB)
  app\select-school\page.tsx (3.9 KB)
  app\settings\roles\page.tsx (19 KB)
  app\settings\team\page.tsx (16.5 KB)
  app\settings\team\invite\page.tsx (15 KB)
  app\sign-in\[[...sign-in]]\page.tsx (2.3 KB)
  app\sign-up\[[...sign-up]]\page.tsx (1.8 KB)
  app\status\page.tsx (14.1 KB)
  app\terms\page.tsx (9.9 KB)
  app\testimonials\page.tsx (12.1 KB)
  app\unauthorized\page.tsx (4.1 KB)
  app\webinars\page.tsx (14.8 KB)
  app\[school_slug]\account\page.tsx (35.3 KB)
  app\[school_slug]\analytics\advanced\page.tsx (27.6 KB)
  app\[school_slug]\analytics\impact\page.tsx (23.1 KB)
  app\[school_slug]\authorizer\page.tsx (35.7 KB)
  app\[school_slug]\dashboard\loading.tsx (1.8 KB)
  app\[school_slug]\dashboard\page.tsx (6.6 KB)
  app\[school_slug]\dashboard\assessments\page.tsx (10.6 KB)
  app\[school_slug]\dashboard\attendance\page.tsx (12.6 KB)
  app\[school_slug]\dashboard\momentum\page.tsx (29.2 KB)
  app\[school_slug]\dashboard\pulse\page.tsx (8.9 KB)
  app\[school_slug]\dashboard\reports\page.tsx (6.7 KB)
  app\[school_slug]\dashboard\students\loading.tsx (2.2 KB)
  app\[school_slug]\dashboard\students\page.tsx (12 KB)
  app\[school_slug]\dashboard\students\[student_id]\page.tsx (25.8 KB)
  app\[school_slug]\help\page.tsx (6.6 KB)
  app\[school_slug]\interventions\page.tsx (18.2 KB)
  app\[school_slug]\network\page.tsx (19.8 KB)
  app\[school_slug]\notifications\page.tsx (16.8 KB)
  app\[school_slug]\resources\loading.tsx (2.9 KB)
  app\[school_slug]\resources\page.tsx (17.2 KB)
  app\[school_slug]\resources\modules\[slug]\page.tsx (20.6 KB)
  app\[school_slug]\search\page.tsx (12.8 KB)
  app\[school_slug]\settings\page.tsx (25.8 KB)
  app\[school_slug]\settings\api\page.tsx (24.3 KB)
  app\[school_slug]\settings\billing\page.tsx (17.7 KB)
  app\[school_slug]\settings\data-sources\page.tsx (24.5 KB)
  app\[school_slug]\settings\integrations\page.tsx (18 KB)
  app\[school_slug]\settings\sso\page.tsx (22 KB)
  app\[school_slug]\student-360\[student_id]\page.tsx (30.5 KB)

### src/components/ (45 files)
  components\error-boundary.tsx (2.4 KB)
  components\error-fallback.tsx (1.3 KB)
  components\banners\confounding-risk-banner.tsx (5.1 KB)
  components\banners\data-freshness-banner.tsx (3.8 KB)
  components\banners\weak-data-pulse-banner.tsx (4.3 KB)
  components\branding\white-label-provider.tsx (3.8 KB)
  components\charts\attendance-trend-chart.tsx (5.9 KB)
  components\charts\chart-config.ts (5.3 KB)
  components\charts\confidence-band-chart.tsx (8.7 KB)
  components\charts\index.ts (0.3 KB)
  components\charts\mastery-curve-chart.tsx (6.8 KB)
  components\charts\maturity-radar-chart.tsx (3.5 KB)
  components\command-palette\command-palette.tsx (4.5 KB)
  components\command-palette\index.ts (0.1 KB)
  components\dashboard\index.ts (0.2 KB)
  components\dashboard\metric-card.tsx (4.3 KB)
  components\dashboard\metric-degradation.tsx (6.3 KB)
  components\dashboard\mobility-events.tsx (9.6 KB)
  components\dashboard\seed-notification.tsx (5.9 KB)
  components\dashboard\status-indicator.tsx (5.3 KB)
  components\dashboard\student-360-card.tsx (17.2 KB)
  components\data-blueprint\data-inventory-card.tsx (2.9 KB)
  components\data-blueprint\index.ts (0.1 KB)
  components\features\locked-feature.tsx (8.8 KB)
  components\features\page-feature-gate.tsx (4.1 KB)
  components\features\upgrade-modal.tsx (10.1 KB)
  components\notifications\toast-container.tsx (0.7 KB)
  components\onboarding\getting-started.tsx (9.9 KB)
  components\providers\index.tsx (0.5 KB)
  components\skeletons\card-skeleton.tsx (1.5 KB)
  components\skeletons\index.ts (0.2 KB)
  components\skeletons\skeleton.tsx (0.3 KB)
  components\skeletons\student-card-skeleton.tsx (1.1 KB)
  components\skeletons\table-skeleton.tsx (1.1 KB)
  components\ui\avatar.tsx (2.6 KB)
  components\ui\badge.tsx (1.9 KB)
  components\ui\button.tsx (2.3 KB)
  components\ui\card.tsx (2.3 KB)
  components\ui\index.ts (0.2 KB)
  components\ui\progress.tsx (3.7 KB)
  components\ui\toast.tsx (2 KB)
  components\upgrade\index.ts (0.1 KB)
  components\upgrade\upgrade-cta.tsx (8.9 KB)
  components\__tests__\metric-card.test.tsx (6.7 KB)
  components\__tests__\page-feature-gate.test.tsx (8 KB)

### src/lib/ (107 files)
  lib\database.types.ts (47.7 KB)
  lib\mock-data.ts (7.3 KB)
  lib\utils.ts (2.7 KB)
  lib\ai\edunode-advisor.ts (24.2 KB)
  lib\analytics\posthog.ts (7.8 KB)
  lib\analytics\purpose-driven-metrics.ts (24 KB)
  lib\api\errors.ts (1 KB)
  lib\api\index.ts (0.1 KB)
  lib\api\rate-limit.ts (5.9 KB)
  lib\api\response.ts (0.9 KB)
  lib\api\validation.ts (1.2 KB)
  lib\api\__tests__\errors.test.ts (2.2 KB)
  lib\api\__tests__\validation.test.ts (2.3 KB)
  lib\auth\index.ts (0.1 KB)
  lib\auth\rbac.ts (6 KB)
  lib\auth\types.ts (4.7 KB)
  lib\auth\__tests__\rbac.test.ts (12.2 KB)
  lib\branding\white-label.ts (4.5 KB)
  lib\cache\redis.ts (11.1 KB)
  lib\compliance\evidence-logger.ts (18.5 KB)
  lib\compliance\ferpa-compliance.ts (17.2 KB)
  lib\compliance\index.ts (0.7 KB)
  lib\data\bigquery-provider.ts (17.3 KB)
  lib\data\data-availability.ts (16.6 KB)
  lib\data\fidelity_monitor.ts (9 KB)
  lib\data\index.ts (0.4 KB)
  lib\data\seed-data.ts (23.3 KB)
  lib\data\strategic-taxonomy.ts (14 KB)
  lib\data\integration\index.ts (0.5 KB)
  lib\data\integration\orchestrator.ts (10.6 KB)
  lib\data\integration\pipeline.ts (13.1 KB)
  lib\data\sources\client.ts (11.1 KB)
  lib\data\sources\index.ts (1.5 KB)
  lib\data\sources\registry.ts (7.5 KB)
  lib\data\sources\adapters\canvas.ts (5.8 KB)
  lib\data\sources\adapters\classlink.ts (13.1 KB)
  lib\data\sources\adapters\clever.ts (13.5 KB)
  lib\data\sources\adapters\google-classroom.ts (3.6 KB)
  lib\data\sources\adapters\index.ts (0.7 KB)
  lib\data\sources\adapters\iready.ts (5.2 KB)
  lib\data\sources\adapters\nwea-map.ts (10.7 KB)
  lib\data\sources\adapters\powerschool.ts (3.8 KB)
  lib\data\sources\adapters\renaissance-star.ts (2.9 KB)
  lib\db\index.ts (0.4 KB)
  lib\db\queries\audit.ts (5.1 KB)
  lib\db\queries\dashboards.ts (8.1 KB)
  lib\db\queries\data-sources.ts (11.8 KB)
  lib\db\queries\interventions.ts (28 KB)
  lib\db\queries\notifications.ts (13.1 KB)
  lib\db\queries\payments.ts (4.1 KB)
  lib\db\queries\resource-progress.ts (18.1 KB)
  lib\db\queries\schools.ts (12.9 KB)
  lib\db\queries\students.ts (20.6 KB)
  lib\db\queries\users.ts (6.2 KB)
  lib\db\queries\webhook-events.ts (4 KB)
  lib\email\service.ts (8.1 KB)
  lib\email\templates\index.ts (10.9 KB)
  lib\export\csv.ts (10.7 KB)
  lib\export\index.ts (0 KB)
  lib\features\feature-gates.ts (11.9 KB)
  lib\features\__tests__\feature-gates.test.ts (10 KB)
  lib\hooks\fetcher.ts (1.7 KB)
  lib\hooks\index.ts (0.3 KB)
  lib\hooks\providers.tsx (0.4 KB)
  lib\hooks\use-dashboard.ts (2.5 KB)
  lib\hooks\use-feature-gate.ts (3.1 KB)
  lib\hooks\use-ferpa-audit.ts (4.9 KB)
  lib\hooks\use-interventions.ts (3.8 KB)
  lib\hooks\use-keyboard-shortcut.ts (2.3 KB)
  lib\hooks\use-school-context.ts (1.1 KB)
  lib\hooks\use-schools.ts (2.3 KB)
  lib\hooks\use-students.ts (3.3 KB)
  lib\hooks\use-toast.ts (0.9 KB)
  lib\hooks\__tests__\fetcher.test.ts (3.6 KB)
  lib\integrations\classlink-api.ts (10.9 KB)
  lib\integrations\classlink-mock.ts (15 KB)
  lib\integrations\clever-api.ts (9.4 KB)
  lib\integrations\clever-mock.ts (13.6 KB)
  lib\integrations\index.ts (0.2 KB)
  lib\integrations\nwea-api.ts (8.8 KB)
  lib\interventions\index.ts (0.8 KB)
  lib\interventions\team-collaboration.ts (15.8 KB)
  lib\interventions\workflow-manager.ts (23.1 KB)
  lib\monitoring\sentry.ts (6.9 KB)
  lib\notifications\context.tsx (1.7 KB)
  lib\notifications\index.ts (1 KB)
  lib\privacy\index.ts (1.1 KB)
  lib\privacy\pii-anonymizer.ts (14.8 KB)
  lib\privacy\secure-ai-proxy.ts (21.6 KB)
  lib\reports\generator.ts (18.6 KB)
  lib\resources\downloadables.ts (10 KB)
  lib\resources\index.ts (5.7 KB)
  lib\resources\types.ts (3.3 KB)
  lib\resources\content\culture-change.ts (29.7 KB)
  lib\resources\content\data-literacy.ts (25.5 KB)
  lib\resources\content\implementation.ts (28.1 KB)
  lib\resources\content\index.ts (3.1 KB)
  lib\resources\content\metadata.ts (8.4 KB)
  lib\risk\detection-engine.ts (16.2 KB)
  lib\risk\early-warning.ts (13.5 KB)
  lib\risk\index.ts (0.6 KB)
  lib\supabase\client.ts (0.4 KB)
  lib\supabase\server.ts (1.8 KB)
  lib\validations\index.ts (0.1 KB)
  lib\validations\intervention.ts (2.4 KB)
  lib\validations\school.ts (1 KB)
  lib\validations\student.ts (1.9 KB)

## FILE STATISTICS
  Total files: 279
  Total size: 2.82 MB

  .ts: 127 files
  .tsx: 115 files
  .sql: 10 files
  .md: 8 files
  .yml: 5 files
  .json: 4 files
  .js: 2 files
  .py: 1 files
  .css: 1 files
  .svg: 1 files
  .local: 1 files
  .example: 1 files
  : 1 files
  .ps1: 1 files
  .dockerignore: 1 files

## KEY FILE CHECK
  [MISSING] next.config.ts
  [EXISTS] next.config.js
  [MISSING] next.config.mjs
  [EXISTS] tsconfig.json
  [EXISTS] tailwind.config.ts
  [EXISTS] package.json
  [EXISTS] .env.local
  [EXISTS] src/middleware.ts
  [MISSING] middleware.ts
  [MISSING] src/lib/supabase.ts
  [MISSING] src/lib/supabase-admin.ts
  [MISSING] src/lib/risk-engine/types.ts
  [MISSING] src/lib/risk-engine/calculator.ts
  [MISSING] src/lib/risk-engine/normalizers.ts
  [MISSING] src/lib/risk-engine/orchestrator.ts
  [EXISTS] src/app/api/health/route.ts
  [EXISTS] public/build-info.json

---

# Tech Stack

# EDUNODE ANALYTICS - TECH STACK AUDIT
# Generated: 2026-03-05 21:06:59

## PACKAGE INFO
  Name: edunode-analytics
  Version: 0.1.0

## SCRIPTS
  dev: cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev
  dev:turbo: cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev --turbopack
  dev:webpack: cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev
  build: cross-env NODE_OPTIONS=--max-old-space-size=4096 next build
  start: next start
  lint: next lint
  test: vitest
  test:run: vitest run
  test:coverage: vitest run --coverage
  db:generate: supabase gen types typescript --local > src/lib/database.types.ts
  dbt:run: cd dbt && dbt run
  dbt:test: cd dbt && dbt test

## DEPENDENCIES (1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1)
  @clerk/nextjs: ^6.37.0
  @radix-ui/react-avatar: ^1.0.4
  @radix-ui/react-dialog: ^1.0.5
  @radix-ui/react-dropdown-menu: ^2.0.6
  @radix-ui/react-label: ^2.0.2
  @radix-ui/react-select: ^2.0.0
  @radix-ui/react-separator: ^1.0.3
  @radix-ui/react-slot: ^1.0.2
  @radix-ui/react-tabs: ^1.0.4
  @radix-ui/react-tooltip: ^1.0.7
  @supabase/ssr: ^0.8.0
  @supabase/supabase-js: ^2.39.0
  chart.js: ^4.4.1
  class-variance-authority: ^0.7.0
  clsx: ^2.1.0
  cmdk: ^1.1.1
  lucide-react: ^0.303.0
  next: ^16.1.6
  react: ^18.2.0
  react-chartjs-2: ^5.2.0
  react-dom: ^18.2.0
  stripe: ^20.3.1
  swr: ^2.4.1
  tailwindcss-animate: ^1.0.7
  tailwind-merge: ^2.2.0
  zod: ^3.22.4

## DEV DEPENDENCIES (1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1)
  @testing-library/jest-dom: ^6.9.1
  @testing-library/react: ^16.3.2
  @types/node: ^20.10.0
  @types/react: ^18.2.0
  @types/react-dom: ^18.2.0
  @vitejs/plugin-react: ^5.1.4
  @vitest/coverage-v8: ^4.0.18
  autoprefixer: ^10.4.16
  cross-env: ^7.0.3
  eslint: ^9.39.2
  eslint-config-next: ^16.1.6
  jsdom: ^28.1.0
  postcss: ^8.4.33
  tailwindcss: ^3.4.1
  typescript: ^5.3.0
  vitest: ^4.0.18

## ENVIRONMENT VARIABLES (keys only)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  NEXT_PUBLIC_CLERK_SIGN_IN_URL
  NEXT_PUBLIC_CLERK_SIGN_UP_URL
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  GOOGLE_CLOUD_PROJECT_ID
  GOOGLE_APPLICATION_CREDENTIALS
  BIGQUERY_DATASET_PREFIX
  CLEVER_CLIENT_ID
  CLEVER_CLIENT_SECRET
  CLASSLINK_CLIENT_ID
  CLASSLINK_CLIENT_SECRET
  ANONYMIZATION_SECRET
  ANTHROPIC_API_KEY
  NEXT_PUBLIC_APP_URL
  NODE_ENV

## NEXT.JS CONFIG (next.config.js)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization for production
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Optimize image formats for production
    formats: ['image/avif', 'image/webp'],
    // Enable sharp for production image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Server Actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Compression
  compress: true,

  // Strict mode for React
  reactStrictMode: true,

  // Turbopack configuration (Next.js 16+ default)
  turbopack: {},

  // External packages (server-side only, optional dependencies)
  serverExternalPackages: ['@google-cloud/bigquery'],

  // Output configuration for Vercel deployment
  output: 'standalone',

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // FERPA compliance: Strict caching for student data routes
        source: '/:school_slug/student-360/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // Redirects for common routes
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/select-school',
        permanent: false,
      },
    ];
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Webpack optimizations for production
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          chartjs: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'chartjs',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;


## RUNTIME
  Node: v22.18.0
  npm: 11.7.0

---

# Database Schema

# EDUNODE ANALYTICS - DATABASE SCHEMA
# Generated: 2026-03-06T02:07:01.397Z
# Supabase: https://cfpongyknrdrudetjhdq.supabase.co

## TABLES (21 found)

### ai_usage (18 columns)
  anonymization_level                text                NULL
  audit_id                           text                NULL
  cost_cents                         integer             NOT NULL
  created_at                         timestamp with time zoneNOT NULL
  error_message                      text                NULL
  feature                            text                NOT NULL
  id                                 uuid                NOT NULL
  input_tokens                       integer             NOT NULL
  latency_ms                         integer             NULL
  model                              text                NOT NULL
  output_tokens                      integer             NOT NULL
  pii_detected                       boolean             NULL
  provider                           text                NOT NULL
  school_id                          uuid                NOT NULL
  student_count                      integer             NULL
  success                            boolean             NOT NULL
  total_tokens                       integer             NULL
  user_id                            uuid                NOT NULL

### ai_usage_limits (11 columns)
  alert_sent_at                      timestamp with time zoneNULL
  alert_threshold_percent            integer             NULL
  created_at                         timestamp with time zoneNOT NULL
  current_month_cost_cents           integer             NOT NULL
  current_month_tokens               integer             NOT NULL
  id                                 uuid                NOT NULL
  monthly_cost_limit_cents           integer             NULL
  monthly_token_limit                integer             NULL
  period_start                       timestamp with time zoneNOT NULL
  school_id                          uuid                NOT NULL
  updated_at                         timestamp with time zoneNOT NULL

### audit_logs (12 columns)
  action                             text                NOT NULL
  created_at                         timestamp with time zoneNOT NULL
  id                                 uuid                NOT NULL
  ip_address                         inet                NULL
  metadata                           jsonb               NULL
  new_values                         jsonb               NULL
  old_values                         jsonb               NULL
  resource_id                        text                NULL
  resource_type                      text                NOT NULL
  school_id                          uuid                NULL
  user_agent                         text                NULL
  user_id                            uuid                NULL

### authorizers (7 columns)
  contact_email                      text                NOT NULL
  created_at                         timestamp with time zoneNOT NULL
  id                                 uuid                NOT NULL
  is_active                          boolean             NOT NULL
  name                               text                NOT NULL
  slug                               text                NOT NULL
  updated_at                         timestamp with time zoneNOT NULL

### dashboard_configs (15 columns)
  created_at                         timestamp with time zoneNOT NULL
  description                        text                NULL
  filters                            jsonb               NULL
  id                                 uuid                NOT NULL
  is_default                         boolean             NOT NULL
  is_shared                          boolean             NOT NULL
  layout_config                      jsonb               NOT NULL
  metadata                           jsonb               NULL
  name                               text                NOT NULL
  refresh_interval_seconds           integer             NULL
  school_id                          uuid                NOT NULL
  slug                               text                NOT NULL
  updated_at                         timestamp with time zoneNOT NULL
  user_id                            uuid                NULL
  widget_configs                     jsonb               NOT NULL

### data_sources (24 columns)
  access_token_encrypted             text                NULL
  connected_at                       timestamp with time zoneNULL
  connection_config                  jsonb               NULL
  created_at                         timestamp with time zoneNOT NULL
  disconnected_at                    timestamp with time zoneNULL
  field_mappings                     jsonb               NULL
  id                                 uuid                NOT NULL
  is_active                          boolean             NOT NULL
  last_record_count                  integer             NULL
  last_sync_at                       timestamp with time zoneNULL
  metadata                           jsonb               NULL
  name                               text                NOT NULL
  next_sync_at                       timestamp with time zoneNULL
  provider                           public.data_source_providerNOT NULL
  records_synced                     integer             NULL
  refresh_token_encrypted            text                NULL
  school_id                          uuid                NOT NULL
  sync_enabled                       boolean             NOT NULL
  sync_error                         text                NULL
  sync_frequency_hours               integer             NULL
  sync_status                        public.sync_status  NULL
  token_expires_at                   timestamp with time zoneNULL
  type                               public.data_source_typeNOT NULL
  updated_at                         timestamp with time zoneNOT NULL

### generated_reports (18 columns)
  created_at                         timestamp with time zoneNOT NULL
  delivered_at                       timestamp with time zoneNULL
  delivery_error                     text                NULL
  delivery_status                    text                NULL
  expires_at                         timestamp with time zoneNULL
  file_size_bytes                    integer             NULL
  filters                            jsonb               NULL
  format                             text                NOT NULL
  generated_at                       timestamp with time zoneNOT NULL
  generated_by                       uuid                NOT NULL
  generation_time_ms                 integer             NULL
  id                                 uuid                NOT NULL
  record_count                       integer             NULL
  report_type                        text                NOT NULL
  scheduled_report_id                uuid                NULL
  school_id                          uuid                NOT NULL
  storage_path                       text                NULL
  title                              text                NOT NULL

### interventions (25 columns)
  actual_end_date                    date                NULL
  assigned_to_user_id                uuid                NULL
  baseline_value                     numeric             NULL
  created_at                         timestamp with time zoneNOT NULL
  created_by_user_id                 uuid                NULL
  current_value                      numeric             NULL
  description                        text                NULL
  goal                               text                NULL
  id                                 uuid                NOT NULL
  is_stale                           boolean             NULL
  metadata                           jsonb               NULL
  outcome_summary                    text                NULL
  priority                           public.notification_priorityNOT NULL
  progress_notes                     jsonb               NULL
  school_id                          uuid                NOT NULL
  start_date                         date                NULL
  status                             public.intervention_statusNOT NULL
  student_id                         uuid                NOT NULL
  success_criteria                   text                NULL
  target_end_date                    date                NULL
  target_value                       numeric             NULL
  title                              text                NOT NULL
  type                               public.intervention_typeNOT NULL
  updated_at                         timestamp with time zoneNOT NULL
  was_successful                     boolean             NULL

### notifications (18 columns)
  action_label                       text                NULL
  action_url                         text                NULL
  created_at                         timestamp with time zoneNOT NULL
  dismissed_at                       timestamp with time zoneNULL
  expires_at                         timestamp with time zoneNULL
  id                                 uuid                NOT NULL
  is_dismissed                       boolean             NOT NULL
  is_read                            boolean             NOT NULL
  message                            text                NOT NULL
  metadata                           jsonb               NULL
  priority                           public.notification_priorityNOT NULL
  read_at                            timestamp with time zoneNULL
  related_intervention_id            uuid                NULL
  related_student_id                 uuid                NULL
  school_id                          uuid                NOT NULL
  title                              text                NOT NULL
  type                               public.notification_typeNOT NULL
  user_id                            uuid                NOT NULL

### payments (20 columns)
  amount                             integer             NOT NULL
  created_at                         timestamp with time zoneNOT NULL
  currency                           text                NOT NULL
  hosted_invoice_url                 text                NULL
  id                                 uuid                NOT NULL
  invoice_number                     text                NULL
  invoice_pdf_url                    text                NULL
  metadata                           jsonb               NULL
  paid_at                            timestamp with time zoneNULL
  period_end                         timestamp with time zoneNULL
  period_start                       timestamp with time zoneNULL
  refunded_at                        timestamp with time zoneNULL
  school_id                          uuid                NOT NULL
  status                             text                NOT NULL
  stripe_charge_id                   text                NULL
  stripe_invoice_id                  text                NOT NULL
  stripe_payment_intent_id           text                NULL
  stripe_subscription_id             text                NULL
  student_count                      integer             NULL
  subscription_tier                  public.subscription_tierNULL

### resource_progress (19 columns)
  bookmarked_at                      timestamp with time zoneNULL
  completed_at                       timestamp with time zoneNULL
  created_at                         timestamp with time zoneNOT NULL
  current_section                    integer             NULL
  id                                 uuid                NOT NULL
  is_bookmarked                      boolean             NOT NULL
  is_completed                       boolean             NOT NULL
  is_started                         boolean             NOT NULL
  metadata                           jsonb               NULL
  module_category                    public.resource_categoryNOT NULL
  module_slug                        text                NOT NULL
  school_id                          uuid                NOT NULL
  sections_completed                 integer             NULL
  started_at                         timestamp with time zoneNULL
  time_spent_minutes                 integer             NULL
  total_sections                     integer             NOT NULL
  updated_at                         timestamp with time zoneNOT NULL
  user_id                            uuid                NOT NULL
  user_notes                         text                NULL

### scheduled_reports (20 columns)
  created_at                         timestamp with time zoneNOT NULL
  created_by                         uuid                NOT NULL
  day_of_month                       integer             NULL
  day_of_week                        integer             NULL
  filters                            jsonb               NULL
  format                             text                NOT NULL
  frequency                          text                NOT NULL
  id                                 uuid                NOT NULL
  is_active                          boolean             NOT NULL
  last_error                         text                NULL
  last_run_at                        timestamp with time zoneNULL
  next_run_at                        timestamp with time zoneNULL
  options                            jsonb               NULL
  recipients                         jsonb               NOT NULL
  report_type                        text                NOT NULL
  school_id                          uuid                NOT NULL
  time_of_day                        time without time zoneNOT NULL
  timezone                           text                NOT NULL
  title                              text                NOT NULL
  updated_at                         timestamp with time zoneNOT NULL

### school_memberships (13 columns)
  accepted_at                        timestamp with time zoneNULL
  created_at                         timestamp with time zoneNOT NULL
  department                         text                NULL
  grade_levels                       integer[]           NULL
  id                                 uuid                NOT NULL
  invited_at                         timestamp with time zoneNULL
  is_active                          boolean             NOT NULL
  is_primary                         boolean             NOT NULL
  role                               public.school_role  NOT NULL
  school_id                          uuid                NOT NULL
  sis_staff_id                       text                NULL
  updated_at                         timestamp with time zoneNOT NULL
  user_id                            uuid                NOT NULL

### schools (32 columns)
  academic_year_start_month          integer             NOT NULL
  accent_color                       text                NOT NULL
  address                            jsonb               NULL
  authorizer_id                      uuid                NULL
  bigquery_dataset_id                text                NULL
  cancel_at_period_end               boolean             NOT NULL
  canceled_at                        timestamp with time zoneNULL
  classlink_tenant_id                text                NULL
  clever_district_id                 text                NULL
  contact_email                      text                NOT NULL
  contact_phone                      text                NULL
  created_at                         timestamp with time zoneNOT NULL
  current_period_end                 timestamp with time zoneNULL
  current_period_start               timestamp with time zoneNULL
  domain                             text                NULL
  id                                 uuid                NOT NULL
  is_active                          boolean             NOT NULL
  legal_name                         text                NULL
  logo_url                           text                NULL
  metadata                           jsonb               NULL
  name                               text                NOT NULL
  primary_color                      text                NOT NULL
  secondary_color                    text                NOT NULL
  slug                               text                NOT NULL
  stripe_customer_id                 text                NULL
  stripe_subscription_id             text                NULL
  student_count                      integer             NOT NULL
  subscription_status                public.subscription_statusNOT NULL
  subscription_tier                  public.subscription_tierNOT NULL
  timezone                           text                NOT NULL
  trial_ends_at                      timestamp with time zoneNULL
  updated_at                         timestamp with time zoneNOT NULL

### students (35 columns)
  attendance_rate                    numeric             NULL
  counselor                          text                NULL
  created_at                         timestamp with time zoneNOT NULL
  date_of_birth                      date                NULL
  days_absent                        integer             NULL
  days_present                       integer             NULL
  display_name                       text                NOT NULL
  enrolled_at                        date                NULL
  ethnicity                          text                NULL
  first_name                         text                NOT NULL
  gender                             text                NULL
  grade_level                        integer             NOT NULL
  growth_percentile                  integer             NULL
  has_504_plan                       boolean             NOT NULL
  has_iep                            boolean             NOT NULL
  homeroom_teacher                   text                NULL
  id                                 uuid                NOT NULL
  is_active                          boolean             NOT NULL
  is_chronically_absent              boolean             NULL
  is_english_learner                 boolean             NOT NULL
  is_free_reduced_lunch              boolean             NOT NULL
  is_gifted                          boolean             NOT NULL
  last_name                          text                NOT NULL
  math_scores                        jsonb               NULL
  metadata                           jsonb               NULL
  proficiency_level                  numeric             NULL
  purpose_driven_metrics             jsonb               NULL
  reading_scores                     jsonb               NULL
  risk_factors                       jsonb               NULL
  risk_level                         public.risk_level   NULL
  risk_score                         numeric             NULL
  school_id                          uuid                NOT NULL
  sis_student_id                     text                NOT NULL
  updated_at                         timestamp with time zoneNOT NULL
  withdrawn_at                       date                NULL

### sync_history (19 columns)
  completed_at                       timestamp with time zoneNULL
  created_at                         timestamp with time zoneNOT NULL
  data_source_id                     uuid                NOT NULL
  details                            jsonb               NULL
  duration_ms                        integer             NULL
  error_message                      text                NULL
  errors                             jsonb               NULL
  id                                 uuid                NOT NULL
  records_created                    integer             NULL
  records_deleted                    integer             NULL
  records_processed                  integer             NULL
  records_skipped                    integer             NULL
  records_updated                    integer             NULL
  school_id                          uuid                NOT NULL
  started_at                         timestamp with time zoneNOT NULL
  status                             public.sync_status  NOT NULL
  sync_type                          text                NOT NULL
  triggered_by                       text                NULL
  triggered_by_user_id               uuid                NULL

### user_preferences (22 columns)
  alert_assessment_results           boolean             NOT NULL
  alert_attendance_drops             boolean             NOT NULL
  alert_critical_students            boolean             NOT NULL
  alert_intervention_updates         boolean             NOT NULL
  alert_system_updates               boolean             NOT NULL
  compact_mode                       boolean             NOT NULL
  created_at                         timestamp with time zoneNOT NULL
  custom_preferences                 jsonb               NULL
  date_format                        text                NULL
  default_dashboard                  text                NULL
  digest_frequency                   text                NULL
  email_notifications                boolean             NOT NULL
  high_contrast                      boolean             NOT NULL
  id                                 uuid                NOT NULL
  number_format                      text                NULL
  push_notifications                 boolean             NOT NULL
  reduce_motion                      boolean             NOT NULL
  share_usage_data                   boolean             NOT NULL
  show_student_photos                boolean             NOT NULL
  theme                              text                NULL
  updated_at                         timestamp with time zoneNOT NULL
  user_id                            uuid                NOT NULL

### users (13 columns)
  avatar_url                         text                NULL
  clerk_user_id                      text                NOT NULL
  created_at                         timestamp with time zoneNOT NULL
  email                              text                NOT NULL
  first_name                         text                NULL
  id                                 uuid                NOT NULL
  is_active                          boolean             NOT NULL
  last_login_at                      timestamp with time zoneNULL
  last_name                          text                NULL
  metadata                           jsonb               NULL
  platform_role                      public.platform_roleNULL
  preferences                        jsonb               NULL
  updated_at                         timestamp with time zoneNOT NULL

### v_ai_usage_monthly (11 columns)
  avg_latency_ms                     integer             NULL
  feature                            text                NULL
  month                              timestamp with time zoneNULL
  provider                           text                NULL
  request_count                      bigint              NULL
  school_id                          uuid                NULL
  success_rate                       double precision    NULL
  total_cost_cents                   bigint              NULL
  total_input_tokens                 bigint              NULL
  total_output_tokens                bigint              NULL
  total_tokens                       bigint              NULL

### v_report_summary (6 columns)
  avg_generation_ms                  integer             NULL
  delivered_count                    bigint              NULL
  last_generated                     timestamp with time zoneNULL
  report_type                        text                NULL
  school_id                          uuid                NULL
  total_generated                    bigint              NULL

### webhook_events (10 columns)
  created_at                         timestamp with time zoneNOT NULL
  error_message                      text                NULL
  event_id                           text                NOT NULL
  event_type                         text                NOT NULL
  id                                 uuid                NOT NULL
  payload                            jsonb               NOT NULL
  processed_at                       timestamp with time zoneNULL
  result                             jsonb               NULL
  retry_count                        integer             NOT NULL
  status                             text                NOT NULL


## ROW COUNTS
  schools                       0-0/3
  students                      */0
  enrollments                   NOT FOUND (HTTP 404)
  interventions                 */0
  notifications                 */0
  audit_logs                    */0
  data_sources                  */0
  sync_logs                     NOT FOUND (HTTP 404)
  users                         */0
  profiles                      NOT FOUND (HTTP 404)
  risk_model_configs            NOT FOUND (HTTP 404)
  student_metrics               NOT FOUND (HTTP 404)
  student_metric_history        NOT FOUND (HTTP 404)
  risk_evaluations              NOT FOUND (HTTP 404)
  risk_alerts                   NOT FOUND (HTTP 404)

## RISK ENGINE TABLE STATUS
  [MISSING] risk_model_configs
  [MISSING] student_metrics
  [MISSING] student_metric_history
  [MISSING] risk_evaluations
  [MISSING] risk_alerts

---

# Routes and API

# EDUNODE ANALYTICS - ROUTE AND API INVENTORY
# Generated: 2026-03-05 21:07:08

## PAGE ROUTES (67)
  /[school_slug]/account
  /[school_slug]/analytics/advanced
  /[school_slug]/analytics/impact
  /[school_slug]/authorizer
  /[school_slug]/dashboard/assessments
  /[school_slug]/dashboard/attendance
  /[school_slug]/dashboard/momentum
  /[school_slug]/dashboard
  /[school_slug]/dashboard/pulse
  /[school_slug]/dashboard/reports
  /[school_slug]/dashboard/students/[student_id]
  /[school_slug]/dashboard/students
  /[school_slug]/help
  /[school_slug]/interventions
  /[school_slug]/network
  /[school_slug]/notifications
  /[school_slug]/resources/modules/[slug]
  /[school_slug]/resources
  /[school_slug]/search
  /[school_slug]/settings/api
  /[school_slug]/settings/billing
  /[school_slug]/settings/data-sources
  /[school_slug]/settings/integrations
  /[school_slug]/settings
  /[school_slug]/settings/sso
  /[school_slug]/student-360/[student_id]
  /about
  /accessibility
  /admin/audit-logs
  /admin
  /admin/system
  /blog
  /careers
  /case-studies
  /changelog
  /checkout
  /compare-plans
  /contact
  /cookies
  /data-blueprint
  /demo
  /docs/api
  /docs/getting-started
  /docs
  /faq
  /feedback
  /ferpa
  /help
  /integrations
  /onboarding
  /
  /partners
  /pricing
  /privacy
  /roi-calculator
  /security
  /select-school
  /settings/roles
  /settings/team/invite
  /settings/team
  /sign-in/[[...sign-in]]
  /sign-up/[[...sign-up]]
  /status
  /terms
  /testimonials
  /unauthorized
  /webinars

## API ROUTES (39)
  /api/ai/usage  [GET]
  /api/cron/scheduled-reports  [GET]
  /api/cron/stale-interventions  [GET]
  /api/cron/sync-rosters  [GET]
  /api/dashboard  [GET]
  /api/data/sources/[sourceId]/oauth  [GET]
  /api/data/sources/[sourceId]  [GET]
  /api/data/sources/[sourceId]/sync  [GET]
  /api/data/sources  [GET]
  /api/data/warehouse  [GET, POST]
  /api/demo-request  [GET, POST]
  /api/ferpa-audit  [GET, POST]
  /api/health/live  [GET]
  /api/health/ready  [GET]
  /api/health  [GET]
  /api/privacy/test  [GET]
  /api/reports  [GET, POST]
  /api/schools/[schoolId]/export/interventions  [GET, POST]
  /api/schools/[schoolId]/export/students  [GET, POST]
  /api/schools/[schoolId]/interventions/[interventionId]  [GET, POST]
  /api/schools/[schoolId]/interventions/metrics  [GET, POST]
  /api/schools/[schoolId]/interventions/pending  [GET, POST]
  /api/schools/[schoolId]/interventions  [GET, POST]
  /api/schools/[schoolId]/metrics  [GET, POST]
  /api/schools/[schoolId]/notifications/[notificationId]  [GET, POST]
  /api/schools/[schoolId]/notifications/read-all  [GET, POST]
  /api/schools/[schoolId]/notifications  [GET, POST]
  /api/schools/[schoolId]/privacy/audit  [GET, POST]
  /api/schools/[schoolId]  [GET, POST]
  /api/schools/[schoolId]/students/[studentId]/analyze  [GET, POST]
  /api/schools/[schoolId]/students/[studentId]/interventions  [GET, POST]
  /api/schools/[schoolId]/students/[studentId]  [GET, POST]
  /api/schools/[schoolId]/students/at-risk  [GET, POST]
  /api/schools/[schoolId]/students/metrics  [GET, POST]
  /api/schools/[schoolId]/students  [GET, POST]
  /api/schools  [GET, POST]
  /api/subscriptions/portal  [POST]
  /api/subscriptions  [GET, POST, PATCH, DELETE]
  /api/webhooks/stripe  [POST]

## LAYOUTS (2)
  /[school_slug]/layout.tsx
  /layout.tsx

## RISK ENGINE ROUTES CHECK
  [MISSING] api/schools/[schoolId]/risk
  [MISSING] api/schools/[schoolId]/risk/scores
  [MISSING] api/schools/[schoolId]/risk/distribution
  [MISSING] api/schools/[schoolId]/risk/drivers
  [MISSING] api/schools/[schoolId]/risk/alerts
  [MISSING] api/schools/[schoolId]/risk/config

---

# Gap Analysis

# EDUNODE ANALYTICS - RISK ENGINE GAP ANALYSIS
# Generated: 2026-03-05 21:07:09

## A) BUILD HEALTH
  [PASS] Build - package.json
  [PASS] Build - tsconfig.json
  [PASS] Build - .env.local
  [PASS] Build - build-info.json

## B) DATA INTEGRATION
  [PASS] Data - Adapter directory exists
  [PASS] Data - Sync cron routes

## C) RISK ENGINE (CORE)
  [FAIL] Risk - risk-engine/types.ts
  [FAIL] Risk - risk-engine/normalizers.ts
  [FAIL] Risk - risk-engine/calculator.ts
  [FAIL] Risk - risk-engine/trend-detector.ts
  [FAIL] Risk - risk-engine/orchestrator.ts
  [FAIL] Risk - risk-engine/alert-engine.ts
  [PASS] Risk - Risk score computation
  [PASS] Risk - Weighted indicator model
  [PASS] Risk - Threshold classification
  [PASS] Risk - Trend detection logic
  [PASS] Risk - Alert generation
  [FAIL] Risk - Batch evaluation
  [PASS] Risk - Configurable thresholds
  [PASS] Risk - Data completeness handling

## D) ALERTS
  [PASS] Alerts - Severity levels
  [PASS] Alerts - Deduplication

## E) MTSS WORKFLOW
  [FAIL] MTSS - Interventions API
  [PASS] MTSS - Tier placement
  [PASS] MTSS - Progress monitoring
  [PASS] MTSS - Intervention templates

## F) COMPLIANCE
  [PASS] Compliance - FERPA infrastructure
  [PASS] Compliance - PII anonymization
  [PASS] Compliance - RBAC
  [PASS] Compliance - Audit logs

## G) EARLY WARNING DASHBOARD
  [FAIL] Dashboard - Dashboard page
  [FAIL] Dashboard - Early warning page
  [PASS] Dashboard - Risk distribution widget
  [FAIL] Dashboard - At-risk student table

## H) TESTING
  [PASS] Testing - Risk scoring tests

## ========================================
## SUMMARY
##   Total: 38  Passed: 24  Failed: 14
##   Score: 63.2%
## ========================================

## FAILED ITEMS (Build Priority):
  -> Risk | risk-engine/types.ts
  -> Risk | risk-engine/normalizers.ts
  -> Risk | risk-engine/calculator.ts
  -> Risk | risk-engine/trend-detector.ts
  -> Risk | risk-engine/orchestrator.ts
  -> Risk | risk-engine/alert-engine.ts
  -> Risk | Batch evaluation
  -> MTSS | Interventions API
  -> Dashboard | Dashboard page
  -> Dashboard | Early warning page
  -> Dashboard | At-risk student table

## GO/NO-GO CRITERIA:
  [PASS] Risk computed automatically
  [PASS] Alerts trigger on changes
  [PASS] Tiering and interventions tracked
  [PASS] Dashboard who/why/what-next
  [PASS] Audit logs persist

---

# Recommended Sprint Plan

## Sprint 1: Risk Engine Foundation (Week 1-2)
- [ ] Supabase migration for risk tables
- [ ] src/lib/risk-engine/types.ts
- [ ] src/lib/risk-engine/normalizers.ts
- [ ] src/lib/risk-engine/calculator.ts
- [ ] Unit tests for normalizers and calculator

## Sprint 2: Engine Integration (Week 2-3)
- [ ] src/lib/risk-engine/trend-detector.ts
- [ ] src/lib/risk-engine/orchestrator.ts
- [ ] src/lib/risk-engine/alert-engine.ts
- [ ] Nightly cron and post-sync hooks
- [ ] Student metrics aggregator

## Sprint 3: API Layer (Week 3-4)
- [ ] GET /api/schools/[schoolId]/risk/scores
- [ ] GET /api/schools/[schoolId]/risk/distribution
- [ ] GET /api/schools/[schoolId]/risk/drivers
- [ ] GET+PUT /api/schools/[schoolId]/risk/config
- [ ] GET+PATCH /api/schools/[schoolId]/risk/alerts

## Sprint 4: Early Warning Dashboard (Week 4-5)
- [ ] /[school_slug]/dashboard/early-warning page
- [ ] Risk distribution chart
- [ ] At-risk student table
- [ ] Risk driver panel
- [ ] Alert feed and intervention pipeline

## Sprint 5: Demo and Polish (Week 5-6)
- [ ] Seed data generator
- [ ] Risk config admin UI
- [ ] Demo school walkthrough
- [ ] Go/No-Go checklist validation

---

Upload this file as context for Sprint 1.