import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, ThumbsDown, Plus, Sparkles, Filter, Clock, Flame, X, Share2, Download, Instagram } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import html2canvas from 'html2canvas';

// Types
interface Coffession {
    id: string;
    content: string;
    theme: 'espresso' | 'latte' | 'mocha' | 'cappuccino';
    likes: number;
    dislikes: number;
    created_at: string;
}

// V2 Theme System - Cleaner, Premium, Less "Muddy"
const THEME_STYLES = {
    espresso: 'bg-[#1a1a1a] text-white border-stone-800 shadow-xl shadow-black/20 selection:bg-stone-700',
    latte: 'bg-white text-stone-900 border-stone-100 shadow-xl shadow-stone-200/50 selection:bg-amber-100',
    mocha: 'bg-[#2d2424] text-[#e6e1e1] border-[#3d3232] shadow-xl shadow-black/20 selection:bg-[#4a3b3b]',
    cappuccino: 'bg-[#fffbf2] text-[#4a3b3b] border-[#f0e6d2] shadow-xl shadow-orange-900/5 selection:bg-orange-100'
};

const ACCENT_COLORS = {
    espresso: 'from-stone-700 to-stone-900',
    latte: 'from-amber-400 to-orange-400',
    mocha: 'from-amber-700 to-amber-900',
    cappuccino: 'from-orange-300 to-amber-400'
};

const THEME_LABELS = {
    espresso: 'Espresso',
    latte: 'Latte',
    mocha: 'Mocha',
    cappuccino: 'Cappuccino'
}

export default function CoffessionsPage() {
    const { token } = useAuth();
    const [coffessions, setCoffessions] = useState<Coffession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState<'new' | 'trending'>('new');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Share Modal State
    const [shareData, setShareData] = useState<Coffession | null>(null);

    // Create Form State
    const [newContent, setNewContent] = useState('');
    const [newTheme, setNewTheme] = useState<'espresso' | 'latte' | 'mocha' | 'cappuccino'>('latte');
    const [isPosting, setIsPosting] = useState(false);

    // Votes Map
    const [votes, setVotes] = useState<Record<string, 'like' | 'dislike'>>({});

    // Floating Hearts Animation State
    const [hearts, setHearts] = useState<{ id: number; x: number; y: number; rotation: number }[]>([]);

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

    const spawnHearts = (x: number, y: number) => {
        // Create a burst of hearts
        const newHearts = Array.from({ length: 8 }).map((_, i) => ({
            id: Date.now() + i,
            x: x, // Start EXACTLY at click
            y: y,
            rotation: Math.random() * 360 // Random initial rotation
        }));
        setHearts(prev => [...prev, ...newHearts]);

        // Cleanup matches animation duration
        setTimeout(() => {
            setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
        }, 1200);
    };

    const handleVote = async (id: string, type: 'like' | 'dislike', e?: React.MouseEvent | React.TouchEvent, isDoubleTap = false) => {
        const currentVote = votes[id];
        let changes = { likes: 0, dislikes: 0 };
        let newVoteState: 'like' | 'dislike' | undefined = type;

        // --- Visual Effects ---
        if (type === 'like' && e) {
            const clientX = 'clientX' in e ? e.clientX : (e as any).touches?.[0]?.clientX;
            const clientY = 'clientY' in e ? e.clientY : (e as any).touches?.[0]?.clientY;
            if (clientX && clientY) spawnHearts(clientX, clientY);
        }

        // --- Logic Fix: Double Tap ALWAYS likes, never toggles off ---
        if (isDoubleTap && currentVote === 'like') {
            // Already liked, just play animation (already triggered above) and return
            return;
        }

        // --- Standard Logic ---
        if (currentVote === type && !isDoubleTap) { // Only toggle off if not a double tap
            // Toggle Off
            newVoteState = undefined;
            changes = type === 'like' ? { likes: -1, dislikes: 0 } : { likes: 0, dislikes: -1 };
        } else if (currentVote) {
            // Switch (e.g. Dislike -> Like)
            changes = type === 'like'
                ? { likes: 1, dislikes: -1 }
                : { likes: -1, dislikes: 1 };
        } else {
            // New Vote
            changes = type === 'like' ? { likes: 1, dislikes: 0 } : { likes: 0, dislikes: 1 };
        }

        // Optimistic UI Update
        const previousCoffessions = [...coffessions];
        setCoffessions(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    likes: Math.max(0, c.likes + changes.likes),
                    dislikes: Math.max(0, c.dislikes + changes.dislikes)
                };
            }
            return c;
        }));

        const newVotes = { ...votes };
        if (newVoteState) {
            newVotes[id] = newVoteState;
        } else {
            delete newVotes[id];
        }
        setVotes(newVotes);
        localStorage.setItem('coffession_votes', JSON.stringify(newVotes));

        try {
            const res = await fetch(`/api/coffessions?action=vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ id, changes })
            });
            if (!res.ok) throw new Error('Vote failed');
        } catch (e) {
            console.error(e);
            // Revert on failure
            setCoffessions(previousCoffessions);
            // Revert votes state roughly (simplification)
            const revertedVotes = { ...votes };
            if (currentVote) {
                revertedVotes[id] = currentVote;
            } else {
                delete revertedVotes[id];
            }
            setVotes(revertedVotes);
            localStorage.setItem('coffession_votes', JSON.stringify(revertedVotes));
        }
    };

    // Double Tap Logic
    const lastTap = useRef<Record<string, number>>({});
    const handleCardClick = (id: string, e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        const last = lastTap.current[id] || 0;
        if (now - last < 300) {
            handleVote(id, 'like', e, true); // Pass isDoubleTap = true
        }
        lastTap.current[id] = now;
    };


    return (
        <div className="min-h-screen bg-[#fcf9f2] dark:bg-[#0a0a0a] font-sans selection:bg-amber-100 dark:selection:bg-amber-900 pb-20 relative overflow-x-hidden">
            {/* 3D Realistic Hearts Overlay */}
            <AnimatePresence>
                {hearts.map(heart => (
                    <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, scale: 0, x: heart.x, y: heart.y, rotate: heart.rotation }}
                        animate={{
                            opacity: 0,
                            scale: 2.5,
                            x: heart.x + (Math.random() - 0.5) * 150, // Burst outward X
                            y: heart.y - 200, // Float up Y
                            rotate: heart.rotation + (Math.random() - 0.5) * 90
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="fixed pointer-events-none z-[9999]"
                        style={{ marginLeft: '-24px', marginTop: '-24px' }} // Center anchor
                    >
                        {/* Realistic Heart: Drop shadow + color */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="drop-shadow-xl" style={{ filter: 'drop-shadow(0px 10px 10px rgba(220, 20, 60, 0.4))' }}>
                            <path d="M19.5 5.5C21.433 7.433 21.433 10.567 19.5 12.5L12 20L4.5 12.5C2.567 10.567 2.567 7.433 4.5 5.5C6.433 3.567 9.567 3.567 11.5 5.5L12 6L12.5 5.5C14.433 3.567 17.567 3.567 19.5 5.5Z" fill="#ff2e4d" stroke="#d61f3d" strokeWidth="1" />
                        </svg>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Header / Hero Section */}
            <div className="sticky top-0 z-40 bg-[#fcf9f2]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 transition-colors duration-300">
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
                            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-stone-900/10 dark:shadow-white/5"
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
                                    onClick={(e) => handleCardClick(post.id, e)}
                                    className={`
                                        relative p-6 rounded-[2rem] break-inside-avoid border transition-all duration-300 cursor-pointer overflow-hidden group
                                        ${THEME_STYLES[post.theme] || THEME_STYLES.latte}
                                        hover:shadow-2xl hover:-translate-y-1
                                    `}
                                >
                                    {/* Accent Bar */}
                                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r opacity-80 ${ACCENT_COLORS[post.theme] || 'from-stone-400 to-stone-500'}`} />

                                    <div className="flex items-center justify-between mb-4 opacity-80 mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-sm">☕</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-90">Anonymous</span>
                                                <span className="text-[10px] font-medium opacity-60">
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShareData(post); }}
                                            className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                    </div>

                                    <p className="text-lg font-medium leading-relaxed mb-8 whitespace-pre-wrap tracking-wide select-text">
                                        "{post.content}"
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'like', e); }}
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
                                                onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'dislike'); }}
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

            {/* Share Modal */}
            <AnimatePresence>
                {shareData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShareData(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-transparent max-w-sm w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Instagram Story Preview Area */}
                            <div className="flex justify-center mb-6">
                                <div
                                    id="share-card"
                                    className="w-[320px] h-[568px] flex flex-col justify-between p-10 relative overflow-hidden shadow-2xl rounded-[32px]"
                                    style={{
                                        // Dynamic Premium Backgrounds based on Theme
                                        background: shareData.theme === 'espresso'
                                            ? 'linear-gradient(135deg, #1c1917 0%, #000000 100%)'
                                            : shareData.theme === 'latte'
                                                ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                                                : shareData.theme === 'mocha'
                                                    ? 'linear-gradient(135deg, #451a03 0%, #2a1205 100%)'
                                                    : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                                        color: shareData.theme === 'latte' || shareData.theme === 'cappuccino' ? '#451a03' : '#ffffff'
                                    }}
                                >
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8 opacity-90">
                                            <div className="w-10 h-10 rounded-full bg-current flex items-center justify-center bg-opacity-10 backdrop-blur-md border border-white/20">
                                                <Coffee size={18} />
                                            </div>
                                            <div>
                                                <div className="font-black uppercase tracking-[0.2em] text-[10px]">Uninotes</div>
                                                <div className="font-serif italic opacity-70">Coffessions</div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <span className="absolute -top-6 -left-4 text-6xl font-serif opacity-20">"</span>
                                            <p className="text-3xl font-bold leading-tight tracking-tight relative z-10">
                                                {shareData.content}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 text-center space-y-4">
                                        <div className="w-full h-px bg-current opacity-20"></div>
                                        <div className="flex flex-col items-center gap-1 opacity-70">
                                            <span className="text-[10px] uppercase tracking-widest font-bold">Spilled anonymously on</span>
                                            <span className="font-bold">uninotes.app</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShareData(null)}
                                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('share-card');
                                        if (el) {
                                            html2canvas(el, { scale: 3, useCORS: true }).then(canvas => {
                                                const link = document.createElement('a');
                                                link.download = `coffession-story-${shareData.id}.png`;
                                                link.href = canvas.toDataURL('image/png', 1.0);
                                                link.click();
                                            });
                                        }
                                    }}
                                    className="flex-1 max-w-[200px] h-12 bg-white text-black font-bold rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Download size={18} /> Save Image
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
