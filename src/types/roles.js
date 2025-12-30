/**
 * Role Definitions and Hierarchy for ProductionOS
 *
 * Role Priority (highest to lowest):
 * 1. Organization Role (from organization_members table)
 * 2. Profile Role (from user_profiles table) - legacy/fallback
 *
 * The organization role takes precedence when determining access.
 * Profile role is used for backward compatibility and when no org exists.
 */

/**
 * Organization roles - role within the organization
 */
export const ORG_ROLES = {
    owner: {
        level: 100,
        label: 'Owner',
        description: 'Full access, can transfer ownership and delete organization',
        permissions: ['*'], // All permissions
    },
    admin: {
        level: 80,
        label: 'Admin',
        description: 'Full access, can manage members and settings',
        permissions: ['manage_members', 'manage_settings', 'manage_billing', 'all_content'],
    },
    member: {
        level: 50,
        label: 'Member',
        description: 'Can create and edit own content',
        permissions: ['create_content', 'edit_own_content', 'view_all'],
    },
    viewer: {
        level: 20,
        label: 'Viewer',
        description: 'Read-only access',
        permissions: ['view_all'],
    },
};

/**
 * Profile roles - legacy roles stored in user_profiles
 * Maintained for backward compatibility
 */
export const PROFILE_ROLES = {
    admin: {
        level: 80,
        label: 'Admin',
        mapsToOrgRole: 'admin',
    },
    user: {
        level: 50,
        label: 'User',
        mapsToOrgRole: 'member',
    },
    viewer: {
        level: 20,
        label: 'Viewer',
        mapsToOrgRole: 'viewer',
    },
};

/**
 * Permission definitions for feature access
 */
export const PERMISSIONS = {
    // Organization management
    manage_members: 'manage_members',
    manage_settings: 'manage_settings',
    manage_billing: 'manage_billing',

    // Content permissions
    create_content: 'create_content',
    edit_own_content: 'edit_own_content',
    edit_all_content: 'edit_all_content',
    delete_content: 'delete_content',
    view_all: 'view_all',

    // Feature-specific
    access_api: 'access_api',
    export_data: 'export_data',
    bulk_operations: 'bulk_operations',
};

/**
 * Get the effective role level for a user
 * Prioritizes organization role over profile role
 *
 * @param {string|null} orgRole - Role from organization_members
 * @param {string|null} profileRole - Role from user_profiles
 * @returns {number} Role level (higher = more permissions)
 */
export function getEffectiveRoleLevel(orgRole, profileRole) {
    // Organization role takes precedence
    if (orgRole && ORG_ROLES[orgRole]) {
        return ORG_ROLES[orgRole].level;
    }

    // Fall back to profile role
    if (profileRole && PROFILE_ROLES[profileRole]) {
        return PROFILE_ROLES[profileRole].level;
    }

    // Default to viewer level
    return ORG_ROLES.viewer.level;
}

/**
 * Check if a role has admin-level access
 *
 * @param {string|null} orgRole - Role from organization_members
 * @param {string|null} profileRole - Role from user_profiles
 * @returns {boolean}
 */
export function isAdminRole(orgRole, profileRole) {
    const level = getEffectiveRoleLevel(orgRole, profileRole);
    return level >= ORG_ROLES.admin.level;
}

/**
 * Check if a role is owner
 *
 * @param {string|null} orgRole - Role from organization_members
 * @returns {boolean}
 */
export function isOwnerRole(orgRole) {
    return orgRole === 'owner';
}

/**
 * Check if a role can manage members
 *
 * @param {string|null} orgRole - Role from organization_members
 * @param {string|null} profileRole - Role from user_profiles
 * @returns {boolean}
 */
export function canManageMembers(orgRole, profileRole) {
    const level = getEffectiveRoleLevel(orgRole, profileRole);
    return level >= ORG_ROLES.admin.level;
}

/**
 * Check if a role has a specific permission
 *
 * @param {string} permission - Permission to check
 * @param {string|null} orgRole - Role from organization_members
 * @param {string|null} profileRole - Role from user_profiles
 * @returns {boolean}
 */
export function hasPermission(permission, orgRole, profileRole) {
    // Check org role first
    if (orgRole && ORG_ROLES[orgRole]) {
        const role = ORG_ROLES[orgRole];
        return role.permissions.includes('*') || role.permissions.includes(permission);
    }

    // Fall back to profile role mapping
    if (profileRole && PROFILE_ROLES[profileRole]) {
        const mappedOrgRole = PROFILE_ROLES[profileRole].mapsToOrgRole;
        if (mappedOrgRole && ORG_ROLES[mappedOrgRole]) {
            const role = ORG_ROLES[mappedOrgRole];
            return role.permissions.includes('*') || role.permissions.includes(permission);
        }
    }

    // Default: no permission
    return false;
}

/**
 * Get role label for display
 *
 * @param {string|null} orgRole - Role from organization_members
 * @param {string|null} profileRole - Role from user_profiles
 * @returns {string}
 */
export function getRoleLabel(orgRole, profileRole) {
    if (orgRole && ORG_ROLES[orgRole]) {
        return ORG_ROLES[orgRole].label;
    }

    if (profileRole && PROFILE_ROLES[profileRole]) {
        return PROFILE_ROLES[profileRole].label;
    }

    return 'User';
}

/**
 * Compare two roles
 *
 * @param {string} roleA - First role
 * @param {string} roleB - Second role
 * @returns {number} Positive if roleA > roleB, negative if roleA < roleB, 0 if equal
 */
export function compareRoles(roleA, roleB) {
    const levelA = ORG_ROLES[roleA]?.level || 0;
    const levelB = ORG_ROLES[roleB]?.level || 0;
    return levelA - levelB;
}

export default {
    ORG_ROLES,
    PROFILE_ROLES,
    PERMISSIONS,
    getEffectiveRoleLevel,
    isAdminRole,
    isOwnerRole,
    canManageMembers,
    hasPermission,
    getRoleLabel,
    compareRoles,
};
