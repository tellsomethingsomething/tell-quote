import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// ============ TALENT TYPES ============
export const TALENT_TYPES = {
    actor: { id: 'actor', label: 'Actor', icon: '🎭' },
    model: { id: 'model', label: 'Model', icon: '📸' },
    influencer: { id: 'influencer', label: 'Influencer', icon: '⭐' },
    voice_artist: { id: 'voice_artist', label: 'Voice Artist', icon: '🎙️' },
    presenter: { id: 'presenter', label: 'Presenter/Host', icon: '🎤' },
    extra: { id: 'extra', label: 'Extra/Background', icon: '👥' },
    child: { id: 'child', label: 'Child Talent', icon: '👶' },
    specialist: { id: 'specialist', label: 'Specialist/Stunt', icon: '🎬' },
};

export const TALENT_STATUS = {
    available: { id: 'available', label: 'Available', color: '#22C55E' },
    booked: { id: 'booked', label: 'Booked', color: '#F59E0B' },
    unavailable: { id: 'unavailable', label: 'Unavailable', color: '#EF4444' },
    pending: { id: 'pending', label: 'Pending Response', color: '#8B5CF6' },
};

// ============ LOCATION TYPES ============
export const LOCATION_TYPES = {
    studio: { id: 'studio', label: 'Studio', icon: '🎬' },
    office: { id: 'office', label: 'Office/Corporate', icon: '🏢' },
    residential: { id: 'residential', label: 'Residential', icon: '🏠' },
    outdoor: { id: 'outdoor', label: 'Outdoor/Nature', icon: '🌳' },
    industrial: { id: 'industrial', label: 'Industrial', icon: '🏭' },
    retail: { id: 'retail', label: 'Retail/Commercial', icon: '🏪' },
    restaurant: { id: 'restaurant', label: 'Restaurant/Cafe', icon: '🍽️' },
    hotel: { id: 'hotel', label: 'Hotel/Resort', icon: '🏨' },
    rooftop: { id: 'rooftop', label: 'Rooftop', icon: '🌆' },
    warehouse: { id: 'warehouse', label: 'Warehouse', icon: '📦' },
    beach: { id: 'beach', label: 'Beach', icon: '🏖️' },
    other: { id: 'other', label: 'Other', icon: '📍' },
};

export const LOCATION_STATUS = {
    available: { id: 'available', label: 'Available', color: '#22C55E' },
    booked: { id: 'booked', label: 'Booked', color: '#F59E0B' },
    unavailable: { id: 'unavailable', label: 'Unavailable', color: '#EF4444' },
    pending: { id: 'pending', label: 'Pending Approval', color: '#8B5CF6' },
};

// ============ VENDOR TYPES ============
export const VENDOR_TYPES = {
    equipment_rental: { id: 'equipment_rental', label: 'Equipment Rental', icon: '🎥' },
    catering: { id: 'catering', label: 'Catering', icon: '🍱' },
    transport: { id: 'transport', label: 'Transport/Logistics', icon: '🚐' },
    props: { id: 'props', label: 'Props/Set Dressing', icon: '🪑' },
    wardrobe: { id: 'wardrobe', label: 'Wardrobe/Costume', icon: '👔' },
    makeup_hair: { id: 'makeup_hair', label: 'Makeup & Hair', icon: '💄' },
    post_production: { id: 'post_production', label: 'Post Production', icon: '🖥️' },
    music_audio: { id: 'music_audio', label: 'Music/Audio', icon: '🎵' },
    insurance: { id: 'insurance', label: 'Insurance', icon: '📋' },
    legal: { id: 'legal', label: 'Legal/Clearances', icon: '⚖️' },
    security: { id: 'security', label: 'Security', icon: '🔒' },
    medical: { id: 'medical', label: 'Medical/Safety', icon: '🏥' },
    generator: { id: 'generator', label: 'Power/Generator', icon: '⚡' },
    studio_rental: { id: 'studio_rental', label: 'Studio Rental', icon: '🎬' },
    other: { id: 'other', label: 'Other', icon: '📦' },
};

export const VENDOR_RATING = {
    5: { id: 5, label: 'Excellent', stars: '★★★★★' },
    4: { id: 4, label: 'Good', stars: '★★★★☆' },
    3: { id: 3, label: 'Average', stars: '★★★☆☆' },
    2: { id: 2, label: 'Below Average', stars: '★★☆☆☆' },
    1: { id: 1, label: 'Poor', stars: '★☆☆☆☆' },
};

export const useResourceStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        talents: [],
        locations: [],
        vendors: [],
        loading: false,
        error: null,

        // ============ TALENT OPERATIONS ============

        loadTalents: async () => {
            set({ loading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('talents')
                    .select('*')
                    .order('name', { ascending: true });

                if (error) throw error;
                set({ talents: data || [], loading: false });
            } catch (error) {
                console.error('Error loading talents:', error);
                set({ error: error.message, loading: false });
            }
        },

        createTalent: async (talentData) => {
            try {
                const { data, error } = await supabase
                    .from('talents')
                    .insert({
                        name: talentData.name,
                        type: talentData.type || 'actor',
                        email: talentData.email || '',
                        phone: talentData.phone || '',
                        agent_name: talentData.agent_name || '',
                        agent_email: talentData.agent_email || '',
                        agent_phone: talentData.agent_phone || '',
                        headshot_url: talentData.headshot_url || '',
                        showreel_url: talentData.showreel_url || '',
                        portfolio_urls: talentData.portfolio_urls || [],
                        day_rate: talentData.day_rate || null,
                        currency: talentData.currency || 'USD',
                        status: talentData.status || 'available',
                        skills: talentData.skills || [],
                        languages: talentData.languages || [],
                        ethnicity: talentData.ethnicity || '',
                        age_range: talentData.age_range || '',
                        height: talentData.height || '',
                        notes: talentData.notes || '',
                        social_instagram: talentData.social_instagram || '',
                        social_tiktok: talentData.social_tiktok || '',
                        follower_count: talentData.follower_count || null,
                        tags: talentData.tags || [],
                    })
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({ talents: [...state.talents, data] }));
                return data;
            } catch (error) {
                console.error('Error creating talent:', error);
                throw error;
            }
        },

        updateTalent: async (talentId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('talents')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', talentId)
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({
                    talents: state.talents.map(t => t.id === talentId ? data : t),
                }));
                return data;
            } catch (error) {
                console.error('Error updating talent:', error);
                throw error;
            }
        },

        deleteTalent: async (talentId) => {
            try {
                const { error } = await supabase
                    .from('talents')
                    .delete()
                    .eq('id', talentId);

                if (error) throw error;
                set(state => ({
                    talents: state.talents.filter(t => t.id !== talentId),
                }));
            } catch (error) {
                console.error('Error deleting talent:', error);
                throw error;
            }
        },

        // ============ LOCATION OPERATIONS ============

        loadLocations: async () => {
            set({ loading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('locations')
                    .select('*')
                    .order('name', { ascending: true });

                if (error) throw error;
                set({ locations: data || [], loading: false });
            } catch (error) {
                console.error('Error loading locations:', error);
                set({ error: error.message, loading: false });
            }
        },

        createLocation: async (locationData) => {
            try {
                const { data, error } = await supabase
                    .from('locations')
                    .insert({
                        name: locationData.name,
                        type: locationData.type || 'other',
                        address: locationData.address || '',
                        city: locationData.city || '',
                        country: locationData.country || '',
                        coordinates: locationData.coordinates || null,
                        contact_name: locationData.contact_name || '',
                        contact_email: locationData.contact_email || '',
                        contact_phone: locationData.contact_phone || '',
                        day_rate: locationData.day_rate || null,
                        half_day_rate: locationData.half_day_rate || null,
                        currency: locationData.currency || 'USD',
                        status: locationData.status || 'available',
                        photos: locationData.photos || [],
                        permits_required: locationData.permits_required || false,
                        permit_notes: locationData.permit_notes || '',
                        parking: locationData.parking || '',
                        power_available: locationData.power_available || true,
                        wifi_available: locationData.wifi_available || true,
                        load_in_notes: locationData.load_in_notes || '',
                        restrictions: locationData.restrictions || '',
                        nearby_amenities: locationData.nearby_amenities || '',
                        max_crew_size: locationData.max_crew_size || null,
                        notes: locationData.notes || '',
                        tags: locationData.tags || [],
                    })
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({ locations: [...state.locations, data] }));
                return data;
            } catch (error) {
                console.error('Error creating location:', error);
                throw error;
            }
        },

        updateLocation: async (locationId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('locations')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', locationId)
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({
                    locations: state.locations.map(l => l.id === locationId ? data : l),
                }));
                return data;
            } catch (error) {
                console.error('Error updating location:', error);
                throw error;
            }
        },

        deleteLocation: async (locationId) => {
            try {
                const { error } = await supabase
                    .from('locations')
                    .delete()
                    .eq('id', locationId);

                if (error) throw error;
                set(state => ({
                    locations: state.locations.filter(l => l.id !== locationId),
                }));
            } catch (error) {
                console.error('Error deleting location:', error);
                throw error;
            }
        },

        // ============ VENDOR OPERATIONS ============

        loadVendors: async () => {
            set({ loading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('vendors')
                    .select('*')
                    .order('name', { ascending: true });

                if (error) throw error;
                set({ vendors: data || [], loading: false });
            } catch (error) {
                console.error('Error loading vendors:', error);
                set({ error: error.message, loading: false });
            }
        },

        createVendor: async (vendorData) => {
            try {
                const { data, error } = await supabase
                    .from('vendors')
                    .insert({
                        name: vendorData.name,
                        type: vendorData.type || 'other',
                        company: vendorData.company || '',
                        email: vendorData.email || '',
                        phone: vendorData.phone || '',
                        website: vendorData.website || '',
                        address: vendorData.address || '',
                        city: vendorData.city || '',
                        country: vendorData.country || '',
                        contact_name: vendorData.contact_name || '',
                        contact_email: vendorData.contact_email || '',
                        contact_phone: vendorData.contact_phone || '',
                        rating: vendorData.rating || null,
                        is_preferred: vendorData.is_preferred || false,
                        payment_terms: vendorData.payment_terms || '',
                        bank_details: vendorData.bank_details || '',
                        tax_id: vendorData.tax_id || '',
                        services: vendorData.services || [],
                        price_range: vendorData.price_range || '',
                        min_order: vendorData.min_order || null,
                        lead_time: vendorData.lead_time || '',
                        notes: vendorData.notes || '',
                        tags: vendorData.tags || [],
                    })
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({ vendors: [...state.vendors, data] }));
                return data;
            } catch (error) {
                console.error('Error creating vendor:', error);
                throw error;
            }
        },

        updateVendor: async (vendorId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('vendors')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', vendorId)
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({
                    vendors: state.vendors.map(v => v.id === vendorId ? data : v),
                }));
                return data;
            } catch (error) {
                console.error('Error updating vendor:', error);
                throw error;
            }
        },

        deleteVendor: async (vendorId) => {
            try {
                const { error } = await supabase
                    .from('vendors')
                    .delete()
                    .eq('id', vendorId);

                if (error) throw error;
                set(state => ({
                    vendors: state.vendors.filter(v => v.id !== vendorId),
                }));
            } catch (error) {
                console.error('Error deleting vendor:', error);
                throw error;
            }
        },

        // ============ INITIALIZE ============

        initialize: async () => {
            const { loadTalents, loadLocations, loadVendors } = get();
            await Promise.all([loadTalents(), loadLocations(), loadVendors()]);
        },

        // ============ SEARCH HELPERS ============

        searchTalents: (query, filters = {}) => {
            const { talents } = get();
            let results = [...talents];

            if (query) {
                const q = query.toLowerCase();
                results = results.filter(t =>
                    t.name?.toLowerCase().includes(q) ||
                    t.skills?.some(s => s.toLowerCase().includes(q)) ||
                    t.tags?.some(tag => tag.toLowerCase().includes(q))
                );
            }

            if (filters.type) {
                results = results.filter(t => t.type === filters.type);
            }

            if (filters.status) {
                results = results.filter(t => t.status === filters.status);
            }

            return results;
        },

        searchLocations: (query, filters = {}) => {
            const { locations } = get();
            let results = [...locations];

            if (query) {
                const q = query.toLowerCase();
                results = results.filter(l =>
                    l.name?.toLowerCase().includes(q) ||
                    l.city?.toLowerCase().includes(q) ||
                    l.address?.toLowerCase().includes(q) ||
                    l.tags?.some(tag => tag.toLowerCase().includes(q))
                );
            }

            if (filters.type) {
                results = results.filter(l => l.type === filters.type);
            }

            if (filters.status) {
                results = results.filter(l => l.status === filters.status);
            }

            if (filters.city) {
                results = results.filter(l => l.city === filters.city);
            }

            return results;
        },

        searchVendors: (query, filters = {}) => {
            const { vendors } = get();
            let results = [...vendors];

            if (query) {
                const q = query.toLowerCase();
                results = results.filter(v =>
                    v.name?.toLowerCase().includes(q) ||
                    v.company?.toLowerCase().includes(q) ||
                    v.services?.some(s => s.toLowerCase().includes(q)) ||
                    v.tags?.some(tag => tag.toLowerCase().includes(q))
                );
            }

            if (filters.type) {
                results = results.filter(v => v.type === filters.type);
            }

            if (filters.is_preferred) {
                results = results.filter(v => v.is_preferred);
            }

            if (filters.min_rating) {
                results = results.filter(v => v.rating >= filters.min_rating);
            }

            return results;
        },
    }))
);
