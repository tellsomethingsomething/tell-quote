-- =====================================================
-- RESEARCH & CRM SCHEMA
-- Tell Productions - Sports Intelligence System
-- =====================================================

-- =====================================================
-- AGENT MEMORY - Research findings and intelligence
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Memory type and classification
  memory_type text NOT NULL DEFAULT 'research_finding', -- research_finding, market_intel, competitor_update, client_insight

  -- Core content
  title text NOT NULL,
  content text,
  summary text, -- AI-generated summary

  -- Classification
  category text, -- sports_event, broadcast_rights, competitor, market_trend
  subcategory text,

  -- Structured data (JSONB for flexibility)
  structured_data jsonb DEFAULT '{}', -- event details, contacts, etc.

  -- Geographic tagging
  country text,
  region text, -- SEA, GCC, Central_Asia

  -- Sports tagging
  sport text, -- football, futsal, volleyball, handball, basketball, cycling
  event_type text, -- tournament, league, friendly, qualification

  -- Organization tagging
  organization text, -- Federation, broadcaster, etc.
  organization_type text, -- federation, broadcaster, agency, venue, government

  -- Related entities
  related_opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  related_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  related_contact_ids uuid[] DEFAULT '{}',

  -- Context and relevance
  context_tags text[] DEFAULT '{}',
  relevance_score numeric(3,2) DEFAULT 0.5, -- 0-1 score
  confidence text DEFAULT 'medium', -- high, medium, low

  -- Source tracking
  source_type text, -- manual, web_search, email, social_media
  source_urls text[] DEFAULT '{}',
  source_details text,

  -- Status
  status text DEFAULT 'active', -- active, archived, converted, expired
  action_required boolean DEFAULT false,
  action_taken text,

  -- Timing
  event_date date, -- If related to a specific event
  expires_at timestamptz, -- When this intel becomes stale

  -- Agent tracking
  agent_name text DEFAULT 'research_agent',
  agent_task_id uuid,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- User tracking
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_country ON agent_memory(country);
CREATE INDEX IF NOT EXISTS idx_agent_memory_region ON agent_memory(region);
CREATE INDEX IF NOT EXISTS idx_agent_memory_sport ON agent_memory(sport);
CREATE INDEX IF NOT EXISTS idx_agent_memory_organization ON agent_memory(organization);
CREATE INDEX IF NOT EXISTS idx_agent_memory_status ON agent_memory(status);
CREATE INDEX IF NOT EXISTS idx_agent_memory_created ON agent_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_event_date ON agent_memory(event_date);
CREATE INDEX IF NOT EXISTS idx_agent_memory_opportunity ON agent_memory(related_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_client ON agent_memory(related_client_id);

-- =====================================================
-- KNOWLEDGE FRAGMENTS - Reusable knowledge pieces
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title text NOT NULL,
  content text NOT NULL,
  summary text,

  -- Classification
  category text NOT NULL, -- market_knowledge, company_profile, contact_info, pricing, workflow, competitive_intel
  subcategory text,

  -- Tags for retrieval
  tags text[] DEFAULT '{}',

  -- Structured data
  metadata jsonb DEFAULT '{}',

  -- Geographic scope
  countries text[] DEFAULT '{}',
  regions text[] DEFAULT '{}',

  -- Related entities
  related_company_ids uuid[] DEFAULT '{}',
  related_contact_ids uuid[] DEFAULT '{}',
  related_opportunity_ids uuid[] DEFAULT '{}',

  -- Quality metrics
  confidence_score numeric(3,2) DEFAULT 0.5,
  verification_status text DEFAULT 'unverified', -- verified, unverified, needs_review
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),

  -- Source
  source_type text,
  source_url text,
  source_date date,

  -- Status
  status text DEFAULT 'active', -- active, archived, outdated
  expires_at timestamptz,

  -- Usage tracking
  access_count integer DEFAULT 0,
  last_accessed_at timestamptz,
  usefulness_score numeric(3,2), -- Feedback-based

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_fragments(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_fragments USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_regions ON knowledge_fragments USING GIN(regions);
CREATE INDEX IF NOT EXISTS idx_knowledge_status ON knowledge_fragments(status);

-- =====================================================
-- AGENT TASKS - Tracked research tasks
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task identification
  task_type text NOT NULL, -- research, monitor, analyze, report, notify
  task_name text NOT NULL,

  -- Task details
  description text,
  parameters jsonb DEFAULT '{}',

  -- Geographic scope
  target_countries text[] DEFAULT '{}',
  target_regions text[] DEFAULT '{}',

  -- Sport scope
  target_sports text[] DEFAULT '{}',

  -- Status
  status text DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  priority text DEFAULT 'normal', -- low, normal, high, urgent

  -- Scheduling
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  -- Results
  result_summary text,
  result_data jsonb DEFAULT '{}',
  findings_count integer DEFAULT 0,
  error_message text,

  -- Related entities
  related_opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  created_memories uuid[] DEFAULT '{}', -- IDs of created agent_memory records

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_scheduled ON agent_tasks(scheduled_at);

-- =====================================================
-- AGENT LEARNINGS - Accumulated insights
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Learning content
  learning_type text NOT NULL, -- pattern, preference, insight, correction
  title text NOT NULL,
  content text NOT NULL,

  -- Context
  context_category text, -- pricing, timing, relationships, communication

  -- Applicability
  applies_to_countries text[] DEFAULT '{}',
  applies_to_sports text[] DEFAULT '{}',
  applies_to_clients text[] DEFAULT '{}',

  -- Confidence and validation
  confidence numeric(3,2) DEFAULT 0.5,
  validated boolean DEFAULT false,
  validated_at timestamptz,
  validated_by uuid REFERENCES auth.users(id),

  -- Usage
  times_applied integer DEFAULT 0,
  last_applied_at timestamptz,

  -- Status
  status text DEFAULT 'active', -- active, archived, superseded
  superseded_by uuid REFERENCES agent_learnings(id),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learnings_type ON agent_learnings(learning_type);
CREATE INDEX IF NOT EXISTS idx_learnings_category ON agent_learnings(context_category);

-- =====================================================
-- CONTACTS - People we interact with
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  first_name text NOT NULL,
  last_name text,
  full_name text GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,

  -- Contact details
  email text,
  phone text,
  mobile text,
  whatsapp text,
  linkedin_url text,

  -- Organization
  company_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  company_name text, -- Denormalized for convenience
  job_title text,
  department text,

  -- Classification
  contact_type text DEFAULT 'prospect', -- client, prospect, supplier, crew, federation, broadcaster, agency, partner
  relationship_owner text, -- tom, azman, shared

  -- Geography
  country text,
  region text,
  timezone text,
  preferred_language text DEFAULT 'en',

  -- Relationship tracking
  relationship_score integer DEFAULT 50, -- 0-100
  relationship_trend text DEFAULT 'stable', -- rising, stable, cooling, dormant
  last_contact_date date,
  optimal_next_contact date,

  -- Tags and notes
  tags text[] DEFAULT '{}',
  notes text,

  -- Communication preferences
  preferred_contact_method text DEFAULT 'email', -- email, phone, whatsapp, linkedin
  best_time_to_contact text,

  -- Status
  status text DEFAULT 'active', -- active, inactive, do_not_contact

  -- Source
  source text, -- manual, import, linkedin, event, referral

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship ON contacts(relationship_score DESC);

-- =====================================================
-- INTERACTIONS - Communication history
-- =====================================================

CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linked entities
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,

  -- Interaction details
  interaction_type text NOT NULL, -- email_sent, email_received, meeting, call, whatsapp, linkedin, in_person
  direction text, -- inbound, outbound, mutual

  -- Content
  subject text,
  summary text,
  content text, -- Full content if captured

  -- Timing
  interaction_date timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer,

  -- Participants
  participants uuid[] DEFAULT '{}', -- Array of contact IDs
  our_participants text[] DEFAULT '{}', -- tom, azman, etc.

  -- Sentiment and outcome
  sentiment text DEFAULT 'neutral', -- positive, neutral, negative
  outcome text, -- successful, follow_up_needed, no_response, declined

  -- Action items
  action_items jsonb DEFAULT '[]', -- Array of {task, due_date, assigned_to, completed}
  next_steps text,

  -- Source tracking
  source_reference text, -- Email ID, calendar event ID, etc.
  attachments text[] DEFAULT '{}', -- URLs to files

  -- Logging
  logged_by text, -- tom, azman, system
  auto_logged boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_company ON interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity ON interactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);

-- =====================================================
-- SPORTS EVENTS - Event intelligence tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS sports_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_name text NOT NULL,
  event_name_local text, -- Local language name

  -- Classification
  sport text NOT NULL,
  event_type text, -- tournament, league, friendly, qualification, club_competition
  event_tier text, -- tier1_major, tier2_regional, tier3_national, tier4_youth, tier5_niche
  format text, -- knockout, league, group_knockout, round_robin

  -- Status
  event_status text DEFAULT 'rumoured', -- confirmed, announced, rumoured, possible, speculative
  confidence_level text DEFAULT 'medium', -- high, medium, low

  -- Dates
  start_date date,
  end_date date,
  date_certainty text DEFAULT 'estimated', -- confirmed, estimated, window

  -- Location
  host_country text,
  host_cities text[] DEFAULT '{}',
  venues text[] DEFAULT '{}',
  region text,

  -- Participants
  participating_countries text[] DEFAULT '{}',
  participating_teams text[] DEFAULT '{}',
  num_teams integer,

  -- Organizers
  organizing_body text, -- Federation name
  organizing_body_type text, -- continental_federation, national_federation, government, private

  -- Commercial
  broadcast_rights_holder text,
  production_company text,
  title_sponsor text,
  estimated_budget numeric(12,2),
  budget_currency text DEFAULT 'USD',

  -- Production opportunity
  opportunity_type text[] DEFAULT '{}', -- production, subcontract, equipment_hire, crew_supply, presentation
  production_model text, -- full_ob, remi, local_production, unknown
  broadcast_status text, -- live_tv, streaming_only, no_coverage, unknown

  -- Competition tracking
  competitors text[] DEFAULT '{}', -- Other companies likely to pitch
  our_relationship_angle text,

  -- Decision timeline
  decision_date date,
  decision_makers jsonb DEFAULT '[]', -- Array of {name, role, contact_id}

  -- Intelligence
  notes text,
  intelligence_notes text,
  political_context text,
  risks text[] DEFAULT '{}',

  -- Source tracking
  source_quality text DEFAULT 'unknown', -- official, credible_media, single_source, social_media
  sources text[] DEFAULT '{}',
  last_verified timestamptz,

  -- Related opportunity
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_events_sport ON sports_events(sport);
CREATE INDEX IF NOT EXISTS idx_events_status ON sports_events(event_status);
CREATE INDEX IF NOT EXISTS idx_events_country ON sports_events(host_country);
CREATE INDEX IF NOT EXISTS idx_events_region ON sports_events(region);
CREATE INDEX IF NOT EXISTS idx_events_dates ON sports_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_opportunity ON sports_events(opportunity_id);

-- =====================================================
-- RESEARCH ALERTS - Notifications for opportunities
-- =====================================================

CREATE TABLE IF NOT EXISTS research_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert details
  alert_type text NOT NULL, -- new_event, status_change, deadline, relationship_cooling, market_change
  priority text DEFAULT 'normal', -- low, normal, high, urgent

  -- Content
  title text NOT NULL,
  message text NOT NULL,

  -- Related entities
  related_event_id uuid REFERENCES sports_events(id) ON DELETE SET NULL,
  related_opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  related_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  related_memory_id uuid REFERENCES agent_memory(id) ON DELETE SET NULL,

  -- Action
  action_required boolean DEFAULT false,
  recommended_action text,
  action_deadline timestamptz,
  action_taken boolean DEFAULT false,
  action_notes text,

  -- Targeting
  target_users text[] DEFAULT '{}', -- tom, azman, all

  -- Status
  status text DEFAULT 'unread', -- unread, read, acknowledged, dismissed
  read_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON research_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON research_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON research_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON research_alerts(created_at DESC);

-- =====================================================
-- COMMUNICATION LOG - Track research outreach
-- =====================================================

CREATE TABLE IF NOT EXISTS communication_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  channel text NOT NULL, -- email, linkedin, whatsapp, call, meeting
  direction text NOT NULL, -- outbound, inbound, mutual

  -- Content
  subject text,
  summary text, -- AI-generated or manual

  -- Participants
  contact_ids uuid[] DEFAULT '{}',
  our_participants text[] DEFAULT '{}',

  -- Timing
  timestamp timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer,

  -- Sentiment
  sentiment numeric(3,2), -- -1 to 1

  -- Actions
  action_items jsonb DEFAULT '[]',
  follow_up_date date,

  -- Related entities
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  event_id uuid REFERENCES sports_events(id) ON DELETE SET NULL,

  -- Content storage (encrypted)
  raw_content text,

  -- Source
  source_reference text,
  auto_captured boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  logged_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_comm_log_channel ON communication_log(channel);
CREATE INDEX IF NOT EXISTS idx_comm_log_timestamp ON communication_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_comm_log_opportunity ON communication_log(opportunity_id);

-- =====================================================
-- RELATIONSHIP HEALTH - Track contact relationships
-- =====================================================

CREATE TABLE IF NOT EXISTS relationship_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Current scores
  health_score integer DEFAULT 50, -- 0-100
  recency_score integer DEFAULT 50,
  frequency_score integer DEFAULT 50,
  quality_score integer DEFAULT 50,
  reciprocity_score integer DEFAULT 50,

  -- Trend
  trend text DEFAULT 'stable', -- rising, stable, cooling, dormant
  previous_score integer,
  score_change integer DEFAULT 0,

  -- Timing
  last_contact_date timestamptz,
  optimal_next_contact date,
  days_since_contact integer,

  -- Recommendations
  recommended_action text,
  risk_factors jsonb DEFAULT '[]',

  -- Historical (for trending)
  history jsonb DEFAULT '[]', -- Array of {date, score, event}

  -- Timestamps
  calculated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(contact_id)
);

CREATE INDEX IF NOT EXISTS idx_relationship_contact ON relationship_health(contact_id);
CREATE INDEX IF NOT EXISTS idx_relationship_score ON relationship_health(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_trend ON relationship_health(trend);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (Optional for development)
-- =====================================================

-- For development, you may want to disable RLS
ALTER TABLE agent_memory DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_fragments DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sports_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_health DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Research & CRM schema created successfully! Tables: agent_memory, knowledge_fragments, agent_tasks, agent_learnings, contacts, interactions, sports_events, research_alerts, communication_log, relationship_health' as status;
