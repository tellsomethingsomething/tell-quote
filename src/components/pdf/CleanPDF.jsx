import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { calculateSectionTotal, calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { useSettingsStore } from '../../store/settingsStore';
import { SECTIONS, SECTION_ORDER } from '../../data/sections';

// Helper to convert hex to rgba
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Clean, professional PDF layout with specified structure
export default function CleanPDF({ quote, currency }) {
    const settings = useSettingsStore.getState().settings;
    const { company, bankDetails, quoteDefaults, taxInfo, pdfOptions } = settings;
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});

    // Colors from settings - using solid colors
    const colors = {
        primary: pdfOptions?.primaryColor || '#143642',
        accent: pdfOptions?.accentColor || '#0F8B8D',
        line: pdfOptions?.lineColor || pdfOptions?.primaryColor || '#143642',
        text: pdfOptions?.textColor || '#374151',
        muted: pdfOptions?.mutedColor || '#6B7280',
        background: pdfOptions?.backgroundColor || '#FFFFFF',
    };

    // Light versions for backgrounds only (borders use solid colors)
    const lineLight = hexToRgba(colors.line, 0.15);
    const primaryLight = hexToRgba(colors.primary, 0.03);
    const primaryMedium = hexToRgba(colors.primary, 0.08);

    const baseFontSize = pdfOptions?.baseFontSize || 10;
    const fontFamily = pdfOptions?.fontFamily || 'Helvetica';

    const styles = StyleSheet.create({
        page: {
            backgroundColor: colors.background,
            fontFamily: fontFamily,
            fontSize: baseFontSize,
            color: colors.text,
            paddingTop: 30,
            paddingBottom: 50,
            paddingHorizontal: 35,
        },
        // Row 1: Header Banner with Quote Details
        headerBanner: {
            backgroundColor: colors.primary,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 16,
            borderRadius: 4,
        },
        quotationTitle: {
            fontSize: 20,
            fontFamily: `${fontFamily}-Bold`,
            color: '#FFFFFF',
            letterSpacing: 2,
        },
        headerDetails: {
            flexDirection: 'row',
            gap: 20,
        },
        headerItem: {
            alignItems: 'flex-end',
        },
        headerLabel: {
            fontSize: 7,
            color: '#FFFFFF',
            opacity: 0.8,
            textTransform: 'uppercase',
            marginBottom: 2,
        },
        headerValue: {
            fontSize: 9,
            fontFamily: `${fontFamily}-Bold`,
            color: '#FFFFFF',
        },
        // Row 2: Two column - Company & Client
        twoColumn: {
            flexDirection: 'row',
            marginBottom: 16,
            gap: 16,
        },
        columnHalf: {
            flex: 1,
            padding: 12,
            backgroundColor: primaryLight,
            borderRadius: 4,
        },
        columnLabel: {
            fontSize: 8,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.accent,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
        },
        columnTitle: {
            fontSize: 11,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
            marginBottom: 4,
        },
        columnText: {
            fontSize: 9,
            color: colors.text,
            lineHeight: 1.5,
            marginBottom: 1,
        },
        // Row 3: Project & Services Description
        descriptionRow: {
            flexDirection: 'row',
            marginBottom: 16,
            gap: 16,
        },
        descriptionBox: {
            flex: 1,
            padding: 12,
            borderWidth: 1,
            borderTopColor: colors.line,
            borderBottomColor: colors.line,
            borderLeftColor: colors.line,
            borderRightColor: colors.line,
            borderRadius: 4,
        },
        descriptionLabel: {
            fontSize: 8,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
            textTransform: 'uppercase',
            marginBottom: 6,
        },
        descriptionText: {
            fontSize: 9,
            color: colors.text,
            lineHeight: 1.5,
        },
        // Row 4: Quote Table
        sectionHeader: {
            backgroundColor: colors.primary,
            paddingVertical: 6,
            paddingHorizontal: 10,
            marginTop: 12,
            marginBottom: 6,
            borderRadius: 3,
        },
        sectionHeaderText: {
            fontSize: 9,
            fontFamily: `${fontFamily}-Bold`,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        tableHeader: {
            flexDirection: 'row',
            backgroundColor: primaryMedium,
            paddingVertical: 5,
            paddingLeft: 10,
            paddingRight: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.line,
        },
        tableHeaderCell: {
            fontSize: 7,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
            textTransform: 'uppercase',
        },
        tableRow: {
            flexDirection: 'row',
            paddingVertical: 4,
            paddingLeft: 10,
            paddingRight: 8,
            borderBottomWidth: 0.5,
            borderBottomColor: '#E5E7EB',
        },
        tableCell: {
            fontSize: 8,
            color: colors.text,
        },
        tableCellRight: {
            fontSize: 8,
            color: colors.text,
            textAlign: 'right',
        },
        colName: { width: '42%' },
        colQty: { width: '10%', textAlign: 'center' },
        colDays: { width: '10%', textAlign: 'center' },
        colRate: { width: '18%', textAlign: 'right' },
        colTotal: { width: '20%', textAlign: 'right' },
        subsectionHeader: {
            backgroundColor: lineLight,
            paddingVertical: 4,
            paddingHorizontal: 8,
            marginTop: 6,
            borderLeftWidth: 2,
            borderLeftColor: colors.line,
            borderTopWidth: 0,
            borderBottomWidth: 0,
            borderRightWidth: 0,
        },
        subsectionText: {
            fontSize: 8,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
        },
        // Row 5: Payment Terms, T&C, Total
        bottomRow: {
            flexDirection: 'row',
            marginTop: 20,
            gap: 12,
        },
        termsColumn: {
            flex: 1,
        },
        termsBox: {
            padding: 10,
            backgroundColor: primaryLight,
            borderRadius: 4,
            marginBottom: 8,
        },
        termsLabel: {
            fontSize: 8,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
            marginBottom: 4,
        },
        termsText: {
            fontSize: 7,
            color: colors.muted,
            lineHeight: 1.5,
        },
        totalsColumn: {
            width: 180,
        },
        totalsBox: {
            borderRadius: 4,
            padding: 12,
            borderWidth: 1,
            borderTopColor: colors.line,
            borderBottomColor: colors.line,
            borderLeftColor: colors.line,
            borderRightColor: colors.line,
        },
        totalsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 3,
        },
        totalsLabel: {
            fontSize: 8,
            color: colors.muted,
        },
        totalsValue: {
            fontSize: 8,
            color: colors.text,
        },
        totalsFinalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: colors.line,
            paddingTop: 8,
            marginTop: 8,
        },
        totalsFinalLabel: {
            fontSize: 11,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
        },
        totalsFinalValue: {
            fontSize: 12,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
        },
        // Footer
        footer: {
            position: 'absolute',
            bottom: 18,
            left: 35,
            right: 35,
            borderTopWidth: 0.5,
            borderTopColor: '#E5E7EB',
            paddingTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        footerText: {
            fontSize: 7,
            color: colors.muted,
        },
        footerBold: {
            fontSize: 7,
            fontFamily: `${fontFamily}-Bold`,
            color: colors.primary,
        },
        // Logo
        logo: {
            width: 100,
            maxHeight: 40,
            objectFit: 'contain',
            marginBottom: 6,
        },
    });

    // Helpers
    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateRange = () => {
        if (!project?.startDate) return '-';
        const start = formatDate(project.startDate);
        if (project?.endDate && project.endDate !== project.startDate) {
            return `${start} - ${formatDate(project.endDate)}`;
        }
        return start;
    };

    const quoteDate = new Date(quote.createdAt || new Date());
    const validUntil = new Date(quoteDate);
    validUntil.setDate(quoteDate.getDate() + (quote.validityDays || quoteDefaults?.validityDays || 30));

    // Get sections with items
    const sectionOrder = quote.sectionOrder || SECTION_ORDER;
    const activeSections = sectionOrder.filter(sectionId => {
        const section = sections?.[sectionId];
        if (!section?.subsections) return false;
        return Object.values(section.subsections).some(items => items?.length > 0);
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* ROW 1: Header Banner with Job Details */}
                <View style={styles.headerBanner}>
                    <Text style={styles.quotationTitle}>QUOTATION</Text>
                    <View style={styles.headerDetails}>
                        <View style={styles.headerItem}>
                            <Text style={styles.headerLabel}>Quote No.</Text>
                            <Text style={styles.headerValue}>{quote.quoteNumber}</Text>
                        </View>
                        <View style={styles.headerItem}>
                            <Text style={styles.headerLabel}>Date</Text>
                            <Text style={styles.headerValue}>{formatDate(quoteDate)}</Text>
                        </View>
                        <View style={styles.headerItem}>
                            <Text style={styles.headerLabel}>Valid Until</Text>
                            <Text style={styles.headerValue}>{formatDate(validUntil)}</Text>
                        </View>
                        {project?.venue && (
                            <View style={styles.headerItem}>
                                <Text style={styles.headerLabel}>Venue</Text>
                                <Text style={styles.headerValue}>{project.venue}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ROW 2: Company Info + Client Info */}
                <View style={styles.twoColumn}>
                    {/* Our Company */}
                    <View style={styles.columnHalf}>
                        <Text style={styles.columnLabel}>From</Text>
                        {pdfOptions?.showLogo && company.logo && (
                            <Image src={company.logo} style={styles.logo} />
                        )}
                        <Text style={styles.columnTitle}>{company.name}</Text>
                        {pdfOptions?.showCompanyAddress && company.address && (
                            <Text style={styles.columnText}>{company.address}</Text>
                        )}
                        {company.city && (
                            <Text style={styles.columnText}>{company.city}, {company.country}</Text>
                        )}
                        {pdfOptions?.showCompanyPhone && company.phone && (
                            <Text style={styles.columnText}>{company.phone}</Text>
                        )}
                        {pdfOptions?.showCompanyEmail && company.email && (
                            <Text style={styles.columnText}>{company.email}</Text>
                        )}
                    </View>

                    {/* Client */}
                    <View style={styles.columnHalf}>
                        <Text style={styles.columnLabel}>To</Text>
                        <Text style={styles.columnTitle}>{client?.company || '-'}</Text>
                        {client?.contact && <Text style={styles.columnText}>{client.contact}</Text>}
                        {client?.email && <Text style={styles.columnText}>{client.email}</Text>}
                        {client?.phone && <Text style={styles.columnText}>{client.phone}</Text>}
                    </View>
                </View>

                {/* ROW 3: Project Description + Services Description */}
                <View style={styles.descriptionRow}>
                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionLabel}>Project</Text>
                        <Text style={styles.columnTitle}>{project?.title || '-'}</Text>
                        {project?.type && <Text style={styles.descriptionText}>Type: {project.type}</Text>}
                        <Text style={styles.descriptionText}>Dates: {formatDateRange()}</Text>
                        {project?.description && (
                            <Text style={[styles.descriptionText, { marginTop: 4 }]}>{project.description}</Text>
                        )}
                    </View>
                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionLabel}>Services Included</Text>
                        <Text style={styles.descriptionText}>
                            {activeSections.map(sectionId => {
                                const section = sections[sectionId];
                                return quote.sectionNames?.[sectionId] || section.name || SECTIONS[sectionId]?.name;
                            }).join(' • ')}
                        </Text>
                    </View>
                </View>

                {/* ROW 4: Quote Line Items */}
                {activeSections.map(sectionId => {
                    const section = sections[sectionId];
                    const sectionName = quote.sectionNames?.[sectionId] || section.name || SECTIONS[sectionId]?.name;

                    return (
                        <View key={sectionId} wrap={false}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionHeaderText}>{sectionName}</Text>
                            </View>

                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.colName]}>Description</Text>
                                <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                                <Text style={[styles.tableHeaderCell, styles.colDays]}>Days</Text>
                                <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
                                <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                            </View>

                            {Object.entries(section.subsections || {}).map(([subName, items]) => {
                                if (!items?.length) return null;
                                const displayName = section.subsectionNames?.[subName] || subName;

                                return (
                                    <View key={subName}>
                                        <View style={styles.subsectionHeader}>
                                            <Text style={styles.subsectionText}>{displayName}</Text>
                                        </View>
                                        {items.map((item, idx) => {
                                            const itemTotal = (item.charge || 0) * (item.quantity || 1) * (item.days || 1);
                                            return (
                                                <View style={styles.tableRow} key={item.id || idx}>
                                                    <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
                                                    <Text style={[styles.tableCell, styles.colQty]}>{item.quantity || 1}</Text>
                                                    <Text style={[styles.tableCell, styles.colDays]}>{item.days || 1}</Text>
                                                    <Text style={[styles.tableCellRight, styles.colRate]}>
                                                        {formatCurrency(item.charge || 0, currency)}
                                                    </Text>
                                                    <Text style={[styles.tableCellRight, styles.colTotal]}>
                                                        {formatCurrency(itemTotal, currency)}
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

                {/* ROW 5: Payment Terms + T&C + Total */}
                <View style={styles.bottomRow}>
                    {/* Terms Column */}
                    <View style={styles.termsColumn}>
                        {quoteDefaults?.paymentTerms && (
                            <View style={styles.termsBox}>
                                <Text style={styles.termsLabel}>Payment Terms</Text>
                                <Text style={styles.termsText}>{quoteDefaults.paymentTerms}</Text>
                            </View>
                        )}
                        {quoteDefaults?.termsAndConditions && (
                            <View style={styles.termsBox}>
                                <Text style={styles.termsLabel}>Terms & Conditions</Text>
                                <Text style={styles.termsText}>{quoteDefaults.termsAndConditions}</Text>
                            </View>
                        )}
                        {pdfOptions?.showBankDetails && bankDetails?.bankName && (
                            <View style={styles.termsBox}>
                                <Text style={styles.termsLabel}>Bank Details</Text>
                                <Text style={styles.termsText}>
                                    {bankDetails.bankName} | {bankDetails.accountName} | {bankDetails.accountNumber}
                                    {bankDetails.swiftCode && ` | SWIFT: ${bankDetails.swiftCode}`}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Totals Column */}
                    <View style={styles.totalsColumn}>
                        <View style={styles.totalsBox}>
                            {(fees?.managementFee > 0 || fees?.commissionFee > 0 || fees?.discount > 0) && (
                                <>
                                    <View style={styles.totalsRow}>
                                        <Text style={styles.totalsLabel}>Subtotal</Text>
                                        <Text style={styles.totalsValue}>{formatCurrency(totals.baseCharge, currency)}</Text>
                                    </View>
                                    {fees?.managementFee > 0 && (
                                        <View style={styles.totalsRow}>
                                            <Text style={styles.totalsLabel}>Management ({fees.managementFee}%)</Text>
                                            <Text style={styles.totalsValue}>{formatCurrency(totals.managementAmount, currency)}</Text>
                                        </View>
                                    )}
                                    {fees?.commissionFee > 0 && (
                                        <View style={styles.totalsRow}>
                                            <Text style={styles.totalsLabel}>Commission ({fees.commissionFee}%)</Text>
                                            <Text style={styles.totalsValue}>{formatCurrency(totals.commissionAmount, currency)}</Text>
                                        </View>
                                    )}
                                    {fees?.discount > 0 && (
                                        <View style={styles.totalsRow}>
                                            <Text style={styles.totalsLabel}>Discount ({fees.discount}%)</Text>
                                            <Text style={styles.totalsValue}>-{formatCurrency(totals.discountAmount, currency)}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                            <View style={styles.totalsFinalRow}>
                                <Text style={styles.totalsFinalLabel}>TOTAL</Text>
                                <Text style={styles.totalsFinalValue}>{formatCurrency(totals.totalCharge, currency)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        {company.name} {company.website && `| ${company.website}`}
                    </Text>
                    <Text style={styles.footerBold}>
                        {quote.quoteNumber}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
