import { useState, useEffect } from 'react'
import { Calculator, Plus, Trash2, RotateCcw, Award, TrendingUp, Target, AlertCircle } from 'lucide-react'

interface Semester {
    id: string
    number: number
    sgpa: string
}

export default function CGPACalculator() {
    const [semesters, setSemesters] = useState<Semester[]>([
        { id: '1', number: 1, sgpa: '' }
    ])
    const [cgpa, setCgpa] = useState(0)
    const [predictions, setPredictions] = useState<{
        target: number
        requiredSGPA: number
        achievable: boolean
        semestersNeeded?: number
    }[]>([])

    useEffect(() => {
        calculateCGPA()
    }, [semesters])

    const calculateCGPA = () => {
        const validSemesters = semesters.filter(s => s.sgpa.trim() !== '' && !isNaN(parseFloat(s.sgpa)))

        if (validSemesters.length === 0) {
            setCgpa(0)
            setPredictions([])
            return
        }

        const totalSGPA = validSemesters.reduce((sum, sem) => sum + parseFloat(sem.sgpa), 0)
        const calculatedCGPA = totalSGPA / validSemesters.length
        setCgpa(Math.round(calculatedCGPA * 100) / 100)

        // Calculate predictions for targets
        calculatePredictions(calculatedCGPA, validSemesters.length)
    }

    const calculatePredictions = (currentCGPA: number, completedSems: number) => {
        const targets = [7.0, 7.5, 8.0]
        const newPredictions = targets.map(target => {
            // Required SGPA for next semester
            const requiredSGPA = (target * (completedSems + 1)) - (currentCGPA * completedSems)

            if (requiredSGPA <= 10 && requiredSGPA >= 0) {
                return {
                    target,
                    requiredSGPA: Math.round(requiredSGPA * 100) / 100,
                    achievable: true
                }
            } else {
                // Calculate how many semesters needed with 10 SGPA
                let semsNeeded = 1
                while (semsNeeded <= 8) {
                    const possibleCGPA = ((currentCGPA * completedSems) + (10 * semsNeeded)) / (completedSems + semsNeeded)
                    if (possibleCGPA >= target) {
                        return {
                            target,
                            requiredSGPA: 10,
                            achievable: false,
                            semestersNeeded: semsNeeded
                        }
                    }
                    semsNeeded++
                }
                return {
                    target,
                    requiredSGPA: 10,
                    achievable: false,
                    semestersNeeded: -1 // Not achievable even in 8 sems
                }
            }
        })
        setPredictions(newPredictions)
    }

    const addSemester = () => {
        const nextNumber = semesters.length + 1
        const newSemester: Semester = {
            id: Date.now().toString(),
            number: nextNumber,
            sgpa: ''
        }
        setSemesters([...semesters, newSemester])
    }

    const removeSemester = (id: string) => {
        if (semesters.length > 1) {
            const filtered = semesters.filter(s => s.id !== id)
            // Renumber semesters
            const renumbered = filtered.map((sem, index) => ({ ...sem, number: index + 1 }))
            setSemesters(renumbered)
        }
    }

    const updateSemester = (id: string, sgpa: string) => {
        // Allow only valid number input
        if (sgpa === '' || (!isNaN(parseFloat(sgpa)) && parseFloat(sgpa) <= 10)) {
            setSemesters(semesters.map(s => s.id === id ? { ...s, sgpa } : s))
        }
    }

    const clearAll = () => {
        setSemesters([{ id: '1', number: 1, sgpa: '' }])
        setCgpa(0)
        setPredictions([])
    }

    const getCGPAColor = () => {
        if (cgpa >= 8) return 'from-green-600 to-emerald-600'
        if (cgpa >= 7) return 'from-blue-600 to-indigo-600'
        if (cgpa >= 6) return 'from-yellow-600 to-orange-600'
        return 'from-red-600 to-pink-600'
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">Semester-wise CGPA calculation with target predictions</p>
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
                {/* Semester Input Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Award size={20} />
                            Enter Semester SGPAs
                        </h2>

                        <div className="space-y-3">
                            {semesters.map((semester) => (
                                <div
                                    key={semester.id}
                                    className="group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-24">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Sem {semester.number}
                                            </label>
                                        </div>

                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="Enter SGPA (0-10)"
                                                value={semester.sgpa}
                                                onChange={(e) => updateSemester(semester.id, e.target.value)}
                                                min="0"
                                                max="10"
                                                step="0.01"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                            />
                                        </div>

                                        <button
                                            onClick={() => removeSemester(semester.id)}
                                            disabled={semesters.length === 1}
                                            className="px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addSemester}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/20 transition-all transform active:scale-[0.99]"
                        >
                            <Plus size={18} />
                            Add Semester
                        </button>
                    </div>

                    {/* Target Predictions */}
                    {cgpa > 0 && predictions.length > 0 && (
                        <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target size={20} />
                                Target Predictions
                            </h2>
                            <div className="space-y-3">
                                {predictions.map((pred) => (
                                    <div
                                        key={pred.target}
                                        className={`p-4 rounded-xl border ${pred.achievable
                                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20'
                                                : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/20'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                                    Target: {pred.target.toFixed(1)} CGPA
                                                </h3>
                                                {pred.achievable ? (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Required SGPA in next semester: <span className="font-bold text-green-600 dark:text-green-400">{pred.requiredSGPA.toFixed(2)}</span>
                                                    </p>
                                                ) : pred.semestersNeeded === -1 ? (
                                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                                        <AlertCircle size={14} />
                                                        Not achievable even with 10 SGPA in remaining semesters
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Need <span className="font-bold text-orange-600 dark:text-orange-400">{pred.semestersNeeded} semester(s)</span> with 10 SGPA to reach this target
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1 space-y-4">
                    {/* CGPA Card */}
                    <div className={`bg-gradient-to-br ${getCGPAColor()} rounded-2xl shadow-xl shadow-purple-500/20 p-6 text-white`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Award size={20} className="opacity-80" />
                            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Your CGPA</h3>
                        </div>
                        <div className="text-5xl font-bold mb-2 tracking-tight">
                            {cgpa.toFixed(2)}
                        </div>
                        <p className="text-sm opacity-75">Out of 10.00</p>
                    </div>

                    {/* Stats */}
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <TrendingUp size={18} />
                            Statistics
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Semesters Completed</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {semesters.filter(s => s.sgpa.trim() !== '').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Highest SGPA</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {semesters.filter(s => s.sgpa.trim() !== '').length > 0
                                        ? Math.max(...semesters.filter(s => s.sgpa.trim() !== '').map(s => parseFloat(s.sgpa))).toFixed(2)
                                        : '0.00'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Lowest SGPA</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {semesters.filter(s => s.sgpa.trim() !== '').length > 0
                                        ? Math.min(...semesters.filter(s => s.sgpa.trim() !== '').map(s => parseFloat(s.sgpa))).toFixed(2)
                                        : '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Guide */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 p-4">
                        <h3 className="text-xs font-bold text-blue-900 dark:text-blue-400 mb-2">💡 How to use</h3>
                        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                            <li>• Enter SGPA for each completed semester</li>
                            <li>• View your cumulative CGPA</li>
                            <li>• Check target predictions for next semester</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
