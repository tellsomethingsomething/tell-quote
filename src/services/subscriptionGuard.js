// Subscription Guard Service
// Enforces subscription requirements for app access

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PLANS } from './billingService';
import logger from '../utils/logger';

// Feature keys that can be gated
export const FEATURES = {
    CREATE_PROJECT: 'create_project',
    CREATE_QUOTE: 'create_quote',
    ADD_CREW: 'add_crew',
    ADD_EQUIPMENT: 'add_equipment',
    ADD_CLIENT: 'add_client',
    EXPORT_PDF: 'export_pdf',
    AI_FEATURES: 'ai_features',
    TEAM_MEMBERS: 'team_members',
    CUSTOM_BRANDING: 'custom_branding',
    CALL_SHEETS: 'call_sheets',
    EMAIL_SEQUENCES: 'email_sequences',
};

// Subscription statuses that allow full access
const ALLOWED_STATUSES = ['active', 'trialing'];

// Statuses that show warnings but allow limited access
const WARNING_STATUSES = ['past_due', 'incomplete'];

// Grace period after subscription expires (in hours)
const GRACE_PERIOD_HOURS = 24;

/**
 * Subscription access levels
 */
export const ACCESS_LEVELS = {
    FULL: 'full',           // Active subscription - full access
    WARNING: 'warning',     // Past due - show warning, limited access
    GRACE: 'grace',         // Grace period after expiration
    BLOCKED: 'blocked',     // No access - must resubscribe
    ONBOARDING: 'onboarding', // New user - needs to complete onboarding
};

/**
 * Check subscription status and determine access level
 * @param {string} organizationId - Organization ID
 * @returns {Promise<{access: string, subscription: object|null, message: string, daysRemaining: number|null}>}
 */
export async function checkSubscriptionAccess(organizationId) {
    if (!isSupabaseConfigured() || !organizationId) {
        // SECURITY: Only allow full access in development when Supabase isn't configured
        if (import.meta.env.DEV) {
            return {
                access: ACCESS_LEVELS.FULL,
                subscription: null,
                message: 'Development mode - Supabase not configured',
                daysRemaining: null,
            };
        }
        // In production, block access if configuration is missing
        return {
            access: ACCESS_LEVELS.BLOCKED,
            subscription: null,
            message: 'Configuration error. Please contact support.',
            daysRemaining: null,
        };
    }

    try {
        // Fetch organization and subscription data
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select(`
                id,
                subscription_status,
                subscription_tier,
                trial_ends_at,
                stripe_customer_id,
                created_at
            `)
            .eq('id', organizationId)
            .single();

        if (orgError || !org) {
            logger.error('Failed to fetch organization:', orgError);
            return {
                access: ACCESS_LEVELS.ONBOARDING,
                subscription: null,
                message: 'Organization not found',
                daysRemaining: null,
            };
        }

        // Fetch subscription details
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const status = subscription?.status || org.subscription_status;
        const now = new Date();

        // Check if in active trial
        if (status === 'trialing' || org.trial_ends_at) {
            const trialEnd = new Date(subscription?.trial_end || org.trial_ends_at);

            if (trialEnd > now) {
                const hoursRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60));
                const daysRemaining = Math.ceil(hoursRemaining / 24);

                return {
                    access: ACCESS_LEVELS.FULL,
                    subscription,
                    message: hoursRemaining <= 24
                        ? `Trial ends in ${hoursRemaining} hours`
                        : `Trial ends in ${daysRemaining} days`,
                    daysRemaining,
                    hoursRemaining,
                    trialEndsAt: trialEnd.toISOString(),
                    isTrial: true,
                };
            } else {
                // Trial expired - check if they have an active subscription
                if (subscription?.status !== 'active') {
                    return {
                        access: ACCESS_LEVELS.BLOCKED,
                        subscription,
                        message: 'Your trial has expired. Please subscribe to continue.',
                        daysRemaining: 0,
                        trialExpired: true,
                    };
                }
            }
        }

        // Active subscription
        if (ALLOWED_STATUSES.includes(status)) {
            const periodEnd = subscription?.current_period_end
                ? new Date(subscription.current_period_end)
                : null;

            let daysRemaining = null;
            if (periodEnd) {
                daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
            }

            // Check if cancellation is pending
            if (subscription?.cancel_at_period_end) {
                return {
                    access: ACCESS_LEVELS.FULL,
                    subscription,
                    message: `Your subscription will end on ${periodEnd?.toLocaleDateString()}`,
                    daysRemaining,
                    cancelAtPeriodEnd: true,
                };
            }

            return {
                access: ACCESS_LEVELS.FULL,
                subscription,
                message: null,
                daysRemaining,
            };
        }

        // Past due - show warning
        if (WARNING_STATUSES.includes(status)) {
            return {
                access: ACCESS_LEVELS.WARNING,
                subscription,
                message: 'Your payment is past due. Please update your payment method.',
                daysRemaining: null,
                requiresAction: true,
            };
        }

        // Canceled subscription - check grace period
        if (status === 'canceled' || status === 'expired') {
            const periodEnd = subscription?.current_period_end
                ? new Date(subscription.current_period_end)
                : null;

            if (periodEnd) {
                const graceEnd = new Date(periodEnd.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000);

                if (now < graceEnd) {
                    const hoursRemaining = Math.ceil((graceEnd - now) / (1000 * 60 * 60));
                    return {
                        access: ACCESS_LEVELS.GRACE,
                        subscription,
                        message: `Your subscription has ended. You have ${hoursRemaining} hours to resubscribe.`,
                        hoursRemaining,
                        graceEndsAt: graceEnd.toISOString(),
                    };
                }
            }

            return {
                access: ACCESS_LEVELS.BLOCKED,
                subscription,
                message: 'Your subscription has expired. Please resubscribe to continue.',
                daysRemaining: 0,
            };
        }

        // New organization without subscription - check if they need onboarding
        if (!subscription && !org.stripe_customer_id) {
            // Check if org was created recently (within 1 hour) - allow onboarding
            const createdAt = new Date(org.created_at);
            const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

            if (hoursSinceCreation < 1) {
                return {
                    access: ACCESS_LEVELS.ONBOARDING,
                    subscription: null,
                    message: 'Complete onboarding to continue',
                    daysRemaining: null,
                };
            }

            return {
                access: ACCESS_LEVELS.BLOCKED,
                subscription: null,
                message: 'Please subscribe to access the platform.',
                daysRemaining: null,
            };
        }

        // Default: block access if status is unknown
        return {
            access: ACCESS_LEVELS.BLOCKED,
            subscription,
            message: 'Unable to verify subscription. Please contact support.',
            daysRemaining: null,
        };

    } catch (error) {
        logger.error('Subscription check error:', error);
        // SECURITY: Fail closed - block access on error to prevent bypass attacks
        return {
            access: ACCESS_LEVELS.BLOCKED,
            subscription: null,
            message: 'Unable to verify subscription. Please try again later.',
            daysRemaining: null,
            error: error.message,
        };
    }
}

/**
 * Quick check if user has valid subscription (for route guards)
 * @param {string} organizationId
 * @returns {Promise<boolean>}
 */
export async function hasValidSubscription(organizationId) {
    const result = await checkSubscriptionAccess(organizationId);
    return [ACCESS_LEVELS.FULL, ACCESS_LEVELS.WARNING, ACCESS_LEVELS.GRACE, ACCESS_LEVELS.ONBOARDING].includes(result.access);
}

/**
 * Check if subscription is in trial
 * @param {string} organizationId
 * @returns {Promise<{inTrial: boolean, hoursRemaining: number|null}>}
 */
export async function checkTrialStatus(organizationId) {
    const result = await checkSubscriptionAccess(organizationId);
    return {
        inTrial: result.isTrial || false,
        hoursRemaining: result.hoursRemaining || null,
        trialEndsAt: result.trialEndsAt || null,
        trialExpired: result.trialExpired || false,
    };
}

/**
 * Get subscription details for display
 * @param {string} organizationId
 * @returns {Promise<object>}
 */
export async function getSubscriptionDetails(organizationId) {
    const result = await checkSubscriptionAccess(organizationId);

    return {
        status: result.subscription?.status || 'none',
        plan: result.subscription?.plan_id || 'free',
        access: result.access,
        message: result.message,
        daysRemaining: result.daysRemaining,
        hoursRemaining: result.hoursRemaining,
        isTrial: result.isTrial || false,
        trialExpired: result.trialExpired || false,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd || false,
        currentPeriodEnd: result.subscription?.current_period_end,
        requiresAction: result.requiresAction || false,
    };
}

/**
 * Get organization's current usage counts
 * @param {string} organizationId
 * @returns {Promise<{projects: number, crew: number, equipment: number, clients: number, teamMembers: number}>}
 */
export async function getUsage(organizationId) {
    if (!isSupabaseConfigured() || !organizationId) {
        return { projects: 0, crew: 0, equipment: 0, clients: 0, teamMembers: 1 };
    }

    try {
        const [projectsRes, crewRes, equipmentRes, clientsRes, membersRes] = await Promise.all([
            supabase
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId),
            supabase
                .from('crew')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId),
            supabase
                .from('equipment')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId),
            supabase
                .from('clients')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId),
            supabase
                .from('organization_members')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId),
        ]);

        return {
            projects: projectsRes.count || 0,
            crew: crewRes.count || 0,
            equipment: equipmentRes.count || 0,
            clients: clientsRes.count || 0,
            teamMembers: membersRes.count || 1,
        };
    } catch (error) {
        logger.error('Error fetching usage:', error);
        return { projects: 0, crew: 0, equipment: 0, clients: 0, teamMembers: 1 };
    }
}

/**
 * Get plan limits based on plan ID
 * @param {string} planId
 * @returns {object}
 */
export function getPlanLimits(planId) {
    const plan = PLANS[planId] || PLANS.free;
    return plan.limits;
}

/**
 * Check if a specific feature action is allowed
 * @param {string} feature - Feature key from FEATURES
 * @param {string} planId - Current plan ID
 * @param {object} usage - Current usage counts
 * @returns {boolean}
 */
export function canUseFeature(feature, planId, usage) {
    const limits = getPlanLimits(planId);

    switch (feature) {
        case FEATURES.CREATE_PROJECT:
            return limits.projects === -1 || usage.projects < limits.projects;

        case FEATURES.ADD_CREW:
            return limits.crewContacts === -1 || usage.crew < limits.crewContacts;

        case FEATURES.ADD_EQUIPMENT:
            return limits.equipmentItems === -1 || usage.equipment < limits.equipmentItems;

        case FEATURES.TEAM_MEMBERS:
            return limits.teamMembers === -1 || usage.teamMembers < limits.teamMembers;

        case FEATURES.AI_FEATURES:
            return limits.aiTokens > 0;

        case FEATURES.CUSTOM_BRANDING:
            return planId === 'team';

        case FEATURES.EMAIL_SEQUENCES:
            return planId === 'individual' || planId === 'team';

        case FEATURES.EXPORT_PDF:
        case FEATURES.CREATE_QUOTE:
        case FEATURES.CALL_SHEETS:
        case FEATURES.ADD_CLIENT:
            return true; // Always allowed, behavior may differ by plan

        default:
            return true;
    }
}

/**
 * Get remaining quota for a feature
 * @param {string} feature
 * @param {object} usage
 * @param {string} planId
 * @returns {number} Remaining count or Infinity for unlimited
 */
export function getRemainingQuota(feature, usage, planId) {
    const limits = getPlanLimits(planId);

    switch (feature) {
        case FEATURES.CREATE_PROJECT:
            return limits.projects === -1 ? Infinity : Math.max(0, limits.projects - usage.projects);

        case FEATURES.ADD_CREW:
            return limits.crewContacts === -1 ? Infinity : Math.max(0, limits.crewContacts - usage.crew);

        case FEATURES.ADD_EQUIPMENT:
            return limits.equipmentItems === -1 ? Infinity : Math.max(0, limits.equipmentItems - usage.equipment);

        case FEATURES.TEAM_MEMBERS:
            return limits.teamMembers === -1 ? Infinity : Math.max(0, limits.teamMembers - usage.teamMembers);

        default:
            return Infinity;
    }
}

/**
 * Get upgrade message for a blocked feature
 * @param {string} feature
 * @param {string} planId
 * @returns {string}
 */
export function getUpgradeMessage(feature, planId) {
    const messages = {
        [FEATURES.CREATE_PROJECT]: {
            free: "You've reached the 3 project limit on the Free plan. Upgrade to Individual for unlimited projects.",
            individual: "You have unlimited projects on your current plan.",
        },
        [FEATURES.ADD_CREW]: {
            free: "You've reached the 10 crew contact limit. Upgrade to Individual for 100 crew contacts.",
            individual: "You've reached the 100 crew contact limit. Upgrade to Team for unlimited contacts.",
        },
        [FEATURES.ADD_EQUIPMENT]: {
            free: "You've reached the 10 equipment item limit. Upgrade to Individual for 50 items.",
            individual: "You've reached the 50 equipment item limit. Upgrade to Team for unlimited items.",
        },
        [FEATURES.AI_FEATURES]: {
            free: "AI features are not available on the Free plan. Upgrade to Individual for 10,000 AI tokens/month.",
        },
        [FEATURES.TEAM_MEMBERS]: {
            free: "Team members require an Individual or Team plan.",
            individual: "You can only have 1 user on the Individual plan. Upgrade to Team for 3+ users.",
        },
        [FEATURES.CUSTOM_BRANDING]: {
            free: "Custom branding requires the Team plan.",
            individual: "Custom branding requires the Team plan.",
        },
    };

    return messages[feature]?.[planId] || "Upgrade your plan to access this feature.";
}

/**
 * Check if PDF should be watermarked
 * @param {string} planId
 * @returns {boolean}
 */
export function shouldWatermarkPDF(planId) {
    return planId === 'free' || !planId;
}

/**
 * Full subscription and usage check - returns everything needed for UI
 * @param {string} organizationId
 * @returns {Promise<object>}
 */
export async function checkSubscriptionWithUsage(organizationId) {
    const [subscriptionResult, usage] = await Promise.all([
        checkSubscriptionAccess(organizationId),
        getUsage(organizationId),
    ]);

    const planId = subscriptionResult.subscription?.plan || 'free';
    const limits = getPlanLimits(planId);

    // Check if approaching any limits (80%)
    const warnings = [];
    if (limits.projects !== -1 && usage.projects >= limits.projects * 0.8) {
        warnings.push({ feature: FEATURES.CREATE_PROJECT, usage: usage.projects, limit: limits.projects });
    }
    if (limits.crewContacts !== -1 && usage.crew >= limits.crewContacts * 0.8) {
        warnings.push({ feature: FEATURES.ADD_CREW, usage: usage.crew, limit: limits.crewContacts });
    }
    if (limits.equipmentItems !== -1 && usage.equipment >= limits.equipmentItems * 0.8) {
        warnings.push({ feature: FEATURES.ADD_EQUIPMENT, usage: usage.equipment, limit: limits.equipmentItems });
    }

    return {
        ...subscriptionResult,
        planId,
        limits,
        usage,
        warnings,
        canCreate: (feature) => canUseFeature(feature, planId, usage),
        getRemaining: (feature) => getRemainingQuota(feature, usage, planId),
        getUpgradeMessage: (feature) => getUpgradeMessage(feature, planId),
        shouldWatermark: shouldWatermarkPDF(planId),
    };
}

export default {
    ACCESS_LEVELS,
    FEATURES,
    checkSubscriptionAccess,
    hasValidSubscription,
    checkTrialStatus,
    getSubscriptionDetails,
    getUsage,
    getPlanLimits,
    canUseFeature,
    getRemainingQuota,
    getUpgradeMessage,
    shouldWatermarkPDF,
    checkSubscriptionWithUsage,
};
