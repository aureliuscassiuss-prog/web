import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Settings, Calendar, Ticket, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import EventCard from './EventCard';
import EventDetailsModal from './EventDetailsModal';
import CreateEventModal from './CreateEventModal';
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
    const [events, setEvents] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [configData, setConfigData] = useState({ keyId: '', keySecret: '' });

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

            <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-8 sm:pt-20 pb-20">

                {/* Navbar Badge */}
                <div className="mb-8 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-2xl">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FourPointStar className="w-3 h-3 text-yellow-500" />
                        UniNotes Events
                    </span>
                </div>

                <div className="w-full max-w-5xl space-y-8 animate-fade-in-up">

                    {/* Header Section */}
                    <div className="text-center space-y-4 mb-10">
                        <h1 className="font-serif text-4xl sm:text-6xl text-slate-900 dark:text-white tracking-tight">
                            Campus <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-300 dark:via-cyan-200 dark:to-teal-300">Experiences</span>
                        </h1>
                        <p className="text-slate-600 dark:text-zinc-500 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                            Discover workshops, fests, and cultural events.
                        </p>
                    </div>

                    {/* MAIN CONSOLE (Border Beam Container) */}
                    <div className="relative w-full mx-auto group">
                        {/* --- BORDER BEAM --- */}
                        <div className="absolute -inset-[1px] rounded-[26px] sm:rounded-[34px] overflow-hidden pointer-events-none z-0">
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500%] h-[500%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_300deg,#3b82f6_330deg,#06b6d4_360deg)] opacity-100"
                                style={{ animationDuration: '6s' }}
                            />
                        </div>

                        {/* Content Box */}
                        <div className="relative bg-white dark:bg-[#09090b] rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none p-[2px]">
                            <div className="bg-slate-50 dark:bg-[#09090b] rounded-[22px] sm:rounded-[30px] min-h-[600px] flex flex-col">

                                {/* Console Header / Tabs */}
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                                    {/* Tabs */}
                                    <div className="flex bg-white dark:bg-zinc-900/50 p-1 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                        <button
                                            onClick={() => setView('browse')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'browse' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                        >
                                            Browse
                                        </button>
                                        <button
                                            onClick={() => setView('tickets')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'tickets' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                        >
                                            My Tickets
                                            {tickets.length > 0 && <span className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{tickets.length}</span>}
                                        </button>
                                        {isManager && (
                                            <button
                                                onClick={() => setView('manage')}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'manage' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                            >
                                                Manage
                                            </button>
                                        )}
                                    </div>

                                    {/* Manager Actions */}
                                    {isManager && view === 'manage' && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setShowConfig(true)} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 transition-colors">
                                                <Settings size={18} />
                                            </button>
                                            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                                                <Plus size={14} /> Create Event
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Content Grid */}
                                <div className="p-6 md:p-8 flex-1">
                                    {loading ? (
                                        <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                                            <TyreLoader size={40} />
                                            <p className="mt-4 text-xs text-gray-400 font-mono animate-pulse">Initializing System...</p>
                                        </div>
                                    ) : (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={view}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.2 }}
                                                className="h-full"
                                            >
                                                {/* EMPTY STATES */}
                                                {((view === 'tickets' && tickets.length === 0) || (view !== 'tickets' && events.length === 0)) && (
                                                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
                                                            {view === 'tickets' ? <Ticket className="text-gray-300 w-8 h-8" /> : <Calendar className="text-gray-300 w-8 h-8" />}
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                            {view === 'tickets' ? 'No Tickets Found' : 'No Events Active'}
                                                        </h3>
                                                        <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                                                            {view === 'tickets' ? "You haven't booked any tickets yet." : "Check back later for new events."}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* GRID DISPLAY */}
                                                <div className={`grid gap-4 ${view === 'tickets' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2'}`}>
                                                    {view === 'tickets'
                                                        ? tickets.map(t => <TicketCard key={t.id} ticket={t} />)
                                                        : events.map(e => (
                                                            <EventCard
                                                                key={e._id}
                                                                event={e}
                                                                onBook={() => setSelectedEvent(e)}
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
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-[10px] text-gray-400 dark:text-zinc-600">
                    <p>Powered by UniNotes Event Engine</p>
                </div>

            </div>

            {/* Modals & CSS */}
            <AnimatePresence>
                {selectedEvent && (
                    <EventDetailsModal
                        event={selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                        onBookingSuccess={() => {
                            setSelectedEvent(null);
                            setView('tickets');
                            fetchEvents();
                        }}
                    />
                )}
            </AnimatePresence>

            {showCreateModal && (
                <CreateEventModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchEvents}
                    token={token}
                />
            )}

            {/* Payment Config Modal */}
            {showConfig && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
                        {/* Modal Border Beam */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-xy" />

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
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">
                                Enter your <strong>Razorpay Test Keys</strong> below.
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Key ID</label>
                                <input
                                    type="text"
                                    value={configData.keyId}
                                    onChange={e => setConfigData({ ...configData, keyId: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                                    placeholder="rzp_test_..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Key Secret</label>
                                <input
                                    type="password"
                                    value={configData.keySecret}
                                    onChange={e => setConfigData({ ...configData, keySecret: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
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
            )}

            <style>{`
                @keyframes spin-beam {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }

                .animate-spin-slow {
                    animation: spin-beam 8s linear infinite;
                    transform-origin: center center;
                }
            `}</style>
        </div>
    );
}
