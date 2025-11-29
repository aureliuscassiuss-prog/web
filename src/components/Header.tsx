import { Search, Upload, Sun, Moon, LogIn, Menu } from 'lucide-react'
import { getAvatarComponent } from '../data/premiumAvatars'

interface HeaderProps {
    onUploadClick: () => void
    onAuthClick: () => void
    onProfileClick?: () => void
    onMobileMenuToggle?: () => void
    searchQuery?: string
    onSearchChange?: (query: string) => void
    user: { name: string; email: string; avatar?: string } | null
    isDark: boolean
    toggleTheme: () => void
}

export default function Header({ onUploadClick, onAuthClick, onProfileClick, onMobileMenuToggle, searchQuery = '', onSearchChange, user, isDark, toggleTheme }: HeaderProps) {
    const AvatarComponent = user?.avatar ? getAvatarComponent(user.avatar) : null

    return (
        <header className="h-16 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 transition-colors duration-200">
            {/* Mobile Menu Button */}
            <button
                onClick={onMobileMenuToggle}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-md relative mx-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder="Search notes, papers, authors..."
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white placeholder-gray-500"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onUploadClick}
                    className="btn bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-0"
                >
                    <Upload className="w-[18px] h-[18px]" />
                    Upload
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {user ? (
                    <button
                        onClick={onProfileClick}
                        className="flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Student</div>
                        </div>
                        {AvatarComponent ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black dark:border-white shadow-lg">
                                <AvatarComponent className="w-full h-full" />
                            </div>
                        ) : user.avatar && user.avatar.length > 20 ? (
                            // Assuming custom avatars are long URLs/Base64 strings
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black dark:border-white shadow-lg">
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-semibold shadow-lg">
                                {user.name[0]}
                            </div>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={onAuthClick}
                        className="btn bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-0 shadow-lg"
                    >
                        <LogIn className="w-[18px] h-[18px]" />
                        Sign In
                    </button>
                )}
            </div>
        </header>
    )
}
