import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, ThumbsDown, Plus, Sparkles, Filter, Clock, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Types
interface Coffession {
    id: string;
    content: string;
    theme: 'espresso' | 'latte' | 'mocha' | 'cappuccino';
    likes: number;
    dislikes: number;
    created_at: string;
}

const THEMES = {
    espresso: 'bg-stone-900 text-stone-100 border-stone-800',
    latte: 'bg-amber-100/90 text-amber-900 border-amber-200',
    mocha: 'bg-[#3b2f2f] text-[#e3caca] border-[#5d4a4a]',
    cappuccino: 'bg-[#fff5e1] text-[#78350f] border-[#d6c0a0]'
};

export default function CoffessionsPage() {
    const { token, user } = useAuth();
    const [coffessions, setCoffessions] = useState<Coffession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState<'new' | 'trending'>('new');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Form State
    const [newContent, setNewContent] = useState('');
    const [newTheme, setNewTheme] = useState<'espresso' | 'latte' | 'mocha' | 'cappuccino'>('latte');
    const [isPosting, setIsPosting] = useState(false);

    // Votes Map (Local tracking for immediate UI update)
    const [votes, setVotes] = useState<Record<string, 'like' | 'dislike'>>({});

    useEffect(() => {
        fetchCoffessions();
        // Load votes from local storage
        const savedVotes = localStorage.getItem('coffession_votes');
        if (savedVotes) setVotes(JSON.parse(savedVotes));
    }, [sort, token]);

    const fetchCoffessions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/coffessions?sort=${sort}`);
            if (res.ok) {
                const data = await res.json();
                setCoffessions(data);
            }
        } catch (error) {
            console.error('Failed to load confessions', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newContent.trim()) return;
        if (!token) {
            alert("Please sign in to post (your identity will remain anonymous).");
            return;
        }

        setIsPosting(true);
        try {
            const res = await fetch('/api/coffessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newContent, theme: newTheme })
            });

            if (res.ok) {
                setNewContent('');
                setIsCreateModalOpen(false);
                fetchCoffessions(); // Reload
            }
        } catch (error) {
            console.error('Failed to post', error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleVote = async (id: string, type: 'like' | 'dislike') => {
        if (votes[id]) return; // Already voted

        // Optimistic Update
        setCoffessions(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    likes: type === 'like' ? c.likes + 1 : c.likes,
                    dislikes: type === 'dislike' ? c.dislikes + 1 : c.dislikes
                };
            }
            return c;
        }));

        // Update Local State
        const newVotes = { ...votes, [id]: type };
        setVotes(newVotes);
        localStorage.setItem('coffession_votes', JSON.stringify(newVotes));

        // API Call
        try {
            await fetch(`/api/coffessions?action=vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ id, type })
            });
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-screen bg-[#fcfaf8] dark:bg-black p-4 md:p-8 animate-fade-in relative">

            {/* Header */}
            <div className="max-w-4xl mx-auto mb-10 text-center">
                <div className="inline-flex items-center gap-3 mb-2">
                    <Coffee className="w-8 h-8 text-amber-700 dark:text-amber-500" />
                    <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
                        Coffessions
                    </h1>
                </div>
                <p className="text-stone-500 dark:text-stone-400 max-w-lg mx-auto text-lg leading-relaxed">
                    Spill the tea, anonymously. ☕ <br />
                    <span className="text-sm opacity-70">Posts disappear after 48 hours.</span>
                </p>
            </div>

            {/* Controls */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
                {/* Sort Tabs */}
                <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-xl">
                    <button
                        onClick={() => setSort('new')}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                            ${sort === 'new' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}
                        `}
                    >
                        <Clock size={16} />
                        Fresh Brew
                    </button>
                    <button
                        onClick={() => setSort('trending')}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                            ${sort === 'trending' ? 'bg-white dark:bg-stone-800 shadow-sm text-amber-600 dark:text-amber-400' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}
                        `}
                    >
                        <Flame size={16} />
                        Trending
                    </button>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                    <Plus size={18} />
                    Spill It
                </button>
            </div>

            {/* Grid */}
            <div className="max-w-4xl mx-auto columns-1 sm:columns-2 gap-6 space-y-6">
                {isLoading ? (
                    // Skeletons
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse break-inside-avoid"></div>
                    ))
                ) : coffessions.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-stone-400">
                        <Coffee size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No confessions yet. Be the first to brew one!</p>
                    </div>
                ) : (
                    coffessions.map(post => (
                        <div
                            key={post.id}
                            className={`
                                relative p-6 rounded-2xl break-inside-avoid shadow-sm hover:shadow-md transition-shadow border
                                ${THEMES[post.theme] || THEMES.latte}
                            `}
                        >
                            {/* Paper Texture Overlay (optional CSS effect could go here) */}

                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 opacity-70">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                                        <span className="text-xs">☕</span>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">Anonymous</span>
                                </div>
                                <span className="text-xs">
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Content */}
                            <p className="text-lg font-medium leading-relaxed mb-6 whitespace-pre-wrap font-serif">
                                {post.content}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleVote(post.id, 'like')}
                                        disabled={!!votes[post.id]}
                                        className={`p-2 rounded-full hover:bg-black/5 transition-colors flex items-center gap-1 ${votes[post.id] === 'like' ? 'text-pink-600' : ''}`}
                                    >
                                        <Heart size={18} className={votes[post.id] === 'like' ? 'fill-current' : ''} />
                                        <span className="text-xs font-bold">{post.likes}</span>
                                    </button>
                                    <button
                                        onClick={() => handleVote(post.id, 'dislike')}
                                        disabled={!!votes[post.id]}
                                        className={`p-2 rounded-full hover:bg-black/5 transition-colors flex items-center gap-1 ${votes[post.id] === 'dislike' ? 'text-stone-600' : ''}`}
                                    >
                                        <ThumbsDown size={18} />
                                        <span className="text-xs font-bold">{post.dislikes}</span>
                                    </button>
                                </div>
                                {post.likes > 5 && (
                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600/80 bg-amber-500/10 px-2 py-1 rounded-full">
                                        <Flame size={10} /> Hot
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-1 text-stone-900 dark:text-white">New Confession</h2>
                            <p className="text-stone-500 text-sm mb-6">What's brewing? (Anonymous & Disappears in 48h)</p>

                            <textarea
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                placeholder="I secretly think that..."
                                className="w-full h-32 p-4 rounded-xl bg-stone-50 dark:bg-black/50 border-2 border-stone-100 dark:border-stone-800 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none resize-none mb-4 text-stone-900 dark:text-stone-100 placeholder-stone-400"
                                maxLength={280}
                            />

                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                                {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => setNewTheme(theme)}
                                        className={`
                                            w-8 h-8 rounded-full border-2 transition-all shrink-0
                                            ${newTheme === theme ? 'scale-110 border-stone-900 dark:border-white' : 'border-transparent opacity-50 hover:opacity-100'}
                                            ${theme === 'espresso' ? 'bg-stone-900' : ''}
                                            ${theme === 'latte' ? 'bg-amber-100' : ''}
                                            ${theme === 'mocha' ? 'bg-[#3b2f2f]' : ''}
                                            ${theme === 'cappuccino' ? 'bg-[#fff5e1]' : ''}
                                        `}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newContent.trim() || isPosting}
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPosting ? 'Brewing...' : 'Post it'}
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
