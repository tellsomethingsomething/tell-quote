import { Document } from '@react-pdf/renderer';

// Sub-components
import MainPage from './callsheet/MainPage';
import CrewPage from './callsheet/CrewPage';
import CastSafetyPage from './callsheet/CastSafetyPage';
import TravelPage from './callsheet/TravelPage';
import TechnicalPage from './callsheet/TechnicalPage';
import ContactsPage from './callsheet/ContactsPage';

// Main PDF Component
export default function CallSheetPDF({
    sheet,
    crew = [],
    cast = [],
    settings = {},
    // New enhanced props
    flights = [],
    transfers = [],
    accommodation = [],
    vehicles = [],
    technical = null,
    vendors = [],
    emergencyContacts = [],
}) {
    const enabledSections = sheet.enabledSections || {};
    const companyName = settings.companyName || settings.company?.name || 'Your Company';

    // Check if we have travel/logistics data
    const hasTravel = flights.length > 0 || transfers.length > 0 || accommodation.length > 0;
    const hasTechnical = technical && (technical.cameraPositions?.length > 0 || technical.commsSetup || technical.powerRequirements);

    // Check if cast/safety page should be shown
    const showCastSafetyPage = (enabledSections.cast && cast.length > 0) || (enabledSections.safety && (sheet.hospitalName || sheet.safetyNotes));

    // Check if contacts page should be shown
    const showContactsPage = vendors.length > 0 || emergencyContacts.length > 0;

    return (
        <Document>
            {/* Page 1 - Main Call Sheet */}
            <MainPage
                sheet={sheet}
                companyName={companyName}
            />

            {/* Page 2 - Crew List */}
            {(enabledSections.crew !== false) && crew.length > 0 && (
                <CrewPage
                    sheet={sheet}
                    crew={crew}
                    companyName={companyName}
                />
            )}

            {/* Page 3 - Cast & Safety */}
            {showCastSafetyPage && (
                <CastSafetyPage
                    sheet={sheet}
                    cast={cast}
                    companyName={companyName}
                />
            )}

            {/* Page 4 - Travel & Logistics */}
            {hasTravel && (
                <TravelPage
                    sheet={sheet}
                    flights={flights}
                    transfers={transfers}
                    accommodation={accommodation}
                    vehicles={vehicles}
                    companyName={companyName}
                />
            )}

            {/* Page 5 - Technical Plan */}
            {hasTechnical && (
                <TechnicalPage
                    sheet={sheet}
                    technical={technical}
                    companyName={companyName}
                />
            )}

            {/* Page 6 - Vendors & Emergency Contacts */}
            {showContactsPage && (
                <ContactsPage
                    sheet={sheet}
                    vendors={vendors}
                    emergencyContacts={emergencyContacts}
                    companyName={companyName}
                />
            )}
        </Document>
    );
}
