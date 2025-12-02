import { useState, useEffect } from 'react'
import { Calculator, RotateCcw, Award, TrendingUp, GraduationCap, ChevronDown, Trophy, Sparkles } from 'lucide-react'

interface Semester {
    id: string
    number: number
    sgpa: string
    credits: string
}

interface ProgramConfig {
    name: string
    semesters: number
    defaultCreditsPerSem: number[]
}

const programs: { [key: string]: ProgramConfig } = {
    'btech': {
        name: 'B.Tech (4 Years)',
        semesters: 8,
        defaultCreditsPerSem: [17, 16, 17, 16, 18, 17, 18, 17]
    },
    'mtech': {
        name: 'M.Tech (2 Years)',
        semesters: 4,
        defaultCreditsPerSem: [17, 17, 17, 17]
    },
    'mba': {
        name: 'MBA (2 Years)',
        semesters: 4,
        defaultCreditsPerSem: [19, 19, 19, 19]
    },
    'mca2': {
        name: 'MCA (2 Years)',
        semesters: 4,
        defaultCreditsPerSem: [16, 15, 17, 17]
    },
    'mca3': {
        name: 'MCA (3 Years)',
        semesters: 6,
        defaultCreditsPerSem: [16, 16, 17, 16, 17, 16]
    },
    'bsc': {
        name: 'B.Sc/BCA/BBA/B.Com (3 Years)',
        semesters: 6,
        defaultCreditsPerSem: [17, 17, 18, 18, 18, 18]
    },
    'diploma': {
        name: 'Diploma (2 Years)',
        semesters: 4,
        defaultCreditsPerSem: [16, 16, 17, 18]
    }
}

const getDivision = (cgpa: number): string => {
    if (cgpa >= 7.5) return 'First Division with Honours'
    if (cgpa >= 6.5) return 'First Division'
    if (cgpa >= 5.0) return 'Second Division'
    return 'Fail'
}

const SelectInput = ({ label, icon: Icon, value, onChange, options, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                <Icon size={16} />
            </div>
            <select
                value={value}
                onChange={onChange}
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none appearance-none cursor-pointer shadow-sm transition-all"
            >
                <option value="">{placeholder}</option>
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown size={14} />
            </div>
        </div>
    </div>
)

export default function CGPACalculator() {
    const [selectedProgram, setSelectedProgram] = useState<string>('')
    const [semesters, setSemesters] = useState<Semester[]>([])
    const [cgpa, setCgpa] = useState(0)
    const [totalCredits, setTotalCredits] = useState(0)

    useEffect(() => {
        if (selectedProgram && programs[selectedProgram]) {
            const config = programs[selectedProgram]
            const newSemesters: Semester[] = Array.from({ length: config.semesters }, (_, i) => ({
                id: (i + 1).toString(),
                number: i + 1,
                sgpa: '',
                credits: ''
            }))
            setSemesters(newSemesters)
        } else {
            setSemesters([])
        }
    }, [selectedProgram])

    useEffect(() => {
        if (selectedProgram && semesters.length > 0) {
            calculateCGPA()
        }
    }, [semesters])

    const calculateCGPA = () => {
        if (!selectedProgram) return

        const config = programs[selectedProgram]
        const validSemesters = semesters.filter(s => s.sgpa.trim() !== '' && !isNaN(parseFloat(s.sgpa)))

        if (validSemesters.length === 0) {
            setCgpa(0)
            setTotalCredits(0)
            return
        }

        let totalWeightedSum = 0
        let totalCreditsSum = 0

        validSemesters.forEach(sem => {
            const sgpa = parseFloat(sem.sgpa)
            const credits = sem.credits.trim() !== '' && !isNaN(parseFloat(sem.credits))
                ? parseFloat(sem.credits)
                : config.defaultCreditsPerSem[sem.number - 1] || 17

            totalWeightedSum += sgpa * credits
            totalCreditsSum += credits
        })

        const calculatedCGPA = totalCreditsSum > 0 ? totalWeightedSum / totalCreditsSum : 0
        setCgpa(Math.round(calculatedCGPA * 100) / 100)
        setTotalCredits(totalCreditsSum)
    }

    const updateSemester = (id: string, field: 'sgpa' | 'credits', value: string) => {
        if (value !== '' && !isNaN(parseFloat(value))) {
            const numValue = parseFloat(value)
            if (field === 'sgpa' && numValue > 10) return
            if (field === 'credits' && numValue > 50) return
        }
        setSemesters(semesters.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const resetAll = () => {
        setSelectedProgram('')
        setSemesters([])
        setCgpa(0)
        setTotalCredits(0)
    }

    return (
        <div className="min-h-[calc(100vh-6rem)] w-full max-w-5xl mx-auto p-4 md:p-6 bg-white dark:bg-[#09090b] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <Calculator size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">CGPA Calculator</h1>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick semester-based GPA calculation</p>
                    </div>
                </div>

                {selectedProgram && (
                    <button
                        onClick={resetAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-transparent border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        <RotateCcw size={16} />
                        Reset
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Section */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Program Selection */}
                    <div className="bg-white dark:bg-transparent rounded-none">
                        <SelectInput
                            label="Select Program"
                            icon={GraduationCap}
                            value={selectedProgram}
                            onChange={(e: any) => setSelectedProgram(e.target.value)}
                            placeholder="Choose Your Degree Program"
                            options={Object.entries(programs).map(([key, config]) => ({
                                value: key,
                                label: config.name
                            }))}
                        />
                    </div>

                    {/* Semester Inputs */}
                    {selectedProgram && semesters.length > 0 && (
                        <>
                            <div className="space-y-4">
                                {semesters.map((semester) => {
                                    const defaultCredits = programs[selectedProgram].defaultCreditsPerSem[semester.number - 1] || 17
                                    const displayCredits = semester.credits.trim() !== '' ? semester.credits : defaultCredits.toString()

                                    return (
                                        <div
                                            key={semester.id}
                                            className="group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                {/* Semester Label */}
                                                <div className="md:col-span-3">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                        Semester {semester.number}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Credits: {displayCredits}
                                                    </p>
                                                </div>

                                                {/* SGPA Input */}
                                                <div className="md:col-span-5">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block ml-1">
                                                        SGPA
                                                    </label>
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
                                                </div>

                                                {/* Credits Input (Optional) */}
                                                <div className="md:col-span-4">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block ml-1">
                                                        Custom Credits
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder={`Default: ${defaultCredits}`}
                                                        value={semester.credits}
                                                        onChange={(e) => updateSemester(semester.id, 'credits', e.target.value)}
                                                        min="0"
                                                        max="50"
                                                        step="1"
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-4">

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
                    {selectedProgram && (
                        <div className="p-5 bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={18} />
                                Statistics
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Program</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                        {programs[selectedProgram].name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Total Credits</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {totalCredits}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Semesters Filled</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {semesters.filter(s => s.sgpa.trim() !== '').length} / {semesters.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guide */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex gap-3">
                        <Sparkles className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="text-xs font-bold text-blue-900 dark:text-blue-400 mb-1">How it works</p>
                            <ul className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
                                <li>• Select your program</li>
                                <li>• Enter SGPA for each semester</li>
                                <li>• Optionally customize credits</li>
                                <li>• Get instant CGPA calculation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
