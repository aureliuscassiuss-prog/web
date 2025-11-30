import { Trophy } from 'lucide-react'

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
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Top Contributors</h2>
                    <p className="text-gray-600 dark:text-gray-400">Students making a difference by sharing knowledge</p>
                </div>

                {/* Podium - Top 3 */}
                {leaderboard.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 mb-12 px-4">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center flex-1 max-w-[200px]">
                            <div className="relative mb-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                    {leaderboard[1]?.avatar ? (
                                        <img src={leaderboard[1].avatar} alt={leaderboard[1].name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        leaderboard[1]?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                                    2
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-2xl p-6 w-full text-center border-2 border-gray-300 dark:border-gray-700 h-32">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{leaderboard[1]?.name}</h3>
                                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{leaderboard[1]?.points || 0}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboard[1]?.uploads || 0} uploads</p>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center flex-1 max-w-[220px] -mt-8">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl font-bold text-white shadow-2xl ring-4 ring-yellow-200 dark:ring-yellow-900">
                                    {leaderboard[0]?.avatar ? (
                                        <img src={leaderboard[0].avatar} alt={leaderboard[0].name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        leaderboard[0]?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                    <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                    1
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-t-2xl p-6 w-full text-center border-2 border-yellow-400 dark:border-yellow-600 h-40">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 truncate text-lg">{leaderboard[0]?.name}</h3>
                                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{leaderboard[0]?.points || 0}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{leaderboard[0]?.uploads || 0} uploads</p>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center flex-1 max-w-[200px]">
                            <div className="relative mb-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                    {leaderboard[2]?.avatar ? (
                                        <img src={leaderboard[2].avatar} alt={leaderboard[2].name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        leaderboard[2]?.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                                    3
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-t-2xl p-6 w-full text-center border-2 border-amber-400 dark:border-amber-700 h-32">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{leaderboard[2]?.name}</h3>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{leaderboard[2]?.points || 0}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboard[2]?.uploads || 0} uploads</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rest of the leaderboard */}
                {leaderboard.length > 3 && (
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-4">Other Contributors</h3>
                        <div className="space-y-2">
                            {leaderboard.slice(3).map((user, index) => (
                                <div
                                    key={user.rank || index}
                                    className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-400">
                                        {user.rank || index + 4}
                                    </div>
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.uploads || 0} uploads</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{user.points || 0}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
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
