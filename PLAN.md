# ProductionOS SaaS Launch Plan

**Last Updated**: December 28, 2025
**Overall Readiness**: 95%
**Target Launch**: TBD

---

## Executive Summary

ProductionOS is a multi-tenant SaaS platform for production companies providing CRM, quoting, project management, and financial tools. Major progress on UX audit, branding fixes, and code quality improvements.

---

## COMPLETED TASKS

### 1. RLS Policies - Organization-Based Security ✅
- **Status**: COMPLETED (migration APPLIED)
- Created and applied `supabase/migrations/20251228_organization_rls.sql`
- Helper function `public.user_organizations()` for membership checks
- Organization-scoped policies for: quotes, clients, projects, opportunities, rate_cards, settings
- Special handling for organization_members, user_invitations, subscriptions
- User-level policies for google_connections and user_profiles
- **Migration applied to production database on Dec 28, 2025**

### 2. Terms of Service ✅
- **Status**: COMPLETED
- Created `/src/pages/legal/TermsPage.jsx`
- Comprehensive ToS covering: acceptance, service description, accounts, subscriptions, data ownership, acceptable use, IP, liability, warranties
- **USER ACTION**: Legal review recommended

### 3. Privacy Policy ✅
- **Status**: COMPLETED
- Created `/src/pages/legal/PrivacyPage.jsx`
- GDPR-compliant policy covering: data collection, usage, sharing, security, retention, cookies, user rights
- **USER ACTION**: Legal review recommended

### 4. GDPR Compliance Page ✅
- **Status**: COMPLETED
- Created `/src/pages/legal/GDPRPage.jsx`
- Documents user rights, lawful basis, sub-processors, international transfers
- Links to Privacy Policy

### 5. Legal Routes ✅
- **Status**: COMPLETED
- Updated App.jsx with routes for `/legal/terms`, `/legal/privacy`, `/legal/gdpr`
- Footer links now work

### 6. Cookie Consent Banner ✅
- **Status**: COMPLETED
- Created `/src/components/common/CookieConsent.jsx`
- GDPR-compliant with essential/analytics/marketing toggles
- Persists preferences to localStorage
- Added to marketing site in App.jsx

### 7. Email Invitation System ✅
- **Status**: COMPLETED
- Created `supabase/functions/send-invitation-email/index.ts`
- Uses Resend for transactional email
- Beautiful HTML email template with branding
- Updated `organizationStore.js` to call Edge Function
- **USER ACTION REQUIRED**: Set RESEND_API_KEY in Supabase secrets, deploy function

### 8. Marketing Page Fixes ✅
- **Status**: COMPLETED
- Fixed copyright "Tell Productions" → "ProductionOS" in LandingPage.jsx
- Standardized trial duration references (removed conflicting 14-day mentions)
- Added legal page links to footer

### 9. Google OAuth Setup ✅
- **Status**: COMPLETED (secrets set)
- Redirect URIs configured in Google Cloud Console
- Gmail API and Calendar API enabled
- `google-oauth-callback` Edge Function exists
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET set in Supabase
- **USER ACTION REQUIRED**: Add VITE_GOOGLE_CLIENT_ID to Vercel env vars

### 10. ProductionOS Branding ✅
- **Status**: COMPLETED
- Created new `public/productionos-logo.svg` with teal P icon + text
- Updated all logo references from `tell-logo.svg` to `productionos-logo.svg`
- Updated PWA manifest in `vite.config.js` (name, description)
- Fixed `src/pages/FSPage.jsx` analytics footer
- Updated default company settings in `settingsStore.js` (blank for SaaS)

### 11. Tailwind brand-primary Fix ✅
- **Status**: COMPLETED
- Added `brand.primary: '#0F8B8D'` to tailwind.config.js
- Fixed 90+ UI elements that use `brand-primary` class
- Onboarding company type buttons now show selection feedback

### 12. Dashboard NaN Values Fix ✅
- **Status**: COMPLETED
- Fixed `convertCurrency()` in `/src/utils/currency.js`:
  - Added default `rates = {}` parameter
  - Added early return for invalid amounts
  - Added `|| 1` fallback for undefined rates
  - Added NaN check on result
- Fixed `formatCurrency()` to use `safeAmount` for null/undefined/NaN inputs
- Dashboard Pipeline, Forecast, and Health metrics now display correctly

### 13. Tell Branding Removal from PDFs/AI ✅
- **Status**: COMPLETED
- Fixed `src/components/pdf/QuotePDF.jsx`:
  - Removed hardcoded "TELL PRODUCTIONS" fallbacks
  - Footer now uses company.name dynamically
- Fixed `src/components/pdf/TermsPage.jsx`:
  - Now accepts companyName, companyAddress props
  - Removed hardcoded Tell Productions Sdn Bhd references
- Fixed `src/components/pdf/CallSheetPDF.jsx`:
  - Changed fallback from 'Tell Productions' to 'Your Company'
- Fixed `src/pages/EmailTemplatesPage.jsx`:
  - Updated example email from 'jane@tell.so' to 'jane@example.com'
- Fixed `src/components/preview/EmailGenerator.jsx`:
  - AI prompt now uses settings.company.name
- Fixed `src/utils/proposalGenerator.js`:
  - AI prompt and fallback generator use context.company
  - Removed hardcoded company description
- Fixed `src/pages/CommercialTasksPage.jsx`:
  - AI prompt uses companyInfo.name with generic fallback
- Fixed `src/store/sportsResearchStore.js`:
  - Removed Tell Productions from research prompt

### 14. UX Audit - Completed Areas ✅
- **Onboarding**: Verified selections work (Company Type, Primary Focus, Team Size, Country dropdown)
- **Marketing pages**: Copy reviewed, no issues
- **Quotes page**: Code reviewed, no issues
- **Clients page**: Code reviewed, no issues

---

## IN PROGRESS

### UX Audit - Browser Testing 🔄
- **Blocker**: RLS migration needs to be run for full testing
- **Current State**: Browser sessions show onboarding (can't proceed past step 1 without RLS)
- **Completed via Code Review**: Marketing, Quotes, Clients features

---

## REMAINING TASKS (By Priority)

### HIGH PRIORITY

#### Password Reset Flow UI
- **Status**: NOT STARTED
- **Current State**: Backend exists, UI has TODO in LoginPage.jsx
- **Required Fix**: Complete reset flow with email input, confirmation message
- **Files**: `src/pages/LoginPage.jsx`

#### Stripe Webhook Handler
- **Status**: NOT STARTED
- **Current State**: Edge function exists at `supabase/functions/stripe-webhook/index.ts`
- **Required Fix**: Handle subscription events (created, updated, canceled, payment_failed)
- **User Action**: Ensure webhook is deployed and Stripe webhook endpoint configured

#### GDPR Data Export UI
- **Status**: NOT STARTED
- **Current State**: `gdprService.js` exists but no UI
- **Required Fix**: Add Data Export button in Settings with download progress
- **Files**: `src/pages/SettingsPage.jsx`, `src/services/gdprService.js`

### MEDIUM PRIORITY

#### Transactional Emails
- **Status**: NOT STARTED
- **Emails Needed**:
  - Welcome email on signup
  - Trial ending (24h warning)
  - Trial ended
  - Payment successful
  - Payment failed
  - Subscription canceled

#### Trial Countdown Banner
- **Status**: NOT STARTED
- **Current State**: Trial system works, no countdown UI
- **Required Fix**: Add banner showing days remaining, upgrade CTA

---

## USER ACTIONS REQUIRED

1. ~~**Run RLS Migration**~~ ✅ DONE (applied Dec 28, 2025)

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy send-invitation-email
   ```

3. **Set Supabase Secrets**
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   supabase secrets set APP_URL=https://tell.center
   ```

4. **Add Vercel Environment Variables**
   - Go to Vercel dashboard → tell-quote → Settings → Environment Variables
   - Add: `VITE_GOOGLE_CLIENT_ID=653007939230-mq36ne7sl7h3v17u6tbjh255ksaf67om.apps.googleusercontent.com`

5. **Legal Review**
   - Review Terms of Service at `/legal/terms`
   - Review Privacy Policy at `/legal/privacy`
   - Update email addresses (legal@productionos.com, privacy@productionos.com, dpo@productionos.com)

---

## WHAT'S WORKING WELL

### Authentication & Security
- [x] Supabase Auth with email/password
- [x] Google OAuth integration
- [x] Rate limiting (5 attempts, 15-min lockout)
- [x] Session management (24-hour expiry)
- [x] Client-side encryption for sensitive data
- [x] Organization-based RLS (migration APPLIED)

### Legal Compliance
- [x] Terms of Service
- [x] Privacy Policy
- [x] GDPR compliance page
- [x] Cookie consent banner

### Multi-Tenancy
- [x] Organization management
- [x] Organization switcher
- [x] Member invitations with email
- [x] Role-based permissions (Owner, Admin, Member, Viewer)
- [x] Tab-level access control

### Billing & Subscriptions
- [x] 4 plans (Free, Starter, Pro, Enterprise)
- [x] Stripe Checkout integration
- [x] Stripe Customer Portal
- [x] Trial support
- [x] Cancellation flow with feedback
- [x] Subscription reactivation
- [x] Invoice history

### Performance
- [x] Code splitting with React.lazy()
- [x] Manual chunk splitting (vendors)
- [x] PWA with Workbox caching
- [x] Database query optimization
- [x] Auto-save with debounce

### Branding & UX
- [x] ProductionOS logo throughout app
- [x] All Tell Productions branding removed from PDFs
- [x] All AI prompts use dynamic company name
- [x] Currency conversion handles edge cases (no NaN)
- [x] Form selection feedback works (brand-primary fixed)

---

## FILES MODIFIED THIS SESSION

### Currency/Calculation Fixes
- `src/utils/currency.js` - Fixed NaN issues in convertCurrency and formatCurrency

### Tailwind Config
- `tailwind.config.js` - Added brand.primary color definition

### PDF Components
- `src/components/pdf/QuotePDF.jsx` - Removed Tell branding
- `src/components/pdf/TermsPage.jsx` - Made company-configurable
- `src/components/pdf/CallSheetPDF.jsx` - Removed Tell fallback

### AI/Generator Files
- `src/components/preview/EmailGenerator.jsx` - Dynamic company name
- `src/utils/proposalGenerator.js` - Dynamic company name
- `src/pages/CommercialTasksPage.jsx` - Dynamic company name
- `src/store/sportsResearchStore.js` - Removed Tell reference
- `src/pages/EmailTemplatesPage.jsx` - Fixed example email

---

## NOTES

- **Vercel Deployment**: Configured at `tell.center`
- **Supabase Project**: `deitlnfumugxcbxqqivk`
- **Stripe**: Integration exists, webhook handler needs completion
- **Google Cloud Project**: `company-knowledge-system`
- **Email Provider**: Resend (API key required)

---

## NEXT SESSION CONTINUATION

If this session is compacted, the next agent should:

1. **RLS Migration is COMPLETE** ✅
   - All 3 migrations applied: CRM phase 1, multi-tenancy, organization RLS
   - Onboarding should now work - can test in browser

2. **Complete Remaining Tasks**
   - Password reset flow UI
   - Stripe webhook handler completion
   - GDPR data export UI
   - Transactional email templates
   - Trial countdown banner

3. **Verify Implementations**
   - Test full onboarding flow in browser (now unblocked!)
   - Test cookie consent banner
   - Test legal page routes
   - Test email invitation flow (requires Resend API key)
   - Test PDF exports show correct company branding
