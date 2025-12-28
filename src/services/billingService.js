/**
 * Stripe Billing Service
 * Handles subscription management, checkout, and billing operations
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useOrganizationStore } from '../store/organizationStore';

// Use test mode in development
const isTestMode = import.meta.env.DEV || import.meta.env.VITE_STRIPE_TEST_MODE === 'true';

// Stripe Products (Live Mode)
export const STRIPE_PRODUCTS = {
    individual: 'prod_TgOJZ4SQjfFaSH',
    team: 'prod_TgOJvRtalQa4WF',
    tokenPack5k: 'prod_TgOJC2A4LtwwXx',
    tokenPack25k: 'prod_TgOJMoTRYLdAW8',
    tokenPack100k: 'prod_TgOJx8k1JwniR9',
};

// Stripe Products (Test Mode)
export const STRIPE_PRODUCTS_TEST = {
    individual: 'prod_TgOxfFUv2amuIK',
    team: 'prod_TgOxdkKikv5qgx',
    tokenPack5k: 'prod_TgPMQNI85ggTaT',
    tokenPack25k: 'prod_TgPMvoxPkeCxXc',
    tokenPack100k: 'prod_TgPMdCe4rYpaYx',
};

// Stripe Price IDs by currency and billing cycle (Live Mode)
// Tier 1: Full price (US, UK, EU, AU, CA, JP, etc.)
const STRIPE_PRICES_LIVE = {
    individual: {
        USD: {
            monthly: 'price_1Sj1XBLE30d1czmdCbD6Kg9V',
            annual: 'price_1Sj1XCLE30d1czmdi2UKwktG',
        },
        GBP: {
            monthly: 'price_1Sj1XDLE30d1czmdWHrCT59f',
            annual: 'price_1Sj1XDLE30d1czmdGv9wtuLD',
        },
        EUR: {
            monthly: 'price_1Sj1XELE30d1czmdO2Vz955B',
            annual: 'price_1Sj1XFLE30d1czmdwwDRbACg',
        },
    },
    team: {
        USD: {
            monthly: 'price_1Sj1XYLE30d1czmdzldBwYTB',
            annual: 'price_1Sj1XYLE30d1czmdLUNjPxbg',
        },
        GBP: {
            monthly: 'price_1Sj1XZLE30d1czmd2oBHlWtC',
            annual: 'price_1Sj1XaLE30d1czmd5DsbtbFN',
        },
        EUR: {
            monthly: 'price_1Sj1XaLE30d1czmdIAxyupGE',
            annual: 'price_1Sj1XbLE30d1czmdkSIGXZCQ',
        },
    },
};

// Regional/PPP Pricing Tiers (Live Mode)
// Tier 2: $20/$40 (SG, AE, IL, KR, NZ, etc.)
const STRIPE_PRICES_TIER2 = {
    individual: {
        USD: { monthly: 'price_1SjNHrLE30d1czmdygjzgQnx', annual: 'price_1SjNHsLE30d1czmdt7CLsthn' },
    },
    team: {
        USD: { monthly: 'price_1SjNHsLE30d1czmdlucbT5dM', annual: 'price_1SjNHtLE30d1czmd2XpDrr9A' },
    },
};

// Tier 3: $12/$25 (MY, TH, MX, BR, PL, etc.)
const STRIPE_PRICES_TIER3 = {
    individual: {
        USD: { monthly: 'price_1SjNI7LE30d1czmdIH20zKQX', annual: 'price_1SjNI7LE30d1czmdVdUlflim' },
    },
    team: {
        USD: { monthly: 'price_1SjNI8LE30d1czmdyDAtpFGr', annual: 'price_1SjNI9LE30d1czmdCGR4PY2g' },
    },
};

// Tier 4: $8/$16 (IN, ID, PH, VN, ZA, etc.)
const STRIPE_PRICES_TIER4 = {
    individual: {
        USD: { monthly: 'price_1SjNIOLE30d1czmdgPMhfo4o', annual: 'price_1SjNIPLE30d1czmdEj0zT9Yc' },
    },
    team: {
        USD: { monthly: 'price_1SjNIQLE30d1czmdO25rUJdT', annual: 'price_1SjNIRLE30d1czmdZlEwEJPz' },
    },
};

// Tier 5: $6/$12 (PK, BD, NG, KE, EG, etc.)
const STRIPE_PRICES_TIER5 = {
    individual: {
        USD: { monthly: 'price_1SjNIgLE30d1czmdDrZE1lmT', annual: 'price_1SjNIhLE30d1czmdYwsZBuUF' },
    },
    team: {
        USD: { monthly: 'price_1SjNIiLE30d1czmdutSGH32M', annual: 'price_1SjNIjLE30d1czmdCFzkxKxm' },
    },
};

// Local Currency Prices (Live Mode)
const STRIPE_PRICES_LOCAL = {
    MYR: {
        individual: { monthly: 'price_1SjNIxLE30d1czmdcKoycTK1', annual: 'price_1SjNIyLE30d1czmdrebRMoH4' },
        team: { monthly: 'price_1SjNIzLE30d1czmdJRROuWyT', annual: 'price_1SjNJ0LE30d1czmdvFRXym7X' },
    },
    SGD: {
        individual: { monthly: 'price_1SjNJBLE30d1czmdq8v4Wr1h', annual: 'price_1SjNJBLE30d1czmdQM1TijWE' },
        team: { monthly: 'price_1SjNJCLE30d1czmdrLYsLdyL', annual: 'price_1SjNJDLE30d1czmdMchkOLWs' },
    },
    THB: {
        individual: { monthly: 'price_1SjNJTLE30d1czmdEgcglf1j', annual: 'price_1SjNJTLE30d1czmdey99KeIQ' },
        team: { monthly: 'price_1SjNJVLE30d1czmdhOHatiLI', annual: 'price_1SjNJVLE30d1czmdzPIjf6Kg' },
    },
    INR: {
        individual: { monthly: 'price_1SjNJWLE30d1czmdeNnougdH', annual: 'price_1SjNJXLE30d1czmd5tY7qpoQ' },
        team: { monthly: 'price_1SjNJYLE30d1czmdwLDQDwPk', annual: 'price_1SjNJZLE30d1czmdE9MZjJru' },
    },
    AUD: {
        individual: { monthly: 'price_1SjNJtLE30d1czmdNoD6M5kV', annual: 'price_1SjNJuLE30d1czmdUrR8uR8j' },
        team: { monthly: 'price_1SjNJvLE30d1czmdymGDP9F8', annual: 'price_1SjNJvLE30d1czmdnA2E091P' },
    },
    PHP: {
        individual: { monthly: 'price_1SjNJwLE30d1czmdZkPFhsA4', annual: 'price_1SjNJxLE30d1czmd6NADrl3B' },
        team: { monthly: 'price_1SjNJyLE30d1czmdsWjFnldX', annual: 'price_1SjNJyLE30d1czmdqi56eo4e' },
    },
    IDR: {
        individual: { monthly: 'price_1SjNK8LE30d1czmdyXLirLGO', annual: 'price_1SjNK9LE30d1czmd9wRWUFK4' },
        team: { monthly: 'price_1SjNKALE30d1czmdT6a49lls', annual: 'price_1SjNKBLE30d1czmdZA0FFcUg' },
    },
};

// Map pricing tier names to price objects
export const STRIPE_PRICES_BY_TIER = {
    tier1: STRIPE_PRICES_LIVE,
    tier2: STRIPE_PRICES_TIER2,
    tier3: STRIPE_PRICES_TIER3,
    tier4: STRIPE_PRICES_TIER4,
    tier5: STRIPE_PRICES_TIER5,
};

// Export local currency prices
export { STRIPE_PRICES_LOCAL };

// Stripe Price IDs (Test Mode)
const STRIPE_PRICES_TEST = {
    individual: {
        USD: {
            monthly: 'price_1Sj2Y4LE30d1czmdNFSZ2TOH',
            annual: 'price_1Sj2Y5LE30d1czmdTb3GqNrr',
        },
        GBP: {
            monthly: 'price_1Sj2Y6LE30d1czmdZ7U9fbjf',
            annual: 'price_1Sj2Y7LE30d1czmd16o5FTvp',
        },
        EUR: {
            monthly: 'price_1Sj2Y8LE30d1czmd97QfUxC0',
            annual: 'price_1Sj2Y9LE30d1czmdNn46kL5B',
        },
    },
    team: {
        USD: {
            monthly: 'price_1Sj2YdLE30d1czmdNopdqYTj',
            annual: 'price_1Sj2YdLE30d1czmdSzOW3rrY',
        },
        GBP: {
            monthly: 'price_1Sj2YeLE30d1czmdaci4C18S',
            annual: 'price_1Sj2YfLE30d1czmdKINVzc7y',
        },
        EUR: {
            monthly: 'price_1Sj2YgLE30d1czmd3XWoxg8g',
            annual: 'price_1Sj2YhLE30d1czmdRrlAeRxh',
        },
    },
};

// Token Pack Prices (Live Mode)
const TOKEN_PACK_PRICES_LIVE = {
    '5000': {
        USD: 'price_1Sj1XxLE30d1czmdEEBt5q8O',
        GBP: 'price_1Sj1XyLE30d1czmdkFf9mcs2',
        EUR: 'price_1Sj1XzLE30d1czmdbvVUUb1M',
    },
    '25000': {
        USD: 'price_1Sj1XzLE30d1czmdAvrfublS',
        GBP: 'price_1Sj1Y0LE30d1czmdoZhyNiq2',
        EUR: 'price_1Sj1Y1LE30d1czmdHuHTtYZM',
    },
    '100000': {
        USD: 'price_1Sj1Y1LE30d1czmd79RiK6eB',
        GBP: 'price_1Sj1Y2LE30d1czmdMwBDZQ0w',
        EUR: 'price_1Sj1Y3LE30d1czmdqngP2zV7',
    },
};

// Token Pack Prices (Test Mode)
const TOKEN_PACK_PRICES_TEST = {
    '5000': {
        USD: 'price_1Sj2Z7LE30d1czmdb4ulGv3e',
        GBP: 'price_1Sj2Z8LE30d1czmdstOAIod4',
        EUR: 'price_1Sj2Z9LE30d1czmd5QSHe1fM',
    },
    '25000': {
        USD: 'price_1Sj2ZALE30d1czmd7O5yIKye',
        GBP: 'price_1Sj2ZBLE30d1czmd4tBU4Dz5',
        EUR: 'price_1Sj2ZCLE30d1czmdckdVSYfI',
    },
    '100000': {
        USD: 'price_1Sj2ZDLE30d1czmddEVuI7VR',
        GBP: 'price_1Sj2ZELE30d1czmdCWDVUD6J',
        EUR: 'price_1Sj2ZFLE30d1czmdkIE1DSvc',
    },
};

// Export the appropriate prices based on mode
export const STRIPE_PRICES = isTestMode ? STRIPE_PRICES_TEST : STRIPE_PRICES_LIVE;
export const TOKEN_PACK_PRICES = isTestMode ? TOKEN_PACK_PRICES_TEST : TOKEN_PACK_PRICES_LIVE;

// Stripe Plans Configuration
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'Get started and explore the platform.',
        pricing: {
            USD: { monthly: 0, annual: 0 },
            GBP: { monthly: 0, annual: 0 },
            EUR: { monthly: 0, annual: 0 },
        },
        features: [
            '3 active projects',
            'Proposals & Quotes (watermarked)',
            '10 crew contacts',
            '10 equipment items',
            'Basic project tracking',
        ],
        limits: {
            projects: 3,
            crewContacts: 10,
            equipmentItems: 10,
            regions: 1,
            teamMembers: 1,
            aiTokens: 0,
        },
    },
    individual: {
        id: 'individual',
        name: 'Individual',
        description: 'Everything you need as a freelancer.',
        pricing: {
            USD: { monthly: 24, annual: 228 },
            GBP: { monthly: 19, annual: 180 },
            EUR: { monthly: 22, annual: 216 },
        },
        features: [
            'Unlimited projects',
            'Proposals, Quotes & Invoices',
            '100 crew contacts',
            '50 equipment items',
            'Call sheets & calendar sync',
            '10,000 AI tokens/month',
        ],
        limits: {
            projects: -1,
            crewContacts: 100,
            equipmentItems: 50,
            regions: 3,
            teamMembers: 1,
            aiTokens: 10000,
        },
        popular: true,
    },
    team: {
        id: 'team',
        name: 'Team',
        description: 'For production companies with 3+ users.',
        pricing: {
            USD: { monthly: 49, annual: 468 },
            GBP: { monthly: 39, annual: 372 },
            EUR: { monthly: 45, annual: 432 },
        },
        features: [
            'Everything in Individual',
            '3 users included (+$10/user)',
            'Purchase Orders',
            '50,000 AI tokens/month',
            'AI SOP Generator',
            'Team collaboration',
            'Custom branding',
        ],
        limits: {
            projects: -1,
            crewContacts: -1,
            equipmentItems: -1,
            regions: -1,
            teamMembers: 3, // +$10/user for additional
            aiTokens: 50000,
        },
    },
};

// Token Packs Configuration
export const TOKEN_PACKS = {
    '5000': {
        id: '5000',
        tokens: 5000,
        pricing: { USD: 5, GBP: 4, EUR: 5 },
        popular: false,
    },
    '25000': {
        id: '25000',
        tokens: 25000,
        pricing: { USD: 20, GBP: 16, EUR: 18 },
        popular: true,
    },
    '100000': {
        id: '100000',
        tokens: 100000,
        pricing: { USD: 60, GBP: 48, EUR: 55 },
        popular: false,
    },
};

/**
 * Get Stripe price ID for a plan
 * @param {string} planId - Plan ID (individual or team)
 * @param {string} currency - Currency code
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @param {string} tier - Optional pricing tier (tier1-tier5)
 */
export function getStripePriceId(planId, currency = 'USD', billingCycle = 'monthly', tier = null) {
    if (planId === 'free') return null;

    // If a specific tier is provided, use tiered pricing
    if (tier && tier !== 'tier1') {
        // Check for local currency price first
        const localPrices = STRIPE_PRICES_LOCAL[currency];
        if (localPrices && localPrices[planId]) {
            return localPrices[planId][billingCycle] || localPrices[planId].monthly;
        }

        // Fall back to tier USD pricing
        const tierPrices = STRIPE_PRICES_BY_TIER[tier];
        if (tierPrices && tierPrices[planId]) {
            const currencyPrices = tierPrices[planId].USD;
            return currencyPrices[billingCycle] || currencyPrices.monthly;
        }
    }

    // Check for local currency prices (MYR, SGD, THB, etc.)
    const localPrices = STRIPE_PRICES_LOCAL[currency];
    if (localPrices && localPrices[planId]) {
        return localPrices[planId][billingCycle] || localPrices[planId].monthly;
    }

    // Default to tier 1 pricing
    const planPrices = STRIPE_PRICES[planId];
    if (!planPrices) return null;
    const currencyPrices = planPrices[currency] || planPrices.USD;
    return currencyPrices[billingCycle] || currencyPrices.monthly;
}

/**
 * Get Stripe price ID for a plan with PPP/regional pricing
 * @param {string} planId - Plan ID (individual or team)
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @param {Object} pricingInfo - Pricing info from pppService.getPricingForUser()
 */
export function getRegionalStripePriceId(planId, billingCycle, pricingInfo) {
    if (planId === 'free') return null;

    const { tier, currency } = pricingInfo;

    // Check for local currency price first
    const localPrices = STRIPE_PRICES_LOCAL[currency];
    if (localPrices && localPrices[planId]) {
        return localPrices[planId][billingCycle] || localPrices[planId].monthly;
    }

    // Fall back to tier USD pricing
    const tierPrices = STRIPE_PRICES_BY_TIER[tier] || STRIPE_PRICES_BY_TIER.tier1;
    if (tierPrices && tierPrices[planId]) {
        const currencyPrices = tierPrices[planId].USD || tierPrices[planId];
        if (currencyPrices.USD) {
            return currencyPrices.USD[billingCycle] || currencyPrices.USD.monthly;
        }
        return currencyPrices[billingCycle] || currencyPrices.monthly;
    }

    // Fallback to default tier 1 pricing
    const planPrices = STRIPE_PRICES[planId];
    if (!planPrices) return null;
    return planPrices.USD[billingCycle] || planPrices.USD.monthly;
}

/**
 * Get Stripe price ID for a token pack
 */
export function getTokenPackPriceId(tokens, currency = 'USD') {
    const packPrices = TOKEN_PACK_PRICES[tokens.toString()];
    if (!packPrices) return null;
    return packPrices[currency] || packPrices.USD;
}

/**
 * Create a Stripe checkout session for trial with billing capture
 * Sets up subscription but doesn't charge until trial ends (5 days)
 */
export async function createTrialCheckoutSession(planId = 'individual', organizationId, userEmail, currency = 'USD') {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan');

    const priceId = getStripePriceId(planId, currency, 'monthly');
    if (!priceId) {
        throw new Error('This plan does not support subscriptions');
    }

    // Call Supabase Edge Function to create Stripe checkout session with trial
    const { data, error } = await supabase.functions.invoke('create-trial-checkout', {
        body: {
            priceId,
            organizationId,
            customerEmail: userEmail,
            trialPeriodDays: 5, // 5-day trial
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
 * @param {string} planId - Plan ID (individual or team)
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @param {string} currency - Currency code
 * @param {string} tier - Optional pricing tier from PPP service
 */
export async function createCheckoutSession(planId, billingCycle = 'monthly', currency = 'USD', tier = null) {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = useOrganizationStore.getState().getOrganizationId();
    if (!organizationId) throw new Error('No organization selected');

    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan');

    // Get price ID based on tier and currency
    const priceId = getStripePriceId(planId, currency, billingCycle, tier);
    if (!priceId) {
        throw new Error('This plan does not support paid subscriptions');
    }

    // Call Supabase Edge Function to create Stripe checkout session
    // Include tier info for card country validation
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
            priceId,
            organizationId,
            tier: tier || 'tier1',
            currency,
            successUrl: `${window.location.origin}/settings?tab=billing&success=true`,
            cancelUrl: `${window.location.origin}/settings?tab=billing&canceled=true`,
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Create a Stripe checkout session for purchasing a token pack
 */
export async function createTokenPackCheckoutSession(tokens, currency = 'USD') {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = useOrganizationStore.getState().getOrganizationId();
    if (!organizationId) throw new Error('No organization selected');

    const priceId = getTokenPackPriceId(tokens, currency);
    if (!priceId) {
        throw new Error('Invalid token pack');
    }

    // Call Supabase Edge Function to create Stripe checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
            priceId,
            organizationId,
            mode: 'payment', // One-time payment, not subscription
            successUrl: `${window.location.origin}/settings?tab=billing&tokens=success`,
            cancelUrl: `${window.location.origin}/settings?tab=billing&tokens=canceled`,
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
    TOKEN_PACKS,
    STRIPE_PRODUCTS,
    STRIPE_PRICES,
    STRIPE_PRICES_BY_TIER,
    STRIPE_PRICES_LOCAL,
    TOKEN_PACK_PRICES,
    getStripePriceId,
    getRegionalStripePriceId,
    getTokenPackPriceId,
    createCheckoutSession,
    createTokenPackCheckoutSession,
    createTrialCheckoutSession,
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
