import { useState, useEffect } from 'react';
import { X, Cookie, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'productionos_cookie_consent';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState({
        essential: true, // Always true, cannot be disabled
        analytics: false,
        marketing: false
    });

    useEffect(() => {
        // Check if consent has already been given
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveConsent = (consentType) => {
        const consentData = {
            type: consentType,
            preferences: consentType === 'all' ? { essential: true, analytics: true, marketing: true } : preferences,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
        setIsVisible(false);
    };

    const handleAcceptAll = () => {
        saveConsent('all');
    };

    const handleAcceptEssential = () => {
        setPreferences({ essential: true, analytics: false, marketing: false });
        saveConsent('essential');
    };

    const handleSavePreferences = () => {
        saveConsent('custom');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-6 animate-slide-up">
            <div className="max-w-3xl mx-auto bg-marketing-surface border border-marketing-border rounded-xl shadow-2xl overflow-hidden">
                {/* Main Banner */}
                <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-marketing-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Cookie className="text-marketing-primary" size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base md:text-lg font-bold text-marketing-text-primary mb-2">We value your privacy</h3>
                            <p className="text-marketing-text-secondary text-sm mb-4 leading-relaxed">
                                We use cookies to enhance your experience and analyze our traffic.
                                By clicking "Accept All", you consent to our use of cookies.{' '}
                                <Link to="/legal/privacy" className="text-marketing-primary hover:underline">Privacy Policy</Link>
                            </p>

                            {/* Buttons */}
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                <button
                                    onClick={handleAcceptAll}
                                    className="px-4 py-2 md:px-5 md:py-2.5 bg-marketing-primary text-white text-sm font-semibold rounded-lg hover:bg-marketing-primary/90 transition-colors"
                                >
                                    Accept All
                                </button>
                                <button
                                    onClick={handleAcceptEssential}
                                    className="px-4 py-2 md:px-5 md:py-2.5 bg-marketing-background border border-marketing-border text-marketing-text-primary text-sm font-medium rounded-lg hover:bg-marketing-border/50 transition-colors"
                                >
                                    Essential Only
                                </button>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="px-4 py-2 md:px-5 md:py-2.5 text-marketing-text-secondary hover:text-marketing-text-primary transition-colors text-sm"
                                >
                                    {showDetails ? 'Hide' : 'Customize'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Preferences */}
                    {showDetails && (
                        <div className="mt-6 pt-6 border-t border-marketing-border">
                            <h4 className="font-semibold text-marketing-text-primary mb-4 flex items-center gap-2 text-sm">
                                <Shield size={16} className="text-marketing-accent" />
                                Cookie Preferences
                            </h4>
                            <div className="space-y-3">
                                {/* Essential Cookies */}
                                <div className="flex items-center justify-between p-3 md:p-4 bg-marketing-background rounded-lg">
                                    <div>
                                        <div className="font-medium text-marketing-text-primary text-sm">Essential Cookies</div>
                                        <p className="text-marketing-text-secondary text-xs">Required for the website to function.</p>
                                    </div>
                                    <div className="w-10 h-5 bg-marketing-primary rounded-full relative shrink-0">
                                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                                    </div>
                                </div>

                                {/* Analytics Cookies */}
                                <div className="flex items-center justify-between p-3 md:p-4 bg-marketing-background rounded-lg">
                                    <div>
                                        <div className="font-medium text-marketing-text-primary text-sm">Analytics Cookies</div>
                                        <p className="text-marketing-text-secondary text-xs">Help us understand site usage.</p>
                                    </div>
                                    <button
                                        onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                                        className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${preferences.analytics ? 'bg-marketing-primary' : 'bg-marketing-border'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${preferences.analytics ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </div>

                                {/* Marketing Cookies */}
                                <div className="flex items-center justify-between p-3 md:p-4 bg-marketing-background rounded-lg">
                                    <div>
                                        <div className="font-medium text-marketing-text-primary text-sm">Marketing Cookies</div>
                                        <p className="text-marketing-text-secondary text-xs">Used for relevant advertisements.</p>
                                    </div>
                                    <button
                                        onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                                        className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${preferences.marketing ? 'bg-marketing-primary' : 'bg-marketing-border'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${preferences.marketing ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleSavePreferences}
                                    className="px-4 py-2 bg-marketing-accent text-white text-sm font-semibold rounded-lg hover:bg-marketing-accent/90 transition-colors"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Utility function to check if a specific cookie type is allowed
export function isCookieAllowed(type) {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) return false;

    try {
        const { preferences, type: consentType } = JSON.parse(consent);
        if (consentType === 'all') return true;
        return preferences[type] === true;
    } catch {
        return false;
    }
}

// Utility function to get all cookie preferences
export function getCookiePreferences() {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) return null;

    try {
        return JSON.parse(consent);
    } catch {
        return null;
    }
}
