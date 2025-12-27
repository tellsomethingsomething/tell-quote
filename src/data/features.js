import {
    Briefcase,
    FileText,
    Clapperboard,
    Users,
    Camera,
    BarChart3,
    FileSpreadsheet,
    Layers
} from 'lucide-react';

export const features = [
    {
        id: 'crm',
        title: 'Sales & Pipeline',
        headline: 'Win more work',
        description: 'Track every opportunity from first email to signed deal. Visual pipeline shows exactly where things stand. Never let a lead go cold again.',
        icon: Briefcase,
        path: '/features/crm',
        bullets: [
            'Drag-and-drop pipeline stages',
            'Lead scoring based on budget',
            'Activity timeline for deals',
            'Email tracking (opens, clicks)',
            'Smart follow-up reminders'
        ]
    },
    {
        id: 'quoting',
        title: 'Quote Builder',
        headline: 'Proposals that win',
        description: 'Build professional quotes in 15 minutes, not 2 hours. Sections for crew, equipment, creative, logistics. Your rate card built in. Margins calculated automatically.',
        icon: FileText,
        path: '/features/quoting',
        bullets: [
            'Section-based editor',
            'Regional rate cards built-in',
            'Multi-currency support',
            'Real-time margin calculator',
            'Branded PDF proposals'
        ]
    },
    {
        id: 'projects',
        title: 'Project Management',
        headline: 'Projects under control',
        description: 'Won a deal? Convert to project in one click. Track status, budget vs actuals, deliverables, and team. Know exactly where everything stands.',
        icon: Clapperboard,
        path: '/features/projects',
        bullets: [
            'Status workflow (Draft → Wrapped)',
            'Budget vs actuals tracking',
            'Deliverables with versioning',
            'Call sheet generator',
            'Timeline and calendar views'
        ]
    },
    {
        id: 'crew',
        title: 'Resource Database',
        headline: 'Your black book, digitized',
        description: 'Crew, talent, vendors, locations: all searchable. Day rates, skills, availability, contact details. Stop asking "what\'s their number?" every time.',
        icon: Users,
        path: '/features/crew',
        bullets: [
            'Crew profiles with rates',
            'Talent & agent database',
            'Vendor ratings & directory',
            'Location facilities info',
            'Availability calendar'
        ]
    },
    {
        id: 'equipment',
        title: 'Equipment Tracking',
        headline: 'Know where your kit is',
        description: 'Track every camera, lens, light, and cable. Book equipment against projects. Check out and check in. Stop buying duplicates.',
        icon: Camera,
        path: '/features/equipment',
        bullets: [
            'Inventory with serial numbers',
            'Booking with conflict detection',
            'Check-out/check-in tracking',
            'Condition monitoring',
            'Maintenance scheduling'
        ]
    },
    {
        id: 'financials',
        title: 'Financial Overview',
        headline: 'Actually know your margins',
        description: 'Revenue, expenses, invoices, and P&L: all connected. See which projects make money and which don\'t. Make smarter decisions.',
        icon: BarChart3,
        path: '/features/financials',
        bullets: [
            'Invoice from quotes',
            'Expense tracking with receipts',
            'Automatic Project P&L',
            'Payment tracking',
            'Cash flow visibility'
        ]
    },
    {
        id: 'call-sheets',
        title: 'Call Sheets',
        headline: 'Professional call sheets',
        description: 'Generate comprehensive call sheets with crew assignments, location details, schedules, and weather. Distribute via PDF or email.',
        icon: FileSpreadsheet,
        path: '/features/call-sheets',
        bullets: [
            'Template-based builder',
            'Crew assignments & call times',
            'Location & hospital details',
            'Auto-fetched weather',
            'PDF export & email sending'
        ]
    },
    {
        id: 'deliverables',
        title: 'Deliverables',
        headline: 'Track every output',
        description: 'Video masters, social cuts, photos, audio, graphics. Track status, versions, and due dates for everything you deliver.',
        icon: Layers,
        path: '/features/deliverables',
        bullets: [
            'Organize Video, Photo, Audio',
            'Status workflow',
            'Version control (v1, v2...)',
            'Due date tracking & alerts',
            'Client delivery tracking'
        ]
    }
];

export const featurePageData = {
    quoting: {
        title: "Quotes that win work. Built in 15 minutes.",
        subtitle: "Stop copying and pasting from old quotes. Stop rebuilding from scratch every time. ProductionOS quote builder has everything you need: sections, rate cards, margins, multi-currency, all in one clean interface.",
        image: "quote_builder.png",
        seoTitle: "Quote Builder for Production Companies | ProductionOS",
        seoDesc: "Build professional production quotes in minutes. Section-based editor, rate cards, multi-currency, margin calculator. Win more work. Start free trial.",
        painPoint: "Every quote is a custom rebuild. Copy from old quotes, update the client name, manually calculate totals. Two hours later you finally send it and you're not sure if you're even making money.",
        solution: "Select a client, add line items, the rate card fills in pricing, margins calculate automatically. Export a beautiful PDF. Done in 15 minutes.",
        benefits: [
            { title: "Section-based editor", desc: "Organized by crew, equipment, creative, logistics, expenses. Each section totals automatically." },
            { title: "Rate cards by region", desc: "Set standard rates once. Day rates by role, equipment by category, adjusted by region. The quote builder pulls automatically." },
            { title: "Multi-currency support", desc: "Quote in any currency. Bill in a different one. Exchange rates update automatically." },
            { title: "Margin calculator", desc: "See profit margin before you send. Cost vs charge for every line item. Never quote a loss-making job." },
            { title: "Quote templates", desc: "Save structures as templates. Corporate, event, documentary. Start from template, customize, save hours." },
            { title: "Professional PDF export", desc: "One-click PDF generation with your logo and branding. Cover page, breakdown, terms." }
        ],
        testimonial: {
            quote: "Our quote turnaround went from 2 days to 2 hours. We've won jobs specifically because we responded faster than competitors.",
            author: "Marcus Webb",
            company: "Red Door Films"
        },
        related: ['crm', 'projects', 'financials']
    },
    projects: {
        title: "From signed deal to wrapped project. All tracked.",
        subtitle: "Won a job? Convert to project in one click. Track status, budget, deliverables, and crew in one place. Know exactly where every project stands without chasing updates.",
        image: "kanban.png",
        seoTitle: "Production Project Management Software | ProductionOS",
        seoDesc: "Track production projects from kickoff to wrap. Budget vs actuals, deliverables, call sheets, crew assignments. Built for video and event production. Start free trial.",
        painPoint: "Production projects are chaotic. Shoots move, budgets shift, deliverables multiply. Without a system, you're constantly asking 'where are we?' and getting different answers.",
        solution: "Every project gets a home. Status workflow, budget tracking, deliverables list, call sheets. One source of truth.",
        benefits: [
            { title: "Status workflow", desc: "Projects move through Draft, Confirmed, In Production, Post, Wrapped, Closed. See all projects by status at a glance." },
            { title: "Budget vs actuals", desc: "Set budget, track actual costs. Visual progress bar shows where you stand. Alerts before you overspend." },
            { title: "Deliverables tracking", desc: "List every output: master, social cuts, BTS, photos. Track status and versions with due dates." },
            { title: "Call sheet generator", desc: "Generate call sheets in minutes. Crew assignments, location details, weather. Export to PDF, email to crew." },
            { title: "Crew and resource assignment", desc: "Assign crew, equipment, vendors. See who's booked on what. Avoid double-booking." },
            { title: "Timeline view", desc: "See production schedule across all projects. Identify conflicts. Plan resource allocation." }
        ],
        testimonial: {
            quote: "I used to lose sleep worrying about project status. Now I can see everything in 30 seconds. Budget tracking saved us from three overruns this year.",
            author: "Sarah Okonkwo",
            company: "Prism Productions"
        },
        related: ['quoting', 'crew', 'call-sheets', 'deliverables']
    },
    crm: {
        title: "Win more work. Lose fewer leads.",
        subtitle: "Track every opportunity from first contact to signed deal. Visual pipeline, activity timeline, and deal insights built for how production companies actually sell.",
        image: "dashboard.png",
        seoTitle: "CRM for Production Companies | ProductionOS",
        seoDesc: "Sales pipeline built for production companies. Track leads, opportunities, and deals. Activity timeline, lead scoring, email tracking. Win more work. Start free trial.",
        painPoint: "Production companies don't sell like SaaS companies. Leads come from referrals, old clients, random emails. Without a system, opportunities slip through the cracks.",
        solution: "Simple pipeline that makes sense. Activity timeline so you remember what you discussed. Follow-up reminders so nothing goes cold. Connected to quotes and projects.",
        benefits: [
            { title: "Visual pipeline", desc: "Drag-and-drop stages: Lead, Qualified, Proposal Sent, Negotiation, Won/Lost. See all opportunities in one view." },
            { title: "Lead scoring", desc: "Automatic scoring based on budget, timeline, and fit. Focus on opportunities most likely to close." },
            { title: "Activity timeline", desc: "Every email, call, meeting, and note logged. Never ask 'what did we discuss?' again." },
            { title: "Client management", desc: "Company profiles with contacts, billing info, addresses, payment terms. Organized and searchable." },
            { title: "Email tracking", desc: "See when clients open your emails. Know when they click your quote link. Follow up at the right time." },
            { title: "Task management", desc: "Set follow-up tasks. Get reminders before things go cold. Never let a warm lead cool off." }
        ],
        testimonial: {
            quote: "I closed two deals last month just because the system reminded me to check in. That's $15,000 I would have left on the table.",
            author: "Thomas Lindqvist",
            company: "Northern Light Media"
        },
        related: ['quoting', 'projects', 'financials']
    },
    crew: {
        title: "Your entire network, organized.",
        subtitle: "Crew, talent, vendors, locations: all in one searchable database. Rates, skills, availability, contact details. Stop scrolling through WhatsApp threads to find people.",
        seoTitle: "Crew Management Software for Production | ProductionOS",
        seoDesc: "Crew database with rates, skills, availability. Talent, vendors, locations all in one place. Never ask 'what's their day rate?' again. Start free trial.",
        painPoint: "Your network is scattered across phone contacts, WhatsApp groups, old emails, and memory. When you need a gaffer for Tuesday, you shouldn't spend 30 minutes figuring out who's available.",
        solution: "Everyone you work with, in one database. Search by skill, location, rate. See availability. Book directly into projects.",
        benefits: [
            { title: "Crew profiles", desc: "Contact info, roles, day rates, skills, experience. Notes from past projects." },
            { title: "Talent database", desc: "Actors, models, presenters, voice artists. Agent details, social metrics, rates." },
            { title: "Vendor management", desc: "Equipment rental, catering, transport. Services, pricing, ratings from past jobs." },
            { title: "Location database", desc: "Studios, offices, outdoor spaces. Facilities, max crew size, permit requirements, rates." },
            { title: "Skills and search", desc: "Tag everyone with skills. Search for 'editor with DaVinci experience' and find them in seconds." },
            { title: "Availability tracking", desc: "See who's booked and when. Check availability before you reach out." }
        ],
        testimonial: {
            quote: "150+ freelancers in our network, and I can find exactly who I need in seconds. Last week I found a Korean-speaking DP in under a minute.",
            author: "James Chen",
            company: "Framelight Productions"
        },
        related: ['projects', 'call-sheets', 'equipment']
    },
    equipment: {
        title: "Know where every piece of kit is.",
        subtitle: "Track your equipment inventory, bookings, and condition. Check out and check in. Prevent double-booking. Stop losing cables and buying duplicates.",
        seoTitle: "Equipment Tracking for Production Companies | ProductionOS",
        seoDesc: "Track production equipment, bookings, check-outs. Never lose gear again. Conflict detection, condition monitoring. Built for video and event production. Start free trial.",
        painPoint: "Your equipment is probably worth tens of thousands. But do you know where it all is right now? Who has the A7S? Where are the wireless lavs?",
        solution: "Every piece of kit tracked. Full inventory with serial numbers. Booking with conflict detection. Check-out and check-in tracking.",
        benefits: [
            { title: "Full inventory", desc: "Every camera, lens, light, mic, and cable catalogued with serial numbers and condition." },
            { title: "Booking system", desc: "Reserve equipment for projects. Availability calendar with conflict detection." },
            { title: "Check-out and check-in", desc: "Track who has what and when. Check out to a crew member or project. Full audit trail." },
            { title: "Condition monitoring", desc: "Track equipment condition. Note issues when checking in. Flag items for maintenance." },
            { title: "Conflict detection", desc: "Warnings when booking already-reserved equipment. See who has it and when it's free." },
            { title: "Maintenance scheduling", desc: "Track when equipment needs servicing. Set reminders." }
        ],
        testimonial: {
            quote: "We used to lose about $3,000 worth of gear every year. Cables, small stuff. After six months on ProductionOS, we haven't lost a single item.",
            author: "Daniel Reyes",
            company: "Kino Studios"
        },
        related: ['projects', 'crew', 'financials']
    },
    financials: {
        title: "Actually know if you're making money.",
        subtitle: "Invoicing, expenses, purchase orders, and project P&L: all connected. See your real margins on every project. Make decisions based on data, not guesses.",
        image: "finance.png",
        seoTitle: "Financial Tracking for Production Companies | ProductionOS",
        seoDesc: "Invoicing, expense tracking, project P&L for production companies. Know your margins. Stop guessing if you're profitable. Start free trial.",
        painPoint: "'What was your profit margin on that job you wrapped last month?' If you need to dig through spreadsheets for 3 hours to find out, you're not actually running a business.",
        solution: "Quotes, invoices, and expenses connected automatically. Every project has a clear P&L. See margins at a glance.",
        benefits: [
            { title: "Invoice generation", desc: "Create invoices from quotes or projects in one click. Professional PDFs with your branding." },
            { title: "Payment tracking", desc: "Track invoice status: Draft, Sent, Viewed, Paid. See what's outstanding." },
            { title: "Expense tracking", desc: "Log project expenses as they happen. Categorize, attach receipts, see actual costs vs budget." },
            { title: "Purchase orders", desc: "Generate POs for vendors. Track status through to payment." },
            { title: "Project P&L", desc: "Automatic profit and loss for every project. Revenue vs costs, gross and net margin." },
            { title: "Cash flow visibility", desc: "See money coming in and out. Forecast based on outstanding invoices." }
        ],
        testimonial: {
            quote: "ProductionOS showed me we were undercharging on half our projects. Fixed that, and we added 12% to our bottom line immediately.",
            author: "Sarah Okonkwo",
            company: "Prism Productions"
        },
        related: ['quoting', 'projects', 'crm']
    },
    "call-sheets": {
        title: "Professional call sheets in 5 minutes.",
        subtitle: "Stop rebuilding call sheets from scratch. ProductionOS pulls crew, locations, and details from your project. Add call times, export to PDF, distribute to your team.",
        seoTitle: "Call Sheet Generator for Production | ProductionOS",
        seoDesc: "Generate professional call sheets in minutes. Crew assignments, location details, weather integration. PDF export. Built for video and event production. Start free trial.",
        painPoint: "Call sheets shouldn't take an hour. But they do because you're copying from old templates, manually adding crew details, looking up addresses.",
        solution: "Call sheets generated from your project data. Crew, locations, weather auto-populated. Just add call times and export.",
        benefits: [
            { title: "Template-based generation", desc: "Start from your project. Crew, location, date already populated. Fill in call times and notes." },
            { title: "Crew assignments", desc: "All crew with roles, call times, and contact info. Pull from your database." },
            { title: "Location details", desc: "Address, parking, load-in notes, nearest hospital, client contact." },
            { title: "Weather integration", desc: "Automatic weather forecast for your shoot date and location." },
            { title: "PDF export", desc: "One-click PDF generation. Clean formatting, easy to read on mobile." },
            { title: "Email distribution", desc: "Send call sheets directly. Track who's opened it." }
        ],
        testimonial: {
            quote: "Call sheets used to be a Sunday night nightmare. Now I generate one in 10 minutes, including weather. My crew actually comments on how professional they look.",
            author: "Marcus Webb",
            company: "Red Door Films"
        },
        related: ['projects', 'crew']
    },
    deliverables: {
        title: "Track every output from edit to delivery.",
        subtitle: "Master, social cuts, BTS, photos, audio. Track every deliverable with status, versions, and due dates. Know exactly what's done and what's still outstanding.",
        seoTitle: "Deliverables Tracking for Production | ProductionOS",
        seoDesc: "Track video deliverables from edit to delivery. Status workflow, version control, due dates. Never miss a deadline. Built for production companies. Start free trial.",
        painPoint: "A single project can have 15 deliverables. Master, social cuts, square versions, BTS. Each with revisions and due dates. Track that across 10 projects and things fall through cracks.",
        solution: "Every deliverable tracked. Status workflow shows where things are. Version control, due dates with alerts. Always know what's done, in progress, or overdue.",
        benefits: [
            { title: "Output categorization", desc: "Organize by type: Video, Photos, Audio, Graphics. Subcategories for formats." },
            { title: "Status workflow", desc: "Pending, In Progress, Review, Revision, Approved, Delivered. See status at a glance." },
            { title: "Version control", desc: "Track versions with notes. V1, V2, Final. Know which version went to client." },
            { title: "Due date tracking", desc: "Set due dates. Get alerts for upcoming deadlines. See overdue items highlighted." },
            { title: "Template presets", desc: "Standard deliverable sets for different project types. Don't forget common outputs." },
            { title: "Client delivery tracking", desc: "Mark what's been delivered. Track delivery date and method." }
        ],
        testimonial: {
            quote: "We deliver 30-40 assets per project sometimes. Tracking that used to be a nightmare. Now I can see exactly what's done and nothing cracks.",
            author: "James Chen",
            company: "Framelight Productions"
        },
        related: ['projects', 'financials']
    }
};
