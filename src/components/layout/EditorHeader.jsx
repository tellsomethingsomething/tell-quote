import { useState } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useClientStore } from '../../store/clientStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../common/Toast';
import SaveAsTemplateModal from '../templates/SaveAsTemplateModal';

export default function EditorHeader({ onGoToDashboard }) {
    const { quote, ratesLoading, refreshRates } = useQuoteStore();
    const { saveQuote } = useClientStore();
    const { settings, setTheme } = useSettingsStore();
    const toast = useToast();

    const isDark = settings.theme !== 'light';
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const handleSaveQuote = () => {
        setSaving(true);
        try {
            const savedQuote = saveQuote(quote);
            if (savedQuote?.id && !quote.id) {
                useQuoteStore.getState().loadQuoteData({ ...quote, id: savedQuote.id });
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch {
            toast.error('Failed to save quote.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border">
                <div className="max-w-[1920px] mx-auto px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Logo & Navigation */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={onGoToDashboard}
                                className="btn-icon"
                                title="Back to Dashboard"
                                aria-label="Back to Dashboard"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <img src="/tell-logo.svg" alt="Tell" className="h-5 sm:h-6 hidden xs:block" />
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-[10px] sm:text-xs font-mono text-accent-primary">{quote.quoteNumber}</span>
                                    <span className="text-[10px] text-gray-500 border border-gray-800 rounded px-1 hidden sm:inline">
                                        {quote.preparedBy === 'default' ? 'Admin' : 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Controls */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            {/* Status Label */}
                            <div className={`px-2 sm:px-3 py-1 min-h-[32px] rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border flex items-center ${
                                quote.status === 'won' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                quote.status === 'sent' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                quote.status === 'dead' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                                'bg-gray-700/50 text-gray-400 border-gray-600'
                            }`}>
                                {quote.status || 'Draft'}
                            </div>

                            {/* Refresh Rates */}
                            <button
                                onClick={refreshRates}
                                disabled={ratesLoading}
                                className="btn-icon hidden sm:flex"
                                title="Refresh exchange rates"
                            >
                                <svg className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            {/* Save as Template */}
                            <button
                                onClick={() => setShowTemplateModal(true)}
                                className="btn-icon"
                                title="Save as template"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                <span className="hidden sm:inline">Template</span>
                            </button>

                            {/* Save Quote */}
                            <button
                                onClick={handleSaveQuote}
                                disabled={saving}
                                className={`btn-icon ${saveSuccess ? 'text-green-400' : ''}`}
                                title="Save quote to library"
                            >
                                {saveSuccess ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                )}
                                <span className="hidden sm:inline">{saveSuccess ? 'Saved!' : 'Save'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <SaveAsTemplateModal
                isOpen={showTemplateModal}
                onClose={(success) => {
                    setShowTemplateModal(false);
                    if (success) {
                        toast.success('Template saved successfully!');
                    }
                }}
            />
        </>
    );
}
