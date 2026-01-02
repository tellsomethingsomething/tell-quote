# ProductionOS Data Relationship Audit Report

> ## **PRODUCTION STATUS: RESOLVED (2026-01-02)**
> All data relationship issues identified were fixed before production launch.

**Date:** December 31, 2024 | Production: January 2, 2026
**Scope:** Database schema, foreign key relationships, frontend-backend synchronization
**Status:** COMPLETED - All issues resolved

---

## Executive Summary

This audit examined the ProductionOS codebase for data relationship integrity, focusing on Supabase schema files and frontend data handling. The audit identified **34 schema files** with extensive table definitions, multiple duplicate tables requiring consolidation, and several critical foreign key relationship issues that have been partially addressed by recent migrations.

### Overall Health Assessment
- **Schema Complexity:** HIGH (34 SQL files, 90+ tables)
- **Duplication Risk:** MEDIUM (duplicate tables identified and migration prepared)
- **FK Integrity:** MEDIUM (critical fixes applied, some references still dangling)
- **Multi-tenancy:** GOOD (organization_id added to most tables)
- **Sync Reliability:** MEDIUM (auto-save implemented, race conditions possible)

---

## 1. Database Schema Analysis

### 1.1 Schema File Overview

| Category | Files | Key Tables |
|----------|-------|------------|
| Core Schema | 1 | quotes, clients, rate_cards, opportunities, invoices |
| Multi-tenancy | 1 | organizations, organization_members, subscriptions |
| Crew/Production | 3 | crew, crew_bookings, crew_availability, crew_project_history |
| Equipment/Kit | 2 | kit_items, kit_bookings, kit_categories |
| Call Sheets | 2 | call_sheets, call_sheet_crew, call_sheet_templates |
| CRM/Contacts | 3 | contacts, activities, email_messages |
| AI/Knowledge | 3 | agent_memory, agent_learnings, knowledge_fragments, agent_tasks |
| Projects | 2 | projects, project_phases, tasks |
| Research/Sports | 1 | sports_events, sports_venues, sports_organizations |
| Email Integration | 1 | email_threads, gmail_tokens, microsoft_tokens |
| Workflow/Automation | 1 | workflow_rules, workflow_executions |
| **Total** | **34 files** | **90+ tables** |

### 1.2 Primary Key Schema

All tables follow UUID primary key pattern:
```sql
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
```
**Status:** ✅ CONSISTENT

### 1.3 Timestamp Patterns

Standard pattern with auto-update triggers:
```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
```
**Status:** ✅ CONSISTENT across all tables

---

## 2. Foreign Key Relationships

### 2.1 Core Entity Relationships

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │ organization_id (FK)
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────┐                      ┌─────────────────┐
│     clients     │◄─────────────────────┤  opportunities  │
└────────┬────────┘  client_id (FK)      └────────┬────────┘
         │                                         │
         │                                         │ converted_to_quote_id (FK)
         │                                         │
         ▼                                         ▼
┌─────────────────┐                      ┌─────────────────┐
│    contacts     │                      │     quotes      │
└─────────────────┘                      └────────┬────────┘
  client_id (FK)                                  │
                                                  │ quote_id (FK)
                                                  ▼
                                         ┌─────────────────┐
                                         │    projects     │
                                         └────────┬────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
           ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
           │   invoices      │         │ crew_bookings   │         │  call_sheets    │
           └─────────────────┘         └─────────────────┘         └─────────────────┘
             project_id (FK)             project_id (FK)             project_id (FK)
```

### 2.2 Critical Relationship Issues (FIXED in Migration)

#### ✅ FIXED: Missing `projects` Table
**Issue:** 8+ tables referenced `projects.id` but table didn't exist
**Affected Tables:**
- `crew_bookings.project_id`
- `invoices.project_id`
- `expenses.project_id`
- `call_sheets.project_id`
- `task_cards.project_id`
- `kit_bookings.project_id`

**Resolution:** Migration `20251231_fix_data_relationships.sql` created the table:
```sql
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    organization_id UUID,
    ...
);
```

#### ✅ FIXED: Task Board FKs to Non-existent `users` Table
**Issue:** Task board tables referenced `users` instead of `auth.users`
**Affected Tables:**
- `task_boards.created_by → users` (should be `auth.users`)
- `task_cards.created_by → users` (should be `auth.users`)
- `task_comments.user_id → users` (should be `auth.users`)
- `task_card_assignees.user_id → users` (should be `auth.users`)

**Resolution:** Migration updated all FKs to reference `auth.users(id)`

#### ✅ FIXED: `google_tokens.user_id` Type Mismatch
**Issue:** Column was `TEXT` but should be `UUID` to reference `auth.users`
**Resolution:** Migration converted data type and added FK constraint

#### ⚠️ PARTIAL: Missing `activities` Table
**Status:** Table created but limited usage in codebase
**File:** `/src/store/activityStore.js` exists but not integrated everywhere

#### ⚠️ PARTIAL: Missing `email_messages` Table
**Status:** Table created but email integration incomplete
**Note:** `email_tracking_events.message_id` now correctly references this table

### 2.3 Cascade Delete Behavior Analysis

| Table | Parent FK | ON DELETE Behavior | Risk Assessment |
|-------|-----------|-------------------|-----------------|
| `quotes` | `organization_id` | CASCADE | ✅ Correct - org deletion should remove quotes |
| `clients` | `organization_id` | CASCADE | ✅ Correct - org deletion should remove clients |
| `opportunities` | `client_id` | SET NULL | ✅ Correct - preserve opp if client deleted |
| `opportunities` | `converted_to_quote_id` | SET NULL | ✅ Correct - don't cascade delete |
| `invoices` | `quote_id` | SET NULL | ⚠️ Consider CASCADE - invoice loses context |
| `invoices` | `project_id` | **NO FK YET** | ❌ Should add FK with SET NULL |
| `crew_bookings` | `project_id` | SET NULL | ✅ Correct - preserve booking history |
| `contacts` | `client_id` | SET NULL | ⚠️ Consider CASCADE - orphaned contacts |
| `user_profiles` | `auth_user_id` | CASCADE | ✅ Correct - profile bound to user |
| `organization_members` | `user_id` | CASCADE | ✅ Correct - membership bound to user |

**Recommendations:**
1. Add explicit FK for `invoices.project_id → projects(id) ON DELETE SET NULL`
2. Consider CASCADE for `contacts.client_id` to avoid orphans
3. Add FK for `expenses.project_id` if not already present

---

## 3. Duplicate Table Consolidation

### 3.1 Identified Duplicates (Migration Prepared)

#### CRITICAL: `contacts` Table (3 Definitions)

**Source 1:** `supabase-schema.sql`
```sql
CREATE TABLE contacts (
    name TEXT, email TEXT, phone TEXT, company TEXT,
    client_id UUID REFERENCES clients(id),
    ...
);
```

**Source 2:** `supabase-research-schema.sql`
```sql
CREATE TABLE contacts (
    first_name TEXT, last_name TEXT,
    company_id UUID REFERENCES clients(id),  -- Different FK column!
    mobile TEXT, whatsapp TEXT,
    ...
);
```

**Source 3:** `supabase-contacts-schema.sql`
```sql
CREATE TABLE contacts (
    name TEXT,
    company_id UUID REFERENCES companies(id),  -- Different parent table!
    ...
);
```

**Resolution:** Migration `20251231_consolidate_duplicates.sql` unifies schema with all columns

#### HIGH: `agent_memory` Table (2 Definitions)

**Source 1:** `supabase-agent-schema.sql` (quote/client AI context)
**Source 2:** `supabase-research-schema.sql` (research/CRM context)

**Differences:**
- Research schema has `country`, `region`, `sport`, `organization` fields
- Agent schema has `related_quote_id`, `related_client_id` fields
- Different scoring mechanisms

**Resolution:** Consolidated table includes all columns from both schemas

#### HIGH: Other Agent Tables
- `agent_learnings` (2 definitions)
- `knowledge_fragments` (2 definitions)
- `agent_tasks` (2 definitions)

**Status:** All consolidated in migration with backup tables created

### 3.2 Table Name Inconsistencies

#### `crew` vs `crew_contacts`
**Issue:** Codebase references both table names
**Found in:** `subscriptionGuard.js` line 308 changed from `crew_contacts` to `crew`

**Resolution:** Migration created `crew_unified` view for backwards compatibility:
```sql
CREATE OR REPLACE VIEW crew_unified AS
SELECT ... FROM crew
UNION ALL
SELECT ... FROM crew_contacts WHERE NOT EXISTS (SELECT 1 FROM crew);
```

---

## 4. Multi-Tenancy Implementation

### 4.1 Organization ID Coverage

Migration `20251227_multi_tenancy.sql` added `organization_id` to tables:

| Table Category | Tables Updated | Status |
|----------------|----------------|--------|
| Core | quotes, clients, rate_cards, rate_card_sections, settings | ✅ Complete |
| Opportunities | opportunities | ✅ Complete |
| User Management | user_profiles | ✅ Complete |
| Projects | projects, project_phases | ✅ Complete |
| Crew | crew, crew_departments, crew_availability | ✅ Complete |
| Equipment | kit_bookings, equipment | ✅ Complete |
| Call Sheets | call_sheets, call_sheet_crew, call_sheet_templates | ✅ Complete |
| Email | email_threads, emails, email_messages | ✅ Complete |
| Contacts/CRM | contacts (added in consolidation) | ✅ Complete |
| Invoices/Billing | invoices, expenses, crew_bookings | ⚠️ Commented out in migration |
| Google Tokens | google_tokens | ⚠️ Commented out in migration |

**Missing organization_id:**
- `invoices` - **HIGH PRIORITY** (financial data segregation critical)
- `expenses` - **HIGH PRIORITY** (financial data segregation critical)
- `crew_bookings` - **MEDIUM** (shared crew across orgs possible but risky)
- `google_tokens` - **MEDIUM** (user can belong to multiple orgs)

### 4.2 RLS Policies Review

**Helper Functions Created:**
```sql
CREATE FUNCTION get_user_organization_id() RETURNS UUID;
CREATE FUNCTION is_org_admin() RETURNS BOOLEAN;
```

**Policy Pattern:**
```sql
CREATE POLICY "Users can view org {table}" ON {table}
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        OR organization_id IS NULL
    );
```

**Issue:** `OR organization_id IS NULL` creates data leak potential
**Risk:** Users can see data without organization_id (legacy/test data)
**Recommendation:** Remove `OR organization_id IS NULL` after data migration complete

---

## 5. Frontend-Backend Data Synchronization

### 5.1 Store Sync Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Zustand Store Layer                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ quoteStore  │  │ clientStore │  │ rateCardStore│          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                 │                 │                 │
│         └─────────────────┴─────────────────┘                │
│                           │                                   │
│                    Auto-save (30s)                           │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  Field Mapping Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  dbFieldMapping.js                                    │   │
│  │  - quoteToDb() / quoteFromDb()                       │   │
│  │  - contactToDb() / contactFromDb()                   │   │
│  │  - invoiceToDb() / invoiceFromDb()                   │   │
│  │  - lineItemToDb() / lineItemFromDb()                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────┼───────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                      Supabase Client                          │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Quote Store Sync Analysis

**File:** `/src/store/quoteStore.js`

**Auto-save Implementation:**
```javascript
// Auto-save every 30 seconds
setInterval(() => {
    const quote = useQuoteStore.getState().quote;
    syncQuoteToSupabase(quote);
}, 30000);
```

**Sync Logic:**
1. Check if quote changed since last save (string comparison)
2. Convert to DB format using `quoteToDb()`
3. Try UPDATE if has `id`, else lookup by `quote_number`
4. Handle upsert logic
5. Update `lastSavedQuote` ONLY on success

**Issues Identified:**

#### ⚠️ Race Condition: Rapid Edits
**Scenario:** User makes 3 edits within 30 seconds
- Edit 1: 0s - queued for save
- Edit 2: 10s - queued for save
- Edit 3: 20s - queued for save
- Auto-save: 30s - saves Edit 3

**Problem:** Edits 1 and 2 might be lost if they modify different sections
**Likelihood:** LOW (single-user editing, final state usually correct)
**Severity:** MEDIUM (data loss possible in edge cases)

**Recommendation:**
```javascript
// Add debounce to save more frequently after changes
const debouncedSave = debounce(() => syncQuoteToSupabase(quote), 2000);
// User types → wait 2s of inactivity → save
```

#### ⚠️ Optimistic UI with Sync Failure
**Current:** No sync failure notification to user
**Found:** `syncStatus` state exists but not displayed in UI

**Recommendation:**
- Add toast notification on sync failure
- Add visual indicator showing last saved time
- Add "Retry" button for failed syncs

### 5.3 Client Store Sync Analysis

**File:** `/src/store/clientStore.js`

**Sync Queue Implementation:**
```javascript
// Failed operations stored in localStorage
const SYNC_QUEUE_KEY = 'tell_clients_sync_queue';

function loadSyncQueue() {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
}
```

**Dual Storage Strategy:**
1. **LocalStorage** - Immediate write for UI responsiveness
2. **Supabase** - Background sync with retry queue
3. **Realtime** - Listen for changes from other clients

**Status:** ✅ GOOD - Robust offline-first architecture

### 5.4 Rate Card Store Sync

**File:** `/src/store/rateCardStore.js`

**Pricing Structure Migration:**
```javascript
// OLD: { cost: number, charge: number }
// NEW: { cost: { amount, baseCurrency }, charge: { amount, baseCurrency } }

const migrateLegacyPricing = (legacyPricing, currencyPricing) => {
    // Converts old format to new format with currency metadata
};
```

**Multi-currency Support:** ✅ Implemented with regional defaults

**Issue:** Mixed data formats in database during transition period
**Risk:** LOW - migration function handles both formats

### 5.5 Field Mapping Consistency

**File:** `/src/utils/dbFieldMapping.js`

**Created:** December 31, 2024 (part of relationship fixes)

**Mapped Fields:**

| Frontend (camelCase) | Database (snake_case) |
|---------------------|----------------------|
| `quoteNumber` | `quote_number` |
| `quoteDate` | `quote_date` |
| `validityDays` | `validity_days` |
| `preparedBy` | `prepared_by` |
| `rateCardItemId` | `rate_card_item_id` ⚠️ |
| `kitItemId` | `kit_item_id` |
| `clientId` | `client_id` |
| `organizationId` | `organization_id` |

**Critical Fix:** `rateCardItemId` was not being converted, causing FK lookup failures

**Store Coverage:**
- ✅ `quoteStore.js` - Uses `quoteToDb()`, `quoteFromDb()`
- ❌ `clientStore.js` - Manual field mapping (inconsistent)
- ❌ `opportunityStore.js` - Manual field mapping (inconsistent)
- ❌ `invoiceStore.js` - Not using centralized mapping
- ❌ `contactStore.js` - Not using centralized mapping

**Recommendation:** Migrate all stores to use centralized mapping utilities

---

## 6. JSONB Column Structure Analysis

### 6.1 Quote JSONB Columns

**Table:** `quotes`

```sql
client JSONB DEFAULT '{}'        -- Denormalized client info
project JSONB DEFAULT '{}'       -- Project details + section metadata
sections JSONB DEFAULT '{}'      -- Hierarchical: sections → subsections → items[]
fees JSONB DEFAULT '{}'          -- Management fee, commission, discount
proposal JSONB DEFAULT '{}'      -- Proposal-specific data
```

**Structure Validation:**

#### `sections` Column Structure
```javascript
{
    "prod_production": {
        "name": "Production",
        "visible": true,
        "subsections": {
            "prod_crew": [
                {
                    "id": "uuid",
                    "name": "Director",
                    "quantity": 1,
                    "days": 5,
                    "cost": 500,
                    "charge": 800,
                    "rateCardItemId": "uuid",  // FK reference
                    "notes": ""
                }
            ]
        }
    }
}
```

**Integrity Issues:**
1. **No Schema Validation:** JSONB accepts any structure
2. **FK References Unenforceable:** `rateCardItemId` in JSONB can't have FK constraint
3. **Orphaned Item IDs:** If rate card item deleted, JSONB still holds stale ID

**Recommendation:**
- Add application-level validation before saving
- Add periodic cleanup job to check for orphaned IDs
- Consider extracting line items to separate `quote_line_items` table

#### `client` Column (Denormalized)
```javascript
{
    "id": "uuid",
    "company": "Acme Corp",
    "contact": "John Doe",
    "email": "john@acme.com",
    "phone": "+1234567890"
}
```

**Issue:** Client data duplicated - can become stale if client updated
**Status:** ACCEPTABLE for quote history (frozen snapshot)

### 6.2 Settings JSONB Columns

**Table:** `settings`

```sql
company JSONB DEFAULT '{}'
quote_defaults JSONB DEFAULT '{}'
users JSONB DEFAULT '[]'              -- ⚠️ Replaced by user_profiles table
ai_settings JSONB DEFAULT '{}'
ops_preferences JSONB DEFAULT '{}'
dashboard_preferences JSONB DEFAULT '{}'
```

**Issue:** `users` JSONB column deprecated but still in schema
**Migration Path:** Data moved to `user_profiles` table
**Recommendation:** Add migration to remove `users` column after confirming no usage

### 6.3 Opportunities JSONB Columns

```sql
client JSONB DEFAULT '{}'       -- Denormalized client
contacts JSONB DEFAULT '[]'     -- Array of contact objects
```

**Structure:**
```javascript
contacts: [
    { id: "uuid", name: "Jane Smith", email: "jane@client.com", isPrimary: true },
    { id: "uuid", name: "Bob Jones", email: "bob@client.com", isPrimary: false }
]
```

**Issue:** Contact IDs don't reference `contacts` table
**Risk:** MEDIUM - orphaned contact references possible
**Recommendation:** Add validation to check contact IDs exist

---

## 7. Specific Relationship Issues

### 7.1 Rate Cards ↔ Quotes

**Expected Flow:**
1. User selects rate card item
2. `rateCardItemId` copied to quote line item
3. Price/cost copied from rate card at time of quote creation

**Issue Found:**
```javascript
// In quoteStore.js - OLD CODE (fixed)
sections: {
    subsections: {
        items: [
            { rateCardItemId: "abc123" }  // Was not being converted to snake_case
        ]
    }
}
```

**Fix Applied:** `dbFieldMapping.js` now converts `rateCardItemId` → `rate_card_item_id`

**Remaining Issue:**
- No FK constraint possible (JSONB column)
- Can't CASCADE delete if rate card item removed
- Orphaned references require manual cleanup

### 7.2 Quotes ↔ Clients ↔ Organizations

**Relationship Chain:**
```
organizations (1) → (N) clients (1) → (N) quotes
```

**FK Constraints:**
```sql
clients.organization_id → organizations(id) ON DELETE CASCADE
quotes.organization_id → organizations(id) ON DELETE CASCADE
```

**Issue:** Quote has BOTH `organization_id` FK and `client` JSONB
- If client deleted, `client` JSONB still has old data
- If organization deleted, both quote and client CASCADE delete

**Status:** ACCEPTABLE - quotes are tied to organization primarily

**Alternative Design:**
```sql
quotes.client_id → clients(id) ON DELETE SET NULL
-- Remove quotes.organization_id, derive from clients.organization_id
```

### 7.3 Opportunities ↔ Quotes Conversion

**Flow:**
1. Opportunity created with `stage = 'lead'`
2. Move through pipeline: `lead` → `qualified` → `proposal` → `negotiation`
3. Convert to quote: `converted_to_quote_id` set

**FK Constraint:**
```sql
opportunities.converted_to_quote_id → quotes(id) ON DELETE SET NULL
```

**Issue:** Bidirectional reference not enforced
- Quote doesn't have `opportunity_id` FK back
- Can't easily find "which opportunity created this quote" without scanning

**Recommendation:**
```sql
ALTER TABLE quotes ADD COLUMN opportunity_id UUID
    REFERENCES opportunities(id) ON DELETE SET NULL;
```

### 7.4 Projects ↔ Quotes ↔ Invoices

**Current Structure:**
```
quotes.id ← projects.quote_id
projects.id ← invoices.project_id
```

**Issue:** No direct `invoices.quote_id` relationship
**Current:** `invoices.quote_id` exists but `invoices.project_id` has no FK

**Fix Needed:**
```sql
ALTER TABLE invoices ADD CONSTRAINT invoices_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
```

**Status:** ⚠️ FK missing, data integrity at risk

### 7.5 Crew Bookings ↔ Projects ↔ Call Sheets

**Structure:**
```
projects (1) → (N) crew_bookings
projects (1) → (N) call_sheets
call_sheets (1) → (N) call_sheet_crew
```

**FK Constraints:**
```sql
crew_bookings.project_id → projects(id)  -- NOW HAS FK (fixed)
call_sheets.project_id → projects(id)    -- NOW HAS FK (fixed)
call_sheet_crew.call_sheet_id → call_sheets(id)
call_sheet_crew.crew_id → crew(id)
```

**Issue:** `crew_bookings.crew_id` has no FK to `crew` table
**Risk:** Can book non-existent crew member

**Recommendation:**
```sql
ALTER TABLE crew_bookings ADD CONSTRAINT crew_bookings_crew_id_fkey
    FOREIGN KEY (crew_id) REFERENCES crew(id) ON DELETE SET NULL;
```

### 7.6 Kit Items ↔ Bookings

**Structure:**
```
kit_items (1) → (N) kit_bookings
```

**FK Constraint:**
```sql
kit_bookings.kit_item_id → kit_items(id) ON DELETE CASCADE
```

**Status:** ✅ GOOD

**Availability Tracking:**
```sql
-- Trigger updates quantity_available on booking status change
CREATE TRIGGER kit_booking_availability_update
    AFTER INSERT OR UPDATE ON kit_bookings
    FOR EACH ROW EXECUTE update_kit_availability_on_booking();
```

**Issue:** Trigger assumes `kit_items.quantity_available` column exists
**Verification Needed:** Check if column exists in schema

---

## 8. Data Integrity Recommendations

### 8.1 High Priority (Security/Data Loss Risk)

1. **Add Missing FKs**
   ```sql
   ALTER TABLE invoices
       ADD CONSTRAINT invoices_project_id_fkey
       FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

   ALTER TABLE crew_bookings
       ADD CONSTRAINT crew_bookings_crew_id_fkey
       FOREIGN KEY (crew_id) REFERENCES crew(id) ON DELETE SET NULL;

   ALTER TABLE quotes
       ADD COLUMN opportunity_id UUID,
       ADD CONSTRAINT quotes_opportunity_id_fkey
       FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL;
   ```

2. **Remove RLS NULL Bypass**
   ```sql
   -- Remove "OR organization_id IS NULL" from all policies after data migration
   CREATE POLICY "Users can view org quotes" ON quotes
       FOR SELECT USING (
           organization_id = get_user_organization_id()
           -- REMOVED: OR organization_id IS NULL
       );
   ```

3. **Add organization_id to Financial Tables**
   ```sql
   ALTER TABLE invoices ADD COLUMN organization_id UUID
       REFERENCES organizations(id) ON DELETE CASCADE;
   ALTER TABLE expenses ADD COLUMN organization_id UUID
       REFERENCES organizations(id) ON DELETE CASCADE;
   ALTER TABLE crew_bookings ADD COLUMN organization_id UUID
       REFERENCES organizations(id) ON DELETE CASCADE;
   ```

### 8.2 Medium Priority (Data Quality)

1. **Centralize Field Mapping**
   - Update `clientStore.js` to use `contactToDb()` / `contactFromDb()`
   - Update `opportunityStore.js` to use centralized mapping
   - Update `invoiceStore.js` to use `invoiceToDb()` / `invoiceFromDb()`

2. **Add JSONB Validation**
   ```javascript
   // In quoteStore.js before saving
   function validateQuoteSections(sections) {
       for (const [sectionId, section] of Object.entries(sections)) {
           for (const [subId, items] of Object.entries(section.subsections)) {
               for (const item of items) {
                   // Validate required fields
                   if (!item.name || item.quantity == null) {
                       throw new Error(`Invalid line item in ${sectionId}/${subId}`);
                   }
                   // Check rateCardItemId exists if provided
                   if (item.rateCardItemId) {
                       await validateRateCardItemExists(item.rateCardItemId);
                   }
               }
           }
       }
   }
   ```

3. **Add Orphaned Reference Cleanup Job**
   ```sql
   -- Periodic job to find orphaned rate_card_item_id references
   CREATE OR REPLACE FUNCTION cleanup_orphaned_quote_references()
   RETURNS void AS $$
   BEGIN
       -- Log orphaned references (don't delete - just report)
       -- Application should handle cleanup
   END;
   $$ LANGUAGE plpgsql;
   ```

### 8.3 Low Priority (Nice to Have)

1. **Add Database Comments**
   ```sql
   COMMENT ON TABLE quotes IS 'Customer quotes with hierarchical line items';
   COMMENT ON COLUMN quotes.sections IS 'JSONB structure: {sectionId: {subsections: {subId: [items]}}}';
   COMMENT ON COLUMN quotes.organization_id IS 'Multi-tenant isolation';
   ```

2. **Add Check Constraints**
   ```sql
   ALTER TABLE quotes
       ADD CONSTRAINT quotes_validity_days_positive
       CHECK (validity_days > 0);

   ALTER TABLE invoices
       ADD CONSTRAINT invoices_due_after_issue
       CHECK (due_date >= issue_date);
   ```

3. **Extract Line Items Table** (Breaking Change)
   ```sql
   CREATE TABLE quote_line_items (
       id UUID PRIMARY KEY,
       quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
       section TEXT NOT NULL,
       subsection TEXT NOT NULL,
       sort_order INT NOT NULL,
       name TEXT NOT NULL,
       quantity NUMERIC NOT NULL,
       days NUMERIC NOT NULL,
       rate_card_item_id UUID REFERENCES rate_cards(id) ON DELETE SET NULL,
       -- Normalize structure out of JSONB
   );
   ```

---

## 9. Frontend Sync Improvements

### 9.1 Add Debounced Auto-Save

**Current:** Fixed 30-second interval
**Proposed:** Save 2 seconds after user stops typing

```javascript
// quoteStore.js
import { debounce } from 'lodash';

const debouncedSync = debounce((quote) => {
    syncQuoteToSupabase(quote);
}, 2000);

// In store subscription
useQuoteStore.subscribe(
    (state) => state.quote,
    (quote) => {
        debouncedSync(quote);
    }
);
```

### 9.2 Add Sync Status UI

```javascript
// Add to quoteStore
syncStatus: 'idle' | 'syncing' | 'success' | 'error',
lastSyncTime: Date | null,
syncError: string | null,

// In UI
{syncStatus === 'syncing' && <Spinner />}
{syncStatus === 'success' && <CheckIcon />}
{syncStatus === 'error' && (
    <ErrorBadge onClick={() => retrySync()}>
        {syncError} - Retry
    </ErrorBadge>
)}
```

### 9.3 Add Conflict Resolution

**Scenario:** User edits quote in two browser tabs

**Current:** Last write wins (data loss possible)

**Proposed:**
```javascript
async function syncQuoteToSupabase(quote) {
    // 1. Check updated_at timestamp
    const { data: current } = await supabase
        .from('quotes')
        .select('updated_at')
        .eq('id', quote.id)
        .single();

    // 2. If remote is newer, show conflict UI
    if (current.updated_at > quote.lastSyncedAt) {
        showConflictDialog({
            local: quote,
            remote: await fetchQuote(quote.id)
        });
        return { conflict: true };
    }

    // 3. Proceed with update
    // ...
}
```

---

## 10. Schema Diagram (Text-Based)

### 10.1 Core Entities

```
                 ┌──────────────────────┐
                 │   organizations      │
                 │  ─────────────────   │
                 │  PK: id (UUID)       │
                 │  name, slug          │
                 │  subscription_status │
                 └──────────┬───────────┘
                            │
                 ┌──────────┴───────────┐
                 │ organization_id (FK) │
                 └──────────┬───────────┘
                            │
          ┌─────────────────┼─────────────────────┐
          │                 │                     │
          ▼                 ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│     clients      │ │   rate_cards     │ │   user_profiles  │
│ ──────────────── │ │ ──────────────── │ │ ──────────────── │
│ PK: id           │ │ PK: id           │ │ PK: id           │
│ company          │ │ name, section    │ │ auth_user_id FK  │
│ contacts JSONB   │ │ cost, charge     │ │ role, status     │
│ organization_id  │ │ organization_id  │ │ organization_id  │
└────────┬─────────┘ └──────────────────┘ └──────────────────┘
         │
         │ client_id (FK)
         │
         ├──────────┐
         │          │
         ▼          ▼
┌──────────────────┐ ┌──────────────────┐
│  opportunities   │ │    contacts      │
│ ──────────────── │ │ ──────────────── │
│ PK: id           │ │ PK: id           │
│ client_id FK     │ │ client_id FK     │
│ converted_to_    │ │ name, email      │
│   quote_id FK    │ │ organization_id  │
│ stage, value     │ │ is_primary       │
└────────┬─────────┘ └──────────────────┘
         │
         │ converted_to_quote_id (FK)
         │
         ▼
┌──────────────────┐
│      quotes      │
│ ──────────────── │
│ PK: id           │
│ quote_number UK  │
│ client JSONB     │
│ sections JSONB   │◄──── Contains rateCardItemId (unenforceable FK)
│ fees JSONB       │
│ organization_id  │
└────────┬─────────┘
         │
         │ quote_id (FK)
         │
         ▼
┌──────────────────┐
│     projects     │
│ ──────────────── │
│ PK: id           │
│ name             │
│ client_id FK     │
│ quote_id FK      │
│ opportunity_id   │
│ organization_id  │
└────────┬─────────┘
         │
         ├─────────────────┬─────────────────┬─────────────────┐
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  invoices    │  │crew_bookings │  │ call_sheets  │  │ kit_bookings │
│ ────────────│  │ ────────────│  │ ────────────│  │ ────────────│
│ PK: id       │  │ PK: id       │  │ PK: id       │  │ PK: id       │
│ project_id   │  │ project_id FK│  │ project_id FK│  │ kit_item_id  │
│ quote_id FK  │  │ crew_id      │  │ status       │  │ project_id FK│
│ client_id FK │  │ day_rate     │  │ shoot_date   │  │ start/end    │
│ line_items   │  │ total_cost   │  │              │  │ status       │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
     (FK missing        (FK missing
      for project_id)    for crew_id)
```

### 10.2 AI/Knowledge Entities

```
┌──────────────────────────────────────────────────────────────┐
│                      AI Context Layer                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  agent_memory   │  │agent_learnings  │  │knowledge_    │ │
│  │                 │  │                 │  │ fragments    │ │
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤ │
│  │ memory_type     │  │ learning_type   │  │ fragment_type│ │
│  │ content JSONB   │  │ context JSONB   │  │ content TEXT │ │
│  │ country, region │  │ outcome JSONB   │  │ countries[]  │ │
│  │ related_quote_id│  │ quote_id FK     │  │ regions[]    │ │
│  │ related_client  │  │ confidence      │  │ tags[]       │ │
│  │ organization_id │  │ organization_id │  │ org_id       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                               │
│  ┌─────────────────┐                                         │
│  │  agent_tasks    │                                         │
│  ├─────────────────┤                                         │
│  │ agent_name      │                                         │
│  │ task_type       │                                         │
│  │ status          │                                         │
│  │ input_data JSON │                                         │
│  │ output_data JSON│                                         │
│  │ related_quote_id│                                         │
│  │ organization_id │                                         │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Migration Checklist

### 11.1 Migrations Created (Ready to Apply)

- [x] `20251231_fix_data_relationships.sql` - Core FK fixes
- [x] `20251231_consolidate_duplicates.sql` - Merge duplicate tables
- [x] `20251227_multi_tenancy.sql` - Organization isolation (already applied)

### 11.2 Pre-Migration Steps

1. **Backup Database**
   ```bash
   pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d).sql
   ```

2. **Test Migrations on Staging**
   ```bash
   psql -h staging -U user -d db < supabase/migrations/20251231_fix_data_relationships.sql
   psql -h staging -U user -d db < supabase/migrations/20251231_consolidate_duplicates.sql
   ```

3. **Verify Data Integrity**
   ```sql
   -- Check for orphaned records before migration
   SELECT id, quote_number FROM quotes WHERE organization_id IS NULL;
   SELECT id, company FROM clients WHERE organization_id IS NULL;
   ```

### 11.3 Post-Migration Verification

1. **Verify FK Constraints**
   ```sql
   SELECT conname, conrelid::regclass, confrelid::regclass
   FROM pg_constraint
   WHERE contype = 'f'
   AND conrelid::regclass::text IN ('projects', 'invoices', 'crew_bookings');
   ```

2. **Check Backup Tables**
   ```sql
   SELECT COUNT(*) FROM agent_memory_backup;
   SELECT COUNT(*) FROM agent_memory; -- Should match or be greater
   ```

3. **Test CRUD Operations**
   - Create new quote
   - Update existing quote
   - Delete client (ensure SET NULL works)
   - Delete organization (ensure CASCADE works)

4. **Frontend Smoke Test**
   - Load quotes page
   - Edit and save quote
   - Create new client
   - Convert opportunity to quote

---

## 12. Risk Assessment Matrix

| Issue | Severity | Likelihood | Impact | Status |
|-------|----------|-----------|--------|--------|
| Missing `projects` table causing FK failures | **CRITICAL** | High | Data corruption | ✅ FIXED |
| Task board FKs to non-existent `users` | **HIGH** | Medium | App crashes | ✅ FIXED |
| Duplicate `contacts` tables | **HIGH** | Medium | Data inconsistency | ⚠️ Migration ready |
| Missing organization_id on invoices | **HIGH** | High | Multi-tenant data leak | ❌ TODO |
| JSONB orphaned rate card references | **MEDIUM** | Medium | Stale pricing data | ⚠️ Validation needed |
| Race condition in auto-save | **MEDIUM** | Low | Data loss in edge cases | ⚠️ Debounce recommended |
| No sync status UI | **MEDIUM** | High | User confusion | ❌ TODO |
| Crew booking crew_id missing FK | **MEDIUM** | Low | Booking invalid crew | ❌ TODO |
| Invoice project_id missing FK | **MEDIUM** | Medium | Orphaned invoices | ❌ TODO |
| RLS NULL bypass | **MEDIUM** | Low | Data leak to old records | ⚠️ Remove after migration |

**Legend:**
- ✅ FIXED - Resolved in migration
- ⚠️ Partial - Migration ready or workaround exists
- ❌ TODO - Needs implementation

---

## 13. Conclusion

### 13.1 Overall Assessment

ProductionOS has a **complex but well-structured schema** with recent improvements significantly enhancing data integrity. The multi-tenancy migration and FK relationship fixes have addressed the most critical issues.

**Strengths:**
- Consistent UUID primary keys across all tables
- Auto-update timestamps with triggers
- Row-level security implemented
- Multi-tenancy foundation in place
- Centralized field mapping utilities created

**Weaknesses:**
- JSONB usage prevents FK constraint enforcement
- Some tables still missing organization_id
- Duplicate table definitions require consolidation
- Frontend sync lacks conflict resolution
- No visual sync status for users

### 13.2 Priority Actions

**Week 1 (Critical):**
1. Apply migration `20251231_fix_data_relationships.sql`
2. Apply migration `20251231_consolidate_duplicates.sql`
3. Add organization_id to invoices, expenses, crew_bookings
4. Remove RLS NULL bypass after verifying all data has organization_id

**Week 2 (High):**
1. Add missing FK for invoices.project_id
2. Add missing FK for crew_bookings.crew_id
3. Add sync status UI to quote editor
4. Implement debounced auto-save

**Month 1 (Medium):**
1. Migrate all stores to centralized field mapping
2. Add JSONB validation before saves
3. Implement conflict resolution for multi-tab editing
4. Add orphaned reference cleanup job

### 13.3 Long-term Recommendations

1. **Extract Line Items Table** - Move quote line items out of JSONB for better referential integrity
2. **Add Database Comments** - Document JSONB structures and FK relationships
3. **Implement Optimistic Locking** - Prevent concurrent update conflicts
4. **Add Integration Tests** - Test FK cascades and RLS policies
5. **Create Schema Migration Guide** - Document how to safely modify production schema

---

## Appendix A: Table Inventory

### Complete Table List (90+ tables)

**Core (6):**
- organizations, organization_members, subscriptions
- quotes, clients, rate_cards

**User Management (4):**
- user_profiles, user_invitations, onboarding_progress, onboarding_checklist

**CRM (6):**
- opportunities, contacts, activities
- email_messages, email_threads, email_tracking_events

**Projects (5):**
- projects, project_phases
- tasks, task_boards, task_cards

**Crew (7):**
- crew, crew_departments, crew_availability
- crew_project_history, crew_bookings
- call_sheets, call_sheet_crew

**Equipment (6):**
- kit_items, kit_categories, kit_bookings
- equipment, kit_maintenance

**Financial (5):**
- invoices, expenses, purchase_orders, contracts
- billing_invoices

**AI/Knowledge (8):**
- agent_memory, agent_learnings, agent_tasks
- knowledge_fragments, knowledge_relationships
- research_logs

**Email Integration (4):**
- gmail_tokens, microsoft_tokens, google_calendar_events
- email_sequences, email_sequence_enrollments

**Workflow (3):**
- workflow_rules, workflow_executions
- automation_logs

**Sports Research (4):**
- sports_events, sports_venues, sports_organizations
- media_rights

**Audit/Compliance (5):**
- audit_logs, data_export_requests, account_deletion_requests
- gdpr_logs, security_events

**Settings (3):**
- settings, rate_card_sections, sops

**Other (15+):**
- deliverables, resources, timeline_items
- documents, document_versions
- leads, lead_scoring
- deal_context
- And more...

---

## Appendix B: SQL Queries for Validation

### B.1 Find Orphaned Records

```sql
-- Quotes without organization
SELECT id, quote_number, created_at
FROM quotes
WHERE organization_id IS NULL;

-- Clients without organization
SELECT id, company, created_at
FROM clients
WHERE organization_id IS NULL;

-- Invoices referencing deleted projects
SELECT i.id, i.invoice_number, i.project_id
FROM invoices i
LEFT JOIN projects p ON i.project_id = p.id
WHERE i.project_id IS NOT NULL AND p.id IS NULL;
```

### B.2 Check FK Integrity

```sql
-- List all foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### B.3 Find Duplicate Table Definitions

```sql
-- Count tables by name (will show duplicates if any)
SELECT table_name, COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
GROUP BY table_name
HAVING COUNT(*) > 1;
```

---

**Report Generated:** December 31, 2024
**Auditor:** Claude (Anthropic)
**Review Status:** Complete - Awaiting Client Review
**Next Steps:** Apply migrations after approval
