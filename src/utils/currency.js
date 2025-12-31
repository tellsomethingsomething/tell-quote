import { FALLBACK_RATES, CURRENCIES } from '../data/currencies';
import logger from './logger';

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
        logger.warn('Failed to read cached rates:', e);
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
        logger.warn('Failed to cache rates:', e);
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
        logger.warn('Failed to fetch live rates, using fallback:', e);
        return { rates: FALLBACK_RATES, timestamp: null };
    }
}

// Convert amount from one currency to another
export function convertCurrency(amount, fromCurrency, toCurrency, rates = {}) {
    if (fromCurrency === toCurrency) return amount;
    if (!amount || isNaN(amount)) return 0;

    // Get rates with fallbacks, explicitly guard against zero/invalid values
    let fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
    let toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;

    // CRITICAL: Prevent division by zero - if rate is 0 or negative, use 1
    if (fromRate <= 0 || !isFinite(fromRate)) {
        logger.warn(`Invalid fromRate for ${fromCurrency}: ${fromRate}, using 1`);
        fromRate = 1;
    }
    if (toRate <= 0 || !isFinite(toRate)) {
        logger.warn(`Invalid toRate for ${toCurrency}: ${toRate}, using 1`);
        toRate = 1;
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const result = usdAmount * toRate;

    // Ensure we never return NaN or Infinity
    if (!isFinite(result)) {
        logger.warn(`Currency conversion resulted in non-finite value: ${result}`);
        return 0;
    }

    // Round to 2 decimal places to avoid floating point precision issues
    // e.g., 99.99999999997 becomes 100.00
    return Math.round(result * 100) / 100;
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

    // Handle invalid amounts
    const safeAmount = (amount === null || amount === undefined || isNaN(amount)) ? 0 : amount;

    if (!currency) {
        return `${safeAmount.toFixed(decimals)}`;
    }

    // Handle special case for currencies with no decimals (like IDR)
    const actualDecimals = currencyCode === 'IDR' ? 0 : decimals;

    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: actualDecimals,
        maximumFractionDigits: actualDecimals,
    }).format(safeAmount);

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
