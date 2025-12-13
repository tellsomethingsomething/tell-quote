import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SECTIONS, SECTION_ORDER } from '../../data/sections';
import { calculateSectionTotal, calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { useSettingsStore } from '../../store/settingsStore';

// Clean Light Color Palette - Darker Text
const colors = {
    // Backgrounds
    white: '#FFFFFF',
    offWhite: '#F8FAFC',
    lightGrey: '#F1F5F9',

    // Primary - Darker Slate
    slate: '#1E293B',          // Darker primary text
    slateMedium: '#334155',    // Darker secondary text
    slateLight: '#64748B',     // Darker tertiary text

    // Accent - Refined Teal
    teal: '#0F8B8D',           // Tell brand teal
    tealLight: '#14B8A6',
    tealPale: '#CCFBF1',

    // Borders
    border: '#E2E8F0',
    divider: '#F1F5F9',
};

const styles = StyleSheet.create({
    // Page
    page: {
        backgroundColor: colors.white,
        paddingTop: 40,
        paddingBottom: 50,
        paddingHorizontal: 40,
        fontFamily: 'Helvetica',
        color: colors.slate,
        fontSize: 10,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    companySection: {
        flex: 1,
    },
    logo: {
        height: 32,
        width: 'auto',
        marginBottom: 6,
    },
    companyName: {
        fontSize: 20,
        color: colors.slate,
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    accentLine: {
        width: 40,
        height: 2,
        backgroundColor: colors.teal,
        marginBottom: 6,
    },
    companyTagline: {
        fontSize: 8,
        color: colors.slateLight,
        letterSpacing: 0.5,
    },
    quoteBadge: {
        alignItems: 'flex-end',
    },
    quoteLabel: {
        fontSize: 28,
        color: colors.border,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    quoteNumber: {
        fontSize: 10,
        color: colors.slate,
        marginBottom: 2,
    },
    quoteDate: {
        fontSize: 9,
        color: colors.slateMedium,
    },

    // Meta Bar
    metaBar: {
        flexDirection: 'row',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    metaItem: {
        marginRight: 32,
    },
    metaLabel: {
        fontSize: 7,
        color: colors.slateLight,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    metaValue: {
        fontSize: 10,
        color: colors.slate,
    },

    // Project Banner
    projectBanner: {
        backgroundColor: colors.offWhite,
        borderRadius: 4,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: colors.teal,
    },
    projectLabel: {
        fontSize: 7,
        color: colors.teal,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    projectTitle: {
        fontSize: 14,
        color: colors.slate,
        marginBottom: 10,
    },
    projectDetailsRow: {
        flexDirection: 'row',
        gap: 24,
    },
    projectDetailItem: {
        flexDirection: 'column',
    },
    projectDetailLabel: {
        fontSize: 7,
        color: colors.slateLight,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    projectDetailText: {
        fontSize: 9,
        color: colors.slateMedium,
    },

    // Info Row (Bill To + From)
    infoRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 24,
    },
    infoBox: {
        flex: 1,
        backgroundColor: colors.offWhite,
        borderRadius: 4,
        padding: 14,
    },
    infoBoxAccent: {
        flex: 1,
        backgroundColor: colors.offWhite,
        borderRadius: 4,
        padding: 14,
        borderLeftWidth: 2,
        borderLeftColor: colors.teal,
    },
    boxLabel: {
        fontSize: 7,
        color: colors.slateLight,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    boxTitle: {
        fontSize: 11,
        color: colors.slate,
        marginBottom: 4,
    },
    boxText: {
        fontSize: 9,
        color: colors.slateMedium,
        marginBottom: 2,
        lineHeight: 1.5,
    },

    // Sections
    section: {
        marginBottom: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: colors.offWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
    },
    sectionTitle: {
        fontSize: 9,
        color: colors.slate,
        letterSpacing: 0.5,
    },
    sectionTotal: {
        fontSize: 9,
        color: colors.teal,
    },

    // Table
    tableContainer: {
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    thText: {
        fontSize: 7,
        color: colors.slateLight,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        borderBottomStyle: 'dotted',
    },
    tableRowLast: {
        borderBottomWidth: 0,
    },

    // Columns
    colDesc: { width: '44%' },
    colQty: { width: '10%', textAlign: 'center' },
    colDays: { width: '10%', textAlign: 'center' },
    colRate: { width: '18%', textAlign: 'right' },
    colAmount: { width: '18%', textAlign: 'right' },

    cellText: {
        fontSize: 9,
        color: colors.slate,
    },
    cellTextMuted: {
        fontSize: 9,
        color: colors.slateLight,
    },
    cellAmount: {
        fontSize: 9,
        color: colors.slateMedium,
    },

    // Subsection
    subsectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: colors.offWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
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
        color: colors.slateMedium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Bottom Section (T&C + Totals)
    bottomSection: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 20,
    },
    tcBox: {
        flex: 1,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    tcTitle: {
        fontSize: 7,
        color: colors.slateLight,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    tcText: {
        fontSize: 8,
        color: colors.slateLight,
        lineHeight: 1.6,
    },

    // Totals Box
    totalsBox: {
        width: 200,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    totalLabel: {
        fontSize: 9,
        color: colors.slateLight,
    },
    totalValue: {
        fontSize: 9,
        color: colors.slateMedium,
    },
    totalValueDiscount: {
        fontSize: 9,
        color: '#DC2626',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: colors.tealPale,
        borderRadius: 4,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: colors.teal,
    },
    grandTotalLabel: {
        fontSize: 9,
        color: colors.slate,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    grandTotalValue: {
        fontSize: 16,
        color: colors.teal,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLogo: {
        fontSize: 10,
        color: colors.slate,
        letterSpacing: 2,
        marginRight: 8,
    },
    footerDivider: {
        width: 1,
        height: 10,
        backgroundColor: colors.border,
        marginRight: 8,
    },
    footerText: {
        fontSize: 8,
        color: colors.slateLight,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerQuote: {
        fontSize: 8,
        color: colors.teal,
    },
    footerPageNum: {
        fontSize: 8,
        color: colors.slateLight,
        marginLeft: 12,
    },
});

export default function QuotePDF({ quote, currency, includeTerms = false }) {
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});
    const settings = useSettingsStore.getState().settings;
    const { company, quoteDefaults } = settings;

    const sectionOrder = quote.sectionOrder || SECTION_ORDER;

    const quoteDate = new Date(quote.createdAt || new Date());
    const validUntil = new Date(quoteDate);
    validUntil.setDate(quoteDate.getDate() + (quote.validityDays || quoteDefaults?.validityDays || 30));

    const preparedByUser = settings.users?.find(u => u.id === quote.preparedBy);
    const preparedByName = preparedByUser ? preparedByUser.name : '';

    // Get ordinal suffix for day
    const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    // Format date - "20th Dec 2025"
    const formatDate = (date) => {
        const d = new Date(date);
        const day = d.getDate();
        const month = d.toLocaleDateString('en-GB', { month: 'short' });
        const year = d.getFullYear();
        return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    };

    // Format date long - "20th December 2025"
    const formatDateLong = (date) => {
        const d = new Date(date);
        const day = d.getDate();
        const month = d.toLocaleDateString('en-GB', { month: 'long' });
        const year = d.getFullYear();
        return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    };

    const getSectionName = (sectionId) => {
        return quote.sectionNames?.[sectionId] || SECTIONS[sectionId]?.name || sectionId;
    };

    const getSubsectionName = (sectionId, subsectionName) => {
        return sections?.[sectionId]?.subsectionNames?.[subsectionName] || subsectionName;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companySection}>
                        {company?.logo ? (
                            <Image src={company.logo} style={styles.logo} />
                        ) : (
                            <Text style={styles.companyName}>{company?.name || 'TELL PRODUCTIONS'}</Text>
                        )}
                        <View style={styles.accentLine} />
                        <Text style={styles.companyTagline}>Production Services</Text>
                    </View>
                    <View style={styles.quoteBadge}>
                        <Text style={styles.quoteLabel}>QUOTE</Text>
                        <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
                        <Text style={styles.quoteDate}>{formatDateLong(quoteDate)}</Text>
                    </View>
                </View>

                {/* Meta Bar */}
                <View style={styles.metaBar}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Valid Until</Text>
                        <Text style={styles.metaValue}>{formatDateLong(validUntil)}</Text>
                    </View>
                </View>

                {/* Project Banner */}
                {project?.title && (
                    <View style={styles.projectBanner}>
                        <Text style={styles.projectLabel}>Project</Text>
                        <Text style={styles.projectTitle}>{project.title}</Text>
                        <View style={styles.projectDetailsRow}>
                            {project.venue && (
                                <View style={styles.projectDetailItem}>
                                    <Text style={styles.projectDetailLabel}>Venue</Text>
                                    <Text style={styles.projectDetailText}>{project.venue}</Text>
                                </View>
                            )}
                            {project.startDate && (
                                <View style={styles.projectDetailItem}>
                                    <Text style={styles.projectDetailLabel}>Start Date</Text>
                                    <Text style={styles.projectDetailText}>{formatDate(project.startDate)}</Text>
                                </View>
                            )}
                            {project.endDate && (
                                <View style={styles.projectDetailItem}>
                                    <Text style={styles.projectDetailLabel}>End Date</Text>
                                    <Text style={styles.projectDetailText}>{formatDate(project.endDate)}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Bill To + From */}
                <View style={styles.infoRow}>
                    <View style={styles.infoBoxAccent}>
                        <Text style={styles.boxLabel}>Bill To</Text>
                        {client?.company && <Text style={styles.boxTitle}>{client.company}</Text>}
                        {client?.contact && <Text style={styles.boxText}>Attn: {client.contact}</Text>}
                        {client?.email && <Text style={styles.boxText}>{client.email}</Text>}
                        {client?.phone && <Text style={styles.boxText}>{client.phone}</Text>}
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.boxLabel}>From</Text>
                        <Text style={styles.boxTitle}>{company?.name || 'Tell Productions Sdn Bhd'}</Text>
                        {preparedByName && <Text style={styles.boxText}>Prepared by: {preparedByName}</Text>}
                        {company?.email && <Text style={styles.boxText}>{company.email}</Text>}
                    </View>
                </View>

                {/* Line Item Sections */}
                {sectionOrder.map(sectionId => {
                    const section = sections?.[sectionId];
                    const config = SECTIONS[sectionId];
                    if (!section || !config) return null;

                    const subsectionOrder = section.subsectionOrder ||
                        [...config.subsections, ...(section.customSubsections || [])];

                    const sectionTotals = calculateSectionTotal(section.subsections);
                    const itemCount = Object.values(section.subsections || {}).reduce(
                        (acc, items) => acc + items.length, 0
                    );

                    if (itemCount === 0) return null;

                    let rowIndex = 0;

                    return (
                        <View key={sectionId} style={styles.section} wrap={false}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{getSectionName(sectionId)}</Text>
                                <Text style={styles.sectionTotal}>
                                    {formatCurrency(sectionTotals.totalCharge, currency)}
                                </Text>
                            </View>

                            <View style={styles.tableContainer}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.thText, styles.colDesc]}>Item</Text>
                                    <Text style={[styles.thText, styles.colQty, { textAlign: 'center' }]}>Qty</Text>
                                    <Text style={[styles.thText, styles.colDays, { textAlign: 'center' }]}>Days</Text>
                                    <Text style={[styles.thText, styles.colRate, { textAlign: 'right' }]}>Rate</Text>
                                    <Text style={[styles.thText, styles.colAmount, { textAlign: 'right' }]}>Amount</Text>
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
                                                    <Text style={styles.subsectionTitle}>
                                                        {getSubsectionName(sectionId, subsectionName)}
                                                    </Text>
                                                </View>
                                            )}

                                            {items.map((item, idx) => {
                                                const displayRate = fees?.distributeFees
                                                    ? totals.getDistributedRate(item.charge || 0)
                                                    : (item.charge || 0);
                                                const lineTotal = displayRate * (item.quantity || 1) * (item.days || 1);
                                                const isLast = rowIndex === itemCount - 1;
                                                rowIndex++;

                                                return (
                                                    <View
                                                        key={item.id || idx}
                                                        style={[styles.tableRow, isLast && styles.tableRowLast]}
                                                    >
                                                        <Text style={[styles.cellText, styles.colDesc]}>
                                                            {item.name || 'Item'}
                                                        </Text>
                                                        <Text style={[styles.cellTextMuted, styles.colQty]}>
                                                            {item.quantity || 1}
                                                        </Text>
                                                        <Text style={[styles.cellTextMuted, styles.colDays]}>
                                                            {item.days || 1}
                                                        </Text>
                                                        <Text style={[styles.cellTextMuted, styles.colRate]}>
                                                            {formatCurrency(displayRate, currency)}
                                                        </Text>
                                                        <Text style={[styles.cellAmount, styles.colAmount]}>
                                                            {formatCurrency(lineTotal, currency)}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}

                {/* Bottom Section: T&C + Totals */}
                <View style={styles.bottomSection}>
                    <View style={styles.tcBox}>
                        <Text style={styles.tcTitle}>Terms & Conditions</Text>
                        <Text style={styles.tcText}>
                            {quoteDefaults?.termsAndConditions ||
                                '• Quote valid for 30 days from date of issue.\n• 50% deposit required upon confirmation.\n• Balance due within 14 days of project completion.'}
                        </Text>
                    </View>

                    <View style={styles.totalsBox}>
                        {(fees?.discount > 0 || fees?.managementFee > 0 || fees?.commissionFee > 0) && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>
                                    {fees?.distributeFees
                                        ? formatCurrency(totals.chargeWithFees, currency)
                                        : formatCurrency(totals.baseCharge, currency)}
                                </Text>
                            </View>
                        )}

                        {!fees?.distributeFees && fees?.managementFee > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Mgmt ({fees.managementFee}%)</Text>
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

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <View style={styles.footerContent}>
                        <View style={styles.footerLeft}>
                            <Text style={styles.footerLogo}>TELL</Text>
                            <View style={styles.footerDivider} />
                            <Text style={styles.footerText}>{company?.website || 'www.tell.so'}</Text>
                        </View>
                        <View style={styles.footerRight}>
                            <Text style={styles.footerQuote}>{quote.quoteNumber}</Text>
                            <Text render={({ pageNumber, totalPages }) =>
                                `Page ${pageNumber} of ${totalPages}`
                            } style={styles.footerPageNum} />
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
