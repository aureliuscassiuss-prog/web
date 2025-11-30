import { NavLink } from 'react-router-dom'
import { Home, BarChart3, Upload, ShieldCheck, Library, Sun, Moon, Bot } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
    isMobileMenuOpen?: boolean
    onMobileMenuClose?: () => void
    isDark: boolean
    toggleTheme: () => void
    spotlight?: string | null
}

export default function Sidebar({ onMobileMenuClose, isDark, toggleTheme, spotlight }: SidebarProps) {
    const { user } = useAuth()

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/resources', label: 'Browse Resources', icon: Library, id: 'browse-resources' },
        { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
        { path: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
        { path: '/uploads', label: 'My Uploads', icon: Upload },
    ]

    if (user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: ShieldCheck })
    }

    // Common classes for links - Professional, subtle styling
    const linkClass = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
    const activeClass = "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
    const inactiveClass = "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100"

    return (
        <nav className="h-full w-full py-2 flex flex-col justify-between">
            <div className="space-y-6">
                {/* Main Navigation */}
                <div>
                    <div className={`text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2 px-3 tracking-wider transition-opacity duration-300 ${spotlight ? 'opacity-30' : 'opacity-100'}`}>
                        Menu
                    </div>
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isSpotlighted = spotlight === item.id
                            const shouldFade = spotlight && !isSpotlighted

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={onMobileMenuClose}
                                    className={({ isActive }) =>
                                        `${linkClass} ${isActive ? activeClass : inactiveClass} transition-all duration-300 ${shouldFade ? 'opacity-30' : 'opacity-100'
                                        } ${isSpotlighted
                                            ? 'shadow-lg shadow-gray-400/50 dark:shadow-gray-600/50 scale-105 ring-2 ring-gray-300 dark:ring-gray-700'
                                            : ''
                                        }`
                                    }
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </NavLink>
                            )
                        })}
                    </div>
                </div>

                {/* Resources Section Removed as per request */}
            </div>

            {/* Footer - Theme Toggle */}
            <div className={`pt-4 border-t border-gray-200 dark:border-gray-800 transition-opacity duration-300 ${spotlight ? 'opacity-30' : 'opacity-100'}`}>
                <button
                    onClick={toggleTheme}
                    className={`w-full ${linkClass} ${inactiveClass} justify-between`}
                >
                    <div className="flex items-center gap-3">
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                </button>
            </div>
        </nav>
    )
}
