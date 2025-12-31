-- ============================================================
-- DUPLICATE TABLE CONSOLIDATION MIGRATION
-- Run: 2024-12-31
-- Purpose: Consolidate duplicate table definitions
--
-- WARNING: This migration should be reviewed carefully before running.
-- It makes decisions about which duplicate tables to keep.
-- ============================================================

-- ============================================================
-- PART 1: CONTACTS TABLE CONSOLIDATION
--
-- There are 3 contacts tables defined across schema files:
-- 1. supabase-schema.sql: contacts (name, email, client_id)
-- 2. supabase-research-schema.sql: contacts (first_name, last_name, company_id → clients)
-- 3. supabase-contacts-schema.sql: contacts (name, company_id → companies)
--
-- DECISION: Keep the main schema contacts table and add missing columns
-- ============================================================

-- Add columns from research schema that might be missing
DO $$
BEGIN
    -- Add first_name, last_name if not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'first_name') THEN
        ALTER TABLE contacts ADD COLUMN first_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_name') THEN
        ALTER TABLE contacts ADD COLUMN last_name TEXT;
    END IF;

    -- Add mobile, whatsapp from research schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'mobile') THEN
        ALTER TABLE contacts ADD COLUMN mobile TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'whatsapp') THEN
        ALTER TABLE contacts ADD COLUMN whatsapp TEXT;
    END IF;

    -- Add linkedin_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_url') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_url TEXT;
    END IF;

    -- Add job_title, department
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'job_title') THEN
        ALTER TABLE contacts ADD COLUMN job_title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'department') THEN
        ALTER TABLE contacts ADD COLUMN department TEXT;
    END IF;

    -- Add is_primary flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'is_primary') THEN
        ALTER TABLE contacts ADD COLUMN is_primary BOOLEAN DEFAULT false;
    END IF;

    -- Add is_active flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'is_active') THEN
        ALTER TABLE contacts ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'avatar_url') THEN
        ALTER TABLE contacts ADD COLUMN avatar_url TEXT;
    END IF;

    -- Add custom_fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'custom_fields') THEN
        ALTER TABLE contacts ADD COLUMN custom_fields JSONB DEFAULT '{}';
    END IF;

    -- Add organization_id for multi-tenancy
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'organization_id') THEN
        ALTER TABLE contacts ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- Create generated full_name column for consistency
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'full_name') THEN
        ALTER TABLE contacts ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
            COALESCE(name, TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')))
        ) STORED;
    END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS contacts_organization_id_idx ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS contacts_is_primary_idx ON contacts(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS contacts_is_active_idx ON contacts(is_active) WHERE is_active = true;

-- ============================================================
-- PART 2: AGENT_MEMORY TABLE CONSOLIDATION
--
-- There are 2 different agent_memory tables:
-- 1. supabase-research-schema.sql: for research/CRM context
-- 2. supabase-agent-schema.sql: for quote/client AI context
--
-- DECISION: Create a unified agent_memory table with all columns
-- ============================================================

-- Drop and recreate agent_memory with unified schema
-- Note: This will lose existing data - backup first if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_memory') THEN
        -- First, backup existing data if any
        CREATE TABLE IF NOT EXISTS agent_memory_backup AS SELECT * FROM agent_memory;

        -- Drop existing table
        DROP TABLE agent_memory CASCADE;
    END IF;
END $$;

-- Create unified agent_memory table
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- Agent identification
    agent_name TEXT NOT NULL DEFAULT 'default',
    memory_type TEXT NOT NULL,
    -- Content
    content JSONB DEFAULT '{}',
    structured_data JSONB DEFAULT '{}',
    context_tags TEXT[] DEFAULT '{}',
    -- Geographic context (from research schema)
    category TEXT,
    country TEXT,
    region TEXT,
    sport TEXT,
    organization TEXT,
    -- Relevance scoring
    relevance_score FLOAT DEFAULT 0.5,
    confidence NUMERIC(3,2) DEFAULT 0.5,
    -- Related entities
    related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    related_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    related_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    related_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    -- Multi-tenancy
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for agent_memory
CREATE INDEX IF NOT EXISTS agent_memory_agent_name_idx ON agent_memory(agent_name);
CREATE INDEX IF NOT EXISTS agent_memory_memory_type_idx ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS agent_memory_category_idx ON agent_memory(category);
CREATE INDEX IF NOT EXISTS agent_memory_country_idx ON agent_memory(country);
CREATE INDEX IF NOT EXISTS agent_memory_related_quote_id_idx ON agent_memory(related_quote_id);
CREATE INDEX IF NOT EXISTS agent_memory_related_client_id_idx ON agent_memory(related_client_id);
CREATE INDEX IF NOT EXISTS agent_memory_related_opportunity_id_idx ON agent_memory(related_opportunity_id);
CREATE INDEX IF NOT EXISTS agent_memory_organization_id_idx ON agent_memory(organization_id);

-- RLS
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org agent_memory" ON agent_memory
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org agent_memory" ON agent_memory
    FOR ALL USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- ============================================================
-- PART 3: AGENT_LEARNINGS TABLE CONSOLIDATION
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_learnings') THEN
        CREATE TABLE IF NOT EXISTS agent_learnings_backup AS SELECT * FROM agent_learnings;
        DROP TABLE agent_learnings CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS agent_learnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- Agent identification
    agent_name TEXT NOT NULL DEFAULT 'default',
    learning_type TEXT NOT NULL,
    -- Content
    context JSONB DEFAULT '{}',
    outcome JSONB DEFAULT '{}',
    -- Scoring
    confidence NUMERIC(3,2) DEFAULT 0.5,
    confidence_score FLOAT DEFAULT 0.5,
    impact_score FLOAT DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    -- Applicability (from research schema)
    applies_to_countries TEXT[] DEFAULT '{}',
    applies_to_regions TEXT[] DEFAULT '{}',
    applies_to_sports TEXT[] DEFAULT '{}',
    applies_to_clients UUID[] DEFAULT '{}',
    -- Related entities
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    -- Validation
    validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    -- Multi-tenancy
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS agent_learnings_agent_name_idx ON agent_learnings(agent_name);
CREATE INDEX IF NOT EXISTS agent_learnings_learning_type_idx ON agent_learnings(learning_type);
CREATE INDEX IF NOT EXISTS agent_learnings_quote_id_idx ON agent_learnings(quote_id);
CREATE INDEX IF NOT EXISTS agent_learnings_opportunity_id_idx ON agent_learnings(opportunity_id);
CREATE INDEX IF NOT EXISTS agent_learnings_organization_id_idx ON agent_learnings(organization_id);

-- RLS
ALTER TABLE agent_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org agent_learnings" ON agent_learnings
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org agent_learnings" ON agent_learnings
    FOR ALL USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- ============================================================
-- PART 4: KNOWLEDGE_FRAGMENTS TABLE CONSOLIDATION
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_fragments') THEN
        CREATE TABLE IF NOT EXISTS knowledge_fragments_backup AS SELECT * FROM knowledge_fragments;
        DROP TABLE knowledge_fragments CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS knowledge_fragments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- Type and content
    fragment_type TEXT NOT NULL DEFAULT 'general',
    category TEXT,
    content TEXT,
    structured_data JSONB DEFAULT '{}',
    -- Geographic scope (arrays for multi-region)
    countries TEXT[] DEFAULT '{}',
    regions TEXT[] DEFAULT '{}',
    -- Agent-specific
    applied_to_agents TEXT[] DEFAULT '{}',
    region TEXT, -- Single region for agent schema compatibility
    deal_type TEXT,
    -- Scoring
    impact_score FLOAT DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    -- Related entities (arrays for multiple relationships)
    related_company_ids UUID[] DEFAULT '{}',
    related_contact_ids UUID[] DEFAULT '{}',
    related_opportunity_ids UUID[] DEFAULT '{}',
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    -- Multi-tenancy
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS knowledge_fragments_fragment_type_idx ON knowledge_fragments(fragment_type);
CREATE INDEX IF NOT EXISTS knowledge_fragments_category_idx ON knowledge_fragments(category);
CREATE INDEX IF NOT EXISTS knowledge_fragments_organization_id_idx ON knowledge_fragments(organization_id);

-- RLS
ALTER TABLE knowledge_fragments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org knowledge_fragments" ON knowledge_fragments
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org knowledge_fragments" ON knowledge_fragments
    FOR ALL USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- ============================================================
-- PART 5: AGENT_TASKS TABLE CONSOLIDATION
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_tasks') THEN
        CREATE TABLE IF NOT EXISTS agent_tasks_backup AS SELECT * FROM agent_tasks;
        DROP TABLE agent_tasks CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- Agent identification
    agent_name TEXT NOT NULL DEFAULT 'default',
    task_type TEXT NOT NULL,
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    -- Input/Output
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    -- Target scope (from research schema)
    target_countries TEXT[] DEFAULT '{}',
    target_regions TEXT[] DEFAULT '{}',
    target_sports TEXT[] DEFAULT '{}',
    -- Related entities
    related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    related_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    related_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    -- Created memories (from research schema)
    created_memories UUID[] DEFAULT '{}',
    -- Execution tracking
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    -- Multi-tenancy
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS agent_tasks_agent_name_idx ON agent_tasks(agent_name);
CREATE INDEX IF NOT EXISTS agent_tasks_task_type_idx ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS agent_tasks_status_idx ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS agent_tasks_related_quote_id_idx ON agent_tasks(related_quote_id);
CREATE INDEX IF NOT EXISTS agent_tasks_related_client_id_idx ON agent_tasks(related_client_id);
CREATE INDEX IF NOT EXISTS agent_tasks_related_opportunity_id_idx ON agent_tasks(related_opportunity_id);
CREATE INDEX IF NOT EXISTS agent_tasks_organization_id_idx ON agent_tasks(organization_id);

-- RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org agent_tasks" ON agent_tasks
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org agent_tasks" ON agent_tasks
    FOR ALL USING (
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- ============================================================
-- PART 6: ADD TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE TRIGGER update_agent_memory_updated_at BEFORE UPDATE ON agent_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_learnings_updated_at BEFORE UPDATE ON agent_learnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_fragments_updated_at BEFORE UPDATE ON knowledge_fragments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_tasks_updated_at BEFORE UPDATE ON agent_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION NOTES
-- ============================================================

COMMENT ON TABLE agent_memory IS 'Unified agent memory table - consolidated from research-schema and agent-schema';
COMMENT ON TABLE agent_learnings IS 'Unified agent learnings table - consolidated from research-schema and agent-schema';
COMMENT ON TABLE knowledge_fragments IS 'Unified knowledge fragments table - consolidated from research-schema and agent-schema';
COMMENT ON TABLE agent_tasks IS 'Unified agent tasks table - consolidated from research-schema and agent-schema';

-- ============================================================
-- CLEANUP: Remove backup tables after verification
-- Run these manually after confirming data is correct:
--
-- DROP TABLE IF EXISTS agent_memory_backup;
-- DROP TABLE IF EXISTS agent_learnings_backup;
-- DROP TABLE IF EXISTS knowledge_fragments_backup;
-- DROP TABLE IF EXISTS agent_tasks_backup;
-- ============================================================
