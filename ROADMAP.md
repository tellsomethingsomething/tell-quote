# ProductionOS - Launch Sprint

## Vision
AI-native CRM + rental management platform for production companies, AV rental houses, and event businesses. The platform they wish Current RMS/Rentman was.

**Brand:** ProductionOS
**Killer Feature:** Real P&L per project
**Price:** $29/user/month
**Target:** 10 paying customers in 30 days

---

## Launch Sprint: 1 Week (5-6 hrs/day = ~40 hrs)

### Day 1: Foundation (6 hrs)
| Task | Time | Priority |
|------|------|----------|
| Buy domain (productionos.com or .io) | 30 min | 🔴 |
| Set up new Supabase project for multi-tenant | 1 hr | 🔴 |
| Create organizations table + RLS policies | 2 hrs | 🔴 |
| Set up Stripe account + products | 1 hr | 🔴 |
| Fork/copy Tell codebase to ProductionOS repo | 30 min | 🔴 |
| Update branding (logo, colors, name) | 1 hr | 🟡 |

### Day 2: Auth & Billing (6 hrs)
| Task | Time | Priority |
|------|------|----------|
| Implement Supabase Auth with org context | 2 hrs | 🔴 |
| Create signup flow (email + org name) | 1.5 hrs | 🔴 |
| Integrate Stripe Checkout for subscriptions | 2 hrs | 🔴 |
| Webhook for payment events | 30 min | 🔴 |

### Day 3: Multi-Tenant Data (6 hrs)
| Task | Time | Priority |
|------|------|----------|
| Add org_id to all tables | 1 hr | 🔴 |
| Update all RLS policies for tenant isolation | 2 hrs | 🔴 |
| Migrate stores to include org context | 2 hrs | 🔴 |
| Test data isolation between orgs | 1 hr | 🔴 |

### Day 4: Invoice & P&L (6 hrs)
| Task | Time | Priority |
|------|------|----------|
| Create invoices table | 30 min | 🔴 |
| Build Invoice page (list, create, view) | 2.5 hrs | 🔴 |
| One-click invoice from Won quote | 1 hr | 🔴 |
| Create expenses table + basic UI | 1.5 hrs | 🔴 |
| P&L widget per project | 30 min | 🔴 |

### Day 5: Polish & Ops (6 hrs)
| Task | Time | Priority |
|------|------|----------|
| Re-enable Kit management UI | 1 hr | 🟡 |
| Re-enable Crew management UI | 1 hr | 🟡 |
| Re-enable Projects UI | 1 hr | 🟡 |
| Add live chat widget (Crisp/Intercom) | 30 min | 🟡 |
| Onboarding checklist for new users | 1 hr | 🟡 |
| Landing page (simple) | 30 min | 🟡 |

### Day 6: Deploy & Test (5 hrs)
| Task | Time | Priority |
|------|------|----------|
| Deploy to Vercel with custom domain | 1 hr | 🔴 |
| Set up subdomain routing (app.productionos.com) | 1 hr | 🟡 |
| End-to-end testing (signup → pay → use) | 2 hrs | 🔴 |
| Fix critical bugs | 1 hr | 🔴 |

### Day 7: Launch (4 hrs)
| Task | Time | Priority |
|------|------|----------|
| Final bug fixes | 1 hr | 🔴 |
| Create launch post (LinkedIn) | 1 hr | 🟡 |
| Direct outreach to network (10 emails) | 1 hr | 🔴 |
| Monitor signups + support | 1 hr | 🔴 |

---

## What's IN for Week 1 Launch

### Core Platform
- ✅ Multi-tenant authentication (Supabase Auth)
- ✅ Organization/workspace model
- ✅ Stripe subscription billing ($29/user)
- ✅ 5-day free trial

### CRM
- ✅ Clients & contacts
- ✅ Opportunities & pipeline
- ✅ Quotes with multi-currency
- ✅ Activities & timeline
- ✅ Tasks

### Finance (KILLER FEATURE)
- ✅ Invoices (create from quote, track status)
- ✅ Expenses per project
- ✅ P&L per project (real-time)

### Operations
- ✅ Kit/Equipment database
- ✅ Crew database
- ✅ Projects

### Infrastructure
- ✅ Custom domain (app.productionos.com)
- ✅ Live chat support (Crisp)
- ✅ PWA / mobile ready

---

## What's OUT for Week 1 (v1.1+)

| Feature | Why Deferred | Target |
|---------|--------------|--------|
| Xero/QuickBooks sync | Complex OAuth, can invoice manually | Week 3 |
| AI agents | Cool but not essential for MVP | Week 4 |
| CSV import | Can manually enter data initially | Week 2 |
| Call sheets PDF | Projects work, PDF can wait | Week 2 |
| Kit availability calendar | Database works, visual timeline later | Week 2 |
| Crew availability calendar | Same as above | Week 2 |
| Custom subdomains per tenant | app.productionos.com works fine | Week 4 |
| Email integration | Can use normal email for now | Week 3 |
| Advanced analytics | Basic P&L is enough | Week 4 |

---

## Technical Architecture (SaaS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        app.productionos.com                                  │
│                   (React 19 + Zustand + Vite + Vercel)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (Multi-Tenant)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Auth + Orgs    │  │    Database     │  │  Edge Functions │             │
│  │                 │  │                 │  │                 │             │
│  │ • User signup   │  │ • organizations │  │ • stripe-webhook│             │
│  │ • Org context   │  │ • clients       │  │ • (future AI)   │             │
│  │ • Invites       │  │ • quotes        │  │                 │             │
│  │                 │  │ • invoices      │  │                 │             │
│  │                 │  │ • expenses      │  │                 │             │
│  │                 │  │ • projects      │  │                 │             │
│  │                 │  │ • kit_items     │  │                 │             │
│  │                 │  │ • crew          │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                              ▲                                              │
│                              │ RLS: WHERE org_id = auth.org_id()            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STRIPE                                          │
│  • Subscription: $29/user/month                                             │
│  • 5-day free trial                                                         │
│  • Webhook → update org.subscription_status                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Changes for Multi-Tenant

### New Tables

```sql
-- organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for future subdomains

  owner_id UUID REFERENCES auth.users(id),

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing', -- trialing, active, canceled, past_due
  trial_ends_at TIMESTAMPTZ DEFAULT now() + interval '5 days',

  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- org_members (users in orgs)
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member, viewer

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, user_id)
);

-- invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  invoice_number TEXT NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  client_id UUID REFERENCES clients(id),
  project_id UUID,

  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue

  subtotal DECIMAL(12,2),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',

  issue_date DATE,
  due_date DATE,
  paid_date DATE,

  line_items JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, invoice_number)
);

-- expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  project_id UUID,
  client_id UUID REFERENCES clients(id),

  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE NOT NULL,

  receipt_url TEXT,
  is_billable BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Add org_id to Existing Tables

```sql
-- Add org_id to all existing tables
ALTER TABLE clients ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE quotes ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE opportunities ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE activities ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE tasks ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE kit_items ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE crew_members ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE projects ADD COLUMN org_id UUID REFERENCES organizations(id);
-- etc.
```

### RLS Policies

```sql
-- Example RLS for clients (apply to all tables)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their org's clients"
  ON clients FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert to their org"
  ON clients FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's clients"
  ON clients FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their org's clients"
  ON clients FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));
```

---

## Pricing Model

| Plan | Price | Users | Features |
|------|-------|-------|----------|
| **Starter** | $29/user/mo | 1-5 | Full platform, 5-day trial |
| **Pro** | $29/user/mo | 6-20 | + Priority support |
| **Enterprise** | Custom | 20+ | + Custom onboarding, SLA |

**Stripe Setup:**
- Product: ProductionOS
- Price: $29/user/month (metered)
- Trial: 5 days
- Billing: Monthly

---

## Launch Checklist

### Before Launch
- [ ] Domain purchased (productionos.com or .io)
- [ ] Supabase project created
- [ ] Stripe account verified
- [ ] Privacy policy & terms of service
- [ ] Support email set up

### Launch Day
- [ ] DNS configured
- [ ] SSL working
- [ ] Signup flow tested
- [ ] Payment flow tested
- [ ] First user signed up (you)

### Post-Launch
- [ ] LinkedIn announcement
- [ ] 10 direct outreach emails
- [ ] Monitor for bugs
- [ ] Respond to support requests

---

## Success Metrics

| Metric | Week 1 | Week 2 | Week 4 | Month 2 |
|--------|--------|--------|--------|---------|
| Signups | 20 | 50 | 100 | 200 |
| Paid customers | 2 | 5 | 10 | 25 |
| MRR | $58 | $145 | $290 | $725 |
| Churn | 0% | <10% | <10% | <5% |

---

## V1.1 Roadmap (Weeks 2-4)

### Week 2
- [ ] CSV import for clients/quotes
- [ ] Kit availability calendar
- [ ] Crew availability calendar
- [ ] Call sheet PDF generation
- [ ] Invoice PDF generation

### Week 3
- [ ] Xero OAuth integration
- [ ] Invoice sync to Xero
- [ ] Email integration (Gmail)
- [ ] Team invites (add users to org)

### Week 4
- [ ] AI Invoice Agent (auto-generate)
- [ ] AI Follow-up Agent (draft emails)
- [ ] QuickBooks integration
- [ ] Custom subdomains

---

## MCP Servers for Development

### Currently Installed
- ✅ sequential-thinking - Complex reasoning
- ✅ playwright - Browser testing
- ✅ claude-in-chrome - Browser automation
- ✅ n8n - Workflow automation

### To Install This Week
```bash
# Supabase for database operations
claude mcp add supabase -- npx -y @supabase/mcp-server

# Memory for persistent context
claude mcp add memory -- npx -y @anthropic-ai/mcp-memory
```

---

## Competitive Positioning

**Tagline:** "Finally, a rental management system built this decade."

**vs Current RMS:**
- Modern UI that works on mobile
- Real P&L per project (not just invoicing)
- 1/3 the price
- AI automation (coming soon)

**vs Rentman:**
- Simpler, faster to learn
- Better CRM capabilities
- More affordable
- Built for small teams, not enterprises

**vs Spreadsheets:**
- Professional quotes & invoices
- Client relationship tracking
- Equipment & crew management
- Actual business insights

---

## Immediate Next Steps

1. [ ] Buy domain
2. [ ] Create new Supabase project
3. [ ] Set up Stripe account
4. [ ] Fork codebase to productionos repo
5. [ ] Start Day 1 tasks

---

*Sprint starts: NOW*
*Launch target: 7 days*
