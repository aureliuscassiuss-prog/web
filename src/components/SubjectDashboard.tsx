import { useState, useEffect } from 'react'
import {
    Home, ChevronRight, FileText, Download, ThumbsUp, ThumbsDown,
    Share2, Sparkles, Trash2, Copy, Mic, ArrowUp,
    FileQuestion, RefreshCcw, Loader2
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BRANCHES, getSubjectsByBranchAndYear } from '../data/academicStructure'

export default function SubjectDashboard() {
    const { course, year, subject } = useParams<{ course: string; year: string; subject: string }>()
    const [activeTab, setActiveTab] = useState<'notes' | 'pyqs' | 'formula' | 'ai'>('notes')
    const [chatInput, setChatInput] = useState('')
    const [notesData, setNotesData] = useState<any[]>([])
    const [pyqData, setPyqData] = useState<any[]>([])
    const [formulaData, setFormulaData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [subjectInfo, setSubjectInfo] = useState<{ name: string; code: string } | null>(null)

    // Find subject info from academicStructure
    useEffect(() => {
        if (!subject || !year) return

        // Extract year number (e.g., "1st-year" -> 1)
        const yearMatch = year.match(/(\d+)/)
        if (!yearMatch) return
        const yearNum = parseInt(yearMatch[1])

        // Find branch that has this subject
        for (const branch of BRANCHES) {
            const subjects = getSubjectsByBranchAndYear(branch.id, yearNum)
            const foundSubject = subjects.find(s => s.id === subject)
            if (foundSubject) {
                setSubjectInfo(foundSubject)
                break
            }
        }
    }, [subject, year])

    // Fetch data based on active tab
    useEffect(() => {
        if (!subject || !year || activeTab === 'ai') return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                const resourceType = activeTab === 'notes' ? 'notes' : activeTab === 'pyqs' ? 'pyq' : 'formula-sheet'
                const params = new URLSearchParams({ subject, year, type: resourceType })
                const response = await fetch(`/api/resources/list?${params}`)
                const data = await response.json()

                if (response.ok) {
                    const resources = data.resources || []
                    if (activeTab === 'notes') setNotesData(resources)
                    else if (activeTab === 'pyqs') setPyqData(resources)
                    else if (activeTab === 'formula') setFormulaData(resources)
                }
            } catch (error) {
                console.error('Failed to fetch resources:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [subject, year, activeTab])

    // --- HELPER COMPONENT: FILE CARD ---
    const FileCard = ({ file }: { file: any }) => (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {file.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <span>📅 {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-[8px]">
                                    {file.uploader ? file.uploader[0] : 'U'}
                                </div>
                                <span>{file.uploader || 'Anonymous'}</span>
                            </div>
                            <div>{file.downloads || 0} downloads</div>
                        </div>
                    </div>
                </div>

                <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 w-full sm:w-auto">
                    <Download className="w-4 h-4" />
                    Download
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 p-6 md:p-10 animate-fade-in pb-24">
            {/* 1. Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <Link to="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    <Home className="w-4 h-4" />
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{course || 'Course'}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{year || 'Year'}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-white font-medium">{subjectInfo?.name || subject}</span>
            </nav>

            {/* 2. Header Section */}
            <div className="mb-8">
                {isLoading && !subjectInfo ? (
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="text-gray-500">Loading...</span>
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {subjectInfo?.name || 'Subject'}
                        </h1>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-700 uppercase tracking-wide">
                                {course?.toUpperCase() || 'COURSE'}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-700 uppercase tracking-wide">
                                {year?.replace('-', ' ') || 'YEAR'}
                            </span>
                            {subjectInfo?.code && (
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-700 uppercase tracking-wide">
                                    {subjectInfo.code}
                                </span>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
                            Browse notes, previous year questions, and formula sheets for {subjectInfo?.name || 'this subject'}.
                        </p>
                    </>
                )}
            </div>

            {/* 3. Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                    {['notes', 'pyqs', 'formula', 'ai'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-1.5 ${activeTab === tab
                                ? 'text-gray-900 dark:text-white border-b-2 border-black dark:border-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab === 'ai' && <Sparkles className="w-3.5 h-3.5" />}
                            {tab === 'pyqs' ? 'PYQs' : tab === 'formula' ? 'Formula Sheets' : tab === 'ai' ? 'AI Tutor' : 'Notes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. CONTENT AREA - DYNAMIC RENDERING */}

            {/* --- CASE 1: NOTES --- */}
            {activeTab === 'notes' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notes</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{notesData.length} files available</span>
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : notesData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
                                <FileQuestion className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No notes available yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm">Be the first to contribute notes for this subject.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notesData.map((file) => <FileCard key={file._id || file.id} file={file} />)}
                        </div>
                    )}
                </div>
            )}

            {/* --- CASE 2: PYQS --- */}
            {activeTab === 'pyqs' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Previous Year Questions</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{pyqData.length} files available</span>

                            {/* Generate Sample Paper Button */}
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                                <RefreshCcw className="w-3.5 h-3.5 text-green-600" />
                                <span>Generate Sample Paper</span>
                            </button>

                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : pyqData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
                                <FileQuestion className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No PYQs available yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm">Be the first to upload previous year questions.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pyqData.map((file) => <FileCard key={file._id || file.id} file={file} />)}
                        </div>
                    )}
                </div>
            )}

            {/* --- CASE 3: FORMULA SHEETS --- */}
            {activeTab === 'formula' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Formula Sheets</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{formulaData.length} files available</span>
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : formulaData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
                                <FileQuestion className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                No formula sheets available yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                                Be the first to contribute formula sheets for this subject.
                            </p>
                            <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:opacity-90 transition-opacity">
                                Upload First File
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {formulaData.map((file) => <FileCard key={file._id || file.id} file={file} />)}
                        </div>
                    )}
                </div>
            )}

            {/* --- CASE 4: AI TUTOR --- */}
            {activeTab === 'ai' && (
                <div className="animate-fade-in flex flex-col h-[600px] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">

                    {/* Chat Header Actions */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-end">
                        <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear Chat
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Bot Welcome Message */}
                        <div className="flex flex-col gap-2">
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                Hi! I'm your AI tutor for {subjectInfo?.name || 'this subject'}. I can help you with concepts, solve problems, explain topics, and answer questions related to this subject. What would you like to learn about today?
                            </p>
                            <div className="flex gap-4 mt-1">
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Copy className="w-3.5 h-3.5" /></button>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><ThumbsUp className="w-3.5 h-3.5" /></button>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><ThumbsDown className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    </div>

                    {/* Chat Input Area */}
                    <div className="p-4 bg-white dark:bg-gray-900">
                        <div className="relative flex items-center">
                            <div className="w-full relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="w-full pl-6 pr-24 py-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 shadow-sm transition-all"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                        <Mic className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                                        <ArrowUp className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}