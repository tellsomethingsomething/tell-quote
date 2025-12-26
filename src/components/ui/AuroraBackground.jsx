import React from "react";
import { motion } from "framer-motion";

export const AuroraBackground = ({ className, children, showRadialGradient = true, ...props }) => {
    return (
        <div
            className={`relative flex flex-col items-center justify-center bg-zinc-950 text-slate-950 transition-bg ${className}`}
            {...props}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className={`
            absolute -inset-[10px] opacity-50
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#6366f1_10%,#8b5cf6_15%,#3b82f6_20%,#a855f7_25%,#6366f1_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,_50%_50%]
            filter blur-[10px] invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)] 
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-50
          `}
                ></div>
                {/* Radial Gradient to fade out edges */}
                {showRadialGradient && (
                    <div className="absolute inset-0 bg-zinc-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]"></div>
                )}
            </div>
            <div className="relative z-10 w-full">{children}</div>
        </div>
    );
};
