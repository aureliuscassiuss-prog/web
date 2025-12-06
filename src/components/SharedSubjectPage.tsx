import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Share2, BookOpen, ChevronDown, PlayCircle, Lock,
    Sun, Moon, Copy, ExternalLink, Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import Toast from './Toast';

export default function SharedSubjectPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { } = useAuth();

    // Params from URL
    const programId = searchParams.get('prog');
    const yearId = searchParams.get('yr');
    const courseId = searchParams.get('cr');
    const semesterId = searchParams.get('sem');
    const subjectName = searchParams.get('sub');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subjectData, setSubjectData] = useState<{ name: string, units: any[] } | null>(null);
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set()); // Track expanded units
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
    const [toast, setToast] = useState({ message: '', show: false });
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // --- Time of Day Logic ---
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

    // --- Fetch Logic ---
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const res = await fetch('/api/admin?action=structure');

                let data;
                if (!res.ok) {
                    throw new Error('Failed to load library structure.');
                } else {
                    data = await res.json();
                }

                // Process Data to find the subject
                const program = data.programs?.find((p: any) => p.id === programId);
                const year = program?.years?.find((y: any) => y.id === yearId);
                const course = year?.courses?.find((c: any) => c.id === courseId);

                // Semester matching
                let semester = course?.semesters?.find((s: any) => s.id === semesterId);
                if (!semester && semesterId) {
                    semester = course?.semesters?.find((s: any) => s.name === semesterId || s.id === `semester-${semesterId}`);
                }

                // Subject matching
                const subject = semester?.subjects?.find((s: any) => (typeof s === 'string' ? s : s.name) === subjectName);

                if (!subject) {
                    throw new Error('Subject not found');
                }

                // Normalize subject object
                if (typeof subject === 'string') {
                    // String subjects usually don't have detailed structure exposed via this API in the same way 
                    // if they are just strings in the array. 
                    // However, for Preparation to work, they usually are objects with `units`.
                    // If it is strictly a string here, we might not have unit data.
                    throw new Error('Subject details unavailable (Legacy Format).');
                }

                setSubjectData(subject);
                // Auto-expand first unit if exists
                if (subject.units && subject.units.length > 0) {
                    const firstUnitName = typeof subject.units[0] === 'string' ? subject.units[0] : subject.units[0].name;
                    setExpandedUnits(new Set([firstUnitName]));
                }
                setLoading(false);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load content.");
                setLoading(false);
            }
        };

        if (programId && subjectName) {
            fetchStructure();
        } else {
            setError("Invalid Link Parameters");
            setLoading(false);
        }
    }, [programId, yearId, courseId, semesterId, subjectName]);


    const handlePlayVideo = () => {
        const params = new URLSearchParams({
            program: programId || '',
            year: yearId || '',
            course: courseId || '',
            semester: semesterId || '',
            subject: subjectName || ''
        });
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

    const toggleUnit = (unitName: string) => {
        const newExpanded = new Set(expandedUnits);
        if (newExpanded.has(unitName)) {
            newExpanded.delete(unitName);
        } else {
            newExpanded.add(unitName);
        }
        setExpandedUnits(newExpanded);
    };

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
    if (error || !subjectData) {
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
                            <span>Shared Subject Preparation</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                            {subjectData.name}
                        </h1>

                        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium max-w-xl">
                            {subjectData.units?.length || 0} Units Available for Learning
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

                {/* --- UNITS LIST --- */}
                <div className="space-y-4">
                    {subjectData.units && subjectData.units.map((unit: any, idx: number) => {
                        const unitName = typeof unit === 'string' ? unit : unit.name;
                        const isUnitExpanded = expandedUnits.has(unitName);
                        const videos = typeof unit === 'string' ? [] : (unit.videos || []);

                        return (
                            <div key={idx} className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden ring-1 ring-gray-100 dark:ring-gray-900">
                                {/* Unit Header */}
                                <div
                                    onClick={() => toggleUnit(unitName)}
                                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{unitName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{videos.length} Videos</p>
                                    </div>
                                    <div className={`p-2 rounded-full transition-transform duration-300 ${isUnitExpanded ? 'rotate-180 bg-gray-100 dark:bg-gray-800' : ''}`}>
                                        <ChevronDown size={20} className="text-gray-400" />
                                    </div>
                                </div>

                                {/* Unit Content (Videos) */}
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isUnitExpanded ? 'max-h-[800px] opacity-100 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 bg-gray-50/50 dark:bg-black/20 space-y-2">
                                        {videos.length > 0 ? (
                                            videos.map((video: any, vIdx: number) => (
                                                <div
                                                    key={vIdx}
                                                    onClick={handlePlayVideo}
                                                    className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md cursor-pointer transition-all"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <Play size={14} className="ml-0.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{video.title}</h4>
                                                    </div>
                                                    <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        Play
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-gray-400 text-sm">No videos available.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
