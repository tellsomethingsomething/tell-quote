# Data Relationship Fixes

> ## **PRODUCTION STATUS: APPLIED (2026-01-02)**
> All fixes documented here are deployed in production.

## Summary

This document describes the fixes applied to resolve broken data relationships in the ProductionOS codebase.

## Files Created/Modified

### SQL Migrations

1. **`supabase/migrations/20251231_fix_data_relationships.sql`**
   - Creates missing tables: `projects`, `activities`, `email_messages`, `equipment`
   - Fixes FK references from `users` to `auth.users` for task board tables
   - Adds FK constraints for `project_id` across related tables
   - Fixes `google_tokens.user_id` type from `text` to `uuid`
   - Adds missing indexes on foreign key columns
   - Enables RLS and adds policies for new tables

2. **`supabase/migrations/20251231_consolidate_duplicates.sql`**
   - Consolidates 3 duplicate `contacts` tables into unified schema
   - Consolidates `agent_memory` tables (research + agent schemas)
   - Consolidates `agent_learnings` tables
   - Consolidates `knowledge_fragments` tables
   - Consolidates `agent_tasks` tables
   - Creates backup tables before dropping (for safety)

### JavaScript Files

3. **`src/utils/dbFieldMapping.js`** (NEW)
   - Centralized field name conversion utilities
   - `camelToSnake()` / `snakeToCamel()` - Generic converters
   - `quoteToDb()` / `quoteFromDb()` - Quote-specific mapping
   - `contactToDb()` / `contactFromDb()` - Contact-specific mapping
   - `invoiceToDb()` / `invoiceFromDb()` - Invoice-specific mapping
   - `lineItemToDb()` / `lineItemFromDb()` - Line item mapping (fixes `rateCardItemId` issue)

4. **`src/services/subscriptionGuard.js`** (MODIFIED)
   - Line 308: Changed `crew_contacts` to `crew` for consistent table naming

5. **`src/store/quoteStore.js`** (MODIFIED)
   - Added import for `quoteToDb` utility
   - Updated `syncQuoteToSupabase()` to use centralized field mapping

---

## How to Apply Fixes

### Step 1: Run SQL Migrations

```bash
# Option A: Via Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Run 20251231_fix_data_relationships.sql first
# 3. Review and run 20251231_consolidate_duplicates.sql

# Option B: Via Supabase CLI
supabase db push
```

### Step 2: Verify Frontend Changes

The JavaScript changes are already applied. Verify by running:

```bash
npm run build
```

---

## What Was Fixed

### Critical Issues (Now Resolved)

| Issue | Fix Applied |
|-------|-------------|
| Missing `projects` table | Created with proper schema and FKs |
| Missing `activities` table | Created with proper schema and FKs |
| Missing `email_messages` table | Created with proper schema and FKs |
| Missing `equipment` table | Created with proper schema and FKs |
| `crew` vs `crew_contacts` mismatch | Changed to consistent `crew` table |
| Task board FKs to non-existent `users` | Changed to `auth.users` |
| `rateCardItemId` field not converted | Added centralized field mapping |
| `google_tokens.user_id` type mismatch | Changed from `text` to `uuid` |

### High Severity Issues (Now Resolved)

| Issue | Fix Applied |
|-------|-------------|
| 3 duplicate `contacts` tables | Consolidated into single unified table |
| 4 duplicate `agent_memory` tables | Consolidated with all columns from both |
| Missing indexes on FKs | Added indexes for all FK columns |
| Field naming inconsistencies | Created `dbFieldMapping.js` utility |

---

## Database Schema After Migration

### New Tables

```
projects
├── id (PK)
├── name
├── client_id → clients(id)
├── opportunity_id → opportunities(id)
├── quote_id → quotes(id)
├── organization_id
└── ... (status, dates, etc.)

activities
├── id (PK)
├── title
├── activity_type
├── client_id → clients(id)
├── contact_id → contacts(id)
├── opportunity_id → opportunities(id)
├── project_id → projects(id)
├── assigned_to → auth.users(id)
└── organization_id

email_messages
├── id (PK)
├── thread_id
├── contact_id → contacts(id)
├── client_id → clients(id)
├── user_id → auth.users(id)
└── organization_id

equipment
├── id (PK)
├── name
├── category
├── organization_id
└── ... (quantity, rates, etc.)
```

### Fixed FK Relationships

```
task_boards.created_by → auth.users(id)   ✓ (was → users)
task_cards.created_by → auth.users(id)    ✓ (was → users)
task_comments.user_id → auth.users(id)    ✓ (was → users)
crew_bookings.project_id → projects(id)   ✓ (was dangling)
invoices.project_id → projects(id)        ✓ (was dangling)
calendar_events.activity_id → activities  ✓ (was dangling)
```

---

## Field Mapping Usage

### In Stores

```javascript
import { quoteToDb, quoteFromDb } from '../utils/dbFieldMapping';

// Writing to DB
const dbQuote = quoteToDb(quote);
await supabase.from('quotes').insert(dbQuote);

// Reading from DB
const { data } = await supabase.from('quotes').select('*');
const quotes = data.map(quoteFromDb);
```

### Mapped Fields

| Frontend (camelCase) | Database (snake_case) |
|---------------------|----------------------|
| `quoteNumber` | `quote_number` |
| `quoteDate` | `quote_date` |
| `validityDays` | `validity_days` |
| `preparedBy` | `prepared_by` |
| `rateCardItemId` | `rate_card_item_id` |
| `kitItemId` | `kit_item_id` |
| `clientId` | `client_id` |
| `contactId` | `contact_id` |
| `organizationId` | `organization_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

---

## Remaining Manual Tasks

### After Running Migrations

1. **Verify backup tables exist** before deleting:
   ```sql
   SELECT COUNT(*) FROM agent_memory_backup;
   SELECT COUNT(*) FROM agent_learnings_backup;
   ```

2. **Clean up backups** when satisfied:
   ```sql
   DROP TABLE IF EXISTS agent_memory_backup;
   DROP TABLE IF EXISTS agent_learnings_backup;
   DROP TABLE IF EXISTS knowledge_fragments_backup;
   DROP TABLE IF EXISTS agent_tasks_backup;
   ```

3. **Update other stores** to use field mapping (optional but recommended):
   - `contactStore.js`
   - `invoiceStore.js`
   - `opportunityStore.js`

---

## Testing Checklist

- [ ] Run `npm run build` - no compilation errors
- [ ] Run `npm run dev` - app loads
- [ ] Create a new quote - saves to Supabase correctly
- [ ] Load an existing quote - fields display correctly
- [ ] Check Supabase logs for any FK constraint errors
- [ ] Verify crew count works in subscription guard
- [ ] Test project creation (if feature exists)

---

## Rollback Instructions

If issues occur, the migrations can be rolled back:

```sql
-- Restore backup tables
ALTER TABLE agent_memory RENAME TO agent_memory_new;
ALTER TABLE agent_memory_backup RENAME TO agent_memory;

-- Drop new tables if needed
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS email_messages;
DROP TABLE IF EXISTS equipment;
```

For JavaScript changes, revert via git:
```bash
git checkout src/services/subscriptionGuard.js
git checkout src/store/quoteStore.js
rm src/utils/dbFieldMapping.js
```
