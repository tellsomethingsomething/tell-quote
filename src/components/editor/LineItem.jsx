import { useState, useRef, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { searchItems } from '../../data/pricingDatabase';
import { calculateLineTotal, calculateLineMargin, getMarginColor } from '../../utils/calculations';
import { formatCurrency, convertCurrency, getRegionCurrency, getCurrencySymbol } from '../../utils/currency';

export default function LineItem({ item, sectionId, subsectionName }) {
    const { quote, updateLineItem, deleteLineItem, rates } = useQuoteStore();
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    // Calculate totals
    const totals = calculateLineTotal(item);
    const margin = calculateLineMargin(item);
    const marginColor = getMarginColor(margin);

    // Convert for display
    const regionCurrency = getRegionCurrency(quote.region);
    const displayCharge = quote.region === 'MALAYSIA'
        ? totals.totalCharge
        : convertCurrency(totals.totalCharge, regionCurrency, quote.currency, rates);

    const handleChange = (field, value) => {
        updateLineItem(sectionId, subsectionName, item.id, { [field]: value });
    };

    const handleNameChange = (value) => {
        handleChange('name', value);
        if (value.length >= 2) {
            const results = searchItems(value);
            setSearchResults(results.slice(0, 5));
            setShowAutocomplete(results.length > 0);
            setSelectedIndex(-1);
        } else {
            setShowAutocomplete(false);
        }
    };

    const handleSelectItem = (dbItem) => {
        const pricing = dbItem.pricing?.[quote.region] || { cost: 0, charge: 0 };
        updateLineItem(sectionId, subsectionName, item.id, {
            name: dbItem.name,
            cost: pricing.cost,
            charge: pricing.charge,
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
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                    sectionId,
                    subsectionName,
                    itemId: item.id
                }));
                e.dataTransfer.effectAllowed = 'move';
            }}
            className="group bg-dark-card border border-dark-border rounded-lg p-2 hover:border-gray-700 transition-colors cursor-move"
            role="article"
            aria-label={`Line item: ${item.name || 'Unnamed item'}`}
        >
            <div className="flex flex-wrap items-center gap-2">
                {/* Item Name with Autocomplete */}
                <div className="relative flex-1 min-w-[180px]" ref={inputRef}>
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
                                    key={idx}
                                    onClick={() => handleSelectItem(result)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex justify-between items-center ${
                                        idx === selectedIndex ? 'bg-white/10' : ''
                                    }`}
                                    role="option"
                                    aria-selected={idx === selectedIndex}
                                >
                                    <span className="text-gray-200">{result.name}</span>
                                    <span className="text-xs text-gray-500">{result.subsection}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quantity */}
                <div className="w-16">
                    <label htmlFor={`quantity-${item.id}`} className="sr-only">
                        Quantity
                    </label>
                    <input
                        id={`quantity-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 1)}
                        min="1"
                        className="input-sm w-full text-left text-sm"
                        title="Quantity"
                        aria-label="Quantity"
                    />
                </div>

                {/* Days */}
                <div className="w-16">
                    <label htmlFor={`days-${item.id}`} className="sr-only">
                        Days
                    </label>
                    <input
                        id={`days-${item.id}`}
                        type="number"
                        value={item.days}
                        onChange={(e) => handleChange('days', parseFloat(e.target.value) || 1)}
                        min="0.5"
                        step="0.5"
                        className="input-sm w-full text-left text-sm"
                        title="Days"
                        aria-label="Number of days"
                    />
                </div>

                {/* Cost (internal) */}
                <div className="w-24 hidden lg:block relative">
                    <label htmlFor={`cost-${item.id}`} className="sr-only">
                        Cost per unit
                    </label>
                    <input
                        id={`cost-${item.id}`}
                        type="number"
                        value={item.cost}
                        onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="input-sm w-full text-left text-sm text-gray-500"
                        title="Cost"
                        aria-label={`Cost per unit in ${quote.currency}`}
                    />
                </div>

                {/* Charge */}
                <div className="w-24 relative">
                    <label htmlFor={`charge-${item.id}`} className="sr-only">
                        Charge per unit
                    </label>
                    <input
                        id={`charge-${item.id}`}
                        type="number"
                        value={item.charge}
                        onChange={(e) => handleChange('charge', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="input-sm w-full text-left text-sm"
                        title="Charge"
                        aria-label={`Charge per unit in ${quote.currency}`}
                    />
                </div>

                {/* Total */}
                <div className="w-24 text-right flex items-center justify-end" role="status" aria-live="polite" aria-label={`Total: ${formatCurrency(displayCharge, quote.currency)}`}>
                    <span className="text-sm font-semibold text-gray-100">
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
                <button
                    onClick={handleDelete}
                    className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete item"
                    aria-label={`Delete ${item.name || 'item'}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
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
