import React from 'react';
import {
    ChevronDown,
    MoreHorizontal,
    Plus,
    Trash2,
    GripVertical,
    Download,
    Send
} from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

export default function QuoteBuilderMockup() {
    const { formatPrice } = useCurrency();

    const lineItems = [
        { role: 'Director', days: 2, rate: 1500, total: 3000 },
        { role: 'Producer', days: 3, rate: 800, total: 2400 },
        { role: 'Director of Photography', days: 2, rate: 1200, total: 2400 },
        { role: 'Camera Assistant (1st AC)', days: 2, rate: 600, total: 1200 },
        { role: 'Gaffer', days: 2, rate: 650, total: 1300 },
        { role: 'Sound Recordist', days: 2, rate: 700, total: 1400 },
    ];

    const sectionTotal = 12400;
    const subtotal = 28500;
    const fee = 4275;
    const total = 32775;

    return (
        <div className="w-full bg-marketing-surface border border-marketing-border rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[320px] sm:min-h-0 sm:aspect-[16/10] text-left font-sans select-none">
            {/* Mock Header */}
            <div className="h-12 sm:h-16 border-b border-marketing-border bg-marketing-surface flex items-center justify-between px-3 sm:px-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">DRAFT</span>
                        <span className="text-[8px] sm:text-xs text-marketing-text-secondary hidden sm:inline">Last saved 2m ago</span>
                    </div>
                    <h3 className="font-bold text-marketing-text-primary text-xs sm:text-lg truncate">Q-2401: Adidas</h3>
                </div>
                <div className="flex gap-1.5 sm:gap-3 shrink-0">
                    <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg border border-marketing-border text-marketing-text-secondary hover:bg-marketing-background transition-colors">
                        <Download size={18} />
                    </button>
                    <button className="bg-marketing-primary text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-bold flex items-center gap-1 sm:gap-2 hover:bg-marketing-primary/90 transition-colors shadow-lg shadow-marketing-primary/20">
                        <Send size={12} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Send to Client</span><span className="sm:hidden">Send</span>
                    </button>
                </div>
            </div>

            {/* Builder Area */}
            <div className="flex-1 bg-marketing-background p-2 sm:p-8 overflow-y-hidden relative">
                <div className="sm:max-w-4xl mx-auto bg-marketing-surface border border-marketing-border rounded-lg shadow-sm min-h-full flex flex-col">

                    {/* Section Header */}
                    <div className="p-2 sm:p-4 border-b border-marketing-border/50 flex justify-between items-center bg-marketing-background/50">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <ChevronDown size={12} className="text-marketing-text-secondary sm:w-4 sm:h-4" />
                            <h4 className="font-bold text-marketing-text-primary text-[10px] sm:text-base">1.0 Production Crew</h4>
                        </div>
                        <span className="text-[10px] sm:text-sm font-mono font-medium text-marketing-text-primary">{formatPrice(sectionTotal, { decimals: 2 })}</span>
                    </div>

                    {/* Line Items - Desktop */}
                    <div className="hidden sm:block p-4 space-y-1">
                        {lineItems.map((item, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 items-center py-2 px-2 hover:bg-marketing-background rounded-md group">
                                <div className="col-span-1 text-marketing-text-secondary/30 cursor-grab opacity-0 group-hover:opacity-100 flex justify-center">
                                    <GripVertical size={14} />
                                </div>
                                <div className="col-span-5 font-medium text-marketing-text-primary text-sm">
                                    {item.role}
                                </div>
                                <div className="col-span-2 text-right text-marketing-text-secondary text-sm bg-marketing-background/50 rounded px-2 py-1 border border-marketing-border/30">
                                    {item.days} days
                                </div>
                                <div className="col-span-2 text-right text-marketing-text-secondary text-sm bg-marketing-background/50 rounded px-2 py-1 border border-marketing-border/30">
                                    {formatPrice(item.rate)}
                                </div>
                                <div className="col-span-2 text-right font-mono font-medium text-marketing-text-primary text-sm">
                                    {formatPrice(item.total)}
                                </div>
                            </div>
                        ))}

                        <div className="pt-2 border-t border-dashed border-marketing-border/50 mt-2 flex items-center gap-2 text-marketing-primary text-sm font-medium cursor-pointer hover:underline pl-8">
                            <Plus size={14} /> Add Line Item
                        </div>
                    </div>

                    {/* Line Items - Mobile */}
                    <div className="sm:hidden p-2 space-y-1">
                        {lineItems.slice(0, 4).map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-marketing-background/30 rounded">
                                <div className="font-medium text-marketing-text-primary text-[9px] truncate flex-1 min-w-0">
                                    {item.role.split(' ')[0]}
                                </div>
                                <div className="text-[8px] text-marketing-text-secondary mx-2">
                                    {item.days}d
                                </div>
                                <div className="text-right font-mono font-medium text-marketing-text-primary text-[9px] shrink-0">
                                    {formatPrice(item.total)}
                                </div>
                            </div>
                        ))}
                        <div className="text-center text-[8px] text-marketing-text-secondary py-1">
                            +{lineItems.length - 4} more items
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-auto p-2 sm:p-4 bg-marketing-background/30 border-t border-marketing-border flex justify-end gap-3 sm:gap-8">
                        <div className="hidden sm:block text-right">
                            <div className="text-xs text-marketing-text-secondary mb-1">Subtotal</div>
                            <div className="font-bold text-marketing-text-primary">{formatPrice(subtotal, { decimals: 2 })}</div>
                        </div>
                        <div className="hidden sm:block text-right">
                            <div className="text-xs text-marketing-text-secondary mb-1">Agency Fee (15%)</div>
                            <div className="font-bold text-marketing-text-primary">{formatPrice(fee, { decimals: 2 })}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[8px] sm:text-xs text-marketing-text-secondary mb-0.5 sm:mb-1">Total</div>
                            <div className="font-bold text-marketing-primary text-sm sm:text-xl">{formatPrice(total, { decimals: 2 })}</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
