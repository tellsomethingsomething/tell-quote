// Pricing database with regional pricing
// Each item has costs per region in local currency

// Regional pricing structure:
// MALAYSIA: MYR, SEA: USD, GULF: USD, CENTRAL_ASIA: USD

export const PRICING_DATABASE = {
    productionCrew: [
        // Production
        {
            name: 'Technical Director',
            subsection: 'Production',
            pricing: {
                MALAYSIA: { cost: 1800, charge: 2600 },      // MYR
                SEA: { cost: 450, charge: 650 },              // USD
                GULF: { cost: 550, charge: 800 },             // USD
                CENTRAL_ASIA: { cost: 400, charge: 600 },     // USD
            }
        },
        {
            name: 'Project Manager',
            subsection: 'Production',
            pricing: {
                MALAYSIA: { cost: 1600, charge: 2400 },
                SEA: { cost: 400, charge: 600 },
                GULF: { cost: 500, charge: 750 },
                CENTRAL_ASIA: { cost: 350, charge: 550 },
            }
        },
        {
            name: 'Production Coordinator',
            subsection: 'Production',
            pricing: {
                MALAYSIA: { cost: 800, charge: 1280 },
                SEA: { cost: 200, charge: 320 },
                GULF: { cost: 280, charge: 420 },
                CENTRAL_ASIA: { cost: 180, charge: 280 },
            }
        },
        {
            name: 'Floor Manager',
            subsection: 'Production',
            pricing: {
                MALAYSIA: { cost: 1000, charge: 1520 },
                SEA: { cost: 250, charge: 380 },
                GULF: { cost: 320, charge: 480 },
                CENTRAL_ASIA: { cost: 220, charge: 340 },
            }
        },
        {
            name: 'Runner',
            subsection: 'Production',
            pricing: {
                MALAYSIA: { cost: 320, charge: 600 },
                SEA: { cost: 80, charge: 150 },
                GULF: { cost: 120, charge: 200 },
                CENTRAL_ASIA: { cost: 60, charge: 120 },
            }
        },
        // Camera
        {
            name: 'Camera Operator',
            subsection: 'Camera',
            pricing: {
                MALAYSIA: { cost: 1120, charge: 1600 },
                SEA: { cost: 280, charge: 400 },
                GULF: { cost: 380, charge: 550 },
                CENTRAL_ASIA: { cost: 250, charge: 380 },
            }
        },
        {
            name: 'Camera Supervisor',
            subsection: 'Camera',
            pricing: {
                MALAYSIA: { cost: 1520, charge: 2200 },
                SEA: { cost: 380, charge: 550 },
                GULF: { cost: 480, charge: 700 },
                CENTRAL_ASIA: { cost: 350, charge: 520 },
            }
        },
        {
            name: 'Jib Operator',
            subsection: 'Camera',
            pricing: {
                MALAYSIA: { cost: 1400, charge: 2000 },
                SEA: { cost: 350, charge: 500 },
                GULF: { cost: 450, charge: 650 },
                CENTRAL_ASIA: { cost: 320, charge: 480 },
            }
        },
        {
            name: 'Steadicam Operator',
            subsection: 'Camera',
            pricing: {
                MALAYSIA: { cost: 1800, charge: 2600 },
                SEA: { cost: 450, charge: 650 },
                GULF: { cost: 580, charge: 850 },
                CENTRAL_ASIA: { cost: 400, charge: 600 },
            }
        },
        // Technical
        {
            name: 'Vision Mixer',
            subsection: 'Technical',
            pricing: {
                MALAYSIA: { cost: 1400, charge: 2000 },
                SEA: { cost: 350, charge: 500 },
                GULF: { cost: 450, charge: 650 },
                CENTRAL_ASIA: { cost: 320, charge: 480 },
            }
        },
        {
            name: 'Replay/EVS Operator',
            subsection: 'Technical',
            pricing: {
                MALAYSIA: { cost: 1600, charge: 2320 },
                SEA: { cost: 400, charge: 580 },
                GULF: { cost: 520, charge: 750 },
                CENTRAL_ASIA: { cost: 380, charge: 550 },
            }
        },
        {
            name: 'LED Technician',
            subsection: 'Technical',
            pricing: {
                MALAYSIA: { cost: 1200, charge: 1760 },
                SEA: { cost: 300, charge: 440 },
                GULF: { cost: 400, charge: 580 },
                CENTRAL_ASIA: { cost: 280, charge: 420 },
            }
        },
        // Audio
        {
            name: 'Sound Engineer',
            subsection: 'Audio',
            pricing: {
                MALAYSIA: { cost: 1280, charge: 1920 },
                SEA: { cost: 320, charge: 480 },
                GULF: { cost: 420, charge: 620 },
                CENTRAL_ASIA: { cost: 300, charge: 450 },
            }
        },
        {
            name: 'Audio Mixer',
            subsection: 'Audio',
            pricing: {
                MALAYSIA: { cost: 1400, charge: 2080 },
                SEA: { cost: 350, charge: 520 },
                GULF: { cost: 450, charge: 680 },
                CENTRAL_ASIA: { cost: 320, charge: 500 },
            }
        },
        // Talent
        {
            name: 'Sports Presenter',
            subsection: 'Talent',
            pricing: {
                MALAYSIA: { cost: 2000, charge: 3200 },
                SEA: { cost: 500, charge: 800 },
                GULF: { cost: 700, charge: 1100 },
                CENTRAL_ASIA: { cost: 450, charge: 750 },
            }
        },
        {
            name: 'Stadium Announcer',
            subsection: 'Talent',
            pricing: {
                MALAYSIA: { cost: 1200, charge: 2000 },
                SEA: { cost: 300, charge: 500 },
                GULF: { cost: 400, charge: 650 },
                CENTRAL_ASIA: { cost: 280, charge: 450 },
            }
        },
        {
            name: 'Pitch Reporter',
            subsection: 'Talent',
            pricing: {
                MALAYSIA: { cost: 1600, charge: 2600 },
                SEA: { cost: 400, charge: 650 },
                GULF: { cost: 550, charge: 900 },
                CENTRAL_ASIA: { cost: 380, charge: 620 },
            }
        },
    ],

    technicalCrew: [
        // Engineering
        {
            name: 'Broadcast Engineer',
            subsection: 'Engineering',
            pricing: {
                MALAYSIA: { cost: 1600, charge: 2400 },
                SEA: { cost: 400, charge: 600 },
                GULF: { cost: 520, charge: 780 },
                CENTRAL_ASIA: { cost: 380, charge: 570 },
            }
        },
        {
            name: 'RF Engineer',
            subsection: 'Engineering',
            pricing: {
                MALAYSIA: { cost: 1400, charge: 2080 },
                SEA: { cost: 350, charge: 520 },
                GULF: { cost: 460, charge: 680 },
                CENTRAL_ASIA: { cost: 330, charge: 500 },
            }
        },
        // Graphics
        {
            name: 'Graphics Operator',
            subsection: 'Graphics',
            pricing: {
                MALAYSIA: { cost: 1200, charge: 1800 },
                SEA: { cost: 300, charge: 450 },
                GULF: { cost: 400, charge: 600 },
                CENTRAL_ASIA: { cost: 280, charge: 420 },
            }
        },
        // Streaming
        {
            name: 'Streaming Engineer',
            subsection: 'Streaming',
            pricing: {
                MALAYSIA: { cost: 1400, charge: 2080 },
                SEA: { cost: 350, charge: 520 },
                GULF: { cost: 460, charge: 680 },
                CENTRAL_ASIA: { cost: 330, charge: 500 },
            }
        },
        // Comms
        {
            name: 'Comms Technician',
            subsection: 'Comms',
            pricing: {
                MALAYSIA: { cost: 1000, charge: 1520 },
                SEA: { cost: 250, charge: 380 },
                GULF: { cost: 340, charge: 500 },
                CENTRAL_ASIA: { cost: 230, charge: 360 },
            }
        },
    ],

    productionEquipment: [
        // Camera
        {
            name: 'Broadcast Camera Kit',
            subsection: 'Camera',
            pricing: {
                MALAYSIA: { cost: 1600, charge: 2400 },
                SEA: { cost: 400, charge: 600 },
                GULF: { cost: 500, charge: 750 },
                CENTRAL_ASIA: { cost: 380, charge: 570 },
            }
        },
        {
            name: 'Jib Crane System',
            subsection: 'Camera',
            pricing: {
                MALAYSIA: { cost: 2000, charge: 3000 },
                SEA: { cost: 500, charge: 750 },
                GULF: { cost: 650, charge: 980 },
                CENTRAL_ASIA: { cost: 480, charge: 720 },
            }
        },
        {
            name: 'Steadicam Rig',
            subsection: 'Camera',
            pricing: {
                MALAYSIA: { cost: 2400, charge: 3600 },
                SEA: { cost: 600, charge: 900 },
                GULF: { cost: 780, charge: 1170 },
                CENTRAL_ASIA: { cost: 580, charge: 870 },
            }
        },
        // Vision
        {
            name: 'Vision Mixer (8 input)',
            subsection: 'Vision',
            pricing: {
                MALAYSIA: { cost: 1200, charge: 1800 },
                SEA: { cost: 300, charge: 450 },
                GULF: { cost: 400, charge: 600 },
                CENTRAL_ASIA: { cost: 280, charge: 420 },
            }
        },
        {
            name: 'Vision Mixer (16 input)',
            subsection: 'Vision',
            pricing: {
                MALAYSIA: { cost: 2000, charge: 3000 },
                SEA: { cost: 500, charge: 750 },
                GULF: { cost: 650, charge: 980 },
                CENTRAL_ASIA: { cost: 480, charge: 720 },
            }
        },
        {
            name: 'Replay System (4ch)',
            subsection: 'Vision',
            pricing: {
                MALAYSIA: { cost: 3200, charge: 4800 },
                SEA: { cost: 800, charge: 1200 },
                GULF: { cost: 1000, charge: 1500 },
                CENTRAL_ASIA: { cost: 760, charge: 1140 },
            }
        },
        // Audio
        {
            name: 'Wireless Microphone',
            subsection: 'Audio',
            pricing: {
                MALAYSIA: { cost: 240, charge: 400 },
                SEA: { cost: 60, charge: 100 },
                GULF: { cost: 80, charge: 130 },
                CENTRAL_ASIA: { cost: 55, charge: 95 },
            }
        },
        {
            name: 'Audio Mixer (32ch)',
            subsection: 'Audio',
            pricing: {
                MALAYSIA: { cost: 800, charge: 1200 },
                SEA: { cost: 200, charge: 300 },
                GULF: { cost: 260, charge: 400 },
                CENTRAL_ASIA: { cost: 190, charge: 290 },
            }
        },
        // Comms
        {
            name: 'Intercom System',
            subsection: 'Comms',
            pricing: {
                MALAYSIA: { cost: 800, charge: 1400 },
                SEA: { cost: 200, charge: 350 },
                GULF: { cost: 260, charge: 460 },
                CENTRAL_ASIA: { cost: 190, charge: 340 },
            }
        },
        {
            name: 'Wireless Beltpack',
            subsection: 'Comms',
            pricing: {
                MALAYSIA: { cost: 180, charge: 300 },
                SEA: { cost: 45, charge: 75 },
                GULF: { cost: 60, charge: 100 },
                CENTRAL_ASIA: { cost: 42, charge: 72 },
            }
        },
        // Streaming
        {
            name: 'Streaming Encoder',
            subsection: 'Streaming',
            pricing: {
                MALAYSIA: { cost: 600, charge: 1000 },
                SEA: { cost: 150, charge: 250 },
                GULF: { cost: 200, charge: 330 },
                CENTRAL_ASIA: { cost: 140, charge: 240 },
            }
        },
        {
            name: 'Bonded Cellular Unit',
            subsection: 'Streaming',
            pricing: {
                MALAYSIA: { cost: 800, charge: 1400 },
                SEA: { cost: 200, charge: 350 },
                GULF: { cost: 260, charge: 460 },
                CENTRAL_ASIA: { cost: 190, charge: 340 },
            }
        },
        // Infrastructure
        {
            name: 'SDI Cable Run (100m)',
            subsection: 'Infrastructure',
            pricing: {
                MALAYSIA: { cost: 200, charge: 320 },
                SEA: { cost: 50, charge: 80 },
                GULF: { cost: 65, charge: 105 },
                CENTRAL_ASIA: { cost: 48, charge: 78 },
            }
        },
        {
            name: 'Fibre Run (500m)',
            subsection: 'Infrastructure',
            pricing: {
                MALAYSIA: { cost: 600, charge: 960 },
                SEA: { cost: 150, charge: 240 },
                GULF: { cost: 195, charge: 315 },
                CENTRAL_ASIA: { cost: 144, charge: 234 },
            }
        },
    ],

    creative: [
        // Graphics
        {
            name: 'Match Graphics Package',
            subsection: 'Graphics',
            pricing: {
                MALAYSIA: { cost: 6000, charge: 10000 },
                SEA: { cost: 1500, charge: 2500 },
                GULF: { cost: 2000, charge: 3300 },
                CENTRAL_ASIA: { cost: 1400, charge: 2400 },
            }
        },
        {
            name: 'Lower Thirds Package',
            subsection: 'Graphics',
            pricing: {
                MALAYSIA: { cost: 2000, charge: 3400 },
                SEA: { cost: 500, charge: 850 },
                GULF: { cost: 650, charge: 1100 },
                CENTRAL_ASIA: { cost: 480, charge: 820 },
            }
        },
        // Motion
        {
            name: 'Opening Titles',
            subsection: 'Motion',
            pricing: {
                MALAYSIA: { cost: 3200, charge: 6000 },
                SEA: { cost: 800, charge: 1500 },
                GULF: { cost: 1050, charge: 2000 },
                CENTRAL_ASIA: { cost: 760, charge: 1440 },
            }
        },
        {
            name: 'Transition Pack',
            subsection: 'Motion',
            pricing: {
                MALAYSIA: { cost: 1600, charge: 2800 },
                SEA: { cost: 400, charge: 700 },
                GULF: { cost: 520, charge: 920 },
                CENTRAL_ASIA: { cost: 380, charge: 680 },
            }
        },
        // Post
        {
            name: 'Highlight Edit',
            subsection: 'Post',
            pricing: {
                MALAYSIA: { cost: 800, charge: 1400 },
                SEA: { cost: 200, charge: 350 },
                GULF: { cost: 260, charge: 460 },
                CENTRAL_ASIA: { cost: 190, charge: 340 },
            }
        },
        {
            name: 'Match Edit (Full)',
            subsection: 'Post',
            pricing: {
                MALAYSIA: { cost: 2400, charge: 4000 },
                SEA: { cost: 600, charge: 1000 },
                GULF: { cost: 780, charge: 1300 },
                CENTRAL_ASIA: { cost: 580, charge: 960 },
            }
        },
        // LED
        {
            name: 'LED Screen Content',
            subsection: 'LED',
            pricing: {
                MALAYSIA: { cost: 2000, charge: 3400 },
                SEA: { cost: 500, charge: 850 },
                GULF: { cost: 650, charge: 1100 },
                CENTRAL_ASIA: { cost: 480, charge: 820 },
            }
        },
    ],

    logistics: [
        // Flights
        {
            name: 'International Flight (Economy)',
            subsection: 'Flights',
            pricing: {
                MALAYSIA: { cost: 1800, charge: 2000 },
                SEA: { cost: 400, charge: 450 },
                GULF: { cost: 600, charge: 680 },
                CENTRAL_ASIA: { cost: 550, charge: 620 },
            }
        },
        {
            name: 'International Flight (Business)',
            subsection: 'Flights',
            pricing: {
                MALAYSIA: { cost: 8000, charge: 9000 },
                SEA: { cost: 2000, charge: 2250 },
                GULF: { cost: 2800, charge: 3150 },
                CENTRAL_ASIA: { cost: 2500, charge: 2800 },
            }
        },
        {
            name: 'Domestic Flight',
            subsection: 'Flights',
            pricing: {
                MALAYSIA: { cost: 400, charge: 500 },
                SEA: { cost: 100, charge: 125 },
                GULF: { cost: 150, charge: 190 },
                CENTRAL_ASIA: { cost: 120, charge: 150 },
            }
        },
        // Accommodation
        {
            name: 'Hotel (Standard)',
            subsection: 'Accommodation',
            pricing: {
                MALAYSIA: { cost: 350, charge: 450 },
                SEA: { cost: 80, charge: 100 },
                GULF: { cost: 120, charge: 150 },
                CENTRAL_ASIA: { cost: 70, charge: 90 },
            }
        },
        {
            name: 'Hotel (Premium)',
            subsection: 'Accommodation',
            pricing: {
                MALAYSIA: { cost: 700, charge: 850 },
                SEA: { cost: 160, charge: 200 },
                GULF: { cost: 250, charge: 310 },
                CENTRAL_ASIA: { cost: 140, charge: 175 },
            }
        },
        // Ground Transport
        {
            name: 'Airport Transfer',
            subsection: 'Ground Transport',
            pricing: {
                MALAYSIA: { cost: 180, charge: 220 },
                SEA: { cost: 40, charge: 50 },
                GULF: { cost: 60, charge: 75 },
                CENTRAL_ASIA: { cost: 35, charge: 45 },
            }
        },
        {
            name: 'Daily Vehicle Hire',
            subsection: 'Ground Transport',
            pricing: {
                MALAYSIA: { cost: 450, charge: 550 },
                SEA: { cost: 100, charge: 125 },
                GULF: { cost: 150, charge: 190 },
                CENTRAL_ASIA: { cost: 90, charge: 115 },
            }
        },
        {
            name: 'Crew Van (12-seater)',
            subsection: 'Ground Transport',
            pricing: {
                MALAYSIA: { cost: 700, charge: 850 },
                SEA: { cost: 160, charge: 200 },
                GULF: { cost: 220, charge: 280 },
                CENTRAL_ASIA: { cost: 140, charge: 180 },
            }
        },
        // Freight
        {
            name: 'Equipment Freight (per kg)',
            subsection: 'Freight',
            pricing: {
                MALAYSIA: { cost: 10, charge: 14 },
                SEA: { cost: 2.5, charge: 3.5 },
                GULF: { cost: 4, charge: 5.5 },
                CENTRAL_ASIA: { cost: 5, charge: 7 },
            }
        },
        {
            name: 'Customs Clearance',
            subsection: 'Freight',
            pricing: {
                MALAYSIA: { cost: 1000, charge: 1400 },
                SEA: { cost: 250, charge: 350 },
                GULF: { cost: 400, charge: 560 },
                CENTRAL_ASIA: { cost: 350, charge: 490 },
            }
        },
        // Subsistence
        {
            name: 'Per Diem',
            subsection: 'Subsistence',
            pricing: {
                MALAYSIA: { cost: 200, charge: 240 },
                SEA: { cost: 50, charge: 60 },
                GULF: { cost: 80, charge: 95 },
                CENTRAL_ASIA: { cost: 45, charge: 55 },
            }
        },
    ],

    expenses: [
        // Contingency
        {
            name: 'Contingency (5%)',
            subsection: 'Contingency',
            isPercentage: true,
            percentValue: 5,
            pricing: {
                MALAYSIA: { cost: 0, charge: 0 },
                SEA: { cost: 0, charge: 0 },
                GULF: { cost: 0, charge: 0 },
                CENTRAL_ASIA: { cost: 0, charge: 0 },
            }
        },
        {
            name: 'Contingency (10%)',
            subsection: 'Contingency',
            isPercentage: true,
            percentValue: 10,
            pricing: {
                MALAYSIA: { cost: 0, charge: 0 },
                SEA: { cost: 0, charge: 0 },
                GULF: { cost: 0, charge: 0 },
                CENTRAL_ASIA: { cost: 0, charge: 0 },
            }
        },
        // Insurance
        {
            name: 'Production Insurance',
            subsection: 'Insurance',
            pricing: {
                MALAYSIA: { cost: 800, charge: 1000 },
                SEA: { cost: 200, charge: 250 },
                GULF: { cost: 300, charge: 375 },
                CENTRAL_ASIA: { cost: 180, charge: 230 },
            }
        },
        {
            name: 'Equipment Insurance',
            subsection: 'Insurance',
            pricing: {
                MALAYSIA: { cost: 1200, charge: 1500 },
                SEA: { cost: 300, charge: 375 },
                GULF: { cost: 450, charge: 560 },
                CENTRAL_ASIA: { cost: 280, charge: 350 },
            }
        },
        // Admin
        {
            name: 'Visa Processing',
            subsection: 'Admin',
            pricing: {
                MALAYSIA: { cost: 300, charge: 400 },
                SEA: { cost: 80, charge: 100 },
                GULF: { cost: 120, charge: 150 },
                CENTRAL_ASIA: { cost: 100, charge: 130 },
            }
        },
        {
            name: 'Work Permit',
            subsection: 'Admin',
            pricing: {
                MALAYSIA: { cost: 800, charge: 1000 },
                SEA: { cost: 200, charge: 250 },
                GULF: { cost: 350, charge: 440 },
                CENTRAL_ASIA: { cost: 250, charge: 320 },
            }
        },
        {
            name: 'Admin Fee',
            subsection: 'Admin',
            pricing: {
                MALAYSIA: { cost: 400, charge: 600 },
                SEA: { cost: 100, charge: 150 },
                GULF: { cost: 150, charge: 225 },
                CENTRAL_ASIA: { cost: 95, charge: 145 },
            }
        },
    ],
};

// Helper to get items by section and subsection
export function getItemsBySubsection(sectionId, subsection) {
    const sectionItems = PRICING_DATABASE[sectionId] || [];
    return sectionItems.filter(item => item.subsection === subsection);
}

// Helper to get all items in a section
export function getItemsBySection(sectionId) {
    return PRICING_DATABASE[sectionId] || [];
}

// Helper to search items across all sections
export function searchItems(query) {
    const results = [];
    const searchLower = query.toLowerCase();

    Object.keys(PRICING_DATABASE).forEach(sectionId => {
        PRICING_DATABASE[sectionId].forEach(item => {
            if (item.name.toLowerCase().includes(searchLower)) {
                results.push({ ...item, sectionId });
            }
        });
    });

    return results;
}
