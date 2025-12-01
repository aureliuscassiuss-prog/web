import { useState } from 'react'
import { X, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    onSignupSuccess?: () => void
}

// Separate component to safely use the hook
function GoogleLoginButton({ onSuccess, onError }: { onSuccess: (token: string) => void, onError: () => void }) {
    const loginWithGoogle = useGoogleLogin({
        onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
        onError: onError,
    })

    return (
        <button
            onClick={() => loginWithGoogle()}
            className="btn btn-outline w-full h-9 md:h-10 text-xs md:text-sm"
            type="button"
        >
            <svg className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
        </button>
    )
}

export default function AuthModal({ isOpen, onClose, onSignupSuccess }: AuthModalProps) {
    const { login, register, verifyOtp, forgotPassword, resetPassword, googleLogin: authGoogleLogin } = useAuth()
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showOtp, setShowOtp] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [showResetPassword, setShowResetPassword] = useState(false)
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    })

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!isOpen) return null

    const handleGoogleSuccess = async (accessToken: string) => {
        setIsLoading(true)
        setError('')
        try {
            await authGoogleLogin(accessToken)
            onClose()
            if (onSignupSuccess) onSignupSuccess()
        } catch (err: any) {
            setError(err.message || 'Google login failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            if (isLogin) {
                await login(formData.email, formData.password)
                onClose()
            } else {
                const response = await register(formData.name, formData.email, formData.password)
                if (response && response.requireOtp) {
                    setShowOtp(true)
                    setIsLoading(false)
                    return
                }
                onClose()
                if (onSignupSuccess) {
                    onSignupSuccess()
                }
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed')
            setIsLoading(false)
        }
    }

    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            await verifyOtp(formData.email, otp)
            onClose()
            if (onSignupSuccess) onSignupSuccess()
        } catch (err: any) {
            setError(err.message || 'OTP verification failed')
            setIsLoading(false)
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const response = await forgotPassword(formData.email)
            if (response && response.requireOtp) {
                setShowForgotPassword(false)
                setShowResetPassword(true)
                setIsLoading(false)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send reset code')
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        try {
            await resetPassword(formData.email, otp, newPassword)
            setShowResetPassword(false)
            setShowForgotPassword(false)
            setIsLogin(true)
            setOtp('')
            setNewPassword('')
            setConfirmPassword('')
            setError('')
            alert('Password reset successfully! Please login with your new password.')
            setIsLoading(false)
        } catch (err: any) {
            setError(err.message || 'Password reset failed')
            setIsLoading(false)
        }
    }

    // Standard styling matching other components
    const inputWrapperClass = "relative"
    const inputClass = "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-9 md:pl-10 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300 transition-all"
    const labelClass = "text-xs md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 md:mb-2 block text-gray-900 dark:text-gray-100"
    const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500 dark:text-gray-400"

    const getModalTitle = () => {
        if (showOtp) return 'Enter Verification Code'
        if (showForgotPassword) return 'Reset Password'
        if (showResetPassword) return 'Enter New Password'
        return isLogin ? 'Welcome back' : 'Create an account'
    }

    const getModalDescription = () => {
        if (showOtp) return `We sent a 4-digit code to ${formData.email}`
        if (showForgotPassword) return 'Enter your email to receive a password reset code'
        if (showResetPassword) return `Enter the code sent to ${formData.email} and your new password`
        return isLogin ? 'Enter your email below to sign in to your account' : 'Enter your details below to create your account'
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 animate-modal-in">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-gray-300 dark:data-[state=open]:bg-gray-800"
                >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="sr-only">Close</span>
                </button>

                {/* Header */}
                <div className="flex flex-col space-y-1.5 p-4 md:p-6 pb-2 text-center sm:text-left">
                    <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
                        {getModalTitle()}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {getModalDescription()}
                    </p>
                </div>

                <div className="p-4 md:p-6 pt-2 md:pt-4">
                    {showOtp ? (
                        <form onSubmit={handleOtpVerify} className="space-y-3 md:space-y-4">
                            <div>
                                <label className={labelClass}>OTP Code</label>
                                <div className={inputWrapperClass}>
                                    <Lock className={iconClass} />
                                    <input
                                        type="text"
                                        required
                                        maxLength={4}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={`${inputClass} tracking-widest text-center text-lg`}
                                        placeholder="0000"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-xs md:text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 4}
                                className="btn btn-primary w-full h-9 md:h-10 text-sm md:text-base"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Verify Email'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowOtp(false)}
                                className="w-full text-xs text-gray-500 hover:underline mt-2"
                            >
                                Back to Sign Up
                            </button>
                        </form>
                    ) : showForgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="space-y-3 md:space-y-4">
                            <div>
                                <label className={labelClass}>Email</label>
                                <div className={inputWrapperClass}>
                                    <Mail className={iconClass} />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={inputClass}
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-xs md:text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full h-9 md:h-10 text-sm md:text-base"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Send Reset Code'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgotPassword(false)
                                    setIsLogin(true)
                                }}
                                className="w-full text-xs text-gray-500 hover:underline mt-2"
                            >
                                Back to Login
                            </button>
                        </form>
                    ) : showResetPassword ? (
                        <form onSubmit={handleResetPassword} className="space-y-3 md:space-y-4">
                            <div>
                                <label className={labelClass}>OTP Code</label>
                                <div className={inputWrapperClass}>
                                    <Lock className={iconClass} />
                                    <input
                                        type="text"
                                        required
                                        maxLength={4}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={`${inputClass} tracking-widest text-center text-lg`}
                                        placeholder="0000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>New Password</label>
                                <div className={inputWrapperClass}>
                                    <Lock className={iconClass} />
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={inputClass}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Confirm Password</label>
                                <div className={inputWrapperClass}>
                                    <Lock className={iconClass} />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={inputClass}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-xs md:text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 4}
                                className="btn btn-primary w-full h-9 md:h-10 text-sm md:text-base"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Reset Password'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowResetPassword(false)
                                    setIsLogin(true)
                                }}
                                className="w-full text-xs text-gray-500 hover:underline mt-2"
                            >
                                Back to Login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            {!isLogin && (
                                <div>
                                    <label className={labelClass}>Full Name</label>
                                    <div className={inputWrapperClass}>
                                        <User className={iconClass} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={inputClass}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Email</label>
                                <div className={inputWrapperClass}>
                                    <Mail className={iconClass} />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={inputClass}
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Password</label>
                                <div className={inputWrapperClass}>
                                    <Lock className={iconClass} />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={inputClass}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {isLogin && (
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForgotPassword(true)
                                            setIsLogin(false)
                                        }}
                                        className="text-xs text-gray-500 hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-xs md:text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full h-9 md:h-10 text-sm md:text-base"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Sign In' : 'Sign Up'}
                                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {!showOtp && !showForgotPassword && !showResetPassword && (
                        <>
                            {/* Divider */}
                            <div className="relative my-4 md:my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                                </div>
                                <div className="relative flex justify-center text-[10px] md:text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Social Login - Google Only */}
                            {googleClientId ? (
                                <GoogleLoginButton
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google login failed')}
                                />
                            ) : (
                                <div className="text-center text-xs text-gray-400">
                                    (Google Login not configured)
                                </div>
                            )}

                            <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => {
                                        setIsLogin(!isLogin)
                                        setError('')
                                    }}
                                    className="font-semibold text-gray-900 hover:underline dark:text-gray-100"
                                >
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}