import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard Shortcuts System
 * Supports global shortcuts, contextual shortcuts, and command palette
 */

// Detect platform for modifier keys
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

// Key code mapping
const KEY_CODES = {
    '/': 'Slash',
    '.': 'Period',
    ',': 'Comma',
    ';': 'Semicolon',
    "'": 'Quote',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    '-': 'Minus',
    '=': 'Equal',
    '`': 'Backquote',
};

// Parse shortcut string (e.g., "ctrl+k", "cmd+shift+p")
function parseShortcut(shortcut) {
    const parts = shortcut.toLowerCase().split('+');
    const modifiers = {
        ctrl: false,
        meta: false,
        alt: false,
        shift: false,
    };

    let key = '';

    parts.forEach((part) => {
        switch (part) {
            case 'ctrl':
            case 'control':
                modifiers.ctrl = true;
                break;
            case 'cmd':
            case 'meta':
            case 'command':
                modifiers.meta = true;
                break;
            case 'alt':
            case 'option':
                modifiers.alt = true;
                break;
            case 'shift':
                modifiers.shift = true;
                break;
            case 'mod':
                // Platform-specific: Cmd on Mac, Ctrl on Windows/Linux
                if (isMac) {
                    modifiers.meta = true;
                } else {
                    modifiers.ctrl = true;
                }
                break;
            default:
                key = part;
        }
    });

    return { modifiers, key };
}

// Check if event matches shortcut
function matchesShortcut(event, shortcut) {
    const { modifiers, key } = parseShortcut(shortcut);

    // Check modifiers
    if (modifiers.ctrl !== event.ctrlKey) return false;
    if (modifiers.meta !== event.metaKey) return false;
    if (modifiers.alt !== event.altKey) return false;
    if (modifiers.shift !== event.shiftKey) return false;

    // Check key
    const eventKey = event.key.toLowerCase();
    const eventCode = event.code;

    // Direct key match
    if (eventKey === key) return true;

    // Code match for special characters
    if (KEY_CODES[key] && eventCode === KEY_CODES[key]) return true;

    // Letter/number match by code
    if (key.length === 1) {
        if (eventCode === `Key${key.toUpperCase()}`) return true;
        if (eventCode === `Digit${key}`) return true;
    }

    // Function keys
    if (key.startsWith('f') && eventCode === key.toUpperCase()) return true;

    // Special keys
    const specialKeys = {
        enter: 'Enter',
        escape: 'Escape',
        esc: 'Escape',
        tab: 'Tab',
        space: 'Space',
        backspace: 'Backspace',
        delete: 'Delete',
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        home: 'Home',
        end: 'End',
        pageup: 'PageUp',
        pagedown: 'PageDown',
    };

    if (specialKeys[key] && (eventKey === specialKeys[key].toLowerCase() || eventCode === specialKeys[key])) {
        return true;
    }

    return false;
}

// Format shortcut for display
export function formatShortcut(shortcut) {
    const parts = shortcut.split('+');
    const formatted = parts.map((part) => {
        switch (part.toLowerCase()) {
            case 'mod':
                return isMac ? '⌘' : 'Ctrl';
            case 'ctrl':
            case 'control':
                return isMac ? '⌃' : 'Ctrl';
            case 'cmd':
            case 'meta':
            case 'command':
                return '⌘';
            case 'alt':
            case 'option':
                return isMac ? '⌥' : 'Alt';
            case 'shift':
                return isMac ? '⇧' : 'Shift';
            case 'enter':
                return '↵';
            case 'escape':
            case 'esc':
                return 'Esc';
            case 'space':
                return '␣';
            case 'backspace':
                return '⌫';
            case 'delete':
                return '⌦';
            case 'up':
                return '↑';
            case 'down':
                return '↓';
            case 'left':
                return '←';
            case 'right':
                return '→';
            default:
                return part.toUpperCase();
        }
    });

    return isMac ? formatted.join('') : formatted.join('+');
}

/**
 * useKeyboardShortcut - Hook for a single keyboard shortcut
 *
 * @param {string} shortcut - Shortcut string (e.g., "mod+k", "ctrl+shift+p")
 * @param {Function} callback - Function to call when shortcut is pressed
 * @param {Object} options - Options
 * @param {boolean} options.enabled - Whether shortcut is active (default: true)
 * @param {boolean} options.preventDefault - Prevent default browser behavior (default: true)
 * @param {boolean} options.stopPropagation - Stop event propagation (default: true)
 * @param {Array} options.ignoredElements - Elements to ignore (default: ['INPUT', 'TEXTAREA', 'SELECT'])
 */
export function useKeyboardShortcut(
    shortcut,
    callback,
    options = {}
) {
    const {
        enabled = true,
        preventDefault = true,
        stopPropagation = true,
        ignoredElements = ['INPUT', 'TEXTAREA', 'SELECT'],
    } = options;

    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event) => {
            // Check if we should ignore this element
            const target = event.target;
            if (ignoredElements.includes(target.tagName)) {
                // Allow shortcuts that use mod/ctrl even in inputs
                const { modifiers } = parseShortcut(shortcut);
                if (!modifiers.ctrl && !modifiers.meta) {
                    return;
                }
            }

            if (matchesShortcut(event, shortcut)) {
                if (preventDefault) event.preventDefault();
                if (stopPropagation) event.stopPropagation();
                callbackRef.current(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcut, enabled, preventDefault, stopPropagation, ignoredElements]);
}

/**
 * useKeyboardShortcuts - Hook for multiple keyboard shortcuts
 *
 * @param {Object} shortcuts - Map of shortcut strings to callbacks
 * @param {Object} options - Options (same as useKeyboardShortcut)
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
    const {
        enabled = true,
        preventDefault = true,
        stopPropagation = true,
        ignoredElements = ['INPUT', 'TEXTAREA', 'SELECT'],
    } = options;

    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event) => {
            const target = event.target;
            const currentShortcuts = shortcutsRef.current;

            for (const [shortcut, callback] of Object.entries(currentShortcuts)) {
                if (matchesShortcut(event, shortcut)) {
                    // Check if we should ignore this element
                    if (ignoredElements.includes(target.tagName)) {
                        const { modifiers } = parseShortcut(shortcut);
                        if (!modifiers.ctrl && !modifiers.meta) {
                            continue;
                        }
                    }

                    if (preventDefault) event.preventDefault();
                    if (stopPropagation) event.stopPropagation();
                    callback(event);
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, preventDefault, stopPropagation, ignoredElements]);
}

/**
 * Default global shortcuts for the app
 */
export const DEFAULT_SHORTCUTS = {
    'mod+k': 'openCommandPalette',
    'mod+/': 'openShortcutsHelp',
    'mod+b': 'toggleSidebar',
    'mod+n': 'newQuote',
    'mod+s': 'save',
    'escape': 'closeModal',
    'mod+,': 'openSettings',
    '?': 'openHelp',
};

/**
 * Shortcut categories for help display
 */
export const SHORTCUT_CATEGORIES = {
    navigation: {
        label: 'Navigation',
        shortcuts: [
            { key: 'mod+k', description: 'Open command palette' },
            { key: 'mod+b', description: 'Toggle sidebar' },
            { key: 'mod+,', description: 'Open settings' },
            { key: '?', description: 'Show keyboard shortcuts' },
        ],
    },
    editing: {
        label: 'Editing',
        shortcuts: [
            { key: 'mod+s', description: 'Save changes' },
            { key: 'mod+n', description: 'New quote' },
            { key: 'mod+z', description: 'Undo' },
            { key: 'mod+shift+z', description: 'Redo' },
        ],
    },
    general: {
        label: 'General',
        shortcuts: [
            { key: 'escape', description: 'Close modal/dialog' },
            { key: 'enter', description: 'Confirm/submit' },
            { key: 'tab', description: 'Next field' },
            { key: 'shift+tab', description: 'Previous field' },
        ],
    },
};

export default useKeyboardShortcut;
