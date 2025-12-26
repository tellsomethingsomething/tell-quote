import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function MotionScreenGrab({ src, alt, className = "" }) {
    // We can add more complex scroll-linked animations here later if needed
    // For now, a subtle float and entry animation

    return (
        <div className={`relative group ${className}`}>
            {/* Glow/Shadow Effect */}
            <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-marketing-primary to-marketing-accent rounded-xl opacity-20 blur-lg group-hover:opacity-30 transition duration-1000 group-hover:duration-200"
                animate={{
                    scale: [1, 1.02, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
            />

            {/* The Image Container */}
            <motion.div
                className="relative rounded-xl overflow-hidden border border-marketing-border bg-marketing-surface shadow-2xl"
                initial={{ y: 20, opacity: 0, rotateX: 5 }}
                whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {/* Browser Chrome / UI Header */}
                <div className="h-8 bg-marketing-background border-b border-marketing-border flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 md:bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 md:bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 md:bg-green-400" />
                    <div className="ml-4 h-4 w-1/2 bg-marketing-border/50 rounded-full text-[10px] flex items-center px-2 text-marketing-text-secondary/50 font-mono">
                        productionos.app
                    </div>
                </div>

                {/* Placeholder Content if no src provided (for dev) */}
                {!src ? (
                    <div className="aspect-[16/9] bg-marketing-surface flex items-center justify-center p-8 bg-grid-white/[0.02]">
                        <div className="text-center">
                            <p className="text-marketing-text-secondary mb-2 font-mono text-sm opacity-50">[{alt}]</p>
                            <div className="text-4xl">✨</div>
                        </div>
                    </div>
                ) : (
                    <img src={src} alt={alt} className="w-full h-auto" />
                )}
            </motion.div>
        </div>
    );
}
