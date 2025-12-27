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
export function createProposalPrompt(context, proposalInputs = {}) {
    const sectionsDescription = context.sections.map(s =>
        `- ${s.section}: ${s.items.map(i => `${i.name} (qty: ${i.quantity}, days: ${i.days})`).join(', ')}`
    ).join('\n');

    // Extract personnel for "Your Team" section
    const personnelSection = context.sections.find(s => s.section.toLowerCase().includes('personnel') || s.section.toLowerCase().includes('crew'));
    const personnelList = personnelSection ? personnelSection.items.map(i => i.name).join(', ') : '';

    const { context: briefContext, keyPoints, tone } = proposalInputs;

    return `Generate a professional 1-page proposal for ${context.company} production services.

## INPUT DATA

CLIENT:
- Company: ${context.client.name}
- Contact: ${context.client.contact || 'Not specified'}

PROJECT:
- Title: ${context.project.title || 'Project'}
- Type: ${context.project.type || 'Production'}
- Venue: ${context.project.venue || 'To be confirmed'}
- Dates: ${context.project.startDate || 'TBC'}${context.project.endDate && context.project.endDate !== context.project.startDate ? ` to ${context.project.endDate}` : ''}
${context.project.description ? `- Description: ${context.project.description}` : ''}

LINE ITEMS / KIT:
${sectionsDescription}

${personnelList ? `KEY PERSONNEL FROM QUOTE: ${personnelList}` : ''}

${briefContext ? `ADDITIONAL CONTEXT:\n${briefContext}\n` : ''}
${keyPoints ? `KEY POINTS TO EMPHASIZE:\n${keyPoints}\n` : ''}

## OUTPUT FORMAT

Write FOUR sections as flowing prose (NO BULLET POINTS). Each section should be 2-4 sentences.

**PROJECT OVERVIEW**
2-3 sentences summarising the project title, type, venue, location, and dates. Set the scene.

**WHAT WE'LL DO**
One to two paragraphs describing the deliverables and services derived from the line items. Write as flowing prose — describe the key deliverables, service categories being provided, and what the client will receive. Be specific about equipment and services from the kit list.

**HOW WE'LL DO IT**
One paragraph describing the timeline and methodology. Mention setup, show days, and strike in natural sentences. Include the technical approach and how coordination will work.

**YOUR TEAM**
Short paragraph introducing 2-4 key personnel roles from the quote. Don't list roles — weave them into flowing sentences that convey experience and capability. Example: "Your production will be led by an experienced Technical Director, supported by specialist Graphics Operators..."

## WRITING STYLE

- Professional but approachable — not stuffy corporate speak
- Confident — we know what we're doing
- Client-focused — frame as benefits to them
- Concise — every word earns its place
- Active voice — "We will deliver" not "Delivery will be provided"
- Use contractions naturally: We're, We'll, We've
- NO bullet points — all flowing paragraphs
- AVOID: "synergise", "leverage", "reach out", "circle back", generic filler

${tone ? `Tone: ${tone}` : ''}

## COMPANY CONTEXT

${context.company} provides professional production services. Frame the proposal around the services being offered in this quote.

Output the four sections only, with section headings in caps. No pricing (this is a summary, not a quote).`;
}

/**
 * Calls AI service to generate proposal
 * Uses server-side token management - no API key needed
 */
export async function generateAIProposal(quote, currency, settings, _apiKey, proposalInputs = {}) {
    const context = gatherQuoteContext(quote, currency, settings);
    const prompt = createProposalPrompt(context, proposalInputs);

    try {
        // Dynamic import to avoid circular dependencies
        const { generateAIContent } = await import('../services/aiService.js');

        const result = await generateAIContent({
            prompt,
            maxTokens: 1024,
        });

        const text = result.content || '';

        // Split into paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim());

        return {
            success: true,
            paragraphs,
            fullText: text,
            context,
            tokensUsed: result.tokensUsed,
            tokensRemaining: result.tokensRemaining,
        };
    } catch (error) {
        console.error('AI Proposal generation failed:', error);

        // Handle insufficient tokens error
        if (error.code === 'INSUFFICIENT_TOKENS') {
            return {
                success: false,
                error: error.message,
                code: 'INSUFFICIENT_TOKENS',
                availableTokens: error.availableTokens,
                ...generateFallbackProposal(context)
            };
        }

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
    const { company, client, project, sections } = context;

    const servicesList = sections.map(s => s.section.toLowerCase()).join(', ');

    // Extract personnel
    const personnelSection = sections.find(s => s.section.toLowerCase().includes('personnel') || s.section.toLowerCase().includes('crew'));
    const personnelList = personnelSection ? personnelSection.items.slice(0, 3).map(i => i.name).join(', ') : 'Technical Director, Graphics Operators';

    const overview = `PROJECT OVERVIEW\n\n${project.title}${project.type ? ` — a ${project.type.toLowerCase()} production` : ''}${project.venue ? ` at ${project.venue}` : ''}${project.startDate ? `. Taking place ${project.startDate}${project.endDate && project.endDate !== project.startDate ? ` to ${project.endDate}` : ''}` : ''}. We've worked with ${client.name} to scope out exactly what's needed for this event.`;

    const whatWeDo = `WHAT WE'LL DO\n\n${company} will provide comprehensive production services covering ${servicesList}. ${sections.slice(0, 2).map(s => `For ${s.section.toLowerCase()}, we're providing ${s.items.slice(0, 3).map(i => i.name).join(', ')}${s.items.length > 3 ? ' and additional equipment' : ''}`).join('. ')}. All equipment and services have been selected to meet the specific requirements of this production.`;

    const howWeDo = `HOW WE'LL DO IT\n\nOur team will arrive ahead of the event for setup and technical rehearsals, ensuring all systems are tested and integrated before we go live. During show days, we'll operate from the venue, delivering broadcast-quality output throughout. We'll handle coordination between all production elements and ensure clear communication at every stage.`;

    const yourTeam = `YOUR TEAM\n\nYour production will be led by experienced professionals including ${personnelList}. All crew are seasoned broadcast specialists who've delivered events across Southeast Asia and the Gulf — we know how to make it work.`;

    return {
        paragraphs: [overview, whatWeDo, howWeDo, yourTeam],
        fullText: [overview, whatWeDo, howWeDo, yourTeam].join('\n\n'),
        context
    };
}
