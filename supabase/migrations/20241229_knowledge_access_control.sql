-- Add access control columns to knowledge_fragments table
ALTER TABLE knowledge_fragments
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add index for organization filtering
CREATE INDEX IF NOT EXISTS knowledge_fragments_organization_id_idx ON knowledge_fragments(organization_id);
CREATE INDEX IF NOT EXISTS knowledge_fragments_is_public_idx ON knowledge_fragments(is_public) WHERE is_public = true;

-- Add access control columns to agent_learnings table
ALTER TABLE agent_learnings
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add index for organization filtering
CREATE INDEX IF NOT EXISTS agent_learnings_organization_id_idx ON agent_learnings(organization_id);

-- RLS policies for knowledge_fragments
ALTER TABLE knowledge_fragments ENABLE ROW LEVEL SECURITY;

-- Users can view their org's fragments OR public fragments
DROP POLICY IF EXISTS "Users can view knowledge fragments" ON knowledge_fragments;
CREATE POLICY "Users can view knowledge fragments"
    ON knowledge_fragments FOR SELECT
    USING (
        is_public = true
        OR organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can insert fragments for their org
DROP POLICY IF EXISTS "Users can insert knowledge fragments" ON knowledge_fragments;
CREATE POLICY "Users can insert knowledge fragments"
    ON knowledge_fragments FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can update their org's fragments
DROP POLICY IF EXISTS "Users can update knowledge fragments" ON knowledge_fragments;
CREATE POLICY "Users can update knowledge fragments"
    ON knowledge_fragments FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete their org's fragments
DROP POLICY IF EXISTS "Users can delete knowledge fragments" ON knowledge_fragments;
CREATE POLICY "Users can delete knowledge fragments"
    ON knowledge_fragments FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Similar policies for agent_learnings
ALTER TABLE agent_learnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view agent learnings" ON agent_learnings;
CREATE POLICY "Users can view agent learnings"
    ON agent_learnings FOR SELECT
    USING (
        is_public = true
        OR organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage agent learnings" ON agent_learnings;
CREATE POLICY "Users can manage agent learnings"
    ON agent_learnings FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON knowledge_fragments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_learnings TO authenticated;
