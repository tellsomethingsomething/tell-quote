# ProductionOS Soft Launch Checklist

Pre-launch verification checklist for beta users. Complete all items before inviting users.

---

## Pre-Launch Verification

### Infrastructure
- [ ] Production environment deployed to productionos.io
- [ ] DNS and SSL certificates valid
- [ ] Supabase project in production mode
- [ ] All edge functions deployed and tested
- [ ] Environment variables configured correctly
- [ ] Stripe in LIVE mode with correct API keys

### Monitoring Active
- [ ] Sentry error tracking active
- [ ] Health check endpoint responding (/functions/v1/health-check)
- [ ] Plausible analytics tracking pageviews
- [ ] Admin dashboard showing metrics

---

## Critical Flows Verified

### Authentication
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] Password reset email sends and works
- [ ] Session persists on refresh
- [ ] Logout clears session

### Billing (Stripe Live Mode)
- [ ] Individual plan checkout works (USD, GBP, EUR)
- [ ] Team plan checkout works (USD, GBP, EUR)
- [ ] AI token purchase works
- [ ] Customer portal accessible
- [ ] Subscription cancellation works
- [ ] Subscription reactivation works
- [ ] Webhooks processing correctly:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] invoice.payment_failed

### Trial Flow
- [ ] New users start with trial
- [ ] Trial countdown displays correctly
- [ ] Trial expiration shows read-only mode
- [ ] Upgrade prompt appears when trial expires

### Core Features
- [ ] Quote creation works
- [ ] Quote PDF export works
- [ ] Client management works
- [ ] Opportunity pipeline works
- [ ] Invoice generation works
- [ ] Team invitation works

---

## Legal & Compliance

### Pages Live
- [ ] Terms of Service (/legal/terms)
- [ ] Privacy Policy (/legal/privacy)
- [ ] GDPR Policy (/legal/gdpr)
- [ ] Cookie Policy (/legal/cookies)

### Functionality
- [ ] Cookie consent banner shows
- [ ] Cookie preferences can be managed
- [ ] Data export works (GDPR)
- [ ] Account deletion works (with 30-day grace)

---

## Support Ready

### Documentation
- [ ] Help center articles published
- [ ] FAQ section populated
- [ ] Getting started guide complete
- [ ] Video tutorials (optional for soft launch)

### Contact
- [ ] Support email configured
- [ ] Help widget functional (if enabled)
- [ ] Bug reporting flow works

---

## Security Verified

### Authentication
- [ ] Rate limiting active (5 failed = 15min lockout)
- [ ] Password requirements enforced (8+ chars, mixed)
- [ ] Session timeout after 24 hours
- [ ] PKCE OAuth flow verified

### Database
- [ ] RLS policies active on all tables
- [ ] Service role key not exposed to client
- [ ] All API calls use anon key

### Data
- [ ] Sensitive data encrypted
- [ ] No API keys in client code
- [ ] HTTPS enforced everywhere

---

## Performance Verified

### Load Times
- [ ] Dashboard loads < 3 seconds
- [ ] Quote editor responsive
- [ ] PDF generation < 5 seconds
- [ ] No console errors

### Mobile
- [ ] Login page works on mobile
- [ ] Dashboard accessible on mobile
- [ ] Core features usable on mobile

---

## Beta User Preparation

### Invitations
- [ ] Beta user list prepared
- [ ] Invitation email template ready
- [ ] Welcome email configured
- [ ] Onboarding wizard tested

### Feedback
- [ ] Feedback collection method decided
- [ ] Bug reporting channel established
- [ ] Response SLA defined

### Rollback Plan
- [ ] Database backup available
- [ ] Previous deploy available for rollback
- [ ] Emergency contacts listed

---

## Go/No-Go Decision

| Category | Status | Owner |
|----------|--------|-------|
| Infrastructure | [ ] Ready | |
| Authentication | [ ] Ready | |
| Billing | [ ] Ready | |
| Core Features | [ ] Ready | |
| Legal | [ ] Ready | |
| Support | [ ] Ready | |
| Security | [ ] Ready | |
| Performance | [ ] Ready | |

### Final Approval

- [ ] All categories marked Ready
- [ ] Stakeholder sign-off obtained
- [ ] Launch date confirmed

---

## Post-Launch Monitoring (First 48 Hours)

### Metrics to Watch
- [ ] Error rate in Sentry
- [ ] Signup completion rate
- [ ] Payment success rate
- [ ] User feedback/complaints

### Response Plan
- [ ] On-call person assigned
- [ ] Escalation path defined
- [ ] Communication channel for issues

---

## Launch Day Actions

1. [ ] Final health check all systems
2. [ ] Verify Stripe live mode active
3. [ ] Send beta invitations
4. [ ] Monitor Sentry for errors
5. [ ] Monitor Stripe for payments
6. [ ] Respond to user feedback within 2 hours
7. [ ] Document any issues encountered
8. [ ] End-of-day status check

---

**Launch Date:** ________________

**Approved By:** ________________

**Date:** ________________
