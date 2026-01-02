# ProductionOS

> ## **PRODUCTION SYSTEM - LIVE**
>
> **Status:** PRODUCTION (Live since 2026-01-02)
> **URL:** https://productionos.io

The first CRM built specifically for production companies. A multi-tenant SaaS platform providing CRM, quoting, project management, and financial tools for managing production workflows.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:5173)
npm run build        # Production build
npm run deploy       # Deploy to Vercel
```

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS
- **State:** Zustand with localStorage persistence
- **Backend:** Supabase (Auth + PostgreSQL)
- **Payments:** Stripe (Live mode)
- **PDF:** @react-pdf/renderer
- **Hosting:** Vercel

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | AI assistant guidelines and architecture overview |
| [SECURITY.md](./SECURITY.md) | Security implementation details |
| [SOFT_LAUNCH_CHECKLIST.md](./SOFT_LAUNCH_CHECKLIST.md) | Production launch checklist |

## Security

All security measures are deployed and verified:
- Supabase Auth with PKCE flow
- Row Level Security (RLS) on all tables
- Server-side rate limiting (5 attempts = 15-min lockout)
- OAuth tokens encrypted with pgcrypto
- HTTPS enforced via HSTS

See [SECURITY.md](./SECURITY.md) for full details.

## Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See `.env.example` for all configuration options.

## License

Proprietary - Tell Productions Ltd.

---

**Production URL:** https://productionos.io
**Last Updated:** 2026-01-02
