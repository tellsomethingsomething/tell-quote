import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

// Fixed category structure
export const SOP_CATEGORIES = {
    OPERATIONS: 'Operations',
    GRAPHICS: 'Graphics',
    EQUIPMENT: 'Equipment',
    COMMERCIAL: 'Commercial',
};

// Category colors and icons
export const CATEGORY_CONFIG = {
    [SOP_CATEGORIES.OPERATIONS]: {
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: '⚙️',
        description: 'Production workflows and operational procedures',
    },
    [SOP_CATEGORIES.GRAPHICS]: {
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: '🎨',
        description: 'Graphics, branding, and visual asset guidelines',
    },
    [SOP_CATEGORIES.EQUIPMENT]: {
        color: 'bg-green-500/10 text-green-400 border-green-500/30',
        icon: '📷',
        description: 'Equipment handling, maintenance, and setup',
    },
    [SOP_CATEGORIES.COMMERCIAL]: {
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        icon: '💼',
        description: 'Sales, billing, and client management',
    },
};

// Default SOPs with checklists for each category
const DEFAULT_SOPS = [
    // OPERATIONS
    {
        id: 'ops-1',
        title: 'Pre-Production Checklist',
        category: SOP_CATEGORIES.OPERATIONS,
        description: 'Complete checklist before any shoot day',
        checklist: [
            { id: 'ops-1-1', text: 'Confirm call times with all crew members', completed: false },
            { id: 'ops-1-2', text: 'Review location access and parking details', completed: false },
            { id: 'ops-1-3', text: 'Confirm catering and craft services', completed: false },
            { id: 'ops-1-4', text: 'Verify transport arrangements', completed: false },
            { id: 'ops-1-5', text: 'Check weather forecast and contingency plans', completed: false },
            { id: 'ops-1-6', text: 'Distribute call sheets to all stakeholders', completed: false },
            { id: 'ops-1-7', text: 'Confirm equipment delivery/pickup times', completed: false },
            { id: 'ops-1-8', text: 'Brief production assistants on duties', completed: false },
        ],
        tags: ['production', 'shoot', 'prep'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'ops-2',
        title: 'Live Broadcast Setup',
        category: SOP_CATEGORIES.OPERATIONS,
        description: 'Setup checklist for live broadcast productions',
        checklist: [
            { id: 'ops-2-1', text: 'Test all communication channels (comms/IFB)', completed: false },
            { id: 'ops-2-2', text: 'Verify uplink/streaming connection', completed: false },
            { id: 'ops-2-3', text: 'Run full technical rehearsal', completed: false },
            { id: 'ops-2-4', text: 'Test backup systems and failover', completed: false },
            { id: 'ops-2-5', text: 'Confirm graphics and lower thirds', completed: false },
            { id: 'ops-2-6', text: 'Brief talent on rundown and timings', completed: false },
            { id: 'ops-2-7', text: 'Verify recording backup is running', completed: false },
        ],
        tags: ['broadcast', 'live', 'technical'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'ops-3',
        title: 'Post-Production Wrap',
        category: SOP_CATEGORIES.OPERATIONS,
        description: 'End of production day checklist',
        checklist: [
            { id: 'ops-3-1', text: 'Backup all media to multiple locations', completed: false },
            { id: 'ops-3-2', text: 'Complete equipment return inventory', completed: false },
            { id: 'ops-3-3', text: 'Submit crew timesheets and expenses', completed: false },
            { id: 'ops-3-4', text: 'Send wrap report to production team', completed: false },
            { id: 'ops-3-5', text: 'Update production schedule if needed', completed: false },
            { id: 'ops-3-6', text: 'Clear and secure location', completed: false },
        ],
        tags: ['wrap', 'post', 'admin'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    // GRAPHICS
    {
        id: 'gfx-1',
        title: 'Brand Package Delivery',
        category: SOP_CATEGORIES.GRAPHICS,
        description: 'Delivering graphics package to client',
        checklist: [
            { id: 'gfx-1-1', text: 'Export all graphics in required formats (PNG, MOV, etc.)', completed: false },
            { id: 'gfx-1-2', text: 'Include all color profiles and specifications', completed: false },
            { id: 'gfx-1-3', text: 'Provide font files with licensing information', completed: false },
            { id: 'gfx-1-4', text: 'Create usage guidelines document', completed: false },
            { id: 'gfx-1-5', text: 'Organize files in clear folder structure', completed: false },
            { id: 'gfx-1-6', text: 'Generate preview/thumbnail images', completed: false },
            { id: 'gfx-1-7', text: 'Send delivery confirmation to client', completed: false },
        ],
        tags: ['graphics', 'branding', 'delivery'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'gfx-2',
        title: 'Lower Thirds & Bug Setup',
        category: SOP_CATEGORIES.GRAPHICS,
        description: 'Preparing on-air graphics elements',
        checklist: [
            { id: 'gfx-2-1', text: 'Verify correct sponsor logos and placements', completed: false },
            { id: 'gfx-2-2', text: 'Check all name spellings and titles', completed: false },
            { id: 'gfx-2-3', text: 'Test graphics in broadcast system', completed: false },
            { id: 'gfx-2-4', text: 'Verify safe zone compliance', completed: false },
            { id: 'gfx-2-5', text: 'Prepare backup graphics package', completed: false },
            { id: 'gfx-2-6', text: 'Brief graphics operator on triggers', completed: false },
        ],
        tags: ['broadcast', 'graphics', 'on-air'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'gfx-3',
        title: 'Social Media Asset Creation',
        category: SOP_CATEGORIES.GRAPHICS,
        description: 'Creating graphics for social platforms',
        checklist: [
            { id: 'gfx-3-1', text: 'Create assets in all required dimensions', completed: false },
            { id: 'gfx-3-2', text: 'Optimize file sizes for web delivery', completed: false },
            { id: 'gfx-3-3', text: 'Include alt text descriptions', completed: false },
            { id: 'gfx-3-4', text: 'Verify brand color accuracy across displays', completed: false },
            { id: 'gfx-3-5', text: 'Export animated versions if required', completed: false },
            { id: 'gfx-3-6', text: 'Get client approval before publishing', completed: false },
        ],
        tags: ['social', 'digital', 'content'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    // EQUIPMENT
    {
        id: 'eq-1',
        title: 'Camera Prep & Check',
        category: SOP_CATEGORIES.EQUIPMENT,
        description: 'Pre-shoot camera preparation',
        checklist: [
            { id: 'eq-1-1', text: 'Clean sensor and lens elements', completed: false },
            { id: 'eq-1-2', text: 'Format all media cards', completed: false },
            { id: 'eq-1-3', text: 'Charge all batteries (min 4x per camera)', completed: false },
            { id: 'eq-1-4', text: 'Update firmware if required', completed: false },
            { id: 'eq-1-5', text: 'Set correct frame rate and codec', completed: false },
            { id: 'eq-1-6', text: 'Calibrate white balance/color profiles', completed: false },
            { id: 'eq-1-7', text: 'Test all lenses for focus accuracy', completed: false },
            { id: 'eq-1-8', text: 'Pack backup camera body', completed: false },
        ],
        tags: ['camera', 'prep', 'technical'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'eq-2',
        title: 'Audio Kit Preparation',
        category: SOP_CATEGORIES.EQUIPMENT,
        description: 'Audio equipment checklist before shoot',
        checklist: [
            { id: 'eq-2-1', text: 'Test all wireless frequencies', completed: false },
            { id: 'eq-2-2', text: 'Check and charge all transmitter batteries', completed: false },
            { id: 'eq-2-3', text: 'Pack spare lavalier capsules', completed: false },
            { id: 'eq-2-4', text: 'Test all XLR cables for faults', completed: false },
            { id: 'eq-2-5', text: 'Verify mixer/recorder settings', completed: false },
            { id: 'eq-2-6', text: 'Include windshields and dead cats', completed: false },
            { id: 'eq-2-7', text: 'Pack headphones for monitoring', completed: false },
        ],
        tags: ['audio', 'sound', 'technical'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'eq-3',
        title: 'Equipment Return & Inventory',
        category: SOP_CATEGORIES.EQUIPMENT,
        description: 'Post-shoot equipment return process',
        checklist: [
            { id: 'eq-3-1', text: 'Inventory all returned items against packing list', completed: false },
            { id: 'eq-3-2', text: 'Document any damage or issues', completed: false },
            { id: 'eq-3-3', text: 'Clean all equipment before storage', completed: false },
            { id: 'eq-3-4', text: 'Recharge all batteries for next use', completed: false },
            { id: 'eq-3-5', text: 'Update equipment availability in system', completed: false },
            { id: 'eq-3-6', text: 'Log maintenance needs for repairs', completed: false },
            { id: 'eq-3-7', text: 'Store in designated locations', completed: false },
        ],
        tags: ['inventory', 'return', 'maintenance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    // COMMERCIAL
    {
        id: 'com-1',
        title: 'New Client Onboarding',
        category: SOP_CATEGORIES.COMMERCIAL,
        description: 'Steps for onboarding new clients',
        checklist: [
            { id: 'com-1-1', text: 'Schedule discovery/kickoff meeting', completed: false },
            { id: 'com-1-2', text: 'Collect company details and billing info', completed: false },
            { id: 'com-1-3', text: 'Create client record in CRM', completed: false },
            { id: 'com-1-4', text: 'Set up communication channels (Slack, etc.)', completed: false },
            { id: 'com-1-5', text: 'Send welcome package with company info', completed: false },
            { id: 'com-1-6', text: 'Assign account manager/primary contact', completed: false },
            { id: 'com-1-7', text: 'Schedule follow-up check-in', completed: false },
        ],
        tags: ['client', 'onboarding', 'sales'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'com-2',
        title: 'Quote to Invoice Workflow',
        category: SOP_CATEGORIES.COMMERCIAL,
        description: 'Converting approved quotes to invoices',
        checklist: [
            { id: 'com-2-1', text: 'Verify all line items match final scope', completed: false },
            { id: 'com-2-2', text: 'Confirm payment terms with client', completed: false },
            { id: 'com-2-3', text: 'Generate invoice from approved quote', completed: false },
            { id: 'com-2-4', text: 'Add correct billing address and PO number', completed: false },
            { id: 'com-2-5', text: 'Review for accuracy before sending', completed: false },
            { id: 'com-2-6', text: 'Send invoice with payment instructions', completed: false },
            { id: 'com-2-7', text: 'Set payment reminder in system', completed: false },
            { id: 'com-2-8', text: 'Mark opportunity as Won', completed: false },
        ],
        tags: ['invoice', 'billing', 'finance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'com-3',
        title: 'Proposal Submission',
        category: SOP_CATEGORIES.COMMERCIAL,
        description: 'Submitting proposals to prospective clients',
        checklist: [
            { id: 'com-3-1', text: 'Review RFP/brief thoroughly', completed: false },
            { id: 'com-3-2', text: 'Build detailed cost breakdown', completed: false },
            { id: 'com-3-3', text: 'Include case studies and references', completed: false },
            { id: 'com-3-4', text: 'Get internal approval on pricing', completed: false },
            { id: 'com-3-5', text: 'Create professional PDF proposal', completed: false },
            { id: 'com-3-6', text: 'Proofread all content', completed: false },
            { id: 'com-3-7', text: 'Submit before deadline', completed: false },
            { id: 'com-3-8', text: 'Schedule follow-up call with client', completed: false },
        ],
        tags: ['proposal', 'sales', 'pitch'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'com-4',
        title: 'Project Closeout',
        category: SOP_CATEGORIES.COMMERCIAL,
        description: 'Final steps after project completion',
        checklist: [
            { id: 'com-4-1', text: 'Send final deliverables to client', completed: false },
            { id: 'com-4-2', text: 'Collect client feedback/testimonial', completed: false },
            { id: 'com-4-3', text: 'Reconcile all expenses and costs', completed: false },
            { id: 'com-4-4', text: 'Issue final invoice for remaining balance', completed: false },
            { id: 'com-4-5', text: 'Update project records and lessons learned', completed: false },
            { id: 'com-4-6', text: 'Archive project files', completed: false },
            { id: 'com-4-7', text: 'Schedule future touchpoint with client', completed: false },
        ],
        tags: ['closeout', 'project', 'admin'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Load collapsed state from localStorage
const loadCollapsedState = () => {
    try {
        const saved = localStorage.getItem('sop_collapsed_state');
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

// Save collapsed state to localStorage
const saveCollapsedState = (state) => {
    try {
        localStorage.setItem('sop_collapsed_state', JSON.stringify(state));
    } catch (e) {
        logger.error('Failed to save collapsed state:', e);
    }
};

export const useSopStore = create(
    subscribeWithSelector((set, get) => ({
        sops: [],
        isLoading: false,
        error: null,
        collapsedSops: loadCollapsedState(), // Track which SOPs are collapsed

        // Toggle collapsed state for a SOP
        toggleCollapsed: (sopId) => {
            set((state) => {
                const newCollapsed = {
                    ...state.collapsedSops,
                    [sopId]: !state.collapsedSops[sopId],
                };
                saveCollapsedState(newCollapsed);
                return { collapsedSops: newCollapsed };
            });
        },

        // Check if a SOP is collapsed
        isCollapsed: (sopId) => {
            return get().collapsedSops[sopId] || false;
        },

        // Initialize from Supabase or use defaults
        initialize: async () => {
            set({ isLoading: true });
            try {
                const { data, error } = await supabase
                    .from('sops')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    const sops = data.map(fromDbFormat);
                    set({ sops, isLoading: false });
                } else {
                    // Insert default SOPs
                    const { data: insertedData, error: insertError } = await supabase
                        .from('sops')
                        .insert(DEFAULT_SOPS.map(toDbFormat))
                        .select();

                    if (insertError) throw insertError;

                    set({
                        sops: insertedData ? insertedData.map(fromDbFormat) : DEFAULT_SOPS,
                        isLoading: false
                    });
                }
            } catch (err) {
                logger.error('Failed to load SOPs:', err);
                // Fall back to defaults if Supabase fails
                set({ sops: DEFAULT_SOPS, isLoading: false });
            }
        },

        // Add a new SOP
        addSop: async (sopData) => {
            const newSop = {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                checklist: sopData.checklist || [],
                tags: sopData.tags || [],
                ...sopData,
            };

            // Optimistic update
            set((state) => ({ sops: [newSop, ...state.sops] }));

            // Sync to Supabase
            try {
                const { error } = await supabase
                    .from('sops')
                    .insert(toDbFormat(newSop));
                if (error) throw error;
            } catch (err) {
                logger.error('Failed to sync SOP:', err);
            }

            return newSop;
        },

        // Update an SOP
        updateSop: async (id, updates) => {
            const updatedData = { ...updates, updatedAt: new Date().toISOString() };

            set((state) => ({
                sops: state.sops.map((sop) =>
                    sop.id === id ? { ...sop, ...updatedData } : sop
                ),
            }));

            // Sync to Supabase
            try {
                const sop = get().sops.find(s => s.id === id);
                if (sop) {
                    const { error } = await supabase
                        .from('sops')
                        .update(toDbFormat({ ...sop, ...updatedData }))
                        .eq('id', id);
                    if (error) throw error;
                }
            } catch (err) {
                logger.error('Failed to update SOP:', err);
            }
        },

        // Delete an SOP
        deleteSop: async (id) => {
            set((state) => ({
                sops: state.sops.filter((sop) => sop.id !== id),
            }));

            try {
                const { error } = await supabase.from('sops').delete().eq('id', id);
                if (error) throw error;
            } catch (err) {
                logger.error('Failed to delete SOP:', err);
            }
        },

        // Toggle a checklist item
        toggleChecklistItem: async (sopId, itemId) => {
            const sop = get().sops.find(s => s.id === sopId);
            if (!sop) return;

            const updatedChecklist = sop.checklist.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            );

            await get().updateSop(sopId, { checklist: updatedChecklist });
        },

        // Add checklist item
        addChecklistItem: async (sopId, text) => {
            const sop = get().sops.find(s => s.id === sopId);
            if (!sop) return;

            const newItem = {
                id: crypto.randomUUID(),
                text,
                completed: false,
            };

            const updatedChecklist = [...sop.checklist, newItem];
            await get().updateSop(sopId, { checklist: updatedChecklist });
            return newItem;
        },

        // Remove checklist item
        removeChecklistItem: async (sopId, itemId) => {
            const sop = get().sops.find(s => s.id === sopId);
            if (!sop) return;

            const updatedChecklist = sop.checklist.filter(item => item.id !== itemId);
            await get().updateSop(sopId, { checklist: updatedChecklist });
        },

        // Update checklist item text
        updateChecklistItemText: async (sopId, itemId, text) => {
            const sop = get().sops.find(s => s.id === sopId);
            if (!sop) return;

            const updatedChecklist = sop.checklist.map(item =>
                item.id === itemId ? { ...item, text } : item
            );

            await get().updateSop(sopId, { checklist: updatedChecklist });
        },

        // Get SOPs by category
        getByCategory: (category) => {
            return get().sops.filter(sop => sop.category === category);
        },

        // Get completion percentage for an SOP
        getCompletionPercentage: (sopId) => {
            const sop = get().sops.find(s => s.id === sopId);
            if (!sop || !sop.checklist?.length) return 0;
            const completed = sop.checklist.filter(item => item.completed).length;
            return Math.round((completed / sop.checklist.length) * 100);
        },

        // Reset all checkboxes for an SOP
        resetChecklist: async (sopId) => {
            const sop = get().sops.find(s => s.id === sopId);
            if (!sop) return;

            const resetChecklist = sop.checklist.map(item => ({ ...item, completed: false }));
            await get().updateSop(sopId, { checklist: resetChecklist });
        },

        // Duplicate an SOP
        duplicateSop: async (sopId) => {
            const sop = get().sops.find(s => s.id === sopId);
            if (!sop) return;

            const newSop = {
                ...sop,
                id: crypto.randomUUID(),
                title: `${sop.title} (Copy)`,
                checklist: sop.checklist.map(item => ({
                    ...item,
                    id: crypto.randomUUID(),
                    completed: false,
                })),
                photos: [], // Don't copy photos
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return await get().addSop(newSop);
        },

        // Update SOP photos
        updateSopPhotos: async (sopId, photos) => {
            await get().updateSop(sopId, { photos });
        },
    }))
);

// Database format converters
function toDbFormat(sop) {
    return {
        id: sop.id,
        title: sop.title,
        category: sop.category,
        description: sop.description || '',
        checklist: sop.checklist || [],
        tags: sop.tags || [],
        photos: sop.photos || [],
        created_at: sop.createdAt,
        updated_at: sop.updatedAt,
    };
}

function fromDbFormat(record) {
    return {
        id: record.id,
        title: record.title,
        category: record.category,
        description: record.description || '',
        checklist: record.checklist || [],
        tags: record.tags || [],
        photos: record.photos || [],
        createdAt: record.created_at,
        updatedAt: record.updated_at,
    };
}
