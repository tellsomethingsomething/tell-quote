import { useId } from 'react';

/**
 * ProductionOS Logo Component
 * Renders the logo inline to avoid SVG caching issues
 * Icon: Purple to pink gradient with white P
 * Text: "Production" in white, "OS" in purple-to-pink gradient
 *
 * Brand Colors:
 * - Purple: #8B5CF6 (violet-500)
 * - Pink: #EC4899 (pink-500)
 */

export default function Logo({ className = 'h-8', showText = true, variant = 'dark' }) {
    // Unique IDs for gradients to avoid conflicts when multiple logos on page
    const id = useId();
    const iconGradientId = `iconGradient-${id}`;
    const textGradientId = `textGradient-${id}`;
    // Variant controls text color for "Production" part
    // 'dark' = white text (for dark backgrounds)
    // 'light' = dark text (for light backgrounds)
    const productionColor = variant === 'light' ? '#1a1a2e' : 'white';

    return (
        <svg
            viewBox={showText ? "0 0 240 40" : "0 0 40 40"}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                {/* Icon gradient - purple to pink (top-left to bottom-right) */}
                <linearGradient id={iconGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6"/>
                    <stop offset="100%" stopColor="#EC4899"/>
                </linearGradient>
                {/* Text gradient for "OS" - purple to pink */}
                <linearGradient id={textGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6"/>
                    <stop offset="100%" stopColor="#EC4899"/>
                </linearGradient>
            </defs>

            {/* P Icon Box with gradient - rounded corners */}
            <rect x="0" y="0" width="40" height="40" rx="10" fill={`url(#${iconGradientId})`}/>

            {/* P Letter in box (white) - bold, centered */}
            <text
                x="20"
                y="29"
                fill="white"
                fontSize="26"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="600"
                textAnchor="middle"
            >
                P
            </text>

            {showText && (
                <>
                    {/* "Production" text in white/dark */}
                    <text
                        x="52"
                        y="28"
                        fill={productionColor}
                        fontSize="24"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontWeight="500"
                    >
                        Production
                    </text>
                    {/* "OS" text in gradient */}
                    <text
                        x="175"
                        y="28"
                        fill={`url(#${textGradientId})`}
                        fontSize="24"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontWeight="500"
                    >
                        OS
                    </text>
                </>
            )}
        </svg>
    );
}

// Icon only version
export function LogoIcon({ className = 'h-8' }) {
    return <Logo className={className} showText={false} />;
}
