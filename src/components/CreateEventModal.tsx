import { useState, useRef } from 'react';
import { X, Upload, Calendar, MapPin, DollarSign, Image as ImageIcon, Sparkles, CreditCard, Clock, Users } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import styles
import ImageCropper from './ImageCropper';
import TyreLoader from './TyreLoader';



interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token: string | null;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess, token }: CreateEventModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '', // Rich Text
        image: '', // Base64 string
        date: '',
        location: '',
        location_url: '', // New Field
        price: '',
        currency: 'INR',
        total_slots: '100',
        registration_deadline: '',
        accepted_payment_methods: ['razorpay'], // Default
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image Upload State
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
        // Convert Blob to Base64 for storing (matching existing app pattern)
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image: reader.result as string }));
            setShowCropper(false);
            setTempImageSrc(null);
        };
        reader.readAsDataURL(croppedBlob);
    };

    const togglePaymentMethod = (method: string) => {
        // Exclusive Selection: Razorpay OR Manual
        setFormData(prev => ({
            ...prev,
            accepted_payment_methods: [method]
        }));
    };

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

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Create Event Error:', error);
            alert('Failed to create event. See console.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            {/* Cropper Overlay */}
            {showCropper && tempImageSrc && (
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
            )}

            <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/10 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            Create Experience
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">Host a new event for the community</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">

                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Image & Basic inputs */}
                        <div className="space-y-6">
                            {/* Image Upload */}
                            <div className="group relative w-full aspect-video bg-gray-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-500 transition-colors cursor-pointer overflow-hidden"
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Annual Tech Summit 2025"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-lg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Event Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="Venue name"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Map Link (Optional)</label>
                                        <input
                                            type="url"
                                            placeholder="https://maps.google.com/..."
                                            value={formData.location_url}
                                            onChange={e => setFormData({ ...formData, location_url: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Description & Settings */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Description</label>
                                <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.description}
                                        onChange={(value) => setFormData({ ...formData, description: value })}
                                        className="h-[250px] mb-12 text-gray-800 dark:text-gray-200"
                                        placeholder="Write a compelling description... (Style it bold, colorful!)"
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, false] }],
                                                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['link', 'image'], // Added image button
                                                ['clean']
                                            ],
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Ticket Settings */}
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-500/20 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">Ticketing Strategy</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Price (INR)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type="number"
                                                min="0"
                                                required
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Total Slots</label>
                                        <div className="relative">
                                            <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={formData.total_slots}
                                                onChange={e => setFormData({ ...formData, total_slots: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Reg. Deadline</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="datetime-local"
                                            value={formData.registration_deadline}
                                            onChange={e => setFormData({ ...formData, registration_deadline: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Payment Gateways */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 ml-1">Accepted Payment Methods</label>
                                    <div className="flex flex-col gap-2">
                                        {/* Exclusive Choice (Radio-like behavior) */}
                                        <button
                                            type="button"
                                            onClick={() => togglePaymentMethod('razorpay')}
                                            className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${formData.accepted_payment_methods.includes('razorpay')
                                                ? 'bg-[#3399cc]/10 border-[#3399cc] text-[#3399cc]'
                                                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2"><CreditCard size={18} /> Razorpay (Online)</span>
                                            {formData.accepted_payment_methods.includes('razorpay') && <Sparkles size={16} />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => togglePaymentMethod('manual')}
                                            className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${formData.accepted_payment_methods.includes('manual')
                                                ? 'bg-green-50, border-green-500 text-green-600' // green-50 has syntax error in prev logic? No, fix string
                                                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                } ${formData.accepted_payment_methods.includes('manual') ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500 text-green-700 dark:text-green-400' : ''}`} // Fix logic
                                        >
                                            <span className="flex items-center gap-2"><DollarSign size={18} /> Manual / Cash (On Venue)</span>
                                            {formData.accepted_payment_methods.includes('manual') && <Sparkles size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <TyreLoader size={20} /> : <Upload size={18} />}
                            Publish Event
                        </button>
                    </div>

                </form>
            </div >
        </div >
    );
}
