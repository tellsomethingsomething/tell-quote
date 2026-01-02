/**
 * Skeleton loading components for providing visual feedback during data loading
 * Uses the .skeleton CSS class defined in index.css for shimmer animation
 */

// Base skeleton element with shimmer animation
export function SkeletonBox({ className = '', ...props }) {
    return (
        <div
            className={`skeleton bg-gray-800 rounded ${className}`}
            role="presentation"
            aria-hidden="true"
            {...props}
        />
    );
}

// Text line skeleton
export function SkeletonText({ width = 'w-full', height = 'h-4', className = '' }) {
    return <SkeletonBox className={`${width} ${height} ${className}`} />;
}

// Card skeleton for quote/client cards
export function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-dark-card border border-dark-border rounded-lg p-4 ${className}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <SkeletonText width="w-24" height="h-3" className="mb-2" />
                    <SkeletonText width="w-32" height="h-4" />
                </div>
                <SkeletonBox className="w-16 h-6 rounded-full" />
            </div>
            <SkeletonText width="w-full" height="h-3" className="mb-2" />
            <SkeletonText width="w-3/4" height="h-3" className="mb-4" />
            <div className="flex justify-between pt-3 border-t border-dark-border">
                <SkeletonText width="w-20" height="h-4" />
                <SkeletonText width="w-16" height="h-4" />
            </div>
        </div>
    );
}

// Dashboard stats card skeleton
export function SkeletonStatsCard({ className = '' }) {
    return (
        <div className={`card p-3 ${className}`}>
            <div className="flex items-center gap-2 mb-2">
                <SkeletonBox className="w-2 h-2 rounded-full" />
                <SkeletonText width="w-16" height="h-3" />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <SkeletonText width="w-12" height="h-3" />
                    <SkeletonText width="w-20" height="h-4" />
                </div>
                <div className="flex justify-between">
                    <SkeletonText width="w-10" height="h-3" />
                    <SkeletonText width="w-16" height="h-4" />
                </div>
            </div>
        </div>
    );
}

// Table row skeleton
export function SkeletonTableRow({ columns = 5 }) {
    return (
        <tr className="border-b border-dark-border">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="py-3 pr-4">
                    <SkeletonText
                        width={i === 0 ? 'w-24' : i === columns - 1 ? 'w-12' : 'w-full'}
                        height="h-4"
                    />
                </td>
            ))}
        </tr>
    );
}

// Pipeline column skeleton
export function SkeletonPipelineColumn() {
    return (
        <div className="space-y-2">
            <SkeletonBox className="h-10 rounded-lg" />
            <div className="space-y-3 px-1 pb-3">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
}

// Dashboard page skeleton
export function DashboardSkeleton() {
    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto" role="status" aria-label="Loading dashboard">
            <span className="sr-only">Loading dashboard content...</span>
            <div className="p-3 sm:p-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <SkeletonText width="w-48" height="h-6" className="mb-2" />
                        <SkeletonText width="w-32" height="h-4" />
                    </div>
                    <SkeletonBox className="w-28 h-10 rounded-lg" />
                </div>

                {/* Filters skeleton */}
                <div className="flex gap-2 mb-4">
                    <SkeletonBox className="w-20 h-10 rounded-lg" />
                    <SkeletonBox className="w-28 h-10 rounded-lg" />
                    <SkeletonBox className="w-20 h-10 rounded-lg" />
                </div>

                {/* Stats grid skeleton */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <SkeletonStatsCard />
                    <SkeletonStatsCard />
                    <SkeletonStatsCard />
                    <SkeletonStatsCard />
                </div>

                {/* Pipeline summary skeleton */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {[1, 2, 3, 4].map(i => (
                        <SkeletonBox key={i} className="flex-shrink-0 w-36 h-14 rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Pipeline columns skeleton */}
            <div className="p-3 sm:p-4">
                <SkeletonText width="w-32" height="h-5" className="mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <SkeletonPipelineColumn />
                    <SkeletonPipelineColumn />
                    <SkeletonPipelineColumn />
                    <SkeletonPipelineColumn />
                </div>
            </div>
        </div>
    );
}

// Quotes page skeleton
export function QuotesSkeleton() {
    return (
        <div className="flex-1 overflow-hidden flex flex-col" role="status" aria-label="Loading quotes">
            <span className="sr-only">Loading quotes...</span>
            {/* Header skeleton */}
            <div className="p-3 sm:p-4 border-b border-dark-border bg-dark-card">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div>
                        <SkeletonText width="w-24" height="h-6" className="mb-2" />
                        <SkeletonText width="w-32" height="h-4" />
                    </div>
                    <SkeletonBox className="w-28 h-10 rounded-lg" />
                </div>
                <SkeletonBox className="w-full h-11 rounded-lg mb-3" />
                <div className="flex gap-2 mb-3">
                    <SkeletonBox className="w-28 h-10 rounded-lg" />
                    <SkeletonBox className="w-36 h-10 rounded-lg" />
                    <SkeletonBox className="w-20 h-10 rounded-lg" />
                </div>
            </div>

            {/* Table skeleton */}
            <div className="hidden md:block flex-1 overflow-auto p-4">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs text-gray-500 border-b border-dark-border">
                            {['Quote #', 'Client', 'Project', 'Prepared By', 'Date', 'Value', 'Status', 'Tags', ''].map((header, i) => (
                                <th key={i} className="pb-3 pr-4">
                                    <SkeletonText width="w-16" height="h-3" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map(i => (
                            <SkeletonTableRow key={i} columns={9} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile card skeleton */}
            <div className="md:hidden flex-1 overflow-auto p-3 space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}

// Clients page skeleton
export function ClientsSkeleton() {
    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-3 sm:p-6" role="status" aria-label="Loading clients">
            <span className="sr-only">Loading clients...</span>
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <SkeletonText width="w-40" height="h-7" className="mb-2" />
                    <SkeletonText width="w-48" height="h-4" />
                </div>
                <div className="flex gap-2">
                    <SkeletonBox className="w-48 h-11 rounded-lg" />
                    <SkeletonBox className="w-28 h-11 rounded-lg" />
                </div>
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="card">
                        <SkeletonText width="w-24" height="h-3" className="mb-2" />
                        <SkeletonText width="w-16" height="h-7" />
                    </div>
                ))}
            </div>

            {/* Client cards skeleton */}
            <SkeletonText width="w-20" height="h-5" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="card">
                        <div className="flex items-start gap-3 mb-4">
                            <SkeletonBox className="w-10 h-10 rounded" />
                            <div className="flex-1">
                                <SkeletonText width="w-32" height="h-5" className="mb-1" />
                                <SkeletonText width="w-20" height="h-3" />
                            </div>
                        </div>
                        <SkeletonText width="w-full" height="h-3" className="mb-4" />
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                            <div>
                                <SkeletonText width="w-12" height="h-3" className="mb-1" />
                                <SkeletonText width="w-16" height="h-4" />
                            </div>
                            <div>
                                <SkeletonText width="w-12" height="h-3" className="mb-1" />
                                <SkeletonText width="w-10" height="h-4" />
                            </div>
                            <div className="text-right">
                                <SkeletonText width="w-12" height="h-3" className="mb-1 ml-auto" />
                                <SkeletonText width="w-8" height="h-4" className="ml-auto" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default {
    SkeletonBox,
    SkeletonText,
    SkeletonCard,
    SkeletonStatsCard,
    SkeletonTableRow,
    SkeletonPipelineColumn,
    DashboardSkeleton,
    QuotesSkeleton,
    ClientsSkeleton,
};
