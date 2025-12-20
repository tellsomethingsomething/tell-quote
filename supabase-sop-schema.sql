-- =====================================================
-- SOP (Standard Operating Procedures) SCHEMA
-- Tell Quote CRM - Checklist-based SOPs
-- =====================================================

-- =====================================================
-- SOPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  title text NOT NULL,
  category text NOT NULL, -- Operations, Graphics, Equipment, Commercial
  description text,

  -- Checklist items stored as JSONB array
  -- Each item: { id: string, text: string, completed: boolean }
  checklist jsonb DEFAULT '[]',

  -- Tags for search/filter
  tags text[] DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sops_category ON sops(category);
CREATE INDEX IF NOT EXISTS idx_sops_title ON sops(title);
CREATE INDEX IF NOT EXISTS idx_sops_tags ON sops USING gin(tags);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_sop_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sops_updated
BEFORE UPDATE ON sops
FOR EACH ROW EXECUTE FUNCTION update_sop_timestamp();

-- Disable RLS for development
ALTER TABLE sops DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'SOP schema created successfully! Table: sops' as status;
