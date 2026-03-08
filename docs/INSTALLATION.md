# EduNode Analytics - Installation Guide

This guide covers the installation and setup of EduNode Analytics, a multi-tenant SaaS platform for K-12 student analytics with early warning systems and intervention tracking.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Verifying Installation](#verifying-installation)
- [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x or higher | JavaScript runtime |
| npm | 10.x or higher | Package manager |
| Git | 2.x or higher | Version control |

### Required Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Clerk | Authentication & Multi-tenant SSO | [dashboard.clerk.com](https://dashboard.clerk.com) |
| Supabase | PostgreSQL Database & Storage | [supabase.com](https://supabase.com) |

### Optional Services

| Service | Purpose | When Needed |
|---------|---------|-------------|
| Google Cloud (BigQuery) | Analytical data warehouse | Production analytics |
| Stripe | Subscription billing | SaaS monetization |
| Clever / ClassLink | SIS roster sync | Student data import |

---

## Quick Start (Development)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/edunodeanalytics.git
cd edunodeanalytics
```

### Step 2: Install Dependencies

```bash
npm ci
```

> **Note:** Use `npm ci` instead of `npm install` for reproducible builds matching the lockfile.

### Step 3: Create Environment File

```bash
cp .env.example .env.local
```

### Step 4: Configure Required Environment Variables

Edit `.env.local` with your credentials:

```bash
# REQUIRED: Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
CLERK_SECRET_KEY=sk_test_your-secret-here

# REQUIRED: Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

### Step 5: Run Database Migrations

Apply the database schema to your Supabase project:

```bash
# Using Supabase CLI (recommended)
npx supabase db push

# Or manually run migrations via Supabase Dashboard SQL Editor
# Files are in: supabase/migrations/
```

### Step 6: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Environment Configuration

### Authentication (Clerk)

1. Create a new application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Enable the authentication methods you need (Email, Google, Microsoft, etc.)
3. Configure the redirect URLs:
   - **Sign-in URL:** `/sign-in`
   - **Sign-up URL:** `/sign-up`
   - **After sign-in:** `/select-school`
   - **After sign-up:** `/onboarding`

4. Copy the API keys to your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/select-school
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Database (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for the database to provision (1-2 minutes)
3. Go to **Settings > API** to find your keys
4. Copy credentials to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> **Security Note:** The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Never expose it to the client.

### Data Anonymization (Required for AI Features)

Generate a secure anonymization key:

```bash
openssl rand -hex 32
```

Add to `.env.local`:

```bash
ANONYMIZATION_SECRET=your-generated-hex-string
```

---

## Database Setup

### Running Migrations

The database schema is managed through SQL migration files in `supabase/migrations/`.

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

#### Option B: Manual Migration via Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - `00001_initial_schema.sql`
   - `00002_students_interventions_resources.sql`
   - `00003_billing_stripe_integration.sql`
   - `00004_data_integration_sync_history.sql`
   - `00005_reports_and_ai_usage.sql`
   - `00006_risk_engine_tables.sql`
   - `00007_intervention_dosage_metrics.sql`

### Seeding Demo Data (Optional)

For development and testing, seed the database with sample data:

```bash
npx ts-node supabase/seed-demo-data.ts
```

### Generating TypeScript Types

After modifying the database schema:

```bash
npm run db:generate
```

This generates type definitions in `src/lib/database.types.ts`.

---

## Running the Application

### Development Mode

```bash
# Standard development server
npm run dev

# With Turbopack (faster builds)
npm run dev:turbo

# With Webpack (if Turbopack has issues)
npm run dev:webpack
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

---

## Verifying Installation

### Health Check

After starting the server, verify the installation:

1. **Homepage:** Visit `http://localhost:3000`
2. **API Health:** Visit `http://localhost:3000/api/health`
3. **Sign In:** Click "Sign In" and authenticate with Clerk

### Expected Behavior

| Check | Expected Result |
|-------|-----------------|
| Homepage loads | See landing page with "Sign In" button |
| API health returns 200 | `{"status": "healthy"}` |
| Clerk sign-in works | Redirected to Clerk's hosted sign-in |
| Post-login redirect | Lands on `/select-school` page |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `CLERK_SECRET_KEY` error | Verify key format starts with `sk_test_` or `sk_live_` |
| Supabase connection failed | Check `NEXT_PUBLIC_SUPABASE_URL` includes `https://` |
| Build memory error | Ensure Node.js has 4GB+ memory (set via `NODE_OPTIONS`) |
| Port 3000 in use | Stop other processes or use `PORT=3001 npm run dev` |

---

## Next Steps

After completing the basic installation:

1. **Production Deployment:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Developer Setup:** See [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
3. **Data Warehouse (BigQuery):** Configure analytics warehouse for production
4. **SIS Integration:** Set up Clever or ClassLink for roster sync
5. **Stripe Billing:** Configure subscription management

---

## Support

- **Documentation:** Check the `docs/` folder for detailed guides
- **Issues:** Report bugs at your project's issue tracker
- **Security:** Review [SECURITY_SAFETY_PROTOCOL.md](./SECURITY_SAFETY_PROTOCOL.md) for compliance

---

## System Requirements

### Development Machine

- **Memory:** 8GB RAM minimum (16GB recommended)
- **Disk:** 2GB free space
- **OS:** macOS, Linux, or Windows with WSL2

### Production Server

- **Memory:** 512MB minimum per instance
- **CPU:** 1 vCPU minimum
- **Node.js:** 20.x LTS

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production requirements.
