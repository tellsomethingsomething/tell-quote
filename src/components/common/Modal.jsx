import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible Modal component with focus trap
 * Implements WCAG 2.1 guidelines for modal dialogs
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string} [props.title] - Modal title displayed in header
 * @param {React.ReactNode} props.children - Modal body content
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [props.size='md'] - Modal width variant
 * @param {boolean} [props.showCloseButton=true] - Whether to show the X close button
 * @param {boolean} [props.closeOnOverlayClick=true] - Close when clicking backdrop
 * @param {boolean} [props.closeOnEsc=true] - Close when pressing Escape key
 * @param {string} [props.className=''] - Additional CSS classes for modal content
 * @param {React.ReactNode} [props.footer=null] - Optional footer content (buttons, etc.)
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEsc = true,
    className = '',
    footer = null,
}) {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    const firstFocusableRef = useRef(null);
    const lastFocusableRef = useRef(null);

    // Size variants
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] max-h-[95vh]',
    };

    // Get all focusable elements in the modal
    const getFocusableElements = useCallback(() => {
        if (!modalRef.current) return [];

        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        return Array.from(modalRef.current.querySelectorAll(focusableSelectors));
    }, []);

    // Handle focus trap
    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;

        // Close on Escape
        if (e.key === 'Escape' && closeOnEsc) {
            e.preventDefault();
            onClose();
            return;
        }

        // Focus trap on Tab
        if (e.key === 'Tab') {
            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift + Tab: going backwards
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: going forwards
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }, [isOpen, closeOnEsc, onClose, getFocusableElements]);

    // Handle overlay click
    const handleOverlayClick = useCallback((e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    }, [closeOnOverlayClick, onClose]);

    // Save and restore focus, lock body scroll
    useEffect(() => {
        if (isOpen) {
            // Save the currently focused element
            previousActiveElement.current = document.activeElement;

            // Lock body scroll
            document.body.style.overflow = 'hidden';

            // Focus the first focusable element or the modal itself
            requestAnimationFrame(() => {
                const focusableElements = getFocusableElements();
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                } else if (modalRef.current) {
                    modalRef.current.focus();
                }
            });
        } else {
            // Unlock body scroll
            document.body.style.overflow = '';

            // Restore focus to the previously focused element
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, getFocusableElements]);

    // Add keyboard event listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div
                ref={modalRef}
                className={`
                    relative bg-dark-card border border-dark-border rounded-xl shadow-2xl
                    w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col
                    animate-in fade-in zoom-in-95 duration-200
                    ${className}
                `}
                tabIndex={-1}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
                        {title && (
                            <h2 id="modal-title" className="text-lg font-semibold text-white">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-dark-bg rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-dark-border">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Confirmation dialog variant of Modal
 */
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
    isLoading = false,
}) {
    const variantClasses = {
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        primary: 'bg-brand-primary hover:bg-brand-primary/90 text-white',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${variantClasses[confirmVariant]}`}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            }
        >
            <p className="text-gray-300">{message}</p>
        </Modal>
    );
}
