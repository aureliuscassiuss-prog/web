import { Trophy, Medal, Crown, TrendingUp, User } from 'lucide-react'

interface LeaderboardUser {
    rank: number
    name: string
    points: number
    uploads: number
    avatar?: string
}

interface LeaderboardViewProps {
    leaderboard: LeaderboardUser[]
}

export default function LeaderboardView({ leaderboard }: LeaderboardViewProps) {
    // Sort just in case the data isn't sorted
    const sortedData = [...leaderboard].sort((a, b) => b.points - a.points);
    const topThree = sortedData.slice(0, 3);
    const runnersUp = sortedData.slice(3);

    if (leaderboard.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in duration-500">
                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-full mb-4">
                    <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Leaderboard Empty</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    No contributions yet. Upload resources to be the first one on the podium!
                </p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500">

            {/* Header */}
            <div className="text-center mb-10 md:mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-900/30 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
                    <Trophy className="w-3.5 h-3.5" />
                    Hall of Fame
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
                    Top Contributors
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-xl mx-auto">
                    Recognizing the students who help the community grow by sharing valuable study resources.
                </p>
            </div>

            {/* --- PODIUM SECTION --- */}
            {topThree.length > 0 && (
                <div className="relative mb-12">
                    {/* Desktop: 2 - 1 - 3 alignment | Mobile: 1 Top, 2-3 Grid Below */}
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 md:gap-8 lg:gap-12">

                        {/* Mobile: 1st Place shows first */}
                        <div className="md:hidden w-full max-w-[280px]">
                            <PodiumCard user={topThree[0]} place={1} />
                        </div>

                        {/* 2nd Place (Left on Desktop) */}
                        <div className="w-full md:w-auto md:flex-1 md:max-w-[240px] order-2 md:order-1 grid grid-cols-2 md:block gap-4 md:gap-0">
                            {/* On mobile, we wrap 2nd and 3rd in a grid container. This div handles the 2nd place logic */}
                            <div className="col-span-1">
                                {topThree[1] && <PodiumCard user={topThree[1]} place={2} />}
                            </div>
                            {/* Mobile only: 3rd place sits next to 2nd */}
                            <div className="col-span-1 md:hidden">
                                {topThree[2] && <PodiumCard user={topThree[2]} place={3} />}
                            </div>
                        </div>

                        {/* 1st Place (Center on Desktop) - Hidden on mobile here to avoid duplication */}
                        <div className="hidden md:block w-full md:w-auto md:flex-1 md:max-w-[280px] order-1 md:order-2 -mt-12 z-10">
                            <PodiumCard user={topThree[0]} place={1} />
                        </div>

                        {/* 3rd Place (Right on Desktop) */}
                        <div className="hidden md:block w-full md:w-auto md:flex-1 md:max-w-[240px] order-3">
                            {topThree[2] && <PodiumCard user={topThree[2]} place={3} />}
                        </div>
                    </div>
                </div>
            )}

            {/* --- LIST SECTION --- */}
            {runnersUp.length > 0 && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Honorable Mentions</h3>
                            <span className="text-xs font-medium text-gray-500">Rank 4 - {leaderboard.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {runnersUp.map((user, idx) => (
                                <div
                                    key={user.rank || idx + 4}
                                    className="group flex items-center gap-4 px-4 md:px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200"
                                >
                                    <div className="w-8 flex-shrink-0 text-center font-bold text-gray-400 dark:text-gray-500 text-sm">
                                        #{user.rank || idx + 4}
                                    </div>

                                    <div className="relative">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-gray-500 dark:text-gray-400 text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {user.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                                <TrendingUp className="w-3 h-3" />
                                                {user.uploads} Uploads
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                            {user.points.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Points</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- SUB-COMPONENT: Podium Card ---

function PodiumCard({ user, place }: { user: LeaderboardUser, place: number }) {
    // Config based on rank
    const config = {
        1: {
            bg: 'bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/10 dark:to-black',
            border: 'border-yellow-200 dark:border-yellow-500/30',
            ring: 'ring-yellow-400 dark:ring-yellow-500',
            iconColor: 'text-yellow-500',
            badgeBg: 'bg-yellow-500',
            height: 'h-auto md:h-72',
            avatarSize: 'w-20 h-20 md:w-28 md:h-28',
            titleSize: 'text-lg md:text-xl',
            pointsSize: 'text-2xl md:text-4xl',
            shadow: 'shadow-xl shadow-yellow-500/10'
        },
        2: {
            bg: 'bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/20 dark:to-black',
            border: 'border-slate-200 dark:border-slate-600/30',
            ring: 'ring-slate-300 dark:ring-slate-500',
            iconColor: 'text-slate-400',
            badgeBg: 'bg-slate-400',
            height: 'h-auto md:h-60',
            avatarSize: 'w-16 h-16 md:w-20 md:h-20',
            titleSize: 'text-base md:text-lg',
            pointsSize: 'text-xl md:text-2xl',
            shadow: 'shadow-lg shadow-slate-500/10'
        },
        3: {
            bg: 'bg-gradient-to-b from-orange-50 to-white dark:from-orange-900/10 dark:to-black',
            border: 'border-orange-200 dark:border-orange-700/30',
            ring: 'ring-orange-300 dark:ring-orange-600',
            iconColor: 'text-orange-500',
            badgeBg: 'bg-orange-500',
            height: 'h-auto md:h-52',
            avatarSize: 'w-16 h-16 md:w-20 md:h-20',
            titleSize: 'text-base md:text-lg',
            pointsSize: 'text-xl md:text-2xl',
            shadow: 'shadow-lg shadow-orange-500/10'
        }
    }[place] || config[3]; // Fallback to 3rd style if needed

    return (
        <div className={`
            relative flex flex-col items-center justify-end w-full rounded-2xl border ${config.border} ${config.bg} ${config.shadow} 
            ${config.height} p-4 md:p-6 transition-all duration-300 hover:-translate-y-1
        `}>
            {/* Crown for 1st Place */}
            {place === 1 && (
                <div className="absolute -top-5 md:-top-6 animate-bounce">
                    <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-400" />
                </div>
            )}

            {/* Avatar Section */}
            <div className="relative mb-3 md:mb-6 mt-4 md:mt-0">
                <div className={`rounded-full ${config.ring} ring-4 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A] ${config.avatarSize} flex items-center justify-center bg-gray-200 dark:bg-gray-800 shadow-sm overflow-hidden`}>
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className={`w-1/2 h-1/2 ${config.iconColor}`} />
                    )}
                </div>
                <div className={`
                    absolute -bottom-3 left-1/2 -translate-x-1/2 ${config.badgeBg} text-white 
                    w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white dark:border-gray-900
                `}>
                    {place}
                </div>
            </div>

            {/* Text Content */}
            <div className="text-center w-full">
                <h3 className={`font-bold text-gray-900 dark:text-white truncate w-full ${config.titleSize}`}>
                    {user.name}
                </h3>
                <div className={`font-black tracking-tight text-gray-900 dark:text-white ${config.pointsSize} my-1`}>
                    {user.points.toLocaleString()}
                </div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {user.uploads} Contributions
                </p>
            </div>
        </div>
    )
}