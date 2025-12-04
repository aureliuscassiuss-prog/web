import { useState, useEffect } from 'react';
import {
    Sun,
    Moon,
    CloudSun
} from 'lucide-react';

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
        <div className={`relative overflow-hidden rounded-t-xl bg-gradient-to-br ${getHeroBackground()} backdrop-blur-xl border-b border-white/40 dark:border-gray-700/30 shadow-sm transition-colors duration-1000 min-h-[280px] p-6 sm:p-8`}>

            {/* Dynamic Celestial Bodies */}
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                {timeOfDay === 'morning' && (
                    <>
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-yellow-300/40 rounded-full blur-3xl animate-pulse" />
                        <Sun className="absolute top-8 right-8 w-32 h-32 text-orange-400/20 rotate-12" />
                        <CloudSun className="absolute top-16 right-24 w-20 h-20 text-white/40 dark:text-white/10" />
                    </>
                )}
                {timeOfDay === 'afternoon' && (
                    <>
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-200/50 rounded-full blur-[80px]" />
                        <Sun className="absolute -top-6 -right-6 w-40 h-40 text-yellow-500/20 animate-spin-slow" style={{ animationDuration: '20s' }} />
                    </>
                )}
                {timeOfDay === 'evening' && (
                    <>
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
                        <div className="absolute top-12 right-40 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        <div className="absolute top-24 right-16 w-1 h-1 bg-white rounded-full animate-pulse" />
                        <div className="absolute top-6 right-64 w-1 h-1 bg-white rounded-full" />
                        <Moon className="absolute top-8 right-8 w-28 h-28 text-indigo-300/30 -rotate-12 drop-shadow-lg" />
                    </>
                )}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Top Bar (Children like Logout/Edit buttons) */}
                <div className="flex justify-end w-full mb-4">
                    {children}
                </div>

                {/* Greeting & Time - Moved up/adjusted to avoid bottom-left overlap */}
                <div className="flex flex-col gap-1 mb-12 sm:mb-0 sm:ml-auto sm:text-right max-w-md">
                    {/* 
                      Strategy: On mobile, add bottom margin (mb-12) to clear the avatar.
                      On desktop (sm), move text to the right (sm:ml-auto sm:text-right) so the left is free for the avatar.
                   */}
                    <p className="text-base sm:text-lg font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                        {greeting}
                    </p>
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                        {user?.name || 'Scholar'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 mt-2 font-medium opacity-90">
                        Manage your profile settings
                    </p>
                </div>
            </div>
        </div>
    );
}
