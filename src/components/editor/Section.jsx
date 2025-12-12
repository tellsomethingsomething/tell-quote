import { useState } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { SECTIONS } from '../../data/sections';
import { calculateSectionTotal } from '../../utils/calculations';
import { formatCurrency, convertCurrency, getRegionCurrency } from '../../utils/currency';
import Subsection from './Subsection';

export default function Section({ sectionId }) {
    const { quote, toggleSection, rates } = useQuoteStore();
    const section = quote.sections[sectionId];
    const sectionConfig = SECTIONS[sectionId];

    const [showAddSubsection, setShowAddSubsection] = useState(false);
    const [newSubsectionName, setNewSubsectionName] = useState('');

    if (!section || !sectionConfig) return null;

    // Calculate section totals
    const totals = calculateSectionTotal(section.subsections);

    // Get region currency and convert if needed
    const regionCurrency = getRegionCurrency(quote.region);
    const displayCharge = quote.region === 'MALAYSIA'
        ? totals.totalCharge
        : convertCurrency(totals.totalCharge, regionCurrency, quote.currency, rates);

    const formattedTotal = formatCurrency(displayCharge, quote.currency);

    // Get all subsection names (original + custom)
    const allSubsections = [...sectionConfig.subsections, ...(section.customSubsections || [])];

    // Count total items
    const itemCount = Object.values(section.subsections).reduce((acc, items) => acc + items.length, 0);

    const handleAddSubsection = () => {
        if (newSubsectionName.trim()) {
            const { addCustomSubsection } = useQuoteStore.getState();
            addCustomSubsection(sectionId, newSubsectionName.trim());
            setNewSubsectionName('');
            setShowAddSubsection(false);
        }
    };

    return (
        <div className="card overflow-hidden" style={{ borderLeftColor: sectionConfig.color, borderLeftWidth: '3px' }}>
            {/* Section Header */}
            <div
                className="section-header -m-4 mb-0"
                onClick={() => toggleSection(sectionId)}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sectionConfig.color }}
                    />
                    <h3 className="font-semibold text-gray-200">{sectionConfig.name}</h3>
                    <span className="text-xs text-gray-500 bg-dark-card px-2 py-0.5 rounded">
                        {itemCount} items
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-300">{formattedTotal}</span>
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${section.isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Section Content */}
            {section.isExpanded && (
                <div className="mt-4 space-y-3">
                    {allSubsections.map(subsectionName => (
                        <Subsection
                            key={subsectionName}
                            sectionId={sectionId}
                            subsectionName={subsectionName}
                            color={sectionConfig.color}
                        />
                    ))}

                    {/* Add Subsection */}
                    {showAddSubsection ? (
                        <div className="flex items-center gap-2 p-2 bg-dark-bg rounded-lg">
                            <input
                                type="text"
                                value={newSubsectionName}
                                onChange={(e) => setNewSubsectionName(e.target.value)}
                                placeholder="Subsection name..."
                                className="input-sm flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddSubsection();
                                    if (e.key === 'Escape') {
                                        setShowAddSubsection(false);
                                        setNewSubsectionName('');
                                    }
                                }}
                            />
                            <button onClick={handleAddSubsection} className="btn-primary text-xs py-1 px-2">
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddSubsection(false);
                                    setNewSubsectionName('');
                                }}
                                className="btn-ghost text-xs py-1 px-2"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddSubsection(true)}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Subsection
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
