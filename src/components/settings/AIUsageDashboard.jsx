import { useState, useEffect } from 'react';
import { useAIUsageStore } from '../../store/aiUsageStore';
import { createTokenPackCheckoutSession } from '../../services/billingService';
import { formatDistanceToNow } from 'date-fns';

// Token pack options
const TOKEN_PACKS = [
    { tokens: 5000, label: '5,000 tokens', description: 'For occasional use', price: '$5' },
    { tokens: 25000, label: '25,000 tokens', description: 'Popular choice', price: '$20', recommended: true },
    { tokens: 100000, label: '100,000 tokens', description: 'Power user', price: '$60' },
];

export default function AIUsageDashboard() {
    const {
        tokensAvailable,
        monthlyAllocation,
        monthlyUsed,
        purchasedTokens,
        purchasedUsed,
        monthlyResetAt,
        usageHistory,
        loading,
        initialize,
        getUsageStats,
        getDaysUntilReset,
    } = useAIUsageStore();

    const [purchaseLoading, setPurchaseLoading] = useState(null);
    const stats = getUsageStats();
    const daysUntilReset = getDaysUntilReset();

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handlePurchaseTokens = async (tokenAmount) => {
        setPurchaseLoading(tokenAmount);
        try {
            await createTokenPackCheckoutSession(tokenAmount);
        } catch (error) {
            console.error('Failed to create checkout:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setPurchaseLoading(null);
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num || 0);
    };

    const getUsageColor = (percent) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const monthlyPercent = monthlyAllocation > 0
        ? Math.min(100, Math.round((monthlyUsed / monthlyAllocation) * 100))
        : 0;

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-dark-border rounded w-1/3" />
                    <div className="h-32 bg-dark-border rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">AI Token Usage</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage your AI token allocation and purchase additional tokens
                    </p>
                </div>
                {stats.isLow && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-amber-400 font-medium">Low on tokens</span>
                    </div>
                )}
            </div>

            {/* Token Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Available Balance */}
                <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-accent-primary/10 rounded-lg">
                            <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-400">Available Tokens</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(tokensAvailable)}
                    </div>
                    <p className="text-xs text-gray-500">
                        {monthlyAllocation > 0 ? 'Monthly + Purchased' : 'From token packs'}
                    </p>
                </div>

                {/* Monthly Allocation */}
                <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-400">Monthly Plan</span>
                    </div>
                    {monthlyAllocation > 0 ? (
                        <>
                            <div className="text-3xl font-bold text-white mb-1">
                                {formatNumber(monthlyAllocation - monthlyUsed)}
                            </div>
                            <p className="text-xs text-gray-500">
                                of {formatNumber(monthlyAllocation)} remaining
                            </p>
                            {/* Progress bar */}
                            <div className="mt-3 h-2 bg-dark-bg rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${getUsageColor(monthlyPercent)}`}
                                    style={{ width: `${monthlyPercent}%` }}
                                />
                            </div>
                            {daysUntilReset && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-xl font-medium text-gray-500 mb-1">—</div>
                            <p className="text-xs text-gray-500">
                                Upgrade to get monthly tokens
                            </p>
                        </>
                    )}
                </div>

                {/* Purchased Tokens */}
                <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-400">Purchased</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(Math.max(0, purchasedTokens - purchasedUsed))}
                    </div>
                    <p className="text-xs text-gray-500">
                        {purchasedTokens > 0 ? `of ${formatNumber(purchasedTokens)} remaining` : 'Never expire'}
                    </p>
                </div>
            </div>

            {/* Purchase Token Packs */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                <h3 className="font-medium text-white mb-1">Purchase Token Packs</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Token packs never expire and can be used anytime
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TOKEN_PACKS.map((pack) => (
                        <div
                            key={pack.tokens}
                            className={`relative p-4 border rounded-lg transition-all ${
                                pack.recommended
                                    ? 'border-accent-primary bg-accent-primary/5'
                                    : 'border-dark-border hover:border-gray-600'
                            }`}
                        >
                            {pack.recommended && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent-primary text-xs text-white rounded-full">
                                    Popular
                                </div>
                            )}
                            <div className="text-lg font-semibold text-white mb-1">
                                {pack.label}
                            </div>
                            <div className="text-sm text-gray-400 mb-3">
                                {pack.description}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-white">{pack.price}</span>
                                <button
                                    onClick={() => handlePurchaseTokens(pack.tokens)}
                                    disabled={purchaseLoading === pack.tokens}
                                    className="px-4 py-1.5 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {purchaseLoading === pack.tokens ? 'Loading...' : 'Buy'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                <h3 className="font-medium text-white mb-4">Usage Statistics</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <div className="text-2xl font-bold text-white">{formatNumber(stats.todayUsage)}</div>
                        <div className="text-sm text-gray-400">Used today</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{formatNumber(stats.weekUsage)}</div>
                        <div className="text-sm text-gray-400">Last 7 days</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{formatNumber(stats.monthlyUsed)}</div>
                        <div className="text-sm text-gray-400">This month</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{Object.keys(stats.byFeature).length}</div>
                        <div className="text-sm text-gray-400">Features used</div>
                    </div>
                </div>

                {/* Usage by Feature */}
                {Object.keys(stats.byFeature).length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Usage by Feature</h4>
                        <div className="space-y-2">
                            {Object.entries(stats.byFeature)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([feature, tokens]) => {
                                    const percent = Math.round((tokens / stats.monthlyUsed) * 100) || 0;
                                    return (
                                        <div key={feature}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-gray-300 capitalize">{feature.replace(/_/g, ' ')}</span>
                                                <span className="text-gray-400">{formatNumber(tokens)} tokens</span>
                                            </div>
                                            <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-primary/70 rounded-full"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Usage History */}
            {usageHistory.length > 0 && (
                <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                    <h3 className="font-medium text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {usageHistory.slice(0, 10).map((log) => (
                            <div
                                key={log.id}
                                className="flex items-center justify-between py-2 border-b border-dark-border last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-dark-bg rounded">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-200 capitalize">
                                            {log.feature?.replace(/_/g, ' ') || 'AI Request'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-300">
                                    -{formatNumber(log.tokens_used)} tokens
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
