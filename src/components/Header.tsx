import { LogIn, Menu } from 'lucide-react'
import { getAvatarComponent } from '../data/premiumAvatars'

interface HeaderProps {
    onUploadClick: () => void
    onAuthClick: () => void
    onProfileClick?: () => void
    onMobileMenuToggle?: () => void
    user: { name: string; email: string; avatar?: string } | null
}

export default function Header({ onUploadClick, onAuthClick, onProfileClick, onMobileMenuToggle, user }: HeaderProps) {
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

            {/* Desktop Logo - Hidden on Mobile */}
            <div className="hidden md:flex items-center gap-2">
                <img src="/LOGO.png" alt="Extrovert Logo" className="w-8 h-8 rounded-lg object-contain" />
                <span className="font-bold text-xl text-gray-900 dark:text-white">Extrovert</span>
            </div>

            <div className="flex items-center gap-4 ml-auto">
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
                        ) : user.avatar ? (
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
                        Login
                    </button>
                )}
            </div>
        </header>
    )
}
