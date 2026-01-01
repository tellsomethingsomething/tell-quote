import React, { Component } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import logger from '../../utils/logger';

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        color: '#EF4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 12,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 12,
    },
    details: {
        fontSize: 10,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 400,
    },
});

/**
 * Error Boundary specifically for PDF generation components.
 * Catches errors during PDF rendering and displays a fallback PDF document
 * with error information instead of crashing the entire export.
 */
class PDFErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('PDF generation error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const errorMessage = this.state.error?.message || 'Unknown error';

            return (
                <Document>
                    <Page size="A4" style={styles.page}>
                        <View style={styles.container}>
                            <Text style={styles.title}>PDF Generation Error</Text>
                            <Text style={styles.message}>
                                We encountered an error while generating this document.
                            </Text>
                            <Text style={styles.details}>
                                Error: {errorMessage}
                            </Text>
                            <Text style={[styles.details, { marginTop: 20 }]}>
                                Please check the quote data for invalid values (NaN, missing fields)
                                and try again. If this problem persists, contact support.
                            </Text>
                        </View>
                    </Page>
                </Document>
            );
        }

        return this.props.children;
    }
}

/**
 * Validates quote data before PDF rendering.
 * Throws descriptive errors for common issues.
 */
export function validateQuoteForPDF(quote) {
    if (!quote) {
        throw new Error('Quote data is missing');
    }

    if (!quote.sections || typeof quote.sections !== 'object') {
        throw new Error('Quote sections are missing or invalid');
    }

    // Check for NaN/Infinity in financial calculations
    const checkNumber = (value, fieldName) => {
        if (typeof value === 'number' && (!isFinite(value) || isNaN(value))) {
            throw new Error(`Invalid number in ${fieldName}: ${value}`);
        }
    };

    // Validate fees
    if (quote.fees) {
        checkNumber(quote.fees.managementFee, 'managementFee');
        checkNumber(quote.fees.commissionFee, 'commissionFee');
        checkNumber(quote.fees.discount, 'discount');
    }

    // Validate sections and line items
    Object.entries(quote.sections || {}).forEach(([sectionId, section]) => {
        if (!section?.subsections) return;

        Object.entries(section.subsections).forEach(([subsectionName, items]) => {
            if (!Array.isArray(items)) return;

            items.forEach((item, idx) => {
                const prefix = `${sectionId}/${subsectionName}/item[${idx}]`;
                checkNumber(item.quantity, `${prefix}.quantity`);
                checkNumber(item.days, `${prefix}.days`);
                checkNumber(item.cost, `${prefix}.cost`);
                checkNumber(item.charge, `${prefix}.charge`);
            });
        });
    });

    return true;
}

export default PDFErrorBoundary;
