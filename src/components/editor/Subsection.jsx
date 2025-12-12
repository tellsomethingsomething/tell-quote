import { useState } from 'react';
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
    const { quote, addLineItem } = useQuoteStore();
    const { items: rateCardItems } = useRateCardStore();
    const section = quote.sections[sectionId];
    const items = section?.subsections?.[subsectionName] || [];

    const [isAdding, setIsAdding] = useState(false);

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
            className="bg-dark-bg/50 rounded-lg p-3 transition-colors hover:bg-dark-bg/70"
            onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-accent-primary/10');
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-accent-primary/10');
            }}
            onDrop={(e) => {
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
                <div className="flex items-center gap-3 mb-2 cursor-grab active:cursor-grabbing">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-400">{subsectionName}</h4>
                    <span className="text-xs text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                </div>
            )}

            {/* Line Items */}
            {items.length > 0 && (
                <div className="space-y-2 mb-2">
                    {/* Column Headers */}
                    <div className="flex flex-wrap items-center gap-2 px-2 py-1 text-xs text-gray-500 border-b border-dark-border">
                        <div className="flex-1 min-w-[180px]">Item</div>
                        <div className="w-16 text-center">Qty</div>
                        <div className="w-16 text-center">Days</div>
                        <div className="w-20 text-right hidden lg:block">Cost</div>
                        <div className="w-20 text-right">Charge</div>
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

            {/* Add Item UI */}
            {isAdding ? (
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
            )}
        </div>
    );
}
