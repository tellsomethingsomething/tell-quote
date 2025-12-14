-- Supabase Schema for Quote Tool
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Quotes table
create table quotes (
  id uuid default uuid_generate_v4() primary key,
  quote_number text not null,
  quote_date date,
  validity_days integer default 30,
  status text default 'draft',
  currency text default 'USD',
  prepared_by text,

  -- Client info (denormalized for simplicity)
  client jsonb default '{}',

  -- Project info
  project jsonb default '{}',

  -- Sections with line items
  sections jsonb default '{}',

  -- Fees
  fees jsonb default '{}',

  -- Proposal data
  proposal jsonb default '{}',

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clients table
create table clients (
  id uuid default uuid_generate_v4() primary key,
  company text not null,
  contact text,
  email text,
  phone text,
  address text,
  notes text,
  tags text[] default '{}',
  contacts jsonb default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rate cards table
create table rate_cards (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  section text not null,
  subsection text not null,
  unit text default 'day',
  cost numeric default 0,
  charge numeric default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings table (single row for app settings)
create table settings (
  id uuid default uuid_generate_v4() primary key,
  company jsonb default '{}',
  quote_defaults jsonb default '{}',
  terms_and_conditions text,
  users jsonb default '[]',
  ai_settings jsonb default '{}',
  ops_preferences jsonb default '{}',
  dashboard_preferences jsonb default '{}',
  quotes_preferences jsonb default '{}',
  clients_preferences jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rate card sections table
create table rate_card_sections (
  id text primary key,
  name text not null,
  group_name text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Opportunities table
create table opportunities (
  id uuid default uuid_generate_v4() primary key,
  title text,
  client_id uuid references clients(id) on delete set null,
  client jsonb default '{}',
  region text,
  country text,
  status text default 'active',
  value numeric default 0,
  currency text default 'USD',
  probability integer default 50,
  source text,
  competitors text[] default '{}',
  contacts jsonb default '[]',
  account_owner_id text,
  brief text,
  notes text,
  next_action text,
  next_action_date date,
  expected_close_date date,
  converted_to_quote_id uuid references quotes(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for common queries
create index quotes_quote_number_idx on quotes(quote_number);
create index quotes_status_idx on quotes(status);
create index quotes_created_at_idx on quotes(created_at desc);
create index clients_company_idx on clients(company);
create index rate_cards_section_idx on rate_cards(section);
create index opportunities_country_idx on opportunities(country);
create index opportunities_status_idx on opportunities(status);

-- Enable Row Level Security (but allow all for now - internal tool)
alter table quotes enable row level security;
alter table clients enable row level security;
alter table rate_cards enable row level security;
alter table rate_card_sections enable row level security;
alter table settings enable row level security;
alter table opportunities enable row level security;

-- Policies to allow all operations (internal tool, no auth required initially)
create policy "Allow all quotes" on quotes for all using (true) with check (true);
create policy "Allow all clients" on clients for all using (true) with check (true);
create policy "Allow all rate_cards" on rate_cards for all using (true) with check (true);
create policy "Allow all rate_card_sections" on rate_card_sections for all using (true) with check (true);
create policy "Allow all settings" on settings for all using (true) with check (true);
create policy "Allow all opportunities" on opportunities for all using (true) with check (true);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_quotes_updated_at before update on quotes
  for each row execute function update_updated_at_column();
create trigger update_clients_updated_at before update on clients
  for each row execute function update_updated_at_column();
create trigger update_rate_cards_updated_at before update on rate_cards
  for each row execute function update_updated_at_column();
create trigger update_rate_card_sections_updated_at before update on rate_card_sections
  for each row execute function update_updated_at_column();
create trigger update_settings_updated_at before update on settings
  for each row execute function update_updated_at_column();
create trigger update_opportunities_updated_at before update on opportunities
  for each row execute function update_updated_at_column();

-- Insert default settings row
insert into settings (company, quote_defaults, terms_and_conditions, users, ai_settings)
values (
  '{"name": "Tell Productions Sdn Bhd", "email": "", "phone": "", "address": ""}',
  '{"currency": "MYR", "validityDays": 30}',
  '',
  '[]',
  '{}'
);

-- ============================================================
-- MIGRATION: Add preferences columns to settings table
-- Run this if you already have the settings table:
-- ============================================================
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS ops_preferences jsonb DEFAULT '{}';
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS dashboard_preferences jsonb DEFAULT '{}';
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotes_preferences jsonb DEFAULT '{}';
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS clients_preferences jsonb DEFAULT '{}';

-- ============================================================
-- User Profiles table (links to Supabase auth.users)
-- ============================================================
create table user_profiles (
  id uuid default uuid_generate_v4() primary key,
  auth_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text default 'user' check (role in ('admin', 'user')),
  tab_permissions text[] default array['dashboard', 'quotes', 'clients', 'opportunities', 'tasks', 'rate-card'],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(auth_user_id)
);

-- Index for fast lookups by auth user id
create index user_profiles_auth_user_id_idx on user_profiles(auth_user_id);

-- Enable RLS
alter table user_profiles enable row level security;

-- RLS Policies for user_profiles
-- All authenticated users can read profiles (internal tool)
create policy "Authenticated users can read profiles" on user_profiles
  for select using (auth.role() = 'authenticated');

-- Users can update their own name only
create policy "Users can update own name" on user_profiles
  for update using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Insert/Delete managed by service role via Edge Functions (bypasses RLS)

-- Trigger for updated_at
create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at_column();
