import {
    Briefcase,
    FileText,
    Clapperboard,
    Users,
    Camera,
    BarChart3,
    FileSpreadsheet,
    Layers,
    Settings,
    PlayCircle,
    HelpCircle,
    Zap,
    CreditCard,
    Shield,
    Mail,
    Calendar
} from 'lucide-react';

// Help Center Categories
export const helpCategories = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'New to ProductionOS? Start here.',
        icon: PlayCircle,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
    },
    {
        id: 'quoting',
        title: 'Quoting & Proposals',
        description: 'Create quotes, proposals, and manage rate cards.',
        icon: FileText,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
    },
    {
        id: 'projects',
        title: 'Project Management',
        description: 'Track projects from kickoff to wrap.',
        icon: Clapperboard,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
    },
    {
        id: 'crm',
        title: 'CRM & Pipeline',
        description: 'Manage clients, leads, and opportunities.',
        icon: Briefcase,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
    },
    {
        id: 'crew',
        title: 'Crew & Resources',
        description: 'Build and manage your crew database.',
        icon: Users,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
    },
    {
        id: 'equipment',
        title: 'Equipment Tracking',
        description: 'Track inventory, bookings, and check-outs.',
        icon: Camera,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
    },
    {
        id: 'financials',
        title: 'Financials & Invoicing',
        description: 'Invoices, expenses, and P&L tracking.',
        icon: BarChart3,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
    },
    {
        id: 'call-sheets',
        title: 'Call Sheets',
        description: 'Generate and distribute call sheets.',
        icon: FileSpreadsheet,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
    },
    {
        id: 'deliverables',
        title: 'Deliverables',
        description: 'Track outputs and client deliveries.',
        icon: Layers,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
    },
    {
        id: 'settings',
        title: 'Settings & Account',
        description: 'Customize your workspace and preferences.',
        icon: Settings,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
    },
];

// Help Articles
export const helpArticles = [
    // ============================================
    // GETTING STARTED
    // ============================================
    {
        id: 'quick-start-guide',
        slug: 'quick-start-guide',
        category: 'getting-started',
        title: 'Quick Start Guide',
        description: 'Get up and running with ProductionOS in 10 minutes.',
        readTime: '10 min',
        popular: true,
        content: `
## Welcome to ProductionOS

ProductionOS is the operating system for production companies. This guide will help you get set up and productive in just 10 minutes.

### Step 1: Complete Your Company Profile

After signing up, the first thing you should do is set up your company profile:

1. Click **Settings** in the sidebar
2. Go to **Company Info**
3. Add your company name, logo, and contact details
4. These details will appear on your quotes and invoices

![Company Settings](/help/screenshots/settings-company.png)

### Step 2: Set Up Your Rate Card

Your rate card stores standard pricing for crew and equipment:

1. Go to **Rate Card** in the sidebar
2. Click **Add Item** to create rate card entries
3. Set the **Role/Item name**, **Day Rate Cost**, and **Day Rate Charge**
4. The difference between cost and charge is your margin

![Rate Card Setup](/help/screenshots/rate-card.png)

### Step 3: Add Your First Client

Before creating quotes, add your clients:

1. Go to **Clients** in the sidebar
2. Click **Add Client**
3. Fill in company name and primary contact
4. Add billing address and payment terms

### Step 4: Create Your First Quote

Now you're ready to create a quote:

1. Click **New Quote** from the dashboard
2. Select a client from the dropdown
3. Add line items by clicking **Add Item**
4. See your margin in real-time as you build
5. Click **Export PDF** to generate a professional proposal

### Step 5: Convert to Project

When your client accepts:

1. Open the quote
2. Click **Convert to Project**
3. The quote becomes a project with all details carried over
4. Track status, assign crew, and monitor budget

### Next Steps

- [Set up regional rate cards](/help/setting-up-rate-cards)
- [Import your crew database](/help/importing-crew)
- [Customize your PDF templates](/help/customizing-pdf-templates)
        `
    },
    {
        id: 'account-setup',
        slug: 'account-setup',
        category: 'getting-started',
        title: 'Account Setup & Onboarding',
        description: 'Configure your account settings and preferences.',
        readTime: '5 min',
        content: `
## Setting Up Your Account

### Personal Profile

1. Click your avatar in the top-right corner
2. Select **Profile Settings**
3. Update your name, email, and profile photo
4. Set your notification preferences

### Company Settings

Navigate to **Settings > Company Info** to configure:

- **Company Name** - Appears on all documents
- **Logo** - Displayed on quotes and invoices
- **Address** - Your business address
- **Tax ID** - For invoices
- **Bank Details** - For payment information on invoices

### User Roles (Team Plan)

If you're on the Team plan, you can invite team members:

1. Go to **Settings > Team**
2. Click **Invite User**
3. Enter their email and select a role:
   - **Admin** - Full access to all features
   - **Manager** - Can manage projects but not billing
   - **Member** - Can view and edit assigned projects

### Notification Settings

Control how you receive updates:

- **Email Notifications** - Quote views, payments, deadlines
- **Browser Notifications** - Real-time alerts
- **Daily Digest** - Summary of activity
        `
    },
    {
        id: 'importing-data',
        slug: 'importing-data',
        category: 'getting-started',
        title: 'Importing Your Data',
        description: 'Import clients, crew, and equipment from CSV files.',
        readTime: '8 min',
        content: `
## Importing Data into ProductionOS

You can import existing data from spreadsheets to get started quickly.

### Supported Import Types

- **Clients** - Company details and contacts
- **Crew** - Freelancer profiles and rates
- **Equipment** - Inventory items

### Preparing Your CSV File

Your CSV should include headers in the first row. Here's an example for crew:

\`\`\`
name,email,phone,role,day_rate,skills
John Smith,john@email.com,+44123456789,Director of Photography,650,Camera;Lighting
Sarah Jones,sarah@email.com,+44987654321,Editor,400,Premiere;DaVinci
\`\`\`

### How to Import

1. Go to **Settings > Import Data**
2. Select the data type (Clients, Crew, or Equipment)
3. Click **Upload CSV**
4. Map your columns to ProductionOS fields
5. Preview the import and click **Confirm**

![Import Data Screen](/help/screenshots/import-data.png)

### Tips for Clean Imports

- Remove duplicate entries before importing
- Use consistent formatting for phone numbers
- Separate multiple skills with semicolons
- Include headers exactly as shown in templates
        `
    },

    // ============================================
    // QUOTING & PROPOSALS
    // ============================================
    {
        id: 'creating-quotes',
        slug: 'creating-quotes',
        category: 'quoting',
        title: 'Creating Your First Quote',
        description: 'Step-by-step guide to building professional quotes.',
        readTime: '8 min',
        popular: true,
        content: `
## Creating Quotes in ProductionOS

The quote builder is designed to help you create professional proposals in minutes, not hours.

### Starting a New Quote

1. From the dashboard, click **New Quote**
2. Or go to **Quotes** and click **Create Quote**

### Quote Header

Fill in the basic details:

- **Client** - Select from your client list
- **Project Title** - Name for this production
- **Quote Reference** - Auto-generated or custom
- **Valid Until** - Expiry date for the quote

![Quote Header](/help/screenshots/quote-header.png)

### Adding Sections

Quotes are organized into sections:

1. **Production Crew** - Director, DP, Sound, etc.
2. **Production Equipment** - Cameras, lighting, grip
3. **Creative** - Editing, color, motion graphics
4. **Logistics** - Travel, accommodation, catering
5. **Expenses** - Permits, insurance, misc

Click **Add Section** to create custom sections.

### Adding Line Items

For each section:

1. Click **Add Item**
2. Search your rate card or enter custom details
3. Set **Quantity** and **Days**
4. Cost and charge are calculated automatically
5. Your margin shows in real-time

![Adding Line Items](/help/screenshots/quote-line-items.png)

### Understanding Margins

Each line item shows:

- **Cost** - What you pay (crew rate, rental cost)
- **Charge** - What you bill the client
- **Margin** - The difference (your profit)

The total margin appears at the bottom of each section and for the entire quote.

### Adding Fees

You can add additional fees:

- **Production Fee** - Percentage markup on total
- **Contingency** - Buffer for unexpected costs
- **Discount** - Reduce total by percentage or amount

### Saving and Exporting

- Click **Save** to save your progress
- Click **Export PDF** to generate a professional proposal
- Use **Send Quote** to email directly to the client
        `
    },
    {
        id: 'setting-up-rate-cards',
        slug: 'setting-up-rate-cards',
        category: 'quoting',
        title: 'Setting Up Rate Cards',
        description: 'Configure your standard rates for crew and equipment.',
        readTime: '6 min',
        content: `
## Rate Cards in ProductionOS

Rate cards store your standard pricing, making quote creation fast and consistent.

### Understanding Rate Cards

A rate card entry includes:

- **Item Name** - Role or equipment name
- **Category** - Crew, Equipment, Creative, etc.
- **Cost** - What you pay (your cost)
- **Charge** - What you bill (client price)
- **Unit** - Day, Hour, or Fixed

### Creating Rate Card Items

1. Go to **Rate Card** in the sidebar
2. Click **Add Item**
3. Fill in the details:

![Rate Card Entry](/help/screenshots/rate-card-entry.png)

### Regional Rate Cards

If you work across different markets, set up regional variations:

1. Go to **Settings > Regions**
2. Add your regions (e.g., UK, USA, Asia)
3. In the rate card, add regional pricing:

| Role | UK Rate | US Rate | Asia Rate |
|------|---------|---------|-----------|
| Director | £800 | $1,200 | $600 |
| DP | £650 | $900 | $450 |
| Editor | £400 | $600 | $300 |

When creating quotes, select the region and prices adjust automatically.

### Importing Rate Cards

Have an existing rate card in a spreadsheet?

1. Go to **Rate Card > Import**
2. Upload your CSV with columns: name, category, cost, charge
3. Map columns and import

### Best Practices

- **Review quarterly** - Update rates to match market
- **Use categories** - Organize by type for easy filtering
- **Include markup** - Set charge higher than cost for profit
- **Add common items** - Include everything you regularly quote
        `
    },
    {
        id: 'multi-currency-quoting',
        slug: 'multi-currency-quoting',
        category: 'quoting',
        title: 'Multi-Currency Quoting',
        description: 'Quote in any currency with automatic conversion.',
        readTime: '4 min',
        content: `
## Multi-Currency Support

ProductionOS supports quoting in multiple currencies while tracking costs in your base currency.

### Setting Your Base Currency

1. Go to **Settings > Company Info**
2. Select your **Base Currency** (e.g., GBP)
3. All P&L and reporting uses this currency

### Quoting in Different Currencies

When creating a quote:

1. Click the **Currency** dropdown in the quote header
2. Select the client's preferred currency
3. All line items display in that currency

![Currency Selection](/help/screenshots/currency-selection.png)

### Exchange Rates

- Rates update automatically from market data
- You can lock a rate for a specific quote
- Override rates manually if needed

### How Margins Work

ProductionOS converts everything to your base currency for margin calculations:

- Quote in USD → Converted to GBP for your P&L
- Margin calculated in base currency
- Client sees their currency on the proposal

### Best Practice

- Set regional rate cards in local currencies
- Lock exchange rates on accepted quotes
- Review conversion rates before finalizing large quotes
        `
    },
    {
        id: 'quote-templates',
        slug: 'quote-templates',
        category: 'quoting',
        title: 'Using Quote Templates',
        description: 'Save time with reusable quote templates.',
        readTime: '5 min',
        content: `
## Quote Templates

Save quote structures as templates to speed up future quotes.

### Creating a Template

1. Build a quote with your standard structure
2. Click **Save as Template**
3. Give it a name (e.g., "Corporate Video", "Event Coverage")
4. Choose whether to include line items or just sections

### Using Templates

1. Click **New Quote**
2. Select **Start from Template**
3. Choose your template
4. Customize for the specific project

![Quote Templates](/help/screenshots/quote-templates.png)

### Template Ideas

- **Corporate Video** - Crew, 2-day shoot, 5-day edit
- **Event Coverage** - Multi-camera setup, live switching
- **Social Content** - Minimal crew, quick turnaround
- **Documentary** - Extended shoot, research phase
- **Commercial** - Full production with agency fees

### Managing Templates

- Edit templates in **Settings > Quote Templates**
- Duplicate templates to create variations
- Archive unused templates
        `
    },
    {
        id: 'customizing-pdf-templates',
        slug: 'customizing-pdf-templates',
        category: 'quoting',
        title: 'Customizing PDF Templates',
        description: 'Brand your proposals with custom PDF designs.',
        readTime: '6 min',
        content: `
## PDF Template Customization

Make your proposals look professional with branded PDF templates.

### Accessing Template Settings

1. Go to **Settings > Documents**
2. Click **Quote Template** to customize

### Customization Options

**Header Section**
- Upload your logo (recommended: 300px wide, PNG)
- Add company tagline
- Set header colors

**Content Options**
- Show/hide cost column
- Show/hide margins
- Include section subtotals
- Add terms and conditions

**Footer Section**
- Bank details
- Company registration
- Contact information

![PDF Customization](/help/screenshots/pdf-customization.png)

### Multiple Templates

Create different templates for different purposes:

- **Detailed Quote** - Full breakdown with all costs
- **Summary Quote** - Section totals only
- **Proposal** - Cover page with project overview

### Adding Terms & Conditions

1. Go to **Settings > Terms & Conditions**
2. Write your standard terms
3. These appear on every quote PDF
4. Override for specific quotes if needed
        `
    },

    // ============================================
    // PROJECT MANAGEMENT
    // ============================================
    {
        id: 'managing-projects',
        slug: 'managing-projects',
        category: 'projects',
        title: 'Managing Projects',
        description: 'Track projects from kickoff to wrap.',
        readTime: '8 min',
        popular: true,
        content: `
## Project Management in ProductionOS

Once a quote is accepted, convert it to a project to track production progress.

### Converting Quote to Project

1. Open the accepted quote
2. Click **Convert to Project**
3. All quote details transfer automatically:
   - Budget (from quote total)
   - Line items become tasks
   - Client information linked

### Project Dashboard

Each project has a dedicated dashboard showing:

- **Status** - Current production stage
- **Budget** - Original budget and spent to date
- **Team** - Assigned crew members
- **Deliverables** - Outputs and their status
- **Activity** - Recent updates and notes

![Project Dashboard](/help/screenshots/project-dashboard.png)

### Project Status Workflow

Projects move through stages:

1. **Draft** - Initial setup
2. **Confirmed** - Client approved, dates locked
3. **Pre-Production** - Planning phase
4. **Production** - Shooting
5. **Post-Production** - Editing and delivery
6. **Wrapped** - Project complete
7. **Closed** - Invoiced and archived

Click the status badge to update the current stage.

### Budget Tracking

Track actual costs against budget:

1. Go to the **Budget** tab
2. See original budget from quote
3. Add actual expenses as they occur
4. Visual progress bar shows budget health:
   - Green: Under budget
   - Yellow: Approaching budget
   - Red: Over budget

### Adding Notes and Updates

Keep a project log:

1. Go to the **Activity** tab
2. Click **Add Note**
3. Log updates, decisions, and communications
4. All notes are timestamped and attributed
        `
    },
    {
        id: 'project-status-workflow',
        slug: 'project-status-workflow',
        category: 'projects',
        title: 'Project Status Workflow',
        description: 'Understanding and customizing project stages.',
        readTime: '5 min',
        content: `
## Project Status Workflow

ProductionOS uses a status workflow to track project progress.

### Default Statuses

| Status | Description | Color |
|--------|-------------|-------|
| Draft | Project created, not yet confirmed | Gray |
| Confirmed | Client approved, moving forward | Blue |
| Pre-Production | Planning, crewing, logistics | Purple |
| Production | Active shooting | Orange |
| Post-Production | Editing and finishing | Cyan |
| Wrapped | Deliverables complete | Green |
| Closed | Invoiced and archived | Gray |

### Changing Status

1. Open the project
2. Click the status badge
3. Select the new status
4. Add an optional note explaining the change

### Viewing by Status

On the Projects page:

- Use the **Kanban** view to see projects by status
- Drag and drop to change status
- Filter by status using the dropdown

![Project Kanban](/help/screenshots/project-kanban.png)

### Customizing Statuses

Admins can customize the workflow:

1. Go to **Settings > Project Workflow**
2. Add, remove, or rename statuses
3. Set colors for each status
4. Reorder the workflow
        `
    },
    {
        id: 'budget-tracking',
        slug: 'budget-tracking',
        category: 'projects',
        title: 'Budget vs Actuals Tracking',
        description: 'Monitor project financials in real-time.',
        readTime: '6 min',
        content: `
## Budget Tracking

Know exactly where your project finances stand at all times.

### Setting the Budget

When you convert a quote to project, the quote total becomes the budget. You can also:

1. Manually set budget on project creation
2. Adjust budget if scope changes
3. Track original vs revised budget

### Recording Actual Costs

As costs come in:

1. Go to project **Budget** tab
2. Click **Add Expense**
3. Enter:
   - Category (Crew, Equipment, Travel, etc.)
   - Amount
   - Date
   - Description
   - Attach receipt (optional)

![Budget Tracking](/help/screenshots/budget-tracking.png)

### Understanding the Dashboard

The budget dashboard shows:

- **Total Budget** - What you quoted
- **Spent** - Actual costs recorded
- **Remaining** - Budget minus spent
- **Margin** - Expected profit

### Budget Alerts

Set alerts for budget milestones:

- 50% budget spent
- 75% budget spent
- 90% budget spent
- Over budget

You'll receive notifications when thresholds are crossed.

### Best Practices

- Log expenses as they happen, not at wrap
- Attach receipts for audit trail
- Review budget weekly during production
- Address overruns early, not at wrap
        `
    },

    // ============================================
    // CRM & PIPELINE
    // ============================================
    {
        id: 'managing-clients',
        slug: 'managing-clients',
        category: 'crm',
        title: 'Managing Clients',
        description: 'Add and organize your client database.',
        readTime: '6 min',
        popular: true,
        content: `
## Client Management

Build and maintain your client database in ProductionOS.

### Adding a Client

1. Go to **Clients** in the sidebar
2. Click **Add Client**
3. Fill in company details:
   - Company name
   - Industry
   - Website
   - Billing address

### Adding Contacts

Each client can have multiple contacts:

1. Open the client profile
2. Go to **Contacts** tab
3. Click **Add Contact**
4. Enter name, role, email, phone

Mark one contact as **Primary** for communications.

![Client Profile](/help/screenshots/client-profile.png)

### Client Details

Track important information:

- **Payment Terms** - Net 30, Net 60, etc.
- **Tax ID** - For invoicing
- **Notes** - Important details
- **Tags** - Categorize clients

### Client History

The client profile shows:

- All quotes sent to this client
- Projects completed
- Total revenue generated
- Communication history

### Searching and Filtering

Find clients quickly:

- Search by company name or contact
- Filter by tag
- Sort by recent activity
- View by revenue tier
        `
    },
    {
        id: 'using-the-pipeline',
        slug: 'using-the-pipeline',
        category: 'crm',
        title: 'Using the Sales Pipeline',
        description: 'Track opportunities from lead to close.',
        readTime: '7 min',
        content: `
## Sales Pipeline

Visualize and manage your sales opportunities.

### Pipeline Stages

Default stages:

1. **Lead** - Initial inquiry
2. **Qualified** - Confirmed budget and timeline
3. **Proposal Sent** - Quote delivered
4. **Negotiation** - Discussion ongoing
5. **Won** - Deal closed
6. **Lost** - Did not win

### Adding Opportunities

1. Go to **Pipeline** in the sidebar
2. Click **Add Opportunity**
3. Enter:
   - Opportunity name
   - Client
   - Estimated value
   - Expected close date
   - Stage

### Using the Pipeline View

![Pipeline View](/help/screenshots/pipeline-view.png)

- Drag cards between stages
- Click to open opportunity details
- See total value per stage
- Filter by date range or client

### Opportunity Details

Each opportunity tracks:

- **Value** - Estimated project value
- **Probability** - Likelihood to close
- **Expected Close** - Target date
- **Activities** - Calls, meetings, notes
- **Linked Quote** - Associated proposal

### Tracking Activities

Log all touchpoints:

1. Open the opportunity
2. Click **Log Activity**
3. Select type: Call, Email, Meeting, Note
4. Add details and date
5. Set follow-up reminder

### Pipeline Metrics

View pipeline analytics:

- Total pipeline value
- Conversion rates by stage
- Average deal size
- Win rate
        `
    },

    // ============================================
    // CREW & RESOURCES
    // ============================================
    {
        id: 'building-crew-database',
        slug: 'building-crew-database',
        category: 'crew',
        title: 'Building Your Crew Database',
        description: 'Add and manage freelancer profiles.',
        readTime: '7 min',
        popular: true,
        content: `
## Crew Database

Your crew database is your digital black book of production talent.

### Adding Crew Members

1. Go to **Crew** in the sidebar
2. Click **Add Crew**
3. Fill in profile:
   - Name and photo
   - Email and phone
   - Primary role
   - Day rate (cost and charge)
   - Skills and experience

![Add Crew Member](/help/screenshots/add-crew.png)

### Setting Rates

Each crew member can have multiple rates:

- Different rates for different roles
- Regional rate variations
- Discounted rates for regular clients

### Skills and Tags

Add skills for better searching:

- Technical skills: "DaVinci Resolve", "Steadicam"
- Languages: "Spanish", "Mandarin"
- Specializations: "Documentary", "Commercial"

### Availability Calendar

Track when crew are available:

1. Open crew profile
2. Go to **Availability** tab
3. Mark dates as Available, Tentative, or Booked
4. Crew can update their own availability

### Searching and Filtering

Find the right person quickly:

- Search by name or skill
- Filter by role
- Filter by availability
- Sort by rate or experience
        `
    },
    {
        id: 'crew-availability',
        slug: 'crew-availability',
        category: 'crew',
        title: 'Tracking Crew Availability',
        description: 'Check who is available for upcoming shoots.',
        readTime: '5 min',
        content: `
## Crew Availability

Never double-book crew again with availability tracking.

### Viewing Availability

1. Go to **Crew** page
2. Click **Calendar View**
3. See all crew availability at a glance

### Availability States

- **Available** (Green) - Free to book
- **Tentative** (Yellow) - Penciled, not confirmed
- **Booked** (Red) - Confirmed on a project
- **Unavailable** (Gray) - Not working

### Updating Availability

As an admin:
1. Open crew profile
2. Go to **Availability** tab
3. Click dates to toggle status

### Checking Before Booking

When assigning crew to a project:

1. Open the project
2. Go to **Team** tab
3. Click **Add Crew**
4. See availability indicators next to names
5. Conflicts show warning before assignment

![Crew Availability](/help/screenshots/crew-availability.png)

### Automatic Updates

When you assign crew to a project:
- Their calendar updates automatically
- Shows project name on booked dates
- Releases dates if removed from project
        `
    },

    // ============================================
    // EQUIPMENT TRACKING
    // ============================================
    {
        id: 'managing-equipment',
        slug: 'managing-equipment',
        category: 'equipment',
        title: 'Managing Equipment Inventory',
        description: 'Track all your production gear.',
        readTime: '7 min',
        popular: true,
        content: `
## Equipment Inventory

Track every piece of equipment you own or manage.

### Adding Equipment

1. Go to **Equipment** in the sidebar
2. Click **Add Item**
3. Enter details:
   - Name and description
   - Category (Camera, Lighting, Audio, etc.)
   - Serial number
   - Purchase date and value
   - Condition

![Add Equipment](/help/screenshots/add-equipment.png)

### Categories

Organize equipment by type:

- **Camera** - Bodies, lenses, accessories
- **Lighting** - LEDs, HMIs, modifiers
- **Audio** - Mics, recorders, wireless
- **Grip** - Tripods, rigs, sliders
- **Support** - Cases, cables, batteries

### Equipment Kits

Group items that go together:

1. Click **Create Kit**
2. Add items to the kit
3. Book the kit as a single unit

Example: "A-Camera Package" containing body, 3 lenses, batteries, cards.

### Condition Tracking

Monitor equipment health:

- **Excellent** - Like new
- **Good** - Normal wear
- **Fair** - Working but worn
- **Needs Repair** - Requires service
- **Out of Service** - Not available

Update condition at check-in to catch issues early.
        `
    },
    {
        id: 'equipment-booking',
        slug: 'equipment-booking',
        category: 'equipment',
        title: 'Booking Equipment',
        description: 'Reserve and schedule equipment for projects.',
        readTime: '5 min',
        content: `
## Equipment Booking

Reserve equipment for projects and avoid conflicts.

### Making a Booking

1. Go to **Equipment**
2. Find the item you need
3. Click **Book**
4. Select:
   - Project
   - Date range
   - Assigned to (crew member)

### Conflict Detection

When booking:
- System checks for existing bookings
- Conflicts show in red
- See which project has the item
- Choose to override or select alternative

![Equipment Booking](/help/screenshots/equipment-booking.png)

### Calendar View

See all bookings visually:

1. Click **Calendar** view
2. See equipment availability by date
3. Click to create bookings
4. Drag to extend bookings

### From Projects

You can also book from the project:

1. Open the project
2. Go to **Equipment** tab
3. Click **Add Equipment**
4. System shows only available items
        `
    },
    {
        id: 'equipment-check-out',
        slug: 'equipment-check-out',
        category: 'equipment',
        title: 'Check-out and Check-in',
        description: 'Track equipment leaving and returning.',
        readTime: '5 min',
        content: `
## Check-out / Check-in

Track when equipment leaves and returns to your facility.

### Checking Out Equipment

1. Go to **Equipment**
2. Select items being taken
3. Click **Check Out**
4. Confirm:
   - Person taking it
   - Project
   - Expected return date
5. Add condition notes

### Check-out Report

Generate a check-out report:

- List of items
- Serial numbers
- Condition at check-out
- Signature capture (optional)

### Checking In Equipment

When gear returns:

1. Go to **Equipment**
2. Find checked-out items
3. Click **Check In**
4. Update condition
5. Note any issues or damage

![Check In Equipment](/help/screenshots/equipment-checkin.png)

### Audit Trail

Every check-out and check-in is logged:

- Who took it
- When it left
- When it returned
- Condition changes
- Associated project

Use this for insurance claims or tracking issues.
        `
    },

    // ============================================
    // FINANCIALS & INVOICING
    // ============================================
    {
        id: 'creating-invoices',
        slug: 'creating-invoices',
        category: 'financials',
        title: 'Creating Invoices',
        description: 'Generate and send professional invoices.',
        readTime: '6 min',
        popular: true,
        content: `
## Creating Invoices

Generate professional invoices from quotes or projects.

### From a Quote

1. Open an approved quote
2. Click **Create Invoice**
3. Invoice auto-populates with quote details
4. Adjust if needed (partial invoice, different amounts)
5. Click **Save**

### From a Project

1. Open the project
2. Go to **Financials** tab
3. Click **New Invoice**
4. Select line items to include
5. Add any additional charges

![Create Invoice](/help/screenshots/create-invoice.png)

### Invoice Details

Each invoice includes:

- **Invoice Number** - Auto-generated or custom
- **Date** - Invoice date
- **Due Date** - Based on payment terms
- **Line Items** - From quote or custom
- **Tax** - Calculated automatically
- **Total** - Sum with tax

### Sending Invoices

1. Click **Send Invoice**
2. Choose method:
   - Email directly from ProductionOS
   - Download PDF to send yourself
3. Track when it's viewed

### Payment Terms

Set default terms in **Settings > Invoicing**:

- Net 30, Net 60, custom
- Early payment discounts
- Late payment fees
        `
    },
    {
        id: 'tracking-expenses',
        slug: 'tracking-expenses',
        category: 'financials',
        title: 'Tracking Expenses',
        description: 'Log and categorize project expenses.',
        readTime: '5 min',
        content: `
## Expense Tracking

Keep accurate records of project costs.

### Adding Expenses

1. Go to the project **Budget** tab
2. Click **Add Expense**
3. Enter:
   - Amount
   - Category
   - Date
   - Description
   - Attach receipt

### Expense Categories

- **Crew** - Freelancer payments
- **Equipment** - Rentals, purchases
- **Travel** - Transport, flights
- **Accommodation** - Hotels, per diems
- **Catering** - Meals, craft services
- **Permits** - Location fees
- **Other** - Miscellaneous

### Receipts

Attach receipts to expenses:

1. Click **Add Receipt**
2. Upload image or PDF
3. Receipts stored with the expense

![Expense with Receipt](/help/screenshots/expense-receipt.png)

### Expense Reports

Generate reports:

1. Go to **Reports > Expenses**
2. Filter by project, date, or category
3. Export to CSV or PDF
4. Use for client billing or tax records
        `
    },
    {
        id: 'project-profit-loss',
        slug: 'project-profit-loss',
        category: 'financials',
        title: 'Project Profit & Loss',
        description: 'See profitability on every project.',
        readTime: '5 min',
        content: `
## Project P&L

Understand the true profitability of every project.

### Viewing P&L

1. Open any project
2. Go to **Financials** tab
3. See the P&L summary:

| Metric | Value |
|--------|-------|
| Revenue | Invoiced amount |
| Costs | Total expenses |
| Gross Profit | Revenue - Costs |
| Margin | Profit as percentage |

### Understanding the Numbers

**Revenue** includes:
- Client invoices (paid and unpaid)
- Additional charges

**Costs** include:
- All logged expenses
- Crew payments
- Equipment costs

**Gross Margin** formula:
\`\`\`
(Revenue - Costs) / Revenue × 100
\`\`\`

### Historical Comparison

Compare to quoted margin:

- **Quoted Margin** - Expected profit when quoting
- **Actual Margin** - Real profit after costs

Variance shows if you're hitting targets.

![Project P&L](/help/screenshots/project-pl.png)

### Company-wide P&L

See overall performance:

1. Go to **Reports > Profit & Loss**
2. View by month, quarter, or year
3. Filter by project type or client
4. Export for accounting
        `
    },

    // ============================================
    // CALL SHEETS
    // ============================================
    {
        id: 'generating-call-sheets',
        slug: 'generating-call-sheets',
        category: 'call-sheets',
        title: 'Generating Call Sheets',
        description: 'Create professional call sheets in minutes.',
        readTime: '7 min',
        popular: true,
        content: `
## Call Sheet Generator

Generate comprehensive call sheets from your project data.

### Creating a Call Sheet

1. Open your project
2. Go to **Call Sheets** tab
3. Click **New Call Sheet**
4. Select the shoot date

### Auto-populated Information

The call sheet pulls from your project:

- **Project Details** - Name, client
- **Crew List** - From assigned team
- **Location** - From project locations
- **Weather** - Auto-fetched forecast

### Setting Call Times

For each crew member:

1. Set their individual call time
2. Or set a general call time
3. Add department-specific notes

![Call Sheet Editor](/help/screenshots/call-sheet-editor.png)

### Additional Details

Add important information:

- **Schedule** - Day's shooting plan
- **Nearest Hospital** - Emergency info
- **Parking** - Where to park
- **Catering** - Meal times
- **Notes** - Special instructions

### Preview and Export

1. Click **Preview** to see the call sheet
2. Make any adjustments
3. Click **Export PDF** for download
4. Or **Send to Crew** to email directly

### Distribution Tracking

When you email call sheets:
- See who has opened it
- Send reminders if unopened
- Track read receipts
        `
    },

    // ============================================
    // DELIVERABLES
    // ============================================
    {
        id: 'tracking-deliverables',
        slug: 'tracking-deliverables',
        category: 'deliverables',
        title: 'Tracking Deliverables',
        description: 'Manage all project outputs and versions.',
        readTime: '6 min',
        popular: true,
        content: `
## Deliverables Management

Track every output from your projects.

### Adding Deliverables

1. Open your project
2. Go to **Deliverables** tab
3. Click **Add Deliverable**
4. Enter:
   - Name (e.g., "Hero Video 16:9")
   - Type (Video, Photo, Audio, Graphics)
   - Due date
   - Notes

![Add Deliverable](/help/screenshots/add-deliverable.png)

### Deliverable Types

Organize by category:

- **Video** - Master, social cuts, teasers
- **Photo** - Hero shots, BTS, product
- **Audio** - Music, VO, sound design
- **Graphics** - Titles, lower thirds, thumbnails

### Status Workflow

Track progress through stages:

1. **Pending** - Not started
2. **In Progress** - Being worked on
3. **Review** - Awaiting feedback
4. **Revision** - Changes requested
5. **Approved** - Client signed off
6. **Delivered** - Sent to client

### Version Control

Track revisions:

1. Click **Add Version** on a deliverable
2. Upload the file or add a link
3. Version numbers auto-increment (V1, V2, V3)
4. Add notes explaining changes

### Due Date Alerts

- Set due dates for each deliverable
- Receive alerts for upcoming deadlines
- Overdue items highlighted in red
- Dashboard shows deliverables due this week
        `
    },

    // ============================================
    // SETTINGS & ACCOUNT
    // ============================================
    {
        id: 'billing-subscriptions',
        slug: 'billing-subscriptions',
        category: 'settings',
        title: 'Billing & Subscriptions',
        description: 'Manage your plan and payment methods.',
        readTime: '4 min',
        content: `
## Billing & Subscriptions

Manage your ProductionOS subscription.

### Viewing Your Plan

1. Go to **Settings > Billing**
2. See your current plan:
   - Plan name (Free, Individual, Team)
   - Billing cycle (Monthly/Annual)
   - Next billing date
   - Payment method

### Upgrading Your Plan

1. Click **Upgrade**
2. Select new plan
3. See prorated charges
4. Confirm and activate

### Managing Payment Methods

1. Go to **Settings > Billing > Payment Methods**
2. Add or update card details
3. Set default payment method

### Invoices & Receipts

Access billing history:

1. Go to **Settings > Billing > History**
2. Download invoices for accounting
3. View payment receipts

### Canceling

1. Go to **Settings > Billing**
2. Click **Cancel Subscription**
3. Your access continues until period end
4. Data retained for 30 days after cancellation
        `
    },
    {
        id: 'team-management',
        slug: 'team-management',
        category: 'settings',
        title: 'Team Management',
        description: 'Invite team members and manage permissions.',
        readTime: '5 min',
        content: `
## Team Management

Add team members and control access (Team plan required).

### Inviting Team Members

1. Go to **Settings > Team**
2. Click **Invite User**
3. Enter their email
4. Select role:
   - **Admin** - Full access
   - **Manager** - Projects and clients
   - **Member** - Assigned projects only
5. Click **Send Invite**

### User Roles

| Permission | Admin | Manager | Member |
|------------|-------|---------|--------|
| View all projects | Yes | Yes | Assigned |
| Create projects | Yes | Yes | No |
| Manage clients | Yes | Yes | View only |
| Access financials | Yes | No | No |
| Manage team | Yes | No | No |
| Settings | Yes | No | No |

### Managing Users

- **Edit Role** - Change user's permissions
- **Deactivate** - Remove access (data preserved)
- **Remove** - Permanently delete user

### Activity Log

View team activity:

1. Go to **Settings > Team > Activity**
2. See recent actions by all users
3. Filter by user or action type
        `
    },
    {
        id: 'integrations',
        slug: 'integrations',
        category: 'settings',
        title: 'Integrations',
        description: 'Connect ProductionOS to other tools.',
        readTime: '5 min',
        content: `
## Integrations

Connect ProductionOS to your other tools.

### Available Integrations

**Calendar**
- Google Calendar - Sync shoot dates
- Outlook Calendar - Microsoft 365

**Accounting**
- Xero - Export invoices
- QuickBooks - Sync financials

**Communication**
- Slack - Project notifications
- Email - Gmail, Outlook

### Setting Up Google Calendar

1. Go to **Settings > Integrations**
2. Click **Connect** next to Google Calendar
3. Sign in with your Google account
4. Grant calendar permissions
5. Choose calendars to sync

### Setting Up Slack

1. Go to **Settings > Integrations**
2. Click **Connect** next to Slack
3. Select your workspace
4. Choose notification channel
5. Configure which events trigger notifications

### API Access

For custom integrations:

1. Go to **Settings > API**
2. Generate API key
3. Use key to authenticate requests
4. See documentation for endpoints
        `
    },
];

// Get articles by category
export function getArticlesByCategory(categoryId) {
    return helpArticles.filter(article => article.category === categoryId);
}

// Get article by slug
export function getArticleBySlug(slug) {
    return helpArticles.find(article => article.slug === slug);
}

// Get popular articles
export function getPopularArticles() {
    return helpArticles.filter(article => article.popular);
}

// Search articles
export function searchArticles(query) {
    const lowerQuery = query.toLowerCase();
    return helpArticles.filter(article =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.description.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery)
    );
}
