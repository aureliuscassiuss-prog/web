
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
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
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
    // Fixed position to prevent scrolling, high z-index to cover everything
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-black font-sans overflow-hidden touch-none">
                <div className="relative mb-6">
                    {/* Glowing outer ring */}
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150" />

                    {/* Reviewing Spinner - LARGE */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                        <div className="absolute inset-0 rounded-full border-[6px] border-t-blue-600 border-r-transparent border-b-purple-600 border-l-transparent animate-spin" />

                        {/* Center Icon (Placeholder until data loads) */}
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
                    The link you followed might be broken, or the user may have stopped sharing this collection.
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
                <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 border border-white/50 dark:border-gray-800/50 shadow-sm">
                    {/* Background Gradients */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
                        {/* Profile Picture */}
                        <div className="group relative shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-xl">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center border-4 border-white dark:border-gray-800">
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
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-[10px] sms:text-xs font-bold uppercase tracking-wider mb-3 border border-blue-100 dark:border-blue-800/50 shadow-sm">
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
                            <SharedGridCard key={resource._id} resource={resource} currentUserToken={token} onLoginRequest={() => setIsAuthModalOpen(true)} />
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
    // Local state for counts (display only)
    const [counts] = useState({
        likes: resource.likes || 0,
        downloads: resource.downloads || 0
    });

    const handleProtectedAction = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserToken) {
            // Trigger login popup
            onLoginRequest();
        } else {
            alert("This is a view-only shared page.\n\nTo interact with this resource (Like, Flag, etc.), please find it in the main library.");
        }
    };

    return (
        <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 h-full flex flex-col">

            {/* Top Row: Tag & Actions */}
            <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded border border-gray-100 dark:border-gray-700">
                    {resource.subject || 'Resource'}
                </span>

                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={handleProtectedAction}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Save"
                    >
                        <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleProtectedAction}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Report"
                    >
                        <Flag className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <a
                href={resource.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 flex-1 mb-4 group-hover:opacity-90 transition-opacity"
            >
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-800/30">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {resource.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        <span>View file details</span>
                        <ArrowRight className="w-3 h-3 -rotate-45" />
                    </div>
                </div>
            </a>

            {/* Footer: Metrics & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {counts.likes}
                    </div>
                    <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {counts.downloads}
                    </div>
                </div>

                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
                >
                    Open
                    <Share2 className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}
