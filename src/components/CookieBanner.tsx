import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check local storage after a small delay to allow animation
        const consent = localStorage.getItem('cookie-consent')
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted')
        setIsVisible(false)
    }

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined') // Still remember they said no
        setIsVisible(false)
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-50 pointer-events-none"
                >
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-2xl pointer-events-auto">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-gray-100 dark:bg-white/10 rounded-xl shrink-0 text-gray-900 dark:text-white">
                                <Cookie size={24} />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                        We use cookies 🍪
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        To ensure you get the best experience, we use cookies for personalization and analytics.
                                        By clicking "Accept", you agree to our <Link to="/privacy" className="underline decoration-gray-300 hover:decoration-gray-900 dark:hover:decoration-white transition-all">Privacy Policy</Link>.
                                    </p>
                                </div>
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={handleAccept}
                                        className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all"
                                    >
                                        Accept All
                                    </button>
                                    <button
                                        onClick={handleDecline}
                                        className="px-4 py-2 bg-transparent border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleDecline}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
