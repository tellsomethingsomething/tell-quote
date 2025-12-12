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

// Tell Brand Color Palette
const colors = {
    // Primary
    navy: '#143642',
    teal: '#0F8B8D',
    orange: '#FE7F2D',
    // Secondary
    darkTeal: '#0B6062',
    darkOrange: '#D46C26',
    // Neutrals
    black: '#1A1A1A',
    darkGray: '#4A5568',
    gray: '#718096',
    lightGray: '#E2E8F0',
    offWhite: '#F7F7F7',
    white: '#FFFFFF',
    // Functional
    success: '#10B981',
    danger: '#EF4444',
};

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 9,
        fontFamily: 'Inter',
        backgroundColor: colors.white,
    },

    // === HEADER SECTION ===
    headerBar: {
        backgroundColor: colors.navy,
        paddingVertical: 24,
        paddingHorizontal: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logo: {
        width: 100,
        height: 30,
    },
    logoFallback: {
        fontSize: 22,
        fontWeight: 700,
        color: colors.white,
        letterSpacing: -0.5,
    },
    quoteTag: {
        backgroundColor: colors.teal,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 4,
    },
    quoteTagText: {
        fontSize: 10,
        fontWeight: 600,
        color: colors.white,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },

    // === MAIN CONTENT ===
    content: {
        padding: 40,
        paddingTop: 32,
        paddingBottom: 80,
    },

    // === QUOTE INFO STRIP ===
    quoteInfoStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    quoteNumberSection: {},
    quoteLabel: {
        fontSize: 8,
        color: colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    quoteNumber: {
        fontSize: 20,
        fontWeight: 700,
        color: colors.navy,
        letterSpacing: -0.5,
    },
    quoteDates: {
        alignItems: 'flex-end',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    dateLabel: {
        fontSize: 8,
        color: colors.gray,
        marginRight: 8,
    },
    dateValue: {
        fontSize: 9,
        fontWeight: 500,
        color: colors.black,
    },

    // === PROJECT CARD ===
    projectCard: {
        backgroundColor: colors.navy,
        borderRadius: 8,
        padding: 24,
        marginBottom: 24,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: colors.white,
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    projectMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    projectMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    projectMetaDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.teal,
    },
    projectMetaText: {
        fontSize: 10,
        color: colors.white,
        opacity: 0.9,
    },

    // === CLIENT & PREPARED BY ===
    infoRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 28,
    },
    infoCard: {
        flex: 1,
        backgroundColor: colors.offWhite,
        borderRadius: 6,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: colors.teal,
    },
    infoCardLabel: {
        fontSize: 7,
        fontWeight: 600,
        color: colors.teal,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    infoCardName: {
        fontSize: 13,
        fontWeight: 600,
        color: colors.navy,
        marginBottom: 4,
    },
    infoCardDetail: {
        fontSize: 9,
        color: colors.darkGray,
        marginBottom: 2,
    },

    // === SECTIONS ===
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.navy,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 4,
    },
    sectionHeaderWithColor: {
        borderLeftWidth: 4,
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
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: colors.offWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    tableHeaderText: {
        fontSize: 7,
        fontWeight: 600,
        color: colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    tableRowAlt: {
        backgroundColor: colors.offWhite,
    },
    col1: { width: '44%' },
    col2: { width: '10%', textAlign: 'center' },
    col3: { width: '10%', textAlign: 'center' },
    col4: { width: '18%', textAlign: 'right' },
    col5: { width: '18%', textAlign: 'right' },
    cellText: {
        fontSize: 9,
        color: colors.black,
    },
    cellTextMuted: {
        fontSize: 9,
        color: colors.gray,
    },
    cellTextBold: {
        fontSize: 9,
        fontWeight: 600,
        color: colors.black,
    },

    // === SUBSECTION ===
    subsectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    subsectionDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.teal,
        marginRight: 8,
    },
    subsectionTitle: {
        fontSize: 8,
        fontWeight: 600,
        color: colors.teal,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // === TOTALS ===
    totalsSection: {
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalsCard: {
        width: 280,
        backgroundColor: colors.offWhite,
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    totalLabel: {
        fontSize: 10,
        color: colors.darkGray,
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 500,
        color: colors.black,
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
        marginTop: 12,
        paddingTop: 14,
        borderTopWidth: 2,
        borderTopColor: colors.navy,
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 700,
        color: colors.navy,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    grandTotalValue: {
        fontSize: 16,
        fontWeight: 700,
        color: colors.navy,
    },

    // === BOTTOM INFO ===
    bottomSection: {
        marginTop: 32,
        flexDirection: 'row',
        gap: 20,
    },
    bottomCard: {
        flex: 1,
        padding: 16,
        backgroundColor: colors.offWhite,
        borderRadius: 6,
    },
    bottomCardTitle: {
        fontSize: 8,
        fontWeight: 700,
        color: colors.navy,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    bottomCardText: {
        fontSize: 8,
        color: colors.darkGray,
        lineHeight: 1.6,
    },

    // === SIGNATURE ===
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 40,
    },
    signatureBox: {
        flex: 1,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: colors.darkGray,
        marginBottom: 10,
        height: 40,
    },
    signatureLabel: {
        fontSize: 8,
        color: colors.gray,
    },

    // === FOOTER ===
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 40,
        backgroundColor: colors.navy,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    footerLogo: {
        width: 50,
        height: 15,
    },
    footerText: {
        fontSize: 7,
        color: colors.white,
        opacity: 0.7,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    footerAccent: {
        fontSize: 7,
        color: colors.teal,
        fontWeight: 600,
    },
    footerDivider: {
        width: 1,
        height: 10,
        backgroundColor: colors.white,
        opacity: 0.3,
    },

    // === ACCENT BAR ===
    accentBar: {
        height: 4,
        flexDirection: 'row',
    },
    accentBarTeal: {
        flex: 3,
        backgroundColor: colors.teal,
    },
    accentBarOrange: {
        flex: 1,
        backgroundColor: colors.orange,
    },

    // === TERMS PAGE ===
    termsPage: {
        padding: 0,
        fontSize: 8,
        fontFamily: 'Inter',
        backgroundColor: colors.white,
    },
    termsContent: {
        padding: 40,
        paddingTop: 32,
        paddingBottom: 80,
    },
    termsHeader: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: colors.teal,
    },
    termsTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: colors.navy,
        letterSpacing: -0.3,
    },
    termsSubtitle: {
        fontSize: 9,
        color: colors.gray,
        marginTop: 4,
    },
    termsColumns: {
        flexDirection: 'row',
        gap: 24,
    },
    termsColumn: {
        flex: 1,
    },
    termsText: {
        fontSize: 8,
        color: colors.darkGray,
        lineHeight: 1.7,
        textAlign: 'justify',
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
                {/* Multi-color accent bar */}
                <View style={styles.accentBar}>
                    <View style={styles.accentBarTeal} />
                    <View style={styles.accentBarOrange} />
                </View>

                {/* Header */}
                <View style={styles.headerBar}>
                    <View style={styles.logoContainer}>
                        {company?.logo && pdfOptions?.showLogo ? (
                            <Image src={company.logo} style={styles.logo} />
                        ) : (
                            <Text style={styles.logoFallback}>tell</Text>
                        )}
                    </View>
                    <View style={styles.quoteTag}>
                        <Text style={styles.quoteTagText}>Quotation</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Quote Info Strip */}
                    <View style={styles.quoteInfoStrip}>
                        <View style={styles.quoteNumberSection}>
                            <Text style={styles.quoteLabel}>Quote Number</Text>
                            <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
                        </View>
                        <View style={styles.quoteDates}>
                            <View style={styles.dateRow}>
                                <Text style={styles.dateLabel}>Date:</Text>
                                <Text style={styles.dateValue}>{quoteDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                            </View>
                            <View style={styles.dateRow}>
                                <Text style={styles.dateLabel}>Valid Until:</Text>
                                <Text style={styles.dateValue}>{validUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Project Card */}
                    {project?.title && (
                        <View style={styles.projectCard}>
                            <Text style={styles.projectTitle}>{project.title}</Text>
                            <View style={styles.projectMeta}>
                                {project.venue && (
                                    <View style={styles.projectMetaItem}>
                                        <View style={styles.projectMetaDot} />
                                        <Text style={styles.projectMetaText}>{project.venue}</Text>
                                    </View>
                                )}
                                {project.startDate && (
                                    <View style={styles.projectMetaItem}>
                                        <View style={styles.projectMetaDot} />
                                        <Text style={styles.projectMetaText}>
                                            {project.startDate}{project.endDate && project.endDate !== project.startDate ? ` — ${project.endDate}` : ''}
                                        </Text>
                                    </View>
                                )}
                                {project.type && (
                                    <View style={styles.projectMetaItem}>
                                        <View style={styles.projectMetaDot} />
                                        <Text style={styles.projectMetaText}>{project.type}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Client & Prepared By */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardLabel}>Bill To</Text>
                            {client?.company && <Text style={styles.infoCardName}>{client.company}</Text>}
                            {client?.contact && <Text style={styles.infoCardDetail}>Attn: {client.contact}</Text>}
                            {client?.email && <Text style={styles.infoCardDetail}>{client.email}</Text>}
                            {client?.phone && <Text style={styles.infoCardDetail}>{client.phone}</Text>}
                        </View>
                        {preparedByName && (
                            <View style={styles.infoCard}>
                                <Text style={styles.infoCardLabel}>Prepared By</Text>
                                <Text style={styles.infoCardName}>{preparedByName}</Text>
                                <Text style={styles.infoCardDetail}>{company?.name}</Text>
                                {company?.email && <Text style={styles.infoCardDetail}>{company.email}</Text>}
                            </View>
                        )}
                    </View>

                    {/* Sections */}
                    {sectionOrder.map(sectionId => {
                        const section = sections?.[sectionId];
                        const config = SECTIONS[sectionId];
                        if (!section || !config) return null;

                        // Get subsection order
                        const subsectionOrder = section.subsectionOrder ||
                            [...config.subsections, ...(section.customSubsections || [])];

                        const sectionTotals = calculateSectionTotal(section.subsections);
                        const itemCount = Object.values(section.subsections || {}).reduce((acc, items) => acc + items.length, 0);

                        if (itemCount === 0) return null;

                        return (
                            <View key={sectionId} style={styles.section} wrap={false}>
                                <View style={[styles.sectionHeader, styles.sectionHeaderWithColor, { borderLeftColor: config.color }]}>
                                    <Text style={styles.sectionTitle}>{getSectionName(sectionId)}</Text>
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
                                    <Text style={[styles.tableHeaderText, styles.col5]}>Amount</Text>
                                </View>

                                {/* Subsections with items */}
                                {subsectionOrder.map(subsectionName => {
                                    const items = section.subsections?.[subsectionName] || [];
                                    if (items.length === 0) return null;

                                    // Hide "Services" header for flat sections
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
                                                    <View key={item.id || idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
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

                    {/* Terms and Bank Info */}
                    <View style={styles.bottomSection}>
                        <View style={styles.bottomCard}>
                            <Text style={styles.bottomCardTitle}>Terms & Conditions</Text>
                            <Text style={styles.bottomCardText}>
                                {quoteDefaults?.termsAndConditions || 'Payment due within 30 days of invoice date.'}
                            </Text>
                        </View>

                        {pdfOptions?.showBankDetails && bankDetails?.bankName && (
                            <View style={styles.bottomCard}>
                                <Text style={styles.bottomCardTitle}>Payment Details</Text>
                                <Text style={styles.bottomCardText}>Bank: {bankDetails.bankName}</Text>
                                <Text style={styles.bottomCardText}>Account: {bankDetails.accountName}</Text>
                                <Text style={styles.bottomCardText}>Number: {bankDetails.accountNumber}</Text>
                                {bankDetails.swiftCode && (
                                    <Text style={styles.bottomCardText}>SWIFT: {bankDetails.swiftCode}</Text>
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
                    <View style={styles.footerLeft}>
                        <Text style={styles.footerText}>{company?.name || 'Tell'}</Text>
                        {company?.website && (
                            <>
                                <View style={styles.footerDivider} />
                                <Text style={styles.footerText}>{company.website}</Text>
                            </>
                        )}
                    </View>
                    <View style={styles.footerRight}>
                        <Text style={styles.footerAccent}>{quote.quoteNumber}</Text>
                        <View style={styles.footerDivider} />
                        <Text style={styles.footerText}>{new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                </View>
            </Page>

            {/* Terms & Conditions Page */}
            {includeTerms && quoteDefaults?.termsAndConditions && (
                <Page size="A4" style={styles.termsPage}>
                    <View style={styles.accentBar}>
                        <View style={styles.accentBarTeal} />
                        <View style={styles.accentBarOrange} />
                    </View>

                    <View style={styles.headerBar}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoFallback}>tell</Text>
                        </View>
                    </View>

                    <View style={styles.termsContent}>
                        <View style={styles.termsHeader}>
                            <Text style={styles.termsTitle}>Terms & Conditions</Text>
                            <Text style={styles.termsSubtitle}>
                                {company?.name} • Quote {quote.quoteNumber}
                            </Text>
                        </View>

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
                        <View style={styles.footerLeft}>
                            <Text style={styles.footerText}>{company?.name || 'Tell'}</Text>
                        </View>
                        <View style={styles.footerRight}>
                            <Text style={styles.footerText}>Terms & Conditions</Text>
                            <View style={styles.footerDivider} />
                            <Text style={styles.footerText}>Page 2</Text>
                        </View>
                    </View>
                </Page>
            )}
        </Document>
    );
}
