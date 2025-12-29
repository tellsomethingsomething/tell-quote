// Helper to format date
export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// Helper to format time
export const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr;
};

// Group crew by department
export const groupCrewByDepartment = (crew) => {
    const grouped = {};
    crew.forEach(member => {
        const dept = member.department || 'other';
        if (!grouped[dept]) grouped[dept] = [];
        grouped[dept].push(member);
    });
    return grouped;
};
