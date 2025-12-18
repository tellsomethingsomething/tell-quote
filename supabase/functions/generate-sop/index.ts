import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
        const { title, description } = await req.json()

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 2000,
                system: "You are an expert SOP writer. Your goal is to write professional, clear, and actionable Standard Operating Procedures. Use Markdown formatting. Focus on precision and operational excellence.",
                messages: [
                    {
                        role: 'user',
                        content: `Generate a detailed SOP for the following:\n\nTitle: ${title}\nDescription: ${description}\n\nPlease provide a structured document with Purpose, Scope, Steps, and any relevant notes.`
                    }
                ],
            }),
        })

        const data = await response.json()
        const content = data.content[0].text

        return new Response(
            JSON.stringify({ content }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
