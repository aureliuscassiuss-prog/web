import { BookOpen, Users, Target, Heart } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    About Extrovert
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    A collaborative platform built by students, for students. Share knowledge, ace your exams, and grow together.
                </p>
            </div>

            {/* Mission Section */}
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Extrovert was created to solve a simple problem: students need access to quality study materials,
                    and the best resources often come from fellow students who've already mastered the content.
                    We're building a community where knowledge sharing is rewarded and everyone benefits.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg w-fit">
                        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quality Resources</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Access notes, previous year questions, and formula sheets curated by top-performing students.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg w-fit">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Community Driven</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Built on the principle of giving back. Upload your notes and help others while building your reputation.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg w-fit">
                        <Heart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Free Forever</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Education should be accessible. Extrovert will always be free for students.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get instant help with our AI tutor, available 24/7 to answer your questions.
                    </p>
                </div>
            </div>

            {/* Team Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-8 text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Built by Students</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Extrovert is developed and maintained by a team of passionate students who understand
                    the challenges of college life. We're constantly improving based on your feedback.
                </p>
            </div>
        </div>
    )
}
