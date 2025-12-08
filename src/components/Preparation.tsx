import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BookOpen,
    PlayCircle,
    GraduationCap,
    Calendar,
    Layers,
    Search,
    ChevronDown,
    Check,
    Library,
    Share2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Toast from './Toast'
import TyreLoader from './TyreLoader'

// --- Types ---
interface Program {
    id: string
    name: string
    years: Year[]
}

interface Year {
    id: string
    name: string
    courses: Course[]
}

interface Course {
    id: string
    name: string
    semesters: Semester[]
}

interface Semester {
    id: string
    name: string
    subjects: (string | SubjectObject)[]
}

interface SubjectObject {
    name: string
    units?: (string | UnitObject)[]
}

interface UnitObject {
    name: string
    videos?: any[]
}

export default function Preparation() {
    const navigate = useNavigate()
    const [structure, setStructure] = useState<{ programs: Program[] }>({ programs: [] })
    const [loading, setLoading] = useState(true)

    // Selection State with localStorage persistence
    const [selProgramId, setSelProgramId] = useState<string>(() => {
        return localStorage.getItem('preparationProgramId') || ''
    })
    const [selYearId, setSelYearId] = useState<string>(() => {
        return localStorage.getItem('preparationYearId') || ''
    })
    const [selSemesterId, setSelSemesterId] = useState<string>(() => {
        return localStorage.getItem('preparationSemesterId') || ''
    })
    const [selCourseId, setSelCourseId] = useState<string>(() => {
        return localStorage.getItem('preparationCourseId') || ''
    })

    // UI State
    const [openDropdown, setOpenDropdown] = useState<'program' | 'year' | 'semester' | 'course' | null>(null)
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
    const [toastMessage, setToastMessage] = useState('')
    const [showToast, setShowToast] = useState(false)

    const triggerToast = (msg: string) => {
        setToastMessage(msg)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
    }

    // --- Persist selections to localStorage ---
    useEffect(() => {
        if (selProgramId) localStorage.setItem('preparationProgramId', selProgramId)
        else localStorage.removeItem('preparationProgramId')
    }, [selProgramId])

    useEffect(() => {
        if (selYearId) localStorage.setItem('preparationYearId', selYearId)
        else localStorage.removeItem('preparationYearId')
    }, [selYearId])

    useEffect(() => {
        if (selSemesterId) localStorage.setItem('preparationSemesterId', selSemesterId)
        else localStorage.removeItem('preparationSemesterId')
    }, [selSemesterId])

    useEffect(() => {
        if (selCourseId) localStorage.setItem('preparationCourseId', selCourseId)
        else localStorage.removeItem('preparationCourseId')
    }, [selCourseId])

    // --- Auto-select based on User Profile ---
    const { user } = useAuth()
    const autoSelectedRef = useRef(false)

    useEffect(() => {
        // Only auto-select if nothing is selected yet (not even from localStorage)
        if (!autoSelectedRef.current && user && structure.programs.length > 0 && !selProgramId) {
            const program = structure.programs.find(p => p.id === user.course)
            if (program) {
                const year = program.years.find(y =>
                    y.id === user.year?.toString() ||
                    y.name === user.year?.toString() ||
                    y.name.startsWith(user.year?.toString())
                )
                if (year) {
                    const course = year.courses?.find(c => c.id === user.branch) // Branch/Course
                    if (course) {
                        const semester = course.semesters?.find(s =>
                            s.id === user.semester?.toString() ||
                            s.name === user.semester?.toString() ||
                            s.id === `semester-${user.semester}`
                        )
                        if (semester) {
                            setSelProgramId(program.id)
                            setSelYearId(year.id)
                            setSelCourseId(course.id)
                            setSelSemesterId(semester.id)
                            autoSelectedRef.current = true
                        } else {
                            setSelProgramId(program.id)
                            setSelYearId(year.id)
                            setSelCourseId(course.id)
                            autoSelectedRef.current = true
                        }
                    } else {
                        setSelProgramId(program.id)
                        setSelYearId(year.id)
                        autoSelectedRef.current = true
                    }
                }
            }
        }
    }, [user, structure, selProgramId])

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null)
        if (openDropdown) window.addEventListener('click', handleClickOutside)
        return () => window.removeEventListener('click', handleClickOutside)
    }, [openDropdown])

    useEffect(() => {
        // Mock API call
        fetch('/api/admin?action=structure')
            .then(res => res.json())
            .then(data => {
                setStructure(data)
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
                // Fallback Mock Data for Demo if fetch fails
                setStructure({
                    programs: [
                        {
                            id: 'p1', name: 'Bachelor of Technology', years: [
                                {
                                    id: 'y1', name: '1st Year', courses: [
                                        {
                                            id: 'c1', name: 'Computer Science & Engineering', semesters: [
                                                {
                                                    id: 's1', name: 'Semester 1', subjects: [
                                                        { name: 'Engineering Physics', units: ['Quantum Mechanics', 'Optics', 'Lasers', 'Fiber Optics'] },
                                                        { name: 'Mathematics I', units: ['Calculus', 'Matrices', 'Vector Spaces'] }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                { id: 'y2', name: '2nd Year', courses: [] }
                            ]
                        },
                        { id: 'p2', name: 'Bachelor of Pharmacy', years: [] }
                    ]
                })
            })
    }, [])

    // Derived Data
    const programs = structure.programs || []
    const selectedProgram = programs.find(p => p.id === selProgramId)
    const years = selectedProgram?.years || []
    const selectedYear = years.find(y => y.id === selYearId)
    const courses = selectedYear?.courses || []
    const selectedCourse = courses.find(c => c.id === selCourseId)
    const semesters = selectedCourse?.semesters || []
    const selectedSemester = semesters.find(s => s.id === selSemesterId)
    const subjects = selectedSemester?.subjects || []

    const handleStart = (subjectName: string) => {
        const params = new URLSearchParams({
            program: selProgramId,
            year: selYearId,
            semester: selSemesterId,
            course: selCourseId,
            subject: subjectName
        })
        navigate(`/preparation/play?${params.toString()}`)
    }

    const handleShareUnit = (e: React.MouseEvent, subjectName: string, unitName: string) => {
        e.stopPropagation()
        const params = new URLSearchParams({
            prog: selProgramId,
            yr: selYearId,
            cr: selCourseId,
            sem: selSemesterId,
            sub: subjectName,
            unit: unitName
        })

        const url = `${window.location.origin}/share/unit?${params.toString()}`
        navigator.clipboard.writeText(url)
        triggerToast('Unit link copied to clipboard!')
    }

    const handleShareSubject = (e: React.MouseEvent, subjectName: string) => {
        e.stopPropagation()
        const params = new URLSearchParams({
            prog: selProgramId,
            yr: selYearId,
            cr: selCourseId,
            sem: selSemesterId,
            sub: subjectName
        })

        const url = `${window.location.origin}/share/subject?${params.toString()}`
        navigator.clipboard.writeText(url)
        triggerToast('Subject link copied to clipboard!')
    }

    const DropdownItem = ({ label, selected, onClick }: any) => (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onClick()
                setOpenDropdown(null)
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                ${selected ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}
            `}
        >
            <span className="truncate">{label}</span>
            {selected && <Check size={12} />}
        </button>
    )



    if (loading) return (
        <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center gap-3">
            <TyreLoader size={50} />
            <p className="text-sm font-medium text-gray-400">Loading library...</p>
        </div>
    )

    return (
        /* Container: Fixed Height, No Global Scroll */
        <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-5xl mx-auto bg-white dark:bg-[#09090b] rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden relative">
            <Toast message={toastMessage} show={showToast} />

            {/* --- HEADER --- */}
            <div className="flex-none px-6 py-5 border-b border-gray-100 dark:border-gray-800/50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                        <Library size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">Exam Preparation</h1>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Select your academic details to continue</p>
                    </div>
                </div>

                {/* --- CUSTOM COMPACT FILTER BAR --- */}
                {/* Changes: grid-cols-1 on mobile so buttons stack, sm:grid-cols-4 on tablet+ */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">

                    {/* Program Dropdown */}
                    <div className="relative min-w-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'program' ? null : 'program') }}
                            className={`w-full flex items-center justify-between px-2 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium transition-all
                                ${openDropdown === 'program' ? 'ring-2 ring-black/5 dark:ring-white/10' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                {/* Icon hidden on small screens to save space */}
                                <GraduationCap size={14} className="text-gray-400 shrink-0 hidden md:block" />
                                <span className={`truncate ${selProgramId ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                    {selectedProgram?.name || "Program"}
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown === 'program' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-1.5 z-30 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                {programs.map(p => (
                                    <DropdownItem
                                        key={p.id}
                                        label={p.name}
                                        selected={p.id === selProgramId}
                                        onClick={() => { setSelProgramId(p.id); setSelYearId(''); setSelSemesterId(''); setSelCourseId('') }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Year Dropdown */}
                    <div className="relative min-w-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); if (selProgramId) setOpenDropdown(openDropdown === 'year' ? null : 'year') }}
                            disabled={!selProgramId}
                            className={`w-full flex items-center justify-between px-2 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium transition-all
                                ${!selProgramId ? 'opacity-50 cursor-not-allowed' : ''}
                                ${openDropdown === 'year' ? 'ring-2 ring-black/5 dark:ring-white/10' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                <Calendar size={14} className="text-gray-400 shrink-0 hidden md:block" />
                                <span className={`truncate ${selYearId ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                    {selectedYear?.name || "Year"}
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                        </button>

                        {openDropdown === 'year' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-200">
                                {years.map(y => (
                                    <DropdownItem
                                        key={y.id}
                                        label={y.name}
                                        selected={y.id === selYearId}
                                        onClick={() => { setSelYearId(y.id); setSelCourseId(''); setSelSemesterId('') }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Branch Dropdown */}
                    <div className="relative min-w-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); if (selYearId) setOpenDropdown(openDropdown === 'course' ? null : 'course') }}
                            disabled={!selYearId}
                            className={`w-full flex items-center justify-between px-2 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium transition-all
                                ${!selYearId ? 'opacity-50 cursor-not-allowed' : ''}
                                ${openDropdown === 'course' ? 'ring-2 ring-black/5 dark:ring-white/10' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                <Layers size={14} className="text-gray-400 shrink-0 hidden md:block" />
                                <span className={`truncate ${selCourseId ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                    {selectedCourse?.name || "Branch"}
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                        </button>

                        {openDropdown === 'course' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-200">
                                {courses.map(c => (
                                    <DropdownItem
                                        key={c.id}
                                        label={c.name}
                                        selected={c.id === selCourseId}
                                        onClick={() => { setSelCourseId(c.id); setSelSemesterId('') }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Semester Dropdown */}
                    <div className="relative min-w-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); if (selCourseId) setOpenDropdown(openDropdown === 'semester' ? null : 'semester') }}
                            disabled={!selCourseId}
                            className={`w-full flex items-center justify-between px-2 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium transition-all
                                ${!selCourseId ? 'opacity-50 cursor-not-allowed' : ''}
                                ${openDropdown === 'semester' ? 'ring-2 ring-black/5 dark:ring-white/10' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                <Calendar size={14} className="text-gray-400 shrink-0 hidden md:block" />
                                <span className={`truncate ${selSemesterId ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                    {selectedSemester?.name || "Semester"}
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                        </button>

                        {openDropdown === 'semester' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-200">
                                {semesters.map(s => (
                                    <DropdownItem
                                        key={s.id}
                                        label={s.name}
                                        selected={s.id === selSemesterId}
                                        onClick={() => setSelSemesterId(s.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA (Scrollable) --- */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 p-4">

                {/* Empty State */}
                {!selCourseId ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-gray-300 dark:text-gray-600" size={32} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Select Program, Year, Semester, and Branch<br />to view subjects</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-sm">No subjects found.</div>
                ) : (
                    // Subject List
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1 pb-1">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Available Subjects</h2>
                            <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                                {subjects.length} Found
                            </span>
                        </div>

                        {subjects.map((subject, idx) => {
                            const subName = typeof subject === 'string' ? subject : subject.name
                            const units = typeof subject === 'object' && subject.units
                                ? subject.units.map(u => typeof u === 'string' ? { name: u } : u)
                                : []
                            const isExpanded = expandedSubject === subName

                            return (
                                <div
                                    key={idx}
                                    className={`
                                        bg-white dark:bg-white/5 rounded-xl border transition-all duration-300 overflow-hidden
                                        ${isExpanded ? 'border-blue-500/50 shadow-md ring-1 ring-blue-500/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}
                                    `}
                                >
                                    {/* Card Header (Clickable) */}
                                    <div
                                        onClick={() => setExpandedSubject(isExpanded ? null : subName)}
                                        className="p-4 flex items-center gap-3 cursor-pointer select-none group"
                                    >
                                        <div className={`
                                            h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors
                                            ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}
                                        `}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 min-w-0">
                                                <span className="truncate">{subName}</span>
                                                <button
                                                    onClick={(e) => handleShareSubject(e, subName)}
                                                    className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-blue-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                    title="Share Subject"
                                                >
                                                    <Share2 size={15} />
                                                </button>
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <BookOpen size={10} />
                                                {units.length} Units available
                                            </p>
                                        </div>
                                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Expanded Content */}
                                    <div className={`
                                        grid transition-[grid-template-rows] duration-300 ease-out
                                        ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
                                    `}>
                                        <div className="overflow-hidden">
                                            <div className="p-4 pt-0 space-y-2">
                                                {units.map((unit: any, uIdx: number) => (
                                                    <div key={uIdx} className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/unit">
                                                        <span className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                            {uIdx + 1}
                                                        </span>
                                                        <span className="truncate flex-1">{unit.name}</span>
                                                        <button
                                                            onClick={(e) => handleShareUnit(e, subName, unit.name)}
                                                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover/unit:opacity-100"
                                                            title="Share Unit"
                                                        >
                                                            <Share2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}

                                                {units.length > 0 && (
                                                    <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                                                        <button
                                                            onClick={() => handleStart(subName)}
                                                            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors"
                                                        >
                                                            <PlayCircle size={14} />
                                                            Start Preparation
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}