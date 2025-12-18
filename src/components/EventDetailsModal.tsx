import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, ShieldCheck, ArrowLeft, Ticket } from 'lucide-react';
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
    const [simulateFailure] = useState(false); // For Dev Testing

    // SCROLL LOCK: Prevent background scrolling when modal is open
    useEffect(() => {
        if (event) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [event]);

    if (!event) return null;

    const availableSlots = (event.total_slots || 100) - (event.booked_slots || 0);
    const isSoldOut = availableSlots <= 0;
    const isDeadlinePassed = event.registration_deadline ? new Date() > new Date(event.registration_deadline) : false;

    const handleBook = async () => {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env.NODE_ENV && !user) return; // Should be protected anyway

        setIsProcessing(true);
        try {
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
                    paymentData: {
                        method: 'mock',
                        payment_id: 'mock_' + Date.now(),
                        force_fail: simulateFailure
                    }
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.status === 'confirmed') {
                    // Success
                    onBookingSuccess();
                    alert("🎉 Ticket Confirmed! Check your email.");
                    onClose();
                } else {
                    // Failed
                    alert("❌ Payment Failed. Please try again.");
                }
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
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-fade-in transition-opacity">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-4xl bg-white dark:bg-[#0a0a0a] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[90vh] md:h-[85vh] z-10"
            >
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">

                    {/* Hero Section (Full Width Banner) */}
                    <div className="relative h-64 md:h-80 w-full shrink-0 group">
                        <img
                            src={event.image || '/placeholder-event.jpg'}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Stronger Gradient for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-black/10" />

                        {/* Top Bar (Close/Back) */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
                            <button
                                onClick={onClose}
                                className="md:hidden p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
                            >
                                <ArrowLeft size={20} />
                            </button>

                            <button
                                onClick={onClose}
                                className="hidden md:flex p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 ml-auto"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Title & Badge Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                            <div className="flex gap-2 mb-3">
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-zinc-800/90 text-black dark:text-white shadow-lg backdrop-blur-sm border border-white/10">
                                    {event.organizer?.name || 'College Event'}
                                </span>
                                {(isSoldOut || isDeadlinePassed) && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-lg">
                                        {isSoldOut ? 'Sold Out' : 'Closed'}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white tracking-tight drop-shadow-md">
                                {event.title}
                            </h2>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 md:p-8 bg-white dark:bg-[#0a0a0a]">

                        {/* Meta Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Date</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Time</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                                <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Location</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rich Text Description */}
                        <div className="space-y-4 mb-20 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                About Event
                            </h3>
                            <div className="w-full h-px bg-gray-100 dark:bg-zinc-800 mb-4" />
                            {/* DANGEROUSLY SET HTML FOR RICH TEXT */}
                            <div
                                className="text-sm md:text-base leading-relaxed p-1"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-4 md:p-6 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] shrink-0 z-20 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                    <AnimatePresence mode='wait'>
                        {step === 'details' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center justify-between gap-6"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Price</span>
                                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                        {event.currency === 'INR' ? '₹' : event.currency}{event.price}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setStep('payment')}
                                    disabled={isSoldOut || isDeadlinePassed}
                                    className={`px-8 py-4 rounded-xl font-bold text-base flex-1 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] ${isSoldOut || isDeadlinePassed
                                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                                        : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                                        }`}
                                >
                                    <Ticket size={20} strokeWidth={2.5} />
                                    {isSoldOut ? 'Sold Out' : isDeadlinePassed ? 'Registration Closed' : 'Book Ticket'}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Select Payment Method</h3>
                                    {/* DEV: SIMULATE FAILURE TOGGLE - Hidden but functional */}
                                    {/* <label className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <input type="checkbox" checked={simulateFailure} onChange={e => setSimulateFailure(e.target.checked)} />
                                        Simulate Fail
                                    </label> */}
                                </div>

                                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto mb-2 pr-1">
                                    {(event.accepted_payment_methods || ['razorpay']).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setSelectedGateway(method)}
                                            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${selectedGateway === method ? 'border-black dark:border-white bg-black/5 dark:bg-white/10 ring-1 ring-black dark:ring-white' : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold capitalize text-sm text-gray-900 dark:text-white">{method}</span>
                                            </div>
                                            {selectedGateway === method && <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center"><ShieldCheck size={12} className="text-white dark:text-black" /></div>}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setStep('details')}
                                        className="py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleBook}
                                        disabled={!selectedGateway || isProcessing}
                                        className="py-3.5 rounded-xl font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <TyreLoader size={20} /> : <ShieldCheck size={18} />}
                                        {isProcessing ? 'Processing' : 'Confirm & Pay'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
