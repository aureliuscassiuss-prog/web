import { useState, useEffect, useMemo } from 'react'
import { X, Upload as UploadIcon, Link as LinkIcon, Loader2, FileText, Layers, Calendar, GraduationCap, BookOpen, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// --- CUSTOM SELECT COMPONENT ---
interface Option {
    label: string
    value: string | number
}

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    isOpen,
    onToggle,
    icon: Icon
}: {
    value: string | number
    onChange: (val: any) => void
    options: Option[]
    placeholder: string
    disabled: boolean
    isOpen: boolean
    onToggle: () => void
    icon?: any
}) => {
    const selectedOption = options.find(opt => String(opt.value) === String(value))

    const handleSelect = (val: any, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(val)
        onToggle()
    }

    return (
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    if (!disabled) onToggle()
                }}
                disabled={disabled}
                className={`
                    w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl flex items-center justify-between outline-none transition-all
                    ${isOpen ? 'ring-2 ring-black/5 dark:ring-white/10 border-transparent' : 'border-gray-200 dark:border-gray-800'}
                    ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : 'bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <div className={`
                absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ease-out origin-top
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {options.length > 0 ? (
                        options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={(e) => handleSelect(opt.value, e)}
                                className={`
                                    px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors
                                    ${String(value) === String(opt.value)
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}
                                `}
                            >
                                <span className="truncate">{opt.label}</span>
                                {String(value) === String(opt.value) && <Check size={14} className="flex-shrink-0" />}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <p className="text-xs text-gray-400">No options found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (title: string) => void
    initialData?: {
        filters?: {
            year?: number
            semester?: string
            branch?: string
            subject?: string
            course?: string
            unit?: string
        }
        activeTab?: string
    }
}

export default function UploadModal({ isOpen, onClose, onSuccess, initialData }: UploadModalProps) {
    const { token } = useAuth()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        program: '', // Maps to 'course' in API
        year: '',
        semester: '', // New field
        course: '',  // Maps to 'branch' in API
        subject: '',
        unit: '',
        resourceType: '',
        driveLink: '',
    })
    const [isUploading, setIsUploading] = useState(false)
    const [structure, setStructure] = useState<any>(null)
    const [isLoadingStructure, setIsLoadingStructure] = useState(false)
    const [activeField, setActiveField] = useState<string | null>(null)

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveField(null)
        if (isOpen) document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [isOpen])

    const toggleField = (field: string) => {
        setActiveField(prev => prev === field ? null : field)
    }

    // Fetch structure when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchStructure()
        }
    }, [isOpen])

    // Pre-fill form data when structure is loaded and initialData is available
    useEffect(() => {
        if (isOpen && structure && initialData?.filters) {
            const { filters, activeTab } = initialData

            // Map Resource Type
            let type = ''
            if (activeTab === 'notes') type = 'notes'
            else if (activeTab === 'pyqs') type = 'pyq'
            else if (activeTab === 'formula') type = 'formula-sheet'

            // Find Year ID
            let yearId = ''
            if (filters.course) { // filters.course is the Program ID
                const program = structure.programs?.find((p: any) => p.id === filters.course)
                if (program && filters.year) {
                    const year = program.years?.find((y: any) =>
                        y.id === filters.year?.toString() ||
                        y.name.includes(filters.year?.toString())
                    )
                    if (year) yearId = year.id
                }
            }

            setFormData(prev => ({
                ...prev,
                program: filters.course || '',
                course: filters.branch || '',
                subject: filters.subject || '',
                unit: filters.unit || '',
                year: yearId,
                semester: filters.semester || '',
                resourceType: type
            }))
        }
    }, [isOpen, structure, initialData])

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
            semester: '',
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

    const semesters = useMemo(() => {
        if (!formData.course) return []
        const crs = courses.find((c: any) => c.id === formData.course)
        return crs?.semesters || []
    }, [formData.course, courses])

    const subjects = useMemo(() => {
        if (!formData.semester) return []
        const sem = semesters.find((s: any) => s.id === formData.semester)
        return sem?.subjects || []
    }, [formData.semester, semesters])

    const units = useMemo(() => {
        if (!formData.subject) return []
        const subjectName = formData.subject
        // Find the subject object in the current semester
        const sem = semesters.find((s: any) => s.id === formData.semester)
        if (!sem) return []

        const subject = sem.subjects.find((s: any) =>
            (typeof s === 'string' ? s : s.name) === subjectName
        )

        if (subject && typeof subject === 'object' && subject.units) {
            return subject.units
        }
        return []
    }, [formData.subject, formData.semester, semesters])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in border border-gray-200 dark:border-gray-800 scrollbar-hide">

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
                    <form onSubmit={handleSubmit} className="p-5 space-y-6">

                        {/* Title & Description */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Title</label>
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
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Description</label>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Program */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Program</label>
                                <CustomSelect
                                    icon={GraduationCap}
                                    placeholder="Select Program"
                                    value={formData.program}
                                    options={programs.map((p: any) => ({ label: p.name, value: p.id }))}
                                    onChange={(val) => setFormData({ ...formData, program: val, year: '', course: '', semester: '', subject: '', unit: '' })}
                                    disabled={isUploading}
                                    isOpen={activeField === 'program'}
                                    onToggle={() => toggleField('program')}
                                />
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Year</label>
                                <CustomSelect
                                    icon={Calendar}
                                    placeholder="Select Year"
                                    value={formData.year}
                                    options={years.map((y: any) => ({ label: y.name, value: y.id }))}
                                    onChange={(val) => setFormData({ ...formData, year: val, course: '', semester: '', subject: '', unit: '' })}
                                    disabled={!formData.program || isUploading}
                                    isOpen={activeField === 'year'}
                                    onToggle={() => toggleField('year')}
                                />
                            </div>

                            {/* Branch */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Branch</label>
                                <CustomSelect
                                    icon={Layers}
                                    placeholder="Select Branch"
                                    value={formData.course}
                                    options={courses.map((c: any) => ({ label: c.name, value: c.id }))}
                                    onChange={(val) => setFormData({ ...formData, course: val, semester: '', subject: '', unit: '' })}
                                    disabled={!formData.year || isUploading}
                                    isOpen={activeField === 'course'}
                                    onToggle={() => toggleField('course')}
                                />
                            </div>

                            {/* Semester */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Semester</label>
                                <CustomSelect
                                    icon={Calendar}
                                    placeholder="Select Semester"
                                    value={formData.semester}
                                    options={semesters.map((s: any) => ({ label: s.name, value: s.id }))}
                                    onChange={(val) => setFormData({ ...formData, semester: val, subject: '', unit: '' })}
                                    disabled={!formData.course || isUploading}
                                    isOpen={activeField === 'semester'}
                                    onToggle={() => toggleField('semester')}
                                />
                            </div>

                            {/* Subject */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Subject</label>
                                <CustomSelect
                                    icon={BookOpen}
                                    placeholder="Select Subject"
                                    value={formData.subject}
                                    options={subjects.map((s: any) => ({ label: (typeof s === 'string' ? s : s.name), value: (typeof s === 'string' ? s : s.name) }))}
                                    onChange={(val) => setFormData({ ...formData, subject: val, unit: '' })}
                                    disabled={!formData.semester || isUploading}
                                    isOpen={activeField === 'subject'}
                                    onToggle={() => toggleField('subject')}
                                />
                            </div>
                        </div>

                        {/* Optional Unit & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {units.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Unit (Optional)</label>
                                    <CustomSelect
                                        placeholder="Select Unit"
                                        value={formData.unit}
                                        options={units.map((u: any) => ({ label: (typeof u === 'string' ? u : u.name), value: (typeof u === 'string' ? u : u.name) }))}
                                        onChange={(val) => setFormData({ ...formData, unit: val })}
                                        disabled={!formData.subject || isUploading}
                                        isOpen={activeField === 'unit'}
                                        onToggle={() => toggleField('unit')}
                                    />
                                </div>
                            )}

                            <div className={units.length === 0 ? "col-span-2" : ""}>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Resource Type</label>
                                <CustomSelect
                                    icon={FileText}
                                    placeholder="Select Type"
                                    value={formData.resourceType}
                                    options={[
                                        { label: 'Lecture Notes', value: 'notes' },
                                        { label: 'Previous Year Questions', value: 'pyq' },
                                        { label: 'Formula Sheet', value: 'formula-sheet' }
                                    ]}
                                    onChange={(val) => setFormData({ ...formData, resourceType: val })}
                                    disabled={isUploading}
                                    isOpen={activeField === 'resourceType'}
                                    onToggle={() => toggleField('resourceType')}
                                />
                            </div>
                        </div>

                        {/* Drive Link */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 pl-1">Google Drive Link</label>
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
                            <p className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                Ensure the link has "Anyone with the link" access enabled.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isUploading || !formData.driveLink}
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/5 dark:shadow-white/5"
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
