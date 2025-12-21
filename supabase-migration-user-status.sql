-- Migration: Add user status and permissions management
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/deitlnfumugxcbxqqivk/sql/new

-- 1. Add status column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
CHECK (status IN ('pending', 'active', 'suspended'));

-- 2. Add email unique constraint (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_email_unique'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- 3. Update existing users to active status
UPDATE user_profiles SET status = 'active' WHERE status IS NULL;

-- 4. Set tom@tell.so as full admin with all permissions
UPDATE user_profiles
SET
    role = 'admin',
    status = 'active',
    tab_permissions = ARRAY['dashboard', 'quotes', 'clients', 'opportunities', 'tasks', 'sop', 'knowledge', 'kit', 'rate-card', 'contacts']
WHERE email = 'tom@tell.so';

-- 5. Create RLS policy for admin management (drop and recreate)
DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;

CREATE POLICY "Admins can manage profiles" ON user_profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.auth_user_id = auth.uid()
        AND up.role = 'admin'
    )
);

-- 6. Create contacts table if not exists
CREATE TABLE IF NOT EXISTS contacts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    role text,
    client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
    source text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    tags text[] DEFAULT '{}',
    notes text,
    last_contacted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create indexes for contacts
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts(client_id);
CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts(status);

-- 8. Enable RLS on contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 9. Create policy for contacts
DROP POLICY IF EXISTS "Allow all contacts" ON contacts;
CREATE POLICY "Allow all contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);

-- 10. Create trigger for contacts updated_at
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
SELECT id, email, name, role, status, tab_permissions FROM user_profiles ORDER BY created_at;
