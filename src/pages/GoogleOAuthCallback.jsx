import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEmailStore } from '../store/emailStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function GoogleOAuthCallback() {
    const [searchParams] = useSearchParams();
    const { handleGoogleCallback } = useEmailStore();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setStatus('error');
            setError(searchParams.get('error_description') || 'Google authorization was denied');
            return;
        }

        if (!code) {
            setStatus('error');
            setError('No authorization code received from Google');
            return;
        }

        // Process the OAuth callback
        handleGoogleCallback(code, state)
            .then((result) => {
                if (result.success) {
                    setStatus('success');
                    // Redirect to settings or email page after a short delay
                    setTimeout(() => {
                        navigate('/settings?tab=integrations', { replace: true });
                    }, 2000);
                } else {
                    setStatus('error');
                    setError(result.error || 'Failed to connect Google account');
                }
            })
            .catch((err) => {
                setStatus('error');
                setError(err.message || 'An unexpected error occurred');
            });
    }, [searchParams, handleGoogleCallback, navigate]);

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                {status === 'processing' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                                <Mail className="w-8 h-8 text-blue-500 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Connecting Your Gmail Account
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Please wait while we complete the connection...
                        </p>
                        <LoadingSpinner />
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Gmail Connected Successfully!
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Your Gmail account has been connected. Redirecting to settings...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Connection Failed
                        </h2>
                        <p className="text-gray-400 mb-6">
                            {error}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/settings?tab=integrations')}
                                className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg"
                            >
                                Back to Settings
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border hover:border-gray-600 text-white rounded-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
