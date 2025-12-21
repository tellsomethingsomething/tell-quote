-- Call Sheets Schema - PRODUCTION GRADE
-- Run this in your Supabase SQL Editor

-- Call Sheet Status
-- draft: Being created/edited
-- published: Sent to crew
-- completed: Shoot day completed
-- cancelled: Cancelled

-- Main call sheets table
create table if not exists call_sheets (
    id uuid default uuid_generate_v4() primary key,

    -- Link to project
    project_id uuid references projects(id) on delete cascade,
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
    published_by uuid references user_profiles(id) on delete set null,
    version int default 1, -- For tracking updates after publishing

    -- Metadata
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references user_profiles(id) on delete set null
);

-- Call sheet crew entries (who is called for this shoot)
create table if not exists call_sheet_crew (
    id uuid default uuid_generate_v4() primary key,
    call_sheet_id uuid references call_sheets(id) on delete cascade not null,

    -- Crew member (link to crew table or manual entry)
    crew_id uuid references crew(id) on delete set null,
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
    id uuid default uuid_generate_v4() primary key,
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
    id uuid default uuid_generate_v4() primary key,
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
    id uuid default uuid_generate_v4() primary key,
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
    created_by uuid references user_profiles(id) on delete set null
);

-- Views

-- Extended call sheet view with counts
create or replace view call_sheets_extended as
select
    cs.*,
    p.name as linked_project_name,
    p.client_name as project_client,
    coalesce(crew.crew_count, 0) as crew_count,
    coalesce(crew.confirmed_count, 0) as crew_confirmed_count,
    coalesce(cast_t.cast_count, 0) as cast_count,
    coalesce(dc.department_count, 0) as department_count,
    case
        when cs.status = 'cancelled' then 'Cancelled'
        when cs.status = 'completed' then 'Completed'
        when cs.status = 'published' and cs.shoot_date < current_date then 'Past'
        when cs.status = 'published' and cs.shoot_date = current_date then 'Today'
        when cs.status = 'published' then 'Upcoming'
        else 'Draft'
    end as display_status,
    cs.shoot_date - current_date as days_until_shoot
from call_sheets cs
left join projects p on cs.project_id = p.id
left join (
    select call_sheet_id, count(*) as crew_count, count(*) filter (where confirmed) as confirmed_count
    from call_sheet_crew
    group by call_sheet_id
) crew on cs.id = crew.call_sheet_id
left join (
    select call_sheet_id, count(*) as cast_count
    from call_sheet_cast
    group by call_sheet_id
) cast_t on cs.id = cast_t.call_sheet_id
left join (
    select call_sheet_id, count(*) as department_count
    from call_sheet_department_calls
    group by call_sheet_id
) dc on cs.id = dc.call_sheet_id;

-- Crew view with call sheet info
create or replace view call_sheet_crew_extended as
select
    csc.*,
    cs.shoot_date,
    cs.production_title,
    cs.location_name,
    c.first_name,
    c.last_name,
    c.phone as crew_phone,
    c.email as crew_email,
    cd.color as department_color
from call_sheet_crew csc
join call_sheets cs on csc.call_sheet_id = cs.id
left join crew c on csc.crew_id = c.id
left join crew_departments cd on csc.department = cd.id;

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

-- Policies
create policy "Allow all for authenticated users" on call_sheets
    for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on call_sheet_crew
    for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on call_sheet_cast
    for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on call_sheet_department_calls
    for all using (auth.role() = 'authenticated');

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

create trigger call_sheet_updated_at
    before update on call_sheets
    for each row
    execute function update_call_sheet_updated_at();

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
