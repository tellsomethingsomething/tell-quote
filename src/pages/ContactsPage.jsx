import { useState, useEffect, useMemo } from 'react';
import { useContactStore, CONTACT_ROLES, getRoleInfo } from '../store/contactStore';
import { useClientStore } from '../store/clientStore';
import { useActivityStore } from '../store/activityStore';
import ContactCard from '../components/crm/ContactCard';
import ContactForm from '../components/crm/ContactForm';
import ActivityTimeline from '../components/crm/ActivityTimeline';

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

// Contact Detail Panel
function ContactDetailPanel({
    contact,
    client,
    activities,
    onClose,
    onUpdate,
    onDelete,
    onCompleteTask,
    onDeleteActivity,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { getFullName, getInitials } = useContactStore();

    const roleInfo = getRoleInfo(contact.role);
    const fullName = getFullName(contact);
    const initials = getInitials(contact);

    const handleSave = async (data) => {
        await onUpdate(contact.id, data);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="h-full flex flex-col bg-dark-card border-l border-dark-border">
                <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Edit Contact</h2>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-200">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <ContactForm
                        contact={contact}
                        clientId={contact.clientId}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-dark-card border-l border-dark-border">
            {/* Header */}
            <div className="p-4 border-b border-dark-border">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${roleInfo.color} bg-white/10`}>
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-white">{fullName}</h2>
                                {contact.isPrimary && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-brand-primary/20 text-brand-primary rounded">Primary</span>
                                )}
                            </div>
                            {contact.jobTitle && <p className="text-sm text-gray-400">{contact.jobTitle}</p>}
                            {client && <p className="text-xs text-gray-500">{client.company}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Role badge */}
                {contact.role && (
                    <div className="mt-3">
                        <span className={`px-2 py-0.5 text-xs rounded ${roleInfo.color} bg-white/5`}>
                            {roleInfo.label}
                        </span>
                    </div>
                )}

                {/* Contact Info */}
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-300 hover:text-brand-primary">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {contact.email}
                        </a>
                    )}
                    {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-300 hover:text-brand-primary">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {contact.phone}
                        </a>
                    )}
                    {contact.mobile && contact.mobile !== contact.phone && (
                        <a href={`tel:${contact.mobile}`} className="flex items-center gap-2 text-gray-300 hover:text-brand-primary">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            {contact.mobile}
                        </a>
                    )}
                    {contact.linkedinUrl && (
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-blue-400">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            LinkedIn
                        </a>
                    )}
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {contact.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-dark-border text-gray-400 rounded">{tag}</span>
                        ))}
                    </div>
                )}

                {/* Notes */}
                {contact.notes && (
                    <div className="mt-3 p-3 bg-dark-bg/50 rounded-lg">
                        <p className="text-xs text-gray-400">{contact.notes}</p>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                    <button onClick={() => setIsEditing(true)} className="btn btn-secondary flex-1">
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
                        <p className="text-sm text-red-400 mb-2">Delete {fullName}? This cannot be undone.</p>
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

            {/* Activity Timeline */}
            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Activity History ({activities.length})
                </h3>
                <ActivityTimeline
                    activities={activities}
                    onDelete={onDeleteActivity}
                    onCompleteTask={onCompleteTask}
                    emptyMessage="No activities with this contact yet"
                    maxItems={20}
                />
            </div>
        </div>
    );
}

// Main Page
export default function ContactsPage() {
    const {
        contacts,
        loading,
        initialize,
        updateContact,
        deleteContact,
        getFullName,
    } = useContactStore();

    const { clients, getClient } = useClientStore();
    const { getContactActivities, deleteActivity, completeTask, initialize: initializeActivities } = useActivityStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterClient, setFilterClient] = useState('all');
    const [showPrimaryOnly, setShowPrimaryOnly] = useState(false);
    const [sortBy, setSortBy] = useState('name'); // name, last_contacted, created
    const [selectedContact, setSelectedContact] = useState(null);

    // Initialize on mount
    useEffect(() => {
        initialize();
        initializeActivities();
    }, [initialize, initializeActivities]);

    // Filter and sort contacts
    const filteredContacts = useMemo(() => {
        let result = contacts;

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => {
                const fullName = getFullName(c).toLowerCase();
                return fullName.includes(q) ||
                    c.email?.toLowerCase().includes(q) ||
                    c.jobTitle?.toLowerCase().includes(q) ||
                    c.notes?.toLowerCase().includes(q);
            });
        }

        // Role filter
        if (filterRole !== 'all') {
            result = result.filter(c => c.role === filterRole);
        }

        // Client filter
        if (filterClient !== 'all') {
            result = result.filter(c => c.clientId === filterClient);
        }

        // Primary only
        if (showPrimaryOnly) {
            result = result.filter(c => c.isPrimary);
        }

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'last_contacted':
                    return new Date(b.lastContactedAt || 0) - new Date(a.lastContactedAt || 0);
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'name':
                default:
                    return getFullName(a).localeCompare(getFullName(b));
            }
        });

        return result;
    }, [contacts, searchQuery, filterRole, filterClient, showPrimaryOnly, sortBy, getFullName]);

    // Stats
    const stats = useMemo(() => ({
        total: contacts.length,
        primary: contacts.filter(c => c.isPrimary).length,
    }), [contacts]);

    const selectedContactActivities = selectedContact
        ? getContactActivities(selectedContact.id)
        : [];
    const selectedClient = selectedContact?.clientId
        ? getClient(selectedContact.clientId)
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
                                    {stats.primary > 0 && <span className="text-brand-primary ml-2">{stats.primary} primary</span>}
                                </p>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search contacts..."
                                    className="input w-full"
                                />
                            </div>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="input w-40"
                            >
                                <option value="all">All Roles</option>
                                {CONTACT_ROLES.map(role => (
                                    <option key={role.id} value={role.id}>{role.label}</option>
                                ))}
                            </select>
                            <select
                                value={filterClient}
                                onChange={(e) => setFilterClient(e.target.value)}
                                className="input w-48"
                            >
                                <option value="all">All Clients</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.company}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowPrimaryOnly(!showPrimaryOnly)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                    showPrimaryOnly
                                        ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                                        : 'bg-dark-card text-gray-400 border border-dark-border hover:text-gray-200'
                                }`}
                            >
                                Primary Only
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
                                <p className="text-sm text-gray-500 mt-1">Add contacts from the Client detail page</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredContacts.map(contact => {
                                    const client = contact.clientId ? getClient(contact.clientId) : null;
                                    return (
                                        <ContactCard
                                            key={contact.id}
                                            contact={contact}
                                            onSelect={setSelectedContact}
                                            showClient
                                            clientName={client?.company}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedContact && (
                    <div className="w-full md:w-[450px] flex-shrink-0">
                        <ContactDetailPanel
                            contact={selectedContact}
                            client={selectedClient}
                            activities={selectedContactActivities}
                            onClose={() => setSelectedContact(null)}
                            onUpdate={updateContact}
                            onDelete={deleteContact}
                            onCompleteTask={completeTask}
                            onDeleteActivity={deleteActivity}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
