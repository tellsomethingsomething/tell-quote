/**
 * Audit Logging Service
 * Tracks all user actions for compliance and debugging
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useOrganizationStore } from '../store/organizationStore';
import logger from '../utils/logger';

// Action types
export const AUDIT_ACTIONS = {
    // CRUD operations
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',

    // Document actions
    EXPORT: 'export',
    PRINT: 'print',
    SEND: 'send',
    CLONE: 'clone',

    // Status changes
    STATUS_CHANGE: 'status_change',
    APPROVE: 'approve',
    REJECT: 'reject',

    // User actions
    LOGIN: 'login',
    LOGOUT: 'logout',
    INVITE_SENT: 'invite_sent',
    INVITE_ACCEPTED: 'invite_accepted',
    MEMBER_ADDED: 'member_added',
    MEMBER_REMOVED: 'member_removed',
    ROLE_CHANGED: 'role_changed',

    // Settings
    SETTINGS_CHANGED: 'settings_changed',

    // Data management
    DATA_EXPORT: 'data_export',
    DATA_IMPORT: 'data_import',
};

// Entity types (tables/resources)
export const ENTITY_TYPES = {
    QUOTE: 'quote',
    CLIENT: 'client',
    OPPORTUNITY: 'opportunity',
    INVOICE: 'invoice',
    PURCHASE_ORDER: 'purchase_order',
    CONTRACT: 'contract',
    PROJECT: 'project',
    EXPENSE: 'expense',
    RATE_CARD: 'rate_card',
    CONTACT: 'contact',
    CREW: 'crew',
    CALL_SHEET: 'call_sheet',
    KIT_BOOKING: 'kit_booking',
    USER: 'user',
    ORGANIZATION: 'organization',
    SETTINGS: 'settings',
    INVITATION: 'invitation',
};

/**
 * Log an audit event
 * @param {Object} params - Audit event parameters
 * @param {string} params.action - Action type (from AUDIT_ACTIONS)
 * @param {string} params.entityType - Entity type (from ENTITY_TYPES)
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.entityName - Human-readable name
 * @param {Object} params.changes - Object describing changes
 * @param {Object} params.metadata - Additional metadata
 * @param {string} params.organizationId - Organization ID (optional, falls back to store)
 */
export async function logAuditEvent({
    action,
    entityType,
    entityId = null,
    entityName = null,
    changes = null,
    metadata = null,
    organizationId = null,
}) {
    if (!isSupabaseConfigured()) {
        logger.debug('[Audit]', action, entityType, entityId, entityName);
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        // Accept organizationId as parameter for decoupling, fall back to store for backward compatibility
        const orgId = organizationId || useOrganizationStore.getState().getOrganizationId();

        const auditLog = {
            organization_id: orgId,
            user_id: user?.id || null,
            user_email: user?.email || null,
            action,
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            changes: changes || {},
            metadata: metadata || {},
            // Browser info (for debugging)
            ip_address: null, // Would need server-side to get real IP
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert(auditLog);

        if (error) {
            logger.error('Failed to log audit event:', error);
        }
    } catch (e) {
        logger.error('Audit logging error:', e);
    }
}

/**
 * Compute changes between old and new values
 */
export function computeChanges(oldValue, newValue, fieldsToTrack = null) {
    if (!oldValue || !newValue) return {};

    const changes = {};
    const fields = fieldsToTrack || Object.keys(newValue);

    for (const field of fields) {
        const oldVal = oldValue[field];
        const newVal = newValue[field];

        // Skip if unchanged
        if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

        // Skip internal fields
        if (field.startsWith('_') || ['createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(field)) continue;

        changes[field] = {
            from: oldVal,
            to: newVal,
        };
    }

    return changes;
}

/**
 * Helper to log entity creation
 */
export function logCreate(entityType, entity, entityName = null) {
    return logAuditEvent({
        action: AUDIT_ACTIONS.CREATE,
        entityType,
        entityId: entity?.id,
        entityName: entityName || entity?.name || entity?.title || entity?.quote_number || entity?.invoice_number,
    });
}

/**
 * Helper to log entity update
 */
export function logUpdate(entityType, entityId, entityName, oldValue, newValue, fieldsToTrack = null) {
    const changes = computeChanges(oldValue, newValue, fieldsToTrack);

    // Only log if there are actual changes
    if (Object.keys(changes).length === 0) return Promise.resolve();

    return logAuditEvent({
        action: AUDIT_ACTIONS.UPDATE,
        entityType,
        entityId,
        entityName,
        changes,
    });
}

/**
 * Helper to log entity deletion
 */
export function logDelete(entityType, entityId, entityName) {
    return logAuditEvent({
        action: AUDIT_ACTIONS.DELETE,
        entityType,
        entityId,
        entityName,
    });
}

/**
 * Helper to log status changes
 */
export function logStatusChange(entityType, entityId, entityName, oldStatus, newStatus) {
    return logAuditEvent({
        action: AUDIT_ACTIONS.STATUS_CHANGE,
        entityType,
        entityId,
        entityName,
        changes: {
            status: { from: oldStatus, to: newStatus },
        },
    });
}

/**
 * Helper to log exports
 */
export function logExport(entityType, entityId, entityName, format = 'pdf') {
    return logAuditEvent({
        action: AUDIT_ACTIONS.EXPORT,
        entityType,
        entityId,
        entityName,
        metadata: { format },
    });
}

/**
 * Fetch audit logs with filters
 */
export async function fetchAuditLogs({
    organizationId = null,
    entityType = null,
    entityId = null,
    userId = null,
    action = null,
    startDate = null,
    endDate = null,
    limit = 100,
    offset = 0,
}) {
    if (!isSupabaseConfigured()) return { data: [], count: 0 };

    try {
        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' });

        // Apply filters
        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }
        if (entityType) {
            query = query.eq('entity_type', entityType);
        }
        if (entityId) {
            query = query.eq('entity_id', entityId);
        }
        if (userId) {
            query = query.eq('user_id', userId);
        }
        if (action) {
            query = query.eq('action', action);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        // Pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return { data: data || [], count: count || 0 };
    } catch (e) {
        logger.error('Failed to fetch audit logs:', e);
        return { data: [], count: 0 };
    }
}

/**
 * Get entity history (all changes to a specific entity)
 */
export async function getEntityHistory(entityType, entityId) {
    return fetchAuditLogs({
        entityType,
        entityId,
        limit: 500,
    });
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs) {
    const headers = [
        'Timestamp',
        'User',
        'Action',
        'Entity Type',
        'Entity Name',
        'Changes',
    ];

    const rows = logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_email || 'System',
        log.action,
        log.entity_type,
        log.entity_name || log.entity_id || '-',
        JSON.stringify(log.changes || {}),
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csv;
}

export default {
    logAuditEvent,
    logCreate,
    logUpdate,
    logDelete,
    logStatusChange,
    logExport,
    fetchAuditLogs,
    getEntityHistory,
    exportAuditLogsToCSV,
    AUDIT_ACTIONS,
    ENTITY_TYPES,
};
