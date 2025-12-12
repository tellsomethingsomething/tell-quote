import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SECTIONS, SECTION_ORDER } from '../data/sections';
import { FALLBACK_RATES } from '../data/currencies';
import { REGIONS } from '../data/currencies'; // Import REGIONS
import { saveQuote, loadQuote, generateQuoteNumber } from '../utils/storage';
import { fetchLiveRates } from '../utils/currency';
import { useRateCardStore } from './rateCardStore'; // Import rate store for lookups

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
    return {
        quoteNumber: generateQuoteNumber(),
        currency: 'USD',
        region: 'SEA',
        quoteDate: new Date().toISOString().split('T')[0], // Date format: YYYY-MM-DD
        validityDays: 30, // Quote valid for 30 days by default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        client: {
            company: '',
            contactId: null, // Link to specific contact
            contact: '',
            email: '',
            phone: '',
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
        sections: createEmptySections(),
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
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update currency
        setCurrency: (currency) => {
            set(state => {
                const updated = { ...state.quote, currency, updatedAt: new Date().toISOString() };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update region and refresh rates
        setRegion: (region) => {
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
                            // Find original item in rate card (by name match for now, ideally ID but we store copies)
                            // Better if we stored sourceItemId in the quote item
                            const rateCardItem = rateCardItems.find(r => r.name === item.name);

                            if (rateCardItem && rateCardItem.pricing && rateCardItem.pricing[region]) {
                                return {
                                    ...item,
                                    cost: rateCardItem.pricing[region].cost || 0,
                                    charge: rateCardItem.pricing[region].charge || 0,
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
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update quote date
        setQuoteDate: (quoteDate) => {
            set(state => {
                const updated = { ...state.quote, quoteDate, updatedAt: new Date().toISOString() };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update validity days
        setValidityDays: (validityDays) => {
            set(state => {
                const updated = { ...state.quote, validityDays: parseInt(validityDays), updatedAt: new Date().toISOString() };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update client details
        setClientDetails: (client) => {
            set(state => {
                const updated = {
                    ...state.quote,
                    client: { ...state.quote.client, ...client },
                    updatedAt: new Date().toISOString()
                };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update project details
        setProjectDetails: (project) => {
            set(state => {
                const updated = {
                    ...state.quote,
                    project: { ...state.quote.project, ...project },
                    updatedAt: new Date().toISOString()
                };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update fee percentages
        setFees: (fees) => {
            set(state => {
                const updated = {
                    ...state.quote,
                    fees: { ...state.quote.fees, ...fees },
                    updatedAt: new Date().toISOString()
                };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update prepared by user
        setPreparedBy: (userId) => {
            set(state => {
                const updated = {
                    ...state.quote,
                    preparedBy: userId,
                    updatedAt: new Date().toISOString()
                };
                saveQuote(updated);
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

        // Add line item
        addLineItem: (sectionId, subsection, item) => {
            set(state => {
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
                    ...item,
                };

                subsections[subsection] = [...(subsections[subsection] || []), newItem];
                sectionData.subsections = subsections;
                sections[sectionId] = sectionData;

                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Update line item
        updateLineItem: (sectionId, subsection, itemId, updates) => {
            set(state => {
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };
                const subsections = { ...sectionData.subsections };

                subsections[subsection] = subsections[subsection].map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                );

                sectionData.subsections = subsections;
                sections[sectionId] = sectionData;

                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Delete line item
        deleteLineItem: (sectionId, subsection, itemId) => {
            set(state => {
                const sections = { ...state.quote.sections };
                const sectionData = { ...sections[sectionId] };
                const subsections = { ...sectionData.subsections };

                subsections[subsection] = subsections[subsection].filter(item => item.id !== itemId);

                sectionData.subsections = subsections;
                sections[sectionId] = sectionData;

                const updated = { ...state.quote, sections, updatedAt: new Date().toISOString() };
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Move line item
        moveLineItem: (sourceSectionId, sourceSubsection, itemId, targetSectionId, targetSubsection) => {
            set(state => {
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
                saveQuote(updated);
                return { quote: updated };
            });
        },

        // Add custom subsection
        addCustomSubsection: (sectionId, subsectionName) => {
            set(state => {
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
                saveQuote(updated);
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
    }))
);
