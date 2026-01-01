import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import logger from '../../../utils/logger';
import {
    fromDbFormat,
    crewFromDbFormat,
    castFromDbFormat,
    accommodationFromDbFormat,
    roomAssignmentFromDbFormat,
    flightFromDbFormat,
    transferFromDbFormat,
    vehicleFromDbFormat,
    technicalFromDbFormat,
    vendorFromDbFormat,
    emergencyContactFromDbFormat,
    cateringFromDbFormat,
    weatherFromDbFormat,
} from '../callSheetFormatters';
import { CALL_SHEET_STATUS } from '../callSheetConstants';

export const createCoreSlice = (set, get) => ({
    // State
    callSheets: [],
    currentCallSheet: null,
    currentCrew: [],
    currentCast: [],
    currentDepartmentCalls: [],
    currentAccommodation: [],
    currentRoomAssignments: [],
    currentFlights: [],
    currentTransfers: [],
    currentVehicles: [],
    currentTechnical: null,
    currentVendors: [],
    currentEmergencyContacts: [],
    currentCatering: [],
    currentWeather: [],
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
            logger.error('Failed to load call sheets:', e);
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

            // Load accommodation
            const { data: accommodationData } = await supabase
                .from('call_sheet_accommodation')
                .select('*')
                .eq('call_sheet_id', id)
                .order('sort_order');

            // Load room assignments for all accommodations
            const accommodationIds = (accommodationData || []).map(a => a.id);
            let roomAssignmentData = [];
            if (accommodationIds.length > 0) {
                const { data: rooms } = await supabase
                    .from('call_sheet_room_assignments')
                    .select('*')
                    .in('accommodation_id', accommodationIds)
                    .order('check_in_date');
                roomAssignmentData = rooms || [];
            }

            // Load flights
            const { data: flightsData } = await supabase
                .from('call_sheet_flights')
                .select('*')
                .eq('call_sheet_id', id)
                .order('departure_date', { ascending: true });

            // Load transfers
            const { data: transfersData } = await supabase
                .from('call_sheet_transfers')
                .select('*')
                .eq('call_sheet_id', id)
                .order('transfer_date', { ascending: true });

            // Load vehicles
            const { data: vehiclesData } = await supabase
                .from('call_sheet_vehicles')
                .select('*')
                .eq('call_sheet_id', id)
                .order('sort_order');

            // Load technical plan
            const { data: technicalData } = await supabase
                .from('call_sheet_technical')
                .select('*')
                .eq('call_sheet_id', id)
                .maybeSingle();

            // Load vendors
            const { data: vendorsData } = await supabase
                .from('call_sheet_vendors')
                .select('*')
                .eq('call_sheet_id', id)
                .order('sort_order');

            // Load emergency contacts
            const { data: emergencyData } = await supabase
                .from('call_sheet_emergency_contacts')
                .select('*')
                .eq('call_sheet_id', id)
                .order('sort_order');

            // Load catering
            const { data: cateringData } = await supabase
                .from('call_sheet_catering')
                .select('*')
                .eq('call_sheet_id', id)
                .order('sort_order');

            // Load weather
            const { data: weatherData } = await supabase
                .from('call_sheet_weather')
                .select('*')
                .eq('call_sheet_id', id)
                .order('forecast_date');

            const callSheet = fromDbFormat(sheetData);
            const crew = (crewData || []).map(crewFromDbFormat);
            const cast = (castData || []).map(castFromDbFormat);
            const departmentCalls = deptData || [];
            const accommodation = (accommodationData || []).map(accommodationFromDbFormat);
            const roomAssignments = roomAssignmentData.map(roomAssignmentFromDbFormat);
            const flights = (flightsData || []).map(flightFromDbFormat);
            const transfers = (transfersData || []).map(transferFromDbFormat);
            const vehicles = (vehiclesData || []).map(vehicleFromDbFormat);
            const technical = technicalData ? technicalFromDbFormat(technicalData) : null;
            const vendors = (vendorsData || []).map(vendorFromDbFormat);
            const emergencyContacts = (emergencyData || []).map(emergencyContactFromDbFormat);
            const catering = (cateringData || []).map(cateringFromDbFormat);
            const weather = (weatherData || []).map(weatherFromDbFormat);

            set({
                currentCallSheet: callSheet,
                currentCrew: crew,
                currentCast: cast,
                currentDepartmentCalls: departmentCalls,
                currentAccommodation: accommodation,
                currentRoomAssignments: roomAssignments,
                currentFlights: flights,
                currentTransfers: transfers,
                currentVehicles: vehicles,
                currentTechnical: technical,
                currentVendors: vendors,
                currentEmergencyContacts: emergencyContacts,
                currentCatering: catering,
                currentWeather: weather,
            });

            return { callSheet, crew, cast, departmentCalls, accommodation, roomAssignments, flights, transfers, vehicles, technical, vendors, emergencyContacts, catering, weather };
        } catch (e) {
            logger.error('Failed to load call sheet:', e);
            return null;
        }
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
            currentAccommodation: [],
            currentRoomAssignments: [],
            currentFlights: [],
            currentTransfers: [],
            currentVehicles: [],
            currentTechnical: null,
            currentVendors: [],
            currentEmergencyContacts: [],
            currentCatering: [],
            currentWeather: [],
        });
    },
});
