export const comparisonTable = [
    { feature: "Unlimited Projects", solo: true, team: true, agency: true },
    { feature: "Quote Builder", solo: true, team: true, agency: true },
    { feature: "Regional Rate Cards", solo: true, team: true, agency: true },
    { feature: "Multi-Currency Quoting", solo: true, team: true, agency: true },
    { feature: "Project Status Workflow", solo: true, team: true, agency: true },
    { feature: "Deliverables Tracking", solo: true, team: true, agency: true },
    { feature: "Crew Database", solo: "Basic", team: "Advanced", agency: "Advanced" },
    { feature: "Equipment Inventory", solo: "50 items", team: "Unlimited", agency: "Unlimited" },
    { feature: "Call Sheet Generator", solo: false, team: true, agency: true },
    { feature: "Financial Reports (P&L)", solo: false, team: "Basic", agency: "Advanced" },
    { feature: "Google Calendar Sync", solo: false, team: true, agency: true },
    { feature: "QuickBooks Integration", solo: false, team: false, agency: true },
    { feature: "Purchase Orders", solo: false, team: false, agency: true },
    { feature: "Agency Dashboard", solo: false, team: false, agency: true },
    { feature: "Custom Branding", solo: false, team: "Logo only", agency: "Full White Label" },
    { feature: "Priority Support", solo: false, team: false, agency: true },
];

export const plans = [
    {
        name: "Solo",
        price: 29,
        priceAnnual: 24,
        description: "Perfect for freelancers and owner-operators.",
        features: ["Unlimited projects", "Full quote builder", "Basic CRM", "50 equipment items"],
        cta: "Start Solo Trial",
        popular: false
    },
    {
        name: "Team",
        price: 79,
        priceAnnual: 65,
        description: "For small production companies growing fast.",
        features: ["Everything in Solo", "3 Users included", "Call sheet generator", "Calendar sync", "Unlimited equipment"],
        cta: "Start Team Trial",
        popular: true
    },
    {
        name: "Agency",
        price: 149,
        priceAnnual: 119,
        description: "For established agencies managing multiple productions.",
        features: ["Everything in Team", "5 Users included", "Financial reporting", "QuickBooks integration", "White labeling"],
        cta: "Start Agency Trial",
        popular: false
    }
];

export const pricingFaqs = [
    {
        q: "How long is the free trial?",
        a: "You get a 5-day free trial to explore all features. After that, choose a plan that fits your needs."
    },
    {
        q: "Can I cancel anytime?",
        a: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. You'll keep access until the end of your billing period."
    },
    {
        q: "What falls under 'equipment items'?",
        a: "An equipment item is any single asset you track in your inventory, like a camera body, a lens, or a lighting kit. Accessories can be grouped into kits to save space."
    },
    {
        q: "Do you offer enterprise plans?",
        a: "Yes, for organizations with more than 10 users or specific security requirements, please contact our sales team for a custom quote."
    }
];
