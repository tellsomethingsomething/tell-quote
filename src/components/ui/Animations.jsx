import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable animation components and variants for consistent UI animations
 */

// Animation variants
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

export const fadeInDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
};

export const slideInRight = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
};

export const slideInLeft = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
};

export const popIn = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
};

// Stagger container for list animations
export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.05,
        },
    },
};

export const staggerItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
};

// Default transition configs
export const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
};

export const smoothTransition = {
    duration: 0.2,
    ease: 'easeOut',
};

export const quickTransition = {
    duration: 0.15,
    ease: 'easeOut',
};

/**
 * FadeIn - Simple fade animation wrapper
 */
export function FadeIn({
    children,
    delay = 0,
    duration = 0.2,
    className = '',
    ...props
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay, duration, ease: 'easeOut' }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * SlideIn - Slide and fade animation wrapper
 */
export function SlideIn({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.2,
    distance = 20,
    className = '',
    ...props
}) {
    const directions = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...directions[direction] }}
            transition={{ delay, duration, ease: 'easeOut' }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * ScaleIn - Scale and fade animation wrapper
 */
export function ScaleIn({
    children,
    delay = 0,
    duration = 0.2,
    scale = 0.95,
    className = '',
    ...props
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale }}
            transition={{ delay, duration, type: 'spring', stiffness: 300, damping: 30 }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * StaggerList - Animated list with staggered children
 */
export function StaggerList({
    children,
    staggerDelay = 0.05,
    className = '',
    ...props
}) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
                animate: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * StaggerItem - Item for use inside StaggerList
 */
export function StaggerItem({
    children,
    className = '',
    ...props
}) {
    return (
        <motion.div
            variants={staggerItem}
            transition={smoothTransition}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * ModalOverlay - Animated modal backdrop
 */
export function ModalOverlay({
    isOpen,
    onClose,
    children,
    className = '',
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className={`fixed inset-0 bg-black/75 backdrop-blur-md z-50 ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * ModalContent - Animated modal content wrapper
 */
export function ModalContent({
    isOpen,
    children,
    className = '',
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={springTransition}
                    onClick={(e) => e.stopPropagation()}
                    className={className}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * CollapseHeight - Animated height collapse/expand
 */
export function CollapseHeight({
    isOpen,
    children,
    className = '',
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className={`overflow-hidden ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * AnimatedButton - Button with hover/tap animations
 */
export function AnimatedButton({
    children,
    onClick,
    className = '',
    disabled = false,
    ...props
}) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            transition={quickTransition}
            className={className}
            {...props}
        >
            {children}
        </motion.button>
    );
}

/**
 * AnimatedCard - Card with hover animations
 */
export function AnimatedCard({
    children,
    onClick,
    className = '',
    hoverScale = 1.02,
    ...props
}) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: hoverScale }}
            transition={quickTransition}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * Spinner - Animated loading spinner
 */
export function Spinner({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
                fill="none"
            />
        </motion.svg>
    );
}

/**
 * Pulse - Pulsing animation for notifications/badges
 */
export function Pulse({ children, className = '' }) {
    return (
        <motion.div
            animate={{
                scale: [1, 1.05, 1],
                opacity: [1, 0.8, 1],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Shake - Shake animation for errors/validation
 */
export function Shake({ trigger, children, className = '' }) {
    return (
        <motion.div
            animate={trigger ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Re-export motion and AnimatePresence for custom animations
export { motion, AnimatePresence };

export default {
    FadeIn,
    SlideIn,
    ScaleIn,
    StaggerList,
    StaggerItem,
    ModalOverlay,
    ModalContent,
    CollapseHeight,
    AnimatedButton,
    AnimatedCard,
    Spinner,
    Pulse,
    Shake,
};
