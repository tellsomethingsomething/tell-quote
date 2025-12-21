-- ============================================================
-- Projects Schema for Tell Productions
-- Run this in Supabase SQL Editor
-- ============================================================

-- Projects table - the central hub linking opportunities -> quotes -> execution
create table projects (
  id uuid default uuid_generate_v4() primary key,

  -- Project identification
  project_code text not null,
  name text not null,

  -- Links to existing entities
  opportunity_id uuid references opportunities(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  client_id uuid references clients(id) on delete set null,

  -- Denormalized client info for quick access
  client jsonb default '{}',

  -- Project details
  description text,
  region text,
  country text,

  -- Dates
  start_date date,
  end_date date,

  -- Status workflow: draft -> confirmed -> in_progress -> wrapped -> closed -> cancelled
  status text default 'draft' check (status in ('draft', 'confirmed', 'in_progress', 'wrapped', 'closed', 'cancelled')),

  -- Financial summary (from quote)
  currency text default 'USD',
  budget_total numeric default 0,
  budget_breakdown jsonb default '{}',  -- Breakdown by category

  -- Actuals tracking
  actuals_total numeric default 0,
  actuals_breakdown jsonb default '{}',

  -- Team
  project_manager_id uuid references user_profiles(id) on delete set null,
  project_manager_name text,

  -- Project settings
  settings jsonb default '{}',

  -- Notes and metadata
  notes text,
  tags text[] default '{}',

  -- Timestamps
  confirmed_at timestamp with time zone,
  started_at timestamp with time zone,
  wrapped_at timestamp with time zone,
  closed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for common queries
create index projects_project_code_idx on projects(project_code);
create index projects_status_idx on projects(status);
create index projects_client_id_idx on projects(client_id);
create index projects_opportunity_id_idx on projects(opportunity_id);
create index projects_start_date_idx on projects(start_date);
create index projects_created_at_idx on projects(created_at desc);

-- Enable RLS
alter table projects enable row level security;

-- Allow all (internal tool)
create policy "Allow all projects" on projects for all using (true) with check (true);

-- Trigger for updated_at
create trigger update_projects_updated_at before update on projects
  for each row execute function update_updated_at_column();

-- ============================================================
-- Project Phases (for multi-phase projects)
-- ============================================================
create table project_phases (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,

  name text not null,
  description text,

  start_date date,
  end_date date,

  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  sort_order integer default 0,

  budget numeric default 0,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index project_phases_project_id_idx on project_phases(project_id);

alter table project_phases enable row level security;
create policy "Allow all project_phases" on project_phases for all using (true) with check (true);

create trigger update_project_phases_updated_at before update on project_phases
  for each row execute function update_updated_at_column();

-- ============================================================
-- Link opportunities to projects (update opportunities table)
-- ============================================================
alter table opportunities add column if not exists converted_to_project_id uuid references projects(id) on delete set null;

-- ============================================================
-- Link quotes to projects (update quotes table)
-- ============================================================
alter table quotes add column if not exists project_id uuid references projects(id) on delete set null;

-- ============================================================
-- Generate project code function
-- Format: PRJ-YYYYMM-XXX (e.g., PRJ-202412-001)
-- ============================================================
create or replace function generate_project_code()
returns text as $$
declare
  year_month text;
  seq_num integer;
  new_code text;
begin
  year_month := to_char(current_date, 'YYYYMM');

  -- Get the next sequence number for this month
  select coalesce(max(
    case
      when project_code like 'PRJ-' || year_month || '-%'
      then cast(substring(project_code from 'PRJ-\d{6}-(\d+)') as integer)
      else 0
    end
  ), 0) + 1
  into seq_num
  from projects;

  new_code := 'PRJ-' || year_month || '-' || lpad(seq_num::text, 3, '0');

  return new_code;
end;
$$ language plpgsql;

-- ============================================================
-- View for project summary with related data
-- ============================================================
create or replace view project_summary as
select
  p.*,
  c.company as client_company,
  c.email as client_email,
  o.title as opportunity_title,
  o.value as opportunity_value,
  q.quote_number,
  (p.budget_total - p.actuals_total) as budget_remaining,
  case
    when p.budget_total > 0 then round((p.actuals_total / p.budget_total * 100)::numeric, 1)
    else 0
  end as budget_used_percent
from projects p
left join clients c on p.client_id = c.id
left join opportunities o on p.opportunity_id = o.id
left join quotes q on p.quote_id = q.id;
