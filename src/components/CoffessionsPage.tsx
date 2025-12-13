import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, ThumbsDown, Plus, Flame, Clock, X, Sparkles, Send, Check } from 'lucide-react';
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

// Configuration
const THEMES = {
    espresso: {
        name: 'Espresso',
        bg: 'bg-stone-900',
        text: 'text-stone-100',
        meta: 'text-stone-400',
        border: 'border-stone-800',
        accent: 'bg-stone-800'
    },
    latte: {
        name: 'Latte',
        bg: 'bg-[#fffbf0]',
        text: 'text-[#43302b]',
        meta: 'text-[#8c7a70]',
        border: 'border-[#ede0d4]',
        accent: 'bg-[#ede0d4]/50'
    },
    mocha: {
        name: 'Mocha',
        bg: 'bg-[#3c2a21]',
        text: 'text-[#e6ccb2]',
        meta: 'text-[#9c6644]',
        border: 'border-[#4e362e]',
        accent: 'bg-[#4e362e]'
    },
    cappuccino: {
        name: 'Cappuccino',
        bg: 'bg-[#f5ebe0]',
        text: 'text-[#2b211f]',
        meta: 'text-[#7f6c65]',
        border: 'border-[#e3d5ca]',
        accent: 'bg-[#e3d5ca]'
    }
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function CoffessionsPage() {
    const { token } = useAuth();
    const [coffessions, setCoffessions] = useState<Coffession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState<'new' | 'trending'>('new');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Form
    const [newContent, setNewContent] = useState('');
    const [newTheme, setNewTheme] = useState<keyof typeof THEMES>('latte');
    const [isPosting, setIsPosting] = useState(false);

    // Votes
    const [votes, setVotes] = useState<Record<string, 'like' | 'dislike'>>({});

    // -- API Integration --
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

    const handleVote = async (id: string, type: 'like' | 'dislike') => {
        // Prevent spam voting for MVP / Optimistic Update Logic
        if (votes[id]) return;

        // Optimistic UI
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

        // Fire API call
        try {
            await fetch(`/api/coffessions?action=vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ id, changes: { likes: type === 'like' ? 1 : 0, dislikes: type === 'dislike' ? 1 : 0 } })
            });
        } catch (e) {
            console.error('Vote failed', e);
        }
    };

    const handleCreate = async () => {
        if (!newContent.trim()) return;
        if (!token) {
            alert("Please sign in to post.");
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

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0a] font-sans selection:bg-amber-500/30 pb-32 transition-colors duration-500">

            {/* --- Navbar / Filter --- */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-stone-50/80 dark:bg-[#0a0a0a]/80 border-b border-stone-200 dark:border-white/5 supports-[backdrop-filter]:bg-stone-50/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-amber-600 to-amber-800 p-2 rounded-xl text-white shadow-lg">
                                <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                            Coffessions<span className="text-amber-600">.</span>
                        </span>
                    </div>

                    {/* Desktop Filters & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex bg-stone-200/50 dark:bg-white/5 p-1 rounded-xl backdrop-blur-sm border border-black/5 dark:border-white/5">
                            {[
                                { id: 'new', label: 'Fresh Brew', icon: Clock },
                                { id: 'trending', label: 'Roasting', icon: Flame }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSort(tab.id as any)}
                                    className={`
                                        flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                                        ${sort === tab.id
                                            ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm scale-[1.02]'
                                            : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-300/30'}
                                    `}
                                >
                                    <tab.icon size={14} className={sort === tab.id ? 'text-amber-600' : ''} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="hidden sm:flex bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 px-5 py-2.5 rounded-xl font-bold items-center gap-2 shadow-xl shadow-stone-900/10 hover:shadow-stone-900/20 dark:hover:shadow-white/5 transition-shadow"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Spill It
                        </motion.button>
                    </div>
                </div>

                {/* Mobile Filter Tabs (Below Header) */}
                <div className="sm:hidden border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#0a0a0a]/50 backdrop-blur-md px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setSort('new')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border transition-all ${sort === 'new' ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white shadow-sm' : 'border-transparent text-stone-500 dark:text-stone-500'}`}
                    >
                        <Clock size={16} /> Newest
                    </button>
                    <button
                        onClick={() => setSort('trending')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border transition-all ${sort === 'trending' ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'border-transparent text-stone-500 dark:text-stone-500'}`}
                    >
                        <Flame size={16} /> Trending
                    </button>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {isLoading ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-stone-200 dark:bg-stone-800 rounded-3xl animate-pulse break-inside-avoid" />
                        ))}
                    </div>
                ) : coffessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 rounded-full flex items-center justify-center mb-8 shadow-inner">
                            <Coffee className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">The pot is empty</h3>
                        <p className="text-stone-500 dark:text-stone-400 max-w-sm">
                            Be the first to brew a confession. It's strictly anonymous.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {coffessions.map((post) => {
                                const theme = THEMES[post.theme];
                                const hasVoted = !!votes[post.id];

                                return (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        variants={itemVariants}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        whileHover={{ y: -5 }}
                                        className={`
                                            relative break-inside-avoid rounded-[2rem] p-6 sm:p-7
                                            border shadow-sm hover:shadow-xl transition-all duration-300 ease-out group
                                            ${theme.bg} ${theme.text} ${theme.border}
                                        `}
                                    >
                                        {/* Decoration Gradient */}
                                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                            <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 dark:bg-white/5 blur-xl rounded-full pointer-events-none" />
                                        </div>

                                        {/* Card Header */}
                                        <div className="flex items-center gap-3 mb-6 opacity-80">
                                            <div className={`w-10 h-10 rounded-full ${theme.accent} flex items-center justify-center`}>
                                                <Coffee size={18} strokeWidth={2.5} className="opacity-80" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest opacity-90">Anonymous</p>
                                                <p className={`text-[11px] font-medium ${theme.meta} flex items-center gap-1`}>
                                                    {post.likes > 20 && <Sparkles size={10} className="text-amber-500" />}
                                                    Just now
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <p className="text-[17px] leading-relaxed font-medium mb-8 whitespace-pre-wrap tracking-wide opacity-95">
                                            {post.content}
                                        </p>

                                        {/* Footer / Actions */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVote(post.id, 'like')}
                                                    className={`
                                                        relative overflow-hidden flex items-center gap-2 pl-3 pr-4 py-2 rounded-full transition-all duration-300 group/btn
                                                        ${votes[post.id] === 'like'
                                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                                                            : `${theme.accent} hover:bg-black/10 dark:hover:bg-white/10`}
                                                    `}
                                                >
                                                    <Heart
                                                        size={18}
                                                        className={`transition-transform duration-300 group-active/btn:scale-75 ${votes[post.id] === 'like' ? 'fill-current' : ''}`}
                                                    />
                                                    <span className="text-xs font-bold">{post.likes}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleVote(post.id, 'dislike')}
                                                    className={`
                                                        p-2 rounded-full transition-all duration-300
                                                        ${votes[post.id] === 'dislike' ? 'bg-stone-800 text-white' : `${theme.accent} hover:bg-black/10 dark:hover:bg-white/10`}
                                                    `}
                                                >
                                                    <ThumbsDown
                                                        size={18}
                                                        className={`${votes[post.id] === 'dislike' ? 'fill-current' : ''}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            {/* --- Mobile FAB (Floating Action Button) --- */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="sm:hidden fixed bottom-6 right-6 z-40 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 w-14 h-14 rounded-full shadow-2xl shadow-stone-900/30 flex items-center justify-center"
            >
                <Plus size={24} strokeWidth={3} />
            </motion.button>

            {/* --- Create Modal --- */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-all"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative w-full max-w-xl bg-white dark:bg-[#151515] rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                        >
                            {/* Decorative Top Bar */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-700" />

                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100">Brewing Something?</h2>
                                        <p className="text-sm text-stone-500 dark:text-stone-400">Share your thoughts anonymously.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:rotate-90 transition-transform duration-300"
                                    >
                                        <X size={20} className="text-stone-500 dark:text-stone-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative">
                                        <textarea
                                            value={newContent}
                                            onChange={(e) => setNewContent(e.target.value)}
                                            placeholder="What's on your mind?..."
                                            className="w-full h-40 p-5 rounded-2xl bg-stone-50 dark:bg-[#1a1a1a] border border-transparent focus:border-amber-500 focus:ring-0 text-lg text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 resize-none transition-all"
                                            maxLength={300}
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs font-bold text-stone-400">
                                            {newContent.length}/300
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 block">Select Flavor</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {Object.entries(THEMES).map(([key, styles]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setNewTheme(key as any)}
                                                    className={`
                                                        relative h-16 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden
                                                        ${newTheme === key
                                                            ? 'border-amber-500 scale-105 shadow-md'
                                                            : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}
                                                    `}
                                                >
                                                    <div className={`absolute inset-0 ${styles.bg}`} />
                                                    {newTheme === key && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className={`z-10 bg-white dark:bg-stone-900 rounded-full p-1 shadow-sm`}
                                                        >
                                                            <Check size={14} className="text-amber-600" />
                                                        </motion.div>
                                                    )}
                                                    <span className={`z-10 text-[10px] font-bold absolute bottom-1 ${styles.text} opacity-60 uppercase`}>{styles.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreate}
                                        disabled={!newContent.trim() || isPosting}
                                        className="w-full py-4 mt-2 bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-100 dark:to-stone-300 text-white dark:text-stone-950 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                                    >
                                        {isPosting ? <span className="animate-pulse">Brewing...</span> : (
                                            <>Post Confession <Send size={18} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}