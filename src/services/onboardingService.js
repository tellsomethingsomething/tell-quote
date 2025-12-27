/**
 * Onboarding Service
 * Manages the multi-step onboarding flow for new users
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Onboarding Steps
export const ONBOARDING_STEPS = [
    { id: 'company_setup', label: 'Company Setup', required: true },
    { id: 'billing', label: 'Start Trial', required: false }, // Skip if billing not configured
    { id: 'pain_points', label: 'Pain Points', required: false },
    { id: 'company_profile', label: 'Company Profile', required: false },
    { id: 'team_invite', label: 'Invite Team', required: false, conditional: true },
    { id: 'data_import', label: 'Import Data', required: false },
    { id: 'rate_card', label: 'Rate Card', required: false },
    { id: 'first_action', label: 'Get Started', required: true },
];

// Company Types
export const COMPANY_TYPES = [
    { id: 'video_production', label: 'Video Production', icon: 'video' },
    { id: 'event_production', label: 'Event Production', icon: 'calendar' },
    { id: 'photography', label: 'Photography', icon: 'camera' },
    { id: 'live_streaming', label: 'Live Streaming / Broadcast', icon: 'radio' },
    { id: 'post_production', label: 'Post-Production', icon: 'film' },
    { id: 'corporate', label: 'Corporate / In-house Team', icon: 'building' },
    { id: 'other', label: 'Other', icon: 'plus' },
];

// Primary Focus Options
export const PRIMARY_FOCUS_OPTIONS = [
    { id: 'commercial', label: 'Commercial / Advertising' },
    { id: 'corporate', label: 'Corporate / Internal Comms' },
    { id: 'documentary', label: 'Documentary' },
    { id: 'branded_content', label: 'Branded Content' },
    { id: 'events_live', label: 'Events / Live' },
    { id: 'music_videos', label: 'Music Videos' },
    { id: 'social_content', label: 'Social Content' },
    { id: 'weddings', label: 'Weddings' },
    { id: 'other', label: 'Other' },
];

// Team Size Options
export const TEAM_SIZE_OPTIONS = [
    { id: 'just_me', label: 'Just me', value: 1 },
    { id: '2-5', label: '2-5 people', value: 5 },
    { id: '6-15', label: '6-15 people', value: 15 },
    { id: '16+', label: '16+ people', value: 100 },
];

// Pain Points
export const PAIN_POINTS = [
    { id: 'quoting_slow', label: 'Quoting takes too long', feature: 'quotes' },
    { id: 'margins_unknown', label: "Don't know my margins", feature: 'dashboard' },
    { id: 'crew_scattered', label: 'Crew contacts are scattered', feature: 'crew' },
    { id: 'equipment_chaos', label: 'Equipment tracking is chaos', feature: 'equipment' },
    { id: 'chasing_payments', label: 'Chasing invoices and payments', feature: 'invoices' },
    { id: 'no_visibility', label: 'No visibility on project status', feature: 'projects' },
    { id: 'client_comms', label: 'Managing client communications', feature: 'crm' },
    { id: 'deliverables', label: 'Tracking deliverables and revisions', feature: 'projects' },
];

// Payment Terms
export const PAYMENT_TERMS = [
    { id: 'due_on_receipt', label: 'Due on Receipt' },
    { id: 'net_7', label: 'Net 7' },
    { id: 'net_14', label: 'Net 14' },
    { id: 'net_30', label: 'Net 30' },
    { id: 'net_45', label: 'Net 45' },
    { id: 'net_60', label: 'Net 60' },
];

// Default Crew Roles by Company Type
export const DEFAULT_CREW_ROLES = {
    video_production: ['Director', 'Producer', 'DP / Camera Operator', 'Sound Recordist', 'Editor', 'Gaffer'],
    event_production: ['Production Manager', 'Technical Director', 'AV Technician', 'Stage Manager', 'Lighting Tech'],
    photography: ['Photographer', 'Photo Assistant', 'Retoucher', 'Studio Manager'],
    live_streaming: ['Stream Producer', 'Technical Director', 'Camera Operator', 'Audio Engineer', 'Graphics Operator'],
    post_production: ['Editor', 'Colorist', 'Sound Designer', 'VFX Artist', 'Motion Graphics'],
    corporate: ['Producer', 'Videographer', 'Editor', 'Project Manager'],
    other: ['Director', 'Producer', 'Camera Operator', 'Editor'],
};

// Default Equipment Categories
export const DEFAULT_EQUIPMENT_CATEGORIES = [
    { id: 'camera', label: 'Camera Package' },
    { id: 'lighting', label: 'Lighting Package' },
    { id: 'audio', label: 'Audio Package' },
    { id: 'grip', label: 'Grip Package' },
    { id: 'other', label: 'Other' },
];

// Suggested Day Rates by Region (in USD equivalent)
export const SUGGESTED_RATES = {
    US: { junior: 350, mid: 550, senior: 850 },
    GB: { junior: 300, mid: 500, senior: 750 },
    DE: { junior: 300, mid: 500, senior: 700 },
    SG: { junior: 250, mid: 400, senior: 600 },
    MY: { junior: 100, mid: 200, senior: 350 },
    AU: { junior: 400, mid: 600, senior: 900 },
    default: { junior: 250, mid: 400, senior: 600 },
};

/**
 * Get or create onboarding progress for a user
 */
export async function getOnboardingProgress(userId) {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code === 'PGRST116') {
        // No record exists, create one
        const { data: newProgress, error: createError } = await supabase
            .from('onboarding_progress')
            .insert({ user_id: userId })
            .select()
            .single();

        if (createError) {
            console.error('Error creating onboarding progress:', createError);
            return null;
        }

        return newProgress;
    }

    if (error) {
        console.error('Error fetching onboarding progress:', error);
        return null;
    }

    return data;
}

/**
 * Update onboarding progress
 */
export async function updateOnboardingProgress(userId, updates) {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('onboarding_progress')
        .update({
            ...updates,
            last_step_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating onboarding progress:', error);
        throw error;
    }

    return data;
}

/**
 * Mark a step as completed
 */
export async function completeStep(userId, stepId) {
    const progress = await getOnboardingProgress(userId);
    if (!progress) return null;

    const completedSteps = progress.completed_steps || [];
    if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
    }

    // Find next step
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === stepId);
    const nextStep = ONBOARDING_STEPS[currentIndex + 1];

    return updateOnboardingProgress(userId, {
        completed_steps: completedSteps,
        current_step: nextStep?.id || 'complete',
    });
}

/**
 * Skip a step
 */
export async function skipStep(userId, stepId) {
    const progress = await getOnboardingProgress(userId);
    if (!progress) return null;

    // Find next step
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === stepId);
    const nextStep = ONBOARDING_STEPS[currentIndex + 1];

    return updateOnboardingProgress(userId, {
        current_step: nextStep?.id || 'complete',
    });
}

/**
 * Complete the onboarding flow
 */
export async function completeOnboarding(userId, organizationId) {
    return updateOnboardingProgress(userId, {
        current_step: 'complete',
        completed_at: new Date().toISOString(),
        organization_id: organizationId,
    });
}

/**
 * Check if user needs onboarding
 */
export async function needsOnboarding(userId) {
    const progress = await getOnboardingProgress(userId);
    if (!progress) return true;
    return progress.current_step !== 'complete' && !progress.completed_at;
}

/**
 * Get personalization data based on pain points
 */
export function getPersonalization(painPoints) {
    const personalization = {
        dashboardWidgetOrder: ['quotes', 'revenue', 'projects', 'clients'],
        recommendedFirstAction: 'create_quote',
        priorityFeatures: [],
    };

    if (!painPoints || painPoints.length === 0) {
        return personalization;
    }

    // Prioritize features based on pain points
    const features = painPoints.map(p => {
        const point = PAIN_POINTS.find(pp => pp.id === p);
        return point?.feature;
    }).filter(Boolean);

    personalization.priorityFeatures = [...new Set(features)];

    // Determine recommended first action
    if (painPoints.includes('quoting_slow')) {
        personalization.recommendedFirstAction = 'create_quote';
    } else if (painPoints.includes('no_visibility')) {
        personalization.recommendedFirstAction = 'add_project';
    }

    // Reorder dashboard widgets
    if (painPoints.includes('margins_unknown')) {
        personalization.dashboardWidgetOrder = ['revenue', 'margins', 'quotes', 'projects'];
    }
    if (painPoints.includes('chasing_payments')) {
        personalization.dashboardWidgetOrder = ['invoices', 'revenue', 'quotes', 'projects'];
    }

    return personalization;
}

/**
 * Get suggested rates for a country
 */
export function getSuggestedRates(countryCode) {
    return SUGGESTED_RATES[countryCode] || SUGGESTED_RATES.default;
}

/**
 * Get default crew roles for a company type
 */
export function getDefaultCrewRoles(companyType) {
    return DEFAULT_CREW_ROLES[companyType] || DEFAULT_CREW_ROLES.other;
}

/**
 * Create or update onboarding checklist
 */
export async function getOnboardingChecklist(userId, organizationId) {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

    if (error && error.code === 'PGRST116') {
        // Create new checklist
        const { data: newChecklist, error: createError } = await supabase
            .from('onboarding_checklist')
            .insert({
                user_id: userId,
                organization_id: organizationId,
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating checklist:', createError);
            return null;
        }

        return newChecklist;
    }

    return data;
}

/**
 * Update checklist item
 */
export async function updateChecklistItem(userId, organizationId, item, value) {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('onboarding_checklist')
        .update({ [item]: value })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating checklist:', error);
        return null;
    }

    return data;
}

/**
 * Dismiss the checklist widget
 */
export async function dismissChecklist(userId, organizationId) {
    return updateChecklistItem(userId, organizationId, 'dismissed', true);
}

/**
 * Minimize the checklist widget
 */
export async function minimizeChecklist(userId, organizationId, minimized) {
    return updateChecklistItem(userId, organizationId, 'minimized', minimized);
}

/**
 * Reset/restore the checklist widget (un-dismiss it)
 */
export async function resetChecklist(userId, organizationId) {
    return updateChecklistItem(userId, organizationId, 'dismissed', false);
}

export default {
    ONBOARDING_STEPS,
    COMPANY_TYPES,
    PRIMARY_FOCUS_OPTIONS,
    TEAM_SIZE_OPTIONS,
    PAIN_POINTS,
    PAYMENT_TERMS,
    DEFAULT_CREW_ROLES,
    DEFAULT_EQUIPMENT_CATEGORIES,
    SUGGESTED_RATES,
    getOnboardingProgress,
    updateOnboardingProgress,
    completeStep,
    skipStep,
    completeOnboarding,
    needsOnboarding,
    getPersonalization,
    getSuggestedRates,
    getDefaultCrewRoles,
    getOnboardingChecklist,
    updateChecklistItem,
    dismissChecklist,
    minimizeChecklist,
    resetChecklist,
};
