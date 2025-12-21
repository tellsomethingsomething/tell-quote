import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Call sheet status options
export const CALL_SHEET_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

export const CALL_SHEET_STATUS_CONFIG = {
    [CALL_SHEET_STATUS.DRAFT]: {
        label: 'Draft',
        color: 'gray',
        bgClass: 'bg-gray-500/20',
        textClass: 'text-gray-400',
    },
    [CALL_SHEET_STATUS.PUBLISHED]: {
        label: 'Published',
        color: 'green',
        bgClass: 'bg-green-500/20',
        textClass: 'text-green-400',
    },
    [CALL_SHEET_STATUS.COMPLETED]: {
        label: 'Completed',
        color: 'blue',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
    },
    [CALL_SHEET_STATUS.CANCELLED]: {
        label: 'Cancelled',
        color: 'red',
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
    },
};

// Department options for call times
export const DEPARTMENTS = [
    { id: 'camera', name: 'Camera', color: '#3B82F6' },
    { id: 'sound', name: 'Sound', color: '#8B5CF6' },
    { id: 'lighting', name: 'Lighting', color: '#F59E0B' },
    { id: 'grip', name: 'Grip', color: '#6B7280' },
    { id: 'art', name: 'Art', color: '#EC4899' },
    { id: 'wardrobe', name: 'Wardrobe', color: '#14B8A6' },
    { id: 'makeup', name: 'Hair & Makeup', color: '#F43F5E' },
    { id: 'production', name: 'Production', color: '#10B981' },
    { id: 'transport', name: 'Transport', color: '#64748B' },
    { id: 'catering', name: 'Catering', color: '#F97316' },
];

// Convert DB format to local format
function fromDbFormat(record) {
    return {
        id: record.id,
        projectId: record.project_id,
        projectName: record.project_name || record.linked_project_name,
        productionCompany: record.production_company,
        productionTitle: record.production_title,
        episodeTitle: record.episode_title,
        episodeNumber: record.episode_number,
        director: record.director,
        producer: record.producer,
        productionManager: record.production_manager,
        shootDate: record.shoot_date,
        dayNumber: record.day_number,
        totalDays: record.total_days,
        generalCallTime: record.general_call_time,
        firstShotTime: record.first_shot_time,
        estimatedWrap: record.estimated_wrap,
        actualWrap: record.actual_wrap,
        locationName: record.location_name,
        locationAddress: record.location_address,
        locationCity: record.location_city,
        locationCountry: record.location_country,
        locationCoordinates: record.location_coordinates,
        locationContactName: record.location_contact_name,
        locationContactPhone: record.location_contact_phone,
        locationNotes: record.location_notes,
        parkingInfo: record.parking_info,
        baseCampLocation: record.base_camp_location,
        additionalLocations: record.additional_locations || [],
        weatherForecast: record.weather_forecast,
        weatherNotes: record.weather_notes,
        hospitalName: record.hospital_name,
        hospitalAddress: record.hospital_address,
        hospitalPhone: record.hospital_phone,
        hospitalDistance: record.hospital_distance,
        emergencyContacts: record.emergency_contacts || [],
        breakfastTime: record.breakfast_time,
        breakfastLocation: record.breakfast_location,
        lunchTime: record.lunch_time,
        lunchLocation: record.lunch_location,
        cateringCompany: record.catering_company,
        cateringContact: record.catering_contact,
        dietaryNotes: record.dietary_notes,
        schedule: record.schedule || [],
        importantNotes: record.important_notes,
        safetyNotes: record.safety_notes,
        wardrobeNotes: record.wardrobe_notes,
        makeupNotes: record.makeup_notes,
        transportNotes: record.transport_notes,
        equipmentNotes: record.equipment_notes,
        mapUrl: record.map_url,
        mapImagePath: record.map_image_path,
        attachments: record.attachments || [],
        status: record.status || 'draft',
        publishedAt: record.published_at,
        publishedBy: record.published_by,
        version: record.version || 1,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        createdBy: record.created_by,
        // From extended view
        projectClient: record.project_client,
        crewCount: record.crew_count || 0,
        crewConfirmedCount: record.crew_confirmed_count || 0,
        castCount: record.cast_count || 0,
        departmentCount: record.department_count || 0,
        displayStatus: record.display_status,
        daysUntilShoot: record.days_until_shoot,
    };
}

// Convert local format to DB format
function toDbFormat(callSheet) {
    const dbData = {};

    if (callSheet.projectId !== undefined) dbData.project_id = callSheet.projectId;
    if (callSheet.projectName !== undefined) dbData.project_name = callSheet.projectName;
    if (callSheet.productionCompany !== undefined) dbData.production_company = callSheet.productionCompany;
    if (callSheet.productionTitle !== undefined) dbData.production_title = callSheet.productionTitle;
    if (callSheet.episodeTitle !== undefined) dbData.episode_title = callSheet.episodeTitle;
    if (callSheet.episodeNumber !== undefined) dbData.episode_number = callSheet.episodeNumber;
    if (callSheet.director !== undefined) dbData.director = callSheet.director;
    if (callSheet.producer !== undefined) dbData.producer = callSheet.producer;
    if (callSheet.productionManager !== undefined) dbData.production_manager = callSheet.productionManager;
    if (callSheet.shootDate !== undefined) dbData.shoot_date = callSheet.shootDate;
    if (callSheet.dayNumber !== undefined) dbData.day_number = callSheet.dayNumber;
    if (callSheet.totalDays !== undefined) dbData.total_days = callSheet.totalDays;
    if (callSheet.generalCallTime !== undefined) dbData.general_call_time = callSheet.generalCallTime;
    if (callSheet.firstShotTime !== undefined) dbData.first_shot_time = callSheet.firstShotTime;
    if (callSheet.estimatedWrap !== undefined) dbData.estimated_wrap = callSheet.estimatedWrap;
    if (callSheet.actualWrap !== undefined) dbData.actual_wrap = callSheet.actualWrap;
    if (callSheet.locationName !== undefined) dbData.location_name = callSheet.locationName;
    if (callSheet.locationAddress !== undefined) dbData.location_address = callSheet.locationAddress;
    if (callSheet.locationCity !== undefined) dbData.location_city = callSheet.locationCity;
    if (callSheet.locationCountry !== undefined) dbData.location_country = callSheet.locationCountry;
    if (callSheet.locationCoordinates !== undefined) dbData.location_coordinates = callSheet.locationCoordinates;
    if (callSheet.locationContactName !== undefined) dbData.location_contact_name = callSheet.locationContactName;
    if (callSheet.locationContactPhone !== undefined) dbData.location_contact_phone = callSheet.locationContactPhone;
    if (callSheet.locationNotes !== undefined) dbData.location_notes = callSheet.locationNotes;
    if (callSheet.parkingInfo !== undefined) dbData.parking_info = callSheet.parkingInfo;
    if (callSheet.baseCampLocation !== undefined) dbData.base_camp_location = callSheet.baseCampLocation;
    if (callSheet.additionalLocations !== undefined) dbData.additional_locations = callSheet.additionalLocations;
    if (callSheet.weatherForecast !== undefined) dbData.weather_forecast = callSheet.weatherForecast;
    if (callSheet.weatherNotes !== undefined) dbData.weather_notes = callSheet.weatherNotes;
    if (callSheet.hospitalName !== undefined) dbData.hospital_name = callSheet.hospitalName;
    if (callSheet.hospitalAddress !== undefined) dbData.hospital_address = callSheet.hospitalAddress;
    if (callSheet.hospitalPhone !== undefined) dbData.hospital_phone = callSheet.hospitalPhone;
    if (callSheet.hospitalDistance !== undefined) dbData.hospital_distance = callSheet.hospitalDistance;
    if (callSheet.emergencyContacts !== undefined) dbData.emergency_contacts = callSheet.emergencyContacts;
    if (callSheet.breakfastTime !== undefined) dbData.breakfast_time = callSheet.breakfastTime;
    if (callSheet.breakfastLocation !== undefined) dbData.breakfast_location = callSheet.breakfastLocation;
    if (callSheet.lunchTime !== undefined) dbData.lunch_time = callSheet.lunchTime;
    if (callSheet.lunchLocation !== undefined) dbData.lunch_location = callSheet.lunchLocation;
    if (callSheet.cateringCompany !== undefined) dbData.catering_company = callSheet.cateringCompany;
    if (callSheet.cateringContact !== undefined) dbData.catering_contact = callSheet.cateringContact;
    if (callSheet.dietaryNotes !== undefined) dbData.dietary_notes = callSheet.dietaryNotes;
    if (callSheet.schedule !== undefined) dbData.schedule = callSheet.schedule;
    if (callSheet.importantNotes !== undefined) dbData.important_notes = callSheet.importantNotes;
    if (callSheet.safetyNotes !== undefined) dbData.safety_notes = callSheet.safetyNotes;
    if (callSheet.wardrobeNotes !== undefined) dbData.wardrobe_notes = callSheet.wardrobeNotes;
    if (callSheet.makeupNotes !== undefined) dbData.makeup_notes = callSheet.makeupNotes;
    if (callSheet.transportNotes !== undefined) dbData.transport_notes = callSheet.transportNotes;
    if (callSheet.equipmentNotes !== undefined) dbData.equipment_notes = callSheet.equipmentNotes;
    if (callSheet.mapUrl !== undefined) dbData.map_url = callSheet.mapUrl;
    if (callSheet.mapImagePath !== undefined) dbData.map_image_path = callSheet.mapImagePath;
    if (callSheet.attachments !== undefined) dbData.attachments = callSheet.attachments;
    if (callSheet.status !== undefined) dbData.status = callSheet.status;
    if (callSheet.publishedAt !== undefined) dbData.published_at = callSheet.publishedAt;
    if (callSheet.publishedBy !== undefined) dbData.published_by = callSheet.publishedBy;

    return dbData;
}

// Convert crew entry from DB
function crewFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        crewId: record.crew_id,
        name: record.name,
        roleTitle: record.role_title,
        department: record.department,
        phone: record.phone || record.crew_phone,
        email: record.email || record.crew_email,
        callTime: record.call_time,
        callLocation: record.call_location,
        transportMode: record.transport_mode,
        pickupTime: record.pickup_time,
        pickupLocation: record.pickup_location,
        notes: record.notes,
        confirmed: record.confirmed || false,
        confirmedAt: record.confirmed_at,
        sortOrder: record.sort_order || 0,
        // Extended
        firstName: record.first_name,
        lastName: record.last_name,
        departmentColor: record.department_color,
    };
}

// Convert cast entry from DB
function castFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        name: record.name,
        characterName: record.character_name,
        agentContact: record.agent_contact,
        pickupTime: record.pickup_time,
        pickupLocation: record.pickup_location,
        makeupCall: record.makeup_call,
        wardrobeCall: record.wardrobe_call,
        onSetCall: record.on_set_call,
        scenes: record.scenes || [],
        wardrobeNotes: record.wardrobe_notes,
        makeupNotes: record.makeup_notes,
        notes: record.notes,
        confirmed: record.confirmed || false,
        confirmedAt: record.confirmed_at,
        sortOrder: record.sort_order || 0,
    };
}

export const useCallSheetStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        callSheets: [],
        currentCallSheet: null,
        currentCrew: [],
        currentCast: [],
        currentDepartmentCalls: [],
        templates: [],
        loading: false,
        error: null,

        // Initialize - load all call sheets
        initialize: async () => {
            if (!isSupabaseConfigured()) {
                set({ loading: false, error: 'Supabase not configured' });
                return;
            }

            set({ loading: true, error: null });

            try {
                // Load call sheets using extended view
                let { data, error } = await supabase
                    .from('call_sheets_extended')
                    .select('*')
                    .order('shoot_date', { ascending: true });

                if (error && error.code === '42P01') {
                    const result = await supabase
                        .from('call_sheets')
                        .select('*')
                        .order('shoot_date', { ascending: true });
                    data = result.data;
                    error = result.error;
                }

                if (error) throw error;

                const callSheets = (data || []).map(fromDbFormat);
                set({ callSheets, loading: false, error: null });

                // Load templates
                const { data: templatesData } = await supabase
                    .from('call_sheet_templates')
                    .select('*')
                    .eq('is_active', true)
                    .order('name');

                if (templatesData) {
                    set({ templates: templatesData });
                }

            } catch (e) {
                console.error('Failed to load call sheets:', e);
                set({ loading: false, error: e.message });
            }
        },

        // Load a single call sheet with all details
        loadCallSheet: async (id) => {
            if (!isSupabaseConfigured()) return null;

            try {
                // Load main call sheet
                const { data: sheetData, error: sheetError } = await supabase
                    .from('call_sheets')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (sheetError) throw sheetError;

                // Load crew
                let { data: crewData } = await supabase
                    .from('call_sheet_crew_extended')
                    .select('*')
                    .eq('call_sheet_id', id)
                    .order('sort_order');

                if (!crewData) {
                    const result = await supabase
                        .from('call_sheet_crew')
                        .select('*')
                        .eq('call_sheet_id', id)
                        .order('sort_order');
                    crewData = result.data;
                }

                // Load cast
                const { data: castData } = await supabase
                    .from('call_sheet_cast')
                    .select('*')
                    .eq('call_sheet_id', id)
                    .order('sort_order');

                // Load department calls
                const { data: deptData } = await supabase
                    .from('call_sheet_department_calls')
                    .select('*')
                    .eq('call_sheet_id', id)
                    .order('sort_order');

                const callSheet = fromDbFormat(sheetData);
                const crew = (crewData || []).map(crewFromDbFormat);
                const cast = (castData || []).map(castFromDbFormat);
                const departmentCalls = deptData || [];

                set({
                    currentCallSheet: callSheet,
                    currentCrew: crew,
                    currentCast: cast,
                    currentDepartmentCalls: departmentCalls,
                });

                return { callSheet, crew, cast, departmentCalls };
            } catch (e) {
                console.error('Failed to load call sheet:', e);
                return null;
            }
        },

        // Create new call sheet
        createCallSheet: async (data) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbData = toDbFormat(data);

            const { data: result, error } = await supabase
                .from('call_sheets')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newCallSheet = fromDbFormat(result);
            set((state) => ({
                callSheets: [...state.callSheets, newCallSheet].sort(
                    (a, b) => new Date(a.shootDate) - new Date(b.shootDate)
                ),
            }));

            return newCallSheet;
        },

        // Update call sheet
        updateCallSheet: async (id, updates) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbUpdates = toDbFormat(updates);

            const { data, error } = await supabase
                .from('call_sheets')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = fromDbFormat(data);
            set((state) => ({
                callSheets: state.callSheets.map(cs => cs.id === id ? { ...cs, ...updated } : cs),
                currentCallSheet: state.currentCallSheet?.id === id ? { ...state.currentCallSheet, ...updated } : state.currentCallSheet,
            }));

            return updated;
        },

        // Delete call sheet
        deleteCallSheet: async (id) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const { error } = await supabase
                .from('call_sheets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                callSheets: state.callSheets.filter(cs => cs.id !== id),
                currentCallSheet: state.currentCallSheet?.id === id ? null : state.currentCallSheet,
            }));
        },

        // Publish call sheet
        publishCallSheet: async (id, userId = null) => {
            return get().updateCallSheet(id, {
                status: CALL_SHEET_STATUS.PUBLISHED,
                publishedAt: new Date().toISOString(),
                publishedBy: userId,
            });
        },

        // Mark as completed
        completeCallSheet: async (id, actualWrap = null) => {
            return get().updateCallSheet(id, {
                status: CALL_SHEET_STATUS.COMPLETED,
                actualWrap,
            });
        },

        // Duplicate call sheet for next day
        duplicateCallSheet: async (id, newShootDate, newDayNumber = null) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            try {
                const { data, error } = await supabase.rpc('duplicate_call_sheet', {
                    p_call_sheet_id: id,
                    p_new_shoot_date: newShootDate,
                    p_new_day_number: newDayNumber,
                });

                if (error) throw error;

                // Reload call sheets
                await get().initialize();

                return data;
            } catch (e) {
                console.error('Failed to duplicate call sheet:', e);
                throw e;
            }
        },

        // Add crew member to call sheet
        addCrewMember: async (callSheetId, crewData) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbData = {
                call_sheet_id: callSheetId,
                crew_id: crewData.crewId,
                name: crewData.name,
                role_title: crewData.roleTitle,
                department: crewData.department,
                phone: crewData.phone,
                email: crewData.email,
                call_time: crewData.callTime,
                call_location: crewData.callLocation,
                transport_mode: crewData.transportMode,
                pickup_time: crewData.pickupTime,
                pickup_location: crewData.pickupLocation,
                notes: crewData.notes,
                sort_order: crewData.sortOrder || 0,
            };

            const { data, error } = await supabase
                .from('call_sheet_crew')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newCrew = crewFromDbFormat(data);
            set((state) => ({
                currentCrew: [...state.currentCrew, newCrew],
            }));

            return newCrew;
        },

        // Update crew member
        updateCrewMember: async (id, updates) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbUpdates = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.roleTitle !== undefined) dbUpdates.role_title = updates.roleTitle;
            if (updates.department !== undefined) dbUpdates.department = updates.department;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.callTime !== undefined) dbUpdates.call_time = updates.callTime;
            if (updates.callLocation !== undefined) dbUpdates.call_location = updates.callLocation;
            if (updates.transportMode !== undefined) dbUpdates.transport_mode = updates.transportMode;
            if (updates.pickupTime !== undefined) dbUpdates.pickup_time = updates.pickupTime;
            if (updates.pickupLocation !== undefined) dbUpdates.pickup_location = updates.pickupLocation;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.confirmed !== undefined) {
                dbUpdates.confirmed = updates.confirmed;
                dbUpdates.confirmed_at = updates.confirmed ? new Date().toISOString() : null;
            }
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_crew')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = crewFromDbFormat(data);
            set((state) => ({
                currentCrew: state.currentCrew.map(c => c.id === id ? { ...c, ...updated } : c),
            }));

            return updated;
        },

        // Remove crew member
        removeCrewMember: async (id) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const { error } = await supabase
                .from('call_sheet_crew')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                currentCrew: state.currentCrew.filter(c => c.id !== id),
            }));
        },

        // Add cast member
        addCastMember: async (callSheetId, castData) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbData = {
                call_sheet_id: callSheetId,
                name: castData.name,
                character_name: castData.characterName,
                agent_contact: castData.agentContact,
                pickup_time: castData.pickupTime,
                pickup_location: castData.pickupLocation,
                makeup_call: castData.makeupCall,
                wardrobe_call: castData.wardrobeCall,
                on_set_call: castData.onSetCall,
                scenes: castData.scenes || [],
                wardrobe_notes: castData.wardrobeNotes,
                makeup_notes: castData.makeupNotes,
                notes: castData.notes,
                sort_order: castData.sortOrder || 0,
            };

            const { data, error } = await supabase
                .from('call_sheet_cast')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newCast = castFromDbFormat(data);
            set((state) => ({
                currentCast: [...state.currentCast, newCast],
            }));

            return newCast;
        },

        // Update cast member
        updateCastMember: async (id, updates) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const dbUpdates = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.characterName !== undefined) dbUpdates.character_name = updates.characterName;
            if (updates.agentContact !== undefined) dbUpdates.agent_contact = updates.agentContact;
            if (updates.pickupTime !== undefined) dbUpdates.pickup_time = updates.pickupTime;
            if (updates.pickupLocation !== undefined) dbUpdates.pickup_location = updates.pickupLocation;
            if (updates.makeupCall !== undefined) dbUpdates.makeup_call = updates.makeupCall;
            if (updates.wardrobeCall !== undefined) dbUpdates.wardrobe_call = updates.wardrobeCall;
            if (updates.onSetCall !== undefined) dbUpdates.on_set_call = updates.onSetCall;
            if (updates.scenes !== undefined) dbUpdates.scenes = updates.scenes;
            if (updates.wardrobeNotes !== undefined) dbUpdates.wardrobe_notes = updates.wardrobeNotes;
            if (updates.makeupNotes !== undefined) dbUpdates.makeup_notes = updates.makeupNotes;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.confirmed !== undefined) {
                dbUpdates.confirmed = updates.confirmed;
                dbUpdates.confirmed_at = updates.confirmed ? new Date().toISOString() : null;
            }
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_cast')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = castFromDbFormat(data);
            set((state) => ({
                currentCast: state.currentCast.map(c => c.id === id ? { ...c, ...updated } : c),
            }));

            return updated;
        },

        // Remove cast member
        removeCastMember: async (id) => {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase not configured');
            }

            const { error } = await supabase
                .from('call_sheet_cast')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                currentCast: state.currentCast.filter(c => c.id !== id),
            }));
        },

        // Get upcoming call sheets
        getUpcoming: () => {
            const { callSheets } = get();
            const today = new Date().toISOString().split('T')[0];
            return callSheets.filter(cs =>
                cs.shootDate >= today &&
                cs.status !== CALL_SHEET_STATUS.CANCELLED &&
                cs.status !== CALL_SHEET_STATUS.COMPLETED
            );
        },

        // Get today's call sheets
        getToday: () => {
            const { callSheets } = get();
            const today = new Date().toISOString().split('T')[0];
            return callSheets.filter(cs =>
                cs.shootDate === today &&
                cs.status !== CALL_SHEET_STATUS.CANCELLED
            );
        },

        // Get call sheets for project
        getForProject: (projectId) => {
            const { callSheets } = get();
            return callSheets.filter(cs => cs.projectId === projectId);
        },

        // Get stats
        getStats: () => {
            const { callSheets } = get();
            const today = new Date().toISOString().split('T')[0];

            const upcoming = callSheets.filter(cs =>
                cs.shootDate >= today &&
                cs.status !== CALL_SHEET_STATUS.CANCELLED
            );

            const todaySheets = callSheets.filter(cs =>
                cs.shootDate === today &&
                cs.status !== CALL_SHEET_STATUS.CANCELLED
            );

            const drafts = callSheets.filter(cs => cs.status === CALL_SHEET_STATUS.DRAFT);

            const thisWeek = callSheets.filter(cs => {
                const date = new Date(cs.shootDate);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return date >= new Date(today) && date <= weekFromNow && cs.status !== CALL_SHEET_STATUS.CANCELLED;
            });

            return {
                total: callSheets.length,
                upcoming: upcoming.length,
                today: todaySheets.length,
                drafts: drafts.length,
                thisWeek: thisWeek.length,
            };
        },

        // Clear current
        clearCurrent: () => {
            set({
                currentCallSheet: null,
                currentCrew: [],
                currentCast: [],
                currentDepartmentCalls: [],
            });
        },
    }))
);
