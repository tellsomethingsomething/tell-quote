import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

export default function OnboardingPage() {
    const {
        user,
        isLoading,
        error,
        clearError,
        onboardOrganization
    } = useAuthStore();

    const [organizationName, setOrganizationName] = useState('');
    const [userName, setUserName] = useState(
        user?.profile?.name || user?.email?.split('@')[0] || ''
    );
    const [localError, setLocalError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);
        clearError();

        if (!organizationName.trim()) {
            setLocalError('Please enter your company name');
            return;
        }

        const result = await onboardOrganization(organizationName.trim(), userName.trim());

        if (!result.success) {
            setLocalError(result.error || 'Failed to create organization');
        }
        // On success, the auth store will set needsOnboarding to false
        // and App.jsx will redirect to the dashboard
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Logo className="h-10" />
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">
                        Welcome to ProductionOS!
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Let's set up your workspace. You'll have a 5-day free trial to explore all features.
                    </p>
                </div>

                {/* Onboarding Card */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Organization Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Company / Organization Name
                            </label>
                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                placeholder="e.g., Acme Productions"
                                autoFocus
                                disabled={isLoading}
                            />
                            <p className="mt-1.5 text-xs text-gray-500">
                                This will be your workspace name. You can change it later.
                            </p>
                        </div>

                        {/* User Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                placeholder="e.g., John Smith"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Error Display */}
                        {displayError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{displayError}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !organizationName.trim()}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Creating workspace...</span>
                                </>
                            ) : (
                                <>
                                    <span>Get Started</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Features List */}
                    <div className="mt-6 pt-6 border-t border-dark-border">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                            Your trial includes:
                        </p>
                        <ul className="space-y-2">
                            {[
                                'Unlimited quotes & proposals',
                                'Client & project management',
                                'Rate card with regional pricing',
                                'PDF exports & templates',
                                'Team collaboration tools'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Email Display */}
                <p className="text-center text-sm text-gray-500 mt-4">
                    Signed in as <span className="text-gray-400">{user?.email}</span>
                </p>
            </div>
        </div>
    );
}
