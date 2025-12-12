import { pdf } from '@react-pdf/renderer';
import QuotePDF from '../components/pdf/QuotePDF';

export async function exportQuoteToPDF(quote, currency) {
    try {
        // Generate PDF blob
        const blob = await pdf(<QuotePDF quote={quote} currency={currency} />).toBlob();

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Generate filename: [QuoteNumber]_[Project]_[Client].pdf
        const safeName = (str) => (str || '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const projectStr = safeName(quote.project?.title);
        const clientStr = safeName(quote.client?.company);
        const filename = `${quote.quoteNumber || 'Quote'}${projectStr ? `_${projectStr}` : ''}${clientStr ? `_${clientStr}` : ''}.pdf`;

        link.href = url;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Failed to export PDF:', error);
        throw error;
    }
}
