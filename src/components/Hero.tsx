import { ArrowRight, Sparkles, ChevronRight, Star, Users, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HeroProps {
    onGetStarted?: () => void
    user?: any
}

export default function Hero({ onGetStarted, user }: HeroProps) {
    return (
        <section className="relative flex flex-col items-center justify-center pt-16 pb-24 px-4 text-center md:pt-32 md:pb-48 overflow-hidden bg-white dark:bg-[#030303] selection:bg-blue-500/30">

            {/* --- Background Effects (Cleaned & Professional) --- */}

            {/* 1. Top Spotlight - Neutral Blue/White (No Pink) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none opacity-40 dark:opacity-20" />

            {/* 2. Subtle Grid - Softened, No Hard Borders */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

            {/* --- Main Content --- */}

            {/* Announcement Badge */}
            <div className="mb-8 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
                <div className="group relative inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-md px-4 py-1.5 text-xs md:text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:border-white/20 cursor-default">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span>New: AI Tutor is now live</span>
                    <ChevronRight className="h-3 w-3 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </div>
            </div>

            {/* Headline */}
            <h1 className="max-w-6xl text-5xl font-bold tracking-tighter text-gray-900 dark:text-white md:text-8xl animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:0.1s]">
                Study smarter. <br className="hidden md:block" />
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                    Achieve more.
                </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 md:mt-8 max-w-2xl text-base md:text-xl text-gray-600 dark:text-gray-400 animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:0.2s] leading-relaxed px-4">
                The all-in-one academic platform for Medicaps University. Access premium notes, PYQs, and get instant guidance from your personal AI Tutor.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 md:mt-10 flex flex-col gap-3 md:gap-4 w-full sm:w-auto sm:flex-row animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:0.3s]">
                <button
                    onClick={onGetStarted}
                    className="relative h-12 px-8 rounded-full text-base font-medium text-white bg-black dark:bg-white dark:text-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto flex items-center justify-center overflow-hidden"
                >
                    <span className="relative flex items-center z-10">
                        {user ? (
                            <>
                                Explore
                                <Menu className="ml-2 h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </span>
                </button>
                <Link
                    to="/leaderboard"
                    className="h-12 px-8 rounded-full text-base font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 w-full sm:w-auto flex items-center justify-center"
                >
                    View Leaderboard
                </Link>
            </div>

            {/* Social Proof (New Content) */}
            <div className="mt-8 md:mt-10 flex flex-col md:flex-row items-center gap-4 animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:0.4s]">
                <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-black bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                            <Users className="h-4 w-4 text-gray-400" />
                        </div>
                    ))}
                    <div className="h-8 w-8 rounded-full border-2 border-white dark:border-black bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-400">
                        2k+
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

            {/* --- Visual / Video Section (Professional Glass) --- */}
            <div className="relative mt-16 md:mt-20 w-full max-w-6xl animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:0.5s] px-4">

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
        </section>
    )
}