# ProductionOS Security & Performance Audit

> ## **PRODUCTION STATUS: ISSUES RESOLVED (2026-01-02)**
>
> Historical audit report. All issues identified were addressed before production launch.
> See SECURITY.md for current security status.

**Target:** https://www.productionos.io
**Date:** 2025-12-28 (Original) | 2026-01-02 (Production)
**Auditor:** Claude Code (Automated Scan)
**Risk Rating:** ~~HIGH~~ → LOW (All issues resolved)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Security Issues](#3-security-issues)
   - [3.1 CRITICAL: Missing Security Headers](#31-critical-missing-security-headers)
   - [3.2 HIGH: Overly Permissive CORS](#32-high-overly-permissive-cors)
   - [3.3 MEDIUM: Client-Side API Key Exposure](#33-medium-client-side-api-key-exposure)
   - [3.4 MEDIUM: Supabase RLS Policy Audit Required](#34-medium-supabase-rls-policy-audit-required)
   - [3.5 LOW: Missing robots.txt and sitemap.xml](#35-low-missing-robotstxt-and-sitemapxml)
   - [3.6 INFO: dangerouslySetInnerHTML Usage](#36-info-dangerouslysetinnerhtml-usage)
4. [Performance Issues](#4-performance-issues)
   - [4.1 CRITICAL: Excessive Bundle Size](#41-critical-excessive-bundle-size)
   - [4.2 HIGH: PDF Library Not Lazy Loaded](#42-high-pdf-library-not-lazy-loaded)
   - [4.3 MEDIUM: Suboptimal Cache Headers](#43-medium-suboptimal-cache-headers)
   - [4.4 LOW: No Compression Verification](#44-low-no-compression-verification)
5. [SSL/TLS Assessment](#5-ssltls-assessment)
6. [Infrastructure Assessment](#6-infrastructure-assessment)
7. [Remediation Checklist](#7-remediation-checklist)
8. [File-by-File Remediation Guide](#8-file-by-file-remediation-guide)
9. [Extended Findings (Deep Scan)](#9-extended-findings-deep-scan)
   - [9.1 CRITICAL: Supabase Schema Exposure](#91-critical-supabase-schema-exposure)
   - [9.2 HIGH: Database Structure Disclosed](#92-high-database-structure-disclosed)
   - [9.3 MEDIUM: Subdomain Enumeration](#93-medium-subdomain-enumeration)
   - [9.4 MEDIUM: Client-Side Storage Analysis](#94-medium-client-side-storage-analysis)
   - [9.5 LOW: Auth Configuration Exposed](#95-low-auth-configuration-exposed)
   - [9.6 INFO: Nikto Scan Results](#96-info-nikto-scan-results)
10. [Complete Database Schema](#10-complete-database-schema)
11. [Identified Dependencies](#11-identified-dependencies)
12. [Attack Surface Summary](#12-attack-surface-summary)

---

## 1. Executive Summary

| Category | Rating | Score |
|----------|--------|-------|
| SSL/TLS Configuration | EXCELLENT | A |
| Security Headers | POOR | D |
| API Key Management | ACCEPTABLE | C |
| Infrastructure Security | EXCELLENT | A |
| Bundle Performance | POOR | D |
| Caching Strategy | FAIR | C |
| **Overall** | **MEDIUM RISK** | **C** |

### Key Findings

- **9 Security Issues** identified (2 Critical, 2 High, 3 Medium, 2 Low/Info)
- **4 Performance Issues** identified (1 Critical, 1 High, 1 Medium, 1 Low)
- **88 database tables exposed** via Supabase OpenAPI schema
- **7 RPC functions exposed** via Supabase API
- **6 subdomains discovered** pointing to infrastructure
- **No exposed secrets** (OpenAI, AWS keys not found in client bundle)
- **SSL/TLS configuration is excellent** (TLSv1.3, strong ciphers)
- **RLS appears functional** (queries return empty arrays for anon user)
- **Total JavaScript bundle size: ~2.5MB** (uncompressed) - needs optimization

---

## 2. Technology Stack

```yaml
frontend:
  framework: React
  state_management: Zustand
  build_tool: Vite
  pwa: enabled

backend:
  platform: Supabase
  database: PostgreSQL (managed)
  auth: Supabase Auth
  storage: Supabase Storage
  project_id: deitlnfumugxcbxqqivk

integrations:
  payments: Stripe (live mode)
  ai: OpenAI (referenced)
  pdf: pdf-lib or react-pdf (1.5MB vendor bundle)

hosting:
  platform: Vercel
  edge_network: enabled
  ssl: Let's Encrypt (auto-renewed)

assets:
  main_bundle: /assets/index-CATKV3SL.js (770KB)
  react_vendor: /assets/react-vendor-DRPWudcR.js (12KB)
  zustand_vendor: /assets/zustand-vendor-BohoUguQ.js (1KB)
  pdf_vendor: /assets/pdf-vendor-CqWdlgKa.js (1.5MB)
  supabase_vendor: /assets/supabase-vendor-DWEVVlJw.js (173KB)
  styles: /assets/index-M8hDRqIS.css
```

---

## 3. Security Issues

### 3.1 CRITICAL: Missing Security Headers

**Severity:** CRITICAL
**CVSS Score:** 7.5
**Category:** OWASP A05:2021 - Security Misconfiguration

#### Current State

```http
HTTP/2 200
accept-ranges: bytes
access-control-allow-origin: *
cache-control: public, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
server: Vercel
strict-transport-security: max-age=63072000
```

#### Missing Headers

| Header | Status | Risk |
|--------|--------|------|
| Content-Security-Policy | MISSING | XSS attacks, code injection |
| X-Frame-Options | MISSING | Clickjacking attacks |
| X-Content-Type-Options | MISSING | MIME-type sniffing attacks |
| Referrer-Policy | MISSING | Information leakage |
| Permissions-Policy | MISSING | Unauthorized feature access |

#### Remediation

**File to create/modify:** `vercel.json` (project root)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ]
}
```

#### Verification Command

```bash
curl -sI https://www.productionos.io/ | grep -iE "(x-frame|x-content|content-security|referrer-policy|permissions-policy)"
```

---

### 3.2 HIGH: Overly Permissive CORS

**Severity:** HIGH
**CVSS Score:** 6.5
**Category:** OWASP A01:2021 - Broken Access Control

#### Current State

```http
access-control-allow-origin: *
```

#### Risk

Any website can make authenticated requests to your API endpoints, potentially leading to:
- Cross-site request forgery (CSRF)
- Data exfiltration
- Unauthorized API access

#### Remediation

**Option A: Vercel Configuration** (`vercel.json`)

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://www.productionos.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        }
      ]
    }
  ]
}
```

**Option B: Supabase Edge Function** (if using custom API routes)

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.productionos.io',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

### 3.3 MEDIUM: Client-Side API Key Exposure

**Severity:** MEDIUM
**CVSS Score:** 5.0
**Category:** OWASP A02:2021 - Cryptographic Failures

#### Exposed Keys Found

| Key Type | Value | Risk Assessment |
|----------|-------|-----------------|
| Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaXRsbmZ1bXVneGNieHFxaXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDgxMzMsImV4cCI6MjA4MTEyNDEzM30.unFRnnjTCuxoaAyjfWK1UNjgubq9MYjElXbTN77mjEc` | LOW - Designed to be public |
| Stripe Publishable Key | `pk_live_51MmM4NLE30d1czmdZGGV8JJcJFaQxRPUVNH3TujuG8Q8GlPJcRD9gLG7LfIaXNKB9Cx2TaT1GvVW9zHwRkHf9kPW00rz6yK2gD` | LOW - Designed to be public |
| OpenAI API Key | NOT FOUND | OK |
| AWS Access Key | NOT FOUND | OK |
| Stripe Secret Key | NOT FOUND | OK |

#### Risk Assessment

The exposed keys are **designed to be public** (Supabase anon key, Stripe publishable key). However, security depends on:

1. **Supabase:** Row Level Security (RLS) policies must be properly configured
2. **Stripe:** Publishable key can only be used for tokenization, not charges

#### Remediation

No immediate action required for the keys themselves, but ensure:

**Supabase RLS Verification** (run in Supabase SQL Editor):

```sql
-- Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

### 3.4 MEDIUM: Supabase RLS Policy Audit Required

**Severity:** MEDIUM
**CVSS Score:** 5.5
**Category:** OWASP A01:2021 - Broken Access Control

#### Risk

With the anon key exposed, **any user can query your Supabase database** directly. Without proper RLS policies:
- Users could read other users' data
- Users could modify or delete data they shouldn't access
- Sensitive business data could be exposed

#### Remediation

**Step 1: Enable RLS on all tables**

```sql
-- Enable RLS on each table (example)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

**Step 2: Create appropriate policies**

```sql
-- Example: Users can only see their own organization's data
CREATE POLICY "Users can view own org data" ON projects
  FOR SELECT
  USING (organization_id = auth.jwt() -> 'user_metadata' ->> 'organization_id');

-- Example: Users can only insert into their own organization
CREATE POLICY "Users can insert own org data" ON projects
  FOR INSERT
  WITH CHECK (organization_id = auth.jwt() -> 'user_metadata' ->> 'organization_id');

-- Example: Users can only update their own organization's data
CREATE POLICY "Users can update own org data" ON projects
  FOR UPDATE
  USING (organization_id = auth.jwt() -> 'user_metadata' ->> 'organization_id');

-- Example: Users can only delete their own organization's data
CREATE POLICY "Users can delete own org data" ON projects
  FOR DELETE
  USING (organization_id = auth.jwt() -> 'user_metadata' ->> 'organization_id');
```

**Step 3: Test policies**

```sql
-- Test as anon user (should return nothing or error)
SET request.jwt.claim.sub = '';
SELECT * FROM projects LIMIT 5;
```

---

### 3.5 LOW: Missing robots.txt and sitemap.xml

**Severity:** LOW
**Category:** SEO / Information Disclosure

#### Current State

Both `/robots.txt` and `/sitemap.xml` return the SPA index.html (catch-all routing).

#### Remediation

**Create `public/robots.txt`:**

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /settings/
Disallow: /admin/

Sitemap: https://www.productionos.io/sitemap.xml
```

**Create `public/sitemap.xml`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.productionos.io/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/pricing</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/features</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

---

### 3.6 INFO: dangerouslySetInnerHTML Usage

**Severity:** INFO
**Category:** Potential XSS Vector

#### Finding

Found **1 instance** of `dangerouslySetInnerHTML` in the codebase.

#### Risk

If user-supplied content is passed to `dangerouslySetInnerHTML` without sanitization, it creates an XSS vulnerability.

#### Remediation

**Search for usage in codebase:**

```bash
grep -r "dangerouslySetInnerHTML" src/
```

**Ensure all usages sanitize input:**

```typescript
// Install DOMPurify
// npm install dompurify @types/dompurify

import DOMPurify from 'dompurify';

// UNSAFE - Do not do this
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// SAFE - Sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

---

## 4. Performance Issues

### 4.1 CRITICAL: Excessive Bundle Size

**Severity:** CRITICAL
**Impact:** Poor Core Web Vitals, slow Time-to-Interactive

#### Current State

| Bundle | Size (Uncompressed) | Size (Gzipped Est.) |
|--------|---------------------|---------------------|
| index.js | 770 KB | ~230 KB |
| pdf-vendor.js | 1,528 KB (1.5 MB) | ~450 KB |
| supabase-vendor.js | 173 KB | ~52 KB |
| react-vendor.js | 12 KB | ~4 KB |
| zustand-vendor.js | 1 KB | ~0.5 KB |
| **TOTAL** | **~2.5 MB** | **~740 KB** |

#### Target

- Initial bundle: < 200 KB (gzipped)
- Total lazy-loaded: < 500 KB (gzipped)

#### Remediation

**1. Analyze bundle composition:**

```bash
# Add to package.json scripts
"analyze": "vite build --mode production && npx vite-bundle-visualizer"
```

**2. Configure Vite for better splitting** (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor (always loaded)
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],

          // Lazy-loaded vendors
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-pdf': ['@react-pdf/renderer'], // or your PDF library
          'vendor-charts': ['recharts'], // if using charts
          'vendor-forms': ['react-hook-form', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
  },
});
```

---

### 4.2 HIGH: PDF Library Not Lazy Loaded

**Severity:** HIGH
**Impact:** 1.5MB loaded on initial page load

#### Current State

The PDF vendor bundle (1.5MB) is loaded via `modulepreload` on every page:

```html
<link rel="modulepreload" crossorigin href="/assets/pdf-vendor-CqWdlgKa.js">
```

#### Remediation

**1. Remove from modulepreload** (in `index.html` or build config)

**2. Lazy load the PDF component:**

```typescript
// src/components/PDFViewer.tsx
import { lazy, Suspense } from 'react';

// Lazy load the heavy PDF component
const PDFDocument = lazy(() => import('./PDFDocument'));

export function PDFViewer({ url }: { url: string }) {
  return (
    <Suspense fallback={<div>Loading PDF viewer...</div>}>
      <PDFDocument url={url} />
    </Suspense>
  );
}
```

**3. Use dynamic import for PDF generation:**

```typescript
// Only load PDF library when needed
async function generatePDF(data: QuoteData) {
  const { pdf } = await import('@react-pdf/renderer');
  const { QuoteDocument } = await import('./QuoteDocument');

  const blob = await pdf(<QuoteDocument data={data} />).toBlob();
  return blob;
}
```

**4. Route-based code splitting:**

```typescript
// src/App.tsx or router config
import { lazy } from 'react';

const QuotesPage = lazy(() => import('./pages/QuotesPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
// These pages likely use PDF - they'll load the PDF vendor when accessed
```

---

### 4.3 MEDIUM: Suboptimal Cache Headers

**Severity:** MEDIUM
**Impact:** Unnecessary re-downloads of static assets

#### Current State

```http
cache-control: public, max-age=0, must-revalidate
```

Assets with content hashes (e.g., `index-CATKV3SL.js`) should be cached indefinitely.

#### Remediation

**Update `vercel.json`:**

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

### 4.4 LOW: No Compression Verification

**Severity:** LOW
**Impact:** Potentially larger transfer sizes

#### Current State

Unable to verify if Brotli/Gzip compression is enabled (Vercel typically enables this by default).

#### Verification Command

```bash
curl -sI -H "Accept-Encoding: gzip, deflate, br" https://www.productionos.io/assets/index-CATKV3SL.js | grep -i content-encoding
```

Expected output: `content-encoding: br` or `content-encoding: gzip`

#### Remediation

If compression is not enabled, Vercel should handle this automatically. If using a custom server, ensure compression middleware is configured.

---

## 5. SSL/TLS Assessment

### Rating: EXCELLENT (A)

| Check | Status | Details |
|-------|--------|---------|
| SSLv2 | DISABLED | Secure |
| SSLv3 | DISABLED | Secure |
| TLSv1.0 | DISABLED | Secure |
| TLSv1.1 | DISABLED | Secure |
| TLSv1.2 | ENABLED | Secure |
| TLSv1.3 | ENABLED | Preferred |
| Heartbleed | NOT VULNERABLE | Secure |
| TLS Fallback SCSV | SUPPORTED | Secure |
| Certificate Issuer | Let's Encrypt R12 | Valid |
| Certificate Expiry | Mar 27, 2026 | Valid |
| Key Strength | RSA 2048-bit | Adequate |
| Preferred Cipher | TLS_AES_128_GCM_SHA256 | Strong |

### Supported Ciphers (All Strong)

```
TLSv1.3: TLS_AES_128_GCM_SHA256 (preferred)
TLSv1.3: TLS_AES_256_GCM_SHA384
TLSv1.3: TLS_CHACHA20_POLY1305_SHA256
TLSv1.2: ECDHE-RSA-AES128-GCM-SHA256 (preferred)
TLSv1.2: ECDHE-RSA-AES256-GCM-SHA384
TLSv1.2: ECDHE-RSA-CHACHA20-POLY1305
TLSv1.2: DHE-RSA-AES256-GCM-SHA384
```

### No Action Required

SSL/TLS configuration is excellent. Vercel manages this automatically.

---

## 6. Infrastructure Assessment

### Rating: EXCELLENT (A)

| Check | Status | Details |
|-------|--------|---------|
| Open Ports | MINIMAL | Only 53, 80, 443 |
| HTTP to HTTPS Redirect | ENABLED | 308 Permanent Redirect |
| HSTS | ENABLED | max-age=63072000 (~2 years) |
| Server Disclosure | MINIMAL | Only "Vercel" |
| .env Exposure | SAFE | Returns SPA index |
| .git Exposure | SAFE | Returns SPA index |
| Admin Panels | NOT FOUND | N/A |

### Port Scan Results

```
PORT    STATE SERVICE
53/tcp  open  domain (Cloudflare DNS)
80/tcp  open  http (redirects to HTTPS)
443/tcp open  https (Vercel edge)
```

### No Action Required

Infrastructure is well-configured. Vercel provides excellent default security.

---

## 7. Remediation Checklist

### Immediate Actions (Do Today)

- [ ] **Add security headers to `vercel.json`** (Section 3.1)
- [ ] **Restrict CORS to specific origin** (Section 3.2)
- [ ] **Audit Supabase RLS policies** (Section 3.4)

### Short-Term Actions (This Week)

- [ ] **Lazy-load PDF library** (Section 4.2)
- [ ] **Configure optimal cache headers** (Section 4.3)
- [ ] **Add robots.txt and sitemap.xml** (Section 3.5)

### Medium-Term Actions (This Month)

- [ ] **Analyze and optimize bundle sizes** (Section 4.1)
- [ ] **Audit dangerouslySetInnerHTML usage** (Section 3.6)
- [ ] **Implement Content Security Policy** (Section 3.1)

### Ongoing

- [ ] **Monitor SSL certificate expiry** (Currently valid until Mar 2026)
- [ ] **Review Supabase RLS policies on schema changes**
- [ ] **Run bundle analysis on major releases**

---

## 8. File-by-File Remediation Guide

This section provides specific file paths and code changes for Claude Code to implement.

### 8.1 vercel.json (Create or Modify)

**Path:** `vercel.json` (project root)

**Full recommended configuration:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://www.productionos.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Client-Info, apikey"
        }
      ]
    }
  ]
}
```

---

### 8.2 public/robots.txt (Create)

**Path:** `public/robots.txt`

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /settings/
Disallow: /admin/
Disallow: /auth/

Sitemap: https://www.productionos.io/sitemap.xml
```

---

### 8.3 public/sitemap.xml (Create)

**Path:** `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.productionos.io/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/pricing</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/features</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.productionos.io/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

---

### 8.4 vite.config.ts (Modify)

**Path:** `vite.config.ts`

**Add manual chunks configuration:**

```typescript
// Add to build.rollupOptions.output
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-state': ['zustand'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'], // adjust based on actual UI libs
},
```

---

### 8.5 PDF Lazy Loading (Modify existing component)

**Search for:** Files importing PDF libraries (`@react-pdf/renderer`, `react-pdf`, `pdf-lib`)

**Pattern to find:**

```bash
grep -r "from '@react-pdf" src/
grep -r "from 'react-pdf" src/
grep -r "from 'pdf-lib" src/
```

**Replace static imports with dynamic:**

```typescript
// BEFORE
import { Document, Page } from '@react-pdf/renderer';

// AFTER
const PDFComponents = lazy(() => import('@react-pdf/renderer').then(mod => ({
  default: () => null, // placeholder
  Document: mod.Document,
  Page: mod.Page,
})));
```

---

### 8.6 Supabase RLS Policies (SQL to run in Supabase Dashboard)

**Location:** Supabase Dashboard > SQL Editor

```sql
-- STEP 1: Check current RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- STEP 2: Enable RLS on all public tables (run for each table)
-- Replace 'your_table_name' with actual table names
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- STEP 3: Verify policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

---

## Appendix: Raw Scan Data

### SSL Scan Output

```
SSL/TLS Protocols:
SSLv2     disabled
SSLv3     disabled
TLSv1.0   disabled
TLSv1.1   disabled
TLSv1.2   enabled
TLSv1.3   enabled

Heartbleed: Not vulnerable
Certificate: *.productionos.io (Let's Encrypt R12)
Valid: Dec 27, 2025 - Mar 27, 2026
```

### HTTP Headers

```http
HTTP/2 200
accept-ranges: bytes
access-control-allow-origin: *
age: 1888
cache-control: public, max-age=0, must-revalidate
content-disposition: inline
content-type: text/html; charset=utf-8
etag: "004ba38040614283df8037ec60bbf1ae"
server: Vercel
strict-transport-security: max-age=63072000
x-vercel-cache: HIT
```

### Port Scan Results

```
PORT    STATE SERVICE  VERSION
53/tcp  open  domain   Cloudflare public DNS
80/tcp  open  http     Vercel (308 redirect)
443/tcp open  ssl/http Vercel Edge
```

---

## 9. Extended Findings (Deep Scan)

This section contains findings from the extended deep scan performed using Kali Linux tools and additional API probing.

### 9.1 CRITICAL: Supabase Schema Exposure

**Severity:** CRITICAL
**CVSS Score:** 8.0
**Category:** OWASP A01:2021 - Broken Access Control / Information Disclosure

#### Finding

The Supabase REST API exposes a complete OpenAPI/Swagger specification that reveals:
- All 88 table names and their column definitions
- All 7 RPC function signatures
- Complete data types and relationships
- Parameter validation rules

#### Evidence

```bash
# This returns full database schema
curl -s "https://deitlnfumugxcbxqqivk.supabase.co/rest/v1/" \
  -H "apikey: [ANON_KEY]"
```

#### Risk

An attacker can:
1. Map your entire database structure
2. Understand business logic from table/column names
3. Identify valuable targets (billing_invoices, user_profiles, etc.)
4. Craft targeted attacks knowing exact column names
5. Identify potential vulnerabilities in custom RPC functions

#### Remediation

**Option 1: Disable OpenAPI exposure (Recommended)**

In Supabase Dashboard → Settings → API:
- Set "Expose OpenAPI spec" to OFF

**Option 2: Use Supabase Edge Functions as API Layer**

Create a custom API layer that only exposes needed endpoints:

```typescript
// supabase/functions/api/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  // Only expose specific, controlled endpoints
  const url = new URL(req.url)

  if (url.pathname === '/api/projects' && req.method === 'GET') {
    // Controlled access with validation
  }

  return new Response('Not Found', { status: 404 })
})
```

---

### 9.2 HIGH: Database Structure Disclosed

**Severity:** HIGH
**CVSS Score:** 6.5
**Category:** Information Disclosure

#### Exposed Tables (88 total)

```yaml
business_critical:
  - billing_invoices          # Payment/billing data
  - subscriptions             # Subscription details
  - token_purchases           # AI token purchases
  - organizations             # Multi-tenant org data
  - organization_members      # User-org relationships
  - user_profiles             # User PII

financial:
  - invoices                  # Client invoices
  - expenses                  # Expense tracking
  - purchase_orders           # PO management
  - quotes                    # Quote/estimate data
  - opportunities             # Sales pipeline

operational:
  - projects                  # Project management
  - clients                   # Client database
  - contacts                  # Contact information
  - contracts                 # Legal contracts
  - crew                      # Crew/staff data

sensitive:
  - audit_logs                # Security audit trail
  - agent_memory              # AI agent data
  - agent_learnings           # AI learning data
  - google_connections        # OAuth tokens?
  - microsoft_connections     # OAuth tokens?
  - email_messages            # Email content
  - email_threads             # Email threads

kit_management:
  - kit_items                 # Equipment inventory
  - kit_bookings              # Equipment rentals
  - kit_maintenance           # Maintenance records

call_sheets:
  - call_sheets               # Production schedules
  - call_sheet_crew           # Crew assignments
  - call_sheet_vehicles       # Vehicle logistics
  - call_sheet_flights        # Travel arrangements
  - call_sheet_accommodation  # Hotel bookings
```

#### Exposed RPC Functions

```yaml
functions:
  - consume_ai_tokens         # Token consumption
  - duplicate_call_sheet      # Data duplication
  - generate_project_code     # Code generation
  - get_available_ai_tokens   # Token balance query
  - get_user_organization_id  # Org lookup
  - is_org_admin              # Permission check
  - user_organizations        # User-org mapping
```

#### Remediation

**Disable OpenAPI spec exposure** (see Section 9.1)

---

### 9.3 MEDIUM: Subdomain Enumeration

**Severity:** MEDIUM
**CVSS Score:** 4.0
**Category:** Information Disclosure

#### Discovered Subdomains

| Subdomain | IP Address(es) | Status |
|-----------|---------------|--------|
| api.productionos.io | 64.29.17.65, 216.198.79.65 | Active |
| app.productionos.io | 64.29.17.65, 216.198.79.65 | Active |
| admin.productionos.io | 64.29.17.1, 216.198.79.1 | Active |
| staging.productionos.io | 64.29.17.65, 216.198.79.65 | Active |
| dev.productionos.io | 216.198.79.1, 216.198.79.65 | Active |
| cdn.productionos.io | 64.29.17.65, 216.198.79.65 | Active |

#### Risk

- Staging/dev environments may have weaker security
- Admin subdomain could be targeted for privileged access
- Multiple IP addresses suggest CDN or load balancing

#### Remediation

1. **Secure staging/dev environments:**
   - Add authentication (HTTP Basic Auth or IP whitelist)
   - Use `.env` to disable debug mode

2. **Review admin subdomain:**
   - Ensure strong authentication
   - Consider IP whitelisting

```json
// vercel.json for staging
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow"
        }
      ]
    }
  ]
}
```

---

### 9.4 MEDIUM: Client-Side Storage Analysis

**Severity:** MEDIUM
**CVSS Score:** 4.5
**Category:** OWASP A04:2021 - Insecure Design

#### localStorage Keys Found

```javascript
// Organization/tenant data
"current_organization_id"      // Multi-tenant identifier

// UI state (low risk)
"sidebar-collapsed"
"sidebar-expanded-categories"
"sop_collapsed_state"
"pwa-install-dismissed"

// Cached data (review needed)
"exchange_rates_cache"         // Currency data

// Dynamic keys
`sub_access_${n.id}`           // Subscription access flags

// Minified/obfuscated keys (investigate)
Ca, di, Er, Fr, hr, mo, mr, pr, Ra, rr, Sa, tr, ui, uo, Ur, xa, zr
```

#### Risks

1. **Organization ID in localStorage:**
   - Could be manipulated to attempt cross-tenant access
   - Ensure server-side validation

2. **Subscription access flags:**
   - Client-side feature gating can be bypassed
   - Ensure server validates subscription status

#### Remediation

**1. Validate organization_id server-side:**

```typescript
// Always verify org membership in RLS policies
CREATE POLICY "org_isolation" ON projects
  USING (
    organization_id = (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

**2. Use httpOnly cookies for sensitive tokens:**

```typescript
// Instead of localStorage for auth
document.cookie = `session=${token}; HttpOnly; Secure; SameSite=Strict`;
```

---

### 9.5 LOW: Auth Configuration Exposed

**Severity:** LOW
**CVSS Score:** 3.0
**Category:** Information Disclosure

#### Exposed Auth Settings

```json
{
  "external": {
    "google": true,
    "email": true,
    "phone": false,
    "anonymous_users": false,
    "apple": false,
    "github": false,
    // ... other providers disabled
  },
  "disable_signup": false,
  "mailer_autoconfirm": false,
  "phone_autoconfirm": false,
  "sms_provider": "twilio",
  "saml_enabled": false
}
```

#### Retrieved From

```bash
curl -s "https://deitlnfumugxcbxqqivk.supabase.co/auth/v1/settings" \
  -H "apikey: [ANON_KEY]"
```

#### Implications

- Email + Google authentication enabled
- Sign-up is open (not disabled)
- Email requires confirmation (good)
- No phone auth (reduces SMS bombing risk)
- Twilio configured for SMS (likely for future use)

#### Remediation

This is mostly informational. Consider:

1. **If sign-up should be restricted:**
```sql
-- In Supabase, disable public signups via Dashboard
-- Or use invite-only flow
```

2. **Monitor for abuse:**
   - Set up rate limiting on auth endpoints
   - Monitor for signup spam

---

### 9.6 INFO: Nikto Scan Results

**Severity:** INFO
**Tool:** Nikto v2.5.0

#### Confirmed Findings

| Finding | Status | Notes |
|---------|--------|-------|
| X-Frame-Options missing | CONFIRMED | See Section 3.1 |
| X-Content-Type-Options missing | CONFIRMED | See Section 3.1 |
| CORS wildcard (*) | CONFIRMED | See Section 3.2 |
| Uncommon headers (x-vercel-id) | INFO | Normal for Vercel |

#### False Positives

Nikto reported many "backup file" findings (e.g., `/backup.tar`, `/database.war`). These are **false positives** because:
- This is a React SPA with catch-all routing
- All unknown paths return the index.html (HTTP 200)
- No actual backup files exist

#### Verification

```bash
# All these return the SPA, not actual files
curl -sI https://www.productionos.io/backup.tar | head -3
# HTTP/2 200
# content-type: text/html
```

---

## 10. Complete Database Schema

**File saved:** `/home/kali/supabase_schema.json` (600KB)

### Table Summary by Category

| Category | Tables | Risk Level |
|----------|--------|------------|
| User/Auth | 4 | HIGH |
| Billing | 4 | CRITICAL |
| Projects | 6 | MEDIUM |
| Clients/Contacts | 5 | MEDIUM |
| Email | 12 | HIGH |
| Call Sheets | 15 | LOW |
| Kit/Equipment | 6 | LOW |
| Workflows | 3 | MEDIUM |
| AI/Agent | 3 | MEDIUM |
| Other | 30 | VARIES |

### Full Table List

```
account_deletion_requests    activities                  activity_logs
activity_participants        agent_learnings             agent_memory
agent_tasks                  audit_logs                  billing_invoices
calendar_events              call_sheet_accommodation    call_sheet_cast
call_sheet_catering          call_sheet_crew            call_sheet_department_calls
call_sheet_emergency_contacts call_sheet_flights         call_sheet_room_assignments
call_sheet_technical         call_sheet_templates        call_sheet_transfers
call_sheet_vehicles          call_sheet_vendors          call_sheet_weather
call_sheets                  clients                     companies
contact_opportunities        contact_summary             contacts
contracts                    data_export_requests        documents
email_attachments            email_drafts                email_entity_links
email_messages               email_sequence_enrollments  email_sequence_sends
email_sequence_steps         email_sequences             email_sync_queue
email_templates              email_threads               email_tracking_events
expenses                     google_connections          invoices
kit_bookings                 kit_categories              kit_items
kit_items_extended           kit_locations               kit_maintenance
knowledge_fragments          lead_scoring_rules          microsoft_connections
onboarding_checklist         onboarding_progress         opportunities
organization_members         organizations               project_phases
project_summary              projects                    purchase_orders
quote_templates              quotes                      rate_card_sections
rate_cards                   recent_activities           settings
sops                         sports_events               subscriptions
token_purchases              upcoming_tasks              user_invitations
user_profiles                workflow_executions         workflow_rules
```

---

## 11. Identified Dependencies

### Frontend Dependencies (from bundle analysis)

| Package | Version | Risk Notes |
|---------|---------|------------|
| React | 19.2.3 | Latest stable |
| React Router | 7.11.0 | Latest stable |
| Zustand | 5.4.1 | State management |
| @supabase/supabase-js | Unknown | Check for updates |
| @stripe/stripe-js | Unknown | Payment integration |
| Lucide React | Unknown | Icon library |
| PDF Library | Unknown (~1.5MB) | Needs investigation |

### Version Check Commands

```bash
# Run in project directory
npm outdated
npm audit

# Or with yarn
yarn outdated
yarn audit
```

### Recommended Actions

1. **Run `npm audit`** to check for known vulnerabilities
2. **Update React** if not on latest (currently shows 19.2.3)
3. **Investigate PDF library** - 1.5MB is unusually large

---

## 12. Attack Surface Summary

### External Attack Surface

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATTACK SURFACE MAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Internet                                                        │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Vercel Edge Network (CDN)                               │    │
│  │  - www.productionos.io                                   │    │
│  │  - api.productionos.io                                   │    │
│  │  - app.productionos.io                                   │    │
│  │  - admin.productionos.io  ⚠️                             │    │
│  │  - staging.productionos.io  ⚠️                           │    │
│  │  - dev.productionos.io  ⚠️                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Supabase (Backend)                                      │    │
│  │  - REST API  ⚠️ Schema exposed                           │    │
│  │  - Auth API  ✓ Settings exposed (low risk)              │    │
│  │  - Storage API  ✓ Requires auth                          │    │
│  │  - Realtime  ? Not tested                                │    │
│  │  - 88 Tables  ⚠️ Structure visible                       │    │
│  │  - 7 RPC Functions  ⚠️ Signatures visible                │    │
│  └─────────────────────────────────────────────────────────┘    │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Third-Party Services                                    │    │
│  │  - Stripe (payments)  ✓ PK only                          │    │
│  │  - OpenAI (AI features)  ✓ Key server-side               │    │
│  │  - Google OAuth  ✓ Configured                            │    │
│  │  - Exchange Rate API  ✓ Public API                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Legend:
  ✓  = Secure/Acceptable
  ⚠️  = Needs attention
  ?  = Not tested
```

### Priority Remediation Order

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Disable Supabase OpenAPI exposure | 5 min | CRITICAL |
| P0 | Add security headers | 10 min | CRITICAL |
| P1 | Restrict CORS | 10 min | HIGH |
| P1 | Audit RLS policies | 2-4 hrs | HIGH |
| P2 | Secure staging/dev subdomains | 30 min | MEDIUM |
| P2 | Lazy-load PDF library | 1-2 hrs | MEDIUM |
| P3 | Add robots.txt/sitemap | 10 min | LOW |
| P3 | Optimize bundle size | 2-4 hrs | LOW |

---

## Appendix B: Commands Used

### Reconnaissance

```bash
# HTTP Headers
curl -sI https://www.productionos.io/

# SSL/TLS Scan
sslscan www.productionos.io

# Port Scan
nmap -sV -Pn --top-ports 100 www.productionos.io

# Nikto Scan
nikto -h https://www.productionos.io
```

### API Probing

```bash
# Supabase Schema
curl -s "https://deitlnfumugxcbxqqivk.supabase.co/rest/v1/" \
  -H "apikey: [ANON_KEY]"

# Auth Settings
curl -s "https://deitlnfumugxcbxqqivk.supabase.co/auth/v1/settings" \
  -H "apikey: [ANON_KEY]"

# Table Access Test
curl -s "https://deitlnfumugxcbxqqivk.supabase.co/rest/v1/[TABLE]?limit=1" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"
```

### Bundle Analysis

```bash
# Download and analyze JS bundles
curl -sL https://www.productionos.io/assets/index-CATKV3SL.js | \
  grep -oiE "(supabase|stripe|openai|aws)" | sort | uniq -c

# Find exposed keys
curl -sL https://www.productionos.io/assets/index-CATKV3SL.js | \
  grep -oE "eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"
```

---

## Appendix C: Files Generated

| File | Location | Contents |
|------|----------|----------|
| Audit Report | `/home/kali/Audit.MD` | This document |
| Supabase Schema | `/home/kali/supabase_schema.json` | Full API spec (600KB) |
| Nikto Scan | `/home/kali/nikto_scan.txt` | Raw Nikto output |

---

**End of Extended Audit Report**

*Generated: 2025-12-28*
*Auditor: Claude Code with Kali Linux tools*
*Total Issues: 9 Security + 4 Performance*
*Risk Rating: HIGH*
