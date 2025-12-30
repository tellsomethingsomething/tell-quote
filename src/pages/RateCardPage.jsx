import { useState, useRef, useEffect, useCallback } from 'react';
import { useRateCardStore, ITEM_TYPES, getItemTypeFromSection } from '../store/rateCardStore';
import { useQuoteStore } from '../store/quoteStore';
import { useKitStore } from '../store/kitStore';
import { useToast } from '../components/common/Toast';
import { FALLBACK_RATES } from '../data/currencies';

// Regions with their available currencies
const REGIONS = [
    { id: 'MALAYSIA', label: 'Malaysia', currencies: ['MYR'], defaultCurrency: 'MYR' },
    { id: 'SEA', label: 'SEA', currencies: ['USD', 'GBP'], defaultCurrency: 'USD' },
    { id: 'GULF', label: 'GCC', currencies: ['USD', 'GBP'], defaultCurrency: 'USD' },
    { id: 'CENTRAL_ASIA', label: 'Central Asia', currencies: ['USD', 'GBP'], defaultCurrency: 'USD' },
];

const CURRENCY_SYMBOLS = {
    MYR: 'RM',
    USD: '$',
    GBP: '£',
};

// Convert between currencies
const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
    if (!amount || fromCurrency === toCurrency) return amount;
    const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
    const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
};

export default function RateCardPage() {
    const { items, sections, addItem, updateItem, updateItemPricing, deleteItem, exportToCSV, importFromCSV, addSection, deleteSection, renameSection, moveSection, resetSectionsToDefaults, exportPublicRateCard } = useRateCardStore();
    const { rates } = useQuoteStore();
    const syncAllToRateCard = useKitStore(state => state.syncAllToRateCard);
    const kitItems = useKitStore(state => state.items);
    const toast = useToast();
    const [syncing, setSyncing] = useState(false);
    const fileInputRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const [selectedSection, setSelectedSection] = useState('all');
    const [selectedType, setSelectedType] = useState('all'); // 'all', 'service', 'equipment', 'expense'
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [showSaved, setShowSaved] = useState(false);
    const [savedField, setSavedField] = useState(null);

    // Per-region currency selection (for regions with multiple currencies)
    const [regionCurrencies, setRegionCurrencies] = useState({
        SEA: 'USD',
        GULF: 'USD',
        CENTRAL_ASIA: 'USD',
    });

    // Get display value for a region/field, converting if needed
    const getDisplayValue = (item, regionId, field) => {
        const region = REGIONS.find(r => r.id === regionId);
        const selectedCurrency = regionCurrencies[regionId] || region.defaultCurrency;
        const storedCurrency = item.pricing?.[regionId]?.[field]?.baseCurrency || region.defaultCurrency;
        const storedAmount = item.pricing?.[regionId]?.[field]?.amount;

        // If we have pricing, use it with currency conversion
        if (storedAmount !== undefined) {
            return convertCurrency(storedAmount, storedCurrency, selectedCurrency, rates);
        }

        return 0;
    };

    // Get base currency for a field
    const getBaseCurrency = (item, regionId, field) => {
        return item.pricing?.[regionId]?.[field]?.baseCurrency;
    };

    // Show saved indicator
    const triggerSaved = useCallback(() => {
        setShowSaved(true);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
    }, []);

    // New item form state
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        section: sections[0]?.id || 'other',
        unit: 'day',
    });

    // New Category state
    const [newCategoryName, setNewCategoryName] = useState('');

    // Bulk Markup state
    const [showBulkMarkup, setShowBulkMarkup] = useState(false);
    const [bulkMarkupCategory, setBulkMarkupCategory] = useState('all');
    const [bulkMarkupPercent, setBulkMarkupPercent] = useState(0);
    const [bulkMarkupFields, setBulkMarkupFields] = useState({ cost: true, charge: true });

    // Handle escape key to close modals
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (editingItem) setEditingItem(null);
                else if (showAddForm) setShowAddForm(false);
                else if (showAddCategoryForm) setShowAddCategoryForm(false);
                else if (showBulkMarkup) setShowBulkMarkup(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [editingItem, showAddForm, showAddCategoryForm]);

    // Cleanup save timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Open edit modal with item data
    const openEditModal = (item) => {
        setEditingItem({
            id: item.id,
            name: item.name,
            description: item.description || '',
            section: item.section,
            unit: item.unit || 'day',
        });
    };

    // Save edited item
    const handleSaveEdit = () => {
        if (!editingItem?.name.trim()) return;
        updateItem(editingItem.id, {
            name: editingItem.name,
            description: editingItem.description,
            section: editingItem.section,
            unit: editingItem.unit,
        });
        setEditingItem(null);
        triggerSaved();
    };

    // Filter items
    const filteredItems = items.filter(item => {
        const matchesSection = selectedSection === 'all' || item.section === selectedSection;
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        // Get item type - use stored itemType or infer from section
        const itemType = item.itemType || getItemTypeFromSection(item.section);
        const matchesType = selectedType === 'all' || itemType === selectedType;
        return matchesSection && matchesSearch && matchesType;
    });

    const handleAddItem = () => {
        if (!newItem.name.trim()) return;
        const created = addItem(newItem);
        setNewItem({ name: '', description: '', section: sections[0]?.id || 'other', unit: 'day' });
        setShowAddForm(false);
        setExpandedItemId(created.id);
        triggerSaved();
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        addSection(newCategoryName);
        setNewCategoryName('');
        setShowAddCategoryForm(false);
        triggerSaved();
    };

    // Handle pricing change with unified format
    const handlePricingChange = (itemId, regionId, field, value) => {
        const region = REGIONS.find(r => r.id === regionId);
        const selectedCurrency = regionCurrencies[regionId] || region.defaultCurrency;
        updateItemPricing(itemId, regionId, field, value, selectedCurrency);
        triggerSaved();
        setSavedField(`${itemId}-${regionId}-${field}`);
        setTimeout(() => setSavedField(null), 2000);
    };

    // Apply bulk markup to items
    const handleApplyBulkMarkup = () => {
        if (bulkMarkupPercent === 0) {
            toast.error('Please enter a markup percentage');
            return;
        }

        // Filter items by category
        const targetItems = bulkMarkupCategory === 'all'
            ? items
            : items.filter(item => item.section === bulkMarkupCategory);

        if (targetItems.length === 0) {
            toast.error('No items found in selected category');
            return;
        }

        const multiplier = 1 + (bulkMarkupPercent / 100);
        let updatedCount = 0;

        targetItems.forEach(item => {
            // Update each region's pricing
            REGIONS.forEach(region => {
                const regionId = region.id;
                const selectedCurrency = regionCurrencies[regionId] || region.defaultCurrency;

                if (bulkMarkupFields.cost) {
                    const currentCost = getDisplayValue(item, regionId, 'cost') || 0;
                    if (currentCost > 0) {
                        const newCost = Math.round(currentCost * multiplier * 100) / 100;
                        updateItemPricing(item.id, regionId, 'cost', newCost, selectedCurrency);
                    }
                }

                if (bulkMarkupFields.charge) {
                    const currentCharge = getDisplayValue(item, regionId, 'charge') || 0;
                    if (currentCharge > 0) {
                        const newCharge = Math.round(currentCharge * multiplier * 100) / 100;
                        updateItemPricing(item.id, regionId, 'charge', newCharge, selectedCurrency);
                    }
                }
            });
            updatedCount++;
        });

        toast.success(`Applied ${bulkMarkupPercent}% markup to ${updatedCount} items`);
        setShowBulkMarkup(false);
        setBulkMarkupPercent(0);
        triggerSaved();
    };

    // Sync all kit items to rate card
    const handleSyncFromKit = async () => {
        setSyncing(true);
        try {
            const result = await syncAllToRateCard();
            if (result.syncedCount > 0) {
                toast.success(`Synced ${result.syncedCount} kit items to rate card`);
                triggerSaved();
            } else {
                toast.info('No kit items with rates to sync');
            }
            if (result.errorCount > 0) {
                toast.warning(`${result.errorCount} items failed to sync`);
            }
        } catch (e) {
            toast.error('Failed to sync: ' + e.message);
        } finally {
            setSyncing(false);
        }
    };

    // Count kit items with rates that could be synced
    const kitItemsWithRates = kitItems.filter(i => i.dayRate || i.weekRate || i.monthRate).length;

    return (
        <div className="h-[calc(100vh-60px)] flex flex-col bg-dark-bg">
            {/* Header */}
            <div className="bg-dark-bg border-b border-dark-border p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-100">Rate Card</h1>
                            <p className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'service' : 'services'}</p>
                        </div>
                        {showSaved && (
                            <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Saved
                            </span>
                        )}
                        {/* Mobile Add Service Button */}
                        <button onClick={() => {
                            setNewItem({ name: '', description: '', section: sections[0]?.id || 'other', unit: 'day' });
                            setShowAddForm(true);
                        }} className="sm:hidden btn-primary text-sm">
                            + Add
                        </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    importFromCSV(file).then(res => {
                                        if (res.success) {
                                            toast.success(`Imported ${res.count} items successfully`);
                                            triggerSaved();
                                        } else {
                                            toast.error('Import failed: ' + res.error);
                                        }
                                    });
                                }
                                e.target.value = ''; // Reset
                            }}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-sm flex-shrink-0 hidden sm:flex">
                            Import CSV
                        </button>
                        <div className="relative group hidden sm:block">
                            <button className="btn-ghost text-sm flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                            </button>
                            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl z-20 min-w-52">
                                <button
                                    onClick={exportToCSV}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-dark-bg transition-colors"
                                >
                                    Full Rate Card (CSV)
                                </button>
                                <div className="border-t border-dark-border">
                                    <div className="px-4 py-1 text-xs text-gray-500">Public (Charges Only)</div>
                                    <button
                                        onClick={() => exportPublicRateCard('SEA')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-dark-bg transition-colors"
                                    >
                                        SEA Region
                                    </button>
                                    <button
                                        onClick={() => exportPublicRateCard('GULF')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-dark-bg transition-colors"
                                    >
                                        Gulf Region
                                    </button>
                                    <button
                                        onClick={() => exportPublicRateCard('CENTRAL_ASIA')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-dark-bg transition-colors"
                                    >
                                        Central Asia Region
                                    </button>
                                </div>
                            </div>
                        </div>
                        {kitItemsWithRates > 0 && (
                            <button
                                onClick={handleSyncFromKit}
                                disabled={syncing}
                                className="btn-ghost text-sm flex-shrink-0 hidden sm:flex items-center gap-1 text-brand-primary hover:text-brand-primary-light"
                                title={`Sync ${kitItemsWithRates} kit items with rates to rate card`}
                            >
                                <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {syncing ? 'Syncing...' : `Sync Kit (${kitItemsWithRates})`}
                            </button>
                        )}
                        <button
                            onClick={() => setShowBulkMarkup(true)}
                            className="btn-ghost text-sm flex-shrink-0 hidden sm:flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Bulk Markup
                        </button>
                        <button onClick={() => setShowAddCategoryForm(true)} className="btn-secondary text-sm flex-shrink-0">
                            <span className="hidden sm:inline">Manage </span>Categories
                        </button>
                        <button onClick={() => {
                            setNewItem({ name: '', description: '', section: sections[0]?.id || 'other', unit: 'day' });
                            setShowAddForm(true);
                        }} className="hidden sm:flex btn-primary text-sm flex-shrink-0">
                            + Add Service
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search services..."
                        className="input flex-1 sm:max-w-sm"
                    />
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="input w-full sm:w-40"
                    >
                        <option value="all">All Types</option>
                        <option value={ITEM_TYPES.SERVICE}>🧑‍💼 Services</option>
                        <option value={ITEM_TYPES.EQUIPMENT}>📦 Equipment</option>
                        <option value={ITEM_TYPES.EXPENSE}>💰 Expenses</option>
                    </select>
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="input w-full sm:w-48"
                    >
                        <option value="all">All Categories</option>
                        {sections.map(section => (
                            <option key={section.id} value={section.id}>{section.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Add Category Modal */}
            {showAddCategoryForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop" onClick={() => setShowAddCategoryForm(false)}>
                    <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl modal-content relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowAddCategoryForm(false)}
                            className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-bold text-gray-100 mb-4">Manage Categories</h2>

                        {/* New Category Input */}
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="New Category Name"
                                className="input flex-1"
                            />
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="btn-primary whitespace-nowrap"
                            >
                                Add
                            </button>
                        </div>

                        {/* Existing Categories List - Grouped */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Categories (synced with Quote subsections)</h3>
                            {/* Group sections by their group property */}
                            {(() => {
                                const groups = {};
                                sections.forEach((section, index) => {
                                    const groupName = section.group || 'Other';
                                    if (!groups[groupName]) groups[groupName] = [];
                                    groups[groupName].push({ ...section, originalIndex: index });
                                });
                                return Object.entries(groups).map(([groupName, groupSections]) => (
                                    <div key={groupName}>
                                        <h4 className="text-[10px] font-medium text-gray-600 uppercase mb-1 px-2">{groupName}</h4>
                                        <div className="space-y-1">
                                            {groupSections.map((section) => (
                                                <div key={section.id} className="flex items-center gap-2 p-2 bg-dark-bg/50 rounded hover:bg-dark-bg transition-colors group">
                                                    {/* Reorder buttons */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            onClick={() => { moveSection(section.id, 'up'); triggerSaved(); }}
                                                            disabled={section.originalIndex === 0}
                                                            className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move up"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => { moveSection(section.id, 'down'); triggerSaved(); }}
                                                            disabled={section.originalIndex === sections.length - 1}
                                                            className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move down"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {/* Editable name */}
                                                    <input
                                                        type="text"
                                                        value={section.name}
                                                        onChange={(e) => { renameSection(section.id, e.target.value); triggerSaved(); }}
                                                        className="flex-1 bg-transparent text-sm text-gray-300 focus:bg-dark-bg rounded px-2 py-1 border border-transparent focus:border-dark-border"
                                                    />

                                                    {/* Delete button */}
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Delete category "${section.name}"? Items will be moved to 'Other'.`)) {
                                                                deleteSection(section.id);
                                                                triggerSaved();
                                                            }
                                                        }}
                                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                        title="Delete Category"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-dark-border">
                            <button
                                onClick={async () => {
                                    if (confirm('Reset categories to sync with Quote subsections? This will replace all current categories.')) {
                                        await resetSectionsToDefaults();
                                        triggerSaved();
                                    }
                                }}
                                className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                            >
                                Sync with Quotes
                            </button>
                            <button onClick={() => setShowAddCategoryForm(false)} className="btn-ghost">Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop" onClick={() => setShowAddForm(false)}>
                    <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl modal-content relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-bold text-gray-100 mb-4">Add New Service</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Service Name *</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g. Camera Operator"
                                    className="input"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="label">Description</label>
                                <input
                                    type="text"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Optional description"
                                    className="input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Category</label>
                                    <select
                                        value={newItem.section}
                                        onChange={(e) => setNewItem({ ...newItem, section: e.target.value })}
                                        className="input"
                                    >
                                        {sections.map(section => (
                                            <option key={section.id} value={section.id}>{section.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Unit</label>
                                    <select
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                        className="input"
                                    >
                                        <option value="day">Per Day</option>
                                        <option value="item">Per Item</option>
                                        <option value="project">Per Project</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-border">
                            <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
                            <button onClick={handleAddItem} className="btn-primary">Add Service</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop" onClick={() => setEditingItem(null)}>
                    <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl modal-content relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setEditingItem(null)}
                            className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-bold text-gray-100 mb-4">Edit Service</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Service Name *</label>
                                <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="input"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="label">Description</label>
                                <input
                                    type="text"
                                    value={editingItem.description}
                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                    placeholder="Optional description"
                                    className="input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Category</label>
                                    <select
                                        value={editingItem.section}
                                        onChange={(e) => setEditingItem({ ...editingItem, section: e.target.value })}
                                        className="input"
                                    >
                                        {sections.map(section => (
                                            <option key={section.id} value={section.id}>{section.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Unit</label>
                                    <select
                                        value={editingItem.unit}
                                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                                        className="input"
                                    >
                                        <option value="day">Per Day</option>
                                        <option value="item">Per Item</option>
                                        <option value="project">Per Project</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-border">
                            <button onClick={() => setEditingItem(null)} className="btn-ghost">Cancel</button>
                            <button onClick={handleSaveEdit} className="btn-primary">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Markup Modal */}
            {showBulkMarkup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop" onClick={() => setShowBulkMarkup(false)}>
                    <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl modal-content relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowBulkMarkup(false)}
                            className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-bold text-gray-100 mb-4">Bulk Markup</h2>
                        <p className="text-sm text-gray-400 mb-4">Apply a percentage increase or decrease to multiple items at once.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Category</label>
                                <select
                                    value={bulkMarkupCategory}
                                    onChange={(e) => setBulkMarkupCategory(e.target.value)}
                                    className="input"
                                >
                                    <option value="all">All Categories ({items.length} items)</option>
                                    {sections.map(section => {
                                        const count = items.filter(i => i.section === section.id).length;
                                        return (
                                            <option key={section.id} value={section.id}>
                                                {section.name} ({count} items)
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="label">Markup Percentage</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={bulkMarkupPercent}
                                        onChange={(e) => setBulkMarkupPercent(parseFloat(e.target.value) || 0)}
                                        className="input"
                                        placeholder="e.g. 10 for 10% increase"
                                        step="0.1"
                                    />
                                    <span className="text-gray-400">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Use negative values to decrease prices (e.g. -10 for 10% discount)
                                </p>
                            </div>

                            <div>
                                <label className="label">Apply To</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={bulkMarkupFields.cost}
                                            onChange={(e) => setBulkMarkupFields({ ...bulkMarkupFields, cost: e.target.checked })}
                                            className="rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                        />
                                        <span className="text-sm text-gray-300">Cost</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={bulkMarkupFields.charge}
                                            onChange={(e) => setBulkMarkupFields({ ...bulkMarkupFields, charge: e.target.checked })}
                                            className="rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                        />
                                        <span className="text-sm text-gray-300">Charge</span>
                                    </label>
                                </div>
                            </div>

                            {bulkMarkupPercent !== 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                    <p className="text-sm text-amber-400">
                                        {bulkMarkupPercent > 0 ? 'Increase' : 'Decrease'} {bulkMarkupFields.cost && bulkMarkupFields.charge ? 'cost and charge' : bulkMarkupFields.cost ? 'cost only' : 'charge only'} by {Math.abs(bulkMarkupPercent)}% for {bulkMarkupCategory === 'all' ? 'all items' : sections.find(s => s.id === bulkMarkupCategory)?.name || bulkMarkupCategory}.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-border">
                            <button onClick={() => setShowBulkMarkup(false)} className="btn-ghost">Cancel</button>
                            <button
                                onClick={handleApplyBulkMarkup}
                                disabled={bulkMarkupPercent === 0 || (!bulkMarkupFields.cost && !bulkMarkupFields.charge)}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Apply Markup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredItems.length === 0 && !searchQuery ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No services yet</h3>
                        <p className="text-sm text-gray-600 mb-4">Add your rates and services to use in quotes</p>
                        <button onClick={() => setShowAddForm(true)} className="btn-primary">
                            + Add Service
                        </button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No matches found</h3>
                        <p className="text-sm text-gray-600">Try a different search term</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredItems.map(item => (
                            <div key={item.id} className="card">
                                {/* Item Header - Click to expand */}
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-200 font-medium truncate">{item.name}</span>
                                            <span className="text-xs text-gray-600 px-2 py-0.5 bg-dark-bg rounded flex-shrink-0">
                                                {sections.find(s => s.id === item.section)?.name || 'Other'}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(item);
                                            }}
                                            className="p-1 text-gray-600 hover:text-blue-400"
                                            title="Edit service"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete this service?')) {
                                                    deleteItem(item.id);
                                                    triggerSaved();
                                                }
                                            }}
                                            className="p-1 text-gray-600 hover:text-red-400"
                                            title="Delete service"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedItemId === item.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded: Regional Pricing */}
                                {expandedItemId === item.id && (
                                    <div className="mt-4 pt-4 border-t border-dark-border">
                                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Regional Pricing</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {REGIONS.map(region => {
                                                const selectedCurrency = regionCurrencies[region.id] || region.defaultCurrency;
                                                const symbol = CURRENCY_SYMBOLS[selectedCurrency];
                                                const hasMultipleCurrencies = region.currencies.length > 1;

                                                return (
                                                    <div key={region.id} className="bg-dark-bg rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-gray-400">
                                                                {region.label}
                                                            </p>
                                                            {/* Currency toggle for regions with multiple currencies */}
                                                            {hasMultipleCurrencies ? (
                                                                <div className="flex rounded overflow-hidden border border-dark-border">
                                                                    {region.currencies.map(curr => (
                                                                        <button
                                                                            key={curr}
                                                                            onClick={() => setRegionCurrencies(prev => ({ ...prev, [region.id]: curr }))}
                                                                            className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                                                                                selectedCurrency === curr
                                                                                    ? 'bg-accent-primary text-white'
                                                                                    : 'bg-dark-card text-gray-500 hover:text-white'
                                                                            }`}
                                                                        >
                                                                            {CURRENCY_SYMBOLS[curr]}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-600">{symbol}</span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-xs text-gray-600">Cost</label>
                                                                    {savedField === `${item.id}-${region.id}-cost` && (
                                                                        <span className="text-[10px] text-green-400">✓ Saved</span>
                                                                    )}
                                                                </div>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{symbol}</span>
                                                                    <input
                                                                        type="number"
                                                                        value={Math.round(getDisplayValue(item, region.id, 'cost') * 100) / 100 || ''}
                                                                        onChange={(e) => handlePricingChange(item.id, region.id, 'cost', e.target.value)}
                                                                        className="input text-sm pl-7"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                {getBaseCurrency(item, region.id, 'cost') && getBaseCurrency(item, region.id, 'cost') !== selectedCurrency && (
                                                                    <span className="text-[10px] text-amber-500/70">from {getBaseCurrency(item, region.id, 'cost')}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-xs text-gray-600">Charge</label>
                                                                    {savedField === `${item.id}-${region.id}-charge` && (
                                                                        <span className="text-[10px] text-green-400">✓ Saved</span>
                                                                    )}
                                                                </div>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{symbol}</span>
                                                                    <input
                                                                        type="number"
                                                                        value={Math.round(getDisplayValue(item, region.id, 'charge') * 100) / 100 || ''}
                                                                        onChange={(e) => handlePricingChange(item.id, region.id, 'charge', e.target.value)}
                                                                        className="input text-sm pl-7"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                {getBaseCurrency(item, region.id, 'charge') && getBaseCurrency(item, region.id, 'charge') !== selectedCurrency && (
                                                                    <span className="text-[10px] text-amber-500/70">from {getBaseCurrency(item, region.id, 'charge')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
