import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Bookmark, Share2, Check
} from 'lucide-react';
import TyreLoader from './TyreLoader';
import ResourceCard from './ResourceCard';

export default function SavedResources() {
    const { token } = useAuth();
    const [resources, setResources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Share State
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [justCopied, setJustCopied] = useState(false);

    // Note State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [shareNote, setShareNote] = useState('');

    // Selection Mode State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set()); // Reset selection
        setShareUrl(null); // Reset URL
    };

    useEffect(() => {
        const fetchSavedResources = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/resources?action=saved', {
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

    const handleShare = () => {
        if (!token) return;

        // If we already have the URL, just copy it again
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setJustCopied(true);
            setTimeout(() => setJustCopied(false), 2000);
            return;
        }

        // If selecting specific items, ASK FOR NOTE first
        if (isSelectionMode && selectedIds.size > 0) {
            setShowNoteModal(true);
            return;
        }

        // Otherwise share full profile (legacy)
        performShare();
    };

    const performShare = async (note?: string) => {
        setIsSharing(true);
        setShowNoteModal(false); // Close modal if open

        try {
            const body: any = {};
            if (isSelectionMode && selectedIds.size > 0) {
                body.resourceIds = Array.from(selectedIds);
            } else {
                // FAILSAFE: If creating a general link, create a snapshot of all current resources
                // This avoids issues if the user.shareSlug column is missing in the DB
                body.resourceIds = resources.map(r => r._id);
            }
            // Explicitly add action to body as backup
            body.action = 'share';

            if (note) body.note = note;

            // We send action in body now to avoid URL query params triggering GET logic on redirects
            const res = await fetch(`/api/resources?t=${Date.now()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('Share API Error:', data);
                alert(`Share Failed: ${data.message || 'Unknown error'}\n${data.debug ? JSON.stringify(data.debug, null, 2) : ''}`);
                return;
            }

            if (data.slug) {
                const url = `${window.location.origin}/shared/${data.slug}`;
                setShareUrl(url);
                navigator.clipboard.writeText(url);
                setJustCopied(true);
                setTimeout(() => setJustCopied(false), 2000);
            }
        } catch (error: any) {
            console.error('Failed to generate share link', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsSharing(false);
        }
    };

    // Optional: Handler if you want items to disappear immediately when unsaved
    const handleUnsave = (_id: string) => {
        // setResources(prev => prev.filter(r => r._id !== id));
    };

    // ... Loading and Auth checks ...

    if (isLoading) {
        return <TyreLoader fullScreen={true} size={50} />
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
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Resources</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        You have <strong>{resources.length}</strong> bookmarked resource{resources.length !== 1 && 's'}
                    </p>
                </div>

                {resources.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={toggleSelectionMode}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${isSelectionMode
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </button>

                        <button
                            onClick={handleShare}
                            disabled={isSharing || (isSelectionMode && selectedIds.size === 0)}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${justCopied
                                ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                                } ${(isSelectionMode && selectedIds.size === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSharing ? (
                                <TyreLoader size={16} />
                            ) : justCopied ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Share2 className="w-4 h-4" />
                            )}
                            {isSharing ? 'Generating...' : justCopied ? 'Copied!' : (isSelectionMode && selectedIds.size > 0 ? `Share (${selectedIds.size})` : 'Share')}
                        </button>
                    </div>
                )}
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
                        <ResourceCard
                            key={resource._id}
                            resource={resource}
                            onUnsave={() => handleUnsave(resource._id)}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.has(resource._id)}
                            onToggleSelect={() => toggleSelection(resource._id)}
                        />
                    ))}
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Add a Note? (Optional)</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Add a personal message to display at the top of this shared list.
                        </p>

                        <textarea
                            value={shareNote}
                            onChange={(e) => setShareNote(e.target.value)}
                            placeholder="e.g. Here are the notes for Unit 1 we discussed..."
                            className="w-full h-24 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-6 resize-none"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => performShare(shareNote)} // Share WITH note
                                className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
                            >
                                Add Note & Share
                            </button>
                            <button
                                onClick={() => performShare()} // Share WITHOUT note
                                className="px-4 py-2.5 rounded-xl font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}