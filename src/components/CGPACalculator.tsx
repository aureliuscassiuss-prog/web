import { useState, useEffect } from 'react'
import { Calculator, Plus, Trash2, RotateCcw, Trophy, TrendingUp, Target, AlertCircle, Sparkles } from 'lucide-react'

interface Semester {
    id: string
    number: number
    sgpa: string
    credits: string
}

const getDivision = (cgpa: number): string => {
    if (cgpa >= 7.5) return 'First Division with Honours'
    if (cgpa >= 6.5) return 'First Division'
    if (cgpa >= 5.0) return 'Second Division'
    return 'Fail'
}

export default function CGPACalculator() {
    const [semesters, setSemesters] = useState<Semester[]>([
        { id: '1', number: 1, sgpa: '', credits: '' }
    ])
    const [cgpa, setCgpa] = useState(0)
    const [totalCredits, setTotalCredits] = useState(0)
    const [nextSemCredits, setNextSemCredits] = useState('')
    const [targetCGPA, setTargetCGPA] = useState('')
    const [prediction, setPrediction] = useState<{
        requiredSGPA: number
        achievable: boolean
        semestersNeeded?: number
    } | null>(null)

    useEffect(() => {
        calculateCGPA()
    }, [semesters])

    useEffect(() => {
        if (nextSemCredits && targetCGPA && cgpa > 0) {
            calculatePrediction()
                                        </label >
                <input
                    type="number"
                    placeholder="Enter SGPA (0-10)"
                    value={semester.sgpa}
                    onChange={(e) => updateSemester(semester.id, 'sgpa', e.target.value)}
                    min="0"
                    max="10"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                />
                                    </div >

                {/* Credits Input */ }
                < div className = "md:col-span-4" >
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block ml-1">
                                            Credits (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Default: 17"
                                            value={semester.credits}
                                            onChange={(e) => updateSemester(semester.id, 'credits', e.target.value)}
                                            min="0"
                                            max="50"
                                            step="1"
                                            className="w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1">
                                            ⚠️ Subtract backlog subject credits here
                                        </p>
                                    </div >

                {/* Delete */ }
                < div className = "md:col-span-1 flex items-end" >
                    <button
                        onClick={() => removeSemester(semester.id)}
                        disabled={semesters.length === 1}
                        className="px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                                    </div >
                                </div >
                            </div >
                        ))
}

<button
    onClick={addSemester}
    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 transition-all transform active:scale-[0.99]"
>
    <Plus size={18} />
    Add Semester
</button>
                    </div >

    {/* Target Prediction */ }
{
    cgpa > 0 && (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target size={20} />
                Target CGPA Calculator
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block ml-1">
                        Next Semester Credits
                    </label>
                    <input
                        type="number"
                        placeholder="e.g., 17"
                        value={nextSemCredits}
                        onChange={(e) => setNextSemCredits(e.target.value)}
                        min="0"
                        max="50"
                        step="1"
                        className="w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block ml-1">
                        Target CGPA
                    </label>
                    <input
                        type="number"
                        placeholder="e.g., 7.5"
                        value={targetCGPA}
                        onChange={(e) => setTargetCGPA(e.target.value)}
                        min="0"
                        max="10"
                        step="0.01"
                        className="w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    />
                </div>
            </div>

            {prediction && (
                <div className={`p-4 rounded-xl border ${prediction.achievable
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20'
                    : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/20'
                    }`}>
                    {prediction.achievable ? (
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Required SGPA in Next Semester
                            </p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {prediction.requiredSGPA.toFixed(2)}
                            </p>
                        </div>
                    ) : prediction.semestersNeeded === -1 ? (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Not achievable even with 10 SGPA in remaining semesters
                        </p>
                    ) : (
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Need {prediction.semestersNeeded} semester(s)
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                with 10.00 SGPA to reach target CGPA
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
                </div >

    {/* Sidebar */ }
    < div className = "lg:col-span-4 space-y-4" >

        {/* CGPA Card */ }
        < div className = "bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl shadow-purple-500/20 p-6 text-white" >
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={20} className="opacity-80" />
                            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Your CGPA</h3>
                        </div>
                        <div className="text-5xl font-bold mb-2 tracking-tight">
                            {cgpa.toFixed(2)}
                        </div>
                        <p className="text-sm opacity-75 mb-3">Out of 10.00</p>
{
    cgpa > 0 && (
        <div className="pt-3 border-t border-white/20">
            <p className="text-xs opacity-75 mb-1">Division</p>
            <p className="text-sm font-bold">{getDivision(cgpa)}</p>
        </div>
    )
}
                    </div >

    {/* Stats */ }
    < div className = "p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-gray-800" >
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
                                <span className="text-xs text-gray-500 dark:text-gray-400">Semesters</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {semesters.filter(s => s.sgpa.trim() !== '').length}
                                </span>
                            </div>
                        </div>
                    </div >

    {/* Guide */ }
    < div className = "p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex gap-3" >
                        <Sparkles className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="text-xs font-bold text-blue-900 dark:text-blue-400 mb-1">How it works</p>
                            <ul className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
                                <li>• Enter SGPA for each semester</li>
                                <li>• Check "Exclude" for backlogs</li>
                                <li>• Set target to predict required SGPA</li>
                            </ul>
                        </div>
                    </div >
                </div >
            </div >
        </div >
    )
}
