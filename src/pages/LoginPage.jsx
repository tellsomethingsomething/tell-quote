import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { validatePassword, getPasswordStrength } from '../utils/validation';

export default function LoginPage({ initialMode = 'login' }) {
    const [searchParams] = useSearchParams();

    // Read plan selection from URL params (passed from Pricing page)
    const selectedPlan = searchParams.get('plan'); // 'individual' or 'team'
    const selectedCycle = searchParams.get('cycle') || 'monthly';
    const selectedCurrency = searchParams.get('currency') || 'USD';
    const {
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        error,
        clearError,
        isLoading,
        rateLimited,
        lockoutTimeRemaining,
        getRemainingAttempts,
        isSupabaseAuth
    } = useAuthStore();

    // Default to signup mode if a plan is selected from URL
    const [mode, setMode] = useState(selectedPlan ? 'signup' : initialMode); // 'login', 'signup', or 'forgot'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedGDPR, setAcceptedGDPR] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState(null);
    const [lockoutTimer, setLockoutTimer] = useState(0);
    const useSupabase = isSupabaseAuth();

    // Password validation for signup
    const passwordValidation = mode === 'signup' ? validatePassword(password) : { valid: true, error: null };
    const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : null;

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

        if (mode === 'forgot' && useSupabase) {
            // Forgot password mode
            if (!email) return;
            setResetError(null);
            const result = await resetPassword(email);
            if (result.success) {
                setResetSuccess(true);
            } else {
                setResetError(result.error);
            }
            return;
        }

        if (mode === 'signup' && useSupabase) {
            // Signup mode
            if (!name || !email || !password || !confirmPassword) return;
            if (password !== confirmPassword) {
                return; // Show validation error instead
            }
            const result = await signup(name, email, password);
            if (result) {
                // Store plan selection for onboarding if a paid plan was selected
                if (selectedPlan && selectedPlan !== 'free') {
                    localStorage.setItem('pendingPlanSelection', JSON.stringify({
                        plan: selectedPlan,
                        cycle: selectedCycle,
                        currency: selectedCurrency,
                    }));
                }
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

    const switchMode = (newMode) => {
        setMode(newMode);
        setSignupSuccess(false);
        setResetSuccess(false);
        setResetError(null);
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
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-[10px] flex items-center justify-center text-white font-bold text-xl">
                            P
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">
                            Production<span className="text-purple-500">OS</span>
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        {mode === 'login' ? 'Secure Access' : mode === 'signup' ? 'Request Access' : 'Reset Password'}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl">
                    {/* Password Reset Success Message */}
                    {resetSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">Check Your Email</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                We've sent a password reset link to <span className="text-white font-medium">{email}</span>
                            </p>
                            <p className="text-gray-500 text-xs mb-6">
                                Click the link in the email to reset your password. The link will expire in 24 hours.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setResetSuccess(false);
                                    switchMode('login');
                                }}
                                className="btn-primary px-6 py-2"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : signupSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">
                                {selectedPlan && selectedPlan !== 'free' ? 'Almost There!' : 'Request Submitted'}
                            </h2>
                            {selectedPlan && selectedPlan !== 'free' ? (
                                <>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Your account has been created. Once approved, you'll be able to start your <span className="text-brand-teal font-semibold capitalize">{selectedPlan}</span> plan trial.
                                    </p>
                                    <p className="text-gray-500 text-xs mb-6">
                                        We'll notify you by email when your account is ready. Your plan selection has been saved.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Your access request has been submitted. An administrator will review and approve your account.
                                    </p>
                                    <p className="text-gray-500 text-xs mb-6">
                                        You will be able to sign in once your account is approved.
                                    </p>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setSignupSuccess(false);
                                    switchMode('login');
                                }}
                                className="btn-primary px-6 py-2"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Selected Plan Banner (if coming from Pricing page) */}
                        {mode === 'signup' && selectedPlan && selectedPlan !== 'free' && (
                            <div className="bg-brand-teal/10 border border-brand-teal/30 rounded-lg p-3 mb-2">
                                <p className="text-sm text-brand-teal text-center">
                                    Signing up for <span className="font-bold capitalize">{selectedPlan}</span> plan
                                    <span className="text-brand-teal/70"> ({selectedCycle})</span>
                                </p>
                            </div>
                        )}

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

                        {/* Forgot Password Description */}
                        {useSupabase && mode === 'forgot' && (
                            <p className="text-gray-400 text-sm mb-2">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
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
                                        if (resetError) setResetError(null);
                                    }}
                                    placeholder="your.email@company.com"
                                    className="input"
                                    autoFocus={mode === 'login' || mode === 'forgot'}
                                    autoComplete="email"
                                    disabled={rateLimited}
                                    required
                                />
                            </div>
                        )}

                        {/* Password field (hidden in forgot mode) */}
                        {mode !== 'forgot' && (
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
                        )}

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
                                {/* Password strength indicator */}
                                {password && passwordStrength && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[0, 1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                                        level <= passwordStrength.score
                                                            ? passwordStrength.color === 'red' ? 'bg-red-500'
                                                            : passwordStrength.color === 'orange' ? 'bg-orange-500'
                                                            : passwordStrength.color === 'yellow' ? 'bg-yellow-500'
                                                            : passwordStrength.color === 'green' ? 'bg-green-500'
                                                            : 'bg-emerald-500'
                                                            : 'bg-dark-border'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${
                                            passwordStrength.color === 'red' ? 'text-red-400'
                                            : passwordStrength.color === 'orange' ? 'text-orange-400'
                                            : passwordStrength.color === 'yellow' ? 'text-yellow-400'
                                            : 'text-green-400'
                                        }`}>
                                            Password strength: {passwordStrength.label}
                                        </p>
                                    </div>
                                )}
                                {!passwordValidation.valid && password && (
                                    <p className="mt-1 text-xs text-red-400">{passwordValidation.error}</p>
                                )}
                            </div>
                        )}

                        {/* Terms and Conditions Checkbox (Signup only) */}
                        {useSupabase && mode === 'signup' && (
                            <div className="flex items-start gap-3">
                                <input
                                    id="acceptTerms"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-600 bg-dark-bg text-brand-teal focus:ring-brand-teal/20 focus:ring-offset-0"
                                    disabled={rateLimited}
                                />
                                <label htmlFor="acceptTerms" className="text-sm text-gray-400">
                                    I agree to the{' '}
                                    <a
                                        href="/legal/terms"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-teal hover:text-brand-teal-light underline"
                                    >
                                        Terms of Service
                                    </a>
                                    {' '}and{' '}
                                    <a
                                        href="/legal/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-teal hover:text-brand-teal-light underline"
                                    >
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                        )}

                        {/* GDPR Consent Checkbox (Signup only) */}
                        {useSupabase && mode === 'signup' && (
                            <div className="flex items-start gap-3">
                                <input
                                    id="acceptGDPR"
                                    type="checkbox"
                                    checked={acceptedGDPR}
                                    onChange={(e) => setAcceptedGDPR(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-600 bg-dark-bg text-brand-teal focus:ring-brand-teal/20 focus:ring-offset-0"
                                    disabled={rateLimited}
                                />
                                <label htmlFor="acceptGDPR" className="text-sm text-gray-400">
                                    I consent to ProductionOS processing my personal data as described in the{' '}
                                    <a
                                        href="/legal/gdpr"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-teal hover:text-brand-teal-light underline"
                                    >
                                        Data Processing Agreement
                                    </a>
                                    . I understand I can withdraw consent at any time.
                                </label>
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

                        {/* Reset error message */}
                        {resetError && (
                            <div
                                role="alert"
                                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{resetError}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || rateLimited || (mode === 'forgot' ? !email : mode === 'signup' ? !name || !email || !password || !confirmPassword || !passwordsMatch || !passwordValidation.valid || !acceptedTerms || !acceptedGDPR : (useSupabase ? !email || !password : !password))}
                            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-busy={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{mode === 'forgot' ? 'Sending...' : mode === 'signup' ? 'Submitting...' : 'Signing in...'}</span>
                                    <span className="sr-only">Please wait</span>
                                </span>
                            ) : rateLimited ? (
                                'Account Locked'
                            ) : mode === 'forgot' ? (
                                'Send Reset Link'
                            ) : mode === 'signup' ? (
                                'Request Access'
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* Google Sign-In (Supabase only, login mode only) */}
                        {useSupabase && mode === 'login' && (
                            <>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-dark-border"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="px-2 bg-dark-card text-gray-500">or</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={loginWithGoogle}
                                    disabled={isLoading || rateLimited}
                                    className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Sign in with Google
                                </button>
                            </>
                        )}

                        {/* Forgot password / Switch mode links (Supabase only) */}
                        {useSupabase && (
                            <div className="flex items-center justify-between text-sm">
                                {mode === 'login' ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => switchMode('forgot')}
                                            className="text-gray-500 hover:text-gray-400 transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => switchMode('signup')}
                                            className="text-brand-teal hover:text-brand-teal-light transition-colors"
                                        >
                                            Request access
                                        </button>
                                    </>
                                ) : mode === 'forgot' ? (
                                    <button
                                        type="button"
                                        onClick={() => switchMode('login')}
                                        className="text-brand-teal hover:text-brand-teal-light transition-colors w-full text-center"
                                    >
                                        ← Back to Sign In
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => switchMode('login')}
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
