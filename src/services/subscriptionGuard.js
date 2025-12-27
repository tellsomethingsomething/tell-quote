// Subscription Guard Service
// Enforces subscription requirements for app access

import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
        // If Supabase isn't configured, allow access (local dev)
        return {
            access: ACCESS_LEVELS.FULL,
            subscription: null,
            message: null,
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
            console.error('Failed to fetch organization:', orgError);
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
        console.error('Subscription check error:', error);
        // On error, allow access but log it (fail open for better UX)
        return {
            access: ACCESS_LEVELS.FULL,
            subscription: null,
            message: null,
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
