import { ArrowRight, Sparkles, ChevronRight, Star, Users, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'


interface HeroProps {
    onGetStarted?: () => void
    user?: any
}

// State with Lazy Initializers for Instant Load from Cache
const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('hero_stats_count'));
const [studentCount, setStudentCount] = useState<number | null>(() => {
    const cached = localStorage.getItem('hero_stats_count');
    return cached ? parseInt(cached) : null;
});

const [recentStudents, setRecentStudents] = useState<any[]>(() => {
    const cached = localStorage.getItem('hero_stats_users');
    return cached ? JSON.parse(cached) : [];
});

useEffect(() => {
    const fetchData = async () => {
        try {
            // Parallel fetching for speed
            const [statsRes, leaderboardRes] = await Promise.all([
                fetch('/api/admin?action=stats'),
                fetch('/api/resources?action=leaderboard')
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStudentCount(data.totalUsers || 2500);
                localStorage.setItem('hero_stats_count', (data.totalUsers || 2500).toString());
            } else if (!studentCount) {
                // Fallback if API fails and no cache
                setStudentCount(2500);
            }

            if (leaderboardRes.ok) {
                const data = await leaderboardRes.json();
                const users = data.leaderboard?.slice(0, 4) || [];
                if (users.length > 0) {
                    setRecentStudents(users);
                    localStorage.setItem('hero_stats_users', JSON.stringify(users));
                }
            }
        } catch (error) {
            console.error('Hero data sync failed:', error);
            if (!studentCount) setStudentCount(2500);
        } finally {
            setIsLoading(false);
        }
    };

    // Fire and forget - don't block UI
    fetchData();
}, []);

// ... (rest of render)

{/* Social Proof (Real Data) */ }
<div className="mt-8 md:mt-10 flex flex-col md:flex-row items-center gap-4 animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:0.2s]">
    <div className="flex -space-x-3">
        {isLoading ? (
            // Skeleton Loading State
            <>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-black bg-gray-200 dark:bg-gray-800 animate-pulse" />
                ))}
            </>
        ) : recentStudents.length > 0 ? (
            <>
                {recentStudents.map((student, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-black overflow-hidden bg-gray-200 dark:bg-gray-800 relative group">
                        {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                                {student.name?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                ))}
            </>
        ) : (
            // Fallback Icons (only if loaded but empty)
            <>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-black bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        <Users className="h-4 w-4 text-gray-400" />
                    </div>
                ))}
            </>
        )}

        {/* Count Pill */}
        <div className="h-8 min-w-[3rem] px-3 rounded-full border-2 border-white dark:border-black bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-400">
            {isLoading ? (
                <div className="h-2 w-8 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
            ) : (
                <span>{studentCount ? `${studentCount}+` : '2k+'}</span>
            )}
        </div>
    </div>
    <div className="flex items-center gap-1">
        <div className="flex text-yellow-500">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
            ))}
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">from students</span>
    </div>
</div>

{/* --- Visual / Video Section (Professional Glass) --- */ }
<div className="relative mt-16 md:mt-20 w-full max-w-6xl animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:0.25s] px-4">

    {/* Clean Glow (No Pink) */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[50%] bg-blue-500/20 blur-[90px] rounded-full -z-10"></div>

    {/* Main Glass Container */}
    <div className="relative rounded-2xl border border-gray-200/50 bg-white/40 p-2 dark:border-white/10 dark:bg-white/5 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5">

        {/* The Screen/Frame */}
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 relative flex items-center justify-center group">

            {/* Video Background */}
            <video
                src="/1.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay Gradient for better text readability if needed, or just subtle polish */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
    </div>

    {/* Feature Pills (New Content Below Video) */}
    <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-60">
        {['Instant Notes', 'AI Tutoring', 'Past Year Papers', 'CGPA Calculator'].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50"></div>
                {feature}
            </div>
        ))}
    </div>
</div>
        </section >
    )
}
