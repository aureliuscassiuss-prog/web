// Reusable Skeleton Loading Components

export function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            </div>
        </div>
    );
}

export function SkeletonStat() {
    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                    </div>
                    <div className="w-16 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="w-full min-h-[calc(100vh-80px)] pb-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
            {/* Hero Section Skeleton */}
            <div className="relative mt-4 sm:mt-6 overflow-hidden rounded-3xl bg-white/60 dark:bg-gray-900/30 backdrop-blur-xl border border-gray-100/30 dark:border-gray-800/30 shadow-2xl mb-6 animate-pulse">
                <div className="relative p-5 sm:p-6 lg:p-10">
                    {/* Top Row */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                            <div className="space-y-2">
                                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-40"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24 ml-auto"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                        </div>
                    </div>
                    {/* Greeting */}
                    <div className="space-y-3">
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
            </div>

            {/* Quick Actions Skeleton */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-100/40 dark:border-gray-700/40 animate-pulse"></div>
                    ))}
                </div>
            </div>

            {/* Banner Skeleton */}
            <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 rounded-2xl animate-pulse"></div>
        </div>
    );
}
