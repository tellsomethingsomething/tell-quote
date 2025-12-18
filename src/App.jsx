import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import Header from './components/layout/Header';
import EditorPanel from './components/layout/EditorPanel';
import PreviewPanel from './components/layout/PreviewPanel';
import LoginPage from './pages/LoginPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import PWAStatus from './components/pwa/PWAStatus';
import TemplatePickerModal from './components/templates/TemplatePickerModal';
import { useQuoteStore } from './store/quoteStore';
import { useClientStore } from './store/clientStore';
import { useRateCardStore } from './store/rateCardStore';
import { useSettingsStore } from './store/settingsStore';
import { useAuthStore } from './store/authStore';
import { useOpportunityStore } from './store/opportunityStore';
import { useActivityStore } from './store/activityStore';
import { useQuoteTemplateStore } from './store/quoteTemplateStore';
import { useDealContextStore } from './store/dealContextStore';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';

// Lazy load pages for better code splitting
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const OpportunityDetailPage = lazy(() => import('./pages/OpportunityDetailPage'));
const RateCardPage = lazy(() => import('./pages/RateCardPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const QuotesPage = lazy(() => import('./pages/QuotesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FSPage = lazy(() => import('./pages/FSPage'));
const CommercialTasksPage = lazy(() => import('./pages/CommercialTasksPage'));
const SOPPage = lazy(() => import('./pages/SOPPage'));

// Views: 'clients' | 'client-detail' | 'opportunities' | 'opportunity-detail' | 'editor' | 'rate-card' | 'dashboard' | 'settings'
function App() {
  const { isAuthenticated } = useAuthStore();
  const initializeQuote = useQuoteStore(state => state.initialize);
  const initializeClients = useClientStore(state => state.initialize);
  const initializeRateCard = useRateCardStore(state => state.initialize);
  const initializeSettings = useSettingsStore(state => state.initialize);
  const initializeOpportunities = useOpportunityStore(state => state.initialize);
  const initializeActivities = useActivityStore(state => state.initialize);
  const initializeTemplates = useQuoteTemplateStore(state => state.initialize);
  const initializeDealContext = useDealContextStore(state => state.initialize);
  const resetQuote = useQuoteStore(state => state.resetQuote);
  const loadQuoteData = useQuoteStore(state => state.loadQuoteData);

  const [view, setView] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pendingNewQuoteClientId, setPendingNewQuoteClientId] = useState(null);

  // Use custom hook for unsaved changes tracking
  const quote = useQuoteStore(state => state.quote);
  const { confirmNavigateAway, markAsSaved } = useUnsavedChanges(
    view === 'editor',
    quote
  );

  // Memoized navigation handlers to prevent unnecessary re-renders
  // (Must be defined before early return to comply with hooks rules)
  const handleSelectClient = useCallback((clientId) => {
    setSelectedClientId(clientId);
    setView('client-detail');
  }, []);

  const handleNewQuote = useCallback((clientId = null) => {
    // Store the client ID for later use when template is selected or blank is chosen
    setPendingNewQuoteClientId(clientId);
    setShowTemplatePicker(true);
  }, []);

  // Helper function to apply client details to quote
  const applyClientToQuote = useCallback((clientId) => {
    if (clientId) {
      const client = useClientStore.getState().getClient(clientId);
      if (client) {
        // Get primary contact from contacts array, fallback to legacy fields
        const primaryContact = client.contacts?.find(c => c.isPrimary) || client.contacts?.[0];
        useQuoteStore.getState().setClientDetails({
          clientId: client.id,
          company: client.company,
          contactId: primaryContact?.id || null,
          contact: primaryContact?.name || client.contact || '',
          email: primaryContact?.email || client.email || '',
          phone: primaryContact?.phone || client.phone || '',
        });
      }
    }
  }, []);

  // Handle selecting a template
  const handleSelectTemplate = useCallback((template) => {
    resetQuote();

    // Load template data into the quote
    const quoteData = {
      sections: template.sections || {},
      currency: template.currency || 'USD',
      region: template.region || 'SEA',
      managementFee: template.fees?.managementFee || 0,
      commissionFee: template.fees?.commissionFee || 0,
      discountPercent: template.fees?.discountPercent || 0,
      // Apply project defaults if any
      ...(template.projectDefaults || {}),
    };

    loadQuoteData(quoteData);

    // Apply client details if creating quote for a specific client
    applyClientToQuote(pendingNewQuoteClientId);

    // Increment usage count
    useQuoteTemplateStore.getState().incrementUsageCount(template.id);

    setShowTemplatePicker(false);
    setPendingNewQuoteClientId(null);
    setView('editor');
  }, [resetQuote, loadQuoteData, applyClientToQuote, pendingNewQuoteClientId]);

  // Handle starting with blank quote
  const handleStartBlank = useCallback(() => {
    resetQuote();

    // Apply client details if creating quote for a specific client
    applyClientToQuote(pendingNewQuoteClientId);

    setShowTemplatePicker(false);
    setPendingNewQuoteClientId(null);
    setView('editor');
  }, [resetQuote, applyClientToQuote, pendingNewQuoteClientId]);

  // Handle closing template picker without action
  const handleCloseTemplatePicker = useCallback(() => {
    setShowTemplatePicker(false);
    setPendingNewQuoteClientId(null);
  }, []);

  const handleEditQuote = useCallback((quote) => {
    // If quote data is passed, load it into the editor
    if (quote && quote.sections) {
      loadQuoteData(quote);
    }
    setView('editor');
  }, [loadQuoteData]);

  const handleGoToClients = useCallback(() => {
    confirmNavigateAway(() => setView('clients'));
  }, [confirmNavigateAway]);

  const handleGoToRateCard = useCallback(() => {
    confirmNavigateAway(() => setView('rate-card'));
  }, [confirmNavigateAway]);

  const handleGoToDashboard = useCallback(() => {
    confirmNavigateAway(() => setView('dashboard'));
  }, [confirmNavigateAway]);

  const handleGoToSettings = useCallback(() => {
    confirmNavigateAway(() => setView('settings'));
  }, [confirmNavigateAway]);

  const handleGoToQuotes = useCallback(() => {
    confirmNavigateAway(() => setView('quotes'));
  }, [confirmNavigateAway]);

  const handleGoToFS = useCallback(() => {
    confirmNavigateAway(() => setView('fs'));
  }, [confirmNavigateAway]);

  const handleGoToOpportunities = useCallback(() => {
    confirmNavigateAway(() => setView('opportunities'));
  }, [confirmNavigateAway]);

  const handleGoToTasks = useCallback(() => {
    confirmNavigateAway(() => setView('tasks'));
  }, [confirmNavigateAway]);

  const handleGoToSOP = useCallback(() => {
    confirmNavigateAway(() => setView('sop'));
  }, [confirmNavigateAway]);

  const handleSelectOpportunity = useCallback((opportunityId) => {
    setSelectedOpportunityId(opportunityId);
    setView('opportunity-detail');
  }, []);

  const handleConvertOpportunityToQuote = useCallback((opportunityData) => {
    resetQuote();

    // Set client with full details including contact
    if (opportunityData.client) {
      useQuoteStore.getState().setClientDetails({
        clientId: opportunityData.clientId || opportunityData.client.clientId || null,
        company: opportunityData.client.company || '',
        contactId: opportunityData.client.contactId || null,
        contact: opportunityData.client.contact || '',
        email: opportunityData.client.email || '',
        phone: opportunityData.client.phone || '',
        address: opportunityData.client.address || '',
      });
    }

    // Set project details
    if (opportunityData.project) {
      useQuoteStore.getState().setProjectDetails({
        ...opportunityData.project,
        // Add opportunity reference
        opportunityId: opportunityData.opportunityId,
      });
    }

    // Set currency and region from opportunity
    if (opportunityData.currency) {
      useQuoteStore.getState().setCurrency(opportunityData.currency);
    }
    if (opportunityData.region) {
      useQuoteStore.getState().setRegion(opportunityData.region);
    }

    // Set today's date as quote date
    const quoteState = useQuoteStore.getState();
    quoteState.loadQuoteData({
      ...quoteState.quote,
      quoteDate: new Date().toISOString().split('T')[0],
    });

    setView('editor');
  }, [resetQuote]);

  const handleToggleMobilePreview = useCallback(() => {
    setShowMobilePreview(prev => !prev);
  }, []);

  // Mark as saved when entering editor or quote number changes
  useEffect(() => {
    if (view === 'editor' && quote.quoteNumber) {
      markAsSaved();
    }
  }, [view, quote.quoteNumber, markAsSaved]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeQuote();
      initializeClients();
      initializeRateCard();
      initializeSettings();
      initializeOpportunities();
      initializeActivities();
      initializeTemplates();
      initializeDealContext();
    }
  }, [isAuthenticated, initializeQuote, initializeClients, initializeRateCard, initializeSettings, initializeOpportunities, initializeActivities, initializeTemplates, initializeDealContext]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render current view with Suspense boundaries
  const renderView = () => {
    switch (view) {
      case 'clients':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading clients..." />}>
            <main id="main-content" tabIndex="-1">
              <ClientsPage onSelectClient={handleSelectClient} />
            </main>
          </Suspense>
        );
      case 'client-detail':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading client details..." />}>
            <main id="main-content" tabIndex="-1">
              <ClientDetailPage
                clientId={selectedClientId}
                onBackToDashboard={handleGoToDashboard}
                onEditQuote={handleEditQuote}
                onNewQuote={handleNewQuote}
                onSelectOpportunity={handleSelectOpportunity}
              />
            </main>
          </Suspense>
        );
      case 'opportunities':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading opportunities..." />}>
            <main id="main-content" tabIndex="-1">
              <OpportunitiesPage onSelectOpportunity={handleSelectOpportunity} />
            </main>
          </Suspense>
        );
      case 'opportunity-detail':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading opportunity..." />}>
            <main id="main-content" tabIndex="-1">
              <OpportunityDetailPage
                opportunityId={selectedOpportunityId}
                onBack={handleGoToOpportunities}
                onConvertToQuote={handleConvertOpportunityToQuote}
              />
            </main>
          </Suspense>
        );
      case 'rate-card':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading rate card..." />}>
            <main id="main-content" tabIndex="-1">
              <RateCardPage />
            </main>
          </Suspense>
        );
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
            <main id="main-content" tabIndex="-1">
              <DashboardPage
                onViewQuote={handleEditQuote}
                onNewQuote={handleNewQuote}
                onGoToOpportunities={handleGoToOpportunities}
              />
            </main>
          </Suspense>
        );
      case 'quotes':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading quotes..." />}>
            <main id="main-content" tabIndex="-1">
              <QuotesPage
                onEditQuote={handleEditQuote}
                onNewQuote={handleNewQuote}
              />
            </main>
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading settings..." />}>
            <main id="main-content" tabIndex="-1">
              <SettingsPage />
            </main>
          </Suspense>
        );
      case 'tasks':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading tasks..." />}>
            <main id="main-content" tabIndex="-1">
              <CommercialTasksPage />
            </main>
          </Suspense>
        );
      case 'sop':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading SOPs..." />}>
            <main id="main-content" tabIndex="-1">
              <SOPPage />
            </main>
          </Suspense>
        );
      case 'fs':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <main id="main-content" tabIndex="-1">
              <FSPage onExit={handleGoToDashboard} />
            </main>
          </Suspense>
        );
      case 'editor':
      default:
        return (
          <main id="main-content" className="flex-1 flex flex-col lg:flex-row max-w-[1920px] mx-auto w-full" tabIndex="-1">
            {/* Mobile Preview Toggle Button */}
            <button
              onClick={handleToggleMobilePreview}
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
      <PWAStatus />
      <Header
        view={view}
        onGoToClients={handleGoToClients}
        onGoToRateCard={handleGoToRateCard}
        onGoToDashboard={handleGoToDashboard}
        onGoToQuotes={handleGoToQuotes}
        onGoToSettings={handleGoToSettings}
        onGoToFS={handleGoToFS}
        onGoToOpportunities={handleGoToOpportunities}
        onGoToTasks={handleGoToTasks}
        onGoToSOP={handleGoToSOP}
        selectedClientId={selectedClientId}
      />
      {renderView()}

      {/* Template Picker Modal */}
      <TemplatePickerModal
        isOpen={showTemplatePicker}
        onClose={handleCloseTemplatePicker}
        onSelectTemplate={handleSelectTemplate}
        onStartBlank={handleStartBlank}
      />
    </div>
  );
}

export default App;
