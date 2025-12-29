// Unsubscribe from Email Sequences Edge Function
// Handles unsubscribe requests from sequence emails

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        const url = new URL(req.url)
        const token = url.searchParams.get('token')

        if (!token) {
            return new Response(
                JSON.stringify({ error: 'Missing unsubscribe token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Decode token (base64 encoded "enrollmentId:email")
        let enrollmentId: string
        let email: string

        try {
            const decoded = atob(token)
            const parts = decoded.split(':')
            if (parts.length !== 2) throw new Error('Invalid token format')
            enrollmentId = parts[0]
            email = parts[1]
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid unsubscribe token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Update enrollment status
        const { data: enrollment, error: fetchError } = await supabase
            .from('email_sequence_enrollments')
            .select('id, contact_email, sequence_id')
            .eq('id', enrollmentId)
            .eq('contact_email', email)
            .single()

        if (fetchError || !enrollment) {
            return new Response(
                JSON.stringify({ error: 'Subscription not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Mark as unsubscribed
        const { error: updateError } = await supabase
            .from('email_sequence_enrollments')
            .update({
                status: 'unsubscribed',
                completed_at: new Date().toISOString(),
                metadata: {
                    unsubscribed_at: new Date().toISOString(),
                    unsubscribe_method: 'link',
                },
            })
            .eq('id', enrollmentId)

        if (updateError) {
            throw updateError
        }

        // Also add to a global unsubscribe list for this email
        await supabase.from('email_unsubscribes').upsert({
            email,
            unsubscribed_at: new Date().toISOString(),
            source: 'sequence',
            source_id: enrollment.sequence_id,
        }, {
            onConflict: 'email',
        })

        // Return success HTML page
        const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #18181b;
            color: #e4e4e7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #27272a;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
        }
        .icon {
            width: 64px;
            height: 64px;
            background-color: #22c55e20;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        .icon svg {
            width: 32px;
            height: 32px;
            color: #22c55e;
        }
        h1 {
            font-size: 24px;
            margin: 0 0 12px;
        }
        p {
            color: #a1a1aa;
            margin: 0 0 24px;
            line-height: 1.6;
        }
        a {
            color: #0F8B8D;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h1>You've been unsubscribed</h1>
        <p>You will no longer receive emails from this sequence. We're sorry to see you go!</p>
        <p><a href="https://productionos.io">Visit ProductionOS</a></p>
    </div>
</body>
</html>
`

        return new Response(successHtml, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        })
    } catch (error) {
        console.error('Unsubscribe error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
