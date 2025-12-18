import { useRef, useState } from 'react';
import { X, Calendar, MapPin, Ticket, Clock, Info, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import TyreLoader from './TyreLoader';

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
    accepted_payment_methods: string[];
    organizer: {
        name: string;
        avatar?: string;
    };
}

export default function EventDetailsModal({ event, onClose, onBookingSuccess }: { event: Event | null, onClose: () => void, onBookingSuccess: () => void }) {
    const { user, token } = useAuth();
    const [step, setStep] = useState<'details' | 'payment'>('details');
    const [selectedGateway, setSelectedGateway] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!event) return null;

    const availableSlots = (event.total_slots || 100) - (event.booked_slots || 0);
    const isSoldOut = availableSlots <= 0;
    const isDeadlinePassed = event.registration_deadline ? new Date() > new Date(event.registration_deadline) : false;

    const handleBook = async () => {
        if (!process.env.NODE_ENV && !user) return; // Should be protected anyway

        setIsProcessing(true);
        try {
            // Mock payment process or real integration depending on gateway
            // For MVP: Direct booking

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'book-ticket',
                    eventId: event._id,
                    gateway: selectedGateway,
                    paymentData: { method: 'mock', payment_id: 'mock_' + Date.now() } // Mock verification
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Ticket booked successfully! Check your email for QR code.");
                onBookingSuccess();
                onClose();
            } else {
                alert(data.message || "Booking failed");
            }

        } catch (error) {
            console.error(error);
            alert("Payment failed");
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header (Image) */}
                <div className="relative h-48 md:h-64 shrink-0 bg-gray-100 dark:bg-gray-900">
                    <img
                        src={event.image || '/placeholder-event.jpg'}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur text-white border border-white/20">
                                {event.organizer?.name || 'College Event'}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight">{event.title}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="space-y-1">
                            <div className="text-xs text-gray-500 uppercase font-semibold">Date</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Calendar size={14} className="text-indigo-500" />
                                {new Date(event.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-gray-500 uppercase font-semibold">Time</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Clock size={14} className="text-indigo-500" />
                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <div className="text-xs text-gray-500 uppercase font-semibold">Location</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <MapPin size={14} className="text-indigo-500" />
                                {event.location}
                            </div>
                        </div>
                    </div>

                    {/* Booking Stats */}
                    <div className="flex flex-wrap gap-3">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${isSoldOut ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            <Ticket size={14} />
                            {isSoldOut ? 'Sold Out' : `${availableSlots} / ${event.total_slots} Slots Available`}
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${isDeadlinePassed ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                            <Clock size={14} />
                            {isDeadlinePassed ? 'Registration Closed' : `Register by ${new Date(event.registration_deadline).toLocaleDateString()}`}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Info size={16} className="text-gray-400" />
                            About Event
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>
                    </div>

                    {/* Payment Selection (If step is payment) */}
                    {step === 'payment' && (
                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-5">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Select Payment Method</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {(event.accepted_payment_methods || ['razorpay']).map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setSelectedGateway(method)}
                                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${selectedGateway === method ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                                                {/* Simple Icon placeholder */}
                                                <div className="w-4 h-4 rounded-full bg-gray-900" />
                                            </div>
                                            <span className="font-medium text-sm capitalize text-gray-900 dark:text-white">{method}</span>
                                        </div>
                                        {selectedGateway === method && <ShieldCheck className="text-indigo-600 w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0a0a0a]">
                    {step === 'details' ? (
                        <button
                            onClick={() => setStep('payment')}
                            disabled={isSoldOut || isDeadlinePassed}
                            className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isSoldOut || isDeadlinePassed
                                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-lg shadow-black/5 dark:shadow-white/5 active:scale-95'
                                }`}
                        >
                            <span>Book for {event.currency} {event.price}</span>
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setStep('details')}
                                className="py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleBook}
                                disabled={!selectedGateway || isProcessing}
                                className="py-3.5 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <TyreLoader size={20} /> : <ShieldCheck size={18} />}
                                Pay & Confirm
                            </button>
                        </div>
                    )}

                    <div className="mt-3 text-center">
                        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                            <Mail size={10} /> Ticket & QR Code will be sent to your email
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
