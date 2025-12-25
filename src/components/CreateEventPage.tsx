import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, Calendar, MapPin, DollarSign, Image as ImageIcon,
    Sparkles, CreditCard, Users, Smartphone, Monitor, ChevronLeft, Clock, X
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Assume these exist or replace with simple placeholders if missing
import ImageCropper from './ImageCropper';
import TyreLoader from './TyreLoader';
import { useAuth } from '../contexts/AuthContext';

export default function CreateEventPage() {
    const navigate = useNavigate();
    // Safety check in case Auth context is missing or loading
    const auth = useAuth();
    const token = auth?.token;

    // --- Form State ---
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        date: '',
        location: '',
        location_url: '',
        price: '',
        currency: 'INR',
        total_slots: '100',
        registration_deadline: '',
        accepted_payment_methods: ['razorpay'], // Default
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [simulatorView, setSimulatorView] = useState<'mobile' | 'desktop'>('mobile');

    // --- Image Upload Logic ---
    const [showCropper, setShowCropper] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempImageSrc(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image: reader.result as string }));
            setShowCropper(false);
            setTempImageSrc(null);
        };
        reader.readAsDataURL(croppedBlob);
    };

    // Toggle logic: Allows switching or selecting multiple if your backend supports it
    const togglePaymentMethod = (method: string) => {
        setFormData(prev => {
            const current = prev.accepted_payment_methods;
            if (current.includes(method)) {
                // Prevent removing if it's the only one (optional UX choice)
                if (current.length === 1) return prev;
                return { ...prev, accepted_payment_methods: current.filter(m => m !== method) };
            } else {
                return { ...prev, accepted_payment_methods: [...current, method] };
            }
        });
    };

    // --- Submit Logic ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'create-event',
                    ...formData,
                    price: parseFloat(formData.price) || 0,
                    total_slots: parseInt(formData.total_slots) || 100,
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create event');
            }
            navigate('/events');
        } catch (error) {
            console.error('Create Event Error:', error);
            alert('Failed to create event. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper for safe date rendering
    const getFormattedDate = (dateString: string) => {
        if (!dateString) return { date: 'Select Date', time: 'Select Time' };
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const displayDate = getFormattedDate(formData.date);

    return (
        // Fixed: Adjusted height calculation to fit viewport perfectly
        <div className="h-[calc(100vh-2rem)] w-full bg-gray-50 dark:bg-black text-slate-900 dark:text-white flex flex-col md:flex-row overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm relative">

            {/* Cropper Overlay */}
            {showCropper && tempImageSrc && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl w-full max-w-2xl">
                        <div className="h-[400px] w-full bg-black rounded-lg overflow-hidden">
                            <ImageCropper
                                imageSrc={tempImageSrc}
                                aspectStats={16 / 9}
                                onCropComplete={handleCropComplete}
                                onCancel={() => {
                                    setShowCropper(false);
                                    setTempImageSrc(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- LEFT PANE: EDITOR --- */}
            <div className="w-full md:w-1/2 lg:w-[55%] h-full flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10">
                {/* Header */}
                <div className="flex-none p-4 sm:p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
                    <button
                        type="button"
                        onClick={() => navigate('/events')}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Create Experience</h1>
                        <p className="text-xs text-gray-500 font-medium">Design your event & preview instantly</p>
                    </div>
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-10">

                        {/* Image Upload */}
                        <div className="group relative w-full aspect-video bg-gray-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-500 transition-all cursor-pointer overflow-hidden shadow-sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {formData.image ? (
                                <>
                                    <img src={formData.image} alt="Event Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full"><ImageIcon size={18} /> Change Banner</p>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3">
                                    <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-1">
                                        <Upload size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Click to upload banner</p>
                                        <p className="text-xs opacity-60 mt-1">SVG, PNG, JPG or GIF (rec. 16:9)</p>
                                    </div>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                        </div>

                        {/* Title & Basics */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Event Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Annual Tech Summit 2025"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-lg md:text-xl"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Date & Time</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Location</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Venue or 'Online'"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description - Custom Styled Wrapper */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Event Description</label>
                            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all [&_.ql-toolbar]:border-none [&_.ql-container]:border-none [&_.ql-editor]:min-h-[200px]">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={(value) => setFormData({ ...formData, description: value })}
                                    className="text-gray-800 dark:text-gray-200"
                                    placeholder="Tell people what this event is about..."
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, false] }],
                                            ['bold', 'italic', 'underline', 'list'],
                                            ['link', 'clean']
                                        ],
                                    }}
                                />
                            </div>
                        </div>

                        {/* Tickets & Payment */}
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-4">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Ticketing</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 ml-1">Price (INR)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-sm font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 ml-1">Total Slots</label>
                                    <div className="relative">
                                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={formData.total_slots}
                                            onChange={e => setFormData({ ...formData, total_slots: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 ml-1">Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => togglePaymentMethod('razorpay')}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-2 transition-all ${formData.accepted_payment_methods.includes('razorpay')
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500'
                                            : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        <CreditCard size={20} />
                                        <span>Razorpay (Online)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => togglePaymentMethod('manual')}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-2 transition-all ${formData.accepted_payment_methods.includes('manual')
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 ring-1 ring-green-500'
                                            : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        <DollarSign size={20} />
                                        <span>Cash / Manual</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex-none p-4 sm:p-6 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-end gap-3 z-20">
                    <button
                        type="button"
                        onClick={() => navigate('/events')}
                        className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-white/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                        ) : <Sparkles size={18} />}
                        Publish Now
                    </button>
                </div>
            </div>

            {/* --- RIGHT PANE: SIMULATOR --- */}
            <div className="hidden md:flex flex-col flex-1 bg-gray-100 dark:bg-[#0a0a0a] relative overflow-hidden items-center justify-center p-4">

                {/* View Switcher */}
                <div className="absolute top-6 z-20 bg-white dark:bg-zinc-900 p-1.5 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center mb-4">
                    <button
                        onClick={() => setSimulatorView('mobile')}
                        className={`p-2 rounded-full transition-all ${simulatorView === 'mobile' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <Smartphone size={18} />
                    </button>
                    <button
                        onClick={() => setSimulatorView('desktop')}
                        className={`p-2 rounded-full transition-all ${simulatorView === 'desktop' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <Monitor size={18} />
                    </button>
                </div>

                {/* Device Frame */}
                {/* Mobile: iPhone 15 Pro Max Style Frame */}
                {/* Desktop: MacBook Air Style Frame */}
                <div
                    className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative shrink-0 shadow-2xl bg-black ${simulatorView === 'mobile'
                        ? 'w-[320px] h-[650px] rounded-[3.5rem] lg:w-[380px] lg:h-[750px] border-[12px] border-gray-900 shadow-[0_0_0_2px_#3f3f46,0_20px_50px_-10px_rgba(0,0,0,0.5)]'
                        : 'w-[640px] h-[400px] rounded-[1.5rem] lg:w-[900px] lg:h-[580px] border-[12px] border-gray-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]'
                        }`}
                >
                    {/* --- MOBILE SPECIFIC DETAILS --- */}
                    {simulatorView === 'mobile' && (
                        <>
                            {/* Dynamic Island / Notch */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-[60] flex items-center justify-center pointer-events-none">
                                {/* Solid Black Pill */}
                            </div>

                            {/* Side Buttons (Fake) */}
                            {/* Power Button */}
                            <div className="absolute top-[180px] -right-[15px] w-[3px] h-[60px] bg-gray-800 rounded-r-md" />
                            {/* Volume Buttons */}
                            <div className="absolute top-[150px] -left-[15px] w-[3px] h-[40px] bg-gray-800 rounded-l-md" />
                            <div className="absolute top-[200px] -left-[15px] w-[3px] h-[40px] bg-gray-800 rounded-l-md" />
                            {/* Silent Switch */}
                            <div className="absolute top-[100px] -left-[15px] w-[3px] h-[20px] bg-gray-800 rounded-l-md" />

                            {/* Status Bar */}
                            <div className="absolute top-2 inset-x-0 h-10 px-8 flex justify-between items-center z-50 pointer-events-none mix-blend-difference text-white">
                                <span className="text-[12px] font-bold">9:41</span>
                                <div className="flex gap-1.5 items-center">
                                    <div className="flex gap-0.5 items-end h-3">
                                        <div className="w-1 h-1 bg-current rounded-sm" />
                                        <div className="w-1 h-2 bg-current rounded-sm" />
                                        <div className="w-1 h-3 bg-current rounded-sm" />
                                        <div className="w-1 h-2.5 bg-current rounded-sm opacity-50" />
                                    </div>
                                    <div className="w-5 h-2.5 border border-current rounded-[4px] relative">
                                        <div className="absolute inset-0.5 bg-current rounded-[2px] w-3/4" />
                                    </div>
                                </div>
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-black/90 dark:bg-white/90 rounded-full z-[60] pointer-events-none mix-blend-difference" />
                        </>
                    )}

                    {/* --- CONTENT AREA --- */}
                    <div className={`w-full h-full bg-white dark:bg-black overflow-y-auto overflow-x-hidden touch-pan-y ${simulatorView === 'mobile' ? 'rounded-[2.8rem] scrollbar-hide' : 'rounded-xl'}`}>

                        {/* Event Image */}
                        <div className="relative">
                            <div className="w-full aspect-video bg-gray-100 dark:bg-zinc-900 overflow-hidden relative">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <ImageIcon size={32} opacity={0.5} />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Cover Image</span>
                                    </div>
                                )}
                                {/* Back Button Simulation */}
                                <button className="absolute top-12 left-5 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/40 transition-colors z-40">
                                    <ChevronLeft size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="px-5 py-6 pb-32 space-y-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                {formData.title || 'Event Title Preview'}
                            </h2>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Calendar size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Date</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{displayDate.date}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                        <Clock size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Time</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{displayDate.time}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl flex items-center gap-3 col-span-2">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                        <MapPin size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                            {formData.location || 'Location Preview'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex items-center gap-3 col-span-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <Users size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Availability</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                            {formData.total_slots} Seats Available
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* About */}
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">About Event</h3>
                                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed prose prose-sm dark:prose-invert">
                                    {formData.description ? (
                                        <div dangerouslySetInnerHTML={{ __html: formData.description }} />
                                    ) : (
                                        <p className="opacity-50 italic text-xs">Event description will appear here...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Bottom Bar in Simulator (Sticky Footer) */}
                    <div className={`absolute bottom-6 left-4 right-4 z-50 transition-transform duration-300 ${simulatorView === 'mobile' ? 'translate-y-0' : 'translate-y-2'}`}>
                        {/* Safe Area Spacer for Home Indicator */}
                        <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-2xl shadow-2xl shadow-black/20 flex items-center justify-between backdrop-blur-xl">
                            <div>
                                <p className="text-[10px] font-medium opacity-70 uppercase tracking-wider">Total Price</p>
                                <p className="text-xl font-bold">
                                    {formData.currency === 'INR' ? '₹' : '$'}{formData.price || '0'}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-black text-black dark:text-white px-6 py-2 rounded-xl font-bold text-sm cursor-default hover:scale-105 transition-transform">
                                Book Ticket
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}