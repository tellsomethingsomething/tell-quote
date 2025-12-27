import React, { useState, useEffect } from 'react';
import {
    Building2, Globe2, Users, Target, Upload, CreditCard, Rocket,
    CheckCircle, ArrowRight, ArrowLeft, Loader2, X, Video, Camera,
    Radio, Film, Calendar, Plus, AlertCircle, Download, Sparkles
} from 'lucide-react';
import { useOrganizationStore } from '../../store/organizationStore';
import { CURRENCIES, DEFAULT_TAX_RULES } from '../../store/settingsStore';
import { supabase } from '../../lib/supabase';
import {
    ONBOARDING_STEPS,
    COMPANY_TYPES,
    PRIMARY_FOCUS_OPTIONS,
    TEAM_SIZE_OPTIONS,
    PAIN_POINTS,
    PAYMENT_TERMS,
    DEFAULT_CREW_ROLES,
    DEFAULT_EQUIPMENT_CATEGORIES,
    getOnboardingProgress,
    updateOnboardingProgress,
    completeStep,
    skipStep,
    completeOnboarding,
    getSuggestedRates,
    getDefaultCrewRoles,
} from '../../services/onboardingService';

// Step icons mapping
const STEP_ICONS = {
    company_setup: Building2,
    billing: CreditCard,
    pain_points: Target,
    company_profile: Building2,
    team_invite: Users,
    data_import: Upload,
    rate_card: CreditCard,
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

    const { createOrganization } = useOrganizationStore();

    // Form data
    const [formData, setFormData] = useState({
        // Company Setup
        companyName: '',
        companyType: '',
        primaryFocus: [],
        teamSize: '',
        country: '',
        currency: 'USD',

        // Pain Points
        painPoints: [],

        // Company Profile
        logo: null,
        address: '',
        phone: '',
        website: '',
        paymentTerms: 'net_30',

        // Team Invite
        teamInvites: [{ email: '', role: 'member' }],

        // Rate Card
        crewRates: {},
        equipmentRates: {},

        // First Action
        firstAction: 'create_quote',
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
            const data = await getOnboardingProgress(userId);
            if (data) {
                setProgress(data);

                // Find current step index
                const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === data.current_step);
                if (stepIndex >= 0) {
                    setCurrentStep(stepIndex);
                }

                // Restore form data
                setFormData(prev => ({
                    ...prev,
                    companyType: data.company_type || '',
                    primaryFocus: data.primary_focus || [],
                    teamSize: data.team_size || '',
                    painPoints: data.pain_points || [],
                    address: data.company_address || '',
                    phone: data.company_phone || '',
                    website: data.company_website || '',
                    paymentTerms: data.payment_terms || 'net_30',
                }));
            }
        } catch (err) {
            console.error('Error loading progress:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const toggleArrayItem = (field, item, max = null) => {
        setFormData(prev => {
            const current = prev[field] || [];
            if (current.includes(item)) {
                return { ...prev, [field]: current.filter(i => i !== item) };
            }
            if (max && current.length >= max) {
                return prev;
            }
            return { ...prev, [field]: [...current, item] };
        });
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

        const step = ONBOARDING_STEPS[currentStep];
        setIsSaving(true);

        try {
            // Save step data
            const updates = getStepUpdates(step.id);
            await updateOnboardingProgress(userId, updates);
            await completeStep(userId, step.id);

            // Move to next step
            if (currentStep < ONBOARDING_STEPS.length - 1) {
                // Check if next step should be skipped (conditional steps)
                let nextIndex = currentStep + 1;
                const nextStep = ONBOARDING_STEPS[nextIndex];

                // Skip team invite if solo
                if (nextStep.id === 'team_invite' && formData.teamSize === 'just_me') {
                    nextIndex++;
                }

                setCurrentStep(nextIndex);
            } else {
                await handleComplete();
            }
        } catch (err) {
            setError(err.message || 'Failed to save progress');
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
                let nextIndex = currentStep + 1;
                const nextStep = ONBOARDING_STEPS[nextIndex];

                // Skip team invite if solo
                if (nextStep.id === 'team_invite' && formData.teamSize === 'just_me') {
                    nextIndex++;
                }

                setCurrentStep(nextIndex);
            } else {
                await handleComplete();
            }
        } catch (err) {
            setError(err.message || 'Failed to skip step');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            let prevIndex = currentStep - 1;
            const prevStep = ONBOARDING_STEPS[prevIndex];

            // Skip team invite if solo when going back
            if (prevStep.id === 'team_invite' && formData.teamSize === 'just_me') {
                prevIndex--;
            }

            setCurrentStep(Math.max(0, prevIndex));
        }
    };

    const getStepUpdates = (stepId) => {
        switch (stepId) {
            case 'company_setup':
                return {
                    company_type: formData.companyType,
                    primary_focus: formData.primaryFocus,
                    team_size: formData.teamSize,
                };
            case 'pain_points':
                return {
                    pain_points: formData.painPoints,
                };
            case 'company_profile':
                return {
                    company_logo_url: formData.logo,
                    company_address: formData.address,
                    company_phone: formData.phone,
                    company_website: formData.website,
                    payment_terms: formData.paymentTerms,
                };
            case 'rate_card':
                return {
                    rate_card_configured: Object.keys(formData.crewRates).length > 0,
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

        try {
            // 1. Create the organization
            const org = await createOrganization(formData.companyName, userId);

            if (!org) {
                throw new Error('Failed to create organization');
            }

            // 2. Update organization settings
            const settingsData = {
                company: {
                    name: formData.companyName,
                    country: formData.country,
                    address: formData.address,
                    phone: formData.phone,
                    website: formData.website,
                    logo: formData.logo,
                },
                quoteDefaults: {
                    currency: formData.currency,
                    validityDays: 30,
                    paymentTerms: formData.paymentTerms,
                },
                preferredCurrencies: [formData.currency, 'USD', 'EUR', 'GBP']
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 5),
                personalization: {
                    companyType: formData.companyType,
                    primaryFocus: formData.primaryFocus,
                    painPoints: formData.painPoints,
                },
            };

            await supabase
                .from('settings')
                .update(settingsData)
                .eq('organization_id', org.id);

            // 3. Mark onboarding as complete
            await completeOnboarding(userId, org.id);

            // 4. Create onboarding checklist
            await supabase.from('onboarding_checklist').insert({
                user_id: userId,
                organization_id: org.id,
                company_profile_setup: true,
            });

            // 5. Call completion handler
            onComplete?.(org, formData.firstAction);
        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.message || 'Failed to complete setup. Please try again.');
            setIsSaving(false);
        }
    };

    // Render step content
    const renderStepContent = () => {
        const step = ONBOARDING_STEPS[currentStep];

        switch (step.id) {
            case 'company_setup':
                return <CompanySetupStep formData={formData} updateField={updateField} handleCountryChange={handleCountryChange} toggleArrayItem={toggleArrayItem} />;
            case 'billing':
                return <BillingStep formData={formData} updateField={updateField} onBillingComplete={(data) => updateField('billingComplete', true)} />;
            case 'pain_points':
                return <PainPointsStep formData={formData} toggleArrayItem={toggleArrayItem} />;
            case 'company_profile':
                return <CompanyProfileStep formData={formData} updateField={updateField} />;
            case 'team_invite':
                return <TeamInviteStep formData={formData} updateField={updateField} />;
            case 'data_import':
                return <DataImportStep formData={formData} updateField={updateField} />;
            case 'rate_card':
                return <RateCardStep formData={formData} updateField={updateField} />;
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

function CompanySetupStep({ formData, updateField, handleCountryChange, toggleArrayItem }) {
    return (
        <div className="space-y-6">
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
                    autoFocus
                />
            </div>

            {/* Company Type */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {COMPANY_TYPES.map(type => {
                        const Icon = TYPE_ICONS[type.icon] || Building2;
                        return (
                            <button
                                key={type.id}
                                onClick={() => updateField('companyType', type.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    formData.companyType === type.id
                                        ? 'border-brand-primary bg-brand-primary/10 text-white'
                                        : 'border-dark-border bg-dark-bg text-gray-300 hover:border-gray-600'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{type.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Primary Focus */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Focus <span className="text-gray-500">(select up to 3)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {PRIMARY_FOCUS_OPTIONS.map(focus => (
                        <button
                            key={focus.id}
                            onClick={() => toggleArrayItem('primaryFocus', focus.id, 3)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                formData.primaryFocus.includes(focus.id)
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-dark-bg text-gray-400 border border-dark-border hover:border-gray-600'
                            }`}
                        >
                            {focus.label}
                        </button>
                    ))}
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
                    <select
                        value={formData.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="input w-full"
                    >
                        <option value="">Select country</option>
                        {ALL_COUNTRY_CODES
                            .map(code => ({ code, name: DEFAULT_TAX_RULES[code]?.name || code }))
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(({ code, name }) => (
                                <option key={code} value={code}>{name}</option>
                            ))
                        }
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default Currency
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

function PainPointsStep({ formData, toggleArrayItem }) {
    return (
        <div className="space-y-4">
            <p className="text-gray-400 mb-4">
                What's your biggest challenge right now? <span className="text-gray-500">(select up to 3)</span>
            </p>

            <div className="space-y-3">
                {PAIN_POINTS.map(point => (
                    <button
                        key={point.id}
                        onClick={() => toggleArrayItem('painPoints', point.id, 3)}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left ${
                            formData.painPoints.includes(point.id)
                                ? 'border-brand-primary bg-brand-primary/10'
                                : 'border-dark-border bg-dark-bg hover:border-gray-600'
                        }`}
                    >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.painPoints.includes(point.id)
                                ? 'border-brand-primary bg-brand-primary'
                                : 'border-gray-600'
                        }`}>
                            {formData.painPoints.includes(point.id) && (
                                <CheckCircle className="w-3 h-3 text-white" />
                            )}
                        </div>
                        <span className={formData.painPoints.includes(point.id) ? 'text-white' : 'text-gray-300'}>
                            {point.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function CompanyProfileStep({ formData, updateField }) {
    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateField('logo', event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-400">
                Add your company details. These will appear on your quotes and invoices.
            </p>

            {/* Logo Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Logo
                </label>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-16 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-center overflow-hidden">
                        {formData.logo ? (
                            <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-gray-500 text-xs">No logo</span>
                        )}
                    </div>
                    <div>
                        <label className="btn-secondary text-sm cursor-pointer">
                            Upload Logo
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        {formData.logo && (
                            <button onClick={() => updateField('logo', null)} className="ml-2 text-xs text-red-400">
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Address */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <textarea
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 Main Street, City, Country"
                    className="input w-full resize-none"
                    rows={2}
                />
            </div>

            {/* Phone & Website */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="input w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                    <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="https://www.yourcompany.com"
                        className="input w-full"
                    />
                </div>
            </div>

            {/* Payment Terms */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Default Payment Terms</label>
                <select
                    value={formData.paymentTerms}
                    onChange={(e) => updateField('paymentTerms', e.target.value)}
                    className="input w-full"
                >
                    {PAYMENT_TERMS.map(term => (
                        <option key={term.id} value={term.id}>{term.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function TeamInviteStep({ formData, updateField }) {
    const addInvite = () => {
        updateField('teamInvites', [...formData.teamInvites, { email: '', role: 'member' }]);
    };

    const updateInvite = (index, field, value) => {
        const newInvites = [...formData.teamInvites];
        newInvites[index] = { ...newInvites[index], [field]: value };
        updateField('teamInvites', newInvites);
    };

    const removeInvite = (index) => {
        updateField('teamInvites', formData.teamInvites.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-400">
                Invite your team members to collaborate. They'll receive an email invitation.
            </p>

            <div className="space-y-3">
                {formData.teamInvites.map((invite, index) => (
                    <div key={index} className="flex gap-3">
                        <input
                            type="email"
                            value={invite.email}
                            onChange={(e) => updateInvite(index, 'email', e.target.value)}
                            placeholder="colleague@company.com"
                            className="input flex-1"
                        />
                        <select
                            value={invite.role}
                            onChange={(e) => updateInvite(index, 'role', e.target.value)}
                            className="input w-32"
                        >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                        </select>
                        {formData.teamInvites.length > 1 && (
                            <button onClick={() => removeInvite(index)} className="text-gray-500 hover:text-red-400">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={addInvite}
                className="flex items-center gap-2 text-brand-primary hover:text-brand-primary/80"
            >
                <Plus className="w-4 h-4" />
                Add another
            </button>
        </div>
    );
}

function DataImportStep({ formData, updateField }) {
    return (
        <div className="space-y-6">
            <p className="text-gray-400">
                Import your existing data to get started quickly, or start fresh.
            </p>

            <div className="grid gap-4">
                {/* Import Options */}
                {['clients', 'crew', 'equipment'].map(type => (
                    <div key={type} className="p-4 bg-dark-bg border border-dark-border rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-medium capitalize">{type}</h4>
                                <p className="text-sm text-gray-500">
                                    Import from CSV or Excel
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={`/templates/${type}-template.csv`} className="text-sm text-brand-primary hover:underline flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    Template
                                </a>
                                <label className="btn-secondary text-sm cursor-pointer">
                                    <Upload className="w-4 h-4 mr-1" />
                                    Upload
                                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                    You can also import data later from Settings
                </p>
            </div>
        </div>
    );
}

function RateCardStep({ formData, updateField }) {
    const suggestedRates = getSuggestedRates(formData.country);
    const crewRoles = getDefaultCrewRoles(formData.companyType);

    const updateRate = (role, value) => {
        updateField('crewRates', {
            ...formData.crewRates,
            [role]: value,
        });
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-400">
                Set your default day rates. These will be used when creating quotes.
            </p>

            <div className="space-y-3">
                {crewRoles.map(role => (
                    <div key={role} className="flex items-center gap-4">
                        <span className="text-white w-48">{role}</span>
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {formData.currency}
                            </span>
                            <input
                                type="number"
                                value={formData.crewRates[role] || ''}
                                onChange={(e) => updateRate(role, e.target.value)}
                                placeholder={suggestedRates.mid.toString()}
                                className="input w-full pl-14"
                            />
                        </div>
                        <span className="text-gray-500 text-sm">/day</span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-500">
                Suggested rates for your region: {formData.currency} {suggestedRates.junior} - {suggestedRates.senior}/day
            </p>
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
            recommended: formData.painPoints.includes('quoting_slow'),
        },
        {
            id: 'add_project',
            label: 'Add a project',
            description: 'Set up your first production project',
            icon: Film,
            recommended: formData.painPoints.includes('no_visibility'),
        },
        {
            id: 'explore_dashboard',
            label: 'Explore the dashboard',
            description: 'Take a tour of all the features',
            icon: Globe2,
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

// Billing Step - Captures payment method for 48-hour trial
function BillingStep({ formData, updateField, onBillingComplete }) {
    const [selectedPlan, setSelectedPlan] = useState('starter');
    const [isRedirecting, setIsRedirecting] = useState(false);

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            price: '$29',
            period: '/month',
            features: ['Unlimited quotes', 'Up to 50 clients', '5 team members', 'Custom templates'],
            recommended: true,
        },
        {
            id: 'professional',
            name: 'Professional',
            price: '$79',
            period: '/month',
            features: ['Everything in Starter', 'Unlimited clients', '15 team members', 'API access', 'Priority support'],
        },
    ];

    const handleStartTrial = async () => {
        setIsRedirecting(true);
        try {
            // Import dynamically to avoid circular deps
            const { createTrialCheckoutSession } = await import('../../services/billingService');
            const { url } = await createTrialCheckoutSession(selectedPlan);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating checkout:', error);
            setIsRedirecting(false);
            // For demo/dev, allow proceeding without Stripe
            onBillingComplete({ plan: selectedPlan, demo: true });
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm mb-4">
                    <Sparkles className="w-4 h-4" />
                    48-Hour Free Trial
                </div>
                <p className="text-gray-400">
                    Try ProductionOS free for 48 hours. Your card won't be charged until after the trial.
                </p>
            </div>

            {/* Plan Selection */}
            <div className="grid gap-4 md:grid-cols-2">
                {plans.map(plan => (
                    <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative p-5 rounded-xl border text-left transition-all ${
                            selectedPlan === plan.id
                                ? 'border-brand-primary bg-brand-primary/10'
                                : 'border-dark-border bg-dark-bg hover:border-gray-600'
                        }`}
                    >
                        {plan.recommended && (
                            <span className="absolute -top-3 left-4 px-2 py-1 bg-brand-primary text-white text-xs font-medium rounded">
                                Recommended
                            </span>
                        )}
                        <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-2xl font-bold text-white">{plan.price}</span>
                            <span className="text-gray-500">{plan.period}</span>
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

            {/* Trial Info */}
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-white mb-1">How the trial works</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li>• Your card is securely saved but not charged today</li>
                            <li>• Full access to all features for 48 hours</li>
                            <li>• After trial, your subscription begins automatically</li>
                            <li>• Cancel anytime during the trial - no charge</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Start Trial Button */}
            <button
                onClick={handleStartTrial}
                disabled={isRedirecting}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isRedirecting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting to checkout...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-4 h-4" />
                        Start 48-Hour Free Trial
                    </>
                )}
            </button>

            <p className="text-xs text-center text-gray-500">
                By starting your trial, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
}
