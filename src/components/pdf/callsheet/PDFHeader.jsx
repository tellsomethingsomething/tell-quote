import { Text, View } from '@react-pdf/renderer';
import { styles } from './callSheetStyles';
import { formatDate } from './callSheetHelpers';

/**
 * The dark header banner with production title, day badge, and date
 * Reused on each page
 */
export default function PDFHeader({ sheet, pageTitle = null }) {
    const title = pageTitle
        ? `${sheet.productionTitle || sheet.projectName || 'Call Sheet'} - ${pageTitle}`
        : (sheet.productionTitle || sheet.projectName || 'Call Sheet');

    return (
        <View style={styles.headerBanner}>
            <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                    <Text style={styles.productionTitle}>
                        {title}
                    </Text>
                    {!pageTitle && sheet.episodeTitle && (
                        <Text style={styles.episodeInfo}>
                            {sheet.episodeNumber && `Episode ${sheet.episodeNumber}: `}
                            {sheet.episodeTitle}
                        </Text>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>
                            DAY {sheet.dayNumber || 1}{!pageTitle && sheet.totalDays ? ` OF ${sheet.totalDays}` : ''}
                        </Text>
                    </View>
                    {!pageTitle && (
                        <Text style={styles.dateText}>
                            {formatDate(sheet.shootDate)}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}
