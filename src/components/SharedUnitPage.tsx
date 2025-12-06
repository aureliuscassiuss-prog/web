import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Share2, BookOpen, ChevronDown, PlayCircle, Lock,
    Sun, Moon, Copy, ExternalLink, Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import Toast from './Toast';

export default function SharedUnitPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { } = useAuth(); // authentication not strictly needed for public view logic here

    // Params from URL (Shortened keys from Preparation.tsx)
    const programId = searchParams.get('prog');
    const yearId = searchParams.get('yr');
    const courseId = searchParams.get('cr');
    const semesterId = searchParams.get('sem');
    const subjectName = searchParams.get('sub');
    const unitName = searchParams.get('unit');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unitData, setUnitData] = useState<{ name: string, videos: any[] } | null>(null);
    const [isExpanded, setIsExpanded] = useState(true); // Default expanded
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
    const [toast, setToast] = useState({ message: '', show: false });
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // --- Time of Day Logic for Hero BG ---
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setTimeOfDay('morning');
        else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
        else setTimeOfDay('evening');
    }, []);

    const getHeroBackground = () => {
        switch (timeOfDay) {
            case 'morning':
                return 'from-orange-100 via-amber-100 to-blue-100 dark:from-orange-950/30 dark:via-amber-900/20 dark:to-blue-950/30';
            case 'afternoon':
                return 'from-blue-100 via-sky-100 to-cyan-100 dark:from-blue-950/30 dark:via-sky-900/20 dark:to-cyan-950/30';
            case 'evening':
                return 'from-indigo-100 via-purple-100 to-slate-200 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/40';
            default:
                return 'from-gray-100 to-gray-200';
        }
    };

    // --- Fetch Logic (Reused from CoursePlayer) ---
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                // 1. Try Fetching from API
                const res = await fetch('/api/admin?action=structure');

                let data;
                if (!res.ok) {
                    console.warn("API Failed, falling back manually (should generally not happen in prod)");
                    // minimal mock fallback if needed, or just error
                    throw new Error('Failed to load library structure.');
                } else {
                    data = await res.json();
                }

                // Process Data to find the unit
                const program = data.programs?.find((p: any) => p.id === programId);
                const year = program?.years?.find((y: any) => y.id === yearId);
                const course = year?.courses?.find((c: any) => c.id === courseId);

                // Semester matching (ID or Name)
                let semester = course?.semesters?.find((s: any) => s.id === semesterId);
                if (!semester && semesterId) {
                    semester = course?.semesters?.find((s: any) => s.name === semesterId || s.id === `semester-${semesterId}`);
                }

                // Subject matching
                const subject = semester?.subjects?.find((s: any) => (typeof s === 'string' ? s : s.name) === subjectName);

                if (!subject) {
                    throw new Error('Subject not found');
                }

                // Unit matching
                if (typeof subject === 'string') {
                    // It's a string subject, so no units object structure? 
                    // Usually string subjects don't have detailed unit structure in the basic array, 
                    // but the structure API returns expanded objects.
                    // If it is just a string, we can't find units.
                    throw new Error('Unit details unavailable.');
                }

                const targetUnit = subject.units?.find((u: any) => {
                    const uName = typeof u === 'string' ? u : u.name;
                    return uName === unitName;
                });

                if (!targetUnit) {
                    throw new Error('Unit not found');
                }

                setUnitData(typeof targetUnit === 'string' ? { name: targetUnit, videos: [] } : targetUnit);
                setLoading(false);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load content.");
                setLoading(false);
            }
        };

        if (programId && unitName) {
            fetchStructure();
        } else {
            setError("Invalid Link Parameters");
            setLoading(false);
        }
    }, [programId, yearId, courseId, semesterId, subjectName, unitName]);


    const handlePlayVideo = () => {
        // Construct standard player URL
        // We need to map back to standard params for Preparation
        // Param names in CoursePlayer: program, year, course, semester, subject
        const params = new URLSearchParams({
            program: programId || '',
            year: yearId || '',
            course: courseId || '',
            semester: semesterId || '',
            subject: subjectName || ''
        });

        // We can't deep-link to a specific video ID easily without modifying CoursePlayer 
        // to accept a videoId, but we can stick to playing the course.
        // Or we can just let them land on the player.
        navigate(`/preparation/play?${params.toString()}`);
    }

    const showToast = (msg: string) => {
        setToast({ message: msg, show: true });
        setTimeout(() => setToast({ message: '', show: false }), 3000);
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Link copied to clipboard!');
        });
    }

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Loading Shared Content...</p>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error || !unitData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full mb-4">
                    <Lock size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-2">Content Unavailable</h1>
                <p className="text-gray-500 max-w-md mb-8">{error || "The link might be broken or expired."}</p>
                <Link to="/" className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold">
                    Go Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
            <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in-up">

                {/* --- HEADER --- */}
                <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getHeroBackground()} p-8 sm:p-12 border border-white/40 dark:border-gray-700/30 shadow-2xl`}>

                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
                        {timeOfDay === 'morning' && <Sun className="absolute top-8 right-8 w-32 h-32 text-orange-400/10 rotate-12" />}
                        {timeOfDay === 'afternoon' && <Sun className="absolute -top-4 -right-4 w-40 h-40 text-yellow-500/10 animate-spin-slow" style={{ animationDuration: '30s' }} />}
                        {timeOfDay === 'evening' && <Moon className="absolute top-8 right-8 w-24 h-24 text-indigo-300/20 -rotate-12" />}
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-black/30 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 border border-white/20 shadow-sm">
                            <Share2 size={12} />
                            <span>Shared Preparation Unit</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                            {unitData.name}
                        </h1>

                        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium max-w-xl">
                            <span className="opacity-70">From subject: </span>
                            <span className="font-bold border-b-2 border-blue-500/30">{subjectName}</span>
                        </p>

                        <div className="pt-4 flex items-center gap-3">
                            <button onClick={handleCopyLink} className="flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-bold transition-all shadow-sm backdrop-blur-sm">
                                <Copy size={16} />
                                Copy Link
                            </button>
                            <Link to="/" className="flex items-center gap-2 px-5 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl text-sm font-bold transition-all backdrop-blur-sm">
                                <ExternalLink size={16} />
                                Explore More
                            </Link>
                        </div>
                    </div>
                </div>

                {/* --- UNIT CARD --- */}
                <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden ring-4 ring-gray-50 dark:ring-gray-900">
                    {/* Card Header */}
                    <div
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-6 flex items-center gap-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none border-b border-gray-100 dark:border-gray-800"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <BookOpen size={24} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unit Contents</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                {unitData.videos?.length || 0} Video Lessons Available
                            </p>
                        </div>
                        <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={20} className="text-gray-500" />
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-2 sm:p-4 bg-gray-50/50 dark:bg-black/20">
                            {unitData.videos && unitData.videos.length > 0 ? (
                                <div className="space-y-2">
                                    {unitData.videos.map((video: any, idx: number) => (
                                        <div
                                            key={idx}
                                            onClick={() => handlePlayVideo()}
                                            className="group flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-200"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Play size={16} className="ml-0.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {video.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    Video Lesson • {video.duration || '10 min'}
                                                </p>
                                            </div>
                                            <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                Play
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 bg-white dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                    <p className="text-sm font-medium">No videos uploaded for this unit yet.</p>
                                </div>
                            )}

                            {unitData.videos && unitData.videos.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800/50">
                                    <button
                                        onClick={() => handlePlayVideo()}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
                                    >
                                        <PlayCircle size={18} />
                                        Start Learning Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Teaser */}
                <div className="text-center pt-8 pb-12 opacity-60">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Extrovert &bull; The Resource Hub for Medicaps University
                    </p>
                </div>

            </div>

            <Toast message={toast.message} show={toast.show} />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView="login" />
        </div>
    );
}
