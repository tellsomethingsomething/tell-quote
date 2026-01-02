import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * Custom Country Select dropdown with search functionality
 * Properly styled for dark mode with accessible keyboard navigation
 */
export default function CountrySelect({
    value,
    onChange,
    countries, // Array of { code, name }
    placeholder = 'Select country',
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Find selected country name
    const selectedCountry = countries.find(c => c.code === value);

    // Filter countries based on search
    const filteredCountries = search
        ? countries.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase())
        )
        : countries;

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current && filteredCountries.length > 0) {
            const highlightedElement = listRef.current.children[highlightedIndex];
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen, filteredCountries.length]);

    // Reset highlighted index when search changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [search]);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredCountries.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCountries[highlightedIndex]) {
                    handleSelect(filteredCountries[highlightedIndex].code);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearch('');
                break;
            case 'Tab':
                setIsOpen(false);
                setSearch('');
                break;
        }
    };

    const handleSelect = (code) => {
        onChange(code);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={`
                    input w-full text-left flex items-center justify-between gap-2
                    ${!selectedCountry ? 'text-gray-500' : 'text-gray-100'}
                `}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">
                    {selectedCountry ? selectedCountry.name : placeholder}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-white/10 rounded"
                            aria-label="Clear selection"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-dark-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search countries..."
                                className="w-full bg-dark-bg border border-dark-border rounded-md pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <ul
                        ref={listRef}
                        role="listbox"
                        className="max-h-60 overflow-y-auto py-1"
                        aria-label="Countries"
                    >
                        {filteredCountries.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-500 text-center">
                                No countries found
                            </li>
                        ) : (
                            filteredCountries.map((country, index) => (
                                <li
                                    key={country.code}
                                    role="option"
                                    aria-selected={value === country.code}
                                    onClick={() => handleSelect(country.code)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`
                                        px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                                        ${index === highlightedIndex ? 'bg-brand-primary/20' : 'hover:bg-white/5'}
                                        ${value === country.code ? 'text-brand-primary' : 'text-gray-200'}
                                    `}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-gray-500 text-xs w-8">{country.code}</span>
                                        <span>{country.name}</span>
                                    </span>
                                    {value === country.code && (
                                        <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
