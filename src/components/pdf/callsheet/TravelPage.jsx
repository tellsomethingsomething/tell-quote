import { Page, Text, View } from '@react-pdf/renderer';
import { styles, colors } from './callSheetStyles';
import PDFHeader from './PDFHeader';
import PDFFooter from './PDFFooter';

/**
 * Page 4 - Travel and Logistics
 */
export default function TravelPage({ sheet, flights, transfers, accommodation, vehicles, companyName }) {
    return (
        <Page size="A4" style={styles.page}>
            <PDFHeader sheet={sheet} pageTitle="Travel & Logistics" />

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

            <PDFFooter companyName={companyName} version={sheet.version} pageNumber={4} />
        </Page>
    );
}
