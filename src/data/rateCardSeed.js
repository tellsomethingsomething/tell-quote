// Rate Card Seed Data
// Prices are in USD - cost is base, charge includes markup

// Helper to create pricing with USD base rate
const createPricing = (usdCost, markup = 1.5) => ({
    MALAYSIA: { cost: usdCost * 0.85, charge: usdCost * 0.85 * markup },
    SEA: { cost: usdCost, charge: usdCost * markup },
    GULF: { cost: usdCost * 1.2, charge: usdCost * 1.2 * markup },
    CENTRAL_ASIA: { cost: usdCost * 1.1, charge: usdCost * 1.1 * markup },
});

export const SEED_ITEMS = [
    // ===== PRODUCTION MANAGEMENT - REMOTE =====
    {
        name: 'Project Manager',
        description: 'Remote project management',
        section: 'prod_mgmt_remote',
        unit: 'day',
        pricing: createPricing(300),
    },
    {
        name: 'Technical Project Manager',
        description: 'Remote technical project management',
        section: 'prod_mgmt_remote',
        unit: 'day',
        pricing: createPricing(300),
    },
    {
        name: 'Consultant - TE',
        description: 'Technical engineering consultant',
        section: 'prod_mgmt_remote',
        unit: 'day',
        pricing: createPricing(500),
    },

    // ===== EVENT GRAPHICS =====
    {
        name: 'Graphics System - VMix',
        description: 'VMix graphics system package',
        section: 'event_graphics',
        unit: 'day',
        pricing: createPricing(33.80),
    },
    {
        name: 'Graphics Design',
        description: 'Graphics design services',
        section: 'event_graphics',
        unit: 'day',
        pricing: createPricing(150),
    },
    {
        name: 'Graphics Integration',
        description: 'Graphics integration and setup',
        section: 'event_graphics',
        unit: 'day',
        pricing: createPricing(50),
    },
    {
        name: 'Photo Editing',
        description: 'Photo editing services',
        section: 'event_graphics',
        unit: 'item', // Per hour in source, using item
        pricing: createPricing(10),
    },
    {
        name: 'Graphics Operator',
        description: 'On-site graphics operator',
        section: 'event_graphics',
        unit: 'day',
        pricing: createPricing(100),
    },
    {
        name: 'Graphics Producer - On Site',
        description: 'On-site graphics producer',
        section: 'event_graphics',
        unit: 'day',
        pricing: createPricing(400),
    },
    {
        name: 'Graphics Engineer',
        description: 'Graphics engineering and technical support',
        section: 'event_graphics',
        unit: 'day',
        pricing: createPricing(150),
    },

    // ===== PRODUCTION STAFFING =====
    {
        name: 'Technical Producer - Int',
        description: 'International technical producer',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(500),
    },
    {
        name: 'Technical Director - Int',
        description: 'International technical director',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(450),
    },
    {
        name: 'Producer - Int On Site',
        description: 'International producer on-site',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(500),
    },
    {
        name: 'Producer - Remote Int',
        description: 'International remote producer',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(300),
    },
    {
        name: 'Sound Engineer - Int',
        description: 'International sound engineer',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(500),
    },
    {
        name: 'Sound Engineer - SEA',
        description: 'South East Asia sound engineer',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(350),
    },
    {
        name: 'Talent - Int',
        description: 'International talent/presenter',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(500),
    },
    {
        name: 'Field Producer/Floor Manager - Int',
        description: 'International field producer/floor manager',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(450),
    },
    {
        name: 'Field Producer/Floor Manager - SEA',
        description: 'South East Asia field producer/floor manager',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(250),
    },
    {
        name: 'Camera Operator - Int',
        description: 'International camera operator',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(450),
    },
    {
        name: 'Camera Operator - SEA',
        description: 'South East Asia camera operator',
        section: 'prod_staffing',
        unit: 'day',
        pricing: createPricing(250),
    },

    // ===== SPR EQUIPMENT =====
    {
        name: 'SPR Equipment - Silver Package',
        description: 'SPR equipment silver package',
        section: 'spr_equipment',
        unit: 'day',
        pricing: createPricing(700),
    },

    // ===== EXTRAS =====
    {
        name: 'DJ Cam',
        description: 'DJ camera setup',
        section: 'extras',
        unit: 'day',
        pricing: createPricing(75),
    },
    {
        name: 'Wireless Camera System',
        description: 'Wireless camera system',
        section: 'extras',
        unit: 'day',
        pricing: createPricing(250),
    },
    {
        name: 'Comms',
        description: 'Communications equipment',
        section: 'extras',
        unit: 'day',
        pricing: createPricing(250),
    },
];
