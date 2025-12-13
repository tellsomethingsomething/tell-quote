import { useState, useEffect } from 'react';
import { useOpportunityStore, REGIONS, getRegionForCountry } from '../store/opportunityStore';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { formatCurrency } from '../utils/currency';

const STATUS_COLORS = {
    active: 'bg-blue-400/20 text-blue-400',
    won: 'bg-green-500/20 text-green-500',
    lost: 'bg-red-500/20 text-red-500',
};

export default function OpportunityDetailPage({ opportunityId, onBack, onConvertToQuote }) {
    const { getOpportunity, updateOpportunity, deleteOpportunity, addContact, updateContact, deleteContact } = useOpportunityStore();
    const { clients } = useClientStore();
    const { loadQuoteData, setClient, setProject, setFees } = useQuoteStore();

    const opportunity = getOpportunity(opportunityId);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Contact modal
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);
    const [contactForm, setContactForm] = useState({});

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (isContactModalOpen) setIsContactModalOpen(false);
                else if (isEditing) setIsEditing(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isContactModalOpen, isEditing]);

    if (!opportunity) {
        return (
            <div className="h-[calc(100vh-60px)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400">Opportunity not found</p>
                    <button onClick={onBack} className="btn-ghost mt-4">Back to Opportunities</button>
                </div>
            </div>
        );
    }

    const startEditing = () => {
        setEditForm({
            title: opportunity.title || '',
            clientId: opportunity.clientId || '',
            newClientName: '',
            clientWebsite: '',
            clientLocation: '',
            clientAddress: '',
            country: opportunity.country || '',
            value: opportunity.value || 0,
            currency: opportunity.currency || 'USD',
            probability: opportunity.probability || 50,
            source: opportunity.source || '',
            competitors: (opportunity.competitors || []).join(', '),
            brief: opportunity.brief || '',
            notes: opportunity.notes || '',
            nextAction: opportunity.nextAction || '',
            nextActionDate: opportunity.nextActionDate || '',
            expectedCloseDate: opportunity.expectedCloseDate || '',
        });
        setIsEditing(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();

        let clientId = editForm.clientId;
        let clientData = {};

        if (editForm.clientId) {
            const existingClient = clients.find(c => c.id === editForm.clientId);
            clientData = {
                company: existingClient?.company || '',
                id: existingClient?.id,
            };
        } else if (editForm.newClientName?.trim()) {
            // Create new client
            const newClient = await useClientStore.getState().addClient({
                company: editForm.newClientName.trim(),
                website: editForm.clientWebsite,
                location: editForm.clientLocation,
                address: editForm.clientAddress,
            });
            clientId = newClient.id;
            clientData = {
                company: editForm.newClientName.trim(),
                id: newClient.id,
            };
        }

        updateOpportunity(opportunity.id, {
            title: editForm.title,
            clientId: clientId || null,
            client: clientData,
            country: editForm.country,
            region: getRegionForCountry(editForm.country),
            value: parseFloat(editForm.value) || 0,
            currency: editForm.currency,
            probability: editForm.probability,
            source: editForm.source,
            competitors: editForm.competitors.split(',').map(c => c.trim()).filter(Boolean),
            brief: editForm.brief,
            notes: editForm.notes,
            nextAction: editForm.nextAction,
            nextActionDate: editForm.nextActionDate || null,
            expectedCloseDate: editForm.expectedCloseDate || null,
        });
        setIsEditing(false);
    };

    const handleStatusChange = (newStatus) => {
        updateOpportunity(opportunity.id, { status: newStatus });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this opportunity?')) {
            deleteOpportunity(opportunity.id);
            onBack();
        }
    };

    const handleConvertToQuote = () => {
        // Pre-fill quote with opportunity data
        // Get full client details from clientStore if we have a clientId
        const fullClient = opportunity.clientId
            ? clients.find(c => c.id === opportunity.clientId)
            : null;
        const client = fullClient || opportunity.client || {};
        const primaryContact = opportunity.contacts?.find(c => c.isPrimary) || opportunity.contacts?.[0];

        // Navigate to quote editor with pre-filled data
        if (onConvertToQuote) {
            onConvertToQuote({
                client: {
                    company: client.company || '',
                    // Add primary contact info to client
                    contact: primaryContact?.name || client.contact || '',
                    email: primaryContact?.email || client.email || '',
                    phone: primaryContact?.phone || client.phone || '',
                    address: client.address || '',
                },
                project: {
                    title: opportunity.title,
                    description: opportunity.brief,
                    startDate: opportunity.expectedCloseDate,
                },
                opportunityId: opportunity.id,
                estimatedValue: opportunity.value || 0,
                currency: opportunity.currency || 'USD',
                country: opportunity.country,
                region: opportunity.region,
                contacts: opportunity.contacts || [],
            });
        }

        // Mark opportunity as converted
        updateOpportunity(opportunity.id, { status: 'won' });
    };

    // Contact handlers
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
            updateContact(opportunity.id, editingContactId, contactForm);
        } else {
            addContact(opportunity.id, contactForm);
        }
        setIsContactModalOpen(false);
    };

    const confirmDeleteContact = (contactId) => {
        if (window.confirm('Delete this contact?')) {
            deleteContact(opportunity.id, contactId);
        }
    };

    const contacts = opportunity.contacts || [];
    const primaryContact = contacts.find(c => c.isPrimary);

    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-6 relative">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-100">{opportunity.title || 'Untitled Opportunity'}</h1>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[opportunity.status]}`}>
                                {opportunity.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{opportunity.country}</span>
                            <span>•</span>
                            <span>{opportunity.region}</span>
                            {opportunity.client?.company && (
                                <>
                                    <span>•</span>
                                    <span>{opportunity.client.company}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {opportunity.status === 'active' && (
                        <button
                            onClick={handleConvertToQuote}
                            className="btn-primary text-sm"
                        >
                            Convert to Quote
                        </button>
                    )}
                    <button
                        onClick={startEditing}
                        className="btn-ghost text-sm"
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Value & Status */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-200">Deal Value</h2>
                            <select
                                value={opportunity.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="input-sm text-sm bg-dark-bg"
                            >
                                <option value="active">Active</option>
                                <option value="won">Won</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Value</p>
                                <p className="text-2xl font-bold text-white">
                                    {formatCurrency(opportunity.value || 0, opportunity.currency || 'USD', 0)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Probability</p>
                                <p className="text-2xl font-bold text-amber-400">{opportunity.probability || 0}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Weighted Value</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {formatCurrency((opportunity.value || 0) * ((opportunity.probability || 0) / 100), opportunity.currency || 'USD', 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Brief */}
                    {opportunity.brief && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-200 mb-3">Brief</h2>
                            <p className="text-gray-400 whitespace-pre-wrap">{opportunity.brief}</p>
                        </div>
                    )}

                    {/* Next Action */}
                    {(opportunity.nextAction || opportunity.nextActionDate) && (
                        <div className="card bg-amber-900/10 border-amber-500/20">
                            <h2 className="text-lg font-semibold text-amber-400 mb-3">Next Action</h2>
                            <p className="text-gray-300">{opportunity.nextAction || 'No action specified'}</p>
                            {opportunity.nextActionDate && (
                                <p className="text-sm text-amber-400 mt-2">
                                    Due: {new Date(opportunity.nextActionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Contacts */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-200">Contacts</h2>
                            <button
                                onClick={() => openContactModal()}
                                className="btn-ghost text-sm"
                            >
                                Add Contact
                            </button>
                        </div>
                        {contacts.length === 0 ? (
                            <p className="text-gray-500 italic">No contacts added</p>
                        ) : (
                            <div className="space-y-3">
                                {contacts.map(contact => (
                                    <div key={contact.id} className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold">
                                                {contact.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-200">{contact.name}</span>
                                                    {contact.isPrimary && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-accent-primary/20 text-accent-primary rounded">Primary</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{contact.role || 'No role'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {contact.email && (
                                                <a href={`mailto:${contact.email}`} className="text-gray-500 hover:text-white">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a href={`tel:${contact.phone}`} className="text-gray-500 hover:text-white">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </a>
                                            )}
                                            <button
                                                onClick={() => openContactModal(contact)}
                                                className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => confirmDeleteContact(contact.id)}
                                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {opportunity.notes && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-200 mb-3">Notes</h2>
                            <p className="text-gray-400 whitespace-pre-wrap">{opportunity.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Details */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-200 mb-4">Details</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Country</p>
                                <p className="text-gray-200">{opportunity.country || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Region</p>
                                <p className="text-gray-200">{opportunity.region || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Source</p>
                                <p className="text-gray-200">{opportunity.source || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Expected Close</p>
                                <p className="text-gray-200">
                                    {opportunity.expectedCloseDate
                                        ? new Date(opportunity.expectedCloseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Created</p>
                                <p className="text-gray-200">
                                    {new Date(opportunity.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Competitors */}
                    {opportunity.competitors && opportunity.competitors.length > 0 && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-200 mb-3">Competitors</h2>
                            <div className="flex flex-wrap gap-2">
                                {opportunity.competitors.map((comp, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-sm">
                                        {comp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Primary Contact Quick View */}
                    {primaryContact && (
                        <div className="card bg-accent-primary/5 border-accent-primary/20">
                            <h2 className="text-sm font-semibold text-accent-primary mb-3">Primary Contact</h2>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold">
                                    {primaryContact.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-200">{primaryContact.name}</p>
                                    <p className="text-xs text-gray-500">{primaryContact.role || 'No role'}</p>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                                {primaryContact.email && (
                                    <a href={`mailto:${primaryContact.email}`} className="block text-gray-400 hover:text-white">
                                        {primaryContact.email}
                                    </a>
                                )}
                                {primaryContact.phone && (
                                    <a href={`tel:${primaryContact.phone}`} className="block text-gray-400 hover:text-white">
                                        {primaryContact.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-xl font-bold text-gray-100 mb-6">Edit Opportunity</h2>

                        <form onSubmit={saveEdit} className="space-y-6">
                            {/* Client Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Client
                                </h3>
                                <div>
                                    <label className="label">Select Client</label>
                                    <select
                                        value={editForm.clientId}
                                        onChange={e => setEditForm({ ...editForm, clientId: e.target.value, newClientName: '' })}
                                        className="input w-full"
                                    >
                                        <option value="">-- Select existing client or add new --</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.company}</option>
                                        ))}
                                    </select>
                                </div>
                                {!editForm.clientId && (
                                    <div className="space-y-4 p-4 bg-dark-bg/30 rounded-lg border border-dark-border">
                                        <div>
                                            <label className="label">Or Create New Client</label>
                                            <input
                                                type="text"
                                                value={editForm.newClientName || ''}
                                                onChange={e => setEditForm({ ...editForm, newClientName: e.target.value })}
                                                className="input w-full"
                                                placeholder="Company name..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Website</label>
                                                <input
                                                    type="url"
                                                    value={editForm.clientWebsite || ''}
                                                    onChange={e => setEditForm({ ...editForm, clientWebsite: e.target.value })}
                                                    className="input w-full"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Location / City</label>
                                                <input
                                                    type="text"
                                                    value={editForm.clientLocation || ''}
                                                    onChange={e => setEditForm({ ...editForm, clientLocation: e.target.value })}
                                                    className="input w-full"
                                                    placeholder="e.g. Kuala Lumpur"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Address</label>
                                            <textarea
                                                value={editForm.clientAddress || ''}
                                                onChange={e => setEditForm({ ...editForm, clientAddress: e.target.value })}
                                                className="input w-full resize-none"
                                                rows={2}
                                                placeholder="Full address..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Opportunity Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Opportunity Details
                                </h3>
                                <div>
                                    <label className="label">Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="label">Country</label>
                                    <select
                                        value={editForm.country}
                                        onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="">Select country...</option>
                                        {Object.entries(REGIONS).map(([region, countries]) => (
                                            <optgroup key={region} label={region}>
                                                {countries.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Contacts Section - show client contacts if client selected */}
                            {editForm.clientId && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                        Link Contacts from Client
                                    </h3>
                                    {(() => {
                                        const selectedClient = clients.find(c => c.id === editForm.clientId);
                                        const clientContacts = selectedClient?.contacts || [];
                                        if (clientContacts.length === 0) {
                                            return (
                                                <p className="text-sm text-gray-500 italic">
                                                    No contacts on this client. Add contacts after saving.
                                                </p>
                                            );
                                        }
                                        return (
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-500">
                                                    These are the contacts from the selected client. You can add them to this opportunity from the Contacts section after saving.
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {clientContacts.map(contact => (
                                                        <span key={contact.id} className="text-xs bg-dark-bg/50 px-2 py-1 rounded text-gray-300">
                                                            {contact.name} {contact.role ? `(${contact.role})` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Financials Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Financials
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Value</label>
                                        <input
                                            type="number"
                                            value={editForm.value}
                                            onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                                            className="input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Currency</label>
                                        <select
                                            value={editForm.currency}
                                            onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="GBP">GBP</option>
                                            <option value="EUR">EUR</option>
                                            <option value="MYR">MYR</option>
                                            <option value="SGD">SGD</option>
                                            <option value="AED">AED</option>
                                            <option value="SAR">SAR</option>
                                            <option value="QAR">QAR</option>
                                            <option value="KWD">KWD</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Probability (%)</label>
                                        <input
                                            type="number"
                                            value={editForm.probability}
                                            onChange={e => setEditForm({ ...editForm, probability: parseInt(e.target.value) || 0 })}
                                            className="input w-full"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sales Info Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Sales Info
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Source</label>
                                        <select
                                            value={editForm.source}
                                            onChange={e => setEditForm({ ...editForm, source: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">-- Select source --</option>
                                            <option value="referral">Referral</option>
                                            <option value="repeat-client">Repeat Client</option>
                                            <option value="website">Website</option>
                                            <option value="cold-call">Cold Call</option>
                                            <option value="event">Event / Trade Show</option>
                                            <option value="social-media">Social Media</option>
                                            <option value="partner">Partner</option>
                                            <option value="tender">Tender / RFP</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Expected Close Date</label>
                                        <input
                                            type="date"
                                            value={editForm.expectedCloseDate}
                                            onChange={e => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
                                            className="input w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Competitors (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={editForm.competitors}
                                        onChange={e => setEditForm({ ...editForm, competitors: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g. Company A, Company B"
                                    />
                                </div>
                            </div>

                            {/* Brief Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Brief / Description
                                </h3>
                                <textarea
                                    value={editForm.brief}
                                    onChange={e => setEditForm({ ...editForm, brief: e.target.value })}
                                    className="input w-full min-h-[80px] resize-none"
                                    placeholder="Describe the project requirements..."
                                />
                            </div>

                            {/* Actions Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Actions & Notes
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Next Action</label>
                                        <input
                                            type="text"
                                            value={editForm.nextAction}
                                            onChange={e => setEditForm({ ...editForm, nextAction: e.target.value })}
                                            className="input w-full"
                                            placeholder="e.g. Send proposal, Follow up call"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Next Action Date</label>
                                        <input
                                            type="date"
                                            value={editForm.nextActionDate}
                                            onChange={e => setEditForm({ ...editForm, nextActionDate: e.target.value })}
                                            className="input w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Notes</label>
                                    <textarea
                                        value={editForm.notes}
                                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                        className="input w-full min-h-[80px] resize-none"
                                        placeholder="Any additional notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {isContactModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-100 mb-4">
                            {editingContactId ? 'Edit Contact' : 'Add Contact'}
                        </h2>

                        <form onSubmit={saveContact} className="space-y-4">
                            <div>
                                <label className="label label-required">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={contactForm.name || ''}
                                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                    className="input w-full"
                                />
                            </div>
                            <div>
                                <label className="label">Role</label>
                                <input
                                    type="text"
                                    value={contactForm.role || ''}
                                    onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                                    className="input w-full"
                                    placeholder="e.g. Marketing Director"
                                />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={contactForm.email || ''}
                                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                    className="input w-full"
                                />
                            </div>
                            <div>
                                <label className="label">Phone</label>
                                <input
                                    type="tel"
                                    value={contactForm.phone || ''}
                                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                                    className="input w-full"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPrimary"
                                    checked={contactForm.isPrimary || false}
                                    onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-600 text-accent-primary focus:ring-accent-primary bg-dark-bg"
                                />
                                <label htmlFor="isPrimary" className="text-sm text-gray-300">Primary contact</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setIsContactModalOpen(false)} className="btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingContactId ? 'Save Changes' : 'Add Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
