-- =====================================================
-- KIT MODULE FIX - Run this to fix kit_items table
-- =====================================================

-- Drop the view first (depends on kit_items)
DROP VIEW IF EXISTS kit_items_extended;

-- Drop the old table if it has issues
DROP TABLE IF EXISTS kit_bookings;
DROP TABLE IF EXISTS kit_maintenance;
DROP TABLE IF EXISTS kit_items;

-- Recreate kit_items WITHOUT foreign key to rate_cards
CREATE TABLE kit_items (
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

  -- Rate card link (optional, no FK constraint)
  rate_card_id uuid,
  rate_card_item_id text,

  -- Override rates
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

ALTER TABLE kit_items DISABLE ROW LEVEL SECURITY;

-- Recreate the extended view
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

-- Recreate kit_bookings
CREATE TABLE kit_bookings (
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
CREATE INDEX IF NOT EXISTS idx_kit_bookings_quote ON kit_bookings(quote_id);

ALTER TABLE kit_bookings DISABLE ROW LEVEL SECURITY;

-- Recreate kit_maintenance
CREATE TABLE kit_maintenance (
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

-- Add photos column to sops if missing
ALTER TABLE sops ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]';

SELECT 'Kit module fixed! Tables: kit_items, kit_bookings, kit_maintenance' as status;
