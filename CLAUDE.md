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
- Tables: quotes, clients, rate_cards, rate_card_sections, settings
- All use JSONB columns for flexible nested data
- Authentication: Supabase Auth (recommended) or legacy password mode

### Utilities

- `/src/utils/calculations.js` - Quote totals, margins, fees
- `/src/utils/currency.js` - Multi-currency support with live exchange rates
- `/src/utils/encryption.js` - Client-side encryption for sensitive data (API keys)
- `/src/utils/validation.js` - Form validation helpers

## Styling

- Tailwind CSS with custom brand colors defined in `tailwind.config.js`
- Dark theme by default (`bg-dark-bg`, `dark-card`, `dark-border`)
- Brand colors: navy (#143642), teal (#0F8B8D), orange (#FE7F2D)
- Section colors defined in `/src/data/sections.js` for visual distinction

## Deployment

- **Vercel**: Uses base path `/`
- **GitHub Pages**: Uses base path `/tell-quote/` (set via `GITHUB_ACTIONS` env var in vite.config.js)

Build is optimized with manual chunk splitting for caching (react-vendor, zustand-vendor, pdf-vendor, charts-vendor, supabase-vendor).
