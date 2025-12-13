import { useState, useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { useSettingsStore } from '../store/settingsStore';
import { useOpportunityStore } from '../store/opportunityStore';
import { formatCurrency } from '../utils/currency';
import { calculateGrandTotalWithFees } from '../utils/calculations';
import { validateForm, sanitizeString } from '../utils/validation';

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

export default function ClientDetailPage({ clientId, onBackToDashboard, onEditQuote, onNewQuote, onSelectOpportunity }) {
    const { getClient, getClientQuotes, deleteQuote, updateQuoteStatus, deleteClient, updateClient, addContact, updateContact, deleteContact } = useClientStore();
    const { loadQuoteData } = useQuoteStore();
    const { settings } = useSettingsStore();
    const { getClientOpportunities, deleteOpportunity } = useOpportunityStore();
    const users = settings.users || [];

    const client = getClient(clientId);
    const quotes = getClientQuotes(clientId);
    const clientOpportunities = getClientOpportunities(clientId);

    const [activeTab, setActiveTab] = useState('overview'); // overview, contacts
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [clientForm, setClientForm] = useState({});

    // Contact State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);
    const [contactForm, setContactForm] = useState({});
    const [contactFormErrors, setContactFormErrors] = useState({});

    // Loss reason modal state - must be before early return to follow hooks rules
    const [lossReasonModal, setLossReasonModal] = useState({ open: false, quoteId: null, newStatus: null });
    const [lossReason, setLossReason] = useState('');
    const [lossReasonNotes, setLossReasonNotes] = useState('');

    // Handle escape key to close modals
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (isContactModalOpen) setIsContactModalOpen(false);
                else if (isEditingClient) setIsEditingClient(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isContactModalOpen, isEditingClient]);

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

    // Client Edit Handlers
    const startEditClient = () => {
        setClientForm({
            company: client.company,
            website: client.website,
            location: client.location,
            region: client.region || 'MALAYSIA',
            notes: client.notes
        });
        setIsEditingClient(true);
    };

    const saveClientEdit = (e) => {
        e.preventDefault();
        updateClient(client.id, clientForm);
        setIsEditingClient(false);
    };

    // Contact Handlers
    const openContactModal = (contact = null) => {
        if (contact) {
            setEditingContactId(contact.id);
            setContactForm({ ...contact });
        } else {
            setEditingContactId(null);
            setContactForm({ name: '', role: '', email: '', phone: '', notes: '', isPrimary: false, accountHolderId: '' });
        }
        setIsContactModalOpen(true);
    };

    const saveContact = (e) => {
        e.preventDefault();

        // Validate form - only name is required, email/phone are optional without format validation
        const { isValid, errors } = validateForm(contactForm, {
            name: { required: true, label: 'Name', minLength: 2 }
        });

        if (!isValid) {
            setContactFormErrors(errors);
            return;
        }

        // Sanitize and save
        const sanitizedForm = {
            ...contactForm,
            name: sanitizeString(contactForm.name),
            role: sanitizeString(contactForm.role),
        };

        if (editingContactId) {
            updateContact(clientId, editingContactId, sanitizedForm);
        } else {
            addContact(clientId, sanitizedForm);
        }
        setIsContactModalOpen(false);
        setContactFormErrors({});
    };

    const confirmDeleteContact = (contactId) => {
        if (confirm('Delete this contact?')) {
            deleteContact(clientId, contactId);
        }
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
                        Contacts ({client.contacts?.length || (client.contact ? 1 : 0)})
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
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Key People</h3>
                            <button onClick={() => openContactModal()} className="btn-secondary text-xs">
                                + Add Contact
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Render existing contacts with stats */}
                            {client.contacts
                                ?.map(contact => {
                                    // Calculate contact's deal stats
                                    const contactQuotes = quotes.filter(q => q.client?.contactId === contact.id);
                                    const wonQuotes = contactQuotes.filter(q => q.status === 'won');
                                    const wonDeals = wonQuotes.length;
                                    const lostDeals = contactQuotes.filter(q => q.status === 'dead' || q.status === 'rejected').length;
                                    const closedDeals = wonDeals + lostDeals;
                                    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : null;

                                    // Calculate lifetime value (total revenue from won deals)
                                    const lifetimeValue = wonQuotes.reduce((sum, q) => {
                                        const total = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
                                        return sum + (total.totalCharge || 0);
                                    }, 0);

                                    return (<div key={contact.id} className="card group relative">
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openContactModal(contact)} className="p-1 text-gray-400 hover:text-white">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => confirmDeleteContact(contact.id)} className="p-1 text-gray-400 hover:text-red-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${contact.isPrimary ? 'bg-accent-primary text-white' : 'bg-gray-700 text-gray-300'}`}>
                                                {contact.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-200">
                                                    {contact.name}
                                                    {contact.isPrimary && <span className="ml-2 text-[10px] bg-accent-primary/20 text-accent-primary px-1.5 py-0.5 rounded">PRIMARY</span>}
                                                </p>
                                                <p className="text-sm text-gray-500">{contact.role || 'No Role'}</p>
                                                {contact.accountHolderId && (
                                                    <p className="text-xs text-accent-primary/80 flex items-center gap-1 mt-0.5">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {users.find(u => u.id === contact.accountHolderId)?.name || 'Unknown'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contact Stats */}
                                        {contactQuotes.length > 0 && (
                                            <div className="mb-3 bg-white/5 rounded-lg p-2">
                                                <div className="grid grid-cols-3 gap-2 mb-2">
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-white">{contactQuotes.length}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Quotes</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-green-400">{wonDeals}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Won</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className={`text-lg font-bold ${winRate !== null ? (winRate >= 50 ? 'text-green-400' : 'text-amber-400') : 'text-gray-500'}`}>
                                                            {winRate !== null ? `${winRate}%` : '-'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Win Rate</p>
                                                    </div>
                                                </div>
                                                {lifetimeValue > 0 && (
                                                    <div className="text-center pt-2 border-t border-white/10">
                                                        <p className="text-lg font-bold text-accent-primary">{formatCurrency(lifetimeValue, 'USD')}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Lifetime Value</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-1 text-sm text-gray-400">
                                            {contact.email && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">{contact.email}</a>
                                                </div>
                                            )}
                                            {contact.phone && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    <span>{contact.phone}</span>
                                                </div>
                                            )}
                                            {contact.notes && (
                                                <div className="mt-2 pt-2 border-t border-white/5">
                                                    <p className="text-xs text-gray-500 italic">{contact.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}

                            {/* Legacy Contact Fallback */}
                            {client.contacts?.length === 0 && client.contact && (
                                <div className="card border-dashed border-gray-700 opacity-70">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                                            {client.contact.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-200">{client.contact}</p>
                                            <p className="text-sm text-gray-500">Legacy Contact</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-400">
                                        {client.email && <p>{client.email}</p>}
                                        {client.phone && <p>{client.phone}</p>}
                                    </div>
                                    <p className="text-xs text-amber-500 mt-2">Migrate this to a proper contact by editing.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Contact Modal */}
            {
                isContactModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop">
                        <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl modal-content relative">
                            <button
                                onClick={() => { setIsContactModalOpen(false); setContactFormErrors({}); }}
                                className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-bold text-gray-100 mb-1">{editingContactId ? 'Edit Contact' : 'Add New Contact'}</h2>
                            <p className="text-sm text-gray-500 mb-6">Add contact details for this client.</p>

                            <form onSubmit={saveContact} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="label label-required">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={contactForm.name}
                                            onChange={e => {
                                                setContactForm({ ...contactForm, name: e.target.value });
                                                if (contactFormErrors.name) setContactFormErrors({ ...contactFormErrors, name: null });
                                            }}
                                            className={`input ${contactFormErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="Full name"
                                        />
                                        {contactFormErrors.name && <p className="text-xs text-red-400 mt-1">{contactFormErrors.name}</p>}
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="label">Role / Title</label>
                                        <input
                                            type="text"
                                            value={contactForm.role}
                                            onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                                            className="input"
                                            placeholder="e.g. Marketing Director"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Email</label>
                                        <input
                                            type="email"
                                            value={contactForm.email}
                                            onChange={e => {
                                                setContactForm({ ...contactForm, email: e.target.value });
                                                if (contactFormErrors.email) setContactFormErrors({ ...contactFormErrors, email: null });
                                            }}
                                            className={`input ${contactFormErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="email@company.com"
                                        />
                                        {contactFormErrors.email && <p className="text-xs text-red-400 mt-1">{contactFormErrors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="label">Phone</label>
                                        <input
                                            type="text"
                                            value={contactForm.phone}
                                            onChange={e => {
                                                setContactForm({ ...contactForm, phone: e.target.value });
                                                if (contactFormErrors.phone) setContactFormErrors({ ...contactFormErrors, phone: null });
                                            }}
                                            className={`input ${contactFormErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="+65 9123 4567"
                                        />
                                        {contactFormErrors.phone && <p className="text-xs text-red-400 mt-1">{contactFormErrors.phone}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Account Holder</label>
                                    <select
                                        value={contactForm.accountHolderId || ''}
                                        onChange={e => setContactForm({ ...contactForm, accountHolderId: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                    <p className="form-helper">Assign a team member responsible for this contact</p>
                                </div>

                                <div>
                                    <label className="label">Notes</label>
                                    <textarea
                                        value={contactForm.notes || ''}
                                        onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                                        className="input min-h-[80px] resize-none"
                                        placeholder="Internal notes about this contact..."
                                    />
                                    <p className="form-helper">Internal notes only - not shown on quotes</p>
                                </div>

                                {/* Primary Contact Toggle */}
                                <div className="flex items-center gap-3 p-3 bg-dark-bg/50 rounded-lg border border-dark-border">
                                    <input
                                        type="checkbox"
                                        id="isPrimary"
                                        checked={contactForm.isPrimary}
                                        onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                                    />
                                    <div>
                                        <label htmlFor="isPrimary" className="text-sm font-medium text-gray-200 cursor-pointer">Set as Primary Contact</label>
                                        <p className="text-xs text-gray-500">This contact will be the default for new quotes</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800/50">
                                    <button
                                        type="button"
                                        onClick={() => { setIsContactModalOpen(false); setContactFormErrors({}); }}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingContactId ? 'Save Changes' : 'Add Contact'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

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

        </div >
    );
}
