# Task Backlog - Tell Quote

Small, actionable tasks (15 mins max each). Pick from top of each priority section.

---

## CRITICAL BUGS (Fix First)

All critical bugs fixed and deployed.

---

## HIGH PRIORITY - Quick Wins

(All high priority quick wins completed!)

---

## MEDIUM PRIORITY - Features

(All medium priority features completed!)

---

## LOW PRIORITY - Polish

(All low priority polish tasks completed!)

---

## TECH DEBT

### Normalize Contact Storage
- [ ] Remove legacy `client.contact/email/phone` fields
- [ ] Always use `contacts[]` array
- [ ] Update all references in codebase
- **Time**: 30 mins (break into 2 tasks)

### Rate Card Pricing Structure
- [ ] Consolidate legacy `pricing` and `currencyPricing` into single structure
- [ ] Migrate existing data
- [ ] Update all pricing lookups
- **Time**: 45 mins (break into 3 tasks)

### Client Metrics Performance
- [ ] Cache metrics by year/month
- [ ] Separate rate updates from metric dependencies
- [ ] Add pagination to client list
- **Time**: 30 mins (break into 2 tasks)

### Quote-Client ID Linking
- [ ] Use UUID for client matching instead of company name
- [ ] Store `clientId` reliably in quotes
- [ ] Fix getClientQuotes to use ID
- **Time**: 15 mins

---

## DATABASE MIGRATIONS NEEDED

### Quote Templates Table
```sql
-- File: supabase/migrations/005_quote_templates.sql
-- Status: Created, needs to be run in Supabase
```

### Activity Logs Foreign Key
```sql
-- File: supabase/migrations/004_activity_logs.sql
-- Status: Modified to remove user_profiles FK, needs verification
```

---

## COMPLETED

- [x] PWA Offline Support
- [x] Store Sync with Retry Queues (all stores)
- [x] Quote Template Store created
- [x] Save as Template Modal created
- [x] Template Picker Modal created
- [x] Activity Timeline CRM feature
- [x] Bug: Loss reason capture duplicate fixed
- [x] Bug: Average win rate calculation fixed (now uses aggregate)
- [x] Bug: Primary contact enforcement fixed (auto-assign on add/delete)
- [x] Client Health Score (getClientHealth function + visual indicators)
- [x] Days Since Last Contact on Client Cards
- [x] Template Picker Integration (New Quote shows picker first)
- [x] Auto-Log Activity on Quote Status Change
- [x] Duplicate Quote Button
- [x] AI Smart Tasking System (dealContextStore, SmartTasksWidget, pattern learning)
- [x] Quote Expiry Warnings on Dashboard
- [x] Follow-up Reminders Widget on Dashboard
- [x] Opportunity to Quote Conversion (already implemented)
- [x] Client Advanced Filters (industry, region, payment terms)
- [x] Rate Card Bulk Markup (category selection, percentage, cost/charge options)
- [x] Rate Card Item Linking (rateCardItemId stored, price differ indicator, refresh button)
- [x] Search Highlighting in Rate Card Quick Add (search input, filtered results, highlighted matches)
- [x] Client Card Industry Badge (color-coded by industry type)
- [x] Contact Avatar Initials (two-letter initials, consistent colors across displays)
- [x] Rate Card Export Currency Pricing (added currencyPricing columns to CSV export)
- [x] Legacy Contact Migration (auto-creates contact from legacy fields on initialize)

---

## HOW TO USE THIS FILE

1. Pick a task from top of relevant priority section
2. Check the time estimate
3. Complete the task
4. Mark with [x] and move to COMPLETED
5. Commit with descriptive message

Run `grep -c "^\- \[ \]" TASKS.md` to count remaining tasks.
