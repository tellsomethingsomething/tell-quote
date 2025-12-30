import { memo } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { formatCurrency } from '../../utils/currency';
import { calculateGrandTotalWithFees } from '../../utils/calculations';
import { useToast } from '../common/Toast';
import { usePdfExport } from '../../hooks/usePdfExport';
import { usePDFWatermark } from '../../hooks/useSubscription';

const QuoteSummary = memo(function QuoteSummary() {
    const { quote } = useQuoteStore();
    const toast = useToast();
    const { shouldWatermark } = usePDFWatermark();

    // Use the hook with dynamic imports for PDF library (avoids 1.5MB bundle on initial load)
    const { exportPdf, previewPdf, isGenerating, isPreviewing } = usePdfExport(
        (msg) => toast.success(msg),
        (err) => toast.error('Failed to generate PDF'),
        { showWatermark: shouldWatermark }
    );

    // Calculate all totals
    const totals = calculateGrandTotalWithFees(quote.sections, quote.fees);

    // Helper for display currency conversion
    const toDisplay = (amount) => {
        return formatCurrency(amount || 0, quote.currency);
    };

    const profit = (totals.totalCharge || 0) - (totals.totalCost || 0);
    const marginPercent = totals.totalCharge > 0 ? (profit / totals.totalCharge) * 100 : 0;

    const handlePreviewPDF = () => previewPdf(quote, quote.currency);
    const handleExportPDF = () => exportPdf(quote, quote.currency);

    return (
        <div className="space-y-6 text-gray-100 p-2">

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handlePreviewPDF}
                    disabled={isPreviewing}
                    className="flex-1 btn-secondary py-3"
                >
                    {isPreviewing ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Loading...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                        </span>
                    )}
                </button>
                <button
                    onClick={handleExportPDF}
                    disabled={isGenerating}
                    className="flex-1 btn-primary py-3 shadow-lg shadow-accent-primary/20"
                >
                    {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Generating...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </span>
                    )}
                </button>
            </div>

            {/* Tip */}
            <p className="text-xs text-gray-500 text-center">
                Customize PDF colors in Settings &rarr; Quote Templates
            </p>

            {/* Financial Summary Card */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">Financial Summary</h3>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Total Cost</p>
                        <p className="text-lg font-mono text-gray-300">{toDisplay(totals.totalCost)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Total Charge</p>
                        <p className="text-xl font-bold font-mono text-white">{toDisplay(totals.totalCharge)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Est. Profit</p>
                        <p className={`text-lg font-mono font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {toDisplay(profit)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Gross Margin</p>
                        <p className={`text-lg font-mono font-bold ${marginPercent >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {marginPercent.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Fees Breakdown */}
                <div className="space-y-2 text-sm border-t border-gray-700 pt-4">
                    {quote.fees.managementFee > 0 && (
                        <div className="flex justify-between text-gray-400">
                            <span>Management Fee ({quote.fees.managementFee}%)</span>
                            <span>{toDisplay(totals.managementAmount)}</span>
                        </div>
                    )}
                    {quote.fees.commissionFee > 0 && (
                        <div className="flex justify-between text-gray-400">
                            <span>Commission ({quote.fees.commissionFee}%)</span>
                            <span>{toDisplay(totals.commissionAmount)}</span>
                        </div>
                    )}
                    {quote.fees.discount > 0 && (
                        <div className="flex justify-between text-red-400">
                            <span>Discount ({quote.fees.discount}%)</span>
                            <span>-{toDisplay(totals.discountAmount)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Section Breakdown */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-lg">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-700 pb-2">Section Breakdown</h3>
                <div className="space-y-3">
                    {Object.values(quote.sections).map(section => {
                        const sectionCost = Object.values(section.subsections).flat().reduce((acc, item) => acc + (item.cost * item.quantity * item.days), 0);
                        const sectionCharge = Object.values(section.subsections).flat().reduce((acc, item) => acc + (item.charge * item.quantity * item.days), 0);
                        const isVisible = sectionCharge > 0 || sectionCost > 0;

                        if (!isVisible) return null;

                        return (
                            <div key={section.id} className="flex items-center justify-between text-sm group">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: section.color }}></div>
                                    <span className="text-gray-300">{section.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-200">{toDisplay(sectionCharge)}</p>
                                    <p className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Margin: {sectionCharge > 0 ? Math.round(((sectionCharge - sectionCost) / sectionCharge) * 100) : 0}%
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
});

export default QuoteSummary;
