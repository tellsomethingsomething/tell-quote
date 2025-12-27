import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

// Context for managing tooltip state across the app
const TooltipContext = createContext(null);

export function TooltipProvider({ children, userId }) {
    const [dismissedTooltips, setDismissedTooltips] = useState(() => {
        const stored = localStorage.getItem(`tooltips-dismissed-${userId || 'guest'}`);
        return stored ? JSON.parse(stored) : [];
    });

    const [activeTooltip, setActiveTooltip] = useState(null);

    const dismissTooltip = (tooltipId) => {
        const updated = [...dismissedTooltips, tooltipId];
        setDismissedTooltips(updated);
        localStorage.setItem(`tooltips-dismissed-${userId || 'guest'}`, JSON.stringify(updated));
        setActiveTooltip(null);
    };

    const isTooltipDismissed = (tooltipId) => {
        return dismissedTooltips.includes(tooltipId);
    };

    const resetTooltips = () => {
        setDismissedTooltips([]);
        localStorage.removeItem(`tooltips-dismissed-${userId || 'guest'}`);
    };

    return (
        <TooltipContext.Provider
            value={{
                dismissedTooltips,
                dismissTooltip,
                isTooltipDismissed,
                resetTooltips,
                activeTooltip,
                setActiveTooltip,
            }}
        >
            {children}
        </TooltipContext.Provider>
    );
}

export function useTooltips() {
    const context = useContext(TooltipContext);
    if (!context) {
        throw new Error('useTooltips must be used within a TooltipProvider');
    }
    return context;
}

// Predefined tooltip content for different features
export const TOOLTIP_CONTENT = {
    // Dashboard
    'dashboard-welcome': {
        title: 'Welcome to your Dashboard',
        content: 'This is your command center. Track revenue, projects, and key metrics at a glance.',
        position: 'bottom',
    },
    'dashboard-revenue': {
        title: 'Revenue Overview',
        content: 'See your monthly revenue, compare to previous periods, and track your growth.',
        position: 'bottom',
    },

    // Quote Editor
    'editor-sections': {
        title: 'Quote Sections',
        content: 'Organize your quote into sections like Production Team, Equipment, and Expenses. Drag to reorder.',
        position: 'right',
    },
    'editor-add-item': {
        title: 'Add Line Items',
        content: 'Click here to add items from your rate card, or create custom line items.',
        position: 'bottom',
    },
    'editor-totals': {
        title: 'Quote Totals',
        content: 'See your subtotals, fees, and margins. Apply discounts and management fees here.',
        position: 'left',
    },
    'editor-export': {
        title: 'Export Options',
        content: 'Export as PDF, send directly to clients, or create a proposal with cover page.',
        position: 'bottom',
    },

    // Clients
    'clients-list': {
        title: 'Client Database',
        content: 'Keep all your client contacts organized. Click a client to see their quote history.',
        position: 'bottom',
    },
    'clients-add': {
        title: 'Add New Client',
        content: 'Add clients manually or import from a CSV file.',
        position: 'left',
    },

    // Rate Card
    'rate-card-regions': {
        title: 'Regional Pricing',
        content: 'Set different rates for different regions. Pricing auto-adjusts when you select a region in quotes.',
        position: 'right',
    },
    'rate-card-item': {
        title: 'Rate Card Items',
        content: 'Create reusable items with preset pricing. Add them quickly to any quote.',
        position: 'bottom',
    },

    // Projects
    'projects-board': {
        title: 'Project Board',
        content: 'Track project status from proposal to completion. Drag cards between columns.',
        position: 'bottom',
    },
    'projects-convert': {
        title: 'Convert Quote to Project',
        content: 'When a quote is approved, convert it to a project to track progress and invoicing.',
        position: 'left',
    },

    // Settings
    'settings-company': {
        title: 'Company Settings',
        content: 'Add your logo, company details, and banking information for invoices.',
        position: 'right',
    },
};

/**
 * Contextual Tooltip Component
 */
export default function ContextualTooltip({
    id,
    children,
    title,
    content,
    position = 'bottom',
    showOnMount = false,
    delay = 500,
}) {
    const { isTooltipDismissed, dismissTooltip, activeTooltip, setActiveTooltip } = useTooltips();
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);
    const targetRef = useRef(null);
    const timeoutRef = useRef(null);

    // Get content from predefined tooltips if not provided
    const tooltipContent = TOOLTIP_CONTENT[id] || { title, content, position };
    const finalTitle = title || tooltipContent.title;
    const finalContent = content || tooltipContent.content;
    const finalPosition = position || tooltipContent.position || 'bottom';

    // Check if this tooltip has been dismissed
    const isDismissed = isTooltipDismissed(id);

    useEffect(() => {
        // Show on mount if specified and not dismissed
        if (showOnMount && !isDismissed && !hasBeenShown) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(true);
                setHasBeenShown(true);
                setActiveTooltip(id);
            }, delay);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [showOnMount, isDismissed, hasBeenShown, delay, id, setActiveTooltip]);

    const handleDismiss = () => {
        setIsVisible(false);
        dismissTooltip(id);
    };

    const handleClick = () => {
        if (!isDismissed && !hasBeenShown) {
            setIsVisible(true);
            setHasBeenShown(true);
            setActiveTooltip(id);
        }
    };

    // Don't render tooltip if dismissed
    if (isDismissed) {
        return <>{children}</>;
    }

    // Position styles
    const positionStyles = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowStyles = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-brand-orange',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-brand-orange',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-brand-orange',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-brand-orange',
    };

    return (
        <div ref={targetRef} className="relative inline-block" onClick={handleClick}>
            {children}

            {isVisible && (
                <div
                    className={`absolute z-50 ${positionStyles[finalPosition]} animate-fade-in`}
                    style={{ minWidth: '240px', maxWidth: '300px' }}
                >
                    {/* Arrow */}
                    <div
                        className={`absolute w-0 h-0 border-8 ${arrowStyles[finalPosition]}`}
                    />

                    {/* Tooltip content */}
                    <div className="bg-brand-orange text-white rounded-lg shadow-xl overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 flex-shrink-0" />
                                    <h4 className="font-semibold text-sm">{finalTitle}</h4>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDismiss();
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1 -mr-1 -mt-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-white/90 leading-relaxed">
                                {finalContent}
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-black/10 flex justify-end">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss();
                                }}
                                className="text-xs font-medium text-white/80 hover:text-white transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Feature Tour - Sequential tooltips for onboarding
 */
export function FeatureTour({ steps, onComplete, isActive }) {
    const [currentStep, setCurrentStep] = useState(0);
    const { dismissTooltip } = useTooltips();

    if (!isActive || !steps || steps.length === 0) return null;

    const step = steps[currentStep];

    const handleNext = () => {
        dismissTooltip(step.id);
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete?.();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        steps.forEach(s => dismissTooltip(s.id));
        onComplete?.();
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden max-w-sm">
            <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-brand-orange" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">
                            Step {currentStep + 1} of {steps.length}
                        </p>
                        <h4 className="font-semibold text-white">{step.title}</h4>
                    </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {step.content}
                </p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentStep
                                    ? 'bg-brand-orange'
                                    : index < currentStep
                                        ? 'bg-brand-teal'
                                        : 'bg-gray-600'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="px-4 py-3 bg-dark-bg flex items-center justify-between">
                <button
                    onClick={handleSkip}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                    Skip tour
                </button>
                <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                        <button
                            onClick={handlePrevious}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-1 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors text-sm font-medium"
                    >
                        {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                        {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Highlight Pulse - Visual indicator for new features
 */
export function HighlightPulse({ children, isNew = false, color = 'orange' }) {
    if (!isNew) return <>{children}</>;

    const colorClasses = {
        orange: 'bg-brand-orange',
        teal: 'bg-brand-teal',
        green: 'bg-green-500',
    };

    return (
        <div className="relative inline-block">
            {children}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses[color]}`} />
            </span>
        </div>
    );
}
