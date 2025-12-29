import { useState } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useQuoteTemplateStore } from '../../store/quoteTemplateStore';

const CATEGORIES = [
    { id: 'broadcast', label: 'Broadcast' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'corporate', label: 'Corporate Event' },
    { id: 'sports', label: 'Sports' },
    { id: 'concert', label: 'Concert/Live' },
    { id: 'general', label: 'General' },
];

export default function SaveAsTemplateModal({ isOpen, onClose }) {
    const quote = useQuoteStore(state => state.quote);
    const createTemplate = useQuoteTemplateStore(state => state.createTemplate);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [saving, setSaving] = useState(false);
    const [includeClientDetails, setIncludeClientDetails] = useState(false);
    const [includeFees, setIncludeFees] = useState(true);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) return;

        setSaving(true);
        try {
            // Extract sections data from current quote
            const templateData = {
                name: name.trim(),
                description: description.trim(),
                category,
                sections: quote.sections,
                currency: quote.currency,
                region: quote.region,
                fees: includeFees ? {
                    managementFee: quote.managementFee || 0,
                    commissionFee: quote.commissionFee || 0,
                    discountPercent: quote.discountPercent || 0,
                } : { managementFee: 0, commissionFee: 0, discountPercent: 0 },
                projectDefaults: includeClientDetails ? {
                    projectType: quote.project?.projectType,
                    description: quote.project?.description,
                } : {},
            };

            await createTemplate(templateData);
            onClose(true); // Pass true to indicate success
        } catch (error) {
            console.error('Failed to save template:', error);
        } finally {
            setSaving(false);
        }
    };

    // Count items in quote
    const itemCount = Object.values(quote.sections || {}).reduce((acc, section) => {
        return acc + Object.values(section.subsections || {}).reduce((subAcc, subsection) => {
            return subAcc + (subsection.items?.length || 0);
        }, 0);
    }, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onClose(false)}
            />

            {/* Modal */}
            <div className="relative bg-[#1a1f2e] border border-dark-border rounded-xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-navy flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Save as Template</h2>
                            <p className="text-xs text-gray-400">{itemCount} items will be saved</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="btn-icon text-gray-400 hover:text-white"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Template Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Template Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Sports Broadcast Package"
                            className="input"
                            autoFocus
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="input"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of when to use this template..."
                            className="input min-h-[80px] resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-2 pt-2 border-t border-dark-border">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={includeFees}
                                onChange={(e) => setIncludeFees(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                Include fee percentages
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={includeClientDetails}
                                onChange={(e) => setIncludeClientDetails(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                Include project type & description
                            </span>
                        </label>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-blue-300">
                            Templates save your line items, sections, currency, and region.
                            Client details and dates are not included.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-dark-border">
                    <button
                        onClick={() => onClose(false)}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || saving}
                        className="btn btn-primary"
                    >
                        {saving ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Template
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
