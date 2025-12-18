import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Settings, LayoutGrid, Calendar, Ticket, ArrowRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import EventCard from './EventCard';
import EventDetailsModal from './EventDetailsModal';
import CreateEventModal from './CreateEventModal';
import TyreLoader from './TyreLoader';
import TicketCard from './TicketCard';

export default function EventsPage() {
    const { user, token } = useAuth();
    const [view, setView] = useState<'browse' | 'tickets' | 'manage'>('browse');
    const [events, setEvents] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Payment Config State
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
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/events?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setEvents(prev => prev.filter(e => e._id !== id));
            } else {
                alert("Failed to delete event");
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
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#020817]">
            {/* Hero Header */}
            <div className="relative pt-32 pb-20 overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-zinc-900">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white backdrop-blur-sm"
                            >
                                <Sparkles size={12} className="text-yellow-500" />
                                {view === 'tickets' ? 'My Wallet' : 'University Experiences'}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-6xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent tracking-tight"
                            >
                                {view === 'tickets' ? 'My Tickets' : view === 'manage' ? 'Event Dashboard' : 'Discover Events'}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed font-medium"
                            >
                                {view === 'tickets'
                                    ? 'Access your QR codes and booking details for upcoming events.'
                                    : 'Explore workshops, cultural festivals, and tech summits happening on campus.'}
                            </motion.p>
                        </div>

                        {/* Navigation Tabs */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gray-100/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl flex items-center gap-1 border border-gray-200 dark:border-zinc-800 backdrop-blur-md"
                        >
                            <button
                                onClick={() => setView('browse')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${view === 'browse' ? 'text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                            >
                                {view === 'browse' && (
                                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-black rounded-xl" />
                                )}
                                <span className="relative z-10">Browse</span>
                            </button>
                            <button
                                onClick={() => setView('tickets')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${view === 'tickets' ? 'text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                            >
                                {view === 'tickets' && (
                                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-black rounded-xl" />
                                )}
                                <span className="relative z-10 flex items-center gap-2">My Tickets</span>
                            </button>
                            {isManager && (
                                <button
                                    onClick={() => setView('manage')}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${view === 'manage' ? 'text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                                >
                                    {view === 'manage' && (
                                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-black rounded-xl" />
                                    )}
                                    <span className="relative z-10">Manage</span>
                                </button>
                            )}
                        </motion.div>
                    </div>

                    {/* Manager Actions Bar */}
                    {isManager && view === 'manage' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between"
                        >
                            <div className="text-sm text-gray-500 font-medium">
                                You are managing events as <span className="text-gray-900 dark:text-white font-bold">Admin / Manager</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowConfig(true)}
                                    className="px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm font-bold flex items-center gap-2"
                                >
                                    <Settings size={16} /> Configure Payments
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                                >
                                    <Plus size={18} /> Create New Event
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center">
                        <TyreLoader size={48} />
                        <p className="mt-4 text-sm text-gray-400 font-medium animate-pulse">Loading amazing experiences...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* EMPTY STATES */}
                            {((view === 'tickets' && tickets.length === 0) || (view !== 'tickets' && events.length === 0)) && (
                                <div className="text-center py-32 bg-white dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        {view === 'tickets' ? <Ticket size={32} className="text-gray-400" /> : <Calendar size={32} className="text-gray-400" />}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {view === 'tickets' ? 'No Tickets Yet' : 'No Events Found'}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 text-lg">
                                        {view === 'tickets'
                                            ? "You haven't booked any events yet. Check out what's happening on campus!"
                                            : "There are no upcoming events at the moment. Please check back later."}
                                    </p>
                                    {view === 'tickets' && (
                                        <button
                                            onClick={() => setView('browse')}
                                            className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            Explore Events <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* GRID LAYOUT */}
                            {view === 'tickets' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {tickets.map(ticket => (
                                        <TicketCard key={ticket.id} ticket={ticket} />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                    {events.map(event => (
                                        <EventCard
                                            key={event._id}
                                            event={event}
                                            onBook={() => setSelectedEvent(event)}
                                            isManager={view === 'manage'}
                                            onDelete={() => handleDelete(event._id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Modals */}
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
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Setup</h3>
                                <p className="text-xs text-gray-500 font-medium">Configure Razorpay credentials</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Key ID</label>
                                <input
                                    type="text"
                                    value={configData.keyId}
                                    onChange={e => setConfigData({ ...configData, keyId: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
                                    placeholder="rzp_test_..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Key Secret</label>
                                <input
                                    type="password"
                                    value={configData.keySecret}
                                    onChange={e => setConfigData({ ...configData, keySecret: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
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
                                className="px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
