import { useState, useEffect, useMemo } from 'react';
import { useKnowledgeStore, FRAGMENT_TYPES, AGENTS } from '../store/knowledgeStore';
import { useTimelineStore } from '../store/timelineStore';
import { REGIONS } from '../store/opportunityStore';
import ResearcherTimeline from '../components/timeline/ResearcherTimeline';

// Tag input component
function TagInput({ tags, onChange, placeholder = "Add tags..." }) {
    const [input, setInput] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = input.trim().toLowerCase();
            if (tag && !tags.includes(tag)) {
                onChange([...tags, tag]);
            }
            setInput('');
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap gap-1.5 p-2 bg-dark-card border border-dark-border rounded-lg min-h-[44px]">
            {tags.map(tag => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-teal/20 text-brand-teal text-xs rounded"
                >
                    {tag}
                    <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-white"
                    >
                        ×
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm text-gray-100 placeholder-gray-500"
            />
        </div>
    );
}

// Quick capture widget
function QuickCapture({ onAdd }) {
    const [content, setContent] = useState('');
    const [type, setType] = useState(FRAGMENT_TYPES.MARKET_INSIGHT);
    const [tags, setTags] = useState([]);
    const [region, setRegion] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        await onAdd({
            type,
            content: content.trim(),
            tags,
            region: region || null,
            source: 'human_input',
            verified: true, // Human-entered knowledge is pre-verified
        });

        setContent('');
        setTags([]);
        setRegion('');
        setIsExpanded(false);
    };

    return (
        <div className="card">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Quick Knowledge Capture
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    placeholder="Just learned: Thai clubs prefer monthly payments over lump sum..."
                    className="input text-sm min-h-[80px] resize-none"
                    rows={isExpanded ? 4 : 2}
                />

                {isExpanded && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label text-xs">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="input-sm w-full"
                                >
                                    <option value={FRAGMENT_TYPES.MARKET_INSIGHT}>Market Insight</option>
                                    <option value={FRAGMENT_TYPES.PRICING_STRATEGY}>Pricing Strategy</option>
                                    <option value={FRAGMENT_TYPES.CLIENT_PREFERENCE}>Client Preference</option>
                                    <option value={FRAGMENT_TYPES.COMPETITOR_INTEL}>Competitor Intel</option>
                                    <option value={FRAGMENT_TYPES.PROCESS_TIP}>Process Tip</option>
                                    <option value={FRAGMENT_TYPES.REGIONAL_PATTERN}>Regional Pattern</option>
                                </select>
                            </div>
                            <div>
                                <label className="label text-xs">Region (optional)</label>
                                <select
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="input-sm w-full"
                                >
                                    <option value="">All Regions</option>
                                    <option value="GCC">GCC</option>
                                    <option value="Central Asia">Central Asia</option>
                                    <option value="SEA">SEA</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label text-xs">Tags</label>
                            <TagInput
                                tags={tags}
                                onChange={setTags}
                                placeholder="thailand, streaming, clubs..."
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsExpanded(false);
                                    setContent('');
                                    setTags([]);
                                }}
                                className="btn-ghost btn-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!content.trim()}
                                className="btn-primary btn-sm"
                            >
                                Add Knowledge
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}

// Pending review card
function PendingReviewCard({ item, type, onVerify, onReject }) {
    const isFragment = type === 'fragment';

    return (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                            isFragment ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                            {isFragment ? item.type.replace('_', ' ') : item.learningType}
                        </span>
                        {item.region && (
                            <span className="text-xs text-gray-500">{item.region}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-200">
                        {isFragment ? item.content : item.lesson}
                    </p>
                    {!isFragment && item.context && (
                        <p className="text-xs text-gray-500 mt-1">
                            Context: {JSON.stringify(item.context).slice(0, 100)}...
                        </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map(tag => (
                                <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => onVerify(item.id)}
                        className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                        title="Verify"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onReject(item.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Reject"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Knowledge fragment card
function KnowledgeCard({ fragment, onEdit, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(fragment.content);

    const handleSave = () => {
        onEdit(fragment.id, { content: editContent });
        setIsEditing(false);
    };

    const typeColors = {
        [FRAGMENT_TYPES.MARKET_INSIGHT]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        [FRAGMENT_TYPES.PRICING_STRATEGY]: 'bg-green-500/20 text-green-400 border-green-500/30',
        [FRAGMENT_TYPES.CLIENT_PREFERENCE]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        [FRAGMENT_TYPES.COMPETITOR_INTEL]: 'bg-red-500/20 text-red-400 border-red-500/30',
        [FRAGMENT_TYPES.PROCESS_TIP]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        [FRAGMENT_TYPES.REGIONAL_PATTERN]: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };

    return (
        <div className="card hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[fragment.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {fragment.type.replace('_', ' ')}
                    </span>
                    {fragment.region && (
                        <span className="text-xs text-gray-500">{fragment.region}</span>
                    )}
                    {fragment.verified && (
                        <span className="text-xs text-green-400 flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-1 text-gray-500 hover:text-gray-300"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(fragment.id)}
                        className="p-1 text-gray-500 hover:text-red-400"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="input text-sm min-h-[60px] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="btn-ghost btn-sm">Cancel</button>
                        <button onClick={handleSave} className="btn-primary btn-sm">Save</button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-300">{fragment.content}</p>
            )}

            {fragment.tags && fragment.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {fragment.tags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border text-xs text-gray-500">
                <span>Confidence: {(fragment.confidence * 100).toFixed(0)}%</span>
                <span>Impact: {fragment.impactScore?.toFixed(2) || '0.00'}</span>
                <span>Used: {fragment.usageCount || 0}x</span>
            </div>
        </div>
    );
}

// Stats card
function StatsCard({ stats }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center">
                <div className="text-2xl font-bold text-brand-teal">{stats.verifiedFragments}</div>
                <div className="text-xs text-gray-500">Verified Knowledge</div>
            </div>
            <div className="card text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.pendingVerification}</div>
                <div className="text-xs text-gray-500">Pending Review</div>
            </div>
            <div className="card text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.verifiedLearnings}</div>
                <div className="text-xs text-gray-500">Deal Learnings</div>
            </div>
            <div className="card text-center">
                <div className="text-2xl font-bold text-green-400">{(stats.avgConfidence * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Avg Confidence</div>
            </div>
        </div>
    );
}

// Main Knowledge Page
export default function KnowledgePage() {
    const {
        fragments,
        learnings,
        loading,
        error,
        initialize,
        addFragment,
        updateFragment,
        verifyFragment,
        deleteFragment,
        verifyLearning,
        getPendingReview,
        getStats,
    } = useKnowledgeStore();

    const initializeTimeline = useTimelineStore(state => state.initialize);

    const [activeTab, setActiveTab] = useState('knowledge'); // 'knowledge' | 'timeline'
    const [filterType, setFilterType] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPending, setShowPending] = useState(false);

    useEffect(() => {
        initialize();
        initializeTimeline();
    }, [initialize, initializeTimeline]);

    const stats = useMemo(() => getStats(), [fragments, learnings]);
    const pendingReview = useMemo(() => getPendingReview(), [fragments, learnings]);

    const filteredFragments = useMemo(() => {
        return fragments.filter(f => {
            if (filterType !== 'all' && f.type !== filterType) return false;
            if (filterRegion !== 'all' && f.region !== filterRegion) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesContent = f.content.toLowerCase().includes(q);
                const matchesTags = f.tags.some(t => t.toLowerCase().includes(q));
                if (!matchesContent && !matchesTags) return false;
            }
            return true;
        });
    }, [fragments, filterType, filterRegion, searchQuery]);

    const handleRejectLearning = async (learningId) => {
        // For now, just delete - could also archive
        // Would need to add deleteLearning to store
        console.log('Reject learning:', learningId);
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-60px)] flex items-center justify-center">
                <div className="text-gray-400">Loading knowledge base...</div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-3 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-100 flex items-center gap-2">
                        <svg className="w-6 h-6 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Intelligence
                    </h1>
                    <p className="text-sm text-gray-500">Knowledge base and research timeline</p>
                </div>

                <div className="flex items-center gap-3">
                    {pendingReview.totalCount > 0 && activeTab === 'knowledge' && (
                        <button
                            onClick={() => setShowPending(!showPending)}
                            className={`btn-sm flex items-center gap-2 ${
                                showPending ? 'btn-primary' : 'bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30'
                            }`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                            </span>
                            {pendingReview.totalCount} Pending Review
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-dark-card p-1 rounded-lg border border-dark-border w-fit">
                <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'knowledge'
                            ? 'bg-brand-teal/20 text-brand-teal'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Knowledge
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'timeline'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Research Timeline
                    </span>
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
                <ResearcherTimeline />
            )}

            {/* Knowledge Tab */}
            {activeTab === 'knowledge' && (
                <>
                    {/* Stats */}
                    <div className="mb-6">
                        <StatsCard stats={stats} />
                    </div>

                    {/* Pending Review Section */}
                    {showPending && pendingReview.totalCount > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-medium text-gray-200 mb-3">Pending Review</h2>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {pendingReview.fragments.map(f => (
                                    <PendingReviewCard
                                        key={f.id}
                                        item={f}
                                        type="fragment"
                                        onVerify={verifyFragment}
                                        onReject={deleteFragment}
                                    />
                                ))}
                                {pendingReview.learnings.map(l => (
                                    <PendingReviewCard
                                        key={l.id}
                                        item={l}
                                        type="learning"
                                        onVerify={verifyLearning}
                                        onReject={handleRejectLearning}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Quick Capture */}
                        <div className="lg:col-span-1">
                            <QuickCapture onAdd={addFragment} />

                            {/* Knowledge by Type */}
                            <div className="card mt-4">
                                <h3 className="text-sm font-medium text-gray-300 mb-3">Knowledge by Type</h3>
                                <div className="space-y-2">
                                    {Object.entries(stats.byType).map(([type, count]) => (
                                        <div key={type} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400 capitalize">{type.replace('_', ' ')}</span>
                                            <span className="text-gray-300">{count}</span>
                                        </div>
                                    ))}
                                    {Object.keys(stats.byType).length === 0 && (
                                        <p className="text-sm text-gray-500">No knowledge yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Knowledge Library */}
                        <div className="lg:col-span-2">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                <div className="relative flex-1 min-w-[200px]">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search knowledge..."
                                        className="input-sm w-full pl-9"
                                    />
                                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="input-sm"
                                >
                                    <option value="all">All Types</option>
                                    {Object.entries(FRAGMENT_TYPES).map(([key, value]) => (
                                        <option key={key} value={value}>{value.replace('_', ' ')}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterRegion}
                                    onChange={(e) => setFilterRegion(e.target.value)}
                                    className="input-sm"
                                >
                                    <option value="all">All Regions</option>
                                    <option value="GCC">GCC</option>
                                    <option value="Central Asia">Central Asia</option>
                                    <option value="SEA">SEA</option>
                                </select>
                            </div>

                            {/* Knowledge List */}
                            <div className="space-y-3">
                                {filteredFragments.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-400 mb-2">No knowledge yet</h3>
                                        <p className="text-sm text-gray-500">
                                            Start adding market insights, pricing strategies, and learnings.
                                        </p>
                                    </div>
                                ) : (
                                    filteredFragments.map(fragment => (
                                        <KnowledgeCard
                                            key={fragment.id}
                                            fragment={fragment}
                                            onEdit={updateFragment}
                                            onDelete={deleteFragment}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
