import { useState, useEffect } from 'react'
import { X, Upload as UploadIcon, Link as LinkIcon } from 'lucide-react'
import { BRANCHES, YEARS, getSubjectsByBranchAndYear } from '../data/academicStructure'

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
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: 'B.Tech',
        yearNum: 0,
        year: '',
        branch: '',
        subject: '',
        resourceType: '',
        driveLink: '',
    })
    const [isUploading, setIsUploading] = useState(false)

    // Update form data when initialData changes or modal opens
    useEffect(() => {
        if (isOpen && initialData) {
            const yearStr = initialData.year ? `${initialData.year}${initialData.year === 1 ? 'st' : initialData.year === 2 ? 'nd' : initialData.year === 3 ? 'rd' : 'th'} Year` : ''
            setFormData(prev => ({
                ...prev,
                yearNum: initialData.year || 0,
                year: yearStr,
                branch: initialData.branch || '',
                subject: initialData.subject || '',
                resourceType: initialData.resourceType || ''
            }))
        }
    }, [isOpen, initialData])

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
            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Authentication required. Please sign in.')
            }

            const response = await fetch('/api/upload/resource', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload resource')
            }

            // Success
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
            course: 'B.Tech',
            yearNum: 0,
            year: '',
            branch: '',
            subject: '',
            resourceType: '',
            driveLink: '',
        })
    }

    const handleYearChange = (yearStr: string) => {
        const yearNum = parseInt(yearStr.replace(/\D/g, ''))
        setFormData({ ...formData, year: yearStr, yearNum, branch: '', subject: '' })
    }

    const handleBranchChange = (branchId: string) => {
        setFormData({ ...formData, branch: branchId, subject: '' })
    }

    const availableSubjects = formData.yearNum && formData.branch
        ? getSubjectsByBranchAndYear(formData.branch, formData.yearNum)
        : []

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
                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Course *</label>
                            <select
                                required
                                value={formData.course}
                                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                disabled={isUploading}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="B.Tech">B.Tech</option>
                                <option value="B.Sc">B.Sc</option>
                                <option value="BBA">BBA</option>
                                <option value="B.Com">B.Com</option>
                                <option value="MBA">MBA</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Year *</label>
                            <select
                                required
                                value={formData.year}
                                onChange={(e) => handleYearChange(e.target.value)}
                                disabled={isUploading}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select...</option>
                                {YEARS.map(year => (
                                    <option key={year} value={`${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`}>
                                        Year {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Branch *</label>
                            <select
                                required
                                value={formData.branch}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                disabled={isUploading}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select...</option>
                                {BRANCHES.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.code} - {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Subject *</label>
                            <select
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                disabled={!formData.branch || !formData.yearNum || isUploading}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select...</option>
                                {availableSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

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
                            <option value="assignment">Assignment</option>
                            <option value="formula-sheet">Formula Sheet</option>
                            <option value="summary">Summary</option>
                            <option value="other">Other</option>
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
            </div>
        </div>
    )
}