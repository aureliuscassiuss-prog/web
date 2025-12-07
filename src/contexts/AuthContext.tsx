import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { auth } from '../lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

interface User {
    id: string
    name: string
    email: string
    reputation: number
    avatar?: string
    phone?: string
    semester?: number
    college?: string
    branch?: string
    course?: string // Program
    year?: number
    gender?: 'male' | 'female' | 'other'
    role?: 'user' | 'admin' | 'semi-admin' | 'content-reviewer' | 'structure-manager'
    isBanned?: boolean
    canUpload?: boolean
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<any>
    verifyOtp: (email: string, otp: string) => Promise<void>
    forgotPassword: (email: string) => Promise<any>
    resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>
    googleLogin: (credential: string) => Promise<void>
    logout: () => void
    updateUser: (updatedUser: User) => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', email, password })
            })

            if (!response.ok) {
                const text = await response.text()
                let errorMessage = 'Login failed'
                try {
                    const error = JSON.parse(text)
                    errorMessage = error.message || error.error || errorMessage
                } catch (e) {
                    errorMessage = `Server Error (${response.status})`
                }
                throw new Error(errorMessage)
            }

            const data = await response.json()
            setToken(data.token)
            setUser(data.user)
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
        } catch (error: any) {
            console.error('Login error:', error)
            throw new Error(error.message || 'Login failed')
        }
    }

    const register = async (name: string, email: string, password: string) => {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'register', name, email, password })
            })

            if (!response.ok) {
                const text = await response.text()
                let errorMessage = 'Registration failed'
                try {
                    const error = JSON.parse(text)
                    errorMessage = error.message || error.error || errorMessage
                } catch (e) {
                    errorMessage = `Server Error (${response.status})`
                }
                throw new Error(errorMessage)
            }

            return await response.json()
        } catch (error: any) {
            console.error('Registration error:', error)
            throw new Error(error.message || 'Registration failed')
        }
    }

    const verifyOtp = async (email: string, otp: string) => {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify-otp', email, otp })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Verification failed')
            }

            const data = await response.json()
            setToken(data.token)
            setUser(data.user)
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
        } catch (error: any) {
            console.error('OTP Verification error:', error)
            throw new Error(error.message || 'Verification failed')
        }
    }

    const googleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)
            const idToken = await result.user.getIdToken()

            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'firebase-login', token: idToken })
            })

            if (!response.ok) {
                const text = await response.text()
                let errorMessage = 'Google login failed'
                try {
                    const error = JSON.parse(text)
                    errorMessage = error.message || error.error || errorMessage
                } catch (e) {
                    console.error('Non-JSON error response:', text)
                    errorMessage = `Server Error (${response.status}): Check console for details`
                }
                throw new Error(errorMessage)
            }

            const data = await response.json()
            setToken(data.token)
            setUser(data.user)
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
        } catch (error: any) {
            console.error('Google login error:', error)
            throw new Error(error.message || 'Google login failed')
        }
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
    }

    const forgotPassword = async (email: string) => {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'forgot-password', email })
        })

        if (!response.ok) {
            let errorMessage = 'Failed to send reset code'
            try {
                const error = await response.json()
                errorMessage = error.message || error.error || 'Failed to send reset code'
            } catch (e) {
                errorMessage = `Server error (${response.status}): ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        const data = await response.json()
        return data
    }

    const resetPassword = async (email: string, otp: string, newPassword: string) => {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset-password', email, otp, newPassword })
        })

        if (!response.ok) {
            let errorMessage = 'Password reset failed'
            try {
                const error = await response.json()
                errorMessage = error.message || error.error || 'Password reset failed'
            } catch (e) {
                errorMessage = `Server error (${response.status}): ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        await response.json()
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, verifyOtp, forgotPassword, resetPassword, googleLogin, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
