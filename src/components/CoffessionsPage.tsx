import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, ThumbsDown, Plus, Flame, Clock, X, Sparkles, Send, Check, Share2, Download } from 'lucide-react';
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
        accent: 'bg-[#ede0d4]/80'
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
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
};

import html2canvas from 'html2canvas';

export default function CoffessionsPage() {
    const { token } = useAuth();
    const [coffessions, setCoffessions] = useState<Coffession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState<'new' | 'trending'>('new');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Share State
    const [shareData, setShareData] = useState<Coffession | null>(null);

    // Create Form
    const [newContent, setNewContent] = useState('');
    const [newTheme, setNewTheme] = useState<keyof typeof THEMES>('latte');
    const [isPosting, setIsPosting] = useState(false);

    // Votes
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

    const handleVote = async (id: string, type: 'like' | 'dislike') => {
        if (votes[id]) return;

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
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-stone-50/80 dark:bg-[#0a0a0a]/80 border-b border-stone-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-2 cursor-pointer group"
                    >
                        <div className="relative bg-gradient-to-br from-amber-600 to-amber-800 p-1.5 rounded-lg text-white shadow-md">
                            <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                            Coffessions<span className="text-amber-600">.</span>
                        </span>
                    </div>

                    {/* Desktop Filters & Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex bg-stone-200/50 dark:bg-white/5 p-1 rounded-lg backdrop-blur-sm border border-black/5 dark:border-white/5">
                            {[
                                { id: 'new', label: 'Fresh', icon: Clock },
                                { id: 'trending', label: 'Hot', icon: Flame }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSort(tab.id as any)}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all duration-200
                                        ${sort === tab.id
                                            ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'}
                                    `}
                                >
                                    <tab.icon size={12} className={sort === tab.id ? 'text-amber-600' : ''} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="hidden sm:flex bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 px-4 py-1.5 rounded-lg font-bold text-sm items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Post
                        </motion.button>
                    </div>
                </div>

                {/* Mobile Filter Tabs */}
                <div className="sm:hidden border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#0a0a0a]/50 backdrop-blur-md px-4 py-2 flex gap-2">
                    <button
                        onClick={() => setSort('new')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${sort === 'new' ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white shadow-sm' : 'border-transparent text-stone-500'}`}
                    >
                        <Clock size={14} /> Fresh
                    </button>
                    <button
                        onClick={() => setSort('trending')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${sort === 'trending' ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-amber-600 shadow-sm' : 'border-transparent text-stone-500'}`}
                    >
                        <Flame size={14} /> Hot
                    </button>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 sm:py-8">
                {isLoading ? (
                    <div className="columns-1 min-[500px]:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-40 sm:h-56 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse break-inside-avoid" />
                        ))}
                    </div>
                ) : coffessions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                            <Coffee className="w-8 h-8 text-stone-400" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">No confessions yet</h3>
                    </div>
                ) : (
                    // GRID CONFIGURATION:
                    // columns-1 on very small screens
                    // columns-2 on regular mobile/tablet
                    // columns-3 on laptop
                    // columns-4 on desktop (to keep cards compact)
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="columns-1 min-[500px]:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
                    >
                        <AnimatePresence mode='popLayout'>
                            {coffessions.map((post) => {
                                const theme = THEMES[post.theme];
                                return (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        variants={itemVariants}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        whileHover={{ y: -3 }}
                                        className={`
                                            relative break-inside-avoid rounded-2xl p-5
                                            border shadow-sm hover:shadow-lg transition-all duration-300 ease-out group
                                            ${theme.bg} ${theme.text} ${theme.border}
                                        `}
                                    >
                                        {/* Card Header (Compact) w/ Share */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2.5 opacity-90">
                                                <div className={`w-8 h-8 rounded-full ${theme.accent} flex items-center justify-center shrink-0`}>
                                                    <Coffee size={14} strokeWidth={2.5} className="opacity-75" />
                                                </div>
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Anonymous</span>
                                                    <span className={`text-[10px] font-medium ${theme.meta} mt-0.5`}>
                                                        Just now
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Top Right Share Icon */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShareData(post); }}
                                                className={`p-2 rounded-full ${theme.accent} hover:brightness-95 transition-all opacity-0 group-hover:opacity-100`}
                                                title="Create Story"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                        </div>

                                        {/* Content - Optimized for reading */}
                                        <p className="text-[15px] sm:text-base leading-snug font-medium mb-4 whitespace-pre-wrap opacity-95 break-words">
                                            {post.content}
                                        </p>

                                        {/* Compact Footer */}
                                        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVote(post.id, 'like')}
                                                    className={`
                                                        flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200
                                                        ${votes[post.id] === 'like'
                                                            ? 'bg-rose-500 text-white'
                                                            : `${theme.accent} hover:brightness-95`}
                                                    `}
                                                >
                                                    <Heart size={14} className={votes[post.id] === 'like' ? 'fill-current' : ''} />
                                                    <span className="text-xs font-bold">{post.likes}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleVote(post.id, 'dislike')}
                                                    className={`
                                                        p-1.5 rounded-full transition-all
                                                        ${votes[post.id] === 'dislike' ? 'bg-stone-800 text-white' : `${theme.accent} hover:brightness-95`}
                                                    `}
                                                >
                                                    <ThumbsDown size={14} className={votes[post.id] === 'dislike' ? 'fill-current' : ''} />
                                                </button>
                                            </div>

                                            {/* Decorative small icon if popular */}
                                            {post.likes > 10 && (
                                                <div className="text-amber-500/80">
                                                    <Sparkles size={14} />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            {/* --- Mobile FAB --- */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="sm:hidden fixed bottom-6 right-6 z-40 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 w-12 h-12 rounded-full shadow-xl shadow-stone-900/30 flex items-center justify-center"
            >
                <Plus size={20} strokeWidth={3} />
            </motion.button>

            {/* --- Share Modal (The Ticket) --- */}
            <AnimatePresence>
                {shareData && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm" onClick={() => setShareData(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="flex flex-col gap-6 items-center w-full max-w-sm"
                        >
                            {/* The Capture Node - 9:16 Aspect Ratio */}
                            <div
                                id="share-card-node"
                                className={`
                                    w-full aspect-[9/16] relative overflow-hidden flex flex-col p-8
                                    ${THEMES[shareData.theme].bg}
                                    ${THEMES[shareData.theme].text}
                                `}
                            >
                                {/* Background Graphics */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                                {/* Border/Frame */}
                                <div className={`absolute inset-4 border-2 opacity-30 pointer-events-none ${THEMES[shareData.theme].border}`} />

                                {/* Header */}
                                <div className="relative z-10 pt-4 mb-auto">
                                    <div className="flex items-center gap-3 mb-6 opacity-80">
                                        <div className={`p-2 rounded-lg bg-black/5 dark:bg-white/10 backdrop-blur-md`}>
                                            <Coffee size={24} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Extrovert.site</span>
                                            <span className="text-xl font-black italic tracking-tighter">ANONYMOUS</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10 my-auto">
                                    <Sparkles className="w-8 h-8 opacity-40 mb-4" />
                                    <p className="text-3xl font-serif font-medium leading-normal tracking-wide">
                                        "{shareData.content}"
                                    </p>
                                </div>

                                {/* Footer Call to Action */}
                                <div className="relative z-10 mt-auto pt-8">
                                    <div className="border-t-2 border-current/20 pt-6 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">
                                                Have a secret?
                                            </p>
                                            <p className="text-sm font-black">
                                                Spill it on Extrovert
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full border-2 border-current/30 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={async () => {
                                        const el = document.getElementById('share-card-node');
                                        if (el) {
                                            try {
                                                const canvas = await html2canvas(el, {
                                                    scale: 2,
                                                    backgroundColor: null,
                                                    logging: false
                                                });
                                                const link = document.createElement('a');
                                                link.download = `coffession-${shareData.id}.png`;
                                                link.href = canvas.toDataURL('image/png');
                                                link.click();
                                            } catch (err) {
                                                console.error("Capture failed:", err);
                                            }
                                        }
                                    }}
                                    className="flex-1 bg-white text-black py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors shadow-xl"
                                >
                                    <Download size={20} /> Save Image
                                </button>
                                <button
                                    onClick={() => setShareData(null)}
                                    className="w-16 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Create Modal (Responsive) --- */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#151515] rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">New Confession</h2>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
                                        <X size={20} className="text-stone-400" />
                                    </button>
                                </div>

                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Spill the beans..."
                                    className="w-full h-32 p-4 rounded-xl bg-stone-50 dark:bg-[#1a1a1a] border-none focus:ring-1 focus:ring-amber-500 text-base text-stone-800 dark:text-stone-100 resize-none mb-4"
                                    maxLength={300}
                                />

                                <div className="mb-6">
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(THEMES).map(([key, styles]) => (
                                            <button
                                                key={key}
                                                onClick={() => setNewTheme(key as any)}
                                                className={`
                                                    relative h-12 rounded-xl transition-all flex items-center justify-center overflow-hidden
                                                    ${newTheme === key ? 'ring-2 ring-amber-500 scale-105' : 'opacity-70 hover:opacity-100'}
                                                `}
                                            >
                                                <div className={`absolute inset-0 ${styles.bg}`} />
                                                <span className={`z-10 text-[9px] font-bold ${styles.text} uppercase`}>{styles.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreate}
                                    disabled={!newContent.trim() || isPosting}
                                    className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    {isPosting ? 'Brewing...' : <>Post It <Send size={14} /></>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}