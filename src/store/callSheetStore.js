import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useCrewBookingStore } from './crewBookingStore';

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
        // New enhanced fields
        timeZone: record.time_zone,
        timeZoneOffset: record.time_zone_offset,
        homeBaseTimezone: record.home_base_timezone,
        perDiemAmount: record.per_diem_amount,
        perDiemCurrency: record.per_diem_currency,
        perDiemNotes: record.per_diem_notes,
        dressCode: record.dress_code || [],
        localCurrency: record.local_currency,
        exchangeRate: record.exchange_rate,
        currencyNotes: record.currency_notes,
        accreditationNotes: record.accreditation_notes,
        accreditationCollectionPoint: record.accreditation_collection_point,
        accessRestrictions: record.access_restrictions,
        insuranceInfo: record.insurance_info || {},
        riskAssessmentUrl: record.risk_assessment_url,
        riskAssessmentNotes: record.risk_assessment_notes,
        invoicingEmail: record.invoicing_email,
        invoicingNotes: record.invoicing_notes,
        customsNotes: record.customs_notes,
        carnetInfo: record.carnet_info || [],
        travelAdviceUrl: record.travel_advice_url,
        visaRequirements: record.visa_requirements,
        embassyInfo: record.embassy_info || {},
        internationalDialingCode: record.international_dialing_code,
        wifiInfo: record.wifi_info,
        mobileNetworkNotes: record.mobile_network_notes,
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
    // New enhanced fields
    if (callSheet.timeZone !== undefined) dbData.time_zone = callSheet.timeZone;
    if (callSheet.timeZoneOffset !== undefined) dbData.time_zone_offset = callSheet.timeZoneOffset;
    if (callSheet.homeBaseTimezone !== undefined) dbData.home_base_timezone = callSheet.homeBaseTimezone;
    if (callSheet.perDiemAmount !== undefined) dbData.per_diem_amount = callSheet.perDiemAmount;
    if (callSheet.perDiemCurrency !== undefined) dbData.per_diem_currency = callSheet.perDiemCurrency;
    if (callSheet.perDiemNotes !== undefined) dbData.per_diem_notes = callSheet.perDiemNotes;
    if (callSheet.dressCode !== undefined) dbData.dress_code = callSheet.dressCode;
    if (callSheet.localCurrency !== undefined) dbData.local_currency = callSheet.localCurrency;
    if (callSheet.exchangeRate !== undefined) dbData.exchange_rate = callSheet.exchangeRate;
    if (callSheet.currencyNotes !== undefined) dbData.currency_notes = callSheet.currencyNotes;
    if (callSheet.accreditationNotes !== undefined) dbData.accreditation_notes = callSheet.accreditationNotes;
    if (callSheet.accreditationCollectionPoint !== undefined) dbData.accreditation_collection_point = callSheet.accreditationCollectionPoint;
    if (callSheet.accessRestrictions !== undefined) dbData.access_restrictions = callSheet.accessRestrictions;
    if (callSheet.insuranceInfo !== undefined) dbData.insurance_info = callSheet.insuranceInfo;
    if (callSheet.riskAssessmentUrl !== undefined) dbData.risk_assessment_url = callSheet.riskAssessmentUrl;
    if (callSheet.riskAssessmentNotes !== undefined) dbData.risk_assessment_notes = callSheet.riskAssessmentNotes;
    if (callSheet.invoicingEmail !== undefined) dbData.invoicing_email = callSheet.invoicingEmail;
    if (callSheet.invoicingNotes !== undefined) dbData.invoicing_notes = callSheet.invoicingNotes;
    if (callSheet.customsNotes !== undefined) dbData.customs_notes = callSheet.customsNotes;
    if (callSheet.carnetInfo !== undefined) dbData.carnet_info = callSheet.carnetInfo;
    if (callSheet.travelAdviceUrl !== undefined) dbData.travel_advice_url = callSheet.travelAdviceUrl;
    if (callSheet.visaRequirements !== undefined) dbData.visa_requirements = callSheet.visaRequirements;
    if (callSheet.embassyInfo !== undefined) dbData.embassy_info = callSheet.embassyInfo;
    if (callSheet.internationalDialingCode !== undefined) dbData.international_dialing_code = callSheet.internationalDialingCode;
    if (callSheet.wifiInfo !== undefined) dbData.wifi_info = callSheet.wifiInfo;
    if (callSheet.mobileNetworkNotes !== undefined) dbData.mobile_network_notes = callSheet.mobileNetworkNotes;

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

// Convert accommodation from DB
function accommodationFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        hotelName: record.hotel_name,
        hotelAddress: record.hotel_address,
        hotelCity: record.hotel_city,
        hotelCountry: record.hotel_country,
        hotelPhone: record.hotel_phone,
        hotelWebsite: record.hotel_website,
        hotelEmail: record.hotel_email,
        distanceFromVenue: record.distance_from_venue,
        distanceFromAirport: record.distance_from_airport,
        breakfastIncluded: record.breakfast_included,
        wifiAvailable: record.wifi_available,
        parkingAvailable: record.parking_available,
        bookingReference: record.booking_reference,
        bookingContact: record.booking_contact,
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time,
        paymentStatus: record.payment_status,
        paymentNotes: record.payment_notes,
        notes: record.notes,
        sortOrder: record.sort_order || 0,
    };
}

// Convert room assignment from DB
function roomAssignmentFromDbFormat(record) {
    return {
        id: record.id,
        accommodationId: record.accommodation_id,
        crewId: record.crew_id,
        crewName: record.crew_name,
        checkInDate: record.check_in_date,
        checkOutDate: record.check_out_date,
        roomNumber: record.room_number,
        roomType: record.room_type,
        earlyCheckIn: record.early_check_in,
        lateCheckOut: record.late_check_out,
        notes: record.notes,
    };
}

// Convert flight from DB
function flightFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        crewId: record.crew_id,
        crewName: record.crew_name,
        flightType: record.flight_type,
        bookingReference: record.booking_reference,
        flightNumber: record.flight_number,
        airline: record.airline,
        departureDate: record.departure_date,
        departureTime: record.departure_time,
        departureAirport: record.departure_airport,
        departureTerminal: record.departure_terminal,
        arrivalDate: record.arrival_date,
        arrivalTime: record.arrival_time,
        arrivalAirport: record.arrival_airport,
        arrivalTerminal: record.arrival_terminal,
        hasConnection: record.has_connection,
        connectionAirport: record.connection_airport,
        connectionFlightNumber: record.connection_flight_number,
        connectionDepartureTime: record.connection_departure_time,
        notes: record.notes,
        sortOrder: record.sort_order || 0,
    };
}

// Convert transfer from DB
function transferFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        transferDate: record.transfer_date,
        transferTime: record.transfer_time,
        pickupLocation: record.pickup_location,
        dropoffLocation: record.dropoff_location,
        transportType: record.transport_type,
        vehicleDetails: record.vehicle_details,
        capacity: record.capacity,
        providerCompany: record.provider_company,
        driverName: record.driver_name,
        driverPhone: record.driver_phone,
        passengers: record.passengers || [],
        maxPassengers: record.max_passengers,
        notes: record.notes,
        sortOrder: record.sort_order || 0,
    };
}

// Convert vehicle from DB
function vehicleFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        vehicleType: record.vehicle_type,
        vehicleName: record.vehicle_name,
        licensePlate: record.license_plate,
        lengthMeters: record.length_meters,
        widthMeters: record.width_meters,
        heightMeters: record.height_meters,
        company: record.company,
        driverName: record.driver_name,
        driverPhone: record.driver_phone,
        assignedLocation: record.assigned_location,
        parkingSpot: record.parking_spot,
        arrivalTime: record.arrival_time,
        departureTime: record.departure_time,
        notes: record.notes,
        overnightSecurity: record.overnight_security,
        sortOrder: record.sort_order || 0,
    };
}

// Convert technical plan from DB
function technicalFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        cameraPositions: record.camera_positions || [],
        cableRuns: record.cable_runs || [],
        audioSetup: record.audio_setup || {},
        videoRouting: record.video_routing || [],
        graphicsSetup: record.graphics_setup,
        vtSetup: record.vt_setup,
        commsSetup: record.comms_setup,
        radioChannels: record.radio_channels || [],
        recordingSetup: record.recording_setup || [],
        monitors: record.monitors || [],
        lightingSetup: record.lighting_setup,
        powerRequirements: record.power_requirements,
        generatorInfo: record.generator_info,
        uplinkInfo: record.uplink_info,
        internetInfo: record.internet_info,
        notes: record.notes,
    };
}

// Convert vendor from DB
function vendorFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        companyName: record.company_name,
        vendorType: record.vendor_type,
        contactName: record.contact_name,
        contactRole: record.contact_role,
        contactPhone: record.contact_phone,
        contactEmail: record.contact_email,
        additionalContacts: record.additional_contacts || [],
        notes: record.notes,
        onSite: record.on_site,
        sortOrder: record.sort_order || 0,
    };
}

// Convert emergency contact from DB
function emergencyContactFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        contactType: record.contact_type,
        name: record.name,
        organization: record.organization,
        phone: record.phone,
        phoneSecondary: record.phone_secondary,
        address: record.address,
        distanceFromVenue: record.distance_from_venue,
        notes: record.notes,
        is24Hour: record.is_24_hour,
        sortOrder: record.sort_order || 0,
    };
}

// Convert catering from DB
function cateringFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        mealType: record.meal_type,
        mealTime: record.meal_time,
        location: record.location,
        providerName: record.provider_name,
        providerPhone: record.provider_phone,
        headcount: record.headcount,
        dietaryNotes: record.dietary_notes,
        menuDescription: record.menu_description,
        costPerHead: record.cost_per_head,
        totalCost: record.total_cost,
        paymentStatus: record.payment_status,
        notes: record.notes,
        sortOrder: record.sort_order || 0,
    };
}

// Convert weather from DB
function weatherFromDbFormat(record) {
    return {
        id: record.id,
        callSheetId: record.call_sheet_id,
        forecastDate: record.forecast_date,
        condition: record.condition,
        conditionIcon: record.condition_icon,
        tempHighCelsius: record.temp_high_celsius,
        tempLowCelsius: record.temp_low_celsius,
        humidityPercent: record.humidity_percent,
        windSpeedKmh: record.wind_speed_kmh,
        windDirection: record.wind_direction,
        precipitationPercent: record.precipitation_percent,
        uvIndex: record.uv_index,
        sunrise: record.sunrise,
        sunset: record.sunset,
        notes: record.notes,
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
        // New enhanced state
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

            // Delete associated crew bookings first (hidden P&L feature)
            try {
                const crewBookingStore = useCrewBookingStore.getState();
                await crewBookingStore.deleteByCallSheet(id);
            } catch (bookingError) {
                console.warn('Failed to delete crew bookings for call sheet:', bookingError);
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

            // Auto-create crew booking for P&L tracking (hidden feature)
            try {
                const callSheet = get().currentCallSheet;
                if (callSheet) {
                    const crewBookingStore = useCrewBookingStore.getState();
                    await crewBookingStore.createBooking({
                        crewId: crewData.crewId || null,
                        projectId: callSheet.projectId || null,
                        callSheetId: callSheetId,
                        crewName: crewData.name || '',
                        crewRole: crewData.roleTitle || crewData.department || '',
                        dayRate: crewData.dayRate || 0,
                        days: 1, // Call sheet is typically 1 day
                        startDate: callSheet.shootDate,
                        endDate: callSheet.shootDate,
                        status: 'confirmed',
                        currency: crewData.currency || 'USD',
                    });
                }
            } catch (bookingError) {
                // Don't fail the crew addition if booking creation fails
                console.warn('Failed to create crew booking:', bookingError);
            }

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

            // Get crew member details before deletion for booking cleanup
            const crewMember = get().currentCrew.find(c => c.id === id);
            const callSheet = get().currentCallSheet;

            const { error } = await supabase
                .from('call_sheet_crew')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                currentCrew: state.currentCrew.filter(c => c.id !== id),
            }));

            // Delete associated crew booking (hidden P&L feature)
            if (crewMember && callSheet) {
                try {
                    const crewBookingStore = useCrewBookingStore.getState();
                    const bookings = crewBookingStore.getBookingsByCallSheet(callSheet.id);
                    const matchingBooking = bookings.find(
                        b => b.crewId === crewMember.crewId || b.crewName === crewMember.name
                    );
                    if (matchingBooking) {
                        await crewBookingStore.deleteBooking(matchingBooking.id);
                    }
                } catch (bookingError) {
                    console.warn('Failed to delete crew booking:', bookingError);
                }
            }
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

        // ============================================
        // ACCOMMODATION METHODS
        // ============================================
        addAccommodation: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                hotel_name: data.hotelName,
                hotel_address: data.hotelAddress,
                hotel_city: data.hotelCity,
                hotel_country: data.hotelCountry,
                hotel_phone: data.hotelPhone,
                hotel_website: data.hotelWebsite,
                hotel_email: data.hotelEmail,
                distance_from_venue: data.distanceFromVenue,
                distance_from_airport: data.distanceFromAirport,
                breakfast_included: data.breakfastIncluded,
                wifi_available: data.wifiAvailable,
                parking_available: data.parkingAvailable,
                booking_reference: data.bookingReference,
                booking_contact: data.bookingContact,
                check_in_time: data.checkInTime,
                check_out_time: data.checkOutTime,
                payment_status: data.paymentStatus,
                payment_notes: data.paymentNotes,
                notes: data.notes,
                sort_order: data.sortOrder || 0,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_accommodation')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newAccommodation = accommodationFromDbFormat(result);
            set(state => ({
                currentAccommodation: [...state.currentAccommodation, newAccommodation],
            }));
            return newAccommodation;
        },

        updateAccommodation: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.hotelName !== undefined) dbUpdates.hotel_name = updates.hotelName;
            if (updates.hotelAddress !== undefined) dbUpdates.hotel_address = updates.hotelAddress;
            if (updates.hotelCity !== undefined) dbUpdates.hotel_city = updates.hotelCity;
            if (updates.hotelCountry !== undefined) dbUpdates.hotel_country = updates.hotelCountry;
            if (updates.hotelPhone !== undefined) dbUpdates.hotel_phone = updates.hotelPhone;
            if (updates.hotelWebsite !== undefined) dbUpdates.hotel_website = updates.hotelWebsite;
            if (updates.hotelEmail !== undefined) dbUpdates.hotel_email = updates.hotelEmail;
            if (updates.distanceFromVenue !== undefined) dbUpdates.distance_from_venue = updates.distanceFromVenue;
            if (updates.distanceFromAirport !== undefined) dbUpdates.distance_from_airport = updates.distanceFromAirport;
            if (updates.breakfastIncluded !== undefined) dbUpdates.breakfast_included = updates.breakfastIncluded;
            if (updates.wifiAvailable !== undefined) dbUpdates.wifi_available = updates.wifiAvailable;
            if (updates.parkingAvailable !== undefined) dbUpdates.parking_available = updates.parkingAvailable;
            if (updates.bookingReference !== undefined) dbUpdates.booking_reference = updates.bookingReference;
            if (updates.bookingContact !== undefined) dbUpdates.booking_contact = updates.bookingContact;
            if (updates.checkInTime !== undefined) dbUpdates.check_in_time = updates.checkInTime;
            if (updates.checkOutTime !== undefined) dbUpdates.check_out_time = updates.checkOutTime;
            if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
            if (updates.paymentNotes !== undefined) dbUpdates.payment_notes = updates.paymentNotes;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_accommodation')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = accommodationFromDbFormat(data);
            set(state => ({
                currentAccommodation: state.currentAccommodation.map(a => a.id === id ? updated : a),
            }));
            return updated;
        },

        removeAccommodation: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_accommodation')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentAccommodation: state.currentAccommodation.filter(a => a.id !== id),
                currentRoomAssignments: state.currentRoomAssignments.filter(r => r.accommodationId !== id),
            }));
        },

        // Room Assignment Methods
        addRoomAssignment: async (accommodationId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                accommodation_id: accommodationId,
                crew_id: data.crewId,
                crew_name: data.crewName,
                check_in_date: data.checkInDate,
                check_out_date: data.checkOutDate,
                room_number: data.roomNumber,
                room_type: data.roomType,
                early_check_in: data.earlyCheckIn,
                late_check_out: data.lateCheckOut,
                notes: data.notes,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_room_assignments')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newRoom = roomAssignmentFromDbFormat(result);
            set(state => ({
                currentRoomAssignments: [...state.currentRoomAssignments, newRoom],
            }));
            return newRoom;
        },

        updateRoomAssignment: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.crewId !== undefined) dbUpdates.crew_id = updates.crewId;
            if (updates.crewName !== undefined) dbUpdates.crew_name = updates.crewName;
            if (updates.checkInDate !== undefined) dbUpdates.check_in_date = updates.checkInDate;
            if (updates.checkOutDate !== undefined) dbUpdates.check_out_date = updates.checkOutDate;
            if (updates.roomNumber !== undefined) dbUpdates.room_number = updates.roomNumber;
            if (updates.roomType !== undefined) dbUpdates.room_type = updates.roomType;
            if (updates.earlyCheckIn !== undefined) dbUpdates.early_check_in = updates.earlyCheckIn;
            if (updates.lateCheckOut !== undefined) dbUpdates.late_check_out = updates.lateCheckOut;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

            const { data, error } = await supabase
                .from('call_sheet_room_assignments')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = roomAssignmentFromDbFormat(data);
            set(state => ({
                currentRoomAssignments: state.currentRoomAssignments.map(r => r.id === id ? updated : r),
            }));
            return updated;
        },

        removeRoomAssignment: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_room_assignments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentRoomAssignments: state.currentRoomAssignments.filter(r => r.id !== id),
            }));
        },

        // ============================================
        // FLIGHT METHODS
        // ============================================
        addFlight: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                crew_id: data.crewId,
                crew_name: data.crewName,
                flight_type: data.flightType || 'outbound',
                booking_reference: data.bookingReference,
                flight_number: data.flightNumber,
                airline: data.airline,
                departure_date: data.departureDate,
                departure_time: data.departureTime,
                departure_airport: data.departureAirport,
                departure_terminal: data.departureTerminal,
                arrival_date: data.arrivalDate,
                arrival_time: data.arrivalTime,
                arrival_airport: data.arrivalAirport,
                arrival_terminal: data.arrivalTerminal,
                has_connection: data.hasConnection,
                connection_airport: data.connectionAirport,
                connection_flight_number: data.connectionFlightNumber,
                connection_departure_time: data.connectionDepartureTime,
                notes: data.notes,
                sort_order: data.sortOrder || 0,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_flights')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newFlight = flightFromDbFormat(result);
            set(state => ({
                currentFlights: [...state.currentFlights, newFlight],
            }));
            return newFlight;
        },

        updateFlight: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.crewId !== undefined) dbUpdates.crew_id = updates.crewId;
            if (updates.crewName !== undefined) dbUpdates.crew_name = updates.crewName;
            if (updates.flightType !== undefined) dbUpdates.flight_type = updates.flightType;
            if (updates.bookingReference !== undefined) dbUpdates.booking_reference = updates.bookingReference;
            if (updates.flightNumber !== undefined) dbUpdates.flight_number = updates.flightNumber;
            if (updates.airline !== undefined) dbUpdates.airline = updates.airline;
            if (updates.departureDate !== undefined) dbUpdates.departure_date = updates.departureDate;
            if (updates.departureTime !== undefined) dbUpdates.departure_time = updates.departureTime;
            if (updates.departureAirport !== undefined) dbUpdates.departure_airport = updates.departureAirport;
            if (updates.departureTerminal !== undefined) dbUpdates.departure_terminal = updates.departureTerminal;
            if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate;
            if (updates.arrivalTime !== undefined) dbUpdates.arrival_time = updates.arrivalTime;
            if (updates.arrivalAirport !== undefined) dbUpdates.arrival_airport = updates.arrivalAirport;
            if (updates.arrivalTerminal !== undefined) dbUpdates.arrival_terminal = updates.arrivalTerminal;
            if (updates.hasConnection !== undefined) dbUpdates.has_connection = updates.hasConnection;
            if (updates.connectionAirport !== undefined) dbUpdates.connection_airport = updates.connectionAirport;
            if (updates.connectionFlightNumber !== undefined) dbUpdates.connection_flight_number = updates.connectionFlightNumber;
            if (updates.connectionDepartureTime !== undefined) dbUpdates.connection_departure_time = updates.connectionDepartureTime;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_flights')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = flightFromDbFormat(data);
            set(state => ({
                currentFlights: state.currentFlights.map(f => f.id === id ? updated : f),
            }));
            return updated;
        },

        removeFlight: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_flights')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentFlights: state.currentFlights.filter(f => f.id !== id),
            }));
        },

        // ============================================
        // TRANSFER METHODS
        // ============================================
        addTransfer: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                transfer_date: data.transferDate,
                transfer_time: data.transferTime,
                pickup_location: data.pickupLocation,
                dropoff_location: data.dropoffLocation,
                transport_type: data.transportType || 'minibus',
                vehicle_details: data.vehicleDetails,
                capacity: data.capacity,
                provider_company: data.providerCompany,
                driver_name: data.driverName,
                driver_phone: data.driverPhone,
                passengers: data.passengers || [],
                max_passengers: data.maxPassengers,
                notes: data.notes,
                sort_order: data.sortOrder || 0,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_transfers')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newTransfer = transferFromDbFormat(result);
            set(state => ({
                currentTransfers: [...state.currentTransfers, newTransfer],
            }));
            return newTransfer;
        },

        updateTransfer: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.transferDate !== undefined) dbUpdates.transfer_date = updates.transferDate;
            if (updates.transferTime !== undefined) dbUpdates.transfer_time = updates.transferTime;
            if (updates.pickupLocation !== undefined) dbUpdates.pickup_location = updates.pickupLocation;
            if (updates.dropoffLocation !== undefined) dbUpdates.dropoff_location = updates.dropoffLocation;
            if (updates.transportType !== undefined) dbUpdates.transport_type = updates.transportType;
            if (updates.vehicleDetails !== undefined) dbUpdates.vehicle_details = updates.vehicleDetails;
            if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
            if (updates.providerCompany !== undefined) dbUpdates.provider_company = updates.providerCompany;
            if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName;
            if (updates.driverPhone !== undefined) dbUpdates.driver_phone = updates.driverPhone;
            if (updates.passengers !== undefined) dbUpdates.passengers = updates.passengers;
            if (updates.maxPassengers !== undefined) dbUpdates.max_passengers = updates.maxPassengers;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_transfers')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = transferFromDbFormat(data);
            set(state => ({
                currentTransfers: state.currentTransfers.map(t => t.id === id ? updated : t),
            }));
            return updated;
        },

        removeTransfer: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_transfers')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentTransfers: state.currentTransfers.filter(t => t.id !== id),
            }));
        },

        // ============================================
        // VEHICLE METHODS
        // ============================================
        addVehicle: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                vehicle_type: data.vehicleType,
                vehicle_name: data.vehicleName,
                license_plate: data.licensePlate,
                length_meters: data.lengthMeters,
                width_meters: data.widthMeters,
                height_meters: data.heightMeters,
                company: data.company,
                driver_name: data.driverName,
                driver_phone: data.driverPhone,
                assigned_location: data.assignedLocation,
                parking_spot: data.parkingSpot,
                arrival_time: data.arrivalTime,
                departure_time: data.departureTime,
                notes: data.notes,
                overnight_security: data.overnightSecurity,
                sort_order: data.sortOrder || 0,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_vehicles')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newVehicle = vehicleFromDbFormat(result);
            set(state => ({
                currentVehicles: [...state.currentVehicles, newVehicle],
            }));
            return newVehicle;
        },

        updateVehicle: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.vehicleType !== undefined) dbUpdates.vehicle_type = updates.vehicleType;
            if (updates.vehicleName !== undefined) dbUpdates.vehicle_name = updates.vehicleName;
            if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate;
            if (updates.lengthMeters !== undefined) dbUpdates.length_meters = updates.lengthMeters;
            if (updates.widthMeters !== undefined) dbUpdates.width_meters = updates.widthMeters;
            if (updates.heightMeters !== undefined) dbUpdates.height_meters = updates.heightMeters;
            if (updates.company !== undefined) dbUpdates.company = updates.company;
            if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName;
            if (updates.driverPhone !== undefined) dbUpdates.driver_phone = updates.driverPhone;
            if (updates.assignedLocation !== undefined) dbUpdates.assigned_location = updates.assignedLocation;
            if (updates.parkingSpot !== undefined) dbUpdates.parking_spot = updates.parkingSpot;
            if (updates.arrivalTime !== undefined) dbUpdates.arrival_time = updates.arrivalTime;
            if (updates.departureTime !== undefined) dbUpdates.departure_time = updates.departureTime;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.overnightSecurity !== undefined) dbUpdates.overnight_security = updates.overnightSecurity;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_vehicles')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = vehicleFromDbFormat(data);
            set(state => ({
                currentVehicles: state.currentVehicles.map(v => v.id === id ? updated : v),
            }));
            return updated;
        },

        removeVehicle: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_vehicles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentVehicles: state.currentVehicles.filter(v => v.id !== id),
            }));
        },

        // ============================================
        // TECHNICAL PLAN METHODS
        // ============================================
        saveTechnical: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                camera_positions: data.cameraPositions || [],
                cable_runs: data.cableRuns || [],
                audio_setup: data.audioSetup || {},
                video_routing: data.videoRouting || [],
                graphics_setup: data.graphicsSetup,
                vt_setup: data.vtSetup,
                comms_setup: data.commsSetup,
                radio_channels: data.radioChannels || [],
                recording_setup: data.recordingSetup || [],
                monitors: data.monitors || [],
                lighting_setup: data.lightingSetup,
                power_requirements: data.powerRequirements,
                generator_info: data.generatorInfo,
                uplink_info: data.uplinkInfo,
                internet_info: data.internetInfo,
                notes: data.notes,
            };

            const existing = get().currentTechnical;

            if (existing) {
                // Update existing
                const { data: result, error } = await supabase
                    .from('call_sheet_technical')
                    .update(dbData)
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;

                const updated = technicalFromDbFormat(result);
                set({ currentTechnical: updated });
                return updated;
            } else {
                // Create new
                const { data: result, error } = await supabase
                    .from('call_sheet_technical')
                    .insert(dbData)
                    .select()
                    .single();

                if (error) throw error;

                const newTechnical = technicalFromDbFormat(result);
                set({ currentTechnical: newTechnical });
                return newTechnical;
            }
        },

        // ============================================
        // VENDOR METHODS
        // ============================================
        addVendor: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                company_name: data.companyName,
                vendor_type: data.vendorType,
                contact_name: data.contactName,
                contact_role: data.contactRole,
                contact_phone: data.contactPhone,
                contact_email: data.contactEmail,
                additional_contacts: data.additionalContacts || [],
                notes: data.notes,
                on_site: data.onSite !== undefined ? data.onSite : true,
                sort_order: data.sortOrder || 0,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_vendors')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newVendor = vendorFromDbFormat(result);
            set(state => ({
                currentVendors: [...state.currentVendors, newVendor],
            }));
            return newVendor;
        },

        updateVendor: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
            if (updates.vendorType !== undefined) dbUpdates.vendor_type = updates.vendorType;
            if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
            if (updates.contactRole !== undefined) dbUpdates.contact_role = updates.contactRole;
            if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
            if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail;
            if (updates.additionalContacts !== undefined) dbUpdates.additional_contacts = updates.additionalContacts;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.onSite !== undefined) dbUpdates.on_site = updates.onSite;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_vendors')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = vendorFromDbFormat(data);
            set(state => ({
                currentVendors: state.currentVendors.map(v => v.id === id ? updated : v),
            }));
            return updated;
        },

        removeVendor: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_vendors')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentVendors: state.currentVendors.filter(v => v.id !== id),
            }));
        },

        // ============================================
        // EMERGENCY CONTACT METHODS
        // ============================================
        addEmergencyContact: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                contact_type: data.contactType,
                name: data.name,
                organization: data.organization,
                phone: data.phone,
                phone_secondary: data.phoneSecondary,
                address: data.address,
                distance_from_venue: data.distanceFromVenue,
                notes: data.notes,
                is_24_hour: data.is24Hour,
                sort_order: data.sortOrder || 0,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_emergency_contacts')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newContact = emergencyContactFromDbFormat(result);
            set(state => ({
                currentEmergencyContacts: [...state.currentEmergencyContacts, newContact],
            }));
            return newContact;
        },

        updateEmergencyContact: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.contactType !== undefined) dbUpdates.contact_type = updates.contactType;
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.organization !== undefined) dbUpdates.organization = updates.organization;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.phoneSecondary !== undefined) dbUpdates.phone_secondary = updates.phoneSecondary;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.distanceFromVenue !== undefined) dbUpdates.distance_from_venue = updates.distanceFromVenue;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.is24Hour !== undefined) dbUpdates.is_24_hour = updates.is24Hour;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_emergency_contacts')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = emergencyContactFromDbFormat(data);
            set(state => ({
                currentEmergencyContacts: state.currentEmergencyContacts.map(c => c.id === id ? updated : c),
            }));
            return updated;
        },

        removeEmergencyContact: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_emergency_contacts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentEmergencyContacts: state.currentEmergencyContacts.filter(c => c.id !== id),
            }));
        },

        // ============================================
        // CATERING METHODS
        // ============================================
        addCatering: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                meal_type: data.mealType,
                meal_time: data.mealTime,
                location: data.location,
                provider_name: data.providerName,
                provider_phone: data.providerPhone,
                headcount: data.headcount,
                dietary_notes: data.dietaryNotes,
                menu_description: data.menuDescription,
                cost_per_head: data.costPerHead,
                total_cost: data.totalCost,
                payment_status: data.paymentStatus || 'pending',
                notes: data.notes,
                sort_order: data.sortOrder || 0,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_catering')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newCatering = cateringFromDbFormat(result);
            set(state => ({
                currentCatering: [...state.currentCatering, newCatering],
            }));
            return newCatering;
        },

        updateCatering: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.mealType !== undefined) dbUpdates.meal_type = updates.mealType;
            if (updates.mealTime !== undefined) dbUpdates.meal_time = updates.mealTime;
            if (updates.location !== undefined) dbUpdates.location = updates.location;
            if (updates.providerName !== undefined) dbUpdates.provider_name = updates.providerName;
            if (updates.providerPhone !== undefined) dbUpdates.provider_phone = updates.providerPhone;
            if (updates.headcount !== undefined) dbUpdates.headcount = updates.headcount;
            if (updates.dietaryNotes !== undefined) dbUpdates.dietary_notes = updates.dietaryNotes;
            if (updates.menuDescription !== undefined) dbUpdates.menu_description = updates.menuDescription;
            if (updates.costPerHead !== undefined) dbUpdates.cost_per_head = updates.costPerHead;
            if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
            if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

            const { data, error } = await supabase
                .from('call_sheet_catering')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = cateringFromDbFormat(data);
            set(state => ({
                currentCatering: state.currentCatering.map(c => c.id === id ? updated : c),
            }));
            return updated;
        },

        removeCatering: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_catering')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentCatering: state.currentCatering.filter(c => c.id !== id),
            }));
        },

        // ============================================
        // WEATHER METHODS
        // ============================================
        addWeather: async (callSheetId, data) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbData = {
                call_sheet_id: callSheetId,
                forecast_date: data.forecastDate,
                condition: data.condition,
                condition_icon: data.conditionIcon,
                temp_high_celsius: data.tempHighCelsius,
                temp_low_celsius: data.tempLowCelsius,
                humidity_percent: data.humidityPercent,
                wind_speed_kmh: data.windSpeedKmh,
                wind_direction: data.windDirection,
                precipitation_percent: data.precipitationPercent,
                uv_index: data.uvIndex,
                sunrise: data.sunrise,
                sunset: data.sunset,
                notes: data.notes,
            };

            const { data: result, error } = await supabase
                .from('call_sheet_weather')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            const newWeather = weatherFromDbFormat(result);
            set(state => ({
                currentWeather: [...state.currentWeather, newWeather],
            }));
            return newWeather;
        },

        updateWeather: async (id, updates) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const dbUpdates = {};
            if (updates.forecastDate !== undefined) dbUpdates.forecast_date = updates.forecastDate;
            if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
            if (updates.conditionIcon !== undefined) dbUpdates.condition_icon = updates.conditionIcon;
            if (updates.tempHighCelsius !== undefined) dbUpdates.temp_high_celsius = updates.tempHighCelsius;
            if (updates.tempLowCelsius !== undefined) dbUpdates.temp_low_celsius = updates.tempLowCelsius;
            if (updates.humidityPercent !== undefined) dbUpdates.humidity_percent = updates.humidityPercent;
            if (updates.windSpeedKmh !== undefined) dbUpdates.wind_speed_kmh = updates.windSpeedKmh;
            if (updates.windDirection !== undefined) dbUpdates.wind_direction = updates.windDirection;
            if (updates.precipitationPercent !== undefined) dbUpdates.precipitation_percent = updates.precipitationPercent;
            if (updates.uvIndex !== undefined) dbUpdates.uv_index = updates.uvIndex;
            if (updates.sunrise !== undefined) dbUpdates.sunrise = updates.sunrise;
            if (updates.sunset !== undefined) dbUpdates.sunset = updates.sunset;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

            const { data, error } = await supabase
                .from('call_sheet_weather')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updated = weatherFromDbFormat(data);
            set(state => ({
                currentWeather: state.currentWeather.map(w => w.id === id ? updated : w),
            }));
            return updated;
        },

        removeWeather: async (id) => {
            if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

            const { error } = await supabase
                .from('call_sheet_weather')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                currentWeather: state.currentWeather.filter(w => w.id !== id),
            }));
        },
    }))
);
