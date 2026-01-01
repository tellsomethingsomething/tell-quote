import { useSettingsStore } from '../store/settingsStore';
import { useQuoteStore } from '../store/quoteStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { CURRENCIES } from '../data/currencies';

/**
 * Hook for accessing and managing the app-wide display currency.
 * Provides currency formatting and conversion utilities.
 */
export function useDisplayCurrency() {
    const displayCurrency = useSettingsStore(s => s.settings.displayCurrency) || 'USD';
    const setDisplayCurrency = useSettingsStore(s => s.setDisplayCurrency);
    const preferredCurrencies = useSettingsStore(s => s.settings.preferredCurrencies) || ['USD', 'EUR', 'GBP'];
    const rates = useQuoteStore(s => s.rates) || {};

    // Get currency config (symbol, name, etc.)
    const currencyConfig = CURRENCIES[displayCurrency] || CURRENCIES.USD;

    return {
        // Current display currency code (e.g., 'USD', 'GBP')
        currency: displayCurrency,

        // Currency symbol (e.g., '$', '£')
        symbol: currencyConfig.symbol,

        // Full currency name (e.g., 'US Dollar')
        name: currencyConfig.name,

        // Setter to change display currency
        setCurrency: setDisplayCurrency,

        // User's preferred currencies for quick selection
        preferredCurrencies,

        // Current exchange rates
        rates,

        // Format an amount in the display currency
        format: (amount, options = {}) => formatCurrency(amount, displayCurrency, options),

        // Convert an amount from another currency to the display currency
        convert: (amount, fromCurrency) => convertCurrency(amount, fromCurrency, displayCurrency, rates),

        // Convert and format in one call
        convertAndFormat: (amount, fromCurrency, options = {}) => {
            const converted = convertCurrency(amount, fromCurrency, displayCurrency, rates);
            return formatCurrency(converted, displayCurrency, options);
        },
    };
}

export default useDisplayCurrency;
