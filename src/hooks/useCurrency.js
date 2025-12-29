import { useState, useEffect } from 'react';
import { detectUserCurrency, currencyConfig } from '../data/pricing';

// Currency conversion rates (approximate, for demo display purposes)
const conversionRates = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
};

export function useCurrency() {
    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        setCurrency(detectUserCurrency());
    }, []);

    const config = currencyConfig[currency] || currencyConfig.USD;
    const rate = conversionRates[currency] || 1;

    // Format a price with currency symbol
    const formatPrice = (amount, options = {}) => {
        const { decimals = 0, showCode = false } = options;
        // Use proper decimal rounding instead of Math.round() to preserve precision
        const multiplier = Math.pow(10, decimals);
        const converted = Math.round(amount * rate * multiplier) / multiplier;
        const formatted = converted.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });

        const price = config.position === 'before'
            ? `${config.symbol}${formatted}`
            : `${formatted}${config.symbol}`;

        return showCode ? `${price} ${config.code}` : price;
    };

    // Format with "k" suffix for large numbers (e.g., $124k)
    const formatPriceShort = (amount) => {
        const converted = Math.round(amount * rate);
        if (converted >= 1000) {
            return `${config.symbol}${Math.round(converted / 1000)}k`;
        }
        return `${config.symbol}${converted.toLocaleString()}`;
    };

    // Format day rate (e.g., "$1,200/day" or "£950/day")
    const formatDayRate = (amount) => {
        const converted = Math.round(amount * rate);
        return `${config.symbol}${converted.toLocaleString()}/day`;
    };

    return {
        currency,
        symbol: config.symbol,
        formatPrice,
        formatPriceShort,
        formatDayRate,
    };
}

export default useCurrency;
