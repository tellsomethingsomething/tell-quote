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
    { id: 'sent', label: 'Sent', color: '#0F8B8D', bgColor: 'bg-[#0F8B8D]/10' },
    { id: 'won', label: 'Won', color: '#22c55e', bgColor: 'bg-green-500/10' },
    { id: 'dead', label: 'Dead', color: '#F87171', bgColor: 'bg-red-400/10' },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Helper functions for quote expiry and follow-ups
function calculateExpiryDate(quoteDate, validityDays) {
    if (!quoteDate) return null;
    const date = new Date(quoteDate);
    date.setDate(date.getDate() + (parseInt(validityDays) || 30));
    return date;
}

function isQuoteExpired(quoteDate, validityDays) {
    const expiryDate = calculateExpiryDate(quoteDate, validityDays);
    if (!expiryDate) return false;
    return new Date() > expiryDate;
}

function isExpiringSoon(quoteDate, validityDays, daysThreshold = 7) {
    const expiryDate = calculateExpiryDate(quoteDate, validityDays);
    if (!expiryDate) return false;
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
}

function isFollowUpOverdue(nextFollowUpDate) {
    if (!nextFollowUpDate) return false;
    return new Date(nextFollowUpDate) < new Date();
}

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

    // Loss reason modal state
    const [lossReasonModal, setLossReasonModal] = useState({ open: false, quoteId: null, newStatus: null });
    const [lossReason, setLossReason] = useState('');
    const [lossReasonNotes, setLossReasonNotes] = useState('');

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

    // Calculate 3-month and 6-month forecasts based on project/event start dates
    // Split into Won (confirmed) and Pipeline (potential) for overall business view
    const forecastStats = useMemo(() => {
        const now = new Date();
        const threeMonthsOut = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        const sixMonthsOut = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

        let won3m = { revenue: 0, profit: 0 };
        let pipeline3m = { revenue: 0, profit: 0 };
        let won6m = { revenue: 0, profit: 0 };
        let pipeline6m = { revenue: 0, profit: 0 };

        savedQuotes.forEach(q => {
            // Skip lost/dead quotes
            if (q.status === 'dead') return;

            const startDate = q.project?.startDate ? new Date(q.project.startDate) : null;
            if (!startDate || startDate < now) return;

            const calculations = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
            const revenue = convertCurrency(calculations.totalCharge, q.currency || 'USD', dashboardCurrency, rates);
            const cost = convertCurrency(calculations.totalCost, q.currency || 'USD', dashboardCurrency, rates);
            const profit = revenue - cost;

            const isWon = q.status === 'won' || q.status === 'approved';

            // 3-month: events scheduled within next 3 months
            if (startDate <= threeMonthsOut) {
                if (isWon) {
                    won3m.revenue += revenue;
                    won3m.profit += profit;
                } else {
                    pipeline3m.revenue += revenue;
                    pipeline3m.profit += profit;
                }
            }
            // 6-month: events scheduled within next 6 months
            if (startDate <= sixMonthsOut) {
                if (isWon) {
                    won6m.revenue += revenue;
                    won6m.profit += profit;
                } else {
                    pipeline6m.revenue += revenue;
                    pipeline6m.profit += profit;
                }
            }
        });

        return {
            threeMonth: {
                won: won3m,
                pipeline: pipeline3m,
                total: { revenue: won3m.revenue + pipeline3m.revenue, profit: won3m.profit + pipeline3m.profit }
            },
            sixMonth: {
                won: won6m,
                pipeline: pipeline6m,
                total: { revenue: won6m.revenue + pipeline6m.revenue, profit: won6m.profit + pipeline6m.profit }
            }
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
            // Check if new status requires loss reason
            if (newStatus === 'rejected' || newStatus === 'expired' || newStatus === 'dead') {
                setLossReasonModal({ open: true, quoteId, newStatus });
            } else {
                updateQuoteStatus(quoteId, newStatus);
            }
        }
    };

    const handleDragEnd = () => {
        setDraggedQuoteId(null);
        setDragOverColumn(null);
    };

    const handleLossReasonSubmit = () => {
        if (lossReasonModal.quoteId && lossReasonModal.newStatus) {
            updateQuoteStatus(
                lossReasonModal.quoteId,
                lossReasonModal.newStatus,
                lossReasonNotes,
                lossReason,
                lossReasonNotes
            );
        }
        // Reset modal
        setLossReasonModal({ open: false, quoteId: null, newStatus: null });
        setLossReason('');
        setLossReasonNotes('');
    };

    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto">
            {/* Header / Navigation */}
            <div className="bg-dark-bg border-b border-dark-border p-3 sm:p-6">

                {/* Top Bar with Title and Navigation */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-100">Welcome back, {userName}</h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Pipeline Dashboard</p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* New Quote Button - uses brand teal via btn-primary */}
                        <button
                            onClick={() => onNewQuote && onNewQuote()}
                            className="btn-primary flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">New Quote</span>
                        </button>
                    </div>
                </div>

                {/* Filters - Stack on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Filters:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="input-sm text-sm w-20 sm:w-32 min-h-[40px]"
                        >
                            {years.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="input-sm text-sm w-24 sm:w-40 min-h-[40px]"
                        >
                            <option value="all">All Months</option>
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>

                        {/* Dashboard Currency Selector */}
                        <div className="hidden sm:block h-4 w-px bg-dark-border mx-2"></div>
                        <span className="text-sm text-gray-400 hidden sm:inline">View:</span>
                        <select
                            value={dashboardCurrency}
                            onChange={(e) => setDashboardCurrency(e.target.value)}
                            className="input-sm text-sm w-20 sm:w-24 min-h-[40px]"
                        >
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                            <option value="MYR">MYR</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                        {/* Exchange Rate Status - Hidden on mobile */}
                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                            <span>Rates: {ratesUpdated ? new Date(ratesUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                            <button
                                onClick={refreshRates}
                                disabled={ratesLoading}
                                className={`p-2 min-w-[32px] min-h-[32px] hover:text-white transition-colors ${ratesLoading ? 'animate-spin' : ''}`}
                                title="Refresh Exchange Rates"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        <div className="text-xs text-gray-600">
                            {filteredQuotes.length} quotes
                        </div>
                    </div>
                </div>

                {/* Financial Summary - Combined view for better scannability */}
                <div className="grid grid-cols-2 gap-3 mb-6">
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
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-green-500">Won</p>
                                <p className="text-xs font-medium text-green-400 tabular-nums">
                                    {formatCurrency(forecastStats.threeMonth.won.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Pipeline</p>
                                <p className="text-xs font-medium text-gray-400 tabular-nums">
                                    {formatCurrency(forecastStats.threeMonth.pipeline.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-amber-800/30">
                                <p className="text-[10px] text-amber-400">Total</p>
                                <p className="text-sm font-semibold text-amber-400 tabular-nums">
                                    {formatCurrency(forecastStats.threeMonth.total.revenue, dashboardCurrency, 0)}
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
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-green-500">Won</p>
                                <p className="text-xs font-medium text-green-400 tabular-nums">
                                    {formatCurrency(forecastStats.sixMonth.won.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] text-gray-500">Pipeline</p>
                                <p className="text-xs font-medium text-gray-400 tabular-nums">
                                    {formatCurrency(forecastStats.sixMonth.pipeline.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-purple-800/30">
                                <p className="text-[10px] text-purple-400">Total</p>
                                <p className="text-sm font-semibold text-purple-400 tabular-nums">
                                    {formatCurrency(forecastStats.sixMonth.total.revenue, dashboardCurrency, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pipeline Summary Cards - Horizontally scrollable on mobile */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible">
                    {STATUSES.map(status => (
                        <div
                            key={status.id}
                            className={`flex-shrink-0 sm:flex-1 min-w-[140px] sm:min-w-0 rounded-lg px-3 py-2 ${status.bgColor} border border-white/5`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
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
            <div className="p-3 sm:p-4">
                {/* Pipeline Header with Minimize Toggle */}
                <button
                    onClick={() => setPipelineMinimized(!pipelineMinimized)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-3 hover:text-white transition-colors min-h-[44px]"
                >
                    <svg className={`w-4 h-4 transition-transform ${pipelineMinimized ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Pipeline Board
                    <span className="text-xs text-gray-600 font-normal">({filteredQuotes.length} quotes)</span>
                </button>

                {!pipelineMinimized && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-start">
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
                                            <div className="text-center py-8 border-2 border-dashed border-dark-border/50 rounded-xl bg-dark-bg/30">
                                                <svg className="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-gray-400 text-sm mb-3">No {status.label.toLowerCase()} quotes</p>
                                                {status.id === 'draft' && (
                                                    <button
                                                        onClick={() => onNewQuote && onNewQuote()}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-teal hover:text-white bg-brand-teal/10 hover:bg-brand-teal/20 rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Create your first quote
                                                    </button>
                                                )}
                                                {status.id !== 'draft' && (
                                                    <p className="text-xs text-gray-500">Drag quotes here to update status</p>
                                                )}
                                            </div>
                                        ) : (
                                            pipelineData[status.id].map(quote => {
                                                const total = calculateGrandTotalWithFees(quote.sections || {}, quote.fees || {});
                                                const displayAmount = convertCurrency(total.totalCharge, quote.currency || 'USD', dashboardCurrency, rates);

                                                // Check for expiry and follow-up warnings
                                                const expired = isQuoteExpired(quote.quoteDate, quote.validityDays);
                                                const expiringSoon = !expired && isExpiringSoon(quote.quoteDate, quote.validityDays);
                                                const followUpOverdue = isFollowUpOverdue(quote.nextFollowUpDate);
                                                const needsAttention = expiringSoon || followUpOverdue;

                                                return (
                                                    <div
                                                        key={quote.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, quote.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => onViewQuote && onViewQuote(quote)}
                                                        className={`w-full card text-left hover:border-white/15 transition-all cursor-move
                                                            ${draggedQuoteId === quote.id ? 'opacity-50 scale-95' : 'opacity-100'}
                                                            ${needsAttention ? 'border-amber-500/30 bg-amber-500/5' : ''}
                                                            ${expired ? 'border-red-500/30 bg-red-500/5 opacity-60' : ''}
                                                            active:cursor-grabbing hover:shadow-lg group relative`}
                                                    >
                                                        {/* Delete button */}
                                                        <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm('Are you sure you want to delete this quote?')) {
                                                                        useClientStore.getState().deleteQuote(quote.id);
                                                                    }
                                                                }}
                                                                className="p-2 min-w-[36px] min-h-[36px] text-gray-500 hover:text-red-400 bg-dark-card rounded shadow-sm border border-dark-border flex items-center justify-center"
                                                                title="Delete Quote"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Quote number and date */}
                                                        <div className="flex justify-between items-start mb-1.5 pr-6 gap-2">
                                                            <p className="text-[11px] text-gray-500 font-mono tracking-tight">{quote.quoteNumber}</p>
                                                            <div className="flex gap-1 items-center flex-wrap">
                                                                {/* Expired badge */}
                                                                {expired && (
                                                                    <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium" title="Quote has expired">
                                                                        EXPIRED
                                                                    </span>
                                                                )}
                                                                {/* Expiring soon badge */}
                                                                {expiringSoon && (
                                                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium" title="Expires within 7 days">
                                                                        EXPIRING
                                                                    </span>
                                                                )}
                                                                {/* Follow-up overdue badge */}
                                                                {followUpOverdue && (
                                                                    <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5" title={`Follow-up was due on ${new Date(quote.nextFollowUpDate).toLocaleDateString()}`}>
                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                                        </svg>
                                                                        DUE
                                                                    </span>
                                                                )}
                                                                {quote.project?.startDate && (
                                                                    <span className="text-[10px] bg-dark-bg/70 px-1.5 py-0.5 rounded text-gray-500">
                                                                        {new Date(quote.project.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                )}
                                                            </div>
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

            {/* Loss Reason Modal */}
            {lossReasonModal.open && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-100 mb-2">
                            {lossReasonModal.newStatus === 'rejected' ? 'Quote Rejected' :
                             lossReasonModal.newStatus === 'expired' ? 'Quote Expired' :
                             'Quote Lost'}
                        </h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Help us track why this opportunity didn't close
                        </p>

                        <div className="space-y-4">
                            {/* Reason dropdown */}
                            <div>
                                <label className="label label-required">Reason</label>
                                <select
                                    value={lossReason}
                                    onChange={(e) => setLossReason(e.target.value)}
                                    className="input"
                                    required
                                >
                                    <option value="">Select reason...</option>
                                    <option value="price">Price too high</option>
                                    <option value="timing">Wrong timing</option>
                                    <option value="lost_to_competitor">Lost to competitor</option>
                                    <option value="no_budget">No budget</option>
                                    <option value="requirements_mismatch">Requirements didn't match</option>
                                    <option value="client_unresponsive">Client unresponsive</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Additional notes */}
                            <div>
                                <label className="label">Additional Notes</label>
                                <textarea
                                    value={lossReasonNotes}
                                    onChange={(e) => setLossReasonNotes(e.target.value)}
                                    placeholder="Any additional context..."
                                    rows={3}
                                    className="input resize-none"
                                />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-border">
                            <button
                                onClick={() => {
                                    setLossReasonModal({ open: false, quoteId: null, newStatus: null });
                                    setLossReason('');
                                    setLossReasonNotes('');
                                }}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLossReasonSubmit}
                                disabled={!lossReason}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
