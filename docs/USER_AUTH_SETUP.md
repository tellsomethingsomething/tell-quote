# User Authentication Setup Guide

This guide explains how to set up multi-user authentication with tab-level permissions and self-registration with admin approval.

## Prerequisites

- Supabase project set up and connected
- Access to Supabase Dashboard

## Setup Steps

### Step 1: Create the user_profiles Table

Run the migration in Supabase SQL Editor:

```sql
-- Copy and run the contents of:
-- supabase-migrations/001_user_profiles.sql
```

### Step 1b: Add User Approval Status (for self-registration)

Run this migration to enable self-registration with admin approval:

```sql
-- Copy and run the contents of:
-- supabase-migrations/003_user_approval_status.sql
```

### Step 2: Deploy Edge Functions

The Edge Functions for user creation/deletion need to be deployed to your Supabase project.

**Option A: Deploy via Supabase CLI**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the functions
supabase functions deploy create-user
supabase functions deploy delete-user
```

**Option B: Deploy via Supabase Dashboard**

1. Go to Edge Functions in your Supabase Dashboard
2. Create a new function called `create-user`
3. Paste the contents of `supabase/functions/create-user/index.ts`
4. Repeat for `delete-user`

### Step 3: Create Your First Admin User

1. **Create Auth User:**
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add User" > "Create New User"
   - Enter email: `your-email@company.com`
   - Enter password: `your-secure-password`
   - Click "Create User"
   - Note the user's UUID (shown in the list)

2. **Create Admin Profile:**
   - Go to SQL Editor
   - Run this query (replace values):

```sql
INSERT INTO user_profiles (auth_user_id, name, email, role, tab_permissions)
VALUES (
    'paste-auth-user-uuid-here',
    'Your Name',
    'your-email@company.com',
    'admin',
    ARRAY['dashboard', 'quotes', 'clients', 'opportunities', 'tasks', 'rate-card', 'settings']
);
```

### Step 4: Test Login

1. Go to your app and try logging in with the email/password you created
2. You should see all navigation tabs
3. Go to Settings > Users to manage other users

## How It Works

### User Roles

- **Admin**: Has access to all tabs including Settings. Can create, edit, and delete other users.
- **User**: Access controlled per-user. Cannot access Settings by default.

### Tab Permissions

Admins can configure which tabs each user can access:
- Dashboard
- Quotes
- Clients
- Opportunities (Ops)
- Tasks
- Rate Card
- Settings (Admin only)

### Activity Logging

All actions are logged with the authenticated user's name and ID. View the activity log in Settings > Activity Log.

## Troubleshooting

### "Failed to fetch users"
- Check that the `user_profiles` table exists
- Verify RLS policies are correctly set up

### "Only admins can create users"
- The Edge Function requires the calling user to be an admin
- Check that your user profile has `role = 'admin'`

### User can't see certain tabs
- Admin needs to edit the user and enable the required tab permissions

### Edge Function errors
- Check that the function is deployed
- Verify environment variables are set (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
