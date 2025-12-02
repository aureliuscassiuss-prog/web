import { NavLink } from 'react-router-dom';
import {
    Home,
    BarChart3,
    Upload,
    ShieldCheck,
    Library,
    Sun,
    Moon,
    Bot,
    User,
    Sparkles,
    GraduationCap,
    FileText,
    Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    isMobileMenuOpen?: boolean;
    onMobileMenuClose?: () => void;
    isDark: boolean;
    toggleTheme: () => void;
    spotlight?: string | null;
}

export default function Sidebar({ onMobileMenuClose, isDark, toggleTheme, spotlight }: SidebarProps) {
    const { user } = useAuth();

    // Helper to check if user has any admin role
    const hasAdminRole = user?.role && ['admin', 'semi-admin', 'content-reviewer', 'structure-manager'].includes(user.role);

    // Get admin panel label based on role
    const getAdminLabel = () => {
        if (user?.role === 'admin') return 'Admin Panel';
        if (user?.role === 'semi-admin') return 'Admin Panel';
        if (user?.role === 'content-reviewer') return 'Content Review';
        if (user?.role === 'structure-manager') return 'Structure Manager';
        return 'Admin Panel';
    };

    // Grouping items creates a better visual hierarchy
    const menuGroups = [
        {
            label: "Platform",
            items: [
                { path: '/', label: 'Home', icon: Home },
                { path: '/resources', label: 'Resources', icon: Library, id: 'browse-resources' },
                { path: '/cgpa-calculator', label: 'CGPA Calculator', icon: Calculator },
                { path: '/preparation', label: 'Preparation', icon: GraduationCap },
                { path: '/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'New' },
                { path: '/ai-papers', label: 'AI Papers', icon: FileText, badge: 'Beta' },
                { path: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
            ]
        },
        {
            label: "Account",
            items: [
                { path: '/uploads', label: 'My Uploads', icon: Upload },
                { path: '/profile', label: 'Profile Settings', icon: User },
                ...(hasAdminRole ? [{ path: '/admin', label: getAdminLabel(), icon: ShieldCheck }] : [])
            ]
        }
    ];

    // Shared styles
    const baseLinkClass = "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200";

    // Active: Blue accent background with blue text
    const activeLinkClass = "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900";

    // Inactive: Gray text, subtle hover
    const inactiveLinkClass = "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200";

    return (
        <nav className="h-full w-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
            {/* NEW Wrapper for all scrollable content (Menu Groups + Footer) */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">

                {/* Scrollable Navigation Area (Original Content) */}
                <div className="py-6 px-4 space-y-8">
                    {menuGroups.map((group, groupIndex) => (
                        <div
                            key={group.label}
                            className={`space-y-2 transition-opacity duration-300 ${spotlight ? 'opacity-30' : 'opacity-100'}`}
                        >
                            <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                {group.label}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isSpotlighted = spotlight === item.id;

                                    // Override opacity if this specific item is the spotlight target
                                    const itemOpacity = spotlight
                                        ? (isSpotlighted ? 'opacity-100' : 'opacity-30')
                                        : 'opacity-100';

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={onMobileMenuClose}
                                            className={({ isActive }) => `
                                                ${baseLinkClass} 
                                                ${isActive ? activeLinkClass : inactiveLinkClass}
                                                ${itemOpacity}
                                                ${isSpotlighted ? 'scale-105 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500 dark:ring-blue-400 z-10 bg-white dark:bg-gray-900' : ''}
                                            `}
                                        >
                                            <Icon className={`w-4 h-4 transition-colors ${spotlight === item.id ? 'text-blue-500' : ''}`} />
                                            <span className="flex-1">{item.label}</span>

                                            {/* Optional Badge for AI Assistant or new features */}
                                            {item.badge && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm">
                                                    <Sparkles className="w-2 h-2" />
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer - Theme Toggle (Now inside the scrollable wrapper) */}
                <div className={`mt-auto p-4 border-t border-gray-200 dark:border-gray-800 transition-opacity duration-300 ${spotlight ? 'opacity-30' : 'opacity-100'}`}>
                    <button
                        onClick={toggleTheme}
                        className="group flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-orange-100 text-orange-500'}`}>
                                {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                            </div>
                            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>

                        {/* Visual Toggle Switch */}
                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
}