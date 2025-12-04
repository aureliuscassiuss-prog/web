import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Copyright */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        © 2025 Extrovert.
                    </div>

                    {/* Popular Resources (SEO) */}
                    <div className="hidden lg:flex flex-col gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">Popular Searches:</span>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/resources?search=Medicaps" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Medicaps Notes</Link>
                            <Link to="/resources?search=PYQ" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Medicaps PYQs</Link>
                            <Link to="/resources?search=CSE" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">B.Tech CSE Notes</Link>
                            <Link to="/resources?search=MBA" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">MBA Study Material</Link>
                            <Link to="/resources?search=First%20Year" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">First Year Engineering</Link>
                        </div>
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap items-center justify-center gap-6">
                        <Link
                            to="/about"
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            About
                        </Link>
                        <Link
                            to="/contact"
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            Contact
                        </Link>
                        <Link
                            to="/docs"
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            Docs
                        </Link>
                        <Link
                            to="/privacy"
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            to="/terms"
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            Terms
                        </Link>
                    </nav>
                </div>
            </div>
        </footer>
    )
}
