import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SECTIONS, SECTION_ORDER } from '../data/sections';
import { FALLBACK_RATES } from '../data/currencies';
import { REGIONS } from '../data/currencies';
import { saveQuote, loadQuote, generateQuoteNumber } from '../utils/storage';
import { fetchLiveRates, convertCurrency } from '../utils/currency';
import { useRateCardStore } from './rateCardStore';
import { useClientStore } from './clientStore';
import { useSettingsStore } from './settingsStore';
import { useAuthStore } from './authStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Auto-save interval (30 seconds)
let autoSaveInterval = null;
let lastSavedQuote = null;

// Save quote to localStorage AND auto-save to library/DB if previously saved
function saveQuoteWithLibrarySync(quote) {
    // Save to localStorage (current editing session)
    saveQuote(quote);

    // Auto-save to library if quote has been saved before
    if (!quote.id) return;

    const { savedQuotes, updateQuote } = useClientStore.getState();
    const existsInLibrary = savedQuotes.some(q => q.id === quote.id);

    if (existsInLibrary) {
        updateQuote(quote.id, quote);
    }
}

// Sync current quote to Supabase
async function syncQuoteToSupabase(quote) {
    if (!quote || !quote.quoteNumber) return { synced: false };
    if (!isSupabaseConfigured()) return { synced: false, reason: 'supabase not configured' };

    // Check if quote has changed since last sync
    const quoteStr = JSON.stringify(quote);
    if (quoteStr === lastSavedQuote) return { synced: false, reason: 'no changes' };

    try {
        const dbQuote = {
            quote_number: quote.quoteNumber,
            quote_date: quote.quoteDate,
            validity_days: quote.validityDays,
            status: quote.status || 'draft',
            currency: quote.currency,
            region: quote.region,
            prepared_by: quote.preparedBy,
            client: quote.client,
            project: {
                ...quote.project,
                // Store section order and names in project JSONB to avoid schema changes
                _sectionOrder: quote.sectionOrder,
                _sectionNames: quote.sectionNames,
            },
            sections: quote.sections,
            fees: quote.fees,
            proposal: quote.proposal,
        };

        let savedId = quote.id;

        // If we have an ID, update directly
        if (quote.id) {
            await supabase
                .from('quotes')
                .update(dbQuote)
                .eq('id', quote.id);
        } else {
            // Check if quote exists by quote_number (use limit instead of single to avoid errors)
            const { data: existingList } = await supabase
                .from('quotes')
                .select('id')
                .eq('quote_number', quote.quoteNumber)
                .limit(1);

            const existing = existingList?.[0];

            if (existing) {
                // Update existing
                await supabase
                    .from('quotes')
                    .update(dbQuote)
                    .eq('id', existing.id);
                savedId = existing.id;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('quotes')
                    .insert(dbQuote)
                    .select()
                    .single();

                if (!error && data) {
                    savedId = data.id;
                }
            }
        }

        lastSavedQuote = quoteStr;

        // Update local state with ID if it was new
        if (savedId && !quote.id) {
            useQuoteStore.getState().setQuoteId(savedId);
            // Also update clientStore
            const { saveQuote: saveToLibrary } = useClientStore.getState();
            saveToLibrary({ ...quote, id: savedId });
        }

        console.log('Quote auto-saved to Supabase');
        return { synced: true, id: savedId };
    } catch (e) {
        console.error('Auto-save failed:', e);
        return { synced: false, error: e.message };
    }
}

// Start auto-save interval
function startAutoSave() {
    if (autoSaveInterval) return;

    autoSaveInterval = setInterval(() => {
        const quote = useQuoteStore.getState().quote;
        syncQuoteToSupabase(quote);
    }, 30000); // 30 seconds

    // Clean up on page unload to prevent memory leaks
    window.addEventListener('beforeunload', stopAutoSave);

    console.log('Auto-save started (every 30s)');
}

// Stop auto-save interval
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        window.removeEventListener('beforeunload', stopAutoSave);
    }
}

// Helper to log activity to the settings store
function logActivity(entry) {
    const quote = useQuoteStore.getState().quote;
    const { addActivityLog } = useSettingsStore.getState();
    const { user } = useAuthStore.getState();

    // Use authenticated user from authStore
    const currentUser = user?.profile || {
        id: user?.userId || 'unknown',
        name: user?.email?.split('@')[0] || 'Unknown User',
    };

    addActivityLog({
        userId: currentUser.id,
        userName: currentUser.name,
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        projectName: quote.project?.title || '',
        ...entry,
    });
}

// Create initial empty sections structure
function createEmptySections() {
    const sections = {};

    SECTION_ORDER.forEach(sectionId => {
        const section = SECTIONS[sectionId];
        const subsections = {};

        section.subsections.forEach(subsectionName => {
            subsections[subsectionName] = [];
        });

        sections[sectionId] = {
            ...section,
            subsections,
            customSubsections: [],
            isExpanded: true,
        };
    });

    return sections;
}

// Create empty quote
function createEmptyQuote() {
    // Get quote prefix from settings
    const settings = useSettingsStore.getState().settings;
    const quotePrefix = settings?.quoteDefaults?.quotePrefix || 'QT';

    return {
        quoteNumber: generateQuoteNumber(quotePrefix),
        currency: 'USD',
        region: 'SEA',
        quoteDate: new Date().toISOString().split('T')[0], // Date format: YYYY-MM-DD
        validityDays: 30, // Quote valid for 30 days by default
        status: 'draft', // Current status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        client: {
            company: '',
            contactId: null, // Link to specific contact
            contact: '',
            role: '', // Internal only - not shown on quote
            email: '',
            phone: '',
            notes: '', // Internal only - not shown on quote
        },
        project: {
            title: '',
            type: 'broadcast',
            venue: '',
            startDate: '',
            endDate: '',
            description: '',
        },
        // Fee percentages (built into prices)
        fees: {
            managementFee: 0,    // % added to charge
            commissionFee: 0,   // % added to charge
            discount: 0,        // % discount on final
            distributeFees: false, // Toggle to hide fees in unit rates
        },
        preparedBy: 'default', // ID of the user who prepared the quote
        sectionOrder: SECTION_ORDER, // Custom section order
        sectionNames: {}, // Custom section names (overrides defaults)
        sections: createEmptySections(),
        // Proposal content (for Full Proposal export)
        proposal: {
            coverImage: null,      // Base64 or URL of generated cover image
            proposalText: '',      // AI-generated proposal text
            isGenerated: false,    // Whether content has been generated
        },
        // Deal flow enhancements
        statusHistory: [], // Array of { status, timestamp, userId, note }
        nextFollowUpDate: null, // ISO date string for follow-up reminders
        lostReason: null, // Reason for rejected/expired/lost status
        lostReasonNotes: '', // Additional notes for lost reason
        internalNotes: '', // Internal notes not shown in PDF
        // Quote locking
        isLocked: false,    // Whether quote is locked for editing
        lockedAt: null,     // ISO timestamp when locked
        lockedBy: null,     // User ID who locked it
        // Exchange rates at time of quote creation/finalization
        // CRITICAL: Once set, these rates are used for all calculations on this quote
        // Live rates should never change the prices on an existing quote
        lockedExchangeRates: null, // { rates: {}, lockedAt: timestamp, baseCurrency: 'USD' }
    };
}

export const useQuoteStore = create(
    subscribeWithSelector((set) => ({
        // Quote data
        quote: createEmptyQuote(),

        // Exchange rates
        rates: FALLBACK_RATES,
        ratesLoading: false,
        ratesUpdated: null,

        // UI state
        activeSection: null,

        // Initialize store (load from localStorage if available)
        initialize: async () => {
            const saved = loadQuote();
            if (saved) {
                set({ quote: saved });
            }

            // Fetch live rates
            set({ ratesLoading: true });
            const { rates, timestamp } = await fetchLiveRates();
            set({ rates, ratesUpdated: timestamp, ratesLoading: false });

            // Start auto-save to Supabase every 30 seconds
            startAutoSave();
        },

        // Set quote ID (after first save to Supabase)
        setQuoteId: (id) => {
            set(state => {
                const updated = { ...state.quote, id };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Manual sync to Supabase (for Save button)
        syncToSupabase: async () => {
            const quote = useQuoteStore.getState().quote;
            return syncQuoteToSupabase(quote);
        },

        // Reset to new quote
        resetQuote: () => {
            const newQuote = createEmptyQuote();
            set({ quote: newQuote });
            saveQuote(newQuote);
        },

        // Load saved quote into editor
        loadQuoteData: (quoteData) => {
            const loaded = {
                ...createEmptyQuote(),
                ...quoteData,
                updatedAt: new Date().toISOString(),
            };
            set({ quote: loaded });
            saveQuote(loaded);
        },

        // Update quote number
        setQuoteNumber: (quoteNumber) => {
            set(state => {
                const updated = { ...state.quote, quoteNumber, updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update currency and convert all line item values
        setCurrency: (newCurrency) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const oldCurrency = state.quote.currency;

                // If same currency, just return
                if (oldCurrency === newCurrency) {
                    return state;
                }

                const rates = state.rates;

                // Convert all line item costs and charges
                const sections = { ...state.quote.sections };
                Object.keys(sections).forEach(sectionId => {
                    const section = sections[sectionId];
                    const subsections = { ...section.subsections };

                    Object.keys(subsections).forEach(subId => {
                        subsections[subId] = subsections[subId].map(item => ({
                            ...item,
                            cost: Math.round(convertCurrency(item.cost, oldCurrency, newCurrency, rates) * 100) / 100,
                            charge: Math.round(convertCurrency(item.charge, oldCurrency, newCurrency, rates) * 100) / 100,
                        }));
                    });

                    sections[sectionId] = { ...section, subsections };
                });

                const updated = {
                    ...state.quote,
                    currency: newCurrency,
                    sections,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update region and refresh rates
        setRegion: (region) => {
            // Prevent changes when locked
            if (useQuoteStore.getState().quote.isLocked) return;

            const defaultCurrency = REGIONS[region]?.defaultCurrency || 'USD';

            // Get rate card to look up items
            const rateCardItems = useRateCardStore.getState().items;

            set(state => {
                // Update Line Items with new regional rates
                const sections = { ...state.quote.sections };
                Object.keys(sections).forEach(sectionId => {
                    const section = sections[sectionId];
                    Object.keys(section.subsections).forEach(subId => {
                        section.subsections[subId] = section.subsections[subId].map(item => {
                            // Find original item in rate card - prefer ID match, fall back to name
                            const rateCardItem = item.rateCardItemId
                                ? rateCardItems.find(r => r.id === item.rateCardItemId)
                                : rateCardItems.find(r => r.name === item.name);

                            if (rateCardItem) {
                                // Read from unified pricing format
                                const regionPricing = rateCardItem.pricing?.[region];
                                const cost = regionPricing?.cost?.amount ?? item.cost;
                                const charge = regionPricing?.charge?.amount ?? item.charge;

                                return {
                                    ...item,
                                    cost,
                                    charge,
                                    // Store the ID if we matched by name
                                    rateCardItemId: item.rateCardItemId || rateCardItem.id,
                                };
                            }
                            return item;
                        });
                    });
                });

                const updated = {
                    ...state.quote,
                    region,
                    currency: defaultCurrency,
                    sections,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update quote date
        setQuoteDate: (quoteDate) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const updated = { ...state.quote, quoteDate, updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update validity days
        setValidityDays: (validityDays) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const updated = { ...state.quote, validityDays: parseInt(validityDays), updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update client details
        setClientDetails: (client) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const oldClient = state.quote.client;
                const updated = {
                    ...state.quote,
                    client: { ...state.quote.client, ...client },
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);

                // Log each changed field
                Object.keys(client).forEach(field => {
                    if (oldClient[field] !== client[field]) {
                        logActivity({
                            action: 'update',
                            category: 'client',
                            field: `client.${field}`,
                            oldValue: oldClient[field],
                            newValue: client[field],
                            description: `Changed client ${field} from "${oldClient[field] || '(empty)'}" to "${client[field] || '(empty)'}"`,
                        });
                    }
                });

                return { quote: updated };
            });
        },

        // Update project details
        setProjectDetails: (project) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const oldProject = state.quote.project;
                const updated = {
                    ...state.quote,
                    project: { ...state.quote.project, ...project },
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);

                // Log each changed field
                Object.keys(project).forEach(field => {
                    if (oldProject[field] !== project[field]) {
                        logActivity({
                            action: 'update',
                            category: 'project',
                            field: `project.${field}`,
                            oldValue: oldProject[field],
                            newValue: project[field],
                            description: `Changed project ${field} from "${oldProject[field] || '(empty)'}" to "${project[field] || '(empty)'}"`,
                        });
                    }
                });

                return { quote: updated };
            });
        },

        // Update fee percentages
        setFees: (fees) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const oldFees = state.quote.fees;
                const updated = {
                    ...state.quote,
                    fees: { ...state.quote.fees, ...fees },
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);

                // Log each changed field
                Object.keys(fees).forEach(field => {
                    if (oldFees[field] !== fees[field]) {
                        logActivity({
                            action: 'update',
                            category: 'fees',
                            field: `fees.${field}`,
                            oldValue: oldFees[field],
                            newValue: fees[field],
                            description: `Changed ${field} from ${oldFees[field]} to ${fees[field]}`,
                        });
                    }
                });

                return { quote: updated };
            });
        },

        // Update prepared by user
        setPreparedBy: (userId) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const updated = {
                    ...state.quote,
                    preparedBy: userId,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Toggle section expansion
        toggleSection: (sectionId) => {
            set(state => {
                const sections = { ...state.quote.sections };
                sections[sectionId] = {
                    ...sections[sectionId],
                    isExpanded: !sections[sectionId].isExpanded,
                };
                const updated = { ...state.quote, sections };
                return { quote: updated };
            });
        },

        // Move section up or down
        moveSection: (sectionId, direction) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const order = [...(state.quote.sectionOrder || SECTION_ORDER)];
                const index = order.indexOf(sectionId);
                if (index === -1) return state;

                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= order.length) return state;

                // Swap positions
                [order[index], order[newIndex]] = [order[newIndex], order[index]];

                const updated = {
                    ...state.quote,
                    sectionOrder: order,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update section name (custom override)
        updateSectionName: (sectionId, newName) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sectionNames = { ...state.quote.sectionNames };
                if (newName.trim()) {
                    sectionNames[sectionId] = newName.trim();
                } else {
                    delete sectionNames[sectionId]; // Remove override, use default
                }
                const updated = {
                    ...state.quote,
                    sectionNames,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Add line item
        addLineItem: (sectionId, subsection, item) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };
                const subsections = { ...sectionData.subsections };

                const newItem = {
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    name: item.name || '',
                    quantity: item.quantity || 1,
                    days: item.days || 1,
                    cost: item.cost || 0,
                    charge: item.charge || 0,
                    rateCardItemId: item.rateCardItemId || null, // Link to rate card
                    kitItemId: item.kitItemId || null, // Link to kit inventory
                    ...item,
                };

                subsections[subsection] = [...(subsections[subsection] || []), newItem];
                sectionData.subsections = subsections;
                sections[sectionId] = sectionData;

                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);

                // Log the addition
                logActivity({
                    action: 'create',
                    category: 'lineItem',
                    field: `${sectionId}.${subsection}`,
                    newValue: newItem,
                    description: `Added line item "${newItem.name || 'Unnamed'}" to ${subsection}`,
                });

                return { quote: updated };
            });
        },

        // Update line item
        updateLineItem: (sectionId, subsection, itemId, updates) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };
                const subsections = { ...sectionData.subsections };

                // Find the old item for logging
                const oldItem = subsections[subsection].find(item => item.id === itemId);

                subsections[subsection] = subsections[subsection].map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                );

                sectionData.subsections = subsections;
                sections[sectionId] = sectionData;

                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);

                // Log each changed field
                if (oldItem) {
                    Object.keys(updates).forEach(field => {
                        if (oldItem[field] !== updates[field]) {
                            logActivity({
                                action: 'update',
                                category: 'lineItem',
                                field: `lineItem.${field}`,
                                oldValue: oldItem[field],
                                newValue: updates[field],
                                description: `Updated "${oldItem.name || 'Unnamed'}" ${field}: ${oldItem[field]} → ${updates[field]}`,
                            });
                        }
                    });
                }

                return { quote: updated };
            });
        },

        // Delete line item
        deleteLineItem: (sectionId, subsection, itemId) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };
                const subsections = { ...sectionData.subsections };

                // Find the item for logging before deleting
                const deletedItem = subsections[subsection].find(item => item.id === itemId);

                subsections[subsection] = subsections[subsection].filter(item => item.id !== itemId);

                sectionData.subsections = subsections;
                sections[sectionId] = sectionData;

                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);

                // Log the deletion
                if (deletedItem) {
                    logActivity({
                        action: 'delete',
                        category: 'lineItem',
                        field: `${sectionId}.${subsection}`,
                        oldValue: deletedItem,
                        description: `Deleted line item "${deletedItem.name || 'Unnamed'}" from ${subsection}`,
                    });
                }

                return { quote: updated };
            });
        },

        // Move line item
        moveLineItem: (sourceSectionId, sourceSubsection, itemId, targetSectionId, targetSubsection) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sections = { ...state.quote.sections };

                // Helper to safely get subsections
                const getSubsections = (secId) => ({ ...sections[secId].subsections });

                const sourceSubsections = getSubsections(sourceSectionId);
                const targetSubsections = sourceSectionId === targetSectionId
                    ? sourceSubsections // Same section, share reference (but we made shallow copy above)
                    : getSubsections(targetSectionId);

                // Find and remove item
                const item = sourceSubsections[sourceSubsection].find(i => i.id === itemId);
                if (!item) return { quote: state.quote }; // Should not happen

                // Remove from source
                sourceSubsections[sourceSubsection] = sourceSubsections[sourceSubsection].filter(i => i.id !== itemId);

                // Add to target
                targetSubsections[targetSubsection] = [...(targetSubsections[targetSubsection] || []), item];

                // Update state
                sections[sourceSectionId] = { ...sections[sourceSectionId], subsections: sourceSubsections };
                if (sourceSectionId !== targetSectionId) {
                    sections[targetSectionId] = { ...sections[targetSectionId], subsections: targetSubsections };
                }

                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Add custom subsection
        addCustomSubsection: (sectionId, subsectionName) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };

                if (!sectionData.customSubsections.includes(subsectionName)) {
                    sectionData.customSubsections = [...sectionData.customSubsections, subsectionName];
                    sectionData.subsections = {
                        ...sectionData.subsections,
                        [subsectionName]: [],
                    };
                }

                sections[sectionId] = sectionData;
                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Reorder subsections within a section (for drag and drop)
        reorderSubsections: (sectionId, newOrder) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };

                sectionData.subsectionOrder = newOrder;
                sections[sectionId] = sectionData;

                const updated = {
                    ...state.quote,
                    sections,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Rename a subsection (custom display name)
        updateSubsectionName: (sectionId, originalName, newName) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };

                // Store custom subsection names
                const subsectionNames = { ...(sectionData.subsectionNames || {}) };
                if (newName.trim() && newName.trim() !== originalName) {
                    subsectionNames[originalName] = newName.trim();
                } else {
                    delete subsectionNames[originalName]; // Remove override, use default
                }

                sectionData.subsectionNames = subsectionNames;
                sections[sectionId] = sectionData;

                const updated = {
                    ...state.quote,
                    sections,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Refresh rates
        refreshRates: async () => {
            set({ ratesLoading: true });
            // Clear cache and fetch fresh
            localStorage.removeItem('exchange_rates_cache');
            const { rates, timestamp } = await fetchLiveRates();
            set({ rates, ratesUpdated: timestamp, ratesLoading: false });
        },

        // Update proposal data
        setProposal: (proposal) => {
            set(state => {
                // Prevent changes when locked
                if (state.quote.isLocked) return state;
                const updated = {
                    ...state.quote,
                    proposal: { ...state.quote.proposal, ...proposal },
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update quote status with history tracking
        updateQuoteStatus: (newStatus, note = '', userId = 'default') => {
            set(state => {
                const oldStatus = state.quote.status;
                const statusHistory = [
                    ...(state.quote.statusHistory || []),
                    {
                        status: newStatus,
                        timestamp: new Date().toISOString(),
                        userId,
                        note,
                    }
                ];

                // Lock exchange rates when quote is sent (or any finalized status)
                // This ensures the prices never change after quote is delivered to client
                const finalizedStatuses = ['sent', 'accepted', 'won'];
                let lockedExchangeRates = state.quote.lockedExchangeRates;
                if (finalizedStatuses.includes(newStatus) && !lockedExchangeRates) {
                    lockedExchangeRates = {
                        rates: { ...state.rates },
                        lockedAt: new Date().toISOString(),
                        baseCurrency: 'USD',
                    };
                }

                const updated = {
                    ...state.quote,
                    status: newStatus,
                    statusHistory,
                    lockedExchangeRates,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);

                // Log status change
                logActivity({
                    action: 'status_change',
                    category: 'status',
                    field: 'status',
                    oldValue: oldStatus,
                    newValue: newStatus,
                    description: `Changed status from "${oldStatus}" to "${newStatus}"${note ? ` (${note})` : ''}`,
                });

                return { quote: updated };
            });
        },

        // Update follow-up date
        setNextFollowUpDate: (date) => {
            set(state => {
                const updated = {
                    ...state.quote,
                    nextFollowUpDate: date,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update lost reason
        setLostReason: (reason, notes = '') => {
            set(state => {
                const updated = {
                    ...state.quote,
                    lostReason: reason,
                    lostReasonNotes: notes,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Update internal notes
        setInternalNotes: (notes) => {
            set(state => {
                const updated = {
                    ...state.quote,
                    internalNotes: notes,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);
                return { quote: updated };
            });
        },

        // Lock quote (prevent editing) and capture exchange rates
        lockQuote: (userId = 'default') => {
            set(state => {
                // Capture current exchange rates at lock time
                // These rates will be used for all future calculations on this quote
                const lockedExchangeRates = state.quote.lockedExchangeRates || {
                    rates: { ...state.rates },
                    lockedAt: new Date().toISOString(),
                    baseCurrency: 'USD',
                };

                const updated = {
                    ...state.quote,
                    isLocked: true,
                    lockedAt: new Date().toISOString(),
                    lockedBy: userId,
                    lockedExchangeRates,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);

                // Log the lock action
                logActivity({
                    action: 'lock',
                    category: 'lock',
                    field: 'isLocked',
                    oldValue: false,
                    newValue: true,
                    description: `Locked quote for editing (exchange rates frozen)`,
                });

                return { quote: updated };
            });
        },

        // Unlock quote (allow editing)
        unlockQuote: (userId = 'default') => {
            set(state => {
                const updated = {
                    ...state.quote,
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null,
                    updatedAt: new Date().toISOString()
                };
                saveQuoteWithLibrarySync(updated);

                // Log the unlock action
                logActivity({
                    action: 'unlock',
                    category: 'lock',
                    field: 'isLocked',
                    oldValue: true,
                    newValue: false,
                    description: `Unlocked quote for editing`,
                });

                return { quote: updated };
            });
        },
    }))
);
