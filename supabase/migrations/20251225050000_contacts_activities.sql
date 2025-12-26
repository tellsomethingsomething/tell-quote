-- Contacts and Activities CRM Enhancement
-- Adds contact management and activity tracking

-- ============================================
-- CONTACTS TABLE
-- Individual people linked to clients
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Basic info
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,

  -- Professional info
  job_title TEXT,
  department TEXT,

  -- Role in buying process
  role TEXT CHECK (role IN ('decision_maker', 'influencer', 'champion', 'blocker', 'end_user', 'other')),

  -- Social/online presence
  linkedin_url TEXT,

  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Additional info
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',

  -- Avatar
  avatar_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ
);

-- Indexes for contacts
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_client_id ON contacts(client_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_is_primary ON contacts(is_primary) WHERE is_primary = true;
CREATE INDEX idx_contacts_role ON contacts(role);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);

-- RLS for contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ACTIVITIES TABLE
-- Calls, meetings, notes, tasks, emails logged
-- ============================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Linked entities (at least one should be set)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  quote_id UUID,  -- References quotes but quotes uses TEXT id

  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting', 'email', 'note', 'task', 'quote_sent', 'quote_viewed', 'quote_accepted', 'quote_rejected')),

  -- Content
  subject TEXT,
  description TEXT,

  -- For calls
  call_outcome TEXT CHECK (call_outcome IN ('connected', 'voicemail', 'no_answer', 'busy', 'wrong_number', NULL)),
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound', NULL)),

  -- For meetings
  meeting_type TEXT CHECK (meeting_type IN ('in_person', 'video', 'phone', NULL)),
  meeting_location TEXT,

  -- Duration (for calls and meetings)
  duration_minutes INTEGER,

  -- For tasks
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent', NULL)),

  -- Assigned to (for tasks)
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Email reference (if activity is email)
  email_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,

  -- Timestamps
  activity_date TIMESTAMPTZ DEFAULT NOW(),  -- When the activity occurred/is scheduled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activities
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_client_id ON activities(client_id);
CREATE INDEX idx_activities_opportunity_id ON activities(opportunity_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_date ON activities(activity_date DESC);
CREATE INDEX idx_activities_due_date ON activities(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_activities_is_completed ON activities(is_completed) WHERE activity_type = 'task';
CREATE INDEX idx_activities_assigned_to ON activities(assigned_to);

-- RLS for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ACTIVITY PARTICIPANTS (for meetings)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  response_status TEXT CHECK (response_status IN ('pending', 'accepted', 'declined', 'tentative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX idx_activity_participants_contact ON activity_participants(contact_id);

-- RLS for activity_participants
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their activities"
  ON activity_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_participants.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage participants of their activities"
  ON activity_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_participants.activity_id
      AND activities.user_id = auth.uid()
    )
  );

-- ============================================
-- CONTACT OPPORTUNITIES JUNCTION TABLE
-- Links contacts to opportunities they're involved in
-- ============================================

CREATE TABLE IF NOT EXISTS contact_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  role TEXT,  -- Their role in this specific opportunity
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, opportunity_id)
);

CREATE INDEX idx_contact_opportunities_contact ON contact_opportunities(contact_id);
CREATE INDEX idx_contact_opportunities_opportunity ON contact_opportunities(opportunity_id);

-- RLS for contact_opportunities
ALTER TABLE contact_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their contact-opportunity links"
  ON contact_opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_opportunities.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their contact-opportunity links"
  ON contact_opportunities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_opportunities.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update last_contacted_at on contact when activity is created
CREATE OR REPLACE FUNCTION update_contact_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL AND NEW.activity_type IN ('call', 'meeting', 'email') THEN
    UPDATE contacts
    SET last_contacted_at = NEW.activity_date,
        updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_contact_last_contacted
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_last_contacted();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Contact with activity counts
CREATE OR REPLACE VIEW contact_summary AS
SELECT
  c.*,
  cl.company as client_name,
  COUNT(DISTINCT a.id) as total_activities,
  COUNT(DISTINCT CASE WHEN a.activity_type = 'call' THEN a.id END) as call_count,
  COUNT(DISTINCT CASE WHEN a.activity_type = 'meeting' THEN a.id END) as meeting_count,
  COUNT(DISTINCT CASE WHEN a.activity_type = 'email' THEN a.id END) as email_count,
  COUNT(DISTINCT CASE WHEN a.activity_type = 'task' AND NOT a.is_completed THEN a.id END) as open_tasks,
  MAX(a.activity_date) as last_activity_date
FROM contacts c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN activities a ON a.contact_id = c.id
GROUP BY c.id, cl.company;

-- Upcoming tasks view
CREATE OR REPLACE VIEW upcoming_tasks AS
SELECT
  a.*,
  c.first_name as contact_first_name,
  c.last_name as contact_last_name,
  cl.company as client_name,
  o.title as opportunity_name
FROM activities a
LEFT JOIN contacts c ON a.contact_id = c.id
LEFT JOIN clients cl ON a.client_id = cl.id
LEFT JOIN opportunities o ON a.opportunity_id = o.id
WHERE a.activity_type = 'task'
  AND a.is_completed = false
  AND a.due_date IS NOT NULL
ORDER BY a.due_date ASC;

-- Recent activities view
CREATE OR REPLACE VIEW recent_activities AS
SELECT
  a.*,
  c.first_name as contact_first_name,
  c.last_name as contact_last_name,
  c.email as contact_email,
  cl.company as client_name,
  o.title as opportunity_name
FROM activities a
LEFT JOIN contacts c ON a.contact_id = c.id
LEFT JOIN clients cl ON a.client_id = cl.id
LEFT JOIN opportunities o ON a.opportunity_id = o.id
ORDER BY a.activity_date DESC;
