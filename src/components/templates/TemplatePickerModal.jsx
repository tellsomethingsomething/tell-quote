import { useState, useMemo } from 'react';
import { useQuoteTemplateStore } from '../../store/quoteTemplateStore';

const CATEGORIES = [
    { id: 'all', label: 'All Templates' },
    { id: 'broadcast', label: 'Broadcast' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'corporate', label: 'Corporate Event' },
    { id: 'sports', label: 'Sports' },
    { id: 'concert', label: 'Concert/Live' },
    { id: 'general', label: 'General' },
];

export default function TemplatePickerModal({ isOpen, onClose, onSelectTemplate, onStartBlank }) {
    const templates = useQuoteTemplateStore(state => state.templates);
    const deleteTemplate = useQuoteTemplateStore(state => state.deleteTemplate);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const filteredTemplates = useMemo(() => {
        let result = templates;

        // Filter by category
        if (selectedCategory !== 'all') {
            result = result.filter(t => t.category === selectedCategory);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // Sort by usage count (most used first), then by date
        return result.sort((a, b) => {
            if (b.usageCount !== a.usageCount) {
                return (b.usageCount || 0) - (a.usageCount || 0);
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [templates, selectedCategory, searchQuery]);

    if (!isOpen) return null;

    const handleDelete = async (templateId) => {
        await deleteTemplate(templateId);
        setDeleteConfirm(null);
    };

    const countItems = (sections) => {
        if (!sections) return 0;
        return Object.values(sections).reduce((acc, section) => {
            return acc + Object.values(section.subsections || {}).reduce((subAcc, subsection) => {
                return subAcc + (subsection.items?.length || 0);
            }, 0);
        }, 0);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onClose()}
            />

            {/* Modal */}
            <div className="relative bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Choose a Template</h2>
                            <p className="text-xs text-gray-400">{templates.length} templates available</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onClose()}
                        className="btn-icon text-gray-400 hover:text-white"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="p-4 border-b border-dark-border space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="input pl-10"
                            autoFocus
                        />
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                    selectedCategory === cat.id
                                        ? 'bg-brand-teal text-white'
                                        : 'bg-dark-bg text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 mb-2">No templates found</p>
                            <p className="text-sm text-gray-500">
                                {templates.length === 0
                                    ? "Create your first template by saving a quote"
                                    : "Try adjusting your search or category filter"
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="group relative bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-brand-teal/50 transition-all cursor-pointer"
                                    onClick={() => onSelectTemplate(template)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-white truncate">
                                                    {template.name}
                                                </h3>
                                                {template.usageCount > 0 && (
                                                    <span className="px-1.5 py-0.5 text-[10px] bg-brand-teal/20 text-brand-teal rounded">
                                                        Used {template.usageCount}x
                                                    </span>
                                                )}
                                            </div>
                                            {template.description && (
                                                <p className="text-sm text-gray-400 line-clamp-1 mb-2">
                                                    {template.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                    </svg>
                                                    {countItems(template.sections)} items
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {template.region} / {template.currency}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400 capitalize">
                                                    {template.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm(template.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                                            title="Delete template"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Delete confirmation */}
                                    {deleteConfirm === template.id && (
                                        <div className="absolute inset-0 bg-dark-bg/95 rounded-lg flex items-center justify-center gap-3 p-4">
                                            <span className="text-sm text-gray-300">Delete this template?</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(template.id);
                                                }}
                                                className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm(null);
                                                }}
                                                className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-dark-border bg-dark-bg/50">
                    <button
                        onClick={onStartBlank}
                        className="btn btn-ghost"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Start Blank
                    </button>
                    <button
                        onClick={() => onClose()}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
