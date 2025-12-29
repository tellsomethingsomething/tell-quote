import { Page, Text, View } from '@react-pdf/renderer';
import { styles, colors } from './callSheetStyles';
import PDFHeader from './PDFHeader';
import PDFFooter from './PDFFooter';

/**
 * Page 6 - Vendors and Emergency Contacts
 */
export default function ContactsPage({ sheet, vendors, emergencyContacts, companyName }) {
    return (
        <Page size="A4" style={styles.page}>
            <PDFHeader sheet={sheet} pageTitle="Contacts" />

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

            <PDFFooter companyName={companyName} version={sheet.version} pageNumber={6} />
        </Page>
    );
}
