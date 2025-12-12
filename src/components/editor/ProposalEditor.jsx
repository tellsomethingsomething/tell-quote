import { useState, useEffect } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useSettingsStore } from '../../store/settingsStore';
import { generateAIProposal, generateFallbackProposal, gatherQuoteContext } from '../../utils/proposalGenerator';
import { SECTION_ORDER, SECTIONS } from '../../data/sections';

export default function ProposalEditor() {
    const { quote, setProposal } = useQuoteStore();
    const { settings } = useSettingsStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');

    const proposal = quote.proposal || {};
    const hasAnthropicKey = !!settings.aiSettings?.anthropicKey;

    // Proposal inputs
    const [context, setContext] = useState(proposal.proposalInputs?.context || '');
    const [keyPoints, setKeyPoints] = useState(proposal.proposalInputs?.keyPoints || '');
    const [tone, setTone] = useState(proposal.proposalInputs?.tone || '');

    // Sync state when quote changes
    useEffect(() => {
        setContext(proposal.proposalInputs?.context || '');
        setKeyPoints(proposal.proposalInputs?.keyPoints || '');
        setTone(proposal.proposalInputs?.tone || '');
    }, [proposal.proposalInputs]);

    // Save proposal inputs when they change
    const saveProposalInputs = (updates) => {
        const currentInputs = quote.proposal?.proposalInputs || {};
        setProposal({
            proposalInputs: { ...currentInputs, ...updates }
        });
    };

    // Get services list for display
    const servicesList = [];
    SECTION_ORDER.forEach(sectionId => {
        const section = quote.sections[sectionId];
        const config = SECTIONS[sectionId];
        if (!section) return;
        const hasItems = Object.values(section.subsections || {}).some(
            items => Array.isArray(items) && items.length > 0
        );
        if (hasItems) {
            servicesList.push(config.name);
        }
    });

    const handleGenerateProposal = async () => {
        setIsGenerating(true);

        // Save current inputs
        saveProposalInputs({ context, keyPoints, tone });

        try {
            let proposalText = '';

            if (hasAnthropicKey) {
                const result = await generateAIProposal(
                    quote,
                    quote.currency,
                    settings,
                    settings.aiSettings.anthropicKey,
                    { context, keyPoints, tone } // Pass the inputs
                );
                proposalText = result.fullText;
            } else {
                const quoteContext = gatherQuoteContext(quote, quote.currency, settings);
                const result = generateFallbackProposal(quoteContext);
                proposalText = result.fullText;
            }

            setProposal({ proposalText, isGenerated: true });
        } catch (err) {
            console.error('Proposal generation failed:', err);
            // Use fallback
            const quoteContext = gatherQuoteContext(quote, quote.currency, settings);
            const result = generateFallbackProposal(quoteContext);
            setProposal({ proposalText: result.fullText, isGenerated: true });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStartEdit = () => {
        setEditText(proposal.proposalText || '');
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        setProposal({ proposalText: editText });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText('');
    };

    const handleClearProposal = () => {
        setProposal({ proposalText: '', isGenerated: false });
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Proposal / Executive Summary
                <span className="text-xs text-gray-500 font-normal ml-auto">Page 2</span>
            </h3>

            <div className="space-y-5">
                {/* Context / Brief */}
                <div>
                    <label className="label">Context / Brief</label>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        onBlur={() => saveProposalInputs({ context })}
                        placeholder="Describe the project scope, what the client needs, background info..."
                        className="input h-20 resize-none"
                    />
                </div>

                {/* Key Points */}
                <div>
                    <label className="label">Key Points to Emphasize</label>
                    <textarea
                        value={keyPoints}
                        onChange={(e) => setKeyPoints(e.target.value)}
                        onBlur={() => saveProposalInputs({ keyPoints })}
                        placeholder="What should be highlighted? Experience, capabilities, unique selling points..."
                        className="input h-20 resize-none"
                    />
                </div>

                {/* Tone */}
                <div>
                    <label className="label">Tone / Style</label>
                    <input
                        type="text"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        onBlur={() => saveProposalInputs({ tone })}
                        placeholder="e.g., Professional, Friendly, Technical, Confident..."
                        className="input"
                    />
                </div>

                {/* Services Preview */}
                {servicesList.length > 0 && (
                    <div>
                        <label className="label">Services Included (from quote)</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {servicesList.map((service, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-xs">
                                    {service}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* API Status */}
                {!hasAnthropicKey && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
                        <span className="font-medium">Anthropic API Key Required</span>
                        <p className="text-amber-400/70 mt-1">Add your key in Settings for AI-generated proposals.</p>
                    </div>
                )}

                {hasAnthropicKey && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-400">
                        <span className="font-medium">AI Generation Ready</span>
                        <p className="text-green-400/70 mt-1">Claude will use client, project, kit details + your inputs above.</p>
                    </div>
                )}

                {/* Generated Proposal Content */}
                {isEditing ? (
                    <div className="space-y-3">
                        <label className="label">Edit Proposal</label>
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="input h-48 resize-y font-mono text-xs"
                            placeholder="Enter your proposal text here..."
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={handleCancelEdit} className="btn-ghost text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSaveEdit} className="btn-primary text-sm">
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : proposal.proposalText ? (
                    <div>
                        <label className="label">Generated Proposal</label>
                        <div className="bg-slate-800/50 border border-dark-border rounded-lg p-4 mt-1 max-h-48 overflow-y-auto">
                            {proposal.proposalText.split('\n\n').map((para, idx) => (
                                <p key={idx} className="text-gray-300 text-xs leading-relaxed mb-2 last:mb-0">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateProposal}
                        disabled={isGenerating || isEditing}
                        className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                {proposal.proposalText ? 'Regenerate' : 'Generate'} Proposal
                            </>
                        )}
                    </button>

                    {proposal.proposalText && !isEditing && (
                        <>
                            <button
                                onClick={handleStartEdit}
                                className="btn-ghost text-sm px-3"
                                title="Edit proposal"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleClearProposal}
                                className="btn-ghost text-sm px-3"
                                title="Clear proposal"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
