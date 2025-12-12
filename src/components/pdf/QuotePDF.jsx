import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SECTIONS, SECTION_ORDER } from '../../data/sections';
import { calculateSectionTotal, calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { useSettingsStore } from '../../store/settingsStore';

// Professional color palette
const colors = {
    primary: '#1E3A5F',      // Deep navy blue
    accent: '#00A3E0',       // Vibrant sports blue
    success: '#10B981',      // Green for positive values
    danger: '#EF4444',       // Red for discounts
    dark: '#111827',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
};

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: colors.white,
    },
    // Top accent bar
    accentBar: {
        height: 8,
        backgroundColor: colors.accent,
    },
    // Main content wrapper
    content: {
        padding: 40,
        paddingTop: 30,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    logo: {
        width: 50,
        height: 50,
    },
    logoPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: colors.primary,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    companyInfo: {
        marginTop: 2,
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 2,
    },
    companyDetail: {
        fontSize: 8,
        color: colors.gray,
        marginBottom: 1,
    },
    // Quote badge
    quoteBadge: {
        alignItems: 'flex-end',
    },
    quoteLabel: {
        fontSize: 8,
        color: colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    quoteNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 2,
    },
    quoteMeta: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    quoteMetaText: {
        fontSize: 8,
        color: colors.gray,
    },
    // Project banner
    projectBanner: {
        backgroundColor: colors.primary,
        padding: 20,
        borderRadius: 8,
        marginBottom: 25,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 10,
    },
    projectDetails: {
        flexDirection: 'row',
        gap: 30,
    },
    projectDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    projectIcon: {
        width: 12,
        height: 12,
        backgroundColor: colors.accent,
        borderRadius: 2,
    },
    projectText: {
        fontSize: 9,
        color: colors.white,
        opacity: 0.9,
    },
    // Client info card
    clientCard: {
        backgroundColor: colors.lightGray,
        padding: 15,
        borderRadius: 6,
        marginBottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    clientSection: {
        flex: 1,
    },
    clientLabel: {
        fontSize: 7,
        color: colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    clientName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.dark,
        marginBottom: 2,
    },
    clientDetail: {
        fontSize: 9,
        color: colors.gray,
        marginBottom: 1,
    },
    // Sections
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: colors.primary,
        borderRadius: 4,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.white,
    },
    sectionTotal: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.white,
    },
    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.lightGray,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableHeaderText: {
        fontSize: 7,
        fontWeight: 'bold',
        color: colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tableRowAlt: {
        backgroundColor: '#FAFAFA',
    },
    col1: { width: '42%' },
    col2: { width: '10%', textAlign: 'left' },
    col3: { width: '10%', textAlign: 'left' },
    col4: { width: '19%', textAlign: 'left' },
    col5: { width: '19%', textAlign: 'left' },
    cellText: {
        fontSize: 9,
        color: colors.dark,
    },
    cellTextLight: {
        fontSize: 9,
        color: colors.gray,
    },
    // Subsection
    subsectionRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#F9FAFB',
    },
    subsectionTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Totals
    totalsSection: {
        marginTop: 25,
        alignItems: 'flex-end',
    },
    totalsBox: {
        width: 280,
        backgroundColor: colors.lightGray,
        borderRadius: 6,
        padding: 15,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 10,
        color: colors.gray,
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.dark,
    },
    totalValueDiscount: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.danger,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    // Bottom section
    bottomSection: {
        marginTop: 30,
        flexDirection: 'row',
        gap: 20,
    },
    infoBox: {
        flex: 1,
        padding: 15,
        backgroundColor: colors.lightGray,
        borderRadius: 6,
    },
    infoBoxTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoBoxText: {
        fontSize: 8,
        color: colors.gray,
        lineHeight: 1.5,
    },
    // Signature section
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
        marginBottom: 8,
        paddingBottom: 30,
    },
    signatureLabel: {
        fontSize: 8,
        color: colors.gray,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 12,
        paddingHorizontal: 40,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 7,
        color: colors.white,
        opacity: 0.8,
    },
    footerAccent: {
        fontSize: 7,
        color: colors.accent,
    },
    // Terms & Conditions Page
    termsPage: {
        padding: 0,
        fontSize: 7,
        fontFamily: 'Helvetica',
        backgroundColor: colors.white,
    },
    termsContent: {
        padding: 40,
        paddingTop: 30,
        paddingBottom: 60,
    },
    termsHeader: {
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: colors.accent,
    },
    termsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    termsSubtitle: {
        fontSize: 8,
        color: colors.gray,
    },
    termsColumns: {
        flexDirection: 'row',
        gap: 20,
    },
    termsColumn: {
        flex: 1,
    },
    termsText: {
        fontSize: 7,
        color: colors.dark,
        lineHeight: 1.6,
        textAlign: 'justify',
    },
});

export default function QuotePDF({ quote, currency, includeTerms = false }) {
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});
    const settings = useSettingsStore.getState().settings;
    const { company, taxInfo, bankDetails, pdfOptions, quoteDefaults } = settings;

    const quoteDate = new Date(quote.createdAt);
    const validUntil = new Date(quoteDate);
    validUntil.setDate(quoteDate.getDate() + (quote.validityDays || quoteDefaults.validityDays));

    const preparedByUser = settings.users.find(u => u.id === quote.preparedBy);
    const preparedByName = preparedByUser ? preparedByUser.name : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Top accent bar */}
                <View style={styles.accentBar} />

                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoSection}>
                            {company.logo && pdfOptions.showLogo ? (
                                <Image src={company.logo} style={styles.logo} />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Text style={styles.logoText}>
                                        {company.name ? company.name.substring(0, 2).toUpperCase() : 'TP'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.companyInfo}>
                                <Text style={styles.companyName}>{company.name}</Text>
                                {pdfOptions.showCompanyAddress && company.address && (
                                    <Text style={styles.companyDetail}>{company.address}</Text>
                                )}
                                {pdfOptions.showCompanyPhone && company.phone && (
                                    <Text style={styles.companyDetail}>{company.phone}</Text>
                                )}
                                {pdfOptions.showCompanyEmail && company.email && (
                                    <Text style={styles.companyDetail}>{company.email}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.quoteBadge}>
                            <Text style={styles.quoteLabel}>Quotation</Text>
                            <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
                            <View style={styles.quoteMeta}>
                                <Text style={styles.quoteMetaText}>Date: {quoteDate.toLocaleDateString()}</Text>
                                <Text style={styles.quoteMetaText}>Valid Until: {validUntil.toLocaleDateString()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Project Banner */}
                    {project.title && (
                        <View style={styles.projectBanner}>
                            <Text style={styles.projectTitle}>{project.title}</Text>
                            <View style={styles.projectDetails}>
                                {project.venue && (
                                    <View style={styles.projectDetail}>
                                        <View style={styles.projectIcon} />
                                        <Text style={styles.projectText}>{project.venue}</Text>
                                    </View>
                                )}
                                {project.startDate && (
                                    <View style={styles.projectDetail}>
                                        <View style={styles.projectIcon} />
                                        <Text style={styles.projectText}>
                                            {project.startDate}
                                            {project.endDate && project.endDate !== project.startDate && ` – ${project.endDate}`}
                                        </Text>
                                    </View>
                                )}
                                {project.type && (
                                    <View style={styles.projectDetail}>
                                        <View style={styles.projectIcon} />
                                        <Text style={styles.projectText}>{project.type}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Client Card */}
                    <View style={styles.clientCard}>
                        <View style={styles.clientSection}>
                            <Text style={styles.clientLabel}>Bill To</Text>
                            {client.company && <Text style={styles.clientName}>{client.company}</Text>}
                            {client.contact && <Text style={styles.clientDetail}>Attn: {client.contact}</Text>}
                            {client.email && <Text style={styles.clientDetail}>{client.email}</Text>}
                            {client.phone && <Text style={styles.clientDetail}>{client.phone}</Text>}
                        </View>
                        {preparedByName && (
                            <View style={styles.clientSection}>
                                <Text style={styles.clientLabel}>Prepared By</Text>
                                <Text style={styles.clientName}>{preparedByName}</Text>
                                <Text style={styles.clientDetail}>{company.name}</Text>
                            </View>
                        )}
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
                            <View key={sectionId} style={styles.section} wrap={false}>
                                <View style={[styles.sectionHeader, { backgroundColor: config.color }]}>
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
                                            <View style={styles.subsectionRow}>
                                                <Text style={styles.subsectionTitle}>{subsectionName}</Text>
                                            </View>
                                            {items.map((item, idx) => {
                                                const displayRate = fees.distributeFees
                                                    ? totals.getDistributedRate(item.charge || 0)
                                                    : (item.charge || 0);
                                                const lineTotal = displayRate * (item.quantity || 1) * (item.days || 1);

                                                return (
                                                    <View key={item.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                                                        <Text style={[styles.cellText, styles.col1]}>{item.name || 'Item'}</Text>
                                                        <Text style={[styles.cellTextLight, styles.col2]}>{item.quantity || 1}</Text>
                                                        <Text style={[styles.cellTextLight, styles.col3]}>{item.days || 1}</Text>
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
                        <View style={styles.totalsBox}>
                            {(fees?.discount > 0 || fees?.managementFee > 0 || fees?.commissionFee > 0) && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Subtotal</Text>
                                    <Text style={styles.totalValue}>
                                        {fees.distributeFees
                                            ? formatCurrency(totals.chargeWithFees, currency)
                                            : formatCurrency(totals.baseCharge, currency)
                                        }
                                    </Text>
                                </View>
                            )}

                            {!fees.distributeFees && fees?.managementFee > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Management Fee ({fees.managementFee}%)</Text>
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

                            {fees?.discount > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Discount ({fees.discount}%)</Text>
                                    <Text style={styles.totalValueDiscount}>
                                        -{formatCurrency(totals.discountAmount, currency)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                                <Text style={styles.grandTotalValue}>
                                    {formatCurrency(totals.totalCharge, currency)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Terms and Bank Info */}
                    <View style={styles.bottomSection}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxTitle}>Terms & Conditions</Text>
                            <Text style={styles.infoBoxText}>
                                {quoteDefaults.termsAndConditions}
                            </Text>
                        </View>

                        {pdfOptions.showBankDetails && (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoBoxTitle}>Payment Details</Text>
                                <Text style={styles.infoBoxText}>Bank: {bankDetails.bankName}</Text>
                                <Text style={styles.infoBoxText}>Account: {bankDetails.accountName}</Text>
                                <Text style={styles.infoBoxText}>No: {bankDetails.accountNumber}</Text>
                                {bankDetails.swiftCode && (
                                    <Text style={styles.infoBoxText}>SWIFT: {bankDetails.swiftCode}</Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Signature Section */}
                    <View style={styles.signatureSection}>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>Client Signature & Date</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>Authorized Signature</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        {company.name} {company.website && `• ${company.website}`}
                    </Text>
                    <Text style={styles.footerText}>
                        <Text style={styles.footerAccent}>Quote {quote.quoteNumber}</Text> • Generated {new Date().toLocaleDateString()}
                    </Text>
                </View>
            </Page>

            {/* Terms & Conditions Page */}
            {includeTerms && quoteDefaults.termsAndConditions && (
                <Page size="A4" style={styles.termsPage}>
                    <View style={styles.accentBar} />
                    <View style={styles.termsContent}>
                        <View style={styles.termsHeader}>
                            <Text style={styles.termsTitle}>Terms & Conditions</Text>
                            <Text style={styles.termsSubtitle}>
                                {company.name} • Quote {quote.quoteNumber}
                            </Text>
                        </View>

                        {/* Split terms into columns */}
                        <View style={styles.termsColumns}>
                            {(() => {
                                const terms = quoteDefaults.termsAndConditions;
                                const lines = terms.split('\n').filter(l => l.trim());
                                const midPoint = Math.ceil(lines.length / 2);
                                const col1 = lines.slice(0, midPoint).join('\n');
                                const col2 = lines.slice(midPoint).join('\n');

                                return (
                                    <>
                                        <View style={styles.termsColumn}>
                                            <Text style={styles.termsText}>{col1}</Text>
                                        </View>
                                        <View style={styles.termsColumn}>
                                            <Text style={styles.termsText}>{col2}</Text>
                                        </View>
                                    </>
                                );
                            })()}
                        </View>
                    </View>

                    <View style={styles.footer} fixed>
                        <Text style={styles.footerText}>
                            {company.name} {company.website && `• ${company.website}`}
                        </Text>
                        <Text style={styles.footerText}>
                            Terms & Conditions • Page 2
                        </Text>
                    </View>
                </Page>
            )}
        </Document>
    );
}
