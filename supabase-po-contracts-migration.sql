-- Purchase Orders and Contracts Migration
-- For ProductionOS - production management SaaS

-- ============================================================
-- PURCHASE ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Reference
    po_number text UNIQUE NOT NULL,

    -- Links
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    vendor_id uuid, -- Could reference a vendors table in future

    -- Vendor Info (denormalized for convenience)
    vendor_name text NOT NULL,
    vendor_email text,
    vendor_phone text,
    vendor_address text,

    -- Category
    category text DEFAULT 'other' CHECK (category IN (
        'equipment', 'crew', 'venue', 'transport',
        'catering', 'props', 'post', 'other'
    )),

    -- Status
    status text DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending', 'approved', 'sent', 'received', 'cancelled'
    )),

    -- Description
    description text,

    -- Line Items (JSONB array)
    line_items jsonb DEFAULT '[]',
    -- Format: [{description, quantity, unit, unitPrice, total, notes}]

    -- Financials
    subtotal numeric(12,2) DEFAULT 0,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0,
    currency text DEFAULT 'USD',

    -- Dates
    issue_date date,
    delivery_date date,

    -- Delivery
    delivery_location text,

    -- Terms
    payment_terms text DEFAULT 'Net 30',

    -- Notes
    notes text,
    internal_notes text,

    -- Attachments
    attachments jsonb DEFAULT '[]',

    -- Approval
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at timestamp with time zone,

    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- CONTRACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Reference
    contract_ref text UNIQUE NOT NULL,
    title text NOT NULL,

    -- Type
    contract_type text DEFAULT 'other' CHECK (contract_type IN (
        'crew', 'client', 'vendor', 'nda',
        'location', 'talent', 'licensing', 'other'
    )),

    -- Status
    status text DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_review', 'sent', 'signed',
        'active', 'completed', 'cancelled', 'expired'
    )),

    -- Links (one contract can be linked to multiple entity types)
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
    crew_id uuid REFERENCES crew(id) ON DELETE SET NULL,
    vendor_id uuid,

    -- Party Info (the other party in the contract)
    party_name text,
    party_email text,
    party_phone text,
    party_address text,
    party_company text,

    -- Dates
    start_date date,
    end_date date,
    signed_date date,
    expires_at timestamp with time zone,

    -- Financial
    value numeric(12,2) DEFAULT 0,
    currency text DEFAULT 'USD',
    payment_terms text,

    -- Content
    description text,
    terms text,
    special_clauses jsonb DEFAULT '[]',

    -- Documents
    document_url text,
    signed_document_url text,
    attachments jsonb DEFAULT '[]',

    -- Metadata
    tags jsonb DEFAULT '[]',
    notes text,
    internal_notes text,

    -- Audit
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);

CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_crew ON contracts(crew_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_expires ON contracts(expires_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policies (internal tool - allow all for authenticated)
CREATE POLICY "Allow all purchase_orders" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- UPDATE TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
