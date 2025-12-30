/**
 * Email Verification Required Page
 * Shown when user has signed up but hasn't verified their email
 */

import { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function EmailVerificationPage() {
    const { user, logout, initialize } = useAuthStore();
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [checking, setChecking] = useState(false);

    const handleResendEmail = async () => {
        setResending(true);
        setError(null);
        setResendSuccess(false);

        try {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: user?.email,
            });

            if (resendError) {
                setError(resendError.message);
            } else {
                setResendSuccess(true);
            }
        } catch (e) {
            setError('Failed to resend verification email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const handleCheckVerification = async () => {
        setChecking(true);
        setError(null);

        try {
            // Refresh the session to check if email is now verified
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

            if (sessionError) {
                setError('Failed to check verification status. Please try again.');
                setChecking(false);
                return;
            }

            if (session?.user?.email_confirmed_at) {
                // Email is now verified - reinitialize auth
                await initialize();
                // Force reload to ensure fresh state
                window.location.reload();
            } else {
                setError('Email not yet verified. Please check your inbox and click the verification link.');
            }
        } catch (e) {
            setError('Failed to check verification status.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-dark-card rounded-xl p-8 border border-dark-border text-center">
                {/* Icon */}
                <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-violet-400" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-2">
                    Verify Your Email
                </h1>

                {/* Description */}
                <p className="text-gray-400 mb-6">
                    We've sent a verification email to{' '}
                    <span className="text-white font-medium">{user?.email}</span>.
                    Please click the link in the email to verify your account.
                </p>

                {/* Success message */}
                {resendSuccess && (
                    <div className="mb-6 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">Verification email sent! Check your inbox.</span>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleCheckVerification}
                        disabled={checking}
                        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {checking ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                I've Verified My Email
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleResendEmail}
                        disabled={resending || resendSuccess}
                        className="w-full py-3 px-4 bg-dark-bg hover:bg-dark-border text-gray-300 font-medium rounded-lg transition-all border border-dark-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {resending ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                Resend Verification Email
                            </>
                        )}
                    </button>
                </div>

                {/* Help text */}
                <p className="mt-6 text-sm text-gray-500">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                        onClick={handleResendEmail}
                        className="text-violet-400 hover:text-violet-300 underline"
                        disabled={resending}
                    >
                        request a new one
                    </button>
                    .
                </p>

                {/* Logout option */}
                <div className="mt-8 pt-6 border-t border-dark-border">
                    <button
                        onClick={logout}
                        className="text-sm text-gray-500 hover:text-gray-400"
                    >
                        Sign in with a different account
                    </button>
                </div>
            </div>
        </div>
    );
}
