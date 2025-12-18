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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-300"
        >
            {/* Image Section */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img
                    src={event.image || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                {/* Price Tag */}
                <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-full shadow-lg border border-white/20">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {event.currency} {event.price}
                    </span>
                </div>

                {/* Status Badges */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                    {isSoldOut ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white shadow-sm">
                            Sold Out
                        </span>
                    ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${availableSlots < 10 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                            {availableSlots} Spots Left
                        </span>
                    )}
                    {isDeadlinePassed && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500 text-white shadow-sm">
                            Registration Closed
                        </span>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-3">
                {/* Title & Organizer */}
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>by {event.organizer?.name || 'Unknown'}</span>
                    </div>
                </div>

                {/* Meta Details */}
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <Calendar size={12} className="text-gray-400" />
                        <span>{eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <Clock size={12} className="text-gray-400" />
                        <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-1">
                    {isManager ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(event._id); }}
                            className="w-full py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 text-xs font-semibold transition-colors"
                        >
                            Delete Event
                        </button>
                    ) : (
                        <button
                            onClick={() => onBook(event)}
                            disabled={isSoldOut || isDeadlinePassed}
                            className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all ${isSoldOut || isDeadlinePassed
                                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm'
                                }`}
                        >
                            <Ticket size={14} />
                            {isSoldOut ? 'Sold Out' : isDeadlinePassed ? 'Closed' : 'Book Ticket'}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
