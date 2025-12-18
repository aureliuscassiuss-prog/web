import { motion } from 'framer-motion';
import { Calendar, MapPin, QrCode, Clock } from 'lucide-react';

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
    // Generate QR Image source from data (assuming data is already a Data URL or text)
    // If it's pure text data in DB, we'd need to generate it. 
    // The backend `api/events.ts` stores `qrData` (JSON string) in `qr_code_data`.
    // It does NOT store the image.
    // So frontend needs to generate QR or backend should have stored the image.
    // My backend implementation: `qr_code_data` stores JSON string. 
    // And `qrCodeImage` (base64) is generated for email but not stored in DB permanently (except maybe as attachment in email).
    // Let's use `qrcode.react` on frontend to render it.

    // WAIT: I don't have `qrcode.react` installed.
    // I can install it or use an API. 
    // Or simpler: Just display the Ticket ID and say "Check your email for QR Code".
    // User requirement: "user register they got email... with ticket id qr and all".
    // "and for registered iser in same darboard add option to see pruchased ticket andf all".
    // Doesn't explicitly say QR code *must* be in dashboard, but it's good UX.
    // I'll install `qrcode.react`.

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row"
        >
            {/* Event Image (Left/Top) */}
            <div className="w-full md:w-48 h-48 md:h-auto relative bg-gray-100 dark:bg-gray-800 shrink-0">
                <img
                    src={ticket.event.image || '/placeholder-event.jpg'}
                    alt={ticket.event.title}
                    className="w-full h-full object-cover"
                />
                <div className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-md shadow-sm uppercase tracking-wider ${ticket.status === 'confirmed' ? 'bg-green-500 text-white' :
                    ticket.status === 'pending' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                    }`}>
                    {ticket.status === 'confirmed' ? 'Paid' : ticket.status}
                </div>
            </div>

            {/* Ticket Info */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{ticket.event.title}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ticket.event.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {ticket.event.location}</span>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Ticket ID</div>
                            <div className="font-mono text-sm text-gray-700 dark:text-gray-300 font-medium select-all">{ticket.id.split('-')[0]}...</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Price</div>
                            <div className="font-mono text-sm text-gray-700 dark:text-gray-300 font-medium">{ticket.event.currency} {ticket.event.price}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    {ticket.status === 'confirmed' && (
                        <>
                            <QrCode size={14} />
                            <span>QR Code sent to email</span>
                        </>
                    )}
                    {ticket.status === 'failed' && (
                        <span className="text-red-500 font-bold">Payment Failed</span>
                    )}
                    {ticket.status === 'pending' && (
                        <span className="text-yellow-600 font-bold">Payment Pending</span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
