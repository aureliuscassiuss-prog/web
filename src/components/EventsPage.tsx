import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Settings, LayoutGrid, Calendar } from 'lucide-react';
import EventCard from './EventCard';
import EventDetailsModal from './EventDetailsModal';
import CreateEventModal from './CreateEventModal';
import TyreLoader from './TyreLoader';

export default function EventsPage() {
    const { user, token } = useAuth();
    const [view, setView] = useState<'browse' | 'manage'>('browse');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // For Payment Config (Simple prompt for now)
    const [showConfig, setShowConfig] = useState(false);
    const [configData, setConfigData] = useState({ keyId: '', keySecret: '' });

    const isManager = (user as any)?.role === 'event-manager' || user?.role === 'admin';

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // If in manage view, fetch my events
            const endpoint = view === 'manage' ? '/api/events?action=manager' : '/api/events';
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(endpoint, { headers });
            const data = await res.json();

            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [view, token]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
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
                alert("Payment configuration saved!");
                setShowConfig(false);
            } else {
                alert("Failed to save configuration");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#020817]">
            {/* Header */}
            <div className="relative pt-32 pb-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-900/30 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
                                <Calendar className="w-3.5 h-3.5" />
                                University Events
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                                Discover Experiences
                            </h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                                Join workshops, hackathons, and cultural fests happening around you.
                            </p>
                        </div>

                        {/* Manager Actions */}
                        {isManager && (
                            <div className="flex items-center gap-3">
                                {/* Toggle View */}
                                <div className="p-1 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center border border-gray-200 dark:border-gray-800">
                                    <button
                                        onClick={() => setView('browse')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'browse' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        Browse
                                    </button>
                                    <button
                                        onClick={() => setView('manage')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'manage' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        My Dashboard
                                    </button>
                                </div>

                                {view === 'manage' && (
                                    <>
                                        <button
                                            onClick={() => setShowConfig(true)}
                                            className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            title="Payment Settings"
                                        >
                                            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <Plus size={20} />
                                            <span className="hidden sm:inline">Create Event</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-20">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center">
                        <TyreLoader size={48} />
                        <p className="mt-4 text-sm text-gray-400 font-medium animate-pulse">Loading Events...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No events found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {view === 'manage'
                                ? "You haven't created any events yet. Click 'Create Event' to get started."
                                : "There are no upcoming events at the moment. Check back later!"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {events.map(event => (
                            <EventCard
                                key={event._id}
                                event={event}
                                onClick={() => setSelectedEvent(event)}
                                isOwner={view === 'manage'}
                                onDelete={() => handleDelete(event._id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <EventDetailsModal
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onBuy={(evt) => alert(`Redirecting to payment gateway for ${evt.title}... (Integration Pending)`)}
            />

            {showCreateModal && (
                <CreateEventModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchEvents}
                />
            )}

            {/* Quick Payment Config Modal (Inline for MVP) */}
            {showConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment Gateway Setup</h3>
                        <p className="text-xs text-gray-500 mb-4">Enter your Razorpay API Keys to accept payments directly.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Key ID</label>
                                <input
                                    type="text"
                                    value={configData.keyId}
                                    onChange={e => setConfigData({ ...configData, keyId: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm"
                                    placeholder="rzp_test_..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Key Secret</label>
                                <input
                                    type="password"
                                    value={configData.keySecret}
                                    onChange={e => setConfigData({ ...configData, keySecret: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowConfig(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Cancel</button>
                            <button onClick={handleSaveConfig} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold">Save Keys</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
