import { createElement } from 'react';

export async function exportQuoteToPDF(quote, currency, { showWatermark = false } = {}) {
    try {
        // Lazy load PDF dependencies to avoid 1.5MB bundle on initial load
        const [{ pdf }, { default: CleanPDF }] = await Promise.all([
            import('@react-pdf/renderer'),
            import('../components/pdf/CleanPDF')
        ]);

        // Generate PDF blob
        const blob = await pdf(createElement(CleanPDF, { quote, currency, showWatermark })).toBlob();

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
