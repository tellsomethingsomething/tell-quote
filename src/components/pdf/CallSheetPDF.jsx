import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import { DEPARTMENTS } from '../../store/callSheetStore';

// Professional Call Sheet Color Palette
const colors = {
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
    teal: '#0F8B8D',
    orange: '#FE7F2D',
    green: '#10B981',
    red: '#EF4444',
    amber: '#F59E0B',

    // Borders
    border: '#E2E8F0',
    borderDark: '#CBD5E1',
};


const styles = StyleSheet.create({
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

// Helper to format date
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// Helper to format time
const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr;
};

// Group crew by department
const groupCrewByDepartment = (crew) => {
    const grouped = {};
    crew.forEach(member => {
        const dept = member.department || 'other';
        if (!grouped[dept]) grouped[dept] = [];
        grouped[dept].push(member);
    });
    return grouped;
};

// Main PDF Component
export default function CallSheetPDF({
    sheet,
    crew = [],
    cast = [],
    settings = {},
    // New enhanced props
    flights = [],
    transfers = [],
    accommodation = [],
    vehicles = [],
    technical = null,
    vendors = [],
    emergencyContacts = [],
}) {
    const enabledSections = sheet.enabledSections || {};
    const crewByDept = groupCrewByDepartment(crew);
    const companyName = settings.companyName || 'Tell Productions';

    // Check if we have travel/logistics data
    const hasTravel = flights.length > 0 || transfers.length > 0 || accommodation.length > 0;
    const hasTechnical = technical && (technical.cameraPositions?.length > 0 || technical.commsSetup || technical.powerRequirements);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Banner */}
                <View style={styles.headerBanner}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.productionTitle}>
                                {sheet.productionTitle || sheet.projectName || 'Call Sheet'}
                            </Text>
                            {sheet.episodeTitle && (
                                <Text style={styles.episodeInfo}>
                                    {sheet.episodeNumber && `Episode ${sheet.episodeNumber}: `}
                                    {sheet.episodeTitle}
                                </Text>
                            )}
                        </View>
                        <View style={styles.headerRight}>
                            <View style={styles.dayBadge}>
                                <Text style={styles.dayBadgeText}>
                                    DAY {sheet.dayNumber || 1}{sheet.totalDays ? ` OF ${sheet.totalDays}` : ''}
                                </Text>
                            </View>
                            <Text style={styles.dateText}>
                                {formatDate(sheet.shootDate)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Call Times Banner */}
                <View style={styles.callTimesBanner}>
                    <View style={styles.callTimeItem}>
                        <Text style={styles.callTimeLabel}>Crew Call</Text>
                        <Text style={styles.callTimeValue}>
                            {formatTime(sheet.generalCallTime)}
                        </Text>
                    </View>
                    <View style={styles.callTimeItem}>
                        <Text style={styles.callTimeLabel}>First Shot / TX</Text>
                        <Text style={styles.callTimeValue}>
                            {formatTime(sheet.firstShotTime)}
                        </Text>
                    </View>
                    <View style={styles.callTimeItem}>
                        <Text style={styles.callTimeLabel}>Est. Wrap</Text>
                        <Text style={styles.callTimeValue}>
                            {formatTime(sheet.estimatedWrap)}
                        </Text>
                    </View>
                    {sheet.actualWrap && (
                        <View style={styles.callTimeItem}>
                            <Text style={styles.callTimeLabel}>Actual Wrap</Text>
                            <Text style={styles.callTimeValue}>
                                {formatTime(sheet.actualWrap)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Important Notes - Always at top if present */}
                    {sheet.importantNotes && (
                        <View style={styles.importantBox}>
                            <Text style={styles.importantLabel}>Important Notes</Text>
                            <Text style={styles.importantText}>{sheet.importantNotes}</Text>
                        </View>
                    )}

                    {/* Two Column Layout - Personnel & Location */}
                    <View style={styles.twoColumn}>
                        {/* Left Column - Key Personnel */}
                        {(enabledSections.personnel !== false) && (
                            <View style={styles.columnLeft}>
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Key Personnel</Text>
                                    </View>
                                    <View style={styles.personnelGrid}>
                                        {sheet.director && (
                                            <View style={styles.personnelItem}>
                                                <Text style={styles.personnelLabel}>Director</Text>
                                                <Text style={styles.personnelName}>{sheet.director}</Text>
                                            </View>
                                        )}
                                        {sheet.producer && (
                                            <View style={styles.personnelItem}>
                                                <Text style={styles.personnelLabel}>Producer</Text>
                                                <Text style={styles.personnelName}>{sheet.producer}</Text>
                                            </View>
                                        )}
                                        {sheet.productionManager && (
                                            <View style={styles.personnelItem}>
                                                <Text style={styles.personnelLabel}>Production Manager</Text>
                                                <Text style={styles.personnelName}>{sheet.productionManager}</Text>
                                            </View>
                                        )}
                                        {sheet.productionCompany && (
                                            <View style={styles.personnelItem}>
                                                <Text style={styles.personnelLabel}>Production Company</Text>
                                                <Text style={styles.personnelName}>{sheet.productionCompany}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Right Column - Location */}
                        {(enabledSections.location !== false) && sheet.locationName && (
                            <View style={styles.columnRight}>
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Location</Text>
                                    </View>
                                    <View style={styles.locationBox}>
                                        <Text style={styles.locationName}>{sheet.locationName}</Text>
                                        {sheet.locationAddress && (
                                            <Text style={styles.locationAddress}>
                                                {sheet.locationAddress}
                                                {sheet.locationCity && `, ${sheet.locationCity}`}
                                                {sheet.locationCountry && `, ${sheet.locationCountry}`}
                                            </Text>
                                        )}
                                        <View style={styles.locationMeta}>
                                            {sheet.locationContactName && (
                                                <View style={styles.locationMetaItem}>
                                                    <Text style={styles.locationMetaLabel}>Contact:</Text>
                                                    <Text style={styles.locationMetaValue}>
                                                        {sheet.locationContactName}
                                                        {sheet.locationContactPhone && ` - ${sheet.locationContactPhone}`}
                                                    </Text>
                                                </View>
                                            )}
                                            {sheet.parkingInfo && (
                                                <View style={styles.locationMetaItem}>
                                                    <Text style={styles.locationMetaLabel}>Parking:</Text>
                                                    <Text style={styles.locationMetaValue}>{sheet.parkingInfo}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Weather & Catering Row */}
                    {((enabledSections.weather && sheet.weatherForecast) || (enabledSections.catering && (sheet.breakfastTime || sheet.lunchTime))) && (
                        <View style={styles.twoColumn}>
                            {/* Weather */}
                            {enabledSections.weather && sheet.weatherForecast && (
                                <View style={styles.columnLeft}>
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Weather</Text>
                                        </View>
                                        <View style={styles.weatherBox}>
                                            <View style={styles.weatherInfo}>
                                                <Text style={styles.weatherForecast}>{sheet.weatherForecast}</Text>
                                                {sheet.weatherNotes && (
                                                    <Text style={styles.weatherNotes}>{sheet.weatherNotes}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Catering */}
                            {enabledSections.catering && (sheet.breakfastTime || sheet.lunchTime) && (
                                <View style={styles.columnRight}>
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Catering</Text>
                                        </View>
                                        <View style={styles.cateringGrid}>
                                            {sheet.breakfastTime && (
                                                <View style={styles.cateringItem}>
                                                    <Text style={styles.cateringLabel}>Breakfast</Text>
                                                    <Text style={styles.cateringTime}>{sheet.breakfastTime}</Text>
                                                    {sheet.breakfastLocation && (
                                                        <Text style={styles.cateringLocation}>{sheet.breakfastLocation}</Text>
                                                    )}
                                                </View>
                                            )}
                                            {sheet.lunchTime && (
                                                <View style={styles.cateringItem}>
                                                    <Text style={styles.cateringLabel}>Lunch</Text>
                                                    <Text style={styles.cateringTime}>{sheet.lunchTime}</Text>
                                                    {sheet.lunchLocation && (
                                                        <Text style={styles.cateringLocation}>{sheet.lunchLocation}</Text>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Schedule */}
                    {(enabledSections.schedule !== false) && sheet.schedule && sheet.schedule.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Schedule / Running Order</Text>
                            </View>
                            <View style={styles.scheduleTable}>
                                {sheet.schedule.map((item, index) => (
                                    <View
                                        key={item.id || index}
                                        style={index === sheet.schedule.length - 1 ? styles.scheduleRowLast : styles.scheduleRow}
                                    >
                                        <View style={styles.scheduleTime}>
                                            <Text style={styles.scheduleTimeText}>{item.time}</Text>
                                        </View>
                                        <View style={styles.scheduleActivity}>
                                            <Text style={styles.scheduleActivityText}>{item.activity}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Wardrobe */}
                    {enabledSections.wardrobe && sheet.wardrobeNotes && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Wardrobe / Dress Code</Text>
                            </View>
                            <View style={styles.wardrobeBox}>
                                <Text style={styles.wardrobeText}>{sheet.wardrobeNotes}</Text>
                            </View>
                        </View>
                    )}

                    {/* Transport */}
                    {enabledSections.transport && sheet.transportNotes && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Transport</Text>
                            </View>
                            <View style={styles.transportBox}>
                                <Text style={styles.transportText}>{sheet.transportNotes}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerLeft}>
                        {companyName} | Call Sheet v{sheet.version || 1}
                    </Text>
                    <Text style={styles.footerRight}>
                        Page 1
                    </Text>
                </View>
            </Page>

            {/* Page 2 - Crew List */}
            {(enabledSections.crew !== false) && crew.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.headerBanner}>
                        <View style={styles.headerTop}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.productionTitle}>
                                    {sheet.productionTitle || sheet.projectName || 'Call Sheet'} - Crew List
                                </Text>
                            </View>
                            <View style={styles.headerRight}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>
                                        DAY {sheet.dayNumber || 1}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Crew ({crew.length} total)</Text>
                            </View>

                            {DEPARTMENTS.map(dept => {
                                const deptCrew = crewByDept[dept.id];
                                if (!deptCrew || deptCrew.length === 0) return null;

                                return (
                                    <View key={dept.id}>
                                        <View style={styles.crewDeptHeader}>
                                            <View style={[styles.crewDeptDot, { backgroundColor: dept.color }]} />
                                            <Text style={styles.crewDeptName}>{dept.name} ({deptCrew.length})</Text>
                                        </View>
                                        <View style={styles.crewTable}>
                                            {deptCrew.map((member, idx) => (
                                                <View key={member.id || idx} style={styles.crewRow}>
                                                    <Text style={styles.crewName}>{member.name}</Text>
                                                    <Text style={styles.crewRole}>{member.roleTitle}</Text>
                                                    <Text style={styles.crewCall}>{member.callTime || '-'}</Text>
                                                    <Text style={styles.crewPhone}>{member.phone || ''}</Text>
                                                    <View style={styles.crewConfirmed}>
                                                        {member.confirmed && (
                                                            <Text style={styles.confirmedBadge}>✓</Text>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Other/Unassigned */}
                            {crewByDept['other'] && crewByDept['other'].length > 0 && (
                                <View>
                                    <View style={styles.crewDeptHeader}>
                                        <View style={[styles.crewDeptDot, { backgroundColor: '#64748B' }]} />
                                        <Text style={styles.crewDeptName}>Other ({crewByDept['other'].length})</Text>
                                    </View>
                                    <View style={styles.crewTable}>
                                        {crewByDept['other'].map((member, idx) => (
                                            <View key={member.id || idx} style={styles.crewRow}>
                                                <Text style={styles.crewName}>{member.name}</Text>
                                                <Text style={styles.crewRole}>{member.roleTitle}</Text>
                                                <Text style={styles.crewCall}>{member.callTime || '-'}</Text>
                                                <Text style={styles.crewPhone}>{member.phone || ''}</Text>
                                                <View style={styles.crewConfirmed}>
                                                    {member.confirmed && (
                                                        <Text style={styles.confirmedBadge}>✓</Text>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerLeft}>
                            {companyName} | Call Sheet v{sheet.version || 1}
                        </Text>
                        <Text style={styles.footerRight}>
                            Page 2
                        </Text>
                    </View>
                </Page>
            )}

            {/* Page 3 - Cast & Safety */}
            {((enabledSections.cast && cast.length > 0) || (enabledSections.safety && (sheet.hospitalName || sheet.safetyNotes))) && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.headerBanner}>
                        <View style={styles.headerTop}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.productionTitle}>
                                    {sheet.productionTitle || sheet.projectName || 'Call Sheet'} - Cast & Safety
                                </Text>
                            </View>
                            <View style={styles.headerRight}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>
                                        DAY {sheet.dayNumber || 1}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.content}>
                        {/* Cast */}
                        {enabledSections.cast && cast.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Cast / Talent ({cast.length})</Text>
                                </View>
                                <View style={styles.castTable}>
                                    <View style={styles.castHeader}>
                                        <Text style={[styles.castHeaderText, { width: '25%' }]}>Name</Text>
                                        <Text style={[styles.castHeaderText, { width: '20%' }]}>Character</Text>
                                        <Text style={[styles.castHeaderText, { width: '12%' }]}>Pickup</Text>
                                        <Text style={[styles.castHeaderText, { width: '12%' }]}>Makeup</Text>
                                        <Text style={[styles.castHeaderText, { width: '12%' }]}>Wardrobe</Text>
                                        <Text style={[styles.castHeaderText, { width: '12%' }]}>On Set</Text>
                                    </View>
                                    {cast.map((member, idx) => (
                                        <View key={member.id || idx} style={styles.castRow}>
                                            <Text style={styles.castName}>{member.name}</Text>
                                            <Text style={styles.castCharacter}>{member.characterName || '-'}</Text>
                                            <Text style={styles.castPickup}>{member.pickupTime || '-'}</Text>
                                            <Text style={styles.castMakeup}>{member.makeupCall || '-'}</Text>
                                            <Text style={styles.castWardrobe}>{member.wardrobeCall || '-'}</Text>
                                            <Text style={styles.castOnSet}>{member.onSetCall || '-'}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Safety */}
                        {enabledSections.safety && (sheet.hospitalName || sheet.safetyNotes) && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Health & Safety</Text>
                                </View>
                                <View style={styles.safetyBox}>
                                    {sheet.hospitalName && (
                                        <View style={styles.hospitalInfo}>
                                            <Text style={styles.safetyTitle}>Nearest Hospital</Text>
                                            <Text style={styles.hospitalName}>{sheet.hospitalName}</Text>
                                            {sheet.hospitalAddress && (
                                                <Text style={styles.hospitalAddress}>{sheet.hospitalAddress}</Text>
                                            )}
                                            {sheet.hospitalPhone && (
                                                <Text style={styles.hospitalPhone}>Tel: {sheet.hospitalPhone}</Text>
                                            )}
                                            {sheet.hospitalDistance && (
                                                <Text style={styles.hospitalAddress}>Distance: {sheet.hospitalDistance}</Text>
                                            )}
                                        </View>
                                    )}

                                    {sheet.emergencyContacts && sheet.emergencyContacts.length > 0 && (
                                        <View style={styles.emergencyContacts}>
                                            <Text style={styles.safetyTitle}>Emergency Contacts</Text>
                                            {(Array.isArray(sheet.emergencyContacts)
                                                ? sheet.emergencyContacts
                                                : sheet.emergencyContacts.split('\n')
                                            ).map((contact, idx) => (
                                                <Text key={idx} style={styles.emergencyContactItem}>{contact}</Text>
                                            ))}
                                        </View>
                                    )}

                                    {sheet.safetyNotes && (
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={styles.safetyTitle}>Safety Notes</Text>
                                            <Text style={styles.notesText}>{sheet.safetyNotes}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerLeft}>
                            {companyName} | Call Sheet v{sheet.version || 1}
                        </Text>
                        <Text style={styles.footerRight}>
                            Page 3
                        </Text>
                    </View>
                </Page>
            )}

            {/* Page 4 - Travel & Logistics (if any) */}
            {hasTravel && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.headerBanner}>
                        <View style={styles.headerTop}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.productionTitle}>
                                    {sheet.productionTitle || sheet.projectName || 'Call Sheet'} - Travel & Logistics
                                </Text>
                            </View>
                            <View style={styles.headerRight}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>
                                        DAY {sheet.dayNumber || 1}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.content}>
                        {/* International Info */}
                        {(sheet.timeZone || sheet.perDiemAmount || sheet.localCurrency) && (
                            <View style={styles.internationalBox}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>International Info</Text>
                                </View>
                                <View style={styles.internationalGrid}>
                                    {sheet.timeZone && (
                                        <View style={styles.internationalItem}>
                                            <Text style={styles.internationalLabel}>Time Zone</Text>
                                            <Text style={styles.internationalValue}>{sheet.timeZone} {sheet.timeZoneOffset && `(${sheet.timeZoneOffset})`}</Text>
                                        </View>
                                    )}
                                    {sheet.localCurrency && (
                                        <View style={styles.internationalItem}>
                                            <Text style={styles.internationalLabel}>Local Currency</Text>
                                            <Text style={styles.internationalValue}>{sheet.localCurrency} {sheet.exchangeRate && `@ ${sheet.exchangeRate}`}</Text>
                                        </View>
                                    )}
                                    {sheet.perDiemAmount && (
                                        <View style={styles.internationalItem}>
                                            <Text style={styles.internationalLabel}>Per Diem</Text>
                                            <Text style={styles.internationalValue}>{sheet.perDiemCurrency || 'USD'} {sheet.perDiemAmount}</Text>
                                        </View>
                                    )}
                                    {sheet.internationalDialingCode && (
                                        <View style={styles.internationalItem}>
                                            <Text style={styles.internationalLabel}>Dialing Code</Text>
                                            <Text style={styles.internationalValue}>{sheet.internationalDialingCode}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Flights */}
                        {flights.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Flights ({flights.length})</Text>
                                </View>
                                <View style={styles.flightTable}>
                                    <View style={styles.flightHeader}>
                                        <Text style={[styles.flightHeaderText, { width: '8%' }]}>Type</Text>
                                        <Text style={[styles.flightHeaderText, { width: '22%' }]}>Name</Text>
                                        <Text style={[styles.flightHeaderText, { width: '12%' }]}>Flight</Text>
                                        <Text style={[styles.flightHeaderText, { width: '20%' }]}>Route</Text>
                                        <Text style={[styles.flightHeaderText, { width: '18%' }]}>Depart</Text>
                                        <Text style={[styles.flightHeaderText, { width: '20%' }]}>Arrive</Text>
                                    </View>
                                    {flights.map((flight, idx) => (
                                        <View key={flight.id || idx} style={styles.flightRow}>
                                            <View style={{ width: '8%' }}>
                                                <View style={[styles.flightTypeBadge, { backgroundColor: flight.flightType === 'outbound' ? colors.teal + '20' : colors.green + '20' }]}>
                                                    <Text style={[styles.flightTypeBadgeText, { color: flight.flightType === 'outbound' ? colors.teal : colors.green }]}>
                                                        {flight.flightType === 'outbound' ? 'OUT' : 'RET'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={{ width: '22%', fontSize: 9, color: colors.primary }}>{flight.crewName}</Text>
                                            <Text style={{ width: '12%', fontSize: 8, color: colors.secondary }}>{flight.flightNumber}</Text>
                                            <Text style={{ width: '20%', fontSize: 9, color: colors.primary }}>{flight.departureAirport} → {flight.arrivalAirport}</Text>
                                            <Text style={{ width: '18%', fontSize: 8, color: colors.tertiary }}>
                                                {flight.departureDate && new Date(flight.departureDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} {flight.departureTime}
                                            </Text>
                                            <Text style={{ width: '20%', fontSize: 8, color: colors.tertiary }}>
                                                {flight.arrivalDate && new Date(flight.arrivalDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} {flight.arrivalTime || ''}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Transfers */}
                        {transfers.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Transfers</Text>
                                </View>
                                {transfers.map((transfer, idx) => (
                                    <View key={transfer.id || idx} style={styles.transferRow}>
                                        <View style={styles.transferTime}>
                                            <Text style={styles.transferTimeText}>{transfer.transferTime}</Text>
                                        </View>
                                        <View style={styles.transferRoute}>
                                            <Text style={styles.transferRouteText}>{transfer.pickupLocation} → {transfer.dropoffLocation}</Text>
                                            {transfer.driverName && (
                                                <Text style={styles.transferDriver}>Driver: {transfer.driverName} {transfer.driverPhone}</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Accommodation */}
                        {accommodation.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Accommodation</Text>
                                </View>
                                {accommodation.map((hotel, idx) => (
                                    <View key={hotel.id || idx} style={styles.accommodationBox}>
                                        <Text style={styles.hotelName}>{hotel.hotelName}</Text>
                                        {hotel.hotelAddress && (
                                            <Text style={styles.hotelAddress}>
                                                {hotel.hotelAddress}
                                                {hotel.hotelCity && `, ${hotel.hotelCity}`}
                                            </Text>
                                        )}
                                        <View style={styles.hotelMeta}>
                                            {hotel.hotelPhone && <Text style={styles.hotelMetaItem}>Tel: {hotel.hotelPhone}</Text>}
                                            {hotel.bookingReference && <Text style={styles.hotelMetaItem}>Ref: {hotel.bookingReference}</Text>}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Vehicles */}
                        {vehicles.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Vehicles & Equipment</Text>
                                </View>
                                {vehicles.map((vehicle, idx) => (
                                    <View key={vehicle.id || idx} style={styles.vehicleRow}>
                                        <View style={styles.vehicleType}>
                                            <View style={styles.vehicleTypeBadge}>
                                                <Text style={styles.vehicleTypeBadgeText}>{vehicle.vehicleType}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.vehicleInfo}>
                                            <Text style={styles.vehicleName}>{vehicle.vehicleName || vehicle.vehicleType}</Text>
                                            {(vehicle.driverName || vehicle.company) && (
                                                <Text style={styles.vehicleDriver}>
                                                    {vehicle.company} {vehicle.driverName && `- ${vehicle.driverName}`} {vehicle.driverPhone}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerLeft}>
                            {companyName} | Call Sheet v{sheet.version || 1}
                        </Text>
                        <Text style={styles.footerRight}>
                            Page 4
                        </Text>
                    </View>
                </Page>
            )}

            {/* Page 5 - Technical (if any) */}
            {hasTechnical && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.headerBanner}>
                        <View style={styles.headerTop}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.productionTitle}>
                                    {sheet.productionTitle || sheet.projectName || 'Call Sheet'} - Technical Plan
                                </Text>
                            </View>
                            <View style={styles.headerRight}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>
                                        DAY {sheet.dayNumber || 1}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.content}>
                        {/* Camera Positions */}
                        {technical?.cameraPositions?.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Camera Positions</Text>
                                </View>
                                <View style={styles.technicalBox}>
                                    {technical.cameraPositions.map((cam, idx) => (
                                        <Text key={idx} style={styles.technicalText}>
                                            {cam.camera}: {cam.position} {cam.equipment && `(${cam.equipment})`}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Comms & Radio */}
                        {(technical?.commsSetup || technical?.radioChannels?.length > 0) && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Communications</Text>
                                </View>
                                <View style={styles.twoColumn}>
                                    {technical?.commsSetup && (
                                        <View style={styles.columnLeft}>
                                            <View style={styles.technicalBox}>
                                                <Text style={styles.technicalLabel}>Comms Setup</Text>
                                                <Text style={styles.technicalText}>{technical.commsSetup}</Text>
                                            </View>
                                        </View>
                                    )}
                                    {technical?.radioChannels?.length > 0 && (
                                        <View style={styles.columnRight}>
                                            <View style={styles.technicalBox}>
                                                <Text style={styles.technicalLabel}>Radio Channels</Text>
                                                {technical.radioChannels.map((ch, idx) => (
                                                    <Text key={idx} style={styles.technicalText}>{ch}</Text>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Power & Connectivity */}
                        {(technical?.powerRequirements || technical?.uplinkInfo) && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Power & Connectivity</Text>
                                </View>
                                <View style={styles.twoColumn}>
                                    {technical?.powerRequirements && (
                                        <View style={styles.columnLeft}>
                                            <View style={styles.technicalBox}>
                                                <Text style={styles.technicalLabel}>Power Requirements</Text>
                                                <Text style={styles.technicalText}>{technical.powerRequirements}</Text>
                                            </View>
                                        </View>
                                    )}
                                    {technical?.uplinkInfo && (
                                        <View style={styles.columnRight}>
                                            <View style={styles.technicalBox}>
                                                <Text style={styles.technicalLabel}>Uplink / Transmission</Text>
                                                <Text style={styles.technicalText}>{technical.uplinkInfo}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Technical Notes */}
                        {technical?.notes && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Technical Notes</Text>
                                </View>
                                <View style={styles.technicalBox}>
                                    <Text style={styles.technicalText}>{technical.notes}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerLeft}>
                            {companyName} | Call Sheet v{sheet.version || 1}
                        </Text>
                        <Text style={styles.footerRight}>
                            Page 5
                        </Text>
                    </View>
                </Page>
            )}

            {/* Page 6 - Vendors & Emergency Contacts (if any) */}
            {(vendors.length > 0 || emergencyContacts.length > 0) && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.headerBanner}>
                        <View style={styles.headerTop}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.productionTitle}>
                                    {sheet.productionTitle || sheet.projectName || 'Call Sheet'} - Contacts
                                </Text>
                            </View>
                            <View style={styles.headerRight}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>
                                        DAY {sheet.dayNumber || 1}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.content}>
                        {/* Vendors */}
                        {vendors.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Vendors & Suppliers</Text>
                                </View>
                                {vendors.map((vendor, idx) => (
                                    <View key={vendor.id || idx} style={styles.vendorRow}>
                                        <View style={styles.vendorType}>
                                            <View style={styles.vendorTypeBadge}>
                                                <Text style={styles.vendorTypeBadgeText}>{vendor.vendorType || 'Vendor'}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.vendorInfo}>
                                            <Text style={styles.vendorName}>{vendor.companyName}</Text>
                                            {vendor.contactName && (
                                                <Text style={styles.vendorContact}>{vendor.contactName}</Text>
                                            )}
                                        </View>
                                        <Text style={styles.vendorPhone}>{vendor.contactPhone}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Emergency Contacts */}
                        {emergencyContacts.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: colors.red }]}>Emergency Contacts</Text>
                                </View>
                                {emergencyContacts.map((contact, idx) => (
                                    <View key={contact.id || idx} style={styles.emergencyRow}>
                                        <View style={styles.emergencyType}>
                                            <View style={styles.emergencyTypeBadge}>
                                                <Text style={styles.emergencyTypeBadgeText}>{contact.contactType}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.emergencyInfo}>
                                            <Text style={styles.emergencyName}>{contact.name}</Text>
                                            {contact.organization && (
                                                <Text style={styles.emergencyOrg}>{contact.organization} {contact.address && `- ${contact.address}`}</Text>
                                            )}
                                        </View>
                                        <Text style={styles.emergencyPhone}>{contact.phone}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerLeft}>
                            {companyName} | Call Sheet v{sheet.version || 1}
                        </Text>
                        <Text style={styles.footerRight}>
                            Page 6
                        </Text>
                    </View>
                </Page>
            )}
        </Document>
    );
}
