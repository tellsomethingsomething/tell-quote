/**
 * useSubscription Hook
 * Provides subscription status, feature gating, and upgrade prompts throughout the app
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useOrganizationStore } from '../store/organizationStore';
import {
    checkSubscriptionWithUsage,
    FEATURES,
    ACCESS_LEVELS,
} from '../services/subscriptionGuard';
import { getTrialStatus, getTrialMessage } from '../services/trialService';
import logger from '../utils/logger';

// Context for subscription state
const SubscriptionContext = createContext(null);

/**
 * Subscription Provider Component
 * Wrap your app with this to provide subscription state
 */
export function SubscriptionProvider({ children }) {
    const { organization } = useOrganizationStore();
    const [state, setState] = useState({
        loading: true,
        subscription: null,
        planId: 'free',
        limits: null,
        usage: null,
        access: ACCESS_LEVELS.FULL,
        trial: null,
        warnings: [],
        error: null,
    });

    // Load subscription data
    const loadSubscription = useCallback(async () => {
        if (!organization?.id) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            const [subscriptionData, trialData] = await Promise.all([
                checkSubscriptionWithUsage(organization.id),
                getTrialStatus(organization.id),
            ]);

            setState({
                loading: false,
                subscription: subscriptionData.subscription,
                planId: subscriptionData.planId,
                limits: subscriptionData.limits,
                usage: subscriptionData.usage,
                access: subscriptionData.access,
                warnings: subscriptionData.warnings || [],
                trial: trialData,
                trialMessage: trialData ? getTrialMessage(trialData) : null,
                canCreate: subscriptionData.canCreate,
                getRemaining: subscriptionData.getRemaining,
                getUpgradeMessage: subscriptionData.getUpgradeMessage,
                shouldWatermark: subscriptionData.shouldWatermark,
                error: null,
            });
        } catch (error) {
            logger.error('Error loading subscription:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message,
            }));
        }
    }, [organization?.id]);

    // Reload on organization change
    useEffect(() => {
        loadSubscription();
    }, [loadSubscription]);

    // Refresh function for manual reloads
    const refresh = useCallback(() => {
        setState(prev => ({ ...prev, loading: true }));
        loadSubscription();
    }, [loadSubscription]);

    const value = {
        ...state,
        refresh,
        // Helper properties
        isBlocked: state.access === ACCESS_LEVELS.BLOCKED,
        isGrace: state.access === ACCESS_LEVELS.GRACE,
        isWarning: state.access === ACCESS_LEVELS.WARNING,
        isTrial: state.trial?.status === 'active' || state.trial?.status === 'expiring_soon',
        isFreePlan: state.planId === 'free',
        isPaidPlan: state.planId === 'individual' || state.planId === 'team',
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

/**
 * Hook to access subscription state
 */
export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (!context) {
        // Return default state if not in provider (for marketing pages, etc.)
        return {
            loading: false,
            planId: 'free',
            access: ACCESS_LEVELS.FULL,
            isBlocked: false,
            isGrace: false,
            isWarning: false,
            isTrial: false,
            isFreePlan: true,
            isPaidPlan: false,
            canCreate: () => true,
            getRemaining: () => Infinity,
            getUpgradeMessage: () => '',
            shouldWatermark: true,
        };
    }
    return context;
}

/**
 * Hook for checking a specific feature
 * Returns { allowed, remaining, message }
 */
export function useFeatureAccess(feature) {
    const { canCreate, getRemaining, getUpgradeMessage, loading, planId } = useSubscription();

    if (loading) {
        return { allowed: true, remaining: Infinity, message: '', loading: true };
    }

    const allowed = canCreate?.(feature) ?? true;
    const remaining = getRemaining?.(feature) ?? Infinity;
    const message = !allowed ? (getUpgradeMessage?.(feature) ?? '') : '';

    return { allowed, remaining, message, loading: false, planId };
}

/**
 * Hook for checking if user can add more of something
 * Returns { canAdd, remaining, showWarning, message }
 */
export function useCanAdd(feature) {
    const { allowed, remaining, message, loading } = useFeatureAccess(feature);

    return {
        canAdd: allowed,
        remaining,
        showWarning: remaining !== Infinity && remaining <= 3,
        message,
        loading,
    };
}

/**
 * Hook for PDF watermarking
 */
export function usePDFWatermark() {
    const { shouldWatermark, planId } = useSubscription();
    return {
        shouldWatermark: shouldWatermark ?? true,
        message: shouldWatermark
            ? 'Free plan PDFs include a ProductionOS watermark. Upgrade to remove it.'
            : null,
        planId,
    };
}

/**
 * Hook for trial status
 */
export function useTrialStatus() {
    const { trial, trialMessage, isTrial } = useSubscription();

    return {
        inTrial: isTrial,
        status: trial?.status,
        hoursRemaining: trial?.hoursRemaining,
        daysRemaining: trial?.daysRemaining,
        isExpiringSoon: trial?.status === 'expiring_soon',
        isExpired: trial?.status === 'expired',
        message: trialMessage,
    };
}

// Re-export FEATURES for convenience
export { FEATURES, ACCESS_LEVELS };

export default useSubscription;
