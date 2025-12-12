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
    { id: 'won', label: 'Won', color: 'green' },
    { id: 'dead', label: 'Dead', color: 'red' },
];

export default function QuotesPage({ onEditQuote, onNewQuote }) {
    const { savedQuotes, updateQuoteStatus, deleteQuote } = useClientStore();
    const { settings } = useSettingsStore();
    const { rates } = useQuoteStore();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [displayCurrency, setDisplayCurrency] = useState('USD');

    // Sorting
    const [sortBy, setSortBy] = useState('updatedAt');
    const [sortDir, setSortDir] = useState('desc');

    // Tag management
    const [editingTagsId, setEditingTagsId] = useState(null);
    const [newTag, setNewTag] = useState('');

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
            case 'won': return 'bg-green-500/20 text-green-400 border-green-500/30';
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
            <div className="p-4 border-b border-dark-border bg-dark-card">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-100">Quotes</h1>
                        <p className="text-sm text-gray-500">{totals.count} quotes found</p>
                    </div>
                    <button onClick={() => onNewQuote()} className="btn-primary">
                        + New Quote
                    </button>
                </div>

                {/* Filters Row 1 */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search quotes, clients, tags..."
                            className="input pl-10 w-full"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input w-36"
                    >
                        {STATUSES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>

                    {/* Client Filter */}
                    <select
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="input w-44"
                    >
                        <option value="">All Clients</option>
                        {uniqueClients.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Tag Filter */}
                    <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="input w-36"
                    >
                        <option value="">All Tags</option>
                        {allTags.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Filters Row 2 */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">From:</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="input w-36 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">To:</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="input w-36 text-sm"
                        />
                    </div>

                    {/* Display Currency */}
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-gray-500">Display:</span>
                        <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value)}
                            className="input w-24 text-sm"
                        >
                            <option value="USD">USD</option>
                            <option value="MYR">MYR</option>
                            <option value="SGD">SGD</option>
                            <option value="GBP">GBP</option>
                            <option value="AED">AED</option>
                        </select>
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
                            className="text-xs text-gray-400 hover:text-gray-200"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Summary Stats */}
                <div className="flex gap-6 mt-4 pt-4 border-t border-dark-border">
                    <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="text-lg font-bold text-gray-200">{formatCurrency(totals.total, displayCurrency)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Won</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(totals.won, displayCurrency)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Pipeline</p>
                        <p className="text-lg font-bold text-blue-400">{formatCurrency(totals.pipeline, displayCurrency)}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4">
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
                                <td colSpan={9} className="py-12 text-center text-gray-500">
                                    No quotes found matching your filters
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
                                            <span className="font-mono text-sm text-gray-300">{quote.quoteNumber || '-'}</span>
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
                                                onChange={(e) => updateQuoteStatus(quote.id, e.target.value)}
                                                className={`text-xs px-2 py-1 rounded border ${getStatusColor(quote.status)}`}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="sent">Sent</option>
                                                <option value="won">Won</option>
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
                                                            className="hover:text-red-400"
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
                                                        className="text-gray-600 hover:text-gray-400 text-xs"
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
                                                    className="p-1 text-gray-600 hover:text-blue-400"
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
                                                    className="p-1 text-gray-600 hover:text-red-400"
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
        </div>
    );
}
