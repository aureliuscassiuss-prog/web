import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, ThumbsDown, Plus, Flame, Clock, X, Sparkles, Send, Check, Share2, Download } from 'lucide-react';
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
    const [isVoting, setIsVoting] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchCoffessions();
        const savedVotes = localStorage.getItem('coffession_votes');
        if (savedVotes) setVotes(JSON.parse(savedVotes));
    }, [sort, token]); // Removed token dependency if not strictly needed for reading

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

    // --- OPTIMIZED VOTE LOGIC ---
    const handleVote = async (id: string, type: 'like' | 'dislike') => {
        // Prevent rapid clicking
        if (isVoting[id]) return;

        const currentVote = votes[id];
        let newVote: 'like' | 'dislike' | undefined = type;

        // Deltas tell us how much to add/subtract from the UI counts
        let likeDelta = 0;
        let dislikeDelta = 0;

        if (currentVote === type) {
            // User clicked the same button -> Remove vote (Toggle off)
            newVote = undefined;
            if (type === 'like') likeDelta = -1;
            if (type === 'dislike') dislikeDelta = -1;
        } else if (currentVote) {
            // User switched vote (e.g. Like -> Dislike) -> Swap counts
            if (type === 'like') {
                likeDelta = 1;
                dislikeDelta = -1;
            } else {
                likeDelta = -1;
                dislikeDelta = 1;
            }
        } else {
            // User voting for the first time -> Add count
            if (type === 'like') likeDelta = 1;
            if (type === 'dislike') dislikeDelta = 1;
        }

        // Mark as voting
        setIsVoting(prev => ({ ...prev, [id]: true }));

        // 1. Optimistic UI Update (Instant)
        setCoffessions(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    likes: Math.max(0, c.likes + likeDelta),
                    dislikes: Math.max(0, c.dislikes + dislikeDelta)
                };
            }
            return c;
        }));

        // 2. Update Local State & Storage (Instant)
        const newVotes = { ...votes };
        if (newVote) {
            newVotes[id] = newVote;
        } else {
            delete newVotes[id];
        }
        setVotes(newVotes);
        localStorage.setItem('coffession_votes', JSON.stringify(newVotes));

        // 3. Send to API (Background)
        // We send the 'delta' (change) so the backend can adjust the database counter
        try {
            const response = await fetch(`/api/coffessions?action=vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    id,
                    changes: {
                        likes: likeDelta,
                        dislikes: dislikeDelta
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Vote API failed');
            }
        } catch (e) {
            console.error('Vote failed remotely', e);
            // Revert on failure
            setCoffessions(prev => prev.map(c => {
                if (c.id === id) {
                    return {
                        ...c,
                        likes: Math.max(0, c.likes - likeDelta),
                        dislikes: Math.max(0, c.dislikes - dislikeDelta)
                    };
                }
                return c;
            }));
            setVotes(votes);
            localStorage.setItem('coffession_votes', JSON.stringify(votes));
        } finally {
            // Clear voting flag after a brief delay
            setTimeout(() => {
                setIsVoting(prev => ({ ...prev, [id]: false }));
            }, 300);
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

    // --- IMAGE GENERATION LOGIC ---
    const handleDownload = async (action: 'download' | 'share') => {
        const el = document.getElementById('hidden-export-card'); // Target the hidden fixed-size card
        if (!el || !shareData) return;

        try {
            // Use HTML2Canvas on the fixed-size element
            const canvas = await html2canvas(el, {
                scale: 2, // High resolution
                backgroundColor: null,
                logging: false,
                useCORS: true // Helps with external fonts/images
            });

            if (action === 'download') {
                const link = document.createElement('a');
                link.download = `coffession-${shareData.id}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else if (action === 'share') {
                canvas.toBlob(async (blob) => {
                    if (blob && navigator.share) {
                        const file = new File([blob], `coffession-${shareData.id}.png`, { type: 'image/png' });
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'Coffession',
                                text: 'Check out this confession from Extrovert!'
                            });
                        } catch (err) {
                            // User cancelled or share failed
                        }
                    } else {
                        alert('Sharing not supported. Image saved instead.');
                        const link = document.createElement('a');
                        link.download = `coffession-${shareData.id}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    }
                }, 'image/png');
            }
        } catch (err) {
            console.error("Capture failed:", err);
            alert("Failed to generate image.");
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0a] font-sans selection:bg-amber-500/30 pb-32 transition-colors duration-500">

            {/* Navbar & Filters (Same as before) */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-stone-50/80 dark:bg-[#0a0a0a]/80 border-b border-stone-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative bg-gradient-to-br from-amber-600 to-amber-800 p-1.5 rounded-lg text-white shadow-md">
                            <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                            Coffessions<span className="text-amber-600">.</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex bg-stone-200/50 dark:bg-white/5 p-1 rounded-lg backdrop-blur-sm border border-black/5 dark:border-white/5">
                            {[{ id: 'new', label: 'Fresh', icon: Clock }, { id: 'trending', label: 'Hot', icon: Flame }].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSort(tab.id as any)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 ${sort === tab.id ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'}`}
                                >
                                    <tab.icon size={12} className={sort === tab.id ? 'text-amber-600' : ''} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 px-4 py-1.5 rounded-lg font-bold text-sm items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                            <Plus size={16} strokeWidth={3} /> Post
                        </motion.button>
                    </div>
                </div>
                {/* Mobile Filter Tabs */}
                <div className="sm:hidden border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#0a0a0a]/50 backdrop-blur-md px-4 py-2 flex gap-2">
                    <button onClick={() => setSort('new')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${sort === 'new' ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white shadow-sm' : 'border-transparent text-stone-500'}`}>
                        <Clock size={14} /> Fresh
                    </button>
                    <button onClick={() => setSort('trending')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${sort === 'trending' ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-amber-600 shadow-sm' : 'border-transparent text-stone-500'}`}>
                        <Flame size={14} /> Hot
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 sm:py-8">
                {isLoading ? (
                    <div className="columns-1 min-[500px]:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-40 sm:h-56 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse break-inside-avoid" />)}
                    </div>
                ) : coffessions.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">No confessions yet</h3>
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="columns-1 min-[500px]:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
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
                                        className={`relative break-inside-avoid rounded-2xl p-5 border shadow-sm hover:shadow-lg transition-all duration-300 ease-out group ${theme.bg} ${theme.text} ${theme.border}`}
                                    >
                                        {/* Card Content */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2.5 opacity-90">
                                                <div className={`w-8 h-8 rounded-full ${theme.accent} flex items-center justify-center shrink-0`}>
                                                    <Coffee size={14} strokeWidth={2.5} className="opacity-75" />
                                                </div>
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Anonymous</span>
                                                    <span className={`text-[10px] font-medium ${theme.meta} mt-0.5`}>Just now</span>
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setShareData(post); }} className={`p-2 rounded-full ${theme.accent} hover:brightness-95 transition-all opacity-0 group-hover:opacity-100`} title="Share">
                                                <Share2 size={14} />
                                            </button>
                                        </div>

                                        <p className="text-[15px] sm:text-base leading-snug font-medium mb-4 whitespace-pre-wrap opacity-95 break-words">{post.content}</p>

                                        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleVote(post.id, 'like')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${votes[post.id] === 'like' ? 'bg-rose-500 text-white' : `${theme.accent} hover:brightness-95`}`}>
                                                    <Heart size={14} className={votes[post.id] === 'like' ? 'fill-current' : ''} />
                                                    <span className="text-xs font-bold">{post.likes}</span>
                                                </button>
                                                <button onClick={() => handleVote(post.id, 'dislike')} className={`p-1.5 rounded-full transition-all ${votes[post.id] === 'dislike' ? 'bg-stone-800 text-white' : `${theme.accent} hover:brightness-95`}`}>
                                                    <ThumbsDown size={14} className={votes[post.id] === 'dislike' ? 'fill-current' : ''} />
                                                </button>
                                            </div>
                                            {post.likes > 10 && <div className="text-amber-500/80"><Sparkles size={14} /></div>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(true)} className="sm:hidden fixed bottom-6 right-6 z-40 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 w-12 h-12 rounded-full shadow-xl shadow-stone-900/30 flex items-center justify-center">
                <Plus size={20} strokeWidth={3} />
            </motion.button>

            {/* --- SHARE MODAL --- */}
            <AnimatePresence>
                {shareData && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm" onClick={() => setShareData(null)}>

                        {/* 1. VISIBLE PREVIEW CARD (Responsive) */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="flex flex-col gap-6 items-center w-full max-w-sm"
                        >
                            <div className={`w-full aspect-[9/16] relative overflow-hidden flex flex-col p-8 rounded-2xl shadow-2xl ${THEMES[shareData.theme].bg} ${THEMES[shareData.theme].text}`}>
                                {/* Background Graphics */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                                <div className={`absolute inset-4 border-2 opacity-30 pointer-events-none ${THEMES[shareData.theme].border}`} />

                                <div className="relative z-10 pt-6 flex flex-col items-center text-center">
                                    <div className={`p-3 rounded-2xl mb-4 shadow-xl ${THEMES[shareData.theme].accent} backdrop-blur-md bg-opacity-20`}>
                                        <Coffee size={28} className="text-current" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="font-black text-[10px] tracking-[0.4em] uppercase opacity-50 mb-1">Extrovert.site</h3>
                                    <h1 className="font-serif italic text-4xl font-black tracking-tight leading-none opacity-90">Coffession</h1>
                                </div>

                                <div className="relative z-10 my-auto flex flex-col items-center text-center px-1">
                                    <span className="text-7xl font-serif leading-none opacity-10 mb-2 font-black">"</span>
                                    <p className="text-2xl sm:text-3xl font-serif font-medium leading-tight tracking-wide italic drop-shadow-sm">{shareData.content}</p>
                                    <span className="text-7xl font-serif leading-none opacity-10 mt-4 rotate-180 font-black">"</span>
                                </div>

                                <div className="relative z-10 pb-6 w-full">
                                    <div className={`border-t border-current/20 pt-6 flex items-center justify-between`}>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Posted by</span>
                                            <span className="font-black text-sm uppercase tracking-wider">Anonymous</span>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full border border-current/20 flex items-center gap-2 ${THEMES[shareData.theme].accent} bg-opacity-10 backdrop-blur-sm`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">Secret</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 w-full">
                                <button onClick={() => handleDownload('download')} className="flex-1 bg-white text-black py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors shadow-xl">
                                    <Download size={18} /> Save
                                </button>
                                <button onClick={() => handleDownload('share')} className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:from-amber-600 hover:to-amber-700 transition-all shadow-xl">
                                    <Share2 size={18} /> Share
                                </button>
                                <button onClick={() => setShareData(null)} className="w-16 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md">
                                    <X size={24} />
                                </button>
                            </div>
                        </motion.div>

                        {/* 2. HIDDEN EXPORT CARD (Fixed Dimensions for Perfect Download) */}
                        {/* 540x960 is exactly 9:16 at a reasonable resolution. We double scale on export for 1080p */}
                        <div
                            id="hidden-export-card"
                            className={`fixed top-0 left-[-9999px] w-[540px] h-[960px] flex flex-col p-12 ${THEMES[shareData.theme].bg} ${THEMES[shareData.theme].text}`}
                        >
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                            <div className={`absolute inset-8 border-4 opacity-30 ${THEMES[shareData.theme].border}`} />

                            <div className="relative z-10 pt-10 flex flex-col items-center text-center">
                                <div className={`p-5 rounded-3xl mb-6 shadow-xl ${THEMES[shareData.theme].accent} bg-opacity-30`}>
                                    <Coffee size={48} className="text-current" strokeWidth={2.5} />
                                </div>
                                <h3 className="font-black text-sm tracking-[0.5em] uppercase opacity-50 mb-2">Extrovert.site</h3>
                                <h1 className="font-serif italic text-6xl font-black tracking-tight opacity-90">Coffession</h1>
                            </div>

                            <div className="relative z-10 my-auto flex flex-col items-center text-center px-4">
                                <span className="text-9xl font-serif leading-none opacity-10 mb-4 font-black">"</span>
                                <p className="text-5xl font-serif font-medium leading-tight tracking-wide italic drop-shadow-sm">
                                    {shareData.content}
                                </p>
                                <span className="text-9xl font-serif leading-none opacity-10 mt-6 rotate-180 font-black">"</span>
                            </div>

                            <div className="relative z-10 pb-8 w-full">
                                <div className={`border-t-2 border-current/20 pt-8 flex items-center justify-between`}>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Posted by</span>
                                        <span className="font-black text-xl uppercase tracking-wider">Anonymous</span>
                                    </div>
                                    <div className={`px-6 py-2 rounded-full border-2 border-current/20 flex items-center gap-3 ${THEMES[shareData.theme].accent} bg-opacity-10`}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-90">Secret #{Math.floor(Math.random() * 9000) + 1000}</span>
                                    </div>
                                </div>
                                <div className="mt-8 text-center">
                                    <p className="text-sm font-mono lowercase opacity-30 tracking-[0.3em]">extrovert.site/coffessions</p>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </AnimatePresence>

            {/* Create Modal (Same as before) */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-[#151515] rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">New Confession</h2>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
                                        <X size={20} className="text-stone-400" />
                                    </button>
                                </div>
                                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Spill the beans..." className="w-full h-32 p-4 rounded-xl bg-stone-50 dark:bg-[#1a1a1a] border-none focus:ring-1 focus:ring-amber-500 text-base text-stone-800 dark:text-stone-100 resize-none mb-4" maxLength={300} />
                                <div className="mb-6">
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(THEMES).map(([key, styles]) => (
                                            <button key={key} onClick={() => setNewTheme(key as any)} className={`relative h-12 rounded-xl transition-all flex items-center justify-center overflow-hidden ${newTheme === key ? 'ring-2 ring-amber-500 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                                                <div className={`absolute inset-0 ${styles.bg}`} />
                                                <span className={`z-10 text-[9px] font-bold ${styles.text} uppercase`}>{styles.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleCreate} disabled={!newContent.trim() || isPosting} className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
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