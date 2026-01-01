// Call sheet status options
export const CALL_SHEET_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

export const CALL_SHEET_STATUS_CONFIG = {
    [CALL_SHEET_STATUS.DRAFT]: {
        label: 'Draft',
        color: 'gray',
        bgClass: 'bg-gray-500/20',
        textClass: 'text-gray-400',
    },
    [CALL_SHEET_STATUS.PUBLISHED]: {
        label: 'Published',
        color: 'green',
        bgClass: 'bg-green-500/20',
        textClass: 'text-green-400',
    },
    [CALL_SHEET_STATUS.COMPLETED]: {
        label: 'Completed',
        color: 'blue',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
    },
    [CALL_SHEET_STATUS.CANCELLED]: {
        label: 'Cancelled',
        color: 'red',
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
    },
};

// Department options for call times
export const DEPARTMENTS = [
    { id: 'camera', name: 'Camera', color: '#3B82F6' },
    { id: 'sound', name: 'Sound', color: '#8B5CF6' },
    { id: 'lighting', name: 'Lighting', color: '#F59E0B' },
    { id: 'grip', name: 'Grip', color: '#6B7280' },
    { id: 'art', name: 'Art', color: '#EC4899' },
    { id: 'wardrobe', name: 'Wardrobe', color: '#14B8A6' },
    { id: 'makeup', name: 'Hair & Makeup', color: '#F43F5E' },
    { id: 'production', name: 'Production', color: '#10B981' },
    { id: 'transport', name: 'Transport', color: '#64748B' },
    { id: 'catering', name: 'Catering', color: '#F97316' },
];
