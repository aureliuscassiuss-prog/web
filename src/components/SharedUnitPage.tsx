import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// @ts-ignore
import Cookies from 'js-cookie';
import {
    ChevronLeft, Play, CheckCircle2, Menu, X, Search,
    ChevronDown, MonitorPlay, ListVideo, Clock, Check,
    Share2, ExternalLink
} from 'lucide-react';
import TyreLoader from './TyreLoader';
import Toast from './Toast';

// --- Types ---
interface VideoObject {
    id: string;
    title: string;
    url: string;
    duration?: string;
}

interface UnitObject {
    name: string;
    videos: VideoObject[];
}

export default function SharedUnitPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Params from URL
    const programId = searchParams.get('prog');
    const yearId = searchParams.get('yr');
    const courseId = searchParams.get('cr');
    const semesterId = searchParams.get('sem');
    const subjectName = searchParams.get('sub');
    const targetUnitName = searchParams.get('unit');

    // State
    const [units, setUnits] = useState<UnitObject[]>([]);
    const [currentVideo, setCurrentVideo] = useState<VideoObject | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState({ message: '', show: false });

    // UI State for Accordions (Default all collapsed except active)
    const [expandedUnitIndices, setExpandedUnitIndices] = useState<Set<number>>(new Set());

    // Progress State (Cookie based)
    const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

    // --- Time of Day Logic for minimal styling nuances locally if needed ---
    // (Skipped complex BG logic to match CoursePlayer clean look)

    // --- Load Progress from Cookie ---
    useEffect(() => {
        try {
            const savedProgress = Cookies.get('shared_progress');
            if (savedProgress) {
                const parsed = JSON.parse(savedProgress);
                if (Array.isArray(parsed)) {
                    setWatchedVideos(new Set(parsed));
                }
            }
        } catch (e) {
            console.error("Failed to load progress cookie", e);
        }
    }, []);

    // --- Fetch & Process Data ---
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/admin?action=structure');

                if (!res.ok) throw new Error('Failed to load content');

                const data = await res.json();

                // Navigate Structure
                const program = data.programs?.find((p: any) => p.id === programId);
                const year = program?.years?.find((y: any) => y.id === yearId);
                const course = year?.courses?.find((c: any) => c.id === courseId);

                let semester = course?.semesters?.find((s: any) => s.id === semesterId);
                if (!semester && semesterId) {
                    semester = course?.semesters?.find((s: any) => s.name === semesterId || s.id === `semester-${semesterId}`);
                }

                const subject = semester?.subjects?.find((s: any) => (typeof s === 'string' ? s : s.name) === subjectName);

                if (!subject) {
                    throw new Error('Subject content not found');
                }

                // Parse Units
                let parsedUnits: UnitObject[] = [];
                if (typeof subject === 'string') {
                    // String subject usually means no detailed structure details in this view, 
                    // but we need to assume it's an object for video player.
                    // If it's a string, we really can't do much unless we have a separate units lookup.
                    // However, standard flow implies subject object exists with units.
                    console.warn("Subject is string, cannot load videos");
                    parsedUnits = [];
                } else {
                    parsedUnits = (subject.units || []).map((u: any) => {
                        if (typeof u === 'string') return { name: u, videos: [] };
                        return {
                            name: u.name,
                            videos: u.videos || []
                        };
                    });
                }

                setUnits(parsedUnits);

                // Auto-select logic
                // 1. If targetUnitName is present, try to find that unit and play its first video
                // 2. Otherwise play first video of first unit
                let foundVideo = false;

                if (targetUnitName) {
                    const targetUnitIndex = parsedUnits.findIndex(u => u.name === targetUnitName);
                    if (targetUnitIndex !== -1) {
                        setExpandedUnitIndices(new Set([targetUnitIndex]));
                        if (parsedUnits[targetUnitIndex].videos.length > 0) {
                            setCurrentVideo(parsedUnits[targetUnitIndex].videos[0]);
                            foundVideo = true;
                        }
                    }
                }

                if (!foundVideo && parsedUnits.length > 0) {
                    // Find first unit with videos
                    for (let i = 0; i < parsedUnits.length; i++) {
                        if (parsedUnits[i].videos.length > 0) {
                            setCurrentVideo(parsedUnits[i].videos[0]);
                            setExpandedUnitIndices(prev => new Set(prev).add(i));
                            break;
                        }
                    }
                }

                setLoading(false);

            } catch (err) {
                console.error(err);
                // If fails, we might just show empty state
                setLoading(false);
            }
        };

        if (programId && subjectName) {
            fetchStructure();
        } else {
            setLoading(false);
        }
    }, [programId, yearId, courseId, semesterId, subjectName, targetUnitName]);

    // --- Helpers ---
    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const toggleWatched = (videoId: string) => {
        const newSet = new Set(watchedVideos);
        if (newSet.has(videoId)) {
            newSet.delete(videoId);
        } else {
            newSet.add(videoId);
        }
        setWatchedVideos(newSet);

        // Save to Cookie (expires in 365 days)
        Cookies.set('shared_progress', JSON.stringify(Array.from(newSet)), { expires: 365 });

        // Toast
        if (newSet.has(videoId)) {
            showToast("Marked as complete");
        }
    };

    const toggleUnit = (index: number) => {
        const newExpanded = new Set(expandedUnitIndices);
        if (newExpanded.has(index)) newExpanded.delete(index);
        else newExpanded.add(index);
        setExpandedUnitIndices(newExpanded);
    };

    const showToast = (msg: string) => {
        setToast({ message: msg, show: true });
        setTimeout(() => setToast({ message: '', show: false }), 3000);
    };

    const handleCopyLink = () => {
        // We copy the current URL but maybe stripped of unit param if they want to share the "course" view?
        // But user likely wants to share exactly what they see.
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
    };

    const filteredUnits = useMemo(() => {
        if (!searchQuery) return units;
        return units.map(unit => ({
            ...unit,
            videos: unit.videos?.filter(v =>
                v.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(unit => (unit.videos && unit.videos.length > 0) || unit.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [units, searchQuery]);


    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black text-gray-500 gap-4">
                <TyreLoader size={50} />
                <p className="text-xs font-medium tracking-wide animate-pulse">LOADING SHARED CONTENT...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white dark:bg-black overflow-hidden text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">

            {/* --- SIDEBAR --- */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-full md:w-[380px] bg-gray-50/95 dark:bg-black/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 
                    transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0 md:bg-white md:dark:bg-black
                `}
            >
                {/* Header */}
                <div className="flex-none p-5 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-xs font-semibold uppercase tracking-wide"
                        >
                            <ChevronLeft size={14} />
                            Home
                        </button>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-1 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                <Share2 size={10} />
                                Shared
                            </div>
                        </div>
                        <h1 className="text-xl font-bold leading-tight truncate">{subjectName || 'Course Material'}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {units.reduce((acc, u) => acc + (u.videos?.length || 0), 0)} Lectures Available
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Find a topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-700"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" size={14} />
                    </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 p-3 space-y-2">
                    {filteredUnits.length > 0 ? (
                        filteredUnits.map((unit, idx) => {
                            const isExpanded = expandedUnitIndices.has(idx);
                            const activeInUnit = unit.videos?.some(v => v.id === currentVideo?.id);

                            return (
                                <div
                                    key={idx}
                                    className={`
                                        rounded-xl border transition-all duration-300 overflow-hidden
                                        ${activeInUnit
                                            ? 'bg-white dark:bg-white/5 border-gray-200 dark:border-gray-700 shadow-sm'
                                            : 'bg-transparent border-transparent hover:bg-gray-100/50 dark:hover:bg-white/5'}
                                    `}
                                >
                                    <button
                                        onClick={() => toggleUnit(idx)}
                                        className="w-full text-left px-4 py-3 flex items-center justify-between group select-none"
                                    >
                                        <div className="min-w-0 flex-1 pr-4">
                                            <h3 className={`text-sm font-semibold truncate transition-colors ${activeInUnit ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {unit.name}
                                            </h3>
                                            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                                                {unit.videos?.length || 0} Videos
                                            </p>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`text-gray-400 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {/* Content */}
                                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                        <div className="overflow-hidden">
                                            <div className="px-2 pb-2 space-y-1">
                                                {unit.videos?.map((video) => {
                                                    const isActive = currentVideo?.id === video.id;
                                                    const isWatched = watchedVideos.has(video.id);

                                                    return (
                                                        <button
                                                            key={video.id}
                                                            onClick={() => {
                                                                setCurrentVideo(video);
                                                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                                                            }}
                                                            className={`
                                                                w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all duration-200 group
                                                                ${isActive
                                                                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md shadow-gray-200 dark:shadow-none transform scale-[1.02]'
                                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}
                                                            `}
                                                        >
                                                            <div className="mt-1 flex-shrink-0">
                                                                {isActive ? (
                                                                    <Play size={12} className="fill-current" />
                                                                ) : isWatched ? (
                                                                    <CheckCircle2 size={14} className="text-green-500 dark:text-green-400" />
                                                                ) : (
                                                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-gray-500" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-xs font-medium leading-relaxed ${isActive ? 'text-white dark:text-black' : 'group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                                                    {video.title}
                                                                </p>
                                                                <div className={`flex items-center gap-2 mt-1 text-[10px] ${isActive ? 'text-white/60 dark:text-black/60' : 'text-gray-400'}`}>
                                                                    <span className="flex items-center gap-1"><Clock size={10} /> {video.duration || '10:00'}</span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {(!unit.videos || unit.videos.length === 0) && (
                                                    <div className="text-center py-4 text-[10px] text-gray-400 italic">No content available</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <Search className="mx-auto mb-2 text-gray-400" size={24} />
                            <p className="text-xs">No topics found</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-black">

                {/* Mobile Top Bar */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/50 backdrop-blur-md sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Menu size={20} className="text-gray-700 dark:text-gray-200" />
                    </button>
                    <span className="text-sm font-bold truncate">
                        {currentVideo ? currentVideo.title : 'Course Player'}
                    </span>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {currentVideo ? (
                        <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12 space-y-6">

                            {/* Player Wrapper */}
                            <div className="relative group rounded-xl overflow-hidden bg-black/5 dark:bg-transparent shadow-2xl shadow-blue-900/10 ring-1 ring-gray-900/5 dark:ring-white/10 aspect-video">
                                {getYouTubeId(currentVideo.url) ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeId(currentVideo.url)}?autoplay=1&rel=0`}
                                        title={currentVideo.title}
                                        className="w-full h-full absolute inset-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 text-gray-400">
                                        <MonitorPlay size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm">Video Source Unavailable</p>
                                    </div>
                                )}
                            </div>

                            {/* Header Info */}
                            <div className="flex flex-col gap-6 pb-8 border-b border-gray-100 dark:border-gray-800">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                            Video Lesson
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <ListVideo size={12} />
                                            {units.find(u => u.videos?.some(v => v.id === currentVideo.id))?.name}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {currentVideo.title}
                                    </h1>
                                    <div className="flex items-center gap-4">
                                        <button onClick={handleCopyLink} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                            <Share2 size={12} /> Share Lecture
                                        </button>
                                        <a href="https://extrovert.site" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                            <ExternalLink size={12} /> Visit Extrovert
                                        </a>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 gap-3 w-full max-w-2xl">
                                    <button
                                        onClick={() => toggleWatched(currentVideo.id)}
                                        className={`
                                            w-full group flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-95 border
                                            ${watchedVideos.has(currentVideo.id)
                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                                : 'bg-white text-gray-700 border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}
                                        `}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded-full flex items-center justify-center transition-all
                                            ${watchedVideos.has(currentVideo.id) ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-transparent'}
                                        `}>
                                            <Check size={12} className={watchedVideos.has(currentVideo.id) ? 'opacity-100' : 'opacity-0'} />
                                        </div>
                                        <span className="whitespace-nowrap">{watchedVideos.has(currentVideo.id) ? 'Completed (Saved locally)' : 'Mark Complete'}</span>
                                    </button>

                                    {/* Next Video Button */}
                                    {(() => {
                                        // Find current position
                                        const currentUnitIndex = units.findIndex(u => u.videos.some(v => v.id === currentVideo.id));
                                        if (currentUnitIndex === -1) return null;

                                        const currentUnit = units[currentUnitIndex];
                                        const videoIndex = currentUnit.videos.findIndex(v => v.id === currentVideo.id);

                                        const isLastVideoInUnit = videoIndex === currentUnit.videos.length - 1;
                                        const isLastUnit = currentUnitIndex === units.length - 1;

                                        if (isLastVideoInUnit && isLastUnit) return null;

                                        return (
                                            <button
                                                onClick={() => {
                                                    if (isLastVideoInUnit) {
                                                        // Go to next unit
                                                        const nextUnit = units[currentUnitIndex + 1];
                                                        if (nextUnit && nextUnit.videos.length > 0) {
                                                            setCurrentVideo(nextUnit.videos[0]);
                                                            // Auto expand next unit
                                                            if (!expandedUnitIndices.has(currentUnitIndex + 1)) {
                                                                toggleUnit(currentUnitIndex + 1);
                                                            }
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }
                                                    } else {
                                                        // Go to next video in same unit
                                                        const nextVideo = currentUnit.videos[videoIndex + 1];
                                                        setCurrentVideo(nextVideo);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                }}
                                                className="w-full group flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-black text-white dark:bg-white dark:text-black hover:opacity-90 shadow-lg shadow-gray-200 dark:shadow-none transition-all duration-300 active:scale-95"
                                            >
                                                <span className="whitespace-nowrap">{isLastVideoInUnit ? 'Next Unit' : 'Next Video'}</span>
                                                <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center">
                                                    <Play size={10} className="fill-current ml-0.5" />
                                                </div>
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <MonitorPlay className="text-gray-400" size={40} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start Learning</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                Select a video from the sidebar to begin.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <Toast message={toast.message} show={toast.show} />
        </div>
    );
}
