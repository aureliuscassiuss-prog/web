import { ArrowRight, Sparkles, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HeroProps {
    onGetStarted?: () => void
}

export default function Hero({ onGetStarted }: HeroProps) {
    return (
        <section className="relative flex flex-col items-center justify-center pt-8 pb-16 px-4 text-center md:pt-24 md:pb-32 overflow-hidden">

            {/* Optional: Subtle Background Grid */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

            {/* Announcement Badge */}
            <div className="mb-6 md:mb-8 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm px-3 py-1 text-xs md:text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400 dark:hover:bg-gray-900 cursor-default">
                    <Sparkles className="mr-2 h-3 w-3 md:h-3.5 md:w-3.5 text-yellow-500" />
                    <span>New: AI Tutor is now live</span>
                </span>
            </div>

            {/* Main Headline */}
            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-7xl animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:0.1s]">
                Study smarter.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-500 to-gray-900 dark:from-white dark:via-gray-400 dark:to-white">
                    Achieve more.
                </span>
            </h1>

            {/* Subheading */}
            <p className="mt-4 md:mt-6 max-w-2xl text-base md:text-xl text-gray-600 dark:text-gray-400 animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:0.2s] leading-relaxed px-4">
                Find notes, PYQs, and study materials for Medicaps University. Get instant AI tutoring help for any subject.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 md:mt-10 flex flex-col gap-3 md:gap-4 w-full sm:w-auto sm:flex-row animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:0.3s]">
                <button
                    onClick={onGetStarted}
                    className="btn btn-primary h-10 md:h-12 px-6 md:px-8 rounded-full text-sm md:text-base shadow-xl shadow-black/5 dark:shadow-white/5 w-full sm:w-auto flex items-center justify-center cursor-pointer"
                >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <Link
                    to="/leaderboard"
                    className="btn btn-outline h-10 md:h-12 px-6 md:px-8 rounded-full text-sm md:text-base bg-white/50 backdrop-blur-sm w-full sm:w-auto flex items-center justify-center"
                >
                    View Leaderboard
                </Link>
            </div>

            {/* Visual Placeholder / Video Area */}
            <div className="mt-12 md:mt-16 w-full max-w-5xl animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:0.5s] px-2 sm:px-0">
                <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-1 md:p-2 dark:border-gray-800 dark:bg-gray-900/50 backdrop-blur-sm shadow-2xl dark:shadow-black/50">
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 relative flex items-center justify-center group cursor-pointer">

                        {/* Grid Pattern inside the frame */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-950"></div>

                        {/* Central Play Indicator */}
                        <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4 transition-transform duration-300 group-hover:scale-105">
                            <div className="rounded-full bg-gray-100 dark:bg-gray-900 p-3 md:p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                                <PlayCircle className="h-8 w-8 md:h-12 md:w-12 text-gray-900 dark:text-white opacity-80" />
                            </div>
                            <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                                See how MediNotes works
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}