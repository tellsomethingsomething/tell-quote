import { useState, useEffect, useRef, useCallback } from 'react';
import { useClientStore } from '../store/clientStore';
import { useOpportunityStore } from '../store/opportunityStore';
import { useSettingsStore } from '../store/settingsStore';

// API key from environment variable (set in Vercel dashboard)
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// Scan interval: 3 hours in milliseconds
const SCAN_INTERVAL = 3 * 60 * 60 * 1000;

// Task categories
const CATEGORIES = [
    { id: 'upcoming_deals', label: 'Upcoming Deals', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
    { id: 'client_tasks', label: 'Client Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'research', label: 'Research', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { id: 'client_comms', label: 'Client Comms', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
];

export default function CommercialTasksPage() {
    const clients = useClientStore(state => state.clients) || [];
    const quotes = useClientStore(state => state.quotes) || [];
    const updateClient = useClientStore(state => state.updateClient);
    const addClient = useClientStore(state => state.addClient);
    const opportunities = useOpportunityStore(state => state.opportunities) || [];
    const updateOpportunity = useOpportunityStore(state => state.updateOpportunity);
    const addOpportunity = useOpportunityStore(state => state.addOpportunity);
    const { addActivityLog } = useSettingsStore();
    const settings = useSettingsStore(state => state.settings);

    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('tell_commercial_tasks_v2');
        return saved ? JSON.parse(saved) : [];
    });
    const [manualTasks, setManualTasks] = useState(() => {
        const saved = localStorage.getItem('tell_manual_tasks');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastGenerated, setLastGenerated] = useState(() => {
        const saved = localStorage.getItem('tell_commercial_tasks_time');
        return saved ? new Date(saved) : null;
    });
    const [completedTasks, setCompletedTasks] = useState(() => {
        const saved = localStorage.getItem('tell_completed_tasks_v2');
        return saved ? JSON.parse(saved) : [];
    });
    const [nextScan, setNextScan] = useState(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', category: 'client_tasks', priority: 'medium' });
    const [activeCategory, setActiveCategory] = useState('all');

    // Complete & Log modal state
    const [showLogModal, setShowLogModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [logData, setLogData] = useState({
        note: '',
        clientId: '',
        opportunityId: '',
        createOpportunity: false,
        newOppTitle: '',
        createClient: false,
        newClientCompany: '',
        newClientContact: '',
        newClientRole: '',
        newClientCountry: '',
        newClientEmail: '',
    });

    const scanIntervalRef = useRef(null);
    const hasInitialized = useRef(false);
    const isGenerating = useRef(false);

    // Save tasks to localStorage
    useEffect(() => {
        localStorage.setItem('tell_commercial_tasks_v2', JSON.stringify(tasks));
    }, [tasks]);

    // Save manual tasks to localStorage
    useEffect(() => {
        localStorage.setItem('tell_manual_tasks', JSON.stringify(manualTasks));
    }, [manualTasks]);

    // Save completed tasks to localStorage
    useEffect(() => {
        localStorage.setItem('tell_completed_tasks_v2', JSON.stringify(completedTasks));
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

        // Skip if already generating
        if (isGenerating.current) return;
        isGenerating.current = true;

        // Skip if recently generated (within 3 hours) unless forced
        if (!force) {
            const savedTime = localStorage.getItem('tell_commercial_tasks_time');
            const savedTasks = localStorage.getItem('tell_commercial_tasks_v2');
            if (savedTime && savedTasks) {
                const timeSinceLastScan = Date.now() - new Date(savedTime).getTime();
                const hasTasks = JSON.parse(savedTasks).length > 0;
                if (timeSinceLastScan < SCAN_INTERVAL && hasTasks) {
                    isGenerating.current = false;
                    return;
                }
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

            // Compress data for token efficiency
            const compactData = {
                summary: {
                    totalClients: clients.length,
                    totalQuotes: quotes.length,
                    totalOpportunities: opportunities.length,
                    activeOpportunities: opportunities.filter(o => o.status === 'active').length,
                    totalPipelineValue: opportunities.filter(o => o.status === 'active').reduce((sum, o) => sum + (o.value || 0), 0),
                },
                opportunities: opportunities.filter(o => o.status === 'active').map(o => ({
                    id: o.id,
                    title: o.title,
                    client: o.client?.company,
                    clientContact: o.client?.contact,
                    country: o.country,
                    region: o.region,
                    value: o.value,
                    currency: o.currency || 'USD',
                    probability: o.probability,
                    competitors: o.competitors,
                    brief: o.brief?.substring(0, 200),
                    notes: o.notes?.substring(0, 300),
                    nextAction: o.nextAction,
                    nextActionDate: o.nextActionDate,
                    expectedCloseDate: o.expectedCloseDate,
                    contacts: o.contacts?.map(c => ({ name: c.name, role: c.role })),
                    daysSinceUpdate: daysSince(o.updatedAt),
                    isOverdue: o.nextActionDate && new Date(o.nextActionDate) < new Date(),
                    isStale: daysSince(o.updatedAt) > 14,
                })),
                clients: clients.map(c => {
                    const clientOpps = opportunities.filter(o => o.client?.company === c.company);
                    const clientQuotes = quotes.filter(q => q.client?.company === c.company);
                    return {
                        id: c.id,
                        company: c.company,
                        contact: c.contact,
                        email: c.email,
                        region: c.region,
                        notes: c.notes?.substring(0, 200),
                        contacts: c.contacts?.slice(0, 3).map(ct => ({ name: ct.name, role: ct.role })),
                        activeOpportunities: clientOpps.filter(o => o.status === 'active').length,
                        totalQuotes: clientQuotes.length,
                        wonQuotes: clientQuotes.filter(q => q.status === 'won').length,
                        daysSinceLastContact: daysSince(c.updatedAt),
                    };
                }),
                recentQuotes: quotes.filter(q => q.status === 'sent').slice(0, 10).map(q => ({
                    number: q.quoteNumber,
                    client: q.client?.company,
                    project: q.project?.title,
                    status: q.status,
                    total: q.totals?.grandTotal,
                    daysSinceSent: daysSince(q.quoteDate),
                })),
            };

            const companyInfo = settings?.company || {};
            const prompt = `You are a commercial task generator for ${companyInfo.name || 'Tell Productions'} - a broadcast/streaming production company.

COMPANY INFO:
- Name: ${companyInfo.name || 'Tell Productions'}
- Based in: ${companyInfo.country || 'Malaysia'}
- Website: ${companyInfo.website || ''}

TODAY'S DATE: ${new Date().toLocaleDateString('en-GB')} (${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
IMPORTANT: Only suggest CURRENT or FUTURE opportunities. Do not reference past events or old dates.

FOCUS REGIONS: Only use regions that appear in the opportunities data below. Do not suggest regions we don't already operate in.

SPORTS FOCUS: Football (soccer), futsal, cycling ONLY. Primarily football. No other sports.

DATA:
${JSON.stringify(compactData, null, 1)}

RULES:
- ONLY use regions/countries that appear in our opportunities data
- Reference specific clients, opportunities, quotes from the data
- For research tasks: suggest SPECIFIC organizations/contacts (broadcasters, football federations, production companies)
- Include contact suggestions with roles where possible
- Football/futsal/cycling opportunities ONLY - no other sports

CATEGORIES & TASKS:

UPCOMING_DEALS - Close existing pipeline:
- "Follow up Quote #[X] to [Client] - sent [X] days ago"
- "Chase [Opportunity] at [Client] - closing [date]"

CLIENT_TASKS - Manage existing clients:
- "Review stale opportunity at [Client] - [X] days no update"
- "Update contact info for [Client]"

RESEARCH - New business development:
- "Research [specific broadcaster/org] in [country] - potential for [type] coverage"
- "Find Head of Production at [specific company] in [region]"
- "Identify football rights holders in [SEA country]"
- For NEW contacts: include "newClient": true and suggest company/contact details

CLIENT_COMMS - Relationship building:
- "Check in with [Contact] at [Client] - [X] days since contact"
- "Introduce [service] to [Client]"

Generate 8-12 tasks. For research/new business, suggest SPECIFIC companies and contacts in our focus regions.

Return ONLY JSON:
[{"id":"unique","category":"upcoming_deals|client_tasks|research|client_comms","priority":"high|medium|low","title":"Specific action","description":"Context and why","client":"Client/Company name","clientId":"ID if existing client","opportunityId":"ID if relevant","contact":"Person NAME only - no job titles/roles","newClient":true/false,"suggestedCompany":"For new prospects","suggestedContact":"Person name only","suggestedRole":"Their job title separately","suggestedCountry":"Country"}]`;

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
                    max_tokens: 2048,
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
            isGenerating.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clients, quotes, opportunities]);

    // Update next scan time when lastGenerated changes
    useEffect(() => {
        if (lastGenerated) {
            const next = new Date(new Date(lastGenerated).getTime() + SCAN_INTERVAL);
            setNextScan(next);
        }
    }, [lastGenerated]);

    // Auto-generate on mount only (not on every state change)
    useEffect(() => {
        // Prevent multiple initializations
        if (hasInitialized.current) return;

        // Wait for data to load
        if (clients.length === 0 && quotes.length === 0 && opportunities.length === 0) {
            return;
        }

        hasInitialized.current = true;

        // Check if we need to generate (no tasks or 3 hours passed)
        const savedTasks = localStorage.getItem('tell_commercial_tasks_v2');
        const savedTime = localStorage.getItem('tell_commercial_tasks_time');
        const hasTasks = savedTasks && JSON.parse(savedTasks).length > 0;
        const lastScan = savedTime ? new Date(savedTime) : null;
        const timeSinceLastScan = lastScan ? Date.now() - lastScan.getTime() : Infinity;

        if (!hasTasks || timeSinceLastScan >= SCAN_INTERVAL) {
            generateTasks(true);
        }

        // Set up interval for automatic scanning (every 3 hours)
        scanIntervalRef.current = setInterval(() => {
            generateTasks(true);
        }, SCAN_INTERVAL);

        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clients.length, quotes.length, opportunities.length]);

    // Open log modal for a task
    const openLogModal = (task) => {
        setSelectedTask(task);
        // Pre-fill with task context
        const noteText = `[${task.category.toUpperCase()}] ${task.title}\n\nOutcome: `;
        // Try to find matching client
        const matchingClient = clients.find(c =>
            c.company?.toLowerCase() === task.client?.toLowerCase() ||
            c.id === task.clientId
        );
        // Try to find matching opportunity
        const matchingOpp = opportunities.find(o =>
            o.id === task.opportunityId ||
            (task.client && o.client?.company?.toLowerCase() === task.client?.toLowerCase())
        );

        // Check if this is a new client suggestion (research task)
        const isNewClientTask = task.newClient || (task.category === 'research' && !matchingClient);

        setLogData({
            note: noteText,
            clientId: matchingClient?.id || '',
            opportunityId: matchingOpp?.id || '',
            createOpportunity: false,
            newOppTitle: '',
            createClient: isNewClientTask,
            newClientCompany: task.suggestedCompany || task.client || '',
            newClientContact: task.suggestedContact || task.contact || '',
            newClientRole: task.suggestedRole || '',
            newClientCountry: task.suggestedCountry || '',
            newClientEmail: '',
        });
        setShowLogModal(true);
    };

    // Complete task and log it
    const completeAndLog = async () => {
        if (!selectedTask) return;

        const timestamp = new Date().toISOString();
        const dateStr = new Date().toLocaleDateString('en-GB');
        let newClientId = null;

        // Create new client if requested
        if (logData.createClient && logData.newClientCompany) {
            const newClient = {
                company: logData.newClientCompany,
                contact: logData.newClientContact || '',
                email: logData.newClientEmail || '',
                region: logData.newClientCountry || '',
                notes: `--- ${dateStr} ---\nCreated from Commercial Task: ${selectedTask.title}\n\n${logData.note}`,
                contacts: logData.newClientContact ? [{
                    name: logData.newClientContact,
                    role: logData.newClientRole || '',
                    email: logData.newClientEmail || '',
                }] : [],
            };
            const created = await addClient(newClient);
            newClientId = created?.id;
        }

        const targetClientId = newClientId || logData.clientId;

        // Add note to opportunity if selected
        if (logData.opportunityId) {
            const opp = opportunities.find(o => o.id === logData.opportunityId);
            if (opp) {
                const existingNotes = opp.notes || '';
                const newNote = `\n\n--- ${dateStr} ---\n${logData.note}`;
                await updateOpportunity(logData.opportunityId, {
                    notes: existingNotes + newNote,
                    updatedAt: timestamp,
                });
            }
        }
        // Add note to client if selected (and no opportunity)
        else if (targetClientId && !logData.createClient) {
            const client = clients.find(c => c.id === targetClientId);
            if (client) {
                const existingNotes = client.notes || '';
                const newNote = `\n\n--- ${dateStr} ---\n${logData.note}`;
                await updateClient(targetClientId, {
                    notes: existingNotes + newNote,
                    updatedAt: timestamp,
                });
            }
        }

        // Create new opportunity if requested
        if (logData.createOpportunity && logData.newOppTitle && targetClientId) {
            const client = logData.createClient
                ? { company: logData.newClientCompany, contact: logData.newClientContact, email: logData.newClientEmail }
                : clients.find(c => c.id === targetClientId);
            if (client) {
                await addOpportunity({
                    title: logData.newOppTitle,
                    client: {
                        company: client.company || logData.newClientCompany,
                        contact: client.contact || logData.newClientContact,
                        email: client.email || logData.newClientEmail,
                    },
                    status: 'active',
                    probability: 25,
                    source: 'Commercial Tasks',
                    notes: `Created from task: ${selectedTask.title}\n\n${logData.note}`,
                    region: client.region || logData.newClientCountry,
                    country: logData.newClientCountry,
                });
            }
        }

        // Log to global activity
        if (addActivityLog) {
            addActivityLog({
                action: logData.createClient ? 'client_created' : 'task_completed',
                category: 'commercial_task',
                description: logData.createClient
                    ? `Created client: ${logData.newClientCompany}`
                    : `Completed: ${selectedTask.title}`,
                details: logData.note,
                clientId: targetClientId,
                opportunityId: logData.opportunityId,
            });
        }

        // Mark task as complete
        if (selectedTask.isManual) {
            setManualTasks(prev => prev.filter(t => t.id !== selectedTask.id));
        } else {
            setCompletedTasks(prev => [...prev, selectedTask.id]);
        }

        // Close modal
        setShowLogModal(false);
        setSelectedTask(null);
    };

    const toggleTaskComplete = (taskId, isManual = false) => {
        if (isManual) {
            setManualTasks(prev => prev.filter(t => t.id !== taskId));
        } else {
            setCompletedTasks(prev =>
                prev.includes(taskId)
                    ? prev.filter(id => id !== taskId)
                    : [...prev, taskId]
            );
        }
    };

    const deleteTask = (taskId, isManual = false) => {
        if (isManual) {
            setManualTasks(prev => prev.filter(t => t.id !== taskId));
        } else {
            // For AI tasks, add to completed so they don't reappear
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setCompletedTasks(prev => prev.filter(id => id !== taskId));
        }
    };

    const addManualTask = () => {
        if (!newTask.title.trim()) return;
        const task = {
            ...newTask,
            id: `manual_${Date.now()}`,
            isManual: true,
            createdAt: new Date().toISOString(),
        };
        setManualTasks(prev => [task, ...prev]);
        setNewTask({ title: '', description: '', category: 'client_tasks', priority: 'medium' });
        setShowAddTask(false);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getCategoryInfo = (categoryId) => {
        return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
    };

    // Get opportunities for selected client
    const clientOpportunities = logData.clientId
        ? opportunities.filter(o => {
            const client = clients.find(c => c.id === logData.clientId);
            return client && o.client?.company === client.company;
        })
        : [];

    // Combine AI and manual tasks
    const allTasks = [
        ...manualTasks,
        ...tasks.filter(t => !completedTasks.includes(t.id))
    ];

    // Filter by category
    const filteredTasks = activeCategory === 'all'
        ? allTasks
        : allTasks.filter(t => t.category === activeCategory);

    // Group tasks by category for display
    const tasksByCategory = CATEGORIES.reduce((acc, cat) => {
        acc[cat.id] = filteredTasks.filter(t => t.category === cat.id);
        return acc;
    }, {});

    const completedTasksList = tasks.filter(t => completedTasks.includes(t.id));

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Commercial Tasks</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Actions from your pipeline, clients & opportunities
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastGenerated && (
                            <div className="text-right hidden sm:block">
                                <span className="text-xs text-gray-500 block">
                                    Last scan: {lastGenerated.toLocaleTimeString()}
                                </span>
                                {nextScan && (
                                    <span className="text-[10px] text-gray-600">
                                        Next: {nextScan.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => setShowAddTask(true)}
                            className="btn-ghost flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Add Task</span>
                        </button>
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
                                    <span className="hidden sm:inline">Scanning...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="hidden sm:inline">Refresh</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            activeCategory === 'all'
                                ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent'
                        }`}
                    >
                        All ({allTasks.length})
                    </button>
                    {CATEGORIES.map(cat => {
                        const count = allTasks.filter(t => t.category === cat.id).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                                    activeCategory === cat.id
                                        ? `${cat.color}`
                                        : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cat.icon} />
                                </svg>
                                {cat.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Add Task Modal */}
                {showAddTask && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-white mb-4">Add Task</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                        placeholder="Task title..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white h-20"
                                        placeholder="Details..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Category</label>
                                        <select
                                            value={newTask.category}
                                            onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowAddTask(false)} className="btn-ghost">Cancel</button>
                                <button onClick={addManualTask} className="btn-primary">Add Task</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Complete & Log Modal */}
                {showLogModal && selectedTask && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-6 w-full max-w-lg shadow-2xl">
                            <h3 className="text-lg font-semibold text-white mb-2">Complete & Log</h3>
                            <p className="text-sm text-gray-400 mb-4">{selectedTask.title}</p>

                            <div className="space-y-4">
                                {/* Note */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">What happened?</label>
                                    <textarea
                                        value={logData.note}
                                        onChange={(e) => setLogData({ ...logData, note: e.target.value })}
                                        className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white h-24"
                                        placeholder="Outcome of this task..."
                                    />
                                </div>

                                {/* Create New Client Toggle */}
                                <div className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg border border-dark-border">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer flex-1">
                                        <input
                                            type="checkbox"
                                            checked={logData.createClient}
                                            onChange={(e) => setLogData({ ...logData, createClient: e.target.checked, clientId: '' })}
                                            className="rounded border-gray-600"
                                        />
                                        Create new client/contact
                                    </label>
                                </div>

                                {/* New Client Form */}
                                {logData.createClient ? (
                                    <div className="space-y-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Company Name *</label>
                                            <input
                                                type="text"
                                                value={logData.newClientCompany}
                                                onChange={(e) => setLogData({ ...logData, newClientCompany: e.target.value })}
                                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
                                                placeholder="Company name..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Contact Name</label>
                                                <input
                                                    type="text"
                                                    value={logData.newClientContact}
                                                    onChange={(e) => setLogData({ ...logData, newClientContact: e.target.value })}
                                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
                                                    placeholder="Contact name..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Role/Title</label>
                                                <input
                                                    type="text"
                                                    value={logData.newClientRole}
                                                    onChange={(e) => setLogData({ ...logData, newClientRole: e.target.value })}
                                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
                                                    placeholder="Job title..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Country/Region</label>
                                                <input
                                                    type="text"
                                                    value={logData.newClientCountry}
                                                    onChange={(e) => setLogData({ ...logData, newClientCountry: e.target.value })}
                                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
                                                    placeholder="e.g. Malaysia"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={logData.newClientEmail}
                                                    onChange={(e) => setLogData({ ...logData, newClientEmail: e.target.value })}
                                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
                                                    placeholder="email@company.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Client Selection */}
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Log to Client</label>
                                            <select
                                                value={logData.clientId}
                                                onChange={(e) => setLogData({ ...logData, clientId: e.target.value, opportunityId: '' })}
                                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                            >
                                                <option value="">Select client...</option>
                                                {clients.map(c => (
                                                    <option key={c.id} value={c.id}>{c.company}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Opportunity Selection (if client selected) */}
                                        {logData.clientId && clientOpportunities.length > 0 && (
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Log to Opportunity (optional)</label>
                                                <select
                                                    value={logData.opportunityId}
                                                    onChange={(e) => setLogData({ ...logData, opportunityId: e.target.value })}
                                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                                >
                                                    <option value="">Just log to client</option>
                                                    {clientOpportunities.map(o => (
                                                        <option key={o.id} value={o.id}>{o.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Create New Opportunity */}
                                {(logData.clientId || logData.createClient) && (
                                    <div className="border-t border-dark-border pt-4">
                                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={logData.createOpportunity}
                                                onChange={(e) => setLogData({ ...logData, createOpportunity: e.target.checked })}
                                                className="rounded border-gray-600"
                                            />
                                            Also create opportunity from this
                                        </label>
                                        {logData.createOpportunity && (
                                            <input
                                                type="text"
                                                value={logData.newOppTitle}
                                                onChange={(e) => setLogData({ ...logData, newOppTitle: e.target.value })}
                                                className="w-full mt-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                                placeholder="New opportunity title..."
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowLogModal(false)} className="btn-ghost">Cancel</button>
                                <button
                                    onClick={completeAndLog}
                                    className="btn-primary"
                                    disabled={!logData.note.trim() || (logData.createClient && !logData.newClientCompany.trim())}
                                >
                                    {logData.createClient ? 'Create Client & Complete' : 'Complete & Log'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredTasks.length === 0 && !error && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No tasks yet</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Click "Refresh" to scan for tasks or add one manually
                        </p>
                    </div>
                )}

                {/* Tasks by Category */}
                {activeCategory === 'all' ? (
                    CATEGORIES.map(cat => {
                        const catTasks = tasksByCategory[cat.id];
                        if (catTasks.length === 0) return null;
                        return (
                            <div key={cat.id} className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cat.icon} />
                                        </svg>
                                    </div>
                                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                        {cat.label} ({catTasks.length})
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {catTasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onToggle={() => toggleTaskComplete(task.id, task.isManual)}
                                            onLog={() => openLogModal(task)}
                                            onDelete={() => deleteTask(task.id, task.isManual)}
                                            getPriorityColor={getPriorityColor}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggle={() => toggleTaskComplete(task.id, task.isManual)}
                                onLog={() => openLogModal(task)}
                                onDelete={() => deleteTask(task.id, task.isManual)}
                                getPriorityColor={getPriorityColor}
                            />
                        ))}
                    </div>
                )}

                {/* Completed Tasks */}
                {completedTasksList.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-dark-border">
                        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                            Completed ({completedTasksList.length})
                        </h2>
                        <div className="space-y-2">
                            {completedTasksList.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-dark-card/50 border border-dark-border/50 rounded-lg p-3 opacity-60"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleTaskComplete(task.id)}
                                            className="w-5 h-5 rounded border-2 border-green-600 bg-green-600 flex items-center justify-center flex-shrink-0"
                                        >
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <span className="text-gray-400 line-through text-sm">{task.title}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Task Card Component
function TaskCard({ task, onToggle, onLog, onDelete, getPriorityColor }) {
    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                    onClick={onToggle}
                    className="mt-1 w-5 h-5 rounded border-2 border-gray-600 hover:border-accent-primary flex items-center justify-center flex-shrink-0 transition-colors"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-gray-200">{task.title}</h3>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        {task.isManual && (
                            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                Manual
                            </span>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        {task.contact && (
                            <span className="flex items-center gap-1 text-accent-primary">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {task.contact}
                            </span>
                        )}
                        {task.client && (
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {task.client}
                            </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 pt-3 border-t border-dark-border flex items-center justify-between">
                        <button
                            onClick={onLog}
                            className="text-xs text-accent-primary hover:text-accent-primary/80 flex items-center gap-1.5 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Complete & Log
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                            title="Delete task"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
