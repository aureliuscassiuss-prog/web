import { Mail, Send, MessageSquare, MapPin, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('sending')
        // Simulate sending
        setTimeout(() => {
            setStatus('success')
            setFormData({ name: '', email: '', subject: '', message: '' })
            setTimeout(() => setStatus('idle'), 3000)
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#030303] text-gray-900 dark:text-gray-200 overflow-hidden relative selection:bg-blue-500/30">

            {/* --- Background Effects --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Top Spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full opacity-40 dark:opacity-20" />

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16 space-y-6"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 dark:bg-white/5 dark:border-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 mx-auto">
                        <MessageSquare className="h-3 w-3 text-blue-500" />
                        <span>We usually reply within 2 hours</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white">
                        Get in <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-400 dark:from-white dark:to-gray-500">Touch.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        Have a question about the AI Tutor or need help with your account? Drop us a line below.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

                    {/* Left: Glass Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative rounded-3xl border border-gray-200/50 bg-white/40 dark:border-white/10 dark:bg-white/5 backdrop-blur-2xl shadow-2xl p-1"
                    >
                        {/* Form Inner Container */}
                        <div className="rounded-2xl bg-white/50 dark:bg-[#0A0A0A]/40 p-6 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 
                                            bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white 
                                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50
                                            transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 
                                            bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white 
                                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50
                                            transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 
                                        bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white 
                                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50
                                        transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                        placeholder="Feature request..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Message</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 
                                        bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white 
                                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50
                                        transition-all outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                        placeholder="Tell us exactly what you need..."
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={status === 'sending'}
                                        className="relative w-full h-12 px-8 rounded-full text-base font-medium text-white bg-black dark:bg-white dark:text-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 transition-all duration-200 flex items-center justify-center overflow-hidden"
                                    >
                                        {status === 'sending' ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Send Message
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {status === 'success' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mt-4 text-sm font-medium">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Message sent successfully!</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>
                    </motion.div>

                    {/* Right: Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="space-y-6 flex flex-col justify-center h-full"
                    >
                        {/* Email Card */}
                        <a href="mailto:support@extrovert.site" className="group block">
                            <div className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 hover:border-blue-500/30 hover:-translate-y-1">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 flex items-center justify-center group-hover:scale-105 group-hover:border-blue-500/30 transition-all duration-300">
                                        <Mail className="h-6 w-6 text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Support</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">support@extrovert.site</p>
                                    </div>
                                    <ArrowRight className="ml-auto h-5 w-5 text-gray-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                </div>
                            </div>
                        </a>

                        {/* Location Card */}
                        <div className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="h-14 w-14 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 flex items-center justify-center">
                                    <MapPin className="h-6 w-6 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Based at Medicaps</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Indore, Madhya Pradesh</p>
                                </div>
                            </div>

                            {/* Abstract Map Visualization */}
                            <div className="h-[180px] w-full rounded-2xl bg-gray-100 dark:bg-[#0A0A0A] overflow-hidden border border-gray-200 dark:border-white/5 relative group">
                                {/* Map Grid Pattern */}
                                <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.2] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                                {/* Radar Effect */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="h-4 w-4 bg-blue-500 rounded-full animate-ping absolute"></div>
                                    <div className="h-4 w-4 bg-blue-500 rounded-full relative shadow-[0_0_30px_rgba(59,130,246,0.6)] z-10"></div>

                                    {/* Pulse Rings */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-500/10 rounded-full animate-[ping_4s_linear_infinite_1s]" />
                                </div>
                            </div>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-3">
                            {['24/7 AI Support', 'Bug Bounties', 'Feature Requests'].map((tag) => (
                                <span key={tag} className="px-4 py-2 rounded-full text-xs font-semibold tracking-wide border border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}