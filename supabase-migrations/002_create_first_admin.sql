-- Migration: Create first admin user
-- IMPORTANT: Run this AFTER creating an auth user in Supabase Dashboard
--
-- Steps:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create New User"
-- 3. Enter your email and password
-- 4. Copy the user's UUID from the list
-- 5. Replace 'YOUR_AUTH_USER_UUID_HERE' below with that UUID
-- 6. Run this SQL

-- Create the first admin profile
-- Replace the UUID with your actual auth user UUID
INSERT INTO user_profiles (auth_user_id, name, email, role, tab_permissions)
VALUES (
    'YOUR_AUTH_USER_UUID_HERE',  -- Replace with actual UUID from auth.users
    'Tom',                        -- Replace with your name
    'your-email@company.com',     -- Replace with your email
    'admin',
    ARRAY['dashboard', 'quotes', 'clients', 'opportunities', 'tasks', 'rate-card', 'settings']
)
ON CONFLICT (auth_user_id) DO UPDATE SET
    role = 'admin',
    tab_permissions = ARRAY['dashboard', 'quotes', 'clients', 'opportunities', 'tasks', 'rate-card', 'settings'];
