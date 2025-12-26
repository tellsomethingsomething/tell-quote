-- Resources & Deliverables Migration
-- Talent, Locations, Vendors databases + Project Deliverables tracking

-- ============================================
-- TALENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS talents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'actor', -- actor, model, influencer, voice_artist, presenter, extra, child, specialist
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    agent_name TEXT DEFAULT '',
    agent_email TEXT DEFAULT '',
    agent_phone TEXT DEFAULT '',
    headshot_url TEXT DEFAULT '',
    showreel_url TEXT DEFAULT '',
    portfolio_urls JSONB DEFAULT '[]',
    day_rate NUMERIC(12, 2),
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'available', -- available, booked, unavailable, pending
    skills JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    ethnicity TEXT DEFAULT '',
    age_range TEXT DEFAULT '',
    height TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    social_instagram TEXT DEFAULT '',
    social_tiktok TEXT DEFAULT '',
    follower_count INTEGER,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talents_name ON talents(name);
CREATE INDEX IF NOT EXISTS idx_talents_type ON talents(type);
CREATE INDEX IF NOT EXISTS idx_talents_status ON talents(status);

-- ============================================
-- LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'other', -- studio, office, residential, outdoor, industrial, retail, restaurant, hotel, rooftop, warehouse, beach, other
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    country TEXT DEFAULT '',
    coordinates JSONB, -- { lat: number, lng: number }
    contact_name TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    day_rate NUMERIC(12, 2),
    half_day_rate NUMERIC(12, 2),
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'available', -- available, booked, unavailable, pending
    photos JSONB DEFAULT '[]',
    permits_required BOOLEAN DEFAULT false,
    permit_notes TEXT DEFAULT '',
    parking TEXT DEFAULT '',
    power_available BOOLEAN DEFAULT true,
    wifi_available BOOLEAN DEFAULT true,
    load_in_notes TEXT DEFAULT '',
    restrictions TEXT DEFAULT '',
    nearby_amenities TEXT DEFAULT '',
    max_crew_size INTEGER,
    notes TEXT DEFAULT '',
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

-- ============================================
-- VENDORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'other', -- equipment_rental, catering, transport, props, wardrobe, makeup_hair, post_production, music_audio, insurance, legal, security, medical, generator, studio_rental, other
    company TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    website TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    country TEXT DEFAULT '',
    contact_name TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_preferred BOOLEAN DEFAULT false,
    payment_terms TEXT DEFAULT '',
    bank_details TEXT DEFAULT '',
    tax_id TEXT DEFAULT '',
    services JSONB DEFAULT '[]',
    price_range TEXT DEFAULT '', -- budget, mid, premium
    min_order NUMERIC(12, 2),
    lead_time TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(type);
CREATE INDEX IF NOT EXISTS idx_vendors_is_preferred ON vendors(is_preferred) WHERE is_preferred = true;
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating);

-- ============================================
-- DELIVERABLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'other', -- video_master, video_social, video_tv, video_web, video_bts, video_teaser, video_interview, photo_hero, photo_bts, photo_product, photo_portrait, audio_master, audio_podcast, audio_vo, graphics, subtitles, thumbnail, raw_footage, project_files, other
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending', -- pending, in_progress, review, revision, approved, delivered
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Technical Specs
    format TEXT DEFAULT '',
    resolution TEXT DEFAULT '',
    duration TEXT DEFAULT '',
    codec TEXT DEFAULT '',
    frame_rate TEXT DEFAULT '',
    aspect_ratio TEXT DEFAULT '',
    file_size_limit TEXT DEFAULT '',
    -- Version tracking
    current_version INTEGER DEFAULT 1,
    versions JSONB DEFAULT '[]', -- [{ version: number, url: string, notes: string, uploaded_by: uuid, uploaded_at: timestamp, status: string }]
    -- Delivery
    delivery_method TEXT DEFAULT '',
    delivery_url TEXT DEFAULT '',
    delivered_at TIMESTAMPTZ,
    -- Notes
    notes TEXT DEFAULT '',
    client_notes TEXT DEFAULT '',
    internal_notes TEXT DEFAULT '',
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_type ON deliverables(type);
CREATE INDEX IF NOT EXISTS idx_deliverables_due_date ON deliverables(due_date) WHERE due_date IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Talents policies
CREATE POLICY "Users can view all talents" ON talents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert talents" ON talents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update talents" ON talents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete talents" ON talents FOR DELETE TO authenticated USING (true);

-- Locations policies
CREATE POLICY "Users can view all locations" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert locations" ON locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update locations" ON locations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete locations" ON locations FOR DELETE TO authenticated USING (true);

-- Vendors policies
CREATE POLICY "Users can view all vendors" ON vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert vendors" ON vendors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update vendors" ON vendors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete vendors" ON vendors FOR DELETE TO authenticated USING (true);

-- Deliverables policies
CREATE POLICY "Users can view all deliverables" ON deliverables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert deliverables" ON deliverables FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update deliverables" ON deliverables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete deliverables" ON deliverables FOR DELETE TO authenticated USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER trigger_talents_updated_at
    BEFORE UPDATE ON talents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
