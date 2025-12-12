import { useQuoteStore } from '../../store/quoteStore';

export default function FeesEditor() {
    const { quote, setFees } = useQuoteStore();
    const fees = quote.fees || { managementFee: 0, commissionFee: 0, discount: 0 };

    const handleChange = (field, value) => {
        const numValue = parseFloat(value) || 0;
        // Clamp between 0 and 100
        const clampedValue = Math.min(100, Math.max(0, numValue));
        setFees({ [field]: clampedValue });
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Fees & Adjustments
            </h3>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="label">Management %</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={fees.managementFee || 0}
                            onChange={(e) => handleChange('managementFee', e.target.value)}
                            min="0"
                            max="100"
                            step="0.5"
                            className="input pr-8 text-center"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Added to charge</p>
                </div>

                <div>
                    <label className="label">Commission %</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={fees.commissionFee || 0}
                            onChange={(e) => handleChange('commissionFee', e.target.value)}
                            min="0"
                            max="100"
                            step="0.5"
                            className="input pr-8 text-center"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Added to charge</p>
                </div>

                <div>
                    <label className="label">Discount %</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={fees.discount || 0}
                            onChange={(e) => handleChange('discount', e.target.value)}
                            min="0"
                            max="100"
                            step="0.5"
                            className="input pr-8 text-center"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Off final total</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={fees.distributeFees || false}
                        onChange={(e) => setFees({ distributeFees: e.target.checked })}
                        className="checkbox border-gray-600 rounded bg-gray-900 group-hover:border-accent-primary transition-colors"
                    />
                    <div>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Distribute Fees into Unit Rates</span>
                        <p className="text-xs text-gray-500">Hides separate fee line items on PDF by inflating unit prices</p>
                    </div>
                </label>
            </div>
        </div>
    );
}
