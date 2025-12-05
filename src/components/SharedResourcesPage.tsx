import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import {
    Bookmark, FileText, Download,
    ThumbsUp, ThumbsDown, Flag, Share2, User, LayoutGrid, ArrowRight,
    Sun, Moon, CloudSun
} from 'lucide-react';

export default function SharedResourcesPage() {
    const { slug } = useParams();
    const { token } = useAuth(); // To check if viewer is logged in
    const [data, setData] = useState<{ user: any, resources: any[], list?: { note?: string, createdAt: string } } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`/api/share?slug=${slug}`, { headers });
                if (!res.ok) {
                    throw new Error('Link not found or expired');
                }
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setTimeout(() => setIsLoading(false), 1500);
            }
        };

        if (slug) fetchData();
    }, [slug, token]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setTimeOfDay('morning');
        } else if (hour >= 12 && hour < 17) {
            setTimeOfDay('afternoon');
        } else {
            setTimeOfDay('evening');
        }
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

    // --- Premium Loading State (Spinner) ---
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-black font-sans overflow-hidden touch-none">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150" />
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                        <div className="absolute inset-0 rounded-full border-[6px] border-t-blue-600 border-r-transparent border-b-purple-600 border-l-transparent animate-spin" />
                        <div className="absolute inset-3 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-inner">
                            <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="text-center space-y-2 animate-fade-in relative z-10 px-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Fetching resources...</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Please wait while we load the collection</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[100vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-gray-50 dark:bg-black">
                <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl mb-6 shadow-sm border border-red-100 dark:border-red-900/20">
                    <Flag className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Collection Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-lg mb-8">
                    {error ? `Error: ${error}` : "The link you followed might be broken, or the user may have stopped sharing this collection."}
                </p>
                <Link to="/" className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">

                {/* Dashboard-style Header */}
                <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${getHeroBackground()} backdrop-blur-xl p-6 sm:p-10 border border-white/40 dark:border-gray-700/30 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 transition-colors duration-1000`}>

                    {/* Dynamic Celestial Bodies */}
                    <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                        {timeOfDay === 'morning' && (
                            <>
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-300/40 rounded-full blur-3xl animate-pulse" />
                                <Sun className="absolute top-6 right-6 w-24 h-24 text-orange-400/20 rotate-12" />
                                <CloudSun className="absolute top-12 right-20 w-16 h-16 text-white/40 dark:text-white/10" />
                            </>
                        )}
                        {timeOfDay === 'afternoon' && (
                            <>
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-200/50 rounded-full blur-[60px]" />
                                <Sun className="absolute -top-4 -right-4 w-32 h-32 text-yellow-500/20 animate-spin-slow" style={{ animationDuration: '20s' }} />
                            </>
                        )}
                        {timeOfDay === 'evening' && (
                            <>
                                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
                                <div className="absolute top-8 right-32 w-1 h-1 bg-white rounded-full animate-ping" />
                                <div className="absolute top-20 right-10 w-1 h-1 bg-white rounded-full animate-pulse" />
                                <div className="absolute top-4 right-52 w-0.5 h-0.5 bg-white rounded-full" />
                                <Moon className="absolute top-6 right-6 w-20 h-20 text-indigo-300/30 -rotate-12 drop-shadow-lg" />
                            </>
                        )}
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
                        {/* Profile Picture */}
                        <div className="group relative shrink-0">
                            <div className={`absolute inset-0 bg-gradient-to-br ${timeOfDay === 'evening' ? 'from-indigo-500 to-purple-600' : 'from-orange-400 to-yellow-500'} rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-white/80 dark:bg-black/30 backdrop-blur-md shadow-xl border border-white/50 dark:border-white/10">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                                    {data.user.avatar ? (
                                        <img src={data.user.avatar} alt={data.user.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
                                <User className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex-1 pt-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 dark:bg-black/40 backdrop-blur-md text-blue-600 dark:text-blue-300 rounded-full text-[10px] sms:text-xs font-bold uppercase tracking-wider mb-3 border border-white/50 dark:border-white/10 shadow-sm">
                                <Share2 className="w-3 h-3" />
                                Shared Collection
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-2">
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                    {data.user.name}'s
                                </span> Library
                            </h1>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                                A curated collection of <span className="font-semibold text-gray-900 dark:text-white">{data.resources.length}</span> resources, shared from Extrovert Community.
                            </p>
                        </div>
                    </div>

                    {/* Special Note Card */}
                    {data.list?.note && (
                        <div className="relative z-10 mt-6 bg-white/60 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/5 rounded-xl p-4 sm:p-5 flex gap-3 text-left shadow-sm">
                            <div className="shrink-0 pt-0.5">
                                <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-500 mb-1">
                                    Message from {data.user.name.split(' ')[0]}
                                </h4>
                                <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                                    "{data.list.note}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grid Content */}
                {data.resources.length === 0 ? (
                    <div className="min-h-[300px] flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 border-dashed">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-4">
                            <LayoutGrid className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Collection is Empty</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This user hasn't added any public resources yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {data.resources.map((resource: any) => (
                            <div key={resource._id}>
                                <SharedGridCard
                                    resource={resource}
                                    currentUserToken={token}
                                    onLoginRequest={() => setIsAuthModalOpen(true)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Auth Modal for Login Popup */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialView="login"
            />
        </div>
    );
}

// --- Compact & Professional Grid Card ---
const SharedGridCard = ({ resource, currentUserToken, onLoginRequest }: { resource: any, currentUserToken: string | null, onLoginRequest: () => void }) => {
    // --- Interaction State ---
    const [isSaved, setIsSaved] = useState(resource.userSaved || false);
    const [isReported, setIsReported] = useState(resource.userFlagged || false);
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(
        resource.userLiked ? 'like' : resource.userDisliked ? 'dislike' : null
    );
    const [counts, setCounts] = useState({
        likes: resource.likes || 0,
        downloads: resource.downloads || 0
    });
    const [isInteracting, setIsInteracting] = useState(false);

    // Sync state if resource object changes
    useEffect(() => {
        setIsSaved(resource.userSaved || false);
        setIsReported(resource.userFlagged || false);
        setUserVote(resource.userLiked ? 'like' : resource.userDisliked ? 'dislike' : null);
        setCounts({
            likes: resource.likes || 0,
            downloads: resource.downloads || 0
        });
    }, [resource]);

    const handleInteraction = async (action: string, value: boolean) => {
        if (!currentUserToken) {
            onLoginRequest();
            return;
        }

        try {
            const response = await fetch('/api/resource-interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUserToken}`
                },
                body: JSON.stringify({
                    resourceId: resource._id,
                    action,
                    value
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCounts({
                    likes: data.resource.likes,
                    downloads: data.resource.downloads
                });
            }
        } catch (error) {
            console.error('Interaction failed:', error);
        }
    };

    const handleLike = () => {
        if (isInteracting) return;
        const newValue = userVote !== 'like';
        setIsInteracting(true);

        if (newValue) {
            setCounts(prev => ({ ...prev, likes: prev.likes + 1 }));
            setUserVote('like');
        } else {
            setCounts(prev => ({ ...prev, likes: prev.likes - 1 }));
            setUserVote(null);
        }
        handleInteraction('like', newValue).finally(() => setIsInteracting(false));
    };

    const handleDislike = () => {
        if (isInteracting) return;
        const newValue = userVote !== 'dislike';
        setIsInteracting(true);
        setUserVote(newValue ? 'dislike' : null);
        handleInteraction('dislike', newValue).finally(() => setIsInteracting(false));
    };

    const handleSave = () => {
        if (isInteracting) return;
        setIsInteracting(true);
        setIsSaved(!isSaved);
        handleInteraction('save', !isSaved).finally(() => setIsInteracting(false));
    };

    const handleFlag = () => {
        if (isInteracting || isReported) return;
        if (confirm('Flag this resource as inappropriate?')) {
            setIsInteracting(true);
            setIsReported(true);
            handleInteraction('flag', true).finally(() => setIsInteracting(false));
        }
    };

    const handleDownload = () => {
        if (isInteracting) return;
        setIsInteracting(true);
        setCounts(prev => ({ ...prev, downloads: prev.downloads + 1 }));
        handleInteraction('download', true).finally(() => setIsInteracting(false));
    };

    return (
        <div className="group flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            {/* Top Section: Subject Tag & Actions */}
            <div className="flex items-start justify-between mb-3 z-10 relative">
                <div className="flex-1 mr-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                        {resource.subject || 'General'}
                    </span>
                </div>

                {/* Actions (Save/Flag) */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => { e.preventDefault(); handleSave(); }}
                        className={`p-1.5 rounded-lg transition-colors ${isSaved
                            ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        title={isSaved ? "Unsave" : "Save"}
                    >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); handleFlag(); }}
                        className={`p-1.5 rounded-lg transition-colors ${isReported
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        title="Report"
                    >
                        <Flag className={`w-3.5 h-3.5 ${isReported ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-start gap-4 mb-4 flex-1 z-10 relative">
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 text-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm"
                >
                    <FileText className="w-6 h-6" />
                </a>
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                    className="block min-w-0 flex-1"
                >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                        {resource.title}
                    </h3>
                    <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 gap-2">
                        <span>PDF</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span className="group-hover:translate-x-1 transition-transform inline-flex items-center">
                            View File <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                        </span>
                    </div>
                </a>
            </div>

            {/* FOOTER */}
            <div className="mt-auto pt-3 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between gap-2 z-10 relative">
                {/* Voting */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleLike(); }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${userVote === 'like'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <ThumbsUp className={`w-3 h-3 ${userVote === 'like' ? 'fill-current' : ''}`} />
                        <span>{counts.likes}</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDislike(); }}
                        className={`p-1 rounded-md transition-colors ${userVote === 'dislike'
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <ThumbsDown className={`w-3 h-3 ${userVote === 'dislike' ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Downloads & Uploader */}
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {counts.downloads}
                    </div>
                </div>
            </div>
        </div>
    );
};
