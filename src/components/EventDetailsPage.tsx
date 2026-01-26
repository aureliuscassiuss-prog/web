import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ShieldCheck, ChevronLeft, Share2, Users, ExternalLink } from 'lucide-react';
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
    status?: string; // Optional per lint error
    location_url?: string;
}

export default function EventDetailsPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<string>('razorpay');
    const [isProcessing, setIsProcessing] = useState(false);

    // Payment Status State
    const [paymentStatus, setPaymentStatus] = useState<'none' | 'success' | 'failed'>('none');
    const [ticketData, setTicketData] = useState<any>(null);
    const [statusMessage, setStatusMessage] = useState('');

    // Lock scroll when loading ONLY
    useLockBodyScroll(loading);

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to top on load
        fetchEvent();
    }, [eventId]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            // Fetch all events for now as public API doesn't support single ID fetch easily yet
            const res = await fetch('/api/events');
            const data = await res.json();
            if (res.ok && data.events) {
                const found = data.events.find((e: any) => e._id === eventId);
                if (found) {
                    setEvent(found);
                } else {
                    setError('Event not found');
                }
            } else {
                setError('Failed to load event');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const availableSlots = event ? (event.total_slots || 100) - (event.booked_slots || 0) : 0;
    const isSoldOut = availableSlots <= 0;
    const isDeadlinePassed = event?.registration_deadline ? new Date() > new Date(event.registration_deadline) : false;

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
        if (!event) return;

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

    // --- ACTIONS ---
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            // You might want to use a toast library here for better UX
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy code: ', err);
        }
    };

    const handleBookTicket = () => {
        if (!user || !token) {
            const shouldLogin = window.confirm("You need to login to book tickets. Go to Login page?");
            if (shouldLogin) {
                // Redirect to home/login because we don't have a dedicated login route or global auth modal accessible here easily without Context method
                navigate('/');
            }
            return;
        }
        setShowPaymentModal(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
                <TyreLoader size={32} />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading Event...</p>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black text-center p-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Event Not Found</h2>
                <p className="text-gray-500 mb-6">{error || "This event may have been removed."}</p>
                <button
                    onClick={() => navigate('/events')}
                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-blue-500/30">

            {/* --- HERO SECTION (POSTER MODE) --- */}
            <div className="p-3 md:p-4 pb-0">
                <div className="relative w-full bg-black rounded-[1.5rem] overflow-hidden">

                    {/* 2. Main Image (Adaptive Height) */}
                    <div className="relative w-full">
                        <img
                            src={event.image || '/placeholder-event.jpg'}
                            alt={event.title}
                            className="w-full h-auto object-contain block"
                            style={{ maxHeight: '85vh' }}
                        />
                    </div>

                    {/* Top Navigation Bar */}
                    <div className="absolute top-4 left-0 right-0 px-4 md:px-6 flex justify-between items-center z-30 w-full">
                        <button
                            onClick={() => navigate('/events')}
                            className="w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 backdrop-blur-xl rounded-full text-white border border-white/20 transition-all shadow-lg active:scale-95"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleShare}
                            className="w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 backdrop-blur-xl rounded-full text-white border border-white/20 transition-all shadow-lg active:scale-95"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            {/* --- CONTENT SECTION --- */}
            <div className="relative z-20 bg-white dark:bg-black px-5 sm:px-8 py-6 min-h-[50vh] pb-32">

                <div className="max-w-2xl mx-auto space-y-8">

                    {/* Header: Title */}
                    <div className="space-y-2 text-left">
                        <div className="flex flex-wrap items-center justify-start gap-2 mb-2">
                            {event.status !== 'approved' && isSoldOut && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white">Sold Out</span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                            {event.title}
                        </h1>
                    </div>

                    {/* Meta Grid (Date, Time, Location, Seats) - Borderless Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date */}
                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Clock size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        <div
                            className={`bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2 group ${event.location_url ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors' : ''}`}
                            onClick={() => event.location_url && window.open(event.location_url, '_blank')}
                        >
                            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                    Location
                                    {event.location_url && <ExternalLink size={10} className="text-blue-500" />}
                                </p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {event.location}
                                </p>
                            </div>
                        </div>

                        {/* Seats */}
                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Users size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seats</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                    {availableSlots} left
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="pb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">About Event</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed text-xs sm:text-sm">
                            <div dangerouslySetInnerHTML={{ __html: event.description }} />
                        </div>
                    </div>

                    {/* Organizer Section (Bottom) */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Organized By</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {event.organizer?.avatar ? (
                                    <img src={event.organizer.avatar} alt={event.organizer.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span>{event.organizer?.name?.[0] || 'E'}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-base font-bold text-gray-900 dark:text-white">{event.organizer?.name || 'Extrovert Team'}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Verified Organizer</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- FIXED BOTTOM BAR (FLOATING GLASS PILL) --- */}
            <div className="fixed bottom-4 left-4 right-4 z-40">
                <div className="max-w-2xl mx-auto bg-black/80 dark:bg-white/10 backdrop-blur-xl p-3 pl-6 rounded-full shadow-2xl border border-white/10 flex items-center justify-between gap-4">

                    {/* Price */}
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Price</span>
                        <span className="text-xl sm:text-2xl font-black text-white dark:text-white">
                            {event.currency === 'INR' ? '₹' : event.currency}{event.price}
                        </span>
                    </div>

                    {/* Book Button */}
                    <button
                        onClick={handleBookTicket}
                        disabled={isSoldOut || isDeadlinePassed}
                        className={`px-8 h-12 rounded-full font-bold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] ${isSoldOut || isDeadlinePassed
                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-gray-200'
                            }`}
                    >
                        {isSoldOut ? 'Sold Out' : isDeadlinePassed ? 'Closed' : 'Book Ticket'}
                    </button>
                </div>
            </div>

            {/* --- PAYMENT MODAL --- */}
            <AnimatePresence>
                {(showPaymentModal || paymentStatus !== 'none') && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                if (!isProcessing && paymentStatus === 'none') setShowPaymentModal(false);
                            }}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full sm:hidden" />

                            {paymentStatus !== 'none' ? (
                                <PaymentStatus
                                    status={paymentStatus === 'success' ? 'success' : 'failed'}
                                    message={statusMessage}
                                    ticketId={ticketData?.id}
                                    onDownload={() => navigate('/events')}
                                    onRetry={() => {
                                        setPaymentStatus('none');
                                        setShowPaymentModal(true);
                                    }}
                                    onClose={() => {
                                        setPaymentStatus('none');
                                        setShowPaymentModal(false);
                                        if (paymentStatus === 'success') navigate('/events');
                                    }}
                                />
                            ) : (
                                <div className="space-y-6 mt-2">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Booking</h3>
                                        <p className="text-xs text-gray-500 mt-1">Select your preferred payment method</p>
                                    </div>

                                    <div className="space-y-3">
                                        {(event.accepted_payment_methods || ['razorpay']).map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setSelectedGateway(method)}
                                                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${selectedGateway === method
                                                    ? 'border-black dark:border-white bg-black/5 dark:bg-white/10 ring-1 ring-black dark:ring-white'
                                                    : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-gray-100 dark:border-zinc-800 flex items-center justify-center">
                                                        <ShieldCheck size={14} className="text-gray-900 dark:text-white" />
                                                    </div>
                                                    <span className="font-bold capitalize text-xs text-gray-900 dark:text-white">{method} Secure</span>
                                                </div>
                                                {selectedGateway === method && <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center"><ShieldCheck size={10} className="text-white dark:text-black" /></div>}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500">Total to Pay</span>
                                        <span className="text-lg font-black text-gray-900 dark:text-white">{event.currency === 'INR' ? '₹' : event.currency}{event.price}</span>
                                    </div>

                                    <button
                                        onClick={handleBook}
                                        disabled={isProcessing}
                                        className="w-full py-3.5 rounded-xl font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isProcessing ? <TyreLoader size={16} /> : <ShieldCheck size={16} />}
                                        {isProcessing ? 'Processing...' : 'Pay & Confirm'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
