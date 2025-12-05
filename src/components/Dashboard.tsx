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
    Zap,
    Calendar,
    Sun,
    Moon,
    CloudSun,
    ArrowRight,
    AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarComponent } from '../data/premiumAvatars';
import { SkeletonDashboard } from './Skeleton';

// --- Sub-components (Optimized) ---

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
        <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0">
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200 mb-0.5 bg-white/40 dark:bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide">{formatDate(currentTime)}</span>
            </div>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 font-mono tracking-tighter leading-none">
                {formatTime(currentTime)}
            </div>
        </div>
    );
});

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) => {
    const num = parseInt(value.replace(/,/g, ''));
    const isNumber = !isNaN(num);

    return (
        <div className="relative group bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-100/40 dark:border-gray-700/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-black/10 rounded-2xl -z-10" />
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${color.replace('text-', 'from-')} to-gray-100 dark:to-gray-700/50 border border-white/30 dark:border-gray-600/30`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {isNumber ? (
                    <>
                        <CountUp end={num} duration={2000} />
                        {value.replace(/[0-9,]/g, '')}
                    </>
                ) : value}
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
                {label}
            </div>
        </div>
    );
};

const ActionCard = ({ action }: { action: any }) => (
    <Link
        to={action.link}
        className="group relative flex items-center p-4 bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-100/40 dark:border-gray-700/40 hover:border-blue-200/60 dark:hover:border-blue-800/60 transition-all duration-300 active:scale-[0.98] hover:shadow-md"
    >
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        <div className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl ${action.bgColor} mr-3 sm:mr-4 group-hover:scale-105 transition-transform duration-300 border border-white/30 dark:border-gray-600/30 overflow-hidden`}>
            <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white z-10 relative" />
            <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${action.color} rounded-xl blur-sm`} />
        </div>
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

// Count Up Animation Component
const CountUp = ({ end, duration = 2000 }: { end: number, duration?: number }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTime: number | null = null
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)

            // Super smooth easing function (easeOutCubic)
            const easeOutCubic = (x: number): number => {
                return 1 - Math.pow(1 - x, 3)
            }

            setCount(Math.ceil(easeOutCubic(progress) * end))

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                setCount(end)
            }
        }
        requestAnimationFrame(animate)
    }, [end, duration])

    return <span>{count.toLocaleString()}</span>
}

export default function Dashboard() {
    const { user } = useAuth();
    const AvatarComponent = user?.avatar ? getAvatarComponent(user.avatar) : null;
    const [greeting, setGreeting] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
    // Define structure with icons statically
    const statConfig = [
        { label: 'Resources', icon: BookOpen, color: 'text-blue-500', defaultValue: '0' },
        { label: 'Users', icon: TrendingUp, color: 'text-green-500', defaultValue: '0' },
        { label: 'Queries', icon: Sparkles, color: 'text-purple-500', defaultValue: '10k+' },
        { label: 'Papers', icon: FileText, color: 'text-orange-500', defaultValue: '3k+' }
    ];

    // Initialize stats from cache if available
    const [stats, setStats] = useState(() => {
        try {
            const cached = localStorage.getItem('dashboard_stats');
            if (cached) {
                const parsed = JSON.parse(cached);
                // Merge cached values with config to ensure Icons are present
                return statConfig.map((config, index) => ({
                    ...config,
                    value: parsed[index]?.value || config.defaultValue
                }));
            }
        } catch (e) {
            console.error('Failed to parse stats cache', e);
        }
        // Default fallbacks
        return statConfig.map(config => ({
            ...config,
            value: config.defaultValue
        }));
    });

    // Loading if no cache or if cache has default '0' values which implies we still need fresh data
    const [isLoading, setIsLoading] = useState(() => {
        const cached = localStorage.getItem('dashboard_stats');
        return !cached;
    });

    const isProfileIncomplete = !user?.course || !user?.year || !user?.branch;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin?action=stats');
                if (response.ok) {
                    const data = await response.json();
                    const newStats = [
                        { label: 'Resources', value: `${data.totalResources || 0}+`, icon: BookOpen, color: 'text-blue-500', defaultValue: '0' },
                        { label: 'Users', value: `${data.totalUsers || 0}+`, icon: TrendingUp, color: 'text-green-500', defaultValue: '0' },
                        { label: 'Queries', value: '10k+', icon: Sparkles, color: 'text-purple-500', defaultValue: '10k+' },
                        { label: 'Papers', value: '3k+', icon: FileText, color: 'text-orange-500', defaultValue: '3k+' }
                    ];
                    setStats(newStats);
                    // Store only simple data in cache, we re-hydrate icons on load
                    localStorage.setItem('dashboard_stats', JSON.stringify(newStats));
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting('Good Morning');
            setTimeOfDay('morning');
        } else if (hour >= 12 && hour < 17) {
            setGreeting('Good Afternoon');
            setTimeOfDay('afternoon');
        } else {
            setGreeting('Good Evening');
            setTimeOfDay('evening');
        }
    }, []);

    const quickActions = [
        { title: 'Browse Resources', description: 'Notes & materials', icon: BookOpen, link: '/resources', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50/70 dark:bg-blue-900/20' },
        { title: 'AI Assistant', description: 'Get instant help', icon: Bot, link: '/ai-assistant', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50/70 dark:bg-purple-900/20', badge: 'New' },
        { title: 'CGPA Calculator', description: 'Calculate CGPA', icon: Calculator, link: '/cgpa-calculator', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50/70 dark:bg-green-900/20' },
        { title: 'AI Papers', description: 'Practice exams', icon: FileText, link: '/ai-papers', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50/70 dark:bg-orange-900/20', badge: 'Beta' },
        { title: 'Leaderboard', description: 'Top contributors', icon: Trophy, link: '/leaderboard', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-50/70 dark:bg-yellow-900/20' },
        { title: 'Uploads', description: 'Your files', icon: Upload, link: '/uploads', color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-50/70 dark:bg-indigo-900/20' }
    ];

    if (isLoading && stats[0].value === '0') { // Only show full skeleton if valid data isn't present
        return <SkeletonDashboard />;
    }

    const getHeroBackground = () => {
        switch (timeOfDay) {
            case 'morning':
                return 'from-orange-100 via-amber-100 to-blue-100 dark:from-orange-950/30 dark:via-amber-900/20 dark:to-blue-950/30';
            case 'afternoon':
                return 'from-blue-100 via-sky-100 to-cyan-100 dark:from-blue-950/30 dark:via-sky-900/20 dark:to-cyan-950/30';
            case 'evening':
                return 'from-indigo-100 via-purple-100 to-slate-200 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/40';
            default:
                return 'from-gray-100 to-gray-200';
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-80px)] pb-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">

            {/* --- Hero Section --- */}
            <div className={`relative mt-4 sm:mt-6 overflow-hidden rounded-3xl bg-gradient-to-br ${getHeroBackground()} backdrop-blur-xl border border-white/40 dark:border-gray-700/30 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 mb-6 transition-colors duration-1000`}>

                {/* Dynamic Celestial Bodies */}
                <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                    {timeOfDay === 'morning' && (
                        <>
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-300/40 rounded-full blur-3xl animate-pulse" />
                            <Sun className="absolute top-6 right-6 w-24 h-24 text-orange-400/20 rotate-12" />
                            <CloudSun className="absolute top-12 right-20 w-16 h-16 text-white/40 dark:text-white/10" />
                        </>
                    )}
                    {timeOfDay === 'afternoon' && (
                        <>
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-200/50 rounded-full blur-[60px]" />
                            <Sun className="absolute -top-4 -right-4 w-32 h-32 text-yellow-500/20 animate-spin-slow" style={{ animationDuration: '20s' }} />
                        </>
                    )}
                    {timeOfDay === 'evening' && (
                        <>
                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
                            <div className="absolute top-8 right-32 w-1 h-1 bg-white rounded-full animate-ping" />
                            <div className="absolute top-20 right-10 w-1 h-1 bg-white rounded-full animate-pulse" />
                            <div className="absolute top-4 right-52 w-0.5 h-0.5 bg-white rounded-full" />
                            <Moon className="absolute top-6 right-6 w-20 h-20 text-indigo-300/30 -rotate-12 drop-shadow-lg" />
                        </>
                    )}
                </div>

                {/* Hero Content */}
                <div className="relative p-5 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                        <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
                            <div className="relative shrink-0">
                                <div className={`absolute inset-0 bg-gradient-to-br ${timeOfDay === 'evening' ? 'from-indigo-500 to-purple-600' : 'from-orange-400 to-yellow-500'} rounded-2xl blur-lg opacity-40`} />
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/80 dark:bg-black/30 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/50 dark:border-white/10 overflow-hidden">
                                    {AvatarComponent ? (
                                        <AvatarComponent className="w-full h-full" />
                                    ) : user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-2xl">{user?.name?.[0] || 'S'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                                    {greeting}
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white truncate leading-tight">
                                    {user?.name || 'Scholar'}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                                    Ready to learn?
                                </p>
                            </div>
                        </div>
                        <TimeDisplay />
                    </div>
                </div>
            </div>

            {/* --- Profile Warning Card --- */}
            {isProfileIncomplete && (
                <div className="relative overflow-hidden rounded-2xl mb-6 group border border-amber-200/60 dark:border-amber-800/40 shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 transition-all duration-300">
                    {/* Glass Background */}
                    <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm" />

                    {/* Soft Gradient Accents */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-200/30 to-orange-200/30 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-yellow-200/30 to-amber-200/30 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />

                    {/* Content */}
                    <div className="relative p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
                        <div className="flex items-start gap-3 sm:gap-4">
                            {/* Icon */}
                            <div className="shrink-0 p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-xl border border-amber-200/50 dark:border-amber-700/30 shadow-sm">
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">
                                    Complete Your Profile
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
                                    Your academic profile is incomplete. Update your <span className="font-semibold text-gray-700 dark:text-gray-300">Program</span>, <span className="font-semibold text-gray-700 dark:text-gray-300">Year</span>, and <span className="font-semibold text-gray-700 dark:text-gray-300">Branch</span> to get personalized recommendations.
                                </p>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <Link
                            to="/profile"
                            className="shrink-0 relative group/btn w-full sm:w-auto"
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur opacity-30 group-hover/btn:opacity-50 transition duration-300" />
                            <div className="relative px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 active:scale-[0.98]">
                                <span className="font-bold text-white text-sm whitespace-nowrap">
                                    Complete Now
                                </span>
                                <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-0.5 transition-transform duration-200" />
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                {stats.map((stat: { label: string; value: string; icon: any; color: string }) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        Quick Actions
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {quickActions.map((action) => (
                        <ActionCard key={action.title} action={action} />
                    ))}
                </div>
            </div>

            {/* --- REIMAGINED AI CARD: Light Theme Consistent --- */}
            <div className="relative w-full rounded-3xl overflow-hidden group border border-white/60 dark:border-gray-700/50 shadow-xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-shadow duration-300">
                {/* 1. Base Background (Clean White/Gray) */}
                <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/40 backdrop-blur-md" />

                {/* 2. Soft Pastel Gradients (Floating Orbs) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/40 to-blue-200/40 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-200/40 to-emerald-200/40 dark:from-cyan-900/20 dark:to-emerald-900/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

                {/* 3. Glass Overlay */}
                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 z-10">

                    {/* Left Side: Content */}
                    <div className="flex-1 text-center sm:text-left">
                        <div className="inline-flex items-center gap-2 mb-3">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl border border-blue-200/50 dark:border-blue-700/30">
                                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                                AI Assistant
                            </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Stuck on a concept?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto sm:mx-0">
                            Our AI can summarize papers, explain topics, and help you study faster.
                        </p>
                    </div>

                    {/* Right Side: Button */}
                    <Link to="/ai-assistant" className="shrink-0 relative group/btn">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30 group-hover/btn:opacity-60 transition duration-300" />
                        <div className="relative px-6 py-3 bg-white dark:bg-gray-900 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-gray-700 shadow-sm hover:translate-y-[-1px] transition-all duration-200">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                Ask AI Now
                            </span>
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1">
                                <ArrowRight className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}