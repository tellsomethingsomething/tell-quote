import { useEffect, useState } from 'react';
import { useAIUsageStore } from '../../store/aiUsageStore';
import { useNavigate } from '../../hooks/useNavigate';

/**
 * Banner that shows when AI tokens are running low
 * Can be placed on any page where AI features are used
 */
export default function LowTokenBanner({ threshold = 1000, onDismiss }) {
    const { tokensAvailable, loading, initialize } = useAIUsageStore();
    const { navigate } = useNavigate();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        initialize();
    }, [initialize]);

    // Don't show if loading, dismissed, or tokens are above threshold
    if (loading || dismissed || tokensAvailable >= threshold) {
        return null;
    }

    // Don't show if no tokens at all (likely free plan without tokens)
    if (tokensAvailable === 0) {
        return null;
    }

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    const handlePurchase = () => {
        navigate('settings', { tab: 'ai' });
    };

    const isVeryLow = tokensAvailable < 500;
    const bannerColor = isVeryLow
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-amber-500/10 border-amber-500/30';
    const textColor = isVeryLow ? 'text-red-400' : 'text-amber-400';

    return (
        <div className={`${bannerColor} border rounded-lg p-3 mb-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                    <span className={`font-medium ${textColor}`}>
                        {isVeryLow ? 'Very low on AI tokens!' : 'Running low on AI tokens'}
                    </span>
                    <span className="text-gray-400 ml-2 text-sm">
                        {tokensAvailable.toLocaleString()} tokens remaining
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handlePurchase}
                    className="px-3 py-1 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm font-medium rounded transition-colors"
                >
                    Get more tokens
                </button>
                <button
                    onClick={handleDismiss}
                    className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                    title="Dismiss"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
