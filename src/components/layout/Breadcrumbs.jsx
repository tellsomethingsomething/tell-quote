/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumbs based on current view state.
 * Supports deep linking for detail pages (client, project, opportunity, etc.)
 */
import { ChevronRight, Home } from 'lucide-react';

// View name to display label mapping
const VIEW_LABELS = {
    dashboard: 'Dashboard',
    quotes: 'Quotes',
    clients: 'Clients',
    'client-detail': 'Client Details',
    opportunities: 'Opportunities',
    'opportunity-detail': 'Opportunity Details',
    projects: 'Projects',
    'project-detail': 'Project Details',
    crew: 'Crew',
    'crew-detail': 'Crew Member',
    'call-sheets': 'Call Sheets',
    'call-sheet-detail': 'Call Sheet Details',
    settings: 'Settings',
    'rate-card': 'Rate Card',
    invoices: 'Invoices',
    expenses: 'Expenses',
    pl: 'Profit & Loss',
    'purchase-orders': 'Purchase Orders',
    contracts: 'Contracts',
    email: 'Email',
    calendar: 'Calendar',
    sequences: 'Sequences',
    workflows: 'Workflows',
    sop: 'SOPs',
    knowledge: 'Knowledge Base',
    kit: 'Equipment',
    'kit-bookings': 'Equipment Bookings',
    contacts: 'Contacts',
    tasks: 'Tasks',
    'task-board': 'Task Board',
    editor: 'Quote Editor',
    fs: 'Full Screen',
    resources: 'Resources',
    admin: 'Admin',
};

// Views that are children of other views
const VIEW_PARENTS = {
    'client-detail': 'clients',
    'opportunity-detail': 'opportunities',
    'project-detail': 'projects',
    'crew-detail': 'crew',
    'call-sheet-detail': 'call-sheets',
    editor: 'quotes',
};

export default function Breadcrumbs({ view, entityName, onNavigate }) {
    const getLabel = (viewId) => VIEW_LABELS[viewId] || viewId;

    // Build breadcrumb trail
    const buildTrail = () => {
        const trail = [];

        // Always start with dashboard
        trail.push({ id: 'dashboard', label: 'Home', icon: true });

        // Check if current view has a parent
        const parentView = VIEW_PARENTS[view];
        if (parentView) {
            trail.push({ id: parentView, label: getLabel(parentView) });
        }

        // Add current view if not dashboard
        if (view !== 'dashboard') {
            trail.push({
                id: view,
                label: entityName || getLabel(view),
                current: true,
            });
        }

        return trail;
    };

    const trail = buildTrail();

    // Don't show if only dashboard
    if (trail.length === 1) {
        return null;
    }

    return (
        <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-gray-500 px-4 py-2 bg-dark-card/50 border-b border-dark-border"
        >
            {trail.map((item, index) => (
                <div key={item.id} className="flex items-center gap-1.5">
                    {index > 0 && (
                        <ChevronRight size={14} className="text-gray-600" />
                    )}
                    {item.current ? (
                        <span className="text-gray-200 font-medium truncate max-w-[200px]">
                            {item.icon && <Home size={14} className="inline mr-1" />}
                            {item.label}
                        </span>
                    ) : (
                        <button
                            onClick={() => onNavigate?.(item.id)}
                            className="hover:text-gray-300 transition-colors flex items-center gap-1"
                        >
                            {item.icon && <Home size={14} />}
                            {!item.icon && item.label}
                        </button>
                    )}
                </div>
            ))}
        </nav>
    );
}
