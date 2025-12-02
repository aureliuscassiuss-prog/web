import { useState, useEffect } from 'react'
import { Calculator, Plus, Trash2, RotateCcw, Award, TrendingUp, BookOpen, ChevronDown, Trophy } from 'lucide-react'

interface Course {
    id: string
    name: string
    credits: number
    grade: string
}

interface Semester {
    id: string
    number: number
    courses: Course[]
    sgpa: number
}

const gradePoints: { [key: string]: number } = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'P(G)': 4,
    'F': 0
}

const grades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'P(G)', 'F']
const creditOptions = [1, 2, 3, 4, 5, 6]

const getDivision = (cgpa: number): string => {
    if (cgpa >= 7.5) return 'First Division with Honours'
    if (cgpa >= 6.5) return 'First Division'
    if (cgpa >= 5.0) return 'Second Division'
    return 'Fail'
}

const getDivisionColor = (cgpa: number): string => {
    if (cgpa >= 7.5) return 'text-green-600 dark:text-green-400'
    if (cgpa >= 6.5) return 'text-blue-600 dark:text-blue-400'
    if (cgpa >= 5.0) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
}

export default function CGPACalculator() {
    const [semesters, setSemesters] = useState<Semester[]>([
        {
            id: '1',
            number: 1,
            courses: [{ id: '1', name: '', credits: 3, grade: 'A' }],
            sgpa: 0
        }
    ])
    const [cgpa, setCgpa] = useState(0)
    const [totalCredits, setTotalCredits] = useState(0)

    useEffect(() => {
        calculateAll()
    }, [semesters])

    const calculateAll = () => {
        // Calculate SGPA for each semester
        const updatedSemesters = semesters.map(sem => {
            const validCourses = sem.courses.filter(c => c.name.trim() !== '' && c.grade !== '')
            if (validCourses.length === 0) {
                return { ...sem, sgpa: 0 }
            }

            const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0)
            const weightedSum = validCourses.reduce((sum, course) => {
                return sum + (course.credits * gradePoints[course.grade])
            }, 0)

            const sgpa = totalCredits > 0 ? weightedSum / totalCredits : 0
            return { ...sem, sgpa: Math.round(sgpa * 100) / 100 }
        })

        setSemesters(updatedSemesters)

        // Calculate CGPA (cumulative across ALL courses in ALL semesters)
        let allCredits = 0
        let allWeightedSum = 0

        updatedSemesters.forEach(sem => {
            const validCourses = sem.courses.filter(c => c.name.trim() !== '' && c.grade !== '')
            validCourses.forEach(course => {
                allCredits += course.credits
                allWeightedSum += course.credits * gradePoints[course.grade]
            })
        })

        const calculatedCGPA = allCredits > 0 ? allWeightedSum / allCredits : 0
        setCgpa(Math.round(calculatedCGPA * 100) / 100)
        setTotalCredits(allCredits)
    }

    const addSemester = () => {
        const nextNumber = semesters.length + 1
        const newSemester: Semester = {
            id: Date.now().toString(),
            number: nextNumber,
            courses: [{ id: '1', name: '', credits: 3, grade: 'A' }],
            sgpa: 0
        }
        setSemesters([...semesters, newSemester])
    }

    const removeSemester = (semId: string) => {
        if (semesters.length > 1) {
            const filtered = semesters.filter(s => s.id !== semId)
            const renumbered = filtered.map((sem, index) => ({ ...sem, number: index + 1 }))
            setSemesters(renumbered)
        }
    }

    const addCourse = (semId: string) => {
        setSemesters(semesters.map(sem => {
            if (sem.id === semId) {
                const newCourse: Course = {
                    id: Date.now().toString(),
                    name: '',
                    credits: 3,
                    grade: 'A'
                }
                return { ...sem, courses: [...sem.courses, newCourse] }
            }
            return sem
        }))
    }

    const removeCourse = (semId: string, courseId: string) => {
        setSemesters(semesters.map(sem => {
            if (sem.id === semId && sem.courses.length > 1) {
                return { ...sem, courses: sem.courses.filter(c => c.id !== courseId) }
            }
            return sem
        }))
    }

    const updateCourse = (semId: string, courseId: string, field: keyof Course, value: string | number) => {
        setSemesters(semesters.map(sem => {
            if (sem.id === semId) {
                return {
                    ...sem,
                    courses: sem.courses.map(c => c.id === courseId ? { ...c, [field]: value } : c)
                }
            }
            return sem
        }))
    }

    const clearAll = () => {
        setSemesters([
            {
                id: '1',
                number: 1,
                courses: [{ id: '1', name: '', credits: 3, grade: 'A' }],
                sgpa: 0
            }
        ])
        setCgpa(0)
        setTotalCredits(0)
    }

    return (
        <div className="min-h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <Calculator size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CGPA Calculator</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Credit-weighted SGPA & CGPA calculation</p>
                        </div>
                    </div>

                    <button
                        onClick={clearAll}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-transparent border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                    >
                        <RotateCcw size={16} />
                        Clear All
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Semesters Section */}
                <div className="lg:col-span-2 space-y-4">
                    {semesters.map((semester) => (
                        <div key={semester.id} className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Semester {semester.number}
                                    </h2>
                                    {semester.sgpa > 0 && (
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            SGPA: {semester.sgpa.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeSemester(semester.id)}
                                    disabled={semesters.length === 1}
                                    className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 mb-3">
                                {semester.courses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl p-3 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                            {/* Course Name */}
                                            <div className="md:col-span-6">
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                                                    Course Name
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Data Structures"
                                                    value={course.name}
                                                    onChange={(e) => updateCourse(semester.id, course.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                                />
                                            </div>

                                            {/* Credits */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                                                    Credits
                                                </label>
                                                <select
                                                    value={course.credits}
                                                    onChange={(e) => updateCourse(semester.id, course.id, 'credits', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer transition-all appearance-none"
                                                >
                                                    {creditOptions.map(credit => (
                                                        <option key={credit} value={credit}>{credit}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Grade */}
                                            <div className="md:col-span-3">
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                                                    Grade
                                                </label>
                                                <select
                                                    value={course.grade}
                                                    onChange={(e) => updateCourse(semester.id, course.id, 'grade', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer transition-all appearance-none"
                                                >
                                                    {grades.map(grade => (
                                                        <option key={grade} value={grade}>{grade} ({gradePoints[grade]})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Delete Button */}
                                            <div className="md:col-span-1 flex items-end">
                                                <button
                                                    onClick={() => removeCourse(semester.id, course.id)}
                                                    disabled={semester.courses.length === 1}
                                                    className="w-full px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => addCourse(semester.id)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                                <Plus size={16} />
                                Add Course
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addSemester}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/20 transition-all transform active:scale-[0.99]"
                    >
                        <Plus size={18} />
                        Add Semester
                    </button>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1 space-y-4">
                    {/* CGPA Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl shadow-purple-500/20 p-6 text-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={20} className="opacity-80" />
                            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Cumulative CGPA</h3>
                        </div>
                        <div className="text-5xl font-bold mb-2 tracking-tight">
                            {cgpa.toFixed(2)}
                        </div>
                        <p className="text-sm opacity-75 mb-3">Out of 10.00</p>
                        {cgpa > 0 && (
                            <div className="pt-3 border-t border-white/20">
                                <p className="text-xs opacity-75 mb-1">Division</p>
                                <p className="text-sm font-bold">{getDivision(cgpa)}</p>
                            </div>
                        )}
                    </div>

                    {/* Statistics */}
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <TrendingUp size={18} />
                            Statistics
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total Semesters</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {semesters.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total Credits</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {totalCredits}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Highest SGPA</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {semesters.length > 0 && Math.max(...semesters.map(s => s.sgpa)) > 0
                                        ? Math.max(...semesters.map(s => s.sgpa)).toFixed(2)
                                        : '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Grade Scale */}
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Grade Scale</h3>
                        <div className="space-y-2">
                            {grades.map(grade => (
                                <div key={grade} className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{grade}</span>
                                    <span className="font-mono text-gray-500 dark:text-gray-400">{gradePoints[grade]} points</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formula */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 p-4">
                        <h3 className="text-xs font-bold text-blue-900 dark:text-blue-400 mb-2">📐 Formula</h3>
                        <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
                            SGPA = Σ(C × P) / ΣC
                        </p>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            CGPA = Σ(C × P) / ΣC (all semesters)
                        </p>
                        <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-2">
                            C = Credits, P = Grade Points
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
