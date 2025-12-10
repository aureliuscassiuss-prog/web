import { ScrollText, CheckCircle, XCircle, AlertTriangle, Scale, BookOpen, AlertOctagon, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#030303] text-gray-900 dark:text-gray-200 overflow-hidden relative selection:bg-blue-500/30">

            {/* --- Background Effects --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Top Spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full opacity-40 dark:opacity-20" />

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-20 space-y-6"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 dark:bg-white/5 dark:border-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                        <Scale className="h-3 w-3 text-blue-500" />
                        <span>Effective From: December 2024</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white">
                        Terms of <span className="text-gray-400 dark:text-gray-600">Service</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Please read these terms carefully before using our platform. They define the rules and regulations for the use of Extrovert.
                    </p>
                </motion.div>

                {/* Quick Summary - Glass Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-10 mb-16 overflow-hidden"
                >
                    {/* Inner Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Quick Summary</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                "Respect other students and their work",
                                "Upload only content you have rights to",
                                "Keep your account secure",
                                "Report inappropriate content"
                            ].map((text, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-16">
                    {/* 1. Agreement */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">1. Agreement to Terms</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            By accessing or using Extrovert, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                            If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    {/* 2. Content Guidelines */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl">
                                <ScrollText className="w-5 h-5 text-gray-900 dark:text-white" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">2. Content Guidelines</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Allowed Content */}
                            <div className="rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-md p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">Allowed Content</h3>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        "Lecture notes and subject summaries",
                                        "Handwritten formula sheets",
                                        "Previous year question papers (PYQs)",
                                        "Educational diagrams and charts"
                                    ].map((item, i) => (
                                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 pl-4 relative flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Prohibited Content */}
                            <div className="rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-md p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <XCircle className="w-5 h-5 text-rose-500" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">Prohibited Content</h3>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        "Copyrighted material without permission",
                                        "NSFW, offensive, or hateful content",
                                        "Spam or promotional material",
                                        "Malicious files or software"
                                    ].map((item, i) => (
                                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 pl-4 relative flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. Intellectual Property */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">3. Intellectual Property</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            You retain ownership of the content you upload to Extrovert. However, by uploading, you grant Extrovert
                            a non-exclusive, worldwide, royalty-free license to host, display, and distribute your content to other users.
                        </p>

                        <div className="rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 p-6 flex items-start gap-4 backdrop-blur-sm">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-900 dark:text-amber-200/80 leading-relaxed">
                                We respect copyright. If you believe your work has been copied in a way that constitutes copyright infringement,
                                please contact us immediately.
                            </p>
                        </div>
                    </section>

                    {/* 4. Disclaimer */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl">
                                <AlertOctagon className="w-5 h-5 text-gray-900 dark:text-white" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">4. Disclaimer</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            The materials on Extrovert are provided on an 'as is' basis. We make no warranties, expressed or implied,
                            and hereby disclaim and negate all other warranties including, without limitation, implied warranties
                            or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual
                            property or other violation of rights.
                        </p>
                    </section>

                    {/* Footer Warning - Clean & Subtle */}
                    <div className="rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 flex flex-col md:flex-row gap-6 items-start backdrop-blur-sm">
                        <div className="p-3 rounded-full bg-white dark:bg-white/10 shadow-sm border border-gray-100 dark:border-white/5">
                            <AlertCircle className="w-6 h-6 text-gray-900 dark:text-white" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Important Notice</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                Violation of these terms may result in account suspension or termination.
                                Please use Extrovert responsibly and help us maintain a positive learning environment.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}