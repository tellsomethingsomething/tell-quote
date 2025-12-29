import { useState } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useSettingsStore } from '../../store/settingsStore';
import { generateCoverImage, generateFallbackCover } from '../../utils/imageGenerator';
import { useFeatureAccess, FEATURES } from '../../hooks/useSubscription';
import { Zap, Lock } from 'lucide-react';

export default function TitlePageEditor() {
    const { quote, setProposal } = useQuoteStore();
    const { settings } = useSettingsStore();
    const { allowed: hasAIFeatures, message: aiUpgradeMessage } = useFeatureAccess(FEATURES.AI_FEATURES);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    // Prompt inputs
    const proposal = quote.proposal || {};
    const [sport, setSport] = useState(proposal.promptInputs?.sport || '');
    const [shot, setShot] = useState(proposal.promptInputs?.shot || '');
    const [notes, setNotes] = useState(proposal.promptInputs?.notes || '');

    const hasOpenAIKey = !!settings.aiSettings?.openaiKey;
    const hasAnthropicKey = !!settings.aiSettings?.anthropicKey;
    const canUseAI = hasAIFeatures && hasOpenAIKey;

    // Save prompt inputs when they change
    const savePromptInputs = (updates) => {
        const currentInputs = quote.proposal?.promptInputs || {};
        setProposal({
            promptInputs: { ...currentInputs, ...updates }
        });
    };

    const handleGenerateCover = async () => {
        setIsGenerating(true);
        setError('');

        // Save current inputs
        savePromptInputs({ sport, shot, notes });

        try {
            if (hasOpenAIKey) {
                // Pass prompt inputs along with project/client
                const projectWithPromptInputs = {
                    ...quote.project,
                    promptInputs: { sport, shot, notes }
                };

                const result = await generateCoverImage(
                    projectWithPromptInputs,
                    quote.client,
                    settings.aiSettings.openaiKey,
                    settings.aiSettings.anthropicKey
                );

                if (result.success) {
                    setProposal({ coverImage: result.imageData, isGenerated: true });
                } else {
                    setError(result.error || 'Failed to generate image');
                    // Use fallback
                    const fallback = generateFallbackCover();
                    setProposal({ coverImage: fallback, isGenerated: true });
                }
            } else {
                // Use gradient fallback
                const fallback = generateFallbackCover();
                setProposal({ coverImage: fallback, isGenerated: true });
            }
        } catch (err) {
            setError(err.message);
            const fallback = generateFallbackCover();
            setProposal({ coverImage: fallback, isGenerated: true });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClearCover = () => {
        setProposal({ coverImage: null, isGenerated: false });
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Title Page / Cover
                <span className="text-xs text-gray-500 font-normal ml-auto">Page 1</span>
            </h3>

            <div className="flex gap-4">
                {/* A4 Cover Preview */}
                <div className="w-[200px] min-w-[200px]">
                    <div className="relative w-full aspect-[1/1.414] bg-slate-800 rounded-lg overflow-hidden border border-dark-border">
                        {proposal.coverImage ? (
                            <>
                                <img
                                    src={proposal.coverImage}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay with text preview */}
                                <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-4">
                                    {/* Top - Logo */}
                                    <div className="flex items-start gap-1.5">
                                        {settings.company?.logo ? (
                                            <img src={settings.company.logo} alt="Logo" className="w-8 h-8 object-contain" />
                                        ) : (
                                            <div className="w-8 h-8 bg-accent-primary rounded flex items-center justify-center text-white text-[10px] font-bold">
                                                {settings.company?.name?.substring(0, 2).toUpperCase() || 'TP'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Center - Main Text */}
                                    <div className="text-center space-y-1">
                                        <h3 className="text-white font-bold text-sm leading-tight">
                                            {quote.project.title || 'Project Title'}
                                        </h3>
                                        <p className="text-accent-primary text-[8px] tracking-widest uppercase">
                                            Project Quote
                                        </p>
                                    </div>

                                    {/* Bottom - Date & Prepared By */}
                                    <div className="flex justify-between text-[7px] text-white/80">
                                        <div>
                                            <p>{quote.quoteDate || new Date().toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p>Prepared by {(() => {
                                                const user = settings.users?.find(u => u.id === quote.preparedBy);
                                                return user?.name || settings.company?.name || 'Your Name';
                                            })()}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-3">
                                <svg className="w-8 h-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-[9px] text-center">No cover image</p>
                                <p className="text-[8px] text-gray-600">A4 Format</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls & Prompt Inputs */}
                <div className="flex-1 space-y-5">
                    {/* Sport */}
                    <div>
                        <label className="label">Sport</label>
                        <input
                            type="text"
                            value={sport}
                            onChange={(e) => setSport(e.target.value)}
                            onBlur={() => savePromptInputs({ sport })}
                            placeholder="e.g., Football, Tennis, Formula 1, Cricket..."
                            className="input"
                        />
                    </div>

                    {/* Shot / Scene */}
                    <div>
                        <label className="label">Shot / Scene</label>
                        <input
                            type="text"
                            value={shot}
                            onChange={(e) => setShot(e.target.value)}
                            onBlur={() => savePromptInputs({ shot })}
                            placeholder="e.g., Stadium aerial, action close-up, broadcast setup..."
                            className="input"
                        />
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <label className="label">Additional Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={() => savePromptInputs({ notes })}
                            placeholder="Style, mood, colors, specific elements to include..."
                            className="input h-20 resize-none"
                        />
                    </div>

                    {/* AI Feature Status */}
                    {!hasAIFeatures && (
                        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-600/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <span className="font-medium text-white text-sm">AI Cover Images - Upgrade Required</span>
                                <p className="text-gray-400 text-xs mt-0.5">{aiUpgradeMessage || "Upgrade to Individual or Team plan for AI-generated covers."}</p>
                            </div>
                            <a href="/pricing" className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs rounded-lg hover:bg-brand-primary/90 transition-colors">
                                <Zap className="w-3.5 h-3.5" />
                                Upgrade
                            </a>
                        </div>
                    )}

                    {hasAIFeatures && !hasOpenAIKey && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
                            <span className="font-medium">OpenAI API Key Required</span>
                            <p className="text-amber-400/70 mt-1">Add your key in Settings → AI for AI-generated images.</p>
                        </div>
                    )}

                    {hasAIFeatures && hasOpenAIKey && !hasAnthropicKey && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
                            <span className="font-medium">Anthropic Key Recommended</span>
                            <p className="text-amber-400/70 mt-1">Add for smarter prompt generation via Claude Sonnet.</p>
                        </div>
                    )}

                    {canUseAI && hasAnthropicKey && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-400">
                            <span className="font-medium">AI Generation Ready</span>
                            <p className="text-green-400/70 mt-1">Claude Sonnet will optimize the DALL-E prompt.</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleGenerateCover}
                            disabled={isGenerating}
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
                                    {proposal.coverImage ? 'Regenerate' : 'Generate'} {canUseAI ? 'with AI' : 'Gradient'}
                                </>
                            )}
                        </button>

                        {proposal.coverImage && (
                            <button
                                onClick={handleClearCover}
                                className="btn-ghost text-sm px-3"
                                title="Clear cover image"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
