import { useState } from 'react';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { formatCurrency } from '../utils/currency';
import { calculateGrandTotalWithFees } from '../utils/calculations';

const STATUS_COLORS = {
    draft: 'bg-amber-400/20 text-amber-400',
    sent: 'bg-blue-400/20 text-blue-400',
    won: 'bg-green-500/20 text-green-500',
    dead: 'bg-red-500/20 text-red-500',
};

export default function ClientDetailPage({ clientId, onBack, onEditQuote, onNewQuote }) {
    const { getClient, getClientQuotes, deleteQuote, updateQuoteStatus, deleteClient, updateClient, addContact, updateContact, deleteContact, getClientStats } = useClientStore();
    const { loadQuoteData } = useQuoteStore();

    const client = getClient(clientId);
    const quotes = getClientQuotes(clientId);
    const stats = getClientStats(clientId);

    const [activeTab, setActiveTab] = useState('overview'); // overview, contacts
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [clientForm, setClientForm] = useState({});

    // Contact State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);
    const [contactForm, setContactForm] = useState({});

    if (!client) {
        return (
            <div className="h-[calc(100vh-60px)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400">Client not found</p>
                    <button onClick={onBack} className="btn-ghost mt-4">Go Back</button>
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
        updateQuoteStatus(quoteId, status);
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
            setContactForm({ name: '', role: '', email: '', phone: '', isPrimary: false });
        }
        setIsContactModalOpen(true);
    };

    const saveContact = (e) => {
        e.preventDefault();
        if (editingContactId) {
            updateContact(clientId, editingContactId, contactForm);
        } else {
            addContact(clientId, contactForm);
        }
        setIsContactModalOpen(false);
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
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
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
                            onBack();
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

            {/* Metrics Dashboard */}
            {
                stats && (
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="card bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-900/30">
                            <p className="text-xs text-green-500/80 mb-1 font-medium uppercase tracking-wider">Win Rate</p>
                            <p className="text-3xl font-bold text-green-400">{stats.winRate}%</p>
                        </div>
                        <div className="card">
                            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Won Deals</p>
                            <p className="text-3xl font-bold text-gray-200">{stats.wonCount}</p>
                        </div>
                        <div className="card">
                            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Lost Deals</p>
                            <p className="text-3xl font-bold text-gray-200">{stats.lostCount}</p>
                        </div>
                        <div className="card">
                            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Total Quotes</p>
                            <p className="text-3xl font-bold text-white">{stats.totalQuotes}</p>
                        </div>
                    </div>
                )
            }
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
                                                        <option value="won">Won</option>
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
                activeTab === 'contacts' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Key People</h3>
                            <button onClick={() => openContactModal()} className="btn-secondary text-xs">
                                + Add Contact
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Render existing contacts sorted by deal count */}
                            {client.contacts
                                ?.map(contact => {
                                    const contactQuotes = quotes.filter(q => q.client?.contactId === contact.id);
                                    return {
                                        ...contact,
                                        contactQuotes,
                                        dealCount: contactQuotes.length,
                                        wonCount: contactQuotes.filter(q => q.status === 'won').length
                                    };
                                })
                                .sort((a, b) => b.dealCount - a.dealCount)
                                .map(contact => {
                                    const { contactQuotes, wonCount } = contact;

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
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3 bg-white/5 rounded p-2">
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Deals</p>
                                                <p className="text-lg font-bold text-white">{contactQuotes.length}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Won Deals</p>
                                                <p className="text-lg font-bold text-green-400">{wonCount}</p>
                                            </div>
                                        </div>

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
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold text-gray-100 mb-4">{editingContactId ? 'Edit Contact' : 'Add New Contact'}</h2>
                            <form onSubmit={saveContact} className="space-y-4">
                                <div>
                                    <label className="label">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={contactForm.name}
                                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Role</label>
                                    <input
                                        type="text"
                                        value={contactForm.role}
                                        onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                                        className="input"
                                        placeholder="e.g. Producer"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Email</label>
                                        <input
                                            type="email"
                                            value={contactForm.email}
                                            onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Phone</label>
                                        <input
                                            type="text"
                                            value={contactForm.phone}
                                            onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isPrimary"
                                        checked={contactForm.isPrimary}
                                        onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                                        className="rounded border-gray-600 bg-dark-bg text-accent-primary focus:ring-accent-primary"
                                    />
                                    <label htmlFor="isPrimary" className="text-sm text-gray-300">Set as Primary Contact</label>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsContactModalOpen(false)}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Save Contact
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
