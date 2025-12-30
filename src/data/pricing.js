export const comparisonTable = [
    { feature: "Projects", free: "3 active", individual: "Unlimited", team: "Unlimited" },
    { feature: "Proposals", free: "Watermarked", individual: true, team: true },
    { feature: "Quotes", free: "Watermarked", individual: true, team: true },
    { feature: "Invoices", free: false, individual: true, team: true },
    { feature: "Purchase Orders", free: false, individual: true, team: true },
    { feature: "Regional Rate Cards", free: "1 region", individual: "3 regions", team: "Unlimited" },
    { feature: "Multi-Currency Quoting", free: false, individual: true, team: true },
    { feature: "Project Status Workflow", free: true, individual: true, team: true },
    { feature: "Deliverables Tracking", free: "Basic", individual: true, team: true },
    { feature: "Crew Database", free: "10 contacts", individual: "100 contacts", team: "Unlimited" },
    { feature: "Equipment Inventory", free: "10 items", individual: "50 items", team: "Unlimited" },
    { feature: "Call Sheet Generator", free: false, individual: true, team: true },
    { feature: "Financial Reports (P&L)", free: false, individual: "Basic", team: "Advanced" },
    { feature: "Google Calendar Sync", free: false, individual: true, team: true },
    { feature: "CRM & Pipeline", free: false, individual: true, team: true },
    { feature: "AI Tokens", free: false, individual: "10,000/mo", team: "50,000/mo" },
    { feature: "AI Research & SOP Tools", free: false, individual: true, team: true },
    { feature: "Buy Extra Tokens", free: false, individual: true, team: true },
    { feature: "Team Collaboration", free: false, individual: false, team: true },
    { feature: "User Roles & Permissions", free: false, individual: false, team: true },
    { feature: "Custom Branding", free: false, individual: "Logo only", team: "Full White Label" },
    { feature: "Priority Support", free: false, individual: false, team: true },
];

// Multi-currency pricing (extended with local currencies)
export const currencyConfig = {
    USD: { symbol: '$', code: 'USD', position: 'before' },
    GBP: { symbol: '£', code: 'GBP', position: 'before' },
    EUR: { symbol: '€', code: 'EUR', position: 'before' },
    AUD: { symbol: 'A$', code: 'AUD', position: 'before' },
    SGD: { symbol: 'S$', code: 'SGD', position: 'before' },
    MYR: { symbol: 'RM', code: 'MYR', position: 'before' },
    THB: { symbol: '฿', code: 'THB', position: 'before' },
    INR: { symbol: '₹', code: 'INR', position: 'before' },
    PHP: { symbol: '₱', code: 'PHP', position: 'before' },
    IDR: { symbol: 'Rp', code: 'IDR', position: 'before', separator: '.' },
};

export const plans = [
    {
        id: 'free',
        name: "Free",
        pricing: {
            USD: { monthly: 0, annual: 0 },
            GBP: { monthly: 0, annual: 0 },
            EUR: { monthly: 0, annual: 0 },
        },
        description: "Get started and explore the platform.",
        features: [
            "3 active projects",
            "Proposals & Quotes (watermarked)",
            "10 crew contacts",
            "10 equipment items",
            "Basic project tracking"
        ],
        cta: "Get Started Free",
        popular: false
    },
    {
        id: 'individual',
        name: "Individual",
        pricing: {
            USD: { monthly: 24, annual: 19 },
            GBP: { monthly: 19, annual: 15 },
            EUR: { monthly: 22, annual: 18 },
        },
        description: "Everything you need as a freelancer.",
        features: [
            "Unlimited projects",
            "Proposals, Quotes & Invoices",
            "100 crew contacts",
            "50 equipment items",
            "Call sheets & calendar sync",
            "10,000 AI tokens/month"
        ],
        tokens: 10000,
        cta: "Start 5-day trial",
        popular: true
    },
    {
        id: 'team',
        name: "Team",
        pricing: {
            USD: { monthly: 49, annual: 39 },
            GBP: { monthly: 39, annual: 31 },
            EUR: { monthly: 45, annual: 36 },
        },
        // Per-user pricing for additional team members
        perUserPricing: {
            USD: 10,
            GBP: 8,
            EUR: 9,
        },
        description: "For production companies with 3+ users.",
        features: [
            "Everything in Individual",
            "3 users included", // Per-user price shown dynamically based on currency
            "Purchase Orders",
            "50,000 AI tokens/month",
            "AI SOP Generator",
            "Team collaboration",
            "Custom branding"
        ],
        tokens: 50000,
        cta: "Start 5-day trial",
        popular: false
    }
];

// Token packs for purchasing additional AI tokens
export const tokenPacks = [
    {
        tokens: 5000,
        pricing: {
            USD: 5,
            GBP: 4,
            EUR: 5,
        },
        popular: false
    },
    {
        tokens: 25000,
        pricing: {
            USD: 20,
            GBP: 16,
            EUR: 18,
        },
        popular: true
    },
    {
        tokens: 100000,
        pricing: {
            USD: 60,
            GBP: 48,
            EUR: 55,
        },
        popular: false
    }
];

// Token usage estimates (for UI display)
export const tokenEstimates = {
    quickResearch: { tokens: 200, label: 'Quick research query' },
    deepResearch: { tokens: 500, label: 'Deep research analysis' },
    sopGeneration: { tokens: 1000, label: 'SOP document generation' },
    documentAnalysis: { tokens: 400, label: 'Document analysis' },
};

// Detect user's preferred currency based on locale/timezone
export function detectUserCurrency() {
    try {
        // First try timezone-based detection (more reliable)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // UK timezones
        if (timezone.includes('London') || timezone.includes('Europe/London')) {
            return 'GBP';
        }

        // European timezones
        if (timezone.includes('Europe/') && !timezone.includes('London')) {
            return 'EUR';
        }

        // US timezones
        if (timezone.includes('America/') || timezone.includes('US/') || timezone.includes('Pacific/Honolulu')) {
            return 'USD';
        }

        // Fallback to navigator.language
        const language = navigator.language || navigator.userLanguage || 'en-US';

        if (language.includes('GB') || language.includes('en-GB')) {
            return 'GBP';
        }

        if (language.includes('de') || language.includes('fr') || language.includes('es') ||
            language.includes('it') || language.includes('nl') || language.includes('pt')) {
            return 'EUR';
        }

        // Default to USD
        return 'USD';
    } catch {
        return 'USD';
    }
}

// Format price with currency symbol
export function formatPrice(amount, currencyCode = 'USD') {
    const config = currencyConfig[currencyCode] || currencyConfig.USD;
    if (amount === 0) return 'Free';
    return config.position === 'before'
        ? `${config.symbol}${amount}`
        : `${amount}${config.symbol}`;
}

export const pricingFaqs = [
    {
        q: "Is the Free plan really free?",
        a: "Yes! The Free plan lets you manage up to 3 active projects with basic features. No credit card required. Upgrade anytime when you need more."
    },
    {
        q: "Can I upgrade or downgrade anytime?",
        a: "Absolutely. Upgrade instantly to unlock more features, or downgrade at the end of your billing period. No long-term contracts."
    },
    {
        q: "How many users are included in Team?",
        a: "Team includes 3 users. Additional users are £10/month each. All team members get full access to projects, quotes, and collaboration features."
    },
    {
        q: "How do AI tokens work?",
        a: "AI tokens are shared across your entire team. Each AI action (research, SOP generation, document analysis) uses tokens based on complexity. Your allowance resets monthly. Need more? Buy token packs anytime."
    },
    {
        q: "What can I do with AI tokens?",
        a: "Use tokens for research queries (~200 tokens), deep analysis (~500 tokens), SOP generation (~1,000 tokens), and document analysis (~400 tokens). The AI helps with vendor research, location scouting, and creating production documents."
    },
    {
        q: "Do you offer discounts for annual billing?",
        a: "Yes! Save 20% when you pay annually. That's 2 months free on any paid plan."
    },
    {
        q: "What happens to my data if I downgrade?",
        a: "Your data is always safe. If you exceed the limits of your new plan, you'll have read-only access to older items until you upgrade again or archive them."
    },
    {
        q: "What falls under 'equipment items'?",
        a: "An equipment item is any single asset you track in your inventory, like a camera body, a lens, or a lighting kit. Accessories can be grouped into kits to save space."
    }
];
