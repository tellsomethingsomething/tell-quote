import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SECTIONS, SECTION_ORDER } from '../../data/sections';
import { calculateSectionTotal, calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

// Professional color palette
const colors = {
    primary: '#1E3A5F',
    accent: '#00A3E0',
    success: '#10B981',
    danger: '#EF4444',
    dark: '#111827',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
};

const styles = StyleSheet.create({
    // Cover Page
    coverPage: {
        position: 'relative',
        backgroundColor: colors.primary,
    },
    coverBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    coverOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    coverContent: {
        flex: 1,
        padding: 60,
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1,
    },
    coverTop: {
        alignItems: 'flex-start',
    },
    coverLogo: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    coverLogoPlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: colors.accent,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    coverLogoText: {
        color: colors.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    coverCompanyName: {
        fontSize: 14,
        color: colors.white,
        opacity: 0.9,
    },
    coverCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    coverLabel: {
        fontSize: 12,
        color: colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 4,
        marginBottom: 15,
    },
    coverTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 1.2,
    },
    coverSubtitle: {
        fontSize: 14,
        color: colors.white,
        opacity: 0.8,
        textAlign: 'center',
    },
    coverBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    coverMeta: {
        alignItems: 'flex-start',
    },
    coverMetaLabel: {
        fontSize: 8,
        color: colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    coverMetaValue: {
        fontSize: 12,
        color: colors.white,
        marginTop: 2,
    },
    coverQuoteNumber: {
        alignItems: 'flex-end',
    },

    // Proposal Page
    proposalPage: {
        padding: 0,
        fontFamily: 'Helvetica',
        backgroundColor: colors.white,
    },
    accentBar: {
        height: 6,
        backgroundColor: colors.accent,
    },
    proposalContent: {
        padding: 50,
        paddingTop: 40,
    },
    proposalHeader: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingBottom: 15,
    },
    proposalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
    },
    proposalSubtitle: {
        fontSize: 10,
        color: colors.gray,
        marginTop: 5,
    },
    proposalSection: {
        marginBottom: 25,
    },
    proposalSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    proposalText: {
        fontSize: 10,
        color: colors.dark,
        lineHeight: 1.7,
        textAlign: 'justify',
    },
    highlightBox: {
        backgroundColor: colors.lightGray,
        padding: 15,
        borderRadius: 6,
        marginTop: 15,
    },
    highlightTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    highlightItem: {
        fontSize: 9,
        color: colors.dark,
        marginBottom: 4,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    serviceTag: {
        backgroundColor: colors.primary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 4,
    },
    serviceTagText: {
        fontSize: 8,
        color: colors.white,
    },
    investmentBox: {
        backgroundColor: colors.primary,
        padding: 20,
        borderRadius: 8,
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    investmentLabel: {
        fontSize: 12,
        color: colors.white,
        opacity: 0.8,
    },
    investmentValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
    },

    // Quote Pages (same as QuotePDF styles)
    quotePage: {
        padding: 0,
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: colors.white,
    },
    quoteContent: {
        padding: 40,
        paddingTop: 30,
    },
    // ... (reuse styles from QuotePDF)
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
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
});

export default function ProposalPDF({
    quote,
    currency,
    proposalText,
    coverImage,
    settings,
    includeCover = true,
    includeProposal = true,
    includeQuote = true,
}) {
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});
    const { company, quoteDefaults } = settings;

    const quoteDate = new Date(quote.createdAt);
    const preparedByUser = settings.users?.find(u => u.id === quote.preparedBy);
    const preparedByName = preparedByUser?.name || 'Your Account Manager';

    // Parse proposal into paragraphs
    const proposalParagraphs = proposalText ? proposalText.split('\n\n').filter(p => p.trim()) : [];

    // Get services list
    const servicesList = [];
    SECTION_ORDER.forEach(sectionId => {
        const section = sections[sectionId];
        const config = SECTIONS[sectionId];
        if (!section) return;
        const hasItems = Object.values(section.subsections || {}).some(
            items => Array.isArray(items) && items.length > 0
        );
        if (hasItems) {
            servicesList.push(config.name);
        }
    });

    return (
        <Document>
            {/* Page 1: Cover Page */}
            {includeCover && (
                <Page size="A4" style={styles.coverPage}>
                    {coverImage && (
                        <Image src={coverImage} style={styles.coverBackground} />
                    )}
                    <View style={styles.coverOverlay} />

                    <View style={styles.coverContent}>
                        <View style={styles.coverTop}>
                            {company?.logo ? (
                                <Image src={company.logo} style={styles.coverLogo} />
                            ) : (
                                <View style={styles.coverLogoPlaceholder}>
                                    <Text style={styles.coverLogoText}>
                                        {company?.name?.substring(0, 2).toUpperCase() || 'TP'}
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.coverCompanyName}>{company?.name}</Text>
                        </View>

                        <View style={styles.coverCenter}>
                            <Text style={styles.coverLabel}>Proposal & Quotation</Text>
                            <Text style={styles.coverTitle}>{project.title || 'Project Proposal'}</Text>
                            {project.venue && (
                                <Text style={styles.coverSubtitle}>{project.venue}</Text>
                            )}
                            {project.startDate && (
                                <Text style={styles.coverSubtitle}>
                                    {project.startDate}{project.endDate && project.endDate !== project.startDate ? ` - ${project.endDate}` : ''}
                                </Text>
                            )}
                        </View>

                        <View style={styles.coverBottom}>
                            <View style={styles.coverMeta}>
                                <Text style={styles.coverMetaLabel}>Prepared For</Text>
                                <Text style={styles.coverMetaValue}>{client.company || 'Client'}</Text>
                                {client.contact && (
                                    <Text style={[styles.coverMetaValue, { opacity: 0.7, fontSize: 10 }]}>
                                        Attn: {client.contact}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.coverQuoteNumber}>
                                <Text style={styles.coverMetaLabel}>Reference</Text>
                                <Text style={styles.coverMetaValue}>{quote.quoteNumber}</Text>
                                <Text style={[styles.coverMetaValue, { opacity: 0.7, fontSize: 10 }]}>
                                    {quoteDate.toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Page>
            )}

            {/* Page 2: Proposal Page */}
            {includeProposal && proposalParagraphs.length > 0 && (
                <Page size="A4" style={styles.proposalPage}>
                    <View style={styles.accentBar} />
                    <View style={styles.proposalContent}>
                        <View style={styles.proposalHeader}>
                            <Text style={styles.proposalTitle}>Executive Summary</Text>
                            <Text style={styles.proposalSubtitle}>
                                Prepared by {preparedByName} • {company?.name}
                            </Text>
                        </View>

                        {/* Proposal paragraphs */}
                        {proposalParagraphs.map((para, idx) => (
                            <View key={idx} style={styles.proposalSection}>
                                <Text style={styles.proposalText}>{para}</Text>
                            </View>
                        ))}

                        {/* Services Overview */}
                        <View style={styles.highlightBox}>
                            <Text style={styles.highlightTitle}>Services Included</Text>
                            <View style={styles.servicesGrid}>
                                {servicesList.map((service, idx) => (
                                    <View key={idx} style={styles.serviceTag}>
                                        <Text style={styles.serviceTagText}>{service}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Investment Summary */}
                        <View style={styles.investmentBox}>
                            <Text style={styles.investmentLabel}>Total Investment</Text>
                            <Text style={styles.investmentValue}>
                                {formatCurrency(totals.totalCharge, currency)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{company?.name}</Text>
                        <Text style={styles.footerText}>Executive Summary • Page 2</Text>
                    </View>
                </Page>
            )}

            {/* Page 3+: Detailed Quote */}
            {includeQuote && (
                <Page size="A4" style={styles.quotePage}>
                    <View style={styles.accentBar} />
                    <View style={styles.quoteContent}>
                        <View style={styles.header}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>
                                    Detailed Quotation
                                </Text>
                                <Text style={{ fontSize: 9, color: colors.gray, marginTop: 4 }}>
                                    {quote.quoteNumber} • {quoteDate.toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 10, color: colors.dark }}>{client.company}</Text>
                                {client.contact && (
                                    <Text style={{ fontSize: 8, color: colors.gray }}>Attn: {client.contact}</Text>
                                )}
                            </View>
                        </View>

                        {/* Sections */}
                        {SECTION_ORDER.map(sectionId => {
                            const section = sections[sectionId];
                            const config = SECTIONS[sectionId];
                            if (!section) return null;

                            const sectionTotals = calculateSectionTotal(section.subsections);
                            const itemCount = Object.values(section.subsections).reduce(
                                (acc, items) => acc + (Array.isArray(items) ? items.length : 0), 0
                            );

                            if (itemCount === 0) return null;

                            return (
                                <View key={sectionId} style={styles.section} wrap={false}>
                                    <View style={[styles.sectionHeader, { backgroundColor: config.color }]}>
                                        <Text style={styles.sectionTitle}>{config.name}</Text>
                                        <Text style={styles.sectionTotal}>
                                            {formatCurrency(sectionTotals.totalCharge, currency)}
                                        </Text>
                                    </View>

                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
                                        <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
                                        <Text style={[styles.tableHeaderText, styles.col3]}>Days</Text>
                                        <Text style={[styles.tableHeaderText, styles.col4]}>Rate</Text>
                                        <Text style={[styles.tableHeaderText, styles.col5]}>Total</Text>
                                    </View>

                                    {Object.entries(section.subsections || {}).map(([subsectionName, items]) => {
                                        if (!Array.isArray(items) || items.length === 0) return null;

                                        return (
                                            <View key={subsectionName}>
                                                <View style={styles.subsectionRow}>
                                                    <Text style={styles.subsectionTitle}>{subsectionName}</Text>
                                                </View>
                                                {items.map((item, idx) => {
                                                    const displayRate = fees?.distributeFees
                                                        ? totals.getDistributedRate(item.charge || 0)
                                                        : (item.charge || 0);
                                                    const lineTotal = displayRate * (item.quantity || 1) * (item.days || 1);

                                                    return (
                                                        <View key={item.id || idx} style={styles.tableRow}>
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
                                            {fees?.distributeFees
                                                ? formatCurrency(totals.chargeWithFees, currency)
                                                : formatCurrency(totals.baseCharge, currency)
                                            }
                                        </Text>
                                    </View>
                                )}

                                {!fees?.distributeFees && fees?.managementFee > 0 && (
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Management Fee ({fees.managementFee}%)</Text>
                                        <Text style={styles.totalValue}>
                                            {formatCurrency(totals.managementAmount, currency)}
                                        </Text>
                                    </View>
                                )}

                                {!fees?.distributeFees && fees?.commissionFee > 0 && (
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
                                        <Text style={[styles.totalValue, { color: colors.danger }]}>
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
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{company?.name}</Text>
                        <Text style={styles.footerText}>Detailed Quotation • {quote.quoteNumber}</Text>
                    </View>
                </Page>
            )}
        </Document>
    );
}
