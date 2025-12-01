import { Book, Upload, Search, Award, HelpCircle, Sparkles } from 'lucide-react'

export default function DocsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Documentation
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Everything you need to know about using UniNotes effectively.
                </p>
            </div>

            {/* Getting Started */}
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Getting Started</h2>
                </div>

                <div className="space-y-4">
                    <div className="pl-4 border-l-2 border-blue-500 dark:border-blue-400">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Create an Account</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Sign in with your Google account to get started. It's quick, secure, and you're ready to go in seconds.
                        </p>
                    </div>

                    <div className="pl-4 border-l-2 border-purple-500 dark:border-purple-400">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Complete Your Profile</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Add your branch, year, and semester to get personalized content recommendations.
                        </p>
                    </div>

                    <div className="pl-4 border-l-2 border-green-500 dark:border-green-400">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Start Exploring</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Browse resources by subject, download what you need, and contribute your own notes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Features Guide */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Resources</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Filter by branch, year, and subject</li>
                        <li>• Search for specific topics</li>
                        <li>• View notes, PYQs, and formula sheets</li>
                        <li>• Download resources instantly</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Content</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Share your notes with the community</li>
                        <li>• Upload to Google Drive first</li>
                        <li>• Add clear titles and descriptions</li>
                        <li>• Earn reputation points</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Tutor</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Ask questions anytime, 24/7</li>
                        <li>• Get instant explanations</li>
                        <li>• Solve problems step-by-step</li>
                        <li>• Learn concepts interactively</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reputation System</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Earn points for uploads</li>
                        <li>• Climb the leaderboard</li>
                        <li>• Build your academic profile</li>
                        <li>• Help others succeed</li>
                    </ul>
                </div>
            </div>

            {/* FAQ */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">FAQ</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is UniNotes free?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Yes! UniNotes is completely free for all students and will remain free forever.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How do I upload resources?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            First, upload your file to Google Drive and make it publicly accessible. Then use the upload button to share the link with the community.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What file formats are supported?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            We support all Google Drive compatible formats including PDF, DOCX, PPTX, and more.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
