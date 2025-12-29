import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from './callSheetStyles';
import { formatTime } from './callSheetHelpers';
import PDFHeader from './PDFHeader';
import PDFFooter from './PDFFooter';

/**
 * Page 1 content: call times banner, important notes, personnel,
 * location, weather, catering, schedule, wardrobe, transport
 */
export default function MainPage({ sheet, companyName }) {
    const enabledSections = sheet.enabledSections || {};

    return (
        <Page size="A4" style={styles.page}>
            {/* Header Banner */}
            <PDFHeader sheet={sheet} />

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
            <PDFFooter companyName={companyName} version={sheet.version} pageNumber={1} />
        </Page>
    );
}
