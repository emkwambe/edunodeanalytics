# EduNode Analytics - Developer Setup Guide

This guide helps developers set up a complete local development environment for contributing to EduNode Analytics.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [IDE Configuration](#ide-configuration)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Database Development](#database-development)
- [Working with dbt](#working-with-dbt)
- [Code Style and Standards](#code-style-and-standards)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Node.js 20.x (use nvm for version management)
node --version  # Should output v20.x.x

# npm 10.x
npm --version   # Should output 10.x.x

# Git
git --version   # Should output 2.x.x
```

### Recommended Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **nvm** | Node version management | [nvm-sh/nvm](https://github.com/nvm-sh/nvm) |
| **VS Code** | IDE with excellent TypeScript support | [code.visualstudio.com](https://code.visualstudio.com) |
| **Supabase CLI** | Local database development | `npm install -g supabase` |
| **dbt** | Data transformation testing | `pip install dbt-bigquery` |

---

## Initial Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/edunodeanalytics.git
cd edunodeanalytics
```

### Step 2: Set Node Version

```bash
# If using nvm
nvm install 20
nvm use 20

# Verify
node --version
```

### Step 3: Install Dependencies

```bash
npm ci
```

> **Why `npm ci`?** It installs exact versions from `package-lock.json`, ensuring consistency across all development environments.

### Step 4: Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your credentials
# See INSTALLATION.md for details on obtaining credentials
```

### Step 5: Start Development Server

```bash
# Recommended: Turbopack (faster HMR)
npm run dev:turbo

# Alternative: Webpack (more stable)
npm run dev

# Alternative: Standard mode
npm run dev:webpack
```

Access the application at `http://localhost:3000`.

---

## IDE Configuration

### VS Code (Recommended)

#### Recommended Extensions

Install these extensions for the best development experience:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

#### Launch Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

---

## Project Structure

```
edunodeanalytics/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Dashboard routes (protected)
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   └── ...               # Feature components
│   ├── lib/                   # Utilities and configurations
│   │   ├── supabase/         # Supabase client configuration
│   │   ├── database.types.ts # Generated database types
│   │   └── utils.ts          # Helper functions
│   └── hooks/                 # Custom React hooks
├── dbt/                       # dbt data transformations
│   ├── models/               # SQL transformation models
│   ├── macros/               # Reusable SQL macros
│   ├── dbt_project.yml       # dbt configuration
│   └── profiles.yml          # Database connection profiles
├── supabase/
│   ├── migrations/           # SQL migration files
│   └── seed-demo-data.ts     # Demo data seeder
├── public/                    # Static assets
├── docs/                      # Documentation
└── tests/                     # Test files
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js 16 App Router pages and API routes |
| `src/components/ui/` | Base UI components from shadcn/ui |
| `src/lib/` | Shared utilities, types, and configurations |
| `supabase/migrations/` | Database schema migrations |
| `dbt/models/` | Data transformation SQL |

---

## Development Workflow

### Branch Naming Convention

```bash
# Features
git checkout -b feature/risk-engine-enhancements

# Bug fixes
git checkout -b fix/attendance-calculation-error

# Documentation
git checkout -b docs/installation-guide

# Refactoring
git checkout -b refactor/student-api-cleanup
```

### Development Commands

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Run tests
npm run test

# Build for production
npm run build
```

### Making Changes

1. Create a feature branch from `main`
2. Make changes with small, focused commits
3. Run tests and linting before pushing
4. Open a pull request for review

---

## Testing

### Running Tests

```bash
# Run tests in watch mode (during development)
npm run test

# Run tests once (CI/pre-commit)
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

### Test File Structure

```
src/
├── components/
│   ├── StudentCard.tsx
│   └── StudentCard.test.tsx    # Co-located test
└── lib/
    ├── utils.ts
    └── utils.test.ts           # Co-located test
```

### Writing Tests

```typescript
// Example: StudentCard.test.tsx
import { render, screen } from '@testing-library/react';
import { StudentCard } from './StudentCard';

describe('StudentCard', () => {
  it('renders student name', () => {
    render(<StudentCard name="John Doe" grade={10} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays risk indicator for at-risk students', () => {
    render(<StudentCard name="Jane Doe" grade={9} riskLevel="high" />);
    expect(screen.getByTestId('risk-indicator')).toHaveClass('risk-high');
  });
});
```

### Test Coverage Requirements

| Area | Minimum Coverage |
|------|------------------|
| Utilities (`src/lib/`) | 80% |
| Components | 70% |
| API Routes | 60% |

---

## Database Development

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Stop local Supabase
supabase stop
```

### Creating Migrations

```bash
# Create a new migration
supabase migration new add_student_notes_table

# Edit the migration file
# supabase/migrations/YYYYMMDDHHMMSS_add_student_notes_table.sql
```

Example migration:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_student_notes_table.sql

-- Create table
CREATE TABLE student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view notes for their school's students"
  ON student_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN school_users su ON s.school_id = su.school_id
      WHERE s.id = student_notes.student_id
      AND su.user_id = auth.uid()
    )
  );
```

### Applying Migrations

```bash
# Push to local Supabase
supabase db push

# Push to remote Supabase (production)
supabase db push --linked
```

### Regenerating Types

After schema changes:

```bash
npm run db:generate
```

This updates `src/lib/database.types.ts`.

---

## Working with dbt

### Setup

```bash
# Install dbt
pip install dbt-bigquery

# Navigate to dbt directory
cd dbt

# Install dependencies
dbt deps
```

### Development Workflow

```bash
# Test connection
dbt debug

# Run all models
dbt run

# Run specific model
dbt run --select student_risk_scores

# Run tests
dbt test

# Generate documentation
dbt docs generate
dbt docs serve
```

### Creating Models

Models are SQL files in `dbt/models/`:

```sql
-- dbt/models/marts/student_risk_scores.sql

{{ config(
    materialized='table',
    schema='marts'
) }}

WITH attendance_metrics AS (
    SELECT
        student_id,
        AVG(attendance_rate) as avg_attendance
    FROM {{ ref('stg_attendance') }}
    WHERE academic_year = '{{ var("academic_year") }}'
    GROUP BY 1
)

SELECT
    s.student_id,
    s.student_name,
    a.avg_attendance,
    CASE
        WHEN a.avg_attendance < 0.90 THEN 'high'
        WHEN a.avg_attendance < 0.95 THEN 'medium'
        ELSE 'low'
    END as risk_level
FROM {{ ref('stg_students') }} s
LEFT JOIN attendance_metrics a ON s.student_id = a.student_id
```

---

## Code Style and Standards

### TypeScript Guidelines

- Use strict TypeScript settings (configured in `tsconfig.json`)
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Prefer `const` over `let`

```typescript
// Good
interface StudentData {
  id: string;
  name: string;
  grade: number;
}

function calculateRisk(student: StudentData): 'low' | 'medium' | 'high' {
  // ...
}

// Bad
function calculateRisk(student: any) {
  // ...
}
```

### React Component Guidelines

- Use functional components with hooks
- Co-locate related files (component, test, styles)
- Use the `cn()` utility for conditional classes

```typescript
// Good
export function StudentCard({ name, riskLevel }: StudentCardProps) {
  return (
    <div className={cn(
      'rounded-lg p-4',
      riskLevel === 'high' && 'border-red-500'
    )}>
      {name}
    </div>
  );
}
```

### API Route Guidelines

- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return consistent response shapes
- Handle errors gracefully

```typescript
// Good
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

---

## Common Development Tasks

### Adding a New Page

1. Create the page file in `src/app/`:

```typescript
// src/app/(dashboard)/[school_slug]/new-feature/page.tsx
export default function NewFeaturePage() {
  return <div>New Feature</div>;
}
```

2. Add navigation link if needed
3. Add tests

### Adding a New API Endpoint

1. Create the route file:

```typescript
// src/app/api/new-endpoint/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello' });
}
```

2. Add authentication check if needed
3. Add tests

### Adding a New Component

1. Create component file:

```typescript
// src/components/NewComponent.tsx
export function NewComponent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

2. Create co-located test:

```typescript
// src/components/NewComponent.test.tsx
import { render } from '@testing-library/react';
import { NewComponent } from './NewComponent';

describe('NewComponent', () => {
  it('renders children', () => {
    // ...
  });
});
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `CLERK_SECRET_KEY is not set` | Check `.env.local` exists and has valid key |
| TypeScript errors on fresh clone | Run `npm ci` then restart VS Code |
| Build fails with memory error | Use `NODE_OPTIONS=--max-old-space-size=4096` |
| Hot reload not working | Try `npm run dev:webpack` instead of Turbopack |
| Tests failing on CI but passing locally | Ensure test database is properly configured |

### Debug Mode

Enable verbose logging:

```bash
DEBUG=* npm run dev
```

### Clearing Cache

If you encounter strange build issues:

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm ci
```

---

## Getting Help

1. Check this documentation first
2. Search existing issues in the repository
3. Ask in the team's development channel
4. Create a detailed issue with reproduction steps

### Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [dbt Documentation](https://docs.getdbt.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
