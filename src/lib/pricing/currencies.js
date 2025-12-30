/**
 * Currency Definitions
 * Single source of truth for all currency-related data
 */

// Currency definitions with display info
export const CURRENCIES = {
    // Major World Currencies
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before', decimals: 2 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'before', decimals: 2 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before', decimals: 2 },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'before', decimals: 0 },
    CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', position: 'before', decimals: 2 },

    // Asia Pacific
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'before', decimals: 2 },
    NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', position: 'before', decimals: 2 },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'before', decimals: 2 },
    HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', position: 'before', decimals: 2 },
    TWD: { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', position: 'before', decimals: 0 },
    KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', position: 'before', decimals: 0 },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'before', decimals: 0 },
    MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', position: 'before', decimals: 2 },
    THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', position: 'before', decimals: 0 },
    IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', position: 'before', decimals: 0, separator: '.' },
    PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', position: 'before', decimals: 0 },
    VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', position: 'after', decimals: 0 },
    CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', position: 'before', decimals: 2 },

    // Middle East
    AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', position: 'before', decimals: 0 },
    SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', position: 'before', decimals: 0 },
    QAR: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', position: 'before', decimals: 0 },
    KWD: { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', position: 'before', decimals: 2 },
    ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', position: 'before', decimals: 0 },

    // Europe (non-Euro)
    SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', position: 'after', decimals: 0 },
    NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', position: 'after', decimals: 0 },
    DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', position: 'after', decimals: 0 },
    PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', position: 'after', decimals: 2 },
    CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', position: 'after', decimals: 0 },

    // Americas
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', position: 'before', decimals: 2 },
    MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', position: 'before', decimals: 0 },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', position: 'before', decimals: 2 },

    // Africa
    ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', position: 'before', decimals: 0 },
};

// Fallback exchange rates (used when API unavailable) - rates vs USD
export const FALLBACK_RATES = {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149, CHF: 0.88,
    AUD: 1.53, NZD: 1.67, SGD: 1.34, HKD: 7.82, TWD: 31.5, KRW: 1320,
    INR: 83.2, MYR: 4.47, THB: 34.5, IDR: 15850, PHP: 55.8, VND: 24500,
    CNY: 7.24,
    AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, ILS: 3.65,
    SEK: 10.5, NOK: 10.8, DKK: 6.88, PLN: 4.02, CZK: 23.2,
    CAD: 1.36, MXN: 17.2, BRL: 4.97,
    ZAR: 18.7,
};

// Country to currency mapping
export const COUNTRY_CURRENCIES = {
    // Tier 1 - Full price
    US: 'USD', CA: 'USD',
    GB: 'GBP',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
    AT: 'EUR', IE: 'EUR', FI: 'EUR', PT: 'EUR', LU: 'EUR',
    AU: 'AUD',
    JP: 'JPY',
    CH: 'CHF',
    NO: 'NOK', SE: 'SEK', DK: 'DKK',
    SG: 'SGD',
    AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD',
    IL: 'ILS',
    NZ: 'NZD',
    HK: 'HKD',
    TW: 'TWD',
    // Tier 2+
    KR: 'KRW',
    MY: 'MYR',
    TH: 'THB',
    MX: 'MXN',
    BR: 'BRL',
    PL: 'PLN', CZ: 'CZK',
    IN: 'INR',
    ID: 'IDR',
    PH: 'PHP',
    VN: 'VND',
    ZA: 'ZAR',
};

/**
 * Get currency definition by code
 */
export function getCurrency(code) {
    return CURRENCIES[code] || CURRENCIES.USD;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code) {
    return CURRENCIES[code]?.symbol || code;
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(countryCode) {
    return COUNTRY_CURRENCIES[countryCode] || 'USD';
}

/**
 * Format amount with currency
 */
export function formatCurrency(amount, currencyCode, options = {}) {
    const { showSymbol = true } = options;
    const currency = getCurrency(currencyCode);
    const safeAmount = (amount === null || amount === undefined || isNaN(amount)) ? 0 : amount;

    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals,
    }).format(safeAmount);

    if (!showSymbol) return formattedAmount;

    if (currency.position === 'after') {
        return `${formattedAmount}${currency.symbol}`;
    }
    return `${currency.symbol}${formattedAmount}`;
}

export default {
    CURRENCIES,
    FALLBACK_RATES,
    COUNTRY_CURRENCIES,
    getCurrency,
    getCurrencySymbol,
    getCurrencyForCountry,
    formatCurrency,
};
