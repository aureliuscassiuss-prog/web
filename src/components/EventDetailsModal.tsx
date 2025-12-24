import { useState } from 'react';
import { X, Calendar, MapPin, Clock, ShieldCheck, ArrowLeft, Ticket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import TyreLoader from './TyreLoader';
import PaymentStatus from './PaymentStatus';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

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

    // Payment Status State
    const [paymentStatus, setPaymentStatus] = useState<'none' | 'success' | 'failed'>('none');
    const [ticketData, setTicketData] = useState<any>(null);
    const [statusMessage, setStatusMessage] = useState('');

    // SCROLL LOCK: Prevent background scrolling securely
    useLockBodyScroll(!!event);

    if (!event) return null;

    const availableSlots = (event.total_slots || 100) - (event.booked_slots || 0);
    const isSoldOut = availableSlots <= 0;
    const isDeadlinePassed = event.registration_deadline ? new Date() > new Date(event.registration_deadline) : false;

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBookingSuccess = (ticket: any, message: string) => {
        setTicketData(ticket);
        setStatusMessage(message);
        setPaymentStatus('success');
    };

    const handleBookingFailure = (message: string) => {
        setStatusMessage(message);
        setPaymentStatus('failed');
    };

    const handleBook = async () => {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env.NODE_ENV && !user) {
            alert("Please login to book tickets.");
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Create Order
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'book-ticket',
                    eventId: event._id
                })
            });

            const data = await res.json();

            if (!res.ok) {
                handleBookingFailure(data.message || "Booking failed");
                setIsProcessing(false);
                return;
            }

            // 2. Load Razorpay SDK
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                handleBookingFailure("Razorpay SDK failed to load. Check internet connection.");
                setIsProcessing(false);
                return;
            }

            // 3. Open Razorpay
            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: "Extrovert Events",
                description: `Ticket for ${event.title}`,
                order_id: data.order_id,
                handler: async function (response: any) {
                    // 4. Verify Payment (Confirm Booking)
                    try {
                        const verifyRes = await fetch('/api/events', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                action: 'confirm-booking',
                                ticketId: data.ticket_id,
                                paymentData: {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                }
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok && verifyData.status === 'confirmed') {
                            handleBookingSuccess(verifyData.ticket, "Your ticket is confirmed!");
                            if (onBookingSuccess) onBookingSuccess();
                        } else {
                            handleBookingFailure("Payment Verification Failed. Contact Support.");
                        }
                    } catch (e) {
                        console.error("Verification Error", e);
                        handleBookingFailure("Verification Error. Please contact support.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: data.user_details.name,
                    email: data.user_details.email,
                    contact: data.user_details.phone
                },
                theme: {
                    color: "#000000"
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    }
                }
            };

            // @ts-ignore
            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                handleBookingFailure(`Payment Failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            handleBookingFailure("Payment initialization failed");
            setIsProcessing(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 perspective-1000">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-4xl bg-white dark:bg-[#0a0a0a] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] z-10 will-change-transform"
            >
                {/* FIXED NAV BAR - Always visible */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-50 pointer-events-none">
                    <button
                        onClick={onClose}
                        className="pointer-events-auto md:hidden p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/10 shadow-lg active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <button
                        onClick={onClose}
                        className="pointer-events-auto hidden md:flex p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-black dark:text-white transition-all border border-black/5 dark:border-white/10 shadow-lg ml-auto active:scale-95 group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">

                    {/* Hero Section (Full Width Banner) */}
                    <div className="relative h-72 md:h-96 w-full shrink-0">
                        <img
                            src={event.image || '/placeholder-event.jpg'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent" />

                        {/* Title & Badge Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-zinc-800/90 text-black dark:text-white shadow-lg backdrop-blur-sm border border-white/10">
                                    {event.organizer?.name || 'College Event'}
                                </span>
                                {(isSoldOut || isDeadlinePassed) && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-lg">
                                        {isSoldOut ? 'Sold Out' : 'Closed'}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black leading-tight text-white tracking-tight drop-shadow-lg max-w-3xl">
                                {event.title}
                            </h2>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 md:p-10 bg-white dark:bg-[#0a0a0a]">

                        {/* PAYMENT STATUS OVERLAY */}
                        {paymentStatus !== 'none' ? (
                            <div className="py-12">
                                <PaymentStatus
                                    status={paymentStatus === 'success' ? 'success' : 'failed'}
                                    message={statusMessage}
                                    ticketId={ticketData?.id}
                                    onDownload={() => onClose()}
                                    onRetry={() => {
                                        setPaymentStatus('none');
                                        setStep('payment');
                                    }}
                                    onClose={onClose}
                                />
                            </div>
                        ) : (
                            <>
                                {/* Meta Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                    {/* Date */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/50">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Date</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/50">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Time</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/50">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Location</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{event.location}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rich Text Description */}
                                <div className="mb-24">
                                    <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                                        About This Event
                                    </h3>

                                    <div className="prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400">
                                        <div dangerouslySetInnerHTML={{ __html: event.description }} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                {paymentStatus === 'none' && (
                    <div className="p-4 md:p-6 border-t border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg shrink-0 z-20">
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
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Select Payment Method</h3>
                                        <button
                                            onClick={() => setStep('details')}
                                            className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto mb-2 pr-1">
                                        {(event.accepted_payment_methods || ['razorpay']).map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setSelectedGateway(method)}
                                                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${selectedGateway === method ? 'border-black dark:border-white bg-black/5 dark:bg-white/10' : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold capitalize text-sm text-gray-900 dark:text-white">{method}</span>
                                                </div>
                                                {selectedGateway === method && <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center"><ShieldCheck size={12} className="text-white dark:text-black" /></div>}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleBook}
                                        disabled={!selectedGateway || isProcessing}
                                        className="w-full py-4 rounded-xl font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <TyreLoader size={20} /> : <ShieldCheck size={18} />}
                                        {isProcessing ? 'Processing' : 'Confirm & Pay'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
