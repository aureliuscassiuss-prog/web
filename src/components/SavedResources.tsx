import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Bookmark, Loader2, FileText, Download,
    ThumbsUp, ThumbsDown, Flag, Trash2
} from 'lucide-react';

export default function SavedResources() {
    const { token } = useAuth();
    const [resources, setResources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSavedResources = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/resource-interactions', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setResources(data.resources || []);
                }
            } catch (error) {
                console.error('Failed to fetch saved resources:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedResources();
    }, [token]);

    // Optional: Handler if you want items to disappear immediately when unsaved
    const handleUnsave = (id: string) => {
        // setResources(prev => prev.filter(r => r._id !== id));
    };

    if (isLoading) {
        return (
            <div className="flex h-64 flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">Loading saved resources...</p>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex h-64 flex-col items-center justify-center space-y-3">
                <Bookmark className="h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500">Please sign in to view saved resources</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Resources</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    You have <strong>{resources.length}</strong> bookmarked resource{resources.length !== 1 && 's'}
                </p>
            </div>

            {resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
                        <Bookmark className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">No saved resources yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start bookmarking resources to build your library</p>
                </div>
            ) : (
                // Responsive Grid Layout
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {resources.map((resource) => (
                        <GridCard
                            key={resource._id}
                            resource={resource}
                            onUnsave={() => handleUnsave(resource._id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// --- SOPHISTICATED GRID CARD COMPONENT ---

const GridCard = ({ resource, onUnsave }: { resource: any, onUnsave?: () => void }) => {
    const { token } = useAuth();

    // Initialize state (Default Saved=true for this page)
    const [isSaved, setIsSaved] = useState(true);
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

    const handleInteraction = async (action: string, value: boolean) => {
        if (!token) return;

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
                setCounts({
                    likes: data.resource.likes,
                    dislikes: data.resource.dislikes,
                    downloads: data.resource.downloads,
                    flags: data.resource.flags
                });
            }
        } catch (error) {
            console.error('Interaction failed:', error);
        }
    };

    const handleLike = () => {
        if (!token || isInteracting) return;
        const newValue = userVote !== 'like';
        setIsInteracting(true);

        // Optimistic update
        if (newValue) {
            setCounts(prev => ({ ...prev, likes: prev.likes + 1, dislikes: userVote === 'dislike' ? prev.dislikes - 1 : prev.dislikes }));
            setUserVote('like');
        } else {
            setCounts(prev => ({ ...prev, likes: prev.likes - 1 }));
            setUserVote(null);
        }
        handleInteraction('like', newValue).finally(() => setIsInteracting(false));
    };

    const handleDislike = () => {
        if (!token || isInteracting) return;
        const newValue = userVote !== 'dislike';
        setIsInteracting(true);

        if (newValue) {
            setCounts(prev => ({ ...prev, dislikes: prev.dislikes + 1, likes: userVote === 'like' ? prev.likes - 1 : prev.likes }));
            setUserVote('dislike');
        } else {
            setCounts(prev => ({ ...prev, dislikes: prev.dislikes - 1 }));
            setUserVote(null);
        }
        handleInteraction('dislike', newValue).finally(() => setIsInteracting(false));
    };

    const handleSave = () => {
        if (!token || isInteracting) return;
        setIsInteracting(true);

        const newSavedState = !isSaved;
        setIsSaved(newSavedState);

        if (!newSavedState && onUnsave) {
            onUnsave(); // Notify parent
        }

        handleInteraction('save', newSavedState).finally(() => setIsInteracting(false));
    };

    const handleFlag = () => {
        if (!token || isInteracting || isReported) return;
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
        <div className="group flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 relative overflow-hidden">

            {/* Top Section: Subject Tag & Actions */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                        {resource.subject || 'General'}
                    </span>
                </div>

                {/* Actions (Save/Flag) - Visible on hover or if active */}
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

            {/* Main Content: Icon & Title */}
            <div className="flex items-start gap-3 mb-4 flex-1">
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                    className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 text-blue-500 group-hover:scale-105 transition-transform"
                >
                    <FileText className="w-5 h-5" />
                </a>
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                    className="block min-w-0"
                >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {resource.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {resource.description || 'View file details and preview.'}
                    </p>
                </a>
            </div>

            {/* FOOTER: Interactions & Meta */}
            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">

                {/* Left: Voting Pill */}
                <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-0.5 border border-gray-100 dark:border-gray-800">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleLike(); }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${userVote === 'like'
                            ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm'
                            : 'text-gray-500 hover:text-green-600 hover:bg-gray-200/50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <ThumbsUp className={`w-3 h-3 ${userVote === 'like' ? 'fill-current' : ''}`} />
                        <span>{counts.likes}</span>
                    </button>

                    <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleDislike(); }}
                        className={`px-1.5 py-1 rounded-md transition-colors ${userVote === 'dislike'
                            ? 'bg-white dark:bg-gray-700 text-red-500 shadow-sm'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-200/50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <ThumbsDown className={`w-3 h-3 ${userVote === 'dislike' ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Right: Uploader & Downloads */}
                <div className="flex items-center gap-3">
                    {/* Uploader Info */}
                    <div className="flex items-center gap-1.5" title={`Uploaded by ${resource.uploader || 'Anonymous'}`}>
                        {resource.uploaderAvatar ? (
                            <img src={resource.uploaderAvatar} alt="User" className="w-4 h-4 rounded-full object-cover ring-1 ring-gray-100 dark:ring-gray-700" />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-1 ring-gray-100 dark:ring-gray-700">
                                <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400">
                                    {(resource.uploader || 'A').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 max-w-[60px] truncate hidden sm:block">
                            {resource.uploader || 'Anon'}
                        </span>
                    </div>

                    {/* Download Count */}
                    <a
                        href={resource.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleDownload}
                        className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-blue-600 transition-colors"
                        title={`${counts.downloads} Downloads`}
                    >
                        <Download className="w-3 h-3" />
                        {counts.downloads}
                    </a>
                </div>
            </div>
        </div>
    );
};