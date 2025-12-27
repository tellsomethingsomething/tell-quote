-- =====================================================
-- FIX CRITICAL RLS SECURITY GAPS
-- All tables must enforce organization-based access
-- =====================================================

-- =====================================================
-- PART 1: FIX CALL SHEET TABLES (10 tables)
-- =====================================================

-- Drop existing wide-open policies
DROP POLICY IF EXISTS "Allow all call_sheet_accommodation" ON call_sheet_accommodation;
DROP POLICY IF EXISTS "Allow all call_sheet_room_assignments" ON call_sheet_room_assignments;
DROP POLICY IF EXISTS "Allow all call_sheet_flights" ON call_sheet_flights;
DROP POLICY IF EXISTS "Allow all call_sheet_transfers" ON call_sheet_transfers;
DROP POLICY IF EXISTS "Allow all call_sheet_vehicles" ON call_sheet_vehicles;
DROP POLICY IF EXISTS "Allow all call_sheet_technical" ON call_sheet_technical;
DROP POLICY IF EXISTS "Allow all call_sheet_vendors" ON call_sheet_vendors;
DROP POLICY IF EXISTS "Allow all call_sheet_emergency_contacts" ON call_sheet_emergency_contacts;
DROP POLICY IF EXISTS "Allow all call_sheet_catering" ON call_sheet_catering;
DROP POLICY IF EXISTS "Allow all call_sheet_weather" ON call_sheet_weather;

-- Create organization-based policies for call sheets
-- Note: Call sheet tables reference call_sheets which has organization_id

-- call_sheet_accommodation
CREATE POLICY "call_sheet_accommodation_org_access" ON call_sheet_accommodation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_accommodation.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_accommodation.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_room_assignments
CREATE POLICY "call_sheet_room_assignments_org_access" ON call_sheet_room_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheet_accommodation csa
            JOIN call_sheets cs ON csa.call_sheet_id = cs.id
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE csa.id = call_sheet_room_assignments.accommodation_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheet_accommodation csa
            JOIN call_sheets cs ON csa.call_sheet_id = cs.id
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE csa.id = call_sheet_room_assignments.accommodation_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_flights
CREATE POLICY "call_sheet_flights_org_access" ON call_sheet_flights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_flights.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_flights.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_transfers
CREATE POLICY "call_sheet_transfers_org_access" ON call_sheet_transfers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_transfers.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_transfers.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_vehicles
CREATE POLICY "call_sheet_vehicles_org_access" ON call_sheet_vehicles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_vehicles.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_vehicles.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_technical
CREATE POLICY "call_sheet_technical_org_access" ON call_sheet_technical
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_technical.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_technical.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_vendors
CREATE POLICY "call_sheet_vendors_org_access" ON call_sheet_vendors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_vendors.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_vendors.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_emergency_contacts
CREATE POLICY "call_sheet_emergency_contacts_org_access" ON call_sheet_emergency_contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_emergency_contacts.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_emergency_contacts.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_catering
CREATE POLICY "call_sheet_catering_org_access" ON call_sheet_catering
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_catering.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_catering.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- call_sheet_weather
CREATE POLICY "call_sheet_weather_org_access" ON call_sheet_weather
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_weather.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_sheets cs
            JOIN organization_members om ON cs.organization_id = om.organization_id
            WHERE cs.id = call_sheet_weather.call_sheet_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- =====================================================
-- PART 2: FIX EMAIL INTEGRATION TABLES (7 tables)
-- =====================================================

-- Drop existing wide-open policies
DROP POLICY IF EXISTS "Allow all google_connections" ON google_connections;
DROP POLICY IF EXISTS "Allow all email_threads" ON email_threads;
DROP POLICY IF EXISTS "Allow all email_messages" ON email_messages;
DROP POLICY IF EXISTS "Allow all email_attachments" ON email_attachments;
DROP POLICY IF EXISTS "Allow all email_drafts" ON email_drafts;
DROP POLICY IF EXISTS "Allow all email_entity_links" ON email_entity_links;
DROP POLICY IF EXISTS "Allow all email_sync_queue" ON email_sync_queue;

-- google_connections - user can only access their own connections
CREATE POLICY "google_connections_user_access" ON google_connections
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- email_threads - organization based access
CREATE POLICY "email_threads_org_access" ON email_threads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = email_threads.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = email_threads.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- email_messages - through email_threads
CREATE POLICY "email_messages_org_access" ON email_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM email_threads et
            JOIN organization_members om ON et.organization_id = om.organization_id
            WHERE et.id = email_messages.thread_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM email_threads et
            JOIN organization_members om ON et.organization_id = om.organization_id
            WHERE et.id = email_messages.thread_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- email_attachments - through email_messages
CREATE POLICY "email_attachments_org_access" ON email_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM email_messages em
            JOIN email_threads et ON em.thread_id = et.id
            JOIN organization_members om ON et.organization_id = om.organization_id
            WHERE em.id = email_attachments.message_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM email_messages em
            JOIN email_threads et ON em.thread_id = et.id
            JOIN organization_members om ON et.organization_id = om.organization_id
            WHERE em.id = email_attachments.message_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- email_drafts - user can only access their own drafts
CREATE POLICY "email_drafts_user_access" ON email_drafts
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- email_entity_links - organization based
CREATE POLICY "email_entity_links_org_access" ON email_entity_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM email_threads et
            JOIN organization_members om ON et.organization_id = om.organization_id
            WHERE et.id = email_entity_links.thread_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM email_threads et
            JOIN organization_members om ON et.organization_id = om.organization_id
            WHERE et.id = email_entity_links.thread_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- email_sync_queue - user can only access their own sync queue
CREATE POLICY "email_sync_queue_user_access" ON email_sync_queue
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PART 3: FIX MICROSOFT CONNECTIONS
-- =====================================================

DROP POLICY IF EXISTS "Allow all microsoft_connections" ON microsoft_connections;

CREATE POLICY "microsoft_connections_user_access" ON microsoft_connections
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PART 4: FIX PURCHASE ORDERS & CONTRACTS
-- =====================================================

DROP POLICY IF EXISTS "Allow all purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow all contracts" ON contracts;

-- purchase_orders - organization based
CREATE POLICY "purchase_orders_org_access" ON purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = purchase_orders.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = purchase_orders.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- contracts - organization based
CREATE POLICY "contracts_org_access" ON contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = contracts.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = contracts.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- =====================================================
-- PART 5: FIX QUOTE TEMPLATES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own quote templates" ON quote_templates;
DROP POLICY IF EXISTS "Users can create quote templates" ON quote_templates;
DROP POLICY IF EXISTS "Users can update their own quote templates" ON quote_templates;
DROP POLICY IF EXISTS "Users can delete their own quote templates" ON quote_templates;

-- quote_templates - organization based
CREATE POLICY "quote_templates_org_access" ON quote_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = quote_templates.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = quote_templates.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- =====================================================
-- PART 6: ADD ORGANIZATION_ID COLUMNS WHERE MISSING
-- =====================================================

-- Add organization_id to tables that are missing it (if not exists)
DO $$
BEGIN
    -- purchase_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'purchase_orders' AND column_name = 'organization_id') THEN
        ALTER TABLE purchase_orders ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_purchase_orders_org ON purchase_orders(organization_id);
    END IF;

    -- contracts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'contracts' AND column_name = 'organization_id') THEN
        ALTER TABLE contracts ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_contracts_org ON contracts(organization_id);
    END IF;

    -- quote_templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quote_templates' AND column_name = 'organization_id') THEN
        ALTER TABLE quote_templates ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_quote_templates_org ON quote_templates(organization_id);
    END IF;

    -- email_threads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'email_threads' AND column_name = 'organization_id') THEN
        ALTER TABLE email_threads ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_email_threads_org ON email_threads(organization_id);
    END IF;
END $$;

-- =====================================================
-- PART 7: ADD STATUS COLUMN TO ORGANIZATION_MEMBERS
-- =====================================================

-- Add status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'organization_members' AND column_name = 'status') THEN
        ALTER TABLE organization_members
            ADD COLUMN status TEXT DEFAULT 'active'
            CHECK (status IN ('active', 'suspended', 'pending'));
        CREATE INDEX idx_org_members_status ON organization_members(status);
    END IF;
END $$;

-- =====================================================
-- PART 8: UPDATE CORE RLS POLICIES TO CHECK USER STATUS
-- =====================================================

-- Update quotes policy to check member status
DROP POLICY IF EXISTS "Users can view quotes in their org" ON quotes;
CREATE POLICY "Users can view quotes in their org" ON quotes
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can manage quotes in their org" ON quotes;
CREATE POLICY "Users can manage quotes in their org" ON quotes
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin', 'member')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin', 'member')
        )
    );

-- Update clients policy to check member status
DROP POLICY IF EXISTS "Users can view clients in their org" ON clients;
CREATE POLICY "Users can view clients in their org" ON clients
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can manage clients in their org" ON clients;
CREATE POLICY "Users can manage clients in their org" ON clients
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin', 'member')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin', 'member')
        )
    );

-- Update rate_cards policy to check member status
DROP POLICY IF EXISTS "Users can view rate_cards in their org" ON rate_cards;
CREATE POLICY "Users can view rate_cards in their org" ON rate_cards
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can manage rate_cards in their org" ON rate_cards;
CREATE POLICY "Users can manage rate_cards in their org" ON rate_cards
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin', 'member')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin', 'member')
        )
    );

-- Update settings policy to check member status
DROP POLICY IF EXISTS "Users can view settings in their org" ON settings;
CREATE POLICY "Users can view settings in their org" ON settings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
            AND status = 'active'
            AND role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- VERIFICATION QUERY (run after migration)
-- =====================================================
-- SELECT tablename, policyname, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND (qual LIKE '%true%' OR with_check LIKE '%true%');
