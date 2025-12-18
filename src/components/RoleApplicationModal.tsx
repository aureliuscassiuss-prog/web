import { useState } from 'react'
import { X, Send, ShieldCheck, UserCheck, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import TyreLoader from './TyreLoader'
import useLockBodyScroll from '../hooks/useLockBodyScroll'


interface RoleApplicationModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function RoleApplicationModal({ isOpen, onClose }: RoleApplicationModalProps) {
    const { token, user } = useAuth()
    const [selectedRole, setSelectedRole] = useState('')
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // Prevent body scroll when modal is open
    useLockBodyScroll(isOpen);

    if (!isOpen) return null


    const ROLES = [
        {
            id: 'content-reviewer',
            title: 'Content Reviewer',
            icon: BookOpen,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            desc: 'Verify uploads, manage resources, and ensure quality.'
        },
        {
            id: 'semi-admin',
            title: 'Semi-Admin / Operations',
            icon: UserCheck,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
            desc: 'Manage users, community engagement, and day-to-day ops.'
        }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRole || !reason) return

        setIsSubmitting(true)
        setStatus('idle')
        setErrorMessage('')

        try {
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'request-role',
                    role: selectedRole,
                    reason: reason
                })
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.message || 'Failed to submit application')

            setStatus('success')
            setTimeout(() => {
                onClose()
                setStatus('idle')
                setSelectedRole('')
                setReason('')
            }, 2000)

        } catch (error: any) {
            console.error(error)
            setStatus('error')
            setErrorMessage(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white dark:bg-[#09090b] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                            Join the Team
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Apply for a role to help shape the future of Extrovert.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Application Sent!</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                                We've received your request. An admin will review it shortly.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Role Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                                    Choose a Role
                                </label>
                                <div className="grid gap-3">
                                    {ROLES.map((role) => (
                                        <div
                                            key={role.id}
                                            onClick={() => setSelectedRole(role.id)}
                                            className={`
                                                relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                                                ${selectedRole === role.id
                                                    ? `border-blue-500 bg-blue-50 dark:bg-blue-900/10`
                                                    : 'border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/5'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2.5 rounded-lg ${role.bg}`}>
                                                    <role.icon className={`w-5 h-5 ${role.color}`} />
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-sm ${selectedRole === role.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                                        {role.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                                        {role.desc}
                                                    </p>
                                                </div>
                                                {selectedRole === role.id && (
                                                    <div className="absolute top-4 right-4">
                                                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reason Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                                    Why are you a good fit?
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Tell us about your experience or why you want to contribute..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 
                                            bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white 
                                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50
                                            transition-all outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                />
                            </div>

                            {/* Error Message */}
                            {status === 'error' && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedRole || !reason}
                                className="w-full py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <TyreLoader size={18} />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Application
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
