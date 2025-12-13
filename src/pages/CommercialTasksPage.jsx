import { useState, useEffect, useRef, useCallback } from 'react';
import { useClientStore } from '../store/clientStore';
import { useOpportunityStore } from '../store/opportunityStore';
import { useSettingsStore } from '../store/settingsStore';

// API key from environment variable (set in Vercel dashboard)
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// Scan interval: 3 hours in milliseconds
const SCAN_INTERVAL = 3 * 60 * 60 * 1000;

export default function CommercialTasksPage() {
    const clients = useClientStore(state => state.clients) || [];
    const quotes = useClientStore(state => state.quotes) || [];
    const opportunities = useOpportunityStore(state => state.opportunities) || [];
    const { settings } = useSettingsStore();

    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('tell_commercial_tasks');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastGenerated, setLastGenerated] = useState(() => {
        const saved = localStorage.getItem('tell_commercial_tasks_time');
        return saved ? new Date(saved) : null;
    });
    const [completedTasks, setCompletedTasks] = useState(() => {
        const saved = localStorage.getItem('tell_completed_tasks');
        return saved ? JSON.parse(saved) : [];
    });
    const [nextScan, setNextScan] = useState(null);

    const scanIntervalRef = useRef(null);

    // Save tasks to localStorage
    useEffect(() => {
        if (tasks.length > 0) {
            localStorage.setItem('tell_commercial_tasks', JSON.stringify(tasks));
        }
    }, [tasks]);

    // Save completed tasks to localStorage
    useEffect(() => {
        localStorage.setItem('tell_completed_tasks', JSON.stringify(completedTasks));
    }, [completedTasks]);

    // Save last generated time
    useEffect(() => {
        if (lastGenerated) {
            localStorage.setItem('tell_commercial_tasks_time', lastGenerated.toISOString());
        }
    }, [lastGenerated]);

    const generateTasks = useCallback(async (force = false) => {
        // Check for API key
        if (!ANTHROPIC_API_KEY) {
            setError('API key not configured. Set VITE_ANTHROPIC_API_KEY in environment variables.');
            return;
        }

        // Skip if recently generated (within 3 hours) unless forced
        if (!force && lastGenerated) {
            const timeSinceLastScan = Date.now() - new Date(lastGenerated).getTime();
            if (timeSinceLastScan < SCAN_INTERVAL && tasks.length > 0) {
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Calculate days since for helper
            const daysSince = (dateStr) => {
                if (!dateStr) return null;
                return Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
            };

            // Get unique client companies for market research
            const uniqueCompanies = [...new Set([
                ...clients.map(c => c.company).filter(Boolean),
                ...opportunities.map(o => o.client?.company).filter(Boolean),
            ])];

            // Aggregate ALL business data - comprehensive view
            const businessData = {
                // === SUMMARY METRICS ===
                summary: {
                    totalClients: clients.length,
                    totalQuotes: quotes.length,
                    totalOpportunities: opportunities.length,
                    quotesWon: quotes.filter(q => q.status === 'won').length,
                    quotesSent: quotes.filter(q => q.status === 'sent').length,
                    quotesDraft: quotes.filter(q => q.status === 'draft').length,
                    quotesDead: quotes.filter(q => q.status === 'dead').length,
                    activeOpportunities: opportunities.filter(o => o.status === 'active').length,
                    totalPipelineValue: opportunities.filter(o => o.status === 'active').reduce((sum, o) => sum + (o.value || 0), 0),
                    weightedPipelineValue: opportunities.filter(o => o.status === 'active').reduce((sum, o) => sum + ((o.value || 0) * (o.probability || 50) / 100), 0),
                },

                // === ALL OPPORTUNITIES with full details ===
                opportunities: opportunities.map(o => ({
                    id: o.id,
                    title: o.title,
                    client: o.client?.company,
                    clientContact: o.client?.contact,
                    country: o.country,
                    region: o.region,
                    status: o.status,
                    value: o.value,
                    currency: o.currency || 'USD',
                    probability: o.probability,
                    source: o.source,
                    competitors: o.competitors,
                    brief: o.brief,
                    notes: o.notes,
                    nextAction: o.nextAction,
                    nextActionDate: o.nextActionDate,
                    expectedCloseDate: o.expectedCloseDate,
                    contacts: o.contacts?.map(c => ({ name: c.name, role: c.role, email: c.email })),
                    daysSinceUpdate: daysSince(o.updatedAt),
                    daysSinceCreated: daysSince(o.createdAt),
                    daysUntilClose: o.expectedCloseDate ? -daysSince(o.expectedCloseDate) : null,
                    isOverdue: o.nextActionDate && new Date(o.nextActionDate) < new Date(),
                    isStale: daysSince(o.updatedAt) > 14 && o.status === 'active',
                })),

                // === ALL QUOTES with full details ===
                quotes: quotes.map(q => ({
                    number: q.quoteNumber,
                    client: q.client?.company,
                    clientContact: q.client?.contact,
                    clientEmail: q.client?.email,
                    project: q.project?.title,
                    projectType: q.project?.type,
                    projectDates: q.project?.dates,
                    status: q.status,
                    total: q.totals?.grandTotal,
                    cost: q.totals?.totalCost,
                    margin: q.totals?.margin,
                    currency: q.currency,
                    region: q.region,
                    date: q.quoteDate,
                    daysSinceCreated: daysSince(q.quoteDate),
                    isLocked: q.isLocked,
                })),

                // === ALL CLIENTS with interaction history ===
                clients: clients.map(c => {
                    const clientQuotes = quotes.filter(q => q.client?.company === c.company);
                    const clientOpps = opportunities.filter(o => o.client?.company === c.company);
                    return {
                        company: c.company,
                        contact: c.contact,
                        email: c.email,
                        phone: c.phone,
                        region: c.region,
                        notes: c.notes,
                        tags: c.tags,
                        contacts: c.contacts?.map(ct => ({ name: ct.name, role: ct.role, email: ct.email })),
                        totalQuotes: clientQuotes.length,
                        wonQuotes: clientQuotes.filter(q => q.status === 'won').length,
                        totalRevenue: clientQuotes.filter(q => q.status === 'won').reduce((sum, q) => sum + (q.totals?.grandTotal || 0), 0),
                        activeOpportunities: clientOpps.filter(o => o.status === 'active').length,
                        lastQuoteDate: clientQuotes.sort((a, b) => new Date(b.quoteDate) - new Date(a.quoteDate))[0]?.quoteDate,
                        daysSinceLastQuote: daysSince(clientQuotes.sort((a, b) => new Date(b.quoteDate) - new Date(a.quoteDate))[0]?.quoteDate),
                        daysSinceLastContact: daysSince(c.updatedAt),
                    };
                }),

                // === URGENT ITEMS ===
                urgent: {
                    overdueActions: opportunities.filter(o => o.nextActionDate && new Date(o.nextActionDate) < new Date() && o.status === 'active'),
                    staleOpportunities: opportunities.filter(o => daysSince(o.updatedAt) > 14 && o.status === 'active'),
                    pendingQuotesOver7Days: quotes.filter(q => q.status === 'sent' && daysSince(q.quoteDate) > 7),
                    closingThisWeek: opportunities.filter(o => {
                        if (!o.expectedCloseDate || o.status !== 'active') return false;
                        const daysUntil = -daysSince(o.expectedCloseDate);
                        return daysUntil >= 0 && daysUntil <= 7;
                    }),
                },

                // === PIPELINE ANALYSIS ===
                pipeline: {
                    byRegion: ['GCC', 'SEA', 'Central Asia'].map(region => ({
                        region,
                        count: opportunities.filter(o => o.region === region && o.status === 'active').length,
                        value: opportunities.filter(o => o.region === region && o.status === 'active').reduce((sum, o) => sum + (o.value || 0), 0),
                    })),
                    byCountry: [...new Set(opportunities.map(o => o.country))].filter(Boolean).map(country => ({
                        country,
                        count: opportunities.filter(o => o.country === country && o.status === 'active').length,
                        value: opportunities.filter(o => o.country === country && o.status === 'active').reduce((sum, o) => sum + (o.value || 0), 0),
                    })),
                    highValue: opportunities.filter(o => (o.value || 0) > 50000 && o.status === 'active'),
                    highProbability: opportunities.filter(o => (o.probability || 0) >= 70 && o.status === 'active'),
                },

                // === CLIENT INSIGHTS ===
                clientInsights: {
                    topClients: clients
                        .map(c => ({
                            company: c.company,
                            revenue: quotes.filter(q => q.client?.company === c.company && q.status === 'won').reduce((sum, q) => sum + (q.totals?.grandTotal || 0), 0),
                        }))
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 10),
                    dormantClients: clients.filter(c => {
                        const lastQuote = quotes.filter(q => q.client?.company === c.company).sort((a, b) => new Date(b.quoteDate) - new Date(a.quoteDate))[0];
                        return lastQuote && daysSince(lastQuote.quoteDate) > 90;
                    }),
                    newClients: clients.filter(c => daysSince(c.createdAt) <= 30),
                },

                // === MARKET CONTEXT ===
                marketContext: {
                    regions: ['Malaysia', 'Southeast Asia', 'Gulf States (GCC)', 'Central Asia'],
                    sectors: ['Broadcast', 'Streaming', 'Sports', 'Corporate Events', 'Technical Production'],
                    majorCompanies: uniqueCompanies.slice(0, 20),
                },
            };

            // Compress data for token efficiency - only include relevant fields
            const compactData = {
                summary: businessData.summary,
                urgent: {
                    overdueActions: businessData.urgent.overdueActions.map(o => ({ title: o.title, client: o.client?.company, nextAction: o.nextAction, value: o.value })),
                    staleOpps: businessData.urgent.staleOpportunities.map(o => ({ title: o.title, client: o.client?.company, days: daysSince(o.updatedAt), value: o.value })),
                    pendingQuotes: businessData.urgent.pendingQuotesOver7Days.map(q => ({ number: q.quoteNumber, client: q.client?.company, days: daysSince(q.quoteDate), total: q.totals?.grandTotal })),
                    closingSoon: businessData.urgent.closingThisWeek.map(o => ({ title: o.title, client: o.client?.company, value: o.value, closeDate: o.expectedCloseDate })),
                },
                opportunities: businessData.opportunities.filter(o => o.status === 'active').map(o => ({
                    title: o.title, client: o.client, country: o.country, value: o.value, prob: o.probability,
                    notes: o.notes?.substring(0, 200), nextAction: o.nextAction, stale: o.isStale, overdue: o.isOverdue,
                })),
                clients: businessData.clients.map(c => ({
                    company: c.company, contact: c.contact, notes: c.notes?.substring(0, 150),
                    quotes: c.totalQuotes, won: c.wonQuotes, revenue: c.totalRevenue, daysSince: c.daysSinceLastQuote,
                })),
                pipeline: businessData.pipeline,
                topClients: businessData.clientInsights.topClients,
                dormant: businessData.clientInsights.dormantClients.map(c => c.company),
            };

            const prompt = `You are the Commercial Director at Tell Productions (broadcast/streaming production) in Malaysia, SEA, Gulf & Central Asia.

TODAY'S DATE: ${new Date().toLocaleDateString()}

BUSINESS DATA:
${JSON.stringify(compactData, null, 1)}

MARKET CONTEXT TO CONSIDER:
- Major sports events: AFC Asian Cup, SEA Games, Gulf Cup, Cricket tournaments, F1 races
- Broadcasting trends: OTT growth, 4K/HDR adoption, cloud production, remote workflows
- Regional dynamics: Saudi Vision 2030 entertainment investment, Malaysia's creative economy push, Singapore as APAC hub
- Competitors: typical regional broadcast service providers
- Seasonality: Q4 budget cycles, Ramadan scheduling, monsoon season impacts

Generate 8-12 SPECIFIC commercial tasks. Include:
1. URGENT: Overdue actions, stale deals, pending quotes
2. REVENUE: High-value closes, follow-ups with decision makers
3. MARKET: Opportunities from events/trends you know about in these regions
4. RELATIONSHIP: Key client touchpoints, dormant client reactivation
5. GROWTH: Cross-sell, upsell based on client history

Return ONLY JSON array:
[{"id":"unique","priority":"high|medium|low","category":"urgent|revenue|market|relationship|growth","title":"Specific action with names","description":"Context & talking points","client":"Company","deadline":"Today|Tomorrow|This week","impact":"Revenue/strategic value"}]

Be specific with actual names, values, dates from the data. Reference market events where relevant.`;

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: prompt }],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.content[0]?.text;

            // Parse JSON from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsedTasks = JSON.parse(jsonMatch[0]);
                setTasks(parsedTasks);
                setLastGenerated(new Date());
            } else {
                throw new Error('Could not parse tasks from AI response');
            }
        } catch (err) {
            console.error('Failed to generate tasks:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clients, quotes, opportunities, tasks.length]);

    // Auto-generate on mount and set up 3-hour interval
    useEffect(() => {
        // Wait for data to load
        if (clients.length === 0 && quotes.length === 0 && opportunities.length === 0) {
            return;
        }

        // Check if we need to generate (no tasks or 3 hours passed)
        const shouldGenerate = () => {
            if (tasks.length === 0) return true;
            if (!lastGenerated) return true;
            const timeSinceLastScan = Date.now() - new Date(lastGenerated).getTime();
            return timeSinceLastScan >= SCAN_INTERVAL;
        };

        // Generate on mount if needed
        if (shouldGenerate()) {
            generateTasks();
        }

        // Calculate and set next scan time
        const updateNextScan = () => {
            if (lastGenerated) {
                const next = new Date(new Date(lastGenerated).getTime() + SCAN_INTERVAL);
                setNextScan(next);
            }
        };
        updateNextScan();

        // Set up interval for automatic scanning
        scanIntervalRef.current = setInterval(() => {
            generateTasks();
        }, SCAN_INTERVAL);

        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [clients.length, quotes.length, opportunities.length, generateTasks, lastGenerated, tasks.length]);

    const toggleTaskComplete = (taskId) => {
        setCompletedTasks(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'urgent':
                return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
            case 'revenue':
                return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'relationship':
                return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
            case 'pipeline':
                return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
            case 'growth':
                return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
            case 'market':
                return 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            default:
                return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
        }
    };

    const activeTasks = tasks.filter(t => !completedTasks.includes(t.id));
    const completedTasksList = tasks.filter(t => completedTasks.includes(t.id));

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Commercial Tasks</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            AI-powered tasks from your pipeline, client data & market intelligence
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {lastGenerated && (
                            <div className="text-right">
                                <span className="text-xs text-gray-500 block">
                                    Last scan: {lastGenerated.toLocaleTimeString()}
                                </span>
                                {nextScan && (
                                    <span className="text-[10px] text-gray-600">
                                        Next: {nextScan.toLocaleTimeString()} ({Math.round((nextScan - Date.now()) / (1000 * 60 * 60))}h)
                                    </span>
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => generateTasks(true)}
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && tasks.length === 0 && !error && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No tasks generated yet</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Click "Generate Tasks" to analyze your business data and get actionable items
                        </p>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>{clients.length} clients | {quotes.length} quotes | {opportunities.length} opportunities</p>
                        </div>
                    </div>
                )}

                {/* Tasks List */}
                {activeTasks.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Active Tasks ({activeTasks.length})
                        </h2>
                        {activeTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-gray-700 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleTaskComplete(task.id)}
                                        className="mt-1 w-5 h-5 rounded border-2 border-gray-600 hover:border-accent-primary flex items-center justify-center flex-shrink-0 transition-colors"
                                    >
                                        {completedTasks.includes(task.id) && (
                                            <svg className="w-3 h-3 text-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Category Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getCategoryIcon(task.category)} />
                                        </svg>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-medium text-gray-200">{task.title}</h3>
                                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                                {task.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            {task.client && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    {task.client}
                                                </span>
                                            )}
                                            {task.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {task.deadline}
                                                </span>
                                            )}
                                            {task.impact && (
                                                <span className="flex items-center gap-1 text-green-500">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                    {task.impact}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Completed Tasks */}
                {completedTasksList.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Completed ({completedTasksList.length})
                        </h2>
                        {completedTasksList.map((task) => (
                            <div
                                key={task.id}
                                className="bg-dark-card/50 border border-dark-border/50 rounded-lg p-4 opacity-60"
                            >
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => toggleTaskComplete(task.id)}
                                        className="mt-1 w-5 h-5 rounded border-2 border-green-600 bg-green-600 flex items-center justify-center flex-shrink-0"
                                    >
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-400 line-through">{task.title}</h3>
                                        <p className="text-sm text-gray-500">{task.client}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
