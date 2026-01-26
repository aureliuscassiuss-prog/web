import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Settings, Calendar, Ticket, Search, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import EventCard from './EventCard';

// import CreateEventModal from './CreateEventModal';
import TyreLoader from './TyreLoader';
import TicketCard from './TicketCard';


// Custom Star Icon for animations
const FourPointStar = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" stroke="none" />
    </svg>
);

export default function EventsPage() {
    const { user, token } = useAuth();
    const [view, setView] = useState<'browse' | 'tickets' | 'manage'>('browse');
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [configData, setConfigData] = useState({ keyId: '', keySecret: '' });

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'trending'>('all');

    const isManager = (user as any)?.role === 'event-manager' || user?.role === 'admin';

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let endpoint = '/api/events';
            if (view === 'manage') endpoint = '/api/events?action=manager';
            else if (view === 'tickets') endpoint = '/api/events?action=tickets';

            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(endpoint, { headers });
            const data = await res.json();

            if (view === 'tickets') {
                setTickets(data.tickets || []);
            } else {
                setEvents(data.events || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'manage' && !isManager) {
            setView('browse');
            return;
        }
        fetchEvents();
    }, [view, token, isManager]);

    // --- Search & Filter Logic ---
    const getFilteredEvents = () => {
        let filtered = [...events];

        // 1. Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.title?.toLowerCase().includes(query) ||
                e.description?.toLowerCase().includes(query) ||
                e.location?.toLowerCase().includes(query) ||
                e.organizer?.name?.toLowerCase().includes(query)
            );
        }

        // 2. Trending Filter
        if (filterType === 'trending') {
            filtered.sort((a, b) => (b.booked_slots || 0) - (a.booked_slots || 0));
        }

        return filtered;
    };

    const filteredEvents = getFilteredEvents();

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            const res = await fetch(`/api/events?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setEvents(prev => prev.filter(e => e._id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveConfig = async () => {
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'save-config',
                    keyId: configData.keyId,
                    keySecret: configData.keySecret
                })
            });
            if (res.ok) {
                alert("Payment configuration saved successfully!");
                setShowConfig(false);
            } else {
                alert("Failed to save configuration");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white relative overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-500">

            {/* STARS: Background (Dark Mode Only) */}
            <div className="absolute inset-0 z-0 hidden dark:block pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 2}px`,
                            height: `${Math.random() * 2}px`,
                            opacity: Math.random() * 0.4 + 0.1,
                            animationDuration: `${Math.random() * 5 + 3}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center min-h-screen pb-20">

                {/* Navbar Badge - Adjusted spacing */}
                <div className="mt-8 mb-6 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-2xl">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FourPointStar className="w-3 h-3 text-yellow-500" />
                        Extrovert Events
                    </span>
                </div>

                {/* Header Title */}
                <div className="text-center mb-10 px-4 relative">
                    <h1 className="font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-zinc-500 opacity-5 pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full whitespace-nowrap text-center">
                        EXTROVERT
                    </h1>
                    <h1 className="relative font-serif text-4xl sm:text-6xl text-slate-900 dark:text-white tracking-tight z-10">
                        Extrovert <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400">Events</span>
                    </h1>
                    <p className="relative z-10 text-slate-500 dark:text-zinc-400 text-sm sm:text-lg max-w-lg mx-auto mt-4 font-light">
                        Discover the most happening cultural fests.
                    </p>
                </div>

                {/* MAIN CONTENT AREA - Removed border/container styles for broader look */}
                <div className="w-full max-w-[1600px] mx-auto animate-fade-in-up">

                    {/* Control Bar (Tabs & Search) */}
                    <div className="px-4 sm:px-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="inline-flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
                            <button
                                onClick={() => setView('browse')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${view === 'browse' ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                Browse
                            </button>
                            <button
                                onClick={() => setView('tickets')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${view === 'tickets' ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                My Tickets
                            </button>
                            {isManager && (
                                <button
                                    onClick={() => setView('manage')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${view === 'manage' ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Manage
                                </button>
                            )}
                        </div>

                        {/* Search & Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {view === 'browse' && (
                                <>
                                    <div className="relative flex-1 md:w-64">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search events..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-gray-100 dark:bg-zinc-900/50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setFilterType(filterType === 'all' ? 'trending' : 'all')}
                                        className={`p-2.5 rounded-xl border transition-all ${filterType === 'trending' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-transparent bg-gray-100 dark:bg-zinc-900 text-gray-500'}`}
                                        title="Toggle Trending"
                                    >
                                        <TrendingUp size={18} />
                                    </button>
                                </>
                            )}

                            {isManager && view === 'manage' && (
                                <>
                                    <button
                                        onClick={() => setShowConfig(true)}
                                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-900 text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => navigate('/events/create')}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        <Plus size={16} /> Create
                                    </button>
                                </>
                            )}
                        </div>
                    </div>




                    {/* Content Grid */}
                    <div className="px-4 sm:px-8">
                        {loading && <TyreLoader fullScreen={true} size={50} />}

                        {!loading && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={view + filterType + searchQuery}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="min-h-[400px]"
                                >
                                    {((view === 'tickets' && tickets.length === 0) || (view !== 'tickets' && filteredEvents.length === 0)) && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                                {view === 'tickets' ? <Ticket className="text-gray-400" /> : <Calendar className="text-gray-400" />}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nothing here yet</h3>
                                            <p className="text-gray-500 text-sm">
                                                {view === 'tickets' ? "You haven't booked any tickets." : "No events match your criteria."}
                                            </p>
                                        </div>
                                    )}

                                    <div className={`grid gap-6 ${view === 'tickets' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                        {view === 'tickets'
                                            ? tickets.map(t => <TicketCard key={t.id} ticket={t} />)
                                            : filteredEvents.map(e => (
                                                <EventCard
                                                    key={e._id}
                                                    event={e}
                                                    onBook={() => navigate(`/events/${e._id}`)}
                                                    isManager={view === 'manage'}
                                                    onDelete={() => handleDelete(e._id)}
                                                />
                                            ))
                                        }
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-[10px] text-gray-400 dark:text-zinc-600 pb-8">
                <p>Powered by Extrovert Engines</p>
            </div>

            {/* Modal removed - using page */}

            {/* Payment Config Modal */}
            {
                showConfig && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Settings size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Setup</h3>
                                    <p className="text-xs text-gray-500 font-medium">Razorpay Configuration</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Key ID</label>
                                    <input
                                        type="text"
                                        value={configData.keyId}
                                        onChange={e => setConfigData({ ...configData, keyId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition-all font-mono"
                                        placeholder="rzp_test_..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Key Secret</label>
                                    <input
                                        type="password"
                                        value={configData.keySecret}
                                        onChange={e => setConfigData({ ...configData, keySecret: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition-all font-mono"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowConfig(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveConfig}
                                    className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                    Save Keys
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}