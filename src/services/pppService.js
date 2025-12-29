/**
 * Purchasing Power Parity (PPP) Service
 * Detects user's country and returns appropriate regional pricing
 */

// Country to pricing tier mapping (based on GDP per capita)
// Tier 1: Full price ($24/$49) - GDP >$35k - US, UK, EU, AU, CA, JP, CH, Nordic, SG, AE, HK, QA, KW, IL, NZ, TW
// Tier 2: $20/$40 (17% off) - GDP $20-35k - KR, SA, BH, OM, CZ, PL, HU, EE, LT, LV
// Tier 3: $12/$25 (50% off) - GDP $10-20k - MY, TH, MX, BR, CL, AR, CR, PA, UY, RO, BG, HR
// Tier 4: $8/$16 (67% off) - GDP $3-10k - IN, ID, PH, VN, ZA, CO, PE, UA
// Tier 5: $6/$12 (75% off) - GDP <$3k - PK, BD, NG, KE, EG, ET, GH, TZ, UG

export const PRICING_TIERS = {
    tier1: {
        // GDP per capita >$35k - full price markets
        countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT',
                    'AU', 'CA', 'JP', 'CH', 'NO', 'DK', 'SE', 'LU', 'IS',
                    // Added wealthy countries (previously Tier 2/3)
                    'SG', 'AE', 'IL', 'NZ', 'HK', 'QA', 'KW', 'TW'],
        margin: 90,
        individual: { monthly: 24, annual: 228 },
        team: { monthly: 49, annual: 468 },
        currency: 'USD', // Will be overridden for specific countries
    },
    tier2: {
        // GDP per capita $20-35k - slight discount
        countries: ['KR', 'SA', 'BH', 'OM', 'CZ', 'PL', 'HU', 'EE', 'LT', 'LV', 'SK', 'SI', 'GR', 'CY', 'MT'],
        margin: 85,
        individual: { monthly: 20, annual: 200 },
        team: { monthly: 40, annual: 400 },
        currency: 'USD',
    },
    tier3: {
        // GDP per capita $10-20k - moderate discount
        countries: ['MY', 'TH', 'MX', 'BR', 'CL', 'AR', 'CR', 'PA', 'UY', 'RO', 'BG', 'HR', 'RS'],
        margin: 75,
        individual: { monthly: 12, annual: 120 },
        team: { monthly: 25, annual: 250 },
        currency: 'USD',
    },
    tier4: {
        // GDP per capita $3-10k - significant discount
        countries: ['IN', 'ID', 'PH', 'VN', 'ZA', 'CO', 'PE', 'UA'],
        margin: 65,
        individual: { monthly: 8, annual: 80 },
        team: { monthly: 16, annual: 160 },
        currency: 'USD',
    },
    tier5: {
        // GDP per capita <$3k - maximum discount
        countries: ['PK', 'BD', 'NG', 'KE', 'EG', 'ET', 'GH', 'TZ', 'UG', 'ZW', 'ZM', 'MW', 'NP', 'MM', 'KH', 'LA'],
        margin: 60,
        individual: { monthly: 6, annual: 60 },
        team: { monthly: 12, annual: 120 },
        currency: 'USD',
    },
};

// Country to local currency mapping
export const COUNTRY_CURRENCIES = {
    // Tier 1
    US: 'USD', CA: 'USD', // Canada often prefers USD for software
    GB: 'GBP',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
    AT: 'EUR', IE: 'EUR', FI: 'EUR', PT: 'EUR', LU: 'EUR',
    AU: 'AUD',
    JP: 'JPY',
    CH: 'CHF',
    NO: 'NOK', SE: 'SEK', DK: 'DKK',
    // Tier 2
    SG: 'SGD',
    AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
    IL: 'ILS',
    KR: 'KRW',
    NZ: 'NZD',
    HK: 'HKD',
    // Tier 3
    MY: 'MYR',
    TH: 'THB',
    MX: 'MXN',
    BR: 'BRL',
    PL: 'PLN', CZ: 'CZK', HU: 'HUF',
    TW: 'TWD',
    CL: 'CLP', AR: 'ARS',
    // Tier 4
    IN: 'INR',
    ID: 'IDR',
    PH: 'PHP',
    VN: 'VND',
    ZA: 'ZAR',
    CO: 'COP', PE: 'PEN',
    UA: 'UAH',
    RO: 'RON', BG: 'BGN',
    // Tier 5
    PK: 'PKR',
    BD: 'BDT',
    NG: 'NGN',
    KE: 'KES',
    EG: 'EGP',
};

// Local currency prices (display only, Stripe handles conversion)
// Tier 1 countries use full price converted to local currency
export const LOCAL_CURRENCY_PRICES = {
    // Tier 1 - Full price ($24/$49 equivalent)
    SGD: { individual: { monthly: 32, annual: 308 }, team: { monthly: 66, annual: 632 } },      // S$32 (~$24 USD)
    AUD: { individual: { monthly: 37, annual: 355 }, team: { monthly: 76, annual: 728 } },      // A$37 (~$24 USD)
    NZD: { individual: { monthly: 40, annual: 384 }, team: { monthly: 82, annual: 787 } },      // NZ$40 (~$24 USD)
    AED: { individual: { monthly: 88, annual: 845 }, team: { monthly: 180, annual: 1728 } },    // AED88 (~$24 USD)
    ILS: { individual: { monthly: 89, annual: 854 }, team: { monthly: 182, annual: 1747 } },    // ₪89 (~$24 USD)
    HKD: { individual: { monthly: 188, annual: 1805 }, team: { monthly: 384, annual: 3686 } },  // HK$188 (~$24 USD)
    TWD: { individual: { monthly: 760, annual: 7296 }, team: { monthly: 1550, annual: 14880 } },// NT$760 (~$24 USD)
    // Tier 2 - Slight discount ($20/$40 equivalent)
    KRW: { individual: { monthly: 27000, annual: 259200 }, team: { monthly: 55000, annual: 528000 } }, // ₩27,000 (~$20 USD)
    SAR: { individual: { monthly: 75, annual: 720 }, team: { monthly: 150, annual: 1440 } },    // SAR75 (~$20 USD)
    // Tier 3 - Moderate discount ($12/$25 equivalent)
    MYR: { individual: { monthly: 55, annual: 528 }, team: { monthly: 115, annual: 1104 } },    // RM55 (~$12 USD)
    THB: { individual: { monthly: 420, annual: 4032 }, team: { monthly: 875, annual: 8400 } },  // ฿420 (~$12 USD)
    BRL: { individual: { monthly: 60, annual: 576 }, team: { monthly: 125, annual: 1200 } },    // R$60 (~$12 USD)
    MXN: { individual: { monthly: 210, annual: 2016 }, team: { monthly: 440, annual: 4224 } },  // MX$210 (~$12 USD)
    // Tier 4 - Significant discount ($8/$16 equivalent)
    INR: { individual: { monthly: 650, annual: 6240 }, team: { monthly: 1300, annual: 12480 } },// ₹650 (~$8 USD)
    PHP: { individual: { monthly: 450, annual: 4320 }, team: { monthly: 900, annual: 8640 } },  // ₱450 (~$8 USD)
    IDR: { individual: { monthly: 125000, annual: 1200000 }, team: { monthly: 250000, annual: 2400000 } }, // Rp125k (~$8 USD)
    ZAR: { individual: { monthly: 150, annual: 1440 }, team: { monthly: 300, annual: 2880 } },  // R150 (~$8 USD)
    VND: { individual: { monthly: 200000, annual: 1920000 }, team: { monthly: 400000, annual: 3840000 } }, // ₫200k (~$8 USD)
};

// Currency configuration for display
export const CURRENCY_CONFIG = {
    // Tier 1 currencies
    USD: { symbol: '$', code: 'USD', position: 'before', decimals: 0 },
    GBP: { symbol: '£', code: 'GBP', position: 'before', decimals: 0 },
    EUR: { symbol: '€', code: 'EUR', position: 'before', decimals: 0 },
    AUD: { symbol: 'A$', code: 'AUD', position: 'before', decimals: 0 },
    CAD: { symbol: 'C$', code: 'CAD', position: 'before', decimals: 0 },
    SGD: { symbol: 'S$', code: 'SGD', position: 'before', decimals: 0 },
    NZD: { symbol: 'NZ$', code: 'NZD', position: 'before', decimals: 0 },
    CHF: { symbol: 'CHF', code: 'CHF', position: 'before', decimals: 0 },
    JPY: { symbol: '¥', code: 'JPY', position: 'before', decimals: 0 },
    AED: { symbol: 'AED', code: 'AED', position: 'before', decimals: 0 },
    ILS: { symbol: '₪', code: 'ILS', position: 'before', decimals: 0 },
    HKD: { symbol: 'HK$', code: 'HKD', position: 'before', decimals: 0 },
    TWD: { symbol: 'NT$', code: 'TWD', position: 'before', decimals: 0 },
    QAR: { symbol: 'QR', code: 'QAR', position: 'before', decimals: 0 },
    KWD: { symbol: 'KD', code: 'KWD', position: 'before', decimals: 0 },
    // Tier 2 currencies
    KRW: { symbol: '₩', code: 'KRW', position: 'before', decimals: 0 },
    SAR: { symbol: 'SAR', code: 'SAR', position: 'before', decimals: 0 },
    // Tier 3 currencies
    MYR: { symbol: 'RM', code: 'MYR', position: 'before', decimals: 0 },
    THB: { symbol: '฿', code: 'THB', position: 'before', decimals: 0 },
    BRL: { symbol: 'R$', code: 'BRL', position: 'before', decimals: 0 },
    MXN: { symbol: 'MX$', code: 'MXN', position: 'before', decimals: 0 },
    // Tier 4 currencies
    INR: { symbol: '₹', code: 'INR', position: 'before', decimals: 0 },
    PHP: { symbol: '₱', code: 'PHP', position: 'before', decimals: 0 },
    IDR: { symbol: 'Rp', code: 'IDR', position: 'before', decimals: 0, separator: '.' },
    VND: { symbol: '₫', code: 'VND', position: 'after', decimals: 0 },
    ZAR: { symbol: 'R', code: 'ZAR', position: 'before', decimals: 0 },
};

// Cache for detected country
let cachedCountry = null;
let cachedPricingInfo = null;

/**
 * Detect user's country using multiple methods
 * @returns {Promise<string>} ISO 3166-1 alpha-2 country code
 */
export async function detectCountry() {
    if (cachedCountry) return cachedCountry;

    // Check for URL parameter override (for testing)
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const countryParam = urlParams.get('country');
        if (countryParam && countryParam.length === 2) {
            cachedCountry = countryParam.toUpperCase();
            console.log(`[PPP] Country override from URL: ${cachedCountry}`);
            return cachedCountry;
        }
    }

    try {
        // Try IP-based geolocation (free, no API key needed)
        const response = await fetch('https://ipapi.co/json/', {
            timeout: 3000,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.country_code) {
                cachedCountry = data.country_code;
                return cachedCountry;
            }
        }
    } catch (error) {
        console.warn('IP geolocation failed, falling back to timezone detection:', error);
    }

    // Fallback: Timezone-based detection
    return detectCountryFromTimezone();
}

/**
 * Detect country from browser timezone
 * @returns {string} Country code
 */
function detectCountryFromTimezone() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Map common timezones to countries
        const timezoneMap = {
            // US
            'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
            'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'Pacific/Honolulu': 'US',
            // UK
            'Europe/London': 'GB',
            // EU
            'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT',
            'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
            'Europe/Vienna': 'AT', 'Europe/Dublin': 'IE', 'Europe/Helsinki': 'FI',
            'Europe/Lisbon': 'PT', 'Europe/Stockholm': 'SE', 'Europe/Copenhagen': 'DK',
            'Europe/Oslo': 'NO', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
            'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG',
            // Asia Pacific
            'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Bangkok': 'TH',
            'Asia/Ho_Chi_Minh': 'VN', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH',
            'Asia/Kolkata': 'IN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
            'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Shanghai': 'CN',
            'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Tel_Aviv': 'IL',
            'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD',
            // Oceania
            'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
            'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ',
            // Americas
            'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Mexico_City': 'MX',
            'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR', 'America/Bogota': 'CO',
            'America/Lima': 'PE', 'America/Santiago': 'CL',
            // Africa
            'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
            'Africa/Cairo': 'EG',
        };

        if (timezoneMap[timezone]) {
            cachedCountry = timezoneMap[timezone];
            return cachedCountry;
        }

        // Try to extract country from timezone region
        const region = timezone.split('/')[0];
        if (region === 'America') return 'US';
        if (region === 'Europe') return 'GB';
        if (region === 'Asia') return 'SG';
        if (region === 'Australia') return 'AU';
        if (region === 'Africa') return 'ZA';

    } catch (error) {
        console.warn('Timezone detection failed:', error);
    }

    // Default to US
    return 'US';
}

/**
 * Get pricing tier for a country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} Tier name (tier1, tier2, tier3, tier4, tier5)
 */
export function getTierForCountry(countryCode) {
    for (const [tierName, tierData] of Object.entries(PRICING_TIERS)) {
        if (tierData.countries.includes(countryCode)) {
            return tierName;
        }
    }
    return 'tier1'; // Default to full price
}

/**
 * Get currency for a country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} Currency code
 */
export function getCurrencyForCountry(countryCode) {
    return COUNTRY_CURRENCIES[countryCode] || 'USD';
}

/**
 * Get complete pricing information for user's detected location
 * @returns {Promise<Object>} Pricing info with tier, currency, prices
 */
export async function getPricingForUser() {
    if (cachedPricingInfo) return cachedPricingInfo;

    const countryCode = await detectCountry();
    const tier = getTierForCountry(countryCode);
    const tierData = PRICING_TIERS[tier];
    const currency = getCurrencyForCountry(countryCode);

    // Check if we have local currency prices
    const localPrices = LOCAL_CURRENCY_PRICES[currency];
    const displayPrices = localPrices || {
        individual: tierData.individual,
        team: tierData.team,
    };

    cachedPricingInfo = {
        countryCode,
        tier,
        currency,
        currencyConfig: CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD,
        prices: {
            individual: displayPrices.individual,
            team: displayPrices.team,
        },
        // USD equivalent for Stripe (tier pricing)
        usdEquivalent: {
            individual: tierData.individual,
            team: tierData.team,
        },
    };

    return cachedPricingInfo;
}

/**
 * Format price with appropriate currency
 * @param {number} amount - Price amount
 * @param {string} currencyCode - Currency code
 * @returns {string} Formatted price
 */
export function formatLocalPrice(amount, currencyCode = 'USD') {
    const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.USD;

    // Format number with appropriate separators
    let formatted;
    if (config.separator === '.') {
        // Use period as thousands separator (e.g., IDR)
        formatted = amount.toLocaleString('id-ID');
    } else {
        formatted = amount.toLocaleString('en-US', { maximumFractionDigits: config.decimals });
    }

    if (config.position === 'before') {
        return `${config.symbol}${formatted}`;
    } else {
        return `${formatted}${config.symbol}`;
    }
}

/**
 * Clear cached location data (useful for testing or user override)
 */
export function clearPricingCache() {
    cachedCountry = null;
    cachedPricingInfo = null;
}

/**
 * Manually set country (for testing or user preference)
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 */
export function setCountryOverride(countryCode) {
    cachedCountry = countryCode;
    cachedPricingInfo = null; // Clear pricing cache to recalculate
}

/**
 * Get list of supported countries for each tier (for display purposes)
 */
export function getSupportedCountriesByTier() {
    return Object.entries(PRICING_TIERS).map(([tierName, tierData]) => ({
        tier: tierName,
        countries: tierData.countries,
        pricing: tierData.individual,
    }));
}

export default {
    detectCountry,
    getTierForCountry,
    getCurrencyForCountry,
    getPricingForUser,
    formatLocalPrice,
    clearPricingCache,
    setCountryOverride,
    getSupportedCountriesByTier,
    PRICING_TIERS,
    COUNTRY_CURRENCIES,
    LOCAL_CURRENCY_PRICES,
    CURRENCY_CONFIG,
};
