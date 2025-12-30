/**
 * Purchasing Power Parity (PPP) Service
 * Detects user's country and returns appropriate regional pricing
 */

import logger from '../../utils/logger';
import { getCurrencyForCountry } from './currencies';

/**
 * PPP Pricing Tiers
 *
 * Margin Strategy:
 * - Premium tier (IL): 200% profit margin
 * - Strong economies: 90% profit margin (min £24/$30/month)
 * - Developing economies: 50% profit margin
 *
 * Base cost ~$16/month, pricing = cost × (1 + margin)
 */
export const PRICING_TIERS = {
    premium: {
        // 200% profit margin - highest purchasing power
        countries: ['IL'],
        individual: { monthly: 48, annual: 456 },
        team: { monthly: 99, annual: 948 },
    },
    tier1: {
        // 90% profit margin - Strong economies (min £24/$30/month)
        countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT',
                    'AU', 'CA', 'JP', 'CH', 'NO', 'DK', 'SE', 'LU', 'IS',
                    'SG', 'AE', 'NZ', 'HK', 'QA', 'KW', 'TW'],
        individual: { monthly: 30, annual: 288 },
        team: { monthly: 60, annual: 576 },
    },
    tier2: {
        // 70% profit margin - Upper-middle economies
        countries: ['KR', 'SA', 'BH', 'OM', 'CZ', 'PL', 'HU', 'EE', 'LT', 'LV', 'SK', 'SI', 'GR', 'CY', 'MT'],
        individual: { monthly: 26, annual: 250 },
        team: { monthly: 52, annual: 500 },
    },
    tier3: {
        // 50% profit margin - Developing economies
        countries: ['MY', 'TH', 'MX', 'BR', 'CL', 'AR', 'CR', 'PA', 'UY', 'RO', 'BG', 'HR', 'RS'],
        individual: { monthly: 24, annual: 230 },
        team: { monthly: 48, annual: 460 },
    },
    tier4: {
        // 50% profit margin - Lower-middle economies
        countries: ['IN', 'ID', 'PH', 'VN', 'ZA', 'CO', 'PE', 'UA'],
        individual: { monthly: 18, annual: 170 },
        team: { monthly: 36, annual: 345 },
    },
    tier5: {
        // 50% profit margin - Lower income economies
        countries: ['PK', 'BD', 'NG', 'KE', 'EG', 'ET', 'GH', 'TZ', 'UG', 'ZW', 'ZM', 'MW', 'NP', 'MM', 'KH', 'LA'],
        individual: { monthly: 12, annual: 115 },
        team: { monthly: 24, annual: 230 },
    },
};

// Local currency display prices (rounded for display)
export const LOCAL_CURRENCY_PRICES = {
    // Premium tier - Israel (200% margin)
    ILS: { individual: { monthly: 175, annual: 1680 }, team: { monthly: 360, annual: 3456 } },
    // Tier 1 - Strong economies (90% margin, $30/month base)
    GBP: { individual: { monthly: 24, annual: 230 }, team: { monthly: 48, annual: 460 } },
    EUR: { individual: { monthly: 28, annual: 268 }, team: { monthly: 56, annual: 537 } },
    SGD: { individual: { monthly: 40, annual: 384 }, team: { monthly: 80, annual: 768 } },
    AUD: { individual: { monthly: 46, annual: 442 }, team: { monthly: 92, annual: 883 } },
    NZD: { individual: { monthly: 50, annual: 480 }, team: { monthly: 100, annual: 960 } },
    AED: { individual: { monthly: 110, annual: 1056 }, team: { monthly: 220, annual: 2112 } },
    HKD: { individual: { monthly: 235, annual: 2256 }, team: { monthly: 470, annual: 4512 } },
    TWD: { individual: { monthly: 945, annual: 9072 }, team: { monthly: 1890, annual: 18144 } },
    JPY: { individual: { monthly: 4500, annual: 43200 }, team: { monthly: 9000, annual: 86400 } },
    CHF: { individual: { monthly: 27, annual: 259 }, team: { monthly: 54, annual: 518 } },
    CAD: { individual: { monthly: 41, annual: 394 }, team: { monthly: 82, annual: 787 } },
    // Tier 2 - Upper-middle economies (70% margin)
    KRW: { individual: { monthly: 34000, annual: 326400 }, team: { monthly: 68000, annual: 652800 } },
    SAR: { individual: { monthly: 98, annual: 941 }, team: { monthly: 196, annual: 1882 } },
    PLN: { individual: { monthly: 105, annual: 1008 }, team: { monthly: 210, annual: 2016 } },
    CZK: { individual: { monthly: 605, annual: 5808 }, team: { monthly: 1210, annual: 11616 } },
    // Tier 3 - Developing economies (50% margin)
    MYR: { individual: { monthly: 107, annual: 1027 }, team: { monthly: 214, annual: 2054 } },
    THB: { individual: { monthly: 830, annual: 7968 }, team: { monthly: 1660, annual: 15936 } },
    BRL: { individual: { monthly: 120, annual: 1152 }, team: { monthly: 240, annual: 2304 } },
    MXN: { individual: { monthly: 415, annual: 3984 }, team: { monthly: 830, annual: 7968 } },
    // Tier 4 - Lower-middle economies (50% margin)
    INR: { individual: { monthly: 1500, annual: 14400 }, team: { monthly: 3000, annual: 28800 } },
    PHP: { individual: { monthly: 1000, annual: 9600 }, team: { monthly: 2000, annual: 19200 } },
    IDR: { individual: { monthly: 285000, annual: 2736000 }, team: { monthly: 570000, annual: 5472000 } },
    ZAR: { individual: { monthly: 340, annual: 3264 }, team: { monthly: 680, annual: 6528 } },
    VND: { individual: { monthly: 450000, annual: 4320000 }, team: { monthly: 900000, annual: 8640000 } },
};

// Cache for detected country
let cachedCountry = null;
let cachedPricingInfo = null;

// Timezone to country mapping
const TIMEZONE_MAP = {
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

/**
 * Detect country from browser timezone (instant, no network)
 */
function detectCountryFromTimezone() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (TIMEZONE_MAP[timezone]) {
            return TIMEZONE_MAP[timezone];
        }

        // Try to extract country from timezone region
        const region = timezone.split('/')[0];
        if (region === 'America') return 'US';
        if (region === 'Europe') return 'GB';
        if (region === 'Asia') return 'SG';
        if (region === 'Australia') return 'AU';
        if (region === 'Africa') return 'ZA';
    } catch (error) {
        logger.warn('Timezone detection failed:', error);
    }

    return 'US';
}

/**
 * Detect user's country (instant via timezone)
 */
export async function detectCountry() {
    if (cachedCountry) return cachedCountry;

    // Check for URL parameter override (for testing)
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const countryParam = urlParams.get('country');
        if (countryParam && countryParam.length === 2) {
            cachedCountry = countryParam.toUpperCase();
            return cachedCountry;
        }
    }

    // Use timezone detection (instant)
    cachedCountry = detectCountryFromTimezone();
    return cachedCountry;
}

/**
 * Get pricing tier for a country
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
 * Get complete pricing information for user's detected location
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
 * Clear cached location data (useful for testing)
 */
export function clearPricingCache() {
    cachedCountry = null;
    cachedPricingInfo = null;
}

/**
 * Manually set country (for testing or user preference)
 */
export function setCountryOverride(countryCode) {
    cachedCountry = countryCode;
    cachedPricingInfo = null;
}

export default {
    PRICING_TIERS,
    LOCAL_CURRENCY_PRICES,
    detectCountry,
    getTierForCountry,
    getPricingForUser,
    clearPricingCache,
    setCountryOverride,
};
