# Authorizer Requirements Gap Analysis
**Date:** May 2026  
**Purpose:** Map authorizer requirements to EduNode current capabilities

---

## Executive Summary

EduNode has a **solid foundation** for authorizer reporting but significant gaps in **financial data, compliance tracking, and multi-year historical analysis**. The current build addresses approximately **45% of core authorizer requirements**.

### Coverage Summary

| Category | Coverage | Priority |
|----------|----------|----------|
| Academic Performance | 🟢 70% | Enhance |
| Financial Health | 🔴 10% | **BUILD** |
| Organizational Compliance | 🟡 30% | BUILD |
| Governance | 🔴 5% | BUILD |
| Reporting Frequency | 🟡 40% | Enhance |
| Report Formats | 🟢 60% | Enhance |

---

## Part 1: Authorizer Requirements (Research Findings)

### What Authorizers Need - Summary

#### Academic Performance Metrics
| Metric | Frequency | Format |
|--------|-----------|--------|
| State assessment proficiency (ELA, Math, Science) | Annual | Tables, trends |
| Growth metrics (criterion & norm-referenced) | Annual | Charts |
| Subgroup performance (SPED, ELL, FRL, race) | Annual | Disaggregated |
| Graduation rates (4-year, 5-year) | Annual | Comparison |
| College enrollment/persistence | Annual | Percentages |
| Chronic absenteeism | Monthly/Annual | Thresholds |

#### Financial Health Indicators
| Metric | Formula | Threshold | Frequency |
|--------|---------|-----------|-----------|
| Current Ratio | Current Assets / Current Liabilities | ≥ 1.0 | Quarterly |
| Days Cash on Hand | Cash / (Expenses/365) | ≥ 60 days | Quarterly |
| Debt to Asset Ratio | Total Liabilities / Total Assets | < 0.9 | Annual |
| Debt Service Coverage | Net Operating Income / Debt Service | ≥ 1.1 | Annual |
| Total Margin | (Revenue - Expenses) / Revenue | Positive | Annual |
| Enrollment Variance | Actual ADM / Projected ADM | ±5% | Quarterly |

#### Compliance Items
- Health and safety certifications
- Background checks (all employees)
- Special education compliance (IDEA, 504)
- Teacher credentialing
- Student discipline data
- Facility requirements

#### Governance Documentation
- Board meeting minutes (monthly)
- Trustee financial disclosures (annual)
- Board member qualifications
- Conflict of interest policies
- Bylaws compliance

#### Reporting Frequencies
| Type | Frequency | Deadline Examples |
|------|-----------|-------------------|
| Audited Financials | Annual | Dec 31 (state), Jan 15 (authorizer) |
| Annual Report | Annual | Aug 1 |
| Interim Financials | Quarterly | 30 days after quarter |
| Enrollment Counts | Periodic | 40-day, 60-day, 120-day |
| Attendance | Monthly/6-week | 10 days after period |

#### Renewal Requirements
- **Historical data:** Full charter term (typically 5 years)
- **Minimum:** 2 years school-level data (California)
- **Page limits:** 45 pages max (New York)
- **Components:** Academic, financial, organizational, governance

---

## Part 2: Current EduNode Capabilities

### What We Have

| Feature | Location | Status |
|---------|----------|--------|
| Authorizer Portal UI | `src/app/[school_slug]/authorizer/page.tsx` | ✅ Complete |
| Renewal Radar Chart | Same file | ✅ Complete |
| KPI Cards (Growth, Ratio, Enrollment, Absence) | Same file | ✅ Complete |
| MTSS Evidence Section | `MTSSEvidenceMetrics` component | ✅ Complete |
| Intervention Outcomes | Authorizer page | ✅ Complete |
| Risk Distribution Trend | 12-week view | ✅ Complete |
| Compliance Checklist | UI only | 🟡 Partial |
| AI Charter Narrative | Gemini-powered | ✅ Complete |
| Print-to-PDF Export | Authorizer page | ✅ Complete |
| Export Evidence Pack | Authorizer page | ✅ Complete |
| Charter Renewal Report | `src/lib/reports/generator.ts` | ✅ Complete |
| Authorizer DB Table | `supabase/migrations/` | ✅ Complete |
| Authorizer Role Type | `src/lib/auth/types.ts` | ✅ Complete |

### What's Partially Built

| Feature | Current State | Gap |
|---------|---------------|-----|
| Read-Only Access | Permission types defined | No RLS enforcement |
| Multi-School Portfolio | Network View exists | Not authorizer-specific |
| Risk Scoring | Student-level | No school-level aggregation |
| Benchmarks | UI exists | No real data sources |
| Compliance Tracking | UI checklist | No data model |
| Fiscal Health | Mock random values | No real integration |

### What's Missing

| Feature | Importance | Complexity |
|---------|------------|------------|
| YoY Historical Trends | 🔴 Critical | Medium |
| Performance Framework Alignment | 🔴 Critical | High |
| Authorizer User Management | 🔴 Critical | Medium |
| Real Financial Integration | 🔴 Critical | High |
| Compliance Document Storage | 🟡 Important | Medium |
| Scheduled Report Delivery | 🟡 Important | Low |
| Authorizer Notifications | 🟡 Important | Low |
| Governance Tracking | 🟡 Important | Medium |
| Authorizer Portfolio Dashboard | 🔴 Critical | Medium |

---

## Part 3: Gap Analysis Matrix

### Academic Performance

| Authorizer Requirement | EduNode Status | Gap | Priority |
|------------------------|----------------|-----|----------|
| State assessment proficiency | 🟡 Have seed data, no real import | Need assessment data import | P1 |
| Growth metrics | ✅ Growth percentile in UI | Minor enhancement | P3 |
| Subgroup disaggregation | ✅ Equity analysis exists | Enhance for all subgroups | P2 |
| Graduation rates | ❌ Not tracked | Need high school metrics | P2 |
| College enrollment | ❌ Not tracked | Need postsecondary data | P3 |
| Chronic absenteeism | ✅ Core feature | Already strong | - |
| Year-over-year trends | ❌ No historical storage | **Critical gap** | P0 |

### Financial Health

| Authorizer Requirement | EduNode Status | Gap | Priority |
|------------------------|----------------|-----|----------|
| Current Ratio | ❌ Mock data only | Need accounting integration | P1 |
| Days Cash on Hand | ❌ Mock data only | Need real financial data | P1 |
| Debt to Asset Ratio | ❌ Not tracked | Need balance sheet data | P2 |
| Debt Service Coverage | ❌ Not tracked | Need loan data | P2 |
| Total Margin | ❌ Not tracked | Need P&L data | P1 |
| Enrollment Variance | 🟡 Have enrollment | Need budget projections | P2 |
| Audited financials upload | ❌ No document storage | Need file upload | P1 |

### Organizational Compliance

| Authorizer Requirement | EduNode Status | Gap | Priority |
|------------------------|----------------|-----|----------|
| Health/safety certs | 🟡 UI checklist only | Need data model + uploads | P1 |
| Background checks | ❌ Not tracked | Need HR integration or manual | P2 |
| SPED compliance | 🟡 IEP/504 flags on students | Need compliance tracking | P1 |
| Teacher credentialing | ❌ Not tracked | Need staff data model | P2 |
| Student discipline | ❌ Not tracked | Need behavior data | P2 |
| Facility compliance | 🟡 UI checklist only | Need data model | P2 |

### Governance

| Authorizer Requirement | EduNode Status | Gap | Priority |
|------------------------|----------------|-----|----------|
| Board meeting minutes | ❌ Not tracked | Need document storage | P2 |
| Financial disclosures | ❌ Not tracked | Need document storage | P2 |
| Board member tracking | ❌ Not tracked | Need governance data model | P2 |
| Conflict of interest | ❌ Not tracked | Need policy tracking | P3 |

### Reporting & Formats

| Authorizer Requirement | EduNode Status | Gap | Priority |
|------------------------|----------------|-----|----------|
| PDF reports | ✅ Print-to-PDF exists | Works | - |
| CSV/Excel export | ✅ Report generator | Works | - |
| Online dashboard | ✅ Authorizer portal | Works | - |
| State-specific templates | ❌ Generic only | Need template system | P1 |
| Scheduled delivery | ❌ Not implemented | Need email integration | P2 |
| Multi-year reports | ❌ No historical data | **Critical gap** | P0 |

### Access & Portfolio

| Authorizer Requirement | EduNode Status | Gap | Priority |
|------------------------|----------------|-----|----------|
| Read-only authorizer access | 🟡 Types defined | Need RLS + UI | P0 |
| Multi-school portfolio view | 🟡 Network View | Need authorizer-specific | P0 |
| Authorizer user management | ❌ Not implemented | Need invitation flow | P1 |
| Authorizer notifications | ❌ Not implemented | Need alert system | P2 |

---

## Part 4: Prioritized Build List

### P0 - Critical (Must Have for MVP)

| Feature | Effort | Impact | Description |
|---------|--------|--------|-------------|
| **Historical Data Storage** | 2 weeks | 🔴 Critical | Store YoY metrics for multi-year trends |
| **Authorizer Portfolio Dashboard** | 2 weeks | 🔴 Critical | Single view of all authorized schools |
| **Authorizer User Management** | 1 week | 🔴 Critical | Invite authorizer users with read-only access |
| **RLS for Authorizer Role** | 3 days | 🔴 Critical | Database-level access control |

**Total P0 Effort: ~5-6 weeks**

### P1 - Important (Core Value Prop)

| Feature | Effort | Impact | Description |
|---------|--------|--------|-------------|
| **Financial Data Model** | 2 weeks | 🔴 High | Tables for ratios, metrics, manual entry |
| **Compliance Data Model** | 1 week | 🔴 High | Track compliance items with status/dates |
| **Document Upload/Storage** | 1 week | 🟡 High | Upload audits, certs, board minutes |
| **State-Specific Templates** | 2 weeks | 🟡 High | NACSA, DC, NY, IN, CA templates |
| **Assessment Data Import** | 2 weeks | 🟡 High | Import state assessment results |

**Total P1 Effort: ~8-10 weeks**

### P2 - Nice to Have (Competitive Advantage)

| Feature | Effort | Impact | Description |
|---------|--------|--------|-------------|
| Scheduled Report Delivery | 3 days | 🟡 Medium | Email reports on schedule |
| Authorizer Notifications | 1 week | 🟡 Medium | Alert on thresholds |
| Governance Tracking | 1 week | 🟡 Medium | Board members, meetings |
| High School Metrics | 1 week | 🟡 Medium | Graduation, college rates |
| Staff/HR Data Model | 2 weeks | 🟡 Medium | Teacher credentialing |

**Total P2 Effort: ~6-7 weeks**

### P3 - Future

| Feature | Notes |
|---------|-------|
| Accounting System Integration | QuickBooks, Sage, etc. |
| Real-time State Data Feeds | API integration with DOEs |
| AI-Powered Renewal Prediction | Predict renewal outcome |
| Benchmark Data Partnerships | External benchmark sources |

---

## Part 5: Recommended MVP Scope

### Authorizer Portal MVP (8 weeks)

**Week 1-2: Foundation**
- [ ] Historical metrics storage (migration + model)
- [ ] Authorizer user invitation flow
- [ ] RLS policies for authorizer role

**Week 3-4: Portfolio View**
- [ ] Authorizer dashboard showing all their schools
- [ ] Portfolio-level KPIs (aggregate metrics)
- [ ] School comparison table
- [ ] Risk flags across portfolio

**Week 5-6: Compliance & Documents**
- [ ] Compliance data model
- [ ] Document upload (Supabase Storage)
- [ ] Compliance status tracking
- [ ] Financial metrics entry (manual)

**Week 7-8: Templates & Polish**
- [ ] NACSA framework alignment
- [ ] State-specific report templates (DC, NY, IN)
- [ ] Multi-year trend charts
- [ ] Scheduled report delivery (email)

### Success Criteria

| Metric | Target |
|--------|--------|
| Authorizer requirements coverage | 75%+ |
| Time to generate renewal report | < 5 minutes |
| Historical data depth | 5 years |
| State templates available | 5+ |

---

## Part 6: Database Schema Additions

### New Tables Required

```sql
-- Historical metrics snapshots (for YoY trends)
CREATE TABLE school_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  metric_date DATE NOT NULL,
  school_year TEXT NOT NULL, -- '2023-24'
  
  -- Academic
  ela_proficiency DECIMAL,
  math_proficiency DECIMAL,
  science_proficiency DECIMAL,
  ela_growth_percentile DECIMAL,
  math_growth_percentile DECIMAL,
  graduation_rate_4yr DECIMAL,
  graduation_rate_5yr DECIMAL,
  chronic_absence_rate DECIMAL,
  
  -- Enrollment
  total_enrollment INT,
  projected_enrollment INT,
  
  -- Subgroups (JSONB for flexibility)
  subgroup_metrics JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial health tracking
CREATE TABLE school_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  fiscal_year TEXT NOT NULL, -- '2023-24'
  report_type TEXT NOT NULL, -- 'annual', 'quarterly'
  report_date DATE NOT NULL,
  
  -- Near-term health
  current_ratio DECIMAL,
  days_cash_on_hand INT,
  
  -- Long-term stability
  debt_to_asset_ratio DECIMAL,
  debt_service_coverage DECIMAL,
  total_margin DECIMAL,
  
  -- Enrollment variance
  actual_adm INT,
  projected_adm INT,
  
  -- Source document
  audit_document_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance tracking
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  category TEXT NOT NULL, -- 'health_safety', 'special_ed', 'governance', etc.
  item_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'compliant', 'non_compliant', 'pending', 'expired'
  due_date DATE,
  completed_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authorizer memberships (link users to authorizers)
CREATE TABLE authorizer_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  authorizer_id UUID REFERENCES authorizers(id),
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'viewer'
  is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  UNIQUE(authorizer_id, user_id)
);

-- Board/governance tracking
CREATE TABLE board_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  name TEXT NOT NULL,
  role TEXT, -- 'chair', 'treasurer', 'secretary', 'member'
  term_start DATE,
  term_end DATE,
  is_active BOOLEAN DEFAULT true,
  disclosure_on_file BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Conclusion

EduNode has a **strong starting point** with the existing authorizer portal UI, but needs critical infrastructure for:

1. **Historical data** - Authorizers need 3-5 year trends
2. **Financial metrics** - Currently mock data
3. **Portfolio access** - Authorizers oversee multiple schools
4. **Compliance tracking** - Currently UI-only

The **8-week MVP** would bring coverage from ~45% to ~75% of authorizer requirements, making EduNode competitive with Epicenter while offering superior analytics.

---

*Analysis based on NACSA standards, DC PCSB, SUNY, ICSB, and California requirements*
