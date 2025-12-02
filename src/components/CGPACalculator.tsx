import { useState, useEffect } from 'react'
import { Calculator, Plus, Trash2, RotateCcw, Award, TrendingUp, BookOpen } from 'lucide-react'

interface Subject {
    id: string
    name: string
    credits: number
    grade: string
}

const gradePoints: { [key: string]: number } = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0
}

const grades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F']
const creditOptions = [1, 2, 3, 4, 5, 6]

export default function CGPACalculator() {
    const [subjects, setSubjects] = useState<Subject[]>([
        { id: '1', name: '', credits: 3, grade: 'A' }
    ])
    const [sgpa, setSgpa] = useState(0)

    useEffect(() => {
        calculateSGPA()
    }, [subjects])

    const calculateSGPA = () => {
        const validSubjects = subjects.filter(s => s.name.trim() !== '' && s.grade !== '')

        if (validSubjects.length === 0) {
            setSgpa(0)
            return
        }

        const totalCredits = validSubjects.reduce((sum, subject) => sum + subject.credits, 0)
        const weightedSum = validSubjects.reduce((sum, subject) => {
            return sum + (subject.credits * gradePoints[subject.grade])
        }, 0)

        const calculatedSGPA = totalCredits > 0 ? weightedSum / totalCredits : 0
        setSgpa(Math.round(calculatedSGPA * 100) / 100)
    }

    const addSubject = () => {
        const newSubject: Subject = {
            id: Date.now().toString(),
            name: '',
            credits: 3,
            grade: 'A'
        }
        setSubjects([...subjects, newSubject])
    }

    const removeSubject = (id: string) => {
        if (subjects.length > 1) {
            setSubjects(subjects.filter(s => s.id !== id))
        }
    }

    const updateSubject = (id: string, field: keyof Subject, value: string | number) => {
        setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const clearAll = () => {
        setSubjects([{ id: '1', name: '', credits: 3, grade: 'A' }])
        setSgpa(0)
    }

    const getSGPAColor = () => {
        if (sgpa >= 9) return 'text-green-600 dark:text-green-400'
        if (sgpa >= 7) return 'text-blue-600 dark:text-blue-400'
        if (sgpa >= 5) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    return (
        <div className="min-h-[calc(100vh-6rem)] w-full max-w-6xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <Calculator size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CGPA Calculator</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Credit-based GPA calculation system</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-transparent border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                        >
                            <RotateCcw size={16} />
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Subjects Input Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BookOpen size={20} />
                            Your Subjects
                        </h2>

                        <div className="space-y-3">
                            {subjects.map((subject, index) => (
                                <div
                                    key={subject.id}
                                    className="group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                        {/* Subject Name */}
                                        <div className="md:col-span-5">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                                                Subject {index + 1}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Data Structures"
                                                value={subject.name}
                                                onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                            />
                                        </div>

                                        {/* Credits */}
                                        <div className="md:col-span-3">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                                                Credits
                                            </label>
                                            <select
                                                value={subject.credits}
                                                onChange={(e) => updateSubject(subject.id, 'credits', parseInt(e.target.value))}
                                                className="w-full px-3 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer transition-all"
                                            >
                                                {creditOptions.map(credit => (
                                                    <option key={credit} value={credit}>{credit}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Grade */}
                                        <div className="md:col-span-3">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                                                Grade
                                            </label>
                                            <select
                                                value={subject.grade}
                                                onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer transition-all"
                                            >
                                                {grades.map(grade => (
                                                    <option key={grade} value={grade}>{grade} ({gradePoints[grade]})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Delete Button */}
                                        <div className="md:col-span-1 flex items-end">
                                            <button
                                                onClick={() => removeSubject(subject.id)}
                                                disabled={subjects.length === 1}
                                                className="w-full md:w-auto px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addSubject}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/20 transition-all transform active:scale-[0.99]"
                        >
                            <Plus size={18} />
                            Add Subject
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1 space-y-4">
                    {/* SGPA Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl shadow-purple-500/20 p-6 text-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Award size={20} className="opacity-80" />
                            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Your SGPA</h3>
                        </div>
                        <div className="text-5xl font-bold mb-2 tracking-tight">
                            {sgpa.toFixed(2)}
                        </div>
                        <p className="text-sm opacity-75">Out of 10.00</p>
                    </div>

                    {/* Grade Scale Reference */}
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <TrendingUp size={18} />
                            Grade Scale
                        </h3>
                        <div className="space-y-2">
                            {grades.map(grade => (
                                <div key={grade} className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{grade}</span>
                                    <span className="font-mono text-gray-500 dark:text-gray-400">{gradePoints[grade]} points</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Statistics</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total Subjects</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {subjects.filter(s => s.name.trim() !== '').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total Credits</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {subjects.filter(s => s.name.trim() !== '').reduce((sum, s) => sum + s.credits, 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
