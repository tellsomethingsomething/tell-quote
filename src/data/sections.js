// Quote sections and subsections structure
export const SECTIONS = {
    productionTeam: {
        id: 'productionTeam',
        name: 'Production Team',
        color: '#3B82F6', // Blue
        subsections: ['Production', 'Technical Crew', 'Production Management'],
    },
    productionEquipment: {
        id: 'productionEquipment',
        name: 'Production Equipment',
        color: '#06B6D4', // Cyan
        subsections: ['Video', 'Audio', 'Cameras', 'Graphics', 'VT', 'Cabling', 'Other'],
    },
    creative: {
        id: 'creative',
        name: 'Creative',
        color: '#EC4899', // Pink
        subsections: ['Services'], // Flat structure
    },
    logistics: {
        id: 'logistics',
        name: 'Logistics',
        color: '#F59E0B', // Amber
        subsections: ['Services'], // Flat structure
    },
    expenses: {
        id: 'expenses',
        name: 'Expenses',
        color: '#10B981', // Green
        subsections: ['Services'], // Flat structure
    },
};

// Get ordered array of sections
export const SECTION_ORDER = [
    'productionTeam',
    'productionEquipment',
    'creative',
    'logistics',
    'expenses',
];
