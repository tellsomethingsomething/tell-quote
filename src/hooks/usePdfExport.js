import { useState, useCallback } from 'react';

/**
 * Custom hook for PDF export functionality with dynamic imports
 * @param {Function} onSuccess - Callback on successful export
 * @param {Function} onError - Callback on error
 * @returns {Object} - { exportPdf, previewPdf, isGenerating, isPreviewing }
 */
export function usePdfExport(onSuccess, onError) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Lazy load PDF dependencies
  const loadPdfDependencies = useCallback(async () => {
    const [{ pdf }, { default: CleanPDF }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../components/pdf/CleanPDF.jsx')
    ]);
    return { pdf, CleanPDF };
  }, []);

  // Generate and preview PDF in new tab
  const previewPdf = useCallback(async (quote, currency) => {
    setIsPreviewing(true);
    try {
      const { pdf, CleanPDF } = await loadPdfDependencies();
      const blob = await pdf(
        CleanPDF({ quote, currency })
      ).toBlob();

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      if (onSuccess) onSuccess('Preview opened');
    } catch (error) {
      console.error('PDF preview error:', error);
      if (onError) onError(error);
    } finally {
      setIsPreviewing(false);
    }
  }, [loadPdfDependencies, onSuccess, onError]);

  // Generate and download PDF
  const exportPdf = useCallback(async (quote, currency) => {
    setIsGenerating(true);
    try {
      const { pdf, CleanPDF } = await loadPdfDependencies();
      const blob = await pdf(
        CleanPDF({ quote, currency })
      ).toBlob();

      const clientName = quote.client?.company || 'Client';
      const projectTitle = quote.project?.title || 'Project';
      const date = quote.quoteDate || new Date().toISOString().split('T')[0];
      const filename = `${clientName} - ${projectTitle} - ${date} - Quote.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      if (onSuccess) onSuccess('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      if (onError) onError(error);
    } finally {
      setIsGenerating(false);
    }
  }, [loadPdfDependencies, onSuccess, onError]);

  return {
    exportPdf,
    previewPdf,
    isGenerating,
    isPreviewing,
  };
}
