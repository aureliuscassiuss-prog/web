import { Home, BarChart3, BookOpen, GraduationCap } from 'lucide-react'

interface SidebarProps {
    currentView: string
    onViewChange: (view: string) => void
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
        { id: 'papers', label: 'AI Papers', icon: BookOpen },
    ]

    return (
        <aside className="w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 flex flex-col p-4 transition-colors duration-200">
            <div className="mb-8 px-2">
                <a href="#" className="flex items-center gap-3 font-bold text-xl text-gray-900 dark:text-white">
                    <GraduationCap className="w-8 h-8 text-red-600" />
                    <span>MediNotes</span>
                </a>
            </div>

            <nav className="flex-1">
                <div className="mb-6">
                    <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 px-3 tracking-wider">
                        Menu
                    </div>
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = currentView === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }
                `}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                <div>
                    <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 px-3 tracking-wider">
                        Program
                    </div>
                    <div className="px-3 py-2 text-gray-600 dark:text-gray-300 font-medium flex items-center">
                        <BookOpen className="w-5 h-5 mr-3" />
                        B.Tech
                    </div>
                    <div className="pl-11 mt-2 space-y-1">
                        <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block py-1 transition-colors">1st Year</button>
                        <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block py-1 transition-colors">CSE</button>
                    </div>
                </div>
            </nav>
        </aside>
    )
}
