import { NavLink } from 'react-router-dom'
import { Home, BarChart3, Upload, ShieldCheck, BookOpen, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { getSubjectsByBranchAndYear } from '../data/academicStructure'

interface SidebarProps {
    isMobileMenuOpen?: boolean
    onMobileMenuClose?: () => void
}

export default function Sidebar({ onMobileMenuClose }: SidebarProps) {
    const { user } = useAuth()
    const [isProgramOpen, setIsProgramOpen] = useState(true)

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
        { path: '/uploads', label: 'My Uploads', icon: Upload },
    ]

    if (user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: ShieldCheck })
    }

    // Common classes for links
    const linkClass = "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
    const activeClass = "bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 shadow-sm"
    const inactiveClass = "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"

    // Sub-item link styles
    const subLinkClass = "block w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ml-4 border-l border-gray-200 dark:border-gray-800 pl-4"
    const subActive = "text-gray-900 dark:text-white font-semibold border-l-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800/50"
    const subInactive = "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"

    // Get some example subjects to show in sidebar
    const firstYearSubjects = getSubjectsByBranchAndYear('cse', 1).slice(0, 3) // Show first 3 subjects from CSE 1st year

    return (
        <nav className="h-full w-full py-2 space-y-6">
            {/* Main Navigation */}
            <div>
                <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2 px-3 tracking-wider">
                    Menu
                </div>
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onMobileMenuClose}
                                className={({ isActive }) =>
                                    `${linkClass} ${isActive ? activeClass : inactiveClass}`
                                }
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    })}
                </div>
            </div>

            {/* Resources Section (Accordion Style) */}
            <div>
                <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2 px-3 tracking-wider">
                    Quick Links
                </div>
                {/* Collapsible Group */}
                <div className="space-y-1">
                    <button
                        onClick={() => setIsProgramOpen(!isProgramOpen)}
                        className={`w-full ${linkClass} ${inactiveClass} justify-between group`}
                    >
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4" />
                            <span>Popular Subjects</span>
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 opacity-50 transition-transform duration-300 ${isProgramOpen ? 'rotate-0' : '-rotate-90'
                                }`}
                        />
                    </button>

                    {/* Sub-items with animation - Dynamic subject links */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isProgramOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="space-y-1 mt-1">
                            {firstYearSubjects.map((subject) => (
                                <NavLink
                                    key={subject.id}
                                    to={`/resources/btech/1st-year/${subject.id}`}
                                    onClick={onMobileMenuClose}
                                    className={({ isActive }) => `${subLinkClass} ${isActive ? subActive : subInactive}`}
                                >
                                    {subject.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
