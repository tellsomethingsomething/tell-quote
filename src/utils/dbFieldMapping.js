/**
 * Database Field Mapping Utilities
 *
 * Converts between frontend camelCase and database snake_case field names.
 * Use these functions when reading from or writing to Supabase to ensure
 * consistent field naming across the application.
 */

/**
 * Convert camelCase to snake_case
 * @param {string} str - The camelCase string
 * @returns {string} - The snake_case string
 */
export function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 * @param {string} str - The snake_case string
 * @returns {string} - The camelCase string
 */
export function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from camelCase to snake_case (for DB writes)
 * @param {object} obj - The object with camelCase keys
 * @param {string[]} [excludeKeys=[]] - Keys to exclude from conversion
 * @returns {object} - The object with snake_case keys
 */
export function toDbFormat(obj, excludeKeys = []) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => toDbFormat(item, excludeKeys));

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip excluded keys or keys that are already snake_case
        if (excludeKeys.includes(key) || key.includes('_')) {
            result[key] = value;
        } else {
            result[camelToSnake(key)] = value;
        }
    }
    return result;
}

/**
 * Convert object keys from snake_case to camelCase (for DB reads)
 * @param {object} obj - The object with snake_case keys
 * @param {string[]} [excludeKeys=[]] - Keys to exclude from conversion
 * @returns {object} - The object with camelCase keys
 */
export function fromDbFormat(obj, excludeKeys = []) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => fromDbFormat(item, excludeKeys));

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip excluded keys or keys that are already camelCase (no underscore)
        if (excludeKeys.includes(key) || !key.includes('_')) {
            result[key] = value;
        } else {
            result[snakeToCamel(key)] = value;
        }
    }
    return result;
}

// ============================================================
// QUOTE-SPECIFIC FIELD MAPPINGS
// ============================================================

/**
 * Field mapping for quote line items
 */
const LINE_ITEM_FIELD_MAP = {
    // camelCase -> snake_case
    rateCardItemId: 'rate_card_item_id',
    kitItemId: 'kit_item_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
};

const LINE_ITEM_FIELD_MAP_REVERSE = Object.fromEntries(
    Object.entries(LINE_ITEM_FIELD_MAP).map(([k, v]) => [v, k])
);

/**
 * Convert line item to database format
 * @param {object} item - The line item with camelCase keys
 * @returns {object} - The line item with snake_case keys
 */
export function lineItemToDb(item) {
    if (!item) return item;

    const result = { ...item };
    for (const [camel, snake] of Object.entries(LINE_ITEM_FIELD_MAP)) {
        if (camel in result) {
            result[snake] = result[camel];
            delete result[camel];
        }
    }
    return result;
}

/**
 * Convert line item from database format
 * @param {object} item - The line item with snake_case keys
 * @returns {object} - The line item with camelCase keys
 */
export function lineItemFromDb(item) {
    if (!item) return item;

    const result = { ...item };
    for (const [snake, camel] of Object.entries(LINE_ITEM_FIELD_MAP_REVERSE)) {
        if (snake in result) {
            result[camel] = result[snake];
            delete result[snake];
        }
    }
    return result;
}

// ============================================================
// QUOTE-SPECIFIC CONVERSIONS
// ============================================================

/**
 * Field mapping for quotes
 */
const QUOTE_FIELD_MAP = {
    quoteNumber: 'quote_number',
    quoteDate: 'quote_date',
    validityDays: 'validity_days',
    preparedBy: 'prepared_by',
    sectionOrder: 'section_order',
    sectionNames: 'section_names',
    statusHistory: 'status_history',
    nextFollowUpDate: 'next_follow_up_date',
    lostReason: 'lost_reason',
    lostReasonNotes: 'lost_reason_notes',
    internalNotes: 'internal_notes',
    isLocked: 'is_locked',
    lockedAt: 'locked_at',
    lockedBy: 'locked_by',
    lockedExchangeRates: 'locked_exchange_rates',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    organizationId: 'organization_id',
    userId: 'user_id',
};

/**
 * Convert quote to database format
 * @param {object} quote - The quote with camelCase keys
 * @returns {object} - The quote with snake_case keys for DB storage
 */
export function quoteToDb(quote) {
    if (!quote) return quote;

    const dbQuote = {
        quote_number: quote.quoteNumber,
        quote_date: quote.quoteDate,
        validity_days: quote.validityDays,
        status: quote.status || 'draft',
        currency: quote.currency,
        region: quote.region,
        prepared_by: quote.preparedBy,
        client: quote.client,
        project: {
            ...quote.project,
            // Store section order and names in project JSONB
            _sectionOrder: quote.sectionOrder,
            _sectionNames: quote.sectionNames,
        },
        sections: convertSectionsToDb(quote.sections),
        fees: quote.fees,
        proposal: quote.proposal,
        // Additional fields that may be stored
        status_history: quote.statusHistory,
        next_follow_up_date: quote.nextFollowUpDate,
        lost_reason: quote.lostReason,
        lost_reason_notes: quote.lostReasonNotes,
        internal_notes: quote.internalNotes,
        is_locked: quote.isLocked,
        locked_at: quote.lockedAt,
        locked_by: quote.lockedBy,
        locked_exchange_rates: quote.lockedExchangeRates,
    };

    // Only include non-null values
    return Object.fromEntries(
        Object.entries(dbQuote).filter(([_, v]) => v !== undefined)
    );
}

/**
 * Convert quote from database format
 * @param {object} dbQuote - The quote with snake_case keys from DB
 * @returns {object} - The quote with camelCase keys for frontend
 */
export function quoteFromDb(dbQuote) {
    if (!dbQuote) return dbQuote;

    return {
        id: dbQuote.id,
        quoteNumber: dbQuote.quote_number,
        quoteDate: dbQuote.quote_date,
        validityDays: dbQuote.validity_days,
        status: dbQuote.status,
        currency: dbQuote.currency,
        region: dbQuote.region,
        preparedBy: dbQuote.prepared_by,
        client: dbQuote.client,
        project: {
            ...dbQuote.project,
        },
        // Extract section order/names from project JSONB
        sectionOrder: dbQuote.project?._sectionOrder,
        sectionNames: dbQuote.project?._sectionNames || {},
        sections: convertSectionsFromDb(dbQuote.sections),
        fees: dbQuote.fees,
        proposal: dbQuote.proposal,
        statusHistory: dbQuote.status_history || [],
        nextFollowUpDate: dbQuote.next_follow_up_date,
        lostReason: dbQuote.lost_reason,
        lostReasonNotes: dbQuote.lost_reason_notes,
        internalNotes: dbQuote.internal_notes,
        isLocked: dbQuote.is_locked,
        lockedAt: dbQuote.locked_at,
        lockedBy: dbQuote.locked_by,
        lockedExchangeRates: dbQuote.locked_exchange_rates,
        createdAt: dbQuote.created_at,
        updatedAt: dbQuote.updated_at,
    };
}

/**
 * Convert sections object - line items need field conversion
 * @param {object} sections - Sections with line items
 * @returns {object} - Sections with converted line items
 */
function convertSectionsToDb(sections) {
    if (!sections) return sections;

    const result = {};
    for (const [sectionId, section] of Object.entries(sections)) {
        result[sectionId] = {
            ...section,
            subsections: {},
        };

        if (section.subsections) {
            for (const [subId, items] of Object.entries(section.subsections)) {
                result[sectionId].subsections[subId] = items.map(lineItemToDb);
            }
        }
    }
    return result;
}

/**
 * Convert sections from DB format
 * @param {object} sections - Sections with line items from DB
 * @returns {object} - Sections with converted line items
 */
function convertSectionsFromDb(sections) {
    if (!sections) return sections;

    const result = {};
    for (const [sectionId, section] of Object.entries(sections)) {
        result[sectionId] = {
            ...section,
            subsections: {},
        };

        if (section.subsections) {
            for (const [subId, items] of Object.entries(section.subsections)) {
                result[sectionId].subsections[subId] = items.map(lineItemFromDb);
            }
        }
    }
    return result;
}

// ============================================================
// CONTACT-SPECIFIC CONVERSIONS
// ============================================================

/**
 * Convert contact to database format
 */
export function contactToDb(contact) {
    if (!contact) return contact;

    return {
        id: contact.id,
        name: contact.name,
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        company: contact.company,
        company_id: contact.companyId,
        client_id: contact.clientId,
        role: contact.role,
        job_title: contact.jobTitle,
        department: contact.department,
        linkedin_url: contact.linkedinUrl,
        is_primary: contact.isPrimary,
        is_active: contact.isActive,
        source: contact.source,
        status: contact.status,
        tags: contact.tags,
        notes: contact.notes,
        last_contacted_at: contact.lastContactedAt,
        custom_fields: contact.customFields,
        avatar_url: contact.avatarUrl,
        metadata: contact.metadata,
        organization_id: contact.organizationId,
    };
}

/**
 * Convert contact from database format
 */
export function contactFromDb(dbContact) {
    if (!dbContact) return dbContact;

    return {
        id: dbContact.id,
        name: dbContact.name || `${dbContact.first_name || ''} ${dbContact.last_name || ''}`.trim(),
        firstName: dbContact.first_name,
        lastName: dbContact.last_name,
        email: dbContact.email,
        phone: dbContact.phone,
        mobile: dbContact.mobile,
        company: dbContact.company,
        companyId: dbContact.company_id,
        clientId: dbContact.client_id,
        role: dbContact.role,
        jobTitle: dbContact.job_title,
        department: dbContact.department,
        linkedinUrl: dbContact.linkedin_url,
        isPrimary: dbContact.is_primary,
        isActive: dbContact.is_active,
        source: dbContact.source,
        status: dbContact.status,
        tags: dbContact.tags || [],
        notes: dbContact.notes,
        lastContactedAt: dbContact.last_contacted_at,
        customFields: dbContact.custom_fields || {},
        avatarUrl: dbContact.avatar_url,
        metadata: dbContact.metadata || {},
        organizationId: dbContact.organization_id,
        createdAt: dbContact.created_at,
        updatedAt: dbContact.updated_at,
    };
}

// ============================================================
// INVOICE-SPECIFIC CONVERSIONS
// ============================================================

/**
 * Convert invoice to database format
 */
export function invoiceToDb(invoice) {
    if (!invoice) return invoice;

    return {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        quote_id: invoice.quoteId,
        client_id: invoice.clientId,
        project_id: invoice.projectId,
        status: invoice.status,
        subtotal: invoice.subtotal,
        tax_rate: invoice.taxRate,
        tax_amount: invoice.taxAmount,
        total: invoice.total,
        currency: invoice.currency,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        paid_date: invoice.paidDate,
        paid_amount: invoice.paidAmount,
        payments: invoice.payments,
        line_items: invoice.lineItems,
        notes: invoice.notes,
        client_name: invoice.clientName,
        client_email: invoice.clientEmail,
        client_address: invoice.clientAddress,
        quote_number: invoice.quoteNumber,
        locked_exchange_rates: invoice.lockedExchangeRates,
        organization_id: invoice.organizationId,
    };
}

/**
 * Convert invoice from database format
 */
export function invoiceFromDb(dbInvoice) {
    if (!dbInvoice) return dbInvoice;

    return {
        id: dbInvoice.id,
        invoiceNumber: dbInvoice.invoice_number,
        quoteId: dbInvoice.quote_id,
        clientId: dbInvoice.client_id,
        projectId: dbInvoice.project_id,
        status: dbInvoice.status,
        subtotal: dbInvoice.subtotal,
        taxRate: dbInvoice.tax_rate,
        taxAmount: dbInvoice.tax_amount,
        total: dbInvoice.total,
        currency: dbInvoice.currency,
        issueDate: dbInvoice.issue_date,
        dueDate: dbInvoice.due_date,
        paidDate: dbInvoice.paid_date,
        paidAmount: dbInvoice.paid_amount,
        payments: dbInvoice.payments || [],
        lineItems: dbInvoice.line_items || [],
        notes: dbInvoice.notes,
        clientName: dbInvoice.client_name,
        clientEmail: dbInvoice.client_email,
        clientAddress: dbInvoice.client_address,
        quoteNumber: dbInvoice.quote_number,
        lockedExchangeRates: dbInvoice.locked_exchange_rates,
        organizationId: dbInvoice.organization_id,
        createdAt: dbInvoice.created_at,
        updatedAt: dbInvoice.updated_at,
    };
}

export default {
    camelToSnake,
    snakeToCamel,
    toDbFormat,
    fromDbFormat,
    lineItemToDb,
    lineItemFromDb,
    quoteToDb,
    quoteFromDb,
    contactToDb,
    contactFromDb,
    invoiceToDb,
    invoiceFromDb,
};
