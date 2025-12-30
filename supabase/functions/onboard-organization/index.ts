// Onboard Organization Edge Function
// Creates a new organization and sets up the owner with trial subscription
// Called during user onboarding after signup

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Trial configuration (5 days)
const TRIAL_DURATION_DAYS = 5;

/**
 * Generate a URL-safe slug from organization name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Remove consecutive hyphens
    .substring(0, 50);             // Limit length
}

/**
 * Generate a unique slug by appending random suffix if needed
 */
async function generateUniqueSlug(supabase: any, baseName: string): Promise<string> {
  let slug = generateSlug(baseName);

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    // Append random suffix
    const suffix = Math.random().toString(36).substring(2, 6);
    slug = `${slug}-${suffix}`;
  }

  return slug;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organizationName, userName } = await req.json()

    if (!organizationName) {
      throw new Error('Organization name is required')
    }

    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing')
    }

    // Get the requesting user from the auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Check if user already has an organization
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (existingProfile?.organization_id) {
      throw new Error('User already belongs to an organization')
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(supabase, organizationName)

    // Calculate trial end date (5 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS)

    // 1. Create the organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug: slug,
        subscription_status: 'trialing',
        subscription_plan: 'free',
        trial_ends_at: trialEndsAt.toISOString(),
        settings: {},
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      throw new Error(`Failed to create organization: ${orgError.message}`)
    }

    // 2. Create organization membership (owner)
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Membership creation error:', memberError)
      // Rollback org creation
      await supabase.from('organizations').delete().eq('id', organization.id)
      throw new Error(`Failed to create membership: ${memberError.message}`)
    }

    // 3. Update user profile with organization and name
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .update({
        organization_id: organization.id,
        name: userName || user.email?.split('@')[0] || 'User',
        status: 'active',
      })
      .eq('auth_user_id', user.id)
      .select()
      .single()

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't rollback - org and membership are valid, profile update is non-critical
    }

    // 4. Create trial subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: organization.id,
        status: 'trialing',
        plan: 'free',
        trial_start: new Date().toISOString(),
        trial_end: trialEndsAt.toISOString(),
        metadata: {
          created_via: 'onboarding',
          user_id: user.id,
        },
      })

    if (subError) {
      console.error('Subscription creation error:', subError)
      // Non-critical - org can function without subscription record initially
    }

    // 5. Create onboarding checklist record
    const { error: checklistError } = await supabase
      .from('onboarding_checklist')
      .insert({
        user_id: user.id,
        organization_id: organization.id,
        account_created: true,
        company_profile_setup: false,
        rates_configured: false,
        first_quote_created: false,
        first_client_added: false,
        first_crew_added: false,
        first_project_created: false,
        dismissed: false,
        minimized: false,
      })

    if (checklistError) {
      console.error('Checklist creation error:', checklistError)
      // Non-critical
    }

    // 6. Log the event for audit
    await supabase
      .from('audit_logs')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        user_email: user.email,
        action: 'create',
        entity_type: 'organization',
        entity_id: organization.id,
        entity_name: organizationName,
        metadata: {
          source: 'onboarding',
          trial_ends_at: trialEndsAt.toISOString(),
        },
      })

    console.log(`Organization created: ${organization.id} for user ${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          subscription_status: organization.subscription_status,
          trial_ends_at: organization.trial_ends_at,
        },
        profile: profile || {
          id: user.id,
          name: userName || user.email?.split('@')[0],
          email: user.email,
          organization_id: organization.id,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Onboard organization error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
