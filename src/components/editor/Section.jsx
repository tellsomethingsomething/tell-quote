import { useState, memo, useRef, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { SECTIONS } from '../../data/sections';
import { calculateSectionTotal } from '../../utils/calculations';
import { formatCurrency, convertCurrency, getRegionCurrency } from '../../utils/currency';
import Subsection from './Subsection';

const Section = memo(function Section({ sectionId, index, totalSections }) {
    const { quote, toggleSection, moveSection, updateSectionName, moveSubsection, rates } = useQuoteStore();
    const section = quote.sections[sectionId];
    const sectionConfig = SECTIONS[sectionId];

    const [showAddSubsection, setShowAddSubsection] = useState(false);
    const [newSubsectionName, setNewSubsectionName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [draggedSubsection, setDraggedSubsection] = useState(null);
    const [dragOverSubsection, setDragOverSubsection] = useState(null);
    const nameInputRef = useRef(null);

    // Get custom name or fall back to default
    const displayName = quote.sectionNames?.[sectionId] || sectionConfig?.name || '';

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    if (!section || !sectionConfig) return null;

    // Calculate section totals
    const totals = calculateSectionTotal(section.subsections);

    // Get region currency and convert if needed
    const regionCurrency = getRegionCurrency(quote.region);
    const displayCharge = quote.region === 'MALAYSIA'
        ? totals.totalCharge
        : convertCurrency(totals.totalCharge, regionCurrency, quote.currency, rates);

    const formattedTotal = formatCurrency(displayCharge, quote.currency);

    // Get all subsection names in order (use custom order if available)
    const defaultOrder = [...sectionConfig.subsections, ...(section.customSubsections || [])];
    const allSubsections = section.subsectionOrder || defaultOrder;

    // Count total items
    const itemCount = Object.values(section.subsections).reduce((acc, items) => acc + items.length, 0);

    // Subsection drag handlers
    const handleSubsectionDragStart = (e, subsectionName) => {
        setDraggedSubsection(subsectionName);
        e.dataTransfer.setData('subsection', subsectionName);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleSubsectionDragOver = (e, subsectionName) => {
        e.preventDefault();
        if (draggedSubsection && draggedSubsection !== subsectionName) {
            setDragOverSubsection(subsectionName);
        }
    };

    const handleSubsectionDrop = (e, targetSubsection) => {
        e.preventDefault();
        if (draggedSubsection && draggedSubsection !== targetSubsection) {
            // Reorder subsections
            const currentOrder = [...allSubsections];
            const fromIndex = currentOrder.indexOf(draggedSubsection);
            const toIndex = currentOrder.indexOf(targetSubsection);

            if (fromIndex !== -1 && toIndex !== -1) {
                currentOrder.splice(fromIndex, 1);
                currentOrder.splice(toIndex, 0, draggedSubsection);

                // Update the store with new order
                const { reorderSubsections } = useQuoteStore.getState();
                reorderSubsections(sectionId, currentOrder);
            }
        }
        setDraggedSubsection(null);
        setDragOverSubsection(null);
    };

    const handleSubsectionDragEnd = () => {
        setDraggedSubsection(null);
        setDragOverSubsection(null);
    };

    const handleAddSubsection = () => {
        if (newSubsectionName.trim()) {
            const { addCustomSubsection } = useQuoteStore.getState();
            addCustomSubsection(sectionId, newSubsectionName.trim());
            setNewSubsectionName('');
            setShowAddSubsection(false);
        }
    };

    const handleStartEditName = (e) => {
        e.stopPropagation();
        setEditedName(displayName);
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        updateSectionName(sectionId, editedName);
        setIsEditingName(false);
    };

    const handleCancelEditName = () => {
        setIsEditingName(false);
        setEditedName('');
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
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sectionConfig.color }}
                        aria-hidden="true"
                    />
                    {isEditingName ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') handleCancelEditName();
                                }}
                                className="input-sm text-sm font-semibold py-0.5"
                                aria-label="Section name"
                            />
                            <button
                                onClick={handleSaveName}
                                className="p-1 text-green-400 hover:text-green-300"
                                aria-label="Save name"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={handleCancelEditName}
                                className="p-1 text-gray-400 hover:text-gray-300"
                                aria-label="Cancel"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <h3
                            id={`section-${sectionId}-title`}
                            className="font-semibold text-gray-200 cursor-pointer hover:text-white"
                            onClick={handleStartEditName}
                            title="Click to rename"
                        >
                            {displayName}
                        </h3>
                    )}
                    <span className="text-xs text-gray-500 bg-dark-card px-2 py-0.5 rounded flex-shrink-0">
                        {itemCount} items
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Move buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                moveSection(sectionId, 'up');
                            }}
                            disabled={index === 0}
                            className={`p-1 rounded transition-colors ${index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            aria-label="Move section up"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                moveSection(sectionId, 'down');
                            }}
                            disabled={index === totalSections - 1}
                            className={`p-1 rounded transition-colors ${index === totalSections - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            aria-label="Move section down"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
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
                    {allSubsections.map((subsectionName, idx) => (
                        <div
                            key={subsectionName}
                            draggable
                            onDragStart={(e) => handleSubsectionDragStart(e, subsectionName)}
                            onDragOver={(e) => handleSubsectionDragOver(e, subsectionName)}
                            onDrop={(e) => handleSubsectionDrop(e, subsectionName)}
                            onDragEnd={handleSubsectionDragEnd}
                            className={`transition-all duration-150 ${
                                draggedSubsection === subsectionName ? 'opacity-50 scale-[0.98]' : ''
                            } ${
                                dragOverSubsection === subsectionName ? 'ring-2 ring-accent-primary/50 rounded-lg' : ''
                            }`}
                        >
                            <Subsection
                                sectionId={sectionId}
                                subsectionName={subsectionName}
                                color={sectionConfig.color}
                                isDragging={draggedSubsection === subsectionName}
                            />
                        </div>
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
