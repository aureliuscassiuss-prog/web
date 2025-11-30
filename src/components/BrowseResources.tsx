import { useState, useEffect } from 'react'
import { ChevronLeft, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react'
import ResourceGrid from './ResourceGrid'

// --- Mock Data (Replace with your actual API/Constants) ---
const YEARS = [1, 2, 3, 4]

const BRANCHES = [
    { id: 'cse', label: 'Computer Science', icon: '👨‍💻' },
    { id: 'ece', label: 'Electronics', icon: '📡' },
    { id: 'me', label: 'Mechanical', icon: '🔧' },
    { id: 'ce', label: 'Civil', icon: '🏛️' },
]

const MOCK_SUBJECTS = [
    "Data Structures",
    "Engineering Math",
    "Digital Logic",
    "Network Theory",
    "Thermodynamics"
]

interface BrowseResourcesProps {
    onUploadRequest?: (data: any) => void
}

export default function BrowseResources({ onUploadRequest }: BrowseResourcesProps) {
    // State for the wizard flow
    const [step, setStep] = useState(1) // 1: Year, 2: Branch, 3: Subject, 4: Loading, 5: Result
    const [filters, setFilters] = useState<{ branch?: string; year?: number; subject?: string }>({})
    const [loadingText, setLoadingText] = useState('Initializing...')

    // Calculate Progress Percentage
    const progress = Math.min(((step - 1) / 3) * 100, 100)

    // Handle "Fake Animation" when step 4 is reached
    useEffect(() => {
        if (step === 4) {
            const texts = [
                "Analyzing requirements...",
                "Fetching latest notes...",
                "Preparing curated content for you..."
            ]

            let i = 0
            const textInterval = setInterval(() => {
                setLoadingText(texts[i])
                i = (i + 1) % texts.length
            }, 800)

            const finishTimeout = setTimeout(() => {
                clearInterval(textInterval)
                setStep(5) // Show Final Grid
            }, 2500)

            return () => {
                clearInterval(textInterval)
                clearTimeout(finishTimeout)
            }
        }
    }, [step])

    // Handlers
    const handleYearSelect = (year: number) => {
        setFilters(prev => ({ ...prev, year }))
        setStep(2)
    }

    const handleBranchSelect = (branch: string) => {
        setFilters(prev => ({ ...prev, branch }))
        setStep(3)
    }

    const handleSubjectSelect = (subject: string) => {
        setFilters(prev => ({ ...prev, subject }))
        setStep(4) // Trigger loading
    }

    const handleBack = () => {
        if (step > 1 && step < 5) setStep(step - 1)
        if (step === 5) {
            setFilters({})
            setStep(1)
        }
    }

    return (
        <div className="space-y-4 md:space-y-8 animate-fade-in min-h-[60vh] flex flex-col">

            {/* Header & Progress Bar (Hide on final result view for cleaner look, or keep if preferred) */}
            {step < 5 && (
                <div className="space-y-3 md:space-y-6 max-w-2xl mx-auto w-full px-4">
                    <div className="text-center space-y-1 md:space-y-2">
                        <h1 className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {step === 4 ? 'Just a moment ⏳' : 'Let\'s find your materials 📚'}
                        </h1>
                        <p className="text-xs md:text-base text-gray-500 dark:text-gray-400">
                            {step === 1 && "Which year are you currently in?"}
                            {step === 2 && "Select your engineering branch"}
                            {step === 3 && "Choose the subject you want to study"}
                            {step === 4 && "We are personalizing your dashboard"}
                        </p>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between text-[10px] md:text-xs text-gray-500 font-medium">
                            <span className={step >= 1 ? "text-blue-600 dark:text-blue-400" : ""}>Year</span>
                            <span className={step >= 2 ? "text-blue-600 dark:text-blue-400" : ""}>Branch</span>
                            <span className={step >= 3 ? "text-blue-600 dark:text-blue-400" : ""}>Subject</span>
                            <span className={step >= 5 ? "text-blue-600 dark:text-blue-400" : ""}>Done</span>
                        </div>
                        <div className="overflow-hidden h-1.5 md:h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                            <div
                                style={{ width: `${progress}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-700 ease-out"
                            ></div>
                        </div>
                    </div>

                    {/* Back Button */}
                    {step > 1 && step < 4 && (
                        <button
                            onClick={handleBack}
                            className="flex items-center text-xs md:text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Back
                        </button>
                    )}
                </div>
            )}

            {/* --- WIZARD STEPS --- */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">

                {/* STEP 1: YEAR SELECTION */}
                {step === 1 && (
                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-3xl px-4">
                        {YEARS.map((year) => (
                            <button
                                key={year}
                                onClick={() => handleYearSelect(year)}
                                className="group relative p-4 md:p-6 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-blue-500 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center space-y-2 md:space-y-3"
                            >
                                <div className="text-2xl md:text-4xl group-hover:scale-110 transition-transform">
                                    🎓
                                </div>
                                <span className="text-sm md:text-xl font-semibold text-gray-900 dark:text-white">
                                    {year === 1 ? '1st' : year === 2 ? '2nd' : year === 3 ? '3rd' : '4th'} Year
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 2: BRANCH SELECTION */}
                {step === 2 && (
                    <div className="grid grid-cols-1 gap-3 md:gap-4 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {BRANCHES.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => handleBranchSelect(b.id)}
                                className="flex items-center p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
                            >
                                <span className="text-xl md:text-3xl mr-3 md:mr-4">{b.icon}</span>
                                <div className="flex-1">
                                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {b.label}
                                    </h3>
                                    <p className="text-[10px] md:text-sm text-gray-500">View resources</p>
                                </div>
                                <svg className="ml-auto w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 3: SUBJECT SELECTION */}
                {step === 3 && (
                    <div className="w-full max-w-2xl space-y-3 md:space-y-4 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-sm md:text-lg font-medium text-gray-900 dark:text-white text-center mb-2 md:mb-6">
                            Popular Subjects for {filters.year === 1 ? '1st' : filters.year + 'nd'} Year {filters.branch?.toUpperCase()}
                        </h3>
                        <div className="grid grid-cols-1 gap-2 md:gap-3">
                            {MOCK_SUBJECTS.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => handleSubjectSelect(sub)}
                                    className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-colors group"
                                >
                                    <div className="flex items-center space-x-2 md:space-x-3">
                                        <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-500" />
                                        <span className="text-xs md:text-base text-gray-700 dark:text-gray-200 font-medium">{sub}</span>
                                    </div>
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: LOADING / CURATING ANIMATION */}
                {step === 4 && (
                    <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 text-center px-4 animate-in zoom-in-95 duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                            <div className="text-4xl md:text-6xl animate-bounce">🔍</div>
                        </div>
                        <div className="space-y-1 md:space-y-2">
                            <h3 className="text-base md:text-2xl font-bold text-gray-900 dark:text-white">
                                {loadingText}
                            </h3>
                            <p className="text-xs md:text-base text-gray-500">Hang tight, we're almost there! ✨</p>
                        </div>
                        {/* Fake Loading Bar specific to this step */}
                        <div className="w-40 md:w-64 h-1 md:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* STEP 5: FINAL RESULTS */}
            {step === 5 && (
                <div className="space-y-4 md:space-y-6 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 border-b border-gray-200 dark:border-gray-700 pb-3 md:pb-4">
                        <div>
                            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-1">
                                <CheckCircle2 className="w-3 h-3 md:w-5 md:h-5" />
                                <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Curated for you ✨</span>
                            </div>
                            <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                                Resources for {filters.subject}
                            </h2>
                            <p className="text-gray-500 text-[10px] md:text-sm">
                                {filters.branch?.toUpperCase()} • Year {filters.year}
                            </p>
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline self-start md:self-auto"
                        >
                            Change Selection
                        </button>
                    </div>

                    {/* The Grid Component */}
                    <ResourceGrid
                        view="resources"
                        filters={filters}
                        searchQuery="" // You can lift search state back up if needed
                        onUploadRequest={onUploadRequest}
                    />
                </div>
            )}

            <style>{`
                @keyframes loading {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 100%; transform: translateX(0%); }
                    100% { width: 100%; transform: translateX(100%); }
                }
            `}</style>
        </div>
    )
}