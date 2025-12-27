import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../../hooks/useCurrency';

const availableItems = [
    { id: 'director', name: 'Director', category: 'Crew', baseCost: 400, baseRate: 600 },
    { id: 'dp', name: 'Director of Photography', category: 'Crew', baseCost: 350, baseRate: 550 },
    { id: 'camera-op', name: 'Camera Operator', category: 'Crew', baseCost: 280, baseRate: 450 },
    { id: 'gaffer', name: 'Gaffer', category: 'Crew', baseCost: 250, baseRate: 400 },
    { id: 'sound', name: 'Sound Recordist', category: 'Crew', baseCost: 220, baseRate: 380 },
    { id: 'editor', name: 'Editor', category: 'Crew', baseCost: 300, baseRate: 500 },
    { id: 'camera-pkg', name: 'Camera Package', category: 'Equipment', baseCost: 200, baseRate: 350 },
    { id: 'lighting', name: 'Lighting Kit', category: 'Equipment', baseCost: 150, baseRate: 280 },
    { id: 'audio-pkg', name: 'Audio Package', category: 'Equipment', baseCost: 100, baseRate: 180 },
];

const initialItems = [
    { ...availableItems[0], days: 2, id: 'item-1' },
    { ...availableItems[6], days: 2, id: 'item-2' },
    { ...availableItems[5], days: 3, id: 'item-3' },
];

export default function QuotingDemo() {
    const { formatPrice } = useCurrency();
    const [items, setItems] = useState(initialItems);
    const [showAddMenu, setShowAddMenu] = useState(false);

    const calculations = useMemo(() => {
        const totalCost = items.reduce((sum, item) => sum + (item.baseCost * item.days), 0);
        const totalCharge = items.reduce((sum, item) => sum + (item.baseRate * item.days), 0);
        const profit = totalCharge - totalCost;
        const margin = totalCharge > 0 ? ((profit / totalCharge) * 100).toFixed(1) : 0;
        return { totalCost, totalCharge, profit, margin };
    }, [items]);

    const handleAddItem = (item) => {
        setItems([...items, { ...item, days: 1, id: `item-${Date.now()}` }]);
        setShowAddMenu(false);
    };

    const handleRemoveItem = (itemId) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const handleDaysChange = (itemId, delta) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const newDays = Math.max(1, Math.min(10, item.days + delta));
                return { ...item, days: newDays };
            }
            return item;
        }));
    };

    const getMarginColor = (margin) => {
        if (margin >= 30) return 'text-green-400';
        if (margin >= 20) return 'text-amber-400';
        return 'text-red-400';
    };

    const getMarginBg = (margin) => {
        if (margin >= 30) return 'bg-green-500/20 border-green-500/30';
        if (margin >= 20) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    // Filter out already-added items
    const addableItems = availableItems.filter(
        avail => !items.some(item => item.name === avail.name)
    );

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Quote Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold text-base sm:text-lg truncate">Brand Launch Video</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Acme Corp</p>
                </div>
                <span className="px-2 sm:px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                    Draft
                </span>
            </div>

            {/* Line Items - Card layout on mobile, table on desktop */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                {/* Desktop Table - hidden on mobile */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 text-left border-b border-gray-700/50">
                                <th className="px-4 py-3 font-medium">Item</th>
                                <th className="px-4 py-3 font-medium text-center w-24">Days</th>
                                <th className="px-4 py-3 font-medium text-right">Cost</th>
                                <th className="px-4 py-3 font-medium text-right">Charge</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {items.map((item) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20, height: 0 }}
                                        className="border-b border-gray-700/30"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="text-white">{item.name}</div>
                                            <div className="text-gray-500 text-xs">{item.category}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleDaysChange(item.id, -1)}
                                                    className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center text-sm"
                                                >
                                                    -
                                                </button>
                                                <motion.span
                                                    key={item.days}
                                                    initial={{ scale: 1.2 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-8 text-center text-white font-medium"
                                                >
                                                    {item.days}
                                                </motion.span>
                                                <button
                                                    onClick={() => handleDaysChange(item.id, 1)}
                                                    className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center text-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-400">
                                            {formatPrice(item.baseCost * item.days)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <motion.span
                                                key={item.baseRate * item.days}
                                                initial={{ scale: 1.1, color: '#6366f1' }}
                                                animate={{ scale: 1, color: '#ffffff' }}
                                                className="font-medium"
                                            >
                                                {formatPrice(item.baseRate * item.days)}
                                            </motion.span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="sm:hidden divide-y divide-gray-700/30">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-3"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-white text-sm font-medium truncate">{item.name}</div>
                                        <div className="text-gray-500 text-xs">{item.category}</div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDaysChange(item.id, -1)}
                                            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center text-lg font-medium"
                                        >
                                            -
                                        </button>
                                        <motion.span
                                            key={item.days}
                                            initial={{ scale: 1.2 }}
                                            animate={{ scale: 1 }}
                                            className="w-8 text-center text-white font-medium"
                                        >
                                            {item.days}
                                        </motion.span>
                                        <button
                                            onClick={() => handleDaysChange(item.id, 1)}
                                            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center text-lg font-medium"
                                        >
                                            +
                                        </button>
                                        <span className="text-gray-500 text-xs ml-1">days</span>
                                    </div>
                                    <motion.span
                                        key={item.baseRate * item.days}
                                        initial={{ scale: 1.1, color: '#6366f1' }}
                                        animate={{ scale: 1, color: '#ffffff' }}
                                        className="font-semibold text-sm"
                                    >
                                        {formatPrice(item.baseRate * item.days)}
                                    </motion.span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Add Item Button */}
                <div className="px-3 sm:px-4 py-3 border-t border-gray-700/30 relative">
                    <button
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="min-h-[44px] text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-2 py-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Line Item
                    </button>

                    {/* Add Menu Dropdown */}
                    <AnimatePresence>
                        {showAddMenu && addableItems.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute left-3 sm:left-4 bottom-full mb-2 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden w-[calc(100%-1.5rem)] sm:w-auto sm:min-w-[200px]"
                            >
                                {addableItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddItem(item)}
                                        className="w-full min-h-[44px] px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex justify-between items-center gap-2"
                                    >
                                        <span className="truncate">{item.name}</span>
                                        <span className="text-gray-500 text-xs whitespace-nowrap">{formatPrice(item.baseRate)}/day</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Totals Summary */}
            <motion.div
                className={`rounded-lg p-3 sm:p-4 border ${getMarginBg(parseFloat(calculations.margin))}`}
                layout
            >
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-gray-400 text-xs sm:text-sm">Your Profit</p>
                        <motion.p
                            key={calculations.profit}
                            className={`text-xl sm:text-2xl font-bold ${getMarginColor(parseFloat(calculations.margin))}`}
                            initial={{ scale: 0.95, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            {formatPrice(calculations.profit)}
                        </motion.p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-xs sm:text-sm">Margin</p>
                        <motion.p
                            key={calculations.margin}
                            className={`text-xl sm:text-2xl font-bold ${getMarginColor(parseFloat(calculations.margin))}`}
                            initial={{ scale: 0.95, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            {calculations.margin}%
                        </motion.p>
                    </div>
                </div>
                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                    <span className="text-gray-400">
                        Cost: <span className="text-gray-300">{formatPrice(calculations.totalCost)}</span>
                    </span>
                    <span className="text-gray-400">
                        Quote Total: <span className="text-white font-semibold">{formatPrice(calculations.totalCharge)}</span>
                    </span>
                </div>
            </motion.div>

            {/* Export Button (disabled) */}
            <div className="relative group">
                <button
                    disabled
                    className="w-full min-h-[48px] py-3 bg-gray-700 text-gray-400 font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm sm:text-base">Export PDF</span>
                </button>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-gray-900 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">
                        Sign up to export quotes
                    </span>
                </div>
            </div>

            <p className="text-center text-gray-500 text-xs sm:text-sm">
                Try adding items and changing quantities
            </p>
        </div>
    );
}
