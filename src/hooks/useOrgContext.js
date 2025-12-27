/**
 * Organization Context Hook
 * Provides organization_id for all database operations
 */

import { useOrganizationStore } from '../store/organizationStore';

/**
 * Get current organization ID for database queries
 * @returns {string|null} Organization ID or null
 */
export function useOrgId() {
    return useOrganizationStore(state => state.organization?.id || null);
}

/**
 * Get organization context for database operations
 * Returns an object with organization_id that can be spread into records
 */
export function useOrgContext() {
    const organizationId = useOrganizationStore(state => state.organization?.id || null);

    return {
        organizationId,
        // Spread this into new records
        orgFields: organizationId ? { organization_id: organizationId } : {},
        // Check if org is loaded
        hasOrg: !!organizationId,
    };
}

/**
 * Get organization ID synchronously (for store actions)
 * @returns {string|null}
 */
export function getOrgId() {
    return useOrganizationStore.getState().organization?.id || null;
}

/**
 * Get org fields for new records (synchronous)
 * @returns {Object}
 */
export function getOrgFields() {
    const orgId = getOrgId();
    return orgId ? { organization_id: orgId } : {};
}

/**
 * Add organization_id to a query filter
 * @param {Object} filter - Existing filter object
 * @returns {Object} Filter with organization_id added
 */
export function withOrgFilter(filter = {}) {
    const orgId = getOrgId();
    if (!orgId) return filter;
    return { ...filter, organization_id: orgId };
}

export default {
    useOrgId,
    useOrgContext,
    getOrgId,
    getOrgFields,
    withOrgFilter,
};
