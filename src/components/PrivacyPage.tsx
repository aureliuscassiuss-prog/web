import { Shield, Lock, Eye, Database } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Privacy Policy
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Your privacy matters to us. Here's how we protect and use your data.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                    Last updated: December 1, 2025
                </p>
            </div>

            {/* Key Points */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Protection</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        We use industry-standard encryption to protect your personal information.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg w-fit">
                        <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Secure Authentication</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        We use Google OAuth for secure, password-less authentication.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg w-fit">
                        <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Selling</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        We never sell your data to third parties. Your information is yours.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg w-fit">
                        <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Minimal Data</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        We only collect what's necessary to provide our services.
                    </p>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400">
                        <p className="font-semibold text-gray-900 dark:text-white">Account Information:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Name and email address (from Google OAuth)</li>
                            <li>Profile picture (optional)</li>
                            <li>Academic information (branch, year, semester)</li>
                        </ul>

                        <p className="font-semibold text-gray-900 dark:text-white mt-4">Usage Data:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Resources you upload and download</li>
                            <li>Search queries and browsing activity</li>
                            <li>AI tutor conversations (to improve service)</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Use Your Data</h2>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>To provide and improve our services</li>
                        <li>To personalize your experience</li>
                        <li>To communicate important updates</li>
                        <li>To maintain security and prevent abuse</li>
                        <li>To display your contributions and reputation</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Rights</h2>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>Access your personal data at any time</li>
                        <li>Request data deletion</li>
                        <li>Export your data</li>
                        <li>Opt-out of non-essential communications</li>
                        <li>Update your information anytime</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cookies</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        We use essential cookies to maintain your session and preferences. We do not use tracking cookies or third-party advertising cookies.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Third-Party Services</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        We use the following third-party services:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li><strong>Google OAuth:</strong> For secure authentication</li>
                        <li><strong>Google Drive:</strong> For file storage and sharing</li>
                        <li><strong>MongoDB Atlas:</strong> For database hosting</li>
                        <li><strong>Groq AI:</strong> For AI tutor functionality</li>
                    </ul>
                </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-8 text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Questions?</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    If you have any questions about our privacy policy, please contact us at{' '}
                    <a href="mailto:privacy@uninotes.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        privacy@uninotes.com
                    </a>
                </p>
            </div>
        </div>
    )
}
