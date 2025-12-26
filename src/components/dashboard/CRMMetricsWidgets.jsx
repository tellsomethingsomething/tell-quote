import React, { useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Target, Clock, Users,
    Phone, Calendar, Mail, FileText, Activity,
    Award, Zap, BarChart3, PieChart
} from 'lucide-react';
import { useOpportunityStore } from '../../store/opportunityStore';
import { useActivityStore } from '../../store/activityStore';
import { useContactStore } from '../../store/contactStore';
import { useClientStore } from '../../store/clientStore';
import { formatCurrency, convertCurrency } from '../../utils/currency';

// Win Rate Widget
export function WinRateWidget({ dashboardCurrency, rates, timeRange = 'all' }) {
    const { opportunities } = useOpportunityStore();
    const { savedQuotes } = useClientStore();

    const stats = useMemo(() => {
        // Calculate from opportunities
        const closedOpps = opportunities.filter(o => o.status === 'won' || o.status === 'lost');
        const wonOpps = closedOpps.filter(o => o.status === 'won');
        const oppWinRate = closedOpps.length > 0 ? (wonOpps.length / closedOpps.length) * 100 : 0;

        // Calculate from quotes
        const closedQuotes = savedQuotes.filter(q => q.status === 'won' || q.status === 'dead');
        const wonQuotes = closedQuotes.filter(q => q.status === 'won');
        const quoteWinRate = closedQuotes.length > 0 ? (wonQuotes.length / closedQuotes.length) * 100 : 0;

        // Combined win rate
        const totalClosed = closedOpps.length + closedQuotes.length;
        const totalWon = wonOpps.length + wonQuotes.length;
        const combinedWinRate = totalClosed > 0 ? (totalWon / totalClosed) * 100 : 0;

        // Won value
        const wonValue = wonOpps.reduce((sum, o) =>
            sum + convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates), 0
        );

        return {
            winRate: combinedWinRate,
            wonCount: totalWon,
            lostCount: totalClosed - totalWon,
            totalClosed,
            wonValue,
            trend: combinedWinRate >= 50 ? 'up' : 'down',
        };
    }, [opportunities, savedQuotes, dashboardCurrency, rates]);

    const TrendIcon = stats.trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = stats.trend === 'up' ? 'text-green-400' : 'text-red-400';

    return (
        <div className="card bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 border-emerald-800/20 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Win Rate</span>
                </div>
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            </div>

            <div className="space-y-3">
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-emerald-400">{stats.winRate.toFixed(0)}%</span>
                    <span className="text-sm text-gray-500 pb-1">of deals closed</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                        style={{ width: `${Math.min(stats.winRate, 100)}%` }}
                    />
                </div>

                <div className="flex justify-between text-xs">
                    <span className="text-green-400">{stats.wonCount} won</span>
                    <span className="text-red-400">{stats.lostCount} lost</span>
                </div>

                {stats.wonValue > 0 && (
                    <div className="pt-2 border-t border-emerald-800/30">
                        <span className="text-xs text-gray-500">Won Value</span>
                        <p className="text-sm font-semibold text-emerald-400">
                            {formatCurrency(stats.wonValue, dashboardCurrency, 0)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sales Velocity Widget
export function SalesVelocityWidget({ dashboardCurrency, rates }) {
    const { opportunities } = useOpportunityStore();
    const { savedQuotes } = useClientStore();

    const velocity = useMemo(() => {
        // Get won opportunities with close dates
        const wonOpps = opportunities.filter(o =>
            o.status === 'won' && o.close_date && o.created_at
        );

        // Calculate average deal value (won)
        const avgDealValue = wonOpps.length > 0
            ? wonOpps.reduce((sum, o) =>
                sum + convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates), 0
            ) / wonOpps.length
            : 0;

        // Calculate average sales cycle (days)
        let avgCycle = 0;
        if (wonOpps.length > 0) {
            const cycles = wonOpps.map(o => {
                const created = new Date(o.created_at);
                const closed = new Date(o.close_date);
                return Math.ceil((closed - created) / (1000 * 60 * 60 * 24));
            }).filter(d => d > 0);

            if (cycles.length > 0) {
                avgCycle = cycles.reduce((sum, c) => sum + c, 0) / cycles.length;
            }
        }

        // Calculate win rate
        const closedOpps = opportunities.filter(o => o.status === 'won' || o.status === 'lost');
        const winRate = closedOpps.length > 0
            ? (wonOpps.length / closedOpps.length) * 100
            : 0;

        // Calculate pipeline value (active deals)
        const activeOpps = opportunities.filter(o => o.status === 'active');
        const pipelineValue = activeOpps.reduce((sum, o) =>
            sum + convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates), 0
        );
        const pipelineCount = activeOpps.length;

        // Sales Velocity = (# Opportunities × Avg Deal Value × Win Rate) / Avg Sales Cycle
        const salesVelocity = avgCycle > 0
            ? (pipelineCount * avgDealValue * (winRate / 100)) / avgCycle
            : 0;

        return {
            velocity: salesVelocity,
            pipelineCount,
            avgDealValue,
            winRate,
            avgCycle,
            pipelineValue,
        };
    }, [opportunities, savedQuotes, dashboardCurrency, rates]);

    return (
        <div className="card bg-gradient-to-br from-cyan-900/20 to-cyan-950/10 border-cyan-800/20 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Sales Velocity</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-cyan-400">
                        {formatCurrency(velocity.velocity, dashboardCurrency, 0)}
                    </span>
                    <span className="text-sm text-gray-500 pb-1">/ day</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-dark-bg/50 rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase">Avg Deal</span>
                        <p className="text-sm font-medium text-white">
                            {formatCurrency(velocity.avgDealValue, dashboardCurrency, 0)}
                        </p>
                    </div>
                    <div className="bg-dark-bg/50 rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase">Avg Cycle</span>
                        <p className="text-sm font-medium text-white">
                            {velocity.avgCycle.toFixed(0)} days
                        </p>
                    </div>
                    <div className="bg-dark-bg/50 rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase">Win Rate</span>
                        <p className="text-sm font-medium text-white">
                            {velocity.winRate.toFixed(0)}%
                        </p>
                    </div>
                    <div className="bg-dark-bg/50 rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase">Pipeline</span>
                        <p className="text-sm font-medium text-white">
                            {velocity.pipelineCount} deals
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Activity Summary Widget
export function ActivitySummaryWidget() {
    const { activities } = useActivityStore();

    const stats = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentActivities = activities.filter(a =>
            new Date(a.created_at) >= sevenDaysAgo
        );

        const monthActivities = activities.filter(a =>
            new Date(a.created_at) >= thirtyDaysAgo
        );

        // Group by type
        const byType = {};
        recentActivities.forEach(a => {
            const type = a.activity_type || 'other';
            byType[type] = (byType[type] || 0) + 1;
        });

        return {
            weekTotal: recentActivities.length,
            monthTotal: monthActivities.length,
            calls: byType.call || 0,
            meetings: byType.meeting || 0,
            emails: byType.email || 0,
            notes: byType.note || 0,
            tasks: byType.task || 0,
            avgPerDay: Math.round(recentActivities.length / 7),
        };
    }, [activities]);

    const activityTypes = [
        { type: 'calls', label: 'Calls', count: stats.calls, icon: Phone, color: 'text-blue-400' },
        { type: 'meetings', label: 'Meetings', count: stats.meetings, icon: Calendar, color: 'text-green-400' },
        { type: 'emails', label: 'Emails', count: stats.emails, icon: Mail, color: 'text-amber-400' },
        { type: 'notes', label: 'Notes', count: stats.notes, icon: FileText, color: 'text-purple-400' },
    ];

    return (
        <div className="card bg-gradient-to-br from-indigo-900/20 to-indigo-950/10 border-indigo-800/20 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Activity (7 Days)</span>
                </div>
                <span className="text-xs text-gray-500">{stats.avgPerDay}/day avg</span>
            </div>

            <div className="space-y-3">
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-indigo-400">{stats.weekTotal}</span>
                    <span className="text-sm text-gray-500 pb-1">activities logged</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {activityTypes.map(({ type, label, count, icon: Icon, color }) => (
                        <div key={type} className="text-center">
                            <div className="flex justify-center mb-1">
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <span className="text-lg font-semibold text-white block">{count}</span>
                            <span className="text-[10px] text-gray-500">{label}</span>
                        </div>
                    ))}
                </div>

                <div className="pt-2 border-t border-indigo-800/30 flex justify-between text-xs">
                    <span className="text-gray-500">Last 30 days</span>
                    <span className="text-indigo-400 font-medium">{stats.monthTotal} activities</span>
                </div>
            </div>
        </div>
    );
}

// Contact Coverage Widget
export function ContactCoverageWidget() {
    const { contacts } = useContactStore();
    const { clients } = useClientStore();

    const stats = useMemo(() => {
        const totalContacts = contacts.length;
        const primaryContacts = contacts.filter(c => c.is_primary).length;

        // Group by role
        const byRole = {};
        contacts.forEach(c => {
            const role = c.role || 'unknown';
            byRole[role] = (byRole[role] || 0) + 1;
        });

        // Clients with contacts
        const clientsWithContacts = new Set(contacts.map(c => c.client_id)).size;
        const totalClients = clients.length;
        const coverageRate = totalClients > 0 ? (clientsWithContacts / totalClients) * 100 : 0;

        return {
            totalContacts,
            primaryContacts,
            decisionMakers: byRole.decision_maker || 0,
            champions: byRole.champion || 0,
            influencers: byRole.influencer || 0,
            clientsWithContacts,
            totalClients,
            coverageRate,
        };
    }, [contacts, clients]);

    return (
        <div className="card bg-gradient-to-br from-violet-900/20 to-violet-950/10 border-violet-800/20 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Contact Coverage</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-violet-400">{stats.totalContacts}</span>
                    <span className="text-sm text-gray-500 pb-1">contacts</span>
                </div>

                {/* Coverage bar */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Client Coverage</span>
                        <span className="text-violet-400">{stats.coverageRate.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-400"
                            style={{ width: `${stats.coverageRate}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1">
                        {stats.clientsWithContacts} of {stats.totalClients} clients have contacts
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center bg-dark-bg/50 rounded-lg py-2">
                        <span className="text-lg font-semibold text-amber-400 block">{stats.decisionMakers}</span>
                        <span className="text-[10px] text-gray-500">Decision Makers</span>
                    </div>
                    <div className="text-center bg-dark-bg/50 rounded-lg py-2">
                        <span className="text-lg font-semibold text-green-400 block">{stats.champions}</span>
                        <span className="text-[10px] text-gray-500">Champions</span>
                    </div>
                    <div className="text-center bg-dark-bg/50 rounded-lg py-2">
                        <span className="text-lg font-semibold text-blue-400 block">{stats.influencers}</span>
                        <span className="text-[10px] text-gray-500">Influencers</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Pipeline Health Widget
export function PipelineHealthWidget({ dashboardCurrency, rates }) {
    const { opportunities } = useOpportunityStore();

    const health = useMemo(() => {
        const now = new Date();
        const activeOpps = opportunities.filter(o => o.status === 'active');

        // Calculate metrics
        let staleCount = 0;
        let atRiskCount = 0;
        let healthyCount = 0;
        let totalValue = 0;

        activeOpps.forEach(opp => {
            const value = convertCurrency(opp.value || 0, opp.currency || 'USD', dashboardCurrency, rates);
            totalValue += value;

            const lastActivity = opp.last_activity_at ? new Date(opp.last_activity_at) : new Date(opp.created_at);
            const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

            if (daysSinceActivity > 30) {
                staleCount++;
            } else if (daysSinceActivity > 14) {
                atRiskCount++;
            } else {
                healthyCount++;
            }
        });

        const healthScore = activeOpps.length > 0
            ? Math.round((healthyCount / activeOpps.length) * 100)
            : 100;

        return {
            totalDeals: activeOpps.length,
            totalValue,
            healthyCount,
            atRiskCount,
            staleCount,
            healthScore,
        };
    }, [opportunities, dashboardCurrency, rates]);

    const getHealthColor = (score) => {
        if (score >= 70) return 'text-green-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="card bg-gradient-to-br from-teal-900/20 to-teal-950/10 border-teal-800/20 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-teal-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Pipeline Health</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className={`text-3xl font-bold ${getHealthColor(health.healthScore)}`}>
                            {health.healthScore}%
                        </span>
                        <span className="text-sm text-gray-500 ml-2">healthy</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-semibold text-white">
                            {formatCurrency(health.totalValue, dashboardCurrency, 0)}
                        </span>
                        <span className="text-xs text-gray-500 block">{health.totalDeals} deals</span>
                    </div>
                </div>

                <div className="flex gap-1 h-3">
                    {health.healthyCount > 0 && (
                        <div
                            className="bg-green-500 rounded-l"
                            style={{ width: `${(health.healthyCount / health.totalDeals) * 100}%` }}
                            title={`${health.healthyCount} healthy`}
                        />
                    )}
                    {health.atRiskCount > 0 && (
                        <div
                            className="bg-amber-500"
                            style={{ width: `${(health.atRiskCount / health.totalDeals) * 100}%` }}
                            title={`${health.atRiskCount} at risk`}
                        />
                    )}
                    {health.staleCount > 0 && (
                        <div
                            className="bg-red-500 rounded-r"
                            style={{ width: `${(health.staleCount / health.totalDeals) * 100}%` }}
                            title={`${health.staleCount} stale`}
                        />
                    )}
                </div>

                <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-400">{health.healthyCount} Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-gray-400">{health.atRiskCount} At Risk</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-400">{health.staleCount} Stale</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Combined CRM Metrics Grid
export default function CRMMetricsGrid({ dashboardCurrency, rates }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WinRateWidget dashboardCurrency={dashboardCurrency} rates={rates} />
            <SalesVelocityWidget dashboardCurrency={dashboardCurrency} rates={rates} />
            <ActivitySummaryWidget />
            <PipelineHealthWidget dashboardCurrency={dashboardCurrency} rates={rates} />
        </div>
    );
}
