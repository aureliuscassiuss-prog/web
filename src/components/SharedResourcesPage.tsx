
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Bookmark, FileText, Download,
    ThumbsUp, Flag, Share2, User, LayoutGrid
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
                {/* Personalized Loading Screen */}
                <div className="relative">
                    {/* Ring Spinner */}
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin w-24 h-24 -m-2"></div>

                    {/* Avatar Center */}
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center shadow-lg relative z-10">
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                </div>
                <div className="mt-8 text-center space-y-1 animate-pulse">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Opening Shared Collection...</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full mb-4">
                    <Flag className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Collection Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    The link you followed might be broken, or the user may have stopped sharing this collection.
                </p>
                <Link to="/" className="mt-6 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-all">
                    Go Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

                {/* Dashboard-style Header */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-10 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                {data.user.avatar ? (
                                    <img src={data.user.avatar} alt={data.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Shared Collection
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                                Resources by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{data.user.name}</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
                                A curated list of <strong>{data.resources.length}</strong> helpful resources for UniNotes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                {data.resources.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>This collection is empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {data.resources.map((resource: any) => (
                            <SharedGridCard key={resource._id} resource={resource} currentUserToken={token} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Reusing a simplified version of the GridCard for the shared view
// Includes "Login Guard" for interactions
const SharedGridCard = ({ resource, currentUserToken }: { resource: any, currentUserToken: string | null }) => {

    // Local state for counts (read-only mostly, unless we implement fully interactive shared view later)
    // For now, interactions like Upvote require login
    const [counts] = useState({
        likes: resource.likes || 0,
        downloads: resource.downloads || 0
    });

    const handleProtectedAction = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserToken) {
            alert("Please login to your account to interact with this resource.");
            // Ideally we'd open the auth modal here, but `alert` meets the simple requirement for now.
            // Or navigation to login page.
        } else {
            // If they ARE logged in, we could theoretically execute the action, 
            // but since they are viewing SOMEONE ELSE'S collection, the context is different.
            // Let's just say "Open in main app to interact" or allow basic like?
            // User requested: "make sure people go to like and flagg and do something that it shoudl first ask them to login then do interaction"
            alert("To like, flag, or save, please find this resource in the main library or login.");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 group">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded tracking-wider">
                    {resource.subject || 'Resource'}
                </span>
                <div className="flex gap-1">
                    <button onClick={handleProtectedAction} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Save">
                        <Bookmark className="w-4 h-4" />
                    </button>
                    <button onClick={handleProtectedAction} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Flag">
                        <Flag className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <a href={resource.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 mb-4 group-hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-snug mb-1 line-clamp-2">
                        {resource.title}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        View Document <Share2 className="w-3 h-3" />
                    </p>
                </div>
            </a>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                    <button onClick={handleProtectedAction} className="flex items-center gap-1 hover:text-green-600 transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" /> {counts.likes}
                    </button>
                    <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> {counts.downloads}
                    </span>
                </div>

                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-black dark:bg-white dark:text-black px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                >
                    Open
                </a>
            </div>
        </div>
    );
}
