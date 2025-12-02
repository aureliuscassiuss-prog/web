import { FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Terms of Service
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Please read these terms carefully before using Extrovert.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                    Last updated: December 1, 2025
                </p>
            </div>

            {/* Quick Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Summary</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Share educational content freely
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Respect others' work and rights
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            No plagiarism or copyright violation
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Terms */}
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        By accessing and using Extrovert, you accept and agree to be bound by these Terms of Service.
                        If you do not agree to these terms, please do not use our platform.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. User Accounts</h2>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>You must provide accurate and complete information when creating an account</li>
                        <li>You are responsible for maintaining the security of your account</li>
                        <li>You must be a student or educator to use this platform</li>
                        <li>One person may not maintain multiple accounts</li>
                        <li>You must notify us immediately of any unauthorized use of your account</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Content Guidelines</h2>

                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">Allowed Content:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li>Original notes and study materials</li>
                                    <li>Previous year question papers (publicly available)</li>
                                    <li>Formula sheets and summaries</li>
                                    <li>Educational resources you have rights to share</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">Prohibited Content:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li>Copyrighted material without permission</li>
                                    <li>Plagiarized content</li>
                                    <li>Offensive, harmful, or inappropriate material</li>
                                    <li>Spam or promotional content</li>
                                    <li>Malware or malicious links</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Intellectual Property</h2>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>You retain ownership of content you upload</li>
                        <li>By uploading, you grant Extrovert a license to display and distribute your content</li>
                        <li>You must have the right to share any content you upload</li>
                        <li>Extrovert respects intellectual property rights and will remove infringing content</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. User Conduct</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">You agree not to:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>Violate any laws or regulations</li>
                        <li>Harass, abuse, or harm other users</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Interfere with the proper functioning of the platform</li>
                        <li>Use automated systems to access the platform without permission</li>
                        <li>Impersonate others or misrepresent your affiliation</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">6. Disclaimer</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Extrovert is provided "as is" without warranties of any kind. We do not guarantee the accuracy,
                        completeness, or reliability of any content on the platform. Use of the platform is at your own risk.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">7. Limitation of Liability</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Extrovert and its operators shall not be liable for any indirect, incidental, special, or consequential
                        damages arising from your use of the platform.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">8. Termination</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        We reserve the right to suspend or terminate your account at any time for violations of these terms
                        or for any other reason. You may also delete your account at any time.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">9. Changes to Terms</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        We may update these terms from time to time. We will notify users of significant changes.
                        Continued use of the platform after changes constitutes acceptance of the new terms.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">10. Contact</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        For questions about these terms, please contact us at{' '}
                        <a href="mailto:legal@extrovert.site" className="text-blue-600 dark:text-blue-400 hover:underline">
                            legal@extrovert.site
                        </a>
                    </p>
                </div>
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Important Notice</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Violation of these terms may result in account suspension or termination.
                        Please use Extrovert responsibly and help us maintain a positive learning environment.
                    </p>
                </div>
            </div>
        </div>
    )
}
