# EduNode Analytics - Tech Stack Subscription Inventory

**Last Updated:** 2026-03-23
**Status:** Production Readiness Checklist

---

## Summary

| Category | Required | Optional | Est. Monthly Cost |
|----------|----------|----------|-------------------|
| Core Infrastructure | 3 | 1 | $95-500+ |
| Authentication | 1 | 0 | $0-25+ |
| Payments | 1 | 0 | Usage-based |
| Email | 1 | 0 | $0-20+ |
| Monitoring & Analytics | 2 | 0 | $0-50+ |
| SIS Integrations | 0 | 2 | Free-$$ |
| AI Providers | 0 | 3 | Usage-based |
| **Total** | **8** | **6** | **$95-600+/mo** |

---

## Required Subscriptions

### 1. Vercel (Hosting & Deployment)
| Field | Details |
|-------|---------|
| **Service** | [Vercel](https://vercel.com) |
| **Purpose** | Next.js hosting, edge functions, serverless deployment |
| **Env Vars** | Auto-configured via Vercel dashboard |
| **Pricing** | Hobby: Free / Pro: $20/mo/member / Enterprise: Custom |
| **Recommended Tier** | **Pro** ($20/mo per seat) |
| **Notes** | Includes CRON jobs, preview deployments, analytics |

---

### 2. Supabase (Database & Realtime)
| Field | Details |
|-------|---------|
| **Service** | [Supabase](https://supabase.com) |
| **Purpose** | PostgreSQL database, metadata storage, realtime subscriptions |
| **Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Pricing** | Free: Limited / Pro: $25/mo / Team: $599/mo |
| **Recommended Tier** | **Pro** ($25/mo) - 8GB database, 250GB bandwidth |
| **Notes** | Run migrations before go-live |

---

### 3. Google Cloud Platform (BigQuery Data Warehouse)
| Field | Details |
|-------|---------|
| **Service** | [Google Cloud BigQuery](https://cloud.google.com/bigquery) |
| **Purpose** | Analytical data warehouse, dbt transformations |
| **Env Vars** | `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, `BIGQUERY_DATASET_PREFIX` |
| **Pricing** | $5/TB queried + $0.02/GB stored/mo |
| **Recommended Tier** | **Pay-as-you-go** (estimate $50-200/mo) |
| **Notes** | Create service account with BigQuery Admin role |

---

### 4. Clerk (Authentication & SSO)
| Field | Details |
|-------|---------|
| **Service** | [Clerk](https://clerk.com) |
| **Purpose** | Multi-tenant authentication, SSO, user management |
| **Env Vars** | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_*_URL` |
| **Pricing** | Free: 10K MAU / Pro: $25/mo + $0.02/MAU / Enterprise: Custom |
| **Recommended Tier** | **Pro** ($25/mo base) |
| **Notes** | Configure OAuth providers, webhook endpoints |

---

### 5. Stripe (Payments & Billing)
| Field | Details |
|-------|---------|
| **Service** | [Stripe](https://stripe.com) |
| **Purpose** | Payment processing, subscription management, invoicing |
| **Env Vars** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Pricing** | 2.9% + $0.30 per transaction |
| **Recommended Tier** | **Standard** (no monthly fee) |
| **Notes** | Create products for Starter/Pro/Enterprise tiers, configure webhook |

---

### 6. Resend (Transactional Email)
| Field | Details |
|-------|---------|
| **Service** | [Resend](https://resend.com) |
| **Purpose** | Payment notifications, intervention alerts, system emails |
| **Env Vars** | `RESEND_API_KEY`, `FROM_EMAIL` |
| **Pricing** | Free: 100 emails/day / Pro: $20/mo (50K emails) |
| **Recommended Tier** | **Free** to start, upgrade to Pro |
| **Notes** | Verify sending domain, configure DNS records |

---

### 7. Sentry (Error Monitoring)
| Field | Details |
|-------|---------|
| **Service** | [Sentry](https://sentry.io) |
| **Purpose** | Error tracking, performance monitoring, alerting |
| **Env Vars** | `SENTRY_DSN` |
| **Pricing** | Developer: Free (5K errors) / Team: $26/mo / Business: $80/mo |
| **Recommended Tier** | **Team** ($26/mo) |
| **Notes** | Install `@sentry/nextjs`, configure source maps |

---

### 8. PostHog (Product Analytics)
| Field | Details |
|-------|---------|
| **Service** | [PostHog](https://posthog.com) |
| **Purpose** | User behavior analytics, feature flags, session recording |
| **Env Vars** | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| **Pricing** | Free: 1M events/mo / Scale: Usage-based |
| **Recommended Tier** | **Free** to start |
| **Notes** | Self-hosted option available for FERPA compliance |

---

## Optional Subscriptions

### 9. Clever (SIS Integration)
| Field | Details |
|-------|---------|
| **Service** | [Clever](https://clever.com) |
| **Purpose** | Automatic roster sync with school SIS systems |
| **Env Vars** | `CLEVER_CLIENT_ID`, `CLEVER_CLIENT_SECRET` |
| **Pricing** | Free for apps / School pays for Clever |
| **Status** | Optional - for schools using Clever |
| **Notes** | Apply for Clever App Partner status |

---

### 10. ClassLink (SIS Integration)
| Field | Details |
|-------|---------|
| **Service** | [ClassLink](https://classlink.com) |
| **Purpose** | Automatic roster sync (alternative to Clever) |
| **Env Vars** | `CLASSLINK_CLIENT_ID`, `CLASSLINK_CLIENT_SECRET` |
| **Pricing** | Contact for partner pricing |
| **Status** | Optional - for schools using ClassLink |
| **Notes** | Apply for ClassLink Partner certification |

---

### 11. Anthropic Claude API (AI Features)
| Field | Details |
|-------|---------|
| **Service** | [Anthropic](https://anthropic.com) |
| **Purpose** | AI-powered student insights, intervention recommendations |
| **Env Vars** | `ANTHROPIC_API_KEY` |
| **Pricing** | Claude 3.5 Sonnet: $3/$15 per 1M tokens (input/output) |
| **Status** | Optional - enables AI analysis features |
| **Notes** | Use privacy proxy to anonymize student data |

---

### 12. OpenAI API (AI Features)
| Field | Details |
|-------|---------|
| **Service** | [OpenAI](https://openai.com) |
| **Purpose** | Alternative AI provider for insights |
| **Env Vars** | `OPENAI_API_KEY` |
| **Pricing** | GPT-4o: $2.50/$10 per 1M tokens |
| **Status** | Optional - backup AI provider |

---

### 13. Google AI / Gemini (AI Features)
| Field | Details |
|-------|---------|
| **Service** | [Google AI](https://ai.google.dev) |
| **Purpose** | Alternative AI provider |
| **Env Vars** | `GOOGLE_AI_API_KEY` |
| **Pricing** | Gemini Pro: Free tier available |
| **Status** | Optional - backup AI provider |

---

### 14. Upstash Redis (Caching)
| Field | Details |
|-------|---------|
| **Service** | [Upstash](https://upstash.com) |
| **Purpose** | Session caching, rate limiting, real-time features |
| **Env Vars** | `REDIS_URL` |
| **Pricing** | Free: 10K commands/day / Pay-as-you-go: $0.2/100K commands |
| **Status** | Optional - recommended for high traffic |
| **Notes** | Serverless Redis, works perfectly with Vercel |

---

## Domain & Infrastructure

### 15. Domain Registrar
| Field | Details |
|-------|---------|
| **Options** | Cloudflare, Namecheap, Google Domains |
| **Purpose** | Custom domain (e.g., edunode.io) |
| **Pricing** | ~$10-15/year |
| **Notes** | Configure DNS for Vercel, email verification |

### 16. GitHub (Source Control)
| Field | Details |
|-------|---------|
| **Service** | [GitHub](https://github.com) |
| **Purpose** | Source control, CI/CD, code review |
| **Pricing** | Free / Team: $4/user/mo / Enterprise: $21/user/mo |
| **Recommended** | **Team** for private repos + advanced features |

---

## Production Launch Checklist

### Phase 1: Core Services (Week 1)
- [ ] Create Vercel Pro account
- [ ] Set up production Supabase project
- [ ] Configure Google Cloud project + BigQuery
- [ ] Create production Clerk application

### Phase 2: Payments & Communication (Week 2)
- [ ] Set up Stripe account with products
- [ ] Configure Stripe webhook endpoint
- [ ] Set up Resend account + verify domain
- [ ] Test payment flow end-to-end

### Phase 3: Monitoring (Week 3)
- [ ] Set up Sentry project
- [ ] Configure PostHog
- [ ] Set up alerting rules
- [ ] Test error capture

### Phase 4: Optional Integrations (Week 4)
- [ ] Apply for Clever partnership (if needed)
- [ ] Apply for ClassLink partnership (if needed)
- [ ] Configure AI provider API keys
- [ ] Set up Redis caching (if needed)

---

## Cost Estimation by Scale

| Scale | MAU | Est. Monthly Cost |
|-------|-----|-------------------|
| **Startup** | < 1,000 | $95-150 |
| **Growth** | 1,000-10,000 | $200-400 |
| **Scale** | 10,000-50,000 | $500-1,500 |
| **Enterprise** | 50,000+ | Custom pricing |

### Startup Budget Breakdown
| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| BigQuery | ~$50 |
| Clerk | $0 (free tier) |
| Stripe | Usage-based |
| Resend | $0 (free tier) |
| Sentry | $0 (free tier) |
| PostHog | $0 (free tier) |
| **Total** | **~$95/mo** |

---

## Environment Variables Summary

```bash
# Required - Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxx
CLERK_SECRET_KEY=sk_live_xxxx

# Required - Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# Required - Data Warehouse
GOOGLE_CLOUD_PROJECT_ID=edunode-production
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
BIGQUERY_DATASET_PREFIX=edunode_

# Required - Payments
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx

# Required - Email
RESEND_API_KEY=re_xxxx
FROM_EMAIL=noreply@edunode.io

# Required - Security
ANONYMIZATION_SECRET=<openssl rand -hex 32>

# Recommended - Monitoring
SENTRY_DSN=https://xxxx@sentry.io/xxxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx

# Optional - SIS Integrations
CLEVER_CLIENT_ID=xxxx
CLEVER_CLIENT_SECRET=xxxx
CLASSLINK_CLIENT_ID=xxxx
CLASSLINK_CLIENT_SECRET=xxxx

# Optional - AI Providers
ANTHROPIC_API_KEY=sk-ant-xxxx
OPENAI_API_KEY=sk-xxxx
GOOGLE_AI_API_KEY=xxxx

# Optional - Caching
REDIS_URL=redis://xxxx
```

---

## Notes

1. **FERPA Compliance**: Ensure all services have BAA (Business Associate Agreement) or equivalent data processing agreements for handling student data.

2. **Self-Hosting Options**: PostHog and Sentry offer self-hosted options if data residency is a concern.

3. **Scaling**: Start with free tiers where available, upgrade as usage grows.

4. **AI Providers**: Only one AI provider is needed; multiple options provide redundancy.
