# ProductionOS - Comprehensive App Breakdown

> **Production URL:** https://productionos.io
> **Last Updated:** December 30, 2025

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [All Routes/Pages](#2-all-routespages)
3. [All Features](#3-all-features)
4. [All Components](#4-all-components)
5. [All API Endpoints (Edge Functions)](#5-all-api-endpoints-edge-functions)
6. [Database Schema](#6-database-schema)
7. [Authentication Flow](#7-authentication-flow)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Environment Variables](#9-environment-variables)
10. [Current State/Completeness](#10-current-statecompleteness)

---

## 1. Architecture Overview

### Framework/Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| State Management | Zustand | 5.0.9 |
| Styling | Tailwind CSS | 3.4.19 |
| Routing | React Router DOM | 7.11.0 |
| Backend | Supabase (PostgreSQL + Edge Functions) | 2.87.1 |
| PDF Generation | @react-pdf/renderer | 4.3.1 |
| Charts | Recharts | 3.5.1 |
| Animations | Framer Motion | 12.23.26 |
| Drag & Drop | @dnd-kit | 6.3.1 |
| Payments | Stripe | 8.6.0 |
| Error Tracking | Sentry | 10.32.1 |

### File Structure Pattern

```
/quote
├── src/
│   ├── App.jsx              # Main app with routing logic
│   ├── main.jsx             # Entry point
│   ├── components/          # Reusable UI components
│   │   ├── auth/            # Authentication components
│   │   ├── billing/         # Subscription/payment components
│   │   ├── common/          # Shared utilities (Modal, Toast, etc.)
│   │   ├── crm/             # CRM-specific components
│   │   ├── editor/          # Quote editor components
│   │   ├── invoiceDesigner/ # Invoice template designer
│   │   ├── layout/          # Navigation, Sidebar, Header
│   │   ├── mockups/         # Marketing demo components
│   │   ├── onboarding/      # Onboarding wizard
│   │   ├── pdf/             # PDF generation components
│   │   ├── preview/         # Quote preview components
│   │   ├── settings/        # Settings panels
│   │   ├── tasks/           # Task board components
│   │   ├── timeline/        # Activity timeline
│   │   └── ui/              # UI primitives
│   ├── data/                # Static data structures
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # External service configs
│   ├── pages/               # Page components
│   ├── services/            # Business logic services
│   ├── store/               # Zustand stores
│   ├── types/               # Type definitions
│   └── utils/               # Utility functions
├── supabase/
│   ├── functions/           # Edge Functions
│   └── migrations/          # Database migrations
├── public/                  # Static assets
└── dist/                    # Build output
```

### State Management Approach

**Zustand with `subscribeWithSelector` middleware**

| Store | Purpose |
|-------|---------|
| `authStore.js` | Authentication state, login/logout |
| `quoteStore.js` | Current quote being edited, auto-save |
| `clientStore.js` | Clients list, saved quotes library |
| `opportunityStore.js` | Sales pipeline/opportunities |
| `rateCardStore.js` | Rate card items with regional pricing |
| `settingsStore.js` | Company settings, users, T&Cs |
| `projectStore.js` | Project management |
| `crewStore.js` | Crew member database |
| `callSheetStore.js` | Call sheet management |
| `invoiceStore.js` | Invoice records |
| `emailStore.js` | Email integration |
| `organizationStore.js` | Multi-tenant organization |
| `taskBoardStore.js` | Kanban task boards |
| `kitStore.js` | Equipment inventory |
| `knowledgeStore.js` | Knowledge base/research |
| `sopStore.js` | Standard Operating Procedures |

### Styling System

- **Tailwind CSS** with custom configuration
- **Dark theme by default** (`bg-dark-bg`, `dark-card`)
- **Brand colors:** Violet (#8B5CF6) to Pink (#EC4899) gradient
- **PWA Support** with Workbox service worker
- **Responsive design** with mobile-first approach

### Database/Backend

- **Supabase PostgreSQL** with Row Level Security (RLS)
- **Multi-tenancy** via `organization_id` on all tables
- **Edge Functions** for server-side logic (Stripe, AI, OAuth)
- **Real-time** capabilities available

---

## 2. All Routes/Pages

### Public Routes (Unauthenticated)

| Path | File | Description | Layout |
|------|------|-------------|--------|
| `/` | `Home.jsx` | Landing page | Marketing |
| `/pricing` | `Pricing.jsx` | Pricing plans | Marketing |
| `/features/:featureId` | `FeaturePage.jsx` | Individual feature pages | Marketing |
| `/use-cases/:useCaseId` | `UseCasePage.jsx` | Use case pages | Marketing |
| `/compare/:competitorId` | `ComparePage.jsx` | Competitor comparison | Marketing |
| `/auth/login` | `LoginPage.jsx` | Login form | Auth |
| `/auth/signup` | `LoginPage.jsx` | Signup form | Auth |
| `/auth/google-callback` | `GoogleOAuthCallback.jsx` | OAuth callback | None |
| `/reset-password` | `ResetPasswordPage.jsx` | Password reset | Auth |
| `/legal/terms` | `TermsPage.jsx` | Terms of service | Legal |
| `/legal/privacy` | `PrivacyPage.jsx` | Privacy policy | Legal |
| `/legal/gdpr` | `GDPRPage.jsx` | GDPR compliance | Legal |
| `/resources/blog` | `BlogPage.jsx` | Blog listing | Marketing |
| `/resources/blog/:slug` | `BlogPostPage.jsx` | Blog post | Marketing |
| `/help` | `HelpCenterPage.jsx` | Help center | Marketing |
| `/help/category/:categoryId` | `HelpCategoryPage.jsx` | Help category | Marketing |
| `/help/:slug` | `HelpArticlePage.jsx` | Help article | Marketing |
| `/company/about` | `AboutPage.jsx` | About page | Marketing |
| `/company/contact` | `ContactPage.jsx` | Contact form | Marketing |
| `*` | `NotFoundPage.jsx` | 404 page | Minimal |

### Protected Routes (Authenticated) - State-based Navigation

| View State | File | Description | Auth Required |
|------------|------|-------------|---------------|
| `dashboard` | `DashboardPage.jsx` | Main dashboard | Yes |
| `clients` | `ClientsPage.jsx` | Client list | Yes |
| `client-detail` | `ClientDetailPage.jsx` | Client detail | Yes |
| `opportunities` | `OpportunitiesPage.jsx` | Sales pipeline | Yes |
| `opportunity-detail` | `OpportunityDetailPage.jsx` | Opportunity detail | Yes |
| `quotes` | `QuotesPage.jsx` | Saved quotes | Yes |
| `editor` | Built-in App.jsx | Quote editor | Yes |
| `rate-card` | `RateCardPage.jsx` | Rate card manager | Yes |
| `projects` | `ProjectsPage.jsx` | Project list | Yes |
| `project-detail` | `ProjectDetailPage.jsx` | Project detail | Yes |
| `crew` | `CrewPage.jsx` | Crew database | Yes |
| `crew-detail` | `CrewDetailPage.jsx` | Crew member detail | Yes |
| `call-sheets` | `CallSheetPage.jsx` | Call sheets list | Yes |
| `call-sheet-detail` | `CallSheetDetailPage.jsx` | Call sheet editor | Yes |
| `invoices` | `InvoicesPage.jsx` | Invoice list | Yes |
| `expenses` | `ExpensesPage.jsx` | Expense tracking | Yes |
| `pl` | `ProfitLossPage.jsx` | P&L reports | Yes |
| `purchase-orders` | `PurchaseOrdersPage.jsx` | PO management | Yes |
| `contracts` | `ContractsPage.jsx` | Contract management | Yes |
| `email` | `EmailPage.jsx` | Email inbox | Yes |
| `email-templates` | `EmailTemplatesPage.jsx` | Email templates | Yes |
| `sequences` | `EmailSequencesPage.jsx` | Email automation | Yes |
| `workflows` | `WorkflowsPage.jsx` | Workflow automation | Yes |
| `calendar` | `CalendarPage.jsx` | Calendar view | Yes |
| `task-board` | `TaskBoardPage.jsx` | Kanban boards | Yes |
| `tasks` | `CommercialTasksPage.jsx` | AI-generated tasks | Yes |
| `sop` | `SOPPage.jsx` | SOPs | Yes |
| `knowledge` | `KnowledgePage.jsx` | Knowledge base | Yes |
| `kit` | `KitListPage.jsx` | Equipment list | Yes |
| `kit-bookings` | `KitBookingPage.jsx` | Equipment bookings | Yes |
| `contacts` | `ContactsPage.jsx` | Contact CRM | Yes |
| `resources` | `ResourcesPage.jsx` | Resource management | Yes |
| `settings` | `SettingsPage.jsx` | App settings | Yes |
| `admin` | `AdminPage.jsx` | Admin panel | Yes (Admin) |
| `fs` | `FSPage.jsx` | Fullscreen mode | Yes |

---

## 3. All Features

### 3.1 Quote Builder

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Section Editor | `editor/Section.jsx` | Form/List | Add/edit/delete sections, reorder items | Local state | `quotes.sections` (JSONB) |
| Subsection Manager | `editor/Subsection.jsx` | Form/List | Add/edit line items | Local state | `quotes.sections` |
| Line Item Editor | `editor/LineItem.jsx` | Form | Edit qty, days, cost, charge | Local state | `quotes.sections` |
| Fees Editor | `editor/FeesEditor.jsx` | Form | Set management/commission/discount fees | Local state | `quotes` |
| Client Details | `editor/ClientDetails.jsx` | Form | Select/enter client info | Local state | `quotes`, `clients` |
| Project Details | `editor/ProjectDetails.jsx` | Form | Enter project name, dates, region | Local state | `quotes` |
| Title Page Editor | `editor/TitlePageEditor.jsx` | Form | Edit proposal cover page | Local state | `quotes` |
| Proposal Editor | `editor/ProposalEditor.jsx` | Rich Text | Edit proposal narrative | Local state | `quotes` |
| Live Preview | `preview/LivePreview.jsx` | Display | Real-time quote preview | - | - |
| Quote Summary | `preview/QuoteSummary.jsx` | Display | View totals, margins | - | - |
| Template Picker | `templates/TemplatePickerModal.jsx` | Modal | Select quote template | Local state | `quote_templates` |
| Save as Template | `templates/SaveAsTemplateModal.jsx` | Modal | Save current quote as template | Supabase | `quote_templates` |

### 3.2 CRM / Sales Pipeline

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Pipeline Kanban | `crm/PipelineKanban.jsx` | Kanban | Drag opportunities between stages | Supabase | `opportunities` |
| Opportunity List | `OpportunitiesPage.jsx` | Table | Filter, sort, search opportunities | Supabase | `opportunities` |
| Opportunity Detail | `OpportunityDetailPage.jsx` | Form | Edit opportunity, add activities | Supabase | `opportunities`, `activities` |
| Activity Timeline | `crm/ActivityTimeline.jsx` | Timeline | Log calls, emails, meetings | Supabase | `activities` |
| Log Activity Modal | `crm/LogActivityModal.jsx` | Modal | Quick activity entry | Supabase | `activities` |
| Contact List | `crm/ContactList.jsx` | Table | View/manage contacts | Supabase | `contacts` |
| Contact Form | `crm/ContactForm.jsx` | Form | Add/edit contact | Supabase | `contacts` |
| Lead Scoring | `crm/LeadScoreBadge.jsx` | Badge | View lead score | Supabase | `opportunities` |
| Document Upload | `crm/DocumentUploader.jsx` | Upload | Attach files to opportunities | Supabase Storage | `documents` |
| Workflow Editor | `crm/WorkflowEditor.jsx` | Flow | Create automation workflows | Supabase | `workflows` |

### 3.3 Client Management

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Client List | `ClientsPage.jsx` | Table | Search, filter, paginate | Supabase | `clients` |
| Client Detail | `ClientDetailPage.jsx` | Dashboard | View client info, history | Supabase | `clients`, `quotes` |
| Multi-Contact | `ClientsPage.jsx` | List | Manage multiple contacts per client | Supabase | `clients.contacts` (JSONB) |
| CSV Import | `common/CSVImportModal.jsx` | Modal | Bulk import clients | `dataImportService` | `clients` |
| Client Quotes | `ClientDetailPage.jsx` | Table | View all quotes for client | Supabase | `quotes` |

### 3.4 Project Management

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Project List | `ProjectsPage.jsx` | Table | View all projects | Supabase | `projects` |
| Project Detail | `ProjectDetailPage.jsx` | Dashboard | Manage project details | Supabase | `projects` |
| Project Timeline | `projects/ProjectTimelineView.jsx` | Gantt | View timeline | Local state | `projects` |
| Convert Quote | `QuotesPage.jsx` | Action | Convert quote to project | Supabase | `quotes`, `projects` |
| Deliverables | `ProjectDetailPage.jsx` | List | Track deliverables | Supabase | `deliverables` |

### 3.5 Crew Management

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Crew Directory | `CrewPage.jsx` | Table | Search, filter crew | Supabase | `crew` |
| Crew Profile | `CrewDetailPage.jsx` | Profile | View/edit crew details | Supabase | `crew` |
| Crew Booking | `crew/CrewBookingCalendar.jsx` | Calendar | Book crew for shoots | Supabase | `crew_bookings` |
| Rate Card Link | `CrewPage.jsx` | Display | View crew day rates | Supabase | `crew`, `rate_cards` |

### 3.6 Call Sheets

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Call Sheet List | `CallSheetPage.jsx` | Table | View all call sheets | Supabase | `call_sheets` |
| Call Sheet Editor | `CallSheetDetailPage.jsx` | Form | Full call sheet editing | Supabase | `call_sheets` |
| Crew Assignments | `CallSheetDetailPage.jsx` | List | Assign crew to shoot | Supabase | `call_sheet_crew` |
| Cast Management | `CallSheetDetailPage.jsx` | List | Add cast with call times | Supabase | `call_sheet_cast` |
| Department Calls | `CallSheetDetailPage.jsx` | List | Set department call times | Supabase | `call_sheet_department_calls` |
| Call Sheet PDF | `pdf/CallSheetPDF.jsx` | PDF | Export to PDF | - | - |
| Weather Info | `CallSheetDetailPage.jsx` | Display | Show weather forecast | External API | - |
| Hospital/Safety | `CallSheetDetailPage.jsx` | Form | Emergency info | Supabase | `call_sheets` |

### 3.7 Equipment (Kit) Management

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Kit Inventory | `KitListPage.jsx` | Table | Manage equipment | Supabase | `kit` |
| Kit Booking | `KitBookingPage.jsx` | Calendar | Book equipment | Supabase | `kit_bookings` |
| Kit Images | `KitListPage.jsx` | Upload | Add equipment photos | Supabase Storage | `kit` |
| Availability Check | `KitBookingPage.jsx` | Calendar | Check availability | Supabase | `kit_bookings` |

### 3.8 Financial Tools

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Invoice List | `InvoicesPage.jsx` | Table | View/manage invoices | Supabase | `invoices` |
| Invoice Designer | `invoiceDesigner/InvoiceDesigner.jsx` | Designer | Drag-drop template builder | Local state | `invoice_templates` |
| Invoice PDF | `pdf/InvoicePDF.jsx` | PDF | Generate invoice PDF | - | - |
| Expense Tracking | `ExpensesPage.jsx` | Table | Log expenses | Supabase | `expenses` |
| P&L Reports | `ProfitLossPage.jsx` | Report | View profit/loss by project | Supabase | Multiple |
| Purchase Orders | `PurchaseOrdersPage.jsx` | Table | Manage POs | Supabase | `purchase_orders` |
| Contracts | `ContractsPage.jsx` | Table | Manage contracts | Supabase | `contracts` |

### 3.9 Email & Communications

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Email Inbox | `EmailPage.jsx` | List | View synced emails | Edge: `gmail-sync`, `microsoft-sync` | `emails` |
| Send Email | `EmailPage.jsx` | Compose | Send emails | Edge: `gmail-send`, `microsoft-send` | `emails` |
| Email Templates | `EmailTemplatesPage.jsx` | List | Create/manage templates | Supabase | `email_templates` |
| Email Sequences | `EmailSequencesPage.jsx` | Builder | Automated email campaigns | Edge: `process-email-sequences` | `email_sequences` |
| Email Generator | `preview/EmailGenerator.jsx` | AI | Generate email from quote | Edge: `generate-commercial-tasks` | - |
| Email Tracking | - | Tracking | Open/click tracking | Edge: `email-tracking-pixel/click` | `email_sequence_sends` |
| Unsubscribe | - | Link | Handle unsubscribes | Edge: `unsubscribe-email` | `email_unsubscribes` |

### 3.10 Calendar & Scheduling

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Calendar View | `CalendarPage.jsx` | Calendar | View events, bookings | Edge: `calendar-sync` | `calendar_events` |
| Google Sync | `CalendarPage.jsx` | Sync | Two-way Google Calendar | Edge: `google-oauth`, `calendar-sync` | `calendar_events` |
| Booking View | `CalendarPage.jsx` | Calendar | View crew/kit bookings | Supabase | `crew_bookings`, `kit_bookings` |

### 3.11 Task Management

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Task Board | `TaskBoardPage.jsx` | Kanban | Drag-drop tasks | Supabase | `task_boards` |
| Task Detail | `tasks/TaskDetailModal.jsx` | Modal | Edit task, add comments | Supabase | `task_boards` |
| Smart Tasks | `CommercialTasksPage.jsx` | AI | AI-generated tasks | Edge: `generate-commercial-tasks` | - |
| Checklists | `tasks/taskDetail/ChecklistSection.jsx` | List | Add subtasks | Supabase | `task_boards` |

### 3.12 Knowledge & SOPs

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Knowledge Base | `KnowledgePage.jsx` | Wiki | Store research/notes | Supabase | `knowledge_fragments` |
| SOP Manager | `SOPPage.jsx` | List | Create/manage SOPs | Edge: `generate-sop` | `sops` |
| AI Generation | `SOPPage.jsx` | AI | Generate SOPs with AI | Edge: `generate-sop` | `sops` |

### 3.13 PDF Generation

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Quote PDF | `pdf/QuotePDF.jsx` | PDF | Export quote | - | - |
| Proposal PDF | `pdf/ProposalPDF.jsx` | PDF | Export proposal with cover | - | - |
| Clean PDF | `pdf/CleanPDF.jsx` | PDF | Simplified quote format | - | - |
| Invoice PDF | `pdf/InvoicePDF.jsx` | PDF | Export invoice | - | - |
| Call Sheet PDF | `pdf/CallSheetPDF.jsx` | PDF | Export call sheet | - | - |
| Watermark | `pdf/PDFWatermark.jsx` | Overlay | Draft watermark | - | - |

### 3.14 Settings & Configuration

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Company Settings | `SettingsPage.jsx` | Form | Company info, branding | Supabase | `settings`, `organizations` |
| User Profile | `SettingsPage.jsx` | Form | Edit profile | Supabase | `user_profiles` |
| Team Management | `settings/TeamManagement.jsx` | List | Invite/manage team | Edge: `send-invitation-email` | `organization_members` |
| Billing | `settings/BillingSettings.jsx` | Panel | Subscription management | Edge: `create-portal-session` | `subscriptions` |
| AI Settings | `settings/AIUsageDashboard.jsx` | Dashboard | View AI usage | Supabase | `ai_usage_logs` |
| Privacy | `settings/PrivacySettings.jsx` | Form | GDPR controls | `gdprService` | - |
| Rate Card Config | `RateCardPage.jsx` | Form | Configure pricing | Supabase | `rate_cards` |
| Regions/Currency | `SettingsPage.jsx` | Config | Configure regions | Supabase | `settings` |

### 3.15 Onboarding & Trial

| Feature | Location | Type | User Interactions | API Endpoints | Database Tables |
|---------|----------|------|-------------------|---------------|-----------------|
| Onboarding Wizard | `onboarding/OnboardingWizard.jsx` | Wizard | Initial setup | Edge: `onboard-organization` | `organizations` |
| Trial Banner | `onboarding/TrialBanner.jsx` | Banner | Trial countdown | `trialService` | `subscriptions` |
| Onboarding Checklist | `onboarding/OnboardingChecklist.jsx` | Checklist | Progress tracking | `onboardingService` | `settings` |

---

## 4. All Components

### 4.1 Layout Components (`/src/components/layout/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `Layout.jsx` | Main layout wrapper | children | App.jsx |
| `Sidebar.jsx` | Navigation sidebar | activeTab, onTabChange, collapsed | App.jsx |
| `Header.jsx` | Top header bar | - | Layout |
| `Navbar.jsx` | Marketing navbar | - | Public pages |
| `Footer.jsx` | Marketing footer | - | Public pages |
| `EditorHeader.jsx` | Quote editor header | onGoToDashboard | Editor view |
| `EditorPanel.jsx` | Quote editor main area | onGoToSettings | Editor view |
| `PreviewPanel.jsx` | Quote preview sidebar | - | Editor view |
| `Navigation.jsx` | Mobile navigation | - | Mobile layout |

### 4.2 Common Components (`/src/components/common/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `Modal.jsx` | Modal dialog | isOpen, onClose, title, children | Throughout |
| `Toast.jsx` | Toast notifications | message, type, onClose | Throughout |
| `LoadingSpinner.jsx` | Loading indicator | text | Throughout |
| `ErrorBoundary.jsx` | Error boundary | children | App.jsx |
| `Skeleton.jsx` | Loading skeleton | - | List pages |
| `EmptyState.jsx` | Empty state display | icon, title, description | List pages |
| `CSVImportModal.jsx` | CSV import wizard | isOpen, onClose, onImport, type | Clients, Crew |
| `CookieConsent.jsx` | Cookie banner | - | App.jsx |
| `LowTokenBanner.jsx` | AI token warning | - | Dashboard |

### 4.3 Editor Components (`/src/components/editor/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `Section.jsx` | Quote section | section, onUpdate | EditorPanel |
| `Subsection.jsx` | Section subsection | subsection, onUpdate | Section |
| `LineItem.jsx` | Individual line item | item, onUpdate, onDelete | Subsection |
| `FeesEditor.jsx` | Fees configuration | - | EditorPanel |
| `ClientDetails.jsx` | Client info form | - | EditorPanel |
| `ProjectDetails.jsx` | Project info form | - | EditorPanel |
| `TitlePageEditor.jsx` | Title page config | - | EditorPanel |
| `ProposalEditor.jsx` | Proposal narrative | - | EditorPanel |

### 4.4 CRM Components (`/src/components/crm/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `PipelineKanban.jsx` | Kanban board | opportunities, onDragEnd | OpportunitiesPage |
| `ActivityTimeline.jsx` | Activity feed | entityId, entityType | OpportunityDetail |
| `LogActivityModal.jsx` | Activity logger | isOpen, onClose, entityId | Throughout |
| `ContactList.jsx` | Contact list | contacts, onEdit | ClientDetail |
| `ContactForm.jsx` | Contact form | contact, onSave | ContactsPage |
| `ContactCard.jsx` | Contact card | contact | ContactList |
| `DocumentList.jsx` | Document list | documents | OpportunityDetail |
| `DocumentUploader.jsx` | File upload | onUpload | OpportunityDetail |
| `WorkflowEditor.jsx` | Workflow builder | workflow, onSave | WorkflowsPage |
| `LeadScoreBadge.jsx` | Lead score display | score | OpportunitiesPage |

### 4.5 PDF Components (`/src/components/pdf/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `QuotePDF.jsx` | Quote document | quote, settings | PreviewPanel |
| `ProposalPDF.jsx` | Proposal document | quote, settings | PreviewPanel |
| `CleanPDF.jsx` | Simple quote | quote | PreviewPanel |
| `InvoicePDF.jsx` | Invoice document | invoice, template | InvoicesPage |
| `CallSheetPDF.jsx` | Call sheet document | callSheet | CallSheetDetail |
| `TermsPage.jsx` | T&Cs page | settings | PDF exports |
| `PDFWatermark.jsx` | Draft watermark | - | PDF components |

### 4.6 Billing Components (`/src/components/billing/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `StripeProvider.jsx` | Stripe context | children | App.jsx |
| `SubscriptionBadge.jsx` | Plan badge | plan | Sidebar, Settings |
| `UpgradePrompt.jsx` | Upgrade modal | isOpen, onClose | Throughout |
| `FeatureGate.jsx` | Feature restriction | feature, children | Throughout |
| `PaymentMethodForm.jsx` | Card form | onSuccess | Settings |

### 4.7 Onboarding Components (`/src/components/onboarding/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `OnboardingWizard.jsx` | Setup wizard | userId, onComplete | App.jsx |
| `OnboardingChecklist.jsx` | Progress tracker | - | Dashboard |
| `TrialBanner.jsx` | Trial countdown | hoursRemaining | Layout |
| `ContextualTooltip.jsx` | Help tooltip | - | Throughout |

### 4.8 UI Components (`/src/components/ui/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `CommandPalette.jsx` | Cmd+K palette | onNavigate, onAction | App.jsx |
| `VirtualizedList.jsx` | Virtual scroll | items, renderItem | Large lists |
| `AdvancedFilters.jsx` | Filter panel | filters, onChange | List pages |
| `AuroraBackground.jsx` | Animated BG | - | Marketing |
| `BentoGrid.jsx` | Feature grid | items | Landing |
| `FeatureTabs.jsx` | Tabbed features | tabs | Landing |
| `FeatureShowcase.jsx` | Feature display | features | Landing |
| `ROICalculator.jsx` | ROI calculator | - | Pricing |
| `TokenPacks.jsx` | Token display | - | Pricing |
| `Animations.jsx` | Animation utils | - | Throughout |

### 4.9 Settings Components (`/src/components/settings/`)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| `TeamManagement.jsx` | Team panel | - | SettingsPage |
| `BillingSettings.jsx` | Billing panel | - | SettingsPage |
| `AIUsageDashboard.jsx` | AI usage stats | - | SettingsPage |
| `PrivacySettings.jsx` | Privacy controls | - | SettingsPage |

---

## 5. All API Endpoints (Edge Functions)

### Authentication & OAuth

| Function | Method | Path | Purpose | Auth Required |
|----------|--------|------|---------|---------------|
| `google-oauth` | GET | `/google-oauth` | Initiate Google OAuth | No |
| `google-oauth-callback` | GET | `/google-oauth-callback` | Handle Google OAuth callback | No |
| `microsoft-oauth-callback` | GET | `/microsoft-oauth-callback` | Handle Microsoft OAuth callback | No |
| `create-user` | POST | `/create-user` | Create new user | Service role |
| `delete-user` | POST | `/delete-user` | Delete user | Service role |

### Billing & Subscriptions

| Function | Method | Path | Purpose | Request Body | Response |
|----------|--------|------|---------|--------------|----------|
| `create-checkout-session` | POST | `/create-checkout-session` | Create Stripe checkout | `{ priceId, organizationId }` | `{ url }` |
| `create-trial-checkout` | POST | `/create-trial-checkout` | Start trial checkout | `{ organizationId }` | `{ url }` |
| `create-portal-session` | POST | `/create-portal-session` | Stripe billing portal | `{ organizationId }` | `{ url }` |
| `create-setup-intent` | POST | `/create-setup-intent` | Setup payment method | `{ organizationId }` | `{ clientSecret }` |
| `cancel-subscription` | POST | `/cancel-subscription` | Cancel subscription | `{ subscriptionId }` | `{ success }` |
| `reactivate-subscription` | POST | `/reactivate-subscription` | Reactivate subscription | `{ subscriptionId }` | `{ success }` |
| `stripe-webhook` | POST | `/stripe-webhook` | Handle Stripe webhooks | Stripe event | - |

### Email Integration

| Function | Method | Path | Purpose | Request Body | Response |
|----------|--------|------|---------|--------------|----------|
| `gmail-sync` | POST | `/gmail-sync` | Sync Gmail messages | `{ userId }` | `{ synced }` |
| `gmail-send` | POST | `/gmail-send` | Send via Gmail | `{ to, subject, body }` | `{ messageId }` |
| `microsoft-sync` | POST | `/microsoft-sync` | Sync Outlook | `{ userId }` | `{ synced }` |
| `microsoft-send` | POST | `/microsoft-send` | Send via Outlook | `{ to, subject, body }` | `{ messageId }` |
| `send-invitation-email` | POST | `/send-invitation-email` | Send team invite | `{ email, orgName }` | `{ success }` |
| `send-trial-reminder` | POST | `/send-trial-reminder` | Trial reminder | `{ userId }` | `{ success }` |
| `process-email-sequences` | POST | `/process-email-sequences` | Process sequences | - | `{ processed }` |
| `email-tracking-pixel` | GET | `/email-tracking-pixel` | Track opens | Query: sendId | 1x1 PNG |
| `email-tracking-click` | GET | `/email-tracking-click` | Track clicks | Query: sendId, url | Redirect |
| `unsubscribe-email` | GET | `/unsubscribe-email` | Handle unsubscribe | Query: email | HTML |

### AI Features

| Function | Method | Path | Purpose | Request Body | Response |
|----------|--------|------|---------|--------------|----------|
| `generate-commercial-tasks` | POST | `/generate-commercial-tasks` | AI task generation | `{ context, opportunityId }` | `{ tasks }` |
| `generate-sop` | POST | `/generate-sop` | AI SOP generation | `{ title, context }` | `{ content }` |

### Other

| Function | Method | Path | Purpose | Request Body | Response |
|----------|--------|------|---------|--------------|----------|
| `onboard-organization` | POST | `/onboard-organization` | Setup new org | `{ userId, name, settings }` | `{ organization }` |
| `calendar-sync` | POST | `/calendar-sync` | Sync calendar events | `{ userId }` | `{ synced }` |
| `health-check` | GET | `/health-check` | Health check | - | `{ status: "ok" }` |

---

## 6. Database Schema

### Core Tables

| Table | Description | Key Fields | Relationships |
|-------|-------------|------------|---------------|
| `organizations` | Multi-tenant organizations | id, name, settings, created_at | Has many: members, all data |
| `organization_members` | Org membership | user_id, organization_id, role | Belongs to: organizations, users |
| `user_profiles` | Extended user data | id, full_name, avatar_url | Extends: auth.users |
| `quotes` | Quote documents | id, sections (JSONB), client_id, currency, region | Belongs to: clients, organizations |
| `clients` | Client records | id, company, contacts (JSONB), region | Has many: quotes, opportunities |
| `opportunities` | Sales pipeline | id, title, client_id, value, status, stage | Belongs to: clients |
| `projects` | Project records | id, name, quote_id, status, budget | Linked to: quotes |

### Rate Cards & Templates

| Table | Description | Key Fields | RLS |
|-------|-------------|------------|-----|
| `rate_cards` | Rate card items | id, name, category, pricing (JSONB by region) | By org |
| `rate_card_sections` | Rate card categories | id, name, order | By org |
| `quote_templates` | Reusable templates | id, name, sections (JSONB), fees | By org |
| `invoice_templates` | Invoice templates | id, name, modules (JSONB), styles | By org |

### Production Management

| Table | Description | Key Fields | Relationships |
|-------|-------------|------------|---------------|
| `crew` | Crew database | id, name, role, day_rate, email | Has many: bookings |
| `crew_bookings` | Crew assignments | id, crew_id, project_id, dates | Belongs to: crew, projects |
| `call_sheets` | Call sheets | id, project_id, shoot_date, schedule (JSONB) | Belongs to: projects |
| `call_sheet_crew` | Crew on call sheets | id, call_sheet_id, crew_id, call_time | Belongs to: call_sheets |
| `call_sheet_cast` | Cast on call sheets | id, call_sheet_id, name, character_name | Belongs to: call_sheets |
| `call_sheet_department_calls` | Dept call times | id, call_sheet_id, department, call_time | Belongs to: call_sheets |
| `kit` | Equipment inventory | id, name, category, image_url | Has many: bookings |
| `kit_bookings` | Equipment bookings | id, kit_id, project_id, dates | Belongs to: kit, projects |

### Financial

| Table | Description | Key Fields |
|-------|-------------|------------|
| `invoices` | Invoice records | id, quote_id, client_id, amount, status, due_date |
| `expenses` | Expense records | id, project_id, amount, category, receipt_url |
| `purchase_orders` | PO records | id, vendor, amount, status |
| `contracts` | Contract records | id, client_id, value, signed_at |
| `subscriptions` | Stripe subscriptions | id, org_id, stripe_subscription_id, status, plan |

### Communication

| Table | Description | Key Fields |
|-------|-------------|------------|
| `emails` | Synced emails | id, thread_id, subject, from, to, body |
| `email_templates` | Email templates | id, name, subject, body, variables |
| `email_sequences` | Automation sequences | id, name, steps (JSONB), trigger |
| `email_sequence_sends` | Sequence tracking | id, sequence_id, contact_id, step, status |
| `email_unsubscribes` | Unsubscribe list | email, source, unsubscribed_at |

### Tasks & Knowledge

| Table | Description | Key Fields |
|-------|-------------|------------|
| `task_boards` | Kanban boards | id, name, columns (JSONB), cards (JSONB) |
| `sops` | Standard procedures | id, title, content, category |
| `knowledge_fragments` | Knowledge entries | id, title, content, tags, is_public |
| `ai_usage_logs` | AI token tracking | id, org_id, feature, tokens_used, model |

### Activities & Audit

| Table | Description | Key Fields |
|-------|-------------|------------|
| `activities` | Activity log | id, entity_id, entity_type, action, user_id, details |
| `settings` | App settings | id, org_id, settings (JSONB) |
| `workflows` | Automation rules | id, name, trigger, actions (JSONB) |

### RLS Policies

All tables have Row Level Security enabled with:
- Organization-based isolation via `organization_id`
- User can only access their organization's data
- Service role bypass for edge functions
- Public content flags for shared knowledge

---

## 7. Authentication Flow

### Auth Provider
**Supabase Auth** with PKCE flow (most secure OAuth pattern)

### Login Methods

| Method | Implementation | Flow |
|--------|---------------|------|
| Email/Password | Supabase Auth | Email verification required |
| Google OAuth | Supabase + Edge Function | PKCE → callback → session |
| Microsoft OAuth | Supabase + Edge Function | PKCE → callback → session |

### Session Handling

- **Storage:** Encrypted localStorage (migrated from plaintext)
- **Duration:** 24 hours with auto-refresh on activity
- **Refresh:** Automatic token refresh via Supabase client

### Security Measures

| Feature | Implementation |
|---------|----------------|
| Rate Limiting | 5 failed attempts → 15-minute lockout |
| Password Requirements | 8+ chars, uppercase, lowercase, number, special char |
| PKCE Flow | Proof Key for Code Exchange for OAuth |
| Session Encryption | Client-side encryption for session data |
| Email Verification | Required for password auth users |

### Protected Routes

```javascript
// All /dashboard/* routes require:
1. isAuthenticated === true
2. Email verified (for password auth)
3. Organization exists (or show onboarding)
4. Active subscription (or show subscription expired page)
```

---

## 8. Third-Party Integrations

### Payment Processing

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Stripe** | Subscription billing | Stripe.js, @stripe/react-stripe-js |
| | Products | Individual ($24/mo), Team ($49/mo), Token Packs |
| | Features | Checkout, Customer Portal, Webhooks, Invoicing |
| | PPP | 5-tier regional pricing (Tier 1-5) |

### Email Providers

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Gmail** | Email sync/send | OAuth + Gmail API via Edge Functions |
| **Microsoft 365** | Email sync/send | OAuth + Graph API via Edge Functions |
| **Resend** | Transactional email | Edge Functions (invites, notifications) |

### AI Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Anthropic Claude** | AI generation | Edge Functions (commercial tasks, SOPs) |
| | Model | Claude Sonnet 4 |
| | Features | Task generation, SOP creation, email drafts |

### Analytics & Monitoring

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Sentry** | Error tracking | @sentry/react, client-side |
| **Vercel Analytics** | Web analytics | Vercel deployment |

### Other

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Supabase Storage** | File storage | Kit images, documents |
| **Google Fonts** | Typography | Inter, JetBrains Mono |
| **Exchange Rate API** | Currency conversion | Live rates for quotes |

---

## 9. Environment Variables

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |

### OAuth Configuration

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID |

### Optional Variables

| Variable | Purpose |
|----------|---------|
| `VITE_APP_PASSWORD` | Legacy password auth (bypasses Supabase Auth) |
| `VITE_ANTHROPIC_API_KEY` | Direct AI calls (dev only) |
| `VITE_STRIPE_TEST_MODE` | Force Stripe test mode |

### Edge Function Secrets (Supabase)

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `RESEND_API_KEY` | Resend email API |
| `ANTHROPIC_API_KEY` | Claude API key |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth secret |

---

## 10. Current State/Completeness

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Quote Builder | ✅ Complete | Full section/subsection editing |
| PDF Export | ✅ Complete | Quote, Proposal, Invoice, Call Sheet |
| Client Management | ✅ Complete | Multi-contact, CSV import |
| Rate Cards | ✅ Complete | Regional pricing, categories |
| Template System | ✅ Complete | Save/load quote templates |
| Multi-currency | ✅ Complete | Live exchange rates |
| Dark/Light Theme | ✅ Complete | System preference support |

### CRM & Sales

| Feature | Status | Notes |
|---------|--------|-------|
| Opportunity Pipeline | ✅ Complete | Kanban + list views |
| Activity Tracking | ✅ Complete | Timeline, logging |
| Lead Scoring | ✅ Complete | Automatic scoring |
| Contact Management | ✅ Complete | Individual contacts |
| Document Attachments | ✅ Complete | Supabase Storage |

### Production

| Feature | Status | Notes |
|---------|--------|-------|
| Project Management | ✅ Complete | Convert from quotes |
| Crew Database | ✅ Complete | Profiles, rates |
| Crew Booking | ✅ Complete | Calendar view |
| Call Sheets | ✅ Complete | Full editor, PDF |
| Equipment (Kit) | ✅ Complete | Inventory, booking |

### Financial

| Feature | Status | Notes |
|---------|--------|-------|
| Invoices | ✅ Complete | Generate from quotes |
| Invoice Designer | ✅ Complete | Drag-drop template |
| Expenses | ✅ Complete | Tracking, categories |
| P&L Reports | ✅ Complete | By project |
| Purchase Orders | ✅ Complete | Basic CRUD |
| Contracts | ✅ Complete | Basic CRUD |

### Email & Communication

| Feature | Status | Notes |
|---------|--------|-------|
| Gmail Integration | ✅ Complete | Sync + send |
| Microsoft Integration | ✅ Complete | Sync + send |
| Email Templates | ✅ Complete | Variables, preview |
| Email Sequences | ✅ Complete | Automation |
| Email Tracking | ✅ Complete | Opens, clicks |

### Calendar

| Feature | Status | Notes |
|---------|--------|-------|
| Calendar View | ✅ Complete | Events, bookings |
| Google Calendar Sync | ✅ Complete | Two-way sync |

### AI Features

| Feature | Status | Notes |
|---------|--------|-------|
| Commercial Tasks | ✅ Complete | AI-generated tasks |
| SOP Generation | ✅ Complete | AI-generated SOPs |
| Email Drafts | ✅ Complete | AI email generation |
| Token Tracking | ✅ Complete | Usage monitoring |

### Billing & Subscriptions

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe Checkout | ✅ Complete | Monthly/annual |
| Trial Management | ✅ Complete | 48-hour trial |
| Subscription Guard | ✅ Complete | Access levels |
| Customer Portal | ✅ Complete | Self-service |
| PPP Pricing | ✅ Complete | 5-tier regional |
| Token Packs | ✅ Complete | AI credits |

### Security & Compliance

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenancy | ✅ Complete | Organization isolation |
| Row Level Security | ✅ Complete | All tables |
| GDPR Compliance | ✅ Complete | Export, deletion |
| Cookie Consent | ✅ Complete | Banner, preferences |
| Session Encryption | ✅ Complete | Encrypted storage |

### Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| PWA Support | ✅ Complete | Offline capable |
| Code Splitting | ✅ Complete | Lazy loading |
| Error Tracking | ✅ Complete | Sentry integration |
| E2E Tests | 🚧 Partial | Playwright setup |
| Mobile Responsive | ✅ Complete | Mobile-first |

### Known Limitations

| Area | Limitation |
|------|------------|
| Offline Mode | Read-only; sync queue for writes |
| Real-time | Not fully implemented |
| Mobile App | PWA only, no native apps |
| Integrations | No Xero/QuickBooks yet |
| Reports | Limited to P&L |

---

## Summary

ProductionOS is a comprehensive multi-tenant SaaS platform for production companies with:

- **50+ pages/views** covering all production workflows
- **100+ components** for a rich UI
- **25+ Edge Functions** for server-side logic
- **30+ database tables** with full RLS
- **Full Stripe integration** with PPP pricing
- **Gmail + Microsoft email** integration
- **AI-powered** task and SOP generation
- **PWA support** for offline access

The application is production-ready with complete core features and active development on advanced features.
