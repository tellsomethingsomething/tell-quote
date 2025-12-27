import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const demoQuote = {
    title: "Brand Campaign Video",
    client: "Acme Corp",
    lineItems: [
        { name: "Director", days: 2, baseCost: 400 },
        { name: "Camera Operator", days: 3, baseCost: 350 },
        { name: "Camera Package", days: 3, baseCost: 200 },
        { name: "Edit Suite", days: 5, baseCost: 150 },
    ]
};

export default function FinancialDemo() {
    const [markup, setMarkup] = useState(25);
    const [hoveredRow, setHoveredRow] = useState(null);

    const calculations = useMemo(() => {
        const items = demoQuote.lineItems.map(item => {
            const totalCost = item.baseCost * item.days;
            const charge = totalCost * (1 + markup / 100);
            const profit = charge - totalCost;
            return {
                ...item,
                totalCost,
                charge: Math.round(charge),
                profit: Math.round(profit)
            };
        });

        const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
        const totalCharge = items.reduce((sum, item) => sum + item.charge, 0);
        const totalProfit = totalCharge - totalCost;
        const marginPercent = ((totalProfit / totalCharge) * 100).toFixed(1);

        return { items, totalCost, totalCharge, totalProfit, marginPercent };
    }, [markup]);

    const getMarginColor = (margin) => {
        if (margin >= 25) return 'text-green-400';
        if (margin >= 15) return 'text-amber-400';
        return 'text-red-400';
    };

    const getMarginBg = (margin) => {
        if (margin >= 25) return 'bg-green-500/20 border-green-500/30';
        if (margin >= 15) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    return (
        <div className="p-4 sm:p-6 space-y-5">
            {/* Quote Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold text-lg">{demoQuote.title}</h3>
                    <p className="text-gray-400 text-sm">{demoQuote.client}</p>
                </div>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                    Draft
                </span>
            </div>

            {/* Line Items Table */}
            <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-400 text-left border-b border-gray-700/50">
                            <th className="px-4 py-3 font-medium">Item</th>
                            <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Days</th>
                            <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Cost</th>
                            <th className="px-4 py-3 font-medium text-right">Charge</th>
                            <th className="px-4 py-3 font-medium text-right">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculations.items.map((item, index) => (
                            <motion.tr
                                key={item.name}
                                className="border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors cursor-default"
                                onMouseEnter={() => setHoveredRow(index)}
                                onMouseLeave={() => setHoveredRow(null)}
                                initial={false}
                                animate={{
                                    backgroundColor: hoveredRow === index ? 'rgba(55, 65, 81, 0.3)' : 'transparent'
                                }}
                            >
                                <td className="px-4 py-3 text-white">
                                    {item.name}
                                    <span className="sm:hidden text-gray-500 text-xs ml-2">
                                        ({item.days}d)
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-300 hidden sm:table-cell">
                                    {item.days}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                                    ${item.totalCost.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-white font-medium">
                                    <motion.span
                                        key={item.charge}
                                        initial={{ opacity: 0.5, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        ${item.charge.toLocaleString()}
                                    </motion.span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <motion.span
                                        key={item.profit}
                                        className="text-green-400 font-medium"
                                        initial={{ opacity: 0.5, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        +${item.profit.toLocaleString()}
                                    </motion.span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Markup Slider */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 text-sm font-medium">Adjust Markup</span>
                    <motion.span
                        key={markup}
                        className="text-indigo-400 font-bold text-lg"
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                    >
                        {markup}%
                    </motion.span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="50"
                    value={markup}
                    onChange={(e) => setMarkup(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    style={{
                        background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${markup * 2}%, #374151 ${markup * 2}%, #374151 100%)`
                    }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                </div>
            </div>

            {/* Profit Summary */}
            <motion.div
                className={`rounded-lg p-4 border ${getMarginBg(parseFloat(calculations.marginPercent))}`}
                layout
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Your Profit on this Quote</p>
                        <motion.p
                            key={calculations.totalProfit}
                            className={`text-2xl font-bold ${getMarginColor(parseFloat(calculations.marginPercent))}`}
                            initial={{ scale: 0.95, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            ${calculations.totalProfit.toLocaleString()}
                        </motion.p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-sm">Margin</p>
                        <motion.p
                            key={calculations.marginPercent}
                            className={`text-2xl font-bold ${getMarginColor(parseFloat(calculations.marginPercent))}`}
                            initial={{ scale: 0.95, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            {calculations.marginPercent}%
                        </motion.p>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-sm">
                    <span className="text-gray-400">
                        Total Cost: <span className="text-gray-300">${calculations.totalCost.toLocaleString()}</span>
                    </span>
                    <span className="text-gray-400">
                        Quote Total: <span className="text-white font-semibold">${calculations.totalCharge.toLocaleString()}</span>
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
