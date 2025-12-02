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
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 mb-0.5 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">{formatDate(currentTime)}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">
                {formatTime(currentTime)}
            </div>
        </div>
    );
});

// 2. Stat Card Component
const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="relative group bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${color.replace('text-', 'text-opacity-100 ')}`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            {label}
        </div>
    </div>
);

// 3. Action Card Component
const ActionCard = ({ action }) => (
    <Link
        to={action.link}
        className="group relative flex items-center p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 active:scale-[0.98]">
        {/* Gradient Background on Hover */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

        {/* Icon Container */}
        <div className={`relative shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${action.bgColor} mr-4 group-hover:scale-105 transition-transform duration-300`}>
            <action.icon className="w-6 h-6 text-gray-700 dark:text-white z-10" />
            {/* Subtle color glow behind icon */}
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${action.color} rounded-xl`} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {action.title}
                </h4>
                {action.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${action.color} text-white shadow-sm`}>
                        {action.badge}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {action.description}
            </p>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
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
                        { label: 'Resources', value: `${data.totalResources}+`, icon: BookOpen, color: 'text-blue-500' },
                        { label: 'Users', value: `${data.totalUsers}+`, icon: TrendingUp, color: 'text-green-500' },
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
            bgColor: 'bg-blue-50 dark:bg-blue-900/30'
        },
        {
            title: 'AI Assistant',
            description: 'Get instant help',
            icon: Bot,
            link: '/ai-assistant',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/30',
            badge: 'New'
        },
        {
            title: 'CGPA Calculator',
            description: 'Calculate CGPA',
            icon: Calculator,
            link: '/cgpa-calculator',
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50 dark:bg-green-900/30'
        },
        {
            title: 'AI Papers',
            description: 'Practice exams',
            icon: FileText,
            link: '/ai-papers',
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-50 dark:bg-orange-900/30',
            badge: 'Beta'
        },
        {
            title: 'Leaderboard',
            description: 'Top contributors',
            icon: Trophy,
            link: '/leaderboard',
            color: 'from-yellow-500 to-amber-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/30'
        },
        {
            title: 'Uploads',
            description: 'Your files',
            icon: Upload,
            link: '/uploads',
            color: 'from-indigo-500 to-blue-500',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900/30'
        }
    ];

    return (
        <div className="w-full min-h-[calc(100vh-80px)] pb-20 px-4 md:px-6 lg:px-8 overflow-x-hidden">

            {/* --- Hero Section --- */}
            <div className="relative mt-4 md:mt-6 overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-blue-900/5 mb-6">

                {/* Gradient Mesh Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/50 to-pink-50/80 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/30 to-transparent dark:from-blue-800/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-transparent dark:from-purple-800/10 blur-3xl" />

                {/* Content */}
                <div className="relative p-6 md:p-10">
                    {/* Top Row: Logo + Time */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                        {/* Logo */}
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0 group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20">
                                    {AvatarComponent ? (
                                        <AvatarComponent className="w-full h-full" />
                                    ) : user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-black text-2xl md:text-3xl">{user?.name?.[0] || 'E'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Extrovert
                                </h1>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    Your Academic Companion
                                </p>
                            </div>
                        </div>

                        {/* Time */}
                        <TimeDisplay />
                    </div>

                    {/* Greeting */}
                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                            {greeting}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">{user?.name || 'Student'}</span>!
                        </h2>
                        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium">
                            Ready to ace your studies today? 🚀
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        Quick Actions
                    </h3>
                    <Zap className="w-5 h-5 text-yellow-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quickActions.map((action) => (
                        <ActionCard key={action.title} action={action} />
                    ))}
                </div>
            </div>

            {/* Motivational Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 p-6 md:p-8 text-white shadow-xl">
                {/* Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05))] bg-[length:60px_60px] opacity-20" />

                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                            <span className="text-xs font-bold uppercase tracking-wider">Pro Tip</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-1">
                            Consistency is the key to success!
                        </h3>
                        <p className="text-blue-100 text-sm md:text-base">
                            Study daily and use our AI assistant when stuck!
                        </p>
                    </div>
                    <Link
                        to="/ai-assistant"
                        className="shrink-0 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                        Try AI Assistant
                        <Sparkles className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}