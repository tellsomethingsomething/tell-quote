/**
 * Stripe Provider Component
 * Wraps children with Stripe Elements context
 */
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Use test key in development, live key in production
// SECURITY: Keys loaded from environment variables
const isTestMode = import.meta.env.DEV || import.meta.env.VITE_STRIPE_TEST_MODE === 'true';

// Stripe publishable keys from environment variables
const STRIPE_PUBLISHABLE_KEY = isTestMode
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST
    : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_LIVE;

// Validate key exists
if (!STRIPE_PUBLISHABLE_KEY) {
    console.error('Missing Stripe publishable key. Set VITE_STRIPE_PUBLISHABLE_KEY_TEST or VITE_STRIPE_PUBLISHABLE_KEY_LIVE in environment.');
}

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Stripe Elements appearance
const appearance = {
    theme: 'night',
    variables: {
        colorPrimary: '#8B5CF6',
        colorBackground: '#1a1a2e',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
    },
    rules: {
        '.Input': {
            backgroundColor: '#16213e',
            border: '1px solid #374151',
        },
        '.Input:focus': {
            border: '1px solid #8B5CF6',
            boxShadow: '0 0 0 1px #8B5CF6',
        },
        '.Label': {
            color: '#9ca3af',
        },
    },
};

export default function StripeProvider({ children, clientSecret }) {
    const options = clientSecret ? {
        clientSecret,
        appearance,
    } : {
        mode: 'setup',
        currency: 'usd',
        appearance,
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
}

export { stripePromise };
