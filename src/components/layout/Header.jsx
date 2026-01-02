import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useQuoteStore } from '../../store/quoteStore';
import { useClientStore } from '../../store/clientStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { CURRENCIES } from '../../data/currencies';
import Navigation from './Navigation';
import { useToast } from '../common/Toast';
import SaveAsTemplateModal from '../templates/SaveAsTemplateModal';
import SubscriptionBadge from '../billing/SubscriptionBadge';
import Logo from '../Logo';

// Theme Toggle Component
function ThemeToggle() {
    // Only select the specific setting we need to prevent unnecessary re-renders
    const theme = useSettingsStore(state => state.settings?.theme);
    const setTheme = useSettingsStore(state => state.setTheme);
    const isDark = theme !== 'light';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}

// Currency Selector Component
function CurrencySelector() {
    const { currency, symbol, setCurrency, preferredCurrencies } = useDisplayCurrency();
    const [isOpen, setIsOpen] = useState(false);

    // Get full list of currencies for "More" option
    const allCurrencies = Object.keys(CURRENCIES);
    const [showAll, setShowAll] = useState(false);

    const currenciesToShow = showAll ? allCurrencies : preferredCurrencies;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="min-w-[44px] min-h-[44px] px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-sm text-gray-300"
                title="Change display currency"
            >
                <span className="text-base">{symbol}</span>
                <span className="hidden sm:inline text-xs font-medium">{currency}</span>
                <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => { setIsOpen(false); setShowAll(false); }}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1f2e] border border-dark-border rounded-lg shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-dark-border">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Display Currency</p>
                        </div>
                        {currenciesToShow.map((code) => {
                            const config = CURRENCIES[code];
                            if (!config) return null;
                            return (
                                <button
                                    key={code}
                                    onClick={() => {
                                        setCurrency(code);
                                        setIsOpen(false);
                                        setShowAll(false);
                                    }}
                                    className={`w-full px-3 py-2 min-h-[40px] text-left text-sm transition-colors flex items-center justify-between ${currency === code
                                        ? 'bg-brand-primary/20 text-brand-primary'
                                        : 'text-gray-300 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="w-6 text-center">{config.symbol}</span>
                                        <span>{code}</span>
                                    </span>
                                    {currency === code && (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                        {!showAll && (
                            <button
                                onClick={() => setShowAll(true)}
                                className="w-full px-3 py-2 min-h-[40px] text-left text-xs text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors border-t border-dark-border"
                            >
                                Show all currencies...
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Skip Link Component for keyboard accessibility
function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-dark-bg transition-all"
        >
            Skip to main content
        </a>
    );
}

export default function Header({ view = 'editor', onGoToClients, onGoToRateCard, onGoToSettings, onGoToDashboard, onGoToQuotes, onGoToFS, onGoToOpportunities, onGoToProjects, onGoToTasks, onGoToSOP, onGoToKnowledge, onGoToKit, onGoToContacts }) {
    const { quote, ratesLoading, refreshRates } = useQuoteStore(
        state => ({ quote: state.quote, ratesLoading: state.ratesLoading, refreshRates: state.refreshRates }),
        shallow
    );
    const saveQuote = useClientStore(state => state.saveQuote);
    const { logout, user } = useAuthStore(
        state => ({ logout: state.logout, user: state.user }),
        shallow
    );
    const toast = useToast();

    // Get user display info
    const userName = user?.profile?.name || user?.email?.split('@')[0] || 'User';
    const userRole = user?.profile?.role === 'admin' ? 'Administrator' : 'User';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

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
            toast.error('Failed to save quote.');
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
    // Clients view has company logo and nav.
    // Let's use the same clean header for Dashboard as for Clients view.
    if (view === 'clients' || view === 'client-detail' || view === 'dashboard' || view === 'quotes' || view === 'rate-card' || view === 'settings' || view === 'opportunities' || view === 'opportunity-detail' || view === 'projects' || view === 'project-detail' || view === 'tasks' || view === 'sop' || view === 'knowledge' || view === 'kit' || view === 'contacts') {
        const activeTab = view === 'opportunity-detail' ? 'opportunities' : view === 'client-detail' ? 'clients' : view === 'project-detail' ? 'projects' : view;

        return (
            <>
                <SkipLink />
                <header className="min-h-[60px] bg-dark-bg/95 backdrop-blur-md border-b border-dark-border flex items-center justify-between px-3 sm:px-6 z-20 sticky top-0">
                    {/* Logo - Hidden on mobile, shown on larger screens */}
                    <div className="hidden sm:flex items-center gap-4">
                        <button
                            onClick={onGoToDashboard}
                            className="flex items-center hover:opacity-80 transition-all duration-200 min-h-[44px]"
                            title="Go to Dashboard"
                        >
                            <Logo className="h-8" />
                        </button>
                    </div>

                    {/* Central Navigation - Takes full width on mobile */}
                    <div className="flex-1 flex justify-center sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
                        <Navigation
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                                if (tab === 'dashboard') onGoToDashboard();
                                if (tab === 'quotes') onGoToQuotes();
                                if (tab === 'clients') onGoToClients();
                                if (tab === 'opportunities') onGoToOpportunities();
                                if (tab === 'projects') onGoToProjects();
                                if (tab === 'tasks') onGoToTasks();
                                if (tab === 'sop') onGoToSOP();
                                if (tab === 'knowledge') onGoToKnowledge();
                                if (tab === 'kit') onGoToKit();
                                if (tab === 'rate-card') onGoToRateCard();
                                if (tab === 'contacts') onGoToContacts();
                                if (tab === 'settings') onGoToSettings();
                            }}
                        />
                    </div>

                    {/* Right Side - Subscription Badge, Currency, Theme Toggle, FS Button & User Menu */}
                    <div className="flex items-center gap-2 sm:gap-3 relative">
                        {/* Subscription Status Badge */}
                        <SubscriptionBadge onUpgrade={onGoToSettings} />

                        {/* Currency Selector */}
                        <CurrencySelector />

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Full Screen Analytics Button - Icon only on mobile */}
                        <button
                            onClick={onGoToFS}
                            className="min-w-[44px] min-h-[44px] px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-primary/20 to-purple-600/20 border border-brand-primary/30 text-brand-primary text-xs font-bold hover:from-brand-primary/30 hover:to-purple-600/30 hover:border-brand-primary/50 transition-all flex items-center justify-center gap-1.5"
                            title="Full Screen Analytics"
                            aria-label="Full Screen Analytics"
                        >
                            <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="hidden sm:inline">FS</span>
                        </button>

                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
                            title={userName}
                        >
                            {userInitials}
                        </button>

                        {/* User Dropdown Menu */}
                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1f2e] border border-dark-border rounded-lg shadow-2xl z-50 dropdown-menu overflow-hidden">
                                    <div className="px-4 py-3 border-b border-dark-border">
                                        <p className="text-sm font-medium text-gray-200 truncate">{userName}</p>
                                        <p className="text-xs text-gray-500">{userRole}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            onGoToSettings();
                                        }}
                                        className="w-full px-4 py-2.5 min-h-[44px] text-left text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </button>
                                    <div className="border-t border-dark-border"></div>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            logout();
                                        }}
                                        className="w-full px-4 py-2.5 min-h-[44px] text-left text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>
            </>
        );
    }

    // Editor view header
    return (
        <>
            <SkipLink />
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
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Logo className="h-5 sm:h-6 hidden xs:block" />
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
                            {/* Currency Selector */}
                            <CurrencySelector />

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Status Label */}
                            <div className={`px-2 sm:px-3 py-1 min-h-[32px] rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border flex items-center ${quote.status === 'won' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                quote.status === 'sent' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    quote.status === 'dead' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                                        'bg-gray-700/50 text-gray-400 border-gray-600'
                                }`}>
                                {quote.status || 'Draft'}
                            </div>

                            {/* Refresh Rates - Hidden on mobile */}
                            <button
                                onClick={refreshRates}
                                disabled={ratesLoading}
                                className="btn-icon hidden sm:flex"
                                title="Refresh exchange rates"
                                aria-label="Refresh exchange rates"
                            >
                                <svg className={`w-4 h-4 ${ratesLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            {/* Save as Template */}
                            <button
                                onClick={() => setShowTemplateModal(true)}
                                className="btn-icon"
                                title="Save as template"
                                aria-label="Save as template"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                                aria-label="Save quote to library"
                            >
                                {saveSuccess ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                )}
                                <span className="hidden sm:inline">{saveSuccess ? 'Saved!' : 'Save'}</span>
                            </button>
                        </div>
                    </div>
                </div>

            </header>

            {/* Save as Template Modal */}
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
