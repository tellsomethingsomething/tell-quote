import { useState } from 'react';
import ClientDetails from '../editor/ClientDetails';
import ProjectDetails from '../editor/ProjectDetails';
import FeesEditor from '../editor/FeesEditor';
import Section from '../editor/Section';
import { useQuoteStore } from '../../store/quoteStore';
import { useProjectStore } from '../../store/projectStore';
import { SECTION_ORDER } from '../../data/sections';

export default function EditorPanel({ onGoToSettings, onConvertToProject }) {
    const quote = useQuoteStore(state => state.quote);
    const sectionOrder = quote.sectionOrder || SECTION_ORDER;
    const quoteStatus = quote.status;
    const isLocked = quoteStatus === 'sent' || quoteStatus === 'won';
    const createFromQuote = useProjectStore(state => state.createFromQuote);
    const [converting, setConverting] = useState(false);

    const handleConvertToProject = async () => {
        if (converting) return;
        setConverting(true);
        try {
            const project = await createFromQuote(quote);
            if (project && onConvertToProject) {
                onConvertToProject(project.id);
            }
        } catch (e) {
            console.error('Failed to convert quote to project:', e);
            alert('Failed to create project. Please try again.');
        } finally {
            setConverting(false);
        }
    };

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

            {/* Convert to Project Banner - Show when quote is won */}
            {quoteStatus === 'won' && !quote.projectId && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-green-400">Quote Won!</p>
                            <p className="text-xs text-gray-400">
                                Ready to start the project? Convert this quote to a project to begin tracking.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleConvertToProject}
                        disabled={converting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                    >
                        {converting ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Converting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Convert to Project
                            </>
                        )}
                    </button>
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
