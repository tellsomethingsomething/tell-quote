-- Task Boards Migration
-- Trello-style task board with lists, cards, labels, checklists, and comments

-- ============================================
-- TASK BOARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    background TEXT DEFAULT 'blue', -- Color theme: blue, green, orange, red, purple, pink, gray, dark
    is_template BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}', -- Custom board settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TASK LISTS TABLE (columns on the board)
-- ============================================
CREATE TABLE IF NOT EXISTS task_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_lists_board_id ON task_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_position ON task_lists(board_id, position);

-- ============================================
-- TASK LABELS TABLE (board-level labels)
-- ============================================
CREATE TABLE IF NOT EXISTS task_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
    name TEXT DEFAULT '',
    color TEXT NOT NULL DEFAULT 'blue', -- green, yellow, orange, red, purple, blue, sky, lime, pink, black
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_labels_board_id ON task_labels(board_id);

-- ============================================
-- TASK CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    priority TEXT DEFAULT 'none', -- urgent, high, medium, low, none
    due_date TIMESTAMPTZ,
    due_complete BOOLEAN DEFAULT false,
    cover_color TEXT, -- Hex color for card cover
    cover_image TEXT, -- URL for cover image
    is_archived BOOLEAN DEFAULT false,
    start_date TIMESTAMPTZ,
    -- Link to other entities
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_task_cards_board_id ON task_cards(board_id);
CREATE INDEX IF NOT EXISTS idx_task_cards_list_id ON task_cards(list_id);
CREATE INDEX IF NOT EXISTS idx_task_cards_position ON task_cards(list_id, position);
CREATE INDEX IF NOT EXISTS idx_task_cards_due_date ON task_cards(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_cards_priority ON task_cards(priority) WHERE priority != 'none';

-- ============================================
-- TASK CARD LABELS (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS task_card_labels (
    card_id UUID NOT NULL REFERENCES task_cards(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES task_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (card_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_task_card_labels_card_id ON task_card_labels(card_id);
CREATE INDEX IF NOT EXISTS idx_task_card_labels_label_id ON task_card_labels(label_id);

-- ============================================
-- TASK CARD ASSIGNEES (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS task_card_assignees (
    card_id UUID NOT NULL REFERENCES task_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (card_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_card_assignees_card_id ON task_card_assignees(card_id);
CREATE INDEX IF NOT EXISTS idx_task_card_assignees_user_id ON task_card_assignees(user_id);

-- ============================================
-- TASK CHECKLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES task_cards(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Checklist',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_checklists_card_id ON task_checklists(card_id);

-- ============================================
-- TASK CHECKLIST ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES task_checklists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_checklist_id ON task_checklist_items(checklist_id);

-- ============================================
-- TASK COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES task_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_card_id ON task_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(card_id, created_at DESC);

-- ============================================
-- TASK ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES task_cards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    is_cover BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_card_id ON task_attachments(card_id);

-- ============================================
-- TASK ACTIVITY LOG (optional - for activity feed)
-- ============================================
CREATE TABLE IF NOT EXISTS task_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
    card_id UUID REFERENCES task_cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create_card', 'move_card', 'add_label', 'complete_checklist', etc.
    data JSONB DEFAULT '{}', -- Action-specific data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_activity_board_id ON task_activity(board_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_card_id ON task_activity(card_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_created_at ON task_activity(board_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_card_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;

-- Policies for task_boards (all authenticated users can access)
CREATE POLICY "Users can view all boards" ON task_boards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert boards" ON task_boards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update boards" ON task_boards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete boards" ON task_boards FOR DELETE TO authenticated USING (true);

-- Policies for task_lists
CREATE POLICY "Users can view all lists" ON task_lists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert lists" ON task_lists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update lists" ON task_lists FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete lists" ON task_lists FOR DELETE TO authenticated USING (true);

-- Policies for task_labels
CREATE POLICY "Users can view all labels" ON task_labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert labels" ON task_labels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update labels" ON task_labels FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete labels" ON task_labels FOR DELETE TO authenticated USING (true);

-- Policies for task_cards
CREATE POLICY "Users can view all cards" ON task_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert cards" ON task_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update cards" ON task_cards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete cards" ON task_cards FOR DELETE TO authenticated USING (true);

-- Policies for task_card_labels
CREATE POLICY "Users can view all card labels" ON task_card_labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert card labels" ON task_card_labels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete card labels" ON task_card_labels FOR DELETE TO authenticated USING (true);

-- Policies for task_card_assignees
CREATE POLICY "Users can view all assignees" ON task_card_assignees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert assignees" ON task_card_assignees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete assignees" ON task_card_assignees FOR DELETE TO authenticated USING (true);

-- Policies for task_checklists
CREATE POLICY "Users can view all checklists" ON task_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert checklists" ON task_checklists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update checklists" ON task_checklists FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete checklists" ON task_checklists FOR DELETE TO authenticated USING (true);

-- Policies for task_checklist_items
CREATE POLICY "Users can view all checklist items" ON task_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert checklist items" ON task_checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update checklist items" ON task_checklist_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete checklist items" ON task_checklist_items FOR DELETE TO authenticated USING (true);

-- Policies for task_comments
CREATE POLICY "Users can view all comments" ON task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert comments" ON task_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON task_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON task_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Policies for task_attachments
CREATE POLICY "Users can view all attachments" ON task_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert attachments" ON task_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete attachments" ON task_attachments FOR DELETE TO authenticated USING (true);

-- Policies for task_activity
CREATE POLICY "Users can view all activity" ON task_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert activity" ON task_activity FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_boards_updated_at
    BEFORE UPDATE ON task_boards
    FOR EACH ROW
    EXECUTE FUNCTION update_task_updated_at();

CREATE TRIGGER trigger_task_cards_updated_at
    BEFORE UPDATE ON task_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_task_updated_at();

CREATE TRIGGER trigger_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_updated_at();
