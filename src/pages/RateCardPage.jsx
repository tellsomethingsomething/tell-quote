import { useState, useRef, useEffect } from 'react';
import { useRateCardStore } from '../store/rateCardStore';

const REGIONS = [
    { id: 'MALAYSIA', label: 'Malaysia', currency: 'MYR', symbol: 'RM' },
    { id: 'SEA', label: 'SEA', currency: 'USD', symbol: '$' },
    { id: 'GULF', label: 'GCC', currency: 'USD', symbol: '$' },
    { id: 'CENTRAL_ASIA', label: 'Central Asia', currency: 'USD', symbol: '$' },
];

export default function RateCardPage({ onBack }) {
    const { items, sections, addItem, updateItem, updateItemPricing, deleteItem, exportToCSV, importFromCSV, exportTemplate, addSection, deleteSection, renameSection, moveSection, seedRateCard } = useRateCardStore();
    const fileInputRef = useRef(null);
    const [selectedSection, setSelectedSection] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // New item form state
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        section: sections[0]?.id || 'other',
        unit: 'day',
    });

    // New Category state
    const [newCategoryName, setNewCategoryName] = useState('');

    // Handle escape key to close modals
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (editingItem) setEditingItem(null);
                else if (showAddForm) setShowAddForm(false);
                else if (showAddCategoryForm) setShowAddCategoryForm(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [editingItem, showAddForm, showAddCategoryForm]);

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
    };

    // Filter items
    const filteredItems = items.filter(item => {
        const matchesSection = selectedSection === 'all' || item.section === selectedSection;
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSection && matchesSearch;
    });

    const handleAddItem = () => {
        if (!newItem.name.trim()) return;
        const created = addItem(newItem);
        setNewItem({ name: '', description: '', section: sections[0]?.id || 'other', unit: 'day' });
        setShowAddForm(false);
        setExpandedItemId(created.id);
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        addSection(newCategoryName);
        setNewCategoryName('');
        setShowAddCategoryForm(false);
    };

    const handlePricingChange = (itemId, region, field, value) => {
        updateItemPricing(itemId, region, { [field]: parseFloat(value) || 0 });
    };

    return (
        <div className="h-[calc(100vh-60px)] flex flex-col bg-dark-bg">
            {/* Header */}
            <div className="bg-dark-bg border-b border-dark-border p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-100">Rate Card</h1>
                            <p className="text-xs text-gray-500">{items.length} services</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    importFromCSV(file).then(res => {
                                        if (res.success) alert(`Imported ${res.count} items successfully`);
                                        else alert('Import failed: ' + res.error);
                                    });
                                }
                                e.target.value = ''; // Reset
                            }}
                        />
                        <button
                            onClick={() => {
                                const result = seedRateCard();
                                if (result.added > 0) {
                                    alert(`Added ${result.added} default services!`);
                                } else {
                                    alert(result.message || 'Default services already loaded');
                                }
                            }}
                            className="btn-ghost text-sm"
                            title="Load default services from Tell Productions rate card"
                        >
                            Load Defaults
                        </button>
                        <button onClick={exportTemplate} className="btn-ghost text-sm" title="Download a blank CSV template to fill in">
                            Download Template
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-sm">
                            Import CSV
                        </button>
                        <button onClick={exportToCSV} className="btn-ghost text-sm">
                            Export Data
                        </button>
                        <button onClick={() => setShowAddCategoryForm(true)} className="btn-secondary text-sm">
                            Manage Categories
                        </button>
                        <button onClick={() => {
                            setNewItem({ name: '', description: '', section: sections[0]?.id || 'other', unit: 'day' });
                            setShowAddForm(true);
                        }} className="btn-primary text-sm">
                            + Add Service
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search services..."
                        className="input flex-1 max-w-sm"
                    />
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="input w-48"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md modal-backdrop" onClick={() => setShowAddCategoryForm(false)}>
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl modal-content relative" onClick={e => e.stopPropagation()}>
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

                        {/* Existing Categories List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Existing Categories</h3>
                            {sections.map((section, index) => (
                                <div key={section.id} className="flex items-center gap-2 p-2 bg-dark-bg/50 rounded hover:bg-dark-bg transition-colors group">
                                    {/* Reorder buttons */}
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            onClick={() => moveSection(section.id, 'up')}
                                            disabled={index === 0}
                                            className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => moveSection(section.id, 'down')}
                                            disabled={index === sections.length - 1}
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
                                        onChange={(e) => renameSection(section.id, e.target.value)}
                                        className="flex-1 bg-transparent text-sm text-gray-300 focus:bg-dark-bg rounded px-2 py-1 border border-transparent focus:border-dark-border"
                                    />

                                    {/* Delete button */}
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete category "${section.name}"? Items will be moved to 'Other'.`)) {
                                                deleteSection(section.id);
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

                        <div className="flex justify-end mt-6 pt-4 border-t border-dark-border">
                            <button onClick={() => setShowAddCategoryForm(false)} className="btn-ghost">Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md modal-backdrop" onClick={() => setShowAddForm(false)}>
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl modal-content relative" onClick={e => e.stopPropagation()}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md modal-backdrop" onClick={() => setEditingItem(null)}>
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl modal-content relative" onClick={e => e.stopPropagation()}>
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

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No services yet</h3>
                        <p className="text-sm text-gray-600 mb-4">Add your rates and services to use in quotes</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    const result = seedRateCard();
                                    if (result.added > 0) {
                                        alert(`Added ${result.added} default services!`);
                                    }
                                }}
                                className="btn-primary"
                            >
                                Load Default Services
                            </button>
                            <button onClick={() => setShowAddForm(true)} className="btn-secondary">
                                Add Manually
                            </button>
                        </div>
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
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                                onClick={e => e.stopPropagation()}
                                                className="bg-transparent text-gray-200 font-medium focus:bg-dark-bg rounded px-1 -ml-1"
                                            />
                                            <span className="text-xs text-gray-600 px-2 py-0.5 bg-dark-bg rounded">
                                                {sections.find(s => s.id === item.section)?.name || 'Other'}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
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
                                                if (confirm('Delete this service?')) deleteItem(item.id);
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
                                            {REGIONS.map(region => (
                                                <div key={region.id} className="bg-dark-bg rounded-lg p-3">
                                                    <p className="text-xs font-medium text-gray-400 mb-2">
                                                        {region.label} <span className="text-gray-600">({region.currency})</span>
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs text-gray-600">Cost ({region.symbol})</label>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{region.symbol}</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.pricing?.[region.id]?.cost || 0}
                                                                    onChange={(e) => handlePricingChange(item.id, region.id, 'cost', e.target.value)}
                                                                    className="input text-sm pl-7"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-600">Charge ({region.symbol})</label>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{region.symbol}</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.pricing?.[region.id]?.charge || 0}
                                                                    onChange={(e) => handlePricingChange(item.id, region.id, 'charge', e.target.value)}
                                                                    className="input text-sm pl-7"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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
