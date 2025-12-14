-- Migration: Create user_profiles table
-- Run this in Supabase SQL Editor

-- Create user_profiles table
create table if not exists user_profiles (
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

-- Index for fast lookups
create index if not exists user_profiles_auth_user_id_idx on user_profiles(auth_user_id);

-- Enable RLS
alter table user_profiles enable row level security;

-- Drop existing policies if they exist (for re-runs)
drop policy if exists "Authenticated users can read profiles" on user_profiles;
drop policy if exists "Users can update own name" on user_profiles;

-- RLS Policies
create policy "Authenticated users can read profiles" on user_profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own name" on user_profiles
  for update using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Trigger for updated_at (may already exist from main schema)
drop trigger if exists update_user_profiles_updated_at on user_profiles;
create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at_column();
