import { useState, useMemo, useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { calculateGrandTotalWithFees } from '../utils/calculations';
import { validateForm, sanitizeString } from '../utils/validation';

export default function ClientsPage({ onSelectClient }) {
    const { clients, savedQuotes, getClientQuotes, addClient, deleteClient } = useClientStore();
    const { rates } = useQuoteStore();
    const { settings } = useSettingsStore();
    const projectTypes = settings.projectTypes || [];

    const [dashboardCurrency, setDashboardCurrency] = useState('USD');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Get available years from quotes
    const years = useMemo(() => {
        const yearSet = new Set();
        savedQuotes.forEach(q => {
            const date = new Date(q.savedAt || q.createdAt);
            if (!isNaN(date.getTime())) yearSet.add(date.getFullYear());
        });
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [savedQuotes]);
    const [newClientData, setNewClientData] = useState({
        company: '',
        website: '',
        location: '',
        address: '',
        region: 'MALAYSIA',
        contact: '',
        email: '',
        phone: '',
        tags: [],
    });
    const [formErrors, setFormErrors] = useState({});

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isAddClientModalOpen) {
                setIsAddClientModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isAddClientModalOpen]);

    // Calculate Client Metrics with advanced stats (filtered by year/month)
    const clientMetrics = useMemo(() => {
        return clients.map(client => {
            const allQuotes = getClientQuotes(client.id);

            // Filter quotes by selected year/month
            const quotes = allQuotes.filter(q => {
                const date = new Date(q.savedAt || q.createdAt);
                if (isNaN(date.getTime())) return false;
                if (date.getFullYear() !== selectedYear) return false;
                if (selectedMonth !== 'all' && date.getMonth() !== parseInt(selectedMonth)) return false;
                return true;
            });

            let totalRevenue = 0;
            let totalProfit = 0;
            let wonCount = 0;
            let lostCount = 0;

            quotes.forEach(q => {
                const total = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
                const revenue = convertCurrency(total.totalCharge, q.currency || 'USD', dashboardCurrency, rates);
                const cost = convertCurrency(total.totalCost, q.currency || 'USD', dashboardCurrency, rates);
                const profit = revenue - cost;

                if (q.status === 'won') {
                    totalRevenue += revenue;
                    totalProfit += profit;
                    wonCount++;
                } else if (q.status === 'dead' || q.status === 'rejected') {
                    lostCount++;
                }
            });

            const totalClosed = wonCount + lostCount;
            const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
            const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

            return {
                ...client,
                totalRevenue,
                totalProfit,
                avgMargin,
                winRate,
                quoteCount: quotes.length,
                wonCount,
                contactCount: client.contacts?.length || (client.contact ? 1 : 0)
            };
        });
    }, [clients, getClientQuotes, dashboardCurrency, rates, selectedYear, selectedMonth]);

    // Calculate Advanced Global Stats
    const stats = useMemo(() => {
        // Filter quotes by selected year/month (same as clientMetrics)
        const filteredQuotes = savedQuotes.filter(q => {
            const date = new Date(q.savedAt || q.createdAt);
            if (isNaN(date.getTime())) return false;
            if (date.getFullYear() !== selectedYear) return false;
            if (selectedMonth !== 'all' && date.getMonth() !== parseInt(selectedMonth)) return false;
            return true;
        });

        // 1. Basic Counts
        const totalClients = clients.length;
        const totalContacts = clients.reduce((sum, c) => sum + (c.contacts?.length || (c.contact ? 1 : 0)), 0);

        // 2. Client Rankings
        const activeClients = clientMetrics.filter(c => c.totalRevenue > 0);
        const sortedByRevenue = [...activeClients].sort((a, b) => b.totalRevenue - a.totalRevenue);
        const sortedByMargin = [...activeClients].sort((a, b) => b.avgMargin - a.avgMargin);

        const topPayingClient = sortedByRevenue[0] || null;
        const topMarginClient = sortedByMargin[0] || null; // Highest avg margin

        // Calculate average win rate and margin across all clients with data
        const clientsWithWinRate = clientMetrics.filter(c => c.winRate > 0 || c.wonCount > 0 || c.quoteCount > 0);
        const avgWinRate = clientsWithWinRate.length > 0
            ? clientsWithWinRate.reduce((sum, c) => sum + c.winRate, 0) / clientsWithWinRate.length
            : 0;
        const clientsWithMargin = clientMetrics.filter(c => c.avgMargin > 0);
        const avgMargin = clientsWithMargin.length > 0
            ? clientsWithMargin.reduce((sum, c) => sum + c.avgMargin, 0) / clientsWithMargin.length
            : 0;

        // 3. Project Type Performance (using filtered quotes)
        const projectTypeStats = {};
        filteredQuotes.forEach(q => {
            if (q.status === 'won') {
                const typeId = q.project?.type || 'Unknown';
                const total = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
                const profit = convertCurrency(total.profit || 0, q.currency || 'USD', dashboardCurrency, rates);

                if (!projectTypeStats[typeId]) projectTypeStats[typeId] = { profit: 0, count: 0 };
                projectTypeStats[typeId].profit += profit;
                projectTypeStats[typeId].count += 1;
            }
        });
        const bestProjectType = Object.entries(projectTypeStats)
            .sort(([, a], [, b]) => b.profit - a.profit)[0]; // [typeId, {profit, count}]

        // 4. Monthly Performance (Last 12 Months)
        const monthlyStats = {};
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`; // ID
            monthlyStats[key] = {
                label: d.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
                revenue: 0,
                sortKey: d.getTime()
            };
        }

        filteredQuotes.forEach(q => {
            if (q.status === 'won') {
                const date = new Date(q.updatedAt || q.savedAt); // Use won date ideally, falling back
                const key = `${date.getFullYear()}-${date.getMonth()}`;

                if (monthlyStats[key]) {
                    const total = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
                    const revenue = convertCurrency(total.totalCharge, q.currency || 'USD', dashboardCurrency, rates);
                    monthlyStats[key].revenue += revenue;
                }
            }
        });

        const monthsArray = Object.values(monthlyStats);
        const bestMonth = [...monthsArray].sort((a, b) => b.revenue - a.revenue)[0];
        const worstMonth = [...monthsArray].sort((a, b) => a.revenue - b.revenue).find(m => m.revenue >= 0) || monthsArray[monthsArray.length - 1];

        return {
            totalClients,
            totalContacts,
            topPayingClient,
            topMarginClient,
            avgWinRate,
            avgMargin,
            bestProjectType: bestProjectType ? { typeId: bestProjectType[0], profit: bestProjectType[1].profit, count: bestProjectType[1].count } : null,
            bestMonth,
            worstMonth
        };
    }, [clientMetrics, clients, savedQuotes, dashboardCurrency, rates, selectedYear, selectedMonth]);

    // Calculate Top Contacts (VIPs)
    const topContacts = useMemo(() => {
        const allContacts = [];
        clients.forEach(client => {
            if (client.contacts) {
                client.contacts.forEach(contact => {
                    if (contact.isPrimary) {
                        const metric = clientMetrics.find(m => m.id === client.id);
                        if (metric && metric.wonCount > 0) {
                            allContacts.push({
                                id: contact.id,
                                name: contact.name,
                                company: client.company,
                                wonCount: metric.wonCount,
                                totalRevenue: metric.totalRevenue
                            });
                        }
                    }
                });
            } else if (client.contact) {
                // Legacy support
                const metric = clientMetrics.find(m => m.id === client.id);
                if (metric && metric.wonCount > 0) {
                    allContacts.push({
                        id: client.id + '_contact', // Fake ID
                        name: client.contact,
                        company: client.company,
                        wonCount: metric.wonCount,
                        totalRevenue: metric.totalRevenue
                    });
                }
            }
        });

        // Sort by won count desc - top 5
        return allContacts.sort((a, b) => b.wonCount - a.wonCount).slice(0, 5);
    }, [clients, clientMetrics]);

    const handleAddClient = (e) => {
        e.preventDefault();

        // Validate form
        const { isValid, errors } = validateForm(newClientData, {
            company: { required: true, label: 'Company name', minLength: 2 },
            email: { email: true, label: 'Email' },
            phone: { phone: true, label: 'Phone' },
            website: { url: true, label: 'Website' }
        });

        if (!isValid) {
            setFormErrors(errors);
            return;
        }

        // Sanitize and add client
        addClient({
            ...newClientData,
            company: sanitizeString(newClientData.company),
            contact: sanitizeString(newClientData.contact),
            location: sanitizeString(newClientData.location),
            address: sanitizeString(newClientData.address),
        });

        setIsAddClientModalOpen(false);
        setFormErrors({});
        setNewClientData({ company: '', website: '', location: '', address: '', region: 'MALAYSIA', contact: '', email: '', phone: '', tags: [] });
    };

    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Clients & Accounts</h1>
                    <p className="text-sm text-gray-500">Manage client relationships and performance</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search clients or tags..."
                            className="input-sm bg-dark-card border-none pl-9 w-64 focus:ring-1 focus:ring-accent-primary"
                        />
                        <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Date Filters Group */}
                    <div className="flex items-center gap-1 bg-dark-bg/50 rounded-lg px-1.5 py-0.5">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="input-sm text-sm w-[72px] bg-transparent border-none focus:ring-0"
                        >
                            {years.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <span className="text-gray-600 text-sm">/</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="input-sm text-sm w-24 bg-transparent border-none focus:ring-0"
                        >
                            <option value="all">All Months</option>
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-700/40" />

                    {/* Currency Selector */}
                    <select
                        value={dashboardCurrency}
                        onChange={(e) => setDashboardCurrency(e.target.value)}
                        className="input-sm text-sm w-24 bg-dark-card border-none"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="MYR">MYR (RM)</option>
                    </select>

                    <button
                        onClick={() => setIsAddClientModalOpen(true)}
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Client
                    </button>
                </div>
            </div>

            {/* Advanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Row 1: Counts & Contacts */}
                <div className="card bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-900/30">
                    <p className="text-xs text-blue-400 mb-1 uppercase tracking-wider">Total Clients</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
                        <span className="text-xs text-blue-400/60">Active Companies</span>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-indigo-900/20 to-indigo-950/20 border-indigo-900/30">
                    <p className="text-xs text-indigo-400 mb-1 uppercase tracking-wider">Total Contacts</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-white">{stats.totalContacts}</p>
                        <span className="text-xs text-indigo-400/60">Key People</span>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-purple-900/20 to-purple-950/20 border-purple-900/30">
                    <p className="text-xs text-purple-400 mb-1 uppercase tracking-wider">Best Project Type</p>
                    <div>
                        <p className="text-lg font-bold text-white truncate">
                            {stats.bestProjectType
                                ? (projectTypes.find(t => t.id === stats.bestProjectType.typeId)?.label || stats.bestProjectType.typeId)
                                : '-'}
                        </p>
                        <p className="text-xs text-purple-400/60">
                            {stats.bestProjectType ? formatCurrency(stats.bestProjectType.profit, dashboardCurrency, 0) + ' Profit' : 'No Data'}
                        </p>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border-emerald-900/30">
                    <p className="text-xs text-emerald-400 mb-1 uppercase tracking-wider">Top Margin Client</p>
                    <div>
                        <p className="text-lg font-bold text-white truncate">{stats.topMarginClient?.company || '-'}</p>
                        <p className="text-xs text-emerald-400/60">
                            {stats.topMarginClient ? stats.topMarginClient.avgMargin.toFixed(1) + '% Avg Margin' : 'No Data'}
                        </p>
                    </div>
                </div>

                {/* Row 2: Performance Metrics */}
                <div className="card bg-gradient-to-br from-amber-900/20 to-amber-950/20 border-amber-900/30">
                    <p className="text-xs text-amber-500 mb-1 uppercase tracking-wider">Top Paying Client</p>
                    <div>
                        <p className="text-lg font-bold text-white truncate">{stats.topPayingClient?.company || '-'}</p>
                        <p className="text-xs text-amber-500/60">
                            {stats.topPayingClient ? formatCurrency(stats.topPayingClient.totalRevenue, dashboardCurrency, 0) + ' Rev' : 'No Data'}
                        </p>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-900/30">
                    <p className="text-xs text-green-400 mb-1 uppercase tracking-wider">Avg Win Rate</p>
                    <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-bold ${stats.avgWinRate >= 50 ? 'text-green-400' : 'text-amber-400'}`}>
                            {stats.avgWinRate.toFixed(0)}%
                        </p>
                        <span className="text-xs text-green-400/60">Across Clients</span>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-cyan-900/20 to-cyan-950/20 border-cyan-900/30">
                    <p className="text-xs text-cyan-400 mb-1 uppercase tracking-wider">Avg Margin</p>
                    <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-bold ${stats.avgMargin >= 30 ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {stats.avgMargin.toFixed(1)}%
                        </p>
                        <span className="text-xs text-cyan-400/60">Gross Margin</span>
                    </div>
                </div>
                <div className="card">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Best Month</p>
                    <div className="flex justify-between items-baseline">
                        <p className="text-xl font-bold text-white">{stats.bestMonth?.label || '-'}</p>
                        <span className="text-xs text-green-400">{stats.bestMonth && stats.bestMonth.revenue > 0 ? formatCurrency(stats.bestMonth.revenue, dashboardCurrency, 0) : ''}</span>
                    </div>
                </div>
            </div>

            {/* VIP Contacts Section */}
            {topContacts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        VIP Contacts
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {topContacts.map((contact, index) => (
                            <div key={contact.id} className="card bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold relative">
                                        {contact.name.charAt(0)}
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] text-black flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-200">{contact.name}</p>
                                        <p className="text-xs text-gray-500">{contact.company}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Wins</span>
                                    <span className="font-bold text-white">{contact.wonCount} Deals</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-1">
                                    <span className="text-gray-400">Value</span>
                                    <span className="font-bold text-emerald-400">{formatCurrency(contact.totalRevenue, dashboardCurrency, 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Clients Section Title */}
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-200">Clients</h2>
            </div>

            {/* Filtered Clients */}
            {(() => {
                const filteredClients = clientMetrics.filter(client => {
                    const query = searchQuery.toLowerCase();
                    const nameMatch = client.company?.toLowerCase().includes(query);
                    const tagMatch = client.tags?.some(tag => tag.toLowerCase().includes(query));
                    const contactMatch = client.contacts?.some(c => c.name.toLowerCase().includes(query));
                    return nameMatch || tagMatch || contactMatch;
                });

                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => onSelectClient(client.id)}
                                className="card text-left hover:border-accent-primary/50 transition-colors group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-[#2D3748] flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                                            {client.company?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-100 group-hover:text-accent-primary transition-colors truncate max-w-[180px]">
                                                {client.company}
                                            </h3>
                                            {client.tags && client.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {client.tags.slice(0, 3).map((tag, idx) => (
                                                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {client.tags.length > 3 && (
                                                        <span className="text-[10px] text-gray-500">+{client.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Key Contacts Preview */}
                                <div className="mb-6">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Primary Contact</p>
                                    {client.contacts && client.contacts.find(c => c.isPrimary) ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#2D3748] flex items-center justify-center text-xs text-gray-400">
                                                {client.contacts.find(c => c.isPrimary).name.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-300">{client.contacts.find(c => c.isPrimary).name}</span>
                                        </div>
                                    ) : (
                                        client.contact ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#2D3748] flex items-center justify-center text-xs text-gray-400">
                                                    {client.contact.charAt(0)}
                                                </div>
                                                <span className="text-sm text-gray-300">{client.contact}</span>
                                            </div>
                                        ) : <span className="text-xs text-gray-600 italic">No contacts</span>
                                    )}
                                </div>

                                {/* Mini Stats */}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">Revenue</p>
                                        <p className="text-sm font-medium text-gray-200">{formatCurrency(client.totalRevenue, dashboardCurrency, 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">Win Rate</p>
                                        <p className={`text-sm font-medium ${client.winRate >= 50 ? 'text-green-400' : 'text-gray-200'}`}>
                                            {client.winRate}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">Quotes</p>
                                        <p className="text-sm font-medium text-gray-200">{client.quoteCount}</p>
                                    </div>
                                </div>
                                {/* Delete Button */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to delete ${client.company}? This will also delete all associated quotes.`)) {
                                                deleteClient(client.id);
                                            }
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-red-400 bg-dark-card/80 backdrop-blur rounded-lg border border-dark-border shadow-sm hover:shadow-md transition-all"
                                        title="Delete Client"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </button>
                        ))}

                    </div>
                );
            })()}

            {/* Add Client Modal */}
            {
                isAddClientModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-md modal-backdrop">
                        <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg shadow-2xl modal-content relative">
                            <button
                                onClick={() => { setIsAddClientModalOpen(false); setFormErrors({}); }}
                                className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h2 className="text-xl font-bold text-gray-100 mb-2">Add New Client</h2>
                            <p className="text-sm text-gray-500 mb-6">Create a new client account to start generating quotes.</p>

                            <form onSubmit={handleAddClient} className="space-y-6">
                                {/* Company Information Section */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="label label-required">Company Legal Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newClientData.company}
                                            onChange={e => {
                                                setNewClientData({ ...newClientData, company: e.target.value });
                                                if (formErrors.company) setFormErrors({ ...formErrors, company: null });
                                            }}
                                            className={`input w-full ${formErrors.company ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="e.g. Acme Corporation Ltd"
                                        />
                                        {formErrors.company && <p className="text-xs text-red-400 mt-1">{formErrors.company}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Charge Basis (Region)</label>
                                            <select
                                                value={newClientData.region || 'MALAYSIA'}
                                                onChange={e => setNewClientData({ ...newClientData, region: e.target.value })}
                                                className="input w-full"
                                            >
                                                <option value="MALAYSIA">Malaysia (RM)</option>
                                                <option value="SEA">SEA (USD)</option>
                                                <option value="GULF">Gulf (USD)</option>
                                                <option value="CENTRAL_ASIA">Central Asia (USD)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Location</label>
                                            <input
                                                type="text"
                                                value={newClientData.location}
                                                onChange={e => setNewClientData({ ...newClientData, location: e.target.value })}
                                                className="input w-full"
                                                placeholder="e.g. Singapore"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">Company Registered Address</label>
                                        <textarea
                                            value={newClientData.address}
                                            onChange={e => setNewClientData({ ...newClientData, address: e.target.value })}
                                            className="input w-full min-h-[72px] resize-none"
                                            placeholder="Full registered business address"
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Website</label>
                                        <input
                                            type="text"
                                            value={newClientData.website}
                                            onChange={e => {
                                                setNewClientData({ ...newClientData, website: e.target.value });
                                                if (formErrors.website) setFormErrors({ ...formErrors, website: null });
                                            }}
                                            className={`input w-full ${formErrors.website ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="acme.com"
                                        />
                                        {formErrors.website && <p className="text-xs text-red-400 mt-1">{formErrors.website}</p>}
                                    </div>
                                </div>

                                {/* Primary Contact Section */}
                                <div className="pt-6 border-t border-gray-800/50">
                                    <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Primary Contact
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4">Optional - You can add contacts later</p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="label">Contact Name</label>
                                            <input
                                                type="text"
                                                value={newClientData.contact}
                                                onChange={e => setNewClientData({ ...newClientData, contact: e.target.value })}
                                                className="input w-full"
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={newClientData.email}
                                                    onChange={e => {
                                                        setNewClientData({ ...newClientData, email: e.target.value });
                                                        if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                                                    }}
                                                    className={`input w-full ${formErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                    placeholder="john@acme.com"
                                                />
                                                {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                                            </div>
                                            <div>
                                                <label className="label">Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={newClientData.phone}
                                                    onChange={e => {
                                                        setNewClientData({ ...newClientData, phone: e.target.value });
                                                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                                                    }}
                                                    className={`input w-full ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                    placeholder="+65..."
                                                />
                                                {formErrors.phone && <p className="text-xs text-red-400 mt-1">{formErrors.phone}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-800/50">
                                    <button
                                        type="button"
                                        onClick={() => { setIsAddClientModalOpen(false); setFormErrors({}); }}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Create Client
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
