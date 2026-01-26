import { NavLink } from 'react-router-dom';
import {
    Home,
    BarChart3,
    Upload,
    ShieldCheck,
    Library,
    Video,
    Sun,
    Moon,
    Bot,
    User,
    Sparkles,
    GraduationCap,
    FileText,
    Calculator,
    Bookmark,
    CheckCircle2,
    Timer,
    MessageCircle
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

    interface MenuItem {
        path: string;
        label: string;
        icon: any;
        id?: string;
        badge?: string;
    }

    interface MenuGroup {
        label: string;
        items: MenuItem[];
    }

    // Grouping items into logical categories for better discoverability
    const menuGroups: MenuGroup[] = [
        {
            label: "General",
            items: [
                { path: '/', label: 'Home', icon: Home },
                { path: '/resources', label: 'Resources', icon: Library, id: 'browse-resources' },
            ]
        },
        {
            label: "Academic",
            items: [
                { path: '/preparation', label: 'Preparation', icon: GraduationCap },
                { path: '/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'New' },
                { path: '/ai-papers', label: 'AI Papers', icon: FileText, badge: 'Beta' },
                { path: '/attendance', label: 'Attendance', icon: CheckCircle2 },
                { path: '/cgpa-calculator', label: 'CGPA Calculator', icon: Calculator },
                { path: '/pomodoro', label: 'Pomodoro Timer', icon: Timer, badge: 'New' },
                { path: '/pdf-generator', label: 'AI PDF', icon: FileText, badge: 'AI' },
                { path: '/medical-generator', label: 'Medical Generator', icon: FileText, badge: 'New' },
            ]
        },
        {
            label: "Social",
            items: [
                { path: '/chat', label: 'Group Chat (GC)', icon: MessageCircle, badge: 'Live' },
                { path: '/video-chat', label: 'Omex', icon: Video, badge: 'New' },
                { path: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
            ]
        },
        {
            label: "Profile",
            items: [
                { path: '/profile', label: 'Profile Settings', icon: User },
                { path: '/uploads', label: 'My Uploads', icon: Upload },
                { path: '/saved-resources', label: 'Saved Resources', icon: Bookmark },
                ...(hasAdminRole ? [{ path: '/admin', label: getAdminLabel(), icon: ShieldCheck }] : [])
            ]
        }
    ];

    // Shared styles
    const baseLinkClass = "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200";

    // Active: Blue accent background with blue text
    const activeLinkClass = "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900";

    // Inactive: Gray text, subtle hover
    const inactiveLinkClass = "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-gray-200";

    return (
        <nav className="h-full w-full flex flex-col bg-white dark:bg-black">
            {/* NEW Wrapper for all scrollable content (Menu Groups + Footer) */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 pb-24">

                {/* Scrollable Navigation Area (Original Content) */}
                <div className="py-6 px-4 space-y-8">
                    {menuGroups.map((group) => (
                        <div
                            key={group.label}
                            className={`space - y - 2 transition - opacity duration - 300 ${spotlight ? 'opacity-30' : 'opacity-100'} `}
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
                                            <Icon className={`w - 4 h - 4 transition - colors ${spotlight === item.id ? 'text-blue-500' : ''} `} />
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

                {/* Footer - Theme Toggle */}
                <div className={`mt-auto p-4 border-t border-gray-200 dark:border-gray-800 transition-opacity duration-300 ${spotlight ? 'opacity-30' : 'opacity-100'}`}>
                    <button
                        onClick={toggleTheme}
                        className="group flex w-full items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-200"
                    >
                        <div className="flex items-center gap-2">
                            {isDark ? <Moon className="w-4 h-4 text-purple-500" /> : <Sun className="w-4 h-4 text-orange-500" />}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Dark Mode
                            </span>
                        </div>

                        {/* Visual Toggle Switch (After text) */}
                        <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 flex-shrink-0 ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
}

