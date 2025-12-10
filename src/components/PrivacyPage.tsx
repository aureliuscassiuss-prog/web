import { Shield, Lock, Eye, Server, Mail, CheckCircle2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PrivacyPage() {
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

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-20 max-w-3xl mx-auto space-y-6"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 dark:bg-white/5 dark:border-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                        <ShieldCheck className="h-3 w-3 text-blue-500" />
                        <span>Legal & Security</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white">
                        Privacy <span className="text-gray-400 dark:text-gray-600">&</span> Policy
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                        We value your privacy and are committed to protecting your personal data. Here is a transparent breakdown of how we handle your information.
                    </p>
                </motion.div>

                <div className="space-y-8">
                    {/* Cookies Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-10"
                    >
                        <div className="flex items-start gap-5">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-500/20 shrink-0">
                                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Cookies</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    We use essential cookies to maintain your session and preferences. We believe in a clean experience, so we do not use tracking cookies or third-party advertising cookies.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Third Party Services & Data Security Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Third Party Services */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="relative rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-2xl p-8"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                                    <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Third-Party Services</h2>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                We rely on trusted infrastructure to keep Extrovert running smoothly:
                            </p>

                            <ul className="space-y-3">
                                {[
                                    { label: "Google OAuth", desc: "For secure authentication" },
                                    { label: "Google Drive", desc: "For file storage & sharing" },
                                    { label: "MongoDB Atlas", desc: "For encrypted database hosting" },
                                    { label: "Groq AI", desc: "Powering the AI Tutor" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            <strong className="font-semibold text-gray-900 dark:text-white">{item.label}:</strong> {item.desc}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Data Security (Added for visual balance) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="relative rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-2xl p-8"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                    <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Data Security</h2>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Your data integrity is our priority. We employ industry-standard practices to ensure your information remains safe.
                            </p>

                            <ul className="space-y-3">
                                {[
                                    "End-to-end encryption for sensitive data",
                                    "Regular security audits and updates",
                                    "Strict access controls for administrative tools",
                                    "No data selling to third-party advertisers"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Contact Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-3xl border border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 text-center"
                    >
                        {/* Inner Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-2">
                                <Mail className="w-5 h-5 text-gray-900 dark:text-white" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Still have questions?</h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-4">
                                If you have any specific concerns about your data or our privacy practices, our team is ready to answer them.
                            </p>
                            <a
                                href="mailto:privacy@extrovert.site"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:scale-105 transition-transform duration-200"
                            >
                                privacy@extrovert.site
                            </a>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}