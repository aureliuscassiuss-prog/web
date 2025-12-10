import { Book, Upload, Search, Award, HelpCircle, Sparkles, ChevronRight, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#030303] text-gray-900 dark:text-gray-200 overflow-hidden relative selection:bg-blue-500/30">

            {/* --- Background Effects --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Top Spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full opacity-40 dark:opacity-20" />

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-24 max-w-4xl mx-auto space-y-6"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 dark:bg-white/5 dark:border-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                        <FileText className="h-3 w-3 text-blue-500" />
                        <span>Knowledge Base</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white">
                        Documentation <span className="text-gray-400 dark:text-gray-600">&</span> Guides
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Everything you need to know about using Extrovert effectively. From setting up your profile to contributing resources.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    {/* Getting Started - Glass Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 overflow-hidden"
                    >
                        {/* Inner Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                    <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Getting Started</h2>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                {[
                                    {
                                        step: "01",
                                        title: "Create Account",
                                        desc: "Sign in with your Google account. It's quick, secure, and ready in seconds.",
                                    },
                                    {
                                        step: "02",
                                        title: "Set Preferences",
                                        desc: "Add your branch, year, and semester to get personalized recommendations.",
                                    },
                                    {
                                        step: "03",
                                        title: "Start Exploring",
                                        desc: "Browse resources, download what you need, and contribute your own notes.",
                                    }
                                ].map((item, index) => (
                                    <div key={item.step} className="relative group p-6 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200/50 dark:hover:border-white/5">
                                        {/* Watermark Number */}
                                        <div className="absolute -top-2 -right-2 text-6xl font-bold text-gray-200 dark:text-white/5 select-none transition-all group-hover:scale-110">
                                            {item.step}
                                        </div>

                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{item.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Features Guide - Grid of Glass Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Search,
                                title: "Browse Resources",
                                items: ["Filter by branch, year, and subject", "Search for specific topics", "View notes, PYQs, and formula sheets"],
                                color: "text-blue-500",
                                bg: "bg-blue-500/10"
                            },
                            {
                                icon: Upload,
                                title: "Upload & Share",
                                items: ["Upload files to Google Drive (public link)", "Submit the link via our Upload Portal", "Earn reputation points instantly"],
                                color: "text-purple-500",
                                bg: "bg-purple-500/10"
                            },
                            {
                                icon: Sparkles,
                                title: "AI Tutor",
                                items: ["Ask questions anytime, 24/7", "Get instant explanations", "Solve problems step-by-step"],
                                color: "text-emerald-500",
                                bg: "bg-emerald-500/10"
                            },
                            {
                                icon: Award,
                                title: "Reputation System",
                                items: ["Earn points for uploads", "Climb the leaderboard", "Build your academic profile"],
                                color: "text-amber-500",
                                bg: "bg-amber-500/10"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-white/40 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 backdrop-blur-2xl rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-3 rounded-2xl ${feature.bg} border border-white/10`}>
                                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{feature.title}</h3>
                                </div>
                                <ul className="space-y-3">
                                    {feature.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 transition-colors" />
                                            <span className="text-sm leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ - Refined Look */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-3xl border border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-gray-200 dark:bg-white/10 rounded-2xl">
                                <HelpCircle className="w-5 h-5 text-gray-700 dark:text-white" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                {
                                    q: "Is Extrovert free?",
                                    a: "Yes! Extrovert is completely free for all students and will remain free forever."
                                },
                                {
                                    q: "How do I upload?",
                                    a: "Upload your file to Google Drive (public access), then use our upload button to share the link."
                                },
                                {
                                    q: "Supported formats?",
                                    a: "We support all Google Drive compatible formats including PDF, DOCX, PPTX, and more."
                                }
                            ].map((faq, i) => (
                                <div key={i} className="bg-white/60 dark:bg-[#0A0A0A]/50 p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{faq.q}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}