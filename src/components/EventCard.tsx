import { MapPin, Calendar, ExternalLink, Trash2 } from 'lucide-react';

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
    status?: string;
}

interface EventCardProps {
    event: Event;
    onClick: () => void;
    isOwner?: boolean;
    onDelete?: () => void;
}

export default function EventCard({ event, onClick, isOwner, onDelete }: EventCardProps) {
    const isFree = event.price === 0;
    const eventDate = new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });

    return (
        <div
            onClick={onClick}
            className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer duration-300 flex flex-col h-full"
        >
            {/* Status Badge (for managers) */}
            {isOwner && event.status && (
                <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${event.status === 'approved' ? 'bg-green-100 text-green-700' :
                    event.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {event.status}
                </div>
            )}

            {/* Delete Button (for owners) */}
            {isOwner && onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-black/50 text-red-500 hover:bg-red-50 rounded-full dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} />
                </button>
            )}

            {/* Image */}
            <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                    src={event.image || "/placeholder-event.jpg"}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1540575467063-178a5093dfd7?auto=format&fit=crop&q=80&w=2600&ixlib=rb-4.0.3")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Price Badge */}
                <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-lg font-bold">
                    {isFree ? 'Free' : `${event.currency} ${event.price}`}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white line-clamp-2">
                        {event.title}
                    </h3>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span>{eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>

                {/* Organizer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                            {event.organizer?.avatar ? (
                                <img src={event.organizer.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-indigo-500" />
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {event.organizer?.name || 'Unknown'}
                        </span>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                        Details <ExternalLink size={12} />
                    </span>
                </div>
            </div>
        </div>
    );
}

