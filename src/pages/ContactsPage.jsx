import { useState, useEffect, useMemo } from 'react';
import {
    useContactStore,
    CONTACT_CATEGORIES,
    COMPANY_CATEGORIES,
    MARKETS,
    COMMUNICATION_TYPES,
} from '../store/contactStore';

// Format relative time
function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// Contact Card Component
function ContactCard({ contact, company, onSelect, isSelected }) {
    const categoryInfo = CONTACT_CATEGORIES.find(c => c.id === contact.category);
    const daysSinceContact = contact.last_contacted_at
        ? Math.floor((Date.now() - new Date(contact.last_contacted_at)) / (1000 * 60 * 60 * 24))
        : null;
    const isCold = daysSinceContact !== null && daysSinceContact > 30;

    return (
        <div
            onClick={() => onSelect(contact)}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-accent-primary/50 ${
                isSelected
                    ? 'bg-accent-primary/10 border-accent-primary/50'
                    : 'bg-dark-card border-dark-border hover:bg-dark-card/80'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${categoryInfo?.color || 'bg-gray-500'}`}>
                    {contact.name?.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-100 truncate">{contact.name}</h3>
                        {contact.is_favorite && (
                            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        )}
                        {isCold && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">Cold</span>
                        )}
                    </div>
                    {contact.role && (
                        <p className="text-sm text-gray-400 truncate">{contact.role}</p>
                    )}
                    {company && (
                        <p className="text-xs text-gray-500 truncate">{company.name}</p>
                    )}
                </div>

                <div className="text-right text-xs text-gray-500">
                    {formatRelativeTime(contact.last_contacted_at)}
                </div>
            </div>

            {/* Tags/Markets */}
            {(contact.markets?.length > 0 || contact.tags?.length > 0) && (
                <div className="flex flex-wrap gap-1 mt-2 ml-13">
                    {contact.markets?.slice(0, 2).map(m => (
                        <span key={m} className="px-1.5 py-0.5 text-[10px] bg-gray-700 text-gray-300 rounded">
                            {m}
                        </span>
                    ))}
                    {contact.tags?.slice(0, 2).map(t => (
                        <span key={t} className="px-1.5 py-0.5 text-[10px] bg-accent-primary/20 text-accent-primary rounded">
                            {t}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// Add Contact Modal
function AddContactModal({ onClose, onSave, companies }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        company_id: '',
        category: 'client',
        markets: [],
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSave(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Add Contact</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="input"
                                placeholder="Full name"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="input"
                                    placeholder="email@company.com"
                                />
                            </div>
                            <div>
                                <label className="label">Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="input"
                                    placeholder="+60 12 345 6789"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Role/Title</label>
                                <input
                                    type="text"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="input"
                                    placeholder="Head of Production"
                                />
                            </div>
                            <div>
                                <label className="label">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="input"
                                >
                                    {CONTACT_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">Company</label>
                            <select
                                value={form.company_id}
                                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                                className="input"
                            >
                                <option value="">No company</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Markets</label>
                            <div className="flex flex-wrap gap-2">
                                {MARKETS.map(m => (
                                    <label key={m.id} className="flex items-center gap-1.5 text-sm text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={form.markets.includes(m.id)}
                                            onChange={(e) => {
                                                const markets = e.target.checked
                                                    ? [...form.markets, m.id]
                                                    : form.markets.filter(x => x !== m.id);
                                                setForm({ ...form, markets });
                                            }}
                                            className="rounded border-gray-600"
                                        />
                                        {m.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="label">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                className="input h-20"
                                placeholder="Additional notes..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                            <button type="submit" className="btn-primary">Add Contact</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Add Communication Modal
function AddCommunicationModal({ contact, onClose, onSave }) {
    const [form, setForm] = useState({
        type: 'note',
        direction: 'outbound',
        subject: '',
        content: '',
        needs_followup: false,
        followup_date: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            contact_id: contact.id,
            company_id: contact.company_id,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-lg">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Log Communication</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Type</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="input"
                                >
                                    {COMMUNICATION_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Direction</label>
                                <select
                                    value={form.direction}
                                    onChange={(e) => setForm({ ...form, direction: e.target.value })}
                                    className="input"
                                >
                                    <option value="outbound">Outbound (you contacted them)</option>
                                    <option value="inbound">Inbound (they contacted you)</option>
                                    <option value="internal">Internal note</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">Subject</label>
                            <input
                                type="text"
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                className="input"
                                placeholder="Brief summary..."
                            />
                        </div>

                        <div>
                            <label className="label">Details</label>
                            <textarea
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                className="input h-32"
                                placeholder="What was discussed? Key points, action items..."
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={form.needs_followup}
                                    onChange={(e) => setForm({ ...form, needs_followup: e.target.checked })}
                                    className="rounded border-gray-600"
                                />
                                Needs follow-up
                            </label>
                            {form.needs_followup && (
                                <input
                                    type="date"
                                    value={form.followup_date}
                                    onChange={(e) => setForm({ ...form, followup_date: e.target.value })}
                                    className="input w-40"
                                />
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                            <button type="submit" className="btn-primary">Log Communication</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Contact Detail Panel
function ContactDetail({ contact, company, communications, onClose, onUpdate, onDelete, onAddComm, onToggleFavorite }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(contact);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = () => {
        onUpdate(contact.id, editForm);
        setIsEditing(false);
    };

    const categoryInfo = CONTACT_CATEGORIES.find(c => c.id === contact.category);

    return (
        <div className="h-full flex flex-col bg-dark-card border-l border-dark-border">
            {/* Header */}
            <div className="p-4 border-b border-dark-border">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${categoryInfo?.color || 'bg-gray-500'}`}>
                            {contact.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">{contact.name}</h2>
                            {contact.role && <p className="text-sm text-gray-400">{contact.role}</p>}
                            {company && <p className="text-xs text-gray-500">{company.name}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleFavorite(contact.id)}
                            className={`p-2 rounded-lg transition-colors ${contact.is_favorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                        >
                            <svg className="w-5 h-5" fill={contact.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-300 hover:text-accent-primary">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {contact.email}
                        </a>
                    )}
                    {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-300 hover:text-accent-primary">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {contact.phone}
                        </a>
                    )}
                    {contact.whatsapp && (
                        <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-green-400">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            WhatsApp
                        </a>
                    )}
                    {contact.location && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {contact.location}
                        </div>
                    )}
                </div>

                {/* Tags */}
                {(contact.markets?.length > 0 || contact.projects?.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {contact.markets?.map(m => (
                            <span key={m} className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">{m}</span>
                        ))}
                        {contact.projects?.map(p => (
                            <span key={p} className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">{p}</span>
                        ))}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onAddComm}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Log Communication
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="btn-ghost"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete contact"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400 mb-2">Delete {contact.name}? This cannot be undone.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    onDelete(contact.id);
                                    onClose();
                                }}
                                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 text-gray-400 text-sm hover:text-gray-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Communications Timeline */}
            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Communication History ({communications.length})
                </h3>

                {communications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No communications logged yet</p>
                ) : (
                    <div className="space-y-3">
                        {communications.map(comm => {
                            const typeInfo = COMMUNICATION_TYPES.find(t => t.id === comm.type);
                            return (
                                <div key={comm.id} className="p-3 bg-dark-bg rounded-lg border border-dark-border">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            comm.direction === 'inbound' ? 'bg-green-500/10 text-green-400' :
                                            comm.direction === 'outbound' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-gray-500/10 text-gray-400'
                                        }`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo?.icon || ''} />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-200">{comm.subject || typeInfo?.label}</span>
                                                {comm.needs_followup && (
                                                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">Follow-up</span>
                                                )}
                                            </div>
                                            {comm.content && (
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{comm.content}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(comm.occurred_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Main Page
export default function ContactsPage() {
    const {
        contacts,
        companies,
        communications,
        loading,
        initialize,
        addContact,
        updateContact,
        deleteContact,
        toggleFavorite,
        addCommunication,
        getCommunicationsForContact,
        getCompanyById,
        getColdContacts,
    } = useContactStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMarket, setFilterMarket] = useState('all');
    const [showColdOnly, setShowColdOnly] = useState(false);
    const [sortBy, setSortBy] = useState('name'); // name, last_contacted, created
    const [selectedContact, setSelectedContact] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCommModal, setShowCommModal] = useState(false);

    // Initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Filter and sort contacts
    const filteredContacts = useMemo(() => {
        let result = contacts;

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.role?.toLowerCase().includes(q) ||
                c.notes?.toLowerCase().includes(q)
            );
        }

        // Category filter
        if (filterCategory !== 'all') {
            result = result.filter(c => c.category === filterCategory);
        }

        // Market filter
        if (filterMarket !== 'all') {
            result = result.filter(c => c.markets?.includes(filterMarket));
        }

        // Cold contacts only
        if (showColdOnly) {
            const coldIds = getColdContacts(30).map(c => c.id);
            result = result.filter(c => coldIds.includes(c.id));
        }

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'last_contacted':
                    return new Date(b.last_contacted_at || 0) - new Date(a.last_contacted_at || 0);
                case 'created':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'name':
                default:
                    return (a.name || '').localeCompare(b.name || '');
            }
        });

        return result;
    }, [contacts, searchQuery, filterCategory, filterMarket, showColdOnly, sortBy, getColdContacts]);

    // Stats
    const stats = useMemo(() => ({
        total: contacts.length,
        cold: getColdContacts(30).length,
        thisWeek: communications.filter(c =>
            new Date(c.occurred_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
    }), [contacts, communications, getColdContacts]);

    const selectedContactComms = selectedContact
        ? getCommunicationsForContact(selectedContact.id)
        : [];
    const selectedCompany = selectedContact?.company_id
        ? getCompanyById(selectedContact.company_id)
        : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-gray-400">Loading contacts...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="flex h-screen">
                {/* Main List */}
                <div className={`flex-1 flex flex-col ${selectedContact ? 'hidden md:flex' : ''}`}>
                    {/* Header */}
                    <div className="p-4 border-b border-dark-border">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Contacts</h1>
                                <p className="text-sm text-gray-400">
                                    {stats.total} contacts
                                    {stats.cold > 0 && <span className="text-blue-400 ml-2">{stats.cold} cold</span>}
                                    {stats.thisWeek > 0 && <span className="text-green-400 ml-2">{stats.thisWeek} comms this week</span>}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Contact
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search contacts..."
                                    className="input"
                                />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="input w-36"
                            >
                                <option value="all">All Categories</option>
                                {CONTACT_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                            <select
                                value={filterMarket}
                                onChange={(e) => setFilterMarket(e.target.value)}
                                className="input w-36"
                            >
                                <option value="all">All Markets</option>
                                {MARKETS.map(m => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowColdOnly(!showColdOnly)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                    showColdOnly
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-dark-card text-gray-400 border border-dark-border hover:text-gray-200'
                                }`}
                            >
                                Cold ({stats.cold})
                            </button>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="input w-40"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="last_contacted">Last Contacted</option>
                                <option value="created">Recently Added</option>
                            </select>
                        </div>
                    </div>

                    {/* Contact List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredContacts.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-gray-400">No contacts found</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="mt-4 btn-ghost"
                                >
                                    Add your first contact
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredContacts.map(contact => (
                                    <ContactCard
                                        key={contact.id}
                                        contact={contact}
                                        company={contact.company_id ? getCompanyById(contact.company_id) : null}
                                        onSelect={setSelectedContact}
                                        isSelected={selectedContact?.id === contact.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedContact && (
                    <div className="w-full md:w-[450px] flex-shrink-0">
                        <ContactDetail
                            contact={selectedContact}
                            company={selectedCompany}
                            communications={selectedContactComms}
                            onClose={() => setSelectedContact(null)}
                            onUpdate={updateContact}
                            onDelete={deleteContact}
                            onAddComm={() => setShowCommModal(true)}
                            onToggleFavorite={toggleFavorite}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddContactModal
                    onClose={() => setShowAddModal(false)}
                    onSave={addContact}
                    companies={companies}
                />
            )}

            {showCommModal && selectedContact && (
                <AddCommunicationModal
                    contact={selectedContact}
                    onClose={() => setShowCommModal(false)}
                    onSave={addCommunication}
                />
            )}
        </div>
    );
}
