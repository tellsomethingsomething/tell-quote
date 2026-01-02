import { useState, useMemo, useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { useQuoteStore } from '../store/quoteStore';
import { useSettingsStore } from '../store/settingsStore';
import { useActivityStore } from '../store/activityStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { calculateGrandTotalWithFees } from '../utils/calculations';
import { validateForm, sanitizeString } from '../utils/validation';
import { useFeatureGuard, FEATURES } from '../components/billing/FeatureGate';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import CSVImportModal from '../components/common/CSVImportModal';
import { useToast } from '../components/common/Toast';

export default function ClientsPage({ onSelectClient }) {
    // Optimized Zustand selectors - use stable references to avoid re-renders
    const clients = useClientStore(state => state.clients);
    const savedQuotes = useClientStore(state => state.savedQuotes);
    const getClientQuotes = useClientStore(state => state.getClientQuotes);
    const getClientHealth = useClientStore(state => state.getClientHealth);
    const addClient = useClientStore(state => state.addClient);
    const deleteClient = useClientStore(state => state.deleteClient);
    const rates = useQuoteStore(state => state.rates);
    const projectTypes = useSettingsStore(state => state.settings?.projectTypes) || [];
    const activities = useActivityStore(state => state.activities);
    const toast = useToast();

    // Use global display currency from settings
    const { currency: dashboardCurrency } = useDisplayCurrency();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');
    const [filterPaymentTerms, setFilterPaymentTerms] = useState('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Feature gating for client creation
    const { checkAndProceed, PromptComponent } = useFeatureGuard(FEATURES.ADD_CLIENT);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 24; // Show 24 clients per page (8 rows x 3 cols)

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Helper function to generate initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Helper function to get consistent avatar color from name
    const AVATAR_COLORS = [
        'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
        'bg-pink-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500'
    ];
    const getAvatarColor = (name) => {
        if (!name) return AVATAR_COLORS[0];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return AVATAR_COLORS[hash % AVATAR_COLORS.length];
    };

    // Get available years from quotes
    const years = useMemo(() => {
        const yearSet = new Set();
        savedQuotes.forEach(q => {
            const date = new Date(q.savedAt || q.createdAt);
            if (!isNaN(date.getTime())) yearSet.add(date.getFullYear());
        });
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [savedQuotes]);

    // Get unique filter options from clients
    const filterOptions = useMemo(() => {
        const industries = new Set();
        const regions = new Set();
        const paymentTermsList = new Set();

        clients.forEach(client => {
            if (client.industry) industries.add(client.industry);
            if (client.region) regions.add(client.region);
            if (client.paymentTerms) paymentTermsList.add(client.paymentTerms);
        });

        return {
            industries: Array.from(industries).sort(),
            regions: Array.from(regions).sort(),
            paymentTerms: Array.from(paymentTermsList).sort(),
        };
    }, [clients]);

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
        paymentTerms: 'net30',
        preferredCurrency: 'USD',
        industry: '',
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

            // Calculate health score
            const health = getClientHealth(client.id, activities, savedQuotes);

            return {
                ...client,
                totalRevenue,
                totalProfit,
                avgMargin,
                winRate,
                quoteCount: quotes.length,
                wonCount,
                lostCount,
                contactCount: client.contacts?.length || (client.contact ? 1 : 0),
                health,
                daysSinceActivity: health.factors.daysSinceActivity,
            };
        });
    }, [clients, getClientQuotes, getClientHealth, activities, savedQuotes, dashboardCurrency, rates, selectedYear, selectedMonth]);

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

        // Calculate aggregate win rate (total won / total closed) - not average of percentages
        const totalWonCount = clientMetrics.reduce((sum, c) => sum + (c.wonCount || 0), 0);
        const totalLostCount = clientMetrics.reduce((sum, c) => sum + (c.lostCount || 0), 0);
        const totalClosedCount = totalWonCount + totalLostCount;
        const avgWinRate = totalClosedCount > 0
            ? Math.round((totalWonCount / totalClosedCount) * 100)
            : 0;

        // Calculate weighted average margin (by revenue, not simple average)
        const totalRevenueAll = clientMetrics.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
        const totalProfitAll = clientMetrics.reduce((sum, c) => sum + (c.totalProfit || 0), 0);
        const avgMargin = totalRevenueAll > 0
            ? (totalProfitAll / totalRevenueAll) * 100
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

    // Memoized filtered clients (separate from metrics calculation)
    const filteredClients = useMemo(() => {
        return clientMetrics.filter(client => {
            // Text search
            const query = searchQuery.toLowerCase();
            const nameMatch = client.company?.toLowerCase().includes(query);
            const tagMatch = client.tags?.some(tag => tag.toLowerCase().includes(query));
            const contactMatch = client.contacts?.some(c => c.name?.toLowerCase().includes(query));
            const textMatch = !query || nameMatch || tagMatch || contactMatch;

            // Advanced filters
            const industryMatch = filterIndustry === 'all' || client.industry === filterIndustry;
            const regionMatch = filterRegion === 'all' || client.region === filterRegion;
            const paymentTermsMatch = filterPaymentTerms === 'all' || client.paymentTerms === filterPaymentTerms;

            return textMatch && industryMatch && regionMatch && paymentTermsMatch;
        });
    }, [clientMetrics, searchQuery, filterIndustry, filterRegion, filterPaymentTerms]);

    // Paginated clients
    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredClients.slice(startIndex, startIndex + pageSize);
    }, [filteredClients, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredClients.length / pageSize);

    // Reset to page 1 when filters change
    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setCurrentPage(1);
    };

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
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-3 sm:p-6 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center justify-between sm:block">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Clients & Accounts</h1>
                        <p className="text-xs sm:text-sm text-gray-500">Manage client relationships</p>
                    </div>
                    {/* Add Client Button - visible on mobile in header */}
                    <button
                        onClick={() => checkAndProceed(() => setIsAddClientModalOpen(true))}
                        className="sm:hidden btn-primary text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Search Bar - Full width on mobile */}
                    <div className="relative w-full sm:w-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search clients..."
                            className="input-sm bg-dark-card border-none pl-9 w-full sm:w-64 min-h-[44px] focus:ring-1 focus:ring-accent-primary"
                        />
                        <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Filters row - horizontal scroll on mobile */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {/* Date Filters Group */}
                        <div className="flex items-center gap-1 bg-dark-bg/50 rounded-lg px-1.5 py-0.5 flex-shrink-0">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="input-sm text-sm w-20 min-h-[40px] bg-transparent border-none focus:ring-0"
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
                                className="input-sm text-sm w-28 sm:w-32 min-h-[40px] bg-transparent border-none focus:ring-0"
                            >
                                <option value="all">All Months</option>
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Advanced Filters */}
                        {filterOptions.industries.length > 0 && (
                            <select
                                value={filterIndustry}
                                onChange={(e) => setFilterIndustry(e.target.value)}
                                className="input-sm text-sm w-28 sm:w-32 min-h-[40px] bg-dark-card border-none flex-shrink-0"
                                title="Filter by Industry"
                            >
                                <option value="all">All Industries</option>
                                {filterOptions.industries.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        )}

                        {filterOptions.regions.length > 0 && (
                            <select
                                value={filterRegion}
                                onChange={(e) => setFilterRegion(e.target.value)}
                                className="input-sm text-sm w-28 sm:w-32 min-h-[40px] bg-dark-card border-none flex-shrink-0"
                                title="Filter by Region"
                            >
                                <option value="all">All Regions</option>
                                {filterOptions.regions.map(reg => (
                                    <option key={reg} value={reg}>{reg}</option>
                                ))}
                            </select>
                        )}

                        {filterOptions.paymentTerms.length > 1 && (
                            <select
                                value={filterPaymentTerms}
                                onChange={(e) => setFilterPaymentTerms(e.target.value)}
                                className="input-sm text-sm w-24 sm:w-28 min-h-[40px] bg-dark-card border-none flex-shrink-0"
                                title="Filter by Payment Terms"
                            >
                                <option value="all">All Terms</option>
                                {filterOptions.paymentTerms.map(term => (
                                    <option key={term} value={term}>
                                        {term === 'net30' ? 'Net 30' :
                                         term === 'net45' ? 'Net 45' :
                                         term === 'net60' ? 'Net 60' :
                                         term === 'immediate' ? 'Immediate' : term}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Import Button - Desktop only */}
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="hidden sm:flex btn-secondary text-sm items-center gap-2 flex-shrink-0"
                            title="Import clients from CSV"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import
                        </button>

                        {/* Add Client Button - Desktop only */}
                        <button
                            onClick={() => checkAndProceed(() => setIsAddClientModalOpen(true))}
                            className="hidden sm:flex btn-primary text-sm items-center gap-2 flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Client
                        </button>
                    </div>
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
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-200">
                    Clients
                    <span className="text-sm font-normal text-gray-500 ml-2">
                        ({filteredClients.length} total{filteredClients.length !== clients.length && `, ${clients.length - filteredClients.length} filtered out`})
                    </span>
                </h2>
            </div>

            {/* Paginated Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedClients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => onSelectClient(client.id)}
                                className="card text-left hover:border-accent-primary/50 transition-colors group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded bg-[#2D3748] flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                                                {client.company?.substring(0, 2).toUpperCase()}
                                            </div>
                                            {/* Health Indicator Dot */}
                                            <div
                                                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-card ${
                                                    client.health?.status === 'good' ? 'bg-emerald-500' :
                                                    client.health?.status === 'warning' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`}
                                                title={`Health: ${client.health?.status || 'unknown'} (${client.health?.score || 0}/100)`}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-100 group-hover:text-accent-primary transition-colors truncate max-w-[180px]">
                                                {client.company}
                                            </h3>
                                            {/* Industry Badge */}
                                            {client.industry && (
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] mt-1 ${
                                                    client.industry.toLowerCase().includes('tech') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                    client.industry.toLowerCase().includes('finance') || client.industry.toLowerCase().includes('bank') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    client.industry.toLowerCase().includes('health') || client.industry.toLowerCase().includes('pharma') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    client.industry.toLowerCase().includes('media') || client.industry.toLowerCase().includes('entertainment') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                    client.industry.toLowerCase().includes('retail') || client.industry.toLowerCase().includes('ecommerce') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                    client.industry.toLowerCase().includes('energy') || client.industry.toLowerCase().includes('oil') ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                    client.industry.toLowerCase().includes('education') ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                                    client.industry.toLowerCase().includes('government') || client.industry.toLowerCase().includes('public') ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                }`}>
                                                    {client.industry}
                                                </span>
                                            )}
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
                                        (() => {
                                            const primaryContact = client.contacts.find(c => c.isPrimary);
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full ${getAvatarColor(primaryContact.name)} flex items-center justify-center text-[10px] font-bold text-white`}>
                                                        {getInitials(primaryContact.name)}
                                                    </div>
                                                    <span className="text-sm text-gray-300">{primaryContact.name}</span>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        client.contact ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full ${getAvatarColor(client.contact)} flex items-center justify-center text-[10px] font-bold text-white`}>
                                                    {getInitials(client.contact)}
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

                                {/* Last Activity */}
                                <div className="mt-3 pt-3 border-t border-gray-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500 uppercase">Last Activity</span>
                                        <span className={`text-xs font-medium ${
                                            client.daysSinceActivity === null ? 'text-gray-500' :
                                            client.daysSinceActivity <= 7 ? 'text-emerald-400' :
                                            client.daysSinceActivity <= 30 ? 'text-amber-400' :
                                            'text-red-400'
                                        }`}>
                                            {client.daysSinceActivity === null ? 'No activity' :
                                             client.daysSinceActivity === 0 ? 'Today' :
                                             client.daysSinceActivity === 1 ? 'Yesterday' :
                                             `${client.daysSinceActivity} days ago`}
                                        </span>
                                    </div>
                                </div>
                                {/* Delete Button */}
                                <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to delete ${client.company}? This will also delete all associated quotes.`)) {
                                                deleteClient(client.id);
                                            }
                                        }}
                                        className="p-2 min-w-[40px] min-h-[40px] text-gray-500 hover:text-red-400 bg-dark-card/80 backdrop-blur rounded-lg border border-dark-border shadow-sm hover:shadow-md transition-all flex items-center justify-center"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm rounded-lg bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-accent-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                                        currentPage === pageNum
                                            ? 'bg-accent-primary text-white'
                                            : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-accent-primary/50'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-accent-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Add Client Modal */}
            {
                isAddClientModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md modal-backdrop p-4">
                        <div className="bg-[#1a1f2e] border border-dark-border rounded-xl p-4 sm:p-6 w-full max-w-lg shadow-2xl modal-content relative max-h-[90vh] overflow-y-auto">
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
                                        <label htmlFor="company-name" className="label label-required">Company Legal Name</label>
                                        <input
                                            id="company-name"
                                            type="text"
                                            required
                                            value={newClientData.company}
                                            onChange={e => {
                                                setNewClientData({ ...newClientData, company: e.target.value });
                                                if (formErrors.company) setFormErrors({ ...formErrors, company: null });
                                            }}
                                            className={`input w-full ${formErrors.company ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="e.g. Acme Corporation Ltd"
                                            aria-invalid={formErrors.company ? 'true' : 'false'}
                                            aria-describedby={formErrors.company ? 'company-error' : 'company-hint'}
                                        />
                                        <p id="company-hint" className="text-xs text-gray-500 mt-1">Enter the official registered company name</p>
                                        {formErrors.company && (
                                            <p id="company-error" className="text-xs text-red-400 mt-1 flex items-center gap-1" role="alert">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formErrors.company}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <label htmlFor="website" className="label">Website</label>
                                        <input
                                            id="website"
                                            type="text"
                                            value={newClientData.website}
                                            onChange={e => {
                                                setNewClientData({ ...newClientData, website: e.target.value });
                                                if (formErrors.website) setFormErrors({ ...formErrors, website: null });
                                            }}
                                            className={`input w-full ${formErrors.website ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="www.acme.com or acme.com"
                                            aria-invalid={formErrors.website ? 'true' : 'false'}
                                            aria-describedby={formErrors.website ? 'website-error' : undefined}
                                        />
                                        {formErrors.website && (
                                            <p id="website-error" className="text-xs text-red-400 mt-1 flex items-center gap-1" role="alert">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formErrors.website}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="label">Industry / Sector</label>
                                        <input
                                            type="text"
                                            value={newClientData.industry}
                                            onChange={e => setNewClientData({ ...newClientData, industry: e.target.value })}
                                            className="input w-full"
                                            placeholder="e.g. Technology, Healthcare, Finance"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Payment Terms</label>
                                            <select
                                                value={newClientData.paymentTerms || 'net30'}
                                                onChange={e => setNewClientData({ ...newClientData, paymentTerms: e.target.value })}
                                                className="input w-full"
                                            >
                                                <option value="immediate">Immediate</option>
                                                <option value="net7">Net 7</option>
                                                <option value="net14">Net 14</option>
                                                <option value="net30">Net 30</option>
                                                <option value="net45">Net 45</option>
                                                <option value="net60">Net 60</option>
                                                <option value="net90">Net 90</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Preferred Currency</label>
                                            <select
                                                value={newClientData.preferredCurrency || 'USD'}
                                                onChange={e => setNewClientData({ ...newClientData, preferredCurrency: e.target.value })}
                                                className="input w-full"
                                            >
                                                <option value="USD">USD - US Dollar</option>
                                                <option value="MYR">MYR - Malaysian Ringgit</option>
                                                <option value="SGD">SGD - Singapore Dollar</option>
                                                <option value="GBP">GBP - British Pound</option>
                                                <option value="EUR">EUR - Euro</option>
                                                <option value="AED">AED - UAE Dirham</option>
                                                <option value="SAR">SAR - Saudi Riyal</option>
                                            </select>
                                        </div>
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="contact-email" className="label">Email Address</label>
                                                <input
                                                    id="contact-email"
                                                    type="email"
                                                    value={newClientData.email}
                                                    onChange={e => {
                                                        setNewClientData({ ...newClientData, email: e.target.value });
                                                        if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                                                    }}
                                                    className={`input w-full ${formErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                    placeholder="john@acme.com"
                                                    aria-invalid={formErrors.email ? 'true' : 'false'}
                                                    aria-describedby={formErrors.email ? 'email-error' : undefined}
                                                    autoComplete="email"
                                                />
                                                {formErrors.email && (
                                                    <p id="email-error" className="text-xs text-red-400 mt-1 flex items-center gap-1" role="alert">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {formErrors.email}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label htmlFor="contact-phone" className="label">Phone Number</label>
                                                <input
                                                    id="contact-phone"
                                                    type="tel"
                                                    value={newClientData.phone}
                                                    onChange={e => {
                                                        setNewClientData({ ...newClientData, phone: e.target.value });
                                                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                                                    }}
                                                    className={`input w-full ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                    placeholder="+1 555 123 4567"
                                                    aria-invalid={formErrors.phone ? 'true' : 'false'}
                                                    aria-describedby={formErrors.phone ? 'phone-error' : 'phone-hint'}
                                                    autoComplete="tel"
                                                />
                                                <p id="phone-hint" className="text-xs text-gray-500 mt-1">Include country code</p>
                                                {formErrors.phone && (
                                                    <p id="phone-error" className="text-xs text-red-400 mt-1 flex items-center gap-1" role="alert">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {formErrors.phone}
                                                    </p>
                                                )}
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

            {/* Feature gate upgrade prompt */}
            <PromptComponent />

            {/* CSV Import Modal */}
            <CSVImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                dataType="clients"
                onImportComplete={(result) => {
                    toast.success(`Imported ${result.imported} clients successfully`);
                    setIsImportModalOpen(false);
                }}
            />
        </div >
    );
}
