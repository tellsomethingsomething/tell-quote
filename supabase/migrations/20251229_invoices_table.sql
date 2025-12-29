-- ============================================================
-- INVOICES TABLE
-- For customer invoices (not Stripe billing invoices)
-- ============================================================

-- Create the invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Invoice identification
    invoice_number TEXT NOT NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    quote_number TEXT,

    -- Client information (denormalized for historical record)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT,
    client_email TEXT,
    client_address TEXT,

    -- Project reference
    project_id UUID,

    -- Financial details
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',

    -- Payment tracking
    paid_amount DECIMAL(12, 2) DEFAULT 0, -- Amount paid so far
    payments JSONB DEFAULT '[]'::jsonb, -- Array of payment records: {amount, date, method, reference, notes}

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),

    -- Dates
    issue_date DATE,
    due_date DATE,
    paid_date DATE, -- Fully paid date

    -- Content
    line_items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,

    -- Exchange rates locked at invoice creation (for multi-currency)
    locked_exchange_rates JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'invoices' AND column_name = 'organization_id') THEN
        ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add payment tracking columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'invoices' AND column_name = 'paid_amount') THEN
        ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'invoices' AND column_name = 'payments') THEN
        ALTER TABLE invoices ADD COLUMN payments JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Update status check constraint to include 'partial'
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
    CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies (organization-based access)
DROP POLICY IF EXISTS "org_invoices_select" ON invoices;
CREATE POLICY "org_invoices_select" ON invoices
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "org_invoices_insert" ON invoices;
CREATE POLICY "org_invoices_insert" ON invoices
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "org_invoices_update" ON invoices;
CREATE POLICY "org_invoices_update" ON invoices
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "org_invoices_delete" ON invoices;
CREATE POLICY "org_invoices_delete" ON invoices
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoices_updated_at();

-- ============================================================
-- INVOICE PAYMENTS VIEW
-- Flattened view of payments for reporting
-- ============================================================

CREATE OR REPLACE VIEW invoice_payments_summary AS
SELECT
    i.id AS invoice_id,
    i.invoice_number,
    i.organization_id,
    i.client_name,
    i.total,
    i.paid_amount,
    i.total - COALESCE(i.paid_amount, 0) AS balance_due,
    i.currency,
    i.status,
    i.due_date,
    jsonb_array_length(COALESCE(i.payments, '[]'::jsonb)) AS payment_count,
    CASE
        WHEN i.status = 'paid' THEN 'Fully Paid'
        WHEN i.paid_amount > 0 THEN 'Partial Payment'
        ELSE 'No Payment'
    END AS payment_status
FROM invoices i;
