import { useState, memo } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { SECTIONS } from '../../data/sections';
import { calculateSectionTotal } from '../../utils/calculations';
import { formatCurrency, convertCurrency, getRegionCurrency } from '../../utils/currency';
import Subsection from './Subsection';

const Section = memo(function Section({ sectionId }) {
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
        <div
            className="card overflow-hidden"
            style={{ borderLeftColor: sectionConfig.color, borderLeftWidth: '3px' }}
            role="region"
            aria-labelledby={`section-${sectionId}-title`}
        >
            {/* Section Header */}
            <button
                className="section-header -m-4 mb-0 w-full"
                onClick={() => toggleSection(sectionId)}
                aria-expanded={section.isExpanded}
                aria-controls={`section-${sectionId}-content`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sectionConfig.color }}
                        aria-hidden="true"
                    />
                    <h3 id={`section-${sectionId}-title`} className="font-semibold text-gray-200">
                        {sectionConfig.name}
                    </h3>
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
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Section Content */}
            {section.isExpanded && (
                <div id={`section-${sectionId}-content`} className="mt-4 space-y-3">
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
                            <label htmlFor={`new-subsection-${sectionId}`} className="sr-only">
                                New subsection name
                            </label>
                            <input
                                id={`new-subsection-${sectionId}`}
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
                                aria-label="New subsection name"
                            />
                            <button
                                onClick={handleAddSubsection}
                                className="btn-primary text-xs py-1 px-2"
                                aria-label="Add subsection"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddSubsection(false);
                                    setNewSubsectionName('');
                                }}
                                className="btn-ghost text-xs py-1 px-2"
                                aria-label="Cancel adding subsection"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddSubsection(true)}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1"
                            aria-label="Add new subsection"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Subsection
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

export default Section;
