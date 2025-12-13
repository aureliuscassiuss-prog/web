import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Bookmark, FileText, Download,
    ThumbsUp, ThumbsDown, Flag, Check, Trash2
} from 'lucide-react';

interface ResourceCardProps {
    resource: any;
    onUnsave?: () => void;
    onDelete?: (id: string) => void;
    showStatus?: boolean;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    onLoginRequest?: () => void;
}

export default function ResourceCard({
    resource,
    onUnsave,
    onDelete,
    showStatus = false,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect,
    onLoginRequest
}: ResourceCardProps) {
    const { token } = useAuth();

    // Initialize state
    // Note: isSaved defaults to resource.userSaved for general grids, 
    // but might be effectively true if we are in SavedResources page (handled by parent passing correct resource obj)
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

    // Sync state ONLY on resource._id change, NOT on every prop change
    // This prevents the useEffect from overriding user interactions
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
    }, [resource._id, resource.userSaved, resource.userFlagged, resource.userLiked, resource.userDisliked, resource.likes, resource.dislikes, resource.downloads, resource.flags]);

    const handleInteraction = async (action: string, value: boolean): Promise<boolean> => {
        if (!token) return false;

        try {
            const response = await fetch('/api/resources?action=interact', {
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
                const r = data.resource || data;

                // ONLY update counts if we have valid numbers from the server
                if (typeof r.likes === 'number' && typeof r.dislikes === 'number' &&
                    typeof r.downloads === 'number' && typeof r.flags === 'number') {
                    setCounts({
                        likes: r.likes,
                        dislikes: r.dislikes,
                        downloads: r.downloads,
                        flags: r.flags
                    });
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Interaction failed:', error);
            return false;
        }
    };

    const handleLike = async () => {
        if (!token) {
            if (onLoginRequest) onLoginRequest();
            return;
        }
        if (isInteracting) return;

        const newValue = userVote !== 'like';
        const prevVote = userVote;
        const prevCounts = { ...counts };

        // Apply optimistic update immediately
        setIsInteracting(true);
        if (newValue) {
            // Liking: add like, remove dislike if exists
            const likeDelta = 1;
            const dislikeDelta = prevVote === 'dislike' ? -1 : 0;
            setCounts(prev => ({
                ...prev,
                likes: prev.likes + likeDelta,
                dislikes: prev.dislikes + dislikeDelta
            }));
            setUserVote('like');
        } else {
            // Unliking: remove like only
            setCounts(prev => ({ ...prev, likes: Math.max(0, prev.likes - 1) }));
            setUserVote(null);
        }

        const success = await handleInteraction('like', newValue);
        if (!success) {
            // Revert on error
            setCounts(prevCounts);
            setUserVote(prevVote);
        }
        setIsInteracting(false);
    };

    const handleDislike = async () => {
        if (!token) {
            if (onLoginRequest) onLoginRequest();
            return;
        }
        if (isInteracting) return;

        const newValue = userVote !== 'dislike';
        const prevVote = userVote;
        const prevCounts = { ...counts };

        setIsInteracting(true);
        if (newValue) {
            // Disliking: add dislike, remove like if exists
            const dislikeDelta = 1;
            const likeDelta = prevVote === 'like' ? -1 : 0;
            setCounts(prev => ({
                ...prev,
                dislikes: prev.dislikes + dislikeDelta,
                likes: prev.likes + likeDelta
            }));
            setUserVote('dislike');
        } else {
            // Un-disliking: remove dislike only
            setCounts(prev => ({ ...prev, dislikes: Math.max(0, prev.dislikes - 1) }));
            setUserVote(null);
        }

        const success = await handleInteraction('dislike', newValue);
        if (!success) {
            setCounts(prevCounts);
            setUserVote(prevVote);
        }
        setIsInteracting(false);
    };

    const handleSave = async () => {
        if (!token) {
            if (onLoginRequest) onLoginRequest();
            return;
        }
        if (isInteracting) return;

        const newSavedState = !isSaved;
        const prevState = isSaved;

        setIsInteracting(true);
        setIsSaved(newSavedState);

        if (!newSavedState && onUnsave) {
            onUnsave(); // Notify parent
        }

        const success = await handleInteraction('save', newSavedState);
        if (!success) {
            setIsSaved(prevState);
        }
        setIsInteracting(false);
    };

    const handleFlag = async () => {
        if (!token) {
            if (onLoginRequest) onLoginRequest();
            return;
        }
        if (isInteracting || isReported) return;

        if (confirm('Flag this resource as inappropriate?')) {
            const prevReported = isReported;
            const prevCounts = { ...counts };

            setIsInteracting(true);
            setIsReported(true);
            setCounts(prev => ({ ...prev, flags: prev.flags + 1 }));

            const success = await handleInteraction('flag', true);
            if (!success) {
                setIsReported(prevReported);
                setCounts(prevCounts);
            }
            setIsInteracting(false);
        }
    };

    const handleDownload = async () => {
        if (isInteracting) return;

        const prevCounts = { ...counts };

        setIsInteracting(true);
        // Optimistic increment
        setCounts(prev => ({ ...prev, downloads: prev.downloads + 1 }));

        const success = await handleInteraction('download', true);
        if (!success) {
            // Revert on failure
            setCounts(prevCounts);
        }
        setIsInteracting(false);
    };

    return (
        <div
            onClick={(e) => {
                // Only select if checking the box or clicking empty space in selection mode
                // If not in selection mode, maybe navigate? For now, do nothing on container click
                if (isSelectionMode && onToggleSelect) {
                    onToggleSelect();
                }
            }}
            className={`group flex flex-col h-full bg-white dark:bg-gray-900 border rounded-xl p-4 hover:shadow-lg transition-all duration-200 relative
            ${isSelectionMode && isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400 cursor-pointer'
                    : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                } ${isSelectionMode ? 'cursor-pointer' : ''}`}
        >
            {/* Selection Overlay Checkbox */}
            {isSelectionMode && (
                <div className="absolute top-4 right-4 z-10">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                </div>
            )}

            {/* Top Section: Subject Tag & Actions */}
            <div className={`flex items-start justify-between mb-3 ${isSelectionMode ? 'pr-8' : ''}`}>
                <div className="flex-1 mr-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                        {resource.subject || 'General'}
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

                {/* Actions (Save/Flag/Delete) - Visible on hover or if active */}
                {!isSelectionMode && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }}
                            className={`p-1.5 rounded-lg transition-colors ${isSaved
                                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            title={isSaved ? "Unsave" : "Save"}
                        >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFlag(); }}
                            disabled={isReported}
                            className={`p-1.5 rounded-lg transition-colors ${isReported
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20 cursor-default'
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            title="Report"
                        >
                            <Flag className={`w-3.5 h-3.5 ${isReported ? 'fill-current' : ''}`} />
                        </button>
                        {onDelete && (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(resource._id); }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content: Icon & Title */}
            <div className="flex items-start gap-3 mb-4 flex-1">
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 text-blue-500 group-hover:scale-105 transition-transform"
                >
                    <FileText className="w-5 h-5" />
                </a>
                <a
                    href={resource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="block min-w-0 flex-1"
                >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {resource.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        View file details &rarr;
                    </p>
                </a>
            </div>

            {/* FOOTER: Interactions & Meta */}
            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">

                {/* Left: Voting Pill & Flag Count if > 0 */}
                <div className="flex items-center gap-2">
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

                    {/* Show flag count if non-zero, requested by user */}
                    {counts.flags > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30">
                            <Flag className="w-3 h-3 fill-current" />
                            <span>{counts.flags}</span>
                        </div>
                    )}
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
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 max-w-[60px] truncate block">
                            {resource.uploader || 'Anon'}
                        </span>
                    </div>

                    {/* Download Count */}
                    <a
                        href={resource.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
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
}
