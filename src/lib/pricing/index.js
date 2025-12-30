/**
 * Unified Pricing Module
 *
 * Consolidates all pricing-related logic:
 * - Currency definitions and formatting
 * - Exchange rates
 * - PPP (Purchasing Power Parity) tiers
 * - Country/region detection
 *
 * Usage:
 *   import { formatCurrency, getPricingForUser, CURRENCIES } from '../lib/pricing';
 */

// Currency exports
export {
    CURRENCIES,
    FALLBACK_RATES,
    COUNTRY_CURRENCIES,
    getCurrency,
    getCurrencySymbol,
    getCurrencyForCountry,
    formatCurrency,
} from './currencies';

// PPP exports
export {
    PRICING_TIERS,
    LOCAL_CURRENCY_PRICES,
    detectCountry,
    getTierForCountry,
    getPricingForUser,
    clearPricingCache,
    setCountryOverride,
} from './ppp';

// Re-export defaults for convenience
import currencyDefaults from './currencies';
import pppDefaults from './ppp';

export default {
    ...currencyDefaults,
    ...pppDefaults,
};
