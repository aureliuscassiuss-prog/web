import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bookmark, Loader2 } from 'lucide-react';
import ResourceGrid from './ResourceGrid';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Resources</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Resources you've bookmarked for later
                </p>
            </div>

            {resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <Bookmark className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No saved resources yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start bookmarking resources to find them here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {resources.map((resource) => (
                        <ResourceCard key={resource._id} resource={resource} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Reuse the resource card component
function ResourceCard({ resource }: { resource: any }) {
    const { token } = useAuth();
    const [localResource, setLocalResource] = useState(resource);

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
                setLocalResource((prev: any) => ({
                    ...prev,
                    ...data.resource
                }));
            }
        } catch (error) {
            console.error('Interaction failed:', error);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {localResource.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span>{localResource.uploader}</span>
                        <span>•</span>
                        <span>{localResource.subject}</span>
                        {localResource.unit && (
                            <>
                                <span>•</span>
                                <span>{localResource.unit}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleInteraction('like', !localResource.userLiked)}
                            className={`flex items-center gap-1 text-xs ${localResource.userLiked ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            👍 {localResource.likes || 0}
                        </button>
                        <button
                            onClick={() => handleInteraction('dislike', !localResource.userDisliked)}
                            className={`flex items-center gap-1 text-xs ${localResource.userDisliked ? 'text-red-600' : 'text-gray-500'}`}
                        >
                            👎 {localResource.dislikes || 0}
                        </button>
                        <button
                            onClick={() => handleInteraction('save', false)}
                            className="flex items-center gap-1 text-xs text-yellow-600"
                        >
                            🔖 Saved
                        </button>
                        {(localResource.flags || 0) > 0 && (
                            <span className="flex items-center gap-1 text-xs text-orange-600">
                                🚩 {localResource.flags}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            ⬇ {localResource.downloads || 0}
                        </span>
                    </div>
                </div>
                <a
                    href={localResource.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleInteraction('download', true)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Open
                </a>
            </div>
        </div>
    );
}
