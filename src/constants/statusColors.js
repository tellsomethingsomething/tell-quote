/**
 * Standardized Status Colors
 *
 * Centralized color definitions for consistent status visualization across the app.
 * Uses Tailwind CSS classes for easy integration.
 */

// Opportunity/Quote/Invoice Status Colors
export const STATUS_COLORS = {
    // Draft states (gray)
    draft: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/20',
        dot: 'bg-gray-400',
        hex: '#9CA3AF',
    },

    // Sent/Pending states (blue)
    sent: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        dot: 'bg-blue-400',
        hex: '#60A5FA',
    },
    pending: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        dot: 'bg-blue-400',
    },

    // Viewed/In Review states (purple)
    viewed: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/20',
        dot: 'bg-purple-400',
    },
    in_review: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/20',
        dot: 'bg-purple-400',
    },

    // Active/In Progress states (cyan)
    active: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/20',
        dot: 'bg-cyan-400',
    },
    in_progress: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/20',
        dot: 'bg-cyan-400',
    },

    // Confirmed state (blue) - for projects
    confirmed: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        dot: 'bg-blue-400',
    },

    // Wrapped state (green) - for projects
    wrapped: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        dot: 'bg-green-400',
    },

    // Closed state (purple) - for projects
    closed: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/20',
        dot: 'bg-purple-400',
    },

    // Archived state (gray)
    archived: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/20',
        dot: 'bg-gray-400',
    },

    // Approved/Won/Paid/Completed states (green)
    approved: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        dot: 'bg-green-400',
        hex: '#22C55E',
    },
    won: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        dot: 'bg-green-400',
        hex: '#22C55E',
    },
    paid: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        dot: 'bg-green-400',
    },
    completed: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        dot: 'bg-green-400',
    },

    // Warning/On Hold states (yellow/amber)
    on_hold: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20',
        dot: 'bg-yellow-400',
    },
    overdue: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-400',
    },

    // Rejected/Lost/Cancelled/Dead states (red)
    rejected: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        dot: 'bg-red-400',
        hex: '#F87171',
    },
    lost: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        dot: 'bg-red-400',
        hex: '#F87171',
    },
    dead: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        dot: 'bg-red-400',
        hex: '#F87171',
    },
    cancelled: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        dot: 'bg-red-400',
        hex: '#F87171',
    },

    // Not Started (neutral gray)
    not_started: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/20',
        dot: 'bg-gray-400',
    },
};

// Pipeline stage colors (for CRM kanban)
export const PIPELINE_COLORS = {
    lead: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        header: 'bg-gray-500/20',
    },
    qualified: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        header: 'bg-blue-500/20',
    },
    proposal: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        header: 'bg-purple-500/20',
    },
    negotiation: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        header: 'bg-amber-500/20',
    },
    closed_won: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        header: 'bg-green-500/20',
    },
    closed_lost: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        header: 'bg-red-500/20',
    },
};

// Priority colors
export const PRIORITY_COLORS = {
    low: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/20',
    },
    medium: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20',
    },
    high: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/20',
    },
    urgent: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
    },
};

/**
 * Get status badge classes
 * @param {string} status - The status key
 * @param {string} variant - 'badge' | 'dot' | 'pill'
 * @returns {string} Tailwind class string
 */
export function getStatusClasses(status, variant = 'badge') {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
    const colors = STATUS_COLORS[normalizedStatus] || STATUS_COLORS.draft;

    switch (variant) {
        case 'dot':
            return colors.dot;
        case 'pill':
            return `${colors.bg} ${colors.text} px-2.5 py-0.5 rounded-full text-xs font-medium`;
        case 'badge':
        default:
            return `${colors.bg} ${colors.text} ${colors.border} border px-2 py-1 rounded text-xs font-medium`;
    }
}

/**
 * Get pipeline stage classes
 * @param {string} stage - The pipeline stage key
 * @returns {object} Object with bg, text, and header classes
 */
export function getPipelineClasses(stage) {
    const normalizedStage = stage?.toLowerCase().replace(/\s+/g, '_');
    return PIPELINE_COLORS[normalizedStage] || PIPELINE_COLORS.lead;
}

/**
 * Get priority classes
 * @param {string} priority - The priority key
 * @returns {string} Tailwind class string
 */
export function getPriorityClasses(priority) {
    const normalizedPriority = priority?.toLowerCase();
    const colors = PRIORITY_COLORS[normalizedPriority] || PRIORITY_COLORS.medium;
    return `${colors.bg} ${colors.text} ${colors.border} border px-2 py-1 rounded text-xs font-medium`;
}

/**
 * Get status hex color for inline styles
 * @param {string} status - The status key
 * @returns {string} Hex color code
 */
export function getStatusHex(status) {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
    const colors = STATUS_COLORS[normalizedStatus] || STATUS_COLORS.draft;
    return colors.hex || '#9CA3AF';
}

/**
 * Get full status color object
 * @param {string} status - The status key
 * @returns {object} Object with bg, text, border, dot, and hex properties
 */
export function getStatusColors(status) {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
    return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.draft;
}

/**
 * Status display labels (for consistent naming)
 */
export const STATUS_LABELS = {
    draft: 'Draft',
    sent: 'Sent',
    pending: 'Pending',
    viewed: 'Viewed',
    in_review: 'In Review',
    active: 'Active',
    in_progress: 'In Progress',
    confirmed: 'Confirmed',
    wrapped: 'Wrapped',
    closed: 'Closed',
    archived: 'Archived',
    approved: 'Approved',
    won: 'Won',
    paid: 'Paid',
    completed: 'Completed',
    on_hold: 'On Hold',
    overdue: 'Overdue',
    rejected: 'Rejected',
    lost: 'Lost',
    dead: 'Dead',
    cancelled: 'Cancelled',
    not_started: 'Not Started',
};

/**
 * Get display label for status
 * @param {string} status - The status key
 * @returns {string} Human-readable label
 */
export function getStatusLabel(status) {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
    return STATUS_LABELS[normalizedStatus] || status;
}
