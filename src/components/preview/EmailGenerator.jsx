import { useState } from 'react';
import { useQuoteStore } from '../../store/quoteStore';
import { useSettingsStore } from '../../store/settingsStore';
import { calculateGrandTotalWithFees } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export default function EmailGenerator() {
    const { quote } = useQuoteStore();
    const { settings } = useSettingsStore();
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedEmail, setGeneratedEmail] = useState(null);

    const { client, project, sections, fees } = quote;
    const totals = calculateGrandTotalWithFees(sections, fees || {});
    const [tokenError, setTokenError] = useState(null);

    // Get preparer name
    const preparedByUser = settings.users?.find(u => u.id === quote.preparedBy);
    const senderName = preparedByUser?.name?.split(' ')[0] || 'Team';

    // Get client first name
    const clientFirstName = client.contact?.split(' ')[0] || 'there';

    // Format date range
    const dateRange = project.startDate
        ? (project.endDate && project.endDate !== project.startDate
            ? `${project.startDate} to ${project.endDate}`
            : project.startDate)
        : 'TBC';

    // Generate email based on user's writing style
    const generateEmail = () => {
        const total = formatCurrency(totals.totalCharge, quote.currency);

        const subject = `Quote for ${project.title || 'Project'}${dateRange !== 'TBC' ? ` | ${dateRange}` : ''}`;

        const body = `Hi ${clientFirstName},

I've put together the quote for ${project.title || 'the project'}${project.venue ? ` at ${project.venue}` : ''}.

Attached is our proposal covering ${getServicesSummary()}. Total comes to ${total}. Quote's valid for ${quote.validityDays || 30} days.

Happy to jump on a call if you'd like to talk through any of it. Let me know if you have any questions.

Best,
${senderName}`;

        return { subject, body };
    };

    // Get a brief summary of services
    const getServicesSummary = () => {
        const services = [];
        Object.values(sections || {}).forEach(section => {
            if (section?.subsections) {
                const hasItems = Object.values(section.subsections).some(
                    items => Array.isArray(items) && items.length > 0
                );
                if (hasItems && section.name) {
                    services.push(section.name.toLowerCase());
                }
            }
        });

        if (services.length === 0) return 'all the kit and crew';
        if (services.length === 1) return services[0];
        if (services.length === 2) return `${services[0]} and ${services[1]}`;
        return `${services.slice(0, -1).join(', ')}, and ${services[services.length - 1]}`;
    };

    // AI Email Generation - uses server-side tokens
    const generateAIEmail = async () => {
        setIsGenerating(true);
        setTokenError(null);

        try {
            const total = formatCurrency(totals.totalCharge, quote.currency);
            const companyName = settings.company?.name || 'our company';

            const prompt = `Generate a client email to accompany a production services quote from ${companyName}.

## Input Data

CLIENT: ${client.company || 'Client'}
CONTACT: ${clientFirstName}
PROJECT: ${project.title || 'Project'}
TYPE: ${project.type || 'Production'}
VENUE: ${project.venue || 'TBC'}
DATES: ${dateRange}
QUOTE REFERENCE: ${quote.quoteNumber}
TOTAL: ${total}
CURRENCY: ${quote.currency}
VALIDITY: ${quote.validityDays || 30} days
SERVICES: ${getServicesSummary()}
SENDER: ${senderName}

## Writing Style

Professional but casual, direct, efficient. Never stuffy.

Tone rules:
- Use contractions naturally (I'm, we're, it's, we've)
- Short paragraphs, 1-3 sentences each
- No waffle or filler
- Warm but not overly friendly
- Confident without being pushy

## Email Structure

Subject line: Quote for [Project Title] | [Dates]

Body:
1. Opening (1 sentence) - Greeting and brief context
2. The quote (2-3 sentences) - Reference attached quote, mention total and what it covers, note validity
3. Next steps (1-2 sentences) - Clear call to action, offer to discuss
4. Sign off: "Best, ${senderName}"

## Rules

AVOID:
- Bullet points in the email
- "Please find attached" (say "I've attached" or "Attached is")
- "I hope this email finds you well"
- "Don't hesitate to contact me" (say "Let me know if you have any questions")
- Long paragraphs
- Excessive thank-yous
- Marketing language

## Output Format

Return ONLY a JSON object:
{"subject": "the email subject line", "body": "the email body"}

Keep it under 120 words. No bullet points.`;

            // Use centralized AI service
            const { generateAIContent } = await import('../../services/aiService.js');
            const result = await generateAIContent({
                prompt,
                maxTokens: 500,
            });

            const text = result.content || '';

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setGeneratedEmail(parsed);
            }
        } catch (error) {
            console.error('Email generation failed:', error);
            if (error.code === 'INSUFFICIENT_TOKENS') {
                setTokenError('Insufficient AI tokens. Purchase more tokens in Settings.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Use AI email if available, otherwise template
    const emailData = generatedEmail || generateEmail();
    const { subject, body } = emailData;

    const handleCopy = async (text) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyAll = async () => {
        const fullEmail = `Subject: ${subject}\n\n${body}`;
        await navigator.clipboard.writeText(fullEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="card mt-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
                <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Quote Email
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="mt-3 space-y-3">
                    {/* Subject Line */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Subject</label>
                            <button
                                onClick={() => handleCopy(subject)}
                                className="text-[10px] text-gray-500 hover:text-accent-primary transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="bg-slate-800/50 rounded px-2 py-1.5 text-xs text-gray-300 font-mono">
                            {subject}
                        </div>
                    </div>

                    {/* Email Body */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Body</label>
                        </div>
                        <div className="bg-slate-800/50 rounded px-2 py-2 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                            {body}
                        </div>
                    </div>

                    {/* Token Error Display */}
                    {tokenError && (
                        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5 mb-2">
                            {tokenError}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={generateAIEmail}
                            disabled={isGenerating}
                            title="Generate AI email"
                            className="flex-1 py-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    {generatedEmail ? 'Regenerate' : 'Generate'}
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCopyAll}
                            className={`flex-1 py-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                                copied
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/30'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
