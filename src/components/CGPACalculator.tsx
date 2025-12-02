import { useState, useEffect } from 'react'
import { Calculator, Plus, Trash2, RotateCcw, Award, TrendingUp, GraduationCap, ChevronDown, Trophy, Sparkles, BookOpen } from 'lucide-react'

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
}

const gradePoints: { [key: string]: number } = {
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0,
    'Q': -1  // Q is excluded from calculation
}

const grades = ['A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'Q']
const creditOptions = [1, 2, 3, 4, 5, 6]

const getDivision = (cgpa: number): string => {
    if (cgpa >= 7.5) return 'First Division with Honours'
    if (cgpa >= 6.5) return 'First Division'
    if (cgpa >= 5.0) return 'Second Division'
    return 'Fail'
}

export default function CGPACalculator() {
    const [semesters, setSemesters] = useState<Semester[]>([
        {
            id: '1',
            number: 1,
            courses: [{ id: '1', name: '', credits: 3, grade: 'A' }]
        }
    ])
    const [cgpa, setCgpa] = useState(0)
    const [totalCredits, setTotalCredits] = useState(0)
    const [effectiveCredits, setEffectiveCredits] = useState(0)

    useEffect(() => {
        calculateCGPA()
    }, [semesters])

    const calculateSGPA = (courses: Course[]) => {
        const validCourses = courses.filter(c =>
            c.name.trim() !== '' &&
            c.grade !== '' &&
            c.grade !== 'Q'
        )

        if (validCourses.length === 0) return 0

        const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0)
        const weightedSum = validCourses.reduce((sum, course) => {
            return sum + (course.credits * gradePoints[course.grade])
        }, 0)

        return totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : 0
    }

    const calculateCGPA = () => {
        // Calculate CGPA (cumulative across ALL courses, excluding Q)
        let allCredits = 0
        let effectiveCreditsCount = 0
        let allWeightedSum = 0

        semesters.forEach(sem => {
            sem.courses.forEach(course => {
                if (course.name.trim() !== '' && course.grade !== '') {
                    allCredits += course.credits

                    // Exclude Q grades from CGPA calculation
                    if (course.grade !== 'Q') {
                        effectiveCreditsCount += course.credits
                        allWeightedSum += course.credits * gradePoints[course.grade]
                    }
                }
            })
        })

        const calculatedCGPA = effectiveCreditsCount > 0 ? allWeightedSum / effectiveCreditsCount : 0
        setCgpa(Math.round(calculatedCGPA * 100) / 100)
        setTotalCredits(allCredits)
        setEffectiveCredits(effectiveCreditsCount)
    }

    const addSemester = () => {
        const nextNumber = semesters.length + 1
        const newSemester: Semester = {
            id: Date.now().toString(),
            number: nextNumber,
            courses: [{ id: '1', name: '', credits: 3, grade: 'A' }]
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
                courses: [{ id: '1', name: '', credits: 3, grade: 'A' }]
            }
        ])
        setCgpa(0)
        setTotalCredits(0)
        setEffectiveCredits(0)
    }

    return (
        <div className="min-h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto p-4 md:p-6 bg-white dark:bg-[#09090b] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <Calculator size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">CGPA Calculator</h1>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Credit-weighted GPA with Q-grade exclusion</p>
                    </div>
                </div>

                <button
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-transparent border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                    <RotateCcw size={16} />
                    Clear All
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Semesters Section */}
                <div className="lg:col-span-2 space-y-4">
                    {semesters.map((semester) => (
                        <div key={semester.id} className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Semester {semester.number}
                                    </h2>
                                    {(() => {
                                        const sgpa = calculateSGPA(semester.courses)
                                        return sgpa > 0 && (
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                SGPA: {sgpa.toFixed(2)}
                                            </span>
                                        )
                                    })()}
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
                                        className="group bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl p-3 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                            {/* Course Name */}
                                            <div className="md:col-span-6">
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                                                    Course Name
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Engineering Mathematics"
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
                                                    className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer transition-all"
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
                                                    className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer transition-all"
                                                >
                                                    {grades.map(grade => (
                                                        <option key={grade} value={grade}>
                                                            {grade} {grade === 'Q' ? '(Excluded)' : `(${gradePoints[grade]})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Delete */}
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
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                            >
                                <Plus size={16} />
                                Add Course
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addSemester}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 transition-all transform active:scale-[0.99]"
                    >
                        <Plus size={18} />
                        Add Semester
                    </button>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">

                    {/* CGPA Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl shadow-purple-500/20 p-6 text-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={20} className="opacity-80" />
                            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Your CGPA</h3>
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

                    {/* Stats */}
                    <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={18} />
                            Statistics
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total Credits</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {totalCredits}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Effective Credits</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {effectiveCredits}
                                </span>
                            </div>
                            {totalCredits !== effectiveCredits && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Q Grade Credits</span>
                                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                        {totalCredits - effectiveCredits}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Guide */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex gap-3">
                        <Sparkles className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="text-xs font-bold text-blue-900 dark:text-blue-400 mb-1">Formula</p>
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed mb-2">
                                CGPA = Σ(C×P) / ΣC
                            </p>
                            <p className="text-[10px] text-blue-700 dark:text-blue-400">
                                C = Credits, P = Grade Points<br />
                                Q grades excluded from calculation
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
