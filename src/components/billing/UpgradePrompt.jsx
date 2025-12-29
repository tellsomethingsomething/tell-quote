/**
 * Upgrade Prompt Component
 * Shows when users try to access features beyond their plan limits
 */
import React from 'react';
import { X, Zap, ArrowRight, Check } from 'lucide-react';
import { PLANS, formatPrice } from '../../services/billingService';

export default function UpgradePrompt({
    isOpen,
    onClose,
    feature,
    currentPlan = 'free',
    message,
    onUpgrade,
}) {
    if (!isOpen) return null;

    // Determine which plan to recommend
    const recommendedPlan = currentPlan === 'free' ? 'individual' : 'team';
    const plan = PLANS[recommendedPlan];

    const handleUpgrade = () => {
        onUpgrade?.(recommendedPlan);
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary/20 to-brand-primary/20 px-6 py-4 border-b border-dark-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Upgrade Required</h2>
                                <p className="text-sm text-gray-400">Unlock this feature</p>
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
                    <p className="text-gray-300 mb-6">
                        {message || "You've reached the limit of your current plan."}
                    </p>

                    {/* Recommended Plan */}
                    <div className="bg-dark-bg border border-brand-primary/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <span className="text-xs text-brand-primary font-medium uppercase tracking-wide">
                                    Recommended
                                </span>
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">
                                    {formatPrice(plan.pricing.USD.monthly, 'USD')}
                                </div>
                                <div className="text-xs text-gray-400">/month</div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">{plan.description}</p>

                        {/* Features */}
                        <ul className="space-y-2">
                            {plan.features.slice(0, 5).map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-dark-border text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleUpgrade}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors"
                        >
                            Upgrade Now
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-dark-bg border-t border-dark-border text-center">
                    <p className="text-xs text-gray-500">
                        Cancel anytime. 5-day free trial included.
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
