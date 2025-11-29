import { Search, Upload, Sun, Moon, LogIn } from 'lucide-react'

interface HeaderProps {
    onUploadClick: () => void
    onAuthClick: () => void
    user: { name: string; email: string } | null
    isDark: boolean
    toggleTheme: () => void
}

export default function Header({ onUploadClick, onAuthClick, user, isDark, toggleTheme }: HeaderProps) {
    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 flex items-center justify-between px-8 transition-colors duration-200">
            <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                    type="text"
                    placeholder="Search notes, papers, authors..."
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onUploadClick}
                    className="btn btn-outline dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    <Upload className="w-[18px] h-[18px]" />
                    Upload
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {user ? (
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Student</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-red-500/20">
                            {user.name[0]}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onAuthClick}
                        className="btn btn-primary shadow-lg shadow-red-500/20"
                    >
                        <LogIn className="w-[18px] h-[18px]" />
                        Sign In
                    </button>
                )}
            </div>
        </header>
    )
}
