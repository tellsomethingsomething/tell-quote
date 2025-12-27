import React from 'react';
import { captureError } from '../../services/errorTrackingService';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, copied: false };
    }

    // eslint-disable-next-line no-unused-vars
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);

        // Report to Sentry
        captureError(error, {
            extra: {
                componentStack: errorInfo?.componentStack,
            },
            tags: {
                errorBoundary: true,
            },
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        // Reload the page to reset state
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-dark-card border border-red-500/30 rounded-xl p-8 shadow-2xl">
                        {/* Error Icon */}
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>

                        {/* Error Title */}
                        <h1 className="text-2xl font-bold text-gray-100 text-center mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-gray-400 text-center mb-6">
                            The application encountered an unexpected error. Your work has been auto-saved.
                        </p>

                        {/* Error Details (Collapsible) */}
                        <details className="mb-6 bg-dark-bg rounded-lg border border-dark-border">
                            <summary className="px-4 py-3 cursor-pointer text-sm text-gray-400 hover:text-gray-300 select-none">
                                Show error details
                            </summary>
                            <div className="px-4 pb-4 pt-2">
                                <div className="font-mono text-xs text-red-400 bg-red-500/5 p-4 rounded border border-red-500/20 overflow-auto max-h-64">
                                    {this.state.error && this.state.error.toString()}
                                    <br />
                                    <br />
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </div>
                            </div>
                        </details>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reload Application
                            </button>
                            <button
                                onClick={() => {
                                    const errorText = `Error: ${this.state.error}\n\nStack: ${this.state.errorInfo?.componentStack}`;
                                    navigator.clipboard.writeText(errorText);
                                    this.setState({ copied: true });
                                    setTimeout(() => this.setState({ copied: false }), 2000);
                                }}
                                className={`flex-1 btn-ghost py-3 flex items-center justify-center gap-2 ${this.state.copied ? 'text-green-400' : ''}`}
                            >
                                {this.state.copied ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                                {this.state.copied ? 'Copied!' : 'Copy Error Details'}
                            </button>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-gray-600 text-center mt-6">
                            If this problem persists, please contact support with the error details.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
