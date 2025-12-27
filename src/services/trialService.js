/**
 * Trial Service
 * Manages trial periods, expiration, and read-only mode
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Trial configuration
export const TRIAL_CONFIG = {
    durationHours: 48, // 48-hour trial
    durationDays: 2, // For display purposes
    gracePeriodDays: 0, // No grace period - auto-converts to paid
    warningHours: [24, 12, 6, 1], // Hours before expiration to show warnings
    requiresPaymentMethod: true, // Must capture billing during signup
    autoConvertToPaid: true, // Automatically start subscription after trial
};

// Trial statuses
export const TRIAL_STATUS = {
    ACTIVE: 'active',
    EXPIRING_SOON: 'expiring_soon',
    GRACE_PERIOD: 'grace_period',
    EXPIRED: 'expired',
    CONVERTED: 'converted',
};

/**
 * Get trial status for an organization
 */
export async function getTrialStatus(organizationId) {
    if (!isSupabaseConfigured()) {
        return {
            status: TRIAL_STATUS.ACTIVE,
            hoursRemaining: TRIAL_CONFIG.durationHours,
            trialEndsAt: null,
            isReadOnly: false,
        };
    }

    const { data: org, error } = await supabase
        .from('organizations')
        .select('trial_ends_at, subscription_status, subscription_tier, stripe_customer_id')
        .eq('id', organizationId)
        .single();

    if (error) {
        console.error('Error fetching trial status:', error);
        return null;
    }

    // If they have an active subscription, trial doesn't apply
    if (org.subscription_status === 'active' && org.subscription_tier !== 'free') {
        return {
            status: TRIAL_STATUS.CONVERTED,
            hoursRemaining: null,
            trialEndsAt: null,
            isReadOnly: false,
            hasPaymentMethod: !!org.stripe_customer_id,
        };
    }

    const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
    const now = new Date();

    if (!trialEndsAt) {
        // No trial set, assume active
        return {
            status: TRIAL_STATUS.ACTIVE,
            hoursRemaining: TRIAL_CONFIG.durationHours,
            trialEndsAt: null,
            isReadOnly: false,
            hasPaymentMethod: !!org.stripe_customer_id,
        };
    }

    const hoursRemaining = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60));
    const daysRemaining = Math.ceil(hoursRemaining / 24);

    // Check if still in active trial (more than 24 hours left)
    if (hoursRemaining > TRIAL_CONFIG.warningHours[0]) {
        return {
            status: TRIAL_STATUS.ACTIVE,
            hoursRemaining,
            daysRemaining,
            trialEndsAt,
            isReadOnly: false,
            hasPaymentMethod: !!org.stripe_customer_id,
        };
    }

    // Warning phase (less than 24 hours)
    if (hoursRemaining > 0) {
        let warningLevel = 'medium';
        if (hoursRemaining <= 1) warningLevel = 'critical';
        else if (hoursRemaining <= 6) warningLevel = 'high';

        return {
            status: TRIAL_STATUS.EXPIRING_SOON,
            hoursRemaining,
            daysRemaining,
            trialEndsAt,
            isReadOnly: false,
            warningLevel,
            hasPaymentMethod: !!org.stripe_customer_id,
        };
    }

    // Trial expired - if they have payment method, auto-convert will handle it
    // Otherwise, they need to add payment to continue
    return {
        status: TRIAL_STATUS.EXPIRED,
        hoursRemaining: 0,
        daysRemaining: 0,
        trialEndsAt,
        isReadOnly: !org.stripe_customer_id, // Read-only only if no payment method
        hasPaymentMethod: !!org.stripe_customer_id,
    };
}

/**
 * Check if organization is in read-only mode
 */
export async function isReadOnlyMode(organizationId) {
    const status = await getTrialStatus(organizationId);
    return status?.isReadOnly || false;
}

/**
 * Start trial for a new organization (48 hours)
 */
export async function startTrial(organizationId, stripeCustomerId = null) {
    if (!isSupabaseConfigured()) return null;

    const trialEndsAt = new Date();
    trialEndsAt.setHours(trialEndsAt.getHours() + TRIAL_CONFIG.durationHours);

    const updateData = {
        trial_ends_at: trialEndsAt.toISOString(),
        subscription_status: 'trialing',
    };

    // If Stripe customer was created during onboarding, save it
    if (stripeCustomerId) {
        updateData.stripe_customer_id = stripeCustomerId;
    }

    const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organizationId)
        .select()
        .single();

    if (error) {
        console.error('Error starting trial:', error);
        return null;
    }

    return data;
}

/**
 * Extend trial period (for special promotions, support cases)
 */
export async function extendTrial(organizationId, additionalDays) {
    if (!isSupabaseConfigured()) return null;

    const { data: org } = await supabase
        .from('organizations')
        .select('trial_ends_at')
        .eq('id', organizationId)
        .single();

    const currentEndDate = org?.trial_ends_at ? new Date(org.trial_ends_at) : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    const { data, error } = await supabase
        .from('organizations')
        .update({
            trial_ends_at: newEndDate.toISOString(),
        })
        .eq('id', organizationId)
        .select()
        .single();

    if (error) {
        console.error('Error extending trial:', error);
        return null;
    }

    return data;
}

/**
 * Get formatted trial message for display
 */
export function getTrialMessage(trialStatus) {
    if (!trialStatus) return null;

    switch (trialStatus.status) {
        case TRIAL_STATUS.ACTIVE:
            return {
                type: 'info',
                title: 'Trial Active',
                message: `${trialStatus.daysRemaining} days remaining in your trial`,
                showUpgrade: false,
            };

        case TRIAL_STATUS.EXPIRING_SOON:
            return {
                type: trialStatus.warningLevel === 'critical' ? 'error' : 'warning',
                title: 'Trial Ending Soon',
                message: trialStatus.daysRemaining === 1
                    ? 'Your trial ends tomorrow!'
                    : `Only ${trialStatus.daysRemaining} days left in your trial`,
                showUpgrade: true,
            };

        case TRIAL_STATUS.GRACE_PERIOD:
            return {
                type: 'error',
                title: 'Trial Expired',
                message: `Your trial has ended. Upgrade within ${trialStatus.graceDaysRemaining} days to keep all features.`,
                showUpgrade: true,
            };

        case TRIAL_STATUS.EXPIRED:
            return {
                type: 'error',
                title: 'Trial Expired',
                message: 'Your trial has expired. Upgrade to continue using all features.',
                showUpgrade: true,
                readOnly: true,
            };

        case TRIAL_STATUS.CONVERTED:
            return null;

        default:
            return null;
    }
}

/**
 * Check if a specific action is allowed based on trial status
 */
export function isActionAllowed(trialStatus, action) {
    // Always allow read actions
    const readOnlyActions = ['view', 'list', 'export', 'download'];
    if (readOnlyActions.includes(action)) return true;

    // If not expired, allow all actions
    if (trialStatus?.status !== TRIAL_STATUS.EXPIRED) return true;

    // In expired state, only allow read actions
    return false;
}

/**
 * Get blocked action message
 */
export function getBlockedActionMessage() {
    return {
        title: 'Action Not Allowed',
        message: 'Your trial has expired. Upgrade to a paid plan to create and edit content.',
        actionText: 'Upgrade Now',
    };
}

export default {
    TRIAL_CONFIG,
    TRIAL_STATUS,
    getTrialStatus,
    isReadOnlyMode,
    startTrial,
    extendTrial,
    getTrialMessage,
    isActionAllowed,
    getBlockedActionMessage,
};
