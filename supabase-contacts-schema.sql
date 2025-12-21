-- Contacts & Communications Module Schema
-- Run this in Supabase SQL Editor

-- Companies (organizations)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('client', 'broadcaster', 'venue', 'supplier', 'federation', 'partner', 'agency', 'crew_agency')),
  markets TEXT[] DEFAULT '{}', -- ['Malaysia', 'Kuwait', 'Gulf', 'ASEAN', 'UK']
  website TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (individuals)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  location TEXT,
  timezone TEXT,
  category TEXT CHECK (category IN ('client', 'broadcaster', 'venue', 'crew', 'supplier', 'federation', 'partner', 'other')),
  day_rate NUMERIC, -- for crew
  currency TEXT DEFAULT 'USD',
  markets TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  projects TEXT[] DEFAULT '{}', -- project names: 'Shopee Cup', 'WAVA', etc.
  notes TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_followup_date DATE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications (email threads, calls, meetings, notes)
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('email', 'call', 'meeting', 'whatsapp', 'note', 'linkedin')) DEFAULT 'note',
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')) DEFAULT 'outbound',
  subject TEXT,
  summary TEXT, -- AI-generated summary
  content TEXT, -- full content
  gmail_thread_id TEXT,
  gmail_message_id TEXT,
  action_items JSONB DEFAULT '[]', -- [{text: '', done: false}]
  needs_followup BOOLEAN DEFAULT FALSE,
  followup_date DATE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- user who logged it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON contacts(last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_communications_contact ON communications(contact_id);
CREATE INDEX IF NOT EXISTS idx_communications_occurred ON communications(occurred_at);
CREATE INDEX IF NOT EXISTS idx_communications_gmail ON communications(gmail_thread_id);

-- Full text search on contacts
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(role, '') || ' ' || coalesce(notes, '')));

-- Full text search on communications
CREATE INDEX IF NOT EXISTS idx_communications_search ON communications USING gin(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')));

-- RLS Policies (assuming authenticated access)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON communications FOR ALL USING (true);

-- Function to update last_contacted_at when communication is added
CREATE OR REPLACE FUNCTION update_contact_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts
    SET last_contacted_at = NEW.occurred_at,
        updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_contacted_at
DROP TRIGGER IF EXISTS trigger_update_last_contacted ON communications;
CREATE TRIGGER trigger_update_last_contacted
  AFTER INSERT ON communications
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_last_contacted();

-- View for contacts with communication stats
CREATE OR REPLACE VIEW contacts_with_stats AS
SELECT
  c.*,
  comp.name as company_name,
  comp.category as company_category,
  COUNT(comm.id) as total_communications,
  MAX(comm.occurred_at) as latest_communication,
  COUNT(CASE WHEN comm.needs_followup THEN 1 END) as pending_followups,
  EXTRACT(DAY FROM NOW() - c.last_contacted_at) as days_since_contact
FROM contacts c
LEFT JOIN companies comp ON c.company_id = comp.id
LEFT JOIN communications comm ON c.id = comm.contact_id
GROUP BY c.id, comp.name, comp.category;
