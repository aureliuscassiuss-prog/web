import { useNavigate } from 'react-router-dom';
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
    location_url?: string;
    accepted_payment_methods?: string[];
}

interface EventCardProps {
    event: Event;
    onBook: (event: Event) => void;
    isManager?: boolean;
    onDelete?: (id: string) => void;
}


export default function EventCard({ event, onBook, isManager, onDelete }: EventCardProps) {
    const navigate = useNavigate();
    const availableSlots = (event.total_slots || 100) - (event.booked_slots || 0);
    const isSoldOut = availableSlots <= 0;
    const isDeadlinePassed = event.registration_deadline ? new Date() > new Date(event.registration_deadline) : false;
    const eventDate = new Date(event.date);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/events/${event._id}`)}
            className="group relative flex flex-col bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
        >
            {/* Image Section (Top, Wide) */}
            <div className="relative w-full h-48 sm:h-52 shrink-0 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <img
                    src={event.image || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Price Tag (Top Right) */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg text-xs font-bold text-gray-900 dark:text-white border border-white/20 shadow-sm">
                    {event.currency === 'INR' ? '₹' : event.currency}{event.price}
                </div>

                {/* Top Left Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {/* Manager Status Badge */}
                    {isManager && event.status && event.status !== 'approved' && (
                        <div className={`px-2 py-0.5 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${event.status === 'pending'
                            ? 'bg-yellow-500/90 text-white border-yellow-400/50'
                            : 'bg-red-500/90 text-white border-red-400/50'
                            }`}>
                            {event.status}
                        </div>
                    )}

                    {/* Category/Type Badge (Optional, using status for now if needed or just Location) */}
                    <div className="px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[10px] font-medium text-white border border-white/10 flex items-center gap-1">
                        <MapPin size={10} /> {event.location}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {event.title}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <span className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2">
                        {event.description?.replace(/<[^>]*>?/gm, '')}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-0">
                    <div className="flex items-center gap-2">
                        {/* Status Dot */}
                        <div className={`w-2 h-2 rounded-full ${isSoldOut ? 'bg-red-500' : isDeadlinePassed ? 'bg-gray-400' : 'bg-green-500'}`} />
                        <div className="text-xs font-medium text-gray-500">
                            {isSoldOut ? (
                                <span className="text-red-500">Sold Out</span>
                            ) : (
                                <span className={availableSlots < 10 ? 'text-orange-500' : 'text-green-600'}>
                                    {availableSlots} spots left
                                </span>
                            )}
                        </div>
                    </div>

                    {isManager ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(event._id); }}
                            className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    ) : (
                        <button
                            onClick={() => onBook(event)}
                            disabled={isSoldOut || isDeadlinePassed}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${isSoldOut || isDeadlinePassed
                                ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800'
                                : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80 hover:shadow-md'
                                }`}
                        >
                            {isSoldOut ? 'Full' : isDeadlinePassed ? 'Closed' : 'Book Now'} <Ticket size={12} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
