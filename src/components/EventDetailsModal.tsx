import { useState } from 'react';
import { X, Calendar, MapPin, Clock, Info, ShieldCheck, ArrowLeft } from 'lucide-react';
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

    const [simulateFailure, setSimulateFailure] = useState(false); // For Dev Testing

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
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]"
            >
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">

                    {/* Hero Image */}
                    <div className="relative h-72 w-full shrink-0">
                        <img
                            src={event.image || '/placeholder-event.jpg'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent" />

                        {/* Mobile Back Button */}
                        <div className="absolute top-4 left-4 md:hidden">
                            <button
                                onClick={onClose}
                                className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-full text-white transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        {/* Close Button (Desktop) */}
                        <button
                            onClick={onClose}
                            className="hidden md:block absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 -mt-10 relative z-10">
                        {/* Title Card */}
                        <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-5 rounded-2xl shadow-lg mb-6">
                            <div className="flex gap-2 mb-3">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm">
                                    {event.organizer?.name || 'College Event'}
                                </span>
                                {(isSoldOut || isDeadlinePassed) && (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm">
                                        {isSoldOut ? 'Sold Out' : 'Closed'}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold leading-tight text-white mb-2">{event.title}</h2>
                            <div className="flex flex-wrap gap-4 text-gray-200 text-sm font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-blue-400" />
                                    {new Date(event.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-blue-400" />
                                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-blue-400" />
                                    {event.location}
                                </div>
                            </div>
                        </div>

                        {/* Tabs / Switcher (if needed later, currently just details/payment flow) */}

                        {/* Rich Text Description */}
                        <div className="space-y-4 mb-20 text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Info size={18} className="text-gray-400" />
                                About Event
                            </h3>
                            {/* DANGEROUSLY SET HTML FOR RICH TEXT */}
                            <div
                                className="text-sm leading-relaxed ql-editor-display" // Add custom class for styling quirks if any
                                dangerouslySetInnerHTML={{ __html: event.description }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] shrink-0 z-20">
                    <AnimatePresence mode='wait'>
                        {step === 'details' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex items-center justify-between gap-4"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Price</span>
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                                        {event.currency === 'INR' ? '₹' : event.currency} {event.price}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setStep('payment')}
                                    disabled={isSoldOut || isDeadlinePassed}
                                    className={`px-8 py-3.5 rounded-2xl font-bold text-base flex-1 shadow-xl flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] ${isSoldOut || isDeadlinePassed
                                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25'
                                        }`}
                                >
                                    {isSoldOut ? 'Sold Out' : isDeadlinePassed ? 'Registration Closed' : 'Book Ticket'}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Select Payment Method</h3>
                                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto mb-2">
                                    {(event.accepted_payment_methods || ['razorpay']).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setSelectedGateway(method)}
                                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${selectedGateway === method ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold capitalize text-sm text-gray-900 dark:text-white">{method}</span>
                                            </div>
                                            {selectedGateway === method && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><ShieldCheck size={10} className="text-white" /></div>}
                                        </button>
                                    ))}
                                </div>

                                {/* DEV: SIMULATE FAILURE TOGGLE */}
                                <label className="flex items-center gap-2 text-xs text-gray-500 font-medium cursor-pointer p-1">
                                    <input
                                        type="checkbox"
                                        checked={simulateFailure}
                                        onChange={e => setSimulateFailure(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Simulate Payment Failure (Dev Mode)
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setStep('details')}
                                        className="py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleBook}
                                        disabled={!selectedGateway || isProcessing}
                                        className="py-3.5 rounded-2xl font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <TyreLoader size={20} /> : <ShieldCheck size={18} />}
                                        {isProcessing ? 'Processing...' : 'Pay & Book'}
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
