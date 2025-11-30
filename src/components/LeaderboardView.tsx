import { Trophy, Medal } from 'lucide-react'

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
    if (leaderboard.length === 0) {
        return (
            <div className="animate-fade-in px-4 md:px-8 py-6">
                <div className="max-w-6xl mx-auto text-center py-16">
                    <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No contributors yet. Be the first!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in px-4 md:px-8 py-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 md:mb-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg shadow-orange-500/30">
                        <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Top Contributors</h2>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Students making a difference</p>
                </div>

                {/* Top 3 Section */}
                {leaderboard.length >= 3 && (
                    /* 
                       Layout Strategy: 
                       Mobile: Grid with 2 columns. 1st place spans 2 columns (full width). 2nd/3rd share a row.
                       Desktop: Flex row with 'items-end' to create the podium steps effect.
                    */
                    <div className="grid grid-cols-2 md:flex md:items-end md:justify-center gap-4 md:gap-6 mb-12 max-w-2xl mx-auto md:max-w-none">

                        {/* 2nd Place */}
                        <div className="col-span-1 order-2 md:order-1 flex flex-col items-center md:flex-1 md:max-w-[220px]">
                            <div className="relative mb-3 md:mb-4">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-800">
                                    {leaderboard[1]?.avatar ? (
                                        <img src={leaderboard[1].avatar} alt={leaderboard[1].name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        leaderboard[1]?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-500 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                                    2
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 w-full text-center border border-gray-200 dark:border-gray-700 md:bg-gradient-to-br md:from-gray-100 md:to-gray-200 md:dark:from-gray-800 md:dark:to-gray-900 md:rounded-t-2xl md:rounded-b-none md:border-2 md:border-b-0 md:h-32">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate text-sm md:text-base">{leaderboard[1]?.name}</h3>
                                <p className="text-lg md:text-2xl font-bold text-gray-700 dark:text-gray-300">{leaderboard[1]?.points}</p>
                                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{leaderboard[1]?.uploads} uploads</p>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="col-span-2 order-1 md:order-2 flex flex-col items-center md:flex-1 md:max-w-[240px] md:-mt-8 mb-4 md:mb-0">
                            <div className="relative mb-3 md:mb-4">
                                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl md:text-4xl font-bold text-white shadow-xl ring-4 ring-yellow-100 dark:ring-yellow-900/30">
                                    {leaderboard[0]?.avatar ? (
                                        <img src={leaderboard[0].avatar} alt={leaderboard[0].name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        leaderboard[0]?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2">
                                    <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 fill-yellow-400 drop-shadow-sm" />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg shadow-lg ring-2 ring-white dark:ring-gray-800">
                                    1
                                </div>
                            </div>
                            <div className="bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/10 dark:to-gray-900 rounded-xl p-6 w-full text-center border border-yellow-200 dark:border-yellow-700/30 md:bg-gradient-to-br md:from-yellow-50 md:to-orange-50 md:dark:from-yellow-900/20 md:dark:to-orange-900/20 md:rounded-t-2xl md:rounded-b-none md:border-2 md:border-yellow-400 md:dark:border-yellow-600 md:border-b-0 md:h-44 shadow-sm md:shadow-none">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 truncate text-base md:text-xl">{leaderboard[0]?.name}</h3>
                                <p className="text-2xl md:text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{leaderboard[0]?.points}</p>
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{leaderboard[0]?.uploads} uploads</p>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="col-span-1 order-3 md:order-3 flex flex-col items-center md:flex-1 md:max-w-[220px]">
                            <div className="relative mb-3 md:mb-4">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-800">
                                    {leaderboard[2]?.avatar ? (
                                        <img src={leaderboard[2].avatar} alt={leaderboard[2].name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        leaderboard[2]?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                                    3
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 w-full text-center border border-gray-200 dark:border-gray-700 md:bg-gradient-to-br md:from-amber-50 md:to-amber-100 md:dark:from-amber-900/20 md:dark:to-amber-800/20 md:rounded-t-2xl md:rounded-b-none md:border-2 md:border-b-0 md:border-amber-400 md:dark:border-amber-700 md:h-32">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate text-sm md:text-base">{leaderboard[2]?.name}</h3>
                                <p className="text-lg md:text-2xl font-bold text-amber-700 dark:text-amber-500">{leaderboard[2]?.points}</p>
                                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{leaderboard[2]?.uploads} uploads</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rest of the leaderboard */}
                {leaderboard.length > 3 && (
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-2 md:px-4">Other Contributors</h3>
                        <div className="space-y-3">
                            {leaderboard.slice(3).map((user, index) => (
                                <div
                                    key={user.rank || index}
                                    className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-800 font-bold text-gray-500 dark:text-gray-400 text-sm md:text-base group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {user.rank || index + 4}
                                    </div>
                                    <div className="relative">
                                        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-sm md:text-base shadow-sm">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate">{user.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.uploads || 0} uploads</p>
                                    </div>
                                    <div className="text-right pl-2">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-none">{user.points || 0}</span>
                                            <span className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wide mt-1">pts</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}