# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ProductionOS** is a multi-tenant SaaS platform for production companies. It provides CRM, quoting, project management, and financial tools for managing production workflows.

### SaaS Design Principles

**IMPORTANT**: This is a SaaS product designed for ANY production company, not just Tell Productions. All features must be:

1. **Fully Configurable** - No hardcoded company-specific data (regions, currencies, project types, etc.)
2. **Multi-tenant Ready** - Settings, data, and preferences are user/organization-specific
3. **Self-Service** - Users can customize everything through Settings without code changes
4. **White-Label Ready** - Company branding, colors, and terminology are configurable

### Key Configurable Elements (via Settings)

- **Regions & Countries** - Users define their own geographic markets
- **Currencies** - Support for any currency with configurable defaults per region
- **Project Types** - Customizable workflow categories
- **Rate Cards** - User-defined pricing with regional variations
- **Company Info** - Branding, contact details, tax info, bank details
- **Document Templates** - PDF quotes, invoices, proposals

When building new features, always pull configuration from `settingsStore.js` rather than hardcoding values.

## Commands

```bash
npm run dev      # Start development server (Vite) on localhost:5173
npm run build    # Production build with terser minification
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
npm run deploy   # Build and deploy to GitHub Pages (gh-pages)
```

## Tech Stack

- React 19 with Vite 7
- Zustand for state management
- Tailwind CSS for styling
- @react-pdf/renderer for PDF generation
- @dnd-kit for drag-and-drop (section/item reordering)
- Recharts for dashboard analytics
- Supabase for backend (auth + PostgreSQL)

## Architecture

### State Management (Zustand)

All app state lives in `/src/store/` using Zustand with `subscribeWithSelector` middleware:

- **quoteStore.js** - Current quote being edited, with auto-save to Supabase every 30 seconds
- **clientStore.js** - Clients list and saved quotes library
- **rateCardStore.js** - Rate card items with regional pricing (SEA, EU, ME regions)
- **settingsStore.js** - Company settings, users, T&Cs, AI settings
- **authStore.js** - Authentication (supports Supabase Auth or simple password)
- **invoiceTemplateStore.js** - Custom invoice/PDF template configurations
- **opportunityStore.js** - Sales opportunities/pipeline management

Stores sync to both localStorage (for session persistence) and Supabase (for cloud backup).

### Quote Structure

Quotes have a hierarchical structure defined in `/src/data/sections.js`:
- **Sections** (Production Team, Production Equipment, Creative, Logistics, Expenses) contain **subsections**
- **Subsections** contain **line items** with quantity, days, cost, charge
- Custom subsections can be added dynamically
- Section order and names are customizable per quote

### Key Data Flow

1. Rate card items (`rateCardStore`) provide base pricing by region
2. When adding items to a quote, pricing is copied from rate card for the selected region
3. Fees (management, commission, discount) are applied at quote level
4. PDF export uses `@react-pdf/renderer` (`/src/components/pdf/`)

### Navigation

Navigation is state-based in App.jsx (`view` state), not URL-based:
- Views: `dashboard`, `clients`, `client-detail`, `opportunities`, `opportunity-detail`, `editor`, `rate-card`, `quotes`, `settings`, `fs`
- All pages in `/src/pages/` are lazy-loaded with React.lazy() and Suspense
- `useUnsavedChanges` hook prompts before leaving editor with unsaved work

### PDF Export System

Located in `/src/components/pdf/`:
- **QuotePDF.jsx** - Main quote document
- **ProposalPDF.jsx** - Full proposal with cover page
- **InvoicePDF.jsx** - Invoice generation
- **CleanPDF.jsx** - Simplified quote format

The invoice designer (`/src/components/invoiceDesigner/`) allows customizing PDF templates with drag-and-drop modules.

### Backend (Supabase)

- Schema in `supabase-schema.sql`, RLS policies in `supabase-rls-policies.sql`
- Tables: quotes, clients, rate_cards, rate_card_sections, settings, organizations, user_profiles, subscriptions
- All use JSONB columns for flexible nested data
- Authentication: Supabase Auth with PKCE flow (secure)
- Multi-tenancy via organization_id on all tables

### Edge Functions (`/supabase/functions/`)

- **Billing**: `create-checkout-session`, `create-portal-session`, `stripe-webhook`, `cancel-subscription`, `reactivate-subscription`
- **Email**: `send-invitation-email` (via Resend), `gmail-send`, `gmail-sync`
- **Auth**: `google-oauth`, `google-oauth-callback`, `microsoft-oauth-callback`
- **AI**: `generate-commercial-tasks` (Anthropic API proxy)

### Key Services (`/src/services/`)

- **billingService.js** - Stripe checkout, subscription management, invoice history
- **subscriptionGuard.js** - Access level determination (FULL, WARNING, GRACE, BLOCKED)
- **trialService.js** - 48-hour trial management with read-only mode
- **gdprService.js** - Data export and account deletion with 30-day grace period
- **dataImportService.js** - CSV import for clients, crew, equipment
- **onboardingService.js** - Multi-step onboarding wizard with progress tracking

### Utilities

- `/src/utils/calculations.js` - Quote totals, margins, fees
- `/src/utils/currency.js` - Multi-currency support with live exchange rates
- `/src/utils/encryption.js` - Client-side encryption for sensitive data (API keys)
- `/src/utils/validation.js` - Form validation (password requires 8+ chars, uppercase, lowercase, number, special char)

## Styling

- Tailwind CSS with custom brand colors defined in `tailwind.config.js`
- Dark theme by default (`bg-dark-bg`, `dark-card`, `dark-border`)
- Brand colors: navy (#143642), teal (#0F8B8D), orange (#FE7F2D)
- Section colors defined in `/src/data/sections.js` for visual distinction

## Deployment

- **Production URL**: https://productionos.io
- **Vercel**: Uses base path `/`, deploy with `vercel --prod`
- **GitHub Pages**: Uses base path `/tell-quote/` (set via `GITHUB_ACTIONS` env var in vite.config.js)

Build is optimized with manual chunk splitting for caching (react-vendor, zustand-vendor, pdf-vendor, charts-vendor, supabase-vendor).

## Security

### Authentication
- Supabase Auth with PKCE flow (most secure OAuth pattern)
- 24-hour session duration with auto-refresh on activity
- Rate limiting: 5 failed attempts → 15-minute lockout
- Password requirements: 8+ chars, uppercase, lowercase, number, special character

### Database Security
- Row Level Security (RLS) on all tables
- Multi-tenant isolation via organization_id
- All API keys stored server-side in edge functions

### Compliance
- GDPR: Data export (JSON), account deletion with 30-day grace period
- Privacy: Cookie consent banner with preference management
- Legal pages: `/legal/privacy`, `/legal/gdpr`, `/legal/terms`

## Environment Variables

See `.env.example` for required configuration:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe (set in Supabase Edge Functions secrets)
# STRIPE_SECRET_KEY=sk_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (for emails)
# RESEND_API_KEY=re_...

# Anthropic (for AI features)
# ANTHROPIC_API_KEY=sk-ant-...
```

## Project Notes

- **Domain:** productionos.io purchased for $30.00
- **Google Site Verification:** `google-site-verification=nLujpcTKo26KbNv-M8dEoUpNlUxPIfTplY7j0Kpz0-4` (TXT record)

## Stripe Products & Prices

### Products
| Product | ID |
|---------|-----|
| ProductionOS Individual | `prod_TgOJZ4SQjfFaSH` |
| ProductionOS Team | `prod_TgOJvRtalQa4WF` |
| AI Token Pack - 5,000 | `prod_TgOJC2A4LtwwXx` |
| AI Token Pack - 25,000 | `prod_TgOJMoTRYLdAW8` |
| AI Token Pack - 100,000 | `prod_TgOJx8k1JwniR9` |

### Individual Plan Prices
| Currency | Monthly | Annual |
|----------|---------|--------|
| USD | `price_1Sj1XBLE30d1czmdCbD6Kg9V` ($24) | `price_1Sj1XCLE30d1czmdi2UKwktG` ($228) |
| GBP | `price_1Sj1XDLE30d1czmdWHrCT59f` (£19) | `price_1Sj1XDLE30d1czmdGv9wtuLD` (£180) |
| EUR | `price_1Sj1XELE30d1czmdO2Vz955B` (€22) | `price_1Sj1XFLE30d1czmdwwDRbACg` (€216) |

### Team Plan Prices
| Currency | Monthly | Annual |
|----------|---------|--------|
| USD | `price_1Sj1XYLE30d1czmdzldBwYTB` ($49) | `price_1Sj1XYLE30d1czmdLUNjPxbg` ($468) |
| GBP | `price_1Sj1XZLE30d1czmd2oBHlWtC` (£39) | `price_1Sj1XaLE30d1czmd5DsbtbFN` (£372) |
| EUR | `price_1Sj1XaLE30d1czmdIAxyupGE` (€45) | `price_1Sj1XbLE30d1czmdkSIGXZCQ` (€432) |

### Token Pack Prices (One-time)
| Pack | USD | GBP | EUR |
|------|-----|-----|-----|
| 5K | `price_1Sj1XxLE30d1czmdEEBt5q8O` ($5) | `price_1Sj1XyLE30d1czmdkFf9mcs2` (£4) | `price_1Sj1XzLE30d1czmdbvVUUb1M` (€5) |
| 25K | `price_1Sj1XzLE30d1czmdAvrfublS` ($20) | `price_1Sj1Y0LE30d1czmdoZhyNiq2` (£16) | `price_1Sj1Y1LE30d1czmdHuHTtYZM` (€18) |
| 100K | `price_1Sj1Y1LE30d1czmd79RiK6eB` ($60) | `price_1Sj1Y2LE30d1czmdMwBDZQ0w` (£48) | `price_1Sj1Y3LE30d1czmdqngP2zV7` (€55) |

### Local Currency Prices (Tier 1 - Full Price)
| Currency | Individual Monthly | Individual Annual | Team Monthly | Team Annual |
|----------|-------------------|-------------------|--------------|-------------|
| SGD | `price_1SjcEkLE30d1czmdI3Xdrx1c` (S$32) | `price_1SjcEmLE30d1czmdqhomazme` (S$308) | `price_1SjcEnLE30d1czmdliFd6b1m` (S$66) | `price_1SjcEoLE30d1czmdTNxRXMni` (S$632) |
| AED | `price_1SjcFBLE30d1czmdRnydemDu` (AED88) | `price_1SjcFCLE30d1czmdXjMrs869` (AED845) | `price_1SjcFDLE30d1czmd6g2W04sR` (AED180) | `price_1SjcFELE30d1czmd8K1gzlJf` (AED1728) |
| NZD | `price_1SjcFFLE30d1czmdEMn6lV1T` (NZ$40) | `price_1SjcFGLE30d1czmdFAVH1xim` (NZ$384) | `price_1SjcFHLE30d1czmd8sIAwhck` (NZ$82) | `price_1SjcFILE30d1czmdLRQIqXQo` (NZ$787) |
| HKD | `price_1SjcHBLE30d1czmd7IHGa3Su` (HK$188) | `price_1SjcGlLE30d1czmdf0yezyyE` (HK$1805) | `price_1SjcHDLE30d1czmdhFu33mCm` (HK$384) | `price_1SjcGpLE30d1czmdjsZzNIuC` (HK$3686) |
| ILS | `price_1SjcHELE30d1czmd0a0XcgTo` (₪89) | `price_1SjcHGLE30d1czmd0Kn2zMvy` (₪854) | `price_1SjcHILE30d1czmdCv3mFzl3` (₪182) | `price_1SjcHKLE30d1czmdnWU2mGrW` (₪1747) |
| TWD | `price_1SjcHaLE30d1czmdvwvWTloY` (NT$760) | `price_1SjcHbLE30d1czmdwibrBW1B` (NT$7296) | `price_1SjcHdLE30d1czmdrEJjGfwh` (NT$1550) | `price_1SjcHfLE30d1czmd5icfN54H` (NT$14880) |

## Stripe Test Mode Products & Prices

### Test Products
| Product | ID |
|---------|-----|
| ProductionOS Individual | `prod_TgOxfFUv2amuIK` |
| ProductionOS Team | `prod_TgOxdkKikv5qgx` |
| AI Token Pack - 5,000 | `prod_TgPMQNI85ggTaT` |
| AI Token Pack - 25,000 | `prod_TgPMvoxPkeCxXc` |
| AI Token Pack - 100,000 | `prod_TgPMdCe4rYpaYx` |

### Test Individual Plan Prices
| Currency | Monthly | Annual |
|----------|---------|--------|
| USD | `price_1Sj2Y4LE30d1czmdNFSZ2TOH` ($24) | `price_1Sj2Y5LE30d1czmdTb3GqNrr` ($228) |
| GBP | `price_1Sj2Y6LE30d1czmdZ7U9fbjf` (£19) | `price_1Sj2Y7LE30d1czmd16o5FTvp` (£180) |
| EUR | `price_1Sj2Y8LE30d1czmd97QfUxC0` (€22) | `price_1Sj2Y9LE30d1czmdNn46kL5B` (€216) |

### Test Team Plan Prices
| Currency | Monthly | Annual |
|----------|---------|--------|
| USD | `price_1Sj2YdLE30d1czmdNopdqYTj` ($49) | `price_1Sj2YdLE30d1czmdSzOW3rrY` ($468) |
| GBP | `price_1Sj2YeLE30d1czmdaci4C18S` (£39) | `price_1Sj2YfLE30d1czmdKINVzc7y` (£372) |
| EUR | `price_1Sj2YgLE30d1czmd3XWoxg8g` (€45) | `price_1Sj2YhLE30d1czmdRrlAeRxh` (€432) |

### Test Token Pack Prices (One-time)
| Pack | USD | GBP | EUR |
|------|-----|-----|-----|
| 5K | `price_1Sj2Z7LE30d1czmdb4ulGv3e` ($5) | `price_1Sj2Z8LE30d1czmdstOAIod4` (£4) | `price_1Sj2Z9LE30d1czmd5QSHe1fM` (€5) |
| 25K | `price_1Sj2ZALE30d1czmd7O5yIKye` ($20) | `price_1Sj2ZBLE30d1czmd4tBU4Dz5` (£16) | `price_1Sj2ZCLE30d1czmdckdVSYfI` (€18) |
| 100K | `price_1Sj2ZDLE30d1czmddEVuI7VR` ($60) | `price_1Sj2ZELE30d1czmdCWDVUD6J` (£48) | `price_1Sj2ZFLE30d1czmdkIE1DSvc` (€55) |

### Test Payment Link
- Individual Monthly (USD): https://buy.stripe.com/test_eVq5kE71V4bl30VcIR8k801
