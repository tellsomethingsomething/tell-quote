import { useState } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useClientStore } from '../../store/clientStore';
import { useAuthStore } from '../../store/authStore';
import Navigation from './Navigation';

export default function Header({ view = 'editor', onGoToClients, onGoToRateCard, onGoToSettings, onGoToDashboard, onGoToQuotes }) {
    const { quote, ratesLoading, refreshRates } = useQuoteStore();
    const { saveQuote } = useClientStore();
    const { logout } = useAuthStore();
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSaveQuote = () => {
        setSaving(true);
        try {
            // Save to library and get the saved quote with ID
            const savedQuote = saveQuote(quote);

            // Update the quote in editor with the ID so future edits auto-save
            if (savedQuote?.id && !quote.id) {
                useQuoteStore.getState().loadQuoteData({ ...quote, id: savedQuote.id });
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch {
            alert('Failed to save quote.');
        } finally {
            setSaving(false);
        }
    };

    // Dashboard view header - minimal (DashboardPage has its own header/nav now)
    // Or we keep a global header but remove the "Back to Clients" and quote info.
    // Given the user said "Why is this still on the header", they probably want it gone.
    // In fact, DashboardPage has its own "Welcome back" header now.
    // So distinct global header might be redundant or just needs to be very simple (Logo + User?)
    // Let's make it simple for dashboard similar to clients view but maybe without title if DashboardPage handles it?
    // Clients view has "Tell Productions Quote Tool".
    // Let's use the same clean header for Dashboard as for Clients view.
    if (view === 'clients' || view === 'dashboard' || view === 'quotes' || view === 'rate-card' || view === 'settings') {
        const activeTab = view;

        return (
            <header className="h-[60px] bg-[#111827] border-b border-gray-800 flex items-center justify-between px-6 z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    {/* Logo - Click to go to Dashboard (Home) */}
                    <button
                        onClick={onGoToDashboard}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        title="Go to Dashboard"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-blue-600 flex items-center justify-center shadow-lg shadow-accent-primary/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden md:block">
                            Quote Tool
                        </span>
                    </button>
                </div>

                {/* Central Navigation */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <Navigation
                        activeTab={activeTab}
                        onTabChange={(tab) => {
                            if (tab === 'dashboard') onGoToDashboard();
                            if (tab === 'quotes') onGoToQuotes();
                            if (tab === 'clients') onGoToClients();
                            if (tab === 'rate-card') onGoToRateCard();
                            if (tab === 'settings') onGoToSettings();
                        }}
                    />
                </div>

                {/* Right Side - User Menu */}
                <div className="w-[120px] flex justify-end relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
                    >
                        TM
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-2xl z-50 dropdown-menu overflow-hidden">
                                <div className="px-4 py-3 border-b border-dark-border">
                                    <p className="text-sm font-medium text-gray-200">Signed in as</p>
                                    <p className="text-xs text-gray-500">Director / Partner</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        logout();
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header>
        );
    }

    // Editor view header
    return (
        <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border">
            <div className="max-w-[1920px] mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo & Navigation */}
                    {/* Logo & Navigation */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onGoToClients}
                                className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-blue-600 flex items-center justify-center shadow-lg shadow-accent-primary/20 hover:opacity-80 transition-opacity"
                                title="Back to Clients"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    Quote Editor
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-accent-primary">{quote.quoteNumber}</span>
                                    <span className="text-[10px] text-gray-500 border border-gray-800 rounded px-1">
                                        {quote.preparedBy === 'default' ? 'Admin' : 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-2">
                        {/* Status Label (Replaces Currency) */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${quote.status === 'won' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
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
                            className="btn-ghost p-2 hidden sm:flex"
                            title="Refresh exchange rates"
                        >
                            <svg className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

                        {/* Save Quote */}
                        <button
                            onClick={handleSaveQuote}
                            disabled={saving}
                            className={`btn-ghost text-sm flex items-center gap-1 ${saveSuccess ? 'text-green-400' : ''}`}
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
    );
}
