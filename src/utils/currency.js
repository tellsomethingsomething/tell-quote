import { FALLBACK_RATES, CURRENCIES } from '../data/currencies';

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Get cached rates
function getCachedRates() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { rates, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                return { rates, timestamp };
            }
        }
    } catch (e) {
        console.warn('Failed to read cached rates:', e);
    }
    return null;
}

// Cache rates
function cacheRates(rates) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            rates,
            timestamp: Date.now(),
        }));
    } catch (e) {
        console.warn('Failed to cache rates:', e);
    }
}

// Fetch live rates from ExchangeRate-API
export async function fetchLiveRates() {
    const cached = getCachedRates();
    if (cached) {
        return cached;
    }

    try {
        // Using free tier of ExchangeRate-API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) throw new Error('Failed to fetch rates');

        const data = await response.json();
        const rates = {};

        // Extract only the currencies we need
        Object.keys(CURRENCIES).forEach(code => {
            rates[code] = data.rates[code] || FALLBACK_RATES[code];
        });

        cacheRates(rates);
        return { rates, timestamp: Date.now() };
    } catch (e) {
        console.warn('Failed to fetch live rates, using fallback:', e);
        return { rates: FALLBACK_RATES, timestamp: null };
    }
}

// Convert amount from one currency to another
export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency];
    const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency];

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
}

// Convert from USD to target currency
export function convertFromUSD(amount, currency, rates) {
    return convertCurrency(amount, 'USD', currency, rates);
}

// Convert to USD from source currency
export function convertToUSD(amount, currency, rates) {
    return convertCurrency(amount, currency, 'USD', rates);
}

// Format currency for display
export function formatCurrency(amount, currencyCode, options = {}) {
    const { showSymbol = true, decimals = 2 } = options;
    const currency = CURRENCIES[currencyCode];

    if (!currency) {
        return `${amount.toFixed(decimals)}`;
    }

    // Handle special case for currencies with no decimals (like IDR)
    const actualDecimals = currencyCode === 'IDR' ? 0 : decimals;

    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: actualDecimals,
        maximumFractionDigits: actualDecimals,
    }).format(amount);

    if (showSymbol) {
        return `${currency.symbol}${formattedAmount}`;
    }

    return formattedAmount;
}

// Get the currency for a region
export function getRegionCurrency(regionId) {
    const regionCurrencies = {
        MALAYSIA: 'MYR',
        SEA: 'USD',
        GULF: 'USD',
        CENTRAL_ASIA: 'USD',
    };
    return regionCurrencies[regionId] || 'USD';
}

// Get currency symbol
export function getCurrencySymbol(currencyCode) {
    return CURRENCIES[currencyCode]?.symbol || currencyCode;
}
