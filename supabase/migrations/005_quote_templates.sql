-- Quote Templates table
-- Stores reusable quote templates for faster quote creation

CREATE TABLE IF NOT EXISTS quote_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    sections JSONB NOT NULL,
    currency TEXT DEFAULT 'USD',
    region TEXT DEFAULT 'SEA',
    fees JSONB DEFAULT '{"managementFee": 0, "commissionFee": 0, "discountPercent": 0}'::jsonb,
    project_defaults JSONB DEFAULT '{}'::jsonb,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quote_templates_category ON quote_templates(category);
CREATE INDEX IF NOT EXISTS idx_quote_templates_created_at ON quote_templates(created_at DESC);

-- Enable RLS
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, can be restricted later with user auth)
CREATE POLICY "Allow all access to quote_templates"
    ON quote_templates
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE quote_templates IS 'Reusable quote templates for faster quote creation';
