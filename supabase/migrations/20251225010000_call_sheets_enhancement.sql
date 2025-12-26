-- Call Sheets Schema - PRODUCTION GRADE
-- Run this in your Supabase SQL Editor

-- Call Sheet Status
-- draft: Being created/edited
-- published: Sent to crew
-- completed: Shoot day completed
-- cancelled: Cancelled

-- Main call sheets table
create table if not exists call_sheets (
    id uuid default gen_random_uuid() primary key,

    -- Link to project
    project_id uuid ,
    project_name text, -- Denormalized

    -- Production Info
    production_company text,
    production_title text not null,
    episode_title text,
    episode_number text,
    director text,
    producer text,
    production_manager text,

    -- Shoot Details
    shoot_date date not null,
    day_number int, -- e.g., "Day 2 of 5"
    total_days int,
    general_call_time time, -- When most crew should arrive
    first_shot_time time, -- When cameras roll
    estimated_wrap time,
    actual_wrap time, -- Filled in after shoot

    -- Location Primary
    location_name text,
    location_address text,
    location_city text,
    location_country text,
    location_coordinates jsonb, -- {lat, lng}
    location_contact_name text,
    location_contact_phone text,
    location_notes text,
    parking_info text,
    base_camp_location text,

    -- Additional Locations (for multi-location days)
    additional_locations jsonb default '[]', -- Array of {name, address, call_time, notes}

    -- Weather
    weather_forecast jsonb, -- {temp, condition, sunrise, sunset, humidity, wind}
    weather_notes text,

    -- Nearest Hospital (Safety requirement)
    hospital_name text,
    hospital_address text,
    hospital_phone text,
    hospital_distance text, -- e.g., "15 min drive"

    -- Emergency Contacts
    emergency_contacts jsonb default '[]', -- Array of {name, role, phone}

    -- Meals & Catering
    breakfast_time time,
    breakfast_location text,
    lunch_time time,
    lunch_location text,
    catering_company text,
    catering_contact text,
    dietary_notes text,

    -- Schedule - Scenes/Shots (ordered list)
    schedule jsonb default '[]', -- Array of {scene_number, description, cast, location, est_time, pages, notes}

    -- Important Notes (displayed prominently)
    important_notes text,
    safety_notes text,
    wardrobe_notes text,
    makeup_notes text,
    transport_notes text,
    equipment_notes text,

    -- Attachments
    map_url text,
    map_image_path text,
    attachments jsonb default '[]', -- Array of {name, url, type}

    -- Status
    status text default 'draft' check (status in ('draft', 'published', 'completed', 'cancelled')),
    published_at timestamp with time zone,
    published_by uuid ,
    version int default 1, -- For tracking updates after publishing

    -- Metadata
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid 
);

-- Call sheet crew entries (who is called for this shoot)
create table if not exists call_sheet_crew (
    id uuid default gen_random_uuid() primary key,
    call_sheet_id uuid references call_sheets(id) on delete cascade not null,

    -- Crew member (link to crew table or manual entry)
    crew_id uuid ,
    name text not null,
    role_title text,
    department text,

    -- Contact
    phone text,
    email text,

    -- Call Time (can be different from general call)
    call_time time,
    call_location text, -- If different from main location

    -- Transport
    transport_mode text, -- 'own', 'pickup', 'base_camp'
    pickup_time time,
    pickup_location text,

    -- Notes
    notes text,

    -- Status
    confirmed boolean default false,
    confirmed_at timestamp with time zone,

    -- Order for display
    sort_order int default 0,

    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Call sheet talent/cast entries
create table if not exists call_sheet_cast (
    id uuid default gen_random_uuid() primary key,
    call_sheet_id uuid references call_sheets(id) on delete cascade not null,

    -- Cast member info
    name text not null,
    character_name text,
    agent_contact text,

    -- Call Times (multiple times for cast)
    pickup_time time,
    pickup_location text,
    makeup_call time,
    wardrobe_call time,
    on_set_call time,

    -- Scenes
    scenes text[], -- Array of scene numbers

    -- Notes
    wardrobe_notes text,
    makeup_notes text,
    notes text,

    -- Status
    confirmed boolean default false,
    confirmed_at timestamp with time zone,

    -- Order
    sort_order int default 0,

    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Department call times (different calls for different departments)
create table if not exists call_sheet_department_calls (
    id uuid default gen_random_uuid() primary key,
    call_sheet_id uuid references call_sheets(id) on delete cascade not null,
    department text not null, -- camera, sound, lighting, grip, art, wardrobe, makeup, etc.
    call_time time not null,
    call_location text,
    notes text,
    sort_order int default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(call_sheet_id, department)
);

-- Call sheet templates (for recurring shoot formats)
create table if not exists call_sheet_templates (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,

    -- Template content (same structure as call_sheets)
    production_company text,
    hospital_name text,
    hospital_address text,
    hospital_phone text,
    emergency_contacts jsonb default '[]',
    breakfast_time time,
    lunch_time time,
    catering_company text,
    important_notes text,
    safety_notes text,

    -- Default crew (roles to include)
    default_crew jsonb default '[]', -- Array of {role_title, department, call_time}

    -- Default schedule structure
    default_schedule jsonb default '[]',

    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid 
);

-- Views (commented out - require projects, crew tables to exist first)
-- These can be created later once all base tables are set up

-- Extended call sheet view with counts
-- create or replace view call_sheets_extended as ...

-- Crew view with call sheet info
-- create or replace view call_sheet_crew_extended as ...

-- Indexes for performance
create index if not exists idx_call_sheets_project on call_sheets(project_id);
create index if not exists idx_call_sheets_date on call_sheets(shoot_date);
create index if not exists idx_call_sheets_status on call_sheets(status);
create index if not exists idx_call_sheet_crew_sheet on call_sheet_crew(call_sheet_id);
create index if not exists idx_call_sheet_crew_member on call_sheet_crew(crew_id);
create index if not exists idx_call_sheet_cast_sheet on call_sheet_cast(call_sheet_id);
create index if not exists idx_call_sheet_dept_calls_sheet on call_sheet_department_calls(call_sheet_id);

-- Row Level Security
alter table call_sheets enable row level security;
alter table call_sheet_crew enable row level security;
alter table call_sheet_cast enable row level security;
alter table call_sheet_department_calls enable row level security;
alter table call_sheet_templates enable row level security;

-- Policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_sheets;
create policy "Allow all for authenticated users" on call_sheets
    for all using (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_sheet_crew;
create policy "Allow all for authenticated users" on call_sheet_crew
    for all using (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_sheet_cast;
create policy "Allow all for authenticated users" on call_sheet_cast
    for all using (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_sheet_department_calls;
create policy "Allow all for authenticated users" on call_sheet_department_calls
    for all using (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_sheet_templates;
create policy "Allow all for authenticated users" on call_sheet_templates
    for all using (auth.role() = 'authenticated');

-- Update trigger
create or replace function update_call_sheet_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS call_sheet_updated_at ON call_sheets;
create trigger call_sheet_updated_at
    before update on call_sheets
    for each row
    execute function update_call_sheet_updated_at();

DROP TRIGGER IF EXISTS call_sheet_template_updated_at ON call_sheet_templates;
create trigger call_sheet_template_updated_at
    before update on call_sheet_templates
    for each row
    execute function update_call_sheet_updated_at();

-- Version increment trigger (when publishing updates)
create or replace function increment_call_sheet_version()
returns trigger as $$
begin
    if old.status = 'published' and new.status = 'published' then
        new.version = old.version + 1;
    end if;
    return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS call_sheet_version_increment ON call_sheets;
create trigger call_sheet_version_increment
    before update on call_sheets
    for each row
    execute function increment_call_sheet_version();

-- Function to duplicate a call sheet (for next day)
create or replace function duplicate_call_sheet(
    p_call_sheet_id uuid,
    p_new_shoot_date date,
    p_new_day_number int default null
) returns uuid as $$
declare
    v_new_id uuid;
    v_old_sheet call_sheets;
begin
    select * into v_old_sheet from call_sheets where id = p_call_sheet_id;

    if v_old_sheet.id is null then
        raise exception 'Call sheet not found';
    end if;

    -- Insert new call sheet
    insert into call_sheets (
        project_id, project_name, production_company, production_title,
        episode_title, episode_number, director, producer, production_manager,
        shoot_date, day_number, total_days, general_call_time, first_shot_time, estimated_wrap,
        location_name, location_address, location_city, location_country,
        location_contact_name, location_contact_phone, location_notes, parking_info, base_camp_location,
        hospital_name, hospital_address, hospital_phone, hospital_distance,
        emergency_contacts, breakfast_time, breakfast_location, lunch_time, lunch_location,
        catering_company, catering_contact, dietary_notes,
        important_notes, safety_notes, status, created_by
    ) values (
        v_old_sheet.project_id, v_old_sheet.project_name, v_old_sheet.production_company, v_old_sheet.production_title,
        v_old_sheet.episode_title, v_old_sheet.episode_number, v_old_sheet.director, v_old_sheet.producer, v_old_sheet.production_manager,
        p_new_shoot_date, coalesce(p_new_day_number, v_old_sheet.day_number + 1), v_old_sheet.total_days,
        v_old_sheet.general_call_time, v_old_sheet.first_shot_time, v_old_sheet.estimated_wrap,
        v_old_sheet.location_name, v_old_sheet.location_address, v_old_sheet.location_city, v_old_sheet.location_country,
        v_old_sheet.location_contact_name, v_old_sheet.location_contact_phone, v_old_sheet.location_notes,
        v_old_sheet.parking_info, v_old_sheet.base_camp_location,
        v_old_sheet.hospital_name, v_old_sheet.hospital_address, v_old_sheet.hospital_phone, v_old_sheet.hospital_distance,
        v_old_sheet.emergency_contacts, v_old_sheet.breakfast_time, v_old_sheet.breakfast_location,
        v_old_sheet.lunch_time, v_old_sheet.lunch_location,
        v_old_sheet.catering_company, v_old_sheet.catering_contact, v_old_sheet.dietary_notes,
        v_old_sheet.important_notes, v_old_sheet.safety_notes, 'draft', v_old_sheet.created_by
    ) returning id into v_new_id;

    -- Copy crew
    insert into call_sheet_crew (call_sheet_id, crew_id, name, role_title, department, phone, email, call_time, call_location, transport_mode, pickup_time, pickup_location, notes, sort_order)
    select v_new_id, crew_id, name, role_title, department, phone, email, call_time, call_location, transport_mode, pickup_time, pickup_location, notes, sort_order
    from call_sheet_crew where call_sheet_id = p_call_sheet_id;

    -- Copy cast
    insert into call_sheet_cast (call_sheet_id, name, character_name, agent_contact, pickup_time, pickup_location, makeup_call, wardrobe_call, on_set_call, scenes, wardrobe_notes, makeup_notes, notes, sort_order)
    select v_new_id, name, character_name, agent_contact, pickup_time, pickup_location, makeup_call, wardrobe_call, on_set_call, scenes, wardrobe_notes, makeup_notes, notes, sort_order
    from call_sheet_cast where call_sheet_id = p_call_sheet_id;

    -- Copy department calls
    insert into call_sheet_department_calls (call_sheet_id, department, call_time, call_location, notes, sort_order)
    select v_new_id, department, call_time, call_location, notes, sort_order
    from call_sheet_department_calls where call_sheet_id = p_call_sheet_id;

    return v_new_id;
end;
$$ language plpgsql;
-- Call Sheets Enhancement Migration
-- Adds: Accommodation, Flights, Transfers, Vehicles, Technical Plan, Per Diems, etc.
-- Based on professional broadcast call sheet analysis (WBSS Tokyo, Planet Rock)

-- ============================================================
-- ADD NEW COLUMNS TO call_sheets TABLE
-- ============================================================

-- Time Zone Info
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS time_zone text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS time_zone_offset text; -- e.g., "+8 hours"
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS home_base_timezone text DEFAULT 'Europe/London';

-- Per Diem Info
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS per_diem_amount numeric(10,2);
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS per_diem_currency text DEFAULT 'USD';
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS per_diem_notes text;

-- Dress Code (by department/role)
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS dress_code jsonb DEFAULT '[]';
-- Format: [{department: "Floor Managers", code: "Smart dress, suit with shirt & tie"}, {department: "Ringside Crew", code: "Plain black tshirt, black trousers"}]

-- Currency/Money Info (for international shoots)
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS local_currency text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS exchange_rate text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS currency_notes text;

-- Accreditation/Passes
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS accreditation_notes text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS accreditation_collection_point text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS access_restrictions text;

-- Insurance Info
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS insurance_info jsonb DEFAULT '{}';
-- Format: {provider: "Hiscox", policy_number: "MIB2017OM882", emergency_phone: "+44 207 902 7405", broker_contact: "jason@mediainsurance.com"}

-- Risk Assessment
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS risk_assessment_url text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS risk_assessment_notes text;

-- Invoicing
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS invoicing_email text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS invoicing_notes text;

-- Customs/Carnets (for international kit)
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS customs_notes text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS carnet_info jsonb DEFAULT '[]';
-- Format: [{description: "GFX Kit", carnet_number: "ABC123", contact: "Gary Bailey", phone: "+44 208 754 5338"}]

-- Travel Advice (embassy, visa, etc.)
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS travel_advice_url text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS visa_requirements text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS embassy_info jsonb DEFAULT '{}';
-- Format: {name: "British Embassy Tokyo", address: "...", phone: "+81 3 5211-1100", emergency_phone: "..."}

-- Communication
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS international_dialing_code text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS wifi_info text;
ALTER TABLE call_sheets ADD COLUMN IF NOT EXISTS mobile_network_notes text;

-- ============================================================
-- ACCOMMODATION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_accommodation (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Hotel Info
    hotel_name text NOT NULL,
    hotel_address text,
    hotel_city text,
    hotel_country text,
    hotel_phone text,
    hotel_website text,
    hotel_email text,

    -- Location Details
    distance_from_venue text,
    distance_from_airport text,

    -- Amenities
    breakfast_included boolean DEFAULT false,
    wifi_available boolean DEFAULT true,
    parking_available boolean DEFAULT false,

    -- Booking Info
    booking_reference text,
    booking_contact text,
    check_in_time time,
    check_out_time time,

    -- Payment
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'prepaid', 'on_account', 'crew_pays')),
    payment_notes text,

    -- Notes
    notes text,

    -- Order (for multiple hotels)
    sort_order int DEFAULT 0,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Room Assignments (crew x nights grid)
CREATE TABLE IF NOT EXISTS call_sheet_room_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    accommodation_id uuid REFERENCES call_sheet_accommodation(id) ON DELETE CASCADE,

    -- Who
    crew_id uuid ,
    crew_name text NOT NULL, -- Denormalized

    -- When (which nights)
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,

    -- Room Details
    room_number text,
    room_type text, -- single, double, twin, suite

    -- Notes
    early_check_in boolean DEFAULT false,
    late_check_out boolean DEFAULT false,
    notes text,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- FLIGHTS / TRAVEL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_flights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Who
    crew_id uuid ,
    crew_name text NOT NULL,

    -- Flight Type
    flight_type text DEFAULT 'outbound' CHECK (flight_type IN ('outbound', 'return', 'internal')),

    -- Booking
    booking_reference text,

    -- Flight Details
    flight_number text,
    airline text,

    -- Departure
    departure_date date NOT NULL,
    departure_time time,
    departure_airport text,
    departure_terminal text,

    -- Arrival
    arrival_date date,
    arrival_time time,
    arrival_airport text,
    arrival_terminal text,

    -- Connection (if any)
    has_connection boolean DEFAULT false,
    connection_airport text,
    connection_flight_number text,
    connection_departure_time time,

    -- Notes
    notes text,

    -- Order
    sort_order int DEFAULT 0,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- TRANSFERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_transfers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Transfer Details
    transfer_date date NOT NULL,
    transfer_time time NOT NULL,

    -- Route
    pickup_location text NOT NULL,
    dropoff_location text NOT NULL,

    -- Transport
    transport_type text DEFAULT 'minibus' CHECK (transport_type IN ('minibus', 'car', 'van', 'coach', 'taxi', 'other')),
    vehicle_details text,
    capacity int,

    -- Provider
    provider_company text,
    driver_name text,
    driver_phone text,

    -- Who's on this transfer
    passengers jsonb DEFAULT '[]', -- Array of crew names/IDs
    max_passengers int,

    -- Notes
    notes text,

    -- Order
    sort_order int DEFAULT 0,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- VEHICLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_vehicles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Vehicle Info
    vehicle_type text NOT NULL, -- OB Van, Equipment Truck, Crew Car, etc.
    vehicle_name text, -- e.g., "Video Unit-Express 808"
    license_plate text,

    -- Dimensions (for parking/access planning)
    length_meters numeric(5,2),
    width_meters numeric(5,2),
    height_meters numeric(5,2),

    -- Provider
    company text,
    driver_name text,
    driver_phone text,

    -- Assignment
    assigned_location text, -- TV Compound, Unloading Only, etc.
    parking_spot text,

    -- Schedule
    arrival_time time,
    departure_time time,

    -- Notes
    notes text,
    overnight_security boolean DEFAULT false,

    -- Order
    sort_order int DEFAULT 0,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- TECHNICAL PLAN TABLE (Camera positions, audio, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_technical (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Camera Positions
    camera_positions jsonb DEFAULT '[]',
    -- Format: [{camera: "Camera 1", position: "CENTRE", equipment: "F800 + HJ22", operator: "James Stewart", notes: "8x4 rostrum"}]

    -- Cable Runs
    cable_runs jsonb DEFAULT '[]',
    -- Format: [{from: "Cam 1", to: "Gallery", distance: "100m", cable_type: "Tactical Fibre", power: "13amp house"}]

    -- Audio Setup
    audio_setup jsonb DEFAULT '{}',
    -- Format: {mixing_desk: "Yamaha O1V", main_output: "Teranex embed", presenter_mics: [...], notes: "..."}

    -- Video Routing
    video_routing jsonb DEFAULT '[]',
    -- Format: [{source: "Main TX", destination: "LIVE U", distance: "150m", cable_type: "Fibre"}]

    -- Graphics/VT
    graphics_setup text,
    vt_setup text,

    -- Comms
    comms_setup text,
    radio_channels jsonb DEFAULT '[]',

    -- Recording
    recording_setup jsonb DEFAULT '[]',
    -- Format: [{source: "Main TX", device: "Hyperdeck", media: "SSD"}]

    -- Monitors
    monitors jsonb DEFAULT '[]',
    -- Format: [{location: "Presenter Area", model: "BTLH 1700", feed: "TX"}]

    -- Lights
    lighting_setup text,

    -- Power
    power_requirements text,
    generator_info text,

    -- Connectivity
    uplink_info text, -- Satellite, KA Band, etc.
    internet_info text, -- WiFi, 4G, LAN speeds

    -- Notes
    notes text,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- VENDOR CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_vendors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Vendor Info
    company_name text NOT NULL,
    vendor_type text, -- OB, Lighting, Satellite, Catering, Transport, etc.

    -- Primary Contact
    contact_name text,
    contact_role text,
    contact_phone text,
    contact_email text,

    -- Additional Contacts
    additional_contacts jsonb DEFAULT '[]',

    -- Notes
    notes text,
    on_site boolean DEFAULT true,

    -- Order
    sort_order int DEFAULT 0,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- EMERGENCY CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_emergency_contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Contact Type
    contact_type text NOT NULL CHECK (contact_type IN (
        'hospital', 'police', 'fire', 'ambulance', 'security',
        'production_emergency', 'venue_emergency', 'hotel_emergency',
        'embassy', 'insurance', 'local_fixer', 'other'
    )),

    -- Contact Info
    name text NOT NULL,
    organization text,
    phone text NOT NULL,
    phone_secondary text,
    address text,
    distance_from_venue text,

    -- Additional
    notes text,
    is_24_hour boolean DEFAULT false,

    -- Order
    sort_order int DEFAULT 0,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- CATERING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_catering (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Meal Info
    meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks', 'drinks', 'craft_services')),
    meal_time time,

    -- Location
    location text,

    -- Provider
    provider_name text,
    provider_phone text,

    -- Details
    headcount int,
    dietary_notes text, -- Vegetarian options, allergies, etc.
    menu_description text,

    -- Cost
    cost_per_head numeric(10,2),
    total_cost numeric(10,2),
    payment_status text DEFAULT 'pending',

    -- Notes
    notes text,

    -- Order
    sort_order int DEFAULT 0,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- WEATHER INFO TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sheet_weather (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Date
    forecast_date date NOT NULL,

    -- Conditions
    condition text, -- Sunny, Cloudy, Rain, etc.
    condition_icon text,

    -- Temperature
    temp_high_celsius int,
    temp_low_celsius int,

    -- Additional
    humidity_percent int,
    wind_speed_kmh int,
    wind_direction text,
    precipitation_percent int,
    uv_index int,
    sunrise time,
    sunset time,

    -- Notes
    notes text,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_call_sheet_accommodation_sheet ON call_sheet_accommodation(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_room_assignments_accommodation ON call_sheet_room_assignments(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_flights_sheet ON call_sheet_flights(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_flights_crew ON call_sheet_flights(crew_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_transfers_sheet ON call_sheet_transfers(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_transfers_date ON call_sheet_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_call_sheet_vehicles_sheet ON call_sheet_vehicles(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_technical_sheet ON call_sheet_technical(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_vendors_sheet ON call_sheet_vendors(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_emergency_contacts_sheet ON call_sheet_emergency_contacts(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_catering_sheet ON call_sheet_catering(call_sheet_id);
CREATE INDEX IF NOT EXISTS idx_call_sheet_weather_sheet ON call_sheet_weather(call_sheet_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE call_sheet_accommodation ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_technical ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_catering ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_weather ENABLE ROW LEVEL SECURITY;

-- Policies (internal tool - allow all for authenticated)
DROP POLICY IF EXISTS "Allow all call_sheet_accommodation" ON call_sheet_accommodation;
CREATE POLICY "Allow all call_sheet_accommodation" ON call_sheet_accommodation FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_room_assignments" ON call_sheet_room_assignments;
CREATE POLICY "Allow all call_sheet_room_assignments" ON call_sheet_room_assignments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_flights" ON call_sheet_flights;
CREATE POLICY "Allow all call_sheet_flights" ON call_sheet_flights FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_transfers" ON call_sheet_transfers;
CREATE POLICY "Allow all call_sheet_transfers" ON call_sheet_transfers FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_vehicles" ON call_sheet_vehicles;
CREATE POLICY "Allow all call_sheet_vehicles" ON call_sheet_vehicles FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_technical" ON call_sheet_technical;
CREATE POLICY "Allow all call_sheet_technical" ON call_sheet_technical FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_vendors" ON call_sheet_vendors;
CREATE POLICY "Allow all call_sheet_vendors" ON call_sheet_vendors FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_emergency_contacts" ON call_sheet_emergency_contacts;
CREATE POLICY "Allow all call_sheet_emergency_contacts" ON call_sheet_emergency_contacts FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_catering" ON call_sheet_catering;
CREATE POLICY "Allow all call_sheet_catering" ON call_sheet_catering FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all call_sheet_weather" ON call_sheet_weather;
CREATE POLICY "Allow all call_sheet_weather" ON call_sheet_weather FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- UPDATE TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS update_call_sheet_accommodation_updated_at ON call_sheet_accommodation;
CREATE TRIGGER update_call_sheet_accommodation_updated_at
    BEFORE UPDATE ON call_sheet_accommodation
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sheet_updated_at();

DROP TRIGGER IF EXISTS update_call_sheet_technical_updated_at ON call_sheet_technical;
CREATE TRIGGER update_call_sheet_technical_updated_at
    BEFORE UPDATE ON call_sheet_technical
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sheet_updated_at();

DROP TRIGGER IF EXISTS update_call_sheet_weather_updated_at ON call_sheet_weather;
CREATE TRIGGER update_call_sheet_weather_updated_at
    BEFORE UPDATE ON call_sheet_weather
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sheet_updated_at();
