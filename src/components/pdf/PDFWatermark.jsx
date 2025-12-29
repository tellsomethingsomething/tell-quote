/**
 * PDF Watermark Component
 * Renders a diagonal watermark across PDF pages for free plan users
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 1000,
    },
    watermarkText: {
        fontSize: 60,
        color: 'rgba(0, 0, 0, 0.06)',
        fontFamily: 'Helvetica-Bold',
        transform: 'rotate(-45deg)',
        textAlign: 'center',
        letterSpacing: 8,
    },
    watermarkSmall: {
        fontSize: 10,
        color: 'rgba(0, 0, 0, 0.08)',
        fontFamily: 'Helvetica',
        position: 'absolute',
        bottom: 15,
        right: 15,
    },
});

/**
 * Watermark overlay for free plan PDFs
 * @param {boolean} show - Whether to show the watermark
 */
export default function PDFWatermark({ show = false }) {
    if (!show) return null;

    return (
        <>
            {/* Large diagonal watermark */}
            <View style={styles.watermarkContainer} fixed>
                <Text style={styles.watermarkText}>SAMPLE</Text>
            </View>
            {/* Small footer watermark */}
            <Text style={styles.watermarkSmall} fixed>
                Created with ProductionOS - productionos.io
            </Text>
        </>
    );
}
