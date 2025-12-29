import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from './callSheetStyles';
import PDFHeader from './PDFHeader';
import PDFFooter from './PDFFooter';

/**
 * Page 3 - Cast and Safety
 */
export default function CastSafetyPage({ sheet, cast, companyName }) {
    const enabledSections = sheet.enabledSections || {};

    return (
        <Page size="A4" style={styles.page}>
            <PDFHeader sheet={sheet} pageTitle="Cast & Safety" />

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
            <PDFFooter companyName={companyName} version={sheet.version} pageNumber={3} />
        </Page>
    );
}
