/**
 * Payment Method Form Component
 * Captures payment method using Stripe Elements during onboarding
 */
import React, { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Shield, Check } from 'lucide-react';

export default function PaymentMethodForm({ onSuccess, onError, buttonText = 'Save Payment Method' }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error, setupIntent } = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: window.location.origin,
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message);
                onError?.(error);
            } else if (setupIntent && setupIntent.status === 'succeeded') {
                onSuccess?.(setupIntent);
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
            onError?.(err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-3 bg-brand-teal text-white font-semibold rounded-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        {buttonText}
                    </>
                )}
            </button>

            {/* Security info */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5" />
                <span>Secured by Stripe. Your card details are encrypted.</span>
            </div>
        </form>
    );
}

// Map Stripe error codes to user-friendly messages
const getCardErrorMessage = (error) => {
    const errorMessages = {
        'card_declined': 'Your card was declined. Please try a different card.',
        'insufficient_funds': 'Insufficient funds. Please try a different card.',
        'expired_card': 'Your card has expired. Please use a different card.',
        'incorrect_cvc': 'The CVC code is incorrect. Please check and try again.',
        'incorrect_number': 'The card number is incorrect. Please check and try again.',
        'invalid_expiry_month': 'The expiration month is invalid.',
        'invalid_expiry_year': 'The expiration year is invalid.',
        'processing_error': 'There was an error processing your card. Please try again.',
        'rate_limit': 'Too many attempts. Please wait a moment and try again.',
    };

    // Check for decline code first
    if (error.decline_code) {
        const declineMessages = {
            'generic_decline': 'Your card was declined. Please contact your bank or try a different card.',
            'insufficient_funds': 'Insufficient funds. Please try a different card.',
            'lost_card': 'This card has been reported lost. Please use a different card.',
            'stolen_card': 'This card has been reported stolen. Please use a different card.',
            'fraudulent': 'This transaction was flagged. Please contact your bank.',
            'do_not_honor': 'Your bank declined this transaction. Please contact them or try a different card.',
            'do_not_try_again': 'Your bank declined this transaction. Please use a different card.',
            'authentication_required': 'Additional authentication is required. Please try again.',
        };
        return declineMessages[error.decline_code] || error.message;
    }

    return errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
};

// Simplified card-only version for setup intents
export function CardSetupForm({ onSuccess, onError, onRetry }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error, setupIntent } = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: window.location.origin,
                },
                redirect: 'if_required',
            });

            if (error) {
                const friendlyMessage = getCardErrorMessage(error);
                setErrorMessage(friendlyMessage);
                setRetryCount(prev => prev + 1);
                onError?.({ ...error, friendlyMessage });
            } else if (setupIntent && setupIntent.status === 'succeeded') {
                setIsComplete(true);
                onSuccess?.(setupIntent);
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred. Please try again.');
            setRetryCount(prev => prev + 1);
            onError?.(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRetryWithNewCard = () => {
        setErrorMessage(null);
        onRetry?.();
    };

    if (isComplete) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Payment method saved</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                    You won't be charged until your trial ends.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <p>{errorMessage}</p>
                    {retryCount >= 2 && (
                        <p className="mt-2 text-gray-400">
                            Having trouble? Try a different card or{' '}
                            <button
                                type="button"
                                onClick={handleRetryWithNewCard}
                                className="text-brand-primary underline hover:no-underline"
                            >
                                start fresh
                            </button>
                        </p>
                    )}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-3 bg-brand-teal text-white font-semibold rounded-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                    </>
                ) : retryCount > 0 ? (
                    <>
                        <CreditCard className="w-5 h-5" />
                        Try Again
                    </>
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        Start 5-Day Free Trial
                    </>
                )}
            </button>

            <p className="text-xs text-center text-gray-500">
                Your card will be charged after the trial ends. Cancel anytime.
            </p>
        </form>
    );
}
