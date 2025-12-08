import {
    Upload as UploadIcon, FileText, User,
    Trophy, Sparkles, FileQuestion, ArrowUp,
    Copy, ThumbsUp, ThumbsDown, Trash2, Bot, Download,
    Check, ChevronRight, Bookmark, Flag, AlertTriangle, X
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ReactMarkdown from 'react-markdown'
import LeaderboardView from './LeaderboardView'
import jsPDF from 'jspdf'
// @ts-ignore
import autoTable from 'jspdf-autotable'
import TyreLoader from './TyreLoader'

interface ResourceGridProps {
    view: 'resources' | 'leaderboard' | 'papers' | 'uploads'
    filters?: {
        branch?: string
        year?: number | string
        semester?: string
        subject?: string
        course?: string
        unit?: string
    }
    searchQuery?: string
    onUploadRequest?: (data: any) => void
}

interface Message {
    role: 'user' | 'assistant'
    content: string
}


// --- SUB-COMPONENTS ---

const TabButton = ({ active, onClick, label, icon, isSpecial }: any) => (
    <button
        onClick={onClick}
        className={`
    flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all
    ${active
                ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white ring-1 ring-gray-200 dark:ring-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
            }
    ${active && isSpecial ? 'text-violet-600 dark:text-violet-400 ring-violet-200 dark:ring-violet-900' : ''}
`}
    >
        <span className={isSpecial ? "text-violet-500" : active ? "text-blue-500" : "text-gray-400"}>
            {icon}
        </span>
        <span className="truncate">{label}</span>
    </button>
)

// --- UPDATED DESIGN: Grid Card ---
const GridCard = ({ resource, onDelete, showStatus = false }: { resource: any, onDelete?: (id: string) => void, showStatus?: boolean }) => {
    const { token } = useAuth();
    // Initialize from resource data
    const [isSaved, setIsSaved] = useState(resource.userSaved || false);
    const [isReported, setIsReported] = useState(resource.userFlagged || false);
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(
        resource.userLiked ? 'like' : resource.userDisliked ? 'dislike' : null
    );
    const [counts, setCounts] = useState({
        likes: resource.likes || 0,
        dislikes: resource.dislikes || 0,
        downloads: resource.downloads || 0,
        flags: resource.flags || 0
    });

    const [isInteracting, setIsInteracting] = useState(false);

    // Sync state ONLY when the resource itself changes (different resource)
    // This ensures state updates after page refresh but doesn't interfere with optimistic updates
    useEffect(() => {
        setIsSaved(resource.userSaved || false);
        setIsReported(resource.userFlagged || false);
        setUserVote(resource.userLiked ? 'like' : resource.userDisliked ? 'dislike' : null);
        setCounts({
            likes: resource.likes || 0,
            dislikes: resource.dislikes || 0,
            downloads: resource.downloads || 0,
            flags: resource.flags || 0
        });
    }, [resource]); // Re-run when resource object changes (including deep updates if ref fetched)


    const handleInteraction = async (action: string, value: boolean) => {
        if (!token) {
            alert('Please sign in to interact with resources');
            return false;
        }

        try {
            const response = await fetch('/api/resource-interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resourceId: resource._id,
                    action,
                    value
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Update with server truth
                setCounts({
                    likes: data.resource.likes,
                    dislikes: data.resource.dislikes,
                    downloads: data.resource.downloads,
                    flags: data.resource.flags
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Interaction failed:', error);
            return false;
        }
    };

    const handleLike = async () => {
        if (isInteracting) return;
        setIsInteracting(true);

        const previousVote = userVote;
        const previousCounts = { ...counts };
        const newValue = userVote !== 'like';

        // Optimistic update
        if (newValue) {
            if (userVote === 'dislike') {
                setCounts(prev => ({ ...prev, likes: prev.likes + 1, dislikes: prev.dislikes - 1 }));
            } else {
                setCounts(prev => ({ ...prev, likes: prev.likes + 1 }));
            }
            setUserVote('like');
        } else {
            setCounts(prev => ({ ...prev, likes: prev.likes - 1 }));
            setUserVote(null);
        }

        const success = await handleInteraction('like', newValue);
        if (!success) {
            // Revert
            setUserVote(previousVote);
            setCounts(previousCounts);
        }
        setIsInteracting(false);
    };

    const handleDislike = async () => {
        if (isInteracting) return;
        setIsInteracting(true);

        const previousVote = userVote;
        const previousCounts = { ...counts };
        const newValue = userVote !== 'dislike';

        // Optimistic update
        if (newValue) {
            if (userVote === 'like') {
                setCounts(prev => ({ ...prev, dislikes: prev.dislikes + 1, likes: prev.likes - 1 }));
            } else {
                setCounts(prev => ({ ...prev, dislikes: prev.dislikes + 1 }));
            }
            setUserVote('dislike');
        } else {
            setCounts(prev => ({ ...prev, dislikes: prev.dislikes - 1 }));
            setUserVote(null);
        }

        const success = await handleInteraction('dislike', newValue);
        if (!success) {
            // Revert
            setUserVote(previousVote);
            setCounts(previousCounts);
        }
        setIsInteracting(false);
    };

    const handleSave = async () => {
        if (isInteracting) return;
        setIsInteracting(true);

        const previousSaved = isSaved;
        const newSavedState = !isSaved;
        setIsSaved(newSavedState); // Optimistic

        const success = await handleInteraction('save', newSavedState);
        if (!success) {
            setIsSaved(previousSaved);
        }
        setIsInteracting(false);
    };

    const handleFlag = async () => {
        if (isInteracting || isReported) return;

        if (confirm('Are you sure you want to flag this resource as risky? This action cannot be undone.')) {
            setIsInteracting(true);
            const previousReported = isReported;
            const previousCounts = { ...counts };

            setIsReported(true);
            setCounts(prev => ({ ...prev, flags: prev.flags + 1 }));

            const success = await handleInteraction('flag', true);
            if (!success) {
                setIsReported(previousReported);
                setCounts(previousCounts);
            }
            setIsInteracting(false);
        }
    };

    const handleDownload = async () => {
        // Don't block download on interaction, just fire and forget mostly, but track count
        setCounts(prev => ({ ...prev, downloads: prev.downloads + 1 }));
        handleInteraction('download', true);
    };

    return (
        <div className="group flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">

            {/* HEADER: Subject Name & Top Actions */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-2 flex flex-wrap gap-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300">
                        {resource.subject || 'General Resource'}
                    </span>
                    {showStatus && resource.status && (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${resource.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                            resource.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                            }`}>
                            {resource.status}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.preventDefault(); handleSave(); }}
                        disabled={isInteracting}
                        className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'} ${isInteracting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isSaved ? "Saved" : "Save Resource"}
                    >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); handleFlag(); }}
                        disabled={isInteracting || isReported}
                        className={`p-1.5 rounded-lg transition-colors ${isReported ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'} ${isInteracting || isReported ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Flag as Risky"
                    >
                        <Flag className={`w-4 h-4 ${isReported ? 'fill-current' : ''}`} />
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(resource._id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* BODY: Title & Icon */}
            <div className="flex items-start gap-3 mb-4 flex-1">
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                    className="flex-shrink-0 mt-1 w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 text-blue-500 group-hover:scale-105 transition-transform"
                >
                    <FileText className="w-5 h-5" />
                </a>
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                    className="block"
                >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {resource.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">
                        View file details &rarr;
                    </p>
                </a>
            </div>

            {/* ACTION BAR: Likes/Dislikes & Download */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-auto">

                {/* Left: Voting */}
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1">
                    <button
                        onClick={handleLike}
                        disabled={isInteracting}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${userVote === 'like' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'} ${isInteracting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{counts.likes}</span>
                    </button>
                    <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                    <button
                        onClick={handleDislike}
                        disabled={isInteracting}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${userVote === 'dislike' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'} ${isInteracting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ThumbsDown className="w-3 h-3" />
                        <span>{counts.dislikes}</span>
                    </button>
                    {counts.flags > 0 && (
                        <>
                            <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                            <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-orange-600">
                                <Flag className="w-3 h-3" />
                                {counts.flags}
                            </span>
                        </>
                    )}
                </div>

                {/* Right: Uploader & Download */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {resource.uploaderAvatar ? (
                            <img src={resource.uploaderAvatar} alt="User" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-gray-500">
                                    {(resource.uploader || 'A').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[60px] truncate">
                            {resource.uploader || 'Anon'}
                        </span>
                    </div>

                    <a
                        href={resource.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleDownload}
                        className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md hover:text-blue-600 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        {counts.downloads}
                    </a>
                </div>
            </div>
        </div>
    );
}

const UploadsView = ({ uploads, onUploadRequest, onDelete }: any) => (
    <div className="animate-fade-in">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap dark:text-white">Your Uploads</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You have contributed <strong>{uploads.length}</strong> resources.
                    </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploads.length === 0 ? (
                <div className="col-span-full">
                    <EmptyState
                        icon={UploadIcon}
                        title="No uploads found"
                        description="You haven't uploaded any resources yet."
                        onUploadRequest={onUploadRequest}
                    />
                </div>
            ) : (
                uploads.map((upload: any) => (
                    <GridCard key={upload._id} resource={upload} onDelete={onDelete} showStatus={true} />
                ))
            )}
        </div>
    </div>
)

const EmptyState = ({ icon: Icon, title, description, onUploadRequest, filters, activeTab }: any) => (
    <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full mb-3">
            <Icon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 mb-4">{description}</p>
        {onUploadRequest && (
            <button
                onClick={() => onUploadRequest({ filters, activeTab })}
                className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:underline"
            >
                <UploadIcon className="w-3 h-3" /> Upload Now
            </button>
        )}
    </div>
)

export default function ResourceGrid({ view, filters, searchQuery = '', onUploadRequest }: ResourceGridProps) {
    const { token, user } = useAuth()
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Data States
    const [resources, setResources] = useState<any[]>([])
    const [uploads, setUploads] = useState<any[]>([])
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // UI States
    const [activeTab, setActiveTab] = useState<'notes' | 'pyqs' | 'formula' | 'ai'>('notes')
    const [selectedPyqYear, setSelectedPyqYear] = useState<string | null>(null); // New state for PYQ folders
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    // AI Chat States
    // AI Chat States
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi! I'm your AI tutor. I can help you with concepts, solve problems, or explain topics. What are we studying today?" }
    ])
    const [isAiLoading, setIsAiLoading] = useState(false)
    const isSendingRef = useRef(false)

    // Scroll to bottom on new messages
    useEffect(() => {
        if (activeTab === 'ai') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [chatMessages, isAiLoading, activeTab, view])


    // AI Paper Generation States
    const [generating, setGenerating] = useState(false)
    const [attemptsLeft, setAttemptsLeft] = useState(3)

    const buildQueryParams = (type?: string) => {
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (filters?.branch) params.append('branch', filters.branch)
        if (filters?.year) params.append('year', filters.year.toString())
        if (filters?.semester) params.append('semester', filters.semester)
        if (filters?.subject) params.append('subject', filters.subject)
        if (filters?.course) params.append('course', filters.course)
        if (filters?.unit) params.append('unit', filters.unit)
        if (type) params.append('type', type)
        // Add examYear if provided
        if (selectedPyqYear) params.append('examYear', selectedPyqYear);
        return params
    }

    // --- AI HANDLERS ---
    const handleSendMessage = async () => {
        // Prevent double sending with Ref + State check
        if (!chatInput.trim() || isAiLoading || isSendingRef.current) return

        const userMessage = chatInput.trim()

        isSendingRef.current = true
        setIsAiLoading(true)
        setChatInput('')

        const newMessages: Message[] = [...chatMessages, { role: 'user', content: userMessage }]
        setChatMessages(newMessages)

        try {
            const headers: any = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`

            const conversationHistory = newMessages.map(m => ({ role: m.role, content: m.content }))

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers,
                body: JSON.stringify({ question: userMessage, conversationHistory })
            })

            if (!response.ok) throw new Error('Failed to get AI response')
            const data = await response.json()

            if (data.conversationHistory) {
                setChatMessages(data.conversationHistory)
            } else {
                setChatMessages([...newMessages, { role: 'assistant', content: data.answer || "I'm sorry, I couldn't generate a response." }])
            }
        } catch (error) {
            console.error('AI Error:', error)
            setChatMessages([...newMessages, { role: 'assistant', content: "Connection error. Please try again later." }])
        } finally {
            setIsAiLoading(false)
            // Small delay to prevent immediate re-submission if user is mashing Enter
            setTimeout(() => {
                isSendingRef.current = false
            }, 500)
        }
    }

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    const clearChat = () => {
        setChatMessages([{ role: 'assistant', content: "Chat cleared. How can I help you now?" }])
    }

    // --- DATA FETCHING ---
    useEffect(() => {
        let isMounted = true
        const controller = new AbortController()
        const { signal } = controller

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn('Force stopping loading indicator due to timeout')
                setIsLoading(false)
            }
        }, 12000)

        setIsLoading(true)

        const fetchData = async () => {
            try {
                if (view === 'resources' && activeTab !== 'ai') {
                    // Start with empty resources if in PYQ mode and no year selected
                    if (activeTab === 'pyqs' && !selectedPyqYear) {
                        if (isMounted) {
                            setResources([]);
                            setIsLoading(false);
                        }
                        return;
                    }

                    let typeParam = activeTab === 'notes' ? 'notes' : activeTab === 'pyqs' ? 'pyq' : 'formula-sheet'
                    const headers: any = {}
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`
                    }
                    const res = await fetch(`/api/resources?${buildQueryParams(typeParam)}`, { headers, signal })
                    const data = await res.json()
                    // Filter duplicates if any
                    if (isMounted) setResources(data.resources || [])
                }
                else if (view === 'uploads' && token) {
                    const res = await fetch('/api/profile?action=uploads', {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal
                    })
                    const data = await res.json()
                    if (isMounted) {
                        // Inject current user's avatar since they are the uploader
                        const uploadsWithAvatar = (data.uploads || []).map((u: any) => ({
                            ...u,
                            uploaderAvatar: user?.avatar,
                            uploader: user?.name || u.uploader
                        }))
                        setUploads(uploadsWithAvatar)
                    }
                }
                else if (view === 'leaderboard') {
                    const res = await fetch('/api/resources?action=leaderboard', { signal })
                    const data = await res.json()
                    if (isMounted) setLeaderboard(data.leaderboard || [])
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error(`Failed to fetch data:`, err)
                }
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        if (activeTab !== 'ai') fetchData()
        else setIsLoading(false)

        return () => {
            isMounted = false
            controller.abort()
            clearTimeout(safetyTimeout)
        }
    }, [view, activeTab, searchQuery, filters, token, user, selectedPyqYear])

    // AI Paper Generation Functions
    const transformDataForPdf = (aiData: any, filters: any) => {
        const flat: any = {
            EXAM_MONTH: new Date().toLocaleString('default', { month: 'short' }),
            EXAM_YEAR: new Date().getFullYear().toString(),
            COURSE_CODE: aiData.courseCode || 'CS-101',
            SUBJECT_NAME: filters.subject || 'Subject',
            PROGRAMME: filters.course || 'Programme',
            BRANCH: filters.branch || 'Branch',
        }

        const sectionA = aiData.sections?.find((s: any) => s.name.includes('Section A'))
        if (sectionA && sectionA.questions) {
            sectionA.questions.forEach((q: any, i: number) => {
                flat[`MCQ_${i + 1}_QUESTION`] = q.text || ''
                flat[`MCQ_${i + 1}_OPTION_A`] = q.options?.[0] || ''
                flat[`MCQ_${i + 1}_OPTION_B`] = q.options?.[1] || ''
                flat[`MCQ_${i + 1}_OPTION_C`] = q.options?.[2] || ''
                flat[`MCQ_${i + 1}_OPTION_D`] = q.options?.[3] || ''
            })
        }

        const sectionB = aiData.sections?.find((s: any) => s.name.includes('Section B'))
        if (sectionB && sectionB.questions) {
            const q = sectionB.questions
            flat.Q2_PART_1 = q[0]?.text || ''
            flat.Q2_PART_2 = q[1]?.text || ''
            flat.Q2_OR_PART = q[2]?.text || ''
            flat.Q3_PART_1 = q[3]?.text || ''
            flat.Q3_PART_2 = q[4]?.text || ''
            flat.Q3_OR_PART = q[5]?.text || ''
            flat.Q4_PART_1 = q[6]?.text || ''
            flat.Q4_PART_2 = q[7]?.text || ''
            flat.Q4_OR_PART = q[8]?.text || ''
            flat.Q5_PART_1 = q[9]?.text || ''
            flat.Q5_PART_2 = q[10]?.text || ''
            flat.Q5_OR_PART = q[11]?.text || ''
            flat.Q6_PART_1 = q[12]?.text || ''
            flat.Q6_PART_2 = q[13]?.text || ''
            flat.Q6_PART_3 = q[14]?.text || ''
        }

        return flat
    }

    const generatePDF = (data: any) => {
        const doc = new jsPDF("landscape", "mm", "a4");
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // Reset Text
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "italic");
        doc.setFontSize(9);

        // Header
        doc.text("Total No. of Questions: 6", 12, 10);
        doc.text("Total No. of Printed Pages: 2", 135, 10, { align: "right" });

        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.text("Enrollment No.....................................", 135, 16, { align: "right" });

        doc.setFont("times", "normal");
        doc.setFontSize(13);
        doc.text("Faculty of Engineering", 85, 26, { align: "center" });
        doc.text(`End Sem Examination ${data.EXAM_MONTH}-${data.EXAM_YEAR}`, 85, 32, { align: "center" });

        doc.setFontSize(11);
        doc.text(`${data.COURSE_CODE} ${data.SUBJECT_NAME}`, 85, 38, { align: "center" });

        doc.setFont("times", "normal");
        doc.setFontSize(9);
        doc.text(`Programme: ${data.PROGRAMME}`, 40, 43);
        doc.text(`Branch/Specialisation: ${data.BRANCH}`, 135, 43, { align: "right" });

        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.text("Duration: 3 Hrs.", 10, 48);
        doc.text("Maximum Marks: 60", 135, 48, { align: "right" });

        doc.setLineWidth(0.3);
        doc.line(10, 50, 140, 50);

        // Disclaimer
        doc.setTextColor(255, 0, 0);
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        const disclaimer = "DISCLAIMER: This is a mock question paper by MediNotes for practice only. NOT a university paper. Misusing this document may lead to serious disciplinary action.";
        const splitDisclaimer = doc.splitTextToSize(disclaimer, 130);
        doc.text(splitDisclaimer, 10, 54);
        doc.setTextColor(0, 0, 0);

        let yPos = 54 + (3 * splitDisclaimer.length) + 5;

        // Q1 Header
        doc.setFontSize(9);
        doc.text("Q.1", 8, yPos);

        // Render MCQs 1-8
        let savedQ9 = null;

        for (let i = 1; i <= 9; i++) {
            const key = `MCQ_${i}`;
            const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"];

            doc.setFont("times", "normal");
            const qText = data[`${key}_QUESTION`] || "Question text missing";
            const lines = doc.splitTextToSize(qText, 115);

            const optA = `(a) ${data[`${key}_OPTION_A`] || ''}`;
            const optB = `(b) ${data[`${key}_OPTION_B`] || ''}`;
            const optC = `(c) ${data[`${key}_OPTION_C`] || ''}`;
            const optD = `(d) ${data[`${key}_OPTION_D`] || ''}`;

            // Wrap options to prevent collision
            // Column 1 width ~55, Column 2 width ~60
            const optALines = doc.splitTextToSize(optA, 55);
            const optBLines = doc.splitTextToSize(optB, 60);
            const optCLines = doc.splitTextToSize(optC, 55);
            const optDLines = doc.splitTextToSize(optD, 60);

            // Calculate Height
            const hRow1 = Math.max(optALines.length, optBLines.length) * 4;
            const hRow2 = Math.max(optCLines.length, optDLines.length) * 4;
            const hBlock = (4 * lines.length) + hRow1 + hRow2 + 4;

            // Check for Column Break
            if (i === 9 && (yPos + hBlock > 200)) {
                savedQ9 = { qText, lines, optALines, optBLines, optCLines, optDLines };
                break;
            }

            const roman = romans[i - 1];
            doc.text(`${roman}.`, 14, yPos);
            const indent = (roman === "viii") ? 20 : (roman === "vii" ? 19 : 18);

            doc.text(lines, indent, yPos);
            doc.setFont("times", "bold");
            doc.text("1", 135, yPos);
            doc.setFont("times", "normal");

            yPos += (4 * lines.length);

            // Row 1 Options
            doc.text(optALines, 18, yPos);
            doc.text(optBLines, 75, yPos);
            yPos += hRow1 + 1; // +1 padding

            // Row 2 Options
            doc.text(optCLines, 18, yPos);
            doc.text(optDLines, 75, yPos);
            yPos += hRow2 + 3; // +3 padding before next question
        }

        // --- Second Column (Right Side) ---
        let yCol2 = 15;

        // Page Num Top Right
        doc.setFontSize(7);
        doc.text("[2]", 220, 8, { align: "center" });
        doc.setFontSize(9);

        // Render Q9 if saved
        if (savedQ9) {
            doc.setFont("times", "normal");
            doc.text("ix.", 156, yCol2);
            doc.text(savedQ9.lines, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text("1", 285, yCol2);
            doc.setFont("times", "normal");
            yCol2 += (4 * savedQ9.lines.length);

            const hRow1 = Math.max(savedQ9.optALines.length, savedQ9.optBLines.length) * 4;
            const hRow2 = Math.max(savedQ9.optCLines.length, savedQ9.optDLines.length) * 4;

            doc.text(savedQ9.optALines, 160, yCol2);
            doc.text(savedQ9.optBLines, 220, yCol2);
            yCol2 += hRow1 + 1;

            doc.text(savedQ9.optCLines, 160, yCol2);
            doc.text(savedQ9.optDLines, 220, yCol2);
            yCol2 += hRow2 + 3;
        }

        // Render Q10
        const q10Key = "MCQ_10";
        const q10Text = data[`${q10Key}_QUESTION`];
        if (q10Text) {
            const q10Lines = doc.splitTextToSize(q10Text, 120);

            doc.text("x.", 156, yCol2);
            doc.text(q10Lines, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text("1", 285, yCol2);
            doc.setFont("times", "normal");
            yCol2 += (4 * q10Lines.length);

            const optA = `(a) ${data[`${q10Key}_OPTION_A`] || ''}`;
            const optB = `(b) ${data[`${q10Key}_OPTION_B`] || ''}`;
            const optC = `(c) ${data[`${q10Key}_OPTION_C`] || ''}`;
            const optD = `(d) ${data[`${q10Key}_OPTION_D`] || ''}`;

            const optALines = doc.splitTextToSize(optA, 55);
            const optBLines = doc.splitTextToSize(optB, 60);
            const optCLines = doc.splitTextToSize(optC, 55);
            const optDLines = doc.splitTextToSize(optD, 60);

            const hRow1 = Math.max(optALines.length, optBLines.length) * 4;
            const hRow2 = Math.max(optCLines.length, optDLines.length) * 4;

            doc.text(optALines, 160, yCol2);
            doc.text(optBLines, 220, yCol2);
            yCol2 += hRow1 + 1;

            doc.text(optCLines, 160, yCol2);
            doc.text(optDLines, 220, yCol2);
            yCol2 += hRow2 + 3;
        }

        // Descriptive Q2
        doc.setFont("times", "normal");
        doc.text("Q.2", 150, yCol2);

        const q2Parts = [
            { l: "i.", t: data.Q2_PART_1, m: "2" },
            { l: "ii.", t: data.Q2_PART_2, m: "3" },
            { l: "iii.", t: data.Q2_PART_3, m: "5" },
        ];

        q2Parts.forEach(part => {
            if (!part.t) return;
            doc.setFont("times", "normal");
            const pl = doc.splitTextToSize(part.t, 120);
            doc.text(part.l, 156, yCol2);
            doc.text(pl, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text(part.m, 285, yCol2);
            yCol2 += (4 * pl.length) + 2;
        });

        if (data.Q2_OR_PART) {
            doc.setFont("times", "normal");
            doc.text("OR", 150, yCol2);
            const q2Or = doc.splitTextToSize(data.Q2_OR_PART, 120);
            doc.text("iv.", 156, yCol2);
            doc.text(q2Or, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text("5", 285, yCol2);
            yCol2 += (4 * q2Or.length) + 6;
        }

        // Loop Q3 - Q5
        for (let q = 3; q <= 5; q++) {
            if (!data[`Q${q}_PART_1`]) continue;

            doc.setFont("times", "normal");
            doc.text(`Q.${q}`, 150, yCol2);

            const marks = (q === 3 || q === 4) ? ["3", "7"] : ["2", "8"];
            const orMark = (q === 3 || q === 4) ? "7" : "8";

            const parts = [
                { l: "i.", t: data[`Q${q}_PART_1`], m: marks[0] },
                { l: "ii.", t: data[`Q${q}_PART_2`], m: marks[1] },
            ];

            parts.forEach(part => {
                if (!part.t) return;
                doc.setFont("times", "normal");
                const pl = doc.splitTextToSize(part.t, 120);
                doc.text(part.l, 156, yCol2);
                doc.text(pl, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text(part.m, 285, yCol2);
                yCol2 += (4 * pl.length) + 2;
            });

            if (data[`Q${q}_OR_PART`]) {
                doc.setFont("times", "normal");
                doc.text("OR", 150, yCol2);
                const orText = doc.splitTextToSize(data[`Q${q}_OR_PART`], 120);
                doc.text("iii.", 156, yCol2);
                doc.text(orText, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text(orMark, 285, yCol2);
                yCol2 += (4 * orText.length) + 6;
            }
        }

        // Q6
        if (data.Q6_PART_1) {
            doc.setFont("times", "normal");
            doc.text("Q.6", 150, yCol2);
            doc.text("Attempt any two:", 156, yCol2);
            yCol2 += 5;

            const q6Parts = [
                { l: "i.", t: data.Q6_PART_1 },
                { l: "ii.", t: data.Q6_PART_2 },
                { l: "iii.", t: data.Q6_PART_3 },
            ];

            q6Parts.forEach(part => {
                if (!part.t) return;
                const pl = doc.splitTextToSize(part.t, 120);
                const heightNeeded = (4 * pl.length) + 2;

                if (yCol2 + heightNeeded > 200) {
                    doc.addPage();
                    yCol2 = 20;
                }

                doc.setFont("times", "normal");
                doc.setFontSize(9);
                doc.text(part.l, 156, yCol2);
                doc.text(pl, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text("5", 285, yCol2);
                yCol2 += heightNeeded;
            });
        }

        yCol2 += 6;
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("******", 220, yCol2, { align: "center" });


        const filename = `Sample_Paper_${data.SUBJECT_NAME.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
        doc.save(filename)
    }

    const [error, setError] = useState<string | null>(null)

    const handleGeneratePaper = async () => {
        if (user?.role !== 'admin' && attemptsLeft <= 0) {
            setError('You have reached your daily limit. Try again tomorrow!')
            return
        }

        if (!filters?.subject) {
            setError('Please select a subject first')
            return
        }

        setGenerating(true)
        setError(null)

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'generate-paper',
                    program: filters.course,
                    year: filters.year,
                    branch: filters.branch,
                    subject: filters.subject,
                    semester: filters.semester
                })
            })

            const data = await res.json()

            let paperData
            try {
                if (typeof data.answer === 'object') {
                    paperData = data.answer
                } else {
                    // Try to extract JSON from markdown code blocks if present
                    const match = data.answer.match(/```json\n([\s\S]*)\n```/)
                    if (match) {
                        paperData = JSON.parse(match[1])
                    } else {
                        // Try direct parse
                        paperData = JSON.parse(data.answer)
                    }
                }
            } catch (e) {
                console.error("JSON Parse Error", e);
                // Try one last attempt to find a JSON-like structure
                try {
                    const paramsStart = data.answer.indexOf('{');
                    const paramsEnd = data.answer.lastIndexOf('}');
                    if (paramsStart !== -1 && paramsEnd !== -1) {
                        paperData = JSON.parse(data.answer.substring(paramsStart, paramsEnd + 1));
                    } else {
                        throw new Error('Could not parse AI response');
                    }
                } catch (e2) {
                    throw new Error('Failed to parse AI response');
                }
            }

            if (!paperData) throw new Error('No data received from AI');

            const flatData = transformDataForPdf(paperData, filters)
            generatePDF(flatData)

            if (user?.role !== 'admin') {
                const newCount = attemptsLeft - 1
                setAttemptsLeft(newCount)
                localStorage.setItem('paper_attempts', JSON.stringify({ date: new Date().toDateString(), count: newCount }))
            }

        } catch (error) {
            console.error('Generation failed:', error)
            setError('Failed to generate paper. Please try again or choose a different subject.')
        } finally {
            setGenerating(false)
        }
    }


    const handleDelete = async (resourceId: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return

        try {
            const response = await fetch(`/api/resources?id=${resourceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                setUploads(prev => prev.filter(r => r._id !== resourceId))
                setResources(prev => prev.filter(r => r._id !== resourceId))
            } else {
                const data = await response.json()
                alert(data.message || 'Failed to delete resource')
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert('Error deleting resource')
        }
    }

    // --- MAIN RENDER ---
    if (isLoading) {
        return (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
                <TyreLoader size={50} />
                <p className="text-sm font-medium text-gray-400 animate-pulse tracking-widest uppercase text-[10px]">Loading Resources</p>
            </div>
        )
    }

    if (view === 'uploads') return <UploadsView uploads={uploads} onUploadRequest={onUploadRequest} onDelete={handleDelete} />
    if (view === 'leaderboard') return <LeaderboardView leaderboard={leaderboard} />

    return (
        <div className="animate-fade-in w-full max-w-4xl mx-auto">

            {/* FIXED LAYOUT TABS */}
            <div className="mb-6 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-4 gap-1">
                    <TabButton active={activeTab === 'notes'} onClick={() => { setActiveTab('notes'); setSelectedPyqYear(null); }} label="Notes" icon={<FileText className="w-4 h-4" />} />
                    <TabButton active={activeTab === 'pyqs'} onClick={() => { setActiveTab('pyqs'); setSelectedPyqYear(null); }} label="PYQs" icon={<FileQuestion className="w-4 h-4" />} />
                    <TabButton active={activeTab === 'formula'} onClick={() => { setActiveTab('formula'); setSelectedPyqYear(null); }} label="Formula" icon={<FileText className="w-4 h-4" />} />
                    <TabButton active={activeTab === 'ai'} onClick={() => { setActiveTab('ai'); setSelectedPyqYear(null); }} label="AI Tutor" icon={<Sparkles className="w-4 h-4" />} isSpecial />
                </div>
            </div>

            {/* CONTENT AREA */}
            {activeTab !== 'ai' ? (
                <div className="space-y-4">
                    {/* PROFESSIONAL HEADER WITH UPLOAD BUTTON */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap dark:text-white">
                            {activeTab === 'notes' ? 'Lecture Notes' : activeTab === 'pyqs' ? 'Previous Papers' : 'Formula Sheets'}
                        </h2>

                        <div className="flex items-center gap-2">
                            {activeTab === 'pyqs' && (
                                <div className="flex flex-col items-end">
                                    <button
                                        onClick={handleGeneratePaper}
                                        disabled={generating}
                                        className="hidden sm:flex group items-center gap-2 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 dark:border-zinc-200 shadow-sm"
                                    >
                                        {generating ? (
                                            <TyreLoader size={14} />
                                        ) : (
                                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500/10 text-green-500 text-[9px] font-bold ring-1 ring-green-500/50 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                                {user?.role === 'admin' ? '∞' : attemptsLeft}
                                            </div>
                                        )}
                                        <span className="hidden sm:inline">{generating ? 'Generating...' : 'Generate Sample Paper'}</span>
                                    </button>
                                </div>
                            )}

                            {onUploadRequest && (
                                <button
                                    onClick={() => onUploadRequest({ filters, activeTab })}
                                    className="flex items-center gap-1 px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-[10px] sm:text-xs font-bold whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                                >
                                    <UploadIcon className="w-3 h-3" />
                                    <span className="hidden sm:inline">Upload</span>
                                </button>
                            )}


                            {/* Result Counter */}
                            <span className="text-[10px] sm:text-xs font-medium px-2 py-1 bg-gray-100 whitespace-nowrap dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                                {resources.length} Result{resources.length !== 1 && 's'}
                            </span>
                        </div>
                    </div>

                    {/* ERROR BANNER */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium animate-in slide-in-from-top-2 fade-in">
                            <AlertTriangle size={14} className="flex-shrink-0" />
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-black/5 rounded">
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    {/* Mobile Generate Button */}
                    {activeTab === 'pyqs' && (
                        <button
                            onClick={handleGeneratePaper}
                            disabled={generating}
                            className="flex sm:hidden w-full items-center justify-center gap-2 mt-3 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {generating ? (
                                <TyreLoader size={16} />
                            ) : (
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold ring-1 ring-green-500/50">
                                    {user?.role === 'admin' ? '∞' : attemptsLeft}
                                </div>
                            )}
                            <span>{generating ? 'Generating Paper...' : 'Generate Sample Paper'}</span>
                        </button>
                    )}


                    {activeTab === 'pyqs' && !selectedPyqYear ? (
                        // YEAR SELECTION FOLDER VIEW
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {['2025', '2024', '2023', '2022', '2021', 'Older'].map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedPyqYear(year)}
                                    className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-black dark:hover:border-white transition-all shadow-sm hover:shadow-md"
                                >
                                    <div className="w-12 h-12 mb-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <div className="relative">
                                            <FileText className="w-6 h-6" />
                                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {year}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">View Papers</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        // RESOURCE LIST OR EMPTY STATE
                        <>
                            {/* Back Button for PYQs */}
                            {activeTab === 'pyqs' && selectedPyqYear && (
                                <div className="mb-4">
                                    <button
                                        onClick={() => setSelectedPyqYear(null)}
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                        Back to Years
                                    </button>
                                </div>
                            )}

                            {resources.length === 0 ? (
                                <EmptyState
                                    icon={FileQuestion}
                                    title={`No content found for ${selectedPyqYear || 'this selection'}`}
                                    description={`Be the first to upload for this subject.`}
                                    onUploadRequest={onUploadRequest}
                                    filters={filters}
                                    activeTab={activeTab}
                                    onGeneratePaper={handleGeneratePaper}
                                    isGenerating={generating}
                                />
                            ) : (
                                // Grid Layout: 1 column mobile, 2 columns desktop
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                    {resources.map((resource) => (
                                        <GridCard key={resource._id} resource={resource} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                /* AI TUTOR INTERFACE */
                <div className="flex flex-col h-[600px] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900/50 relative shadow-sm">
                    {/* Chat Header */}
                    <div className="absolute top-0 inset-x-0 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-indigo-500/20">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-none">AI Tutor</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Always here to help</p>
                            </div>
                        </div>
                        <button onClick={clearChat} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-400 transition-colors" title="Clear Chat">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 pt-16 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                        {chatMessages.map((message, index) => (
                            <div key={index} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`flex gap-2 max-w-[90%] md:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden
                                        ${message.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
                                        {message.role === 'user' ? (
                                            user?.avatar ? (
                                                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-3 h-3" />
                                            )
                                        ) : (
                                            <Sparkles className="w-3 h-3" />
                                        )}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                                        ${message.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                        }`}>
                                        {message.role === 'assistant' ? (<div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-1 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-xs prose-strong:text-inherit"><ReactMarkdown>{message.content}</ReactMarkdown></div>) : (<p className="whitespace-pre-wrap">{message.content}</p>)}
                                    </div>
                                </div>

                                {/* AI Action Buttons */}
                                {message.role === 'assistant' && (
                                    <div className="flex items-center gap-1 mt-1 ml-9">
                                        <button
                                            onClick={() => copyToClipboard(message.content, index)}
                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                        >
                                            {copiedIndex === index ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                            {copiedIndex === index ? 'Copied' : 'Copy'}
                                        </button>
                                        <div className="h-3 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                        <button className="p-1 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                                            <ThumbsUp className="w-3 h-3" />
                                        </button>
                                        <button className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                                            <ThumbsDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isAiLoading && (
                            <div className="flex gap-2 justify-start ml-1">
                                <div className="bg-gray-200 dark:bg-gray-700 w-2 h-2 rounded-full animate-bounce"></div>
                                <div className="bg-gray-200 dark:bg-gray-700 w-2 h-2 rounded-full animate-bounce delay-100"></div>
                                <div className="bg-gray-200 dark:bg-gray-700 w-2 h-2 rounded-full animate-bounce delay-200"></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask about this topic..."
                                disabled={isAiLoading}
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isAiLoading || !chatInput.trim()}
                                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg text-white transition-all shadow-sm"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

