-- =====================================================
-- PERSISTENCE SCHEMA
-- Tables for stores currently using only localStorage
-- =====================================================

-- Invoice Templates
CREATE TABLE IF NOT EXISTS invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL, -- App-generated ID
  name text NOT NULL,
  is_default boolean DEFAULT false,
  page_settings jsonb DEFAULT '{}',
  styles jsonb DEFAULT '{}',
  layout jsonb DEFAULT '[]', -- Array of modules
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(template_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_templates_default ON invoice_templates(is_default) WHERE is_default = true;

-- Deal Contexts (AI task suggestions per opportunity)
CREATE TABLE IF NOT EXISTS deal_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  suggested_tasks jsonb DEFAULT '[]',
  completed_tasks jsonb DEFAULT '[]',
  skipped_tasks jsonb DEFAULT '[]',
  milestones jsonb DEFAULT '[]',
  notes jsonb DEFAULT '[]',
  last_interaction timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_contexts_opportunity ON deal_contexts(opportunity_id);

-- Task Patterns (AI learning from user behavior)
CREATE TABLE IF NOT EXISTS task_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completed_tasks jsonb DEFAULT '[]', -- Last 100 completed tasks
  skipped_tasks jsonb DEFAULT '[]', -- Last 100 skipped tasks
  effectiveness jsonb DEFAULT '{}', -- Score per task template
  updated_at timestamptz DEFAULT now()
);

-- Only one row for task patterns (global)
INSERT INTO task_patterns (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Active Invoice Template Setting
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- Optional, for multi-user
  active_invoice_template_id text,
  preferences jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id)
);

-- Insert default preferences row
INSERT INTO user_preferences (id, user_id)
VALUES (gen_random_uuid(), NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust for your security model)
CREATE POLICY "Allow all for invoice_templates" ON invoice_templates FOR ALL USING (true);
CREATE POLICY "Allow all for deal_contexts" ON deal_contexts FOR ALL USING (true);
CREATE POLICY "Allow all for task_patterns" ON task_patterns FOR ALL USING (true);
CREATE POLICY "Allow all for user_preferences" ON user_preferences FOR ALL USING (true);

-- For development, disable RLS
ALTER TABLE invoice_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE deal_contexts DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

SELECT 'Persistence schema created successfully!' as status;
