import ClientDetails from '../editor/ClientDetails';
import ProjectDetails from '../editor/ProjectDetails';
import FeesEditor from '../editor/FeesEditor';
import Section from '../editor/Section';
import { SECTION_ORDER } from '../../data/sections';

export default function EditorPanel({ onGoToSettings }) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-60px)]">
            {/* Client & Project Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ClientDetails />
                <ProjectDetails onGoToSettings={onGoToSettings} />
            </div>

            {/* Fees & Adjustments */}
            <FeesEditor />

            {/* Sections */}
            <div className="space-y-3">
                {SECTION_ORDER.map(sectionId => (
                    <Section key={sectionId} sectionId={sectionId} />
                ))}
            </div>
        </div>
    );
}
