import { useMemo, useState, useEffect, useRef } from 'react';
import { useClientStore } from '../store/clientStore';
import { useSettingsStore } from '../store/settingsStore';
import { useOpportunityStore, REGIONS } from '../store/opportunityStore';
import { calculateGrandTotalWithFees } from '../utils/calculations';
import { formatCurrency, convertCurrency } from '../utils/currency';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    ComposedChart
} from 'recharts';

const COLORS = {
    teal: '#6E44FF',
    tealLight: '#14B8A6',
    navy: '#143642',
    orange: '#FE7F2D',
    green: '#10B981',
    red: '#EF4444',
    purple: '#8B5CF6',
    amber: '#F59E0B',
    blue: '#3B82F6',
    pink: '#EC4899',
};

const PIE_COLORS = [COLORS.teal, COLORS.navy, COLORS.orange, COLORS.green, COLORS.purple, COLORS.amber];

export default function FSPage({ onExit }) {
    const { savedQuotes, clients } = useClientStore();
    const { settings } = useSettingsStore();
    const { opportunities } = useOpportunityStore();
    const rates = settings.exchangeRates || {};
    const [currency] = useState('USD');
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Enter fullscreen on mount
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (containerRef.current && document.fullscreenEnabled) {
                    await containerRef.current.requestFullscreen();
                    setIsFullscreen(true);
                }
            } catch (err) {
                console.log('Fullscreen not available');
            }
        };
        enterFullscreen();

        // Listen for fullscreen changes
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (containerRef.current) {
                await containerRef.current.requestFullscreen();
            }
        } catch (err) {
            console.log('Fullscreen toggle failed');
        }
    };

    const handleExit = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().then(() => onExit()).catch(() => onExit());
        } else {
            onExit();
        }
    };

    // Monthly revenue data (last 12 months)
    const monthlyData = useMemo(() => {
        const months = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                monthKey,
                revenue: 0,
                profit: 0,
                cost: 0,
                won: 0,
                pipeline: 0,
                quotes: 0,
            });
        }

        savedQuotes.forEach(q => {
            const startDate = q.project?.startDate ? new Date(q.project.startDate) :
                              q.createdAt ? new Date(q.createdAt) : null;
            if (!startDate) return;

            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
            const monthData = months.find(m => m.monthKey === monthKey);
            if (!monthData) return;

            const calcs = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
            const revenue = convertCurrency(calcs.totalCharge, q.currency || 'USD', currency, rates);
            const cost = convertCurrency(calcs.totalCost, q.currency || 'USD', currency, rates);
            const profit = revenue - cost;

            monthData.quotes++;

            if (q.status === 'won' || q.status === 'approved') {
                monthData.revenue += revenue;
                monthData.profit += profit;
                monthData.cost += cost;
                monthData.won++;
            } else if (q.status !== 'dead') {
                monthData.pipeline += revenue;
            }
        });

        return months;
    }, [savedQuotes, rates, currency]);

    // Status distribution
    const statusData = useMemo(() => {
        const statuses = { draft: 0, sent: 0, approved: 0, won: 0, dead: 0 };
        savedQuotes.forEach(q => {
            if (statuses[q.status] !== undefined) {
                statuses[q.status]++;
            }
        });
        return [
            { name: 'Draft', value: statuses.draft, color: '#6B7280' },
            { name: 'Sent', value: statuses.sent, color: COLORS.blue },
            { name: 'Approved', value: statuses.approved, color: COLORS.amber },
            { name: 'Won', value: statuses.won, color: COLORS.green },
            { name: 'Lost', value: statuses.dead, color: COLORS.red },
        ].filter(s => s.value > 0);
    }, [savedQuotes]);

    // Top clients by revenue
    const topClients = useMemo(() => {
        const clientRevenue = {};

        savedQuotes.forEach(q => {
            if (q.status !== 'won' && q.status !== 'approved') return;
            const company = q.client?.company || 'Unknown';

            const calcs = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
            const revenue = convertCurrency(calcs.totalCharge, q.currency || 'USD', currency, rates);

            clientRevenue[company] = (clientRevenue[company] || 0) + revenue;
        });

        return Object.entries(clientRevenue)
            .map(([name, revenue]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);
    }, [savedQuotes, rates, currency]);

    // Section breakdown (what services bring most revenue)
    const sectionRevenue = useMemo(() => {
        const sections = {};

        savedQuotes.forEach(q => {
            if (q.status !== 'won' && q.status !== 'approved') return;

            Object.entries(q.sections || {}).forEach(([sectionId, section]) => {
                const sectionName = sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let sectionTotal = 0;

                Object.values(section.subsections || {}).forEach(items => {
                    items.forEach(item => {
                        sectionTotal += (item.charge || 0) * (item.quantity || 1) * (item.days || 1);
                    });
                });

                const revenue = convertCurrency(sectionTotal, q.currency || 'USD', currency, rates);
                sections[sectionName] = (sections[sectionName] || 0) + revenue;
            });
        });

        return Object.entries(sections)
            .map(([name, value]) => ({ name: name.replace('Production ', ''), value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [savedQuotes, rates, currency]);

    // Win rate over time
    const winRateData = useMemo(() => {
        const quarters = [];
        const now = new Date();

        for (let i = 3; i >= 0; i--) {
            const qStart = new Date(now.getFullYear(), now.getMonth() - (i * 3) - 2, 1);
            const qEnd = new Date(now.getFullYear(), now.getMonth() - (i * 3) + 1, 0);

            let won = 0, total = 0;

            savedQuotes.forEach(q => {
                const date = q.createdAt ? new Date(q.createdAt) : null;
                if (!date || date < qStart || date > qEnd) return;

                if (q.status === 'won' || q.status === 'approved' || q.status === 'dead') {
                    total++;
                    if (q.status === 'won' || q.status === 'approved') won++;
                }
            });

            quarters.push({
                quarter: `Q${4 - i}`,
                winRate: total > 0 ? Math.round((won / total) * 100) : 0,
                won,
                lost: total - won,
            });
        }

        return quarters;
    }, [savedQuotes]);

    // Summary stats
    const summaryStats = useMemo(() => {
        let totalRevenue = 0, totalProfit = 0, totalPipeline = 0;
        let wonCount = 0, lostCount = 0;
        let largestDeal = 0;
        let thisMonthRevenue = 0, thisMonthProfit = 0, thisMonthQuotes = 0;
        let ytdRevenue = 0, ytdProfit = 0;
        let pipelineCount = 0;

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        savedQuotes.forEach(q => {
            const calcs = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
            const revenue = convertCurrency(calcs.totalCharge, q.currency || 'USD', currency, rates);
            const cost = convertCurrency(calcs.totalCost, q.currency || 'USD', currency, rates);
            const profit = revenue - cost;

            const createdDate = q.createdAt ? new Date(q.createdAt) : null;
            const isThisMonth = createdDate && createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
            const isThisYear = createdDate && createdDate.getFullYear() === thisYear;

            if (q.status === 'won' || q.status === 'approved') {
                totalRevenue += revenue;
                totalProfit += profit;
                wonCount++;
                if (revenue > largestDeal) largestDeal = revenue;
                if (isThisMonth) {
                    thisMonthRevenue += revenue;
                    thisMonthProfit += profit;
                }
                if (isThisYear) {
                    ytdRevenue += revenue;
                    ytdProfit += profit;
                }
            } else if (q.status === 'dead') {
                lostCount++;
            } else {
                totalPipeline += revenue;
                pipelineCount++;
            }

            if (isThisMonth) thisMonthQuotes++;
        });

        const closedDeals = wonCount + lostCount;

        return {
            totalRevenue,
            totalProfit,
            totalPipeline,
            avgDealSize: wonCount > 0 ? totalRevenue / wonCount : 0,
            winRate: closedDeals > 0 ? Math.round((wonCount / closedDeals) * 100) : 0,
            totalQuotes: savedQuotes.length,
            totalClients: clients.length,
            profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
            largestDeal,
            thisMonthRevenue,
            thisMonthProfit,
            thisMonthQuotes,
            ytdRevenue,
            ytdProfit,
            pipelineCount,
            wonCount,
            lostCount,
        };
    }, [savedQuotes, clients, rates, currency]);

    // Forecast data
    const forecastData = useMemo(() => {
        const now = new Date();
        const data = [];

        for (let i = 0; i < 6; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

            let won = 0, pipeline = 0;

            savedQuotes.forEach(q => {
                if (q.status === 'dead') return;

                const startDate = q.project?.startDate ? new Date(q.project.startDate) : null;
                if (!startDate || startDate < monthDate || startDate > monthEnd) return;

                const calcs = calculateGrandTotalWithFees(q.sections || {}, q.fees || {});
                const revenue = convertCurrency(calcs.totalCharge, q.currency || 'USD', currency, rates);

                if (q.status === 'won' || q.status === 'approved') {
                    won += revenue;
                } else {
                    pipeline += revenue;
                }
            });

            data.push({
                month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
                won,
                pipeline,
                total: won + pipeline,
            });
        }

        return data;
    }, [savedQuotes, rates, currency]);

    // Opportunity stats
    const opportunityStats = useMemo(() => {
        const active = opportunities.filter(o => o.status === 'active');
        const won = opportunities.filter(o => o.status === 'won');
        const lost = opportunities.filter(o => o.status === 'lost');

        const totalValue = active.reduce((sum, o) => {
            const converted = convertCurrency(o.value || 0, o.currency || 'USD', currency, rates);
            return sum + converted;
        }, 0);

        const weightedValue = active.reduce((sum, o) => {
            const prob = (o.probability || 0) / 100;
            const converted = convertCurrency(o.value || 0, o.currency || 'USD', currency, rates);
            return sum + converted * prob;
        }, 0);

        const wonValue = won.reduce((sum, o) => {
            const converted = convertCurrency(o.value || 0, o.currency || 'USD', currency, rates);
            return sum + converted;
        }, 0);

        // By region
        const byRegion = {};
        Object.keys(REGIONS).forEach(region => {
            const regionOpps = active.filter(o => o.region === region);
            byRegion[region] = {
                count: regionOpps.length,
                value: regionOpps.reduce((sum, o) => {
                    const converted = convertCurrency(o.value || 0, o.currency || 'USD', currency, rates);
                    return sum + converted;
                }, 0),
            };
        });

        // By country (top 8)
        const byCountry = {};
        active.forEach(o => {
            const country = o.country || 'Other';
            if (!byCountry[country]) byCountry[country] = { count: 0, value: 0 };
            byCountry[country].count++;
            byCountry[country].value += convertCurrency(o.value || 0, o.currency || 'USD', currency, rates);
        });

        const topCountries = Object.entries(byCountry)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        return {
            activeCount: active.length,
            wonCount: won.length,
            lostCount: lost.length,
            totalValue,
            weightedValue,
            wonValue,
            byRegion,
            topCountries,
            avgProbability: active.length > 0
                ? Math.round(active.reduce((sum, o) => sum + (o.probability || 0), 0) / active.length)
                : 0,
        };
    }, [opportunities, rates, currency]);

    // Opportunity region data for chart
    const opportunityRegionData = useMemo(() => {
        return Object.entries(opportunityStats.byRegion)
            .map(([name, data]) => ({
                name,
                value: data.value,
                count: data.count,
            }))
            .filter(d => d.count > 0);
    }, [opportunityStats]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload) return null;
        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                {payload.map((entry, idx) => (
                    <p key={idx} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {typeof entry.value === 'number' && entry.value > 100
                            ? formatCurrency(entry.value, currency, 0)
                            : entry.value}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-[#0a0a0a] z-50 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800 px-6 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white tracking-wide">ANALYTICS DASHBOARD</h1>
                    <span className={`text-xs px-2 py-1 rounded ${isFullscreen ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>
                        {isFullscreen ? 'FULLSCREEN' : 'WINDOWED'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleFullscreen}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    >
                        {isFullscreen ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={handleExit}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/30 hover:text-red-400"
                    >
                        <span>Exit</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* KPI Strip - Row 1 */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div className="bg-gradient-to-br from-green-900/30 to-green-950/20 border border-green-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-green-400/70 uppercase tracking-wider mb-1">Total Revenue</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(summaryStats.totalRevenue, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-900/30 to-teal-950/20 border border-teal-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-teal-400/70 uppercase tracking-wider mb-1">Total Profit</p>
                        <p className="text-lg font-bold text-teal-400">{formatCurrency(summaryStats.totalProfit, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/20 border border-amber-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-amber-400/70 uppercase tracking-wider mb-1">Pipeline Value</p>
                        <p className="text-lg font-bold text-amber-400">{formatCurrency(summaryStats.totalPipeline, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/20 border border-purple-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-purple-400/70 uppercase tracking-wider mb-1">Avg Deal Size</p>
                        <p className="text-lg font-bold text-purple-400">{formatCurrency(summaryStats.avgDealSize, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/20 border border-blue-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-blue-400/70 uppercase tracking-wider mb-1">Win Rate</p>
                        <p className="text-lg font-bold text-blue-400">{summaryStats.winRate}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/20 border border-pink-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-pink-400/70 uppercase tracking-wider mb-1">Profit Margin</p>
                        <p className="text-lg font-bold text-pink-400">{summaryStats.profitMargin}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-700/30 rounded-xl p-4">
                        <p className="text-[10px] text-gray-400/70 uppercase tracking-wider mb-1">Total Quotes</p>
                        <p className="text-lg font-bold text-gray-300">{summaryStats.totalQuotes}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-700/30 rounded-xl p-4">
                        <p className="text-[10px] text-gray-400/70 uppercase tracking-wider mb-1">Clients</p>
                        <p className="text-lg font-bold text-gray-300">{summaryStats.totalClients}</p>
                    </div>
                </div>

                {/* KPI Strip - Row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/20 border border-cyan-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-cyan-400/70 uppercase tracking-wider mb-1">This Month</p>
                        <p className="text-lg font-bold text-cyan-400">{formatCurrency(summaryStats.thisMonthRevenue, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-1">Month Profit</p>
                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(summaryStats.thisMonthProfit, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/20 border border-indigo-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-indigo-400/70 uppercase tracking-wider mb-1">YTD Revenue</p>
                        <p className="text-lg font-bold text-indigo-400">{formatCurrency(summaryStats.ytdRevenue, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-900/30 to-violet-950/20 border border-violet-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-violet-400/70 uppercase tracking-wider mb-1">YTD Profit</p>
                        <p className="text-lg font-bold text-violet-400">{formatCurrency(summaryStats.ytdProfit, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/20 border border-orange-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-orange-400/70 uppercase tracking-wider mb-1">Largest Deal</p>
                        <p className="text-lg font-bold text-orange-400">{formatCurrency(summaryStats.largestDeal, currency, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-900/30 to-rose-950/20 border border-rose-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-rose-400/70 uppercase tracking-wider mb-1">Quotes This Month</p>
                        <p className="text-lg font-bold text-rose-400">{summaryStats.thisMonthQuotes}</p>
                    </div>
                    <div className="bg-gradient-to-br from-lime-900/30 to-lime-950/20 border border-lime-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-lime-400/70 uppercase tracking-wider mb-1">Deals Won</p>
                        <p className="text-lg font-bold text-lime-400">{summaryStats.wonCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-900/30 to-red-950/20 border border-red-800/30 rounded-xl p-4">
                        <p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-1">Deals Lost</p>
                        <p className="text-lg font-bold text-red-400">{summaryStats.lostCount}</p>
                    </div>
                </div>

                {/* Opportunities KPI Strip */}
                <div className="bg-gradient-to-r from-cyan-900/20 via-teal-900/20 to-emerald-900/20 border border-cyan-800/30 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">Opportunities Pipeline</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Active Opps</p>
                            <p className="text-lg font-bold text-white">{opportunityStats.activeCount}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Pipeline Value</p>
                            <p className="text-lg font-bold text-cyan-400">{formatCurrency(opportunityStats.totalValue, currency, 0)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Weighted Value</p>
                            <p className="text-lg font-bold text-teal-400">{formatCurrency(opportunityStats.weightedValue, currency, 0)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Avg Probability</p>
                            <p className="text-lg font-bold text-amber-400">{opportunityStats.avgProbability}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Opps Won</p>
                            <p className="text-lg font-bold text-green-400">{opportunityStats.wonCount}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Won Value</p>
                            <p className="text-lg font-bold text-green-400">{formatCurrency(opportunityStats.wonValue, currency, 0)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Opps Lost</p>
                            <p className="text-lg font-bold text-red-400">{opportunityStats.lostCount}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Opps</p>
                            <p className="text-lg font-bold text-gray-300">{opportunities.length}</p>
                        </div>
                    </div>
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue & Profit Trend */}
                    <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly Revenue & Profit</h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                                    <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" fill={COLORS.teal} fillOpacity={0.3} stroke={COLORS.teal} strokeWidth={2} />
                                    <Area type="monotone" dataKey="profit" name="Profit" fill={COLORS.green} fillOpacity={0.3} stroke={COLORS.green} strokeWidth={2} />
                                    <Line type="monotone" dataKey="pipeline" name="Pipeline" stroke={COLORS.amber} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quote Status Distribution */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Quote Status</h3>
                        <div className="h-[280px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 6 Month Forecast */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">6-Month Forecast</h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecastData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                                    <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="won" name="Won" stackId="a" fill={COLORS.green} radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="pipeline" name="Pipeline" stackId="a" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Clients */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Clients by Revenue</h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topClients} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" stroke="#6B7280" fontSize={10} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={10} width={100} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="revenue" name="Revenue" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Service Breakdown */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Revenue by Service</h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sectionRevenue}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {sectionRevenue.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Opportunities Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Opportunities by Region */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Opportunities by Region</h3>
                        <div className="h-[200px]">
                            {opportunityRegionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={opportunityRegionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                                        <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Pipeline Value" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">No active opportunities</div>
                            )}
                        </div>
                    </div>

                    {/* Opportunities by Country */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Countries by Opportunity Value</h3>
                        <div className="h-[200px]">
                            {opportunityStats.topCountries.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={opportunityStats.topCountries} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis type="number" stroke="#6B7280" fontSize={10} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                        <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={10} width={100} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Pipeline Value" fill={COLORS.navy} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">No active opportunities</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Third Row - Win Rate & Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Win Rate Trend */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Quarterly Win Rate</h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={winRateData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="quarter" stroke="#6B7280" fontSize={11} />
                                    <YAxis yAxisId="left" stroke="#6B7280" fontSize={11} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="won" name="Won" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="lost" name="Lost" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win Rate %" stroke={COLORS.blue} strokeWidth={3} dot={{ fill: COLORS.blue, r: 5 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Quote Volume */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly Activity</h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                                    <YAxis stroke="#6B7280" fontSize={11} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area type="monotone" dataKey="quotes" name="Quotes Created" fill={COLORS.purple} fillOpacity={0.4} stroke={COLORS.purple} strokeWidth={2} />
                                    <Area type="monotone" dataKey="won" name="Deals Won" fill={COLORS.green} fillOpacity={0.4} stroke={COLORS.green} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-600 text-xs py-4">
                    ProductionOS Analytics Dashboard &bull; Data refreshes in real-time
                </div>
            </div>
        </div>
    );
}
