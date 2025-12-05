
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Bookmark, FileText, Download,
    ThumbsUp, Flag, Share2, User, LayoutGrid, ArrowRight
} from 'lucide-react';

export default function SharedResourcesPage() {
    const { slug } = useParams();
    const { token } = useAuth(); // To check if viewer is logged in
    const [data, setData] = useState<{ user: any, resources: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/share?slug=${slug}`);
                if (!res.ok) {
                    throw new Error('Link not found or expired');
                }
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                // Add a small artificial delay to show off the cool loading screen
                setTimeout(() => setIsLoading(false), 1500);
            }
        };

        if (slug) fetchData();
    }, [slug]);

    // --- Premium Loading State (Spinner) ---
    if (isLoading) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 dark:bg-black font-sans overscroll-none overflow-hidden">
                <div className="relative transform scale-75 sm:scale-100">
                    {/* Glowing outer ring */}
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />

                    {/* Reviewing Spinner */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                        <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-600 border-r-transparent border-b-purple-600 border-l-transparent animate-spin" />

                        {/* Center Icon (Placeholder until data loads) */}
                        <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-inner">
                            <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center space-y-1 animate-fade-in">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Fetching resources...</h3>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl mb-6 shadow-sm border border-red-100 dark:border-red-900/20">
                    <Flag className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Collection Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-lg">
                    The link you followed might be broken, or the user may have stopped sharing this collection.
                </p>
                <Link to="/" className="mt-8 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-black p-4 sm:p-8 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

                {/* Dashboard-style Header */}
                <div className="relative overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-12 border border-white/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-shadow duration-500">
                    {/* Background Gradients */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                        {/* Profile Picture */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-2xl">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center border-4 border-white dark:border-gray-800">
                                    {data.user.avatar ? (
                                        <img src={data.user.avatar} alt={data.user.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
                                <User className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex-1 pt-2">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-800/50 shadow-sm">
                                <Share2 className="w-3.5 h-3.5" />
                                Shared Collection
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-4">
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                    {data.user.name}'s
                                </span> Library
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                                A curated collection of <span className="font-semibold text-gray-900 dark:text-white">{data.resources.length}</span> resources, shared from UniNotes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                {data.resources.length === 0 ? (
                    <div className="min-h-[400px] flex flex-col items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-gray-800 border-dashed">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-6">
                            <LayoutGrid className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Collection is Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">This user hasn't added any public resources yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.resources.map((resource: any) => (
                            <SharedGridCard key={resource._id} resource={resource} currentUserToken={token} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Premium Grid Card ---
const SharedGridCard = ({ resource, currentUserToken }: { resource: any, currentUserToken: string | null }) => {
    const [counts] = useState({
        likes: resource.likes || 0,
        downloads: resource.downloads || 0
    });

    const handleProtectedAction = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserToken) {
            alert("🔒 Login Required\n\nPlease log in to UniNotes to save, like, or report this resource.");
            // Login Redirect
            window.location.href = '/';
        } else {
            alert("👁️ View Only Mode\n\nTo interact with this resource, please find it in the main library.");
        }
    };

    return (
        <div className="group relative bg-white dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/60 dark:border-gray-800/60 rounded-3xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
            {/* Hover Gradient Border Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-500/10 dark:group-hover:border-blue-400/10 pointer-events-none transition-colors duration-300" />

            {/* Top Bar */}
            <div className="flex justify-between items-start mb-6">
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded-lg tracking-wider border border-gray-200 dark:border-gray-700">
                    {resource.subject || 'Resource'}
                </span>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                        onClick={handleProtectedAction}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        title="Save to Library"
                    >
                        <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleProtectedAction}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Report Issue"
                    >
                        <Flag className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <a
                href={resource.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-6 group-hover:opacity-90 transition-opacity"
            >
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ring-1 ring-blue-100 dark:ring-blue-800/30">
                        <FileText className="w-7 h-7" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mt-4 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {resource.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <span>Click to view</span>
                    <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </div>
            </a>

            {/* Footer */}
            <div className="pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5" title="Likes">
                        <ThumbsUp className="w-4 h-4" />
                        {counts.likes}
                    </div>
                    <div className="flex items-center gap-1.5" title="Downloads">
                        <Download className="w-4 h-4" />
                        {counts.downloads}
                    </div>
                </div>

                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                    Open
                    <Share2 className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
}
