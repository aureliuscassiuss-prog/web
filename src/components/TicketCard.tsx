import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, QrCode, Download, Loader2, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface Ticket {
    id: string;
    event: {
        title: string;
        date: string;
        location: string;
        image: string;
        price: number;
        currency: string;
        organizer?: { name: string };
    };
    qr_code_data: string;
    status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
    created_at: string;
}

export default function TicketCard({ ticket }: { ticket: Ticket }) {
    const ticketRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [qrUrl, setQrUrl] = useState<string>('');

    // Generate QR for display
    useState(() => {
        if (ticket.status === 'confirmed' && ticket.qr_code_data) {
            QRCode.toDataURL(ticket.qr_code_data).then(setQrUrl);
        }
    });

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        setDownloading(true);

        try {
            const canvas = await html2canvas(ticketRef.current, {
                scale: 2, // Higher resolution
                backgroundColor: null,
                useCORS: true // Allow cross-origin images
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2] // Match canvas aspect ratio
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`${ticket.event.title.replace(/\s+/g, '_')}_Ticket.pdf`);
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download ticket");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
        >
            {/* TICKET CONTAINER (Captured for PDF) */}
            <div
                ref={ticketRef}
                className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row relative max-w-2xl mx-auto sm:h-64"
            >
                {/* --- LEFT: Event Image & Main Info --- */}
                <div className="relative w-full sm:w-[65%] h-48 sm:h-full bg-gray-100 dark:bg-black overflow-hidden">
                    <img
                        src={ticket.event.image || '/placeholder-event.jpg'}
                        alt={ticket.event.title}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                        crossOrigin="anonymous" // Important for html2canvas
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                        <div className="mb-auto pt-2 grid grid-cols-2 gap-4 opacity-70 text-[10px] uppercase tracking-widest font-bold">
                            <div>
                                <span className="block text-white/50">Date</span>
                                {new Date(ticket.event.date).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="block text-white/50">Time</span>
                                {new Date(ticket.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none mb-2">{ticket.event.title}</h3>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                            <MapPin size={14} />
                            <span className="truncate">{ticket.event.location}</span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg ${ticket.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            ticket.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {ticket.status === 'confirmed' ? 'Admit One' : ticket.status}
                    </div>
                </div>

                {/* --- PERFORATION & DIVIDER (Visual only) --- */}
                <div className="hidden sm:block w-8 h-full bg-white dark:bg-zinc-900 relative z-10 -ml-4 skew-x-[-10deg] border-l border-dashed border-gray-300 dark:border-zinc-700 mx-[-1px]">
                    {/* Cutout circles */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#f8fafc] dark:bg-black" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#f8fafc] dark:bg-black" />
                </div>

                {/* --- RIGHT: Stub & QR --- */}
                <div className="flex-1 bg-white dark:bg-zinc-900 p-6 flex flex-col items-center justify-center text-center relative border-t sm:border-t-0 border-dashed border-gray-200 dark:border-zinc-800">
                    {/* QR Code */}
                    <div className="w-24 h-24 bg-white p-2 rounded-xl mb-4 shadow-sm border border-gray-100">
                        {qrUrl ? (
                            <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-xs text-gray-400">
                                {ticket.status === 'confirmed' ? <Loader2 className="animate-spin" /> : <QrCode />}
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Ticket ID</p>
                        <p className="font-mono text-xs font-bold text-gray-900 dark:text-white select-all">{ticket.id.split('-')[0]}</p>
                    </div>

                    {/* Stub Detail */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 w-full">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                            <span>{ticket.event.currency} {ticket.event.price}</span>
                            <span>{ticket.event.organizer?.name?.split(' ')[0] || 'Extrovert'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION BAR (Outside of printable area) */}
            <div className="absolute top-4 right-4 sm:top-auto sm:bottom-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                    onClick={handleDownload}
                    disabled={downloading || ticket.status !== 'confirmed'}
                    className="p-2.5 bg-white text-black dark:bg-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download Ticket"
                >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
            </div>
        </motion.div>
    )
}
