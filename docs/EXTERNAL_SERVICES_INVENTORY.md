# External Services Inventory

This document lists all external services, APIs, and subscriptions used by EduNode Analytics.

## Legend
- 🟢 **Free Tier Available** - Has a free tier suitable for development/small scale
- 🟡 **Freemium** - Free tier with limitations, paid for production
- 🔴 **Paid Only** - Requires paid subscription
- ⚪ **Optional** - Not required for core functionality

---

## 1. Core Infrastructure

### Supabase (Database & Auth Alternative)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key |

- **Pricing**: 🟢 Free tier (500MB database, 1GB storage, 2GB bandwidth)
- **Production**: ~$25/month (Pro plan)
- **Website**: https://supabase.com/pricing
- **Required**: ✅ Yes (primary database)

---

### Clerk (Authentication)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public key for client |
| `CLERK_SECRET_KEY` | Server-side secret key |

- **Pricing**: 🟢 Free tier (10,000 MAU)
- **Production**: $25/month (Pro) or $0.02/MAU
- **Website**: https://clerk.com/pricing
- **Required**: ✅ Yes (current auth provider)

---

### Vercel (Hosting)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` | Git commit for deployments |
| `VERCEL_GIT_COMMIT_SHA` | Server-side commit SHA |

- **Pricing**: 🟢 Free tier (hobby projects)
- **Production**: $20/month (Pro) per team member
- **Website**: https://vercel.com/pricing
- **Required**: ⚪ Optional (can use other hosts)

---

## 2. Payment Processing

### Stripe (Billing & Subscriptions)
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | API secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `STRIPE_STARTER_MONTHLY_PRICE_ID` | Starter plan monthly price |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | Starter plan annual price |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Pro plan monthly price |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Pro plan annual price |
| `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID` | Enterprise monthly price |
| `STRIPE_ENTERPRISE_ANNUAL_PRICE_ID` | Enterprise annual price |
| `STRIPE_PER_STUDENT_PRICE_ID` | Per-student usage pricing |

- **Pricing**: 🟢 No monthly fee, 2.9% + $0.30 per transaction
- **Website**: https://stripe.com/pricing
- **Required**: ✅ Yes (for paid subscriptions)

---

## 3. AI & Machine Learning

### OpenAI (GPT Models)
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key for GPT models |

- **Pricing**: 🟡 Pay-per-use ($0.002-$0.06 per 1K tokens depending on model)
- **Website**: https://openai.com/pricing
- **Required**: ⚪ Optional (AI Qualitative Pulse feature)
- **Used For**: AI-powered student insights, intervention recommendations

---

### Anthropic Claude (Alternative AI)
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key for Claude models |

- **Pricing**: 🟡 Pay-per-use ($0.008-$0.024 per 1K tokens)
- **Website**: https://anthropic.com/pricing
- **Required**: ⚪ Optional (alternative to OpenAI)

---

### Google AI (Gemini)
| Variable | Description |
|----------|-------------|
| `GOOGLE_AI_API_KEY` | API key for Gemini models |

- **Pricing**: 🟢 Free tier (60 requests/minute)
- **Production**: Pay-per-use
- **Website**: https://ai.google.dev/pricing
- **Required**: ⚪ Optional (alternative AI provider)

---

## 4. Data Transformation & Warehouse

### dbt (Data Build Tool)
| Variable | Description |
|----------|-------------|
| N/A | dbt Core runs locally |

- **Pricing**: 🟢 Free (dbt Core is open source)
- **dbt Cloud**: $100/month (Team), $500/month (Enterprise) - optional
- **Website**: https://getdbt.com
- **Required**: ⚪ Optional (for BigQuery transformations)
- **Used For**: SQL-based data transformations, data modeling, testing
- **Location**: `/dbt/` directory in codebase

---

### Google BigQuery
| Variable | Description |
|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `BIGQUERY_PROJECT_ID` | GCP project ID |
| `BIGQUERY_DATASET` | BigQuery dataset name |

- **Pricing**: 🟢 Free tier (1TB queries/month, 10GB storage)
- **Production**: $5/TB queried, $0.02/GB stored
- **Website**: https://cloud.google.com/bigquery/pricing
- **Required**: ⚪ Optional (app falls back to seed data)
- **Used For**: Large-scale analytics, data warehouse for production

---

## 5. Caching & Performance

### Upstash Redis
| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Redis REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | API authentication token |

- **Pricing**: 🟢 Free tier (10,000 commands/day)
- **Production**: $0.2/100K commands
- **Website**: https://upstash.com/pricing
- **Required**: ⚪ Optional (improves performance)
- **Used For**: Query caching, rate limiting, session storage

---

## 6. Monitoring & Analytics

### Sentry (Error Tracking)
| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Data Source Name |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side DSN |
| `SENTRY_ORG` | Organization slug |
| `SENTRY_PROJECT` | Project name |
| `SENTRY_AUTH_TOKEN` | Auth token for source maps |

- **Pricing**: 🟢 Free tier (5K errors/month)
- **Production**: $26/month (Team plan)
- **Website**: https://sentry.io/pricing
- **Required**: ⚪ Optional (but recommended)

---

### PostHog (Product Analytics)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog instance URL |
| `NEXT_PUBLIC_POSTHOG_RECORDING` | Enable session recording |

- **Pricing**: 🟢 Free tier (1M events/month)
- **Production**: Pay-per-use after free tier
- **Website**: https://posthog.com/pricing
- **Required**: ⚪ Optional (product analytics)

---

## 7. Email Services

### Resend (Transactional Email)
| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key |
| `FROM_EMAIL` | Sender email address |

- **Pricing**: 🟢 Free tier (3,000 emails/month)
- **Production**: $20/month (Pro)
- **Website**: https://resend.com/pricing
- **Required**: ⚪ Optional (notifications, alerts)

---

## 8. SIS/LMS Integrations

### Clever (Roster Sync)
| Variable | Description |
|----------|-------------|
| `CLEVER_CLIENT_ID` | OAuth client ID |
| `CLEVER_CLIENT_SECRET` | OAuth client secret |

- **Pricing**: 🟢 Free for schools (Clever charges districts)
- **Website**: https://clever.com
- **Required**: ⚪ Optional (roster sync integration)

---

### ClassLink (SSO & Roster)
| Variable | Description |
|----------|-------------|
| `CLASSLINK_CLIENT_ID` | OAuth client ID |
| `CLASSLINK_CLIENT_SECRET` | OAuth client secret |

- **Pricing**: 🔴 Paid (through district contracts)
- **Website**: https://classlink.com
- **Required**: ⚪ Optional (SSO integration)

---

### PowerSchool (SIS)
| Variable | Description |
|----------|-------------|
| `POWERSCHOOL_CLIENT_ID` | API client ID |
| `POWERSCHOOL_URL` | PowerSchool instance URL |

- **Pricing**: 🔴 Paid (through district contracts)
- **Website**: https://powerschool.com
- **Required**: ⚪ Optional (SIS integration)

---

### Canvas (LMS)
| Variable | Description |
|----------|-------------|
| `CANVAS_CLIENT_ID` | OAuth client ID |
| `CANVAS_URL` | Canvas instance URL |

- **Pricing**: 🔴 Paid (through district contracts)
- **Website**: https://instructure.com
- **Required**: ⚪ Optional (LMS integration)

---

### NWEA MAP (Assessments)
| Variable | Description |
|----------|-------------|
| `NWEA_API_KEY` | API key |

- **Pricing**: 🔴 Paid (through district contracts)
- **Website**: https://nwea.org
- **Required**: ⚪ Optional (assessment data)

---

## 9. Security & Compliance

### Google OAuth (SSO)
| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |

- **Pricing**: 🟢 Free
- **Website**: https://console.cloud.google.com
- **Required**: ⚪ Optional (Google SSO)

---

## Cost Summary

### Minimum Viable Production Setup
| Service | Monthly Cost |
|---------|--------------|
| Supabase Pro | $25 |
| Clerk Pro | $25 |
| Vercel Pro | $20 |
| **Total** | **~$70/month** |

### Recommended Production Setup
| Service | Monthly Cost |
|---------|--------------|
| Supabase Pro | $25 |
| Clerk Pro | $25 |
| Vercel Pro | $20 |
| Sentry Team | $26 |
| Upstash Pro | ~$10 |
| Resend Pro | $20 |
| OpenAI (usage) | ~$50-200 |
| **Total** | **~$175-350/month** |

### Enterprise Setup (adds)
| Service | Monthly Cost |
|---------|--------------|
| BigQuery | ~$50-500 (usage-based) |
| PostHog | ~$50-200 |
| Additional AI usage | Variable |

---

## Development Setup (Free)

For local development, you only need:
1. **Supabase** (free tier) - Database
2. **Clerk** (free tier) - Authentication
3. Everything else uses seed data fallbacks

```bash
# Minimum .env.local for development
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
