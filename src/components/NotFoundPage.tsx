import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // Directly use Helmet to ensure query priority
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <>
            <Helmet>
                <title>404: Page Not Found | Extrovert</title>
                <meta name="robots" content="noindex" />
            </Helmet>

            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
                {/* Visual Effect Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full -z-10 pointer-events-none" />

                <div className="max-w-md w-full animate-fade-in">
                    {/* Big 404 Number */}
                    <h1 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-400 dark:from-white dark:to-gray-600 mb-6">
                        404
                    </h1>

                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                        Page not found
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center h-12 px-6 rounded-full text-base font-medium text-white bg-black dark:bg-white dark:text-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center h-12 px-6 rounded-full text-base font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
