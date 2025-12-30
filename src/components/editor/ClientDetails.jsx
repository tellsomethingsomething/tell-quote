import { useState, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useClientStore } from '../../store/clientStore';

export default function ClientDetails() {
    const { quote, setClientDetails } = useQuoteStore();
    const { clients, updateContact } = useClientStore();
    const { client } = quote;
    const [showDropdown, setShowDropdown] = useState(false);
    const [tagInput, setTagInput] = useState('');

    // Filter clients based on input
    const filteredClients = client.company
        ? clients.filter(c => c?.company?.toLowerCase()?.includes(client.company.toLowerCase()))
        : clients;

    // Handle escape key to close dropdown
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showDropdown) {
                setShowDropdown(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showDropdown]);

    const handleChange = (field, value) => {
        setClientDetails({ [field]: value });
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const currentTags = client.tags || [];
            if (!currentTags.includes(tagInput.trim())) {
                setClientDetails({ tags: [...currentTags, tagInput.trim()] });
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        const currentTags = client.tags || [];
        setClientDetails({ tags: currentTags.filter(tag => tag !== tagToRemove) });
    };

    const handleSelectClient = (selectedClient) => {
        // Get primary contact from contacts array, fallback to legacy fields
        const primaryContact = selectedClient.contacts?.find(c => c.isPrimary)
            || selectedClient.contacts?.[0];

        // Store clientId (UUID) for reliable linking
        setClientDetails({
            clientId: selectedClient.id,
            company: selectedClient.company,
            contactId: primaryContact?.id || null,
            contact: primaryContact?.name || selectedClient.contact || '',
            email: primaryContact?.email || selectedClient.email || '',
            phone: primaryContact?.phone || selectedClient.phone || '',
            role: primaryContact?.role || '',
        });
        setShowDropdown(false);
    };

    // Find full client data - prefer ID match, fallback to company name
    const clientData = client?.clientId
        ? clients.find(c => c.id === client.clientId)
        : clients.find(c => c?.company?.toLowerCase() === client?.company?.toLowerCase());

    const handleSelectContact = (contactId) => {
        if (!clientData) return;

        const contact = clientData.contacts?.find(c => c.id === contactId);
        if (contact) {
            setClientDetails({
                contactId: contact.id,
                contact: contact.name,
                role: contact.role || '',
                email: contact.email,
                phone: contact.phone,
                notes: contact.notes || '',
            });
        }
    };

    // Sync contact field back to client store
    const handleContactFieldChange = (field, value) => {
        handleChange(field, value);

        // If we have a selected contact, sync back to client store
        if (clientData && client.contactId) {
            updateContact(clientData.id, client.contactId, { [field]: value });
        }
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Client Details
            </h3>

            <div className="space-y-5">
                {/* Company Name with Client Selector */}
                <div className="relative">
                    <label className="label">Company Name</label>
                    <input
                        type="text"
                        value={client.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        onFocus={() => !quote.isLocked && setShowDropdown(true)}
                        placeholder="Type to search or add new client..."
                        className="input"
                        disabled={quote.isLocked}
                    />

                    {/* Client Dropdown */}
                    {showDropdown && filteredClients.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a24] border border-dark-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                            {filteredClients.map((c, index) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelectClient(c)}
                                    className={`w-full px-3 py-2.5 text-left hover:bg-accent-primary/20 transition-colors flex items-center gap-3 ${index !== filteredClients.length - 1 ? 'border-b border-dark-border/50' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-md bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                                        {c.company.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-200 font-medium truncate">{c.company}</p>
                                        {c.contact && (
                                            <p className="text-xs text-gray-500 truncate">{c.contact}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Click outside to close */}
                    {showDropdown && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDropdown(false)}
                        />
                    )}
                </div>

                <div>
                    <label className="label">Contact Person</label>
                    {clientData && clientData.contacts?.length > 0 ? (
                        <div className="flex gap-2">
                            <select
                                value={client.contactId || ''}
                                onChange={(e) => handleSelectContact(e.target.value)}
                                className="input flex-1"
                                disabled={quote.isLocked}
                            >
                                <option value="">Select Contact...</option>
                                {clientData.contacts.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.isPrimary ? '(Primary)' : ''} - {c.role || 'No Role'}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={client.contact}
                                onChange={(e) => handleChange('contact', e.target.value)}
                                placeholder="Or type name..."
                                className="input w-1/3"
                                disabled={quote.isLocked}
                            />
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={client.contact}
                            onChange={(e) => handleChange('contact', e.target.value)}
                            placeholder="e.g. John Smith"
                            className="input"
                            disabled={quote.isLocked}
                        />
                    )}
                </div>

                <div>
                    <label className="label">Role on Project <span className="text-gray-600 font-normal">(for this quote)</span></label>
                    <input
                        type="text"
                        value={client.role || ''}
                        onChange={(e) => handleChange('role', e.target.value)}
                        placeholder="e.g. Executive Producer, Client Liaison"
                        className="input"
                        disabled={quote.isLocked}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={client.email}
                            onChange={(e) => handleContactFieldChange('email', e.target.value)}
                            placeholder="email@company.com"
                            className="input"
                            disabled={quote.isLocked}
                        />
                    </div>

                    <div>
                        <label className="label">Phone</label>
                        <input
                            type="tel"
                            value={client.phone}
                            onChange={(e) => handleContactFieldChange('phone', e.target.value)}
                            placeholder="+1 555 123 4567"
                            className="input"
                            disabled={quote.isLocked}
                        />
                    </div>
                </div>

                <div>
                    <label className="label">
                        Notes
                        {client.contactId && <span className="text-accent-primary font-normal ml-1">(synced to contact)</span>}
                        {!client.contactId && <span className="text-gray-600 font-normal ml-1">(internal only)</span>}
                    </label>
                    <textarea
                        value={client.notes || ''}
                        onChange={(e) => handleContactFieldChange('notes', e.target.value)}
                        placeholder="Notes about this contact..."
                        rows={2}
                        className="input resize-none text-sm"
                        disabled={quote.isLocked}
                    />
                </div>

                {/* Tags - for the event/project */}
                <div>
                    <label className="label">Event Tags <span className="text-gray-600 font-normal">(for this quote)</span></label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {(client.tags || []).map((tag, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded text-xs"
                            >
                                {tag}
                                {!quote.isLocked && (
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-white transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Type and press Enter to add..."
                        className="input text-sm"
                        disabled={quote.isLocked}
                    />
                </div>
            </div>
        </div>
    );
}
