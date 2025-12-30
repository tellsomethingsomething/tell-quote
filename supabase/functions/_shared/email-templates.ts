/**
 * Shared Email Templates for ProductionOS
 * Provides consistent branding across all transactional emails
 */

export interface EmailTemplateData {
    title: string;
    preheader?: string;
    heading: string;
    content: string;
    ctaText?: string;
    ctaUrl?: string;
    footerNote?: string;
}

/**
 * Base email template with ProductionOS branding
 */
export function generateEmailTemplate(data: EmailTemplateData): string {
    const ctaButton = data.ctaText && data.ctaUrl ? `
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    <a href="${data.ctaUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);">
                        ${data.ctaText}
                    </a>
                </td>
            </tr>
        </table>
    ` : '';

    const footerNote = data.footerNote ? `
        <p style="color: #a1a1aa; font-size: 14px; line-height: 20px; margin: 32px 0 0 0; text-align: center;">
            ${data.footerNote}
        </p>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${data.title}</title>
    ${data.preheader ? `<!--[if !mso]><!--><meta name="preheader" content="${data.preheader}"><!--<![endif]-->` : ''}
    <style>
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 20px !important; }
            .content { padding: 24px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f10;">
    <!-- Preheader text for email clients -->
    ${data.preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${data.preheader}</div>` : ''}

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f10;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                    <tr>
                        <td>
                            <!-- Header with gradient -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); border-radius: 16px 16px 0 0; padding: 32px;">
                                <tr>
                                    <td align="center">
                                        <!-- Logo -->
                                        <div style="width: 56px; height: 56px; background-color: rgba(255,255,255,0.2); border-radius: 14px; display: inline-block; text-align: center; line-height: 56px; margin-bottom: 16px;">
                                            <span style="font-size: 28px; font-weight: bold; color: white;">P</span>
                                        </div>
                                        <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">ProductionOS</h1>
                                    </td>
                                </tr>
                            </table>

                            <!-- Content -->
                            <table width="100%" cellpadding="0" cellspacing="0" class="content" style="background-color: #18181b; padding: 40px 32px; border-radius: 0 0 16px 16px; border: 1px solid #27272a; border-top: none;">
                                <tr>
                                    <td>
                                        <h2 style="color: #fafafa; font-size: 22px; margin: 0 0 20px 0; font-weight: 600; letter-spacing: -0.3px;">
                                            ${data.heading}
                                        </h2>

                                        <div style="color: #a1a1aa; font-size: 16px; line-height: 26px; margin: 0 0 28px 0;">
                                            ${data.content}
                                        </div>

                                        ${ctaButton}
                                        ${footerNote}
                                    </td>
                                </tr>
                            </table>

                            <!-- Footer -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 28px;">
                                <tr>
                                    <td align="center">
                                        <p style="color: #52525b; font-size: 12px; margin: 0;">
                                            &copy; 2025 ProductionOS. All rights reserved.
                                        </p>
                                        <p style="color: #52525b; font-size: 12px; margin: 12px 0 0 0;">
                                            <a href="https://productionos.io/legal/privacy" style="color: #71717a; text-decoration: underline;">Privacy Policy</a>
                                            &nbsp;&middot;&nbsp;
                                            <a href="https://productionos.io/legal/terms" style="color: #71717a; text-decoration: underline;">Terms of Service</a>
                                            &nbsp;&middot;&nbsp;
                                            <a href="https://productionos.io/help" style="color: #71717a; text-decoration: underline;">Help Center</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

/**
 * Trial reminder email template
 */
export function generateTrialReminderEmail(data: {
    userName: string;
    organizationName: string;
    daysRemaining: number;
    upgradeUrl: string;
}): string {
    const urgencyText = data.daysRemaining <= 1
        ? `<span style="color: #f87171;">Your trial ends today!</span> Don't lose access to your data.`
        : `You have <span style="color: #fbbf24;">${data.daysRemaining} days</span> left in your trial.`;

    return generateEmailTemplate({
        title: `Your ProductionOS Trial ${data.daysRemaining <= 1 ? 'Ends Today' : 'is Ending Soon'}`,
        preheader: `${data.daysRemaining} days left - Upgrade now to keep your data`,
        heading: `Hi ${data.userName}, your trial is ending soon`,
        content: `
            <p style="margin: 0 0 20px 0;">
                ${urgencyText}
            </p>
            <p style="margin: 0 0 20px 0;">
                You've been using ProductionOS for <strong style="color: #fafafa;">${data.organizationName}</strong>.
                Upgrade now to keep:
            </p>
            <ul style="margin: 0 0 24px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">All your quotes, clients, and projects</li>
                <li style="margin-bottom: 8px;">Your crew and equipment data</li>
                <li style="margin-bottom: 8px;">Full access to all features</li>
                <li style="margin-bottom: 8px;">Priority support</li>
            </ul>
        `,
        ctaText: 'Upgrade Now',
        ctaUrl: data.upgradeUrl,
        footerNote: data.daysRemaining <= 1
            ? 'After your trial ends, your account will be in read-only mode. Upgrade anytime to restore full access.'
            : 'Have questions? Reply to this email and we\'ll be happy to help.',
    });
}

/**
 * Trial expired email template
 */
export function generateTrialExpiredEmail(data: {
    userName: string;
    organizationName: string;
    upgradeUrl: string;
}): string {
    return generateEmailTemplate({
        title: 'Your ProductionOS Trial Has Ended',
        preheader: 'Your data is safe - Upgrade to restore access',
        heading: `Hi ${data.userName}, your trial has ended`,
        content: `
            <p style="margin: 0 0 20px 0;">
                Your ProductionOS trial for <strong style="color: #fafafa;">${data.organizationName}</strong> has ended.
            </p>
            <p style="margin: 0 0 20px 0;">
                <span style="color: #22c55e;">Good news:</span> Your data is safe and secure.
                You can still view your quotes, clients, and projects in read-only mode.
            </p>
            <p style="margin: 0 0 24px 0;">
                Upgrade now to restore full access and continue managing your production workflows.
            </p>
        `,
        ctaText: 'Upgrade to Keep Your Data',
        ctaUrl: data.upgradeUrl,
        footerNote: 'Your data will be retained for 30 days. After that, it may be deleted.',
    });
}

/**
 * Welcome email template
 */
export function generateWelcomeEmail(data: {
    userName: string;
    loginUrl: string;
}): string {
    return generateEmailTemplate({
        title: 'Welcome to ProductionOS',
        preheader: 'Your production management journey starts here',
        heading: `Welcome aboard, ${data.userName}!`,
        content: `
            <p style="margin: 0 0 20px 0;">
                Thanks for joining ProductionOS! You now have access to a complete platform for managing your production workflows.
            </p>
            <p style="margin: 0 0 20px 0;">
                Here's what you can do:
            </p>
            <ul style="margin: 0 0 24px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong style="color: #fafafa;">Create professional quotes</strong> with regional pricing</li>
                <li style="margin-bottom: 8px;"><strong style="color: #fafafa;">Manage clients & opportunities</strong> with CRM features</li>
                <li style="margin-bottom: 8px;"><strong style="color: #fafafa;">Track projects</strong> from pitch to wrap</li>
                <li style="margin-bottom: 8px;"><strong style="color: #fafafa;">Schedule crew & equipment</strong> with booking calendars</li>
                <li style="margin-bottom: 8px;"><strong style="color: #fafafa;">Generate call sheets</strong> and other production documents</li>
            </ul>
        `,
        ctaText: 'Start Exploring',
        ctaUrl: data.loginUrl,
        footerNote: 'Need help getting started? Check out our Help Center for tutorials and guides.',
    });
}

/**
 * Email verification template
 */
export function generateVerificationEmail(data: {
    userName: string;
    verifyUrl: string;
}): string {
    return generateEmailTemplate({
        title: 'Verify Your Email - ProductionOS',
        preheader: 'One quick click to verify your email address',
        heading: `Verify your email, ${data.userName}`,
        content: `
            <p style="margin: 0 0 20px 0;">
                Thanks for signing up for ProductionOS! Please verify your email address to complete your registration.
            </p>
            <p style="margin: 0 0 24px 0;">
                Click the button below to verify your email and get started:
            </p>
        `,
        ctaText: 'Verify Email Address',
        ctaUrl: data.verifyUrl,
        footerNote: 'This link will expire in 24 hours. If you didn\'t create this account, you can safely ignore this email.',
    });
}

/**
 * Password reset email template
 */
export function generatePasswordResetEmail(data: {
    userName: string;
    resetUrl: string;
}): string {
    return generateEmailTemplate({
        title: 'Reset Your Password - ProductionOS',
        preheader: 'Click to reset your ProductionOS password',
        heading: 'Reset your password',
        content: `
            <p style="margin: 0 0 20px 0;">
                Hi ${data.userName},
            </p>
            <p style="margin: 0 0 20px 0;">
                We received a request to reset your password. Click the button below to create a new password:
            </p>
        `,
        ctaText: 'Reset Password',
        ctaUrl: data.resetUrl,
        footerNote: 'This link will expire in 1 hour. If you didn\'t request a password reset, you can safely ignore this email.',
    });
}
