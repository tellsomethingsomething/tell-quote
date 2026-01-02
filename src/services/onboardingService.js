/**
 * Onboarding Service
 * Manages the multi-step onboarding flow for new users
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import logger from '../utils/logger';

// Onboarding Steps - Simplified flow
export const ONBOARDING_STEPS = [
    { id: 'company_setup', label: 'Company Setup', required: true },
    { id: 'billing', label: 'Choose Plan', required: true },
    { id: 'first_action', label: 'Get Started', required: true },
];

// Company Types
export const COMPANY_TYPES = [
    { id: 'content_production', label: 'Content Production Company', icon: 'video', description: 'Brand films, commercials, branded content' },
    { id: 'corporate_video', label: 'Corporate Video Production', icon: 'building', description: 'Training videos, internal comms, corporate films' },
    { id: 'live_events', label: 'Live Events / Broadcast', icon: 'radio', description: 'Conferences, live streams, hybrid events, OB' },
    { id: 'sports_production', label: 'Sports Production Company', icon: 'activity', description: 'Sports broadcasts, athlete content, federations' },
    { id: 'documentary_film', label: 'Documentary / Film Production', icon: 'film', description: 'Documentaries, indie films, short films' },
    { id: 'music_entertainment', label: 'Music Video / Entertainment', icon: 'video', description: 'Music videos, artist content, entertainment' },
    { id: 'wedding_social', label: 'Wedding / Social Events', icon: 'calendar', description: 'Weddings, celebrations, social videography' },
    { id: 'post_production', label: 'Post-Production / Edit House', icon: 'film', description: 'Editing, color, VFX, finishing' },
    { id: 'animation_motion', label: 'Animation / Motion Studio', icon: 'video', description: 'Animation, motion graphics, explainers' },
    { id: 'photo_studio', label: 'Photo Studio / Photographer', icon: 'image', description: 'Commercial, product, portrait photography' },
    { id: 'equipment_rental', label: 'Equipment Rental / Facilities', icon: 'building', description: 'Kit hire, studios, production facilities' },
    { id: 'freelancer', label: 'Freelancer / Solo Operator', icon: 'camera', description: 'Independent creator or small crew' },
    { id: 'full_service', label: 'Full-Service Agency', icon: 'briefcase', description: 'Creative agency with production capabilities' },
    { id: 'other', label: 'Other', icon: 'plus', description: 'Something else entirely' },
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

// Client Industry Sectors - Who do they make content for?
export const CLIENT_SECTORS = [
    { id: 'corporate', label: 'Corporate / Enterprise', icon: 'building' },
    { id: 'finance', label: 'Finance & Banking', icon: 'dollar' },
    { id: 'technology', label: 'Technology / SaaS', icon: 'cpu' },
    { id: 'healthcare', label: 'Healthcare / Pharma', icon: 'heart' },
    { id: 'sport', label: 'Sport', icon: 'activity' },
    { id: 'fitness', label: 'Fitness / Wellness', icon: 'dumbbell' },
    { id: 'entertainment', label: 'Entertainment / Media', icon: 'film' },
    { id: 'fashion', label: 'Fashion & Beauty', icon: 'star' },
    { id: 'fmcg', label: 'FMCG / Consumer Goods', icon: 'package' },
    { id: 'automotive', label: 'Automotive', icon: 'car' },
    { id: 'hospitality', label: 'Hospitality / Travel', icon: 'map' },
    { id: 'education', label: 'Education / Training', icon: 'book' },
    { id: 'nonprofit', label: 'Non-Profit / NGO', icon: 'heart' },
    { id: 'government', label: 'Government / Public Sector', icon: 'landmark' },
    { id: 'retail', label: 'Retail / E-commerce', icon: 'shopping-bag' },
    { id: 'realestate', label: 'Real Estate / Property', icon: 'home' },
    { id: 'agencies', label: 'Agencies / Studios', icon: 'briefcase' },
];

// Production Types - What specific content do they create?
export const PRODUCTION_TYPES = [
    { id: 'brand_films', label: 'Brand Films', category: 'video' },
    { id: 'tv_commercials', label: 'TV Commercials', category: 'video' },
    { id: 'online_ads', label: 'Online / Social Ads', category: 'video' },
    { id: 'corporate_videos', label: 'Corporate Videos', category: 'video' },
    { id: 'training_videos', label: 'Training / E-Learning', category: 'video' },
    { id: 'product_videos', label: 'Product Videos', category: 'video' },
    { id: 'testimonials', label: 'Testimonials / Case Studies', category: 'video' },
    { id: 'documentaries', label: 'Documentaries', category: 'video' },
    { id: 'music_videos', label: 'Music Videos', category: 'video' },
    { id: 'short_films', label: 'Short Films / Narrative', category: 'video' },
    { id: 'live_events', label: 'Live Events', category: 'events' },
    { id: 'conferences', label: 'Conferences / Summits', category: 'events' },
    { id: 'product_launches', label: 'Product Launches', category: 'events' },
    { id: 'activations', label: 'Brand Activations', category: 'events' },
    { id: 'live_streams', label: 'Live Streams / Webinars', category: 'digital' },
    { id: 'podcasts', label: 'Podcasts / Audio', category: 'digital' },
    { id: 'photography', label: 'Photography', category: 'photo' },
    { id: 'animation', label: 'Animation / Motion Graphics', category: 'post' },
];

// Contact Types - What kind of contacts do they work with?
export const CONTACT_TYPES = [
    { id: 'brands', label: 'Brands (Direct)', description: 'Work directly with brand teams' },
    { id: 'agencies_creative', label: 'Creative Agencies', description: 'Ad agencies, creative shops' },
    { id: 'agencies_media', label: 'Media Agencies', description: 'Media buying, planning agencies' },
    { id: 'agencies_pr', label: 'PR / Comms Agencies', description: 'PR firms, communications agencies' },
    { id: 'agencies_event', label: 'Event Agencies', description: 'Event management companies' },
    { id: 'broadcasters', label: 'Broadcasters / Networks', description: 'TV, streaming platforms' },
    { id: 'production_companies', label: 'Other Production Companies', description: 'White-label, overflow work' },
    { id: 'freelancers', label: 'Freelance Crew', description: 'Individual contractors' },
    { id: 'vendors', label: 'Vendors / Suppliers', description: 'Equipment, locations, catering' },
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
            logger.error('Error creating onboarding progress:', createError);
            return null;
        }

        return newProgress;
    }

    if (error) {
        logger.error('Error fetching onboarding progress:', error);
        return null;
    }

    return data;
}

/**
 * Update onboarding progress (uses upsert to create if not exists)
 */
export async function updateOnboardingProgress(userId, updates) {
    if (!isSupabaseConfigured()) return null;

    // Use upsert to create record if it doesn't exist, or update if it does
    const { data, error } = await supabase
        .from('onboarding_progress')
        .upsert({
            user_id: userId,
            ...updates,
            last_step_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id',
            ignoreDuplicates: false,
        })
        .select()
        .single();

    if (error) {
        logger.error('Error updating onboarding progress:', error);
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
            logger.error('Error creating checklist:', createError);
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
        logger.error('Error updating checklist:', error);
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
