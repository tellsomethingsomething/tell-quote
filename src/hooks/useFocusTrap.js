import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to trap focus within a modal or dialog
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Object} options - Configuration options
 * @param {boolean} options.restoreFocus - Restore focus to trigger element on close (default: true)
 * @param {boolean} options.autoFocus - Auto-focus first focusable element on open (default: true)
 * @returns {Object} - { containerRef } to attach to modal container
 */
export function useFocusTrap(isOpen, options = {}) {
    const { restoreFocus = true, autoFocus = true } = options;
    const containerRef = useRef(null);
    const previousFocusRef = useRef(null);

    // Get all focusable elements within the container
    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];

        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        return Array.from(containerRef.current.querySelectorAll(focusableSelectors))
            .filter(el => el.offsetParent !== null); // Exclude hidden elements
    }, []);

    // Handle tab key to trap focus
    const handleKeyDown = useCallback((e) => {
        if (e.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab: if on first element, go to last
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab: if on last element, go to first
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }, [getFocusableElements]);

    useEffect(() => {
        if (isOpen) {
            // Store the currently focused element
            if (restoreFocus) {
                previousFocusRef.current = document.activeElement;
            }

            // Focus the first focusable element after a brief delay
            if (autoFocus) {
                const timer = setTimeout(() => {
                    const focusableElements = getFocusableElements();
                    if (focusableElements.length > 0) {
                        focusableElements[0].focus();
                    } else if (containerRef.current) {
                        // If no focusable elements, focus the container itself
                        containerRef.current.focus();
                    }
                }, 50);
                return () => clearTimeout(timer);
            }
        } else {
            // Restore focus when modal closes
            if (restoreFocus && previousFocusRef.current) {
                previousFocusRef.current.focus();
                previousFocusRef.current = null;
            }
        }
    }, [isOpen, restoreFocus, autoFocus, getFocusableElements]);

    useEffect(() => {
        if (!isOpen) return;

        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    return { containerRef };
}

/**
 * Hook to handle Escape key for closing modals
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Function to call when Escape is pressed
 */
export function useEscapeKey(isOpen, onClose) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
}

export default useFocusTrap;
