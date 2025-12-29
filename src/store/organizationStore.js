import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateShortId } from '../utils/generateId';

// Organization roles
export const ORG_ROLES = {
    owner: { label: 'Owner', description: 'Full access, can transfer ownership' },
    admin: { label: 'Admin', description: 'Full access, can manage members' },
    member: { label: 'Member', description: 'Can create and edit content' },
    viewer: { label: 'Viewer', description: 'Read-only access' },
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
    free: { label: 'Free', users: 1, projects: 3 },
    starter: { label: 'Starter', users: 5, projects: 20, price: 29 },
    professional: { label: 'Professional', users: 20, projects: 100, price: 79 },
    enterprise: { label: 'Enterprise', users: -1, projects: -1, price: 'custom' }, // -1 = unlimited
};

// Generate a URL-safe slug from organization name
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
}

// Generate invitation token using cryptographically secure random values
function generateInviteToken() {
    return generateShortId(32);
}

export const useOrganizationStore = create(
    subscribeWithSelector((set, get) => ({
        // Current organization
        organization: null,
        // All organizations user belongs to (for org switcher)
        organizations: [],
        // Members of current organization
        members: [],
        // Pending invitations
        invitations: [],
        // Subscription info
        subscription: null,
        // Loading states
        loading: false,
        membersLoading: false,
        invitationsLoading: false,
        error: null,
        // Realtime subscription
        realtimeSubscription: null,

        // ============================================================
        // INITIALIZATION
        // ============================================================

        /**
         * Initialize organization store for current user
         * Called after authentication
         */
        initialize: async (userId) => {
            if (!isSupabaseConfigured() || !userId) {
                set({ loading: false });
                return null;
            }

            set({ loading: true, error: null });

            try {
                // Fetch all organizations user belongs to
                const { data: memberships, error: membershipError } = await supabase
                    .from('organization_members')
                    .select(`
                        role,
                        organization:organizations(*)
                    `)
                    .eq('user_id', userId);

                if (membershipError) throw membershipError;

                if (!memberships || memberships.length === 0) {
                    // User has no organization - they need onboarding
                    set({ loading: false, organization: null, organizations: [] });
                    return null;
                }

                // Map to organizations with role
                const organizations = memberships.map(m => ({
                    ...m.organization,
                    userRole: m.role,
                }));

                // Set current organization (first one or from localStorage preference)
                const savedOrgId = localStorage.getItem('current_organization_id');
                let currentOrg = organizations.find(o => o.id === savedOrgId) || organizations[0];

                set({
                    organizations,
                    organization: currentOrg,
                    loading: false,
                });

                // Load members and invitations for current org
                await Promise.all([
                    get().loadMembers(currentOrg.id),
                    get().loadInvitations(currentOrg.id),
                    get().loadSubscription(currentOrg.id),
                ]);

                // Subscribe to realtime updates
                get().subscribeToRealtimeUpdates(currentOrg.id);

                // Update user_profiles with organization_id
                await supabase
                    .from('user_profiles')
                    .update({ organization_id: currentOrg.id })
                    .eq('auth_user_id', userId);

                return currentOrg;
            } catch (error) {
                console.error('Failed to initialize organization:', error);
                set({ error: error.message, loading: false });
                return null;
            }
        },

        /**
         * Switch to a different organization
         */
        switchOrganization: async (organizationId) => {
            const { organizations } = get();
            const org = organizations.find(o => o.id === organizationId);

            if (!org) {
                console.error('Organization not found');
                return false;
            }

            // Save preference
            localStorage.setItem('current_organization_id', organizationId);

            // Unsubscribe from old org's realtime
            get().cleanup();

            set({ organization: org });

            // Load members and invitations for new org
            await Promise.all([
                get().loadMembers(organizationId),
                get().loadInvitations(organizationId),
                get().loadSubscription(organizationId),
            ]);

            // Subscribe to new org's realtime
            get().subscribeToRealtimeUpdates(organizationId);

            // Update user_profiles with new organization_id
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('user_profiles')
                    .update({ organization_id: organizationId })
                    .eq('auth_user_id', user.id);
            }

            return true;
        },

        // ============================================================
        // ORGANIZATION CRUD
        // ============================================================

        /**
         * Create a new organization
         * Called during onboarding for new users
         * Uses the onboard-organization edge function for atomic setup with proper trial
         */
        createOrganization: async (name, userId, userName = null) => {
            if (!isSupabaseConfigured()) return null;

            try {
                // Get current session for auth token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error('No valid session');
                }

                // Get user name if not provided
                let finalUserName = userName;
                if (!finalUserName) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('name')
                        .eq('auth_user_id', userId)
                        .single();
                    finalUserName = profile?.name || session.user?.email?.split('@')[0] || 'User';
                }

                // Call the onboard-organization edge function
                // This handles: org creation, membership, user profile, and trial setup atomically
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-organization`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        },
                        body: JSON.stringify({
                            organizationName: name,
                            userName: finalUserName,
                        }),
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to create organization');
                }

                const org = result.organization;

                // Create default settings for org
                const { error: settingsError } = await supabase
                    .from('settings')
                    .insert({
                        organization_id: org.id,
                        company: { name },
                        quote_defaults: { currency: 'USD', validityDays: 30 },
                    });

                if (settingsError) {
                    console.error('Failed to create org settings:', settingsError);
                }

                const orgWithRole = { ...org, userRole: 'owner' };

                set(state => ({
                    organization: orgWithRole,
                    organizations: [...state.organizations, orgWithRole],
                }));

                localStorage.setItem('current_organization_id', org.id);

                return org;
            } catch (error) {
                console.error('Failed to create organization:', error);
                set({ error: error.message });
                return null;
            }
        },

        /**
         * Update organization details
         */
        updateOrganization: async (updates) => {
            const { organization } = get();
            if (!organization) return false;

            try {
                const { error } = await supabase
                    .from('organizations')
                    .update(updates)
                    .eq('id', organization.id);

                if (error) throw error;

                const updated = { ...organization, ...updates };
                set(state => ({
                    organization: updated,
                    organizations: state.organizations.map(o =>
                        o.id === organization.id ? updated : o
                    ),
                }));

                return true;
            } catch (error) {
                console.error('Failed to update organization:', error);
                return false;
            }
        },

        // ============================================================
        // MEMBERS MANAGEMENT
        // ============================================================

        /**
         * Load organization members
         */
        loadMembers: async (organizationId) => {
            if (!organizationId) return;

            set({ membersLoading: true });

            try {
                const { data, error } = await supabase
                    .from('organization_members')
                    .select(`
                        id,
                        role,
                        created_at,
                        user:user_profiles!organization_members_user_id_fkey(
                            id,
                            name,
                            email,
                            status
                        )
                    `)
                    .eq('organization_id', organizationId);

                if (error) throw error;

                // Flatten the data structure
                const members = (data || []).map(m => ({
                    id: m.id,
                    role: m.role,
                    createdAt: m.created_at,
                    userId: m.user?.id,
                    name: m.user?.name || 'Unknown',
                    email: m.user?.email || '',
                    status: m.user?.status || 'active',
                }));

                set({ members, membersLoading: false });
            } catch (error) {
                console.error('Failed to load members:', error);
                set({ membersLoading: false });
            }
        },

        /**
         * Update member role
         */
        updateMemberRole: async (memberId, newRole) => {
            const { organization } = get();
            if (!organization) return false;

            try {
                const { error } = await supabase
                    .from('organization_members')
                    .update({ role: newRole })
                    .eq('id', memberId)
                    .eq('organization_id', organization.id);

                if (error) throw error;

                set(state => ({
                    members: state.members.map(m =>
                        m.id === memberId ? { ...m, role: newRole } : m
                    ),
                }));

                return true;
            } catch (error) {
                console.error('Failed to update member role:', error);
                return false;
            }
        },

        /**
         * Remove member from organization
         */
        removeMember: async (memberId) => {
            const { organization, members } = get();
            if (!organization) return false;

            // Prevent removing the last owner
            const member = members.find(m => m.id === memberId);
            if (member?.role === 'owner') {
                const owners = members.filter(m => m.role === 'owner');
                if (owners.length <= 1) {
                    set({ error: 'Cannot remove the last owner. Transfer ownership first.' });
                    return false;
                }
            }

            try {
                const { error } = await supabase
                    .from('organization_members')
                    .delete()
                    .eq('id', memberId)
                    .eq('organization_id', organization.id);

                if (error) throw error;

                set(state => ({
                    members: state.members.filter(m => m.id !== memberId),
                }));

                return true;
            } catch (error) {
                console.error('Failed to remove member:', error);
                return false;
            }
        },

        // ============================================================
        // INVITATIONS MANAGEMENT
        // ============================================================

        /**
         * Load pending invitations
         */
        loadInvitations: async (organizationId) => {
            if (!organizationId) return;

            set({ invitationsLoading: true });

            try {
                const { data, error } = await supabase
                    .from('user_invitations')
                    .select('*')
                    .eq('organization_id', organizationId)
                    .is('claimed_at', null)
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false });

                if (error) throw error;

                set({ invitations: data || [], invitationsLoading: false });
            } catch (error) {
                console.error('Failed to load invitations:', error);
                set({ invitationsLoading: false });
            }
        },

        /**
         * Create a new invitation
         */
        createInvitation: async (email, role = 'member', tabPermissions = []) => {
            const { organization, invitations, members } = get();
            if (!organization) return null;

            // Check if already a member
            if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
                set({ error: 'This user is already a member of the organization.' });
                return null;
            }

            // Check if already invited
            if (invitations.some(i => i.email.toLowerCase() === email.toLowerCase())) {
                set({ error: 'An invitation has already been sent to this email.' });
                return null;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();

                const invitation = {
                    organization_id: organization.id,
                    email: email.toLowerCase(),
                    role,
                    tab_permissions: tabPermissions,
                    invited_by: user?.id,
                    token: generateInviteToken(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                };

                const { data, error } = await supabase
                    .from('user_invitations')
                    .insert(invitation)
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    invitations: [data, ...state.invitations],
                }));

                // Send invitation email via Edge Function
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const { data: userProfile } = await supabase
                        .from('user_profiles')
                        .select('full_name, email')
                        .eq('id', user?.id)
                        .single();

                    const inviterName = userProfile?.full_name || userProfile?.email || 'A team member';

                    await supabase.functions.invoke('send-invitation-email', {
                        body: {
                            invitationId: data.id,
                            email: data.email,
                            organizationName: organization.name,
                            inviterName,
                            role: data.role,
                            inviteToken: data.token,
                        },
                    });
                } catch (emailError) {
                    console.warn('Failed to send invitation email:', emailError);
                    // Don't fail the invitation creation if email fails
                }

                return data;
            } catch (error) {
                console.error('Failed to create invitation:', error);
                set({ error: error.message });
                return null;
            }
        },

        /**
         * Resend invitation (generates new token and extends expiry)
         */
        resendInvitation: async (invitationId) => {
            const { organization } = get();
            if (!organization) return false;

            try {
                const updates = {
                    token: generateInviteToken(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                };

                const { data, error } = await supabase
                    .from('user_invitations')
                    .update(updates)
                    .eq('id', invitationId)
                    .eq('organization_id', organization.id)
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    invitations: state.invitations.map(i =>
                        i.id === invitationId ? data : i
                    ),
                }));

                // Resend invitation email via Edge Function
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const { data: userProfile } = await supabase
                        .from('user_profiles')
                        .select('full_name, email')
                        .eq('id', user?.id)
                        .single();

                    const inviterName = userProfile?.full_name || userProfile?.email || 'A team member';

                    await supabase.functions.invoke('send-invitation-email', {
                        body: {
                            invitationId: data.id,
                            email: data.email,
                            organizationName: organization.name,
                            inviterName,
                            role: data.role,
                            inviteToken: data.token,
                        },
                    });
                } catch (emailError) {
                    console.warn('Failed to resend invitation email:', emailError);
                }

                return data;
            } catch (error) {
                console.error('Failed to resend invitation:', error);
                return false;
            }
        },

        /**
         * Cancel/delete invitation
         */
        cancelInvitation: async (invitationId) => {
            const { organization } = get();
            if (!organization) return false;

            try {
                const { error } = await supabase
                    .from('user_invitations')
                    .delete()
                    .eq('id', invitationId)
                    .eq('organization_id', organization.id);

                if (error) throw error;

                set(state => ({
                    invitations: state.invitations.filter(i => i.id !== invitationId),
                }));

                return true;
            } catch (error) {
                console.error('Failed to cancel invitation:', error);
                return false;
            }
        },

        /**
         * Accept an invitation (called by the invited user)
         */
        acceptInvitation: async (token, userId) => {
            try {
                // Find the invitation
                const { data: invitation, error: findError } = await supabase
                    .from('user_invitations')
                    .select('*, organization:organizations(*)')
                    .eq('token', token)
                    .is('claimed_at', null)
                    .gt('expires_at', new Date().toISOString())
                    .single();

                if (findError || !invitation) {
                    return { success: false, error: 'Invalid or expired invitation' };
                }

                // Add user as organization member
                const { error: memberError } = await supabase
                    .from('organization_members')
                    .insert({
                        organization_id: invitation.organization_id,
                        user_id: userId,
                        role: invitation.role,
                    });

                if (memberError) {
                    if (memberError.code === '23505') {
                        return { success: false, error: 'You are already a member of this organization' };
                    }
                    throw memberError;
                }

                // Update user profile with org and permissions
                await supabase
                    .from('user_profiles')
                    .update({
                        organization_id: invitation.organization_id,
                        tab_permissions: invitation.tab_permissions,
                        status: 'active',
                    })
                    .eq('auth_user_id', userId);

                // Mark invitation as claimed
                await supabase
                    .from('user_invitations')
                    .update({
                        claimed_at: new Date().toISOString(),
                        claimed_by: userId,
                    })
                    .eq('id', invitation.id);

                return {
                    success: true,
                    organization: invitation.organization,
                };
            } catch (error) {
                console.error('Failed to accept invitation:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // SUBSCRIPTION MANAGEMENT
        // ============================================================

        /**
         * Load subscription info
         */
        loadSubscription: async (organizationId) => {
            if (!organizationId) return;

            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('organization_id', organizationId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

                set({ subscription: data || null });
            } catch (error) {
                console.error('Failed to load subscription:', error);
            }
        },

        /**
         * Check if organization has access to a feature
         */
        hasFeatureAccess: (feature) => {
            const { organization, subscription, members } = get();
            if (!organization) return false;

            const plan = subscription?.plan || organization.subscription_plan || 'free';
            const planConfig = SUBSCRIPTION_PLANS[plan];

            if (!planConfig) return false;

            switch (feature) {
                case 'unlimited_users':
                    return planConfig.users === -1;
                case 'unlimited_projects':
                    return planConfig.projects === -1;
                case 'add_user':
                    return planConfig.users === -1 || members.length < planConfig.users;
                default:
                    return true;
            }
        },

        /**
         * Get subscription limits
         */
        getSubscriptionLimits: () => {
            const { organization, subscription } = get();
            const plan = subscription?.plan || organization?.subscription_plan || 'free';
            return SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.free;
        },

        // ============================================================
        // REALTIME SUBSCRIPTIONS
        // ============================================================

        subscribeToRealtimeUpdates: (organizationId) => {
            if (!organizationId) return;

            const channel = supabase
                .channel(`org-${organizationId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'organization_members',
                    filter: `organization_id=eq.${organizationId}`,
                }, () => {
                    get().loadMembers(organizationId);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'user_invitations',
                    filter: `organization_id=eq.${organizationId}`,
                }, () => {
                    get().loadInvitations(organizationId);
                })
                .subscribe();

            set({ realtimeSubscription: channel });
        },

        // ============================================================
        // HELPERS
        // ============================================================

        /**
         * Get current organization ID
         */
        getOrganizationId: () => {
            return get().organization?.id || null;
        },

        /**
         * Check if current user can manage members
         */
        canManageMembers: () => {
            const { organization } = get();
            return organization?.userRole === 'owner' || organization?.userRole === 'admin';
        },

        /**
         * Check if current user is owner
         */
        isOwner: () => {
            return get().organization?.userRole === 'owner';
        },

        /**
         * Clear error
         */
        clearError: () => set({ error: null }),

        /**
         * Cleanup realtime subscription
         */
        cleanup: () => {
            const { realtimeSubscription } = get();
            if (realtimeSubscription) {
                supabase.removeChannel(realtimeSubscription);
            }
            set({ realtimeSubscription: null });
        },

        /**
         * Reset store (on logout)
         */
        reset: () => {
            get().cleanup();
            localStorage.removeItem('current_organization_id');
            set({
                organization: null,
                organizations: [],
                members: [],
                invitations: [],
                subscription: null,
                loading: false,
                error: null,
            });
        },
    }))
);

export default useOrganizationStore;
