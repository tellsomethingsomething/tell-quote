import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { SECTIONS, SECTION_ORDER } from '../../data/sections';
import { calculateSectionTotal, calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { useSettingsStore } from '../../store/settingsStore';

// Register fonts (using Helvetica which is built-in)
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#3B82F6',
    },
    logo: {
        width: 60,
        height: 60,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    logoText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    companyInfo: {
        alignItems: 'flex-end',
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    companyDetail: {
        fontSize: 9,
        color: '#6b7280',
        marginTop: 2,
        textAlign: 'right',
    },
    quoteNumber: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
        fontWeight: 'bold',
    },
    quoteDate: {
        fontSize: 9,
        color: '#9ca3af',
        marginTop: 2,
    },
    // Title
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 20,
        textAlign: 'center',
    },
    // Client & Project Info
    infoSection: {
        flexDirection: 'row',
        marginBottom: 25,
        gap: 20,
    },
    infoBox: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
    },
    infoTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoText: {
        fontSize: 10,
        color: '#4b5563',
        marginBottom: 3,
    },
    infoLabel: {
        fontSize: 8,
        color: '#9ca3af',
        marginBottom: 1,
    },
    // Sections
    section: {
        marginBottom: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    sectionTotal: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    // Table
    table: {
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e5e7eb',
        padding: 8,
        borderRadius: 3,
    },
    tableHeaderText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    col1: { width: '40%' },
    col2: { width: '10%', textAlign: 'center' },
    col3: { width: '10%', textAlign: 'center' },
    col4: { width: '20%', textAlign: 'right' },
    col5: { width: '20%', textAlign: 'right' },
    cellText: {
        fontSize: 9,
        color: '#4b5563',
    },
    // Subsection
    subsectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#6b7280',
        marginTop: 8,
        marginBottom: 4,
        marginLeft: 4,
    },
    // Totals
    totalsSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 2,
        borderTopColor: '#e5e7eb',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
        paddingRight: 10,
    },
    totalLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginRight: 20,
        width: 100,
        textAlign: 'right',
    },
    totalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1f2937',
        width: 100,
        textAlign: 'right',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 10,
        paddingRight: 10,
        borderTopWidth: 1,
        borderTopColor: '#3B82F6',
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginRight: 20,
        width: 100,
        textAlign: 'right',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3B82F6',
        width: 100,
        textAlign: 'right',
    },
    // Terms & Bank
    bottomSection: {
        marginTop: 30,
        flexDirection: 'row',
        gap: 20,
    },
    terms: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
    },
    bankDetails: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
    },
    sectionTitleSmall: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    textSmall: {
        fontSize: 8,
        color: '#6b7280',
        lineHeight: 1.4,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerText: {
        fontSize: 8,
        color: '#9ca3af',
    },
});

export default function QuotePDF({ quote, currency }) {
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});
    // Direct access to settings store state since this is inside a component
    const settings = useSettingsStore.getState().settings;
    const { company, taxInfo, bankDetails, pdfOptions, quoteDefaults } = settings;

    // Calculate valid until date
    const quoteDate = new Date(quote.createdAt);
    const validUntil = new Date(quoteDate);
    validUntil.setDate(quoteDate.getDate() + (quote.validityDays || quoteDefaults.validityDays));

    // Get prepared by user
    const preparedByUser = settings.users.find(u => u.id === quote.preparedBy);
    const preparedByName = preparedByUser ? preparedByUser.name : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logo}>
                        {company.logo && pdfOptions.showLogo ? (
                            <Image src={company.logo} style={styles.logoImage} />
                        ) : (
                            <Text style={styles.logoText}>TP</Text>
                        )}
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{company.name}</Text>
                        {pdfOptions.showCompanyAddress && company.address && (
                            <Text style={styles.companyDetail}>{company.address}</Text>
                        )}
                        {pdfOptions.showCompanyAddress && company.city && company.country && (
                            <Text style={styles.companyDetail}>{company.city}, {company.country}</Text>
                        )}
                        {pdfOptions.showCompanyPhone && company.phone && (
                            <Text style={styles.companyDetail}>Tel: {company.phone}</Text>
                        )}
                        {pdfOptions.showCompanyEmail && company.email && (
                            <Text style={styles.companyDetail}>{company.email}</Text>
                        )}
                        {pdfOptions.showTaxNumber && taxInfo.taxNumber && (
                            <Text style={styles.companyDetail}>Tax ID: {taxInfo.taxNumber}</Text>
                        )}

                        <Text style={styles.quoteNumber}>Quote: {quote.quoteNumber}</Text>
                        <Text style={styles.quoteDate}>
                            Date: {quoteDate.toLocaleDateString()}
                        </Text>
                        <Text style={styles.quoteDate}>
                            Valid Until: {validUntil.toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Client & Project Info */}
                <View style={styles.infoSection}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>Client</Text>
                        {client.company && <Text style={styles.infoText}>{client.company}</Text>}
                        {client.contact && <Text style={styles.infoText}>{client.contact}</Text>}
                        {client.email && <Text style={styles.infoText}>{client.email}</Text>}
                        {client.phone && <Text style={styles.infoText}>{client.phone}</Text>}
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>Project</Text>
                        {project.title && <Text style={styles.infoText}>{project.title}</Text>}
                        {project.venue && <Text style={styles.infoText}>{project.venue}</Text>}
                        {project.startDate && (
                            <Text style={styles.infoText}>
                                {project.startDate}
                                {project.endDate && project.endDate !== project.startDate && ` – ${project.endDate}`}
                            </Text>
                        )}
                        {project.description && <Text style={styles.infoText}>{project.description}</Text>}
                    </View>
                </View>

                {/* Sections */}
                {SECTION_ORDER.map(sectionId => {
                    const section = sections[sectionId];
                    const config = SECTIONS[sectionId];
                    if (!section) return null;

                    const sectionTotals = calculateSectionTotal(section.subsections);
                    const itemCount = Object.values(section.subsections).reduce((acc, items) => acc + items.length, 0);

                    if (itemCount === 0) return null;

                    return (
                        <View key={sectionId} style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{config.name}</Text>
                                <Text style={styles.sectionTotal}>
                                    {formatCurrency(sectionTotals.totalCharge, currency)}
                                </Text>
                            </View>

                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
                                <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
                                <Text style={[styles.tableHeaderText, styles.col3]}>Days</Text>
                                <Text style={[styles.tableHeaderText, styles.col4]}>Rate</Text>
                                <Text style={[styles.tableHeaderText, styles.col5]}>Total</Text>
                            </View>

                            {/* Subsections with items */}
                            {Object.entries(section.subsections).map(([subsectionName, items]) => {
                                if (items.length === 0) return null;

                                return (
                                    <View key={subsectionName}>
                                        <Text style={styles.subsectionTitle}>{subsectionName}</Text>
                                        {items.map((item, idx) => {
                                            // Determine display rate: inflate if distributing fees, otherwise real rate
                                            const displayRate = fees.distributeFees
                                                ? totals.getDistributedRate(item.charge || 0)
                                                : (item.charge || 0);

                                            // Calculate LINE total based on display rate (so it mathematically checks out for the client)
                                            // Real math: (Charge * (1 + Fees)) * Qty * Days
                                            const lineTotal = displayRate * (item.quantity || 1) * (item.days || 1);

                                            return (
                                                <View key={item.id || idx} style={styles.tableRow}>
                                                    <Text style={[styles.cellText, styles.col1]}>{item.name || 'Item'}</Text>
                                                    <Text style={[styles.cellText, styles.col2]}>{item.quantity || 1}</Text>
                                                    <Text style={[styles.cellText, styles.col3]}>{item.days || 1}</Text>
                                                    <Text style={[styles.cellText, styles.col4]}>
                                                        {formatCurrency(displayRate, currency)}
                                                    </Text>
                                                    <Text style={[styles.cellText, styles.col5]}>
                                                        {formatCurrency(lineTotal, currency)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}

                {/* Totals */}
                <View style={styles.totalsSection}>
                    {/* Only show subtotal if there's a discount or fees involved internally */}
                    {(fees?.discount > 0 || fees?.managementFee > 0 || fees?.commissionFee > 0) && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>
                                {fees.distributeFees
                                    ? formatCurrency(totals.chargeWithFees, currency) // If distributed, subtotal ALREADY includes fees
                                    : formatCurrency(totals.baseCharge, currency)     // If not, subtotal is base charge
                                }
                            </Text>
                        </View>
                    )}

                    {/* Management & Commission Fees - Only shown if NOT distributed */}
                    {!fees.distributeFees && fees?.managementFee > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Mgmt Fee ({fees.managementFee}%)</Text>
                            <Text style={styles.totalValue}>
                                {formatCurrency(totals.managementAmount, currency)}
                            </Text>
                        </View>
                    )}

                    {!fees.distributeFees && fees?.commissionFee > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Commission ({fees.commissionFee}%)</Text>
                            <Text style={styles.totalValue}>
                                {formatCurrency(totals.commissionAmount, currency)}
                            </Text>
                        </View>
                    )}

                    {/* Discount - only visible fee to client */}
                    {fees?.discount > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Discount ({fees.discount}%)</Text>
                            <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                                -{formatCurrency(totals.discountAmount, currency)}
                            </Text>
                        </View>
                    )}

                    {/* Grand Total */}
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>QUOTE TOTAL</Text>
                        <Text style={styles.grandTotalValue}>
                            {formatCurrency(totals.totalCharge, currency)}
                        </Text>
                    </View>
                </View>

                {/* Terms and Bank Info Side by Side */}
                <View style={styles.bottomSection}>
                    {/* Terms */}
                    <View style={styles.terms}>
                        <Text style={styles.sectionTitleSmall}>Terms & Conditions</Text>
                        <Text style={styles.textSmall}>
                            {quoteDefaults.termsAndConditions}
                        </Text>
                    </View>

                    {/* Bank Details */}
                    {pdfOptions.showBankDetails && (
                        <View style={styles.bankDetails}>
                            <Text style={styles.sectionTitleSmall}>Payment Details</Text>
                            <Text style={styles.textSmall}>Bank: {bankDetails.bankName}</Text>
                            <Text style={styles.textSmall}>Account Name: {bankDetails.accountName}</Text>
                            <Text style={styles.textSmall}>Account No: {bankDetails.accountNumber}</Text>
                            {bankDetails.swiftCode && (
                                <Text style={styles.textSmall}>SWIFT: {bankDetails.swiftCode}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <View>
                        <Text style={styles.footerText}>{company.name} - {company.website || company.email}</Text>
                        {preparedByName && (
                            <Text style={[styles.footerText, { marginTop: 2 }]}>Prepared by: {preparedByName}</Text>
                        )}
                    </View>
                    <Text style={styles.footerText}>
                        Generated: {new Date().toLocaleDateString()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
