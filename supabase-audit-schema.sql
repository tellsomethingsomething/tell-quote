-- =====================================================
-- AUDIT LOG SYSTEM
-- Track all changes to critical entities by user
-- =====================================================

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who made the change
  user_id uuid, -- From auth.users
  user_email text,
  user_name text,

  -- What changed
  entity_type text NOT NULL, -- 'kit_item', 'client', 'quote', 'opportunity', etc.
  entity_id uuid NOT NULL,
  entity_name text, -- Human-readable identifier

  -- The change
  action text NOT NULL, -- 'create', 'update', 'delete', 'status_change'
  changes jsonb, -- { field: { old: value, new: value } }

  -- Context
  ip_address text,
  user_agent text,
  session_id text,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- View for easier querying
CREATE OR REPLACE VIEW audit_log_with_details AS
SELECT
  al.*,
  CASE
    WHEN al.entity_type = 'kit_item' THEN (SELECT name FROM kit_items WHERE id = al.entity_id)
    WHEN al.entity_type = 'client' THEN (SELECT company FROM clients WHERE id = al.entity_id)
    WHEN al.entity_type = 'quote' THEN (SELECT project_name FROM quotes WHERE id = al.entity_id)
    WHEN al.entity_type = 'opportunity' THEN (SELECT title FROM opportunities WHERE id = al.entity_id)
    ELSE al.entity_name
  END as current_entity_name
FROM audit_log al;

-- Function to log changes automatically
CREATE OR REPLACE FUNCTION log_entity_change()
RETURNS TRIGGER AS $$
DECLARE
  v_changes jsonb;
  v_user_id uuid;
  v_user_email text;
  v_entity_name text;
BEGIN
  -- Get current user from auth.uid() if available
  v_user_id := auth.uid();

  -- Get email from user_profiles
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM user_profiles WHERE auth_user_id = v_user_id;
  END IF;

  -- Build entity name
  IF TG_TABLE_NAME = 'kit_items' THEN
    v_entity_name := COALESCE(NEW.name, OLD.name);
  ELSIF TG_TABLE_NAME = 'clients' THEN
    v_entity_name := COALESCE(NEW.company, OLD.company);
  ELSIF TG_TABLE_NAME = 'quotes' THEN
    v_entity_name := COALESCE(NEW.project_name, OLD.project_name);
  ELSIF TG_TABLE_NAME = 'opportunities' THEN
    v_entity_name := COALESCE(NEW.title, OLD.title);
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, user_email, entity_type, entity_id, entity_name, action, changes)
    VALUES (v_user_id, v_user_email, TG_TABLE_NAME, NEW.id, v_entity_name, 'create', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Build changes object showing old and new values
    v_changes := jsonb_build_object();

    -- Compare each column (simplified - in production you'd iterate over columns)
    IF TG_TABLE_NAME = 'kit_items' THEN
      IF OLD.name IS DISTINCT FROM NEW.name THEN
        v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
      END IF;
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
      END IF;
      IF OLD.location IS DISTINCT FROM NEW.location THEN
        v_changes := v_changes || jsonb_build_object('location', jsonb_build_object('old', OLD.location, 'new', NEW.location));
      END IF;
      IF OLD.condition IS DISTINCT FROM NEW.condition THEN
        v_changes := v_changes || jsonb_build_object('condition', jsonb_build_object('old', OLD.condition, 'new', NEW.condition));
      END IF;
    END IF;

    IF TG_TABLE_NAME = 'clients' THEN
      IF OLD.company IS DISTINCT FROM NEW.company THEN
        v_changes := v_changes || jsonb_build_object('company', jsonb_build_object('old', OLD.company, 'new', NEW.company));
      END IF;
    END IF;

    INSERT INTO audit_log (user_id, user_email, entity_type, entity_id, entity_name, action, changes)
    VALUES (v_user_id, v_user_email, TG_TABLE_NAME, NEW.id, v_entity_name, 'update', v_changes);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, user_email, entity_type, entity_id, entity_name, action, changes)
    VALUES (v_user_id, v_user_email, TG_TABLE_NAME, OLD.id, v_entity_name, 'delete', to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for key tables
DROP TRIGGER IF EXISTS trg_audit_kit_items ON kit_items;
CREATE TRIGGER trg_audit_kit_items
AFTER INSERT OR UPDATE OR DELETE ON kit_items
FOR EACH ROW EXECUTE FUNCTION log_entity_change();

DROP TRIGGER IF EXISTS trg_audit_clients ON clients;
CREATE TRIGGER trg_audit_clients
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION log_entity_change();

DROP TRIGGER IF EXISTS trg_audit_quotes ON quotes;
CREATE TRIGGER trg_audit_quotes
AFTER INSERT OR UPDATE OR DELETE ON quotes
FOR EACH ROW EXECUTE FUNCTION log_entity_change();

DROP TRIGGER IF EXISTS trg_audit_opportunities ON opportunities;
CREATE TRIGGER trg_audit_opportunities
AFTER INSERT OR UPDATE OR DELETE ON opportunities
FOR EACH ROW EXECUTE FUNCTION log_entity_change();

-- =====================================================
-- FILE STORAGE FOR KIT IMAGES
-- =====================================================

-- Run these commands in the Supabase SQL Editor or Dashboard:
-- 1. First create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kit-images',
  'kit-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access
CREATE POLICY "Kit images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'kit-images');

-- 3. Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload kit images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kit-images' AND auth.role() = 'authenticated');

-- 4. Allow authenticated users to update
CREATE POLICY "Authenticated users can update kit images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kit-images' AND auth.role() = 'authenticated');

-- 5. Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete kit images"
ON storage.objects FOR DELETE
USING (bucket_id = 'kit-images' AND auth.role() = 'authenticated');

-- =====================================================
-- DISABLE RLS FOR DEVELOPMENT
-- =====================================================

ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Audit log schema created successfully! Triggers added for: kit_items, clients, quotes, opportunities' as status;
