import { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import EditorPanel from './components/layout/EditorPanel';
import PreviewPanel from './components/layout/PreviewPanel';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import RateCardPage from './pages/RateCardPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { useQuoteStore } from './store/quoteStore';
import { useClientStore } from './store/clientStore';
import { useRateCardStore } from './store/rateCardStore';
import { useSettingsStore } from './store/settingsStore';

// Views: 'clients' | 'client-detail' | 'editor' | 'rate-card' | 'dashboard' | 'settings'
function App() {
  const initializeQuote = useQuoteStore(state => state.initialize);
  const initializeClients = useClientStore(state => state.initialize);
  const initializeRateCard = useRateCardStore(state => state.initialize);
  const initializeSettings = useSettingsStore(state => state.initialize);
  const resetQuote = useQuoteStore(state => state.resetQuote);
  const loadQuoteData = useQuoteStore(state => state.loadQuoteData);

  const [view, setView] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);

  useEffect(() => {
    initializeQuote();
    initializeClients();
    initializeRateCard();
    initializeSettings();
  }, [initializeQuote, initializeClients, initializeRateCard, initializeSettings]);

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
      case 'settings':
        return (
          <SettingsPage onBack={handleBackToClients} />
        );
      case 'editor':
      default:
        return (
          <main className="flex-1 flex flex-row max-w-[1920px] mx-auto w-full">
            <EditorPanel onGoToSettings={handleGoToSettings} />
            <PreviewPanel />
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
        onGoToSettings={handleGoToSettings}
        selectedClientId={selectedClientId}
      />
      {renderView()}
    </div>
  );
}

export default App;
