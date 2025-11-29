import {
    Download, Star, Upload as UploadIcon, FileText, User,
    Trophy, Sparkles, Share2, FileQuestion, ArrowUp, Mic,
    Copy, ThumbsUp, ThumbsDown, Trash2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface ResourceGridProps {
    view: 'resources' | 'leaderboard' | 'papers' | 'uploads'
    filters?: {
        branch?: string
        year?: number
        subject?: string
    }
    searchQuery?: string
}

export default function ResourceGrid({ view, filters, searchQuery = '' }: ResourceGridProps) {
    const { user, token } = useAuth()

    // Data States
    const [resources, setResources] = useState<any[]>([])
    const [papers, setPapers] = useState<any[]>([])
    const [uploads, setUploads] = useState<any[]>([])
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // UI States
    const [activeTab, setActiveTab] = useState<'notes' | 'pyqs' | 'formula' | 'ai'>('notes')
    const [chatInput, setChatInput] = useState('')

    // Helper to build query string
    const buildQueryParams = (type?: string) => {
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (filters?.branch) params.append('branch', filters.branch)
        if (filters?.year && filters.year > 0) params.append('year', filters.year.toString())
        if (filters?.subject) params.append('subject', filters.subject)
        if (type) params.append('type', type)
        return params
    }

    // --- FETCH DATA EFFECT ---
    useEffect(() => {
        let isMounted = true
        setIsLoading(true)

        const fetchData = async () => {
            try {
                if (view === 'resources') {
                    // Logic to fetch based on Active Tab
                    if (activeTab === 'notes') {
                        const res = await fetch(`/api/resources/list?${buildQueryParams('notes')}`)
                        const data = await res.json()
                        if (isMounted) setResources(data.resources || [])
                    }
                    else if (activeTab === 'pyqs') {
                        // Attempt to fetch from papers endpoint or resources with type=pyq
                        const res = await fetch(`/api/resources/list?${buildQueryParams('pyq')}`)
                        const data = await res.json()
                        if (isMounted) setResources(data.resources || [])
                    }
                    else if (activeTab === 'formula') {
                        const res = await fetch(`/api/resources/list?${buildQueryParams('formula-sheet')}`)
                        const data = await res.json()
                        if (isMounted) setResources(data.resources || [])
                    }
                }
                else if (view === 'uploads' && token) {
                    const res = await fetch('/api/profile/uploads', { headers: { 'Authorization': `Bearer ${token}` } })
                    const data = await res.json()
                    if (isMounted) setUploads(data.uploads || [])
                }
                else if (view === 'leaderboard') {
                    const res = await fetch('/api/leaderboard/top')
                    const data = await res.json()
                    if (isMounted) setLeaderboard(data.leaderboard || [])
                }
            } catch (err) {
                console.error(`Failed to fetch data:`, err)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        // Only fetch if not AI tab (AI is local/interactive)
        if (activeTab !== 'ai') {
            fetchData()
        } else {
            setIsLoading(false)
        }

        return () => { isMounted = false }
    }, [view, activeTab, searchQuery, filters, token])


    // --- LOADING STATE ---
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white"></div>
            </div>
        )
    }

    // --- VIEW 1: LEADERBOARD ---
    if (view === 'leaderboard') {
        return <LeaderboardView leaderboard={leaderboard} />
    }

    // --- VIEW 2: UPLOADS ---
    if (view === 'uploads') {
        return <UploadsView user={user} uploads={uploads} searchQuery={searchQuery} />
    }

    // --- VIEW 3: RESOURCES (MAIN TABBED VIEW) ---
    // This handles Notes, PYQs, Formula Sheets, and AI
    return (
        <div className="animate-fade-in px-4 md:px-8 py-6">

            {/* TABS HEADER */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                    <TabButton
                        active={activeTab === 'notes'}
                        onClick={() => setActiveTab('notes')}
                        label="Notes"
                    />
                    <TabButton
                        active={activeTab === 'pyqs'}
                        onClick={() => setActiveTab('pyqs')}
                        label="PYQs"
                    />
                    <TabButton
                        active={activeTab === 'formula'}
                        onClick={() => setActiveTab('formula')}
                        label="Formula Sheets"
                    />
                    <TabButton
                        active={activeTab === 'ai'}
                        onClick={() => setActiveTab('ai')}
                        label="AI Tutor"
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                    />
                </div>
            </div>

            {/* TAB CONTENT */}

            {/* 1. NOTES & PYQS & FORMULA (Reuse List Logic) */}
            {activeTab !== 'ai' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {activeTab === 'notes' ? 'Notes' : activeTab === 'pyqs' ? 'Previous Year Questions' : 'Formula Sheets'}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {resources.length} files available
                            </span>
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {resources.length === 0 ? (
                        <EmptyState
                            icon={FileQuestion}
                            title={`No ${activeTab === 'formula' ? 'formula sheets' : activeTab} available yet`}
                            description={`Be the first to upload ${activeTab === 'formula' ? 'formula sheets' : 'resources'} for this category.`}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {resources.map((resource) => (
                                <FileListCard key={resource._id} resource={resource} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2. AI TUTOR INTERFACE */}
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
                        <div className="flex flex-col gap-2">
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                Hi! I'm your AI tutor. I can help you with concepts, solve problems, explain topics, and answer questions related to your subjects. What would you like to learn about today?
                            </p>
                            <div className="flex gap-4 mt-2">
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

// --- SUB-COMPONENTS ---

const TabButton = ({ active, onClick, label, icon }: any) => (
    <button
        onClick={onClick}
        className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${active
                ? 'text-gray-900 dark:text-white border-b-2 border-black dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
    >
        {icon}
        {label}
    </button>
)

const FileListCard = ({ resource }: { resource: any }) => (
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
                        {resource.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <span>📅 {new Date(resource.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-[8px]">
                                {resource.uploader ? resource.uploader[0] : 'U'}
                            </div>
                            <span>{resource.uploader || 'Admin'}</span>
                        </div>
                        <div>
                            {resource.downloads || 0} downloads
                        </div>
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

const LeaderboardView = ({ leaderboard }: { leaderboard: any[] }) => (
    <div className="px-4 md:px-8 py-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-black">
            <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-gray-900 dark:text-white" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Contributors</h2>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">Rank</th>
                            <th className="px-6 py-3 font-medium">Student</th>
                            <th className="px-6 py-3 font-medium text-right">Reputation</th>
                            <th className="px-6 py-3 font-medium text-right">Uploads</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {leaderboard.map((user) => (
                            <tr key={user.rank} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <td className="px-6 py-4">
                                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${user.rank <= 3 ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {user.rank}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{user.points}</td>
                                <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{user.uploads}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
)

const UploadsView = ({ user, uploads, searchQuery }: any) => {
    if (!user) return <EmptyState icon={UploadIcon} title="Sign in to view uploads" />

    const filtered = uploads.filter((u: any) => !searchQuery || u.title.toLowerCase().includes(searchQuery.toLowerCase()))

    if (filtered.length === 0) return <EmptyState icon={UploadIcon} title="No uploads found" />

    return (
        <div className="px-4 md:px-8 py-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">My Uploads</h2>
            <div className="grid grid-cols-1 gap-4">
                {filtered.map((resource: any) => (
                    <FileListCard key={resource._id} resource={resource} />
                ))}
            </div>
        </div>
    )
}

const EmptyState = ({ icon: Icon, title, description }: any) => (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>}
    </div>
)