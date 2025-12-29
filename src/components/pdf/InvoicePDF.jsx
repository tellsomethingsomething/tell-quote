import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SECTIONS, SECTION_ORDER } from '../../data/sections';
import { calculateSectionTotal, calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { useSettingsStore } from '../../store/settingsStore';
import { WIDTH_OPTIONS } from '../../data/invoiceModules';
import PDFWatermark from './PDFWatermark';

// Dynamic InvoicePDF that renders based on template layout
export default function InvoicePDF({ quote, currency, template, showWatermark = false }) {
    const settings = useSettingsStore.getState().settings;
    const { company, bankDetails, quoteDefaults, taxInfo } = settings;
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});

    // Template settings
    const { pageSettings, styles: templateStyles, layout } = template;

    // Create dynamic styles based on template
    const styles = createStyles(templateStyles, pageSettings);

    // Helper functions
    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    const formatDateLong = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const quoteDate = new Date(quote.createdAt || new Date());
    const dueDate = new Date(quoteDate);
    dueDate.setDate(quoteDate.getDate() + (quote.validityDays || quoteDefaults?.validityDays || 30));

    const preparedByUser = settings.users?.find(u => u.id === quote.preparedBy);

    // Context data passed to all modules
    const context = {
        quote,
        currency,
        settings,
        company,
        bankDetails,
        quoteDefaults,
        taxInfo,
        client,
        project,
        sections,
        fees,
        totals,
        quoteDate,
        dueDate,
        preparedByUser,
        formatDate,
        formatDateLong,
        templateStyles,
    };

    // Render modules in rows (grouping half-width modules together)
    const renderLayout = () => {
        const rows = [];
        let currentRow = [];
        let currentRowWidth = 0;

        layout.forEach((module, index) => {
            // Skip footer modules (rendered separately)
            if (module.type === 'footer') return;

            const widthValue = getWidthValue(module.width);

            if (currentRowWidth + widthValue > 100) {
                // Start new row
                if (currentRow.length > 0) {
                    rows.push([...currentRow]);
                }
                currentRow = [module];
                currentRowWidth = widthValue;
            } else {
                currentRow.push(module);
                currentRowWidth += widthValue;
            }
        });

        // Don't forget last row
        if (currentRow.length > 0) {
            rows.push(currentRow);
        }

        // Get the appropriate style for a module based on its position in the row
        const getModuleStyle = (module, positionInRow, totalInRow) => {
            const width = module.width || 'full';
            const isLast = positionInRow === totalInRow - 1;

            // Full width - no margin needed
            if (width === 'full') {
                return styles.moduleFull;
            }

            // Half width modules
            if (width === 'half') {
                return isLast ? styles.moduleHalfLast : styles.moduleHalf;
            }

            // Third width
            if (width === 'third') {
                return styles.moduleThird;
            }

            // Two-thirds width
            if (width === 'two-thirds') {
                return styles.moduleTwoThirds;
            }

            // Quarter width
            if (width === 'quarter') {
                return styles.moduleQuarter;
            }

            return styles.moduleFull;
        };

        return rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
                {row.map((module, moduleIndex) => {
                    // Determine auto-alignment based on position in row
                    // First module = left, Last module in multi-module row = right
                    const isMultiColumnRow = row.length > 1;
                    const isFirstInRow = moduleIndex === 0;
                    const isLastInRow = moduleIndex === row.length - 1;
                    const autoAlign = isMultiColumnRow ? (isLastInRow ? 'right' : 'left') : 'left';

                    // Determine effective alignment (config overrides auto-alignment)
                    const effectiveAlign = module.config?.alignment || autoAlign;

                    // Apply alignment to the wrapper View for proper react-pdf layout
                    const wrapperStyle = [
                        getModuleStyle(module, moduleIndex, row.length),
                        // For right-aligned modules, align content to the right edge
                        effectiveAlign === 'right' ? { alignItems: 'flex-end' } :
                        effectiveAlign === 'center' ? { alignItems: 'center' } :
                        { alignItems: 'flex-start' }
                    ];

                    return (
                        <View key={module.id} style={wrapperStyle}>
                            {renderModule(module, context, styles, autoAlign)}
                        </View>
                    );
                })}
            </View>
        ));
    };

    // Find footer module
    const footerModule = layout.find(m => m.type === 'footer');

    return (
        <Document>
            <Page
                size={pageSettings.size || 'A4'}
                orientation={pageSettings.orientation || 'portrait'}
                style={[styles.page, {
                    paddingTop: pageSettings.margins?.top || 40,
                    paddingBottom: pageSettings.margins?.bottom || 50,
                    paddingLeft: pageSettings.margins?.left || 40,
                    paddingRight: pageSettings.margins?.right || 40,
                }]}
            >
                {/* Watermark for free plan */}
                <PDFWatermark show={showWatermark} />

                {renderLayout()}

                {/* Footer */}
                {footerModule && (
                    <View style={styles.footer} fixed>
                        <FooterModule module={footerModule} context={context} styles={styles} />
                    </View>
                )}
            </Page>
        </Document>
    );
}

// Get width value as percentage number
function getWidthValue(width) {
    const widthMap = { full: 100, half: 50, third: 33.33, 'two-thirds': 66.66, quarter: 25 };
    return widthMap[width] || 100;
}

// Get width as string percentage
function getWidthPercent(width) {
    const widthMap = { full: '100%', half: '50%', third: '33.33%', 'two-thirds': '66.66%', quarter: '25%' };
    return widthMap[width] || '100%';
}

// Create styles from template
function createStyles(templateStyles, pageSettings) {
    const moduleSpacing = templateStyles?.moduleSpacing || 12;
    const columnGap = 16;

    return StyleSheet.create({
        page: {
            backgroundColor: templateStyles?.backgroundColor || '#FFFFFF',
            fontFamily: templateStyles?.fontFamily || 'Helvetica',
            fontSize: templateStyles?.baseFontSize || 10,
            color: templateStyles?.textColor || '#374151',
        },
        row: {
            flexDirection: 'row',
            marginBottom: moduleSpacing,
            alignItems: 'flex-start',
        },
        moduleHalf: {
            width: `${50 - (columnGap / 2)}%`,
            marginRight: columnGap,
        },
        moduleHalfLast: {
            width: `${50 - (columnGap / 2)}%`,
        },
        moduleFull: {
            width: '100%',
        },
        moduleThird: {
            width: '31%',
            marginRight: columnGap / 2,
        },
        moduleTwoThirds: {
            width: '65%',
            marginRight: columnGap / 2,
        },
        moduleQuarter: {
            width: '23%',
            marginRight: columnGap / 2,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: pageSettings?.margins?.left || 40,
            right: pageSettings?.margins?.right || 40,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
        },
    });
}

// Module renderer - autoAlign is determined by position in row (left column = 'left', right column = 'right')
function renderModule(module, context, styles, autoAlign = 'left') {
    const { type, config } = module;
    // Use explicit alignment from config, or fall back to auto-alignment based on position
    const effectiveAlign = config.alignment || autoAlign;

    switch (type) {
        case 'companyInfo':
            return <CompanyInfoModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'clientInfo':
            return <ClientInfoModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'invoiceHeader':
            return <InvoiceHeaderModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'projectInfo':
            return <ProjectInfoModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'lineItems':
            return <LineItemsModule config={config} context={context} />;
        case 'totals':
            return <TotalsModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'paymentTerms':
            return <PaymentTermsModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'bankDetails':
            return <BankDetailsModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'termsConditions':
            return <TermsConditionsModule config={config} context={context} autoAlign={effectiveAlign} />;
        case 'signature':
            return <SignatureModule config={config} context={context} />;
        case 'customText':
            return <CustomTextModule config={config} context={context} />;
        case 'divider':
            return <DividerModule config={config} />;
        case 'spacer':
            return <SpacerModule config={config} />;
        case 'image':
            return <ImageModule config={config} />;
        default:
            return null;
    }
}

// ============================================
// MODULE COMPONENTS
// ============================================

function CompanyInfoModule({ config, context, autoAlign }) {
    const { company, taxInfo } = context;
    const textAlign = autoAlign || 'left';
    const isRightAligned = textAlign === 'right';

    return (
        <View style={{ alignItems: isRightAligned ? 'flex-end' : 'flex-start' }}>
            {config.showLogo && company?.logo && (
                <Image src={company.logo} style={{ height: 40, width: 'auto', marginBottom: 6 }} />
            )}
            {config.showName && company?.name && (
                <Text style={{ fontSize: (config.fontSize || 10) + 4, fontFamily: 'Helvetica-Bold', marginBottom: 4, textAlign }}>
                    {company.name}
                </Text>
            )}
            {config.showAddress && company?.address && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {company.address}
                </Text>
            )}
            {config.showAddress && (company?.city || company?.country) && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {[company.city, company.country].filter(Boolean).join(', ')}
                </Text>
            )}
            {config.showPhone && company?.phone && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {company.phone}
                </Text>
            )}
            {config.showEmail && company?.email && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {company.email}
                </Text>
            )}
            {config.showWebsite && company?.website && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {company.website}
                </Text>
            )}
            {config.showTaxNumber && taxInfo?.taxNumber && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', marginTop: 4, textAlign }}>
                    Tax No: {taxInfo.taxNumber}
                </Text>
            )}
        </View>
    );
}

function ClientInfoModule({ config, context, autoAlign }) {
    const { client } = context;
    const textAlign = autoAlign || 'left';
    const isRightAligned = textAlign === 'right';

    return (
        <View style={{ alignItems: isRightAligned ? 'flex-end' : 'flex-start' }}>
            <Text style={{
                fontSize: 8,
                color: config.labelColor || '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
                textAlign,
            }}>
                {config.label || 'Prepared For'}
            </Text>
            {config.showCompany && client?.company && (
                <Text style={{ fontSize: config.fontSize || 10, fontFamily: 'Helvetica-Bold', marginBottom: 2, textAlign }}>
                    {client.company}
                </Text>
            )}
            {config.showContact && client?.contact && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {client.contact}
                </Text>
            )}
            {config.showEmail && client?.email && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {client.email}
                </Text>
            )}
            {config.showPhone && client?.phone && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {client.phone}
                </Text>
            )}
            {config.showAddress && client?.address && (
                <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign }}>
                    {client.address}
                </Text>
            )}
        </View>
    );
}

function InvoiceHeaderModule({ config, context, autoAlign }) {
    const { quote, quoteDate, dueDate, formatDateLong } = context;
    const textAlign = autoAlign || 'right';
    const isRightAligned = textAlign === 'right';

    return (
        <View style={{ alignItems: isRightAligned ? 'flex-end' : 'flex-start' }}>
            <Text style={{
                fontSize: config.titleSize || 24,
                color: config.titleColor || '#8B5CF6',
                fontFamily: 'Helvetica-Bold',
                letterSpacing: 2,
                marginBottom: 8,
                textAlign,
            }}>
                {config.title || 'QUOTE'}
            </Text>
            {config.showQuoteNumber && (
                <Text style={{ fontSize: 10, marginBottom: 2, textAlign }}>
                    {config.numberLabel || 'Quote No.'}: {quote.quoteNumber}
                </Text>
            )}
            {config.showDate && (
                <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 2, textAlign }}>
                    {config.dateLabel || 'Date'}: {formatDateLong(quoteDate)}
                </Text>
            )}
            {config.showDueDate && (
                <Text style={{ fontSize: 9, color: '#6B7280', textAlign }}>
                    {config.dueDateLabel || 'Valid Until'}: {formatDateLong(dueDate)}
                </Text>
            )}
        </View>
    );
}

function ProjectInfoModule({ config, context, autoAlign }) {
    const { project, formatDate } = context;
    if (!project?.title && !project?.venue) return null;

    const style = config.style || 'compact';
    const textAlign = autoAlign || 'left';
    const isRightAligned = textAlign === 'right';

    if (style === 'banner') {
        return (
            <View style={{
                backgroundColor: config.backgroundColor || '#1E293B',
                padding: 12,
                borderRadius: config.borderRadius || 4,
                alignItems: isRightAligned ? 'flex-end' : 'flex-start',
            }}>
                {config.showTitle && project.title && (
                    <Text style={{ fontSize: 12, color: config.textColor || '#FFFFFF', fontFamily: 'Helvetica-Bold', marginBottom: 6, textAlign }}>
                        {project.title}
                    </Text>
                )}
                <View style={{ flexDirection: 'row', justifyContent: isRightAligned ? 'flex-end' : 'flex-start', gap: 20 }}>
                    {config.showVenue && project.venue && (
                        <View style={{ alignItems: isRightAligned ? 'flex-end' : 'flex-start' }}>
                            <Text style={{ fontSize: 7, color: config.textColor || '#FFFFFF', opacity: 0.7, textTransform: 'uppercase', textAlign }}>
                                Venue
                            </Text>
                            <Text style={{ fontSize: 9, color: config.textColor || '#FFFFFF', textAlign }}>
                                {project.venue}
                            </Text>
                        </View>
                    )}
                    {config.showDates && project.startDate && (
                        <View style={{ alignItems: isRightAligned ? 'flex-end' : 'flex-start' }}>
                            <Text style={{ fontSize: 7, color: config.textColor || '#FFFFFF', opacity: 0.7, textTransform: 'uppercase', textAlign }}>
                                Dates
                            </Text>
                            <Text style={{ fontSize: 9, color: config.textColor || '#FFFFFF', textAlign }}>
                                {formatDate(project.startDate)} {project.endDate && `- ${formatDate(project.endDate)}`}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // Compact style - simple text layout
    return (
        <View style={{
            backgroundColor: config.backgroundColor || '#F8FAFC',
            padding: 10,
            borderRadius: config.borderRadius || 4,
            borderLeftWidth: textAlign === 'left' ? 3 : 0,
            borderRightWidth: textAlign === 'right' ? 3 : 0,
            borderLeftColor: context.templateStyles?.primaryColor || '#8B5CF6',
            borderRightColor: context.templateStyles?.primaryColor || '#8B5CF6',
            alignItems: isRightAligned ? 'flex-end' : 'flex-start',
        }}>
            <Text style={{ fontSize: 7, color: context.templateStyles?.primaryColor || '#8B5CF6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, textAlign }}>
                Project
            </Text>
            {config.showTitle && project.title && (
                <Text style={{ fontSize: 11, color: config.textColor || '#374151', marginBottom: 4, textAlign }}>
                    {project.title}
                </Text>
            )}
            <Text style={{ fontSize: 8, color: '#6B7280', textAlign }}>
                {[
                    config.showVenue && project.venue,
                    config.showDates && project.startDate && `${formatDate(project.startDate)}${project.endDate ? ` - ${formatDate(project.endDate)}` : ''}`
                ].filter(Boolean).join('     ')}
            </Text>
        </View>
    );
}

function LineItemsModule({ config, context }) {
    const { sections, fees, totals, currency, quote } = context;
    const sectionOrder = quote.sectionOrder || SECTION_ORDER;

    return (
        <View>
            {sectionOrder.map(sectionId => {
                const section = sections?.[sectionId];
                const sectionConfig = SECTIONS[sectionId];
                if (!section || !sectionConfig) return null;

                const subsectionOrder = section.subsectionOrder ||
                    [...sectionConfig.subsections, ...(section.customSubsections || [])];

                const sectionTotals = calculateSectionTotal(section.subsections);
                const itemCount = Object.values(section.subsections || {}).reduce((acc, items) => acc + items.length, 0);
                if (itemCount === 0) return null;

                const sectionName = quote.sectionNames?.[sectionId] || sectionConfig.name;

                return (
                    <View key={sectionId} style={{ marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }} wrap={false}>
                        {/* Section Header */}
                        {config.groupBySection && (
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                backgroundColor: config.headerBackground || '#8B5CF6'
                            }}>
                                <Text style={{ fontSize: config.fontSize || 9, color: config.headerTextColor || '#FFFFFF', fontFamily: 'Helvetica-Bold' }}>
                                    {sectionName}
                                </Text>
                                {config.showSectionTotals && (
                                    <Text style={{ fontSize: config.fontSize || 9, color: config.headerTextColor || '#FFFFFF' }}>
                                        {formatCurrency(sectionTotals.totalCharge, currency)}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Table Header */}
                        <View style={{ flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                            <Text style={{ width: '44%', fontSize: 7, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Item</Text>
                            {config.showQuantity && <Text style={{ width: '10%', fontSize: 7, color: '#6B7280', textAlign: 'center', textTransform: 'uppercase' }}>{config.quantityLabel || 'Qty'}</Text>}
                            {config.showDays && <Text style={{ width: '10%', fontSize: 7, color: '#6B7280', textAlign: 'center', textTransform: 'uppercase' }}>{config.daysLabel || 'Days'}</Text>}
                            {config.showRate && <Text style={{ width: '18%', fontSize: 7, color: '#6B7280', textAlign: 'right', textTransform: 'uppercase' }}>{config.rateLabel || 'Rate'}</Text>}
                            <Text style={{ width: '18%', fontSize: 7, color: '#6B7280', textAlign: 'right', textTransform: 'uppercase' }}>Amount</Text>
                        </View>

                        {/* Items */}
                        {subsectionOrder.map(subsectionName => {
                            const items = section.subsections?.[subsectionName] || [];
                            if (items.length === 0) return null;

                            const isFlatSection = ['creative', 'logistics', 'expenses'].includes(sectionId);
                            const displaySubsectionName = section.subsectionNames?.[subsectionName] || subsectionName;

                            return (
                                <View key={subsectionName}>
                                    {/* Subsection Header */}
                                    {config.showSubsections && !(isFlatSection && subsectionName === 'Services') && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#F1F5F9' }}>
                                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: context.templateStyles?.primaryColor || '#8B5CF6', marginRight: 6 }} />
                                            <Text style={{ fontSize: 8, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                {displaySubsectionName}
                                            </Text>
                                        </View>
                                    )}

                                    {items.map((item, idx) => {
                                        const displayRate = fees?.distributeFees ? totals.getDistributedRate(item.charge || 0) : (item.charge || 0);
                                        const lineTotal = displayRate * (item.quantity || 1) * (item.days || 1);
                                        const isEven = idx % 2 === 0;

                                        return (
                                            <View
                                                key={item.id || idx}
                                                style={{
                                                    flexDirection: 'row',
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 10,
                                                    backgroundColor: isEven ? '#FFFFFF' : (config.alternateRowColor || '#F8FAFC'),
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#F1F5F9',
                                                }}
                                            >
                                                <Text style={{ width: '44%', fontSize: config.fontSize || 9 }}>{item.name || 'Item'}</Text>
                                                {config.showQuantity && <Text style={{ width: '10%', fontSize: config.fontSize || 9, textAlign: 'center', color: '#6B7280' }}>{item.quantity || 1}</Text>}
                                                {config.showDays && <Text style={{ width: '10%', fontSize: config.fontSize || 9, textAlign: 'center', color: '#6B7280' }}>{item.days || 1}</Text>}
                                                {config.showRate && <Text style={{ width: '18%', fontSize: config.fontSize || 9, textAlign: 'right', color: '#6B7280' }}>{formatCurrency(displayRate, currency)}</Text>}
                                                <Text style={{ width: '18%', fontSize: config.fontSize || 9, textAlign: 'right' }}>{formatCurrency(lineTotal, currency)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })}
                    </View>
                );
            })}
        </View>
    );
}

function TotalsModule({ config, context, autoAlign }) {
    const { totals, fees, currency } = context;
    const style = config.style || 'boxed';
    const alignment = autoAlign || 'right';
    const isRightAligned = alignment === 'right';

    const rows = [];

    if (config.showSubtotal && (fees?.managementFee > 0 || fees?.commissionFee > 0 || fees?.discount > 0)) {
        rows.push({
            label: config.subtotalLabel || 'Subtotal',
            value: fees?.distributeFees ? totals.chargeWithFees : totals.baseCharge,
        });
    }

    if (config.showManagementFee && !fees?.distributeFees && fees?.managementFee > 0) {
        rows.push({
            label: `${config.managementFeeLabel || 'Management Fee'} (${fees.managementFee}%)`,
            value: totals.managementAmount,
        });
    }

    if (config.showCommission && !fees?.distributeFees && fees?.commissionFee > 0) {
        rows.push({
            label: `${config.commissionLabel || 'Commission'} (${fees.commissionFee}%)`,
            value: totals.commissionAmount,
        });
    }

    if (config.showDiscount && fees?.discount > 0) {
        rows.push({
            label: `${config.discountLabel || 'Discount'} (${fees.discount}%)`,
            value: -totals.discountAmount,
            isDiscount: true,
        });
    }

    if (config.showTax && config.taxRate > 0) {
        const taxAmount = totals.totalCharge * (config.taxRate / 100);
        rows.push({
            label: `${config.taxLabel || 'Tax'} (${config.taxRate}%)`,
            value: taxAmount,
        });
    }

    // Container style - boxed style adds background
    const containerStyle = {
        ...(style === 'boxed' ? {
            backgroundColor: '#F8FAFC',
            padding: 12,
            borderRadius: 4,
        } : {}),
        // Set full width for proper alignment via parent
        width: '100%',
        alignItems: isRightAligned ? 'flex-end' : 'flex-start',
    };

    // Inner content wrapper to constrain width when right-aligned
    const contentWidth = isRightAligned ? 250 : '100%';

    return (
        <View style={containerStyle}>
            <View style={{ width: contentWidth }}>
                {rows.map((row, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                        <Text style={{ fontSize: config.fontSize || 10, color: '#6B7280', textAlign: 'right', marginRight: 12 }}>{row.label}</Text>
                        <Text style={{ fontSize: config.fontSize || 10, color: row.isDiscount ? '#DC2626' : '#374151', textAlign: 'right', minWidth: 80 }}>
                            {row.isDiscount ? '-' : ''}{formatCurrency(Math.abs(row.value), currency)}
                        </Text>
                    </View>
                ))}

                {/* Grand Total */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: config.totalBackground || '#8B5CF6',
                    borderRadius: 4,
                    marginTop: 8,
                }}>
                    <Text style={{ fontSize: config.fontSize || 10, color: config.totalTextColor || '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right', marginRight: 12 }}>
                        {config.grandTotalLabel || 'TOTAL'}
                    </Text>
                    <Text style={{ fontSize: 16, color: config.totalTextColor || '#FFFFFF', fontFamily: 'Helvetica-Bold', textAlign: 'right', minWidth: 100 }}>
                        {formatCurrency(totals.totalCharge + (config.showTax && config.taxRate ? totals.totalCharge * (config.taxRate / 100) : 0), currency)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function BankDetailsModule({ config, context, autoAlign }) {
    const { bankDetails, currency } = context;
    if (!bankDetails) return null;

    const style = config.style || 'stacked';
    const textAlign = autoAlign || 'left';

    return (
        <View>
            <Text style={{
                fontSize: 8,
                color: config.labelColor || '#8B5CF6',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                textAlign,
            }}>
                {config.label || 'Bank Details'}
            </Text>

            {style === 'boxed' ? (
                <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 4 }}>
                    {config.showBankName && bankDetails.bankName && (
                        <Text style={{ fontSize: config.fontSize || 9, marginBottom: 2 }}>{bankDetails.bankName}</Text>
                    )}
                    {config.showAccountName && bankDetails.accountName && (
                        <Text style={{ fontSize: config.fontSize || 9, marginBottom: 2 }}>{bankDetails.accountName}</Text>
                    )}
                    {config.showAccountNumber && bankDetails.accountNumber && (
                        <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', marginBottom: 2 }}>
                            Acc: {bankDetails.accountNumber}
                        </Text>
                    )}
                    {config.showSwiftCode && bankDetails.swiftCode && (
                        <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', marginBottom: 2 }}>
                            SWIFT: {bankDetails.swiftCode}
                        </Text>
                    )}
                    {config.showCurrency && currency && (
                        <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280' }}>
                            Currency: {currency}
                        </Text>
                    )}
                </View>
            ) : (
                <View>
                    {config.showBankName && bankDetails.bankName && (
                        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', width: 80 }}>Bank:</Text>
                            <Text style={{ fontSize: config.fontSize || 9 }}>{bankDetails.bankName}</Text>
                        </View>
                    )}
                    {config.showAccountName && bankDetails.accountName && (
                        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', width: 80 }}>Name:</Text>
                            <Text style={{ fontSize: config.fontSize || 9 }}>{bankDetails.accountName}</Text>
                        </View>
                    )}
                    {config.showAccountNumber && bankDetails.accountNumber && (
                        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', width: 80 }}>Account:</Text>
                            <Text style={{ fontSize: config.fontSize || 9 }}>{bankDetails.accountNumber}</Text>
                        </View>
                    )}
                    {config.showSwiftCode && bankDetails.swiftCode && (
                        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', width: 80 }}>SWIFT:</Text>
                            <Text style={{ fontSize: config.fontSize || 9 }}>{bankDetails.swiftCode}</Text>
                        </View>
                    )}
                    {config.showCurrency && currency && (
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', width: 80 }}>Currency:</Text>
                            <Text style={{ fontSize: config.fontSize || 9 }}>{currency}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

function PaymentTermsModule({ config, context, autoAlign }) {
    const { quoteDefaults } = context;
    const textAlign = autoAlign || 'left';

    const text = config.customText || (config.showDefaultTerms ? quoteDefaults?.paymentTerms : '') || '';

    return (
        <View>
            <Text style={{
                fontSize: 8,
                color: config.labelColor || '#8B5CF6',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                textAlign,
            }}>
                {config.label || 'Payment Terms'}
            </Text>
            <Text style={{ fontSize: config.fontSize || 9, color: '#6B7280', lineHeight: 1.5, textAlign }}>
                {text}
            </Text>
        </View>
    );
}

function TermsConditionsModule({ config, context, autoAlign }) {
    const { quoteDefaults } = context;
    const textAlign = autoAlign || 'left';

    let text = config.customText || (config.showDefaultTerms ? quoteDefaults?.termsAndConditions : '') || '';

    // Apply max lines if set
    if (config.maxLines > 0) {
        const lines = text.split('\n').slice(0, config.maxLines);
        text = lines.join('\n');
    }

    return (
        <View>
            <Text style={{
                fontSize: 8,
                color: config.labelColor || '#8B5CF6',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                textAlign,
            }}>
                {config.label || 'Terms & Conditions'}
            </Text>
            <Text style={{ fontSize: config.fontSize || 8, color: '#6B7280', lineHeight: 1.6, textAlign }}>
                {text}
            </Text>
        </View>
    );
}

function SignatureModule({ config, context }) {
    const { preparedByUser } = context;

    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {config.showPreparedBy && (
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 30 }}>
                            {config.preparedByLabel || 'Prepared By'}:
                        </Text>
                        {config.showSignatureLine && (
                            <View style={{ borderBottomWidth: 1, borderBottomColor: config.lineColor || '#D1D5DB', marginBottom: 6 }} />
                        )}
                        <Text style={{ fontSize: config.fontSize || 9 }}>
                            {preparedByUser?.name || ''}
                        </Text>
                        {config.showDate && (
                            <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>Date: _____________</Text>
                        )}
                    </View>
                )}

                {config.showAcceptedBy && (
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 30 }}>
                            {config.acceptedByLabel || 'Accepted By'}:
                        </Text>
                        {config.showSignatureLine && (
                            <View style={{ borderBottomWidth: 1, borderBottomColor: config.lineColor || '#D1D5DB', marginBottom: 6 }} />
                        )}
                        <Text style={{ fontSize: config.fontSize || 9, color: '#9CA3AF' }}>
                            Name & Signature
                        </Text>
                        {config.showDate && (
                            <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>Date: _____________</Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

function CustomTextModule({ config }) {
    const bgColor = config.backgroundColor === 'transparent' ? undefined : config.backgroundColor;

    return (
        <View style={{
            padding: config.padding || 0,
            backgroundColor: bgColor,
            borderRadius: config.borderRadius || 0,
        }}>
            <Text style={{
                fontSize: config.fontSize || 10,
                color: config.textColor || '#374151',
                fontFamily: config.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica',
                textAlign: config.alignment || 'left',
            }}>
                {config.text || ''}
            </Text>
        </View>
    );
}

function DividerModule({ config }) {
    const borderStyle = config.style === 'dashed' ? 'dashed' : config.style === 'dotted' ? 'dotted' : 'solid';

    return (
        <View style={{
            marginTop: config.marginTop || 10,
            marginBottom: config.marginBottom || 10,
            borderBottomWidth: config.thickness || 1,
            borderBottomColor: config.color || '#E5E7EB',
            borderBottomStyle: borderStyle,
        }} />
    );
}

function SpacerModule({ config }) {
    return <View style={{ height: config.height || 20 }} />;
}

function ImageModule({ config }) {
    if (!config.imageUrl) return null;

    const alignment = config.alignment || 'center';
    const justifyContent = alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';

    return (
        <View style={{ flexDirection: 'row', justifyContent }}>
            <Image
                src={config.imageUrl}
                style={{
                    width: `${config.width || 100}%`,
                    borderRadius: config.borderRadius || 0,
                }}
            />
        </View>
    );
}

function FooterModule({ module, context, styles }) {
    const { config } = module;
    const { quote, company } = context;

    const alignment = config.alignment || 'center';
    const justifyContent = alignment === 'space-between' ? 'space-between' :
        alignment === 'center' ? 'center' :
        alignment === 'right' ? 'flex-end' : 'flex-start';

    return (
        <View style={{ flexDirection: 'row', justifyContent, alignItems: 'center', paddingVertical: 8 }}>
            {config.showCompanyName && company?.name && (
                <Text style={{ fontSize: config.fontSize || 8, color: config.textColor || '#9CA3AF' }}>
                    {company.name}
                </Text>
            )}
            {config.showWebsite && company?.website && (
                <Text style={{ fontSize: config.fontSize || 8, color: config.textColor || '#9CA3AF', marginLeft: 12 }}>
                    {company.website}
                </Text>
            )}
            {config.customText && (
                <Text style={{ fontSize: config.fontSize || 8, color: config.textColor || '#9CA3AF' }}>
                    {config.customText}
                </Text>
            )}
            {config.showQuoteNumber && (
                <Text style={{ fontSize: config.fontSize || 8, color: config.textColor || '#9CA3AF' }}>
                    {quote.quoteNumber}
                </Text>
            )}
            {config.showPageNumbers && (
                <Text
                    style={{ fontSize: config.fontSize || 8, color: config.textColor || '#9CA3AF', marginLeft: 12 }}
                    render={({ pageNumber, totalPages }) =>
                        (config.pageNumberFormat || 'Page {current} of {total}')
                            .replace('{current}', pageNumber)
                            .replace('{total}', totalPages)
                    }
                />
            )}
        </View>
    );
}
