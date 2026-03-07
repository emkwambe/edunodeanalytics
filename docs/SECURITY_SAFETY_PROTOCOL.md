# EduNode Analytics - Security and Safety Protocol

> **Document Version:** 1.0
> **Last Updated:** March 2026
> **Classification:** Internal / External Distribution Approved

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Security](#2-data-security)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Infrastructure Security](#4-infrastructure-security)
5. [Application Security](#5-application-security)
6. [Student Data Privacy (FERPA/COPPA)](#6-student-data-privacy-ferpacoppa)
7. [Incident Response](#7-incident-response)
8. [Development Security Practices](#8-development-security-practices)
9. [Local Build Security Configuration](#9-local-build-security-configuration)
10. [Environment Variables Security](#10-environment-variables-security)
11. [API Security](#11-api-security)
12. [Database Security](#12-database-security)
13. [Audit & Compliance](#13-audit--compliance)

---

## 1. Overview

EduNode Analytics is committed to maintaining the highest standards of security and data protection. This document outlines the security protocols, safety measures, and compliance requirements for both cloud-hosted and local deployments.

### 1.1 Security Principles

- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Minimal access rights for users and systems
- **Zero Trust**: Verify every access request as if it originates from an untrusted network
- **Data Minimization**: Only collect and retain necessary data
- **Encryption Everywhere**: Encrypt data at rest and in transit

---

## 2. Data Security

### 2.1 Encryption Standards

| Data State | Encryption Method | Key Management |
|------------|-------------------|----------------|
| At Rest | AES-256-GCM | HSM / AWS KMS |
| In Transit | TLS 1.3 | Auto-rotation |
| Backups | AES-256 | Separate key hierarchy |

### 2.2 Data Classification

| Classification | Description | Examples |
|----------------|-------------|----------|
| **Critical** | Student PII, authentication credentials | Names, SSNs, passwords |
| **Sensitive** | Academic records, behavioral data | Grades, attendance, IEP flags |
| **Internal** | System configuration, analytics | Metrics, feature flags |
| **Public** | Marketing content, documentation | Help articles, pricing |

### 2.3 Data Retention Policy

```
Student Academic Data: Retained for current school year + 7 years
Student PII: Retained until graduation + 5 years or per DPA
Session Logs: 90 days
Audit Logs: 7 years
Analytics Data: Aggregated after 2 years
```

### 2.4 Data Disposal

- Secure deletion using DoD 5220.22-M standard
- Certificate of destruction available on request
- Database records: Cryptographic shredding

---

## 3. Authentication & Authorization

### 3.1 Authentication Requirements

```typescript
// Required authentication configuration
const authConfig = {
  provider: 'Clerk',
  sessionTimeout: 8 * 60 * 60, // 8 hours
  mfaRequired: {
    admin: true,
    schoolAdmin: true,
    teacher: false,
  },
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 12,
  },
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60, // 15 minutes
  },
};
```

### 3.2 Role-Based Access Control (RBAC)

| Role | Dashboard Access | Student Data | Admin Functions | Billing |
|------|------------------|--------------|-----------------|---------|
| Super Admin | Full | Full | Full | Full |
| School Admin | Full | Full | School-level | View |
| Data Manager | Full | Full | None | None |
| Teacher | Assigned | Assigned students | None | None |
| Read-Only | View | View assigned | None | None |

### 3.3 SSO Configuration

Supported identity providers:
- SAML 2.0 (Okta, Azure AD, OneLogin)
- OIDC (Google Workspace, Clever)
- LDAP integration (on-premise)

```yaml
# Example SSO configuration
sso:
  enabled: true
  providers:
    - type: saml
      entityId: "https://sso.school.edu"
      ssoUrl: "https://sso.school.edu/saml/login"
      certificate: "${SSO_CERTIFICATE}"
      attributeMapping:
        email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        firstName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
        lastName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
```

---

## 4. Infrastructure Security

### 4.1 Network Security

```
Architecture:
- WAF (Web Application Firewall) at edge
- DDoS protection via Cloudflare/AWS Shield
- VPC isolation for all services
- Private subnets for databases
- Egress filtering for outbound traffic
```

### 4.2 Server Hardening

```bash
# Required server configurations
- Disable root SSH access
- SSH key-only authentication
- Automatic security updates enabled
- Unnecessary services disabled
- Host-based firewall (iptables/nftables)
- SELinux/AppArmor enabled
```

### 4.3 Container Security

```dockerfile
# Dockerfile security requirements
FROM node:20-alpine AS base

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Security headers
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Drop capabilities
USER nextjs
```

---

## 5. Application Security

### 5.1 Security Headers

```typescript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.accounts.dev;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self';
      connect-src 'self' https://api.clerk.dev https://*.supabase.co wss://*.supabase.co;
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
    `.replace(/\n/g, ' '),
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];
```

### 5.2 Input Validation

```typescript
// All user input must be validated using Zod
import { z } from 'zod';

const studentSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  lastName: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  email: z.string().email().optional(),
  gradeLevel: z.number().int().min(0).max(12),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Sanitize HTML content
import DOMPurify from 'isomorphic-dompurify';
const sanitizedContent = DOMPurify.sanitize(userInput);
```

### 5.3 SQL Injection Prevention

```typescript
// Always use parameterized queries
// NEVER concatenate user input into queries

// Correct - using Supabase client
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('school_id', schoolId)
  .eq('id', studentId);

// NEVER do this:
// const query = `SELECT * FROM students WHERE id = '${studentId}'`;
```

### 5.4 CSRF Protection

```typescript
// CSRF tokens are required for all state-changing operations
// Clerk handles CSRF automatically for authenticated requests

// For custom forms, implement CSRF tokens:
import { generateCsrfToken, verifyCsrfToken } from '@/lib/security/csrf';

// In form component
<input type="hidden" name="csrf_token" value={csrfToken} />

// In API route
if (!verifyCsrfToken(request.headers.get('x-csrf-token'))) {
  return new Response('Invalid CSRF token', { status: 403 });
}
```

---

## 6. Student Data Privacy (FERPA/COPPA)

### 6.1 FERPA Compliance Checklist

- [ ] Annual FERPA notification to parents
- [ ] Directory information opt-out mechanism
- [ ] Audit trail for all data access
- [ ] Data Processing Agreement (DPA) signed
- [ ] Staff training documentation
- [ ] Data retention schedule documented
- [ ] Parent access portal available
- [ ] Right to request amendment process

### 6.2 Data Access Logging

```typescript
// All student data access must be logged
interface AuditLog {
  timestamp: string;
  userId: string;
  userEmail: string;
  action: 'view' | 'export' | 'modify' | 'delete';
  resourceType: 'student' | 'assessment' | 'attendance' | 'report';
  resourceId: string;
  schoolId: string;
  ipAddress: string;
  userAgent: string;
  requestPath: string;
  accessReason?: string;
}

// Log all data access
await logDataAccess({
  action: 'view',
  resourceType: 'student',
  resourceId: studentId,
  accessReason: 'Teacher viewing student dashboard',
});
```

### 6.3 Parent/Guardian Access

Parents have the right to:
- View all records about their child
- Request amendment of incorrect data
- Consent to disclosure (with exceptions)
- File complaints with the Department of Education

### 6.4 Data Sharing Restrictions

```
NEVER share student data:
- With third parties without school authorization
- For advertising or marketing purposes
- Beyond the contracted purpose
- Without appropriate DPA in place

ALWAYS:
- Verify requestor identity before disclosure
- Document all data sharing requests
- Notify school of government requests
- Encrypt data in transit
```

---

## 7. Incident Response

### 7.1 Incident Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| P1 Critical | Service down, data breach | 15 minutes | Unauthorized access, data exfiltration |
| P2 High | Partial outage, security vulnerability | 1 hour | Authentication issues, XSS found |
| P3 Medium | Degraded performance | 4 hours | Slow queries, minor bugs |
| P4 Low | Cosmetic issues | 24 hours | UI bugs, documentation errors |

### 7.2 Breach Response Procedure

```
1. CONTAIN (0-15 minutes)
   - Isolate affected systems
   - Revoke compromised credentials
   - Enable enhanced logging

2. ASSESS (15-60 minutes)
   - Determine scope of breach
   - Identify affected data/users
   - Preserve evidence

3. NOTIFY (Within 24 hours)
   - Notify affected schools
   - Contact legal counsel
   - Prepare regulatory notifications

4. REMEDIATE (24-72 hours)
   - Patch vulnerabilities
   - Reset affected accounts
   - Implement additional controls

5. DOCUMENT (Ongoing)
   - Complete incident report
   - Update security procedures
   - Conduct lessons learned
```

### 7.3 Contact Information

```
Security Team: security@edunode.io
Emergency Hotline: +1-888-EDU-NODE (option 9)
Data Protection Officer: dpo@edunode.io
```

---

## 8. Development Security Practices

### 8.1 Secure Development Lifecycle

```
1. Requirements Phase
   - Security requirements documented
   - Threat modeling for new features
   - Privacy impact assessment

2. Design Phase
   - Security architecture review
   - Data flow diagrams
   - Access control design

3. Implementation Phase
   - Secure coding guidelines followed
   - Code review required
   - Static analysis (ESLint security plugins)

4. Testing Phase
   - SAST (Static Application Security Testing)
   - DAST (Dynamic Application Security Testing)
   - Penetration testing (annual)

5. Deployment Phase
   - Security checklist verification
   - Configuration review
   - Secrets management validation
```

### 8.2 Dependency Management

```bash
# Regular security audits
npm audit --audit-level=high

# Automated dependency updates
# Dependabot or Renovate configured

# Lock file integrity
npm ci --ignore-scripts
```

### 8.3 Code Review Requirements

All code changes require:
- Security-focused code review
- No hardcoded credentials
- Input validation for all user data
- Parameterized queries only
- Proper error handling (no stack traces in production)

---

## 9. Local Build Security Configuration

### 9.1 Required Environment Setup

```bash
# 1. Clone repository
git clone <repository-url>

# 2. Install dependencies (audit for vulnerabilities)
npm ci
npm audit

# 3. Copy environment template
cp .env.example .env.local

# 4. Generate secure secrets
openssl rand -base64 32 > .secrets/jwt_secret
openssl rand -base64 32 > .secrets/encryption_key

# 5. Configure SSL for local development
mkcert localhost 127.0.0.1 ::1
```

### 9.2 Local HTTPS Configuration

```javascript
// next.config.js
const https = require('https');
const fs = require('fs');

module.exports = {
  serverOptions: {
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost.pem'),
  },
};
```

### 9.3 Docker Security Configuration

```dockerfile
# Dockerfile.local
FROM node:20-alpine

# Security: Run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Security: Read-only filesystem where possible
WORKDIR /app
COPY --chown=nextjs:nodejs . .

USER nextjs

# Security: Limit exposed ports
EXPOSE 3000

# Security: Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### 9.4 Docker Compose Security

```yaml
# docker-compose.local.yml
version: '3.8'
services:
  app:
    build: .
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    environment:
      - NODE_ENV=production
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    security_opt:
      - no-new-privileges:true
    volumes:
      - db-data:/var/lib/postgresql/data:rw
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
    internal: true

secrets:
  db_password:
    file: ./.secrets/db_password
```

---

## 10. Environment Variables Security

### 10.1 Required Environment Variables

```bash
# .env.local - NEVER commit this file

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Encryption
ENCRYPTION_KEY=<32-byte-base64-encoded-key>
JWT_SECRET=<32-byte-base64-encoded-key>

# Payments (Stripe) - Optional
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Feature Flags
ENABLE_DEBUG_MODE=false
ENABLE_MOCK_DATA=false
```

### 10.2 Secrets Management Best Practices

```
DO:
- Use environment variables for all secrets
- Rotate secrets regularly (90 days)
- Use different secrets per environment
- Encrypt secrets at rest
- Audit secret access

DON'T:
- Commit secrets to version control
- Log secrets or tokens
- Share secrets via email/chat
- Use the same secret across environments
- Store secrets in plaintext files
```

### 10.3 Secret Rotation Script

```bash
#!/bin/bash
# rotate-secrets.sh

echo "Generating new encryption key..."
NEW_KEY=$(openssl rand -base64 32)
echo "ENCRYPTION_KEY=$NEW_KEY" >> .env.new

echo "Generating new JWT secret..."
NEW_JWT=$(openssl rand -base64 32)
echo "JWT_SECRET=$NEW_JWT" >> .env.new

echo "Secrets rotated. Update deployment configuration."
echo "Remember to:"
echo "1. Update production environment"
echo "2. Invalidate existing sessions"
echo "3. Re-encrypt stored data with new key"
```

---

## 11. API Security

### 11.1 Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }
}
```

### 11.2 API Authentication

```typescript
// All API routes must verify authentication
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId, orgId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify user has access to requested resource
  const hasAccess = await verifyAccess(userId, orgId, resourceId);
  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 });
  }

  // Process request...
}
```

### 11.3 API Response Security

```typescript
// Never expose internal errors
try {
  const result = await processRequest();
  return Response.json(result);
} catch (error) {
  // Log full error internally
  console.error('API Error:', error);

  // Return sanitized error to client
  return Response.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

---

## 12. Database Security

### 12.1 Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see students in their school
CREATE POLICY "school_isolation" ON students
  FOR ALL
  USING (school_id IN (
    SELECT school_id FROM user_school_memberships
    WHERE user_id = auth.uid()
  ));

-- Policy: Teachers can only see assigned students
CREATE POLICY "teacher_student_access" ON students
  FOR SELECT
  USING (
    id IN (
      SELECT student_id FROM teacher_student_assignments
      WHERE teacher_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'data_manager')
    )
  );
```

### 12.2 Database Connection Security

```typescript
// Use connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Always use SSL for database connections
// Supabase enforces SSL by default
```

### 12.3 Backup Security

```
Backup Encryption: AES-256
Backup Frequency: Daily
Retention Period: 30 days
Geographic Redundancy: Cross-region
Access: Separate credentials required
Testing: Monthly restore tests
```

---

## 13. Audit & Compliance

### 13.1 Compliance Certifications

| Certification | Status | Last Audit | Next Audit |
|---------------|--------|------------|------------|
| SOC 2 Type II | Active | Jan 2026 | Jan 2027 |
| FERPA | Compliant | Ongoing | Ongoing |
| COPPA | Compliant | Ongoing | Ongoing |
| Student Privacy Pledge | Signed | 2025 | N/A |

### 13.2 Audit Log Requirements

All audit logs must include:
- Timestamp (UTC)
- User identifier
- Action performed
- Resource affected
- Source IP address
- Success/failure status
- Request correlation ID

### 13.3 Compliance Reporting

```sql
-- Generate access report for a student
SELECT
  al.timestamp,
  al.user_email,
  al.action,
  al.resource_type,
  al.ip_address
FROM audit_logs al
WHERE al.resource_id = :student_id
  AND al.resource_type = 'student'
ORDER BY al.timestamp DESC;

-- Generate data export for FERPA request
SELECT
  s.*,
  (SELECT json_agg(a.*) FROM assessments a WHERE a.student_id = s.id) as assessments,
  (SELECT json_agg(att.*) FROM attendance att WHERE att.student_id = s.id) as attendance
FROM students s
WHERE s.id = :student_id;
```

### 13.4 Security Review Schedule

| Review Type | Frequency | Last Completed | Responsible |
|-------------|-----------|----------------|-------------|
| Penetration Test | Annual | Dec 2025 | External Vendor |
| Code Review | Continuous | Daily | Development Team |
| Access Review | Quarterly | Feb 2026 | Security Team |
| Vulnerability Scan | Weekly | Automated | Security Team |
| Compliance Audit | Annual | Jan 2026 | External Auditor |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 2026 | Security Team | Initial release |

---

## Acknowledgment

By deploying EduNode Analytics, you acknowledge that you have read, understood, and agree to implement these security protocols. For questions or clarifications, contact security@edunode.io.
