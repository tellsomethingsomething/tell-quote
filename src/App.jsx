import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Sidebar from './components/layout/Sidebar';
import EditorHeader from './components/layout/EditorHeader';
import EditorPanel from './components/layout/EditorPanel';
import LoginPage from './pages/LoginPage';

// Lazy load PreviewPanel to avoid loading 1.5MB PDF library on initial page load
const PreviewPanel = lazy(() => import('./components/layout/PreviewPanel'));
import LoadingSpinner from './components/common/LoadingSpinner';
import CookieConsent from './components/common/CookieConsent';
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
import { useKnowledgeStore } from './store/knowledgeStore';
import { useKitStore } from './store/kitStore';
import { useSopStore } from './store/sopStore';
import { useProjectStore } from './store/projectStore';
import { useCrewStore } from './store/crewStore';
import { useKitBookingStore } from './store/kitBookingStore';
import { useCallSheetStore } from './store/callSheetStore';
import { useInvoiceStore } from './store/invoiceStore';
import { useExpenseStore } from './store/expenseStore';
import { useCrewBookingStore } from './store/crewBookingStore';
import { usePurchaseOrderStore } from './store/purchaseOrderStore';
import { useContractStore } from './store/contractStore';
import { useEmailStore } from './store/emailStore';
import { useOrganizationStore } from './store/organizationStore';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import SubscriptionExpiredPage from './pages/SubscriptionExpiredPage';
import { checkSubscriptionAccess, ACCESS_LEVELS } from './services/subscriptionGuard';
import { SubscriptionProvider } from './hooks/useSubscription';

// Initialize auth store to set up OAuth listeners (must run once on app load)
useAuthStore.getState().initialize();

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
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));
const KitListPage = lazy(() => import('./pages/KitListPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const CrewPage = lazy(() => import('./pages/CrewPage'));
const CrewDetailPage = lazy(() => import('./pages/CrewDetailPage'));
const KitBookingPage = lazy(() => import('./pages/KitBookingPage'));
const CallSheetPage = lazy(() => import('./pages/CallSheetPage'));
const CallSheetDetailPage = lazy(() => import('./pages/CallSheetDetailPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const ProfitLossPage = lazy(() => import('./pages/ProfitLossPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/PurchaseOrdersPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const EmailPage = lazy(() => import('./pages/EmailPage'));
const EmailTemplatesPage = lazy(() => import('./pages/EmailTemplatesPage'));
const WorkflowsPage = lazy(() => import('./pages/WorkflowsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const EmailSequencesPage = lazy(() => import('./pages/EmailSequencesPage'));
const TaskBoardPage = lazy(() => import('./pages/TaskBoardPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Home = lazy(() => import('./pages/Home'));
const Pricing = lazy(() => import('./pages/Pricing'));
const FeaturePage = lazy(() => import('./pages/FeaturePage'));
const UseCasePage = lazy(() => import('./pages/UseCasePage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const GoogleOAuthCallback = lazy(() => import('./pages/GoogleOAuthCallback'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const GDPRPage = lazy(() => import('./pages/legal/GDPRPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const BlogPage = lazy(() => import('./pages/resources/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/resources/BlogPostPage'));
const HelpCenterPage = lazy(() => import('./pages/resources/HelpCenterPage'));
const HelpArticlePage = lazy(() => import('./pages/resources/HelpArticlePage'));
const HelpCategoryPage = lazy(() => import('./pages/resources/HelpCategoryPage'));
const AboutPage = lazy(() => import('./pages/company/AboutPage'));
const ContactPage = lazy(() => import('./pages/company/ContactPage'));

// Views: 'clients' | 'client-detail' | 'opportunities' | 'opportunity-detail' | 'editor' | 'rate-card' | 'dashboard' | 'settings' | 'contacts'
function App() {
  const { isAuthenticated, user, needsOnboarding, setNeedsOnboarding } = useAuthStore();
  const { organization, loading: isOrgLoading, initialize: initializeOrganization } = useOrganizationStore();
  const initializeQuote = useQuoteStore(state => state.initialize);
  const initializeClients = useClientStore(state => state.initialize);
  const initializeRateCard = useRateCardStore(state => state.initialize);
  const initializeSettings = useSettingsStore(state => state.initialize);
  const initializeOpportunities = useOpportunityStore(state => state.initialize);
  const initializeActivities = useActivityStore(state => state.initialize);
  const initializeTemplates = useQuoteTemplateStore(state => state.initialize);
  const initializeDealContext = useDealContextStore(state => state.initialize);
  const initializeKnowledge = useKnowledgeStore(state => state.initialize);
  const initializeKit = useKitStore(state => state.initialize);
  const initializeSops = useSopStore(state => state.initialize);
  const initializeProjects = useProjectStore(state => state.initialize);
  const initializeCrew = useCrewStore(state => state.initialize);
  const initializeKitBookings = useKitBookingStore(state => state.initialize);
  const initializeCallSheets = useCallSheetStore(state => state.initialize);
  const initializeInvoices = useInvoiceStore(state => state.initialize);
  const initializeExpenses = useExpenseStore(state => state.initialize);
  const initializeCrewBookings = useCrewBookingStore(state => state.initialize);
  const initializePurchaseOrders = usePurchaseOrderStore(state => state.initialize);
  const initializeContracts = useContractStore(state => state.initialize);
  const initializeEmails = useEmailStore(state => state.initialize);
  const resetQuote = useQuoteStore(state => state.resetQuote);
  const loadQuoteData = useQuoteStore(state => state.loadQuoteData);

  // State for tracking onboarding completion
  const [showOnboarding, setShowOnboarding] = useState(false);

  // State for subscription access
  const [subscriptionAccess, setSubscriptionAccess] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const [view, setView] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedCrewId, setSelectedCrewId] = useState(null);
  const [selectedCallSheetId, setSelectedCallSheetId] = useState(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pendingNewQuoteClientId, setPendingNewQuoteClientId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  }, []);

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

  const handleGoToEmail = useCallback(() => {
    confirmNavigateAway(() => setView('email'));
  }, [confirmNavigateAway]);

  const handleGoToCalendar = useCallback(() => {
    confirmNavigateAway(() => setView('calendar'));
  }, [confirmNavigateAway]);

  const handleGoToSequences = useCallback(() => {
    confirmNavigateAway(() => setView('sequences'));
  }, [confirmNavigateAway]);

  const handleGoToWorkflows = useCallback(() => {
    confirmNavigateAway(() => setView('workflows'));
  }, [confirmNavigateAway]);

  const handleGoToSOP = useCallback(() => {
    confirmNavigateAway(() => setView('sop'));
  }, [confirmNavigateAway]);

  const handleGoToKnowledge = useCallback(() => {
    confirmNavigateAway(() => setView('knowledge'));
  }, [confirmNavigateAway]);

  const handleGoToKit = useCallback(() => {
    confirmNavigateAway(() => setView('kit'));
  }, [confirmNavigateAway]);

  const handleGoToKitBookings = useCallback(() => {
    confirmNavigateAway(() => setView('kit-bookings'));
  }, [confirmNavigateAway]);

  const handleGoToContacts = useCallback(() => {
    confirmNavigateAway(() => setView('contacts'));
  }, [confirmNavigateAway]);

  const handleGoToProjects = useCallback(() => {
    confirmNavigateAway(() => setView('projects'));
  }, [confirmNavigateAway]);

  const handleSelectProject = useCallback((projectId) => {
    setSelectedProjectId(projectId);
    setView('project-detail');
  }, []);

  const handleGoToCrew = useCallback(() => {
    confirmNavigateAway(() => setView('crew'));
  }, [confirmNavigateAway]);

  const handleSelectCrew = useCallback((crewId) => {
    setSelectedCrewId(crewId);
    setView('crew-detail');
  }, []);

  const handleGoToCallSheets = useCallback(() => {
    confirmNavigateAway(() => setView('call-sheets'));
  }, [confirmNavigateAway]);

  const handleSelectCallSheet = useCallback((callSheetId) => {
    setSelectedCallSheetId(callSheetId);
    setView('call-sheet-detail');
  }, []);

  const handleGoToInvoices = useCallback(() => {
    confirmNavigateAway(() => setView('invoices'));
  }, [confirmNavigateAway]);

  const handleGoToExpenses = useCallback(() => {
    confirmNavigateAway(() => setView('expenses'));
  }, [confirmNavigateAway]);

  const handleGoToPL = useCallback(() => {
    confirmNavigateAway(() => setView('pl'));
  }, [confirmNavigateAway]);

  const handleGoToPurchaseOrders = useCallback(() => {
    confirmNavigateAway(() => setView('purchase-orders'));
  }, [confirmNavigateAway]);

  const handleGoToContracts = useCallback(() => {
    confirmNavigateAway(() => setView('contracts'));
  }, [confirmNavigateAway]);

  const handleGoToResources = useCallback(() => {
    confirmNavigateAway(() => setView('resources'));
  }, [confirmNavigateAway]);

  const handleConvertQuoteToProject = useCallback((projectId) => {
    setSelectedProjectId(projectId);
    setView('project-detail');
  }, []);

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

  // Apply theme on initialization
  const settings = useSettingsStore(state => state.settings);
  useEffect(() => {
    const theme = settings.theme || 'dark';
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [settings.theme]);

  // Initialize organization when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      initializeOrganization(user.userId).then(() => {
        // After org init, check if user needs onboarding
        const org = useOrganizationStore.getState().organization;
        if (!org) {
          setShowOnboarding(true);
        }
      });
    }
  }, [isAuthenticated, user?.userId, initializeOrganization]);

  // Check subscription access after organization is loaded
  // PERFORMANCE: Don't block UI - assume valid until proven otherwise
  useEffect(() => {
    if (isAuthenticated && organization?.id && !showOnboarding) {
      // Check localStorage for cached subscription status to avoid blocking
      const cachedAccess = localStorage.getItem(`sub_access_${organization.id}`);
      if (cachedAccess) {
        try {
          const parsed = JSON.parse(cachedAccess);
          // If cache is less than 5 minutes old and was valid, assume still valid
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000 && parsed.access !== ACCESS_LEVELS.BLOCKED) {
            setSubscriptionAccess(parsed);
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Always check in background for accuracy
      checkSubscriptionAccess(organization.id)
        .then((result) => {
          setSubscriptionAccess(result);
          setCheckingSubscription(false);
          // Cache the result
          localStorage.setItem(`sub_access_${organization.id}`, JSON.stringify({
            ...result,
            timestamp: Date.now(),
          }));
        })
        .catch((err) => {
          console.error('Failed to check subscription:', err);
          // Fail open - allow access on error
          setSubscriptionAccess({ access: ACCESS_LEVELS.FULL });
          setCheckingSubscription(false);
        });
    }
  }, [isAuthenticated, organization?.id, showOnboarding]);

  // Handler to retry subscription check
  const handleRetrySubscriptionCheck = useCallback(() => {
    if (organization?.id) {
      setCheckingSubscription(true);
      checkSubscriptionAccess(organization.id)
        .then((result) => {
          setSubscriptionAccess(result);
          setCheckingSubscription(false);
        })
        .catch(() => {
          setSubscriptionAccess({ access: ACCESS_LEVELS.FULL });
          setCheckingSubscription(false);
        });
    }
  }, [organization?.id]);

  // PERFORMANCE: Only load essential stores on startup
  // Other stores are lazy-loaded when user navigates to their pages
  useEffect(() => {
    if (isAuthenticated && organization) {
      // Essential stores - load immediately (settings affects UI rendering)
      initializeSettings();

      // Primary data - load in background after short delay
      const primaryTimeout = setTimeout(() => {
        Promise.all([
          initializeClients(),
          initializeOpportunities(),
          initializeActivities(),
        ]).catch(err => console.error('Primary stores init failed:', err));
      }, 100);

      // Secondary data - load after UI is interactive
      const secondaryTimeout = setTimeout(() => {
        Promise.all([
          initializeQuote(),
          initializeRateCard(),
          initializeTemplates(),
          initializeProjects(),
        ]).catch(err => console.error('Secondary stores init failed:', err));
      }, 500);

      // Tertiary data - load when user might need it
      const tertiaryTimeout = setTimeout(() => {
        Promise.all([
          initializeDealContext(),
          initializeCrew(),
          initializeInvoices(),
          initializeExpenses(),
        ]).catch(err => console.error('Tertiary stores init failed:', err));
      }, 1500);

      // Low priority - load last
      const lowPriorityTimeout = setTimeout(() => {
        Promise.all([
          initializeKnowledge(),
          initializeKit(),
          initializeSops(),
          initializeKitBookings(),
          initializeCallSheets(),
          initializeCrewBookings(),
          initializePurchaseOrders(),
          initializeContracts(),
          initializeEmails(),
        ]).catch(err => console.error('Low priority stores init failed:', err));
      }, 3000);

      return () => {
        clearTimeout(primaryTimeout);
        clearTimeout(secondaryTimeout);
        clearTimeout(tertiaryTimeout);
        clearTimeout(lowPriorityTimeout);
      };
    }
  }, [isAuthenticated, organization, initializeQuote, initializeClients, initializeRateCard, initializeSettings, initializeOpportunities, initializeActivities, initializeTemplates, initializeDealContext, initializeKnowledge, initializeKit, initializeSops, initializeProjects, initializeCrew, initializeKitBookings, initializeCallSheets, initializeInvoices, initializeExpenses, initializeCrewBookings, initializePurchaseOrders, initializeContracts, initializeEmails]);

  // Show marketing site if not authenticated
  if (!isAuthenticated) {
    return (
      <HelmetProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Feature Pages */}
            <Route path="/features" element={<Navigate to="/" replace />} />
            <Route path="/features/:featureId" element={<FeaturePage />} />

            {/* Use Case Pages */}
            <Route path="/use-cases/:useCaseId" element={<UseCasePage />} />

            {/* Comparison Pages */}
            <Route path="/compare/:competitorId" element={<ComparePage />} />

            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<LoginPage initialMode="signup" />} />
            <Route path="/auth/google-callback" element={<GoogleOAuthCallback />} />
            <Route path="/reset-password" element={<ResetPasswordPage onComplete={() => window.location.href = '/auth/login'} />} />

            {/* Legal Pages */}
            <Route path="/legal/terms" element={<TermsPage />} />
            <Route path="/legal/privacy" element={<PrivacyPage />} />
            <Route path="/legal/gdpr" element={<GDPRPage />} />

            {/* Resources Pages */}
            <Route path="/resources/blog" element={<BlogPage />} />
            <Route path="/resources/blog/:slug" element={<BlogPostPage />} />

            {/* Help Center */}
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/help/category/:categoryId" element={<HelpCategoryPage />} />
            <Route path="/help/:slug" element={<HelpArticlePage />} />

            {/* Company Pages */}
            <Route path="/company/about" element={<AboutPage />} />
            <Route path="/company/contact" element={<ContactPage />} />

            {/* Catch all redirect to Home for marketing site */}
            <Route path="*" element={<Home />} />
          </Routes>
          <CookieConsent />
        </Suspense>
      </HelmetProvider>
    );
  }

  // Show loading while checking organization
  if (isOrgLoading) {
    return <LoadingSpinner text="Setting up your workspace..." />;
  }

  // Show onboarding wizard for new users without an organization
  if (showOnboarding || needsOnboarding || (!organization && !isOrgLoading)) {
    const handleOnboardingComplete = (newOrg) => {
      setShowOnboarding(false);
      setNeedsOnboarding(false);
      // Reset subscription access so it gets rechecked
      setSubscriptionAccess(null);
      // The organization store will be updated by the wizard
    };

    return (
      <OnboardingWizard
        userId={user?.userId}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Only block if subscription check returned BLOCKED (not while checking)
  // This allows the app to render immediately while checking in background

  // Show subscription expired page if access is blocked
  if (subscriptionAccess?.access === ACCESS_LEVELS.BLOCKED) {
    return (
      <SubscriptionExpiredPage
        type={subscriptionAccess.trialExpired ? 'trial_expired' : 'expired'}
        message={subscriptionAccess.message}
        hoursRemaining={subscriptionAccess.hoursRemaining}
        subscription={subscriptionAccess.subscription}
        onRetry={handleRetrySubscriptionCheck}
      />
    );
  }

  // Show subscription expired page for grace period with warning
  if (subscriptionAccess?.access === ACCESS_LEVELS.GRACE) {
    return (
      <SubscriptionExpiredPage
        type="grace"
        message={subscriptionAccess.message}
        hoursRemaining={subscriptionAccess.hoursRemaining}
        subscription={subscriptionAccess.subscription}
        onRetry={handleRetrySubscriptionCheck}
      />
    );
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
                onGoToKnowledge={handleGoToKnowledge}
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
      case 'knowledge':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Knowledge Base..." />}>
            <main id="main-content" tabIndex="-1">
              <KnowledgePage />
            </main>
          </Suspense>
        );
      case 'kit':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Kit List..." />}>
            <main id="main-content" tabIndex="-1">
              <KitListPage />
            </main>
          </Suspense>
        );
      case 'kit-bookings':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Kit Bookings..." />}>
            <main id="main-content" tabIndex="-1">
              <KitBookingPage />
            </main>
          </Suspense>
        );
      case 'contacts':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Contacts..." />}>
            <main id="main-content" tabIndex="-1">
              <ContactsPage />
            </main>
          </Suspense>
        );
      case 'projects':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Projects..." />}>
            <main id="main-content" tabIndex="-1">
              <ProjectsPage onSelectProject={handleSelectProject} />
            </main>
          </Suspense>
        );
      case 'project-detail':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Project..." />}>
            <main id="main-content" tabIndex="-1">
              <ProjectDetailPage
                projectId={selectedProjectId}
                onBack={handleGoToProjects}
                onEditQuote={handleEditQuote}
              />
            </main>
          </Suspense>
        );
      case 'crew':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Crew..." />}>
            <main id="main-content" tabIndex="-1">
              <CrewPage onSelectCrew={handleSelectCrew} />
            </main>
          </Suspense>
        );
      case 'crew-detail':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Crew Member..." />}>
            <main id="main-content" tabIndex="-1">
              <CrewDetailPage
                crewId={selectedCrewId}
                onBack={handleGoToCrew}
              />
            </main>
          </Suspense>
        );
      case 'call-sheets':
      case 'analytics':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Analytics..." />}>
            <main id="main-content" tabIndex="-1">
              <CallSheetPage onSelectCallSheet={handleSelectCallSheet} />
            </main>
          </Suspense>
        );
      case 'call-sheet-detail':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Call Sheet..." />}>
            <main id="main-content" tabIndex="-1">
              <CallSheetDetailPage
                callSheetId={selectedCallSheetId}
                onBack={handleGoToCallSheets}
              />
            </main>
          </Suspense>
        );
      case 'invoices':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Invoices..." />}>
            <main id="main-content" tabIndex="-1">
              <InvoicesPage />
            </main>
          </Suspense>
        );
      case 'expenses':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Expenses..." />}>
            <main id="main-content" tabIndex="-1">
              <ExpensesPage />
            </main>
          </Suspense>
        );
      case 'pl':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading P&L..." />}>
            <main id="main-content" tabIndex="-1">
              <ProfitLossPage onSelectProject={handleSelectProject} />
            </main>
          </Suspense>
        );
      case 'purchase-orders':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Purchase Orders..." />}>
            <main id="main-content" tabIndex="-1">
              <PurchaseOrdersPage />
            </main>
          </Suspense>
        );
      case 'contracts':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Contracts..." />}>
            <main id="main-content" tabIndex="-1">
              <ContractsPage />
            </main>
          </Suspense>
        );
      case 'email':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Email..." />}>
            <main id="main-content" tabIndex="-1" className="h-screen">
              <EmailPage />
            </main>
          </Suspense>
        );
      case 'email-templates':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Templates..." />}>
            <main id="main-content" tabIndex="-1" className="h-screen">
              <EmailTemplatesPage />
            </main>
          </Suspense>
        );
      case 'workflows':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Workflows..." />}>
            <main id="main-content" tabIndex="-1" className="h-screen overflow-y-auto">
              <WorkflowsPage />
            </main>
          </Suspense>
        );
      case 'calendar':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Calendar..." />}>
            <main id="main-content" tabIndex="-1" className="h-screen overflow-y-auto">
              <CalendarPage />
            </main>
          </Suspense>
        );
      case 'sequences':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Sequences..." />}>
            <main id="main-content" tabIndex="-1" className="h-screen overflow-y-auto">
              <EmailSequencesPage />
            </main>
          </Suspense>
        );
      case 'task-board':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Task Board..." />}>
            <main id="main-content" tabIndex="-1" className="h-screen overflow-hidden">
              <TaskBoardPage />
            </main>
          </Suspense>
        );
      case 'resources':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading Resources..." />}>
            <main id="main-content" tabIndex="-1">
              <ResourcesPage />
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
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><LoadingSpinner text="Loading preview..." /></div>}>
                <PreviewPanel />
              </Suspense>
            </div>
          </main>
        );
    }
  };

  // Determine active tab for sidebar
  const activeTab = view === 'opportunity-detail' ? 'opportunities'
    : view === 'client-detail' ? 'clients'
      : view === 'project-detail' ? 'projects'
        : view === 'crew-detail' ? 'crew'
          : view === 'call-sheet-detail' ? 'analytics'
            : view === 'call-sheets' ? 'analytics'
              : view;

  // Handle sidebar navigation
  const handleSidebarTabChange = useCallback((tab) => {
    if (tab === 'dashboard') handleGoToDashboard();
    else if (tab === 'quotes') handleGoToQuotes();
    else if (tab === 'clients') handleGoToClients();
    else if (tab === 'opportunities') handleGoToOpportunities();
    else if (tab === 'projects') handleGoToProjects();
    else if (tab === 'tasks') handleGoToTasks();
    else if (tab === 'task-board') confirmNavigateAway(() => setView('task-board'));
    else if (tab === 'email') handleGoToEmail();
    else if (tab === 'calendar') handleGoToCalendar();
    else if (tab === 'sequences') handleGoToSequences();
    else if (tab === 'workflows') handleGoToWorkflows();
    else if (tab === 'sop') handleGoToSOP();
    else if (tab === 'knowledge') handleGoToKnowledge();
    else if (tab === 'kit') handleGoToKit();
    else if (tab === 'kit-bookings') handleGoToKitBookings();
    else if (tab === 'crew') handleGoToCrew();
    else if (tab === 'analytics') handleGoToCallSheets();
    else if (tab === 'invoices') handleGoToInvoices();
    else if (tab === 'expenses') handleGoToExpenses();
    else if (tab === 'pl') handleGoToPL();
    else if (tab === 'purchase-orders') handleGoToPurchaseOrders();
    else if (tab === 'contracts') handleGoToContracts();
    else if (tab === 'resources') handleGoToResources();
    else if (tab === 'rate-card') handleGoToRateCard();
    else if (tab === 'contacts') handleGoToContacts();
    else if (tab === 'settings') handleGoToSettings();
  }, [handleGoToDashboard, handleGoToQuotes, handleGoToClients, handleGoToOpportunities, handleGoToProjects, handleGoToTasks, handleGoToEmail, handleGoToCalendar, handleGoToSequences, handleGoToWorkflows, handleGoToSOP, handleGoToKnowledge, handleGoToKit, handleGoToKitBookings, handleGoToCrew, handleGoToCallSheets, handleGoToInvoices, handleGoToExpenses, handleGoToPL, handleGoToPurchaseOrders, handleGoToContracts, handleGoToResources, handleGoToRateCard, handleGoToContacts, handleGoToSettings]);

  // Editor view has its own header, other views use sidebar
  const isEditorView = view === 'editor';
  const isFullScreenView = view === 'fs';

  // Full screen view (no sidebar)
  if (isFullScreenView) {
    return (
      <div className={`min-h-screen ${settings.theme === 'light' ? 'bg-light-bg' : 'bg-dark-bg'}`}>
        <PWAStatus />
        {renderView()}
      </div>
    );
  }

  return (
    <SubscriptionProvider>
      <div className={`min-h-screen flex ${settings.theme === 'light' ? 'bg-light-bg' : 'bg-dark-bg'}`}>
        <PWAStatus />

        {/* Sidebar - shown on all views except editor and full screen */}
        {!isEditorView && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleSidebarTabChange}
            onGoToFS={handleGoToFS}
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-h-screen overflow-hidden ${!isEditorView && !sidebarCollapsed ? 'lg:ml-0' : ''}`}>
          {/* Editor has its own header */}
          {isEditorView && (
            <EditorHeader
              onGoToDashboard={handleGoToDashboard}
            />
          )}

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            {renderView()}
          </div>
        </div>

        {/* Template Picker Modal */}
        <TemplatePickerModal
          isOpen={showTemplatePicker}
          onClose={handleCloseTemplatePicker}
          onSelectTemplate={handleSelectTemplate}
          onStartBlank={handleStartBlank}
        />
      </div>
    </SubscriptionProvider>
  );
}

export default App;
