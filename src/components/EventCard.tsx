import { MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

interface Event {
    _id: string;
    title: string;
    description: string;
    image: string;
    date: string;
    location: string;
    price: number;
    currency: string;
    total_slots: number;
    booked_slots: number;
    registration_deadline: string;
    organizer: {
        name: string;
        avatar?: string;
    };
    status: string;
    accepted_payment_methods?: string[];
}

interface EventCardProps {
    event: Event;
    onBook: (event: Event) => void;
    isManager?: boolean;
    onDelete?: (id: string) => void;
}

export default function EventCard({ event, onBook, isManager, onDelete }: EventCardProps) {
    const availableSlots = (event.total_slots || 100) - (event.booked_slots || 0);
    const isSoldOut = availableSlots <= 0;
    const isDeadlinePassed = event.registration_deadline ? new Date() > new Date(event.registration_deadline) : false;
    const eventDate = new Date(event.date);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-row bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-all duration-300"
        >
            {/* Image Section (Compact Left) */}
            <div className="relative w-28 sm:w-36 shrink-0 bg-gray-100 dark:bg-gray-900">
                <img
                    src={event.image || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />

                {/* Price Tag (Small Overlay) */}
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white border border-white/10">
                    {event.currency === 'INR' ? '₹' : event.currency}{event.price}
                </div>

                {/* Manager Status Badge */}
                {isManager && event.status && event.status !== 'approved' && (
                    <div className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 backdrop-blur-sm rounded text-[8px] font-bold uppercase tracking-wider border ${event.status === 'pending'
                            ? 'bg-yellow-500/80 text-white border-yellow-400/50'
                            : 'bg-red-500/80 text-white border-red-400/50'
                        }`}>
                        {event.status}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {event.title}
                        </h3>
                        {/* Status Dot */}
                        <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${isSoldOut ? 'bg-red-500' : isDeadlinePassed ? 'bg-gray-400' : 'bg-green-500'}`} />
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                        <MapPin size={10} />
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                    <div className="text-[10px] font-medium text-gray-500">
                        {isSoldOut ? (
                            <span className="text-red-500">Sold Out</span>
                        ) : (
                            <span className={availableSlots < 10 ? 'text-orange-500' : 'text-green-600'}>
                                {availableSlots} left
                            </span>
                        )}
                    </div>

                    {isManager ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(event._id); }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:underline"
                        >
                            Delete
                        </button>
                    ) : (
                        <button
                            onClick={() => onBook(event)}
                            disabled={isSoldOut || isDeadlinePassed}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${isSoldOut || isDeadlinePassed
                                ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800'
                                : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80'
                                }`}
                        >
                            {isSoldOut ? 'Full' : isDeadlinePassed ? 'Closed' : 'Book'} <Ticket size={10} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
