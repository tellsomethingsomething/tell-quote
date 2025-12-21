-- Migration: Add CRM tables (companies, communications)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/deitlnfumugxcbxqqivk/sql/new

-- ============================================================
-- Companies table for CRM
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    category text,
    website text,
    email text,
    phone text,
    address text,
    country text,
    notes text,
    tags text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for companies
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies(name);
CREATE INDEX IF NOT EXISTS companies_category_idx ON companies(category);
CREATE INDEX IF NOT EXISTS companies_country_idx ON companies(country);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow all (internal tool)
DROP POLICY IF EXISTS "Allow all companies" ON companies;
CREATE POLICY "Allow all companies" ON companies FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Communications table for CRM
-- ============================================================
CREATE TABLE IF NOT EXISTS communications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'whatsapp', 'note', 'linkedin')),
    subject text,
    summary text,
    content text,
    direction text DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    action_items jsonb DEFAULT '[]',
    needs_followup boolean DEFAULT false,
    followup_date date,
    occurred_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for communications
CREATE INDEX IF NOT EXISTS communications_contact_id_idx ON communications(contact_id);
CREATE INDEX IF NOT EXISTS communications_company_id_idx ON communications(company_id);
CREATE INDEX IF NOT EXISTS communications_type_idx ON communications(type);
CREATE INDEX IF NOT EXISTS communications_occurred_at_idx ON communications(occurred_at DESC);
CREATE INDEX IF NOT EXISTS communications_needs_followup_idx ON communications(needs_followup) WHERE needs_followup = true;

-- Enable RLS
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Allow all (internal tool)
DROP POLICY IF EXISTS "Allow all communications" ON communications;
CREATE POLICY "Allow all communications" ON communications FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_communications_updated_at ON communications;
CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Add company_id to contacts table (link contacts to companies)
-- ============================================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS contacts_company_id_new_idx ON contacts(company_id);

-- Add additional CRM fields to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS markets text[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS projects text[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_followup_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_url text;

-- ============================================================
-- Verify the changes
-- ============================================================
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
