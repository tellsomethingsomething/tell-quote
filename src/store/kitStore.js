import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured, uploadKitImage, deleteKitImage } from '../lib/supabase';
import { useRateCardStore, ITEM_TYPES } from './rateCardStore';
import logger from '../utils/logger';

// Map kit categories to rate card sections
const KIT_CATEGORY_TO_RATE_SECTION = {
    'Camera': 'equip_cameras',
    'Lens': 'equip_cameras',
    'Tripod': 'equip_other',
    'Audio': 'equip_audio',
    'Comms': 'equip_audio',
    'Graphics': 'equip_graphics',
    'Switching': 'equip_video',
    'Streaming': 'equip_video',
    'Cabling': 'equip_cabling',
    'Power': 'equip_other',
    'Lighting': 'equip_other',
    'Monitors': 'equip_video',
    'Storage': 'equip_other',
    'Rigging': 'equip_other',
    'Network': 'equip_other',
    'Other': 'equip_other',
};

// Helper to sync kit item to rate card
const syncKitToRateCard = async (kitItem, categoryName) => {
    const rateCardStore = useRateCardStore.getState();
    const section = KIT_CATEGORY_TO_RATE_SECTION[categoryName] || 'equip_other';

    // Only sync if kit item has rates
    if (!kitItem.dayRate && !kitItem.weekRate && !kitItem.monthRate) {
        return null;
    }

    // Check if already linked to a rate card item
    if (kitItem.rateCardItemId) {
        // Update existing rate card item
        const existingItem = rateCardStore.items.find(i => i.id === kitItem.rateCardItemId);
        if (existingItem) {
            // Build pricing from kit rates (use SEA region as default for equipment)
            const pricing = {
                SEA: {
                    cost: { amount: kitItem.dayRate || 0, baseCurrency: kitItem.rateCurrency || 'USD' },
                    charge: { amount: Math.round((kitItem.dayRate || 0) * 1.3), baseCurrency: kitItem.rateCurrency || 'USD' },
                },
            };
            rateCardStore.updateItem(kitItem.rateCardItemId, { pricing });
            return kitItem.rateCardItemId;
        }
    }

    // Create new rate card item
    const newRateItem = await rateCardStore.addItem({
        name: kitItem.name,
        description: `${kitItem.manufacturer || ''} ${kitItem.model || ''}`.trim() || kitItem.name,
        section,
        unit: 'day',
        itemType: ITEM_TYPES.EQUIPMENT,
        kitItemId: kitItem.id,
        pricing: {
            SEA: {
                cost: { amount: kitItem.dayRate || 0, baseCurrency: kitItem.rateCurrency || 'USD' },
                charge: { amount: Math.round((kitItem.dayRate || 0) * 1.3), baseCurrency: kitItem.rateCurrency || 'USD' },
            },
        },
    });

    return newRateItem?.id || null;
};

// Kit status options
export const KIT_STATUS = {
    AVAILABLE: 'available',
    ON_JOB: 'on_job',
    MAINTENANCE: 'maintenance',
    SOLD: 'sold',
    RETIRED: 'retired',
    LOST: 'lost',
};

export const KIT_STATUS_CONFIG = {
    [KIT_STATUS.AVAILABLE]: { label: 'Available', color: 'text-green-400', bg: 'bg-green-500/20' },
    [KIT_STATUS.ON_JOB]: { label: 'On Job', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    [KIT_STATUS.MAINTENANCE]: { label: 'Maintenance', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    [KIT_STATUS.SOLD]: { label: 'Sold', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    [KIT_STATUS.RETIRED]: { label: 'Retired', color: 'text-gray-500', bg: 'bg-gray-600/20' },
    [KIT_STATUS.LOST]: { label: 'Lost', color: 'text-red-400', bg: 'bg-red-500/20' },
};

// Condition options
export const KIT_CONDITION = {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'fair',
    POOR: 'poor',
};

export const KIT_CONDITION_CONFIG = {
    [KIT_CONDITION.EXCELLENT]: { label: 'Excellent', color: 'text-green-400' },
    [KIT_CONDITION.GOOD]: { label: 'Good', color: 'text-blue-400' },
    [KIT_CONDITION.FAIR]: { label: 'Fair', color: 'text-amber-400' },
    [KIT_CONDITION.POOR]: { label: 'Poor', color: 'text-red-400' },
};

// Default categories (fallback if not loaded from DB)
export const DEFAULT_CATEGORIES = [
    { id: 'camera', name: 'Camera', color: '#3B82F6', icon: 'video', prefix: 'CAM' },
    { id: 'lens', name: 'Lens', color: '#8B5CF6', icon: 'aperture', prefix: 'LENS' },
    { id: 'tripod', name: 'Tripod', color: '#10B981', icon: 'maximize', prefix: 'TRI' },
    { id: 'audio', name: 'Audio', color: '#F59E0B', icon: 'mic', prefix: 'AUD' },
    { id: 'comms', name: 'Comms', color: '#EF4444', icon: 'headphones', prefix: 'COM' },
    { id: 'graphics', name: 'Graphics', color: '#EC4899', icon: 'monitor', prefix: 'GFX' },
    { id: 'switching', name: 'Switching', color: '#6366F1', icon: 'grid', prefix: 'SWT' },
    { id: 'streaming', name: 'Streaming', color: '#14B8A6', icon: 'wifi', prefix: 'STR' },
    { id: 'cabling', name: 'Cabling', color: '#6B7280', icon: 'cable', prefix: 'CBL' },
    { id: 'power', name: 'Power', color: '#84CC16', icon: 'battery', prefix: 'PWR' },
    { id: 'lighting', name: 'Lighting', color: '#FBBF24', icon: 'sun', prefix: 'LGT' },
    { id: 'monitors', name: 'Monitors', color: '#0EA5E9', icon: 'tv', prefix: 'MON' },
    { id: 'storage', name: 'Storage', color: '#78716C', icon: 'package', prefix: 'STG' },
    { id: 'rigging', name: 'Rigging', color: '#A3A3A3', icon: 'tool', prefix: 'RIG' },
    { id: 'network', name: 'Network', color: '#22D3EE', icon: 'network', prefix: 'NET' },
    { id: 'other', name: 'Other', color: '#9CA3AF', icon: 'more-horizontal', prefix: 'OTH' },
];

// Default locations
export const DEFAULT_LOCATIONS = [
    'KL Office',
    'Kuwait Office',
    'Bangkok Storage',
    'On Location',
];

// Convert DB format to local format
function fromDbFormat(record) {
    return {
        id: record.id,
        kitId: record.kit_id,
        name: record.name,
        categoryId: record.category_id,
        categoryName: record.category_name,
        categoryColor: record.category_color,
        manufacturer: record.manufacturer,
        model: record.model,
        serialNumber: record.serial_number,
        purchaseDate: record.purchase_date,
        purchasePrice: record.purchase_price,
        purchaseCurrency: record.purchase_currency || 'USD',
        currentValue: record.current_value,
        calculatedValue: record.calculated_value,
        depreciationRate: record.depreciation_rate,
        rateCardItemId: record.rate_card_item_id,
        dayRate: record.day_rate,
        weekRate: record.week_rate,
        monthRate: record.month_rate,
        rateCurrency: record.rate_currency || 'USD',
        location: record.location,
        status: record.status || 'available',
        condition: record.condition || 'good',
        parentKitId: record.parent_kit_id,
        parentKitCode: record.parent_kit_code,
        parentName: record.parent_name,
        isPackage: record.is_package,
        childCount: record.child_count || 0,
        quantity: record.quantity || 1,
        quantityAvailable: record.quantity_available || record.quantity || 1,
        specs: record.specs || {},
        technicalTags: record.technical_tags || [],
        operationalTags: record.operational_tags || [],
        jobTypeTags: record.job_type_tags || [],
        lastUsedDate: record.last_used_date,
        totalDaysUsed: record.total_days_used || 0,
        totalRevenue: record.total_revenue || 0,
        expectedLifespanMonths: record.expected_lifespan_months,
        ageMonths: record.age_months,
        daysSinceLastUse: record.days_since_last_use,
        replacementDueDate: record.replacement_due_date,
        insured: record.insured,
        insuranceValue: record.insurance_value,
        insurancePolicyRef: record.insurance_policy_ref,
        notes: record.notes,
        imageUrl: record.image_url,
        imagePath: record.image_path,
        manualUrl: record.manual_url,
        qrCode: record.qr_code,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
    };
}

// Convert local format to DB format
function toDbFormat(item) {
    const dbItem = {};

    if (item.kitId !== undefined) dbItem.kit_id = item.kitId;
    if (item.name !== undefined) dbItem.name = item.name;
    if (item.categoryId !== undefined) dbItem.category_id = item.categoryId;
    if (item.manufacturer !== undefined) dbItem.manufacturer = item.manufacturer;
    if (item.model !== undefined) dbItem.model = item.model;
    if (item.serialNumber !== undefined) dbItem.serial_number = item.serialNumber;
    if (item.purchaseDate !== undefined) dbItem.purchase_date = item.purchaseDate;
    if (item.purchasePrice !== undefined) dbItem.purchase_price = item.purchasePrice;
    if (item.purchaseCurrency !== undefined) dbItem.purchase_currency = item.purchaseCurrency;
    if (item.currentValue !== undefined) dbItem.current_value = item.currentValue;
    if (item.depreciationRate !== undefined) dbItem.depreciation_rate = item.depreciationRate;
    if (item.rateCardItemId !== undefined) dbItem.rate_card_item_id = item.rateCardItemId;
    if (item.dayRate !== undefined) dbItem.day_rate = item.dayRate;
    if (item.weekRate !== undefined) dbItem.week_rate = item.weekRate;
    if (item.monthRate !== undefined) dbItem.month_rate = item.monthRate;
    if (item.rateCurrency !== undefined) dbItem.rate_currency = item.rateCurrency;
    if (item.location !== undefined) dbItem.location = item.location;
    if (item.status !== undefined) dbItem.status = item.status;
    if (item.condition !== undefined) dbItem.condition = item.condition;
    if (item.parentKitId !== undefined) dbItem.parent_kit_id = item.parentKitId;
    if (item.isPackage !== undefined) dbItem.is_package = item.isPackage;
    if (item.quantity !== undefined) dbItem.quantity = item.quantity;
    if (item.quantityAvailable !== undefined) dbItem.quantity_available = item.quantityAvailable;
    if (item.specs !== undefined) dbItem.specs = item.specs;
    if (item.technicalTags !== undefined) dbItem.technical_tags = item.technicalTags;
    if (item.operationalTags !== undefined) dbItem.operational_tags = item.operationalTags;
    if (item.jobTypeTags !== undefined) dbItem.job_type_tags = item.jobTypeTags;
    if (item.lastUsedDate !== undefined) dbItem.last_used_date = item.lastUsedDate;
    if (item.expectedLifespanMonths !== undefined) dbItem.expected_lifespan_months = item.expectedLifespanMonths;
    if (item.insured !== undefined) dbItem.insured = item.insured;
    if (item.insuranceValue !== undefined) dbItem.insurance_value = item.insuranceValue;
    if (item.insurancePolicyRef !== undefined) dbItem.insurance_policy_ref = item.insurancePolicyRef;
    if (item.notes !== undefined) dbItem.notes = item.notes;
    if (item.imageUrl !== undefined) dbItem.image_url = item.imageUrl;
    if (item.imagePath !== undefined) dbItem.image_path = item.imagePath;
    if (item.manualUrl !== undefined) dbItem.manual_url = item.manualUrl;

    return dbItem;
}

export const useKitStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        items: [],
        categories: DEFAULT_CATEGORIES,
        locations: DEFAULT_LOCATIONS,
        bookings: [],
        loading: false,
        error: null,

        // Filters
        filters: {
            search: '',
            category: null,
            status: null,
            location: null,
            parentOnly: false,
        },

        // Initialize - load from Supabase
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                // Load categories
                const { data: categoriesData, error: categoriesError } = await supabase
                    .from('kit_categories')
                    .select('*')
                    .order('sort_order');

                if (!categoriesError && categoriesData && categoriesData.length > 0) {
                    const categories = categoriesData.map(c => ({
                        id: c.id,
                        name: c.name,
                        description: c.description,
                        color: c.color,
                        icon: c.icon,
                        prefix: c.name.substring(0, 3).toUpperCase(),
                    }));
                    set({ categories });
                }

                // Load locations
                const { data: locationsData, error: locationsError } = await supabase
                    .from('kit_locations')
                    .select('name')
                    .order('name');

                if (!locationsError && locationsData) {
                    set({ locations: locationsData.map(l => l.name) });
                }

                // Load kit items using the extended view
                const { data: itemsData, error: itemsError } = await supabase
                    .from('kit_items_extended')
                    .select('*')
                    .order('kit_id');

                if (itemsError) {
                    // Fallback to regular table if view doesn't exist
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('kit_items')
                        .select('*')
                        .order('kit_id');

                    if (fallbackError) throw fallbackError;
                    const items = (fallbackData || []).map(fromDbFormat);
                    set({ items, loading: false, error: null });
                } else {
                    const items = (itemsData || []).map(fromDbFormat);
                    set({ items, loading: false, error: null });
                }

            } catch (e) {
                logger.error('Failed to load kit items:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Add new kit item
        addItem: async (itemData) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                const dbData = toDbFormat(itemData);

                const { data, error } = await supabase
                    .from('kit_items')
                    .insert(dbData)
                    .select()
                    .single();

                if (error) throw error;

                const newItem = fromDbFormat(data);
                set((state) => ({
                    items: [...state.items, newItem],
                    error: null,
                }));

                // Sync to rate card if item has rates
                if (newItem.dayRate || newItem.weekRate || newItem.monthRate) {
                    const categoryName = itemData.categoryName || get().categories.find(c => c.id === newItem.categoryId)?.name;
                    const rateCardItemId = await syncKitToRateCard(newItem, categoryName);
                    if (rateCardItemId && !newItem.rateCardItemId) {
                        // Update kit item with rate card link
                        await supabase.from('kit_items').update({ rate_card_item_id: rateCardItemId }).eq('id', newItem.id);
                        set((state) => ({
                            items: state.items.map(i => i.id === newItem.id ? { ...i, rateCardItemId } : i),
                        }));
                    }
                }

                return newItem;
            } catch (e) {
                logger.error('Failed to add kit item:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Update kit item
        updateItem: async (itemId, updates) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            try {
                const dbUpdates = toDbFormat(updates);

                const { error } = await supabase
                    .from('kit_items')
                    .update(dbUpdates)
                    .eq('id', itemId);

                if (error) throw error;

                set((state) => ({
                    items: state.items.map(item =>
                        item.id === itemId ? { ...item, ...updates } : item
                    ),
                    error: null,
                }));

                // Sync to rate card if rates were updated
                if (updates.dayRate !== undefined || updates.weekRate !== undefined || updates.monthRate !== undefined) {
                    const updatedItem = get().items.find(i => i.id === itemId);
                    if (updatedItem) {
                        const categoryName = updatedItem.categoryName || get().categories.find(c => c.id === updatedItem.categoryId)?.name;
                        const rateCardItemId = await syncKitToRateCard(updatedItem, categoryName);
                        if (rateCardItemId && !updatedItem.rateCardItemId) {
                            // Update kit item with rate card link
                            await supabase.from('kit_items').update({ rate_card_item_id: rateCardItemId }).eq('id', itemId);
                            set((state) => ({
                                items: state.items.map(i => i.id === itemId ? { ...i, rateCardItemId } : i),
                            }));
                        }
                    }
                }
            } catch (e) {
                logger.error('Failed to update kit item:', e);
                set({ error: e.message });
            }
        },

        // Delete kit item
        deleteItem: async (itemId) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            try {
                const { error } = await supabase
                    .from('kit_items')
                    .delete()
                    .eq('id', itemId);

                if (error) throw error;

                set((state) => ({
                    items: state.items.filter(item => item.id !== itemId),
                    error: null,
                }));
            } catch (e) {
                logger.error('Failed to delete kit item:', e);
                set({ error: e.message });
            }
        },

        // Sync all kit items to rate card
        syncAllToRateCard: async () => {
            const { items, categories } = get();
            let syncedCount = 0;
            let errorCount = 0;

            for (const item of items) {
                // Only sync items with rates
                if (!item.dayRate && !item.weekRate && !item.monthRate) continue;

                try {
                    const categoryName = item.categoryName || categories.find(c => c.id === item.categoryId)?.name;
                    const rateCardItemId = await syncKitToRateCard(item, categoryName);

                    if (rateCardItemId && !item.rateCardItemId) {
                        // Update kit item with rate card link
                        await supabase.from('kit_items').update({ rate_card_item_id: rateCardItemId }).eq('id', item.id);
                        set((state) => ({
                            items: state.items.map(i => i.id === item.id ? { ...i, rateCardItemId } : i),
                        }));
                    }
                    syncedCount++;
                } catch (e) {
                    logger.error(`Failed to sync kit item ${item.kitId}:`, e);
                    errorCount++;
                }
            }

            return { syncedCount, errorCount };
        },

        // Generate next kit ID for category
        generateKitId: async (categoryName) => {
            const { items, categories } = get();
            const category = categories.find(c => c.name === categoryName || c.id === categoryName);
            const prefix = category?.prefix || categoryName.substring(0, 3).toUpperCase();

            // Find highest number for this prefix
            const existing = items
                .filter(i => i.kitId && i.kitId.startsWith(prefix + '-'))
                .map(i => {
                    const match = i.kitId.match(new RegExp(`${prefix}-(\\d+)`));
                    return match ? parseInt(match[1], 10) : 0;
                });

            const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
            return `${prefix}-${String(nextNum).padStart(3, '0')}`;
        },

        // Get children of a parent kit
        getChildren: (parentId) => {
            const { items } = get();
            return items.filter(i => i.parentKitId === parentId);
        },

        // Get parent packages only
        getPackages: () => {
            const { items } = get();
            return items.filter(i => i.isPackage || i.childCount > 0);
        },

        // Get available items
        getAvailable: () => {
            const { items } = get();
            return items.filter(i => i.status === KIT_STATUS.AVAILABLE);
        },

        // Get items by category
        getByCategory: (categoryId) => {
            const { items } = get();
            return items.filter(i => i.categoryId === categoryId);
        },

        // Get items by location
        getByLocation: (location) => {
            const { items } = get();
            return items.filter(i => i.location === location);
        },

        // Get filtered items
        getFilteredItems: () => {
            const { items, filters } = get();
            let filtered = [...items];

            if (filters.search) {
                const q = filters.search.toLowerCase();
                filtered = filtered.filter(i =>
                    i.kitId?.toLowerCase().includes(q) ||
                    i.name?.toLowerCase().includes(q) ||
                    i.manufacturer?.toLowerCase().includes(q) ||
                    i.model?.toLowerCase().includes(q) ||
                    i.serialNumber?.toLowerCase().includes(q)
                );
            }

            if (filters.category) {
                filtered = filtered.filter(i => i.categoryId === filters.category || i.categoryName === filters.category);
            }

            if (filters.status) {
                filtered = filtered.filter(i => i.status === filters.status);
            }

            if (filters.location) {
                filtered = filtered.filter(i => i.location === filters.location);
            }

            if (filters.parentOnly) {
                filtered = filtered.filter(i => !i.parentKitId);
            }

            return filtered;
        },

        // Set filters
        setFilters: (newFilters) => {
            set((state) => ({
                filters: { ...state.filters, ...newFilters },
            }));
        },

        // Clear filters
        clearFilters: () => {
            set({
                filters: {
                    search: '',
                    category: null,
                    status: null,
                    location: null,
                    parentOnly: false,
                },
            });
        },

        // Get stats
        getStats: () => {
            const { items } = get();

            const totalValue = items.reduce((sum, i) => sum + (i.currentValue || i.purchasePrice || 0), 0);
            const totalRevenue = items.reduce((sum, i) => sum + (i.totalRevenue || 0), 0);

            const byStatus = {};
            const byCategory = {};
            const byLocation = {};

            items.forEach(item => {
                byStatus[item.status] = (byStatus[item.status] || 0) + 1;
                if (item.categoryName) {
                    byCategory[item.categoryName] = (byCategory[item.categoryName] || 0) + 1;
                }
                if (item.location) {
                    byLocation[item.location] = (byLocation[item.location] || 0) + 1;
                }
            });

            // Items needing attention
            const needsMaintenance = items.filter(i => i.condition === 'poor').length;
            const deadStock = items.filter(i => i.daysSinceLastUse && i.daysSinceLastUse > 180).length;

            return {
                totalItems: items.length,
                totalValue,
                totalRevenue,
                byStatus,
                byCategory,
                byLocation,
                needsMaintenance,
                deadStock,
                availableCount: byStatus[KIT_STATUS.AVAILABLE] || 0,
                onJobCount: byStatus[KIT_STATUS.ON_JOB] || 0,
            };
        },

        // Clear error
        clearError: () => {
            set({ error: null });
        },

        // Sync rate card item updates back to kit item (bidirectional sync)
        // Call this when a rate card item linked to kit is updated
        syncFromRateCard: async (rateCardItem) => {
            if (!rateCardItem || !rateCardItem.kitItemId) return false;

            const { items } = get();
            const kitItem = items.find(i => i.id === rateCardItem.kitItemId || i.rateCardItemId === rateCardItem.id);

            if (!kitItem) {
                logger.warn('Kit item not found for rate card sync:', rateCardItem.id);
                return false;
            }

            try {
                // Extract the rate from the rate card item pricing
                // Rate card uses regional pricing, kit uses flat rates
                // Default to SEA region for equipment
                const pricing = rateCardItem.pricing || {};
                const seaPricing = pricing.SEA || pricing.EU || pricing.ME || Object.values(pricing)[0];

                if (!seaPricing) {
                    logger.warn('No pricing found in rate card item');
                    return false;
                }

                // Update kit item with rate card prices
                const updates = {};
                if (seaPricing.cost?.amount !== undefined) {
                    updates.dayRate = seaPricing.cost.amount;
                }
                if (seaPricing.cost?.baseCurrency) {
                    updates.rateCurrency = seaPricing.cost.baseCurrency;
                }

                if (Object.keys(updates).length > 0) {
                    await get().updateItem(kitItem.id, updates);
                    logger.info(`Synced rate card changes to kit item ${kitItem.kitId}`);
                    return true;
                }

                return false;
            } catch (e) {
                logger.error('Failed to sync from rate card:', e);
                return false;
            }
        },

        // Unlink kit item from rate card
        unlinkFromRateCard: async (itemId) => {
            const item = get().items.find(i => i.id === itemId);
            if (!item || !item.rateCardItemId) return;

            try {
                // Remove the link in kit item
                await supabase.from('kit_items')
                    .update({ rate_card_item_id: null })
                    .eq('id', itemId);

                // Also update the rate card item to remove kit link
                const rateCardStore = useRateCardStore.getState();
                if (rateCardStore.updateItem) {
                    await rateCardStore.updateItem(item.rateCardItemId, { kitItemId: null });
                }

                set((state) => ({
                    items: state.items.map(i => i.id === itemId ? { ...i, rateCardItemId: null } : i),
                }));

                logger.info(`Unlinked kit item ${item.kitId} from rate card`);
            } catch (e) {
                logger.error('Failed to unlink from rate card:', e);
            }
        },

        // Upload image for kit item
        uploadImage: async (itemId, file) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return null;
            }

            try {
                const { items } = get();
                const item = items.find(i => i.id === itemId);
                const kitId = item?.kitId || itemId;

                // Upload to Supabase Storage
                const result = await uploadKitImage(file, kitId);

                if (result) {
                    // Update item with new image URL
                    await get().updateItem(itemId, {
                        imageUrl: result.url,
                        imagePath: result.path,
                    });
                }

                return result;
            } catch (e) {
                logger.error('Failed to upload kit image:', e);
                set({ error: e.message });
                return null;
            }
        },

        // Remove image from kit item
        removeImage: async (itemId) => {
            if (!isSupabaseConfigured()) {
                set({ error: 'Supabase not configured' });
                return;
            }

            try {
                const { items } = get();
                const item = items.find(i => i.id === itemId);

                if (item?.imagePath) {
                    await deleteKitImage(item.imagePath);
                }

                // Update item to remove image
                await get().updateItem(itemId, {
                    imageUrl: null,
                    imagePath: null,
                });
            } catch (e) {
                logger.error('Failed to remove kit image:', e);
                set({ error: e.message });
            }
        },

        // Export kit list to CSV
        exportToCSV: (options = {}) => {
            const { items, categories } = get();
            const { includeFinancial = true, includeRates = true } = options;

            const headers = [
                'Kit ID', 'Name', 'Category', 'Manufacturer', 'Model', 'Serial Number',
                'Status', 'Condition', 'Location', 'Quantity', 'Available'
            ];

            if (includeFinancial) {
                headers.push('Purchase Date', 'Purchase Price', 'Currency', 'Current Value');
            }

            if (includeRates) {
                headers.push('Day Rate', 'Week Rate', 'Month Rate', 'Rate Currency');
            }

            headers.push('Notes', 'Tags');

            let csvContent = headers.join(',') + '\n';

            items.forEach(item => {
                const category = categories.find(c => c.id === item.categoryId);
                const tags = [...(item.technicalTags || []), ...(item.operationalTags || []), ...(item.jobTypeTags || [])].join('; ');

                const row = [
                    item.kitId || '',
                    `"${(item.name || '').replace(/"/g, '""')}"`,
                    category?.name || item.categoryName || '',
                    `"${(item.manufacturer || '').replace(/"/g, '""')}"`,
                    `"${(item.model || '').replace(/"/g, '""')}"`,
                    item.serialNumber || '',
                    item.status || 'available',
                    item.condition || 'good',
                    item.location || '',
                    item.quantity || 1,
                    item.quantityAvailable || item.quantity || 1
                ];

                if (includeFinancial) {
                    row.push(
                        item.purchaseDate || '',
                        item.purchasePrice || '',
                        item.purchaseCurrency || 'USD',
                        item.currentValue || item.calculatedValue || ''
                    );
                }

                if (includeRates) {
                    row.push(
                        item.dayRate || '',
                        item.weekRate || '',
                        item.monthRate || '',
                        item.rateCurrency || 'USD'
                    );
                }

                row.push(
                    `"${(item.notes || '').replace(/"/g, '""')}"`,
                    `"${tags}"`
                );

                csvContent += row.join(',') + '\n';
            });

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kit-list-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        // Export public-facing equipment list (no financial data)
        exportPublicList: () => {
            const { items, categories } = get();

            const headers = [
                'Code', 'Equipment', 'Category', 'Manufacturer', 'Model',
                'Status', 'Availability', 'Day Rate', 'Week Rate'
            ];

            let csvContent = headers.join(',') + '\n';

            // Only export available items
            const availableItems = items.filter(i => i.status === 'available' || i.status === 'on_job');

            availableItems.forEach(item => {
                const category = categories.find(c => c.id === item.categoryId);

                const row = [
                    item.kitId || '',
                    `"${(item.name || '').replace(/"/g, '""')}"`,
                    category?.name || item.categoryName || '',
                    item.manufacturer || '',
                    item.model || '',
                    item.status === 'available' ? 'Available' : 'In Use',
                    item.quantityAvailable || 0,
                    item.dayRate ? `$${item.dayRate}` : 'POA',
                    item.weekRate ? `$${item.weekRate}` : 'POA'
                ];

                csvContent += row.join(',') + '\n';
            });

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tell-equipment-list-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },
    }))
);
