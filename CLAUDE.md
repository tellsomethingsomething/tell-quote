# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quote is a quote/proposal generation tool for Tell Productions. It allows creating detailed project quotes with line items organized by sections (Production Team, Production Equipment, Creative, Logistics, Expenses), managing clients, and exporting to PDF.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run lint     # Run ESLint
npm run deploy   # Build and deploy to GitHub Pages (gh-pages)
```

## Architecture

### State Management (Zustand)

All app state lives in `/src/store/` using Zustand with persistence:

- **quoteStore.js** - Current quote being edited, with auto-save to Supabase every 30 seconds
- **clientStore.js** - Clients list and saved quotes library
- **rateCardStore.js** - Rate card items with regional pricing (SEA, EU, ME regions)
- **settingsStore.js** - Company settings, users, T&Cs, AI settings
- **authStore.js** - Simple password-based authentication

Stores sync to both localStorage (for session persistence) and Supabase (for cloud backup).

### Quote Structure

Quotes have a hierarchical structure defined in `/src/data/sections.js`:
- **Sections** (Production Team, Production Equipment, etc.) contain **subsections**
- **Subsections** contain **line items** with quantity, days, cost, charge
- Custom subsections can be added dynamically
- Section order and names are customizable per quote

### Key Data Flow

1. Rate card items (`rateCardStore`) provide base pricing by region
2. When adding items to a quote, pricing is copied from rate card for the selected region
3. Fees (management, commission, discount) are applied at quote level
4. PDF export uses `@react-pdf/renderer` (`/src/components/pdf/`)

### Pages vs Editor

- **Pages** (`/src/pages/`) - Full-page views (Dashboard, Clients, RateCard, Settings, Login)
- **Editor** - Split-panel quote editor with EditorPanel and PreviewPanel
- Navigation is state-based in App.jsx (`view` state), not URL-based

### Backend (Supabase)

Schema in `supabase-schema.sql`. Tables: quotes, clients, rate_cards, rate_card_sections, settings. All use JSONB columns for flexible nested data.

## Styling

- Tailwind CSS with custom brand colors defined in `tailwind.config.js`
- Dark theme by default (`bg-dark-bg`, `dark-card`, `dark-border`)
- Brand colors: navy (#143642), teal (#0F8B8D), orange (#FE7F2D)
- Section colors for visual distinction in editor

## Deployment

- **Vercel**: Uses base path `/`
- **GitHub Pages**: Uses base path `/tell-quote/` (set via `GITHUB_ACTIONS` env var in vite.config.js)
