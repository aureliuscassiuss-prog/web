import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, Zap, Plus, X, Share2, Download, TrendingUp, Hash, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import html2canvas from 'html2canvas';

// --- Types & Configuration ---

interface Coffession {
    id: string;
    content: string;
    theme: 'espresso' | 'latte' | 'mocha' | 'cappuccino';
    likes: number;
    dislikes: number;
    created_at: string;
}

// Neo-Brutalist Theme Configuration
const THEMES = {
    espresso: {
        id: 'espresso',
        label: 'DARK.MODE',
        bg: 'bg-zinc-900',
        text: 'text-lime-400', // Hacker terminal vibe
        border: 'border-lime-400',
        shadow: 'shadow-[8px_8px_0px_0px_#84cc16]', // Lime shadow
        decor: 'pattern-grid-sm text-zinc-800'
    },
    latte: {
        id: 'latte',
        label: 'RAW_PAPER',
        bg: 'bg-[#fffdf5]',
        text: 'text-black',
        border: 'border-black',
        shadow: 'shadow-[8px_8px_0px_0px_#000000]',
        decor: ''
    },
    mocha: {
        id: 'mocha',
        label: 'BLUEPRINT',
        bg: 'bg-blue-600',
        text: 'text-white',
        border: 'border-white',
        shadow: 'shadow-[8px_8px_0px_0px_#000000]',
        decor: 'pattern-dots text-blue-500'
    },
    cappuccino: {
        id: 'cappuccino',
        label: 'WARNING',
        bg: 'bg-yellow-400',
        text: 'text-black',
        border: 'border-black',
        shadow: 'shadow-[8px_8px_0px_0px_#be185d]', // Pink shadow on yellow
        decor: 'pattern-diagonal-lines text-yellow-500'
    }
};

// --- Components ---

const BrutalButton = ({ children, onClick, className = "", variant = "primary" }: any) => {
    const base = "relative font-mono font-bold uppercase tracking-wider border-2 border-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
    const styles = variant === "primary"
        ? "bg-black text-white shadow-[4px_4px_0px_0px_#84cc16] hover:bg-zinc-800"
        : "bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:bg-gray-50";

    return (
        <button onClick={onClick} className={`${base} ${styles} px-6 py-3 ${className}`}>
            {children}
        </button>
    );
};

export default function CoffessionsPage() {
    const { token } = useAuth();
    const [coffessions, setCoffessions] = useState<Coffession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState<'new' | 'trending'>('new');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [shareData, setShareData] = useState<Coffession | null>(null);

    // Create Form
    const [newContent, setNewContent] = useState('');
    const [newTheme, setNewTheme] = useState<keyof typeof THEMES>('latte');

    // State
    const [votes, setVotes] = useState<Record<string, 'like' | 'dislike'>>({});

    // Refs for sticker tilt effect
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchCoffessions();
        const saved = localStorage.getItem('votes_v2');
        if (saved) setVotes(JSON.parse(saved));
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

    const handleVote = async (id: string) => {
        // Prevent double voting for now (or implement toggle if desired, but Brutalist UI implies simple upvote usually)
        if (votes[id]) return;

        // Optimistic Update
        setVotes(prev => ({ ...prev, [id]: 'like' }));
        setCoffessions(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
        localStorage.setItem('votes_v2', JSON.stringify({ ...votes, [id]: 'like' }));

        try {
            await fetch(`/api/coffessions?action=vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ id, changes: { likes: 1, dislikes: 0 } })
            });
        } catch (e) {
            console.error('Vote failed', e);
            // Revert on error would go here
        }
    };

    const handleCreate = async () => {
        if (!newContent.trim()) return;
        if (!token) {
            alert("Please sign in to post.");
            return;
        }

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
        }
    };

    return (
        <div className="min-h-screen bg-[#e0e7ff] text-black font-sans selection:bg-lime-400 selection:text-black overflow-x-hidden">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            {/* --- Navbar --- */}
            <nav className="sticky top-0 z-40 bg-[#e0e7ff]/90 backdrop-blur-sm border-b-4 border-black py-4">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-2 select-none group">
                        <div className="bg-black text-white p-2 border-2 border-transparent group-hover:border-lime-400 transition-colors">
                            <Coffee size={24} strokeWidth={3} />
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase hidden sm:block">
                            COFFESSIONS<span className="text-lime-600">_v3</span>
                        </h1>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4">
                        <div className="hidden md:flex bg-white border-2 border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                            <button
                                onClick={() => setSort('new')}
                                className={`px-4 py-1 font-mono font-bold text-sm transition-colors ${sort === 'new' ? 'bg-black text-lime-400' : 'hover:bg-gray-100'}`}
                            >
                                FRESH
                            </button>
                            <button
                                onClick={() => setSort('trending')}
                                className={`px-4 py-1 font-mono font-bold text-sm transition-colors ${sort === 'trending' ? 'bg-black text-lime-400' : 'hover:bg-gray-100'}`}
                            >
                                HOT
                            </button>
                        </div>

                        <BrutalButton onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 !py-2">
                            <Plus size={20} strokeWidth={4} />
                            <span className="hidden sm:inline">WRITE</span>
                        </BrutalButton>
                    </div>
                </div>
            </nav>

            {/* --- Marquee Header --- */}
            <div className="bg-lime-400 border-b-4 border-black overflow-hidden whitespace-nowrap py-2">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="inline-block font-mono font-bold text-lg"
                >
                    ANONYMOUS CONFESSIONS /// NO JUDGMENT /// SPILL THE BEANS /// ANONYMOUS CONFESSIONS /// NO JUDGMENT /// SPILL THE BEANS ///
                </motion.div>
            </div>

            {/* --- Main Grid --- */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin text-black">
                            <Coffee size={64} strokeWidth={1} />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {coffessions.map((post, i) => {
                                const theme = THEMES[post.theme];
                                const rotate = i % 2 === 0 ? 'rotate-1' : '-rotate-1';

                                return (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        whileHover={{ scale: 1.02, rotate: 0, transition: { type: "spring", stiffness: 300 } }}
                                        className={`
                                            relative flex flex-col justify-between p-6 min-h-[300px]
                                            border-4 ${theme.border} ${theme.bg} ${theme.text} ${theme.shadow}
                                            ${rotate} transition-transform
                                        `}
                                    >
                                        {/* Decorative Tape/Header */}
                                        <div className="flex justify-between items-start mb-6 border-b-2 border-current pb-2 border-dashed">
                                            <div className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Hash size={14} />
                                                {theme.label}
                                            </div>
                                            <div className="font-mono text-xs opacity-70">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-grow font-bold text-2xl leading-tight font-sans tracking-tight mb-8">
                                            {post.content}
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t-4 border-current">
                                            <button
                                                onClick={() => handleVote(post.id)}
                                                className={`
                                                    flex items-center gap-2 px-4 py-2 font-mono font-bold border-2 border-current
                                                    transition-all active:translate-y-1 hover:bg-black/10
                                                    ${votes[post.id] ? 'bg-black text-white' : ''}
                                                `}
                                            >
                                                <Heart size={18} className={votes[post.id] ? "fill-white" : ""} />
                                                {post.likes}
                                            </button>

                                            <button
                                                onClick={() => setShareData(post)}
                                                className="p-2 border-2 border-current hover:bg-black/10 transition-colors"
                                            >
                                                <Share2 size={20} />
                                            </button>
                                        </div>

                                        {/* Badge for popular posts */}
                                        {post.likes > 50 && (
                                            <div className="absolute -top-4 -right-4 bg-red-500 text-white border-2 border-black px-3 py-1 font-black uppercase text-sm -rotate-12 shadow-[4px_4px_0px_0px_#000]">
                                                Viral
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* --- Create Modal (The Clipboard) --- */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-white w-full max-w-lg border-4 border-black shadow-[12px_12px_0px_0px_#000] p-0 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="bg-black text-white p-4 flex justify-between items-center">
                                <h2 className="text-2xl font-black italic uppercase">New Entry</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="hover:text-red-500 transition-colors">
                                    <X size={32} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="p-6 sm:p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="TYPE YOUR CONFESSION HERE..."
                                    maxLength={280}
                                    className="w-full h-48 bg-white border-2 border-black p-4 font-mono text-lg placeholder:text-gray-300 focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] focus:-translate-y-1 transition-all resize-none mb-6"
                                    autoFocus
                                />

                                <div className="mb-8">
                                    <label className="block font-black text-sm uppercase mb-3">Select Aesthetic</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(key => (
                                            <button
                                                key={key}
                                                onClick={() => setNewTheme(key)}
                                                className={`
                                                    h-12 border-2 border-black transition-all relative overflow-hidden group
                                                    ${THEMES[key].bg}
                                                    ${newTheme === key ? 'shadow-[4px_4px_0px_0px_#000] -translate-y-1' : 'opacity-50 hover:opacity-100'}
                                                `}
                                            >
                                                {newTheme === key && <div className="absolute inset-0 flex items-center justify-center"><Zap size={20} className={key === 'espresso' ? 'text-lime-400' : 'text-black'} fill="currentColor" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <BrutalButton onClick={handleCreate} className="w-full text-lg">
                                    PUBLISH TO GRID
                                </BrutalButton>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Share Modal (The Ticket) --- */}
            <AnimatePresence>
                {shareData && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/90" onClick={() => setShareData(null)}>
                        <div className="flex flex-col gap-6 items-center w-full max-w-md" onClick={e => e.stopPropagation()}>

                            {/* The Capture Node */}
                            <div
                                id="share-ticket"
                                className={`
                                    w-full aspect-[4/5] p-8 flex flex-col justify-between relative
                                    border-4 ${THEMES[shareData.theme].border} ${THEMES[shareData.theme].bg} ${THEMES[shareData.theme].text}
                                `}
                            >
                                <div className="absolute top-4 right-4 opacity-20">
                                    <Coffee size={120} strokeWidth={1} />
                                </div>

                                <div className="relative z-10 border-b-4 border-current pb-4 mb-4">
                                    <h3 className="text-4xl font-black italic uppercase leading-none">
                                        The<br />Tea.
                                    </h3>
                                </div>

                                <div className="relative z-10 flex-grow flex items-center">
                                    <p className="font-mono text-2xl font-bold leading-snug">
                                        "{shareData.content}"
                                    </p>
                                </div>

                                <div className="relative z-10 pt-4 border-t-4 border-current flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase mb-1">Source</span>
                                        <span className="font-black text-xl">EXTROVERT.SITE</span>
                                    </div>
                                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center border-2 border-white">
                                        <ArrowRight size={32} className="-rotate-45" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 w-full">
                                <BrutalButton
                                    className="flex-1 flex justify-center items-center gap-2"
                                    onClick={() => {
                                        const el = document.getElementById('share-ticket');
                                        if (el) {
                                            html2canvas(el).then(canvas => {
                                                const link = document.createElement('a');
                                                link.download = 'brutal-confession.png';
                                                link.href = canvas.toDataURL();
                                                link.click();
                                            });
                                        }
                                    }}
                                >
                                    <Download size={20} /> SAVE
                                </BrutalButton>
                                <button onClick={() => setShareData(null)} className="w-14 h-14 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#fff] flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                                    <X size={24} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}