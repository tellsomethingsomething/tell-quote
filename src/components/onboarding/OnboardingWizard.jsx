import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Globe2, CreditCard, Rocket, Film,
    CheckCircle, ArrowRight, ArrowLeft, Loader2, X,
    AlertCircle, Sparkles, Video, Camera, Radio,
    Calendar, Activity, Image, Briefcase, Plus
} from 'lucide-react';
import { useOrganizationStore } from '../../store/organizationStore';
import { CURRENCIES, DEFAULT_TAX_RULES } from '../../store/settingsStore';
import { supabase } from '../../lib/supabase';
import CountrySelect from '../ui/CountrySelect';
import {
    ONBOARDING_STEPS,
    COMPANY_TYPES,
    TEAM_SIZE_OPTIONS,
    getOnboardingProgress,
    updateOnboardingProgress,
    completeStep,
    skipStep,
    completeOnboarding,
} from '../../services/onboardingService';
import { createSetupIntent } from '../../services/billingService';
import StripeProvider from '../billing/StripeProvider';
import { CardSetupForm } from '../billing/PaymentMethodForm';
import logger from '../../utils/logger';

// Step icons mapping
const STEP_ICONS = {
    company_setup: Building2,
    billing: CreditCard,
    first_action: Rocket,
};

// Company type icons
const TYPE_ICONS = {
    video: Video,
    camera: Camera,
    radio: Radio,
    film: Film,
    calendar: Calendar,
    building: Building2,
    plus: Plus,
    activity: Activity,
    image: Image,
    briefcase: Briefcase,
};

// All country codes - sorted A-Z by name using DEFAULT_TAX_RULES
const ALL_COUNTRY_CODES = [
    'AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ',
    'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI',
    'KH', 'CM', 'CA', 'CV', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CD', 'CR', 'HR', 'CU', 'CY', 'CZ',
    'DK', 'DJ', 'DM', 'DO',
    'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET',
    'FJ', 'FI', 'FR',
    'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GY',
    'HT', 'HN', 'HK', 'HU',
    'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'CI',
    'JM', 'JP', 'JO',
    'KZ', 'KE', 'KN', 'KR', 'KW', 'KG',
    'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU',
    'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MR', 'MU', 'MX', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM',
    'NA', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO',
    'OM',
    'PK', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'PR', 'PF',
    'QA',
    'RE', 'RO', 'RU', 'RW',
    'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO', 'ZA', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE', 'CH', 'SY',
    'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM',
    'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ',
    'VA', 'VE', 'VN', 'VU',
    'XK',
    'YE',
    'ZM', 'ZW', 'GU'
];

export default function OnboardingWizard({ userId, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(null);
    const [organizationId, setOrganizationId] = useState(null);
    const [userEmail, setUserEmail] = useState(null);

    const { createOrganization } = useOrganizationStore();

    // Form data - simplified
    const [formData, setFormData] = useState({
        // Company Setup
        userName: '',
        companyName: '',
        companyType: '',
        teamSize: '',
        country: '',
        currency: 'USD',

        // Billing
        selectedPlan: 'individual',
        billingComplete: false,

        // First Action
        firstAction: 'explore_dashboard',
    });

    // Load existing progress
    useEffect(() => {
        loadProgress();
    }, [userId]);

    const loadProgress = async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            // Get user email
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }

            const data = await getOnboardingProgress(userId);
            if (data) {
                setProgress(data);

                // Check if organization was already created
                if (data.organization_id) {
                    setOrganizationId(data.organization_id);
                }

                // Find current step index
                const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === data.current_step);
                if (stepIndex >= 0) {
                    setCurrentStep(stepIndex);
                }

                // Restore form data
                setFormData(prev => ({
                    ...prev,
                    companyType: data.company_type || '',
                    teamSize: data.team_size || '',
                }));
            }
        } catch (err) {
            logger.error('Error loading progress:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleCountryChange = (country) => {
        updateField('country', country);

        // Auto-set currency based on country - COMPREHENSIVE GLOBAL MAPPING
        const countryCurrencyMap = {
            // North America
            'US': 'USD', 'CA': 'CAD', 'MX': 'MXN',
            // Central America & Caribbean
            'GT': 'GTQ', 'BZ': 'USD', 'SV': 'USD', 'HN': 'USD', 'NI': 'USD', 'CR': 'CRC', 'PA': 'PAB',
            'CU': 'USD', 'JM': 'JMD', 'HT': 'USD', 'DO': 'DOP', 'PR': 'USD', 'TT': 'TTD',
            'BB': 'BBD', 'BS': 'BSD', 'LC': 'USD', 'GD': 'USD', 'VC': 'USD', 'AG': 'USD', 'DM': 'USD', 'KN': 'USD',
            // South America
            'BR': 'BRL', 'AR': 'ARS', 'CO': 'COP', 'PE': 'PEN', 'VE': 'VES', 'CL': 'CLP',
            'EC': 'USD', 'BO': 'USD', 'PY': 'USD', 'UY': 'UYU', 'GY': 'USD', 'SR': 'USD',
            // Western Europe
            'GB': 'GBP', 'IE': 'EUR', 'FR': 'EUR', 'DE': 'EUR', 'NL': 'EUR', 'BE': 'EUR',
            'LU': 'EUR', 'CH': 'CHF', 'AT': 'EUR', 'LI': 'CHF',
            // Southern Europe
            'ES': 'EUR', 'PT': 'EUR', 'IT': 'EUR', 'GR': 'EUR', 'MT': 'EUR', 'CY': 'EUR',
            'AD': 'EUR', 'SM': 'EUR', 'MC': 'EUR', 'VA': 'EUR',
            // Northern Europe
            'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'FI': 'EUR', 'IS': 'ISK',
            'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR',
            // Eastern Europe
            'PL': 'PLN', 'CZ': 'CZK', 'SK': 'EUR', 'HU': 'HUF', 'RO': 'RON', 'BG': 'BGN',
            'UA': 'UAH', 'BY': 'USD', 'MD': 'USD', 'RU': 'RUB',
            // Balkans
            'HR': 'EUR', 'SI': 'EUR', 'RS': 'RSD', 'BA': 'USD', 'ME': 'EUR', 'MK': 'EUR', 'AL': 'USD', 'XK': 'EUR',
            // Middle East
            'AE': 'AED', 'SA': 'SAR', 'QA': 'QAR', 'KW': 'KWD', 'BH': 'BHD', 'OM': 'OMR',
            'JO': 'JOD', 'LB': 'LBP', 'SY': 'SYP', 'IQ': 'IQD', 'IR': 'IRR', 'YE': 'YER',
            'IL': 'ILS', 'PS': 'ILS', 'TR': 'TRY',
            // Central Asia
            'KZ': 'KZT', 'UZ': 'UZS', 'TM': 'TMT', 'TJ': 'TJS', 'KG': 'KGS', 'AF': 'AFN',
            // South Asia
            'IN': 'INR', 'PK': 'PKR', 'BD': 'BDT', 'LK': 'LKR', 'NP': 'NPR', 'BT': 'INR', 'MV': 'USD',
            // Southeast Asia
            'SG': 'SGD', 'MY': 'MYR', 'TH': 'THB', 'ID': 'IDR', 'PH': 'PHP', 'VN': 'VND',
            'MM': 'MMK', 'KH': 'KHR', 'LA': 'LAK', 'BN': 'BND', 'TL': 'USD',
            // East Asia
            'CN': 'CNY', 'JP': 'JPY', 'KR': 'KRW', 'TW': 'TWD', 'HK': 'HKD', 'MO': 'MOP', 'MN': 'MNT',
            // Oceania
            'AU': 'AUD', 'NZ': 'NZD', 'FJ': 'FJD', 'PG': 'PGK', 'WS': 'WST', 'TO': 'TOP',
            'VU': 'VUV', 'SB': 'SBD', 'NC': 'XPF', 'PF': 'XPF', 'GU': 'USD',
            // North Africa
            'EG': 'EGP', 'MA': 'MAD', 'DZ': 'DZD', 'TN': 'TND', 'LY': 'USD', 'SD': 'USD',
            // West Africa
            'NG': 'NGN', 'GH': 'GHS', 'SN': 'XOF', 'CI': 'XOF', 'ML': 'XOF', 'BF': 'XOF',
            'NE': 'XOF', 'GN': 'USD', 'BJ': 'XOF', 'TG': 'XOF', 'SL': 'USD', 'LR': 'USD',
            'MR': 'USD', 'GM': 'USD', 'GW': 'XOF', 'CV': 'USD',
            // East Africa
            'KE': 'KES', 'TZ': 'TZS', 'UG': 'UGX', 'ET': 'ETB', 'RW': 'RWF', 'BI': 'USD',
            'SO': 'USD', 'DJ': 'USD', 'ER': 'USD', 'SS': 'USD', 'MU': 'MUR', 'SC': 'USD',
            'MG': 'USD', 'KM': 'USD', 'RE': 'EUR',
            // Central Africa
            'CD': 'USD', 'CG': 'XAF', 'CF': 'XAF', 'CM': 'XAF', 'TD': 'XAF', 'GA': 'XAF',
            'GQ': 'XAF', 'ST': 'USD', 'AO': 'USD',
            // Southern Africa
            'ZA': 'ZAR', 'ZW': 'USD', 'ZM': 'USD', 'BW': 'USD', 'NA': 'ZAR', 'MZ': 'USD',
            'MW': 'USD', 'SZ': 'ZAR', 'LS': 'ZAR',
            // Caucasus
            'GE': 'GEL', 'AM': 'AMD', 'AZ': 'AZN',
        };

        if (countryCurrencyMap[country]) {
            updateField('currency', countryCurrencyMap[country]);
        }
    };

    const validateStep = () => {
        const step = ONBOARDING_STEPS[currentStep];

        switch (step.id) {
            case 'company_setup':
                if (!formData.userName.trim()) {
                    setError('Please enter your name');
                    return false;
                }
                if (!formData.companyName.trim()) {
                    setError('Please enter your company name');
                    return false;
                }
                if (!formData.companyType) {
                    setError('Please select your company type');
                    return false;
                }
                if (!formData.teamSize) {
                    setError('Please select your team size');
                    return false;
                }
                if (!formData.country) {
                    setError('Please select your country');
                    return false;
                }
                break;

            case 'first_action':
                if (!formData.firstAction) {
                    setError('Please select what you want to do first');
                    return false;
                }
                break;
        }

        return true;
    };

    const handleNext = async () => {
        if (!validateStep()) return;

        // Defensive check: ensure userId is available before attempting to save
        if (!userId) {
            setError('Please sign in to continue with onboarding.');
            return;
        }

        const step = ONBOARDING_STEPS[currentStep];
        setIsSaving(true);

        try {
            // Save step data
            const updates = getStepUpdates(step.id);
            await updateOnboardingProgress(userId, updates);
            await completeStep(userId, step.id);

            // Create organization after company_setup step to enable billing step
            if (step.id === 'company_setup' && !organizationId && formData.companyName) {
                const org = await createOrganization(formData.companyName, userId, formData.userName);
                if (org?.id) {
                    setOrganizationId(org.id);
                    // Store org ID in onboarding progress
                    await updateOnboardingProgress(userId, { organization_id: org.id });
                }
            }

            // Move to next step
            if (currentStep < ONBOARDING_STEPS.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                await handleComplete();
            }
        } catch (err) {
            logger.error('handleNext error:', err);
            setError('Failed to save progress. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSkip = async () => {
        const step = ONBOARDING_STEPS[currentStep];

        if (step.required) {
            return; // Can't skip required steps
        }

        setIsSaving(true);

        try {
            await skipStep(userId, step.id);

            // Move to next step
            if (currentStep < ONBOARDING_STEPS.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                await handleComplete();
            }
        } catch (err) {
            logger.error('handleSkip error:', err);
            setError('Failed to skip step. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const getStepUpdates = (stepId) => {
        switch (stepId) {
            case 'company_setup':
                return {
                    company_type: formData.companyType,
                    team_size: formData.teamSize,
                };
            case 'billing':
                return {
                    selected_plan: formData.selectedPlan,
                };
            case 'first_action':
                return {
                    first_action: formData.firstAction,
                };
            default:
                return {};
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        setError(null);

        try {
            // 1. Get or create the organization
            let org;
            if (organizationId) {
                const { data, error: fetchError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', organizationId)
                    .single();

                if (fetchError) {
                    logger.error('Failed to fetch organization:', fetchError);
                    throw new Error('Failed to load organization');
                }
                org = data;
            } else {
                org = await createOrganization(formData.companyName, userId, formData.userName);
            }

            if (!org) {
                throw new Error('Failed to get or create organization');
            }

            // 2. Update organization settings
            const settingsData = {
                company: {
                    name: formData.companyName,
                    country: formData.country,
                    teamSize: formData.teamSize,
                },
                quoteDefaults: {
                    currency: formData.currency,
                    validityDays: 30,
                },
                preferredCurrencies: [formData.currency, 'USD', 'EUR', 'GBP']
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 5),
                personalization: {
                    companyType: formData.companyType,
                    teamSize: formData.teamSize,
                },
            };

            const { error: settingsError } = await supabase
                .from('settings')
                .update(settingsData)
                .eq('organization_id', org.id);

            if (settingsError) {
                logger.warn('Settings update warning:', settingsError);
                // Don't throw - settings update is not critical for completion
            }

            // 3. Mark onboarding as complete
            try {
                await completeOnboarding(userId, org.id);
            } catch (onboardErr) {
                logger.warn('Onboarding progress update warning:', onboardErr);
                // Don't throw - this is not critical for completion
            }

            // 4. Create onboarding checklist (ignore errors - not critical)
            try {
                await supabase.from('onboarding_checklist').insert({
                    user_id: userId,
                    organization_id: org.id,
                    company_profile_setup: true,
                });
            } catch (checklistErr) {
                logger.warn('Checklist creation warning:', checklistErr);
            }

            // 5. Call completion handler - this is the critical action
            logger.info('Onboarding complete, calling completion handler');
            setIsSaving(false);

            if (onComplete) {
                onComplete(org, formData.firstAction);
            } else {
                logger.error('No onComplete callback provided');
                setError('Setup complete but navigation failed. Please refresh the page.');
            }
        } catch (err) {
            logger.error('Onboarding error:', err);
            // Show user-friendly message instead of raw technical error
            setError('Failed to complete setup. Please try again or contact support if the problem persists.');
            setIsSaving(false);
        }
    };

    // Render step content
    const renderStepContent = () => {
        const step = ONBOARDING_STEPS[currentStep];

        switch (step.id) {
            case 'company_setup':
                return <CompanySetupStep formData={formData} updateField={updateField} handleCountryChange={handleCountryChange} />;
            case 'billing':
                return <BillingStep
                    formData={formData}
                    updateField={updateField}
                    onBillingComplete={() => updateField('billingComplete', true)}
                    organizationId={organizationId}
                    userEmail={userEmail}
                />;
            case 'first_action':
                return <FirstActionStep formData={formData} updateField={updateField} />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    const step = ONBOARDING_STEPS[currentStep];
    const StepIcon = STEP_ICONS[step?.id] || Building2;
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col">
            {/* Progress Header */}
            <div className="bg-dark-card border-b border-dark-border px-6 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold text-white">Welcome to ProductionOS</h1>
                        <span className="text-sm text-gray-500">
                            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-1">
                        {ONBOARDING_STEPS.map((s, i) => (
                            <div
                                key={s.id}
                                className={`flex-1 h-1 rounded-full transition-colors ${
                                    i < currentStep ? 'bg-brand-primary' :
                                    i === currentStep ? 'bg-brand-primary/60' :
                                    'bg-dark-border'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Step Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                            <StepIcon className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-white">{step?.label}</h2>
                            {step?.id === 'company_setup' && (
                                <p className="text-gray-400">Let's set up your workspace</p>
                            )}
                            {step?.id === 'pain_points' && (
                                <p className="text-gray-400">Help us personalize your experience</p>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-auto">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Step Content */}
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        {renderStepContent()}
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="bg-dark-card border-t border-dark-border px-6 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex items-center gap-3">
                        {!step?.required && (
                            <button
                                onClick={handleSkip}
                                disabled={isSaving}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Skip
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isLastStep ? (
                                <Sparkles className="w-4 h-4" />
                            ) : (
                                <ArrowRight className="w-4 h-4" />
                            )}
                            {isSaving ? 'Saving...' : isLastStep ? 'Get Started' : 'Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step Components

function CompanySetupStep({ formData, updateField, handleCountryChange }) {
    // Memoize sorted countries list
    const countries = useMemo(() => {
        return ALL_COUNTRY_CODES
            .map(code => ({ code, name: DEFAULT_TAX_RULES[code]?.name || code }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    return (
        <div className="space-y-6">
            {/* Your Name */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name *
                </label>
                <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) => updateField('userName', e.target.value)}
                    placeholder="Enter your full name"
                    className="input w-full text-lg"
                    autoFocus
                />
            </div>

            {/* Company Name */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name *
                </label>
                <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder="Enter your company name"
                    className="input w-full text-lg"
                />
            </div>

            {/* Company Type */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    What type of company are you? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMPANY_TYPES.map(type => {
                        const Icon = TYPE_ICONS[type.icon] || Building2;
                        const isSelected = formData.companyType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => updateField('companyType', type.id)}
                                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                                    isSelected
                                        ? 'border-brand-primary bg-brand-primary/10'
                                        : 'border-dark-border bg-dark-bg hover:border-gray-600'
                                }`}
                            >
                                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} />
                                <div>
                                    <span className={isSelected ? 'text-white' : 'text-gray-300'}>{type.label}</span>
                                    {type.description && (
                                        <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Team Size */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Size *
                </label>
                <div className="grid grid-cols-4 gap-3">
                    {TEAM_SIZE_OPTIONS.map(size => (
                        <button
                            key={size.id}
                            onClick={() => updateField('teamSize', size.id)}
                            className={`p-3 rounded-lg border text-center transition-colors ${
                                formData.teamSize === size.id
                                    ? 'border-brand-primary bg-brand-primary/10 text-white'
                                    : 'border-dark-border bg-dark-bg text-gray-300 hover:border-gray-600'
                            }`}
                        >
                            {size.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Country & Currency */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Country *
                    </label>
                    <CountrySelect
                        value={formData.country}
                        onChange={handleCountryChange}
                        countries={countries}
                        placeholder="Select country"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Primary Currency
                    </label>
                    <select
                        value={formData.currency}
                        onChange={(e) => updateField('currency', e.target.value)}
                        className="input w-full"
                    >
                        {CURRENCIES.map(currency => (
                            <option key={currency.code} value={currency.code}>
                                {currency.code} - {currency.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

function FirstActionStep({ formData, updateField }) {
    const options = [
        {
            id: 'create_quote',
            label: 'Create a quote',
            description: 'Start with a new quote for a client',
            icon: CreditCard,
        },
        {
            id: 'add_project',
            label: 'Add a project',
            description: 'Set up your first production project',
            icon: Film,
        },
        {
            id: 'setup_profile',
            label: 'Setup company profile',
            description: 'Complete your company profile in Settings',
            icon: Building2,
        },
        {
            id: 'explore_dashboard',
            label: 'Explore the dashboard',
            description: 'Take a tour of all the features',
            icon: Globe2,
            recommended: true,
        },
    ];

    return (
        <div className="space-y-4">
            <p className="text-gray-400">What would you like to do first?</p>

            <div className="space-y-3">
                {options.map(option => (
                    <button
                        key={option.id}
                        onClick={() => updateField('firstAction', option.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                            formData.firstAction === option.id
                                ? 'border-brand-primary bg-brand-primary/10'
                                : 'border-dark-border bg-dark-bg hover:border-gray-600'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.firstAction === option.id ? 'bg-brand-primary/20' : 'bg-dark-card'
                        }`}>
                            <option.icon className={`w-5 h-5 ${
                                formData.firstAction === option.id ? 'text-brand-primary' : 'text-gray-400'
                            }`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={formData.firstAction === option.id ? 'text-white font-medium' : 'text-gray-300'}>
                                    {option.label}
                                </span>
                                {option.recommended && (
                                    <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs rounded-full">
                                        Recommended
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.firstAction === option.id
                                ? 'border-brand-primary bg-brand-primary'
                                : 'border-gray-600'
                        }`}>
                            {formData.firstAction === option.id && (
                                <CheckCircle className="w-3 h-3 text-white" />
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// Billing Step - Payment method capture with 5-day trial
function BillingStep({ formData, updateField, onBillingComplete, organizationId, userEmail }) {
    const [selectedPlan, setSelectedPlan] = useState(formData.selectedPlan || 'individual');
    const [clientSecret, setClientSecret] = useState(null);
    const [isLoadingSecret, setIsLoadingSecret] = useState(false);
    const [setupError, setSetupError] = useState(null);
    const [paymentSaved, setPaymentSaved] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    const plans = [
        {
            id: 'individual',
            name: 'Individual',
            price: '$24',
            period: '/month',
            features: ['Unlimited quotes', 'Up to 50 clients', '2,500 AI tokens/month', 'PDF exports'],
            recommended: true,
        },
        {
            id: 'team',
            name: 'Team',
            price: '$49',
            period: '/month',
            features: ['Everything in Individual', 'Unlimited clients', 'Up to 10 team members', '10,000 AI tokens/month', 'Priority support'],
        },
    ];

    // Load SetupIntent when a paid plan is selected
    useEffect(() => {
        if (selectedPlan !== 'free' && organizationId && !clientSecret && !paymentSaved) {
            loadSetupIntent();
        }
    }, [selectedPlan, organizationId, retryKey]);

    const loadSetupIntent = async () => {
        setIsLoadingSecret(true);
        setSetupError(null);
        try {
            const result = await createSetupIntent(organizationId, userEmail);
            logger.debug('SetupIntent result:', result);
            if (result && typeof result.clientSecret === 'string' && result.clientSecret) {
                setClientSecret(result.clientSecret);
            } else {
                logger.error('Invalid SetupIntent result:', result);
                setSetupError('Unable to initialize payment form');
            }
        } catch (err) {
            logger.error('SetupIntent error:', err);
            setSetupError(err?.message || 'Unable to initialize payment form. Please try again.');
        } finally {
            setIsLoadingSecret(false);
        }
    };

    const handlePaymentSuccess = (setupIntent) => {
        setPaymentSaved(true);
        updateField('selectedPlan', selectedPlan);
        updateField('paymentMethodId', setupIntent.payment_method);
        onBillingComplete?.();
    };

    const handlePaymentError = (error) => {
        // Error is already shown in CardSetupForm, no need to duplicate
        logger.error('Payment error:', error);
    };

    const handleRetry = () => {
        // Reset the form by getting a new SetupIntent
        setClientSecret(null);
        setSetupError(null);
        setRetryKey(prev => prev + 1);
    };

    const handleSkipBilling = () => {
        updateField('selectedPlan', 'free');
        updateField('billingComplete', true);
        onBillingComplete?.();
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm mb-4">
                    <Sparkles className="w-4 h-4" />
                    5-Day Free Trial
                </div>
                <p className="text-gray-400">
                    Try ProductionOS free for 5 days. Add a payment method to continue after the trial.
                </p>
            </div>

            {/* Plan Selection */}
            <div className="grid gap-4 md:grid-cols-2">
                {plans.map(plan => (
                    <button
                        key={plan.id}
                        onClick={() => {
                            setSelectedPlan(plan.id);
                            if (plan.id !== selectedPlan) {
                                setClientSecret(null); // Reset to trigger new SetupIntent
                            }
                        }}
                        disabled={paymentSaved}
                        className={`relative p-5 rounded-xl border text-left transition-all ${
                            selectedPlan === plan.id
                                ? 'border-brand-primary bg-brand-primary/10'
                                : 'border-dark-border bg-dark-bg hover:border-gray-600'
                        } ${paymentSaved ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-3 inset-x-0 flex justify-center">
                                <span className="px-3 py-1 bg-brand-primary text-white text-xs font-medium rounded-full">
                                    Recommended
                                </span>
                            </div>
                        )}
                        <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-green-400">$0</span>
                                <span className="text-gray-500">for 5 days</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-sm text-gray-500">{plan.price}{plan.period}</span>
                                <span className="text-sm text-gray-500">after trial</span>
                            </div>
                        </div>
                        <h4 className="font-semibold text-white mb-2">{plan.name}</h4>
                        <ul className="space-y-1">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPlan === plan.id
                                ? 'border-brand-primary bg-brand-primary'
                                : 'border-gray-600'
                        }`}>
                            {selectedPlan === plan.id && (
                                <CheckCircle className="w-3 h-3 text-white" />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Payment Form */}
            {!paymentSaved && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Payment Method
                    </h4>

                    {isLoadingSecret ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                        </div>
                    ) : setupError ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-3">
                            {String(setupError)}
                            <button
                                onClick={loadSetupIntent}
                                className="ml-2 underline hover:no-underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : clientSecret ? (
                        <StripeProvider clientSecret={clientSecret} key={retryKey}>
                            <CardSetupForm
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                                onRetry={handleRetry}
                            />
                        </StripeProvider>
                    ) : null}
                </div>
            )}

            {/* Payment Saved Confirmation */}
            {paymentSaved && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Payment method saved</span>
                    </div>
                    <p className="text-sm text-gray-400">
                        You won't be charged until your 5-day trial ends.
                    </p>
                </div>
            )}

            {/* Skip Option */}
            {!paymentSaved && (
                <div className="text-center">
                    <button
                        onClick={handleSkipBilling}
                        className="text-sm text-gray-500 hover:text-brand-primary underline"
                    >
                        Skip for now - continue with limited free plan
                    </button>
                </div>
            )}

            {/* Trial Info */}
            <div className="bg-dark-bg/50 border border-dark-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-white mb-1">What you get in the trial</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li>• Full access to all features for 5 days</li>
                            <li>• Unlimited quotes and projects</li>
                            <li>• Cancel anytime before trial ends</li>
                            <li>• You'll be charged only after the trial</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}
