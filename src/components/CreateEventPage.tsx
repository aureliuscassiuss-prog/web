import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Changed from onSuccess/onClose to navigate
import { Upload, Calendar, MapPin, DollarSign, Image as ImageIcon, Sparkles, CreditCard, Users, Smartphone, Monitor, ChevronLeft, Clock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageCropper from './ImageCropper';
import TyreLoader from './TyreLoader';
import { useAuth } from '../contexts/AuthContext'; // Import auth
// import EventCard from './EventCard'; // Reuse EventCard for preview if suitable, or build custom simulated view

export default function CreateEventPage() {
    const navigate = useNavigate();
    const { token } = useAuth();

    // --- Form State (Same as Modal) ---
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
        accepted_payment_methods: ['razorpay'],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [simulatorView, setSimulatorView] = useState<'mobile' | 'desktop'>('mobile');

    // --- Image Upload Logic (Same as Modal) ---
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

    const togglePaymentMethod = (method: string) => {
        setFormData(prev => ({
            ...prev,
            accepted_payment_methods: [method]
        }));
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

            // Success redirect
            navigate('/events');
        } catch (error) {
            console.error('Create Event Error:', error);
            alert('Failed to create event. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Mock Event Object for Simulator ---
    const mockEvent = {
        _id: 'preview',
        title: formData.title || 'Event Title Preview',
        description: formData.description || 'Event description will appear here...',
        image: formData.image, // Can be empty, EventCard handles fallback? Maybe need a placeholder
        date: formData.date || new Date().toISOString(),
        location: formData.location || 'Location Preview',
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        booked_slots: 0,
        total_slots: parseInt(formData.total_slots) || 100,
        organizer: { name: 'You (Organizer)' }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-slate-900 dark:text-white flex flex-col md:flex-row overflow-hidden">

            {/* Cropper Overlay */}
            {showCropper && tempImageSrc && (
                <div className="fixed inset-0 z-[100]">
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
            )}

            {/* --- LEFT PANE: EDITOR (Scrollable) --- */}
            <div className="w-full md:w-1/2 lg:w-[55%] h-full flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 backdrop-blur-xl z-10">
                {/* Header */}
                <div className="flex-none p-4 sm:p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
                    <button
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
                    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-20">

                        {/* Image Upload */}
                        <div className="group relative w-full aspect-video bg-gray-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-500 transition-colors cursor-pointer overflow-hidden shadow-sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {formData.image ? (
                                <>
                                    <img src={formData.image} alt="Event Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white font-medium flex items-center gap-2"><ImageIcon size={18} /> Change Banner</p>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                        <Upload size={20} />
                                    </div>
                                    <p className="text-sm font-medium">Click to upload banner</p>
                                    <p className="text-xs opacity-60">16:9 Aspect Ratio recommended</p>
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
                                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-xl md:text-2xl"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Date & Time</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Venue name"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Event Description</label>
                            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={(value) => setFormData({ ...formData, description: value })}
                                    className="h-[300px] mb-12 text-gray-800 dark:text-gray-200"
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, false] }],
                                            ['bold', 'italic', 'underline', 'list', 'link'],
                                            ['clean']
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
                        {isSubmitting ? <TyreLoader size={20} /> : <Sparkles size={18} />}
                        Publish Now
                    </button>
                </div>
            </div>

            {/* --- RIGHT PANE: SIMULATOR (Fixed) --- */}
            <div className="hidden md:flex flex-col flex-1 bg-gray-100 dark:bg-[#0a0a0a] relative overflow-hidden">
                {/* Simulator Toolbar */}
                <div className="flex-none p-4 flex items-center justify-center gap-4 relative z-10">
                    <div className="bg-white dark:bg-zinc-900 p-1 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center">
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
                </div>

                {/* Simulator Viewport */}
                <div className="flex-1 overflow-y-auto w-full flex items-center justify-center p-8 custom-scrollbar">
                    <div
                        className={`transition-all duration-500 ease-in-out border-[8px] border-gray-900 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl overflow-hidden relative shrink-0 ${simulatorView === 'mobile'
                            ? 'w-[375px] h-[750px] rounded-[3rem]'
                            : 'w-[1024px] h-[640px] rounded-xl'
                            }`}
                    >
                        {/* Status Bar simulation for Mobile */}
                        {simulatorView === 'mobile' && (
                            <div className="absolute top-0 inset-x-0 h-7 bg-black z-50 flex justify-between px-6 items-center">
                                <span className="text-[10px] text-white font-medium">9:41</span>
                                <div className="flex gap-1.5">
                                    <div className="w-1 h-3 rounded-full bg-white" />
                                    <div className="w-1 h-3 rounded-full bg-white" />
                                    <div className="w-1 h-3 rounded-full bg-white" />
                                </div>
                            </div>
                        )}

                        {/* Simulated Content - Full Event Details Page Layout */}
                        <div className={`w-full h-full overflow-y-auto overscroll-y-contain bg-white dark:bg-black ${simulatorView === 'mobile' ? 'pt-7' : ''} relative`}>

                            {/* --- HERO SECTION --- */}
                            <div className="p-3 md:p-4 pb-0">
                                <div className="relative w-full bg-black rounded-[1.5rem] overflow-hidden group">
                                    <div className="relative w-full">
                                        {mockEvent.image ? (
                                            <img
                                                src={mockEvent.image}
                                                alt="Event Preview"
                                                className="w-full h-auto object-contain block max-h-[50vh]"
                                            />
                                        ) : (
                                            <div className="aspect-video bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <ImageIcon size={48} />
                                                    <span className="text-xs font-medium">Cover Image</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mock Navigation */}
                                    <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-center z-30 w-full">
                                        <div className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-xl rounded-full text-white border border-white/20">
                                            <ChevronLeft size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- CONTENT SECTION --- */}
                            <div className="relative z-20 px-5 py-6 pb-32">
                                <div className="max-w-2xl mx-auto space-y-8">

                                    {/* Title */}
                                    <div className="space-y-2 text-left">
                                        <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                                            {mockEvent.title || 'Event Title'}
                                        </h1>
                                    </div>

                                    {/* Meta Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {mockEvent.date ? new Date(mockEvent.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Select Date'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {mockEvent.date ? new Date(mockEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2 col-span-1">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <MapPin size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {mockEvent.location || 'Venue Name'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col justify-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <Users size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seats</p>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {mockEvent.total_slots} available
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* About Section */}
                                    <div className="pb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">About Event</h3>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed text-xs sm:text-sm">
                                            {mockEvent.description ? (
                                                <div dangerouslySetInnerHTML={{ __html: mockEvent.description }} />
                                            ) : (
                                                <p className="italic opacity-50">Description will appear here...</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Organizer Section */}
                                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Organized By</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                Y
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-gray-900 dark:text-white">You (Organizer)</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Verified Organizer</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- FIXED BOTTOM BAR (Outside Scrollable Area) --- */}
                        <div className="absolute bottom-4 left-4 right-4 z-40">
                            <div className="max-w-2xl mx-auto bg-black/80 dark:bg-white/10 backdrop-blur-xl p-3 pl-6 rounded-full shadow-2xl border border-white/10 flex items-center justify-between gap-4">
                                <div>
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Price</span>
                                    <span className="text-xl sm:text-2xl font-black text-white dark:text-white">
                                        {mockEvent.currency === 'INR' ? '₹' : mockEvent.currency}{mockEvent.price}
                                    </span>
                                </div>
                                <button className="px-8 h-12 rounded-full font-bold text-sm bg-white text-black hover:bg-gray-200 shadow-lg flex items-center justify-center gap-2 pointer-events-none">
                                    Book Ticket
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}
