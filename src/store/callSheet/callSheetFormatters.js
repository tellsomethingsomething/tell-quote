// Convert DB format to local format
export function fromDbFormat(record) {
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
export function toDbFormat(callSheet) {
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
export function crewFromDbFormat(record) {
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
export function castFromDbFormat(record) {
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
export function accommodationFromDbFormat(record) {
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
export function roomAssignmentFromDbFormat(record) {
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
export function flightFromDbFormat(record) {
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
export function transferFromDbFormat(record) {
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
export function vehicleFromDbFormat(record) {
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
export function technicalFromDbFormat(record) {
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
export function vendorFromDbFormat(record) {
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
export function emergencyContactFromDbFormat(record) {
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
export function cateringFromDbFormat(record) {
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
export function weatherFromDbFormat(record) {
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
