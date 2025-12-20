-- =====================================================
-- AI AGENT MEMORY SYSTEM SCHEMA
-- Tell Quote CRM - Self-Learning Agent Layer
-- =====================================================

-- =====================================================
-- CORE AGENT MEMORY TABLES
-- =====================================================

-- Agent memory and context storage
-- Stores research findings, market intelligence, contact history
CREATE TABLE IF NOT EXISTS agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL, -- 'research', 'leadgen', 'strategy', 'finance'
  memory_type text NOT NULL, -- 'research_findings', 'market_intelligence', 'contact_history', 'competitor_intel'
  content jsonb NOT NULL, -- Flexible storage for different memory types
  context_tags text[] DEFAULT '{}', -- ['thailand', 'club_streaming', 'budget_5k-10k']
  relevance_score float DEFAULT 0.5, -- For retrieval ranking (0-1)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Optional expiry for time-sensitive intel
  source_urls text[] DEFAULT '{}', -- Track where info came from
  related_quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  related_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  related_opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL
);

-- Indexes for efficient memory retrieval
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(agent_name, memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_tags ON agent_memory USING gin(context_tags);
CREATE INDEX IF NOT EXISTS idx_agent_memory_relevance ON agent_memory(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_expires ON agent_memory(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- AGENT LEARNING FROM OUTCOMES
-- =====================================================

-- Agent learnings extracted from deal outcomes
CREATE TABLE IF NOT EXISTS agent_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  learning_type text NOT NULL, -- 'successful_approach', 'failed_approach', 'market_pattern', 'pricing_insight'
  context jsonb NOT NULL, -- What was the situation (deal_type, country, client_tier, etc.)
  outcome jsonb, -- What happened (won, value, time_to_close, key_factors)
  lesson text NOT NULL, -- What to remember for future
  confidence_score float DEFAULT 0.5, -- How reliable is this learning (0-1)
  usage_count integer DEFAULT 0, -- How many times this learning has been applied
  impact_score float DEFAULT 0, -- Did using this learning lead to wins?
  created_at timestamptz DEFAULT now(),
  verified boolean DEFAULT false, -- Human verified as accurate
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_learnings_agent ON agent_learnings(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_type ON agent_learnings(learning_type);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_confidence ON agent_learnings(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_verified ON agent_learnings(verified) WHERE verified = true;

-- =====================================================
-- DYNAMIC PROMPT EVOLUTION SYSTEM
-- =====================================================

-- Agent prompts that evolve over time
CREATE TABLE IF NOT EXISTS agent_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  prompt_version integer NOT NULL DEFAULT 1,
  base_prompt text NOT NULL, -- Core instructions (stable foundation)
  learned_context text, -- Accumulated knowledge (grows over time)
  system_context text, -- System-level instructions
  active boolean DEFAULT false, -- Only one active version per agent
  performance_score float, -- Track which versions perform best
  created_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  created_by text DEFAULT 'human', -- 'human' or 'self_improvement'
  change_reason text, -- Why this version was created

  UNIQUE(agent_name, prompt_version)
);

CREATE INDEX IF NOT EXISTS idx_agent_prompts_active ON agent_prompts(agent_name, active) WHERE active = true;

-- =====================================================
-- KNOWLEDGE FRAGMENTS (Human-Verified Intelligence)
-- =====================================================

-- Discrete pieces of knowledge that shape agent behavior
CREATE TABLE IF NOT EXISTS knowledge_fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_type text NOT NULL, -- 'market_insight', 'pricing_strategy', 'client_preference', 'competitor_intel', 'process_tip'
  title text, -- Short summary
  content text NOT NULL, -- The actual knowledge
  source text NOT NULL, -- 'human_input', 'won_deal_analysis', 'lost_deal_analysis', 'research', 'competitor_tracking'
  confidence float DEFAULT 0.5, -- How confident we are (0-1)
  applied_to_agents text[] DEFAULT '{}', -- Which agents should use this
  verified boolean DEFAULT false, -- Human verified as accurate
  needs_review boolean DEFAULT false, -- Flagged for human review
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  tags text[] DEFAULT '{}', -- ['thailand', 'streaming', 'pricing']
  impact_score float DEFAULT 0, -- How much this improved outcomes
  usage_count integer DEFAULT 0,
  region text, -- Specific region this applies to
  deal_type text, -- Specific deal type this applies to
  expires_at timestamptz -- Some knowledge has shelf life
);

CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_type ON knowledge_fragments(fragment_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_tags ON knowledge_fragments USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_verified ON knowledge_fragments(verified);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_agents ON knowledge_fragments USING gin(applied_to_agents);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_impact ON knowledge_fragments(impact_score DESC);

-- =====================================================
-- PROMPT PERFORMANCE TRACKING
-- =====================================================

-- Track how well each prompt version performs
CREATE TABLE IF NOT EXISTS prompt_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  prompt_version integer NOT NULL,
  task_type text NOT NULL, -- 'quote_generation', 'lead_enrichment', 'market_research', 'pricing_suggestion'
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  avg_human_edit_count float, -- How much you had to fix agent output
  avg_response_quality float, -- User rating if available
  sample_size integer DEFAULT 0,
  measured_at timestamptz DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_prompt_performance_agent ON prompt_performance(agent_name, prompt_version);

-- =====================================================
-- KNOWLEDGE RELATIONSHIPS (Graph Structure)
-- =====================================================

-- Connect related knowledge for deeper insights
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_a uuid REFERENCES knowledge_fragments(id) ON DELETE CASCADE,
  fragment_b uuid REFERENCES knowledge_fragments(id) ON DELETE CASCADE,
  relationship_type text NOT NULL, -- 'reinforces', 'contradicts', 'extends', 'depends_on', 'supersedes'
  strength float DEFAULT 0.5, -- How strong is this connection (0-1)
  created_at timestamptz DEFAULT now(),
  auto_detected boolean DEFAULT false, -- Was this found by AI or human?

  UNIQUE(fragment_a, fragment_b)
);

-- =====================================================
-- OKR TRACKING SYSTEM
-- =====================================================

-- Objectives and Key Results
CREATE TABLE IF NOT EXISTS okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  quarter text NOT NULL, -- '2025-Q1'
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  status text DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  owner_id text, -- User ID of owner
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_okrs_quarter ON okrs(quarter, year);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON okrs(status);

-- Key Results linked to OKRs
CREATE TABLE IF NOT EXISTS key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid REFERENCES okrs(id) ON DELETE CASCADE,
  description text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text NOT NULL, -- 'contracts', 'GBP', 'deals', 'percentage'
  calculation_method text DEFAULT 'manual', -- 'manual', 'quote_count', 'quote_value_sum', 'opportunity_count'
  filter_criteria jsonb, -- For auto-calculation: { status: 'won', deal_type: 'streaming' }
  progress_percentage float GENERATED ALWAYS AS (
    CASE WHEN target_value > 0 THEN LEAST(current_value / target_value * 100, 100) ELSE 0 END
  ) STORED,
  status text DEFAULT 'on_track', -- 'on_track', 'at_risk', 'behind', 'completed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_key_results_okr ON key_results(okr_id);

-- Link quotes to Key Results for tracking
CREATE TABLE IF NOT EXISTS quote_kr_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  key_result_id uuid REFERENCES key_results(id) ON DELETE CASCADE,
  contribution_value numeric DEFAULT 0, -- How much this quote contributes
  linked_at timestamptz DEFAULT now(),

  UNIQUE(quote_id, key_result_id)
);

-- Link opportunities to Key Results
CREATE TABLE IF NOT EXISTS opportunity_kr_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  key_result_id uuid REFERENCES key_results(id) ON DELETE CASCADE,
  potential_contribution numeric DEFAULT 0,
  linked_at timestamptz DEFAULT now(),

  UNIQUE(opportunity_id, key_result_id)
);

-- =====================================================
-- AGENT TASK QUEUE
-- =====================================================

-- Queue for agent tasks (research, enrichment, etc.)
CREATE TABLE IF NOT EXISTS agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  task_type text NOT NULL, -- 'research', 'enrich_client', 'analyze_deal', 'generate_quote_suggestions'
  status text DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  priority integer DEFAULT 5, -- 1-10, higher = more urgent
  input_data jsonb NOT NULL, -- Task parameters
  output_data jsonb, -- Results
  error_message text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  triggered_by text, -- 'cron', 'user_action', 'quote_status_change'
  related_quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  related_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  related_opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_name, status);

-- =====================================================
-- DISABLE RLS FOR INITIAL DEVELOPMENT
-- =====================================================

ALTER TABLE agent_memory DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_fragments DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE okrs DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_kr_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_kr_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SEED INITIAL AGENT PROMPTS
-- =====================================================

-- Research Agent - Initial Prompt
INSERT INTO agent_prompts (agent_name, prompt_version, base_prompt, active, created_by, change_reason)
VALUES (
  'research',
  1,
  'You are the Research Agent for Tell Productions, a sports broadcasting and streaming company.

YOUR ROLE:
- Monitor sports broadcasting news across SEA, GCC, and Central Asia
- Identify opportunities for Tell Productions services
- Track competitor activities and market changes
- Flag time-sensitive opportunities

FOCUS AREAS:
- Football leagues seeking broadcast/streaming partners
- Sports federations with upcoming broadcast tenders
- Clubs looking for production or streaming services
- Events that need broadcast infrastructure

OUTPUT FORMAT:
For each finding, provide:
1. Opportunity title
2. Organization/Entity involved
3. Region and country
4. Opportunity type (streaming, production, consultancy)
5. Urgency score (1-10)
6. Estimated budget range if mentioned
7. Key contacts mentioned
8. Source URL
9. Recommended action

Remember: Focus on actionable intelligence that can lead to quotes.',
  true,
  'human',
  'Initial research agent prompt'
) ON CONFLICT (agent_name, prompt_version) DO NOTHING;

-- Strategy Agent - Initial Prompt
INSERT INTO agent_prompts (agent_name, prompt_version, base_prompt, active, created_by, change_reason)
VALUES (
  'strategy',
  1,
  'You are the Strategy Agent for Tell Productions.

YOUR ROLE:
- Analyze deal patterns and success factors
- Suggest optimal pricing strategies based on historical data
- Identify cross-sell and upsell opportunities
- Provide competitive positioning advice

WHEN ANALYZING A DEAL:
1. Compare to similar won deals (region, type, size)
2. Note what factors led to success/failure
3. Suggest pricing adjustments based on patterns
4. Flag any red flags or opportunities

PRICING GUIDANCE:
- Consider regional market rates
- Factor in competition level
- Account for relationship history
- Suggest value-adds that increase win probability

OUTPUT: Actionable recommendations with confidence levels.',
  true,
  'human',
  'Initial strategy agent prompt'
) ON CONFLICT (agent_name, prompt_version) DO NOTHING;

-- Lead Gen Agent - Initial Prompt
INSERT INTO agent_prompts (agent_name, prompt_version, base_prompt, active, created_by, change_reason)
VALUES (
  'leadgen',
  1,
  'You are the Lead Generation Agent for Tell Productions.

YOUR ROLE:
- Enrich client and contact information
- Track interaction history and preferences
- Suggest optimal contact timing and methods
- Identify decision makers and influencers

WHEN ENRICHING A CONTACT:
1. Find LinkedIn profiles and professional history
2. Identify reporting structure and decision authority
3. Note communication preferences (email, WhatsApp, calls)
4. Track timezone and best contact times
5. Document any personal rapport notes

INTERACTION TRACKING:
- Log all touchpoints
- Note response patterns
- Track engagement levels
- Suggest follow-up timing

OUTPUT: Enriched contact profiles with actionable insights.',
  true,
  'human',
  'Initial lead gen agent prompt'
) ON CONFLICT (agent_name, prompt_version) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Agent schema created successfully! Tables: agent_memory, agent_learnings, agent_prompts, knowledge_fragments, prompt_performance, knowledge_relationships, okrs, key_results, quote_kr_links, opportunity_kr_links, agent_tasks' as status;
