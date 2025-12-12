// AI-powered cover image generator using DALL-E + Claude for smart prompts

/**
 * Uses Claude to generate an optimal DALL-E prompt based on project context
 */
export async function generateSmartImagePrompt(project, client, anthropicKey) {
    if (!anthropicKey) {
        return createFallbackPrompt(project);
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                messages: [{
                    role: 'user',
                    content: `Generate a DALL-E 3 image prompt for a professional proposal cover page.

PROJECT: ${project.title || 'Corporate Event'}
TYPE: ${project.type || 'Production'}
VENUE: ${project.venue || 'Event Venue'}
CLIENT: ${client?.company || 'Corporate Client'}

Requirements:
- Professional, high-end corporate aesthetic
- Subtle reference to the project/venue theme
- Abstract or semi-abstract style (no specific text or logos)
- Dark, moody color palette (deep blues, cyans, dark gradients)
- Suitable for A4 portrait document cover
- Cinematic, broadcast-quality feel
- Sports/events production industry aesthetic

Output ONLY the DALL-E prompt, nothing else. Keep it under 200 words.`
                }]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate smart prompt');
        }

        const data = await response.json();
        return data.content[0]?.text || createFallbackPrompt(project);
    } catch (error) {
        console.error('Smart prompt generation failed:', error);
        return createFallbackPrompt(project);
    }
}

/**
 * Fallback prompt when Claude is unavailable
 */
export function createFallbackPrompt(project) {
    const type = project.type?.toLowerCase() || 'event';
    const venue = project.venue || 'stadium';
    const title = project.title || 'sports event';

    return `Professional abstract background for ${type} production proposal.
Theme: ${title} at ${venue}.
Style: Modern, sleek, corporate, subtle sports imagery, dark blue and cyan gradient,
geometric patterns, broadcast/media production aesthetic,
high-end corporate document cover, cinematic lighting,
no text, no logos, subtle and professional.
Aspect ratio: portrait A4 document cover.`;
}

/**
 * Generates cover page image using DALL-E with Claude-generated prompt
 */
export async function generateCoverImage(project, client, openaiKey, anthropicKey = null) {
    // First, generate a smart prompt using Claude (if available)
    const prompt = await generateSmartImagePrompt(project, client, anthropicKey);

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: '1024x1792', // Portrait for A4-like ratio
                quality: 'standard',
                response_format: 'b64_json'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Image generation failed');
        }

        const data = await response.json();
        const base64Image = data.data[0]?.b64_json;

        if (!base64Image) {
            throw new Error('No image data returned');
        }

        return {
            success: true,
            imageData: `data:image/png;base64,${base64Image}`,
            prompt: prompt
        };
    } catch (error) {
        console.error('Cover image generation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generates a simple gradient fallback image as data URL
 */
export function generateFallbackCover(primaryColor = '#1E3A5F', accentColor = '#00A3E0') {
    // Create a canvas-based gradient image
    const canvas = document.createElement('canvas');
    canvas.width = 595; // A4 width at 72 DPI
    canvas.height = 842; // A4 height at 72 DPI
    const ctx = canvas.getContext('2d');

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.5, '#0F172A');
    gradient.addColorStop(1, accentColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some subtle geometric shapes
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = accentColor;

    // Abstract shapes
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.2, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.7, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(canvas.width * 0.6, canvas.height * 0.85, 100, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/png');
}
