import {
    ExternalLink, Star, Upload as UploadIcon, FileText, User,
    Trophy, Sparkles, Share2, FileQuestion, ArrowUp, Mic,
    Copy, ThumbsUp, ThumbsDown, Trash2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LeaderboardView from './LeaderboardView'

interface ResourceGridProps {
    view: 'resources' | 'leaderboard' | 'papers' | 'uploads'
    filters?: {
        branch?: string
        year?: number
        subject?: string
    }
    searchQuery?: string
    onUploadRequest?: (data: any) => void
}

export default function ResourceGrid({ view, filters, searchQuery = '', onUploadRequest }: ResourceGridProps) {
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
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
        { role: 'assistant', content: "Hi! I'm your AI tutor. I can help you with concepts, solve problems, explain topics, and answer questions related to your subjects. What would you like to learn about today?" }
    ])
    const [isAiLoading, setIsAiLoading] = useState(false)

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

    // Handle AI Chat
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isAiLoading) return

        const userMessage = chatInput.trim()
        setChatInput('')
        setIsAiLoading(true)

        // Add user message to display
        const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }]
        setChatMessages(newMessages)

        try {
            const headers: any = {
                'Content-Type': 'application/json'
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            // Build conversation history for API (exclude the message we just added)
            const conversationHistory = chatMessages.map(m => ({ role: m.role, content: m.content }))

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    question: userMessage,
                    conversationHistory
                })
            })

            if (!response.ok) throw new Error('Failed to get AI response')

            const data = await response.json()

            // Update with the returned conversation history or build it manually
            if (data.conversationHistory) {
                setChatMessages(data.conversationHistory.map((m: any) => ({ role: m.role, content: m.content })))
            } else {
                setChatMessages([...newMessages, { role: 'assistant', content: data.answer || "I'm sorry, I couldn't generate a response." }])
            }
        } catch (error) {
            console.error('AI Error:', error)
            setChatMessages([...newMessages, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again later." }])
        } finally {
            setIsAiLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const clearChat = () => {
        setChatMessages([
            { role: 'assistant', content: "Hi! I'm your AI tutor. I can help you with concepts, solve problems, explain topics, and answer questions related to your subjects. What would you like to learn about today?" }
        ])
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
                        const res = await fetch(`/api/resources?${buildQueryParams('notes')}`)
                        const data = await res.json()
                        if (isMounted) setResources(data.resources || [])
                    }
                    else if (activeTab === 'pyqs') {
                        const res = await fetch(`/api/resources?${buildQueryParams('pyq')}`)
                        const data = await res.json()
                        if (isMounted) setResources(data.resources || [])
                    }
                    else if (activeTab === 'formula') {
                        const res = await fetch(`/api/resources?${buildQueryParams('formula-sheet')}`)
                        const data = await res.json()
                        if (isMounted) setResources(data.resources || [])
                    }
                }
                else if (view === 'uploads' && token) {
                    const res = await fetch('/api/profile?action=uploads', { headers: { 'Authorization': `Bearer ${token}` } })
                    const data = await res.json()
                    if (isMounted) setUploads(data.uploads || [])
                }
                else if (view === 'leaderboard') {
                    const res = await fetch('/api/leaderboard')
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

    // --- VIEW 2: UPLOADS ---
    if (view === 'uploads') {
        return <UploadsView user={user} uploads={uploads} searchQuery={searchQuery} />
    }

    // --- VIEW 2.5: LEADERBOARD ---
    if (view === 'leaderboard') {
        return <LeaderboardView leaderboard={leaderboard} />
    }

    // --- VIEW 3: RESOURCES (MAIN TABBED VIEW) ---
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

            {/* 1. NOTES & PYQS & FORMULA */}
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
                            onUploadRequest={onUploadRequest}
                            filters={filters}
                            activeTab={activeTab}
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
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">AI Tutor</h3>
                        </div>
                        <button
                            onClick={clearChat}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear Chat
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                        {chatMessages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-black dark:bg-white text-white dark:text-black'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </div>
                        ))}
                        {isAiLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input Area */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                        <div className="relative flex items-center">
                            <div className="w-full relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask anything..."
                                    disabled={isAiLoading}
                                    className="w-full pl-6 pr-24 py-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 shadow-sm transition-all disabled:opacity-50"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isAiLoading || !chatInput.trim()}
                                        className="p-2 bg-black dark:bg-white rounded-full text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
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
                            {resource.downloads || 0} views
                        </div>
                    </div>
                </div>
            </div>

            <a
                href={resource.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 w-full sm:w-auto"
            >
                <ExternalLink className="w-4 h-4" />
                View Resource
            </a>
        </div>
    </div>
)

const UploadsView = ({ user, uploads, searchQuery }: any) => (
    <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <UploadIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Uploads</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{uploads.length} resources uploaded</p>
                </div>
            </div>
        </div>

        {uploads.length === 0 ? (
            <div className="text-center py-16">
                <UploadIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">You haven't uploaded any resources yet.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {uploads
                    .filter((upload: any) =>
                        !searchQuery ||
                        upload.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        upload.subject?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((upload: any) => (
                        <FileListCard key={upload._id} resource={upload} />
                    ))}
            </div>
        )}
    </div>
)

const EmptyState = ({ icon: Icon, title, description, onUploadRequest, filters, activeTab }: any) => (
    <div className="text-center py-16">
        <Icon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
        {onUploadRequest && (
            <button
                onClick={() => onUploadRequest({ filters, activeTab })}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
                Upload Resource
            </button>
        )}
    </div>
)
