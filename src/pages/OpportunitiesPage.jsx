import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useOpportunityStore, REGIONS, ALL_COUNTRIES, getRegionForCountry } from '../store/opportunityStore';
import { useClientStore } from '../store/clientStore';
import { useSettingsStore } from '../store/settingsStore';
import { useQuoteStore } from '../store/quoteStore';
import { formatCurrency, convertCurrency } from '../utils/currency';

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Droppable country zone component
function DroppableCountry({ country, children, isOver }) {
    const { setNodeRef } = useDroppable({
        id: country,
    });

    return (
        <div
            ref={setNodeRef}
            className={`transition-all duration-200 ${isOver ? 'ring-2 ring-accent-primary ring-opacity-50 bg-accent-primary/5 rounded-lg' : ''}`}
        >
            {children}
        </div>
    );
}

// Sortable opportunity card component
function SortableOpportunityCard({ opportunity, onSelect, onDelete, onUpdateNotes, isExpanded, onToggleExpand, users }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-dark-bg/50 rounded-lg border border-dark-border hover:border-accent-primary/30 transition-all ${isDragging ? 'shadow-lg ring-2 ring-accent-primary/50' : ''}`}
        >
            <OpportunityCard
                opportunity={opportunity}
                onSelect={onSelect}
                onDelete={onDelete}
                onUpdateNotes={onUpdateNotes}
                isExpanded={isExpanded}
                onToggleExpand={onToggleExpand}
                dragHandleProps={{ ...attributes, ...listeners }}
                users={users}
            />
        </div>
    );
}

// Opportunity card component
function OpportunityCard({ opportunity, onSelect, onDelete, onUpdateNotes, isExpanded, onToggleExpand, dragHandleProps, users }) {
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState(opportunity.notes || '');

    const getStatusColor = (status) => {
        switch (status) {
            case 'won': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'lost': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    const handleSaveNotes = () => {
        onUpdateNotes(opportunity.id, notesValue);
        setEditingNotes(false);
    };

    // Get account owner name
    const accountOwner = users?.find(u => u.id === opportunity.accountOwnerId);

    // Get primary contact
    const primaryContact = opportunity.contacts?.find(c => c.isPrimary) || opportunity.contacts?.[0];

    return (
        <div className="p-3">
            {/* Header row with drag handle */}
            <div className="flex items-start gap-2">
                {/* Drag handle */}
                <button
                    {...dragHandleProps}
                    className="p-1 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing mt-0.5"
                    title="Drag to move"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
                    </svg>
                </button>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                                onClick={() => onToggleExpand(opportunity.id)}
                                className="text-gray-500 hover:text-gray-300"
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <h4
                                onClick={() => onSelect(opportunity.id)}
                                className="font-medium text-gray-200 truncate hover:text-accent-primary cursor-pointer"
                            >
                                {opportunity.title || 'Untitled'}
                            </h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${getStatusColor(opportunity.status)}`}>
                                {opportunity.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-gray-200">
                                {formatCurrency(opportunity.value || 0, opportunity.currency || 'USD', 0)}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(opportunity.id);
                                }}
                                className="p-1 text-gray-500 hover:text-accent-primary"
                                title="Edit opportunity"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this opportunity?')) {
                                        onDelete(opportunity.id);
                                    }
                                }}
                                className="p-1 text-gray-500 hover:text-red-400"
                                title="Delete opportunity"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Quick info row - dates, owner, contact */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1 ml-6">
                        {opportunity.client?.company && <span>{opportunity.client.company}</span>}
                        {opportunity.probability > 0 && (
                            <span className="text-amber-400">{opportunity.probability}%</span>
                        )}
                        {opportunity.expectedCloseDate && (
                            <span className="text-purple-400" title="Expected close">
                                Close: {formatDate(opportunity.expectedCloseDate)}
                            </span>
                        )}
                        {accountOwner && (
                            <span className="text-blue-400" title="Account owner">
                                {accountOwner.name}
                            </span>
                        )}
                        {primaryContact && (
                            <span className="text-emerald-400" title="Key contact">
                                {primaryContact.name}
                            </span>
                        )}
                        {opportunity.nextAction && (
                            <span className="text-cyan-400 truncate max-w-[150px]" title="Next action">
                                → {opportunity.nextAction}
                                {opportunity.nextActionDate && ` (${formatDate(opportunity.nextActionDate)})`}
                            </span>
                        )}
                    </div>

                    {/* Notes preview - always visible */}
                    {opportunity.notes && (
                        <div className="mt-2 ml-6 text-xs text-gray-400 italic line-clamp-2 bg-dark-bg/30 rounded px-2 py-1">
                            {opportunity.notes}
                        </div>
                    )}

                    {/* Contacts preview - always visible */}
                    {opportunity.contacts?.length > 0 && (
                        <div className="mt-2 ml-6 flex flex-wrap gap-1">
                            {opportunity.contacts.slice(0, 3).map((contact, idx) => (
                                <span key={idx} className="text-[10px] bg-dark-bg/50 px-1.5 py-0.5 rounded text-gray-400">
                                    {contact.name}{contact.isPrimary && <span className="text-amber-400 ml-0.5">★</span>}
                                </span>
                            ))}
                            {opportunity.contacts.length > 3 && (
                                <span className="text-[10px] text-gray-500">+{opportunity.contacts.length - 3} more</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="mt-3 ml-6 pl-2 border-l-2 border-dark-border space-y-3">
                    {/* Brief */}
                    {opportunity.brief && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Brief</p>
                            <p className="text-sm text-gray-300">{opportunity.brief}</p>
                        </div>
                    )}

                    {/* Source & Competitors */}
                    <div className="flex gap-4 flex-wrap">
                        {opportunity.source && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Source</p>
                                <p className="text-sm text-gray-300">{opportunity.source}</p>
                            </div>
                        )}
                        {opportunity.competitors?.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Competitors</p>
                                <p className="text-sm text-gray-300">{opportunity.competitors.join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {/* Contacts */}
                    {opportunity.contacts?.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contacts</p>
                            <div className="flex flex-wrap gap-2">
                                {opportunity.contacts.map((contact, idx) => (
                                    <span key={idx} className="text-xs bg-dark-card px-2 py-1 rounded text-gray-300">
                                        {contact.name}{contact.role ? ` (${contact.role})` : ''}
                                        {contact.isPrimary && <span className="text-amber-400 ml-1">★</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Next Action with Date */}
                    {(opportunity.nextAction || opportunity.nextActionDate) && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Action</p>
                            <p className="text-sm text-cyan-400">
                                {opportunity.nextAction}
                                {opportunity.nextActionDate && (
                                    <span className="text-gray-500 ml-2">
                                        ({new Date(opportunity.nextActionDate).toLocaleDateString()})
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Notes - editable inline */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Notes</p>
                            {!editingNotes && (
                                <button
                                    onClick={() => {
                                        setNotesValue(opportunity.notes || '');
                                        setEditingNotes(true);
                                    }}
                                    className="text-xs text-accent-primary hover:underline"
                                >
                                    {opportunity.notes ? 'Edit' : 'Add note'}
                                </button>
                            )}
                        </div>
                        {editingNotes ? (
                            <div className="space-y-2">
                                <textarea
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.target.value)}
                                    className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm text-gray-200 resize-none"
                                    rows={3}
                                    autoFocus
                                    placeholder="Add notes..."
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveNotes}
                                        className="btn-primary text-xs px-3 py-1"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingNotes(false)}
                                        className="btn-ghost text-xs px-3 py-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 whitespace-pre-wrap">
                                {opportunity.notes || <span className="italic text-gray-600">No notes</span>}
                            </p>
                        )}
                    </div>

                    {/* Open full detail button */}
                    <button
                        onClick={() => onSelect(opportunity.id)}
                        className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                    >
                        Open full details
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

export default function OpportunitiesPage({ onSelectOpportunity }) {
    const {
        opportunities,
        addOpportunity,
        deleteOpportunity,
        updateOpportunity,
        syncStatus,
        syncError,
        pendingSyncCount,
        syncAllToSupabase,
        clearSyncError,
        getUnsyncedCount
    } = useOpportunityStore();
    const { clients } = useClientStore();
    const { settings, setOpsPreferences } = useSettingsStore();
    const { rates } = useQuoteStore();
    const users = settings.users || [];

    // Get ops preferences from settings (synced via Supabase)
    const opsPrefs = settings.opsPreferences || {};

    // Initialize expandedCountries with defaults if empty
    const expandedCountries = useMemo(() => {
        const saved = opsPrefs.expandedCountries || {};
        // If no saved preferences, default all countries to expanded
        if (Object.keys(saved).length === 0) {
            const expanded = {};
            ALL_COUNTRIES.forEach(country => { expanded[country] = true; });
            return expanded;
        }
        return saved;
    }, [opsPrefs.expandedCountries]);

    const hiddenCountries = opsPrefs.hiddenCountries || {};
    const dashboardCurrency = opsPrefs.dashboardCurrency || 'USD';

    const [searchQuery, setSearchQuery] = useState('');
    const [filterRegion, setFilterRegion] = useState('all');
    const [filterStatus, setFilterStatus] = useState('active');

    const [expandedOpportunities, setExpandedOpportunities] = useState({});
    const [quickAddCountry, setQuickAddCountry] = useState(null);
    const [quickAddTitle, setQuickAddTitle] = useState('');
    const [quickAddValue, setQuickAddValue] = useState('');
    const [quickAddCurrency, setQuickAddCurrency] = useState('USD');
    const [activeId, setActiveId] = useState(null);
    const [overCountry, setOverCountry] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newOppForm, setNewOppForm] = useState({
        // Client & Contact
        clientId: '',
        newClientName: '',
        clientWebsite: '',
        clientLocation: '',
        clientAddress: '',
        contactName: '',
        contactRole: '',
        contactEmail: '',
        contactPhone: '',
        // Opportunity Details
        title: '',
        country: '',
        brief: '',
        projectType: 'broadcast',
        venue: '',
        // Dates
        startDate: '',
        endDate: '',
        expectedCloseDate: '',
        // Financials
        value: '',
        currency: 'USD',
        probability: 50,
        // Sales Info
        accountOwnerId: '',
        source: '',
        competitors: '',
        // Actions
        nextAction: '',
        nextActionDate: '',
        notes: '',
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Helper functions to update ops preferences (synced to Supabase)
    const setExpandedCountries = (updater) => {
        const newExpanded = typeof updater === 'function' ? updater(expandedCountries) : updater;
        setOpsPreferences({ expandedCountries: newExpanded });
    };

    const setHiddenCountries = (updater) => {
        const newHidden = typeof updater === 'function' ? updater(hiddenCountries) : updater;
        setOpsPreferences({ hiddenCountries: newHidden });
    };

    const setDashboardCurrency = (currency) => {
        setOpsPreferences({ dashboardCurrency: currency });
    };

    // Filter opportunities
    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(opp => {
            if (filterStatus !== 'all' && opp.status !== filterStatus) return false;
            if (filterRegion !== 'all' && opp.region !== filterRegion) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchTitle = opp.title?.toLowerCase().includes(query);
                const matchClient = opp.client?.company?.toLowerCase().includes(query);
                const matchCountry = opp.country?.toLowerCase().includes(query);
                const matchNotes = opp.notes?.toLowerCase().includes(query);
                if (!matchTitle && !matchClient && !matchCountry && !matchNotes) return false;
            }
            return true;
        });
    }, [opportunities, filterStatus, filterRegion, searchQuery]);

    // Group by country
    const groupedByCountry = useMemo(() => {
        const grouped = {};
        ALL_COUNTRIES.forEach(country => {
            grouped[country] = [];
        });
        grouped['Other'] = [];

        filteredOpportunities.forEach(opp => {
            const country = opp.country || 'Other';
            if (grouped[country]) {
                grouped[country].push(opp);
            } else {
                grouped['Other'].push(opp);
            }
        });
        return grouped;
    }, [filteredOpportunities]);

    // Pipeline stats - with currency conversion
    const stats = useMemo(() => {
        const active = opportunities.filter(o => o.status === 'active');
        const totalValue = active.reduce((sum, o) => {
            const converted = convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates);
            return sum + converted;
        }, 0);
        const weightedValue = active.reduce((sum, o) => {
            const prob = (o.probability || 0) / 100;
            const converted = convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates);
            return sum + converted * prob;
        }, 0);
        return {
            totalCount: active.length,
            totalValue,
            weightedValue,
            wonCount: opportunities.filter(o => o.status === 'won').length,
            lostCount: opportunities.filter(o => o.status === 'lost').length,
        };
    }, [opportunities, dashboardCurrency, rates]);

    const toggleCountry = (country) => {
        setExpandedCountries(prev => ({
            ...prev,
            [country]: !prev[country]
        }));
    };

    const toggleOpportunityExpand = (oppId) => {
        setExpandedOpportunities(prev => ({
            ...prev,
            [oppId]: !prev[oppId]
        }));
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickAddCountry || !quickAddTitle.trim()) return;

        await addOpportunity({
            title: quickAddTitle.trim(),
            country: quickAddCountry,
            region: getRegionForCountry(quickAddCountry),
            value: parseFloat(quickAddValue) || 0,
            currency: quickAddCurrency,
            probability: 50,
        });

        setQuickAddCountry(null);
        setQuickAddTitle('');
        setQuickAddCurrency('USD');
        setQuickAddValue('');
    };

    const hideCountry = (country) => {
        setHiddenCountries(prev => ({ ...prev, [country]: true }));
    };

    const showCountry = (country) => {
        setHiddenCountries(prev => ({ ...prev, [country]: false }));
    };

    const handleNewOpportunity = async (e) => {
        e.preventDefault();
        if (!newOppForm.title.trim() || !newOppForm.country) return;
        if (!newOppForm.clientId && !newOppForm.newClientName.trim()) return;

        // Get or create client
        let clientId = newOppForm.clientId;
        let clientData = {};

        if (newOppForm.clientId) {
            const existingClient = clients.find(c => c.id === newOppForm.clientId);
            clientData = {
                company: existingClient?.company || '',
                contact: newOppForm.contactName || existingClient?.contact || '',
                email: newOppForm.contactEmail || existingClient?.email || '',
                phone: newOppForm.contactPhone || existingClient?.phone || '',
            };
        } else if (newOppForm.newClientName.trim()) {
            // Create new client
            const newClient = await useClientStore.getState().addClient({
                company: newOppForm.newClientName.trim(),
                contact: newOppForm.contactName,
                email: newOppForm.contactEmail,
                phone: newOppForm.contactPhone,
                website: newOppForm.clientWebsite,
                location: newOppForm.clientLocation,
                address: newOppForm.clientAddress,
            });
            clientId = newClient.id;
            clientData = {
                company: newOppForm.newClientName.trim(),
                contact: newOppForm.contactName,
                email: newOppForm.contactEmail,
                phone: newOppForm.contactPhone,
            };
        }

        // Build contacts array
        const contacts = [];
        if (newOppForm.contactName) {
            contacts.push({
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                name: newOppForm.contactName,
                role: newOppForm.contactRole,
                email: newOppForm.contactEmail,
                phone: newOppForm.contactPhone,
                isPrimary: true,
            });
        }

        await addOpportunity({
            title: newOppForm.title.trim(),
            country: newOppForm.country,
            region: getRegionForCountry(newOppForm.country),
            clientId,
            client: clientData,
            brief: newOppForm.brief,
            contacts,
            value: parseFloat(newOppForm.value) || 0,
            currency: newOppForm.currency,
            probability: newOppForm.probability,
            accountOwnerId: newOppForm.accountOwnerId || null,
            source: newOppForm.source,
            competitors: newOppForm.competitors ? newOppForm.competitors.split(',').map(c => c.trim()).filter(Boolean) : [],
            expectedCloseDate: newOppForm.expectedCloseDate || null,
            nextAction: newOppForm.nextAction,
            nextActionDate: newOppForm.nextActionDate || null,
            notes: newOppForm.notes,
        });

        setShowNewModal(false);
        setNewOppForm({
            clientId: '',
            newClientName: '',
            clientWebsite: '',
            clientLocation: '',
            clientAddress: '',
            contactName: '',
            contactRole: '',
            contactEmail: '',
            contactPhone: '',
            title: '',
            country: '',
            brief: '',
            projectType: 'broadcast',
            venue: '',
            startDate: '',
            endDate: '',
            expectedCloseDate: '',
            value: '',
            currency: 'USD',
            probability: 50,
            accountOwnerId: '',
            source: '',
            competitors: '',
            nextAction: '',
            nextActionDate: '',
            notes: '',
        });
    };

    const handleUpdateNotes = (oppId, notes) => {
        updateOpportunity(oppId, { notes });
    };

    // Drag and drop handlers
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { over } = event;
        if (over && (ALL_COUNTRIES.includes(over.id) || over.id === 'Other')) {
            setOverCountry(over.id);
        } else {
            setOverCountry(null);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        setOverCountry(null);

        if (!over) return;

        // Find what country the item was dropped on
        const overId = over.id;

        // Check if dropped on a country droppable
        if (ALL_COUNTRIES.includes(overId) || overId === 'Other') {
            const newCountry = overId;
            const opportunity = opportunities.find(o => o.id === active.id);

            if (opportunity && opportunity.country !== newCountry) {
                updateOpportunity(active.id, {
                    country: newCountry,
                    region: getRegionForCountry(newCountry)
                });
            }
        }
    };

    const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null;

    // Render a country box
    const renderCountryBox = (country) => {
        const countryOpps = groupedByCountry[country] || [];
        const isExpanded = expandedCountries[country];
        // Convert all opportunity values to dashboard currency for the total
        const countryValue = countryOpps.reduce((sum, o) => {
            const converted = convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates);
            return sum + converted;
        }, 0);
        const isQuickAdding = quickAddCountry === country;
        const oppIds = countryOpps.map(o => o.id);
        const isOver = overCountry === country;

        return (
            <DroppableCountry key={country} country={country} isOver={isOver}>
                <div className={`card bg-dark-card border-dark-border ${isOver ? 'border-accent-primary' : ''}`}>
                {/* Country Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => toggleCountry(country)}
                        className="flex items-center gap-3 flex-1 py-1 text-left"
                    >
                        <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-gray-200">{country}</span>
                        <span className="text-xs text-gray-500 bg-dark-bg px-2 py-0.5 rounded">
                            {countryOpps.length}
                        </span>
                    </button>
                    <div className="flex items-center gap-2">
                        {countryValue > 0 && (
                            <span className="text-sm font-medium text-emerald-400">
                                {formatCurrency(countryValue, dashboardCurrency, 0)}
                            </span>
                        )}
                        <button
                            onClick={() => setQuickAddCountry(isQuickAdding ? null : country)}
                            className={`p-1.5 rounded-lg transition-colors ${
                                isQuickAdding
                                    ? 'bg-accent-primary text-white'
                                    : 'text-gray-500 hover:text-accent-primary hover:bg-white/5'
                            }`}
                            title="Add opportunity"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button
                            onClick={() => hideCountry(country)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                            title="Hide country"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Quick Add Form */}
                {isQuickAdding && (
                    <form onSubmit={handleQuickAdd} className="mt-3 p-3 bg-dark-bg/50 rounded-lg border border-dark-border">
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                value={quickAddTitle}
                                onChange={e => setQuickAddTitle(e.target.value)}
                                placeholder="Opportunity title..."
                                className="input flex-1 min-w-[150px] text-sm"
                                autoFocus
                            />
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    value={quickAddValue}
                                    onChange={e => setQuickAddValue(e.target.value)}
                                    placeholder="Value"
                                    className="input w-20 text-sm"
                                />
                                <select
                                    value={quickAddCurrency}
                                    onChange={e => setQuickAddCurrency(e.target.value)}
                                    className="input w-20 text-sm"
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
                            <button type="submit" className="btn-primary text-sm px-3">
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickAddCountry(null)}
                                className="btn-ghost text-sm px-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </form>
                )}

                {/* Opportunities List */}
                {isExpanded && countryOpps.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <SortableContext items={oppIds} strategy={verticalListSortingStrategy}>
                            {countryOpps.map(opp => (
                                <SortableOpportunityCard
                                    key={opp.id}
                                    opportunity={opp}
                                    onSelect={onSelectOpportunity}
                                    onDelete={deleteOpportunity}
                                    onUpdateNotes={handleUpdateNotes}
                                    isExpanded={expandedOpportunities[opp.id]}
                                    onToggleExpand={toggleOpportunityExpand}
                                    users={users}
                                />
                            ))}
                        </SortableContext>
                    </div>
                )}

                {/* Empty state - acts as drop zone */}
                {isExpanded && countryOpps.length === 0 && !isQuickAdding && (
                    <div className="mt-3 p-4 text-sm text-gray-500 italic border-2 border-dashed border-dark-border rounded-lg text-center">
                        No opportunities yet - drag one here or click + to add
                    </div>
                )}
                </div>
            </DroppableCountry>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-60px)] overflow-y-auto p-3 sm:p-6">
                {/* Sync Status Banner */}
                {(syncError || pendingSyncCount > 0 || getUnsyncedCount() > 0) && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
                        syncError ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                        <div className="flex items-center gap-3">
                            {syncStatus === 'syncing' ? (
                                <svg className="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : syncError ? (
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            )}
                            <div>
                                <p className={`text-sm font-medium ${syncError ? 'text-red-400' : 'text-amber-400'}`}>
                                    {syncError ? 'Sync Error' : `${getUnsyncedCount()} unsynced opportunities`}
                                </p>
                                {syncError && (
                                    <p className="text-xs text-red-300/70">{syncError}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={syncAllToSupabase}
                                disabled={syncStatus === 'syncing'}
                                className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                            >
                                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                            </button>
                            {syncError && (
                                <button
                                    onClick={clearSyncError}
                                    className="p-1 text-gray-400 hover:text-white"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Opportunities</h1>
                        <p className="text-xs sm:text-sm text-gray-500">Track deals across GCC, Central Asia & SEA</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* New Opportunity Button */}
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="btn-primary text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Opportunity
                        </button>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="input-sm bg-dark-card border-none pl-9 w-full sm:w-48"
                            />
                            <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <select
                                value={filterRegion}
                                onChange={(e) => setFilterRegion(e.target.value)}
                                className="input-sm text-sm bg-dark-card border-none"
                            >
                                <option value="all">All Regions</option>
                                <option value="GCC">GCC</option>
                                <option value="Central Asia">Central Asia</option>
                                <option value="SEA">SEA</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="input-sm text-sm bg-dark-card border-none"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="won">Won</option>
                                <option value="lost">Lost</option>
                            </select>
                            <div className="h-4 w-px bg-dark-border mx-1"></div>
                            <span className="text-xs text-gray-500">View:</span>
                            <select
                                value={dashboardCurrency}
                                onChange={(e) => setDashboardCurrency(e.target.value)}
                                className="input-sm text-sm bg-dark-card border-none w-20"
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
                    </div>
                </div>

                {/* Pipeline Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="card bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-900/30">
                        <p className="text-xs text-blue-400 mb-1 uppercase tracking-wider">Active</p>
                        <p className="text-2xl font-bold text-white">{stats.totalCount}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border-emerald-900/30">
                        <p className="text-xs text-emerald-400 mb-1 uppercase tracking-wider">Pipeline</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue, dashboardCurrency, 0)}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-amber-900/20 to-amber-950/20 border-amber-900/30">
                        <p className="text-xs text-amber-400 mb-1 uppercase tracking-wider">Weighted</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats.weightedValue, dashboardCurrency, 0)}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-900/30">
                        <p className="text-xs text-green-400 mb-1 uppercase tracking-wider">Won</p>
                        <p className="text-2xl font-bold text-green-400">{stats.wonCount}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-red-900/20 to-red-950/20 border-red-900/30">
                        <p className="text-xs text-red-400 mb-1 uppercase tracking-wider">Lost</p>
                        <p className="text-2xl font-bold text-red-400">{stats.lostCount}</p>
                    </div>
                </div>

                {/* Region Sections */}
                {Object.entries(REGIONS).map(([region, countries]) => {
                    const isFilteredRegion = filterRegion === 'all' || filterRegion === region;
                    if (!isFilteredRegion) return null;

                    const visibleCountries = countries.filter(c => !hiddenCountries[c]);
                    const hiddenInRegion = countries.filter(c => hiddenCountries[c]);

                    return (
                        <div key={region} className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {region}
                                </h2>
                                {/* Hidden countries chips */}
                                {hiddenInRegion.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {hiddenInRegion.map(country => (
                                            <button
                                                key={country}
                                                onClick={() => showCountry(country)}
                                                className="text-xs px-2 py-1 bg-gray-700/50 text-gray-400 rounded hover:bg-accent-primary/20 hover:text-accent-primary transition-colors flex items-center gap-1"
                                                title={`Show ${country}`}
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                {country}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {visibleCountries.map(country => renderCountryBox(country))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeOpportunity ? (
                    <div className="bg-dark-card rounded-lg border border-accent-primary shadow-xl p-3 opacity-90">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-200">{activeOpportunity.title || 'Untitled'}</span>
                            <span className="text-sm text-emerald-400">
                                {formatCurrency(activeOpportunity.value || 0, activeOpportunity.currency || 'USD', 0)}
                            </span>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

            {/* New Opportunity Modal */}
            {showNewModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-100">New Opportunity</h2>
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="p-1 text-gray-500 hover:text-white"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleNewOpportunity} className="space-y-6">
                            {/* Section: Client & Contact */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Client & Contact
                                </h3>
                                <div>
                                    <label className="label label-required">Client</label>
                                    <select
                                        value={newOppForm.clientId}
                                        onChange={e => {
                                            const selectedClientId = e.target.value;
                                            const selectedClient = clients.find(c => c.id === selectedClientId);
                                            // Pre-fill contact info from existing client
                                            const primaryContact = selectedClient?.contacts?.find(c => c.isPrimary) || selectedClient?.contacts?.[0];
                                            setNewOppForm({
                                                ...newOppForm,
                                                clientId: selectedClientId,
                                                newClientName: '',
                                                // Pre-fill from primary contact or main client contact
                                                contactName: primaryContact?.name || selectedClient?.contact || '',
                                                contactRole: primaryContact?.role || '',
                                                contactEmail: primaryContact?.email || selectedClient?.email || '',
                                                contactPhone: primaryContact?.phone || selectedClient?.phone || '',
                                            });
                                        }}
                                        className="input"
                                    >
                                        <option value="">-- Select existing client or add new --</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.company}</option>
                                        ))}
                                    </select>
                                </div>
                                {!newOppForm.clientId && (
                                    <div className="space-y-4 p-4 bg-dark-bg/30 rounded-lg border border-dark-border">
                                        <div>
                                            <label className="label label-required">New Client Company Name</label>
                                            <input
                                                type="text"
                                                value={newOppForm.newClientName}
                                                onChange={e => setNewOppForm({ ...newOppForm, newClientName: e.target.value })}
                                                className="input"
                                                placeholder="Company name..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Website</label>
                                                <input
                                                    type="url"
                                                    value={newOppForm.clientWebsite || ''}
                                                    onChange={e => setNewOppForm({ ...newOppForm, clientWebsite: e.target.value })}
                                                    className="input"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Location / City</label>
                                                <input
                                                    type="text"
                                                    value={newOppForm.clientLocation || ''}
                                                    onChange={e => setNewOppForm({ ...newOppForm, clientLocation: e.target.value })}
                                                    className="input"
                                                    placeholder="e.g. Kuala Lumpur"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Address</label>
                                            <textarea
                                                value={newOppForm.clientAddress || ''}
                                                onChange={e => setNewOppForm({ ...newOppForm, clientAddress: e.target.value })}
                                                className="input resize-none"
                                                rows={2}
                                                placeholder="Full address..."
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Contact Name</label>
                                        <input
                                            type="text"
                                            value={newOppForm.contactName}
                                            onChange={e => setNewOppForm({ ...newOppForm, contactName: e.target.value })}
                                            className="input"
                                            placeholder="Primary contact..."
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Role</label>
                                        <input
                                            type="text"
                                            value={newOppForm.contactRole}
                                            onChange={e => setNewOppForm({ ...newOppForm, contactRole: e.target.value })}
                                            className="input"
                                            placeholder="e.g. Producer, Director..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Email</label>
                                        <input
                                            type="email"
                                            value={newOppForm.contactEmail}
                                            onChange={e => setNewOppForm({ ...newOppForm, contactEmail: e.target.value })}
                                            className="input"
                                            placeholder="contact@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Phone</label>
                                        <input
                                            type="tel"
                                            value={newOppForm.contactPhone}
                                            onChange={e => setNewOppForm({ ...newOppForm, contactPhone: e.target.value })}
                                            className="input"
                                            placeholder="+60 12 345 6789"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Opportunity Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Opportunity Details
                                </h3>
                                <div>
                                    <label className="label label-required">Title</label>
                                    <input
                                        type="text"
                                        value={newOppForm.title}
                                        onChange={e => setNewOppForm({ ...newOppForm, title: e.target.value })}
                                        className="input"
                                        placeholder="e.g. French Super Cup 2025"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label label-required">Country</label>
                                        <select
                                            value={newOppForm.country}
                                            onChange={e => setNewOppForm({ ...newOppForm, country: e.target.value })}
                                            className="input"
                                            required
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
                                    <div>
                                        <label className="label">Project Type</label>
                                        <select
                                            value={newOppForm.projectType}
                                            onChange={e => setNewOppForm({ ...newOppForm, projectType: e.target.value })}
                                            className="input"
                                        >
                                            <option value="broadcast">Broadcast</option>
                                            <option value="live-event">Live Event</option>
                                            <option value="corporate">Corporate</option>
                                            <option value="concert">Concert</option>
                                            <option value="sports">Sports</option>
                                            <option value="conference">Conference</option>
                                            <option value="exhibition">Exhibition</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Venue / Location</label>
                                    <input
                                        type="text"
                                        value={newOppForm.venue}
                                        onChange={e => setNewOppForm({ ...newOppForm, venue: e.target.value })}
                                        className="input"
                                        placeholder="e.g. Axiata Arena, Bukit Jalil"
                                    />
                                </div>
                                <div>
                                    <label className="label">Brief / Description</label>
                                    <textarea
                                        value={newOppForm.brief}
                                        onChange={e => setNewOppForm({ ...newOppForm, brief: e.target.value })}
                                        className="input resize-none"
                                        rows={3}
                                        placeholder="Describe the project requirements..."
                                    />
                                </div>
                            </div>

                            {/* Section: Dates */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Dates
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Project Start</label>
                                        <input
                                            type="date"
                                            value={newOppForm.startDate}
                                            onChange={e => setNewOppForm({ ...newOppForm, startDate: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Project End</label>
                                        <input
                                            type="date"
                                            value={newOppForm.endDate}
                                            onChange={e => setNewOppForm({ ...newOppForm, endDate: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Expected Close</label>
                                        <input
                                            type="date"
                                            value={newOppForm.expectedCloseDate}
                                            onChange={e => setNewOppForm({ ...newOppForm, expectedCloseDate: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Financials */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Financials
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Estimated Value</label>
                                        <input
                                            type="number"
                                            value={newOppForm.value}
                                            onChange={e => setNewOppForm({ ...newOppForm, value: e.target.value })}
                                            className="input"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Currency</label>
                                        <select
                                            value={newOppForm.currency}
                                            onChange={e => setNewOppForm({ ...newOppForm, currency: e.target.value })}
                                            className="input"
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
                                            value={newOppForm.probability}
                                            onChange={e => setNewOppForm({ ...newOppForm, probability: parseInt(e.target.value) || 0 })}
                                            className="input"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Sales Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Sales Info
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Account Owner</label>
                                        <select
                                            value={newOppForm.accountOwnerId}
                                            onChange={e => setNewOppForm({ ...newOppForm, accountOwnerId: e.target.value })}
                                            className="input"
                                        >
                                            <option value="">-- Unassigned --</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Source</label>
                                        <select
                                            value={newOppForm.source}
                                            onChange={e => setNewOppForm({ ...newOppForm, source: e.target.value })}
                                            className="input"
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
                                </div>
                                <div>
                                    <label className="label">Competitors</label>
                                    <input
                                        type="text"
                                        value={newOppForm.competitors}
                                        onChange={e => setNewOppForm({ ...newOppForm, competitors: e.target.value })}
                                        className="input"
                                        placeholder="Comma-separated, e.g. Company A, Company B"
                                    />
                                </div>
                            </div>

                            {/* Section: Actions & Notes */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-dark-border pb-2">
                                    Actions & Notes
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Next Action</label>
                                        <input
                                            type="text"
                                            value={newOppForm.nextAction}
                                            onChange={e => setNewOppForm({ ...newOppForm, nextAction: e.target.value })}
                                            className="input"
                                            placeholder="e.g. Send proposal, Follow up call"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Action Date</label>
                                        <input
                                            type="date"
                                            value={newOppForm.nextActionDate}
                                            onChange={e => setNewOppForm({ ...newOppForm, nextActionDate: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Notes</label>
                                    <textarea
                                        value={newOppForm.notes}
                                        onChange={e => setNewOppForm({ ...newOppForm, notes: e.target.value })}
                                        className="input resize-none"
                                        rows={3}
                                        placeholder="Any additional notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                                <button
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    className="btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={!newOppForm.title.trim() || !newOppForm.country || (!newOppForm.clientId && !newOppForm.newClientName.trim())}
                                >
                                    Create Opportunity
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DndContext>
    );
}
