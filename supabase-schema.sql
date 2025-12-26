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
  status text default 'pending' check (status in ('pending', 'active', 'suspended')),
  tab_permissions text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(auth_user_id),
  unique(email)
);

-- Index for fast lookups by auth user id
create index user_profiles_auth_user_id_idx on user_profiles(auth_user_id);

-- Enable RLS
alter table user_profiles enable row level security;

-- RLS Policies for user_profiles
-- All authenticated users can read profiles (internal tool)
create policy "Authenticated users can read profiles" on user_profiles
  for select using (auth.role() = 'authenticated');

-- Admins can update any profile
create policy "Admins can manage profiles" on user_profiles
  for all using (
    exists (
      select 1 from user_profiles up
      where up.auth_user_id = auth.uid()
      and up.role = 'admin'
    )
  );

-- Users can update their own name only
create policy "Users can update own name" on user_profiles
  for update using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Insert/Delete managed by service role via Edge Functions (bypasses RLS)

-- Trigger for updated_at
create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at_column();

-- ============================================================
-- Google OAuth Tokens table
-- ============================================================
create table google_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamp with time zone not null,
  scopes text[] not null,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast lookups
create index google_tokens_user_id_idx on google_tokens(user_id);

-- Enable RLS
alter table google_tokens enable row level security;

-- Allow all (internal tool)
create policy "Allow all google_tokens" on google_tokens for all using (true) with check (true);

-- Trigger for updated_at
create trigger update_google_tokens_updated_at before update on google_tokens
  for each row execute function update_updated_at_column();

-- ============================================================
-- MIGRATION: Add status column to user_profiles
-- Run this if you already have the user_profiles table:
-- ============================================================
-- ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended'));
-- ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
-- UPDATE user_profiles SET tab_permissions = ARRAY[]::text[] WHERE tab_permissions IS NULL;

-- ============================================================
-- Set tom@tell.so as admin (run after user signs up)
-- ============================================================
-- UPDATE user_profiles SET role = 'admin', status = 'active', tab_permissions = ARRAY['dashboard', 'quotes', 'clients', 'opportunities', 'tasks', 'sop', 'knowledge', 'kit', 'rate-card', 'contacts'] WHERE email = 'tom@tell.so';

-- ============================================================
-- Contacts table for CRM
-- ============================================================
create table contacts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  company text,
  role text,
  client_id uuid references clients(id) on delete set null,
  source text,
  status text default 'active' check (status in ('active', 'inactive')),
  tags text[] default '{}',
  notes text,
  last_contacted_at timestamp with time zone,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for contacts
create index contacts_email_idx on contacts(email);
create index contacts_client_id_idx on contacts(client_id);
create index contacts_status_idx on contacts(status);

-- Enable RLS
alter table contacts enable row level security;

-- Allow all (internal tool)
create policy "Allow all contacts" on contacts for all using (true) with check (true);

-- Trigger for updated_at
create trigger update_contacts_updated_at before update on contacts
  for each row execute function update_updated_at_column();

-- ============================================================
-- Invoices table
-- ============================================================
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text not null,
  quote_id uuid references quotes(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  project_id uuid,
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal numeric(12,2) default 0,
  tax_rate numeric(5,2) default 0,
  tax_amount numeric(12,2) default 0,
  total numeric(12,2) default 0,
  currency text default 'USD',
  issue_date date,
  due_date date,
  paid_date date,
  line_items jsonb default '[]',
  notes text,
  client_name text,
  client_email text,
  client_address text,
  quote_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for invoices
create index invoices_client_id_idx on invoices(client_id);
create index invoices_quote_id_idx on invoices(quote_id);
create index invoices_project_id_idx on invoices(project_id);
create index invoices_status_idx on invoices(status);
create index invoices_invoice_number_idx on invoices(invoice_number);

-- Enable RLS
alter table invoices enable row level security;

-- Allow all (internal tool)
create policy "Allow all invoices" on invoices for all using (true) with check (true);

-- Trigger for updated_at
create trigger update_invoices_updated_at before update on invoices
  for each row execute function update_updated_at_column();

-- ============================================================
-- Expenses table (for P&L tracking)
-- ============================================================
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid,
  client_id uuid references clients(id) on delete set null,
  category text not null,
  description text,
  amount numeric(12,2) not null,
  currency text default 'USD',
  date date not null,
  receipt_url text,
  is_billable boolean default false,
  vendor text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for expenses
create index expenses_project_id_idx on expenses(project_id);
create index expenses_client_id_idx on expenses(client_id);
create index expenses_category_idx on expenses(category);
create index expenses_date_idx on expenses(date);

-- Enable RLS
alter table expenses enable row level security;

-- Allow all (internal tool)
create policy "Allow all expenses" on expenses for all using (true) with check (true);

-- Trigger for updated_at
create trigger update_expenses_updated_at before update on expenses
  for each row execute function update_updated_at_column();

-- ============================================================
-- Crew Bookings table (for P&L tracking - hidden feature)
-- ============================================================
create table crew_bookings (
  id uuid default uuid_generate_v4() primary key,
  crew_id uuid,
  project_id uuid,
  call_sheet_id uuid,
  crew_name text,
  crew_role text,
  start_date date,
  end_date date,
  day_rate numeric(12,2) default 0,
  days numeric(6,2) default 1,
  overtime_hours numeric(6,2) default 0,
  overtime_rate numeric(12,2) default 0,
  total_cost numeric(12,2) default 0,
  currency text default 'USD',
  status text default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  is_paid boolean default false,
  paid_date date,
  po_number text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for crew_bookings
create index crew_bookings_crew_id_idx on crew_bookings(crew_id);
create index crew_bookings_project_id_idx on crew_bookings(project_id);
create index crew_bookings_call_sheet_id_idx on crew_bookings(call_sheet_id);
create index crew_bookings_status_idx on crew_bookings(status);
create index crew_bookings_start_date_idx on crew_bookings(start_date);
create index crew_bookings_po_number_idx on crew_bookings(po_number);

-- Enable RLS
alter table crew_bookings enable row level security;

-- Allow all (internal tool)
create policy "Allow all crew_bookings" on crew_bookings for all using (true) with check (true);

-- Trigger for updated_at
create trigger update_crew_bookings_updated_at before update on crew_bookings
  for each row execute function update_updated_at_column();
