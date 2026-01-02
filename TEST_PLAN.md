# ProductionOS Comprehensive Test Plan

> ## **PRODUCTION STATUS: VERIFIED (2026-01-02)**
> All tests passed before production launch.

Complete testing checklist to verify all features work correctly before launch.

**Testing Approach:**
1. Test as different user types (free, trial, individual, team admin, team member)
2. Test happy paths and error cases
3. Test on desktop and mobile
4. Document any bugs found

---

## Test Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://productionos.io | Live site testing |
| Local | http://localhost:5173 | Development testing |

**Stripe Mode:** Ensure testing with LIVE mode for production, TEST mode for development.

---

## Part 1: User Journey Tests

### 1.1 New User Signup Flow

#### Email/Password Signup
- [ ] Navigate to /auth/signup
- [ ] Fill form with valid email, password (8+ chars, mixed case, number, special)
- [ ] Accept terms and GDPR consent
- [ ] Click signup → email verification sent
- [ ] Check email → click verification link
- [ ] User logged in → redirected to onboarding
- [ ] **ERROR CASE:** Try weak password → error shown
- [ ] **ERROR CASE:** Try existing email → error shown
- [ ] **ERROR CASE:** Skip terms consent → button disabled

#### Google OAuth Signup
- [ ] Click "Sign up with Google"
- [ ] Google OAuth popup appears
- [ ] Select Google account
- [ ] Callback handled → user created
- [ ] Redirected to onboarding
- [ ] **ERROR CASE:** Cancel OAuth → graceful error handling

#### Onboarding Wizard
- [ ] Step 1: Company information → fills correctly
- [ ] Step 2: Industry/type selection → saves correctly
- [ ] Step 3: Team size → saves correctly
- [ ] Step 4: First project setup (optional)
- [ ] Complete wizard → redirected to dashboard
- [ ] **ERROR CASE:** Refresh during wizard → state preserved

### 1.2 Returning User Login Flow

#### Email/Password Login
- [ ] Navigate to /auth/login
- [ ] Enter valid credentials → logged in
- [ ] Session persists on page refresh
- [ ] Session persists on browser close/reopen (within 24h)
- [ ] **ERROR CASE:** Wrong password → error shown
- [ ] **ERROR CASE:** Non-existent email → error shown
- [ ] **ERROR CASE:** 5 failed attempts → 15-minute lockout
- [ ] **ERROR CASE:** Locked out user tries again → lockout message

#### Google OAuth Login
- [ ] Click "Login with Google"
- [ ] Existing user → logged in directly
- [ ] New user → redirected to signup flow

#### Password Reset
- [ ] Click "Forgot password" on login page
- [ ] Enter email → reset email sent
- [ ] Check email → click reset link
- [ ] Enter new password (meets requirements)
- [ ] Password changed → can login with new password
- [ ] **ERROR CASE:** Invalid/expired reset link → error shown
- [ ] **ERROR CASE:** Non-existent email → generic "email sent" message (no user enumeration)

### 1.3 Logout Flow
- [ ] Click logout button
- [ ] Session cleared
- [ ] Redirected to login page
- [ ] Protected routes redirect to login
- [ ] Cannot access dashboard without re-login

---

## Part 2: Subscription & Billing Tests

### 2.1 Trial Flow
- [ ] New user starts with trial status
- [ ] Trial countdown banner shows days remaining
- [ ] Trial user can access all features
- [ ] Trial expires → read-only mode activated
- [ ] Read-only mode: can view but not create/edit
- [ ] Upgrade prompt appears when trial expired
- [ ] Click upgrade → goes to pricing page

### 2.2 Plan Selection & Checkout

#### From Pricing Page (Logged Out)
- [ ] Visit /pricing
- [ ] Toggle monthly/annual → prices update correctly
- [ ] Regional pricing badge shows for non-tier1 users
- [ ] Click "Individual" plan → redirects to /auth/signup with plan params
- [ ] After signup → automatically redirects to Stripe checkout
- [ ] Complete checkout → subscription active

#### From Pricing Page (Logged In)
- [ ] Visit /pricing
- [ ] Click "Individual" plan → goes directly to Stripe checkout
- [ ] Complete checkout → subscription active, redirected to dashboard
- [ ] **ERROR CASE:** Cancel checkout → returns to pricing page

#### From Settings > Billing
- [ ] Navigate to Settings > Billing
- [ ] Current plan displayed correctly
- [ ] Click "Upgrade" → pricing modal or checkout
- [ ] Click "Manage Subscription" → Stripe customer portal

### 2.3 Currency & Regional Pricing

#### Currency Detection
- [ ] Visit /pricing from US IP → shows USD prices
- [ ] Visit /pricing from UK IP → shows GBP prices
- [ ] Visit /pricing from Singapore → shows SGD prices
- [ ] Use ?country=SG param → shows Singapore pricing
- [ ] Use ?country=MY param → shows Malaysia (Tier 3) pricing

#### Price Display Verification
| Currency | Individual Monthly | Individual Annual (per month) | Individual Annual Total |
|----------|-------------------|------------------------------|------------------------|
| USD | $24/mo | $19/mo | $228/yr |
| GBP | £19/mo | £15/mo | £180/yr |
| EUR | €22/mo | €18/mo | €216/yr |
| SGD | S$32/mo | S$26/mo | S$308/yr |
| AED | AED88/mo | AED70/mo | AED845/yr |

- [ ] Monthly prices display correctly
- [ ] Annual toggle shows monthly equivalent + yearly total
- [ ] "SAVE 20%" badge shows on annual toggle

### 2.4 Stripe Checkout Flow

#### Individual Plan (Monthly)
- [ ] Select plan → Stripe checkout loads
- [ ] Enter test card (4242 4242 4242 4242)
- [ ] Enter valid details
- [ ] Complete payment → success page
- [ ] Redirected to app with active subscription
- [ ] Check Settings > Billing → shows correct plan
- [ ] **ERROR CASE:** Card declined → error shown

#### Individual Plan (Annual)
- [ ] Select annual → correct price shown
- [ ] Complete payment
- [ ] Subscription shows annual billing cycle

#### Team Plan
- [ ] Select team plan → checkout with per-seat pricing info
- [ ] Complete payment
- [ ] Team features unlocked (member invites, etc.)

### 2.5 Token Pack Purchase
- [ ] Navigate to Settings > AI & Tokens
- [ ] See current token balance
- [ ] Click "Buy Tokens" → token pack options shown
- [ ] Select 5K pack → Stripe checkout
- [ ] Complete purchase → tokens added to balance
- [ ] Select 25K pack → different price
- [ ] Select 100K pack → different price
- [ ] Transaction history shows purchase

### 2.6 Subscription Management

#### Customer Portal
- [ ] Settings > Billing > "Manage Subscription"
- [ ] Opens Stripe customer portal
- [ ] Can view invoices
- [ ] Can update payment method
- [ ] Can view upcoming invoice

#### Cancel Subscription
- [ ] Settings > Billing > "Cancel Subscription"
- [ ] Confirmation modal appears
- [ ] Confirm cancel → subscription marked for cancellation
- [ ] Shows "Active until [date]"
- [ ] Can still use app until end of period
- [ ] After period ends → access blocked

#### Reactivate Subscription
- [ ] After cancellation (before period ends)
- [ ] Click "Reactivate"
- [ ] Subscription reactivated
- [ ] Billing continues normally

### 2.7 Webhook Verification
Test these by checking database state after Stripe events:

- [ ] `checkout.session.completed` → subscription created in DB
- [ ] `customer.subscription.updated` → plan changes reflected
- [ ] `customer.subscription.deleted` → subscription marked canceled
- [ ] `invoice.payment_failed` → user notified, access limited
- [ ] `invoice.paid` → access restored

---

## Part 3: Feature Gating Tests

### 3.1 Free User Limits
Create a test account with no subscription:

- [ ] Can create up to 3 projects
- [ ] 4th project → upgrade prompt shown
- [ ] Can add up to 10 crew members
- [ ] 11th crew → upgrade prompt shown
- [ ] Can add up to 10 equipment items
- [ ] 11th equipment → upgrade prompt shown
- [ ] Cannot access team features
- [ ] Cannot use AI features (or limited tokens)
- [ ] PDF has watermark

### 3.2 Individual Plan Access
Upgrade to Individual plan:

- [ ] Can create unlimited projects
- [ ] Can add up to 100 crew members
- [ ] 101st crew → upgrade to Team prompt
- [ ] Can add up to 50 equipment items
- [ ] 51st equipment → upgrade to Team prompt
- [ ] Can access AI features (with tokens)
- [ ] Cannot add team members
- [ ] PDF has no watermark (if plan includes)

### 3.3 Team Plan Access
Upgrade to Team plan:

- [ ] Can create unlimited projects
- [ ] Can add unlimited crew
- [ ] Can add unlimited equipment
- [ ] Can invite team members
- [ ] Can manage team permissions
- [ ] Can access email sequences
- [ ] Full AI features

### 3.4 Grace Period & Blocked Access
Simulate subscription lapse:

- [ ] Payment fails → warning banner shown
- [ ] 24-hour grace period → can still use app
- [ ] After grace period → blocked screen shown
- [ ] Can only access billing to fix payment
- [ ] Fix payment → full access restored

---

## Part 4: Core Feature Tests

### 4.1 Dashboard
- [ ] Dashboard loads without errors
- [ ] Quote pipeline shows correct data
- [ ] Metrics (revenue, quotes, etc.) display correctly
- [ ] Recent activity shows real activity
- [ ] Quick actions work (new quote, new client)
- [ ] Drag-and-drop quote status works
- [ ] Mobile: hamburger menu works
- [ ] Mobile: metrics stack vertically

### 4.2 Quote Management

#### Create Quote
- [ ] Click "New Quote" → quote editor opens
- [ ] Select/create client → client attached
- [ ] Add project details (name, type, dates)
- [ ] Add sections → sections appear
- [ ] Add line items to sections
- [ ] Set quantities, rates, costs
- [ ] Calculations update in real-time
- [ ] Add fees (management, commission, discount)
- [ ] Total reflects all calculations correctly
- [ ] Save quote → saved to database
- [ ] Auto-save works (check after 30 seconds)

#### Edit Quote
- [ ] Open existing quote
- [ ] Make changes → changes saved
- [ ] Reorder sections via drag-drop
- [ ] Reorder line items via drag-drop
- [ ] Delete section → section removed
- [ ] Delete line item → item removed
- [ ] Undo deletion works

#### Quote Status Flow
- [ ] Create quote → status is "Draft"
- [ ] Mark as "Sent" → status changes
- [ ] Mark as "Won" → status changes, revenue counted
- [ ] Mark as "Dead" → prompts for loss reason
- [ ] Enter loss reason → saved to quote

#### Quote PDF Export
- [ ] Click "Export PDF"
- [ ] Select format (Standard, Clean, Proposal)
- [ ] PDF generates and downloads
- [ ] PDF contains all quote data correctly
- [ ] PDF has correct company branding
- [ ] PDF calculations match on-screen
- [ ] Proposal PDF includes cover page

#### Quote Templates
- [ ] Save quote as template
- [ ] Create new quote from template
- [ ] Template data pre-populated correctly
- [ ] Can edit template data

### 4.3 Client Management

#### Create Client
- [ ] Navigate to Clients page
- [ ] Click "Add Client"
- [ ] Fill client form (company name, contacts, etc.)
- [ ] Add primary contact
- [ ] Add additional contacts
- [ ] Save client → client created
- [ ] Client appears in list

#### Edit Client
- [ ] Click client → client detail page
- [ ] Edit client info → saves correctly
- [ ] Add/edit/remove contacts
- [ ] Add notes → saved
- [ ] Log activity → appears in timeline

#### Client Detail Page
- [ ] Shows client information
- [ ] Shows all contacts
- [ ] Shows related quotes
- [ ] Shows activity timeline
- [ ] Shows lead score (if calculated)
- [ ] Can edit from detail page

#### Delete Client
- [ ] Select client → click delete
- [ ] Confirmation prompt appears
- [ ] Confirm → client deleted
- [ ] Related quotes remain (orphaned)

### 4.4 Invoice Management

#### Create Invoice from Quote
- [ ] Open won quote
- [ ] Click "Create Invoice"
- [ ] Invoice pre-populated from quote
- [ ] Review and edit as needed
- [ ] Save invoice → created

#### Create Standalone Invoice
- [ ] Navigate to Invoices page
- [ ] Click "New Invoice"
- [ ] Select client
- [ ] Add line items manually
- [ ] Set dates, terms
- [ ] Save invoice

#### Invoice Status Flow
- [ ] New invoice → status "Draft"
- [ ] Send invoice → status "Sent"
- [ ] Record payment → status "Partial" or "Paid"
- [ ] Overdue invoice → status "Overdue"

#### Record Payment
- [ ] Open invoice
- [ ] Click "Record Payment"
- [ ] Enter amount, method, date, reference
- [ ] Save → payment recorded
- [ ] Invoice balance updated
- [ ] Full payment → status changes to "Paid"

#### Invoice PDF Export
- [ ] Click "Export PDF"
- [ ] PDF generates correctly
- [ ] Shows company details
- [ ] Shows line items
- [ ] Shows payment history
- [ ] Shows balance due

### 4.5 Rate Card Management

#### View Rate Card
- [ ] Navigate to Rate Card page
- [ ] Items display by category
- [ ] Regional pricing shows (SEA, EU, etc.)
- [ ] Search filters work

#### Add Rate Card Item
- [ ] Click "Add Item"
- [ ] Fill form (description, rates by region)
- [ ] Save → item appears in list

#### Edit Rate Card Item
- [ ] Click item → edit form
- [ ] Change rates
- [ ] Save → changes reflected

#### Delete Rate Card Item
- [ ] Select item → delete
- [ ] Confirm → item removed

#### Import Rate Card
- [ ] Click "Import"
- [ ] Upload CSV file
- [ ] Preview import data
- [ ] Confirm → items imported

### 4.6 Crew Management

#### View Crew
- [ ] Navigate to Crew page
- [ ] Crew members listed
- [ ] Search/filter works
- [ ] Sort by name, role, rate works

#### Add Crew Member
- [ ] Click "Add Crew"
- [ ] Fill form (name, role, contact, rates)
- [ ] Upload photo (optional)
- [ ] Save → crew member created

#### Edit Crew Member
- [ ] Click crew member
- [ ] Edit details
- [ ] Save → changes reflected

#### Crew Booking
- [ ] Navigate to crew member detail
- [ ] View availability calendar
- [ ] Add booking (project, dates, rate)
- [ ] Booking appears on calendar
- [ ] Conflict detection works (double booking)

### 4.7 Equipment/Kit Management

#### View Equipment
- [ ] Navigate to Kit page
- [ ] Equipment items listed
- [ ] Categories displayed
- [ ] Search/filter works

#### Add Equipment
- [ ] Click "Add Item"
- [ ] Fill form (name, category, daily rate)
- [ ] Save → item created

#### Equipment Booking
- [ ] Navigate to Kit Booking page
- [ ] Calendar view displays
- [ ] Add booking (item, dates, quantity)
- [ ] Booking appears on calendar
- [ ] Availability decreases

### 4.8 Call Sheet Management

#### Create Call Sheet
- [ ] Navigate to Call Sheets page
- [ ] Click "New Call Sheet"
- [ ] Select project
- [ ] Add shoot date, location
- [ ] Add crew assignments
- [ ] Add equipment
- [ ] Add logistics (accommodation, transport)
- [ ] Add catering, technical notes
- [ ] Save → call sheet created

#### Call Sheet PDF
- [ ] Open call sheet
- [ ] Click "Export PDF"
- [ ] PDF generates with all details
- [ ] Crew list correct
- [ ] Schedule correct
- [ ] Logistics correct

### 4.9 Project Management

#### Create Project
- [ ] Navigate to Projects page
- [ ] Click "New Project"
- [ ] Fill form (name, type, client, dates, budget)
- [ ] Save → project created

#### Project Detail
- [ ] Open project
- [ ] View/edit details
- [ ] See related quotes
- [ ] See related invoices
- [ ] See crew assignments
- [ ] See equipment bookings

#### Project Templates
- [ ] Save project as template
- [ ] Create new project from template
- [ ] Template data applied

### 4.10 Opportunity Pipeline

#### View Pipeline
- [ ] Navigate to Opportunities page
- [ ] Kanban board displays
- [ ] Stages show (Lead, Qualified, Proposal, Won, Lost)
- [ ] Opportunities in correct stages

#### Create Opportunity
- [ ] Click "Add Opportunity"
- [ ] Fill form (name, client, value, stage)
- [ ] Save → appears in pipeline

#### Move Opportunity
- [ ] Drag opportunity to different stage
- [ ] Stage updates
- [ ] Won stage → prompts for quote conversion
- [ ] Lost stage → prompts for loss reason

#### Opportunity Detail
- [ ] Click opportunity → detail page
- [ ] View/edit details
- [ ] See timeline/activity
- [ ] See related quotes

### 4.11 Contact Management (CRM)

#### View Contacts
- [ ] Navigate to Contacts page
- [ ] Contacts listed
- [ ] Search by name, email, company works
- [ ] Filter by client works

#### Add Contact
- [ ] Click "Add Contact"
- [ ] Fill form (name, email, phone, company, role)
- [ ] Save → contact created

#### Log Activity
- [ ] Open contact
- [ ] Click "Log Activity"
- [ ] Select activity type (call, email, meeting)
- [ ] Add notes
- [ ] Save → activity in timeline

### 4.12 Email Features

#### Email Inbox
- [ ] Navigate to Email page
- [ ] Gmail/Outlook sync runs (if connected)
- [ ] Emails display in inbox
- [ ] Search emails works
- [ ] Filter by folder works

#### Compose Email
- [ ] Click "Compose"
- [ ] Select recipient(s)
- [ ] Write subject and body
- [ ] Use template (if available)
- [ ] Send → email sent
- [ ] Check Gmail/Outlook → email appears in sent

#### Email Templates
- [ ] Navigate to Email Templates
- [ ] Create template with variables
- [ ] Use template in compose
- [ ] Variables populate correctly

#### Email Sequences
- [ ] Navigate to Email Sequences
- [ ] Create new sequence
- [ ] Add steps with delays
- [ ] Set trigger (new lead, date, etc.)
- [ ] Activate sequence
- [ ] Enroll contact → sequence starts
- [ ] Verify emails send on schedule

### 4.13 Knowledge Base

#### View Knowledge Base
- [ ] Navigate to Knowledge page
- [ ] Entries listed by category
- [ ] Search works
- [ ] Filter by category works

#### Add Knowledge Entry
- [ ] Click "Add Entry"
- [ ] Fill form (title, category, content)
- [ ] Add tags
- [ ] Save → entry created

#### Edit/Delete Entry
- [ ] Edit entry → changes saved
- [ ] Delete entry → removed

### 4.14 Task Board

#### View Task Board
- [ ] Navigate to Task Board page
- [ ] Kanban columns display
- [ ] Tasks in correct columns

#### Create Task
- [ ] Click "Add Task"
- [ ] Fill form (title, description, assignee, priority)
- [ ] Save → task appears

#### Move Task
- [ ] Drag task to different column
- [ ] Status updates

#### Task Detail
- [ ] Click task → detail modal
- [ ] Edit task details
- [ ] Add comments
- [ ] Mark complete

---

## Part 5: Settings Tests

### 5.1 Company Settings
- [ ] Navigate to Settings > Company
- [ ] Edit company name → saves
- [ ] Edit address → saves
- [ ] Upload logo → displays correctly
- [ ] Edit contact info → saves

### 5.2 Tax & Legal
- [ ] Navigate to Settings > Tax & Legal
- [ ] Add tax ID → saves
- [ ] Configure tax rules → saves
- [ ] Tax applies correctly in quotes

### 5.3 Bank Details
- [ ] Navigate to Settings > Bank Details
- [ ] Add bank account info
- [ ] Info encrypts (check no plain text in DB)
- [ ] Displays on invoices correctly

### 5.4 User Management

#### Add User (Team Plan)
- [ ] Navigate to Settings > Team
- [ ] Click "Invite Member"
- [ ] Enter email, select role
- [ ] Send invitation
- [ ] Check email received
- [ ] Click invitation link
- [ ] Complete signup as team member
- [ ] New user has correct permissions

#### Edit User Role
- [ ] Click user → edit
- [ ] Change role
- [ ] Save → permissions update
- [ ] Test new permissions work

#### Remove User
- [ ] Click user → remove
- [ ] Confirm → user removed
- [ ] User cannot access org anymore

### 5.5 Billing Settings
- [ ] View current plan
- [ ] View payment method
- [ ] View invoice history
- [ ] Download invoices (PDF)
- [ ] Access customer portal

### 5.6 Integrations

#### Gmail Integration
- [ ] Click "Connect Gmail"
- [ ] OAuth flow completes
- [ ] Gmail syncs
- [ ] Can send via Gmail

#### Outlook Integration
- [ ] Click "Connect Outlook"
- [ ] OAuth flow completes
- [ ] Outlook syncs
- [ ] Can send via Outlook

#### Calendar Sync
- [ ] Enable calendar sync
- [ ] Events sync from Google/Outlook
- [ ] Bookings appear on calendar

### 5.7 Quote Defaults
- [ ] Set default currency → applies to new quotes
- [ ] Set default region → applies to new quotes
- [ ] Set default fees → applies to new quotes
- [ ] Set default terms → applies to new quotes

### 5.8 Terms & Conditions
- [ ] Add custom T&Cs
- [ ] T&Cs appear on quote PDF
- [ ] Can edit/update T&Cs

### 5.9 Customization
- [ ] Upload custom logo
- [ ] Logo appears on PDFs
- [ ] Set brand colors (if available)

### 5.10 PDF Options
- [ ] Configure PDF settings
- [ ] Changes reflect in exports

### 5.11 AI & Tokens
- [ ] View token balance
- [ ] View usage history
- [ ] Purchase tokens works

### 5.12 Activity Log
- [ ] View activity log
- [ ] Filter by user
- [ ] Filter by date
- [ ] Filter by action type

### 5.13 Privacy & Data

#### Data Export
- [ ] Click "Export My Data"
- [ ] GDPR export generates
- [ ] Download JSON file
- [ ] File contains all user data

#### Delete Account
- [ ] Click "Delete Account"
- [ ] Confirmation modal with warning
- [ ] Enter password to confirm
- [ ] Account scheduled for deletion
- [ ] 30-day grace period starts
- [ ] Can cancel deletion within 30 days
- [ ] After 30 days → account deleted

---

## Part 6: Mobile Responsiveness Tests

Test all pages on mobile viewport (375px width):

### Navigation
- [ ] Hamburger menu visible
- [ ] Menu opens/closes correctly
- [ ] All nav items accessible
- [ ] Sidebar collapse works

### Key Pages
- [ ] Dashboard displays correctly
- [ ] Quote list scrolls horizontally if needed
- [ ] Quote editor usable on mobile
- [ ] Client list displays correctly
- [ ] Settings pages accessible
- [ ] Forms fit on screen
- [ ] Modals fit on screen

### Touch Interactions
- [ ] Touch targets large enough (44px minimum)
- [ ] Swipe gestures work (if implemented)
- [ ] Drag-drop works on touch

---

## Part 7: Error Handling Tests

### Network Errors
- [ ] Disconnect network → offline indicator shows
- [ ] Actions queue for retry
- [ ] Reconnect → queued actions process
- [ ] User notified of sync status

### API Errors
- [ ] Invalid data → validation error shown
- [ ] Server error → generic error + retry option
- [ ] Timeout → timeout message + retry option

### Form Validation
- [ ] Required fields → shows error if empty
- [ ] Email fields → validates email format
- [ ] Number fields → validates number format
- [ ] Date fields → validates date format
- [ ] Password fields → validates requirements

### Edge Cases
- [ ] Very long text input → handled gracefully
- [ ] Special characters → escaped correctly
- [ ] Empty lists → empty state shown
- [ ] Large data sets → paginated/virtualized

---

## Part 8: Performance Tests

### Page Load Times
Target: < 3 seconds for initial load

- [ ] Dashboard: _____ seconds
- [ ] Quote Editor: _____ seconds
- [ ] Client List: _____ seconds
- [ ] Settings: _____ seconds

### PDF Generation
Target: < 5 seconds

- [ ] Simple quote PDF: _____ seconds
- [ ] Proposal PDF: _____ seconds
- [ ] Invoice PDF: _____ seconds
- [ ] Call Sheet PDF: _____ seconds

### Large Data Sets
- [ ] 100+ clients → list loads < 2 seconds
- [ ] 100+ quotes → list loads < 2 seconds
- [ ] 500+ rate card items → list loads < 3 seconds
- [ ] Quote with 50+ line items → editor responsive

---

## Part 9: Security Tests

### Authentication
- [ ] Cannot access protected routes without login
- [ ] Session expires after 24 hours
- [ ] Password reset tokens expire (check timeframe)
- [ ] Cannot reuse password reset token

### Authorization
- [ ] Cannot access other organization's data
- [ ] Team member cannot access admin features
- [ ] Cannot modify data without proper role

### Data Protection
- [ ] Passwords not visible in network requests
- [ ] API keys not exposed in client code
- [ ] Sensitive data encrypted in database
- [ ] No PII in URL parameters

### Input Sanitization
- [ ] Script injection blocked (XSS)
- [ ] SQL injection blocked (if applicable)
- [ ] File upload validates file type

---

## Part 10: Integration Tests

### Stripe
- [ ] Webhook endpoint receives events
- [ ] Events process correctly
- [ ] Idempotency prevents duplicates
- [ ] Failed webhooks retry

### OAuth Providers
- [ ] Google OAuth works in production
- [ ] Microsoft OAuth works (if enabled)
- [ ] Token refresh works
- [ ] Revoked access handled

### Email Providers
- [ ] Gmail sends successfully
- [ ] Outlook sends successfully
- [ ] Resend (invitations) sends successfully
- [ ] Tracking pixel loads
- [ ] Click tracking redirects work

---

## Part 11: Legal & Compliance Tests

### Legal Pages
- [ ] /legal/terms loads correctly
- [ ] /legal/privacy loads correctly
- [ ] /legal/gdpr loads correctly
- [ ] /legal/cookies loads correctly

### Cookie Consent
- [ ] Cookie banner appears on first visit
- [ ] Can accept all cookies
- [ ] Can reject non-essential cookies
- [ ] Can customize preferences
- [ ] Preferences persist

### GDPR Compliance
- [ ] Data export includes all user data
- [ ] Account deletion schedules 30-day grace
- [ ] Can cancel deletion within grace period
- [ ] Deletion actually removes data after grace period

---

## Part 12: Cross-Browser Tests

Test critical flows in each browser:

### Chrome (Desktop)
- [ ] Login works
- [ ] Create quote works
- [ ] Export PDF works
- [ ] Stripe checkout works

### Safari (Desktop)
- [ ] Login works
- [ ] Create quote works
- [ ] Export PDF works
- [ ] Stripe checkout works

### Firefox (Desktop)
- [ ] Login works
- [ ] Create quote works
- [ ] Export PDF works
- [ ] Stripe checkout works

### Edge (Desktop)
- [ ] Login works
- [ ] Create quote works
- [ ] Export PDF works
- [ ] Stripe checkout works

### Safari (iOS)
- [ ] Login works
- [ ] Basic navigation works
- [ ] Forms submit correctly

### Chrome (Android)
- [ ] Login works
- [ ] Basic navigation works
- [ ] Forms submit correctly

---

## Bug Tracking

| # | Description | Severity | Status | Fixed In |
|---|-------------|----------|--------|----------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severity Levels:**
- **Critical**: Blocks core functionality, must fix before launch
- **High**: Major feature broken, should fix before launch
- **Medium**: Feature degraded but usable, can fix post-launch
- **Low**: Minor cosmetic/UX issue, can fix post-launch

---

## Sign-Off

| Tester | Date | Areas Tested | Notes |
|--------|------|--------------|-------|
| | | | |
| | | | |

**Launch Approved:** [ ] Yes / [ ] No

**Approved By:** _______________

**Date:** _______________
