import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
    const {
        login,
        signup,
        error,
        clearError,
        isLoading,
        rateLimited,
        lockoutTimeRemaining,
        getRemainingAttempts,
        isSupabaseAuth
    } = useAuthStore();

    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [lockoutTimer, setLockoutTimer] = useState(0);
    const useSupabase = isSupabaseAuth();

    // Countdown timer for lockout
    useEffect(() => {
        if (rateLimited && lockoutTimeRemaining > 0) {
            setLockoutTimer(lockoutTimeRemaining);

            const interval = setInterval(() => {
                setLockoutTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        window.location.reload(); // Refresh to clear lockout
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [rateLimited, lockoutTimeRemaining]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (mode === 'signup' && useSupabase) {
            // Signup mode
            if (!name || !email || !password || !confirmPassword) return;
            if (password !== confirmPassword) {
                return; // Show validation error instead
            }
            const result = await signup(name, email, password);
            if (result) {
                setSignupSuccess(true);
            }
            return;
        }

        if (useSupabase) {
            // Supabase mode: email + password
            if (!email || !password) return;
            await login(email, password);
        } else {
            // Fallback mode: password only
            if (!password) return;
            await login(password);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setSignupSuccess(false);
        clearError();
    };

    const passwordsMatch = !confirmPassword || password === confirmPassword;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const remainingAttempts = getRemainingAttempts();
    const showAttemptWarning = remainingAttempts <= 2 && remainingAttempts > 0;

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <img
                        src="/tell-logo.svg"
                        alt="Tell Productions Logo"
                        className="h-10 mx-auto mb-4"
                        role="img"
                    />
                    <h1 className="text-xl font-bold text-white mb-2">Internal Quote Tool</h1>
                    <p className="text-gray-500 text-sm">
                        {mode === 'login' ? 'Secure Access' : 'Request Access'}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl">
                    {/* Signup Success Message */}
                    {signupSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">Request Submitted</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Your access request has been submitted. An administrator will review and approve your account.
                            </p>
                            <p className="text-gray-500 text-xs mb-6">
                                You will be able to sign in once your account is approved.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSignupSuccess(false);
                                    setMode('login');
                                    setName('');
                                    setEmail('');
                                    setPassword('');
                                    setConfirmPassword('');
                                }}
                                className="btn-primary px-6 py-2"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Name field (Signup only) */}
                        {useSupabase && mode === 'signup' && (
                            <div>
                                <label htmlFor="name" className="label">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (error) clearError();
                                    }}
                                    placeholder="Your full name"
                                    className="input"
                                    autoFocus
                                    autoComplete="name"
                                    disabled={rateLimited}
                                    required
                                />
                            </div>
                        )}

                        {/* Email field (Supabase only) */}
                        {useSupabase && (
                            <div>
                                <label htmlFor="email" className="label">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) clearError();
                                    }}
                                    placeholder="your.email@tellproductions.com"
                                    className="input"
                                    autoFocus={mode === 'login'}
                                    autoComplete="email"
                                    disabled={rateLimited}
                                    required
                                />
                            </div>
                        )}

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="label">
                                {useSupabase ? 'Password' : 'Access Password'}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) clearError();
                                }}
                                placeholder={mode === 'signup' ? 'Create a password' : (useSupabase ? 'Enter your password' : 'Enter access password')}
                                className={useSupabase ? 'input' : 'input text-center text-lg tracking-widest'}
                                autoFocus={!useSupabase}
                                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                disabled={rateLimited}
                                aria-invalid={error ? 'true' : 'false'}
                                aria-describedby={error ? 'password-error' : undefined}
                                required
                            />
                        </div>

                        {/* Confirm Password field (Signup only) */}
                        {useSupabase && mode === 'signup' && (
                            <div>
                                <label htmlFor="confirmPassword" className="label">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (error) clearError();
                                    }}
                                    placeholder="Confirm your password"
                                    className={`input ${!passwordsMatch ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                    autoComplete="new-password"
                                    disabled={rateLimited}
                                    required
                                />
                                {!passwordsMatch && (
                                    <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                                )}
                            </div>
                        )}

                        {/* Rate limit warning */}
                        {showAttemptWarning && !rateLimited && (
                            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining</span>
                            </div>
                        )}

                        {/* Lockout message */}
                        {rateLimited && lockoutTimer > 0 && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <div>
                                    <div className="font-semibold">Account temporarily locked</div>
                                    <div className="text-xs">Unlock in {formatTime(lockoutTimer)}</div>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && !rateLimited && (
                            <div
                                id="password-error"
                                role="alert"
                                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || rateLimited || (mode === 'signup' ? !name || !email || !password || !confirmPassword || !passwordsMatch : (useSupabase ? !email || !password : !password))}
                            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-busy={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{mode === 'signup' ? 'Submitting...' : 'Signing in...'}</span>
                                    <span className="sr-only">Please wait</span>
                                </span>
                            ) : rateLimited ? (
                                'Account Locked'
                            ) : mode === 'signup' ? (
                                'Request Access'
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* Forgot password / Switch mode links (Supabase only) */}
                        {useSupabase && (
                            <div className="flex items-center justify-between text-sm">
                                {mode === 'login' ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // TODO: Implement password reset flow
                                                alert('Password reset feature coming soon. Contact admin for assistance.');
                                            }}
                                            className="text-gray-500 hover:text-gray-400 transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                        <button
                                            type="button"
                                            onClick={switchMode}
                                            className="text-brand-teal hover:text-brand-teal-light transition-colors"
                                        >
                                            Request access
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={switchMode}
                                        className="text-brand-teal hover:text-brand-teal-light transition-colors w-full text-center"
                                    >
                                        Already have an account? Sign in
                                    </button>
                                )}
                            </div>
                        )}
                    </form>
                    )}

                    {/* Security info */}
                    {!signupSuccess && (
                    <div className="mt-6 pt-6 border-t border-dark-border">
                        <div className="flex items-start gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <div>
                                <div className="font-semibold text-gray-400 mb-1">Security Features</div>
                                <ul className="space-y-0.5">
                                    <li>• Session expires after 24 hours</li>
                                    <li>• 5 login attempts before lockout</li>
                                    <li>• 15-minute lockout period</li>
                                    {useSupabase && <li>• Encrypted authentication tokens</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs mt-6">
                    Authorized personnel only • All activity is logged
                </p>
            </div>
        </div>
    );
}
