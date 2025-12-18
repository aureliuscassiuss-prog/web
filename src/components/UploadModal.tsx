import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Upload as UploadIcon, Link as LinkIcon, FileText, Layers, Calendar, GraduationCap, BookOpen, ChevronDown, Check, Sparkles, Target } from 'lucide-react'
import TyreLoader from './TyreLoader'
import { useAuth } from '../contexts/AuthContext'
import Toast from './Toast'
import useLockBodyScroll from '../hooks/useLockBodyScroll'


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
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Scroll active option into view when opened
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const activeItem = dropdownRef.current.querySelector('[data-selected="true"]')
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest' })
            }
        }
    }, [isOpen])

    const handleSelect = (val: any, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(val)
        onToggle()
    }

    return (
        <div className="relative">
            {Icon && <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    if (!disabled) onToggle()
                }}
                disabled={disabled}
                className={`
                    w-full pl-10 pr-4 py-3 text-sm border rounded-xl flex items-center justify-between outline-none transition-all
                    ${isOpen
                        ? 'ring-2 ring-black/5 dark:ring-white/10 border-transparent bg-white dark:bg-zinc-900'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900'
                    }
                    ${disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-900'}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-gray-200'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <div className={`
                absolute z-[60] w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ease-out origin-top font-sans
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                <div ref={dropdownRef} className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
                    {options.length > 0 ? (
                        options.map((opt) => (
                            <div
                                key={opt.value}
                                data-selected={String(value) === String(opt.value)}
                                onClick={(e) => handleSelect(opt.value, e)}
                                className={`
                                    px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors
                                    ${String(value) === String(opt.value)
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}
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
        examYear: '', // New field for PYQs
    })
    const [isUploading, setIsUploading] = useState(false)
    const [structure, setStructure] = useState<any>(null)
    const [isLoadingStructure, setIsLoadingStructure] = useState(false)

    const [activeField, setActiveField] = useState<string | null>(null)
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', show: boolean }>({ message: '', type: 'success', show: false })

    // Prevent body scroll when modal is open
    useLockBodyScroll(isOpen);



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

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, show: true })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. Basic Validation
        if (!formData.driveLink) {
            showToast('Please enter a Google Drive link', 'error')
            return
        }

        if (!navigator.onLine) {
            showToast('No internet connection', 'error')
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
                yearNum: formData.year, // Send as string ID (schema expects text now)
                examYear: formData.resourceType === 'pyq' ? formData.examYear : undefined // Only send for PYQs
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
                // Show tech details if available
                const detailMsg = data.details ? (data.details.message || JSON.stringify(data.details)) : '';
                throw new Error((data.message || 'Failed to upload resource') + (detailMsg ? `: ${detailMsg}` : ''))
            }

            // Success
            showToast('Request sent! Thank you for your contribution.', 'success')

            // Allow toast to show before closing
            setTimeout(() => {
                onSuccess(formData.title)
                resetForm()
                onClose()
            }, 1500)

        } catch (error: any) {
            console.error('Upload Process Error:', error)
            showToast(error.message || 'Failed to upload resource.', 'error')
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
            examYear: ''
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4">

            {/* Modal Container */}
            <div className="
                w-full sm:max-w-2xl bg-white dark:bg-[#09090b] 
                rounded-t-3xl sm:rounded-3xl shadow-2xl relative
                flex flex-col
                max-h-[90dvh] sm:max-h-[85vh]
                animate-slide-up sm:animate-modal-in
                border border-transparent sm:border-gray-200 sm:dark:border-white/10
                ring-1 ring-black/5 dark:ring-white/5
            ">

                {/* HEADER */}
                <div className="flex-none p-5 sm:p-6 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-t-3xl z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Upload Resource</h2>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={10} />
                                Beta
                            </span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Share your knowledge with the community</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-600 dark:text-gray-400 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800">

                    {isLoadingStructure ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 animate-pulse">
                            <TyreLoader size={40} className="mb-4" />
                            <p className="text-sm font-medium">Loading academic structure...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Section 1: Basic Info */}
                            <div className="space-y-5">
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-2 pl-1 group-focus-within:text-blue-500 transition-colors">Resource Title</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Data Structures Complete Notes"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            disabled={isUploading}
                                            className="w-full px-4 py-3 text-sm bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white transition-all placeholder:text-gray-400 hover:bg-white dark:hover:bg-zinc-900"
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-2 pl-1 group-focus-within:text-blue-500 transition-colors">Description</label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="Briefly describe what this resource contains..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            disabled={isUploading}
                                            className="w-full px-4 py-3 text-sm bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white transition-all resize-none placeholder:text-gray-400 hover:bg-white dark:hover:bg-zinc-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-white/5" />

                            {/* Section 2: Academic Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                                    <Layers size={16} className="text-blue-500" />
                                    Academic Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Program</label>
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

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Year</label>
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

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Branch</label>
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

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Semester</label>
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

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Subject</label>
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
                            </div>

                            <hr className="border-gray-100 dark:border-white/5" />

                            {/* Section 3: Resource Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                                    <FileText size={16} className="text-purple-500" />
                                    Resource Files
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {units.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Unit (Optional)</label>
                                            <CustomSelect
                                                icon={Target}
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
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Type</label>
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

                                {/* Exam Year for PYQs */}
                                {formData.resourceType === 'pyq' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">
                                            Exam Year
                                        </label>
                                        <CustomSelect
                                            icon={Calendar}
                                            placeholder="Select Exam Year"
                                            value={formData.examYear}
                                            options={[
                                                { label: '2025', value: '2025' },
                                                { label: '2024', value: '2024' },
                                                { label: '2023', value: '2023' },
                                                { label: '2022', value: '2022' },
                                                { label: '2021', value: '2021' },
                                                { label: 'Older', value: 'older' }
                                            ]}
                                            onChange={(val) => setFormData({ ...formData, examYear: val })}
                                            disabled={isUploading}
                                            isOpen={activeField === 'examYear'}
                                            onToggle={() => toggleField('examYear')}
                                        />
                                    </div>
                                )}

                                {/* Drive Link */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1.5 pl-1">Google Drive Link</label>
                                    <div className="relative group">
                                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="url"
                                            required
                                            placeholder="https://drive.google.com/..."
                                            value={formData.driveLink}
                                            onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                            disabled={isUploading}
                                            className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 dark:text-white transition-all placeholder:text-gray-400 hover:bg-white dark:hover:bg-zinc-900"
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] text-gray-400 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Ensure "Anyone with the link" access is enabled.
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={
                                    isUploading ||
                                    !formData.title ||
                                    !formData.description ||
                                    !formData.program ||
                                    !formData.year ||
                                    !formData.course ||
                                    !formData.semester ||
                                    !formData.subject ||
                                    !formData.resourceType ||
                                    !formData.driveLink ||
                                    (formData.resourceType === 'pyq' && !formData.examYear)
                                }
                                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {isUploading ? (
                                    <>
                                        <TyreLoader size={20} />
                                        Submitting Request...
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Submit Resource
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <Toast message={toast.message} show={toast.show} type={toast.type} />
        </div>
    )
}
