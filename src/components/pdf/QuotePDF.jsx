import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { SECTIONS, SECTION_ORDER } from '../../data/sections';
import { calculateSectionTotal, calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { useSettingsStore } from '../../store/settingsStore';

// Register fonts for a more creative look
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 500 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
    ],
});

// Tell Brand Color Palette - Business Class
const colors = {
    // Primary Brand
    navy: '#143642',
    teal: '#0F8B8D',
    orange: '#FE7F2D',
    // Refined Neutrals
    charcoal: '#1E2A32',
    slate: '#3D4F5F',
    steel: '#5A6B78',
    silver: '#8899A6',
    mist: '#C4CDD5',
    pearl: '#E8ECEF',
    snow: '#F8F9FA',
    white: '#FFFFFF',
    // Functional
    success: '#0F8B8D',
    danger: '#C53030',
};

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 9,
        fontFamily: 'Inter',
        backgroundColor: colors.white,
    },

    // === HEADER ===
    header: {
        paddingTop: 40,
        paddingHorizontal: 48,
        paddingBottom: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    logoSection: {},
    logo: {
        width: 80,
        height: 24,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 700,
        color: colors.navy,
        letterSpacing: -1,
    },
    documentType: {
        alignItems: 'flex-end',
    },
    documentTitle: {
        fontSize: 11,
        fontWeight: 600,
        color: colors.silver,
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 8,
    },
    quoteNumber: {
        fontSize: 24,
        fontWeight: 700,
        color: colors.navy,
        letterSpacing: -0.5,
    },

    // === META INFO BAR ===
    metaBar: {
        flexDirection: 'row',
        backgroundColor: colors.snow,
        borderRadius: 6,
        padding: 16,
        marginBottom: 28,
    },
    metaItem: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: colors.mist,
        paddingRight: 16,
    },
    metaItemLast: {
        flex: 1,
        paddingLeft: 16,
        borderRightWidth: 0,
    },
    metaLabel: {
        fontSize: 7,
        fontWeight: 600,
        color: colors.silver,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 10,
        fontWeight: 500,
        color: colors.charcoal,
    },

    // === CONTENT ===
    content: {
        paddingHorizontal: 48,
        paddingBottom: 100,
    },

    // === PROJECT BANNER ===
    projectBanner: {
        backgroundColor: colors.navy,
        borderRadius: 8,
        padding: 28,
        marginBottom: 28,
    },
    projectLabel: {
        fontSize: 8,
        fontWeight: 600,
        color: colors.teal,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    projectTitle: {
        fontSize: 20,
        fontWeight: 700,
        color: colors.white,
        marginBottom: 20,
        letterSpacing: -0.3,
    },
    projectDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    projectDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    projectDetailText: {
        fontSize: 10,
        color: colors.white,
    },

    // === CLIENT ROW ===
    clientRow: {
        flexDirection: 'row',
        marginBottom: 32,
    },
    clientCard: {
        flex: 1,
        padding: 20,
        backgroundColor: colors.snow,
        borderRadius: 6,
        marginRight: 10,
    },
    clientCardLast: {
        flex: 1,
        padding: 20,
        backgroundColor: colors.snow,
        borderRadius: 6,
        marginLeft: 10,
    },
    clientLabel: {
        fontSize: 7,
        fontWeight: 600,
        color: colors.teal,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 10,
    },
    clientName: {
        fontSize: 14,
        fontWeight: 600,
        color: colors.navy,
        marginBottom: 6,
    },
    clientDetail: {
        fontSize: 9,
        color: colors.slate,
        marginBottom: 3,
        lineHeight: 1.4,
    },

    // === SECTIONS ===
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.navy,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginBottom: 1,
    },
    sectionHeaderAccent: {
        borderLeftWidth: 4,
        borderLeftColor: colors.teal,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 600,
        color: colors.white,
        letterSpacing: 0.3,
    },
    sectionTotal: {
        fontSize: 11,
        fontWeight: 700,
        color: colors.white,
    },

    // === TABLE ===
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.pearl,
    },
    tableHeaderText: {
        fontSize: 7,
        fontWeight: 600,
        color: colors.steel,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.pearl,
    },
    tableRowAlt: {
        backgroundColor: colors.snow,
    },
    col1: { width: '44%' },
    col2: { width: '10%', textAlign: 'center' },
    col3: { width: '10%', textAlign: 'center' },
    col4: { width: '18%', textAlign: 'right' },
    col5: { width: '18%', textAlign: 'right' },
    cellText: {
        fontSize: 9,
        color: colors.charcoal,
    },
    cellTextMuted: {
        fontSize: 9,
        color: colors.steel,
    },
    cellTextBold: {
        fontSize: 9,
        fontWeight: 600,
        color: colors.charcoal,
    },

    // === SUBSECTION ===
    subsectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.pearl,
    },
    subsectionDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.teal,
        marginRight: 10,
    },
    subsectionTitle: {
        fontSize: 8,
        fontWeight: 600,
        color: colors.slate,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    // === TOTALS ===
    totalsSection: {
        marginTop: 32,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalsCard: {
        width: 300,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.pearl,
    },
    totalLabel: {
        fontSize: 10,
        color: colors.slate,
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 500,
        color: colors.charcoal,
    },
    totalValueDiscount: {
        fontSize: 10,
        fontWeight: 500,
        color: colors.danger,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.navy,
        borderRadius: 6,
        marginTop: 8,
    },
    grandTotalLabel: {
        fontSize: 11,
        fontWeight: 600,
        color: colors.white,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: 700,
        color: colors.white,
    },

    // === NOTES SECTION ===
    notesSection: {
        marginTop: 40,
        flexDirection: 'row',
    },
    notesCard: {
        flex: 1,
        padding: 20,
        backgroundColor: colors.snow,
        borderRadius: 6,
        borderTopWidth: 3,
        borderTopColor: colors.teal,
        marginRight: 10,
    },
    notesCardLast: {
        flex: 1,
        padding: 20,
        backgroundColor: colors.snow,
        borderRadius: 6,
        borderTopWidth: 3,
        borderTopColor: colors.teal,
        marginLeft: 10,
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: 700,
        color: colors.navy,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    notesText: {
        fontSize: 8,
        color: colors.slate,
        lineHeight: 1.7,
    },

    // === FOOTER ===
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
    },
    footerAccentBar: {
        height: 4,
        flexDirection: 'row',
    },
    footerAccentTeal: {
        flex: 4,
        backgroundColor: colors.teal,
    },
    footerAccentOrange: {
        flex: 1,
        backgroundColor: colors.orange,
    },
    footerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 48,
        backgroundColor: colors.navy,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLogo: {
        fontSize: 12,
        fontWeight: 700,
        color: colors.white,
        marginRight: 16,
    },
    footerDivider: {
        width: 1,
        height: 12,
        backgroundColor: colors.slate,
        marginRight: 16,
    },
    footerText: {
        fontSize: 8,
        color: colors.silver,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerQuoteNum: {
        fontSize: 8,
        fontWeight: 600,
        color: colors.teal,
    },
    footerPage: {
        fontSize: 8,
        color: colors.silver,
        marginLeft: 16,
    },

    // === TERMS PAGE ===
    termsPage: {
        padding: 0,
        fontSize: 8,
        fontFamily: 'Inter',
        backgroundColor: colors.white,
    },
    termsHeader: {
        paddingTop: 40,
        paddingHorizontal: 48,
        paddingBottom: 24,
        borderBottomWidth: 3,
        borderBottomColor: colors.teal,
        marginBottom: 32,
    },
    termsTitle: {
        fontSize: 24,
        fontWeight: 700,
        color: colors.navy,
        letterSpacing: -0.5,
    },
    termsSubtitle: {
        fontSize: 9,
        color: colors.silver,
        marginTop: 8,
    },
    termsContent: {
        paddingHorizontal: 48,
        paddingBottom: 100,
    },
    termsColumns: {
        flexDirection: 'row',
    },
    termsColumn: {
        flex: 1,
        paddingRight: 16,
    },
    termsColumnLast: {
        flex: 1,
        paddingLeft: 16,
    },
    termsText: {
        fontSize: 8,
        color: colors.slate,
        lineHeight: 1.8,
    },
});

// Tell logo as base64 SVG for PDF embedding
const TELL_LOGO_LIGHT = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTM2IiBoZWlnaHQ9IjMyOSIgdmlld0JveD0iMCAwIDUzNiAzMjkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xNDkuNzA4IDEyMy4wNzVIMTA5LjE2N1YyNDguNzYzSDY4LjI1MDRWMTIzLjA3NUgyNy43MDk1VjkwLjE1ODJIMTQ5LjcwOFYxMjMuMDc1WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI1NS45MzkgMjQ4Ljc2M0gxNjMuMjQ4VjkwLjE1ODJIMjU1LjkzOVYxMjMuMDc1SDE5OC4xNjVWMTUyLjA5N0gyNDguNjk4VjE4NC4xNjFIMTk4LjE2NVYyMTUuODQ2SDI1NS45MzlWMjQ4Ljc2M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yNzMuODQ5IDI0OC43NjNWOTAuMTU4MkgzMTQuNzY2VjIxNS44NDZIMZC2LjE0NVYyNDguNzYzSDI3My44NDlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDAwLjU0NyAyNDguNzYzVjkwLjE1ODJINDQxLjQ2NFYyMTUuODQ2SDQ5Mi44NTNWMJQ4Ljc2M0g0MDAuNTQ3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTUzNiAxNjQuNjM2TDM3My41MzEgMjkwLjQzOEw1MzYgMTY0LjYzNloiIGZpbGw9IiMwRjhCOEQiLz4KPHBhdGggZD0iTTUzNiAxNjQuNjM2TDQ0OC4zMzMgMTIuNzg3NUw1MzYgMTY0LjYzNloiIGZpbGw9IiMwRjhCOEQiLz4KPHBhdGggZD0iTTUwNy4yMjkgMzI4LjIwN0gzNzMuNTMxTDQ1MC44NTggMjMwLjU0M0w1MDcuMjI5IDMyOC4yMDdaIiBmaWxsPSIjREJEMkQ4Ii8+CjxwYXRoIGQ9Ik0zNjAuNzE4IDc0LjQzMTJMMjczLjUzMSAzMjguMjA3TDM4My4zMDEgMjE5Ljg1N0wzNjAuNzE4IDc0LjQzMTJaIiBmaWxsPSIjREJEMkQ4Ii8+CjxwYXRoIGQ9Ik0zNzMuNTMxIDI5MC40MzhMNTM2IDE2NC42MzZMMzczLjUzMSAyOTAuNDM4WiIgZmlsbD0iIzE0MzY0MiIvPgo8L3N2Zz4=';

export default function QuotePDF({ quote, currency, includeTerms = false }) {
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});
    const settings = useSettingsStore.getState().settings;
    const { company, bankDetails, pdfOptions, quoteDefaults } = settings;

    // Use custom section order if available
    const sectionOrder = quote.sectionOrder || SECTION_ORDER;

    const quoteDate = new Date(quote.createdAt || new Date());
    const validUntil = new Date(quoteDate);
    validUntil.setDate(quoteDate.getDate() + (quote.validityDays || quoteDefaults?.validityDays || 30));

    const preparedByUser = settings.users?.find(u => u.id === quote.preparedBy);
    const preparedByName = preparedByUser ? preparedByUser.name : '';

    // Get custom section name or default
    const getSectionName = (sectionId) => {
        return quote.sectionNames?.[sectionId] || SECTIONS[sectionId]?.name || sectionId;
    };

    // Get custom subsection name or default
    const getSubsectionName = (sectionId, subsectionName) => {
        return sections?.[sectionId]?.subsectionNames?.[subsectionName] || subsectionName;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.logoSection}>
                            {company?.logo && pdfOptions?.showLogo ? (
                                <Image src={company.logo} style={styles.logo} />
                            ) : (
                                <Text style={styles.logoText}>tell</Text>
                            )}
                        </View>
                        <View style={styles.documentType}>
                            <Text style={styles.documentTitle}>Quotation</Text>
                            <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
                        </View>
                    </View>

                    {/* Meta Information Bar */}
                    <View style={styles.metaBar}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Date</Text>
                            <Text style={styles.metaValue}>{quoteDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Valid Until</Text>
                            <Text style={styles.metaValue}>{validUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Currency</Text>
                            <Text style={styles.metaValue}>{currency}</Text>
                        </View>
                        <View style={styles.metaItemLast}>
                            <Text style={styles.metaLabel}>Reference</Text>
                            <Text style={styles.metaValue}>{quote.quoteNumber}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Project Banner */}
                    {project?.title && (
                        <View style={styles.projectBanner}>
                            <Text style={styles.projectLabel}>Project</Text>
                            <Text style={styles.projectTitle}>{project.title}</Text>
                            <View style={styles.projectDetails}>
                                {project.venue && (
                                    <View style={styles.projectDetail}>
                                        <Text style={styles.projectDetailText}>{project.venue}</Text>
                                    </View>
                                )}
                                {project.startDate && (
                                    <View style={styles.projectDetail}>
                                        <Text style={styles.projectDetailText}>
                                            {project.startDate}{project.endDate && project.endDate !== project.startDate ? ` — ${project.endDate}` : ''}
                                        </Text>
                                    </View>
                                )}
                                {project.type && (
                                    <View style={styles.projectDetail}>
                                        <Text style={styles.projectDetailText}>{project.type}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Client & Prepared By */}
                    <View style={styles.clientRow}>
                        <View style={styles.clientCard}>
                            <Text style={styles.clientLabel}>Bill To</Text>
                            {client?.company && <Text style={styles.clientName}>{client.company}</Text>}
                            {client?.contact && <Text style={styles.clientDetail}>Attn: {client.contact}</Text>}
                            {client?.email && <Text style={styles.clientDetail}>{client.email}</Text>}
                            {client?.phone && <Text style={styles.clientDetail}>{client.phone}</Text>}
                        </View>
                        <View style={styles.clientCardLast}>
                            <Text style={styles.clientLabel}>From</Text>
                            <Text style={styles.clientName}>{company?.name || 'Tell'}</Text>
                            {preparedByName && <Text style={styles.clientDetail}>Prepared by: {preparedByName}</Text>}
                            {company?.email && <Text style={styles.clientDetail}>{company.email}</Text>}
                            {company?.phone && <Text style={styles.clientDetail}>{company.phone}</Text>}
                        </View>
                    </View>

                    {/* Sections */}
                    {sectionOrder.map(sectionId => {
                        const section = sections?.[sectionId];
                        const config = SECTIONS[sectionId];
                        if (!section || !config) return null;

                        const subsectionOrder = section.subsectionOrder ||
                            [...config.subsections, ...(section.customSubsections || [])];

                        const sectionTotals = calculateSectionTotal(section.subsections);
                        const itemCount = Object.values(section.subsections || {}).reduce((acc, items) => acc + items.length, 0);

                        if (itemCount === 0) return null;

                        return (
                            <View key={sectionId} style={styles.section} wrap={false}>
                                <View style={[styles.sectionHeader, styles.sectionHeaderAccent, { borderLeftColor: config.color }]}>
                                    <Text style={styles.sectionTitle}>{getSectionName(sectionId)}</Text>
                                    <Text style={styles.sectionTotal}>
                                        {formatCurrency(sectionTotals.totalCharge, currency)}
                                    </Text>
                                </View>

                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
                                    <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
                                    <Text style={[styles.tableHeaderText, styles.col3]}>Days</Text>
                                    <Text style={[styles.tableHeaderText, styles.col4]}>Rate</Text>
                                    <Text style={[styles.tableHeaderText, styles.col5]}>Amount</Text>
                                </View>

                                {subsectionOrder.map(subsectionName => {
                                    const items = section.subsections?.[subsectionName] || [];
                                    if (items.length === 0) return null;

                                    const isFlatSection = ['creative', 'logistics', 'expenses'].includes(sectionId);
                                    const shouldHideSubsectionHeader = isFlatSection && subsectionName === 'Services';

                                    return (
                                        <View key={subsectionName}>
                                            {!shouldHideSubsectionHeader && (
                                                <View style={styles.subsectionRow}>
                                                    <View style={styles.subsectionDot} />
                                                    <Text style={styles.subsectionTitle}>{getSubsectionName(sectionId, subsectionName)}</Text>
                                                </View>
                                            )}
                                            {items.map((item, idx) => {
                                                const displayRate = fees?.distributeFees
                                                    ? totals.getDistributedRate(item.charge || 0)
                                                    : (item.charge || 0);
                                                const lineTotal = displayRate * (item.quantity || 1) * (item.days || 1);

                                                return (
                                                    <View key={item.id || idx} style={idx % 2 === 0 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                                                        <Text style={[styles.cellText, styles.col1]}>{item.name || 'Item'}</Text>
                                                        <Text style={[styles.cellTextMuted, styles.col2]}>{item.quantity || 1}</Text>
                                                        <Text style={[styles.cellTextMuted, styles.col3]}>{item.days || 1}</Text>
                                                        <Text style={[styles.cellText, styles.col4]}>
                                                            {formatCurrency(displayRate, currency)}
                                                        </Text>
                                                        <Text style={[styles.cellTextBold, styles.col5]}>
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
                        <View style={styles.totalsCard}>
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
                                    <Text style={styles.totalValueDiscount}>
                                        -{formatCurrency(totals.discountAmount, currency)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>Total</Text>
                                <Text style={styles.grandTotalValue}>
                                    {formatCurrency(totals.totalCharge, currency)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Notes Section */}
                    <View style={styles.notesSection}>
                        <View style={pdfOptions?.showBankDetails && bankDetails?.bankName ? styles.notesCard : [styles.notesCard, { marginRight: 0 }]}>
                            <Text style={styles.notesTitle}>Terms & Conditions</Text>
                            <Text style={styles.notesText}>
                                {quoteDefaults?.termsAndConditions || 'Payment due within 30 days of invoice date. All prices are subject to confirmation at time of booking.'}
                            </Text>
                        </View>

                        {pdfOptions?.showBankDetails && bankDetails?.bankName && (
                            <View style={styles.notesCardLast}>
                                <Text style={styles.notesTitle}>Payment Details</Text>
                                <Text style={styles.notesText}>Bank: {bankDetails.bankName}</Text>
                                <Text style={styles.notesText}>Account: {bankDetails.accountName}</Text>
                                <Text style={styles.notesText}>Number: {bankDetails.accountNumber}</Text>
                                {bankDetails.swiftCode && (
                                    <Text style={styles.notesText}>SWIFT: {bankDetails.swiftCode}</Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <View style={styles.footerAccentBar}>
                        <View style={styles.footerAccentTeal} />
                        <View style={styles.footerAccentOrange} />
                    </View>
                    <View style={styles.footerContent}>
                        <View style={styles.footerLeft}>
                            <Text style={styles.footerLogo}>tell</Text>
                            <View style={styles.footerDivider} />
                            <Text style={styles.footerText}>{company?.website || 'www.tell.so'}</Text>
                        </View>
                        <View style={styles.footerRight}>
                            <Text style={styles.footerQuoteNum}>{quote.quoteNumber}</Text>
                            <Text style={styles.footerPage}>Page 1</Text>
                        </View>
                    </View>
                </View>
            </Page>

            {/* Terms & Conditions Page */}
            {includeTerms && quoteDefaults?.termsAndConditions && (
                <Page size="A4" style={styles.termsPage}>
                    <View style={styles.termsHeader}>
                        <Text style={styles.termsTitle}>Terms & Conditions</Text>
                        <Text style={styles.termsSubtitle}>
                            {company?.name} • Quote {quote.quoteNumber}
                        </Text>
                    </View>

                    <View style={styles.termsContent}>
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
                                        <View style={styles.termsColumnLast}>
                                            <Text style={styles.termsText}>{col2}</Text>
                                        </View>
                                    </>
                                );
                            })()}
                        </View>
                    </View>

                    <View style={styles.footer} fixed>
                        <View style={styles.footerAccentBar}>
                            <View style={styles.footerAccentTeal} />
                            <View style={styles.footerAccentOrange} />
                        </View>
                        <View style={styles.footerContent}>
                            <View style={styles.footerLeft}>
                                <Text style={styles.footerLogo}>tell</Text>
                                <View style={styles.footerDivider} />
                                <Text style={styles.footerText}>{company?.website || 'www.tell.so'}</Text>
                            </View>
                            <View style={styles.footerRight}>
                                <Text style={styles.footerQuoteNum}>{quote.quoteNumber}</Text>
                                <Text style={styles.footerPage}>Page 2</Text>
                            </View>
                        </View>
                    </View>
                </Page>
            )}
        </Document>
    );
}
