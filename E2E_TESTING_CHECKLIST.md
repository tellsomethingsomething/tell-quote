# ProductionOS End-to-End Testing Checklist

> ## **PRODUCTION STATUS: VERIFIED (2026-01-02)**
> E2E testing completed. Production is now live.

This checklist covers all critical user flows that must be tested before launch.

## Pre-Launch Testing Status

- [ ] All tests below completed
- [ ] Critical bugs fixed
- [ ] Edge cases handled
- [ ] Mobile testing done

---

## 1. Authentication Flows

### Sign Up
- [ ] New user can sign up with email/password
- [ ] Password validation enforces: 8+ chars, uppercase, lowercase, number, special char
- [ ] Welcome email sent after signup
- [ ] User redirected to onboarding wizard
- [ ] Duplicate email shows appropriate error

### Login
- [ ] Existing user can log in with email/password
- [ ] "Forgot Password" link works
- [ ] Password reset email received
- [ ] Password reset link works and expires after 24h
- [ ] Rate limiting: 5 failed attempts = 15-minute lockout

### OAuth
- [ ] Google OAuth login works
- [ ] Microsoft OAuth login works (if enabled)
- [ ] OAuth creates user profile correctly
- [ ] OAuth links to existing account if email matches

### Session
- [ ] Session persists on page refresh
- [ ] Session timeout after 24 hours
- [ ] Logout clears session completely

---

## 2. Onboarding Flow

- [ ] Onboarding wizard displays after first login
- [ ] Company info step saves correctly
- [ ] User profile step works
- [ ] Rate card setup step functions
- [ ] "Skip" options work without breaking flow
- [ ] Onboarding completion tracked
- [ ] User can access app after completing/skipping onboarding

---

## 3. Subscription & Billing

### Trial
- [ ] New users start with trial period
- [ ] Trial countdown banner displays correctly
- [ ] Trial features work correctly
- [ ] Trial expiration shows read-only mode

### Checkout
- [ ] "Upgrade" button opens Stripe Checkout
- [ ] Individual plan prices correct (USD/GBP/EUR)
- [ ] Team plan prices correct
- [ ] Payment completes successfully
- [ ] User tier updates after payment
- [ ] Confirmation email received

### Subscription Management
- [ ] Customer portal accessible
- [ ] Plan upgrade works
- [ ] Plan downgrade works (end of period)
- [ ] Cancellation works
- [ ] Reactivation works within grace period

### Webhooks
- [ ] `checkout.session.completed` processes correctly
- [ ] `customer.subscription.updated` updates tier
- [ ] `customer.subscription.deleted` handles cancellation
- [ ] `invoice.payment_failed` triggers notification

---

## 4. Quote Creation Flow

### New Quote
- [ ] "New Quote" creates blank quote
- [ ] Client selection works
- [ ] Project details save correctly
- [ ] Section toggle shows/hides sections
- [ ] Line items can be added
- [ ] Rate card items import correctly
- [ ] Quantities and rates calculate correctly
- [ ] Fees (management, discount) apply correctly
- [ ] Currency selection works
- [ ] Region selection works

### Quote Editing
- [ ] Auto-save works (30-second interval)
- [ ] Manual save works
- [ ] Undo/redo works
- [ ] Line item reordering works (drag-drop)
- [ ] Subsection reordering works
- [ ] Section reordering works
- [ ] Custom subsection creation works

### Quote Export
- [ ] PDF export generates correctly
- [ ] PDF formatting is correct
- [ ] Proposal PDF includes cover page
- [ ] Email quote button works
- [ ] Quote template save works
- [ ] Quote duplication works

---

## 5. Client Management

- [ ] Add new client works
- [ ] Edit client details saves
- [ ] Delete client (with confirmation)
- [ ] Client search works
- [ ] Client filtering works
- [ ] Client detail page shows all related items
- [ ] Activity timeline shows on client
- [ ] CSV import works

---

## 6. Opportunity Pipeline

- [ ] Create new opportunity
- [ ] Opportunity stages display correctly
- [ ] Drag-drop between stages works
- [ ] Opportunity details save
- [ ] Win/loss marking works
- [ ] Conversion to project works
- [ ] Pipeline value calculations correct

---

## 7. Project Management

- [ ] Create new project
- [ ] Project from opportunity works
- [ ] Project status workflow works
- [ ] Budget tracking displays correctly
- [ ] Team assignment works
- [ ] Project timeline view works
- [ ] Project archive works

---

## 8. Financial Features

### Invoices
- [ ] Create invoice from quote
- [ ] Manual invoice creation
- [ ] Invoice numbering works
- [ ] Payment recording works
- [ ] Partial payment works
- [ ] Invoice PDF generation
- [ ] Invoice email works

### Expenses
- [ ] Add expense works
- [ ] Expense categories work
- [ ] Expense attachments (if enabled)
- [ ] Expense filtering works
- [ ] Expense totals correct

### P&L
- [ ] Project P&L calculates correctly
- [ ] Revenue recognition works
- [ ] Expense allocation works
- [ ] Margin percentages correct

---

## 9. Crew & Equipment

### Crew
- [ ] Add crew member
- [ ] Crew roles work
- [ ] Crew rates save
- [ ] Crew availability view works
- [ ] Crew booking calendar works

### Equipment (Kit)
- [ ] Add equipment item
- [ ] Equipment categories work
- [ ] Equipment check-out flow
- [ ] Equipment return flow
- [ ] Equipment booking conflicts detected

---

## 10. Call Sheets

- [ ] Create call sheet from project
- [ ] Add call sheet sections
- [ ] Add crew to call sheet
- [ ] Weather integration (if enabled)
- [ ] Call sheet PDF generation
- [ ] Call sheet distribution

---

## 11. Settings

### Company Settings
- [ ] Company info saves
- [ ] Logo upload works
- [ ] Bank details save
- [ ] Tax settings work

### User Settings
- [ ] Profile update works
- [ ] Password change works
- [ ] Notification preferences work

### Team Management
- [ ] Invite team member
- [ ] Invitation email sent
- [ ] Invitation acceptance works
- [ ] Role assignment works
- [ ] Role change works
- [ ] Team member removal

### Billing Settings
- [ ] Current plan displays
- [ ] Usage displays
- [ ] Payment method shows
- [ ] Invoice history works

---

## 12. AI Features

- [ ] Token balance displays
- [ ] Token purchase works
- [ ] AI research generates results
- [ ] Commercial tasks generation works
- [ ] Token deduction accurate
- [ ] Low token warning displays

---

## 13. Email Features

- [ ] Email sync (Gmail/Microsoft)
- [ ] Email send works
- [ ] Email templates work
- [ ] Email sequences trigger
- [ ] Email tracking works

---

## 14. Data Management

### Import/Export
- [ ] Client CSV import
- [ ] Crew CSV import
- [ ] Equipment CSV import
- [ ] Data export (GDPR)

### GDPR
- [ ] Data export request works
- [ ] Account deletion works
- [ ] 30-day grace period enforced

---

## 15. Mobile Responsiveness

Test on iPhone and Android:
- [ ] Login page
- [ ] Dashboard
- [ ] Quote editor
- [ ] Client list
- [ ] Opportunity board
- [ ] Settings page

---

## 16. Error Handling

- [ ] Network error shows friendly message
- [ ] API errors handled gracefully
- [ ] Error boundary catches React errors
- [ ] Errors logged to Sentry
- [ ] Offline indicator shows

---

## 17. Performance

- [ ] Dashboard loads < 3 seconds
- [ ] Quote editor responsive
- [ ] PDF generation < 5 seconds
- [ ] No memory leaks on long sessions
- [ ] Lazy loading works

---

## Testing Environment

- Browser: Chrome, Firefox, Safari
- Mobile: iOS Safari, Android Chrome
- Network: Slow 3G simulation
- Users: Multiple concurrent users

---

## Sign-Off

| Tester | Date | Status |
|--------|------|--------|
| | | |
