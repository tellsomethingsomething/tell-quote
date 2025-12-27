/**
 * AI Service - Centralized service for all AI-powered features
 * All AI calls go through the edge function which handles token management
 */

import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-commercial-tasks`;

/**
 * Call the AI edge function
 * @param {Object} options - Options for the AI call
 * @param {string} options.prompt - The user prompt
 * @param {string} [options.system] - Optional system prompt
 * @param {number} [options.maxTokens=2048] - Maximum tokens for response
 * @returns {Promise<{content: string, tokensUsed: number, tokensRemaining: number}>}
 */
export async function generateAIContent({ prompt, system, maxTokens = 2048 }) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            prompt,
            system,
            max_tokens: maxTokens,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        if (data.code === 'INSUFFICIENT_TOKENS') {
            const error = new Error(data.error);
            error.code = 'INSUFFICIENT_TOKENS';
            error.availableTokens = data.availableTokens;
            throw error;
        }
        throw new Error(data.error || 'AI request failed');
    }

    return {
        content: data.content,
        tokensUsed: data.tokensUsed,
        tokensRemaining: data.tokensRemaining,
    };
}

/**
 * Generate a proposal using AI
 * @param {Object} context - Quote and project context
 * @param {Object} proposalInputs - User inputs for the proposal
 * @returns {Promise<{content: string, tokensUsed: number, tokensRemaining: number}>}
 */
export async function generateProposal(context, proposalInputs) {
    const { client, project, sections, fees, preparedBy, settings } = context;

    const prompt = `Generate a professional production proposal for:

Client: ${client?.company || 'Unknown'}
Project: ${project?.name || 'Unknown'}
${project?.description ? `Description: ${project.description}` : ''}

${proposalInputs.additionalContext ? `Additional Context: ${proposalInputs.additionalContext}` : ''}

Style: ${proposalInputs.tone || 'professional'}
Focus Areas: ${proposalInputs.highlights?.join(', ') || 'all aspects'}

Please write a compelling proposal that:
1. Opens with an engaging introduction
2. Highlights key deliverables and approach
3. Emphasizes value and expertise
4. Closes with a clear call to action

Keep it concise but impactful (300-500 words).`;

    return generateAIContent({
        prompt,
        maxTokens: 1024,
    });
}

/**
 * Generate an email using AI
 * @param {Object} params - Email generation parameters
 * @returns {Promise<{content: string, tokensUsed: number, tokensRemaining: number}>}
 */
export async function generateEmail({ quote, template, tone = 'professional' }) {
    const prompt = `Write a professional ${tone} email for a production quote.

Client: ${quote?.client?.company || 'Client'}
Project: ${quote?.project || 'Production Project'}
Template: ${template || 'follow-up'}

The email should be:
- Professional and personable
- Under 120 words
- Include a clear call to action

Write just the email body, no subject line.`;

    return generateAIContent({
        prompt,
        maxTokens: 500,
    });
}

/**
 * Generate commercial tasks/research using AI
 * @param {string} prompt - The research or task prompt
 * @returns {Promise<{content: string, tokensUsed: number, tokensRemaining: number}>}
 */
export async function generateCommercialTasks(prompt) {
    return generateAIContent({
        prompt,
        maxTokens: 2048,
    });
}

/**
 * Check available AI tokens for the current user's organization
 * @returns {Promise<number>} Available tokens
 */
export async function getAvailableTokens() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
        return 0;
    }

    // Get user's organization
    const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single();

    if (!orgMember) {
        return 0;
    }

    // Get available tokens
    const { data: tokens } = await supabase
        .rpc('get_available_ai_tokens', { org_id: orgMember.organization_id });

    return tokens || 0;
}

export default {
    generateAIContent,
    generateProposal,
    generateEmail,
    generateCommercialTasks,
    getAvailableTokens,
};
