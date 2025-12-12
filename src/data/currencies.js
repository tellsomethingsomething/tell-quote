// Currency definitions with live rate support
export const CURRENCIES = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
    MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    KWD: { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    THB: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    QAR: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
    SAR: { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
};

// Fallback rates (used when API unavailable)
export const FALLBACK_RATES = {
    USD: 1,
    GBP: 0.79,
    MYR: 4.47,
    IDR: 15850,
    KWD: 0.31,
    AED: 3.67,
    SGD: 1.34,
    THB: 34.50,
    QAR: 3.64,
    SAR: 3.75,
};

// Pricing regions
export const REGIONS = {
    MALAYSIA: {
        id: 'MALAYSIA',
        name: 'Malaysia',
        defaultCurrency: 'MYR',
        countries: ['Malaysia'],
    },
    SEA: {
        id: 'SEA',
        name: 'Southeast Asia',
        defaultCurrency: 'USD',
        countries: ['Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines'],
    },
    GULF: {
        id: 'GULF',
        name: 'Gulf States',
        defaultCurrency: 'KWD',
        countries: ['UAE', 'Kuwait', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Oman'],
    },
    CENTRAL_ASIA: {
        id: 'CENTRAL_ASIA',
        name: 'Central Asia',
        defaultCurrency: 'USD',
        countries: ['Kazakhstan', 'Uzbekistan', 'Tajikistan'],
    },
};
