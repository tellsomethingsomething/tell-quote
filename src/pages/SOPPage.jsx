import { useState, useMemo, useEffect } from 'react';
import { useSopStore, SOP_CATEGORIES, CATEGORY_CONFIG } from '../store/sopStore';

// Category tab component
function CategoryTab({ category, isActive, onClick, sopCount, completionRate }) {
    const config = CATEGORY_CONFIG[category];
    return (
        <button
            onClick={onClick}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                isActive
                    ? `${config.color} border`
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
            <span className="text-lg">{config.icon}</span>
            <span className="text-sm">{category}</span>
            <div className="flex items-center gap-2 text-[10px]">
                <span>{sopCount} SOPs</span>
                {completionRate > 0 && (
                    <span className="text-green-400">{completionRate}% done</span>
                )}
            </div>
        </button>
    );
}

// Progress bar component
function ProgressBar({ percentage }) {
    return (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-300 ${
                    percentage === 100 ? 'bg-green-500' : 'bg-accent-primary'
                }`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

// Checklist item component
function ChecklistItem({ item, onToggle, onDelete, onEdit, isEditing, onEditSubmit, editText, setEditText }) {
    if (isEditing) {
        return (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onEditSubmit();
                        if (e.key === 'Escape') onEdit(null);
                    }}
                    className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-accent-primary"
                    autoFocus
                />
                <button
                    onClick={onEditSubmit}
                    className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                <button
                    onClick={() => onEdit(null)}
                    className="p-1.5 text-gray-400 hover:bg-white/10 rounded"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg group transition-all cursor-pointer ${
                item.completed ? 'bg-green-500/10' : 'hover:bg-white/5'
            }`}
            onClick={onToggle}
        >
            <button
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    item.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-500 hover:border-accent-primary'
                }`}
            >
                {item.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>
            <span className={`flex-1 text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                {item.text}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onEdit(item.id)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                    title="Edit"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                    title="Delete"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// SOP Card component
function SOPCard({ sop, onToggleItem, onAddItem, onRemoveItem, onEditItem, onReset, onDuplicate, onUpdatePhotos, isCollapsed, onToggleCollapsed }) {
    const [newItemText, setNewItemText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const isExpanded = !isCollapsed;

    const completedCount = sop.checklist?.filter(i => i.completed).length || 0;
    const totalCount = sop.checklist?.length || 0;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const config = CATEGORY_CONFIG[sop.category];

    const handleAddItem = () => {
        if (newItemText.trim()) {
            onAddItem(sop.id, newItemText.trim());
            setNewItemText('');
        }
    };

    const handleEditSubmit = () => {
        if (editText.trim() && editingId) {
            onEditItem(sop.id, editingId, editText.trim());
            setEditingId(null);
            setEditText('');
        }
    };

    const startEditing = (itemId) => {
        const item = sop.checklist.find(i => i.id === itemId);
        if (item) {
            setEditingId(itemId);
            setEditText(item.text);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={onToggleCollapsed}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.color} border`}>
                                {sop.category}
                            </span>
                            {percentage === 100 && (
                                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">
                                    Complete
                                </span>
                            )}
                        </div>
                        <h3 className="text-white font-semibold">{sop.title}</h3>
                        {sop.description && (
                            <p className="text-gray-400 text-sm mt-1">{sop.description}</p>
                        )}
                    </div>
                    <button
                        className={`p-2 text-gray-400 hover:text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <ProgressBar percentage={percentage} />
                    </div>
                    <span className="text-sm text-gray-400 min-w-[60px] text-right">
                        {completedCount}/{totalCount}
                    </span>
                </div>
            </div>

            {/* Checklist */}
            {isExpanded && (
                <div className="border-t border-white/10">
                    <div className="p-4 space-y-2">
                        {sop.checklist?.map((item) => (
                            <ChecklistItem
                                key={item.id}
                                item={item}
                                onToggle={() => onToggleItem(sop.id, item.id)}
                                onDelete={() => onRemoveItem(sop.id, item.id)}
                                onEdit={startEditing}
                                isEditing={editingId === item.id}
                                onEditSubmit={handleEditSubmit}
                                editText={editText}
                                setEditText={setEditText}
                            />
                        ))}

                        {/* Add new item */}
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="text"
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                placeholder="Add new checklist item..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                            />
                            <button
                                onClick={handleAddItem}
                                disabled={!newItemText.trim()}
                                className="p-2 text-accent-primary hover:bg-accent-primary/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Photos Section */}
                    {(sop.photos?.length > 0 || true) && (
                        <div className="px-4 py-3 border-t border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reference Photos</span>
                                <label className="text-xs text-accent-primary hover:text-accent-primary/80 cursor-pointer flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Add Photo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file && onUpdatePhotos) {
                                                // Convert to base64 for storage
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    const newPhotos = [...(sop.photos || []), {
                                                        id: crypto.randomUUID(),
                                                        url: reader.result,
                                                        caption: '',
                                                    }];
                                                    onUpdatePhotos(sop.id, newPhotos);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                </label>
                            </div>
                            {sop.photos?.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {sop.photos.map((photo, idx) => (
                                        <div key={photo.id || idx} className="relative flex-shrink-0 group">
                                            <img
                                                src={photo.url}
                                                alt={photo.caption || `Step ${idx + 1}`}
                                                className="w-20 h-20 object-cover rounded-lg border border-white/10"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newPhotos = sop.photos.filter((_, i) => i !== idx);
                                                    onUpdatePhotos(sop.id, newPhotos);
                                                }}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10">
                        <div className="flex gap-2">
                            <button
                                onClick={() => onReset(sop.id)}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset Checklist
                            </button>
                            <button
                                onClick={() => onDuplicate(sop.id)}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Duplicate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// New SOP Form
function NewSOPForm({ category, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: category,
    });
    const [checklistItems, setChecklistItems] = useState(['']);

    const handleAddChecklistItem = () => {
        setChecklistItems([...checklistItems, '']);
    };

    const handleRemoveChecklistItem = (index) => {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    };

    const handleChecklistChange = (index, value) => {
        const updated = [...checklistItems];
        updated[index] = value;
        setChecklistItems(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const checklist = checklistItems
            .filter(item => item.trim())
            .map(text => ({
                id: crypto.randomUUID(),
                text: text.trim(),
                completed: false,
            }));

        onSave({
            ...formData,
            checklist,
            tags: [],
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Create New SOP</h3>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary"
                    placeholder="e.g., Camera Setup Checklist"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary"
                    placeholder="Brief description of this procedure"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Checklist Items
                </label>
                <div className="space-y-2">
                    {checklistItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => handleChecklistChange(index, e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary"
                                placeholder="Enter checklist item..."
                            />
                            {checklistItems.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveChecklistItem(index)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="text-sm text-accent-primary hover:text-accent-primary/80 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                >
                    Create SOP
                </button>
            </div>
        </form>
    );
}

export default function SOPPage() {
    const {
        sops,
        initialize,
        isLoading,
        addSop,
        toggleChecklistItem,
        addChecklistItem,
        removeChecklistItem,
        updateChecklistItemText,
        resetChecklist,
        duplicateSop,
        updateSopPhotos,
        getCompletionPercentage,
        collapsedSops,
        toggleCollapsed,
    } = useSopStore();

    const [activeCategory, setActiveCategory] = useState(SOP_CATEGORIES.OPERATIONS);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        initialize();
    }, [initialize]);

    // Filter SOPs by category and search
    const filteredSops = useMemo(() => {
        return sops.filter(sop => {
            const matchesCategory = sop.category === activeCategory;
            const matchesSearch = !searchQuery ||
                sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sop.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sop.checklist?.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [sops, activeCategory, searchQuery]);

    // Calculate stats per category
    const categoryStats = useMemo(() => {
        const stats = {};
        Object.values(SOP_CATEGORIES).forEach(category => {
            const categorySops = sops.filter(s => s.category === category);
            const totalItems = categorySops.reduce((sum, s) => sum + (s.checklist?.length || 0), 0);
            const completedItems = categorySops.reduce((sum, s) =>
                sum + (s.checklist?.filter(i => i.completed).length || 0), 0
            );
            stats[category] = {
                count: categorySops.length,
                completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
            };
        });
        return stats;
    }, [sops]);

    const handleCreateSop = async (sopData) => {
        await addSop(sopData);
        setIsCreating(false);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-dark-bg">
                <div className="text-gray-400">Loading SOPs...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-dark-bg p-4 sm:p-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Standard Operating Procedures</h1>
                    <p className="text-gray-400 text-sm">Interactive checklists for consistent operations</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New SOP
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 p-1.5 bg-white/5 rounded-xl">
                {Object.values(SOP_CATEGORIES).map(category => (
                    <CategoryTab
                        key={category}
                        category={category}
                        isActive={activeCategory === category}
                        onClick={() => setActiveCategory(category)}
                        sopCount={categoryStats[category]?.count || 0}
                        completionRate={categoryStats[category]?.completionRate || 0}
                    />
                ))}
            </div>

            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_CONFIG[activeCategory].icon}</span>
                    <div>
                        <h2 className="text-lg font-bold text-white">{activeCategory}</h2>
                        <p className="text-sm text-gray-400">{CATEGORY_CONFIG[activeCategory].description}</p>
                    </div>
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search SOPs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm w-64 focus:outline-none focus:border-accent-primary"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isCreating ? (
                    <NewSOPForm
                        category={activeCategory}
                        onSave={handleCreateSop}
                        onCancel={() => setIsCreating(false)}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
                        {filteredSops.map(sop => (
                            <SOPCard
                                key={sop.id}
                                sop={sop}
                                onToggleItem={toggleChecklistItem}
                                onAddItem={addChecklistItem}
                                onRemoveItem={removeChecklistItem}
                                onEditItem={updateChecklistItemText}
                                onReset={resetChecklist}
                                onDuplicate={duplicateSop}
                                onUpdatePhotos={updateSopPhotos}
                                isCollapsed={collapsedSops[sop.id] || false}
                                onToggleCollapsed={() => toggleCollapsed(sop.id)}
                            />
                        ))}
                        {filteredSops.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                                <p className="text-gray-500 mb-4">
                                    {searchQuery
                                        ? 'No SOPs match your search.'
                                        : `No SOPs in ${activeCategory} yet.`
                                    }
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="text-accent-primary hover:text-accent-primary/80 text-sm font-medium"
                                    >
                                        Create your first {activeCategory} SOP
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
