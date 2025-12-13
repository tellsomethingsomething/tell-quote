import { useState, useMemo } from 'react';
import { useClientStore } from '../store/clientStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { useQuoteStore } from '../store/quoteStore';
import { calculateGrandTotalWithFees } from '../utils/calculations';

const STATUSES = [
    { id: 'all', label: 'All Quotes', color: 'gray' },
    { id: 'draft', label: 'Draft', color: 'gray' },
    { id: 'sent', label: 'Sent', color: 'blue' },
    { id: 'under_review', label: 'Under Review', color: 'amber' },
    { id: 'approved', label: 'Approved', color: 'emerald' },
    { id: 'won', label: 'Won', color: 'green' },
    { id: 'rejected', label: 'Rejected', color: 'red' },
    { id: 'expired', label: 'Expired', color: 'gray' },
    { id: 'dead', label: 'Dead', color: 'red' },
];

export default function QuotesPage({ onEditQuote, onNewQuote }) {
    const { savedQuotes, updateQuoteStatus, deleteQuote } = useClientStore();
    const { settings, setQuotesPreferences } = useSettingsStore();
    const { rates } = useQuoteStore();

    // Get quotes preferences from settings (synced via Supabase)
    const quotesPrefs = settings.quotesPreferences || {};
    const displayCurrency = quotesPrefs.displayCurrency || 'USD';
    const sortBy = quotesPrefs.sortBy || 'updatedAt';
    const sortDir = quotesPrefs.sortDir || 'desc';

    // Helper functions to update preferences (synced to Supabase)
    const setDisplayCurrency = (currency) => {
        setQuotesPreferences({ displayCurrency: currency });
    };
    const setSortBy = (value) => {
        setQuotesPreferences({ sortBy: value });
    };
    const setSortDir = (value) => {
        setQuotesPreferences({ sortDir: value });
    };

    // Filters (local state - not synced)
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Tag management
    const [editingTagsId, setEditingTagsId] = useState(null);
    const [newTag, setNewTag] = useState('');

    // Loss reason modal state
    const [lossReasonModal, setLossReasonModal] = useState({ open: false, quoteId: null, newStatus: null });
    const [lossReason, setLossReason] = useState('');
    const [lossReasonNotes, setLossReasonNotes] = useState('');

    // Get unique clients and tags from quotes
    const uniqueClients = useMemo(() => {
        const clients = new Set();
        savedQuotes.forEach(q => {
            if (q.client?.company) clients.add(q.client.company);
        });
        return Array.from(clients).sort();
    }, [savedQuotes]);

    const allTags = useMemo(() => {
        const tags = new Set();
        savedQuotes.forEach(q => {
            (q.tags || []).forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }, [savedQuotes]);

    // Filter and sort quotes
    const filteredQuotes = useMemo(() => {
        let result = [...savedQuotes];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(q =>
                q.quoteNumber?.toLowerCase().includes(term) ||
                q.client?.company?.toLowerCase().includes(term) ||
                q.client?.contact?.toLowerCase().includes(term) ||
                q.project?.title?.toLowerCase().includes(term) ||
                (q.tags || []).some(t => t.toLowerCase().includes(term))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(q => q.status === statusFilter);
        }

        // Client filter
        if (clientFilter) {
            result = result.filter(q => q.client?.company === clientFilter);
        }

        // Tag filter
        if (tagFilter) {
            result = result.filter(q => (q.tags || []).includes(tagFilter));
        }

        // Date range filter
        if (dateFrom) {
            result = result.filter(q => q.quoteDate >= dateFrom);
        }
        if (dateTo) {
            result = result.filter(q => q.quoteDate <= dateTo);
        }

        // Sort
        result.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'quoteNumber':
                    aVal = a.quoteNumber || '';
                    bVal = b.quoteNumber || '';
                    break;
                case 'client':
                    aVal = a.client?.company || '';
                    bVal = b.client?.company || '';
                    break;
                case 'project':
                    aVal = a.project?.title || '';
                    bVal = b.project?.title || '';
                    break;
                case 'total':
                    aVal = calculateGrandTotalWithFees(a.sections || {}, a.fees || {}).totalCharge;
                    bVal = calculateGrandTotalWithFees(b.sections || {}, b.fees || {}).totalCharge;
                    break;
                case 'status':
                    aVal = a.status || 'draft';
                    bVal = b.status || 'draft';
                    break;
                case 'quoteDate':
                    aVal = a.quoteDate || '';
                    bVal = b.quoteDate || '';
                    break;
                case 'updatedAt':
                default:
                    aVal = a.updatedAt || '';
                    bVal = b.updatedAt || '';
                    break;
            }
            if (sortDir === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        return result;
    }, [savedQuotes, searchTerm, statusFilter, clientFilter, tagFilter, dateFrom, dateTo, sortBy, sortDir]);

    // Handle sort click
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    // Sort indicator
    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <span className="text-gray-600 ml-1">↕</span>;
        return <span className="text-accent-primary ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'under_review': return 'bg-amber-400/20 text-amber-400 border-amber-400/30';
            case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'won': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'expired': return 'bg-gray-600/20 text-gray-500 border-gray-600/30';
            case 'dead': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    // Get prepared by name
    const getPreparedByName = (userId) => {
        const user = settings.users?.find(u => u.id === userId);
        return user?.name || '-';
    };

    // Add tag to quote
    const handleAddTag = (quoteId) => {
        if (!newTag.trim()) return;
        const quote = savedQuotes.find(q => q.id === quoteId);
        if (quote) {
            const tags = [...(quote.tags || []), newTag.trim()];
            useClientStore.getState().updateQuote(quoteId, { tags });
        }
        setNewTag('');
    };

    // Remove tag from quote
    const handleRemoveTag = (quoteId, tagToRemove) => {
        const quote = savedQuotes.find(q => q.id === quoteId);
        if (quote) {
            const tags = (quote.tags || []).filter(t => t !== tagToRemove);
            useClientStore.getState().updateQuote(quoteId, { tags });
        }
    };

    // Handle status change with loss reason modal
    const handleStatusChange = (quoteId, newStatus) => {
        if (newStatus === 'rejected' || newStatus === 'expired' || newStatus === 'dead') {
            setLossReasonModal({ open: true, quoteId, newStatus });
        } else {
            updateQuoteStatus(quoteId, newStatus);
        }
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

    // Calculate totals
    const totals = useMemo(() => {
        let total = 0;
        let won = 0;
        let pipeline = 0;

        filteredQuotes.forEach(q => {
            const quoteTotal = calculateGrandTotalWithFees(q.sections || {}, q.fees || {}).totalCharge;
            const converted = convertCurrency(quoteTotal, q.currency || 'USD', displayCurrency, rates);
            total += converted;
            if (q.status === 'won') won += converted;
            if (q.status === 'sent' || q.status === 'draft') pipeline += converted;
        });

        return { total, won, pipeline, count: filteredQuotes.length };
    }, [filteredQuotes, displayCurrency, rates]);

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-dark-border bg-dark-card">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-100">Quotes</h1>
                        <p className="text-xs sm:text-sm text-gray-400">{totals.count} quotes found</p>
                    </div>
                    <button onClick={() => onNewQuote()} className="btn-primary min-h-[44px] text-sm sm:text-base">
                        + New Quote
                    </button>
                </div>

                {/* Search - Full width on mobile */}
                <div className="relative mb-3">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search quotes, clients, tags..."
                        className="input pl-10 w-full min-h-[44px]"
                    />
                </div>

                {/* Filters - Grid on mobile, flex on desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input min-h-[44px] w-full sm:w-36"
                    >
                        {STATUSES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>

                    {/* Client Filter */}
                    <select
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="input min-h-[44px] w-full sm:w-44"
                    >
                        <option value="">All Clients</option>
                        {uniqueClients.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Tag Filter - Hidden on mobile if no tags */}
                    <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="input min-h-[44px] w-full sm:w-36 hidden sm:block"
                    >
                        <option value="">All Tags</option>
                        {allTags.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    {/* Display Currency */}
                    <select
                        value={displayCurrency}
                        onChange={(e) => setDisplayCurrency(e.target.value)}
                        className="input min-h-[44px] w-full sm:w-24"
                    >
                        <option value="USD">USD</option>
                        <option value="MYR">MYR</option>
                        <option value="SGD">SGD</option>
                        <option value="GBP">GBP</option>
                        <option value="AED">AED</option>
                    </select>
                </div>

                {/* Date Filters & Clear - Hidden on mobile */}
                <div className="hidden sm:flex flex-wrap items-center gap-3">
                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">From:</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="input w-36 text-sm min-h-[36px]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">To:</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="input w-36 text-sm min-h-[36px]"
                        />
                    </div>

                    {/* Clear Filters */}
                    {(searchTerm || statusFilter !== 'all' || clientFilter || tagFilter || dateFrom || dateTo) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setClientFilter('');
                                setTagFilter('');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className="text-xs text-gray-400 hover:text-gray-200 min-h-[36px] px-2"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Summary Stats - Responsive */}
                <div className="flex gap-4 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-dark-border">
                    <div className="flex-1 sm:flex-none">
                        <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-200">{formatCurrency(totals.total, displayCurrency)}</p>
                    </div>
                    <div className="flex-1 sm:flex-none">
                        <p className="text-[10px] sm:text-xs text-gray-500">Won</p>
                        <p className="text-sm sm:text-lg font-bold text-green-400">{formatCurrency(totals.won, displayCurrency)}</p>
                    </div>
                    <div className="flex-1 sm:flex-none">
                        <p className="text-[10px] sm:text-xs text-gray-500">Pipeline</p>
                        <p className="text-sm sm:text-lg font-bold text-blue-400">{formatCurrency(totals.pipeline, displayCurrency)}</p>
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex-1 overflow-auto p-3 space-y-3">
                {filteredQuotes.length === 0 ? (
                    <div className="py-16 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-400 mb-4">
                            {searchTerm || statusFilter !== 'all' || clientFilter ?
                                'No quotes match your filters' :
                                'No quotes yet'}
                        </p>
                        <button
                            onClick={() => onNewQuote()}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal-light rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create your first quote
                        </button>
                    </div>
                ) : (
                    filteredQuotes.map(quote => {
                        const total = calculateGrandTotalWithFees(quote.sections || {}, quote.fees || {}).totalCharge;
                        const convertedTotal = convertCurrency(total, quote.currency || 'USD', displayCurrency, rates);

                        return (
                            <div
                                key={quote.id}
                                onClick={() => onEditQuote(quote)}
                                className="bg-dark-card border border-dark-border rounded-lg p-4 cursor-pointer active:bg-dark-card/80 transition-colors"
                            >
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-xs text-accent-primary">{quote.quoteNumber || '-'}</span>
                                            {quote.isLocked && (
                                                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="Locked">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-200 mt-0.5">{quote.client?.company || '-'}</h3>
                                    </div>
                                    <select
                                        value={quote.status || 'draft'}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(quote.id, e.target.value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`text-xs px-2 py-1 min-h-[32px] rounded border ${getStatusColor(quote.status)}`}
                                        disabled={quote.isLocked}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="sent">Sent</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="won">Won</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="expired">Expired</option>
                                        <option value="dead">Dead</option>
                                    </select>
                                </div>

                                {/* Project & Contact */}
                                <div className="text-xs text-gray-400 mb-2">
                                    {quote.project?.title && <p>{quote.project.title}</p>}
                                    {quote.client?.contact && <p className="text-gray-500">{quote.client.contact}</p>}
                                </div>

                                {/* Value & Date Row */}
                                <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                                    <span className="text-sm font-bold text-gray-200">
                                        {formatCurrency(convertedTotal, displayCurrency)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {quote.quoteDate ? new Date(quote.quoteDate).toLocaleDateString() : '-'}
                                    </span>
                                </div>

                                {/* Tags */}
                                {(quote.tags || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-dark-border">
                                        {quote.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary text-xs rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block flex-1 overflow-auto p-4">
                <table className="w-full">
                    <thead className="sticky top-0 bg-dark-bg">
                        <tr className="text-left text-xs text-gray-500 border-b border-dark-border">
                            <th className="pb-3 pr-4 cursor-pointer hover:text-gray-300" onClick={() => handleSort('quoteNumber')}>
                                Quote # <SortIcon field="quoteNumber" />
                            </th>
                            <th className="pb-3 pr-4 cursor-pointer hover:text-gray-300" onClick={() => handleSort('client')}>
                                Client <SortIcon field="client" />
                            </th>
                            <th className="pb-3 pr-4 cursor-pointer hover:text-gray-300" onClick={() => handleSort('project')}>
                                Project <SortIcon field="project" />
                            </th>
                            <th className="pb-3 pr-4">Prepared By</th>
                            <th className="pb-3 pr-4 cursor-pointer hover:text-gray-300" onClick={() => handleSort('quoteDate')}>
                                Date <SortIcon field="quoteDate" />
                            </th>
                            <th className="pb-3 pr-4 cursor-pointer hover:text-gray-300 text-right" onClick={() => handleSort('total')}>
                                Value <SortIcon field="total" />
                            </th>
                            <th className="pb-3 pr-4 cursor-pointer hover:text-gray-300" onClick={() => handleSort('status')}>
                                Status <SortIcon field="status" />
                            </th>
                            <th className="pb-3 pr-4">Tags</th>
                            <th className="pb-3 w-20"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuotes.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-16 text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-400 mb-4">
                                        {searchTerm || statusFilter !== 'all' || clientFilter ?
                                            'No quotes match your filters' :
                                            'No quotes yet'}
                                    </p>
                                    <button
                                        onClick={() => onNewQuote()}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal-light rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create your first quote
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            filteredQuotes.map(quote => {
                                const total = calculateGrandTotalWithFees(quote.sections || {}, quote.fees || {}).totalCharge;
                                const convertedTotal = convertCurrency(total, quote.currency || 'USD', displayCurrency, rates);

                                return (
                                    <tr
                                        key={quote.id}
                                        className="border-b border-dark-border hover:bg-dark-card/50 cursor-pointer transition-colors group"
                                        onClick={() => onEditQuote(quote)}
                                    >
                                        <td className="py-3 pr-4">
                                            <span className="font-mono text-sm text-gray-300 flex items-center gap-1.5">
                                                {quote.quoteNumber || '-'}
                                                {quote.isLocked && (
                                                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="Locked">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <div>
                                                <p className="text-sm text-gray-200">{quote.client?.company || '-'}</p>
                                                <p className="text-xs text-gray-500">{quote.client?.contact}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <div>
                                                <p className="text-sm text-gray-200">{quote.project?.title || '-'}</p>
                                                <p className="text-xs text-gray-500">{quote.project?.venue}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-sm text-gray-400">
                                            {getPreparedByName(quote.preparedBy)}
                                        </td>
                                        <td className="py-3 pr-4 text-sm text-gray-400">
                                            {quote.quoteDate ? new Date(quote.quoteDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <span className="text-sm font-medium text-gray-200">
                                                {formatCurrency(convertedTotal, displayCurrency)}
                                            </span>
                                            {quote.currency !== displayCurrency && (
                                                <p className="text-xs text-gray-500">
                                                    {formatCurrency(total, quote.currency)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={quote.status || 'draft'}
                                                onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                                                className={`text-xs px-2 py-1 min-h-[36px] rounded border ${getStatusColor(quote.status)}`}
                                                disabled={quote.isLocked}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="sent">Sent</option>
                                                <option value="under_review">Under Review</option>
                                                <option value="approved">Approved</option>
                                                <option value="won">Won</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="expired">Expired</option>
                                                <option value="dead">Dead</option>
                                            </select>
                                        </td>
                                        <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-wrap items-center gap-1">
                                                {(quote.tags || []).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-primary/20 text-accent-primary text-xs rounded-full"
                                                    >
                                                        {tag}
                                                        <button
                                                            onClick={() => handleRemoveTag(quote.id, tag)}
                                                            className="hover:text-red-400 min-w-[20px] min-h-[20px]"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                                {editingTagsId === quote.id ? (
                                                    <input
                                                        type="text"
                                                        value={newTag}
                                                        onChange={(e) => setNewTag(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleAddTag(quote.id);
                                                                setEditingTagsId(null);
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setEditingTagsId(null);
                                                                setNewTag('');
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            if (newTag.trim()) handleAddTag(quote.id);
                                                            setEditingTagsId(null);
                                                            setNewTag('');
                                                        }}
                                                        placeholder="Add tag..."
                                                        className="w-20 px-1 py-0.5 text-xs bg-dark-bg border border-dark-border rounded"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingTagsId(quote.id)}
                                                        className="text-gray-600 hover:text-gray-400 text-xs min-h-[28px] px-2"
                                                    >
                                                        + tag
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditQuote(quote);
                                                    }}
                                                    className="p-2 min-w-[36px] min-h-[36px] text-gray-600 hover:text-blue-400"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Delete this quote?')) {
                                                            deleteQuote(quote.id);
                                                        }
                                                    }}
                                                    className="p-2 min-w-[36px] min-h-[36px] text-gray-600 hover:text-red-400"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Loss Reason Modal */}
            {lossReasonModal.open && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
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
