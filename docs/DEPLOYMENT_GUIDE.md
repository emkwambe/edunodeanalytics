# EduNode Analytics - Deployment Guide

This guide covers deploying EduNode Analytics to production environments. It includes instructions for Vercel (recommended), Docker, and manual server deployments.

## Table of Contents

- [Deployment Options](#deployment-options)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Docker Deployment](#docker-deployment)
- [Manual Server Deployment](#manual-server-deployment)
- [BigQuery Data Warehouse Setup](#bigquery-data-warehouse-setup)
- [dbt Configuration](#dbt-configuration)
- [Post-Deployment Tasks](#post-deployment-tasks)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Deployment Options

| Platform | Best For | Complexity | Cost |
|----------|----------|------------|------|
| **Vercel** | Quick deployment, auto-scaling | Low | Free tier available |
| **Docker** | Full control, self-hosting | Medium | Infrastructure cost |
| **Manual** | Custom infrastructure | High | Variable |

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

### Required Configuration

- [ ] Production Clerk application created with live keys
- [ ] Production Supabase project with migrations applied
- [ ] All environment variables configured
- [ ] ANONYMIZATION_SECRET generated with `openssl rand -hex 32`

### Security Audit

- [ ] No development keys in production config
- [ ] SUPABASE_SERVICE_ROLE_KEY is server-side only
- [ ] HTTPS enabled for all endpoints
- [ ] Row Level Security (RLS) enabled on all tables

### Performance

- [ ] Production build tested locally (`npm run build && npm run start`)
- [ ] All tests passing (`npm run test:run`)
- [ ] No console errors or warnings

---

## Vercel Deployment (Recommended)

Vercel provides the optimal deployment experience for Next.js applications with automatic scaling, edge functions, and zero-config deployments.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Project

```bash
vercel link
```

### Step 4: Configure Environment Variables

Add all production environment variables via Vercel Dashboard or CLI:

```bash
# Required variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANONYMIZATION_SECRET
vercel env add NEXT_PUBLIC_APP_URL

# Optional: BigQuery
vercel env add GOOGLE_CLOUD_PROJECT_ID
vercel env add BIGQUERY_DATASET_PREFIX
# Note: For GOOGLE_APPLICATION_CREDENTIALS, use Vercel's service account integration

# Optional: Stripe
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Step 5: Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Step 6: Configure Domain

1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Enable HTTPS (automatic)

### Step 7: Enable Cron Jobs

Cron jobs are pre-configured in `vercel.json`:

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/sync-rosters` | Daily 6 AM | Sync SIS data |
| `/api/cron/stale-interventions` | Mondays 8 AM | Flag stale interventions |
| `/api/cron/risk-evaluation` | Daily 2 AM | Recalculate risk scores |

Add the cron secret:

```bash
vercel env add CRON_SECRET
```

### Vercel Configuration Reference

The `vercel.json` configures:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `regions` | `["iad1"]` | US East deployment (FERPA compliance) |
| `maxDuration` | `30` | API timeout in seconds |

---

## Docker Deployment

Docker deployment provides full control over your infrastructure and is suitable for self-hosted environments.

### Step 1: Build Docker Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -t edunode-analytics:latest .
```

### Step 2: Run Container

```bash
docker run -d \
  --name edunode \
  -p 3000:3000 \
  -e CLERK_SECRET_KEY=sk_live_xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  -e ANONYMIZATION_SECRET=xxx \
  -e NODE_ENV=production \
  edunode-analytics:latest
```

### Step 3: Using Docker Compose

For a complete stack with optional Redis caching:

```bash
# Create .env.local with all production variables
cp .env.example .env.local
# Edit .env.local with production values

# Start application
docker-compose up -d

# With Redis cache
docker-compose --profile with-cache up -d
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 4: Reverse Proxy (Nginx)

Configure Nginx as a reverse proxy with HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: Health Checks

Monitor container health:

```bash
# Check container status
docker ps

# View logs
docker logs edunode -f

# Check health endpoint
curl http://localhost:3000/api/health
```

---

## Manual Server Deployment

For deployment on bare metal or VMs without Docker.

### Step 1: Server Requirements

- Ubuntu 22.04 LTS or similar
- Node.js 20.x (via nvm or nodesource)
- 512MB RAM minimum
- SSL certificate (Let's Encrypt recommended)

### Step 2: Install Node.js

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
```

### Step 3: Clone and Build

```bash
# Clone repository
git clone https://github.com/your-org/edunodeanalytics.git
cd edunodeanalytics

# Install dependencies
npm ci

# Build for production
npm run build
```

### Step 4: Configure Environment

```bash
# Create environment file
cp .env.example .env.local
# Edit with production values
nano .env.local
```

### Step 5: Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "edunode" -- start

# Save process list
pm2 save

# Configure startup script
pm2 startup
```

### Step 6: PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'edunode',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/edunodeanalytics',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with:

```bash
pm2 start ecosystem.config.js
```

---

## BigQuery Data Warehouse Setup

For production analytics, configure Google BigQuery as the data warehouse.

### Step 1: Create GCP Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g., `edunode-analytics`)
3. Enable the BigQuery API

### Step 2: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create edunode-dbt \
  --display-name="EduNode dbt Runner"

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:edunode-dbt@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:edunode-dbt@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

# Create key file
gcloud iam service-accounts keys create ./service-account.json \
  --iam-account=edunode-dbt@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 3: Configure Environment

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
BIGQUERY_DATASET_PREFIX=edunode_
```

### Step 4: Create Datasets

```bash
# Development dataset
bq mk --dataset YOUR_PROJECT_ID:edunode_dev

# Production dataset
bq mk --dataset YOUR_PROJECT_ID:edunode_prod
```

---

## dbt Configuration

dbt (data build tool) transforms raw SIS data into the unified EduNode schema.

### Step 1: Install dbt

```bash
pip install dbt-bigquery
```

### Step 2: Configure Profiles

Edit `dbt/profiles.yml` or set environment variables:

```bash
export DBT_DATASET=edunode_prod
export DBT_TENANT_ID=your-tenant-id
export DBT_ACADEMIC_YEAR=2024-2025
```

### Step 3: Run dbt

```bash
# Navigate to dbt directory
cd dbt

# Test connection
dbt debug

# Run transformations
dbt run

# Run tests
dbt test

# Generate documentation
dbt docs generate
```

### Step 4: Scheduled dbt Runs

For production, schedule dbt runs via:

- **Vercel Cron:** Add endpoint to call dbt
- **Cloud Scheduler:** GCP native scheduling
- **Airflow/Dagster:** For complex pipelines

---

## Post-Deployment Tasks

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Expected response
{"status": "healthy"}
```

### 2. Configure Clerk Production

1. Go to Clerk Dashboard
2. Switch to Production instance
3. Update Redirect URLs to production domain
4. Configure allowed domains

### 3. Enable Stripe (If Using Billing)

```bash
# Set production Stripe keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Configure webhook endpoint: `https://your-domain.com/api/webhooks/stripe`

### 4. SIS Integration

For Clever or ClassLink integration:

1. Register as an application partner
2. Configure OAuth redirect URLs
3. Add client credentials to environment

---

## Monitoring and Maintenance

### Health Monitoring

| Endpoint | Method | Expected Response |
|----------|--------|-------------------|
| `/api/health` | GET | `200 {"status": "healthy"}` |

### Logging

Enable structured logging for production monitoring:

```bash
# Optional: Add Sentry for error tracking
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Performance Monitoring

Optional analytics tools:

```bash
# PostHog analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Database Backups

Supabase provides automatic backups. For additional protection:

1. Enable Point-in-Time Recovery in Supabase Dashboard
2. Configure backup retention policy
3. Test restore procedures quarterly

### Scaling Considerations

| Component | Scaling Strategy |
|-----------|------------------|
| Web Application | Horizontal (Vercel auto-scales, Docker replicas) |
| Supabase | Vertical (upgrade plan as needed) |
| BigQuery | Automatic (pay per query) |
| Redis (optional) | Vertical or cluster mode |

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 errors on startup | Missing env vars | Check all required variables are set |
| Clerk redirect loops | Wrong redirect URLs | Update URLs in Clerk Dashboard |
| Database connection timeout | Network/firewall | Allow Supabase IP ranges |
| Build fails with OOM | Insufficient memory | Increase `NODE_OPTIONS=--max-old-space-size=4096` |

### Getting Help

1. Check application logs
2. Review Vercel/Docker deployment logs
3. Verify environment variables
4. Test individual service connections

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables only
2. **Rotate keys regularly** - Update all API keys quarterly
3. **Enable RLS** - All Supabase tables must have Row Level Security
4. **HTTPS only** - Enforce TLS 1.2+ on all endpoints
5. **Audit logging** - Review access logs monthly
6. **FERPA compliance** - Student data cached with `no-store` headers

See [SECURITY_SAFETY_PROTOCOL.md](./SECURITY_SAFETY_PROTOCOL.md) for complete compliance documentation.
