import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, ThumbsDown, Plus, Sparkles, Filter, Clock, Flame, X } from 'lucide-react';
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

const THEME_STYLES = {
    espresso: 'bg-gradient-to-br from-stone-900 to-stone-800 text-stone-100 border-stone-700/50 shadow-stone-900/20',
    latte: 'bg-gradient-to-br from-[#fdfbf7] to-[#f3ebd3] text-[#5c4033] border-[#e6d0ac] shadow-orange-900/5',
    mocha: 'bg-gradient-to-br from-[#4e342e] to-[#3e2723] text-[#efebe9] border-[#6d4c41] shadow-brown-900/20',
    cappuccino: 'bg-gradient-to-br from-[#fff8e1] to-[#ffecb3] text-[#5d4037] border-[#ffe082] shadow-yellow-900/5'
};

export default function CoffessionsPage() {
    const { token } = useAuth();
    const [coffessions, setCoffessions] = useState<Coffession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState<'new' | 'trending'>('new');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Form State
    const [newContent, setNewContent] = useState('');
    const [newTheme, setNewTheme] = useState<'espresso' | 'latte' | 'mocha' | 'cappuccino'>('latte');
    const [isPosting, setIsPosting] = useState(false);

    // Votes Map
    const [votes, setVotes] = useState<Record<string, 'like' | 'dislike'>>({});

    useEffect(() => {
        fetchCoffessions();
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
                fetchCoffessions();
            }
        } catch (error) {
            console.error('Failed to post', error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleVote = async (id: string, type: 'like' | 'dislike') => {
        if (votes[id]) return;

        // Optimistic UI Update
        const previousCoffessions = [...coffessions];
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

        const newVotes = { ...votes, [id]: type };
        setVotes(newVotes);
        localStorage.setItem('coffession_votes', JSON.stringify(newVotes));

        try {
            const res = await fetch(`/api/coffessions?action=vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ id, type })
            });
            if (!res.ok) throw new Error('Vote failed');
        } catch (e) {
            console.error(e);
            // Revert on failure
            setCoffessions(previousCoffessions);
            const revertedVotes = { ...votes };
            delete revertedVotes[id];
            setVotes(revertedVotes);
            localStorage.setItem('coffession_votes', JSON.stringify(revertedVotes));
        }
    };

    return (
        <div className="min-h-screen bg-[#fcf9f2] dark:bg-[#121212] font-sans selection:bg-amber-100 dark:selection:bg-amber-900 pb-20">
            {/* Header / Hero Section */}
            <div className="sticky top-0 z-40 bg-[#fcf9f2]/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
                            <Coffee className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
                            Coffessions
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Tab Switcher - Desktop */}
                        <div className="hidden sm:flex bg-stone-100 dark:bg-stone-800/50 p-1 rounded-xl">
                            <button
                                onClick={() => setSort('new')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${sort === 'new' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-800 dark:text-white' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                            >
                                <Clock size={14} /> Fresh
                            </button>
                            <button
                                onClick={() => setSort('trending')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${sort === 'trending' ? 'bg-white dark:bg-stone-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                            >
                                <Flame size={14} /> Hot
                            </button>
                        </div>

                        {/* Mobile Tab Icons */}
                        <div className="flex sm:hidden gap-1">
                            <button onClick={() => setSort('new')} className={`p-2 rounded-lg ${sort === 'new' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white' : 'text-stone-400'}`}>
                                <Clock size={20} />
                            </button>
                            <button onClick={() => setSort('trending')} className={`p-2 rounded-lg ${sort === 'trending' ? 'bg-stone-200 dark:bg-stone-800 text-amber-600 dark:text-amber-400' : 'text-stone-400'}`}>
                                <Flame size={20} />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-stone-900/10 dark:shadow-white/5"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span className="hidden sm:inline">Spill It</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid (Masonry) */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {isLoading ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-stone-200 dark:bg-stone-800 rounded-3xl animate-pulse break-inside-avoid" />
                        ))}
                    </div>
                ) : coffessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                            <Coffee className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-700 dark:text-stone-200 mb-2">No fresh coffee yet</h3>
                        <p className="text-stone-500 dark:text-stone-400 max-w-sm">
                            Be the first to spill the tea anonymously! Your confession will disappear in 48 hours.
                        </p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        <AnimatePresence>
                            {coffessions.map(post => (
                                <motion.div
                                    key={post.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`
                                        relative p-6 rounded-[2rem] break-inside-avoid border shadow-sm hover:shadow-xl transition-all duration-300
                                        ${THEME_STYLES[post.theme] || THEME_STYLES.latte}
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-4 opacity-80">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-sm">☕</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest">Anonymous</span>
                                                <span className="text-[10px] font-medium opacity-70">
                                                    {(() => {
                                                        const d = new Date(post.created_at);
                                                        const now = new Date();
                                                        const diff = (now.getTime() - d.getTime()) / 1000 / 60 / 60; // hours
                                                        if (diff < 1) return 'Just now';
                                                        if (diff < 24) return `${Math.floor(diff)}h ago`;
                                                        return `${Math.floor(diff / 24)}d ago`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-lg font-medium leading-relaxed mb-8 whitespace-pre-wrap font-serif tracking-wide">
                                        {post.content}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleVote(post.id, 'like')}
                                                disabled={!!votes[post.id]}
                                                className={`
                                                    group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all
                                                    ${votes[post.id] === 'like' ? 'bg-pink-500 text-white shadow-pink-500/30 shadow-lg' : 'hover:bg-black/5 dark:hover:bg-white/10'}
                                                `}
                                            >
                                                <Heart
                                                    size={18}
                                                    className={`transition-transform group-active:scale-125 ${votes[post.id] === 'like' ? 'fill-current' : ''}`}
                                                />
                                                <span className="text-xs font-bold">{post.likes}</span>
                                            </button>

                                            <button
                                                onClick={() => handleVote(post.id, 'dislike')}
                                                disabled={!!votes[post.id]}
                                                className={`
                                                    group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all
                                                    ${votes[post.id] === 'dislike' ? 'bg-stone-700 text-white shadow-lg' : 'hover:bg-black/5 dark:hover:bg-white/10'}
                                                `}
                                            >
                                                <ThumbsDown
                                                    size={18}
                                                    className={`transition-transform group-active:rotate-12 ${votes[post.id] === 'dislike' ? 'fill-current' : ''}`}
                                                />
                                            </button>
                                        </div>

                                        {post.likes > 5 && (
                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                                                <Flame size={12} className="fill-current" /> Hot
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Create Post Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-black/20 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Spill the tea ☕</h2>
                                    <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">Anonymous • Disappears in 48h</p>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                                    <X size={24} className="text-stone-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <textarea
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="I secretly think that..."
                                    className="w-full h-40 p-5 rounded-3xl bg-stone-50 dark:bg-[#2a2a2a] border-2 border-transparent focus:border-amber-500 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none resize-none text-lg text-stone-800 dark:text-stone-100 placeholder-stone-400 font-medium"
                                    maxLength={280}
                                    autoFocus
                                />

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 block pl-2">Pick your flavor</label>
                                    <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
                                        {(Object.keys(THEME_STYLES) as Array<keyof typeof THEME_STYLES>).map(theme => (
                                            <button
                                                key={theme}
                                                onClick={() => setNewTheme(theme)}
                                                className={`
                                                    group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                                                    ${newTheme === theme ? 'scale-110 shadow-xl ring-2 ring-stone-900 dark:ring-white ring-offset-2 dark:ring-offset-black' : 'opacity-60 hover:opacity-100 hover:scale-105'}
                                                `}
                                                style={{
                                                    background: theme === 'espresso' ? '#1c1917' : theme === 'latte' ? '#f3ebd3' : theme === 'mocha' ? '#3e2723' : '#ffecb3'
                                                }}
                                            >
                                                {newTheme === theme && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white drop-shadow-md">
                                                        <CheckIcon color={theme === 'latte' || theme === 'cappuccino' ? '#3e2723' : '#fff'} />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreate}
                                    disabled={!newContent.trim() || isPosting}
                                    className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-stone-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none"
                                >
                                    {isPosting ? 'Brewing...' : 'Post It'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CheckIcon({ color }: { color: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    )
}
