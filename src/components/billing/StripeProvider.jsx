/**
 * Stripe Provider Component
 * Wraps children with Stripe Elements context
 */
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Use test key in development, live key in production
const isTestMode = import.meta.env.DEV || import.meta.env.VITE_STRIPE_TEST_MODE === 'true';

// Stripe publishable keys
const STRIPE_PUBLISHABLE_KEY_LIVE = 'pk_live_51MmM4NLE30d1czmdZGGV8JJcJFaQxRPUVNH3TujuG8Q8GlPJcRD9gLG7LfIaXNKB9Cx2TaT1GvVW9zHwRkHf9kPW00rz6yK2gD';
const STRIPE_PUBLISHABLE_KEY_TEST = 'pk_test_51MmM4NLE30d1czmd8zcHTKRvk3XqGpLXdHvT1xwgU8P4qGEq7V0LfH9pWjxHGjZmMKBZpV5VLT7X0GhPxR5GQr5j00RCMq0kMD';

const stripePromise = loadStripe(
    isTestMode ? STRIPE_PUBLISHABLE_KEY_TEST : STRIPE_PUBLISHABLE_KEY_LIVE
);

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
