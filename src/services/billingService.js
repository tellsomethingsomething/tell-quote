/**
 * Stripe Billing Service
 * Handles subscription management, checkout, and billing operations
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useOrganizationStore } from '../store/organizationStore';

// Stripe Plans Configuration
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'For individuals getting started',
        priceMonthly: 0,
        priceYearly: 0,
        stripePriceIdMonthly: null,
        stripePriceIdYearly: null,
        features: [
            'Up to 5 quotes per month',
            'Up to 3 clients',
            '1 team member',
            'Basic templates',
            'Email support',
        ],
        limits: {
            quotesPerMonth: 5,
            clients: 3,
            teamMembers: 1,
            storage: 100, // MB
        },
    },
    starter: {
        id: 'starter',
        name: 'Starter',
        description: 'For small production companies',
        priceMonthly: 29,
        priceYearly: 290,
        stripePriceIdMonthly: 'price_starter_monthly',
        stripePriceIdYearly: 'price_starter_yearly',
        features: [
            'Unlimited quotes',
            'Up to 50 clients',
            'Up to 5 team members',
            'Custom templates',
            'Invoice generation',
            'Priority email support',
        ],
        limits: {
            quotesPerMonth: -1, // unlimited
            clients: 50,
            teamMembers: 5,
            storage: 1000, // MB
        },
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        description: 'For growing production teams',
        priceMonthly: 79,
        priceYearly: 790,
        stripePriceIdMonthly: 'price_professional_monthly',
        stripePriceIdYearly: 'price_professional_yearly',
        features: [
            'Everything in Starter',
            'Unlimited clients',
            'Up to 20 team members',
            'Project management',
            'Crew & kit booking',
            'API access',
            'Phone support',
        ],
        limits: {
            quotesPerMonth: -1,
            clients: -1,
            teamMembers: 20,
            storage: 10000, // MB
        },
        popular: true,
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large production houses',
        priceMonthly: 199,
        priceYearly: 1990,
        stripePriceIdMonthly: 'price_enterprise_monthly',
        stripePriceIdYearly: 'price_enterprise_yearly',
        features: [
            'Everything in Professional',
            'Unlimited team members',
            'Multi-organization support',
            'Advanced analytics',
            'Custom integrations',
            'SLA guarantee',
            'Dedicated account manager',
        ],
        limits: {
            quotesPerMonth: -1,
            clients: -1,
            teamMembers: -1,
            storage: -1, // unlimited
        },
    },
};

/**
 * Create a Stripe checkout session for trial with billing capture
 * Sets up subscription but doesn't charge until trial ends (48 hours)
 */
export async function createTrialCheckoutSession(planId = 'starter', organizationId, userEmail) {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan');

    const priceId = plan.stripePriceIdMonthly;
    if (!priceId) {
        throw new Error('This plan does not support subscriptions');
    }

    // Call Supabase Edge Function to create Stripe checkout session with trial
    const { data, error } = await supabase.functions.invoke('create-trial-checkout', {
        body: {
            priceId,
            organizationId,
            customerEmail: userEmail,
            trialPeriodDays: 2, // 48-hour trial
            successUrl: `${window.location.origin}/?onboarding=complete`,
            cancelUrl: `${window.location.origin}/?onboarding=billing`,
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Create a Stripe setup intent for collecting payment method without immediate charge
 * Alternative to checkout session for embedded payment form
 */
export async function createSetupIntent(organizationId, userEmail) {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    // Call Supabase Edge Function to create Stripe setup intent
    const { data, error } = await supabase.functions.invoke('create-setup-intent', {
        body: {
            organizationId,
            customerEmail: userEmail,
        },
    });

    if (error) throw error;
    return data; // { clientSecret, customerId }
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(planId, billingCycle = 'monthly') {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = useOrganizationStore.getState().getOrganizationId();
    if (!organizationId) throw new Error('No organization selected');

    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan');

    const priceId = billingCycle === 'yearly'
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    if (!priceId) {
        throw new Error('This plan does not support paid subscriptions');
    }

    // Call Supabase Edge Function to create Stripe checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
            priceId,
            organizationId,
            successUrl: `${window.location.origin}/settings?tab=billing&success=true`,
            cancelUrl: `${window.location.origin}/settings?tab=billing&canceled=true`,
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Create a Stripe customer portal session for managing subscription
 */
export async function createPortalSession() {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = useOrganizationStore.getState().getOrganizationId();
    if (!organizationId) throw new Error('No organization selected');

    // Call Supabase Edge Function to create Stripe portal session
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
            organizationId,
            returnUrl: `${window.location.origin}/settings?tab=billing`,
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Get current subscription status for an organization
 */
export async function getSubscriptionStatus(organizationId) {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
    }

    return data;
}

/**
 * Get usage statistics for an organization
 */
export async function getUsageStats(organizationId) {
    if (!isSupabaseConfigured()) {
        return null;
    }

    // Get quote count for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: quotesThisMonth } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', startOfMonth.toISOString());

    // Get client count
    const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

    // Get team member count
    const { count: teamMemberCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

    return {
        quotesThisMonth: quotesThisMonth || 0,
        clientCount: clientCount || 0,
        teamMemberCount: teamMemberCount || 0,
    };
}

/**
 * Check if organization has exceeded plan limits
 */
export async function checkPlanLimits(organizationId, planId = 'free') {
    const plan = PLANS[planId];
    if (!plan) return { exceeded: false, warnings: [] };

    const usage = await getUsageStats(organizationId);
    if (!usage) return { exceeded: false, warnings: [] };

    const warnings = [];
    let exceeded = false;

    // Check quotes limit
    if (plan.limits.quotesPerMonth !== -1) {
        if (usage.quotesThisMonth >= plan.limits.quotesPerMonth) {
            exceeded = true;
            warnings.push(`You've reached your monthly quote limit (${plan.limits.quotesPerMonth})`);
        } else if (usage.quotesThisMonth >= plan.limits.quotesPerMonth * 0.8) {
            warnings.push(`You're approaching your monthly quote limit (${usage.quotesThisMonth}/${plan.limits.quotesPerMonth})`);
        }
    }

    // Check clients limit
    if (plan.limits.clients !== -1) {
        if (usage.clientCount >= plan.limits.clients) {
            exceeded = true;
            warnings.push(`You've reached your client limit (${plan.limits.clients})`);
        } else if (usage.clientCount >= plan.limits.clients * 0.8) {
            warnings.push(`You're approaching your client limit (${usage.clientCount}/${plan.limits.clients})`);
        }
    }

    // Check team members limit
    if (plan.limits.teamMembers !== -1) {
        if (usage.teamMemberCount >= plan.limits.teamMembers) {
            exceeded = true;
            warnings.push(`You've reached your team member limit (${plan.limits.teamMembers})`);
        }
    }

    return { exceeded, warnings, usage };
}

/**
 * Cancel subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} reason - Cancellation reason (optional)
 * @param {string} feedback - Additional feedback (optional)
 */
export async function cancelSubscription(subscriptionId, reason = null, feedback = null) {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call Supabase Edge Function to cancel Stripe subscription
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId, reason, feedback },
    });

    if (error) throw error;
    return data;
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId) {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call Supabase Edge Function to reactivate Stripe subscription
    const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
        body: { subscriptionId },
    });

    if (error) throw error;
    return data;
}

/**
 * Get invoice history for an organization
 */
export async function getInvoiceHistory(organizationId) {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const { data, error } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(24);

    if (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }

    return data || [];
}

/**
 * Format plan price for display
 */
export function formatPrice(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Get plan by ID
 */
export function getPlan(planId) {
    return PLANS[planId] || PLANS.free;
}

/**
 * Get all available plans
 */
export function getAllPlans() {
    return Object.values(PLANS);
}

export default {
    PLANS,
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    getUsageStats,
    checkPlanLimits,
    cancelSubscription,
    reactivateSubscription,
    getInvoiceHistory,
    formatPrice,
    getPlan,
    getAllPlans,
};
