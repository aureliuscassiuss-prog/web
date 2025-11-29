import { useState, useEffect } from 'react'

export interface Program {
    _id: string
    name: string
    code: string
    duration: number
    branches: Branch[]
    isActive: boolean
}

export interface Branch {
    _id: string
    name: string
    code: string
    years: Year[]
}

export interface Year {
    _id: string
    year: number
    name: string
    subjects: Subject[]
}

export interface Subject {
    _id: string
    name: string
    code: string
    semester: number
}

export const usePrograms = () => {
    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPrograms = async () => {
        try {
            setLoading(true)
            // Replace with your actual API endpoint
            const response = await fetch('/api/programs')
            if (!response.ok) throw new Error('Failed to fetch programs')

            const data = await response.json()
            setPrograms(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch programs')
            // Fallback mock data for development
            setPrograms([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPrograms()
    }, [])

    return { programs, loading, error, refetch: fetchPrograms }
}