import { useState, useMemo } from 'react';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { useSettingsStore } from '../store/settingsStore';
import { calculateGrandTotalWithFees } from '../utils/calculations';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { CURRENCIES } from '../data/currencies';

// Status colors aligned with brand palette for visual harmony
const STATUSES = [
    { id: 'draft', label: 'Drafts', color: '#9CA3AF', bgColor: 'bg-gray-400/10' },
    { id: 'sent', label: 'Sent', color: '#0F8B8D', bgColor: 'bg-[#0F8B8D]/10' },      // Brand Teal
    { id: 'won', label: 'Won', color: '#22c55e', bgColor: 'bg-green-500/10' },
    { id: 'dead', label: 'Lost', color: '#F87171', bgColor: 'bg-red-400/10' },
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
    const [pipelineMinimized, setPipelineMinimized] = useState(false);

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

    // Filter quotes by month/year and sort by most recent
    const filteredQuotes = useMemo(() => {
        const filtered = savedQuotes.filter(q => {
            if (!q) return false;
            const date = new Date(q.savedAt || q.createdAt);
            const matchesYear = date.getFullYear() === selectedYear;
            const matchesMonth = selectedMonth === 'all' || date.getMonth() === parseInt(selectedMonth);
            return matchesYear && matchesMonth;
        });

        // Sort by most recent (updatedAt or savedAt or createdAt)
        return filtered.sort((a, b) => {
            const dateA = new Date(a?.updatedAt || a?.savedAt || a?.createdAt || 0);
            const dateB = new Date(b?.updatedAt || b?.savedAt || b?.createdAt || 0);
            return dateB - dateA; // Most recent first
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

    // Calculate 3-month and 6-month forecasts based on project start dates
    const forecastStats = useMemo(() => {
        const now = new Date();
        const threeMonthsOut = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        const sixMonthsOut = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

        let forecast3mRevenue = 0;
        let forecast3mProfit = 0;
        let forecast6mRevenue = 0;
        let forecast6mProfit = 0;

        // Look at pipeline quotes (draft + sent) with project start dates
        savedQuotes.forEach(q => {
            if (q.status !== 'draft' && q.status !== 'sent') return;

            const startDate = q.project?.startDate ? new Date(q.project.startDate) : null;
            if (!startDate || startDate < now) return;

            const calculations = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
            const revenue = convertCurrency(calculations.totalCharge, q.currency || 'USD', dashboardCurrency, rates);
            const cost = convertCurrency(calculations.totalCost, q.currency || 'USD', dashboardCurrency, rates);
            const profit = revenue - cost;

            if (startDate <= threeMonthsOut) {
                forecast3mRevenue += revenue;
                forecast3mProfit += profit;
            }
            if (startDate <= sixMonthsOut) {
                forecast6mRevenue += revenue;
                forecast6mProfit += profit;
            }
        });

        return {
            threeMonth: { revenue: forecast3mRevenue, profit: forecast3mProfit },
            sixMonth: { revenue: forecast6mRevenue, profit: forecast6mProfit }
        };
    }, [savedQuotes, rates, dashboardCurrency]);


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
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-100">Welcome back, {userName}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Pipeline Dashboard</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* New Quote Button - uses brand teal via btn-primary */}
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

                {/* Financial Summary - Combined view for better scannability */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {/* Confirmed (Won) */}
                    <div className="card bg-gradient-to-br from-green-900/30 to-green-950/20 border-green-800/30 p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-medium text-green-400/90 uppercase tracking-wide">Won</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Revenue</p>
                                <p className="text-sm font-semibold text-green-400 tabular-nums">
                                    {formatCurrency(financialStats.won.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Profit</p>
                                <p className="text-sm font-semibold text-green-400 tabular-nums">
                                    {formatCurrency(financialStats.won.profit, dashboardCurrency, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pipeline (Draft + Sent) */}
                    <div className="card bg-gradient-to-br from-[#0F8B8D]/10 to-[#143642]/10 border-[#0F8B8D]/20 p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#0F8B8D]"></div>
                            <span className="text-[10px] font-medium text-[#0F8B8D]/90 uppercase tracking-wide">Pipeline</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Revenue</p>
                                <p className="text-sm font-semibold text-gray-200 tabular-nums">
                                    {formatCurrency(financialStats.pipeline.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Profit</p>
                                <p className="text-sm font-semibold text-gray-300 tabular-nums">
                                    {formatCurrency(financialStats.pipeline.profit, dashboardCurrency, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3-Month Forecast */}
                    <div className="card bg-gradient-to-br from-amber-900/20 to-amber-950/10 border-amber-800/20 p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-medium text-amber-400/90 uppercase tracking-wide">3-Month Forecast</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Revenue</p>
                                <p className="text-sm font-semibold text-amber-400 tabular-nums">
                                    {formatCurrency(forecastStats.threeMonth.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Profit</p>
                                <p className="text-sm font-semibold text-amber-400/80 tabular-nums">
                                    {formatCurrency(forecastStats.threeMonth.profit, dashboardCurrency, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 6-Month Forecast */}
                    <div className="card bg-gradient-to-br from-purple-900/20 to-purple-950/10 border-purple-800/20 p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-[10px] font-medium text-purple-400/90 uppercase tracking-wide">6-Month Forecast</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Revenue</p>
                                <p className="text-sm font-semibold text-purple-400 tabular-nums">
                                    {formatCurrency(forecastStats.sixMonth.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Profit</p>
                                <p className="text-sm font-semibold text-purple-400/80 tabular-nums">
                                    {formatCurrency(forecastStats.sixMonth.profit, dashboardCurrency, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pipeline Summary Cards - Compact horizontal strip */}
                <div className="flex gap-3">
                    {STATUSES.map(status => (
                        <div
                            key={status.id}
                            className={`flex-1 rounded-lg px-3 py-2 ${status.bgColor} border border-white/5`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    <span className="text-xs font-medium text-gray-400">{status.label}</span>
                                    <span className="text-xs text-gray-600 tabular-nums">({pipelineData[status.id].length})</span>
                                </div>
                                <span className="text-sm font-semibold tabular-nums" style={{ color: status.color }}>
                                    {formatCurrency(totals[status.id], dashboardCurrency)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Pipeline Columns */}
            <div className="p-4">
                {/* Pipeline Header with Minimize Toggle */}
                <button
                    onClick={() => setPipelineMinimized(!pipelineMinimized)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-3 hover:text-white transition-colors"
                >
                    <svg className={`w-4 h-4 transition-transform ${pipelineMinimized ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Pipeline Board
                    <span className="text-xs text-gray-600 font-normal">({filteredQuotes.length} quotes)</span>
                </button>

                {!pipelineMinimized && (
                <div className="grid grid-cols-4 gap-4 min-h-[400px] items-start">
                    {STATUSES.map(status => {
                        const isCollapsed = collapsedColumns[status.id];
                        return (
                            <div
                                key={status.id}
                                className={`space-y-2 rounded-xl transition-colors ${dragOverColumn === status.id ? 'bg-white/5 ring-2 ring-[#0F8B8D]/30' : ''}`}
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
                                    <div className="space-y-3 px-1 pb-3">
                                        {pipelineData[status.id].length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-dark-border/50 rounded-xl bg-dark-bg/30">
                                                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                No quotes yet
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
                                                        className={`w-full card text-left hover:border-white/15 transition-all cursor-move
                                                            ${draggedQuoteId === quote.id ? 'opacity-50 scale-95' : 'opacity-100'}
                                                            active:cursor-grabbing hover:shadow-lg group relative`}
                                                    >
                                                        {/* Delete button */}
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

                                                        {/* Quote number and date */}
                                                        <div className="flex justify-between items-start mb-1.5 pr-6">
                                                            <p className="text-[11px] text-gray-500 font-mono tracking-tight">{quote.quoteNumber}</p>
                                                            {quote.project?.startDate && (
                                                                <span className="text-[10px] bg-dark-bg/70 px-1.5 py-0.5 rounded text-gray-500">
                                                                    {new Date(quote.project.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Client name */}
                                                        <p className="text-sm font-medium text-gray-200 mb-0.5 truncate">
                                                            {getClientName(quote)}
                                                        </p>
                                                        {/* Project title */}
                                                        {quote.project?.title && (
                                                            <p className="text-xs text-gray-500 truncate mb-2">{quote.project.title}</p>
                                                        )}
                                                        {/* Amount */}
                                                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                                            <span className="text-sm font-semibold tabular-nums" style={{ color: status.color }}>
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
                )}
            </div>
        </div>
    );
}
