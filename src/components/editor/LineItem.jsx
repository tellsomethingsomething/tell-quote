import { useState, useRef, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useRateCardStore } from '../../store/rateCardStore';
import { calculateLineTotal, calculateLineMargin, getMarginColor } from '../../utils/calculations';
import { formatCurrency, convertCurrency, getRegionCurrency, getCurrencySymbol } from '../../utils/currency';

export default function LineItem({ item, sectionId, subsectionName }) {
    const { quote, updateLineItem, deleteLineItem, rates } = useQuoteStore();
    const { items: rateCardItems, sections: rateCardSections } = useRateCardStore();
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    // Calculate totals
    const totals = calculateLineTotal(item);
    const margin = calculateLineMargin(item);
    const marginColor = getMarginColor(margin);

    // Check if item is linked to rate card and if pricing differs
    const linkedRateCardItem = item.rateCardItemId
        ? rateCardItems.find(rc => rc.id === item.rateCardItemId)
        : null;

    const getRateCardPricing = () => {
        if (!linkedRateCardItem) return null;
        const regionPricing = linkedRateCardItem?.pricing?.[quote.region];
        return {
            cost: regionPricing?.cost?.amount ?? 0,
            charge: regionPricing?.charge?.amount ?? 0,
        };
    };

    const rateCardPricing = getRateCardPricing();
    const priceDiffers = rateCardPricing && (
        item.cost !== rateCardPricing.cost || item.charge !== rateCardPricing.charge
    );

    const handleRefreshFromRateCard = () => {
        if (rateCardPricing) {
            updateLineItem(sectionId, subsectionName, item.id, {
                cost: rateCardPricing.cost,
                charge: rateCardPricing.charge,
            });
        }
    };

    // Convert for display
    const regionCurrency = getRegionCurrency(quote.region);
    const displayCharge = quote.region === 'MALAYSIA'
        ? totals.totalCharge
        : convertCurrency(totals.totalCharge, regionCurrency, quote.currency, rates);

    const handleChange = (field, value) => {
        updateLineItem(sectionId, subsectionName, item.id, { [field]: value });
    };

    // Search Rate Card items
    const searchRateCard = (query) => {
        const searchLower = query.toLowerCase();
        return rateCardItems.filter(rcItem =>
            rcItem.name.toLowerCase().includes(searchLower)
        ).slice(0, 8);
    };

    const handleNameChange = (value) => {
        handleChange('name', value);
        if (value.length >= 2) {
            const results = searchRateCard(value);
            setSearchResults(results);
            setShowAutocomplete(results.length > 0);
            setSelectedIndex(-1);
        } else {
            setShowAutocomplete(false);
        }
    };

    // Get section name for display
    const getSectionName = (sectionId) => {
        const section = rateCardSections.find(s => s.id === sectionId);
        return section?.name || sectionId;
    };

    const handleSelectItem = (rcItem) => {
        // Read from unified pricing format
        const regionPricing = rcItem?.pricing?.[quote.region];
        const cost = regionPricing?.cost?.amount ?? 0;
        const charge = regionPricing?.charge?.amount ?? 0;

        updateLineItem(sectionId, subsectionName, item.id, {
            name: rcItem.name,
            cost,
            charge,
            rateCardItemId: rcItem.id,
        });
        setShowAutocomplete(false);
        setSelectedIndex(-1);
    };

    const handleDelete = () => {
        deleteLineItem(sectionId, subsectionName, item.id);
    };

    // Keyboard navigation for autocomplete
    const handleKeyDown = (e) => {
        if (!showAutocomplete) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : searchResults.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && searchResults[selectedIndex]) {
                    handleSelectItem(searchResults[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowAutocomplete(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    // Close autocomplete on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                setShowAutocomplete(false);
                setSelectedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            draggable={!quote.isLocked}
            onDragStart={(e) => {
                if (quote.isLocked) return;
                e.dataTransfer.setData('application/json', JSON.stringify({
                    sectionId,
                    subsectionName,
                    itemId: item.id
                }));
                e.dataTransfer.effectAllowed = 'move';
            }}
            className={`group bg-dark-card border border-dark-border rounded-lg p-2 hover:border-gray-700 transition-colors ${quote.isLocked ? 'cursor-default opacity-75' : 'cursor-move'}`}
            role="article"
            aria-label={`Line item: ${item.name || 'Unnamed item'}`}
        >
            <div className="flex flex-wrap items-center gap-2">
                {/* Item Name with Autocomplete */}
                <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]" ref={inputRef}>
                    <label htmlFor={`item-name-${item.id}`} className="sr-only">
                        Item name
                    </label>
                    <input
                        id={`item-name-${item.id}`}
                        type="text"
                        value={item.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Item name..."
                        className="input-sm w-full text-sm"
                        aria-autocomplete="list"
                        aria-controls={showAutocomplete ? `autocomplete-${item.id}` : undefined}
                        aria-expanded={showAutocomplete}
                        disabled={quote.isLocked}
                    />

                    {/* Autocomplete Dropdown */}
                    {showAutocomplete && (
                        <div
                            id={`autocomplete-${item.id}`}
                            className="absolute z-20 top-full left-0 right-0 mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden"
                            role="listbox"
                            aria-label="Item suggestions"
                        >
                            {searchResults.map((result, idx) => (
                                <button
                                    key={result.id || idx}
                                    onClick={() => handleSelectItem(result)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex justify-between items-center ${
                                        idx === selectedIndex ? 'bg-white/10' : ''
                                    }`}
                                    role="option"
                                    aria-selected={idx === selectedIndex}
                                >
                                    <span className="text-gray-200">{result.name}</span>
                                    <span className="text-xs text-gray-500">{getSectionName(result.section)}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Price Differs Indicator */}
                    {priceDiffers && !quote.isLocked && (
                        <button
                            onClick={handleRefreshFromRateCard}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
                            title={`Price differs from rate card (Cost: ${getCurrencySymbol(quote.currency)}${rateCardPricing.cost}, Charge: ${getCurrencySymbol(quote.currency)}${rateCardPricing.charge}). Click to refresh.`}
                            aria-label="Refresh price from rate card"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Quantity */}
                <div className="w-16 sm:w-18 md:w-20">
                    <label htmlFor={`quantity-${item.id}`} className="sr-only">
                        Quantity
                    </label>
                    <input
                        id={`quantity-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleChange('quantity', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        onBlur={(e) => { if (e.target.value === '' || isNaN(item.quantity)) handleChange('quantity', 1); }}
                        onFocus={(e) => e.target.select()}
                        min="0.01"
                        step="0.5"
                        className="input-sm w-full text-left text-sm"
                        title="Qty"
                        aria-label="Quantity"
                        placeholder="Qty"
                        disabled={quote.isLocked}
                    />
                </div>

                {/* Days */}
                <div className="w-16 sm:w-18 md:w-20">
                    <label htmlFor={`days-${item.id}`} className="sr-only">
                        Days
                    </label>
                    <input
                        id={`days-${item.id}`}
                        type="number"
                        value={item.days}
                        onChange={(e) => handleChange('days', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        onBlur={(e) => { if (e.target.value === '' || isNaN(item.days)) handleChange('days', 1); }}
                        onFocus={(e) => e.target.select()}
                        min="0.5"
                        step="0.5"
                        className="input-sm w-full text-left text-sm"
                        title="Days"
                        aria-label="Number of days"
                        placeholder="Days"
                        disabled={quote.isLocked}
                    />
                </div>

                {/* Cost (internal) - visible on tablet and larger */}
                <div className="w-24 hidden md:block relative">
                    <label htmlFor={`cost-${item.id}`} className="sr-only">
                        Cost per unit
                    </label>
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">{getCurrencySymbol(quote.currency)}</span>
                        <input
                            id={`cost-${item.id}`}
                            type="number"
                            value={item.cost}
                            onChange={(e) => handleChange('cost', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            onBlur={(e) => { if (e.target.value === '' || isNaN(item.cost)) handleChange('cost', 0); }}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            className="input-sm w-full pl-6 text-left text-sm text-gray-500"
                            title="Cost"
                            aria-label={`Cost per unit in ${quote.currency}`}
                            disabled={quote.isLocked}
                        />
                    </div>
                </div>

                {/* Charge */}
                <div className="w-20 sm:w-24 relative">
                    <label htmlFor={`charge-${item.id}`} className="sr-only">
                        Charge per unit
                    </label>
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{getCurrencySymbol(quote.currency)}</span>
                        <input
                            id={`charge-${item.id}`}
                            type="number"
                            value={item.charge}
                            onChange={(e) => handleChange('charge', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            onBlur={(e) => { if (e.target.value === '' || isNaN(item.charge)) handleChange('charge', 0); }}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            className="input-sm w-full pl-5 sm:pl-6 text-left text-sm"
                            title="Charge"
                            aria-label={`Charge per unit in ${quote.currency}`}
                            disabled={quote.isLocked}
                        />
                    </div>
                </div>

                {/* Total */}
                <div className="w-20 sm:w-24 text-right flex items-center justify-end" role="status" aria-live="polite" aria-label={`Total: ${formatCurrency(displayCharge, quote.currency)}`}>
                    <span className="text-xs sm:text-sm font-semibold text-gray-100">
                        {formatCurrency(displayCharge, quote.currency)}
                    </span>
                </div>

                {/* Margin */}
                <div className="w-14 text-right hidden lg:flex items-center justify-end" role="status" aria-live="polite" aria-label={`Margin: ${margin.toFixed(0)}%`}>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${margin >= 30 ? 'bg-green-500/10 text-green-400' : margin >= 15 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                        {margin.toFixed(0)}%
                    </span>
                </div>

                {/* Delete */}
                {!quote.isLocked && (
                <button
                    onClick={handleDelete}
                    className="p-2 min-w-[36px] min-h-[36px] text-gray-600 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Delete item"
                    aria-label={`Delete ${item.name || 'item'}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
                )}
            </div>

            {/* Mobile: Show additional info */}
            <div className="flex lg:hidden items-center justify-between mt-2 pt-2 border-t border-dark-border text-xs text-gray-500">
                <span aria-label={`Cost: ${getCurrencySymbol(quote.currency)}${item.cost}`}>
                    Cost: {getCurrencySymbol(quote.currency)}{item.cost}
                </span>
                <span className={marginColor} aria-label={`Margin: ${margin.toFixed(0)}%`}>
                    Margin: {margin.toFixed(0)}%
                </span>
            </div>
        </div>
    );
}
