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

        const { prompt, max_tokens = 2048, system } = await req.json()

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: 'Missing prompt' }),
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

        // Check available tokens (estimate: ~4 chars per token, prompt + max response)
        const estimatedTokens = Math.ceil((prompt.length + (system?.length || 0)) / 4) + max_tokens

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

        // Build messages array
        const messages = [{ role: 'user', content: prompt }]

        // Build request body
        const requestBody: Record<string, unknown> = {
            model: 'claude-sonnet-4-20250514',
            max_tokens: Math.min(max_tokens, 4096),
            messages,
        }

        if (system) {
            requestBody.system = system
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify(requestBody),
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
        const { data: consumed, error: consumeError } = await supabaseAdmin
            .rpc('consume_ai_tokens', {
                org_id: organizationId,
                tokens_to_use: tokensUsed
            })

        if (consumeError) {
            console.error('Token consumption error:', consumeError)
            // Don't fail the request if consumption fails - log and continue
        }

        // Log the usage for analytics
        await supabaseAdmin.rpc('log_ai_usage', {
            p_organization_id: organizationId,
            p_user_id: user.id,
            p_feature: 'commercial_tasks',
            p_tokens_used: tokensUsed,
            p_prompt_tokens: data.usage?.input_tokens || 0,
            p_completion_tokens: data.usage?.output_tokens || 0,
            p_model: 'claude-sonnet-4-20250514',
            p_metadata: {}
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
