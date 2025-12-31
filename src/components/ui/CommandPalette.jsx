import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight, FileText, Users, Settings, Home, BarChart3, Calendar, Package, Briefcase, FolderKanban, UserCheck, Receipt, Mail, CheckSquare, Wrench, ClipboardList, FileSignature, ShoppingCart, GitBranch, ListOrdered, DollarSign, BookOpen, Library, Contact, Shield } from 'lucide-react';
import { useKeyboardShortcut, formatShortcut, SHORTCUT_CATEGORIES } from '../../hooks/useKeyboardShortcuts';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CommandPalette - Global command palette (Ctrl/Cmd+K)
 */
export default function CommandPalette({ onNavigate, onAction }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Open command palette with Cmd/Ctrl+K
    useKeyboardShortcut('mod+k', () => {
        setIsOpen(true);
        setSearch('');
        setSelectedIndex(0);
    });

    // Close on escape
    useKeyboardShortcut('escape', () => {
        if (isOpen) setIsOpen(false);
    }, { enabled: isOpen });

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Define commands
    const commands = useMemo(() => [
        // Navigation - CRM
        { id: 'nav-dashboard', label: 'Go to Dashboard', category: 'CRM', icon: Home, action: () => onNavigate?.('dashboard') },
        { id: 'nav-clients', label: 'Go to Clients', category: 'CRM', icon: Users, action: () => onNavigate?.('clients') },
        { id: 'nav-contacts', label: 'Go to Contacts', category: 'CRM', icon: Contact, action: () => onNavigate?.('contacts') },
        { id: 'nav-opportunities', label: 'Go to Opportunities', category: 'CRM', icon: Briefcase, action: () => onNavigate?.('opportunities') },

        // Navigation - Quoting
        { id: 'nav-quotes', label: 'Go to Quotes', category: 'Quoting', icon: FileText, action: () => onNavigate?.('quotes') },
        { id: 'nav-rate-card', label: 'Go to Rate Card', category: 'Quoting', icon: Package, action: () => onNavigate?.('rate-card') },

        // Navigation - Projects
        { id: 'nav-projects', label: 'Go to Projects', category: 'Projects', icon: FolderKanban, action: () => onNavigate?.('projects') },
        { id: 'nav-tasks', label: 'Go to Task Board', category: 'Projects', icon: CheckSquare, action: () => onNavigate?.('task-board') },

        // Navigation - Operations
        { id: 'nav-crew', label: 'Go to Crew', category: 'Operations', icon: UserCheck, action: () => onNavigate?.('crew') },
        { id: 'nav-kit', label: 'Go to Equipment/Kit', category: 'Operations', icon: Wrench, action: () => onNavigate?.('kit') },
        { id: 'nav-kit-bookings', label: 'Go to Kit Bookings', category: 'Operations', icon: Calendar, action: () => onNavigate?.('kit-bookings') },
        { id: 'nav-call-sheets', label: 'Go to Call Sheets', category: 'Operations', icon: ClipboardList, action: () => onNavigate?.('call-sheets') },
        { id: 'nav-calendar', label: 'Go to Calendar', category: 'Operations', icon: Calendar, action: () => onNavigate?.('calendar') },

        // Navigation - Finance
        { id: 'nav-invoices', label: 'Go to Invoices', category: 'Finance', icon: Receipt, action: () => onNavigate?.('invoices') },
        { id: 'nav-expenses', label: 'Go to Expenses', category: 'Finance', icon: DollarSign, action: () => onNavigate?.('expenses') },
        { id: 'nav-purchase-orders', label: 'Go to Purchase Orders', category: 'Finance', icon: ShoppingCart, action: () => onNavigate?.('purchase-orders') },
        { id: 'nav-pl', label: 'Go to Profit & Loss', category: 'Finance', icon: BarChart3, action: () => onNavigate?.('pl') },
        { id: 'nav-contracts', label: 'Go to Contracts', category: 'Finance', icon: FileSignature, action: () => onNavigate?.('contracts') },

        // Navigation - Communication
        { id: 'nav-email', label: 'Go to Email', category: 'Communication', icon: Mail, action: () => onNavigate?.('email') },
        { id: 'nav-email-templates', label: 'Go to Email Templates', category: 'Communication', icon: Mail, action: () => onNavigate?.('email-templates') },
        { id: 'nav-sequences', label: 'Go to Sequences', category: 'Communication', icon: ListOrdered, action: () => onNavigate?.('sequences') },
        { id: 'nav-workflows', label: 'Go to Workflows', category: 'Communication', icon: GitBranch, action: () => onNavigate?.('workflows') },

        // Navigation - Resources
        { id: 'nav-knowledge', label: 'Go to Knowledge Base', category: 'Resources', icon: Library, action: () => onNavigate?.('knowledge') },
        { id: 'nav-sop', label: 'Go to SOPs', category: 'Resources', icon: BookOpen, action: () => onNavigate?.('sop') },

        // Navigation - Analytics & Settings
        { id: 'nav-analytics', label: 'Go to Analytics', category: 'Analytics', icon: BarChart3, action: () => onNavigate?.('analytics') },
        { id: 'nav-settings', label: 'Go to Settings', category: 'Settings', icon: Settings, action: () => onNavigate?.('settings') },
        { id: 'nav-admin', label: 'Go to Admin', category: 'Settings', icon: Shield, action: () => onNavigate?.('admin') },

        // Actions
        { id: 'action-new-quote', label: 'Create New Quote', category: 'Actions', shortcut: 'mod+n', action: () => onAction?.('newQuote') },
        { id: 'action-new-client', label: 'Add New Client', category: 'Actions', action: () => onAction?.('newClient') },
        { id: 'action-new-opportunity', label: 'Create Opportunity', category: 'Actions', action: () => onAction?.('newOpportunity') },

        // Quick settings
        { id: 'setting-theme', label: 'Toggle Theme', category: 'Preferences', action: () => onAction?.('toggleTheme') },
        { id: 'setting-shortcuts', label: 'View Keyboard Shortcuts', category: 'Preferences', shortcut: '?', action: () => onAction?.('showShortcuts') },
    ], [onNavigate, onAction]);

    // Filter commands based on search
    const filteredCommands = useMemo(() => {
        if (!search) return commands;

        const searchLower = search.toLowerCase();
        return commands.filter((cmd) =>
            cmd.label.toLowerCase().includes(searchLower) ||
            cmd.category.toLowerCase().includes(searchLower)
        );
    }, [commands, search]);

    // Group commands by category
    const groupedCommands = useMemo(() => {
        const groups = {};
        filteredCommands.forEach((cmd) => {
            if (!groups[cmd.category]) {
                groups[cmd.category] = [];
            }
            groups[cmd.category].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((i) => Math.max(i - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                        setIsOpen(false);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && isOpen) {
            const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, isOpen]);

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    const handleSelect = (command) => {
        command.action();
        setIsOpen(false);
    };

    let flatIndex = 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
                    onClick={() => setIsOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-xl shadow-2xl overflow-hidden"
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border">
                            <Search className="w-5 h-5 text-gray-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 outline-none"
                            />
                            <kbd className="px-2 py-1 bg-dark-border rounded text-xs text-gray-500">ESC</kbd>
                        </div>

                        {/* Command list */}
                        <div ref={listRef} className="max-h-80 overflow-y-auto">
                            {filteredCommands.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    No commands found
                                </div>
                            ) : (
                                Object.entries(groupedCommands).map(([category, cmds]) => (
                                    <div key={category}>
                                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-dark-bg/50">
                                            {category}
                                        </div>
                                        {cmds.map((cmd) => {
                                            const currentIndex = flatIndex++;
                                            const isSelected = currentIndex === selectedIndex;
                                            const Icon = cmd.icon;

                                            return (
                                                <button
                                                    key={cmd.id}
                                                    data-index={currentIndex}
                                                    onClick={() => handleSelect(cmd)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                        isSelected
                                                            ? 'bg-brand-primary/20 text-white'
                                                            : 'text-gray-300 hover:bg-dark-border'
                                                    }`}
                                                >
                                                    {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                                                    <span className="flex-1">{cmd.label}</span>
                                                    {cmd.shortcut && (
                                                        <kbd className="px-1.5 py-0.5 bg-dark-border rounded text-xs text-gray-500">
                                                            {formatShortcut(cmd.shortcut)}
                                                        </kbd>
                                                    )}
                                                    {isSelected && (
                                                        <ArrowRight className="w-4 h-4 text-brand-primary" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-dark-border bg-dark-bg/50 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-dark-border rounded">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 bg-dark-border rounded">↓</kbd>
                                    navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-dark-border rounded">↵</kbd>
                                    select
                                </span>
                            </div>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-dark-border rounded">{formatShortcut('mod+k')}</kbd>
                                to open
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * ShortcutsHelp - Modal showing all keyboard shortcuts
 */
export function ShortcutsHelp({ isOpen, onClose }) {
    useKeyboardShortcut('escape', () => {
        if (isOpen) onClose();
    }, { enabled: isOpen });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-100">Keyboard Shortcuts</h2>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-dark-border rounded text-gray-500 hover:text-white"
                            >
                                <kbd className="px-2 py-1 bg-dark-border rounded text-xs">ESC</kbd>
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
                            {Object.entries(SHORTCUT_CATEGORIES).map(([key, category]) => (
                                <div key={key}>
                                    <h3 className="text-sm font-medium text-gray-400 mb-3">{category.label}</h3>
                                    <div className="space-y-2">
                                        {category.shortcuts.map((shortcut) => (
                                            <div
                                                key={shortcut.key}
                                                className="flex items-center justify-between py-1"
                                            >
                                                <span className="text-sm text-gray-300">{shortcut.description}</span>
                                                <kbd className="px-2 py-1 bg-dark-border rounded text-xs text-gray-400 font-mono">
                                                    {formatShortcut(shortcut.key)}
                                                </kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
