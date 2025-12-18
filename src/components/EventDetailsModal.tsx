import { X, Calendar, MapPin, Ticket } from 'lucide-react';

interface Event {
    _id: string;
    title: string;
    description: string;
    image: string;
    date: string;
    location: string;
    price: number;
    currency: string;
    organizer: {
        name: string;
        avatar?: string;
    };
}

interface EventDetailsModalProps {
    event: Event | null;
    onClose: () => void;
    onBuy: (event: Event) => void;
}

export default function EventDetailsModal({ event, onClose, onBuy }: EventDetailsModalProps) {
    if (!event) return null;

    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = eventDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-white dark:bg-gray-950 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left Side: Image */}
                <div className="w-full md:w-2/5 relative h-64 md:h-auto">
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1540575467063-178a5093dfd7?auto=format&fit=crop&q=80&w=2600&ixlib=rb-4.0.3")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/50" />
                </div>

                {/* Right Side: Content */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                            Event Ticket
                        </span>
                        {event.price === 0 && (
                            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                                Free Entry
                            </span>
                        )}
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                        {event.title}
                    </h2>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <Calendar className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Date & Time</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{dateStr} • {timeStr}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <MapPin className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Location</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{event.location}</p>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none mb-8 text-gray-600 dark:text-gray-300">
                        <p>{event.description}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex-1 w-full">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Price</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {event.currency} {event.price}
                            </div>
                        </div>

                        <button
                            onClick={() => onBuy(event)}
                            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <Ticket size={20} />
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
