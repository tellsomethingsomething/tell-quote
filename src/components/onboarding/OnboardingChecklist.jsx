import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    Circle,
    ChevronDown,
    ChevronUp,
    X,
    Sparkles,
    User,
    FileText,
    Users,
    Briefcase,
    DollarSign,
    Rocket,
} from 'lucide-react';
import { getOnboardingChecklist, dismissChecklist, minimizeChecklist } from '../../services/onboardingService';

const CHECKLIST_ITEMS = [
    {
        id: 'account_created',
        label: 'Create your account',
        description: 'You\'re already here!',
        icon: User,
        action: null,
        alwaysComplete: true,
    },
    {
        id: 'company_profile_setup',
        label: 'Set up company profile',
        description: 'Add your logo and company details',
        icon: Briefcase,
        action: { view: 'settings', tab: 'company' },
    },
    {
        id: 'rates_configured',
        label: 'Configure your rates',
        description: 'Set up your rate card for quick quoting',
        icon: DollarSign,
        action: { view: 'rate-card' },
    },
    {
        id: 'first_client_added',
        label: 'Add your first client',
        description: 'Start building your client database',
        icon: Users,
        action: { view: 'clients', action: 'new' },
    },
    {
        id: 'first_quote_created',
        label: 'Create your first quote',
        description: 'Generate a professional quote in minutes',
        icon: FileText,
        action: { view: 'editor', isNew: true },
    },
    {
        id: 'first_project_created',
        label: 'Start a project',
        description: 'Turn a quote into an active project',
        icon: Rocket,
        action: { view: 'projects', action: 'new' },
    },
];

export default function OnboardingChecklist({ userId, organizationId, onNavigate }) {
    const [checklist, setChecklist] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChecklist();
    }, [userId, organizationId]);

    const loadChecklist = async () => {
        if (!userId || !organizationId) {
            setLoading(false);
            return;
        }

        const data = await getOnboardingChecklist(userId, organizationId);
        if (data) {
            setChecklist(data);
            setIsMinimized(data.minimized || false);
            setIsDismissed(data.dismissed || false);
        }
        setLoading(false);
    };

    const handleMinimize = async () => {
        const newState = !isMinimized;
        setIsMinimized(newState);
        await minimizeChecklist(userId, organizationId, newState);
    };

    const handleDismiss = async () => {
        setIsDismissed(true);
        await dismissChecklist(userId, organizationId);
    };

    const handleItemClick = (item) => {
        if (item.action && onNavigate) {
            onNavigate(item.action);
        }
    };

    const getCompletedCount = () => {
        if (!checklist) return 1; // Account created is always complete
        return CHECKLIST_ITEMS.filter(item => {
            if (item.alwaysComplete) return true;
            return checklist[item.id];
        }).length;
    };

    const isItemComplete = (item) => {
        if (item.alwaysComplete) return true;
        return checklist?.[item.id] || false;
    };

    const completedCount = getCompletedCount();
    const totalCount = CHECKLIST_ITEMS.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);
    const allComplete = completedCount === totalCount;

    // Don't show if loading, dismissed, or not configured
    if (loading || isDismissed || (!userId && !organizationId)) {
        return null;
    }

    // Celebration message when all complete
    if (allComplete && !isMinimized) {
        return (
            <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Setup Complete!</h3>
                            <p className="text-sm text-gray-400">You've completed all the getting started tasks.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                        title="Dismiss"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-dark-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-brand-orange" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Getting Started</h3>
                            <p className="text-xs text-gray-400">
                                {completedCount} of {totalCount} tasks complete
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleMinimize}
                            className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                            title={isMinimized ? 'Expand' : 'Minimize'}
                        >
                            {isMinimized ? (
                                <ChevronDown className="w-5 h-5" />
                            ) : (
                                <ChevronUp className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                            title="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                    <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-orange to-brand-teal transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Checklist items */}
            {!isMinimized && (
                <div className="p-2">
                    {CHECKLIST_ITEMS.map((item) => {
                        const isComplete = isItemComplete(item);
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => !isComplete && handleItemClick(item)}
                                disabled={isComplete}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                                    isComplete
                                        ? 'opacity-60 cursor-default'
                                        : 'hover:bg-dark-bg cursor-pointer'
                                }`}
                            >
                                {/* Status icon */}
                                {isComplete ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                )}

                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isComplete ? 'bg-gray-700' : 'bg-brand-orange/20'
                                }`}>
                                    <Icon className={`w-4 h-4 ${
                                        isComplete ? 'text-gray-500' : 'text-brand-orange'
                                    }`} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium ${
                                        isComplete ? 'text-gray-400 line-through' : 'text-white'
                                    }`}>
                                        {item.label}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {item.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
