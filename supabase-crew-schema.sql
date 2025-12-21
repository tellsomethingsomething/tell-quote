-- Crew/Freelancer Database Schema
-- Run this in your Supabase SQL Editor

-- Departments/Roles enum-like table for consistency
create table if not exists crew_departments (
    id text primary key,
    name text not null,
    color text default '#6B7280',
    sort_order int default 0
);

-- Insert default departments
insert into crew_departments (id, name, color, sort_order) values
    ('camera', 'Camera', '#3B82F6', 1),
    ('sound', 'Sound', '#8B5CF6', 2),
    ('lighting', 'Lighting', '#F59E0B', 3),
    ('grip', 'Grip', '#6B7280', 4),
    ('art', 'Art Department', '#EC4899', 5),
    ('wardrobe', 'Wardrobe', '#14B8A6', 6),
    ('makeup', 'Hair & Makeup', '#F43F5E', 7),
    ('production', 'Production', '#10B981', 8),
    ('direction', 'Direction', '#EF4444', 9),
    ('editing', 'Post Production', '#6366F1', 10),
    ('vfx', 'VFX', '#8B5CF6', 11),
    ('transport', 'Transport', '#64748B', 12),
    ('catering', 'Catering', '#F97316', 13),
    ('other', 'Other', '#9CA3AF', 99)
on conflict (id) do nothing;

-- Main crew/freelancers table
create table if not exists crew (
    id uuid default uuid_generate_v4() primary key,

    -- Basic Info
    first_name text not null,
    last_name text not null,
    nickname text,
    email text,
    phone text,
    phone_secondary text,

    -- Location
    city text,
    country text,
    timezone text,

    -- Professional Info
    department text references crew_departments(id) on delete set null,
    role_title text, -- e.g., "Director of Photography", "1st AC", "Gaffer"
    skills text[] default '{}', -- Array of skills/specialties
    experience_years int,

    -- Rates
    day_rate numeric default 0,
    half_day_rate numeric default 0,
    hourly_rate numeric default 0,
    overtime_rate numeric default 0,
    currency text default 'USD',
    rate_notes text, -- e.g., "Includes kit", "Plus travel"

    -- Equipment they own
    owns_equipment boolean default false,
    equipment_list text[] default '{}',
    equipment_notes text,

    -- Availability
    availability_status text default 'available' check (availability_status in ('available', 'busy', 'unavailable', 'on_project')),
    availability_notes text,

    -- Portfolio
    website text,
    imdb_link text,
    linkedin_link text,
    instagram_link text,
    showreel_link text,
    portfolio_links jsonb default '[]', -- Array of {title, url}

    -- Documents
    resume_url text,
    contracts_signed jsonb default '[]', -- Array of signed contract references

    -- Internal
    rating numeric check (rating >= 0 and rating <= 5), -- 0-5 star rating
    total_projects int default 0,
    notes text,
    tags text[] default '{}',
    is_favorite boolean default false,
    is_archived boolean default false,

    -- Emergency Contact
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relation text,

    -- Bank/Payment (for future payroll integration)
    payment_details jsonb default '{}', -- Encrypted or reference to secure storage
    tax_id text,

    -- Metadata
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references user_profiles(id) on delete set null,
    last_contacted_at timestamp with time zone
);

-- Crew project history (which projects they've worked on)
create table if not exists crew_project_history (
    id uuid default uuid_generate_v4() primary key,
    crew_id uuid references crew(id) on delete cascade not null,
    project_id uuid references projects(id) on delete set null,
    project_name text, -- Denormalized for when project is deleted
    role text,
    department text,
    start_date date,
    end_date date,
    day_rate numeric,
    total_days numeric,
    total_paid numeric,
    feedback text,
    rating numeric check (rating >= 0 and rating <= 5),
    would_hire_again boolean,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crew availability calendar (for blocking out dates)
create table if not exists crew_availability (
    id uuid default uuid_generate_v4() primary key,
    crew_id uuid references crew(id) on delete cascade not null,
    start_date date not null,
    end_date date not null,
    status text default 'unavailable' check (status in ('unavailable', 'tentative', 'booked')),
    project_id uuid references projects(id) on delete set null,
    reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_crew_department on crew(department);
create index if not exists idx_crew_availability_status on crew(availability_status);
create index if not exists idx_crew_is_archived on crew(is_archived);
create index if not exists idx_crew_rating on crew(rating);
create index if not exists idx_crew_country on crew(country);
create index if not exists idx_crew_project_history_crew on crew_project_history(crew_id);
create index if not exists idx_crew_project_history_project on crew_project_history(project_id);
create index if not exists idx_crew_availability_crew on crew_availability(crew_id);
create index if not exists idx_crew_availability_dates on crew_availability(start_date, end_date);

-- Full text search on crew
create index if not exists idx_crew_search on crew using gin(
    to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(role_title, '') || ' ' || coalesce(email, ''))
);

-- Row Level Security
alter table crew enable row level security;
alter table crew_departments enable row level security;
alter table crew_project_history enable row level security;
alter table crew_availability enable row level security;

-- Policies (allow all for authenticated users - adjust for multi-tenant)
create policy "Allow all for authenticated users" on crew
    for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on crew_departments
    for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on crew_project_history
    for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on crew_availability
    for all using (auth.role() = 'authenticated');

-- Trigger to update updated_at
create or replace function update_crew_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger crew_updated_at
    before update on crew
    for each row
    execute function update_crew_updated_at();

-- View for crew summary with stats
create or replace view crew_summary as
select
    c.*,
    d.name as department_name,
    d.color as department_color,
    coalesce(h.project_count, 0) as project_count,
    coalesce(h.avg_rating, 0) as avg_project_rating,
    coalesce(h.total_earned, 0) as total_earned
from crew c
left join crew_departments d on c.department = d.id
left join (
    select
        crew_id,
        count(*) as project_count,
        avg(rating) as avg_rating,
        sum(total_paid) as total_earned
    from crew_project_history
    group by crew_id
) h on c.id = h.crew_id
where c.is_archived = false;
