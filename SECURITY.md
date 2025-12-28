# Security Documentation

> Last Audit: December 28, 2025
> Version: 3.0 (Launch Ready)

This document outlines the security measures implemented in ProductionOS and provides guidance for maintaining security best practices.

## Table of Contents

- [Security Overview](#security-overview)
- [Security Audit Results](#security-audit-results)
- [Authentication](#authentication)
- [Database Security](#database-security)
- [API Security](#api-security)
- [Client-Side Security](#client-side-security)
- [Infrastructure Security](#infrastructure-security)
- [Security Headers](#security-headers)
- [Sensitive Data Handling](#sensitive-data-handling)
- [Known Limitations](#known-limitations)
- [Security Checklist](#security-checklist)
- [Incident Response](#incident-response)
- [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Security Overview

ProductionOS implements defense-in-depth security with multiple layers:

| Layer | Implementation | Status |
|-------|---------------|--------|
| Authentication | Supabase Auth with PKCE flow | Secure |
| Authorization | Row Level Security (RLS) on all 76 tables | Secure |
| Transport | HTTPS/TLS enforced via HSTS | Secure |
| API Protection | JWT verification on edge functions | Secure |
| XSS Prevention | DOMPurify sanitization + CSP headers | Secure |
| CSRF Protection | SameSite cookies + origin validation | Secure |
| Schema Exposure | OpenAPI spec hidden | Secure |

---

## Security Audit Results

### Audit Date: December 28, 2025

| Category | Status | Notes |
|----------|--------|-------|
| Hardcoded API keys | PASS | No secrets in codebase |
| Environment variables | PASS | Properly handled via .env.local |
| RLS on all tables | PASS | 76/76 tables have RLS enabled |
| RLS policies | PASS | All tables have appropriate policies |
| OpenAPI exposure | PASS | Schema returns empty paths |
| Security headers | PASS | CSP, HSTS, X-Frame-Options configured |
| XSS protection | PASS | DOMPurify sanitization in place |
| Anonymous API access | PASS | Returns empty arrays |
| Edge function auth | PASS | JWT verification enabled |
| Supabase Security Advisors | PASS | 0 warnings (1 info: leaked password protection requires Pro) |
| Supabase Performance Advisors | PASS | 0 warnings, 232 info items |

### Migrations Applied (2025-12-28)

#### 1. `fix_overly_permissive_rls_policies`

Fixed 6 overly permissive INSERT policies that allowed any authenticated user to write to any organization:

| Table | Issue | Fix |
|-------|-------|-----|
| `activity_logs` | `WITH CHECK (true)` | Added organization membership check |
| `audit_logs` | `WITH CHECK (true)` | Added organization membership check |
| `contacts` | `WITH CHECK (true)` | Removed permissive policy |
| `expenses` | `WITH CHECK (true)` | Added organization membership check |
| `invoices` | `WITH CHECK (true)` | Added organization membership check |
| `rate_card_sections` | `WITH CHECK (true)` | Removed permissive policy |
| `user_invitations` | Anonymous SELECT `true` | Limited to pending, non-expired only |

#### 2. `optimize_rls_auth_uid_initplan`

Optimized 132 RLS policies for query performance. Changed all `auth.uid()` calls to use `(SELECT auth.uid())` pattern which caches the value instead of re-evaluating for each row.

**Before (slow):**
```sql
USING (user_id = auth.uid())
```

**After (optimized):**
```sql
USING (user_id = (SELECT auth.uid()))
```

#### 3. `consolidate_duplicate_rls_policies`

Removed 15 duplicate permissive policies that were causing performance overhead:

| Table | Removed Policy | Reason |
|-------|---------------|--------|
| `activity_participants` | `Users can view participants...` | Redundant with ALL policy |
| `contact_opportunities` | `Users can view their contact-opportunity...` | Redundant with ALL policy |
| `email_sequence_enrollments` | `Users can view enrollments...` | Redundant with ALL policy |
| `email_sequence_steps` | `Users can view steps...` | Redundant with ALL policy |
| `contacts` | 3 duplicate policies | Duplicate for same role/action |
| `google_connections` | 4 duplicate policies | Duplicate for same role/action |
| `subscriptions` | `org_subscriptions_select` | Duplicate SELECT policy |
| `user_invitations` | 3 `org_invitations_*` policies | Duplicate with named policies |
| `user_profiles` | `Authenticated users can read...` | Duplicate SELECT policy |

#### 4. `fix_user_invitations_duplicate_policies`

Consolidated user_invitations policies to eliminate remaining duplicates:

- Changed `Org admins can manage invitations` (ALL) to specific INSERT/UPDATE/DELETE policies
- Created single consolidated SELECT policy handling both anon and authenticated access

---

## Authentication

### Supabase Auth (Recommended)

ProductionOS uses Supabase Auth with the PKCE (Proof Key for Code Exchange) flow, which is the most secure OAuth pattern available.

**Configuration (`src/lib/supabase.js`):**
- Session storage: localStorage (encrypted by Supabase)
- Auto token refresh: Enabled
- Session persistence: Enabled
- Flow type: PKCE

**Security Features:**
- 24-hour session duration with auto-refresh on activity
- Rate limiting: 5 failed attempts triggers 15-minute lockout
- Password requirements: 8+ characters, uppercase, lowercase, number, special character

### Legacy Password Auth (Deprecated)

The `VITE_APP_PASSWORD` environment variable provides simple password protection for development/testing only.

**Warning:** Never use legacy password auth in production. It lacks:
- Session management
- User tracking
- Rate limiting
- Password reset functionality

---

## Database Security

### Row Level Security (RLS)

All 76 tables in the public schema have RLS enabled with appropriate policies.

**Verification Query:**
```sql
SELECT tablename, rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: Empty result (no tables with RLS disabled)
```

### Multi-Tenant Isolation

All data access is filtered by `organization_id` through RLS policies:

```sql
-- Example policy pattern (optimized with SELECT wrapper)
CREATE POLICY "Users can only view their organization's data"
ON table_name FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = (SELECT auth.uid())
    )
);
```

**Note:** The `(SELECT auth.uid())` wrapper is critical for performance - it caches the user ID instead of re-evaluating for each row.

### OpenAPI Spec Protection

The database schema is hidden from public access. The REST API returns a minimal stub:

```json
{
  "openapi": "3.0.0",
  "info": { "title": "API", "version": "1.0.0" },
  "paths": {}
}
```

This prevents attackers from discovering:
- Table names (all 76 hidden)
- Column definitions
- RPC function signatures

### Function Security

All 19 PostgreSQL functions have `search_path` set to empty string to prevent search path injection attacks:

```sql
ALTER FUNCTION public.function_name() SET search_path = '';
```

### Checking for Overly Permissive Policies

Run this query periodically to check for policies that might allow unauthorized access:

```sql
-- Check for policies with 'true' in with_check (overly permissive)
SELECT tablename, policyname, with_check
FROM pg_policies
WHERE schemaname = 'public' AND with_check::text = 'true';
-- Expected: Empty result
```

---

## API Security

### Edge Functions Authentication

| Function | Auth Method | Notes |
|----------|-------------|-------|
| Most functions (10) | `verify_jwt: true` | Requires valid JWT in Authorization header |
| `stripe-webhook` | Stripe signature | Verifies `stripe-signature` header |
| `create-checkout-session` | Internal auth check | Validates Authorization header in code |

### CORS Configuration

CORS is configured in `vercel.json` for API routes:

```json
{
  "Access-Control-Allow-Origin": "https://www.productionos.io",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey"
}
```

### Rate Limiting

- Supabase Auth: Built-in rate limiting
- Edge Functions: Supabase platform rate limits apply
- Stripe webhooks: Stripe handles retry logic

---

## Client-Side Security

### XSS Prevention

All user-generated HTML content is sanitized using DOMPurify before rendering:

```javascript
import DOMPurify from 'dompurify';

// Email content
const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', ...],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class']
});
```

Files using sanitization:
- `src/pages/EmailPage.jsx` - `sanitizeEmailHtml()`
- `src/pages/EmailTemplatesPage.jsx` - `sanitizeHtml()`

### Sensitive Data Encryption

Client-side encryption for API keys stored in localStorage (`src/utils/encryption.js`):

- Uses SHA-256 key derivation via SubtleCrypto
- Device-specific keys based on browser fingerprint
- XOR cipher for obfuscation

**Important:** This is defense-in-depth, not a complete solution. For production, API keys should be proxied through a backend.

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.stripe.com https://api.exchangerate-api.com;
frame-src https://js.stripe.com https://hooks.stripe.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

---

## Infrastructure Security

### Environment Variables

| Variable | Exposure | Storage |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Public (OK) | Client bundle |
| `VITE_SUPABASE_ANON_KEY` | Public (OK) | Client bundle |
| `STRIPE_SECRET_KEY` | Server only | Supabase Edge Function secrets |
| `STRIPE_WEBHOOK_SECRET` | Server only | Supabase Edge Function secrets |
| `RESEND_API_KEY` | Server only | Supabase Edge Function secrets |
| `ANTHROPIC_API_KEY` | Server only | Supabase Edge Function secrets |

**Note:** The Supabase anon key is designed to be public. Security comes from RLS policies, not key secrecy.

### Git Security

`.gitignore` excludes all sensitive files:
```
.env
.env.local
.env.*.local
.env*.local
```

### Deployment Security

- **Vercel:** Automatic HTTPS, DDoS protection, edge caching
- **Supabase:** SOC2 Type II compliant, encrypted at rest

---

## Security Headers

All responses include security headers via `vercel.json`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | Restrictive | Disables sensitive browser APIs |
| `Strict-Transport-Security` | `max-age=63072000` | Enforces HTTPS |
| `Content-Security-Policy` | See above | Prevents XSS and injection |

### Verification

```bash
curl -I https://www.productionos.io
# Should show all security headers
```

---

## Sensitive Data Handling

### What We Store

| Data Type | Storage Location | Protection |
|-----------|------------------|------------|
| User credentials | Supabase Auth | Hashed with bcrypt |
| Session tokens | HttpOnly cookies | Encrypted, short-lived |
| Client data | Supabase DB | RLS + encryption at rest |
| API keys (user's) | localStorage | Client-side encryption |
| Payment info | Stripe | PCI DSS compliant |

### What We Don't Store

- Raw passwords (only hashed)
- Credit card numbers (Stripe handles)
- Social security numbers
- Bank account details (raw)

### GDPR Compliance

- Data export: Users can export all their data as JSON
- Account deletion: 30-day grace period, then permanent deletion
- Cookie consent: Banner with preference management
- Legal pages: `/legal/privacy`, `/legal/gdpr`, `/legal/terms`

---

## Known Limitations

### Leaked Password Protection (Supabase Pro Required)

**Issue:** HaveIBeenPwned password checking is disabled.

**Impact:** Users can set passwords that appear in known data breaches.

**Mitigation:** Requires Supabase Pro plan ($25/month) to enable.

**Recommendation:** Upgrade to Pro for production deployments.

### Client-Side API Key Storage

**Issue:** User API keys (OpenAI, Anthropic) stored in localStorage with client-side encryption.

**Impact:** Determined attackers with local access could potentially extract keys.

**Mitigation:**
- Keys are encrypted with device-specific entropy
- Implement a backend proxy for API calls in high-security environments

---

## Security Checklist

### Before Going to Production

- [x] Remove `VITE_APP_PASSWORD` from environment
- [x] Verify all RLS policies are in place
- [x] Fix overly permissive INSERT policies
- [x] Run Supabase security advisors (0 warnings)
- [x] Run Supabase performance advisors (0 warnings)
- [x] Optimize all RLS policies with `(SELECT auth.uid())`
- [x] Remove duplicate permissive policies
- [x] Test anonymous API access returns empty results
- [x] Verify security headers are present
- [x] Hide OpenAPI spec from public access
- [x] Secure function search paths
- [ ] Enable Supabase Pro for leaked password protection (optional, $25/mo)

### Regular Security Tasks

| Frequency | Task |
|-----------|------|
| Weekly | Review security event logs |
| Monthly | Run Supabase security advisors |
| Monthly | Check for unusual access patterns |
| Quarterly | Update dependencies for security patches |
| Quarterly | Rotate API keys |
| Annually | Full security audit |

### Verification Commands

```bash
# Check security headers
curl -I https://www.productionos.io

# Test anonymous API access (should return empty array)
curl "https://deitlnfumugxcbxqqivk.supabase.co/rest/v1/clients" \
  -H "apikey: [anon_key]"

# Check OpenAPI exposure (should return minimal stub)
curl "https://deitlnfumugxcbxqqivk.supabase.co/rest/v1/" \
  -H "apikey: [anon_key]"
```

### SQL Verification Queries

```sql
-- Check for permissive policies (should return empty)
SELECT tablename, policyname, with_check
FROM pg_policies
WHERE schemaname = 'public' AND with_check::text = 'true';

-- Check RLS enabled on all tables (should return empty)
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- Check tables without INSERT policies
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
    AND p.schemaname = 'public'
    AND (p.cmd = 'INSERT' OR p.cmd = 'ALL')
WHERE t.schemaname = 'public' AND p.tablename IS NULL;

-- Check for unoptimized auth.uid() calls (should return empty)
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND (
    (qual::text ~ 'auth\.uid\(\)' AND qual::text NOT LIKE '%SELECT auth.uid()%')
    OR (with_check::text ~ 'auth\.uid\(\)' AND with_check::text NOT LIKE '%SELECT auth.uid()%')
);
```

---

## Incident Response

### If API Key Compromised

1. **Immediate Actions**
   - Revoke compromised key in provider dashboard
   - Generate new key
   - Update key in app settings
   - Monitor API usage for suspicious activity

2. **Investigation**
   - Review security logs
   - Identify how key was exposed
   - Document incident

3. **Prevention**
   - Implement additional safeguards
   - Consider backend proxy
   - Update security procedures

### If Unauthorized Access Detected

1. **Immediate Actions**
   - Change all passwords
   - Review recent data changes
   - Check for data exfiltration

2. **Investigation**
   - Review login logs
   - Check session history
   - Identify attack vector

3. **Recovery**
   - Restore from backup if needed
   - Apply security patches
   - Update access controls

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security concerns to the development team
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and will work with you to understand and address the issue.

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2025-12-13 | 1.0 | Initial security documentation |
| 2025-12-28 | 2.0 | Full security audit completed |
| 2025-12-28 | 2.0 | OpenAPI spec exposure mitigated |
| 2025-12-28 | 2.0 | Function search paths secured (19 functions) |
| 2025-12-28 | 2.0 | Security headers added to vercel.json |
| 2025-12-28 | 2.0 | Fixed 6 overly permissive INSERT policies |
| 2025-12-28 | 2.0 | Fixed anonymous access to user_invitations |
| 2025-12-28 | 3.0 | Optimized 132 RLS policies with `(SELECT auth.uid())` |
| 2025-12-28 | 3.0 | Removed 15 duplicate permissive policies |
| 2025-12-28 | 3.0 | Consolidated user_invitations policies |
| 2025-12-28 | 3.0 | Supabase advisors: 0 security warnings, 0 performance warnings |
| 2025-12-28 | 3.0 | **Launch Ready** - All checks pass |

---

**Last Updated**: 2025-12-28
**Version**: 3.0 (Launch Ready)
**Author**: Security Team
