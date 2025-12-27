# ProductionOS Launch Plan

**Current Status:** 68% Launch-Ready
**Target:** 100% Production SaaS
**Created:** December 27, 2025

---

## PHASE 1: CRITICAL SECURITY (Day 1)
**Impact: 68% → 83%**

### 1.1 Run RLS Security Migration
- [ ] Open Supabase SQL Editor
- [ ] Execute `/supabase/migrations/20251227_fix_rls_security.sql`
- [ ] Verify no more `USING(true)` policies exist
- [ ] Test: Create 2 users, verify data isolation

### 1.2 Move API Keys to Backend
- [ ] Create Supabase Edge Function for Anthropic API calls
- [ ] Remove `VITE_ANTHROPIC_API_KEY` from `.env.local`
- [ ] Update `settingsStore.js` to call edge function instead
- [ ] Remove client-side encryption (no longer needed)

### 1.3 Remove Fallback Password Auth
- [ ] Remove `VITE_APP_PASSWORD` from all `.env` files
- [ ] Remove fallback auth code from `authStore.js`
- [ ] Force Supabase Auth only

**Verification:**
- Run `SELECT * FROM pg_policies WHERE qual LIKE '%true%'` - should return 0
- Test multi-user data isolation

---

## PHASE 2: ONBOARDING FIXES (Day 2)
**Impact: 83% → 90%**

### 2.1 Fix Team Invite Email Sending
- [ ] Update `OnboardingWizard.jsx` handleComplete to call send-invitation-email edge function
- [ ] Create edge function if not exists: `supabase/functions/send-invitation-email`
- [ ] Test: Complete onboarding with team invite, verify email received

### 2.2 Add Email Validation to Team Invites
- [ ] Import `validateEmail` in `OnboardingWizard.jsx`
- [ ] Add validation on blur/submit for team invite emails
- [ ] Add duplicate email check within batch
- [ ] Show validation errors in UI

### 2.3 Fix Rate Card Validation
- [ ] Add minimum 1 rate required validation (or explicit skip)
- [ ] Show warning if proceeding with empty rates

**Verification:**
- Complete full onboarding flow
- Verify rate cards created in database
- Verify invitation email received

---

## PHASE 3: MARKETING PAGES (Day 3)
**Impact: 90% → 93%**

### 3.1 Create Blog Page
- [ ] Create `/src/pages/resources/BlogPage.jsx`
- [ ] Add route in `App.jsx`
- [ ] Design: Hero + blog post grid (can be placeholder posts)
- [ ] Add SEO meta tags

### 3.2 Create Templates Page
- [ ] Create `/src/pages/resources/TemplatesPage.jsx`
- [ ] Add route in `App.jsx`
- [ ] Design: Template gallery with download CTAs
- [ ] Add SEO meta tags

### 3.3 Create About Page
- [ ] Create `/src/pages/company/AboutPage.jsx`
- [ ] Add route in `App.jsx`
- [ ] Design: Company story, team, mission
- [ ] Add SEO meta tags

### 3.4 Create Contact Page
- [ ] Create `/src/pages/company/ContactPage.jsx`
- [ ] Add route in `App.jsx`
- [ ] Design: Contact form + support info
- [ ] Add SEO meta tags

### 3.5 Update Routes
- [ ] Remove catch-all redirects for `/resources/*` and `/company/*`
- [ ] Add proper routes for all 4 new pages

**Verification:**
- All footer links work
- All navbar links work
- No 404s or redirects to home

---

## PHASE 4: BILLING INTEGRATION (Days 4-5)
**Impact: 93% → 96%**

### 4.1 Stripe Setup
- [ ] Create Stripe account (if not exists)
- [ ] Get API keys (publishable + secret)
- [ ] Add `STRIPE_SECRET_KEY` to Supabase secrets
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` to `.env`

### 4.2 Create Checkout Edge Function
- [ ] Create `supabase/functions/create-checkout-session`
- [ ] Implement Stripe checkout session creation
- [ ] Handle trial period (14 days)
- [ ] Return checkout URL

### 4.3 Create Webhook Handler
- [ ] Create `supabase/functions/stripe-webhook`
- [ ] Handle `checkout.session.completed`
- [ ] Handle `customer.subscription.updated`
- [ ] Handle `customer.subscription.deleted`
- [ ] Update `subscriptions` table accordingly

### 4.4 Update Billing UI
- [ ] Update `BillingStep.jsx` to call checkout function
- [ ] Update Settings Billing tab to show subscription status
- [ ] Add plan upgrade/downgrade functionality
- [ ] Add cancel subscription option

### 4.5 Implement Plan Enforcement
- [ ] Add middleware to check subscription status
- [ ] Limit features based on plan (user count, etc.)
- [ ] Show upgrade prompts when limits reached

**Verification:**
- Complete test purchase with Stripe test mode
- Verify subscription created in database
- Verify plan limits enforced

---

## PHASE 5: DATA IMPORT (Day 6)
**Impact: 96% → 98%**

### 5.1 Create Import Edge Function
- [ ] Create `supabase/functions/parse-import-file`
- [ ] Support CSV parsing for clients
- [ ] Support CSV parsing for crew/contacts
- [ ] Support CSV parsing for equipment
- [ ] Return parsed data for preview

### 5.2 Update DataImportStep UI
- [ ] Add file upload handler (CSV/Excel)
- [ ] Show data preview before import
- [ ] Add field mapping UI
- [ ] Show import progress
- [ ] Handle errors gracefully

### 5.3 Create Import Processing
- [ ] Batch insert parsed records
- [ ] Handle duplicates (skip/update/error)
- [ ] Return import summary (success/failed counts)

**Verification:**
- Import sample CSV with 10 clients
- Verify all records created correctly
- Test error handling with malformed data

---

## PHASE 6: POLISH & COMPLIANCE (Day 7)
**Impact: 98% → 100%**

### 6.1 GDPR Compliance
- [ ] Create data export endpoint (download all user data as JSON)
- [ ] Create account deletion endpoint (cascade delete)
- [ ] Add "Delete my account" button in Settings
- [ ] Add "Export my data" button in Settings
- [ ] Implement audit logging triggers

### 6.2 Session Security
- [ ] Reduce session timeout from 24h to 4h
- [ ] Add logout-all-devices endpoint
- [ ] Add session timeout warning (5 min before expiry)
- [ ] Implement refresh token rotation

### 6.3 Final Security Hardening
- [ ] Add server-side rate limiting (Supabase function)
- [ ] Add login notification emails
- [ ] Implement concurrent session limits (max 3)
- [ ] Security headers in Vercel config

### 6.4 Performance & Monitoring
- [ ] Add error tracking (Sentry or similar)
- [ ] Add analytics (Plausible/PostHog)
- [ ] Optimize bundle size (check for unused deps)
- [ ] Add health check endpoint

### 6.5 Documentation
- [ ] Update README with deployment instructions
- [ ] Create API documentation for edge functions
- [ ] Document environment variables
- [ ] Create runbook for common issues

**Verification:**
- Full security audit passes
- GDPR export/delete works
- Error tracking captures test error
- All documentation complete

---

## LAUNCH CHECKLIST

### Pre-Launch (Day 8)
- [ ] All phases complete
- [ ] Full regression test of all features
- [ ] Test on mobile devices
- [ ] Test in multiple browsers
- [ ] Load testing (simulate 100 concurrent users)
- [ ] Backup database
- [ ] DNS configured for production domain
- [ ] SSL certificate active
- [ ] Environment variables set in production

### Launch Day
- [ ] Deploy to production
- [ ] Verify all features working
- [ ] Monitor error tracking
- [ ] Monitor performance metrics
- [ ] Have rollback plan ready

### Post-Launch (Week 1)
- [ ] Monitor user signups
- [ ] Address any reported issues
- [ ] Collect user feedback
- [ ] Plan iteration based on feedback

---

## TIMELINE SUMMARY

| Phase | Days | Cumulative % |
|-------|------|--------------|
| Phase 1: Security | Day 1 | 83% |
| Phase 2: Onboarding | Day 2 | 90% |
| Phase 3: Marketing | Day 3 | 93% |
| Phase 4: Billing | Days 4-5 | 96% |
| Phase 5: Data Import | Day 6 | 98% |
| Phase 6: Polish | Day 7 | 100% |
| Pre-Launch Testing | Day 8 | Ready |
| **LAUNCH** | Day 9 | **LIVE** |

---

## RESOURCE REQUIREMENTS

### Technical
- Supabase Pro plan (for edge functions)
- Stripe account
- Vercel Pro (optional, for analytics)
- Error tracking service (Sentry free tier)

### Time Estimate
- Developer hours: ~40-50 hours
- Testing hours: ~10-15 hours
- Total: ~8-9 working days

### Dependencies
- Stripe account approval
- Domain DNS access
- Production environment access

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| RLS migration breaks existing data | Test in staging first, have rollback SQL ready |
| Stripe integration delays | Can launch with "coming soon" billing, manual invoicing |
| Edge function cold starts | Use Supabase Pro for faster cold starts |
| Data import complexity | Start with CSV only, add Excel later |

---

## SUCCESS METRICS

### Launch Week
- [ ] 0 critical security vulnerabilities
- [ ] <1% error rate
- [ ] <3s page load time
- [ ] 10+ user signups

### Month 1
- [ ] 100+ active users
- [ ] 5+ paying customers
- [ ] <0.5% churn
- [ ] NPS > 30

---

*This plan will be updated as we progress through each phase.*
