import React from "react";
import { motion } from "framer-motion";

export const BentoGrid = ({ className, children }) => {
    return (
        <div className={`grid md:grid-auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ${className}`}>
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
            className={`row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 bg-marketing-surface border border-marketing-border justify-between flex flex-col space-y-4 ${className}`}
            onClick={onClick}
        >
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                <div className="font-sans font-bold text-marketing-text-primary mb-2 mt-2">
                    {title}
                </div>
                <div className="font-sans font-normal text-marketing-text-secondary text-xs">
                    {description}
                </div>
            </div>
        </div>
    );
};
