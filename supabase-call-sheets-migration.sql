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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    accommodation_id uuid REFERENCES call_sheet_accommodation(id) ON DELETE CASCADE,

    -- Who
    crew_id uuid REFERENCES crew(id) ON DELETE SET NULL,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    call_sheet_id uuid REFERENCES call_sheets(id) ON DELETE CASCADE,

    -- Who
    crew_id uuid REFERENCES crew(id) ON DELETE SET NULL,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE POLICY "Allow all call_sheet_accommodation" ON call_sheet_accommodation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_room_assignments" ON call_sheet_room_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_flights" ON call_sheet_flights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_transfers" ON call_sheet_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_vehicles" ON call_sheet_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_technical" ON call_sheet_technical FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_vendors" ON call_sheet_vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_emergency_contacts" ON call_sheet_emergency_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_catering" ON call_sheet_catering FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all call_sheet_weather" ON call_sheet_weather FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- UPDATE TRIGGERS
-- ============================================================
CREATE TRIGGER update_call_sheet_accommodation_updated_at
    BEFORE UPDATE ON call_sheet_accommodation
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sheet_updated_at();

CREATE TRIGGER update_call_sheet_technical_updated_at
    BEFORE UPDATE ON call_sheet_technical
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sheet_updated_at();

CREATE TRIGGER update_call_sheet_weather_updated_at
    BEFORE UPDATE ON call_sheet_weather
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sheet_updated_at();
