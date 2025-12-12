import { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import EditorPanel from './components/layout/EditorPanel';
import PreviewPanel from './components/layout/PreviewPanel';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import RateCardPage from './pages/RateCardPage';
import DashboardPage from './pages/DashboardPage';
import QuotesPage from './pages/QuotesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { useQuoteStore } from './store/quoteStore';
import { useClientStore } from './store/clientStore';
import { useRateCardStore } from './store/rateCardStore';
import { useSettingsStore } from './store/settingsStore';
import { useAuthStore } from './store/authStore';

// Views: 'clients' | 'client-detail' | 'editor' | 'rate-card' | 'dashboard' | 'settings'
function App() {
  const { isAuthenticated } = useAuthStore();
  const initializeQuote = useQuoteStore(state => state.initialize);
  const initializeClients = useClientStore(state => state.initialize);
  const initializeRateCard = useRateCardStore(state => state.initialize);
  const initializeSettings = useSettingsStore(state => state.initialize);
  const resetQuote = useQuoteStore(state => state.resetQuote);
  const loadQuoteData = useQuoteStore(state => state.loadQuoteData);

  const [view, setView] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initializeQuote();
      initializeClients();
      initializeRateCard();
      initializeSettings();
    }
  }, [isAuthenticated, initializeQuote, initializeClients, initializeRateCard, initializeSettings]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Navigation handlers
  const handleSelectClient = (clientId) => {
    setSelectedClientId(clientId);
    setView('client-detail');
  };

  const handleBackToClients = () => {
    setView('clients');
    setSelectedClientId(null);
  };

  const handleNewQuote = (clientId = null) => {
    resetQuote();
    if (clientId) {
      const client = useClientStore.getState().getClient(clientId);
      if (client) {
        useQuoteStore.getState().setClientDetails({
          company: client.company,
          contact: client.contact,
          email: client.email,
          phone: client.phone,
        });
      }
    }
    setView('editor');
  };

  const handleEditQuote = (quote) => {
    // If quote data is passed, load it into the editor
    if (quote && quote.sections) {
      loadQuoteData(quote);
    }
    setView('editor');
  };

  const handleGoToClients = () => {
    setView('clients');
  };

  const handleGoToRateCard = () => {
    setView('rate-card');
  };

  const handleGoToDashboard = () => {
    setView('dashboard');
  };

  const handleGoToSettings = () => {
    setView('settings');
  };

  const handleGoToQuotes = () => {
    setView('quotes');
  };

  // Render current view
  const renderView = () => {
    switch (view) {
      case 'clients':
        return (
          <ClientsPage
            onSelectClient={handleSelectClient}
          />
        );
      case 'client-detail':
        return (
          <ClientDetailPage
            clientId={selectedClientId}
            onBack={handleBackToClients}
            onEditQuote={handleEditQuote}
            onNewQuote={handleNewQuote}
          />
        );
      case 'rate-card':
        return (
          <RateCardPage onBack={handleBackToClients} />
        );
      case 'dashboard':
        return (
          <DashboardPage
            onViewQuote={handleEditQuote}
            onNewQuote={handleNewQuote}
          />
        );
      case 'quotes':
        return (
          <QuotesPage
            onEditQuote={handleEditQuote}
            onNewQuote={handleNewQuote}
          />
        );
      case 'settings':
        return (
          <SettingsPage onBack={handleBackToClients} />
        );
      case 'editor':
      default:
        return (
          <main className="flex-1 flex flex-col lg:flex-row max-w-[1920px] mx-auto w-full">
            {/* Mobile Preview Toggle Button */}
            <button
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="lg:hidden fixed bottom-4 right-4 z-50 btn-primary rounded-full p-4 shadow-xl"
              aria-label={showMobilePreview ? "Show editor" : "Show preview"}
            >
              {showMobilePreview ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>

            {/* Editor Panel - Hidden on mobile when preview is shown */}
            <div className={`${showMobilePreview ? 'hidden lg:flex' : 'flex'} flex-1`}>
              <EditorPanel onGoToSettings={handleGoToSettings} />
            </div>

            {/* Preview Panel - Hidden on mobile when editor is shown */}
            <div className={`${showMobilePreview ? 'flex' : 'hidden lg:flex'} w-full lg:w-[320px] lg:min-w-[320px]`}>
              <PreviewPanel />
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header
        view={view}
        onGoToClients={handleGoToClients}
        onGoToRateCard={handleGoToRateCard}
        onGoToDashboard={handleGoToDashboard}
        onGoToQuotes={handleGoToQuotes}
        onGoToSettings={handleGoToSettings}
        selectedClientId={selectedClientId}
      />
      {renderView()}
    </div>
  );
}

export default App;
