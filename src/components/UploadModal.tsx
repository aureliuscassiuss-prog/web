import { useState, useEffect, useMemo } from 'react'
import { X, Upload as UploadIcon, Link as LinkIcon, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (title: string) => void
    initialData?: {
        year?: number
        branch?: string
        subject?: string
        resourceType?: string
    }
}

export default function UploadModal({ isOpen, onClose, onSuccess, initialData }: UploadModalProps) {
    const { token } = useAuth()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        program: '', // Maps to 'course' in API
        year: '',
        course: '',  // Maps to 'branch' in API
        subject: '',
        unit: '',    // New field
        resourceType: '',
        driveLink: '',
    })
    const [isUploading, setIsUploading] = useState(false)
    const [structure, setStructure] = useState<any>(null)
    const [isLoadingStructure, setIsLoadingStructure] = useState(false)

    // Fetch structure when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchStructure()
        }
    }, [isOpen])

    const fetchStructure = async () => {
        setIsLoadingStructure(true)
        try {
            const response = await fetch('/api/admin?action=structure', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setStructure(data)
            }
        } catch (error) {
            console.error('Failed to fetch structure', error)
        } finally {
            setIsLoadingStructure(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. Basic Validation
        if (!formData.driveLink) {
            alert('Please enter a Google Drive link')
            return
        }

        if (!navigator.onLine) {
            alert('No internet connection')
            return
        }

        setIsUploading(true)

        try {
            if (!token) {
                throw new Error('Authentication required. Please sign in.')
            }

            // Map new structure to API expected fields
            const apiData = {
                ...formData,
                course: formData.program, // Map program -> course
                branch: formData.course,  // Map course -> branch
                yearNum: parseInt(formData.year) || 0 // Extract number if needed
            }

            const response = await fetch('/api/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(apiData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload resource')
            }

            // Success
            alert('We have sent the request. Your notes are updated after approval. Thank you for your notes.')
            onSuccess(formData.title)
            resetForm()
            onClose()

        } catch (error: any) {
            console.error('Upload Process Error:', error)
            alert(error.message || 'Failed to upload resource.')
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            program: '',
            year: '',
            course: '',
            subject: '',
            unit: '',
            resourceType: '',
            driveLink: '',
        })
    }

    // Derived state for dropdown options
    const programs = structure?.programs || []

    const years = useMemo(() => {
        if (!formData.program) return []
        const prog = programs.find((p: any) => p.id === formData.program)
        return prog?.years || []
    }, [formData.program, programs])

    const courses = useMemo(() => {
        if (!formData.year) return []
        const yr = years.find((y: any) => y.id === formData.year)
        return yr?.courses || []
    }, [formData.year, years])

    const subjects = useMemo(() => {
        if (!formData.course) return []
        const crs = courses.find((c: any) => c.id === formData.course)
        return crs?.subjects || []
    }, [formData.course, courses])

    const units = useMemo(() => {
        if (!formData.subject) return []
        const subjectName = formData.subject
        // Find the subject object in the current course
        const crs = courses.find((c: any) => c.id === formData.course)
        if (!crs) return []

        const subject = crs.subjects.find((s: any) =>
            (typeof s === 'string' ? s : s.name) === subjectName
        )

        if (subject && typeof subject === 'object' && subject.units) {
            return subject.units
        }
        return []
    }, [formData.subject, formData.course, courses])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in border border-gray-200 dark:border-gray-800">
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 md:p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Upload Resource</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mt-1">Share your notes via Google Drive link</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                {isLoadingStructure ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Title *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Data Structures Notes"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                disabled={isUploading}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Description *</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Brief description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={isUploading}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Program Selection */}
                            <div>
                                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Program *</label>
                                <select
                                    required
                                    value={formData.program}
                                    onChange={(e) => setFormData({ ...formData, program: e.target.value, year: '', course: '', subject: '', unit: '' })}
                                    disabled={isUploading}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Program...</option>
                                    {programs.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Selection */}
                            <div>
                                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Year *</label>
                                <select
                                    required
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value, course: '', subject: '', unit: '' })}
                                    disabled={!formData.program || isUploading}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Year...</option>
                                    {years.map((y: any) => (
                                        <option key={y.id} value={y.id}>{y.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Course/Branch Selection */}
                            <div>
                                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Course *</label>
                                <select
                                    required
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value, subject: '', unit: '' })}
                                    disabled={!formData.year || isUploading}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Course...</option>
                                    {courses.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Selection */}
                            <div>
                                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Subject *</label>
                                <select
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value, unit: '' })}
                                    disabled={!formData.course || isUploading}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Subject...</option>
                                    {subjects.map((s: any) => {
                                        const name = typeof s === 'string' ? s : s.name;
                                        return <option key={name} value={name}>{name}</option>
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Unit Selection - Only show if units exist for the subject */}
                        {units.length > 0 && (
                            <div>
                                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Unit (Optional)</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    disabled={!formData.subject || isUploading}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Unit...</option>
                                    {units.map((u: string) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Resource Type *</label>
                            <select
                                required
                                value={formData.resourceType}
                                onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                                disabled={isUploading}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select...</option>
                                <option value="notes">Notes</option>
                                <option value="pyq">Previous Year Questions</option>
                                <option value="formula-sheet">Formula Sheet</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Google Drive Link *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://drive.google.com/..."
                                    value={formData.driveLink}
                                    onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                    disabled={isUploading}
                                    className="w-full pl-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Make sure the link is accessible to everyone (Anyone with the link can view)
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading || !formData.driveLink}
                            className="w-full bg-red-600 text-white py-2.5 md:py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    Submit Resource
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}