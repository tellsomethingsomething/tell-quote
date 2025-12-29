import { StyleSheet } from '@react-pdf/renderer';

// Professional Call Sheet Color Palette
export const colors = {
    // Backgrounds
    white: '#FFFFFF',
    offWhite: '#F8FAFC',
    lightGrey: '#F1F5F9',
    darkHeader: '#1E293B',

    // Text
    primary: '#1E293B',
    secondary: '#475569',
    tertiary: '#64748B',
    light: '#94A3B8',

    // Accent
    teal: '#8B5CF6',
    orange: '#FE7F2D',
    green: '#10B981',
    red: '#EF4444',
    amber: '#F59E0B',

    // Borders
    border: '#E2E8F0',
    borderDark: '#CBD5E1',
};


export const styles = StyleSheet.create({
    // Page
    page: {
        backgroundColor: colors.white,
        paddingTop: 0,
        paddingBottom: 30,
        paddingHorizontal: 0,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: colors.primary,
    },

    // Header Banner
    headerBanner: {
        backgroundColor: colors.darkHeader,
        paddingVertical: 16,
        paddingHorizontal: 30,
        marginBottom: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    productionTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: colors.white,
        marginBottom: 4,
    },
    episodeInfo: {
        fontSize: 11,
        color: colors.light,
        marginBottom: 8,
    },
    dayBadge: {
        backgroundColor: colors.teal,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginBottom: 4,
    },
    dayBadgeText: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: colors.white,
    },
    dateText: {
        fontSize: 11,
        color: colors.light,
        textAlign: 'right',
    },

    // Call Times Banner
    callTimesBanner: {
        backgroundColor: colors.teal,
        paddingVertical: 10,
        paddingHorizontal: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    callTimeItem: {
        alignItems: 'center',
    },
    callTimeLabel: {
        fontSize: 7,
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    callTimeValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: colors.white,
    },

    // Content Area
    content: {
        paddingHorizontal: 30,
        paddingTop: 16,
    },

    // Two Column Layout
    twoColumn: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    columnLeft: {
        flex: 1,
    },
    columnRight: {
        flex: 1,
    },

    // Section
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionIcon: {
        width: 14,
        height: 14,
        marginRight: 6,
        backgroundColor: colors.teal,
        borderRadius: 2,
    },

    // Important Notes Box
    importantBox: {
        backgroundColor: colors.orange + '15',
        borderWidth: 1,
        borderColor: colors.orange,
        borderRadius: 4,
        padding: 10,
        marginBottom: 16,
    },
    importantLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: colors.orange,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    importantText: {
        fontSize: 9,
        color: colors.primary,
        lineHeight: 1.4,
    },

    // Key Personnel Grid
    personnelGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    personnelItem: {
        width: '48%',
        backgroundColor: colors.offWhite,
        padding: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    personnelLabel: {
        fontSize: 7,
        color: colors.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    personnelName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    personnelContact: {
        fontSize: 8,
        color: colors.secondary,
        marginTop: 2,
    },

    // Location Box
    locationBox: {
        backgroundColor: colors.offWhite,
        borderRadius: 4,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: colors.teal,
    },
    locationName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 9,
        color: colors.secondary,
        marginBottom: 6,
        lineHeight: 1.3,
    },
    locationMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    locationMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationMetaLabel: {
        fontSize: 7,
        color: colors.tertiary,
        marginRight: 4,
    },
    locationMetaValue: {
        fontSize: 8,
        color: colors.primary,
    },

    // Schedule Table
    scheduleTable: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    scheduleRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    scheduleRowLast: {
        flexDirection: 'row',
    },
    scheduleTime: {
        width: 60,
        padding: 6,
        backgroundColor: colors.offWhite,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    scheduleTimeText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.teal,
    },
    scheduleActivity: {
        flex: 1,
        padding: 6,
    },
    scheduleActivityText: {
        fontSize: 9,
        color: colors.primary,
    },

    // Crew Table
    crewDeptHeader: {
        backgroundColor: colors.offWhite,
        padding: 6,
        marginTop: 8,
        marginBottom: 4,
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    crewDeptDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    crewDeptName: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    crewTable: {
        marginBottom: 4,
    },
    crewRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    crewName: {
        width: '30%',
        fontSize: 9,
        color: colors.primary,
    },
    crewRole: {
        width: '25%',
        fontSize: 8,
        color: colors.secondary,
    },
    crewCall: {
        width: '15%',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.teal,
    },
    crewPhone: {
        width: '20%',
        fontSize: 8,
        color: colors.tertiary,
    },
    crewConfirmed: {
        width: '10%',
        textAlign: 'center',
    },
    confirmedBadge: {
        fontSize: 7,
        color: colors.green,
    },

    // Cast Table
    castTable: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    castHeader: {
        flexDirection: 'row',
        backgroundColor: colors.offWhite,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    castHeaderText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: colors.tertiary,
        textTransform: 'uppercase',
    },
    castRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    castName: {
        width: '25%',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    castCharacter: {
        width: '20%',
        fontSize: 8,
        color: colors.secondary,
    },
    castPickup: {
        width: '12%',
        fontSize: 8,
        color: colors.tertiary,
    },
    castMakeup: {
        width: '12%',
        fontSize: 8,
        color: colors.tertiary,
    },
    castWardrobe: {
        width: '12%',
        fontSize: 8,
        color: colors.tertiary,
    },
    castOnSet: {
        width: '12%',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.teal,
    },

    // Weather Box
    weatherBox: {
        backgroundColor: colors.offWhite,
        padding: 10,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    weatherIcon: {
        width: 32,
        height: 32,
        marginRight: 10,
    },
    weatherInfo: {
        flex: 1,
    },
    weatherForecast: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
        marginBottom: 2,
    },
    weatherNotes: {
        fontSize: 8,
        color: colors.secondary,
    },

    // Catering Box
    cateringGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    cateringItem: {
        flex: 1,
        backgroundColor: colors.offWhite,
        padding: 8,
        borderRadius: 4,
    },
    cateringLabel: {
        fontSize: 7,
        color: colors.tertiary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    cateringTime: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    cateringLocation: {
        fontSize: 8,
        color: colors.secondary,
        marginTop: 2,
    },

    // Safety Box
    safetyBox: {
        backgroundColor: colors.red + '10',
        borderWidth: 1,
        borderColor: colors.red + '40',
        borderRadius: 4,
        padding: 10,
    },
    safetyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    safetyTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.red,
        textTransform: 'uppercase',
    },
    hospitalInfo: {
        marginBottom: 8,
    },
    hospitalName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    hospitalAddress: {
        fontSize: 8,
        color: colors.secondary,
    },
    hospitalPhone: {
        fontSize: 9,
        color: colors.primary,
        marginTop: 2,
    },
    emergencyContacts: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.red + '30',
    },
    emergencyContactItem: {
        fontSize: 8,
        color: colors.primary,
        marginBottom: 2,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
    },
    footerLeft: {
        fontSize: 7,
        color: colors.tertiary,
    },
    footerRight: {
        fontSize: 7,
        color: colors.tertiary,
    },

    // Page Break
    pageBreak: {
        marginTop: 'auto',
    },

    // Wardrobe Box
    wardrobeBox: {
        backgroundColor: colors.offWhite,
        padding: 10,
        borderRadius: 4,
    },
    wardrobeText: {
        fontSize: 9,
        color: colors.primary,
        lineHeight: 1.4,
    },

    // Notes Section
    notesBox: {
        backgroundColor: colors.offWhite,
        padding: 10,
        borderRadius: 4,
    },
    notesText: {
        fontSize: 9,
        color: colors.primary,
        lineHeight: 1.4,
    },

    // Transport Box
    transportBox: {
        backgroundColor: colors.offWhite,
        padding: 10,
        borderRadius: 4,
    },
    transportText: {
        fontSize: 9,
        color: colors.primary,
        lineHeight: 1.4,
    },

    // Flight Table
    flightTable: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    flightHeader: {
        flexDirection: 'row',
        backgroundColor: colors.offWhite,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    flightHeaderText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: colors.tertiary,
        textTransform: 'uppercase',
    },
    flightRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    flightTypeBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 2,
        marginRight: 6,
    },
    flightTypeBadgeText: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },

    // Transfer Row
    transferRow: {
        flexDirection: 'row',
        backgroundColor: colors.offWhite,
        padding: 8,
        borderRadius: 4,
        marginBottom: 6,
    },
    transferTime: {
        width: 60,
    },
    transferTimeText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.teal,
    },
    transferRoute: {
        flex: 1,
    },
    transferRouteText: {
        fontSize: 9,
        color: colors.primary,
    },
    transferDriver: {
        fontSize: 8,
        color: colors.tertiary,
        marginTop: 2,
    },

    // Accommodation Box
    accommodationBox: {
        backgroundColor: colors.offWhite,
        padding: 12,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: colors.teal,
        marginBottom: 8,
    },
    hotelName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
        marginBottom: 4,
    },
    hotelAddress: {
        fontSize: 9,
        color: colors.secondary,
        marginBottom: 4,
    },
    hotelMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    hotelMetaItem: {
        fontSize: 8,
        color: colors.tertiary,
    },

    // Vehicle Row
    vehicleRow: {
        flexDirection: 'row',
        backgroundColor: colors.offWhite,
        padding: 8,
        borderRadius: 4,
        marginBottom: 6,
    },
    vehicleType: {
        width: 100,
    },
    vehicleTypeBadge: {
        backgroundColor: colors.orange + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    vehicleTypeBadgeText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: colors.orange,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    vehicleDriver: {
        fontSize: 8,
        color: colors.tertiary,
        marginTop: 2,
    },

    // Technical Box
    technicalBox: {
        backgroundColor: colors.offWhite,
        padding: 12,
        borderRadius: 4,
        marginBottom: 8,
    },
    technicalLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: colors.tertiary,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    technicalText: {
        fontSize: 9,
        color: colors.primary,
        lineHeight: 1.4,
    },

    // Vendor Row
    vendorRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    vendorType: {
        width: 80,
    },
    vendorTypeBadge: {
        backgroundColor: colors.teal + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    vendorTypeBadgeText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: colors.teal,
    },
    vendorInfo: {
        flex: 1,
    },
    vendorName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    vendorContact: {
        fontSize: 8,
        color: colors.secondary,
        marginTop: 2,
    },
    vendorPhone: {
        width: 100,
        fontSize: 8,
        color: colors.tertiary,
        textAlign: 'right',
    },

    // Emergency Contact Row
    emergencyRow: {
        flexDirection: 'row',
        backgroundColor: colors.red + '08',
        padding: 8,
        borderRadius: 4,
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: colors.red,
    },
    emergencyType: {
        width: 80,
    },
    emergencyTypeBadge: {
        backgroundColor: colors.red + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    emergencyTypeBadgeText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: colors.red,
    },
    emergencyInfo: {
        flex: 1,
    },
    emergencyName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.primary,
    },
    emergencyOrg: {
        fontSize: 8,
        color: colors.secondary,
        marginTop: 2,
    },
    emergencyPhone: {
        width: 100,
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: colors.red,
        textAlign: 'right',
    },

    // International Info Box
    internationalBox: {
        backgroundColor: colors.teal + '10',
        padding: 12,
        borderRadius: 4,
        marginBottom: 12,
    },
    internationalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    internationalItem: {
        width: '30%',
    },
    internationalLabel: {
        fontSize: 7,
        color: colors.tertiary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    internationalValue: {
        fontSize: 9,
        color: colors.primary,
    },
});
