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

// Department colors for visual distinction
const getDeptColor = (deptId) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    return dept?.color || '#64748B';
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
export default function CallSheetPDF({ sheet, crew = [], cast = [], settings = {} }) {
    const enabledSections = sheet.enabledSections || {};
    const crewByDept = groupCrewByDepartment(crew);
    const companyName = settings.companyName || 'Tell Productions';
    const logoUrl = settings.logoUrl;

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
        </Document>
    );
}
