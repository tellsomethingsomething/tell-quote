-- ============================================================
-- BILLING MIGRATION: Organizations, Subscriptions, and AI Tokens
-- Run this in Supabase SQL Editor after the base schema
-- ============================================================

-- ============================================================
-- Organizations table (multi-tenant support)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,

  -- Stripe integration
  stripe_customer_id text UNIQUE,

  -- Subscription status
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'individual', 'team')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at timestamp with time zone,

  -- AI Token allocations
  ai_tokens_monthly integer DEFAULT 0,           -- Monthly allocation based on plan
  ai_tokens_used_this_month integer DEFAULT 0,   -- Used this billing period
  ai_tokens_monthly_reset_at timestamp with time zone, -- When tokens reset
  ai_tokens_purchased integer DEFAULT 0,         -- Purchased token packs (never expire)
  ai_tokens_used integer DEFAULT 0,              -- Total used from purchased packs

  -- Metadata
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS organizations_stripe_customer_id_idx ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS organizations_subscription_tier_idx ON organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Allow all (will be restricted later with proper RLS)
CREATE POLICY "Allow all organizations" ON organizations FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Subscriptions table (Stripe subscription records)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY, -- Use Stripe subscription ID as primary key
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe fields
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,

  -- Subscription details
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  plan_id text NOT NULL,

  -- Billing period
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,

  -- Cancellation
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,

  -- Trial
  trial_end timestamp with time zone,

  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_organization_id_idx ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow all
CREATE POLICY "Allow all subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Token Purchases table (one-time token pack purchases)
-- ============================================================
CREATE TABLE IF NOT EXISTS token_purchases (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Stripe payment details
  stripe_session_id text,
  stripe_payment_intent text,

  -- Purchase details
  tokens_purchased integer NOT NULL,
  price_id text NOT NULL,
  amount_paid integer NOT NULL, -- Amount in cents
  currency text NOT NULL DEFAULT 'usd',

  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for token_purchases
CREATE INDEX IF NOT EXISTS token_purchases_organization_id_idx ON token_purchases(organization_id);
CREATE INDEX IF NOT EXISTS token_purchases_created_at_idx ON token_purchases(created_at DESC);

-- Enable RLS
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

-- Allow all
CREATE POLICY "Allow all token_purchases" ON token_purchases FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Billing Invoices table (Stripe invoice records)
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_invoices (
  id text PRIMARY KEY, -- Use Stripe invoice ID as primary key
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe fields
  stripe_invoice_id text UNIQUE NOT NULL,

  -- Invoice details
  amount integer NOT NULL, -- Amount in cents
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  description text,
  invoice_pdf text,

  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for billing_invoices
CREATE INDEX IF NOT EXISTS billing_invoices_organization_id_idx ON billing_invoices(organization_id);
CREATE INDEX IF NOT EXISTS billing_invoices_stripe_invoice_id_idx ON billing_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS billing_invoices_created_at_idx ON billing_invoices(created_at DESC);

-- Enable RLS
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

-- Allow all
CREATE POLICY "Allow all billing_invoices" ON billing_invoices FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Audit Logs table (for tracking important events)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id text,

  -- Event details
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',

  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS audit_logs_organization_id_idx ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all
CREATE POLICY "Allow all audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Add organization_id to existing tables (for multi-tenancy)
-- ============================================================

-- Add organization_id to quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS quotes_organization_id_idx ON quotes(organization_id);

-- Add organization_id to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS clients_organization_id_idx ON clients(organization_id);

-- Add organization_id to rate_cards
ALTER TABLE rate_cards ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS rate_cards_organization_id_idx ON rate_cards(organization_id);

-- Add organization_id to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS settings_organization_id_idx ON settings(organization_id);

-- Add organization_id to opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS opportunities_organization_id_idx ON opportunities(organization_id);

-- Add organization_id to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS contacts_organization_id_idx ON contacts(organization_id);

-- Add organization_id to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS invoices_organization_id_idx ON invoices(organization_id);

-- Add organization_id to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS expenses_organization_id_idx ON expenses(organization_id);

-- Add organization_id to crew_bookings
ALTER TABLE crew_bookings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS crew_bookings_organization_id_idx ON crew_bookings(organization_id);

-- Add organization_id to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS user_profiles_organization_id_idx ON user_profiles(organization_id);

-- ============================================================
-- Helper function to get available AI tokens for an organization
-- ============================================================
CREATE OR REPLACE FUNCTION get_available_ai_tokens(org_id uuid)
RETURNS integer AS $$
DECLARE
  org_record RECORD;
  monthly_remaining integer;
  purchased_remaining integer;
BEGIN
  SELECT
    ai_tokens_monthly,
    ai_tokens_used_this_month,
    ai_tokens_purchased,
    ai_tokens_used
  INTO org_record
  FROM organizations
  WHERE id = org_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate remaining monthly tokens
  monthly_remaining := GREATEST(0, COALESCE(org_record.ai_tokens_monthly, 0) - COALESCE(org_record.ai_tokens_used_this_month, 0));

  -- Calculate remaining purchased tokens
  purchased_remaining := GREATEST(0, COALESCE(org_record.ai_tokens_purchased, 0) - COALESCE(org_record.ai_tokens_used, 0));

  RETURN monthly_remaining + purchased_remaining;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function to consume AI tokens (uses monthly first, then purchased)
-- ============================================================
CREATE OR REPLACE FUNCTION consume_ai_tokens(org_id uuid, tokens_to_use integer)
RETURNS boolean AS $$
DECLARE
  org_record RECORD;
  monthly_remaining integer;
  purchased_remaining integer;
  total_available integer;
  use_from_monthly integer;
  use_from_purchased integer;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT
    ai_tokens_monthly,
    ai_tokens_used_this_month,
    ai_tokens_purchased,
    ai_tokens_used
  INTO org_record
  FROM organizations
  WHERE id = org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Calculate remaining tokens
  monthly_remaining := GREATEST(0, COALESCE(org_record.ai_tokens_monthly, 0) - COALESCE(org_record.ai_tokens_used_this_month, 0));
  purchased_remaining := GREATEST(0, COALESCE(org_record.ai_tokens_purchased, 0) - COALESCE(org_record.ai_tokens_used, 0));
  total_available := monthly_remaining + purchased_remaining;

  -- Check if enough tokens available
  IF tokens_to_use > total_available THEN
    RETURN false;
  END IF;

  -- Use monthly tokens first
  use_from_monthly := LEAST(tokens_to_use, monthly_remaining);
  use_from_purchased := tokens_to_use - use_from_monthly;

  -- Update the organization
  UPDATE organizations
  SET
    ai_tokens_used_this_month = COALESCE(ai_tokens_used_this_month, 0) + use_from_monthly,
    ai_tokens_used = COALESCE(ai_tokens_used, 0) + use_from_purchased
  WHERE id = org_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
