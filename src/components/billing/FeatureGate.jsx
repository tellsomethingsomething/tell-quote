/**
 * Feature Gate Component
 * Wraps features to check access and show upgrade prompts when needed
 */

import React, { useState } from 'react';
import { Lock, AlertTriangle, Zap } from 'lucide-react';
import { useFeatureAccess, FEATURES } from '../../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import { createCheckoutSession } from '../../services/billingService';

/**
 * FeatureGate - Wraps content and gates it based on subscription
 *
 * Usage:
 * <FeatureGate feature={FEATURES.AI_FEATURES}>
 *   <AIFeatureComponent />
 * </FeatureGate>
 *
 * Or with render prop:
 * <FeatureGate feature={FEATURES.CREATE_PROJECT} renderLocked={...}>
 *   {({ remaining }) => <Button>Create Project ({remaining} left)</Button>}
 * </FeatureGate>
 */
export default function FeatureGate({
    feature,
    children,
    renderLocked,
    fallback,
    showWarning = true,
    warningThreshold = 3,
    onUpgrade,
}) {
    const { allowed, remaining, message, loading, planId } = useFeatureAccess(feature);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    const handleUpgrade = async (recommendedPlan) => {
        if (onUpgrade) {
            onUpgrade(recommendedPlan);
        } else {
            try {
                const { url } = await createCheckoutSession(recommendedPlan, 'monthly');
                if (url) window.location.href = url;
            } catch (err) {
                console.error('Checkout error:', err);
            }
        }
    };

    // Loading state
    if (loading) {
        return typeof children === 'function'
            ? children({ allowed: true, remaining: Infinity, loading: true })
            : children;
    }

    // Feature not allowed - show locked state or upgrade prompt
    if (!allowed) {
        if (renderLocked) {
            return renderLocked({ message, onUpgrade: () => setShowUpgradePrompt(true) });
        }

        if (fallback) {
            return fallback;
        }

        return (
            <>
                <LockedFeature
                    message={message}
                    onUpgrade={() => setShowUpgradePrompt(true)}
                />
                <UpgradePrompt
                    isOpen={showUpgradePrompt}
                    onClose={() => setShowUpgradePrompt(false)}
                    feature={feature}
                    currentPlan={planId}
                    message={message}
                    onUpgrade={handleUpgrade}
                />
            </>
        );
    }

    // Show warning if approaching limit
    const showLimitWarning = showWarning && remaining !== Infinity && remaining <= warningThreshold;

    // Render children (with render prop support)
    const content = typeof children === 'function'
        ? children({ allowed, remaining, loading: false })
        : children;

    if (showLimitWarning) {
        return (
            <>
                {content}
                <LimitWarning
                    remaining={remaining}
                    feature={feature}
                    onUpgrade={() => setShowUpgradePrompt(true)}
                />
                <UpgradePrompt
                    isOpen={showUpgradePrompt}
                    onClose={() => setShowUpgradePrompt(false)}
                    feature={feature}
                    currentPlan={planId}
                    message={message}
                    onUpgrade={handleUpgrade}
                />
            </>
        );
    }

    return content;
}

/**
 * Locked Feature Display
 */
function LockedFeature({ message, onUpgrade }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-dark-card border border-dark-border rounded-lg text-center">
            <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Feature Locked</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-4">
                {message || "This feature is not available on your current plan."}
            </p>
            <button
                onClick={onUpgrade}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
            >
                <Zap className="w-4 h-4" />
                Upgrade to Unlock
            </button>
        </div>
    );
}

/**
 * Limit Warning Banner
 */
function LimitWarning({ remaining, feature, onUpgrade }) {
    const featureNames = {
        [FEATURES.CREATE_PROJECT]: 'projects',
        [FEATURES.ADD_CREW]: 'crew contacts',
        [FEATURES.ADD_EQUIPMENT]: 'equipment items',
        [FEATURES.TEAM_MEMBERS]: 'team members',
    };

    const name = featureNames[feature] || 'items';

    return (
        <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-4">
            <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                    {remaining === 0
                        ? `You've reached your ${name} limit.`
                        : `Only ${remaining} ${name} remaining on your plan.`
                    }
                </span>
            </div>
            <button
                onClick={onUpgrade}
                className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
                <Zap className="w-3 h-3" />
                Upgrade
            </button>
        </div>
    );
}

/**
 * HOC for feature gating
 */
export function withFeatureGate(WrappedComponent, feature, options = {}) {
    return function FeatureGatedComponent(props) {
        return (
            <FeatureGate feature={feature} {...options}>
                <WrappedComponent {...props} />
            </FeatureGate>
        );
    };
}

/**
 * Hook-based guard for imperative checks
 * Returns a function that checks and shows prompt if needed
 */
export function useFeatureGuard(feature) {
    const { allowed, message, planId } = useFeatureAccess(feature);
    const [showPrompt, setShowPrompt] = useState(false);

    const checkAndProceed = (callback) => {
        if (allowed) {
            callback?.();
            return true;
        } else {
            setShowPrompt(true);
            return false;
        }
    };

    const handleUpgrade = async (recommendedPlan) => {
        try {
            const { url } = await createCheckoutSession(recommendedPlan, 'monthly');
            if (url) window.location.href = url;
        } catch (err) {
            console.error('Checkout error:', err);
        }
    };

    const PromptComponent = () => (
        <UpgradePrompt
            isOpen={showPrompt}
            onClose={() => setShowPrompt(false)}
            feature={feature}
            currentPlan={planId}
            message={message}
            onUpgrade={handleUpgrade}
        />
    );

    return {
        allowed,
        checkAndProceed,
        PromptComponent,
        showPrompt,
        setShowPrompt,
    };
}

// Re-export FEATURES for convenience
export { FEATURES };
