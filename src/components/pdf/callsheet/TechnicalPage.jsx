import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from './callSheetStyles';
import PDFHeader from './PDFHeader';
import PDFFooter from './PDFFooter';

/**
 * Page 5 - Technical Plan
 */
export default function TechnicalPage({ sheet, technical, companyName }) {
    return (
        <Page size="A4" style={styles.page}>
            <PDFHeader sheet={sheet} pageTitle="Technical Plan" />

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

            <PDFFooter companyName={companyName} version={sheet.version} pageNumber={5} />
        </Page>
    );
}
