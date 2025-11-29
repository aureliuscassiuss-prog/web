import { useState, useEffect } from 'react'
import { Check, X, Clock, FileText, AlertCircle, Shield, Calendar, User, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface PendingResource {
    _id: string
    title: string
    description: string
    uploader: string
    branch: string
    year: string
    subject: string
    createdAt: string
}

export default function AdminPanel() {
    const { token } = useAuth()
    const [pendingResources, setPendingResources] = useState<PendingResource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchPendingResources()
    }, [])

    const fetchPendingResources = async () => {
        try {
            const response = await fetch('/api/admin/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (response.ok) {
                setPendingResources(data.resources || [])
            } else {
                setError(data.message)
            }
        } catch (err) {
            setError('Failed to fetch pending resources')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAction = async (resourceId: string, action: 'approve' | 'reject') => {
        setProcessingId(resourceId)
        try {
            const response = await fetch('/api/admin/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ resourceId, action })
            })

            if (response.ok) {
                // Optimistic UI update
                setPendingResources(prev => prev.filter(r => r._id !== resourceId))
            } else {
                alert('Action failed')
            }
        } catch (err) {
            alert('Action failed')
        } finally {
            setProcessingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl p-6 md:p-8 animate-fade-in">
            {/* Header Section */}
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage content and review submissions.</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    <Shield className="h-4 w-4 text-gray-900 dark:text-white" />
                    <span>Admin Mode Active</span>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Content Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Reviews</h2>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        {pendingResources.length}
                    </span>
                </div>

                {/* List Content */}
                {pendingResources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-3 dark:bg-gray-900">
                            <Check className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No pending resources to review at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {pendingResources.map((resource) => (
                            <div key={resource._id} className="group flex flex-col gap-4 p-6 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/50 sm:flex-row sm:items-start sm:justify-between">

                                {/* Resource Details */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between gap-4 sm:justify-start">
                                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {resource.title}
                                        </h3>
                                        <span className="inline-flex shrink-0 items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            {resource.subject}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {resource.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{resource.uploader}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" />
                                            <span>{resource.branch} • {resource.year}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                                    <button
                                        onClick={() => handleAction(resource._id, 'approve')}
                                        disabled={processingId === resource._id}
                                        className="btn bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 w-full sm:w-auto h-9 text-xs"
                                    >
                                        <Check className="mr-2 h-3.5 w-3.5" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(resource._id, 'reject')}
                                        disabled={processingId === resource._id}
                                        className="btn btn-outline text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-900 w-full sm:w-auto h-9 text-xs"
                                    >
                                        <X className="mr-2 h-3.5 w-3.5" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}