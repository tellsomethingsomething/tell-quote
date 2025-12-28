import React from "react";
import { motion } from "framer-motion";

export const BentoGrid = ({ className, children }) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto ${className}`}>
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    onClick
}) => {
    return (
        <div
            className={`row-span-1 rounded-3xl group/bento hover:shadow-2xl hover:shadow-marketing-primary/5 transition duration-200 shadow-input dark:shadow-none p-6 bg-marketing-surface border border-marketing-border/50 justify-between flex flex-col space-y-4 min-h-[18rem] overflow-hidden ${className}`}
            onClick={onClick}
        >
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                <div className="font-sans font-bold text-marketing-text-primary mb-2 mt-4 text-xl">
                    {title}
                </div>
                <div className="font-sans font-normal text-marketing-text-secondary text-base leading-relaxed">
                    {description}
                </div>
            </div>
        </div>
    );
};
