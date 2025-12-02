import { useState, useEffect, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    BookOpen,
    TrendingUp,
    Sparkles,
    Trophy,
    Upload,
    FileText,
    Calculator,
    Bot,
    ChevronRight,
    Star,
    Zap,
    Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarComponent } from '../data/premiumAvatars';

// --- Sub-components to optimize performance ---
// 1. Time Component (Prevents full dashboard re-render every second)
const TimeDisplay = memo(() => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 mb-0.5 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 dark:border-black/20">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wide">{formatDate(currentTime)}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-mono tracking-tight -mb-1">
                {formatTime(currentTime)}
            </div>
        </div>
    );
});

// 2. Stat Card Component
const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) => (
    <div className="relative group bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-100/40 dark:border-gray-700/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-black/10 rounded-2xl -z-10" />
        <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${color.replace('text-', 'from-')} to-gray-100 dark:to-gray-700/50 border border-white/30 dark:border-gray-600/30`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {value}
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
            {label}
        </div>
    </div>
);

// 3. Action Card Component
const ActionCard = ({ action }: { action: any }) => (
    <Link
        to={action.link}
        className="group relative flex items-center p-4 bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-100/40 dark:border-gray-700/40 hover:border-blue-200/60 dark:hover:border-blue-800/60 transition-all duration-300 active:scale-[0.98] hover:shadow-md"
    >
        {/* Gradient Background on Hover */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        {/* Icon Container */}
        <div className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl ${action.bgColor} mr-3 sm:mr-4 group-hover:scale-105 transition-transform duration-300 border border-white/30 dark:border-gray-600/30 overflow-hidden`}>
            <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white z-10 relative" />
            {/* Subtle color glow behind icon */}
            <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${action.color} rounded-xl blur-sm`} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                    {action.title}
                </h4>
                {action.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${action.color} text-white shadow-sm border border-white/20`}>
                        {action.badge}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-relaxed">
                {action.description}
            </p>
        </div>

        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 ml-2" />
    </Link>
);

export default function Dashboard() {
    const { user } = useAuth();
    const AvatarComponent = user?.avatar ? getAvatarComponent(user.avatar) : null;
    const [greeting, setGreeting] = useState('');
    const [stats, setStats] = useState([
        { label: 'Resources', value: '...', icon: BookOpen, color: 'text-blue-500' },
        { label: 'Users', value: '...', icon: TrendingUp, color: 'text-green-500' },
        { label: 'Queries', value: '10k+', icon: Sparkles, color: 'text-purple-500' },
        { label: 'Papers', value: '3k+', icon: FileText, color: 'text-orange-500' }
    ]);

    // Fetch real stats from database
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats([
                        { label: 'Resources', value: `${data.totalResources || 0}+`, icon: BookOpen, color: 'text-blue-500' },
                        { label: 'Users', value: `${data.totalUsers || 0}+`, icon: TrendingUp, color: 'text-green-500' },
                        { label: 'Queries', value: '10k+', icon: Sparkles, color: 'text-purple-500' },
                        { label: 'Papers', value: '3k+', icon: FileText, color: 'text-orange-500' }
                    ]);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    // Quick action configuration
    const quickActions = [
        {
            title: 'Browse Resources',
            description: 'Notes & materials',
            icon: BookOpen,
            link: '/resources',
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50/70 dark:bg-blue-900/20'
        },
        {
            title: 'AI Assistant',
            description: 'Get instant help',
            icon: Bot,
            link: '/ai-assistant',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50/70 dark:bg-purple-900/20',
            badge: 'New'
        },
        {
            title: 'CGPA Calculator',
            description: 'Calculate CGPA',
            icon: Calculator,
            link: '/cgpa-calculator',
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50/70 dark:bg-green-900/20'
        },
        {
            title: 'AI Papers',
            description: 'Practice exams',
            icon: FileText,
            link: '/ai-papers',
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-50/70 dark:bg-orange-900/20',
            badge: 'Beta'
        },
        {
            title: 'Leaderboard',
            description: 'Top contributors',
            icon: Trophy,
            link: '/leaderboard',
            color: 'from-yellow-500 to-amber-500',
            bgColor: 'bg-yellow-50/70 dark:bg-yellow-900/20'
        },
        {
            title: 'Uploads',
            description: 'Your files',
            icon: Upload,
            link: '/uploads',
            color: 'from-indigo-500 to-blue-500',
            bgColor: 'bg-indigo-50/70 dark:bg-indigo-900/20'
        }
    ];

    return (
        <div className="w-full min-h-[calc(100vh-80px)] pb-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
            {/* --- Hero Section --- */}
            <div className="relative mt-4 sm:mt-6 overflow-hidden rounded-3xl bg-white/60 dark:bg-gray-900/30 backdrop-blur-xl border border-gray-100/30 dark:border-gray-800/30 shadow-2xl shadow-blue-500/10 dark:shadow-purple-500/10 mb-6">
                {/* Enhanced Gradient Mesh Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/40 to-pink-50/80 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />
                <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-bl from-blue-200/30 to-transparent dark:from-blue-800/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-tr from-purple-200/30 to-transparent dark:from-purple-800/10 blur-3xl" />
                <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-r from-yellow-300/20 to-orange-300/20 rounded-full blur-xl opacity-50" />

                {/* Content */}
                <div className="relative p-5 sm:p-6 lg:p-10">
                    {/* Top Row: Logo + Time */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {/* Logo */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0 group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                                <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/80 dark:bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl overflow-hidden border-2 border-white/40 dark:border-gray-600/40 ring-1 ring-blue-200/30 dark:ring-purple-800/20">
                                    {AvatarComponent ? (
                                        <AvatarComponent className="w-full h-full" />
                                    ) : user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-black text-xl sm:text-2xl lg:text-3xl">{user?.name?.[0] || 'E'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate">
                                    Extrovert
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    Your Academic Companion
                                </p>
                            </div>
                        </div>

                        {/* Time */}
                        <TimeDisplay />
                    </div>

                    {/* Greeting */}
                    <div className="space-y-2 sm:space-y-3">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                            {greeting}, <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{user?.name || 'Student'}</span>!
                        </h2>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                            Ready to ace your studies today? 🚀
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                        Quick Actions
                    </h3>
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {quickActions.map((action) => (
                        <ActionCard key={action.title} action={action} />
                    ))}
                </div>
            </div>

            {/* Motivational Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 p-5 sm:p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/20 dark:shadow-purple-500/20 border border-white/10">
                {/* Enhanced Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.08)_25%,rgba(255,255,255,.08)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.08)_75%,rgba(255,255,255,.08))] bg-[length:40px_40px] opacity-30" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,.1),transparent_50%)] opacity-50" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-300 text-yellow-300" />
                            <span className="text-xs font-bold uppercase tracking-wider">Pro Tip</span>
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 leading-tight">
                            Consistency is the key to success!
                        </h3>
                        <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                            Study daily and use our AI assistant when stuck!
                        </p>
                    </div>
                    <Link
                        to="/ai-assistant"
                        className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-2 bg-white/95 dark:bg-black/20 text-blue-600 dark:text-white rounded-xl font-bold text-sm hover:bg-white/100 dark:hover:bg-black/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 backdrop-blur-sm border border-white/20"
                    >
                        Try AI Assistant
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}