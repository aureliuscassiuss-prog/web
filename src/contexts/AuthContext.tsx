import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

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
    role?: 'user' | 'admin'
    isBanned?: boolean
    canUpload?: boolean
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
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
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        })

        if (!response.ok) {
            let errorMessage = 'Login failed'
            try {
                const error = await response.json()
                errorMessage = error.message || error.error || 'Login failed'
            } catch (e) {
                // Response is not JSON (likely HTML error page)
                errorMessage = `Server error (${response.status}): ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
    }

    const register = async (name: string, email: string, password: string) => {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', name, email, password })
        })

        if (!response.ok) {
            let errorMessage = 'Registration failed'
            try {
                const error = await response.json()
                errorMessage = error.message || error.error || 'Registration failed'
            } catch (e) {
                // Response is not JSON (likely HTML error page)
                errorMessage = `Server error (${response.status}): ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
    }

    const googleLogin = async (credential: string) => {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'google', token: credential })
        })

        if (!response.ok) {
            let errorMessage = 'Google login failed'
            try {
                const error = await response.json()
                errorMessage = error.message || error.error || 'Google login failed'
            } catch (e) {
                errorMessage = `Server error (${response.status}): ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
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

    return (
        <AuthContext.Provider value={{ user, token, login, register, googleLogin, logout, updateUser, isLoading }}>
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
