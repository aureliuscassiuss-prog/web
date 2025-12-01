import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, PlayCircle, Layers, GraduationCap, Calendar } from 'lucide-react'

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

    // Selection State
    const [selectedProgramId, setSelectedProgramId] = useState<string>('')
    const [selectedYearId, setSelectedYearId] = useState<string>('')
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')

    // Expanded Subject State
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/admin?action=structure')
            .then(res => res.json())
            .then(data => {
                setStructure(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    // Derived State
    const programs = structure.programs || []
    const selectedProgram = programs.find(p => p.id === selectedProgramId)
    const years = selectedProgram?.years || []
    const selectedYear = years.find(y => y.id === selectedYearId)
    const courses = selectedYear?.courses || []
    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    const subjects = selectedCourse?.subjects || []

    const handleStartPreparation = (subjectName: string) => {
        const params = new URLSearchParams({
            program: selectedProgramId,
            year: selectedYearId,
            course: selectedCourseId,
            subject: subjectName
        })
        navigate(`/preparation/play?${params.toString()}`)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                        Exam Preparation
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Select your course details to access curated video lectures and syllabus for your subjects.
                    </p>
                </div>

                {/* Selection Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Program Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <GraduationCap size={16} /> Program
                        </label>
                        <select
                            value={selectedProgramId}
                            onChange={(e) => {
                                setSelectedProgramId(e.target.value)
                                setSelectedYearId('')
                                setSelectedCourseId('')
                            }}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="">Select Program</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar size={16} /> Year
                        </label>
                        <select
                            value={selectedYearId}
                            onChange={(e) => {
                                setSelectedYearId(e.target.value)
                                setSelectedCourseId('')
                            }}
                            disabled={!selectedProgramId}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                        >
                            <option value="">Select Year</option>
                            {years.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Branch/Course Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Layers size={16} /> Branch
                        </label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            disabled={!selectedYearId}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                        >
                            <option value="">Select Branch</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Subjects List */}
                {selectedCourseId && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-800">
                            <BookOpen className="text-blue-600" />
                            <h2 className="text-xl font-semibold">Syllabus & Subjects</h2>
                        </div>

                        <div className="grid gap-4">
                            {subjects.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">No subjects found for this selection.</p>
                            ) : (
                                subjects.map((subject, idx) => {
                                    const subjectName = typeof subject === 'string' ? subject : subject.name
                                    const units = typeof subject === 'object' && subject.units
                                        ? subject.units.map(u => typeof u === 'string' ? { name: u } : u)
                                        : []
                                    const isExpanded = expandedSubject === subjectName

                                    return (
                                        <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                            <div
                                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                                                onClick={() => setExpandedSubject(isExpanded ? null : subjectName)}
                                            >
                                                <h3 className="text-lg font-medium">{subjectName}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                        {units.length} Units
                                                    </span>
                                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 p-5 space-y-4">
                                                    <div className="space-y-2">
                                                        {units.map((unit, uIdx) => (
                                                            <div key={uIdx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                                <div className="mt-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                                                                    {uIdx + 1}
                                                                </div>
                                                                <span>{unit.name}</span>
                                                            </div>
                                                        ))}
                                                        {units.length === 0 && <p className="text-sm text-gray-500 italic">No units defined yet.</p>}
                                                    </div>

                                                    <div className="pt-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleStartPreparation(subjectName)
                                                            }}
                                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 transition-opacity"
                                                        >
                                                            <PlayCircle size={18} />
                                                            Start Preparation
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
