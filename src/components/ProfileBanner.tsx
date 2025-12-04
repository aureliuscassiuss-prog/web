import { useState, useEffect, memo } from 'react';
import {
    Calendar,
    Sun,
    Moon,
    CloudSun
} from 'lucide-react';

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

interface ProfileBannerProps {
    user: any;
    children?: React.ReactNode;
}

export default function ProfileBanner({ user, children }: ProfileBannerProps) {
    const [greeting, setGreeting] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

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
        <div className={`relative overflow-hidden rounded-t-xl bg-gradient-to-br ${getHeroBackground()} backdrop-blur-xl border-b border-white/40 dark:border-gray-700/30 shadow-sm transition-colors duration-1000 min-h-[200px] p-6`}>

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

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Top Bar (Children like Logout/Edit buttons) */}
                <div className="flex justify-end w-full">
                    {children}
                </div>

                {/* Greeting & Time */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mt-auto">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                            {greeting}
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white truncate leading-tight">
                            {user?.name || 'Scholar'}
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                            Manage your profile settings
                        </p>
                    </div>
                    <TimeDisplay />
                </div>
            </div>
        </div>
    );
}
