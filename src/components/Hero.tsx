export default function Hero() {
    return (
        <section className="bg-white dark:bg-gray-950 py-16 px-8 text-center flex flex-col items-center transition-colors duration-200">
            <div className="max-w-md mb-8 bg-gray-100 dark:bg-gray-900 rounded-2xl p-8 transition-colors">
                <svg viewBox="0 0 400 200" className="w-full">
                    <rect width="400" height="200" className="fill-gray-100 dark:fill-gray-800" rx="16" />
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-gray-400 dark:fill-gray-600" fontSize="18">
                        Illustration Placeholder
                    </text>
                </svg>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">
                Study smarter.<br />Achieve more.
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
                Find notes, PYQs and study materials for Medicaps University. Get instant AI tutoring help for any subject.
            </p>

            <div className="flex gap-4">
                <button className="btn btn-primary px-8 py-3 text-base shadow-lg shadow-red-500/20">
                    Get Started
                </button>
                <button className="btn btn-outline dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-8 py-3 text-base">
                    Browse Notes
                </button>
            </div>
        </section>
    )
}
