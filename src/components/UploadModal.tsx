import { useState, useEffect, useMemo } from 'react'
import { X, Upload as UploadIcon, Link as LinkIcon, Loader2, FileText, Layers, Calendar, GraduationCap, BookOpen } from 'lucide-react'
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
            <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in border border-gray-200 dark:border-gray-800">

                {/* HEADER */}
                <div className="sticky top-0 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-5 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <UploadIcon size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Upload Resource</h2>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Share your knowledge with the community</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLoadingStructure ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 space-y-5">

                        {/* Title & Description */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Data Structures Complete Notes"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    disabled={isUploading}
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Briefly describe what this resource contains..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    disabled={isUploading}
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white transition-all resize-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Dropdown Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Program */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Program</label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        required
                                        value={formData.program}
                                        onChange={(e) => setFormData({ ...formData, program: e.target.value, year: '', course: '', subject: '', unit: '' })}
                                        disabled={isUploading}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Program...</option>
                                        {programs.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Year</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        required
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value, course: '', subject: '', unit: '' })}
                                        disabled={!formData.program || isUploading}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Select Year...</option>
                                        {years.map((y: any) => (
                                            <option key={y.id} value={y.id}>{y.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Course/Branch */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Branch</label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        required
                                        value={formData.course}
                                        onChange={(e) => setFormData({ ...formData, course: e.target.value, subject: '', unit: '' })}
                                        disabled={!formData.year || isUploading}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Select Branch...</option>
                                        {courses.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Subject</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value, unit: '' })}
                                        disabled={!formData.course || isUploading}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Select Subject...</option>
                                        {subjects.map((s: any) => {
                                            const name = typeof s === 'string' ? s : s.name;
                                            return <option key={name} value={name}>{name}</option>
                                        })}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Optional Unit & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {units.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Unit (Optional)</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        disabled={!formData.subject || isUploading}
                                        className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Select Unit...</option>
                                        {units.map((u: any, idx: number) => {
                                            // FIX: Handle both string and object units to prevent blank screen crash
                                            const unitName = typeof u === 'string' ? u : u.name;
                                            return <option key={idx} value={unitName}>{unitName}</option>
                                        })}
                                    </select>
                                </div>
                            )}

                            <div className={units.length === 0 ? "col-span-2" : ""}>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Resource Type</label>
                                <select
                                    required
                                    value={formData.resourceType}
                                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                                    disabled={isUploading}
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white appearance-none cursor-pointer"
                                >
                                    <option value="">Select Type...</option>
                                    <option value="notes">Lecture Notes</option>
                                    <option value="pyq">Previous Year Questions</option>
                                    <option value="formula-sheet">Formula Sheet</option>
                                </select>
                            </div>
                        </div>

                        {/* Drive Link */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Google Drive Link</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="url"
                                    required
                                    placeholder="https://drive.google.com/..."
                                    value={formData.driveLink}
                                    onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                    disabled={isUploading}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white transition-all placeholder:text-gray-400"
                                />
                            </div>
                            <p className="mt-1.5 text-[11px] text-gray-400">
                                Ensure the link has "Anyone with the link" access enabled.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isUploading || !formData.driveLink}
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/5 dark:shadow-white/5"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-5 h-5" />
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