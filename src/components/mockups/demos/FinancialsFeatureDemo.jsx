import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../../hooks/useCurrency';

const initialProjects = [
    {
        id: 1,
        name: 'Nike Campaign',
        revenue: 25000,
        expenses: [
            { id: 1, category: 'Crew', description: 'Director (2 days)', amount: 1200 },
            { id: 2, category: 'Crew', description: 'DP (3 days)', amount: 1650 },
            { id: 3, category: 'Equipment', description: 'Camera rental', amount: 800 },
            { id: 4, category: 'Travel', description: 'Flights + Hotel', amount: 1500 },
        ],
        invoiceStatus: 'paid'
    },
    {
        id: 2,
        name: 'Corporate Video',
        revenue: 12000,
        expenses: [
            { id: 1, category: 'Crew', description: 'Director (1 day)', amount: 600 },
            { id: 2, category: 'Crew', description: 'Editor (3 days)', amount: 1500 },
            { id: 3, category: 'Equipment', description: 'Audio kit', amount: 200 },
        ],
        invoiceStatus: 'sent'
    },
];

const expenseCategories = ['Crew', 'Equipment', 'Travel', 'Catering', 'Other'];

export default function FinancialsFeatureDemo() {
    const { formatPrice, formatPriceShort } = useCurrency();
    const [projects, setProjects] = useState(initialProjects);
    const [selectedProjectId, setSelectedProjectId] = useState(1);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [newExpense, setNewExpense] = useState({ category: 'Crew', description: '', amount: '' });

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const calculations = useMemo(() => {
        if (!selectedProject) return { totalExpenses: 0, profit: 0, margin: 0 };
        const totalExpenses = selectedProject.expenses.reduce((sum, e) => sum + e.amount, 0);
        const profit = selectedProject.revenue - totalExpenses;
        const margin = selectedProject.revenue > 0 ? ((profit / selectedProject.revenue) * 100).toFixed(1) : 0;
        return { totalExpenses, profit, margin };
    }, [selectedProject]);

    const handleAddExpense = () => {
        if (!newExpense.description || !newExpense.amount) return;

        setProjects(projects.map(p => {
            if (p.id === selectedProjectId) {
                return {
                    ...p,
                    expenses: [
                        ...p.expenses,
                        {
                            id: Date.now(),
                            category: newExpense.category,
                            description: newExpense.description,
                            amount: parseFloat(newExpense.amount)
                        }
                    ]
                };
            }
            return p;
        }));

        setNewExpense({ category: 'Crew', description: '', amount: '' });
        setShowAddExpense(false);
    };

    const getMarginColor = (margin) => {
        if (margin >= 30) return 'text-green-400';
        if (margin >= 15) return 'text-amber-400';
        return 'text-red-400';
    };

    const getMarginBg = (margin) => {
        if (margin >= 30) return 'bg-green-500/20 border-green-500/30';
        if (margin >= 15) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    const getInvoiceStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-500/20 text-green-400';
            case 'sent': return 'bg-amber-500/20 text-amber-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Project Selector */}
            <div className="flex gap-2">
                {projects.map(project => (
                    <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`flex-1 min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors truncate ${selectedProjectId === project.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        {project.name}
                    </button>
                ))}
            </div>

            {selectedProject && (
                <>
                    {/* Revenue & Invoice */}
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700/50">
                        <div className="flex items-center justify-between mb-3 gap-2">
                            <div className="min-w-0 flex-1">
                                <p className="text-gray-400 text-xs sm:text-sm">Total Revenue</p>
                                <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(selectedProject.revenue)}</p>
                            </div>
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 ${getInvoiceStyle(selectedProject.invoiceStatus)}`}>
                                Invoice {selectedProject.invoiceStatus}
                            </span>
                        </div>
                    </div>

                    {/* Expenses List */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-700/50 flex items-center justify-between">
                            <h4 className="text-white font-medium text-xs sm:text-sm">Expenses</h4>
                            <span className="text-gray-400 text-xs sm:text-sm">{formatPrice(calculations.totalExpenses)}</span>
                        </div>

                        <div className="divide-y divide-gray-700/30 max-h-[150px] sm:max-h-[180px] overflow-auto">
                            <AnimatePresence>
                                {selectedProject.expenses.map((expense) => (
                                    <motion.div
                                        key={expense.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="text-white text-xs sm:text-sm truncate block">{expense.description}</span>
                                            <span className="text-gray-500 text-[10px] sm:text-xs">({expense.category})</span>
                                        </div>
                                        <span className="text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap">{formatPrice(expense.amount)}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Add Expense */}
                        <div className="px-3 sm:px-4 py-3 border-t border-gray-700/50">
                            {showAddExpense ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-2"
                                >
                                    {/* Mobile: stacked layout */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <select
                                            value={newExpense.category}
                                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                            className="min-h-[40px] px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                                        >
                                            {expenseCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={newExpense.description}
                                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                            className="flex-1 min-h-[40px] px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            className="w-full sm:w-24 min-h-[40px] px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowAddExpense(false)}
                                            className="flex-1 min-h-[40px] py-1 bg-gray-700 text-gray-300 rounded text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddExpense}
                                            className="flex-1 min-h-[40px] py-1 bg-indigo-600 text-white rounded text-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => setShowAddExpense(true)}
                                    className="min-h-[44px] text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 py-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Expense
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profit Summary */}
                    <motion.div
                        className={`rounded-lg p-3 sm:p-4 border ${getMarginBg(parseFloat(calculations.margin))}`}
                        layout
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs sm:text-sm">Net Profit</p>
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

                        {/* Profit Bar */}
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Expenses</span>
                                <span>Profit</span>
                            </div>
                            <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
                                <motion.div
                                    className="bg-red-500/60"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(calculations.totalExpenses / selectedProject.revenue) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                                <motion.div
                                    className={`${parseFloat(calculations.margin) >= 30 ? 'bg-green-500' : parseFloat(calculations.margin) >= 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(calculations.profit / selectedProject.revenue) * 100}%` }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            <p className="text-center text-gray-500 text-xs sm:text-sm">
                Try adding expenses to see profit update
            </p>
        </div>
    );
}
