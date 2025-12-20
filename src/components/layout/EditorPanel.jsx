import ClientDetails from '../editor/ClientDetails';
import ProjectDetails from '../editor/ProjectDetails';
import FeesEditor from '../editor/FeesEditor';
import Section from '../editor/Section';
import { useQuoteStore } from '../../store/quoteStore';
import { SECTION_ORDER } from '../../data/sections';

export default function EditorPanel({ onGoToSettings }) {
    const sectionOrder = useQuoteStore(state => state.quote.sectionOrder || SECTION_ORDER);
    const quoteStatus = useQuoteStore(state => state.quote.status);
    const isLocked = quoteStatus === 'sent' || quoteStatus === 'won';

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-60px)]">
            {/* Locked Banner */}
            {isLocked && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-amber-400">Quote Locked</p>
                        <p className="text-xs text-gray-400">
                            This quote is {quoteStatus === 'sent' ? 'sent to the client' : 'marked as won'} and cannot be edited.
                            To make changes, change the status to Draft first.
                        </p>
                    </div>
                </div>
            )}

            {/* Client & Project Details */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${isLocked ? 'pointer-events-none opacity-70' : ''}`}>
                <ClientDetails />
                <ProjectDetails onGoToSettings={onGoToSettings} />
            </div>

            {/* Fees & Adjustments */}
            <div className={isLocked ? 'pointer-events-none opacity-70' : ''}>
                <FeesEditor />
            </div>

            {/* Sections */}
            <div className={`space-y-2 ${isLocked ? 'pointer-events-none opacity-70' : ''}`}>
                {sectionOrder.map((sectionId, index) => (
                    <Section
                        key={sectionId}
                        sectionId={sectionId}
                        index={index}
                        totalSections={sectionOrder.length}
                    />
                ))}
            </div>
        </div>
    );
}
