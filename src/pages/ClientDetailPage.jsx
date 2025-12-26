import { useState, useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { useSettingsStore } from '../store/settingsStore';
import { useOpportunityStore } from '../store/opportunityStore';
import { useActivityStore } from '../store/activityStore';
import { useContactStore } from '../store/contactStore';
import { formatCurrency } from '../utils/currency';
import { calculateGrandTotalWithFees } from '../utils/calculations';
import { validateForm, sanitizeString } from '../utils/validation';
import ActivityTimeline from '../components/crm/ActivityTimeline';
import LogActivityModal from '../components/crm/LogActivityModal';
import ContactList from '../components/crm/ContactList';

const STATUS_COLORS = {
    draft: 'bg-amber-400/20 text-amber-400',
    sent: 'bg-blue-400/20 text-blue-400',
    under_review: 'bg-yellow-400/20 text-yellow-400',
    approved: 'bg-emerald-500/20 text-emerald-500',
    won: 'bg-green-500/20 text-green-500',
    rejected: 'bg-red-500/20 text-red-500',
    expired: 'bg-gray-600/20 text-gray-500',
    dead: 'bg-red-500/20 text-red-500',
};

// Avatar helper functions
const AVATAR_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500'
];

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export default function ClientDetailPage({ clientId, onBackToDashboard, onEditQuote, onNewQuote, onSelectOpportunity }) {
    const { getClient, getClientQuotes, deleteQuote, updateQuoteStatus, deleteClient, updateClient } = useClientStore();
    const { loadQuoteData } = useQuoteStore();
    const { settings } = useSettingsStore();
    const { getClientOpportunities, deleteOpportunity } = useOpportunityStore();
    const { getClientActivities, deleteActivity, completeTask } = useActivityStore();
    const { getClientContacts, initialize: initializeContacts } = useContactStore();
    const users = settings.users || [];

    const client = getClient(clientId);
    const quotes = getClientQuotes(clientId);
    const clientOpportunities = getClientOpportunities(clientId);
    const clientActivities = getClientActivities(clientId);
    const clientContacts = getClientContacts(clientId);

    // Initialize contact store on mount
    useEffect(() => {
        initializeContacts();
    }, [initializeContacts]);

    const [activeTab, setActiveTab] = useState('overview'); // overview, contacts, activities
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [clientForm, setClientForm] = useState({});

    // Activity State
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    // Loss reason modal state - must be before early return to follow hooks rules
    const [lossReasonModal, setLossReasonModal] = useState({ open: false, quoteId: null, newStatus: null });
    const [lossReason, setLossReason] = useState('');
    const [lossReasonNotes, setLossReasonNotes] = useState('');

    // Handle escape key to close modals
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isEditingClient) {
                setIsEditingClient(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isEditingClient]);

    if (!client) {
        return (
            <div className="h-[calc(100vh-60px)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400">Client not found</p>
                    <button onClick={onBackToDashboard} className="btn-ghost mt-4">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const handleLoadQuote = (quote) => {
        loadQuoteData(quote);
        onEditQuote();
    };

    const handleDeleteQuote = (quoteId, e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this quote?')) {
            deleteQuote(quoteId);
        }
    };

    const handleStatusChange = (quoteId, status, e) => {
        e.stopPropagation();
        if (status === 'rejected' || status === 'expired' || status === 'dead') {
            setLossReasonModal({ open: true, quoteId, newStatus: status });
        } else {
            updateQuoteStatus(quoteId, status);
        }
    };

    const handleLossReasonSubmit = () => {
        if (lossReasonModal.quoteId && lossReasonModal.newStatus) {
            updateQuoteStatus(
                lossReasonModal.quoteId,
                lossReasonModal.newStatus,
                '', // note for status history (auto-generated from reason)
                lossReason,
                lossReasonNotes
            );
        }
        // Reset modal
        setLossReasonModal({ open: false, quoteId: null, newStatus: null });
        setLossReason('');
        setLossReasonNotes('');
    };

    // Client Edit Handlers
    const startEditClient = () => {
        setClientForm({
            company: client.company,
            website: client.website,
            location: client.location,
            region: client.region || 'MALAYSIA',
            notes: client.notes,
            paymentTerms: client.paymentTerms || 'net30',
            preferredCurrency: client.preferredCurrency || 'USD',
            industry: client.industry || '',
        });
        setIsEditingClient(true);
    };

    const saveClientEdit = (e) => {
        e.preventDefault();
        updateClient(client.id, clientForm);
        setIsEditingClient(false);
    };

    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-6 relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                    {isEditingClient ? (
                        <form onSubmit={saveClientEdit} className="flex gap-2 items-center flex-wrap">
                            <input
                                className="input py-1 px-2 text-xl font-bold w-full md:w-auto"
                                value={clientForm.company}
                                onChange={e => setClientForm({ ...clientForm, company: e.target.value })}
                            />
                            <select
                                value={clientForm.region}
                                onChange={e => setClientForm({ ...clientForm, region: e.target.value })}
                                className="input py-1 px-2 text-sm w-32"
                            >
                                <option value="MALAYSIA">Malaysia</option>
                                <option value="SEA">SEA</option>
                                <option value="GULF">Gulf</option>
                                <option value="CENTRAL_ASIA">Central Asia</option>
                            </select>
                            <div className="flex gap-1 ml-auto md:ml-0">
                                <button type="submit" className="btn-primary py-1 px-3 text-xs">Save</button>
                                <button type="button" onClick={() => setIsEditingClient(false)} className="btn-ghost py-1 px-3 text-xs">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex items-center gap-3 group">
                            <h1 className="text-2xl font-bold text-gray-100">{client.company}</h1>
                            <button onClick={startEditClient} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-white transition-opacity">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {client.location && (
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {client.location}
                            </span>
                        )}
                        {client.website && (
                            <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent-primary transition-colors">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                {client.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        <span>{quotes.length} Projects</span>
                    </div>
                </div>
                <button
                    onClick={() => onNewQuote(clientId)}
                    className="btn-primary text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Quote
                </button>
                <button
                    onClick={() => {
                        if (window.confirm(`Delete ${client.company} and all its data? This cannot be undone.`)) {
                            deleteClient(client.id);
                            onBackToDashboard();
                        }
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Client"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Tags Management */}
            {/* Business Details */}
            {(client.industry || client.paymentTerms || client.preferredCurrency) && (
                <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {client.industry && (
                        <div className="card bg-dark-bg/50">
                            <p className="text-xs text-gray-500 mb-1">Industry</p>
                            <p className="text-sm text-gray-200">{client.industry}</p>
                        </div>
                    )}
                    {client.paymentTerms && (
                        <div className="card bg-dark-bg/50">
                            <p className="text-xs text-gray-500 mb-1">Payment Terms</p>
                            <p className="text-sm text-gray-200">
                                {client.paymentTerms === 'immediate' ? 'Immediate' :
                                 client.paymentTerms === 'net7' ? 'Net 7' :
                                 client.paymentTerms === 'net14' ? 'Net 14' :
                                 client.paymentTerms === 'net30' ? 'Net 30' :
                                 client.paymentTerms === 'net45' ? 'Net 45' :
                                 client.paymentTerms === 'net60' ? 'Net 60' :
                                 client.paymentTerms === 'net90' ? 'Net 90' :
                                 client.paymentTerms}
                            </p>
                        </div>
                    )}
                    {client.preferredCurrency && (
                        <div className="card bg-dark-bg/50">
                            <p className="text-xs text-gray-500 mb-1">Preferred Currency</p>
                            <p className="text-sm text-gray-200">{client.preferredCurrency}</p>
                        </div>
                    )}
                    <div className="card bg-dark-bg/50">
                        <p className="text-xs text-gray-500 mb-1">Region</p>
                        <p className="text-sm text-gray-200">
                            {client.region === 'MALAYSIA' ? 'Malaysia' :
                             client.region === 'SEA' ? 'South East Asia' :
                             client.region === 'GULF' ? 'Gulf' :
                             client.region === 'CENTRAL_ASIA' ? 'Central Asia' :
                             client.region || 'Not set'}
                        </p>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                    {(client.tags || []).map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-primary/10 text-accent-primary border border-accent-primary/20 flex items-center gap-1">
                            {tag}
                            <button
                                onClick={() => {
                                    const newTags = client.tags.filter((_, i) => i !== idx);
                                    updateClient(client.id, { tags: newTags });
                                }}
                                className="hover:text-white"
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2 max-w-xs">
                    <input
                        type="text"
                        placeholder="Add tag..."
                        className="input-sm flex-1 bg-dark-card border-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                const newTag = e.target.value.trim();
                                const currentTags = client.tags || [];
                                if (!currentTags.includes(newTag)) {
                                    updateClient(client.id, { tags: [...currentTags, newTag] });
                                }
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>

            {/* Content Tabs */}
            <div className="border-b border-dark-border mb-6">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-accent-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Quotes & Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('opportunities')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'opportunities' ? 'border-accent-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Opportunities ({clientOpportunities.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'contacts' ? 'border-accent-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Contacts ({clientContacts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('activities')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'activities' ? 'border-accent-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Activities ({clientActivities.length})
                    </button>
                </div>
            </div>

            {
                activeTab === 'overview' && (
                    <div className="space-y-3">
                        {quotes.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-dark-border rounded-xl">
                                <p className="text-gray-500">No quotes yet for this client.</p>
                            </div>
                        ) : (
                            quotes.map(quote => {
                                const grandTotal = calculateGrandTotalWithFees(quote.sections || {}, quote.fees || {}); // Fixed to use 'WithFees'
                                return (
                                    <div
                                        key={quote.id}
                                        onClick={() => handleLoadQuote(quote)}
                                        className="card hover:border-accent-primary/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-mono font-medium text-accent-primary">
                                                        {quote.quoteNumber}
                                                    </span>
                                                    <select
                                                        value={quote.status || 'draft'}
                                                        onChange={(e) => handleStatusChange(quote.id, e.target.value, e)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${STATUS_COLORS[quote.status || 'draft']}`}
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
                                                    {quote.project?.startDate && (
                                                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                                                            {new Date(quote.project.startDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span>
                                                        {client.contacts?.find(c => c.id === quote.client?.contactId)?.name || quote.client?.contact || 'Unknown Contact'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400">
                                                    {quote.project?.title || 'Untitled Project'}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-200">
                                                    {formatCurrency(grandTotal.totalCharge, quote.currency || 'USD')}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                                    <button
                                                        onClick={(e) => handleDeleteQuote(quote.id, e)}
                                                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete quote"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )
            }

            {
                activeTab === 'opportunities' && (
                    <div className="space-y-4">
                        {/* Opportunities Stats */}
                        {clientOpportunities.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="card bg-gradient-to-br from-cyan-900/20 to-cyan-950/10 border-cyan-800/20 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active</p>
                                    <p className="text-2xl font-bold text-cyan-400">
                                        {clientOpportunities.filter(o => o.status === 'active').length}
                                    </p>
                                </div>
                                <div className="card bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 border-emerald-800/20 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pipeline</p>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {formatCurrency(clientOpportunities.filter(o => o.status === 'active').reduce((sum, o) => sum + (o.value || 0), 0), 'USD', 0)}
                                    </p>
                                </div>
                                <div className="card bg-gradient-to-br from-amber-900/20 to-amber-950/10 border-amber-800/20 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Weighted</p>
                                    <p className="text-2xl font-bold text-amber-400">
                                        {formatCurrency(clientOpportunities.filter(o => o.status === 'active').reduce((sum, o) => sum + (o.value || 0) * ((o.probability || 0) / 100), 0), 'USD', 0)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Opportunities List */}
                        {clientOpportunities.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-dark-border rounded-xl">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <p className="text-gray-500 mb-4">No opportunities for this client yet</p>
                                <p className="text-xs text-gray-600">Create opportunities from the Opportunities page</p>
                            </div>
                        ) : (
                            clientOpportunities.map(opp => {
                                const getStatusColor = (status) => {
                                    switch (status) {
                                        case 'won': return 'text-green-400 bg-green-500/10 border-green-500/20';
                                        case 'lost': return 'text-red-400 bg-red-500/10 border-red-500/20';
                                        default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                                    }
                                };

                                return (
                                    <div
                                        key={opp.id}
                                        onClick={() => onSelectOpportunity && onSelectOpportunity(opp.id)}
                                        className="card hover:border-accent-primary/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-medium text-gray-200">
                                                        {opp.title || 'Untitled Opportunity'}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(opp.status)}`}>
                                                        {opp.status}
                                                    </span>
                                                    {opp.probability > 0 && (
                                                        <span className="text-xs text-amber-400">{opp.probability}%</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {opp.country && <span>{opp.country}</span>}
                                                    {opp.nextAction && (
                                                        <span className="text-cyan-400">→ {opp.nextAction}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right flex items-center gap-4">
                                                <p className="text-lg font-bold text-gray-200">
                                                    {formatCurrency(opp.value || 0, opp.currency || 'USD', 0)}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Delete this opportunity?')) {
                                                            deleteOpportunity(opp.id);
                                                        }
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete opportunity"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )
            }

            {
                activeTab === 'contacts' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Key People</h3>
                        <ContactList
                            clientId={clientId}
                            contacts={clientContacts}
                        />
                    </div>
                )
            }

            {
                activeTab === 'activities' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-200">Activity History</h3>
                            <button
                                onClick={() => setIsActivityModalOpen(true)}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Log Activity
                            </button>
                        </div>

                        <ActivityTimeline
                            activities={clientActivities}
                            onDelete={deleteActivity}
                            onCompleteTask={completeTask}
                            emptyMessage="No activities logged yet. Start tracking your interactions with this client."
                        />
                    </div>
                )
            }

            {/* Loss Reason Modal */}
            {lossReasonModal.open && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
                    <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
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

            {/* Log Activity Modal */}
            <LogActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                clientId={clientId}
                contacts={clientContacts}
            />

        </div >
    );
}
