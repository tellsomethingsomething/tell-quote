import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verify authorization
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create admin client for token operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Create user client for auth
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { title, description } = await req.json()

        if (!title) {
            return new Response(
                JSON.stringify({ error: 'Missing title' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!ANTHROPIC_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'API key not configured on server' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get user's organization
        const { data: orgMember, error: orgError } = await supabaseAdmin
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (orgError || !orgMember) {
            return new Response(
                JSON.stringify({ error: 'User not in any organization' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const organizationId = orgMember.organization_id

        // Check available tokens
        const { data: availableTokens, error: tokenError } = await supabaseAdmin
            .rpc('get_available_ai_tokens', { org_id: organizationId })

        if (tokenError) {
            console.error('Token check error:', tokenError)
            return new Response(
                JSON.stringify({ error: 'Failed to check token balance' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (availableTokens < 100) { // Minimum threshold
            return new Response(
                JSON.stringify({
                    error: 'Insufficient AI tokens. Please purchase more tokens or wait for your monthly reset.',
                    availableTokens,
                    code: 'INSUFFICIENT_TOKENS'
                }),
                { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const prompt = `Generate a detailed SOP for the following:

Title: ${title}
Description: ${description || 'No description provided'}

Please provide a structured document with Purpose, Scope, Steps, and any relevant notes.`

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                system: "You are an expert SOP writer. Your goal is to write professional, clear, and actionable Standard Operating Procedures. Use Markdown formatting. Focus on precision and operational excellence.",
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return new Response(
                JSON.stringify({ error: errorData.error?.message || `API error: ${response.status}` }),
                { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const data = await response.json()
        const content = data.content[0]?.text

        // Calculate actual tokens used from Anthropic response
        const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)

        // Consume tokens
        const { error: consumeError } = await supabaseAdmin
            .rpc('consume_ai_tokens', {
                org_id: organizationId,
                tokens_to_use: tokensUsed
            })

        if (consumeError) {
            console.error('Token consumption error:', consumeError)
            // Don't fail the request if consumption fails - log and continue
        }

        // Log the usage
        await supabaseAdmin.rpc('log_ai_usage', {
            p_organization_id: organizationId,
            p_user_id: user.id,
            p_feature: 'sop_generation',
            p_tokens_used: tokensUsed,
            p_prompt_tokens: data.usage?.input_tokens || 0,
            p_completion_tokens: data.usage?.output_tokens || 0,
            p_model: 'claude-sonnet-4-20250514',
            p_metadata: { title }
        })

        // Get remaining tokens
        const { data: remainingTokens } = await supabaseAdmin
            .rpc('get_available_ai_tokens', { org_id: organizationId })

        return new Response(
            JSON.stringify({
                content,
                tokensUsed,
                tokensRemaining: remainingTokens || 0
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
