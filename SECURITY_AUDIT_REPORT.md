# SECURITY & DATA ARCHITECTURE AUDIT REPORT
**Quote/Proposal Generation Application**
**Date:** 2025-12-13
**Auditor:** Backend Security Architect

---

## EXECUTIVE SUMMARY

This application has **CRITICAL SECURITY VULNERABILITIES** that must be addressed immediately. While functional for internal use, the current architecture exposes sensitive data and lacks fundamental security controls.

**Risk Level:** HIGH
**Deployment Status:** Internal tool (mitigates some risks)
**Immediate Action Required:** YES

---

## 1. AUTHENTICATION VULNERABILITIES

### 1.1 Critical: Password Storage in Environment Variables
**File:** `/Users/tom/quote/.env.local` (lines 5-6)
**File:** `/Users/tom/quote/src/store/authStore.js` (lines 6, 34)

```javascript
// EXPOSED IN .ENV.LOCAL
VITE_APP_PASSWORD=your-secure-password

// VULNERABLE CODE
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';
if (password === APP_PASSWORD) { // Plain text comparison
```

**Vulnerabilities:**
- Password stored in **plain text** in environment variables
- Password is **compiled into the client bundle** (VITE_ prefix exposes it to browser)
- Password visible in browser DevTools: `import.meta.env.VITE_APP_PASSWORD`
- Client-side password comparison allows bypass via browser console
- No password hashing or salting
- Single shared password for all users (no individual accounts)
- No password complexity requirements
- No rate limiting on login attempts
- No session timeout controls

**Impact:** CRITICAL
- Anyone with bundle access can extract password
- Build artifacts contain password in plain text
- localStorage authentication token is just string "authenticated"

**Fix Required:**
```javascript
// PROPER AUTHENTICATION FLOW:
1. Remove VITE_APP_PASSWORD (never expose passwords to client)
2. Implement proper backend authentication
3. Use Supabase Auth or implement custom auth service
4. Store only secure session tokens client-side
5. Implement proper user management with individual accounts
```

### 1.2 Insecure Session Management
**File:** `/Users/tom/quote/src/store/authStore.js` (lines 8-27)

```javascript
function loadAuth() {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved === 'authenticated'; // Anyone can set this
}

function saveAuth(isAuthenticated) {
    if (isAuthenticated) {
        localStorage.setItem(AUTH_KEY, 'authenticated'); // No token, no expiry
    }
}
```

**Vulnerabilities:**
- No session tokens - just string "authenticated"
- No session expiration (persists forever)
- No session invalidation mechanism
- localStorage can be manipulated via browser console
- No CSRF protection
- No session fingerprinting

**Impact:** HIGH
- Anyone with device access can bypass auth by setting localStorage
- Sessions never expire (security risk if device is compromised)
- No way to remotely invalidate sessions

---

## 2. DATA EXPOSURE VULNERABILITIES

### 2.1 Critical: Supabase Keys Exposed to Client
**File:** `/Users/tom/quote/.env.local` (lines 2-3)

```bash
VITE_SUPABASE_URL=https://deitlnfumugxcbxqqivk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Vulnerabilities:**
- Supabase URL and anon key **embedded in client bundle**
- Keys accessible via browser DevTools
- RLS policies are the ONLY protection (single point of failure)

**Current RLS Policies:** (from `supabase-schema.sql` lines 102-107)
```sql
-- COMPLETELY OPEN - NO SECURITY
create policy "Allow all quotes" on quotes for all using (true) with check (true);
create policy "Allow all clients" on clients for all using (true) with check (true);
create policy "Allow all rate_cards" on rate_cards for all using (true) with check (true);
```

**Impact:** CRITICAL
- Database is **completely open** to anyone with anon key
- Any malicious actor can:
  - Read ALL quotes, clients, rate cards
  - Modify ANY data
  - Delete ALL data
  - Insert malicious data
- No tenant isolation
- No audit trail

**Immediate Action Required:**
1. Rotate Supabase anon key immediately
2. Implement proper RLS policies with user authentication
3. Consider moving to authenticated API endpoints instead of direct DB access

### 2.2 Sensitive Data in LocalStorage
**Files:** All store files use localStorage persistence

**Data Stored Unencrypted in LocalStorage:**
```javascript
// settingsStore.js - SENSITIVE DATA
localStorage.setItem('tell_settings', JSON.stringify({
    company: { /* company info */ },
    bankDetails: {
        bankName, accountName, accountNumber, swiftCode // SENSITIVE!
    },
    taxInfo: { taxNumber, registrationNumber },
    aiSettings: {
        anthropicKey, // API KEYS IN LOCALSTORAGE!
        openaiKey     // API KEYS IN LOCALSTORAGE!
    }
}));

// clientStore.js - CLIENT DATA
localStorage.setItem('tell_clients', JSON.stringify(clients));

// quoteStore.js - QUOTE DATA
localStorage.setItem('tell_quote', JSON.stringify(quote));
```

**Impact:** HIGH
- API keys stored in plain text (Anthropic, OpenAI)
- Bank account details unencrypted
- Client contact information exposed
- Tax information accessible
- Any XSS vulnerability would expose all data
- Shared computer risk
- Browser extensions can read localStorage

**Fix Required:**
```javascript
// ENCRYPT SENSITIVE DATA
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = await deriveKeyFromSession();

function saveEncrypted(key, data) {
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        ENCRYPTION_KEY
    ).toString();
    localStorage.setItem(key, encrypted);
}

// NEVER store API keys client-side
// Use backend proxy for API calls
```

### 2.3 API Keys Exposed to Client Browser
**Files:**
- `/Users/tom/quote/src/utils/proposalGenerator.js` (line 151)
- `/Users/tom/quote/src/utils/imageGenerator.js` (line 97)

```javascript
// AI KEYS SENT FROM BROWSER - VULNERABLE
const response = await fetch('https://api.anthropic.com/v1/messages', {
    headers: {
        'x-api-key': apiKey, // USER'S API KEY EXPOSED IN BROWSER
        'anthropic-dangerous-direct-browser-access': 'true' // RED FLAG!
    }
});

// OpenAI key also exposed
fetch('https://api.openai.com/v1/images/generations', {
    headers: {
        'Authorization': `Bearer ${openaiKey}` // EXPOSED!
    }
});
```

**Vulnerabilities:**
- API keys visible in browser Network tab
- Keys can be extracted and used maliciously
- No rate limiting on client side
- API costs can be abused
- Anthropic header `anthropic-dangerous-direct-browser-access: true` is a security warning

**Impact:** CRITICAL
- Exposed API keys can be used to:
  - Rack up unlimited API costs on your accounts
  - Exhaust API quotas
  - Access your API usage history
  - Potentially access other projects using same key

**Fix Required:**
```javascript
// IMPLEMENT BACKEND PROXY
// Backend endpoint: POST /api/generate-proposal
// Backend handles API keys securely
// Backend implements rate limiting
// Backend validates requests

// Client code:
const response = await fetch('/api/generate-proposal', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ quote, settings })
});
```

---

## 3. SUPABASE SECURITY ARCHITECTURE

### 3.1 Row Level Security (RLS) - Completely Disabled
**File:** `/Users/tom/quote/supabase-schema.sql` (lines 95-107)

**Current State:**
```sql
-- RLS ENABLED BUT POLICIES ARE OPEN
alter table quotes enable row level security;

-- ALLOWS ANYONE WITH ANON KEY TO DO ANYTHING
create policy "Allow all quotes" on quotes for all using (true) with check (true);
```

**This is security theater** - RLS is enabled but policies allow all operations.

**Impact:** CRITICAL
- Zero tenant isolation
- Anyone can read/write/delete all data
- No audit trail of who accessed what
- Cannot implement multi-user collaboration safely

**Proper RLS Implementation Required:**
```sql
-- EXAMPLE: Proper RLS with Supabase Auth
create policy "Users can read own org quotes"
    on quotes for select
    using (auth.uid() = user_id OR org_id = get_user_org());

create policy "Users can insert own quotes"
    on quotes for insert
    with check (auth.uid() = user_id);

create policy "Users can update own quotes"
    on quotes for update
    using (auth.uid() = user_id);
```

### 3.2 No Database Audit Trail
**Missing:** Audit logging for data modifications

**Impact:** MEDIUM
- No record of who changed what
- Cannot track data breaches
- Cannot recover from malicious modifications
- No compliance trail

**Fix Required:**
```sql
-- Implement audit logging
create table audit_log (
    id uuid primary key default uuid_generate_v4(),
    table_name text not null,
    record_id uuid not null,
    action text not null, -- INSERT, UPDATE, DELETE
    user_id uuid,
    old_data jsonb,
    new_data jsonb,
    timestamp timestamptz default now()
);

-- Trigger function for auto-logging
create or replace function audit_trigger_func()
returns trigger as $$
begin
    insert into audit_log (table_name, record_id, action, user_id, old_data, new_data)
    values (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(),
            row_to_json(OLD), row_to_json(NEW));
    return NEW;
end;
$$ language plpgsql;
```

### 3.3 No Data Backup Strategy
**Missing:** Automated backups and recovery procedures

**Current State:**
- Manual export functions exist (clientStore.js)
- No automated daily backups
- No point-in-time recovery
- No disaster recovery plan

**Fix Required:**
1. Enable Supabase automatic backups (check plan)
2. Implement daily export job to external storage
3. Test restore procedures quarterly
4. Document recovery SLA

---

## 4. INPUT VALIDATION & XSS PROTECTION

### 4.1 No Server-Side Validation
**Impact:** MEDIUM

Since all validation is client-side, malicious actors can bypass:
- Form validation
- Data type constraints
- Length limits
- Character restrictions

**Files Affected:**
- All form inputs in pages/
- All store mutations

**Fix Required:**
```javascript
// Backend validation example
import { z } from 'zod';

const quoteSchema = z.object({
    quoteNumber: z.string().max(50).regex(/^[A-Z0-9-]+$/),
    client: z.object({
        company: z.string().min(1).max(200),
        email: z.string().email().optional(),
    }),
    project: z.object({
        title: z.string().min(1).max(300),
    })
});

// Validate before DB insert
const validated = quoteSchema.parse(quoteData);
```

### 4.2 XSS Risk Assessment
**Status:** LOW RISK (React auto-escapes by default)

**Good News:**
- No `dangerouslySetInnerHTML` found in codebase
- No `eval()` or `Function()` constructor usage
- React automatically escapes JSX output

**Potential Risks:**
- User-generated content in proposals/quotes
- File upload handling (if implemented)
- PDF generation with user content

**Recommendation:**
- Continue avoiding `dangerouslySetInnerHTML`
- Sanitize all user input before PDF generation
- Use Content Security Policy headers

### 4.3 Content Security Policy (CSP)
**Status:** NOT IMPLEMENTED

**Fix Required:**
Add to index.html or configure in hosting:
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self'
        https://*.supabase.co
        https://api.anthropic.com
        https://api.openai.com
        https://api.exchangerate-api.com;
    font-src 'self' data:;
">
```

---

## 5. API SECURITY

### 5.1 No Rate Limiting
**Files:** All external API calls

**Current State:**
- No rate limiting on Anthropic API calls
- No rate limiting on OpenAI API calls
- No rate limiting on ExchangeRate API calls
- Auto-save runs every 30 seconds without throttling

**Impact:** MEDIUM
- API costs can spiral out of control
- Quota exhaustion possible
- No protection against abuse

**Fix Required:**
```javascript
// Implement rate limiting
import { RateLimiter } from 'limiter';

const aiLimiter = new RateLimiter({
    tokensPerInterval: 10,
    interval: 'minute'
});

async function generateProposal(quote, settings) {
    await aiLimiter.removeTokens(1); // Throws if limit exceeded
    // ... make API call
}

// Server-side rate limiting
// Use Express-rate-limit or similar
```

### 5.2 Error Information Disclosure
**Files:** Various API call handlers

**Current Code:**
```javascript
catch (error) {
    console.error('AI Proposal generation failed:', error);
    return {
        success: false,
        error: error.message, // EXPOSING ERROR DETAILS
    };
}
```

**Impact:** LOW
- Error messages may reveal system information
- Stack traces logged to console

**Fix Required:**
```javascript
// Generic error messages to users
catch (error) {
    console.error('AI generation failed:', error); // Server log only
    return {
        success: false,
        error: 'Generation failed. Please try again.' // Generic message
    };
}
```

### 5.3 CORS Configuration
**File:** `/Users/tom/quote/vite.config.js`

**Status:** Not explicitly configured (relies on browser defaults)

**Recommendation:**
```javascript
// vite.config.js
export default defineConfig({
    server: {
        cors: {
            origin: ['https://yourdomain.com'],
            credentials: true,
        }
    }
});
```

---

## 6. ENVIRONMENT VARIABLES & SECRETS MANAGEMENT

### 6.1 Secrets in Git Repository
**File:** `/Users/tom/quote/.env.local`

**Status:** CRITICAL IF COMMITTED TO GIT

Check git history:
```bash
git log --all --full-history -- .env.local
```

**If committed:**
1. All secrets are permanently in git history
2. Must rotate ALL keys immediately
3. Must use `git filter-branch` or BFG Repo-Cleaner to remove

**Current .gitignore:**
```
.env.local  # Good - should be ignored
```

**Verify:**
```bash
git status .env.local  # Should show as untracked/ignored
```

### 6.2 Build Artifacts Contain Secrets
**Impact:** CRITICAL

Vite bundles all `VITE_*` variables into built JavaScript:

```javascript
// In dist/assets/index-[hash].js you'll find:
const APP_PASSWORD = "your-secure-password";
const SUPABASE_URL = "https://deitlnfumugxcbxqqivk.supabase.co";
```

**Anyone can:**
1. View page source
2. Open bundled JS file
3. Search for password/keys
4. Extract all credentials

**Fix Required:**
- NEVER use `VITE_` prefix for secrets
- Move authentication to backend
- Use server-side environment variables only

---

## 7. DATA ARCHITECTURE REVIEW

### 7.1 Quote Versioning - NOT IMPLEMENTED
**Missing:** Quote history and version control

**Current State:**
- Quotes are overwritten on each update
- No version history
- Cannot track changes over time
- Cannot revert to previous versions
- No "draft vs sent vs approved" workflow

**Business Impact:**
- Lost historical pricing data
- Cannot track quote evolution
- Disputes cannot be resolved with evidence
- No audit trail for approvals

**Recommended Architecture:**
```sql
-- Version control for quotes
create table quote_versions (
    id uuid primary key default uuid_generate_v4(),
    quote_id uuid references quotes(id),
    version_number integer not null,
    created_by uuid references auth.users(id),
    created_at timestamptz default now(),
    snapshot jsonb not null, -- Full quote data
    change_summary text,
    is_current boolean default false
);

create unique index on quote_versions(quote_id, version_number);

-- Trigger to auto-version on update
create or replace function version_quote()
returns trigger as $$
begin
    -- Archive old version
    insert into quote_versions (quote_id, version_number, snapshot)
    select NEW.id,
           coalesce((select max(version_number) from quote_versions where quote_id = NEW.id), 0) + 1,
           row_to_json(OLD);
    return NEW;
end;
$$ language plpgsql;

create trigger auto_version before update on quotes
    for each row execute function version_quote();
```

### 7.2 Multi-User Collaboration - NOT SUPPORTED
**Missing:** Real-time collaboration features

**Current Limitations:**
- No user accounts (single password for all)
- No quote ownership
- No permission levels
- Last-write-wins conflicts
- No real-time updates

**Impact on Business:**
- Multiple users can overwrite each other's work
- No accountability (who made what changes?)
- Cannot delegate quote creation
- Cannot have approval workflows

**Recommended Architecture:**
```sql
-- User management (leverage Supabase Auth)
create table user_profiles (
    id uuid primary key references auth.users(id),
    name text not null,
    email text unique not null,
    role text not null, -- 'admin', 'manager', 'viewer'
    organization_id uuid references organizations(id),
    created_at timestamptz default now()
);

-- Organization/tenant isolation
create table organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    settings jsonb default '{}'
);

-- Add ownership to quotes
alter table quotes add column user_id uuid references auth.users(id);
alter table quotes add column organization_id uuid references organizations(id);

-- RLS policies for multi-tenant
create policy "Users see own org quotes"
    on quotes for select
    using (organization_id = (select organization_id from user_profiles where id = auth.uid()));
```

### 7.3 Data Backup and Recovery - INSUFFICIENT

**Current State:**
```javascript
// clientStore.js - Manual export only
exportData: () => {
    const data = { clients, savedQuotes };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    // Downloads JSON file
}
```

**Issues:**
- Manual process (users forget)
- No automation
- No scheduled backups
- No off-site storage
- No backup versioning
- No test restore procedures

**Recommended Implementation:**

```javascript
// Backend backup service
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import cron from 'node-cron';

// Daily backup at 2 AM
cron.schedule('0 2 * * *', async () => {
    const { data: quotes } = await supabase.from('quotes').select('*');
    const { data: clients } = await supabase.from('clients').select('*');
    const { data: rateCards } = await supabase.from('rate_cards').select('*');

    const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: { quotes, clients, rateCards }
    };

    const s3 = new S3Client({ region: 'us-east-1' });
    await s3.send(new PutObjectCommand({
        Bucket: 'quote-backups',
        Key: `backups/${new Date().toISOString()}-backup.json.gz`,
        Body: gzip(JSON.stringify(backup)),
        StorageClass: 'GLACIER' // Cost-effective for long-term
    }));

    console.log('Backup completed:', backup.timestamp);
});

// Restore function
async function restoreBackup(backupKey) {
    // Download from S3
    // Validate data
    // Create restore point (backup current state)
    // Import data
    // Verify integrity
}
```

### 7.4 Data Model Improvements

**Current Schema Issues:**

1. **Denormalized Client Data** (quotes.client JSONB)
   - Client info duplicated in every quote
   - Updates to client don't propagate to quotes
   - No referential integrity

   **Fix:**
   ```sql
   alter table quotes add column client_id uuid references clients(id);
   -- Keep client snapshot for historical accuracy
   alter table quotes add column client_snapshot jsonb;
   ```

2. **No Indexes on Search Fields**
   ```sql
   -- Add full-text search
   alter table quotes add column search_vector tsvector;

   create index quotes_search_idx on quotes using gin(search_vector);

   -- Update trigger
   create trigger quotes_search_update before insert or update on quotes
       for each row execute function update_search_vector();
   ```

3. **No Soft Deletes**
   ```sql
   alter table quotes add column deleted_at timestamptz;
   alter table clients add column deleted_at timestamptz;

   create index quotes_active_idx on quotes(deleted_at) where deleted_at is null;
   ```

---

## 8. SECURITY RECOMMENDATIONS BY PRIORITY

### IMMEDIATE (Fix within 24 hours)

1. **Rotate Supabase Anon Key**
   - Current key is exposed in client bundle
   - Generate new key in Supabase dashboard
   - Update .env.local (keep secure)

2. **Implement Proper RLS Policies**
   ```sql
   -- Revoke public access
   drop policy "Allow all quotes" on quotes;
   drop policy "Allow all clients" on clients;

   -- Implement auth-based policies
   -- (See section 3.1 for examples)
   ```

3. **Remove Password from Client Bundle**
   - Implement backend authentication
   - Remove `VITE_APP_PASSWORD`
   - Use Supabase Auth or custom auth service

4. **Move API Keys to Backend**
   - Create backend proxy for Anthropic/OpenAI calls
   - Remove API keys from client-side storage
   - Implement rate limiting

### HIGH PRIORITY (Fix within 1 week)

5. **Implement Session Management**
   - Use JWT tokens with expiration
   - Add session timeout (8 hours)
   - Implement secure token storage

6. **Encrypt Sensitive LocalStorage Data**
   - Bank details
   - Tax information
   - Client contact info

7. **Add Audit Logging**
   - Track all data modifications
   - Log authentication attempts
   - Monitor API usage

8. **Implement Quote Versioning**
   - Track quote changes
   - Enable version comparison
   - Support rollback

### MEDIUM PRIORITY (Fix within 1 month)

9. **Multi-User Support**
   - Individual user accounts
   - Role-based permissions
   - Quote ownership tracking

10. **Automated Backups**
    - Daily backup jobs
    - Off-site storage
    - Tested restore procedures

11. **Rate Limiting**
    - Login attempt limiting
    - API call throttling
    - Auto-save debouncing

12. **Content Security Policy**
    - Restrict script sources
    - Prevent XSS attacks
    - Monitor violations

### LOW PRIORITY (Ongoing)

13. **Security Monitoring**
    - Log analysis
    - Anomaly detection
    - Security alerts

14. **Penetration Testing**
    - Quarterly security audits
    - Third-party assessment
    - Vulnerability scanning

15. **Compliance Documentation**
    - Data handling procedures
    - Privacy policy
    - Terms of service

---

## 9. COMPLIANCE CONSIDERATIONS

### 9.1 Data Privacy (GDPR/PDPA)

**Current State:** NOT COMPLIANT

**Issues:**
- No privacy policy
- No consent tracking
- No data deletion workflow
- No data export for users
- No data retention policies

**Required:**
1. Implement user consent tracking
2. Add data deletion endpoints
3. Document data retention periods
4. Provide data export functionality
5. Appoint data protection officer

### 9.2 Financial Data (PCI DSS)

**Current State:** NOT STORING CARD DATA (Good)

**Bank Account Storage:**
- Storing bank account numbers in plain text
- Should be encrypted at rest
- Access should be logged
- Should be restricted to authorized users

---

## 10. DEPLOYMENT SECURITY

### 10.1 Production Checklist

- [ ] All secrets removed from client bundle
- [ ] Supabase RLS policies implemented
- [ ] HTTPS enforced
- [ ] Content Security Policy configured
- [ ] Rate limiting implemented
- [ ] Error handling doesn't leak info
- [ ] Logging configured (errors only, no sensitive data)
- [ ] Backup system operational
- [ ] Monitoring and alerts configured
- [ ] Incident response plan documented

### 10.2 Environment Separation

**Required:**
```bash
# Development
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_API_BASE_URL=http://localhost:3000

# Staging
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_API_BASE_URL=https://staging-api.yourdomain.com

# Production
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## 11. ARCHITECTURE RECOMMENDATIONS

### 11.1 Recommended Technology Stack

**Current:** Frontend-only with direct Supabase access
**Recommended:** Full-stack with API layer

```
┌─────────────────┐
│   React App     │ (Frontend only - no secrets)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Backend API   │ (Node.js/Express)
│  - Auth         │ - Handles all secrets
│  - Rate Limit   │ - Validates requests
│  - Validation   │ - Proxies external APIs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │ (RLS enabled)
└─────────────────┘

External APIs:
- Anthropic AI (via backend proxy)
- OpenAI (via backend proxy)
- Exchange Rates (cached server-side)
```

### 11.2 Migration Path

**Phase 1: Immediate Security (1 week)**
1. Implement Supabase Auth
2. Implement proper RLS policies
3. Remove client-side password
4. Rotate all exposed keys

**Phase 2: Backend API (2-4 weeks)**
1. Build Node.js/Express backend
2. Migrate AI API calls to backend
3. Implement rate limiting
4. Add proper validation

**Phase 3: Enhanced Features (1-2 months)**
1. Implement quote versioning
2. Add multi-user support
3. Build approval workflows
4. Add real-time collaboration

**Phase 4: Enterprise (Ongoing)**
1. Advanced analytics
2. Integration APIs
3. Mobile apps
4. Advanced reporting

---

## 12. CODE EXAMPLES FOR FIXES

### 12.1 Backend Authentication Service

```javascript
// server/auth.js
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Service key - server only!
);

export async function login(email, password) {
    // Use Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw new Error('Invalid credentials');

    // Generate JWT
    const token = jwt.sign(
        { userId: data.user.id, email: data.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    return { token, user: data.user };
}

export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

// Middleware
export function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        req.user = verifyToken(token);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
```

### 12.2 Secure AI Proxy

```javascript
// server/api/ai.js
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many AI requests, please try again later'
});

// Generate proposal
router.post('/generate-proposal', requireAuth, aiLimiter, async (req, res) => {
    try {
        const { quote, settings } = req.body;

        // Validate input
        if (!quote || !quote.quoteNumber) {
            return res.status(400).json({ error: 'Invalid quote data' });
        }

        // Call Anthropic API (key stays on server)
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY, // SERVER ONLY
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{ role: 'user', content: createPrompt(quote, settings) }]
            })
        });

        const data = await response.json();

        // Log usage
        await logApiUsage(req.user.userId, 'anthropic', 'generate-proposal');

        res.json({ success: true, data });
    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ error: 'Generation failed' });
    }
});

export default router;
```

### 12.3 Proper Supabase RLS

```sql
-- Enable Supabase Auth
-- Users managed through Supabase Auth UI

-- User profiles table
create table user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    organization_id uuid references organizations(id),
    role text not null check (role in ('admin', 'editor', 'viewer')),
    created_at timestamptz default now()
);

-- RLS for quotes
create policy "Users can view org quotes"
    on quotes for select
    using (
        exists (
            select 1 from user_profiles
            where id = auth.uid()
            and organization_id = quotes.organization_id
        )
    );

create policy "Editors can create quotes"
    on quotes for insert
    with check (
        exists (
            select 1 from user_profiles
            where id = auth.uid()
            and organization_id = quotes.organization_id
            and role in ('admin', 'editor')
        )
    );

create policy "Editors can update quotes"
    on quotes for update
    using (
        exists (
            select 1 from user_profiles
            where id = auth.uid()
            and organization_id = quotes.organization_id
            and role in ('admin', 'editor')
        )
    );

create policy "Admins can delete quotes"
    on quotes for delete
    using (
        exists (
            select 1 from user_profiles
            where id = auth.uid()
            and organization_id = quotes.organization_id
            and role = 'admin'
        )
    );
```

---

## CONCLUSION

This application has significant security vulnerabilities that must be addressed before production deployment. The most critical issues are:

1. **Authentication bypass** - Password exposed in client bundle
2. **Database exposure** - Open RLS policies allow anyone to read/write all data
3. **API key exposure** - Anthropic and OpenAI keys in browser
4. **No audit trail** - Cannot track who did what
5. **No versioning** - Quote history is lost

**Estimated Effort to Fix Critical Issues:** 2-4 weeks
**Recommended Team:** 1 Backend Developer, 1 Security Consultant

**Next Steps:**
1. Immediately rotate Supabase anon key
2. Review git history for committed secrets
3. Implement backend authentication service
4. Deploy proper RLS policies
5. Build API proxy for external services

This audit provides a roadmap to transform this functional prototype into a secure, production-ready application.

---

**Files Referenced:**
- `/Users/tom/quote/.env.local`
- `/Users/tom/quote/src/store/authStore.js`
- `/Users/tom/quote/src/store/settingsStore.js`
- `/Users/tom/quote/src/store/quoteStore.js`
- `/Users/tom/quote/src/store/clientStore.js`
- `/Users/tom/quote/src/store/rateCardStore.js`
- `/Users/tom/quote/src/lib/supabase.js`
- `/Users/tom/quote/src/utils/proposalGenerator.js`
- `/Users/tom/quote/src/utils/imageGenerator.js`
- `/Users/tom/quote/src/utils/currency.js`
- `/Users/tom/quote/supabase-schema.sql`
- `/Users/tom/quote/vite.config.js`
- `/Users/tom/quote/package.json`
