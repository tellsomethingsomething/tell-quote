-- =====================================================
-- TELL QUOTE CRM - COMPLETE DATABASE SETUP
-- Run this file in Supabase SQL Editor to set up all tables
-- =====================================================

-- =====================================================
-- 1. KNOWLEDGE FRAGMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_type text NOT NULL, -- pricing, preference, requirement, process, relationship, market_intel
  title text,
  content text NOT NULL,
  source text DEFAULT 'human_input', -- deal_outcome, user_input, research, client_feedback
  confidence numeric(3,2) DEFAULT 0.5, -- 0-1
  verified boolean DEFAULT false,
  needs_review boolean DEFAULT false,
  region text,
  country text,
  deal_type text,
  client_id uuid,
  tags text[] DEFAULT '{}',
  applied_to_agents text[] DEFAULT '{}',
  impact_score numeric(5,2) DEFAULT 0,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_type ON knowledge_fragments(fragment_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_region ON knowledge_fragments(region);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_verified ON knowledge_fragments(verified);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_tags ON knowledge_fragments USING gin(tags);

ALTER TABLE knowledge_fragments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. AGENT MEMORY TABLE (Research Findings)
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL DEFAULT 'research',
  memory_type text NOT NULL, -- research_findings, market_intelligence, competitor_intel
  content jsonb NOT NULL,
  context_tags text[] DEFAULT '{}',
  relevance_score numeric(3,2) DEFAULT 0.5,
  source_urls text[] DEFAULT '{}',
  related_opportunity_id uuid,
  related_client_id uuid,
  related_quote_id uuid,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_memory_tags ON agent_memory USING gin(context_tags);
CREATE INDEX IF NOT EXISTS idx_agent_memory_opportunity ON agent_memory(related_opportunity_id);

ALTER TABLE agent_memory DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. AGENT TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  task_type text NOT NULL,
  status text DEFAULT 'pending', -- pending, running, completed, failed
  input_data jsonb,
  output_data jsonb,
  error_message text,
  related_opportunity_id uuid,
  related_client_id uuid,
  related_quote_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_name);

ALTER TABLE agent_tasks DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. AGENT LEARNINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  learning_type text NOT NULL,
  lesson text NOT NULL,
  context jsonb,
  outcome text,
  confidence_score numeric(3,2) DEFAULT 0.5,
  verified boolean DEFAULT false,
  quote_id uuid,
  opportunity_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_learnings_type ON agent_learnings(learning_type);

ALTER TABLE agent_learnings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. KIT CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'box',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO kit_categories (name, description, color, icon, sort_order) VALUES
  ('Camera', 'Cameras and camera bodies', '#3B82F6', 'video', 1),
  ('Lens', 'Camera lenses and adapters', '#8B5CF6', 'aperture', 2),
  ('Tripod', 'Tripods, heads, and support', '#10B981', 'maximize', 3),
  ('Audio', 'Microphones, mixers, recorders', '#F59E0B', 'mic', 4),
  ('Comms', 'Intercoms, IFBs, talkback', '#EF4444', 'headphones', 5),
  ('Graphics', 'Graphics systems, CG, replay', '#EC4899', 'monitor', 6),
  ('Switching', 'Vision mixers, switchers', '#6366F1', 'grid', 7),
  ('Streaming', 'Encoders, decoders, streaming gear', '#14B8A6', 'wifi', 8),
  ('Cabling', 'Cables, connectors, adapters', '#6B7280', 'cable', 9),
  ('Power', 'Batteries, chargers, power distribution', '#84CC16', 'battery', 10),
  ('Lighting', 'Lights, stands, modifiers', '#FBBF24', 'sun', 11),
  ('Monitors', 'Field monitors, broadcast monitors', '#0EA5E9', 'tv', 12),
  ('Storage', 'Cases, flight cases, racks', '#78716C', 'package', 13),
  ('Rigging', 'Clamps, arms, mounting hardware', '#A3A3A3', 'tool', 14),
  ('Network', 'Routers, switches, fiber', '#22D3EE', 'network', 15),
  ('Other', 'Miscellaneous equipment', '#9CA3AF', 'more-horizontal', 99)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE kit_categories DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. KIT ITEMS TABLE (Links to rate_cards for pricing)
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES kit_categories(id),
  manufacturer text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_price numeric(12,2),
  purchase_currency text DEFAULT 'USD',
  current_value numeric(12,2),
  depreciation_rate numeric(5,2) DEFAULT 20,

  -- Link to rate card for consistent pricing
  rate_card_id uuid REFERENCES rate_cards(id) ON DELETE SET NULL,
  rate_card_item_id text, -- The item ID within the rate card JSONB

  -- Override rates (if different from rate card)
  day_rate numeric(12,2),
  week_rate numeric(12,2),
  month_rate numeric(12,2),
  rate_currency text DEFAULT 'USD',

  location text,
  status text DEFAULT 'available',
  condition text DEFAULT 'good',
  parent_kit_id uuid REFERENCES kit_items(id) ON DELETE SET NULL,
  is_package boolean DEFAULT false,
  quantity integer DEFAULT 1,
  quantity_available integer DEFAULT 1,
  specs jsonb DEFAULT '{}',
  technical_tags text[] DEFAULT '{}',
  operational_tags text[] DEFAULT '{}',
  job_type_tags text[] DEFAULT '{}',
  last_used_date date,
  total_days_used integer DEFAULT 0,
  total_revenue numeric(12,2) DEFAULT 0,
  expected_lifespan_months integer DEFAULT 60,
  insured boolean DEFAULT false,
  insurance_value numeric(12,2),
  insurance_policy_ref text,
  notes text,
  image_url text,
  image_path text,
  manual_url text,
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

CREATE INDEX IF NOT EXISTS idx_kit_items_kit_id ON kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_category ON kit_items(category_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_status ON kit_items(status);
CREATE INDEX IF NOT EXISTS idx_kit_items_location ON kit_items(location);
CREATE INDEX IF NOT EXISTS idx_kit_items_parent ON kit_items(parent_kit_id);

ALTER TABLE kit_items DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. KIT LOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  address text,
  country text,
  region text,
  is_default boolean DEFAULT false,
  contact_name text,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO kit_locations (name, country, region, is_default) VALUES
  ('KL Office', 'Malaysia', 'SEA', true),
  ('Kuwait Office', 'Kuwait', 'GCC', false),
  ('Bangkok Storage', 'Thailand', 'SEA', false),
  ('On Location', NULL, NULL, false)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE kit_locations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. KIT BOOKINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_item_id uuid REFERENCES kit_items(id) ON DELETE CASCADE,
  quote_id uuid,
  opportunity_id uuid,
  booking_type text DEFAULT 'job',
  start_date date NOT NULL,
  end_date date NOT NULL,
  rate_type text DEFAULT 'day',
  rate_amount numeric(12,2),
  total_amount numeric(12,2),
  status text DEFAULT 'confirmed',
  notes text,
  booked_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kit_bookings_item ON kit_bookings(kit_item_id);
CREATE INDEX IF NOT EXISTS idx_kit_bookings_dates ON kit_bookings(start_date, end_date);

ALTER TABLE kit_bookings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. KIT MAINTENANCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_item_id uuid REFERENCES kit_items(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  description text NOT NULL,
  cost numeric(12,2),
  performed_by text,
  date_started date NOT NULL,
  date_completed date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kit_maintenance DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. KIT ITEMS EXTENDED VIEW
-- =====================================================

CREATE OR REPLACE VIEW kit_items_extended AS
SELECT
  ki.*,
  kc.name as category_name,
  kc.color as category_color,
  kc.icon as category_icon,
  EXTRACT(MONTH FROM age(now(), ki.purchase_date::timestamp))::integer as age_months,
  CASE
    WHEN ki.last_used_date IS NOT NULL
    THEN (CURRENT_DATE - ki.last_used_date)::integer
    ELSE NULL
  END as days_since_last_use,
  CASE
    WHEN ki.purchase_price IS NOT NULL AND ki.purchase_date IS NOT NULL
    THEN GREATEST(
      ki.purchase_price * (1 - (ki.depreciation_rate / 100) * EXTRACT(YEAR FROM age(now(), ki.purchase_date::timestamp))),
      ki.purchase_price * 0.1
    )
    ELSE ki.current_value
  END as calculated_value,
  (SELECT COUNT(*) FROM kit_items children WHERE children.parent_kit_id = ki.id) as child_count,
  parent.kit_id as parent_kit_code,
  parent.name as parent_name
FROM kit_items ki
LEFT JOIN kit_categories kc ON ki.category_id = kc.id
LEFT JOIN kit_items parent ON ki.parent_kit_id = parent.id;

-- =====================================================
-- 11. SOPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text,
  checklist jsonb DEFAULT '[]',
  photos jsonb DEFAULT '[]', -- Reference photos for instructions
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sops_category ON sops(category);

ALTER TABLE sops DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. SPORTS EVENTS RESEARCH TABLE (Links to opportunities)
-- =====================================================

CREATE TABLE IF NOT EXISTS sports_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL, -- Football, Futsal, Handball, Volleyball, Basketball
  event_name text NOT NULL,
  organization text,
  country text,
  region text,
  start_date date,
  end_date date,
  venue text,
  event_type text, -- league, cup, tournament, friendly, qualifier
  tier text, -- international, national, regional, local
  broadcast_status text, -- unknown, no_broadcast, local_only, international
  estimated_value numeric(12,2),
  currency text DEFAULT 'USD',
  source_url text,
  notes text,
  contacts jsonb DEFAULT '[]',

  -- Link to opportunity when converted
  converted_to_opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,

  research_status text DEFAULT 'new', -- new, reviewed, converted, dismissed
  discovered_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sports_events_sport ON sports_events(sport);
CREATE INDEX IF NOT EXISTS idx_sports_events_country ON sports_events(country);
CREATE INDEX IF NOT EXISTS idx_sports_events_status ON sports_events(research_status);
CREATE INDEX IF NOT EXISTS idx_sports_events_dates ON sports_events(start_date, end_date);

ALTER TABLE sports_events DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13. SYNC KIT TO RATE CARD FUNCTION
-- Automatically creates rate card item when kit item is added
-- =====================================================

CREATE OR REPLACE FUNCTION sync_kit_to_rate_card()
RETURNS TRIGGER AS $$
BEGIN
  -- If kit item has rates but no rate_card_id, we could auto-create
  -- For now, this is a placeholder for future integration
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 14. DATABASE RELATIONSHIPS SUMMARY
-- =====================================================
--
-- CORE RELATIONSHIPS:
-- 1. kit_items.rate_card_id -> rate_cards.id (Equipment pricing)
-- 2. kit_items.category_id -> kit_categories.id (Equipment categories)
-- 3. kit_items.parent_kit_id -> kit_items.id (Packages/children)
-- 4. kit_bookings.kit_item_id -> kit_items.id (Equipment bookings)
-- 5. kit_bookings.quote_id -> quotes.id (Quote equipment)
-- 6. kit_bookings.opportunity_id -> opportunities.id (Opportunity equipment)
-- 7. sports_events.converted_to_opportunity_id -> opportunities.id (Research->Pipeline)
-- 8. agent_memory.related_opportunity_id -> opportunities.id (Research findings)
-- 9. knowledge_fragments.client_id -> clients.id (Client knowledge)
--
-- =====================================================

-- =====================================================
-- 15. COMMERCIAL TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS commercial_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'research', -- research, outreach, proposal, follow_up, meeting, contract
  status text DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  priority text DEFAULT 'medium', -- low, medium, high, urgent
  start_date date,
  due_date date,
  completed_date date,

  -- Links
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  event_id uuid REFERENCES sports_events(id) ON DELETE SET NULL,
  assigned_to text,

  -- Comments/feedback for evolving prompts
  comments jsonb DEFAULT '[]',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commercial_tasks_status ON commercial_tasks(status);
CREATE INDEX IF NOT EXISTS idx_commercial_tasks_type ON commercial_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_commercial_tasks_due ON commercial_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_commercial_tasks_opp ON commercial_tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_commercial_tasks_event ON commercial_tasks(event_id);

ALTER TABLE commercial_tasks DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Database setup complete! All tables and relationships created successfully.' as status;
