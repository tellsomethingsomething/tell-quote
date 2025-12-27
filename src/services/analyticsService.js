import { isCookieAllowed } from '../components/common/CookieConsent';

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

// Track custom events to Plausible
export function trackEvent(eventName, props = {}) {
    // Check if analytics cookies are allowed
    if (!isCookieAllowed('analytics')) {
        return;
    }

    if (!PLAUSIBLE_DOMAIN) {
        console.log(`[Analytics] ${eventName}`, props);
        return;
    }

    // Plausible custom events
    if (window.plausible) {
        window.plausible(eventName, { props });
    }
}

// Track page views (automatic with Plausible script, but can be called manually for SPAs)
export function trackPageView(url) {
    if (!isCookieAllowed('analytics')) return;

    if (window.plausible) {
        window.plausible('pageview', { u: url });
    }
}

// Key conversion events
export const Events = {
    // Signup flow
    SIGNUP_STARTED: 'Signup Started',
    SIGNUP_COMPLETED: 'Signup Completed',
    ONBOARDING_COMPLETED: 'Onboarding Completed',

    // Subscription
    TRIAL_STARTED: 'Trial Started',
    SUBSCRIPTION_STARTED: 'Subscription Started',
    SUBSCRIPTION_UPGRADED: 'Subscription Upgraded',
    SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',

    // Product usage
    QUOTE_CREATED: 'Quote Created',
    QUOTE_SENT: 'Quote Sent',
    PROJECT_CREATED: 'Project Created',
    INVOICE_SENT: 'Invoice Sent',
    TEAM_MEMBER_INVITED: 'Team Member Invited',

    // AI features
    AI_RESEARCH_USED: 'AI Research Used',
    AI_TOKENS_PURCHASED: 'AI Tokens Purchased',

    // Engagement
    FEATURE_PAGE_VIEWED: 'Feature Page Viewed',
    DEMO_INTERACTION: 'Demo Interaction',
    HELP_ARTICLE_VIEWED: 'Help Article Viewed',
};

// Track signup funnel
export function trackSignup(step, metadata = {}) {
    trackEvent('Signup', { step, ...metadata });
}

// Track feature usage
export function trackFeatureUsage(feature, action = 'used') {
    trackEvent('Feature Usage', { feature, action });
}

// Track conversion events
export function trackConversion(eventType, value = null) {
    const props = {};
    if (value !== null) {
        props.value = value;
    }
    trackEvent(eventType, props);
}

// Initialize analytics (add Plausible script if not already present)
export function initAnalytics() {
    if (!PLAUSIBLE_DOMAIN) {
        console.log('Plausible domain not configured - analytics disabled');
        return;
    }

    // Check if script already exists
    if (document.querySelector('script[data-domain="' + PLAUSIBLE_DOMAIN + '"]')) {
        return;
    }

    // Add Plausible script
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);

    // Enable custom events
    window.plausible = window.plausible || function() {
        (window.plausible.q = window.plausible.q || []).push(arguments);
    };
}

export default {
    trackEvent,
    trackPageView,
    trackSignup,
    trackFeatureUsage,
    trackConversion,
    initAnalytics,
    Events,
};
