import { useState, useMemo } from 'react';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { useSettingsStore } from '../store/settingsStore';
import { calculateGrandTotalWithFees } from '../utils/calculations';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { CURRENCIES } from '../data/currencies';

const STATUSES = [
    { id: 'draft', label: 'In Drafts', color: '#6b7280', bgColor: 'bg-gray-500/10' },
    { id: 'sent', label: 'Sent', color: '#3b82f6', bgColor: 'bg-blue-500/10' },
    { id: 'won', label: 'Won', color: '#22c55e', bgColor: 'bg-green-500/10' },
    { id: 'dead', label: 'Dead', color: '#ef4444', bgColor: 'bg-red-500/10' },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function DashboardPage({ onViewQuote, onNewQuote }) {
    const { savedQuotes, clients, updateQuoteStatus } = useClientStore();
    const { rates, ratesUpdated, refreshRates, ratesLoading } = useQuoteStore();
    const { settings } = useSettingsStore();
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [dashboardCurrency, setDashboardCurrency] = useState('USD');
    const [draggedQuoteId, setDraggedQuoteId] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

    const [collapsedColumns, setCollapsedColumns] = useState({});

    // Toggle column collapse
    const toggleColumn = (statusId) => {
        setCollapsedColumns(prev => ({
            ...prev,
            [statusId]: !prev[statusId]
        }));
    };

    // Get active user name (assuming first user or default for now, can improve later with proper auth context)
    const userName = settings?.users?.[0]?.name || 'User';

    // Get unique years from quotes
    const years = useMemo(() => {
        const yearSet = new Set();
        savedQuotes.forEach(q => {
            const date = new Date(q.savedAt || q.createdAt);
            yearSet.add(date.getFullYear());
        });
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [savedQuotes]);

    // Filter quotes by month/year and sort by Event Date
    const filteredQuotes = useMemo(() => {
        const filtered = savedQuotes.filter(q => {
            if (!q) return false;
            const date = new Date(q.savedAt || q.createdAt);
            const matchesYear = date.getFullYear() === selectedYear;
            const matchesMonth = selectedMonth === 'all' || date.getMonth() === parseInt(selectedMonth);
            return matchesYear && matchesMonth;
        });

        // Sort by Project Start Date (Earliest first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a?.project?.startDate || '9999-12-31');
            const dateB = new Date(b?.project?.startDate || '9999-12-31');
            return dateA - dateB;
        });
    }, [savedQuotes, selectedMonth, selectedYear]);

    // Group quotes by status
    const pipelineData = useMemo(() => {
        const data = {};
        STATUSES.forEach(s => {
            data[s.id] = filteredQuotes.filter(q => (q?.status || 'draft') === s.id);
        });
        return data;
    }, [filteredQuotes]);

    // Calculate totals (normalized to dashboardCurrency)
    const totals = useMemo(() => {
        const result = {};
        STATUSES.forEach(s => {
            result[s.id] = pipelineData[s.id].reduce((sum, q) => {
                const total = calculateGrandTotalWithFees(q?.sections || {}, q?.fees || {});
                // Convert to dashboardCurrency if not already
                const amount = convertCurrency(total.totalCharge, q.currency || 'USD', dashboardCurrency, rates);
                return sum + amount;
            }, 0);
        });
        return result;
    }, [pipelineData, rates, dashboardCurrency]);

    // Calculate Company-wide Stats includes...
    // ... (rest of stats logic same as before, omitted for brevity if unchanged logic, but tool requires contiguous replacement)
    const financialStats = useMemo(() => {
        // Won Stats
        let wonRevenue = 0;
        let wonProfit = 0;
        let wonMargin = 0;
        let wonCount = 0;

        // Pipeline Stats (Draft + Sent)
        let pipelineRevenue = 0;
        let pipelineProfit = 0;
        let pipelineMargin = 0;
        let pipelineCount = 0;

        filteredQuotes.forEach(q => {
            const calculations = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
            const revenue = convertCurrency(calculations.totalCharge, q.currency || 'USD', dashboardCurrency, rates);
            const cost = convertCurrency(calculations.totalCost, q.currency || 'USD', dashboardCurrency, rates);

            if (q.status === 'won') {
                wonRevenue += revenue;
                wonProfit += (revenue - cost);
                wonMargin += calculations.margin;
                wonCount++;
            } else if (q.status === 'draft' || q.status === 'sent') {
                pipelineRevenue += revenue;
                pipelineProfit += (revenue - cost);
                pipelineMargin += calculations.margin;
                pipelineCount++;
            }
        });

        return {
            won: {
                revenue: wonRevenue,
                profit: wonProfit,
                avgMargin: wonCount > 0 ? (wonMargin / wonCount) : 0
            },
            pipeline: {
                revenue: pipelineRevenue,
                profit: pipelineProfit,
                avgMargin: pipelineCount > 0 ? (pipelineMargin / pipelineCount) : 0
            }
        };
    }, [filteredQuotes, rates, dashboardCurrency]);


    // Get client name
    const getClientName = (quote) => {
        if (quote.client?.company) return quote.client.company;
        const client = clients.find(c => c.id === quote.clientId);
        return client?.company || 'Unknown';
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, quoteId) => {
        setDraggedQuoteId(quoteId);
        e.dataTransfer.setData('quoteId', quoteId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, statusId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverColumn !== statusId) {
            setDragOverColumn(statusId);
        }
    };

    const handleDragLeave = () => {
        // intentionally empty
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        setDraggedQuoteId(null);

        const quoteId = e.dataTransfer.getData('quoteId');
        if (quoteId) {
            updateQuoteStatus(quoteId, newStatus);
        }
    };

    const handleDragEnd = () => {
        setDraggedQuoteId(null);
        setDragOverColumn(null);
    };

    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto">
            {/* Header / Navigation */}
            <div className="bg-dark-bg border-b border-dark-border p-6">

                {/* Top Bar with Title and Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-100">Welcome back, {userName}</h1>
                        <p className="text-sm text-gray-500">Pipeline Dashboard in {dashboardCurrency}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* New Quote Button */}
                        <button
                            onClick={() => onNewQuote && onNewQuote()}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Quote
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Filters:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="input-sm text-sm w-32"
                        >
                            {years.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="input-sm text-sm w-40"
                        >
                            <option value="all">All Months</option>
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>

                        {/* Dashboard Currency Selector */}
                        <div className="h-4 w-px bg-dark-border mx-2"></div>
                        <span className="text-sm text-gray-500">View:</span>
                        <select
                            value={dashboardCurrency}
                            onChange={(e) => setDashboardCurrency(e.target.value)}
                            className="input-sm text-sm w-24"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="MYR">MYR (RM)</option>
                        </select>
                    </div>

                    {/* Exchange Rate Status */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto mr-4">
                        <span>Rates updated: {ratesUpdated ? new Date(ratesUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                        <button
                            onClick={refreshRates}
                            disabled={ratesLoading}
                            className={`p-1 hover:text-white transition-colors ${ratesLoading ? 'animate-spin' : ''}`}
                            title="Refresh Exchange Rates"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-xs text-gray-600">
                        {filteredQuotes.length} quotes found
                    </div>
                </div>

                {/* Financial Summary - Actuals (Won) */}
                <div className="grid grid-cols-3 gap-6 mb-4">
                    <div className="card bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-900/50">
                        <p className="text-sm text-green-400/80 mb-1">Confirmed Revenue (Won)</p>
                        <p className="text-2xl font-bold text-green-400 tracking-tight">
                            {formatCurrency(financialStats.won.revenue, dashboardCurrency)}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-900/50">
                        <p className="text-sm text-green-400/80 mb-1">Confirmed Profit (Won)</p>
                        <p className="text-2xl font-bold text-green-400 tracking-tight">
                            {formatCurrency(financialStats.won.profit, dashboardCurrency)}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-900/50">
                        <p className="text-sm text-green-400/80 mb-1">Avg Margin (Won)</p>
                        <p className="text-2xl font-bold text-green-400 tracking-tight">
                            {financialStats.won.avgMargin.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Financial Summary - Forecast (Draft + Sent) */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-none">
                        <p className="text-sm text-gray-400 mb-1">Pipeline Potential (Draft + Sent)</p>
                        <p className="text-2xl font-bold text-white tracking-tight">
                            {formatCurrency(financialStats.pipeline.revenue, dashboardCurrency)}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-none">
                        <p className="text-sm text-gray-400 mb-1">Pipeline Profit Potential</p>
                        <p className="text-2xl font-bold text-gray-200 tracking-tight">
                            {formatCurrency(financialStats.pipeline.profit, dashboardCurrency)}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-none">
                        <p className="text-sm text-gray-400 mb-1">Avg Margin (Pipeline)</p>
                        <p className="text-2xl font-bold text-gray-200 tracking-tight">
                            {financialStats.pipeline.avgMargin.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Pipeline Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {STATUSES.map(status => (
                        <div
                            key={status.id}
                            className={`rounded-lg p-4 ${status.bgColor} border border-white/5`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400">{status.label}</span>
                                <span className="text-xs text-gray-500">{pipelineData[status.id].length}</span>
                            </div>
                            <p className="text-lg font-bold" style={{ color: status.color }}>
                                {formatCurrency(totals[status.id], dashboardCurrency)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pipeline Columns */}
            <div className="p-4">
                <div className="grid grid-cols-4 gap-4 min-h-[400px] items-start">
                    {STATUSES.map(status => {
                        const isCollapsed = collapsedColumns[status.id];
                        return (
                            <div
                                key={status.id}
                                className={`space-y-2 rounded-xl transition-colors ${dragOverColumn === status.id ? 'bg-white/5 ring-2 ring-accent-primary/20' : ''}`}
                                onDragOver={(e) => handleDragOver(e, status.id)}
                                onDrop={(e) => handleDrop(e, status.id)}
                                onDragLeave={handleDragLeave}
                            >
                                <div
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                                    style={{ backgroundColor: `${status.color}20` }}
                                    onClick={() => toggleColumn(status.id)}
                                    title={isCollapsed ? "Expand column" : "Collapse column"}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    <span className="text-sm font-medium text-gray-300">{status.label}</span>
                                    {isCollapsed ? (
                                        <svg className="w-3 h-3 text-gray-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3 h-3 text-gray-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    )}
                                </div>

                                {/* Quote Cards */}
                                {!isCollapsed && (
                                    <div className="space-y-2 px-1 pb-2">
                                        {pipelineData[status.id].length === 0 ? (
                                            <div className="text-center py-8 text-gray-600 text-sm border-2 border-dashed border-dark-border rounded-lg">
                                                No quotes
                                            </div>
                                        ) : (
                                            pipelineData[status.id].map(quote => {
                                                const total = calculateGrandTotalWithFees(quote.sections || {}, quote.fees || {});
                                                const displayAmount = convertCurrency(total.totalCharge, quote.currency || 'USD', dashboardCurrency, rates);

                                                return (
                                                    <div
                                                        key={quote.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, quote.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => onViewQuote && onViewQuote(quote)}
                                                        className={`w-full card text-left hover:border-white/20 transition-all cursor-move 
                                                            ${draggedQuoteId === quote.id ? 'opacity-50 scale-95' : 'opacity-100'}
                                                            active:cursor-grabbing hover:shadow-lg group relative pr-2`}
                                                    >
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm('Are you sure you want to delete this quote?')) {
                                                                        useClientStore.getState().deleteQuote(quote.id);
                                                                    }
                                                                }}
                                                                className="p-1 text-gray-500 hover:text-red-400 bg-dark-card rounded shadow-sm border border-dark-border"
                                                                title="Delete Quote"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        <div className="flex justify-between items-start mb-1 pr-6">
                                                            <p className="text-xs text-gray-500 font-mono">{quote.quoteNumber}</p>
                                                            {quote.project?.startDate && (
                                                                <span className="text-[10px] bg-dark-bg/50 px-1.5 py-0.5 rounded text-gray-400">
                                                                    {new Date(quote.project.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-200 mb-1 truncate">
                                                            {getClientName(quote)}
                                                        </p>
                                                        {quote.project?.title && (
                                                            <p className="text-xs text-gray-500 truncate mb-2">{quote.project.title}</p>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-bold" style={{ color: status.color }}>
                                                                {formatCurrency(displayAmount, dashboardCurrency)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
