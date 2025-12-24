import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Download, Loader2, Clock, User } from 'lucide-react';
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
    useEffect(() => {
        if (ticket.status === 'confirmed' && ticket.qr_code_data) {
            QRCode.toDataURL(ticket.qr_code_data, { width: 256, margin: 2 }).then(setQrUrl);
        }
    }, [ticket.status, ticket.qr_code_data]);

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        setDownloading(true);

        try {
            const canvas = await html2canvas(ticketRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
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

    const eventDate = new Date(ticket.event.date);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative max-w-md mx-auto"
        >
            {/* TICKET CONTAINER (Captured for PDF) */}
            <div
                ref={ticketRef}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-black rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-zinc-800 relative"
            >
                {/* Status Badge - Top Right */}
                <div className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xl border shadow-lg ${ticket.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : ticket.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                    }`}>
                    {ticket.status === 'confirmed' ? '✓ Confirmed' : ticket.status}
                </div>

                {/* QR Code Section - Top */}
                <div className="relative bg-white dark:bg-zinc-950 p-8 flex flex-col items-center border-b-4 border-dashed border-gray-200 dark:border-zinc-800">
                    {/* QR Code */}
                    <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-xl border-4 border-gray-100 dark:border-zinc-800 mb-4">
                        {qrUrl ? (
                            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                {ticket.status === 'confirmed' ? (
                                    <Loader2 className="animate-spin text-gray-400" size={32} />
                                ) : (
                                    <div className="text-center text-xs text-gray-400">
                                        <MapPin size={24} className="mx-auto mb-2 opacity-30" />
                                        No QR
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ticket ID */}
                    <div className="text-center">
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1">Ticket ID</p>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-zinc-800 px-4 py-1 rounded-lg">
                            {ticket.id.substring(0, 12).toUpperCase()}
                        </p>
                    </div>
                </div>

                {/* Event Details Section */}
                <div className="p-6 space-y-4">
                    {/* Event Title */}
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-1">
                            {ticket.event.title}
                        </h3>
                        {ticket.event.organizer?.name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                                <User size={12} />
                                {ticket.event.organizer.name}
                            </p>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Date */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Date</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Time */}
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 border border-purple-100 dark:border-purple-900/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={14} className="text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Time</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {/* Location */}
                        <div className="col-span-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 border border-rose-100 dark:border-rose-900/50">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin size={14} className="text-rose-600 dark:text-rose-400" />
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Venue</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {ticket.event.location}
                            </p>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Amount Paid</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">
                            {ticket.event.currency === 'INR' ? '₹' : ticket.event.currency}{ticket.event.price}
                        </span>
                    </div>
                </div>

                {/* Watermark */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-5 dark:opacity-10 pointer-events-none">
                    <p className="text-6xl font-black text-gray-900 dark:text-white">TICKET</p>
                </div>
            </div>

            {/* Download Button - Floating */}
            {ticket.status === 'confirmed' && (
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 z-30"
                >
                    {downloading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download size={18} />
                            Download PDF
                        </>
                    )}
                </button>
            )}
        </motion.div>
    );
}
