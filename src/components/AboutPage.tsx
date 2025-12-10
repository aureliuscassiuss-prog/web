import { Users, Target, Heart, ArrowRight, Zap, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20
        }
    }
}

export default function AboutPage() {
    const [avatars, setAvatars] = useState<string[]>([
        "https://github.com/trilliontip.png",
        "https://ui-avatars.com/api/?name=Team+1",
        "https://ui-avatars.com/api/?name=Team+2"
    ])

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch('/api/admin?action=team')
                if (res.ok) {
                    const data = await res.json()
                    const members = data.team

                    if (members && members.length > 0) {
                        const shuffled = members.sort(() => 0.5 - Math.random())
                        const picked = shuffled.slice(0, 3).map((m: any) => m.avatar || `https://ui-avatars.com/api/?name=${m.name}`)

                        // If we have fewer than 3 members, fill with random avatars
                        while (picked.length < 3) {
                            picked.push(`https://ui-avatars.com/api/?name=Member+${picked.length + 1}`)
                        }

                        setAvatars(picked)
                    } else {
                        // Fallback if no specific role members found
                        setAvatars([
                            `https://ui-avatars.com/api/?name=Admin`,
                            `https://ui-avatars.com/api/?name=Reviewer`,
                            `https://ui-avatars.com/api/?name=Ops`
                        ])
                    }
                }
            } catch (e) {
                console.error("Failed to fetch team avatars", e)
            }
        }
        fetchTeam()
    }, [])

    return (
        <div className="min-h-screen bg-white dark:bg-[#030303] text-gray-900 dark:text-gray-200 transition-colors duration-300 overflow-hidden relative selection:bg-blue-500/30">

            {/* --- Background Effects (From Code 2) --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Top Spotlight - Neutral Blue/White */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full opacity-40 dark:opacity-20" />

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16 space-y-6"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 dark:bg-white/5 dark:border-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 mx-auto">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        <span>Student-led Ecosystem</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white">
                        About <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-400 dark:from-white dark:to-gray-500">Extrovert</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        We bridge the gap between confusion and clarity. A platform built to democratize education through collaboration.
                    </p>
                </motion.div>

                {/* Bento Grid Layout */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]"
                >
                    {/* Mission Card (Span 2) */}
                    <motion.div variants={itemVariants} className="md:col-span-2 group relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-300">
                        {/* Subtle Glow on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-[0.03] group-hover:opacity-10 transition-opacity">
                            <Target className="w-40 h-40" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5">
                                    <Target className="w-6 h-6 text-gray-900 dark:text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 tracking-tight text-gray-900 dark:text-white">Our Mission</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
                                    Resources shouldn't be gated. We are creating a collaborative loop where top-tier students share their formulas, notes, and strategies with those who need them most.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* AI Feature (Span 1) */}
                    <motion.div variants={itemVariants} className="group relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                        {/* Subtle Blue Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-50" />

                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                                <Zap className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white">AI Tutor</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Stuck on a concept? Our trained AI is available 24/7 to breakdown complex topics instantly.
                            </p>
                        </div>
                    </motion.div>

                    {/* Small Feature Cards */}
                    {[
                        { icon: Users, title: "Community & Leaderboard", desc: "Climb the ranks. Upload valuable notes, earn karma, and get recognized on the leaderboard.", color: "text-blue-500" },
                        { icon: ShieldCheck, title: "Verified Resources", desc: "Quality matters. Content is peer-reviewed to ensure accuracy and relevance.", color: "text-emerald-500" },
                        { icon: Heart, title: "Open & Free", desc: "Education without barriers. Access tailored study materials completely free, forever.", color: "text-rose-500" }
                    ].map((feature, idx) => (
                        <motion.div key={idx} variants={itemVariants} className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-6 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                            <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{feature.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}

                    {/* CTA Section */}
                    <motion.div variants={itemVariants} className="md:col-span-3 mt-4">
                        <Link to="/our-team" className="block">
                            <div className="group relative flex items-center justify-between p-6 md:p-8 bg-gray-50/50 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-dashed border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="flex -space-x-4 pl-2">
                                        {avatars.map((src, i) => (
                                            <div key={i} className="w-12 h-12 rounded-full border-2 border-white dark:border-[#030303] ring-1 ring-black/5 overflow-hidden">
                                                <img src={src} className="w-full h-full object-cover" alt="Brain" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                            Meet the Brains Behind Extrovert
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Built by students, for students. See who's writing the code.</p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all shadow-sm border border-gray-100 dark:border-white/5">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    )
}