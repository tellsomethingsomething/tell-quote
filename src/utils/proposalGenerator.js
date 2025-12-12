// AI-powered proposal generator
import { calculateGrandTotalWithFees, calculateSectionTotal } from './calculations';
import { formatCurrency } from './currency';
import { SECTIONS, SECTION_ORDER } from '../data/sections';

/**
 * Gathers quote data into a structured format for AI processing
 */
export function gatherQuoteContext(quote, currency, settings) {
    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});

    // Gather all line items by section
    const sectionData = [];
    SECTION_ORDER.forEach(sectionId => {
        const section = sections[sectionId];
        const config = SECTIONS[sectionId];
        if (!section) return;

        const items = [];
        Object.entries(section.subsections || {}).forEach(([subsectionName, subsectionItems]) => {
            if (Array.isArray(subsectionItems)) {
                subsectionItems.forEach(item => {
                    if (item?.name) {
                        items.push({
                            name: item.name,
                            quantity: item.quantity || 1,
                            days: item.days || 1,
                            subsection: subsectionName
                        });
                    }
                });
            }
        });

        if (items.length > 0) {
            sectionData.push({
                section: config.name,
                items: items,
                total: formatCurrency(calculateSectionTotal(section.subsections).totalCharge, currency)
            });
        }
    });

    return {
        company: settings?.company?.name || 'Our company',
        client: {
            name: client.company || 'the client',
            contact: client.contact,
            location: client.location
        },
        project: {
            title: project.title || 'the project',
            type: project.type,
            venue: project.venue,
            startDate: project.startDate,
            endDate: project.endDate,
            description: project.description
        },
        sections: sectionData,
        financials: {
            total: formatCurrency(totals.totalCharge, currency),
            currency: currency,
            discount: fees?.discount || 0,
            validityDays: quote.validityDays || 30
        }
    };
}

/**
 * Generates an AI prompt for proposal creation
 */
export function createProposalPrompt(context) {
    const sectionsDescription = context.sections.map(s =>
        `- ${s.section}: ${s.items.map(i => i.name).join(', ')} (${s.total})`
    ).join('\n');

    return `You are writing a professional business proposal for a production services company. Write a compelling 4-paragraph proposal based on this quote data:

COMPANY: ${context.company}
CLIENT: ${context.client.name}${context.client.location ? ` (${context.client.location})` : ''}

PROJECT DETAILS:
- Title: ${context.project.title}
- Type: ${context.project.type || 'Production'}
- Venue: ${context.project.venue || 'To be confirmed'}
- Dates: ${context.project.startDate || 'TBC'}${context.project.endDate ? ` to ${context.project.endDate}` : ''}
${context.project.description ? `- Description: ${context.project.description}` : ''}

SERVICES INCLUDED:
${sectionsDescription}

INVESTMENT: ${context.financials.total}${context.financials.discount > 0 ? ` (includes ${context.financials.discount}% discount)` : ''}
VALIDITY: ${context.financials.validityDays} days

Write exactly 4 paragraphs:
1. Opening: Introduce the proposal, express enthusiasm for the project, mention the client and event
2. Services: Describe what's being provided, highlight key elements from each section professionally
3. Value & Approach: Explain the value proposition, mention expertise, quality, and project management
4. Investment & Next Steps: State the total, validity, and invite discussion

Keep it professional, confident, and tailored to sports/event production. Do not use bullet points. Each paragraph should be 3-5 sentences.`;
}

/**
 * Calls Claude API to generate proposal
 */
export async function generateAIProposal(quote, currency, settings, apiKey) {
    const context = gatherQuoteContext(quote, currency, settings);
    const prompt = createProposalPrompt(context);

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const text = data.content[0]?.text || '';

        // Split into paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim());

        return {
            success: true,
            paragraphs,
            fullText: text,
            context
        };
    } catch (error) {
        console.error('AI Proposal generation failed:', error);
        return {
            success: false,
            error: error.message,
            // Fallback to template-based proposal
            ...generateFallbackProposal(context)
        };
    }
}

/**
 * Fallback template-based proposal when AI is unavailable
 */
export function generateFallbackProposal(context) {
    const { company, client, project, sections, financials } = context;

    const servicesList = sections.map(s => s.section.toLowerCase()).join(', ');
    const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);

    const para1 = `${company} is pleased to present this proposal for ${project.title}${project.type ? `, a ${project.type.toLowerCase()} production` : ''}. We are excited to partner with ${client.name} to deliver a comprehensive production solution that meets your objectives and exceeds expectations. ${project.venue ? `The event will take place at ${project.venue}` : 'We will work closely with your team to ensure seamless execution'}${project.startDate ? ` from ${project.startDate}${project.endDate ? ` to ${project.endDate}` : ''}` : ''}.`;

    const para2 = `Our proposal encompasses ${servicesList}, totaling ${totalItems} deliverables tailored specifically to your requirements. ${sections.slice(0, 2).map(s => `Our ${s.section.toLowerCase()} includes ${s.items.slice(0, 3).map(i => i.name).join(', ')}${s.items.length > 3 ? ' and more' : ''}`).join('. ')}. Each element has been carefully selected to ensure the highest production standards.`;

    const para3 = `We pride ourselves on delivering exceptional quality while maintaining cost-effectiveness. Our experienced team will manage all aspects of the production, from pre-event planning through to on-site execution and post-event support. We ensure clear communication throughout the process, with dedicated project management to coordinate all elements seamlessly.`;

    const para4 = `The total investment for this comprehensive production package is ${financials.total}${financials.discount > 0 ? `, which includes a ${financials.discount}% discount` : ''}. This quotation remains valid for ${financials.validityDays} days. We welcome the opportunity to discuss this proposal in detail and are happy to adjust the scope to align with your specific needs. Please contact us to proceed.`;

    return {
        paragraphs: [para1, para2, para3, para4],
        fullText: [para1, para2, para3, para4].join('\n\n'),
        context
    };
}
