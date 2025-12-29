import { Text, View } from '@react-pdf/renderer';
import { styles } from './callSheetStyles';

/**
 * The footer with company name and page number
 * Reused on each page
 */
export default function PDFFooter({ companyName, version, pageNumber }) {
    return (
        <View style={styles.footer}>
            <Text style={styles.footerLeft}>
                {companyName} | Call Sheet v{version || 1}
            </Text>
            <Text style={styles.footerRight}>
                Page {pageNumber}
            </Text>
        </View>
    );
}
