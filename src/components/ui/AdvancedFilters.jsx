import { useState, useRef, useEffect, useCallback } from 'react';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { Calendar, ChevronDown, X, Check, Filter, Search } from 'lucide-react';

/**
 * DateRangePicker - Select a date range with presets
 */
export function DateRangePicker({
    value = { start: null, end: null },
    onChange,
    className = '',
    placeholder = 'Select dates',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const presets = [
        { label: 'Today', getValue: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
        { label: 'Yesterday', getValue: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) },
        { label: 'Last 7 days', getValue: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }) },
        { label: 'Last 30 days', getValue: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }) },
        { label: 'This week', getValue: () => ({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) }) },
        { label: 'This month', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
        { label: 'This year', getValue: () => ({ start: startOfYear(new Date()), end: endOfDay(new Date()) }) },
    ];

    const handlePreset = (preset) => {
        const range = preset.getValue();
        onChange(range);
        setIsOpen(false);
    };

    const handleCustomApply = () => {
        if (customRange.start && customRange.end) {
            onChange({
                start: startOfDay(new Date(customRange.start)),
                end: endOfDay(new Date(customRange.end)),
            });
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        onChange({ start: null, end: null });
        setCustomRange({ start: '', end: '' });
    };

    const displayValue = value.start && value.end
        ? `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d, yyyy')}`
        : placeholder;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="input w-full flex items-center justify-between gap-2 text-left"
            >
                <span className={value.start ? 'text-gray-100' : 'text-gray-500'}>
                    {displayValue}
                </span>
                <div className="flex items-center gap-1">
                    {value.start && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            className="p-0.5 hover:bg-dark-border rounded"
                        >
                            <X className="w-3 h-3 text-gray-500" />
                        </button>
                    )}
                    <Calendar className="w-4 h-4 text-gray-500" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50 p-3">
                    <div className="space-y-1 mb-3">
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePreset(preset)}
                                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-dark-border text-gray-300 hover:text-white transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-dark-border pt-3">
                        <p className="text-xs text-gray-500 mb-2">Custom range</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                className="input text-sm"
                            />
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                className="input text-sm"
                            />
                        </div>
                        <button
                            onClick={handleCustomApply}
                            disabled={!customRange.start || !customRange.end}
                            className="btn-primary w-full text-sm py-1.5"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * MultiSelect - Select multiple options from a list
 */
export function MultiSelect({
    options = [],
    value = [],
    onChange,
    placeholder = 'Select...',
    className = '',
    searchable = true,
    maxDisplay = 3,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = search
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        )
        : options;

    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleSelectAll = () => {
        if (value.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(opt => opt.value));
        }
    };

    const getDisplayText = () => {
        if (value.length === 0) return placeholder;
        if (value.length === 1) {
            return options.find(opt => opt.value === value[0])?.label || value[0];
        }
        if (value.length <= maxDisplay) {
            return value.map(v => options.find(opt => opt.value === v)?.label || v).join(', ');
        }
        return `${value.length} selected`;
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="input w-full flex items-center justify-between gap-2 text-left"
            >
                <span className={value.length > 0 ? 'text-gray-100 truncate' : 'text-gray-500'}>
                    {getDisplayText()}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {value.length > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onChange([]); }}
                            className="p-0.5 hover:bg-dark-border rounded"
                        >
                            <X className="w-3 h-3 text-gray-500" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-dark-card border border-dark-border rounded-lg shadow-xl z-50">
                    {searchable && (
                        <div className="p-2 border-b border-dark-border">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="input w-full pl-8 py-1.5 text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {options.length > 3 && (
                        <button
                            onClick={handleSelectAll}
                            className="w-full text-left px-3 py-2 text-sm text-brand-primary hover:bg-dark-border border-b border-dark-border"
                        >
                            {value.length === options.length ? 'Deselect all' : 'Select all'}
                        </button>
                    )}

                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-gray-500">No options found</p>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleToggle(option.value)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-border text-left"
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                        value.includes(option.value)
                                            ? 'bg-brand-primary border-brand-primary'
                                            : 'border-gray-600'
                                    }`}>
                                        {value.includes(option.value) && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <span className={value.includes(option.value) ? 'text-white' : 'text-gray-300'}>
                                        {option.label}
                                    </span>
                                    {option.count !== undefined && (
                                        <span className="ml-auto text-xs text-gray-500">({option.count})</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * FilterBar - Combined filter bar with multiple filter types
 */
export function FilterBar({
    filters = [],
    values = {},
    onChange,
    className = '',
    onClearAll,
}) {
    const activeCount = Object.values(values).filter(v =>
        Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== ''
    ).length;

    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            {filters.map((filter) => {
                if (filter.type === 'dateRange') {
                    return (
                        <DateRangePicker
                            key={filter.key}
                            value={values[filter.key] || { start: null, end: null }}
                            onChange={(value) => onChange(filter.key, value)}
                            placeholder={filter.placeholder}
                            className="w-56"
                        />
                    );
                }

                if (filter.type === 'multiSelect') {
                    return (
                        <MultiSelect
                            key={filter.key}
                            options={filter.options}
                            value={values[filter.key] || []}
                            onChange={(value) => onChange(filter.key, value)}
                            placeholder={filter.placeholder}
                            searchable={filter.searchable}
                            className="w-48"
                        />
                    );
                }

                if (filter.type === 'select') {
                    return (
                        <select
                            key={filter.key}
                            value={values[filter.key] || ''}
                            onChange={(e) => onChange(filter.key, e.target.value)}
                            className="input w-40"
                        >
                            <option value="">{filter.placeholder}</option>
                            {filter.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    );
                }

                if (filter.type === 'search') {
                    return (
                        <div key={filter.key} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={values[filter.key] || ''}
                                onChange={(e) => onChange(filter.key, e.target.value)}
                                placeholder={filter.placeholder}
                                className="input pl-9 w-48"
                            />
                        </div>
                    );
                }

                return null;
            })}

            {activeCount > 0 && onClearAll && (
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
                >
                    <X className="w-4 h-4" />
                    Clear filters ({activeCount})
                </button>
            )}
        </div>
    );
}

/**
 * FilterChips - Display active filters as chips
 */
export function FilterChips({
    filters = [],
    values = {},
    onChange,
    className = '',
}) {
    const chips = [];

    filters.forEach((filter) => {
        const value = values[filter.key];

        if (filter.type === 'dateRange' && value?.start && value?.end) {
            chips.push({
                key: filter.key,
                label: `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d')}`,
                onRemove: () => onChange(filter.key, { start: null, end: null }),
            });
        }

        if (filter.type === 'multiSelect' && value?.length > 0) {
            value.forEach((v) => {
                const option = filter.options.find(opt => opt.value === v);
                chips.push({
                    key: `${filter.key}-${v}`,
                    label: option?.label || v,
                    category: filter.label,
                    onRemove: () => onChange(filter.key, value.filter(x => x !== v)),
                });
            });
        }

        if (filter.type === 'select' && value) {
            const option = filter.options.find(opt => opt.value === value);
            chips.push({
                key: filter.key,
                label: option?.label || value,
                category: filter.label,
                onRemove: () => onChange(filter.key, ''),
            });
        }

        if (filter.type === 'search' && value) {
            chips.push({
                key: filter.key,
                label: `"${value}"`,
                category: 'Search',
                onRemove: () => onChange(filter.key, ''),
            });
        }
    });

    if (chips.length === 0) return null;

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-dark-border rounded-full text-xs"
                >
                    {chip.category && (
                        <span className="text-gray-500">{chip.category}:</span>
                    )}
                    <span className="text-gray-200">{chip.label}</span>
                    <button
                        onClick={chip.onRemove}
                        className="p-0.5 hover:bg-white/10 rounded-full"
                    >
                        <X className="w-3 h-3 text-gray-400" />
                    </button>
                </span>
            ))}
        </div>
    );
}

/**
 * useFilters - Hook to manage filter state
 */
export function useFilters(initialFilters = {}) {
    const [filters, setFilters] = useState(initialFilters);

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    const hasActiveFilters = Object.values(filters).some(v =>
        Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== '' && !(v.start === null && v.end === null)
    );

    return {
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        hasActiveFilters,
    };
}

export default {
    DateRangePicker,
    MultiSelect,
    FilterBar,
    FilterChips,
    useFilters,
};
