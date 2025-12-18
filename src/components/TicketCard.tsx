import { motion } from 'framer-motion';
import { Calendar, MapPin, QrCode } from 'lucide-react';

interface Ticket {
    id: string;
    event: {
        title: string;
        date: string;
        location: string;
        image: string;
        price: number;
        currency: string;
    };
    qr_code_data: string;
    status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
    created_at: string;
}

export default function TicketCard({ ticket }: { ticket: Ticket }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-all flex flex-row h-24 sm:h-28 group"
        >
            {/* Event Image (Left Stripe) */}
            <div className="w-24 sm:w-32 shrink-0 bg-gray-100 dark:bg-zinc-900 relative">
                <img
                    src={ticket.event.image || '/placeholder-event.jpg'}
                    alt={ticket.event.title}
                    className="w-full h-full object-cover"
                />
                <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${ticket.status === 'confirmed' ? 'bg-green-500 text-white' :
                    ticket.status === 'pending' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                    }`}>
                    {ticket.status === 'confirmed' ? 'Paid' : ticket.status}
                </div>
            </div>

            {/* Ticket Info */}
            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate mb-0.5">{ticket.event.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(ticket.event.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} /> {ticket.event.location}</span>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="font-mono text-[10px] text-gray-400 select-all">
                        ID: {ticket.id.split('-')[0]}...
                    </div>

                    <div className="flex items-center gap-1.5">
                        {ticket.status === 'confirmed' && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                <QrCode size={12} /> QR Ready
                            </div>
                        )}
                        {ticket.status === 'failed' && (
                            <span className="text-[10px] font-bold text-red-500">Failed</span>
                        )}
                        {ticket.status === 'pending' && (
                            <span className="text-[10px] font-bold text-yellow-600">Pending</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
