import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import logger from '../utils/logger';

// Department options
export const CREW_DEPARTMENTS = {
    camera: { label: 'Camera', color: '#3B82F6' },
    sound: { label: 'Sound', color: '#8B5CF6' },
    lighting: { label: 'Lighting', color: '#F59E0B' },
    grip: { label: 'Grip', color: '#6B7280' },
    art: { label: 'Art Department', color: '#EC4899' },
    wardrobe: { label: 'Wardrobe', color: '#14B8A6' },
    makeup: { label: 'Hair & Makeup', color: '#F43F5E' },
    production: { label: 'Production', color: '#10B981' },
    direction: { label: 'Direction', color: '#EF4444' },
    editing: { label: 'Post Production', color: '#6366F1' },
    vfx: { label: 'VFX', color: '#8B5CF6' },
    transport: { label: 'Transport', color: '#64748B' },
    catering: { label: 'Catering', color: '#F97316' },
    other: { label: 'Other', color: '#9CA3AF' },
};

// Availability status options
export const AVAILABILITY_STATUS = {
    available: { label: 'Available', color: 'green' },
    busy: { label: 'Busy', color: 'yellow' },
    unavailable: { label: 'Unavailable', color: 'red' },
    on_project: { label: 'On Project', color: 'blue' },
};

// Convert DB format to local format
function fromDbFormat(c) {
    return {
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        nickname: c.nickname || '',
        email: c.email || '',
        phone: c.phone || '',
        phoneSecondary: c.phone_secondary || '',
        city: c.city || '',
        country: c.country || '',
        timezone: c.timezone || '',
        department: c.department || '',
        roleTitle: c.role_title || '',
        skills: c.skills || [],
        experienceYears: c.experience_years || 0,
        dayRate: c.day_rate || 0,
        halfDayRate: c.half_day_rate || 0,
        hourlyRate: c.hourly_rate || 0,
        overtimeRate: c.overtime_rate || 0,
        currency: c.currency || 'USD',
        rateNotes: c.rate_notes || '',
        ownsEquipment: c.owns_equipment || false,
        equipmentList: c.equipment_list || [],
        equipmentNotes: c.equipment_notes || '',
        availabilityStatus: c.availability_status || 'available',
        availabilityNotes: c.availability_notes || '',
        website: c.website || '',
        imdbLink: c.imdb_link || '',
        linkedinLink: c.linkedin_link || '',
        instagramLink: c.instagram_link || '',
        showreelLink: c.showreel_link || '',
        portfolioLinks: c.portfolio_links || [],
        resumeUrl: c.resume_url || '',
        rating: c.rating || 0,
        totalProjects: c.total_projects || 0,
        notes: c.notes || '',
        tags: c.tags || [],
        isFavorite: c.is_favorite || false,
        isArchived: c.is_archived || false,
        emergencyContactName: c.emergency_contact_name || '',
        emergencyContactPhone: c.emergency_contact_phone || '',
        emergencyContactRelation: c.emergency_contact_relation || '',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        lastContactedAt: c.last_contacted_at,
        // From view
        departmentName: c.department_name || CREW_DEPARTMENTS[c.department]?.label || '',
        departmentColor: c.department_color || CREW_DEPARTMENTS[c.department]?.color || '#6B7280',
        projectCount: c.project_count || 0,
        avgProjectRating: c.avg_project_rating || 0,
        totalEarned: c.total_earned || 0,
    };
}

// Convert local format to DB format
function toDbFormat(crew) {
    return {
        first_name: crew.firstName,
        last_name: crew.lastName,
        nickname: crew.nickname || null,
        email: crew.email || null,
        phone: crew.phone || null,
        phone_secondary: crew.phoneSecondary || null,
        city: crew.city || null,
        country: crew.country || null,
        timezone: crew.timezone || null,
        department: crew.department || null,
        role_title: crew.roleTitle || null,
        skills: crew.skills || [],
        experience_years: crew.experienceYears || null,
        day_rate: crew.dayRate || 0,
        half_day_rate: crew.halfDayRate || 0,
        hourly_rate: crew.hourlyRate || 0,
        overtime_rate: crew.overtimeRate || 0,
        currency: crew.currency || 'USD',
        rate_notes: crew.rateNotes || null,
        owns_equipment: crew.ownsEquipment || false,
        equipment_list: crew.equipmentList || [],
        equipment_notes: crew.equipmentNotes || null,
        availability_status: crew.availabilityStatus || 'available',
        availability_notes: crew.availabilityNotes || null,
        website: crew.website || null,
        imdb_link: crew.imdbLink || null,
        linkedin_link: crew.linkedinLink || null,
        instagram_link: crew.instagramLink || null,
        showreel_link: crew.showreelLink || null,
        portfolio_links: crew.portfolioLinks || [],
        resume_url: crew.resumeUrl || null,
        rating: crew.rating || null,
        notes: crew.notes || null,
        tags: crew.tags || [],
        is_favorite: crew.isFavorite || false,
        is_archived: crew.isArchived || false,
        emergency_contact_name: crew.emergencyContactName || null,
        emergency_contact_phone: crew.emergencyContactPhone || null,
        emergency_contact_relation: crew.emergencyContactRelation || null,
    };
}

export const useCrewStore = create(
    subscribeWithSelector((set, get) => ({
        crew: [],
        loading: false,
        error: null,
        realtimeSubscription: null,

        // Initialize - load from Supabase
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                // Try to fetch from view first, fallback to table
                let { data, error } = await supabase
                    .from('crew_summary')
                    .select('*')
                    .order('first_name', { ascending: true });

                // If view doesn't exist, use table directly
                if (error && error.code === '42P01') {
                    const result = await supabase
                        .from('crew')
                        .select('*')
                        .eq('is_archived', false)
                        .order('first_name', { ascending: true });
                    data = result.data;
                    error = result.error;
                }

                if (error) throw error;

                const crew = (data || []).map(fromDbFormat);
                set({ crew, loading: false, error: null });

                // Subscribe to realtime
                get().subscribeToRealtime();

            } catch (e) {
                logger.error('Failed to load crew:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Realtime subscription
        subscribeToRealtime: () => {
            if (!isSupabaseConfigured()) return;

            const existing = get().realtimeSubscription;
            if (existing) {
                supabase.removeChannel(existing);
            }

            const channel = supabase
                .channel('crew-realtime')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'crew' },
                    (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;

                        set((state) => {
                            let crew = [...state.crew];

                            if (eventType === 'INSERT') {
                                const exists = crew.find(c => c.id === newRecord.id);
                                if (!exists && !newRecord.is_archived) {
                                    crew = [...crew, fromDbFormat(newRecord)].sort((a, b) =>
                                        a.firstName.localeCompare(b.firstName)
                                    );
                                }
                            } else if (eventType === 'UPDATE') {
                                if (newRecord.is_archived) {
                                    crew = crew.filter(c => c.id !== newRecord.id);
                                } else {
                                    crew = crew.map(c =>
                                        c.id === newRecord.id ? fromDbFormat(newRecord) : c
                                    );
                                }
                            } else if (eventType === 'DELETE') {
                                crew = crew.filter(c => c.id !== oldRecord.id);
                            }

                            return { crew };
                        });
                    }
                )
                .subscribe();

            set({ realtimeSubscription: channel });
        },

        // Add crew member
        addCrew: async (crewData) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbData = toDbFormat(crewData);

            const { data, error } = await supabase
                .from('crew')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newCrew = fromDbFormat(data);

            set((state) => ({
                crew: [...state.crew, newCrew].sort((a, b) =>
                    a.firstName.localeCompare(b.firstName)
                ),
            }));

            return newCrew;
        },

        // Update crew member
        updateCrew: async (id, updates) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbUpdates = toDbFormat(updates);

            const { data, error } = await supabase
                .from('crew')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = fromDbFormat(data);

            set((state) => ({
                crew: state.crew.map(c => c.id === id ? { ...c, ...updated } : c),
            }));

            return updated;
        },

        // Delete (archive) crew member
        deleteCrew: async (id) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            // Soft delete - archive
            const { error } = await supabase
                .from('crew')
                .update({ is_archived: true })
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                crew: state.crew.filter(c => c.id !== id),
            }));
        },

        // Toggle favorite
        toggleFavorite: async (id) => {
            const member = get().crew.find(c => c.id === id);
            if (!member) return;

            await get().updateCrew(id, { isFavorite: !member.isFavorite });
        },

        // Update availability status
        updateAvailability: async (id, status) => {
            await get().updateCrew(id, { availabilityStatus: status });
        },

        // Search crew
        searchCrew: (query) => {
            const { crew } = get();
            if (!query) return crew;

            const q = query.toLowerCase();
            return crew.filter(c =>
                c.firstName.toLowerCase().includes(q) ||
                c.lastName.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.roleTitle.toLowerCase().includes(q) ||
                c.skills.some(s => s.toLowerCase().includes(q)) ||
                c.tags.some(t => t.toLowerCase().includes(q))
            );
        },

        // Filter by department
        filterByDepartment: (department) => {
            const { crew } = get();
            if (!department) return crew;
            return crew.filter(c => c.department === department);
        },

        // Filter by availability
        filterByAvailability: (status) => {
            const { crew } = get();
            if (!status) return crew;
            return crew.filter(c => c.availabilityStatus === status);
        },

        // Get crew by ID
        getCrewById: (id) => {
            return get().crew.find(c => c.id === id);
        },

        // Get favorites
        getFavorites: () => {
            return get().crew.filter(c => c.isFavorite);
        },

        // Get stats
        getStats: () => {
            const { crew } = get();

            const byDepartment = {};
            const byAvailability = {};

            crew.forEach(c => {
                // By department
                const dept = c.department || 'other';
                byDepartment[dept] = (byDepartment[dept] || 0) + 1;

                // By availability
                const avail = c.availabilityStatus || 'available';
                byAvailability[avail] = (byAvailability[avail] || 0) + 1;
            });

            return {
                total: crew.length,
                favorites: crew.filter(c => c.isFavorite).length,
                available: byAvailability.available || 0,
                byDepartment,
                byAvailability,
            };
        },

        // Cleanup
        cleanup: () => {
            const sub = get().realtimeSubscription;
            if (sub) {
                supabase.removeChannel(sub);
            }
            set({ realtimeSubscription: null });
        },
    }))
);
