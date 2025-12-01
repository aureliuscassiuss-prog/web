import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Play, CheckCircle, Lock, Menu, X, Video } from 'lucide-react'

interface VideoObject {
    id: string
    title: string
    url: string
    watched?: boolean
}

interface UnitObject {
    name: string
    videos?: VideoObject[]
}

export default function CoursePlayer() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Params
    const programId = searchParams.get('program')
    const yearId = searchParams.get('year')
    const courseId = searchParams.get('course')
    const subjectName = searchParams.get('subject')

    // State
    const [units, setUnits] = useState<UnitObject[]>([])
    const [currentVideo, setCurrentVideo] = useState<VideoObject | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [loading, setLoading] = useState(true)

    // Mock Progress State (In a real app, this would be persisted)
    const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!programId || !yearId || !courseId || !subjectName) {
            navigate('/preparation')
            return
        }

        fetch('/api/admin?action=structure')
            .then(res => res.json())
            .then(data => {
                const program = data.programs?.find((p: any) => p.id === programId)
                const year = program?.years?.find((y: any) => y.id === yearId)
                const course = year?.courses?.find((c: any) => c.id === courseId)
                const subject = course?.subjects?.find((s: any) =>
                    (typeof s === 'string' ? s : s.name) === subjectName
                )

                if (subject) {
                    const subjectUnits = typeof subject === 'object' && subject.units
                        ? subject.units.map((u: any) => typeof u === 'string' ? { name: u, videos: [] } : u)
                        : []
                    setUnits(subjectUnits)

                    // Auto-select first video
                    for (const unit of subjectUnits) {
                        if (unit.videos && unit.videos.length > 0) {
                            setCurrentVideo(unit.videos[0])
                            break
                        }
                    }
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [programId, yearId, courseId, subjectName, navigate])

    // Helper to extract YouTube ID
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const toggleWatched = (videoId: string) => {
        const newWatched = new Set(watchedVideos)
        if (newWatched.has(videoId)) {
            newWatched.delete(videoId)
        } else {
            newWatched.add(videoId)
        }
        setWatchedVideos(newWatched)
    }

    // Calculate Progress
    const totalVideos = units.reduce((acc, unit) => acc + (unit.videos?.length || 0), 0)
    const completedVideos = watchedVideos.size
    const progressPercentage = totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100)

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>
    }

    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-white truncate max-w-[200px]" title={subjectName || ''}>{subjectName}</h2>
                            <p className="text-xs text-gray-400 mt-1">{progressPercentage}% Completed</p>
                        </div>
                        <button onClick={() => navigate('/preparation')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-800 w-full">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    {/* Units List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {units.map((unit, idx) => (
                            <div key={idx} className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                                    {unit.name}
                                </h3>
                                <div className="space-y-1">
                                    {unit.videos && unit.videos.length > 0 ? (
                                        unit.videos.map((video) => {
                                            const isWatched = watchedVideos.has(video.id)
                                            const isActive = currentVideo?.id === video.id

                                            return (
                                                <button
                                                    key={video.id}
                                                    onClick={() => setCurrentVideo(video)}
                                                    className={`
                                                        w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all group
                                                        ${isActive ? 'bg-blue-900/20 text-blue-400' : 'hover:bg-gray-800 text-gray-300'}
                                                    `}
                                                >
                                                    <div className="mt-0.5">
                                                        {isActive ? (
                                                            <Play size={16} className="fill-current" />
                                                        ) : isWatched ? (
                                                            <CheckCircle size={16} className="text-green-500" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border-2 border-gray-600 group-hover:border-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-400' : 'text-gray-300'}`}>
                                                            {video.title}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <Video size={10} /> Video
                                                        </p>
                                                    </div>
                                                </button>
                                            )
                                        })
                                    ) : (
                                        <p className="text-xs text-gray-600 px-2 italic">No videos available</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-black">
                {/* Mobile Header */}
                <div className="md:hidden p-4 flex items-center gap-3 border-b border-gray-800 bg-gray-900">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400">
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold truncate">{currentVideo?.title || 'Select a video'}</span>
                </div>

                {/* Video Player Area */}
                <div className="flex-1 flex flex-col">
                    {currentVideo ? (
                        <div className="relative w-full h-full flex flex-col">
                            <div className="flex-1 relative bg-black flex items-center justify-center">
                                {getYouTubeId(currentVideo.url) ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeId(currentVideo.url)}?autoplay=0&rel=0`}
                                        title={currentVideo.title}
                                        className="w-full h-full absolute inset-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="text-center p-10">
                                        <p className="text-red-400 mb-2">Invalid Video URL</p>
                                        <p className="text-sm text-gray-500">{currentVideo.url}</p>
                                    </div>
                                )}
                            </div>

                            {/* Video Controls / Info */}
                            <div className="p-6 bg-gray-900 border-t border-gray-800">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">{currentVideo.title}</h1>
                                        <p className="text-gray-400 text-sm">
                                            {subjectName} • {units.find(u => u.videos?.some(v => v.id === currentVideo.id))?.name}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleWatched(currentVideo.id)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                                            ${watchedVideos.has(currentVideo.id)
                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                                        `}
                                    >
                                        {watchedVideos.has(currentVideo.id) ? (
                                            <>
                                                <CheckCircle size={18} />
                                                Completed
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-current" />
                                                Mark as Done
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <PlayCircle size={48} className="mb-4 opacity-50" />
                            <p>Select a video from the sidebar to start learning</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
