/**
 * GDPR Compliance Service
 * Handles data export and account deletion requests
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useOrganizationStore } from '../store/organizationStore';
import logger from '../utils/logger';

/**
 * Request a data export
 * Creates a request that will be processed asynchronously
 */
export async function requestDataExport() {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = useOrganizationStore.getState().getOrganizationId();

    const { data, error } = await supabase
        .from('data_export_requests')
        .insert({
            organization_id: organizationId,
            user_id: user.id,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;

    // In a full implementation, this would trigger a background job
    // For now, we'll generate the export immediately
    const exportData = await generateExportData(user.id, organizationId);

    return { requestId: data.id, data: exportData };
}

/**
 * Generate export data for a user
 * Collects all user data in a structured format
 */
async function generateExportData(userId, organizationId) {
    const exportData = {
        exportedAt: new Date().toISOString(),
        user: null,
        organization: null,
        quotes: [],
        clients: [],
        invoices: [],
        contacts: [],
        opportunities: [],
        settings: null,
    };

    try {
        // User profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', userId)
            .single();

        if (profile) {
            exportData.user = {
                name: profile.name,
                email: profile.email,
                role: profile.role,
                createdAt: profile.created_at,
            };
        }

        // Organization (if exists)
        if (organizationId) {
            const { data: org } = await supabase
                .from('organizations')
                .select('name, slug, created_at')
                .eq('id', organizationId)
                .single();

            exportData.organization = org;

            // Quotes
            const { data: quotes } = await supabase
                .from('quotes')
                .select('*')
                .eq('organization_id', organizationId);

            exportData.quotes = quotes || [];

            // Clients
            const { data: clients } = await supabase
                .from('clients')
                .select('*')
                .eq('organization_id', organizationId);

            exportData.clients = clients || [];

            // Invoices
            const { data: invoices } = await supabase
                .from('invoices')
                .select('*')
                .eq('organization_id', organizationId);

            exportData.invoices = invoices || [];

            // Contacts
            const { data: contacts } = await supabase
                .from('contacts')
                .select('*')
                .eq('organization_id', organizationId);

            exportData.contacts = contacts || [];

            // Opportunities
            const { data: opportunities } = await supabase
                .from('opportunities')
                .select('*')
                .eq('organization_id', organizationId);

            exportData.opportunities = opportunities || [];

            // Settings
            const { data: settings } = await supabase
                .from('settings')
                .select('company, quote_defaults')
                .eq('organization_id', organizationId)
                .single();

            exportData.settings = settings;
        }
    } catch (e) {
        logger.error('Error generating export:', e);
    }

    return exportData;
}

/**
 * Download export data as JSON file
 */
export function downloadExportAsJSON(data, filename = 'my-data-export.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Request account deletion
 * Creates a deletion request with 30-day grace period
 */
export async function requestAccountDeletion(reason = '') {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = useOrganizationStore.getState().getOrganizationId();

    // Check if there's already a pending request
    const { data: existing } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .single();

    if (existing) {
        return { alreadyRequested: true, request: existing };
    }

    // Generate confirmation token
    const confirmationToken = generateToken();

    // Schedule deletion for 30 days from now
    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

    const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert({
            user_id: user.id,
            organization_id: organizationId,
            reason,
            status: 'pending',
            confirmation_token: confirmationToken,
            scheduled_deletion_at: scheduledDeletionAt.toISOString(),
        })
        .select()
        .single();

    if (error) throw error;

    // TODO: Send confirmation email with token
    return { success: true, request: data };
}

/**
 * Confirm account deletion
 */
export async function confirmAccountDeletion(token) {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data, error } = await supabase
        .from('account_deletion_requests')
        .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
        })
        .eq('confirmation_token', token)
        .eq('status', 'pending')
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Invalid or expired token');

    return { success: true, scheduledDeletionAt: data.scheduled_deletion_at };
}

/**
 * Cancel account deletion request
 */
export async function cancelAccountDeletion() {
    if (!isSupabaseConfigured()) {
        throw new Error('Database not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('account_deletion_requests')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed']);

    if (error) throw error;

    return { success: true };
}

/**
 * Get pending deletion request
 */
export async function getPendingDeletionRequest() {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .single();

    return data;
}

/**
 * Generate a random token
 */
function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export default {
    requestDataExport,
    downloadExportAsJSON,
    requestAccountDeletion,
    confirmAccountDeletion,
    cancelAccountDeletion,
    getPendingDeletionRequest,
};
