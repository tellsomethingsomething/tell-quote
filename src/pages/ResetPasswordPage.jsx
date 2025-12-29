import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage({ onComplete }) {
    const { updatePassword, isLoading } = useAuthStore();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState(null);

    useEffect(() => {
        // Check if we have a valid recovery session from the URL
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // Check URL for recovery token
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const type = hashParams.get('type');

            if (type === 'recovery' || session?.user) {
                setIsValidToken(true);
            } else {
                setIsValidToken(false);
            }
        };

        checkSession();

        // Listen for auth state changes (when user clicks reset link)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidToken(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const result = await updatePassword(password);

        if (result.success) {
            setSuccess(true);
            // Redirect to login after a delay
            setTimeout(() => {
                onComplete?.();
            }, 3000);
        } else {
            setError(result.error || 'Failed to update password');
        }
    };

    const passwordsMatch = !confirmPassword || password === confirmPassword;

    // Loading state
    if (isValidToken === null) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-400 mt-4">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    // Invalid/expired token
    if (isValidToken === false) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <img
                            src="/productionos-logo.svg"
                            alt="ProductionOS Logo"
                            className="h-10 mx-auto mb-4"
                        />
                        <h1 className="text-xl font-bold text-white mb-2">ProductionOS</h1>
                    </div>

                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-2">Invalid or Expired Link</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            This password reset link is invalid or has expired. Please request a new reset link.
                        </p>
                        <button
                            type="button"
                            onClick={() => onComplete?.()}
                            className="btn-primary px-6 py-2"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <img
                            src="/productionos-logo.svg"
                            alt="ProductionOS Logo"
                            className="h-10 mx-auto mb-4"
                        />
                        <h1 className="text-xl font-bold text-white mb-2">ProductionOS</h1>
                    </div>

                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-2">Password Updated</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Your password has been successfully updated. You can now sign in with your new password.
                        </p>
                        <p className="text-gray-500 text-xs">
                            Redirecting to sign in...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img
                        src="/productionos-logo.svg"
                        alt="ProductionOS Logo"
                        className="h-10 mx-auto mb-4"
                    />
                    <h1 className="text-xl font-bold text-white mb-2">ProductionOS</h1>
                    <p className="text-gray-500 text-sm">Set New Password</p>
                </div>

                <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <p className="text-gray-400 text-sm mb-4">
                            Enter your new password below.
                        </p>

                        <div>
                            <label htmlFor="password" className="label">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="input"
                                autoFocus
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="label">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className={`input ${!passwordsMatch ? 'border-red-500 focus:border-red-500' : ''}`}
                                autoComplete="new-password"
                                required
                            />
                            {!passwordsMatch && (
                                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !password || !confirmPassword || !passwordsMatch}
                            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Updating...
                                </span>
                            ) : (
                                'Update Password'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => onComplete?.()}
                            className="text-brand-primary hover:text-brand-primary-light transition-colors w-full text-center text-sm"
                        >
                            ← Back to Sign In
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Password must be at least 6 characters
                </p>
            </div>
        </div>
    );
}
