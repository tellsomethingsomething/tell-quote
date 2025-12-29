import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

// Plan pricing for MRR calculations (USD)
const PLAN_PRICING = {
    individual: { monthly: 24, annual: 228 / 12 },
    team: { monthly: 49, annual: 468 / 12 },
};

// Admin-only guard
function AdminGuard({ children }) {
    const { user } = useAuthStore();
    const isAdmin = useAuthStore(state => state.isAdmin);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-bg">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Not Authenticated</h2>
                    <p className="text-gray-400">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    if (!isAdmin()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-bg">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400">You need admin privileges to view this page.</p>
                </div>
            </div>
        );
    }

    return children;
}

// Stat Card Component
function StatCard({ title, value, change, changeLabel, icon, color = 'text-accent-primary' }) {
    const isPositive = change > 0;
    const isNegative = change < 0;

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">{title}</span>
                <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('400', '500/10')}`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            {change !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                    <span className={isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'}>
                        {isPositive ? '+' : ''}{change}%
                    </span>
                    <span className="text-gray-500">{changeLabel || 'vs last month'}</span>
                </div>
            )}
        </div>
    );
}

// MRR Chart Component
function MRRChart({ data }) {
    const maxValue = Math.max(...data.map(d => d.mrr), 1);

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
            <h3 className="font-medium text-white mb-4">Monthly Recurring Revenue</h3>
            <div className="h-48 flex items-end gap-1">
                {data.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                            className="w-full bg-accent-primary/80 rounded-t transition-all hover:bg-accent-primary"
                            style={{ height: `${(item.mrr / maxValue) * 100}%`, minHeight: '4px' }}
                            title={`$${item.mrr.toLocaleString()}`}
                        />
                        <span className="text-xs text-gray-500">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Subscription Table
function SubscriptionTable({ subscriptions }) {
    return (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-border">
                <h3 className="font-medium text-white">Recent Subscriptions</h3>
            </div>
            <div className="divide-y divide-dark-border max-h-[400px] overflow-y-auto">
                {subscriptions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No subscriptions yet</div>
                ) : (
                    subscriptions.slice(0, 20).map((sub) => (
                        <div key={sub.id} className="px-5 py-3 flex items-center justify-between hover:bg-dark-bg/50">
                            <div>
                                <div className="font-medium text-gray-200">{sub.org_name || 'Unknown Org'}</div>
                                <div className="text-sm text-gray-500">{sub.email || 'No email'}</div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-medium ${
                                    sub.tier === 'team' ? 'text-purple-400' :
                                    sub.tier === 'individual' ? 'text-blue-400' : 'text-gray-400'
                                }`}>
                                    {sub.tier?.charAt(0).toUpperCase() + sub.tier?.slice(1) || 'Free'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {sub.status === 'active' ? 'Active' :
                                     sub.status === 'trialing' ? 'Trial' :
                                     sub.status === 'canceled' ? 'Canceled' : sub.status}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// System Status Component
function SystemStatus() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(null);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check`,
                {
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                }
            );
            const data = await response.json();
            setStatus(data);
            setLastChecked(new Date());
        } catch (error) {
            setStatus({ status: 'unhealthy', error: error.message, checks: {} });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
        // Refresh every 60 seconds
        const interval = setInterval(checkHealth, 60000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'text-green-400 bg-green-500/10';
            case 'degraded': return 'text-amber-400 bg-amber-500/10';
            case 'unhealthy': return 'text-red-400 bg-red-500/10';
            default: return 'text-gray-400 bg-gray-500/10';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy':
                return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
            case 'degraded':
                return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
            case 'unhealthy':
                return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
            default:
                return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
        }
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">System Status</h3>
                <button
                    onClick={checkHealth}
                    disabled={loading}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                    <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {status && (
                <>
                    {/* Overall Status */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${getStatusColor(status.status)}`}>
                        {getStatusIcon(status.status)}
                        {status.status?.charAt(0).toUpperCase() + status.status?.slice(1)}
                    </div>

                    {/* Individual Checks */}
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(status.checks || {}).map(([name, check]) => (
                            <div key={name} className="flex items-center justify-between p-2 bg-dark-bg rounded">
                                <span className="text-sm text-gray-400 capitalize">{name}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(check.status)}`}>
                                    {check.status}
                                    {check.latency && ` (${check.latency}ms)`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {lastChecked && (
                        <p className="text-xs text-gray-600 mt-3">
                            Last checked: {lastChecked.toLocaleTimeString()}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

// Plan Distribution Chart
function PlanDistribution({ data }) {
    const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
            <h3 className="font-medium text-white mb-4">Customers by Plan</h3>
            <div className="space-y-3">
                {data.map((item) => (
                    <div key={item.plan}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-300">{item.plan}</span>
                            <span className="text-gray-400">{item.count} ({Math.round((item.count / total) * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${item.color}`}
                                style={{ width: `${(item.count / total) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Trial Conversion Funnel
function ConversionFunnel({ data }) {
    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
            <h3 className="font-medium text-white mb-4">Trial Conversion Funnel</h3>
            <div className="space-y-4">
                {data.map((step, i) => (
                    <div key={step.label}>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-300">{step.label}</span>
                            <span className="text-gray-400">{step.count}</span>
                        </div>
                        <div className="relative">
                            <div className="h-8 bg-dark-bg rounded">
                                <div
                                    className={`h-full rounded ${
                                        i === 0 ? 'bg-blue-500' :
                                        i === 1 ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${step.percent}%` }}
                                />
                            </div>
                            {i < data.length - 1 && (
                                <div className="absolute -bottom-3 left-1/2 text-xs text-gray-500">
                                    ↓ {step.dropoff}% dropoff
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        mrr: 0,
        arr: 0,
        totalCustomers: 0,
        paidCustomers: 0,
        trialUsers: 0,
        churnRate: 0,
        conversionRate: 0,
        mrrGrowth: 0,
    });
    const [subscriptions, setSubscriptions] = useState([]);
    const [mrrHistory, setMrrHistory] = useState([]);
    const [planDistribution, setPlanDistribution] = useState([]);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            // Fetch organizations with subscription data
            const { data: orgs, error: orgsError } = await supabase
                .from('organizations')
                .select(`
                    id,
                    name,
                    subscription_tier,
                    subscription_status,
                    trial_ends_at,
                    created_at,
                    stripe_customer_id
                `)
                .order('created_at', { ascending: false });

            if (orgsError) throw orgsError;

            // Fetch user profiles to get emails
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('organization_id, email, name');

            // Map emails to organizations
            const orgEmails = {};
            profiles?.forEach(p => {
                if (p.organization_id && !orgEmails[p.organization_id]) {
                    orgEmails[p.organization_id] = p.email;
                }
            });

            // Calculate stats
            const now = new Date();
            const thirtyDaysAgo = subDays(now, 30);

            const allOrgs = orgs || [];
            const paidOrgs = allOrgs.filter(o =>
                o.subscription_tier &&
                o.subscription_tier !== 'free' &&
                o.subscription_status === 'active'
            );
            const trialOrgs = allOrgs.filter(o => o.subscription_status === 'trialing');
            const recentOrgs = allOrgs.filter(o => new Date(o.created_at) >= thirtyDaysAgo);

            // Calculate MRR
            let mrr = 0;
            paidOrgs.forEach(org => {
                const pricing = PLAN_PRICING[org.subscription_tier];
                if (pricing) {
                    mrr += pricing.monthly; // Assume monthly for simplicity
                }
            });

            // Calculate conversion rate (trials that converted in last 30 days)
            const expiredTrials = allOrgs.filter(o =>
                o.trial_ends_at &&
                new Date(o.trial_ends_at) < now &&
                new Date(o.trial_ends_at) >= thirtyDaysAgo
            );
            const convertedTrials = expiredTrials.filter(o =>
                o.subscription_tier &&
                o.subscription_tier !== 'free'
            );
            const conversionRate = expiredTrials.length > 0
                ? Math.round((convertedTrials.length / expiredTrials.length) * 100)
                : 0;

            // Calculate churn (canceled in last 30 days / active at start)
            const canceledOrgs = allOrgs.filter(o => o.subscription_status === 'canceled');
            const churnRate = paidOrgs.length > 0
                ? Math.round((canceledOrgs.length / (paidOrgs.length + canceledOrgs.length)) * 100)
                : 0;

            // Plan distribution
            const planCounts = {
                free: allOrgs.filter(o => !o.subscription_tier || o.subscription_tier === 'free').length,
                individual: allOrgs.filter(o => o.subscription_tier === 'individual').length,
                team: allOrgs.filter(o => o.subscription_tier === 'team').length,
            };

            setPlanDistribution([
                { plan: 'Free', count: planCounts.free, color: 'bg-gray-500' },
                { plan: 'Individual', count: planCounts.individual, color: 'bg-blue-500' },
                { plan: 'Team', count: planCounts.team, color: 'bg-purple-500' },
            ]);

            // Generate MRR history (mock for last 6 months based on current)
            const mrrData = [];
            for (let i = 5; i >= 0; i--) {
                const monthDate = subDays(now, i * 30);
                const factor = 1 - (i * 0.15); // Simulate growth
                mrrData.push({
                    label: format(monthDate, 'MMM'),
                    mrr: Math.round(mrr * Math.max(0.1, factor)),
                });
            }
            setMrrHistory(mrrData);

            // Format subscriptions for table
            const subsData = allOrgs
                .filter(o => o.subscription_tier && o.subscription_tier !== 'free')
                .map(o => ({
                    id: o.id,
                    org_name: o.name,
                    email: orgEmails[o.id],
                    tier: o.subscription_tier,
                    status: o.subscription_status,
                }));
            setSubscriptions(subsData);

            setStats({
                mrr,
                arr: mrr * 12,
                totalCustomers: allOrgs.length,
                paidCustomers: paidOrgs.length,
                trialUsers: trialOrgs.length,
                churnRate,
                conversionRate,
                mrrGrowth: 15, // Placeholder
            });

        } catch (error) {
            console.error('Failed to load admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const conversionFunnelData = useMemo(() => {
        const signups = stats.totalCustomers;
        const trials = stats.trialUsers + stats.paidCustomers; // Ever trialed
        const converted = stats.paidCustomers;

        return [
            { label: 'Signups', count: signups, percent: 100, dropoff: signups > 0 ? Math.round((1 - trials / signups) * 100) : 0 },
            { label: 'Started Trial', count: trials, percent: signups > 0 ? Math.round((trials / signups) * 100) : 0, dropoff: trials > 0 ? Math.round((1 - converted / trials) * 100) : 0 },
            { label: 'Converted', count: converted, percent: signups > 0 ? Math.round((converted / signups) * 100) : 0 },
        ];
    }, [stats]);

    if (loading) {
        return (
            <AdminGuard>
                <div className="min-h-screen bg-dark-bg p-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-dark-border rounded w-1/4" />
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 bg-dark-border rounded" />
                            ))}
                        </div>
                    </div>
                </div>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <div className="min-h-screen bg-dark-bg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
                        <p className="text-gray-400">Business metrics and customer analytics</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            title="Monthly Recurring Revenue"
                            value={formatCurrency(stats.mrr, 'USD')}
                            change={stats.mrrGrowth}
                            icon={<svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            color="text-green-400"
                        />
                        <StatCard
                            title="Paid Customers"
                            value={stats.paidCustomers.toString()}
                            change={12}
                            icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            color="text-blue-400"
                        />
                        <StatCard
                            title="Trial Conversion Rate"
                            value={`${stats.conversionRate}%`}
                            change={5}
                            icon={<svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                            color="text-purple-400"
                        />
                        <StatCard
                            title="Churn Rate"
                            value={`${stats.churnRate}%`}
                            change={-2}
                            changeLabel="vs last month"
                            icon={<svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                            color="text-amber-400"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <MRRChart data={mrrHistory} />
                        <PlanDistribution data={planDistribution} />
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <ConversionFunnel data={conversionFunnelData} />
                        <SystemStatus />
                        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                            <h3 className="font-medium text-white mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Annual Recurring Revenue</span>
                                    <span className="font-semibold text-white">{formatCurrency(stats.arr, 'USD')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Total Organizations</span>
                                    <span className="font-semibold text-white">{stats.totalCustomers}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Active Trials</span>
                                    <span className="font-semibold text-white">{stats.trialUsers}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Free Users</span>
                                    <span className="font-semibold text-white">{stats.totalCustomers - stats.paidCustomers - stats.trialUsers}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Avg Revenue Per User</span>
                                    <span className="font-semibold text-white">
                                        {stats.paidCustomers > 0
                                            ? formatCurrency(stats.mrr / stats.paidCustomers, 'USD')
                                            : '$0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscriptions Table */}
                    <SubscriptionTable subscriptions={subscriptions} />
                </div>
            </div>
        </AdminGuard>
    );
}
