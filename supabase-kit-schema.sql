-- =====================================================
-- KIT TRACKING SYSTEM SCHEMA
-- Tell Quote CRM - Equipment Management
-- =====================================================

-- =====================================================
-- KIT CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#6B7280', -- For UI display
  icon text DEFAULT 'box', -- Icon identifier
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

-- =====================================================
-- KIT ITEMS - Main Equipment Table
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identification
  kit_id text NOT NULL UNIQUE, -- Human-readable ID like CAM-001
  name text NOT NULL,
  category_id uuid REFERENCES kit_categories(id),
  manufacturer text,
  model text,
  serial_number text,

  -- Financial
  purchase_date date,
  purchase_price numeric(12,2),
  purchase_currency text DEFAULT 'USD',
  current_value numeric(12,2), -- Depreciated value
  depreciation_rate numeric(5,2) DEFAULT 20, -- Annual % depreciation

  -- Rates (linked to rate card or custom)
  rate_card_item_id uuid, -- Link to rate_cards table if using standard rate
  day_rate numeric(12,2),
  week_rate numeric(12,2),
  month_rate numeric(12,2),
  rate_currency text DEFAULT 'USD',

  -- Location & Status
  location text, -- KL Office, Kuwait, On Job, etc.
  status text DEFAULT 'available', -- available, on_job, maintenance, sold, retired, lost
  condition text DEFAULT 'good', -- excellent, good, fair, poor

  -- Hierarchy
  parent_kit_id uuid REFERENCES kit_items(id) ON DELETE SET NULL,
  is_package boolean DEFAULT false, -- True if this is a parent package

  -- Quantity tracking (for non-serialized items)
  quantity integer DEFAULT 1, -- Total quantity owned
  quantity_available integer DEFAULT 1, -- Currently available (not on job)

  -- Technical specs (JSONB for flexibility)
  specs jsonb DEFAULT '{}', -- resolution, connectors, power_type, etc.

  -- Tags
  technical_tags text[] DEFAULT '{}', -- 4K, SDI, XLR, V-Lock, etc.
  operational_tags text[] DEFAULT '{}', -- flight-case, rack-mount, weather-sealed
  job_type_tags text[] DEFAULT '{}', -- OB, Studio, REMI, Presentation

  -- Tracking
  last_used_date date,
  total_days_used integer DEFAULT 0,
  total_revenue numeric(12,2) DEFAULT 0,
  expected_lifespan_months integer DEFAULT 60, -- 5 years default

  -- Insurance
  insured boolean DEFAULT false,
  insurance_value numeric(12,2),
  insurance_policy_ref text,

  -- Meta
  notes text,
  image_url text,
  image_path text, -- Supabase Storage path for deletion
  manual_url text,
  qr_code text, -- For physical tracking

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_kit_items_kit_id ON kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_category ON kit_items(category_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_status ON kit_items(status);
CREATE INDEX IF NOT EXISTS idx_kit_items_location ON kit_items(location);
CREATE INDEX IF NOT EXISTS idx_kit_items_parent ON kit_items(parent_kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_technical_tags ON kit_items USING gin(technical_tags);
CREATE INDEX IF NOT EXISTS idx_kit_items_job_type_tags ON kit_items USING gin(job_type_tags);

-- =====================================================
-- KIT LOCATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  address text,
  country text,
  region text, -- SEA, GCC, etc.
  is_default boolean DEFAULT false,
  contact_name text,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);

-- Insert default locations
INSERT INTO kit_locations (name, country, region, is_default) VALUES
  ('KL Office', 'Malaysia', 'SEA', true),
  ('Kuwait Office', 'Kuwait', 'GCC', false),
  ('Bangkok Storage', 'Thailand', 'SEA', false),
  ('On Location', NULL, NULL, false)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- KIT BOOKINGS / ALLOCATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_item_id uuid REFERENCES kit_items(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,

  booking_type text DEFAULT 'job', -- job, maintenance, loan, reserved
  start_date date NOT NULL,
  end_date date NOT NULL,

  -- Rate applied
  rate_type text DEFAULT 'day', -- day, week, month, custom
  rate_amount numeric(12,2),
  total_amount numeric(12,2),

  -- Status
  status text DEFAULT 'confirmed', -- confirmed, tentative, cancelled, completed

  notes text,
  booked_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kit_bookings_item ON kit_bookings(kit_item_id);
CREATE INDEX IF NOT EXISTS idx_kit_bookings_dates ON kit_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_kit_bookings_quote ON kit_bookings(quote_id);
CREATE INDEX IF NOT EXISTS idx_kit_bookings_status ON kit_bookings(status);

-- =====================================================
-- KIT MAINTENANCE LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_item_id uuid REFERENCES kit_items(id) ON DELETE CASCADE,

  maintenance_type text NOT NULL, -- service, repair, calibration, cleaning, firmware
  description text NOT NULL,
  cost numeric(12,2),
  performed_by text, -- Internal or vendor name

  date_started date NOT NULL,
  date_completed date,

  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kit_maintenance_item ON kit_maintenance(kit_item_id);

-- =====================================================
-- VIEWS FOR CALCULATED FIELDS
-- =====================================================

-- View with calculated fields
CREATE OR REPLACE VIEW kit_items_extended AS
SELECT
  ki.*,
  kc.name as category_name,
  kc.color as category_color,
  kc.icon as category_icon,

  -- Age in months
  EXTRACT(MONTH FROM age(now(), ki.purchase_date::timestamp))::integer as age_months,

  -- Days since last use
  CASE
    WHEN ki.last_used_date IS NOT NULL
    THEN (CURRENT_DATE - ki.last_used_date)::integer
    ELSE NULL
  END as days_since_last_use,

  -- Replacement due date
  CASE
    WHEN ki.purchase_date IS NOT NULL AND ki.expected_lifespan_months IS NOT NULL
    THEN ki.purchase_date + (ki.expected_lifespan_months || ' months')::interval
    ELSE NULL
  END as replacement_due_date,

  -- Auto-calculated current value (straight-line depreciation)
  CASE
    WHEN ki.purchase_price IS NOT NULL AND ki.purchase_date IS NOT NULL
    THEN GREATEST(
      ki.purchase_price * (1 - (ki.depreciation_rate / 100) * EXTRACT(YEAR FROM age(now(), ki.purchase_date::timestamp))),
      ki.purchase_price * 0.1 -- Minimum 10% residual value
    )
    ELSE ki.current_value
  END as calculated_value,

  -- Child count
  (SELECT COUNT(*) FROM kit_items children WHERE children.parent_kit_id = ki.id) as child_count,

  -- Parent info
  parent.kit_id as parent_kit_code,
  parent.name as parent_name

FROM kit_items ki
LEFT JOIN kit_categories kc ON ki.category_id = kc.id
LEFT JOIN kit_items parent ON ki.parent_kit_id = parent.id;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate next kit ID for a category
CREATE OR REPLACE FUNCTION generate_kit_id(category_prefix text)
RETURNS text AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(kit_id FROM LENGTH(category_prefix) + 2) AS integer)
  ), 0) + 1
  INTO next_num
  FROM kit_items
  WHERE kit_id LIKE category_prefix || '-%';

  new_id := category_prefix || '-' || LPAD(next_num::text, 3, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check kit availability for date range
CREATE OR REPLACE FUNCTION check_kit_availability(
  p_kit_item_id uuid,
  p_start_date date,
  p_end_date date,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  conflict_count integer;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM kit_bookings
  WHERE kit_item_id = p_kit_item_id
    AND status IN ('confirmed', 'tentative')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
    );

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update kit status based on bookings
CREATE OR REPLACE FUNCTION update_kit_status_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking is confirmed and covers today, set status to on_job
  IF NEW.status = 'confirmed' AND NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
    UPDATE kit_items SET status = 'on_job', updated_at = now() WHERE id = NEW.kit_item_id;
  END IF;

  -- If booking completed, update last_used_date and revenue
  IF NEW.status = 'completed' AND (TG_OP = 'UPDATE' AND OLD.status != 'completed') THEN
    UPDATE kit_items
    SET
      last_used_date = NEW.end_date,
      total_days_used = total_days_used + (NEW.end_date - NEW.start_date + 1),
      total_revenue = total_revenue + COALESCE(NEW.total_amount, 0),
      status = 'available',
      updated_at = now()
    WHERE id = NEW.kit_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_kit_status
AFTER INSERT OR UPDATE ON kit_bookings
FOR EACH ROW EXECUTE FUNCTION update_kit_status_from_booking();

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_kit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kit_items_updated
BEFORE UPDATE ON kit_items
FOR EACH ROW EXECUTE FUNCTION update_kit_timestamp();

-- =====================================================
-- DISABLE RLS FOR DEVELOPMENT
-- =====================================================

ALTER TABLE kit_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE kit_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE kit_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE kit_maintenance DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Kit tracking schema created successfully! Tables: kit_categories, kit_items, kit_locations, kit_bookings, kit_maintenance' as status;
