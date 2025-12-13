import { useState, useRef, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useRateCardStore } from '../../store/rateCardStore';
import LineItem from './LineItem';

// Smart map for DB sections
const getRateCardSectionId = (sectionId, subsectionName) => {
    // Creative, Logistics, Expenses (Flat)
    if (sectionId === 'creative') return 'creative';
    if (sectionId === 'logistics') return 'logistics';
    if (sectionId === 'expenses') return 'expenses';

    // Production Team
    if (sectionId === 'productionTeam') {
        const map = {
            'Production': 'prod_production',
            'Technical Crew': 'prod_technical',
            'Production Management': 'prod_management'
        };
        return map[subsectionName] || 'prod_production';
    }

    // Production Equipment
    if (sectionId === 'productionEquipment') {
        const map = {
            'Video': 'equip_video',
            'Audio': 'equip_audio',
            'Cameras': 'equip_cameras',
            'Graphics': 'equip_graphics',
            'VT': 'equip_vt',
            'Cabling': 'equip_cabling',
            'Other': 'equip_other'
        };
        return map[subsectionName] || 'equip_other';
    }

    return 'other';
};

export default function Subsection({ sectionId, subsectionName, color, isDragging }) {
    const { quote, addLineItem, updateSubsectionName } = useQuoteStore();
    const { items: rateCardItems } = useRateCardStore();
    const section = quote.sections[sectionId];
    const items = section?.subsections?.[subsectionName] || [];

    const [isAdding, setIsAdding] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const nameInputRef = useRef(null);

    // Get custom name or fall back to original
    const displayName = section?.subsectionNames?.[subsectionName] || subsectionName;

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    const handleStartEditName = (e) => {
        e.stopPropagation();
        setEditedName(displayName);
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        updateSubsectionName(sectionId, subsectionName, editedName);
        setIsEditingName(false);
    };

    const handleCancelEditName = () => {
        setIsEditingName(false);
        setEditedName('');
    };

    // Get rate card items for this specific subsection context
    const rateCardSectionId = getRateCardSectionId(sectionId, subsectionName);
    const dbItems = rateCardItems.filter(item => item.section === rateCardSectionId);

    const handleAddItem = (dbItem = null) => {
        const region = quote.region;
        const pricing = dbItem?.pricing?.[region] || { cost: 0, charge: 0 };

        addLineItem(sectionId, subsectionName, {
            name: dbItem?.name || '',
            cost: pricing.cost,
            charge: pricing.charge,
            quantity: 1,
            days: 1,
            isPercentage: dbItem?.isPercentage || false,
            percentValue: dbItem?.percentValue || 0,
        });
        setIsAdding(false);
    };

    const isFlatSection = ['creative', 'logistics', 'expenses'].includes(sectionId);
    const shouldHideHeader = isFlatSection && subsectionName === 'Services';

    return (
        <div
            className="bg-dark-bg/50 rounded-md p-2 transition-colors hover:bg-dark-bg/70"
            onDragOver={(e) => {
                if (quote.isLocked) return;
                e.preventDefault();
                e.currentTarget.classList.add('bg-accent-primary/10');
            }}
            onDragLeave={(e) => {
                if (quote.isLocked) return;
                e.preventDefault();
                e.currentTarget.classList.remove('bg-accent-primary/10');
            }}
            onDrop={(e) => {
                if (quote.isLocked) return;
                e.preventDefault();
                e.currentTarget.classList.remove('bg-accent-primary/10');
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data && (data.sectionId !== sectionId || data.subsectionName !== subsectionName)) {
                    useQuoteStore.getState().moveLineItem(
                        data.sectionId,
                        data.subsectionName,
                        data.itemId,
                        sectionId,
                        subsectionName
                    );
                }
            }}
        >
            {/* Subsection Header - Only hide for default 'Services' in flat sections */}
            {!shouldHideHeader && (
                <div className="flex items-center gap-2 mb-1.5">
                    <svg className="w-3 h-3 text-gray-600 flex-shrink-0 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    {isEditingName ? (
                        <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            draggable={false}
                        >
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') handleCancelEditName();
                                }}
                                className="input-sm text-xs py-0.5 w-32"
                                aria-label="Subsection name"
                                draggable={false}
                            />
                            <button
                                onClick={handleSaveName}
                                className="p-0.5 text-green-400 hover:text-green-300"
                                aria-label="Save"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={handleCancelEditName}
                                className="p-0.5 text-gray-400 hover:text-gray-300"
                                aria-label="Cancel"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <h4
                            className="text-xs font-medium text-gray-400 cursor-text hover:text-gray-300"
                            onClick={handleStartEditName}
                            onMouseDown={(e) => e.stopPropagation()}
                            draggable={false}
                            title="Click to rename"
                        >
                            {displayName}
                        </h4>
                    )}
                    <span className="text-[10px] text-gray-600">{items.length} items</span>
                </div>
            )}

            {/* Line Items */}
            {items.length > 0 && (
                <div className="space-y-1 mb-1">
                    {/* Column Headers */}
                    <div className="flex flex-wrap items-center gap-2 px-2 py-0.5 text-[10px] text-gray-500 border-b border-dark-border">
                        <div className="flex-1 min-w-[180px]">Item</div>
                        <div className="w-16 text-left">Qty</div>
                        <div className="w-16 text-left">Days</div>
                        <div className="w-24 text-left hidden lg:block">Cost</div>
                        <div className="w-24 text-left">Charge</div>
                        <div className="w-24 text-right">Total</div>
                        <div className="w-14 text-right hidden lg:block">Margin</div>
                        <div className="w-6"></div>
                    </div>

                    {items.map(item => (
                        <LineItem
                            key={item.id}
                            item={item}
                            sectionId={sectionId}
                            subsectionName={subsectionName}
                        />
                    ))}
                </div>
            )}

            {/* Add Item UI - Hidden when locked */}
            {!quote.isLocked && (
                isAdding ? (
                    <div className="bg-dark-card rounded-lg p-2 space-y-2">
                        {/* Quick Add from Database */}
                        {dbItems.length > 0 && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Quick Add</p>
                                <div className="flex flex-wrap gap-2">
                                    {dbItems.slice(0, 8).map(dbItem => (
                                        <button
                                            key={dbItem.name}
                                            onClick={() => handleAddItem(dbItem)}
                                            className="text-xs px-2.5 py-1.5 bg-dark-bg hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-gray-200 border border-dark-border hover:border-gray-600"
                                        >
                                            + {dbItem.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleAddItem()}
                                className="text-xs px-3 py-1.5 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary rounded transition-colors"
                            >
                                + Custom Item
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors flex items-center justify-center gap-1"
                        style={{ borderColor: color }}
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </button>
                )
            )}
        </div>
    );
}
