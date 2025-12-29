/**
 * Upgrade Prompt Component
 * Shows when users try to access features beyond their plan limits
 */
import React, { useState } from 'react';
import { X, Zap, ArrowRight, Check, Minus, Crown } from 'lucide-react';
import { PLANS, formatPrice } from '../../services/billingService';

// Feature comparison data for plan comparison view
const COMPARISON_FEATURES = [
    { key: 'projects', label: 'Projects', getValue: (limits) => limits.projects === -1 ? 'Unlimited' : limits.projects },
    { key: 'crew', label: 'Crew Contacts', getValue: (limits) => limits.crewContacts === -1 ? 'Unlimited' : limits.crewContacts },
    { key: 'equipment', label: 'Equipment Items', getValue: (limits) => limits.equipmentItems === -1 ? 'Unlimited' : limits.equipmentItems },
    { key: 'regions', label: 'Pricing Regions', getValue: (limits) => limits.regions === -1 ? 'Unlimited' : limits.regions },
    { key: 'team', label: 'Team Members', getValue: (limits) => limits.teamMembers === -1 ? 'Unlimited' : limits.teamMembers },
    { key: 'ai', label: 'AI Tokens/month', getValue: (limits) => limits.aiTokens === 0 ? '—' : limits.aiTokens.toLocaleString() },
    { key: 'watermark', label: 'Remove Watermarks', free: false, individual: true, team: true },
    { key: 'branding', label: 'Custom Branding', free: false, individual: false, team: true },
];

export default function UpgradePrompt({
    isOpen,
    onClose,
    feature,
    currentPlan = 'free',
    message,
    onUpgrade,
}) {
    const [showComparison, setShowComparison] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    if (!isOpen) return null;

    // Determine which plan to recommend
    const recommendedPlan = currentPlan === 'free' ? 'individual' : 'team';
    const plan = PLANS[selectedPlan || recommendedPlan];
    const currentPlanData = PLANS[currentPlan] || PLANS.free;

    const handleUpgrade = (planId) => {
        onUpgrade?.(planId || selectedPlan || recommendedPlan);
        onClose?.();
    };

    // Comparison view
    if (showComparison) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowComparison(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            >
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                            <h2 className="text-lg font-semibold text-white">Compare Plans</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-auto flex-1 p-6">
                        <div className="grid grid-cols-4 gap-4">
                            {/* Header row */}
                            <div className="text-sm font-medium text-gray-400 py-3">Feature</div>
                            {['free', 'individual', 'team'].map(planId => {
                                const p = PLANS[planId];
                                const isPopular = p.popular;
                                const isCurrent = planId === currentPlan;
                                return (
                                    <div
                                        key={planId}
                                        className={`rounded-lg p-3 text-center ${
                                            isPopular ? 'bg-brand-primary/10 border border-brand-primary/30' : 'bg-dark-bg'
                                        }`}
                                    >
                                        {isPopular && (
                                            <span className="text-xs text-brand-primary font-medium">Most Popular</span>
                                        )}
                                        <h3 className="font-bold text-white">{p.name}</h3>
                                        <div className="text-xl font-bold text-white mt-1">
                                            {formatPrice(p.pricing.USD.monthly, 'USD')}
                                        </div>
                                        <div className="text-xs text-gray-400">/month</div>
                                        {isCurrent && (
                                            <span className="inline-block mt-2 text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Feature rows */}
                            {COMPARISON_FEATURES.map(f => (
                                <React.Fragment key={f.key}>
                                    <div className="text-sm text-gray-300 py-3 border-t border-dark-border">{f.label}</div>
                                    {['free', 'individual', 'team'].map(planId => {
                                        const p = PLANS[planId];
                                        let value;
                                        if (f.getValue) {
                                            value = f.getValue(p.limits);
                                        } else {
                                            value = f[planId];
                                        }

                                        return (
                                            <div
                                                key={planId}
                                                className={`py-3 text-center border-t border-dark-border ${
                                                    p.popular ? 'bg-brand-primary/5' : ''
                                                }`}
                                            >
                                                {typeof value === 'boolean' ? (
                                                    value ? (
                                                        <Check className="w-5 h-5 text-green-400 mx-auto" />
                                                    ) : (
                                                        <Minus className="w-5 h-5 text-gray-600 mx-auto" />
                                                    )
                                                ) : (
                                                    <span className={value === '—' ? 'text-gray-600' : 'text-white font-medium'}>
                                                        {value}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}

                            {/* Action row */}
                            <div className="py-4" />
                            {['free', 'individual', 'team'].map(planId => {
                                const isCurrent = planId === currentPlan;
                                const p = PLANS[planId];
                                return (
                                    <div
                                        key={planId}
                                        className={`py-4 text-center ${p.popular ? 'bg-brand-primary/5' : ''}`}
                                    >
                                        {isCurrent ? (
                                            <span className="text-sm text-gray-500">Current Plan</span>
                                        ) : planId === 'free' ? (
                                            <span className="text-sm text-gray-500">—</span>
                                        ) : (
                                            <button
                                                onClick={() => handleUpgrade(planId)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                    p.popular
                                                        ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                                                        : 'bg-gray-700 text-white hover:bg-gray-600'
                                                }`}
                                            >
                                                Choose {p.name}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 bg-dark-bg border-t border-dark-border text-center flex-shrink-0">
                        <p className="text-xs text-gray-500">
                            All paid plans include a 5-day free trial. Cancel anytime.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Default single-plan view
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary/20 to-brand-primary/10 px-6 py-4 border-b border-dark-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Upgrade Your Plan</h2>
                                <p className="text-sm text-gray-400">Unlock more features</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    {/* Message */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-5">
                        <p className="text-amber-400 text-sm">
                            {message || "You've reached the limit of your current plan."}
                        </p>
                    </div>

                    {/* Current vs Recommended comparison */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {/* Current Plan */}
                        <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current</div>
                            <div className="font-bold text-white">{currentPlanData.name}</div>
                            <div className="text-sm text-gray-400">{formatPrice(currentPlanData.pricing.USD.monthly, 'USD')}/mo</div>
                        </div>
                        {/* Recommended Plan */}
                        <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-3">
                            <div className="flex items-center gap-1">
                                <Crown className="w-3 h-3 text-brand-primary" />
                                <span className="text-xs text-brand-primary uppercase tracking-wide">Recommended</span>
                            </div>
                            <div className="font-bold text-white">{plan.name}</div>
                            <div className="text-sm text-brand-primary">{formatPrice(plan.pricing.USD.monthly, 'USD')}/mo</div>
                        </div>
                    </div>

                    {/* What you get */}
                    <div className="mb-5">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">What you'll get:</h4>
                        <ul className="space-y-2">
                            {plan.features.slice(0, 6).map((feat, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => handleUpgrade()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors"
                        >
                            Upgrade to {plan.name}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowComparison(true)}
                                className="flex-1 px-4 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm"
                            >
                                Compare All Plans
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 rounded-lg border border-dark-border text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-dark-bg border-t border-dark-border text-center">
                    <p className="text-xs text-gray-500">
                        5-day free trial. No credit card required to start.
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to use upgrade prompt
 */
export function useUpgradePrompt() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [promptData, setPromptData] = React.useState({});

    const showUpgradePrompt = (feature, currentPlan, message) => {
        setPromptData({ feature, currentPlan, message });
        setIsOpen(true);
    };

    const hideUpgradePrompt = () => {
        setIsOpen(false);
    };

    return {
        isOpen,
        promptData,
        showUpgradePrompt,
        hideUpgradePrompt,
    };
}
