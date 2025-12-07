import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    User, Save, AlertCircle, CheckCircle2, Pencil, Camera,
    School, Phone, Hash, BookOpen, Calendar,
    Star, ChevronDown, Check
} from 'lucide-react'
import TyreLoader from './TyreLoader';
import ProfileBanner from './ProfileBanner';

const NeutralAvatar = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="24" height="24" className="fill-gray-100 dark:fill-zinc-800" />
        <circle cx="12" cy="8" r="4" className="fill-gray-300 dark:fill-zinc-600" />
        <path d="M4 20C4 16 8 15 12 15C16 15 20 16 20 20" strokeWidth="0" className="fill-gray-300 dark:fill-zinc-600" />
    </svg>
);

// --- UNIFIED INPUT COMPONENT ---
// Updated to allow dynamic height for the "Accordion" style expansion
const UnifiedField = ({
    label,
    icon: Icon,
    isEditing,
    children,
    className = ""
}: {
    label: string,
    icon?: any,
    isEditing: boolean,
    children: React.ReactNode,
    className?: string
}) => {
    return (
        <div className={`w-full flex flex-col ${className}`}>
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ml-1">
                {Icon && <Icon size={10} />} {label}
            </label>
            {/* Removed fixed h-11. Used min-h-[44px] to allow expansion */}
            <div className={`
                relative w-full min-h-[44px] rounded-lg transition-all duration-200 overflow-hidden
                ${isEditing
                    ? "bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500"
                    : "bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-200 dark:border-zinc-800"}
            `}>
                {children}
            </div>
        </div>
    );
};

// --- CUSTOM EXPANDABLE SELECT (ACCORDION STYLE) ---
interface Option {
    label: string;
    value: string | number;
}

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    isOpen,
    onToggle
}: {
    value: string | number;
    onChange: (val: any) => void;
    options: Option[];
    placeholder: string;
    disabled: boolean;
    isOpen: boolean;
    onToggle: () => void;
}) => {
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    const handleSelect = (val: any, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(val);
        onToggle(); // Close after selecting
    };

    return (
        <div className="w-full flex flex-col">
            {/* Header / Trigger */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onToggle();
                }}
                disabled={disabled}
                className={`
                    w-full min-h-[44px] px-3 flex items-center justify-between outline-none transition-colors
                    ${disabled ? 'cursor-text opacity-100' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50'}
                `}
            >
                <span className={`text-sm font-medium ${!selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                {!disabled && (
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                    />
                )}
            </button>

            {/* Expandable Options List (In-Flow Animation) */}
            <div className={`
                grid transition-[grid-template-rows] duration-300 ease-in-out
                ${isOpen && !disabled ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
            `}>
                <div className="overflow-hidden">
                    <div className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black/20">
                        {options.length > 0 ? (
                            options.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={(e) => handleSelect(opt.value, e)}
                                    className={`
                                        px-4 py-3 text-sm cursor-pointer border-b border-gray-100/50 dark:border-zinc-800/50 last:border-0 flex items-center justify-between transition-colors
                                        ${String(value) === String(opt.value)
                                            ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:pl-5'}
                                    `}
                                >
                                    {opt.label}
                                    {String(value) === String(opt.value) && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-gray-400 text-center">No options available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    // const navigate = useNavigate(); // Removed unused
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Image logic
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Active Field State for "One at a time" Logic ---
    const [activeField, setActiveField] = useState<string | null>(null);

    // Close dropdowns if clicking anywhere else
    useEffect(() => {
        const handleClickOutside = () => setActiveField(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleField = (fieldId: string) => {
        setActiveField(prev => prev === fieldId ? null : fieldId);
    };

    // Data logic
    const [structure, setStructure] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        semester: user?.semester || '',
        college: user?.college || 'Medicaps University',
        course: user?.course || '',
        branch: user?.branch || '',
        year: user?.year || 1,
        gender: user?.gender || 'male',
    });

    useEffect(() => {
        // Mock fetch
        fetch('/api/admin?action=structure')
            .then(res => res.json())
            .then(data => setStructure(data))
            .catch(err => console.error(err));
    }, []);

    // Dropdowns data calculation
    const programs = structure?.programs || [];
    const years = useMemo(() => {
        const prog = programs.find((p: any) => p.id === formData.course);
        return prog?.years || [];
    }, [formData.course, programs]);

    const courses = useMemo(() => {
        const yr = years.find((y: any) => y.id === formData.year.toString() || y.id === formData.year);
        return yr?.courses || [];
    }, [formData.year, years]);

    const semesters = useMemo(() => {
        const branch = courses.find((c: any) => c.id === formData.branch);
        return branch?.semesters || [];
    }, [formData.branch, courses]);

    // Save handler
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Validate phone number
            if (formData.phone && formData.phone.length !== 10) {
                setError('Phone number must be exactly 10 digits');
                setIsSaving(false);
                return;
            }

            // Create FormData for file upload
            const formDataToSend = new FormData();

            // Add all form fields
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('semester', formData.semester.toString());
            formDataToSend.append('college', formData.college);
            formDataToSend.append('course', formData.course);
            formDataToSend.append('branch', formData.branch);
            formDataToSend.append('year', formData.year.toString());
            formDataToSend.append('gender', formData.gender);

            // Add avatar file if it exists
            if (avatarFile) {
                formDataToSend.append('avatar', avatarFile);
            }

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            // Send to backend
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            if (!response.ok) {
                let errorMessage = 'Failed to update profile';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If JSON parse fails, try to get text
                    const textError = await response.text();
                    if (textError) errorMessage = textError.slice(0, 100); // Limit length
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Update local state with server response
            updateUser(data.user);

            // Clear the avatar file and update preview
            setAvatarFile(null);
            setPreviewUrl(data.user.avatar || null);

            setSuccess(true);
            setIsEditing(false);
            setActiveField(null);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setActiveField(null);
        setPreviewUrl(user?.avatar || null);
        setAvatarFile(null);
        setError(null); // Clear errors on cancel
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                semester: user.semester || 1,
                college: user.college || 'Medicaps University',
                course: user.course || '',
                branch: user.branch || '',
                year: user.year || 1,
                gender: user.gender || 'male',
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (4MB limit)
            if (file.size > 4 * 1024 * 1024) {
                setError('Image size must be less than 4MB');
                return;
            }
            setError(null); // Clear previous errors
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Standard input style for non-dropdowns
    const commonInputClass = `
        w-full h-[44px] px-3 text-sm font-medium transition-all outline-none bg-transparent
        disabled:opacity-100 disabled:cursor-text disabled:text-gray-900 disabled:dark:text-gray-100
        text-gray-900 dark:text-white placeholder-gray-400
    `;

    return (
        <div className="w-full max-w-2xl mx-auto p-2 sm:p-4">

            {/* Alerts */}
            {(error || success) && (
                <div className="mb-3">
                    {error && (
                        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 size={16} /> Saved successfully!
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">

                {/* Header Banner */}
                <ProfileBanner user={user}>
                    <div className="flex items-center gap-3">
                        <button onClick={logout} className="px-3 py-1.5 bg-black/20 text-white rounded-full hover:bg-black/30 backdrop-blur-md z-10 text-xs font-medium border border-white/10 transition-colors">
                            Logout
                        </button>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-semibold border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95">
                                <Pencil size={12} /> Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2 animate-in fade-in duration-200">
                                <button onClick={handleCancel} className="px-3 py-1.5 bg-black/40 text-white rounded-lg text-xs font-medium hover:bg-black/50 backdrop-blur-md transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 shadow-lg flex items-center gap-2 disabled:opacity-70 transition-all hover:scale-105 active:scale-95">
                                    {isSaving ? (
                                        <>
                                            <TyreLoader size={12} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={12} />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </ProfileBanner>

                {/* Identity Section */}
                <div className="px-4 sm:px-5 relative mb-8">
                    <div className="flex flex-col -mt-10 gap-3">
                        <div className="relative w-24 h-24 group">
                            <div className="w-full h-full rounded-2xl bg-white dark:bg-zinc-900 p-1 border border-gray-100 dark:border-zinc-800 shadow-md">
                                <div className="w-full h-full rounded-xl overflow-hidden relative bg-gray-100">
                                    {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="Profile" /> : <NeutralAvatar className="w-full h-full" />}
                                    {isEditing && (
                                        <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/60">
                                            <Camera className="text-white w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
                        </div>

                        <div className="flex flex-col gap-1 max-w-[90%]">
                            <div className={`transition-all duration-200 ${isEditing ? 'border-b border-gray-300 pb-1' : ''}`}>
                                <input
                                    value={formData.name}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="text-xl font-bold bg-transparent w-full outline-none text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-100"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-1">
                                <span>{formData.email}</span>
                                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md text-xs font-bold border border-amber-100 dark:border-amber-800/30">
                                    <Star size={10} fill="currentColor" />
                                    <span>{user?.reputation || 0} Reputation Points</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800 mb-6" />

                {/* 3. Grid Form - "items-start" added so expansion doesn't stretch neighbor */}
                <div className="px-4 sm:px-5 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 items-start">

                        {/* Phone Number */}
                        <UnifiedField label="Phone" icon={Phone} isEditing={isEditing}>
                            <div className="flex h-full w-full items-center">
                                <span className="flex items-center justify-center h-[44px] px-3 text-sm font-bold text-gray-500 border-r border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    disabled={!isEditing}
                                    maxLength={10}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    className={`${commonInputClass} ${!isEditing ? 'pl-2' : ''}`}
                                />
                            </div>
                        </UnifiedField>

                        {/* Gender - Expandable */}
                        <UnifiedField label="Gender" icon={User} isEditing={isEditing}>
                            <CustomSelect
                                value={formData.gender}
                                disabled={!isEditing}
                                placeholder="Select Gender"
                                isOpen={activeField === 'gender'}
                                onToggle={() => toggleField('gender')}
                                onChange={(val) => setFormData({ ...formData, gender: val })}
                                options={[
                                    { label: 'Male', value: 'male' },
                                    { label: 'Female', value: 'female' }
                                ]}
                            />
                        </UnifiedField>

                        {/* College */}
                        <div className="md:col-span-2">
                            <UnifiedField label="Institution / College" icon={School} isEditing={isEditing}>
                                <input
                                    value={formData.college}
                                    disabled={!isEditing}
                                    onChange={e => setFormData({ ...formData, college: e.target.value })}
                                    className={commonInputClass}
                                />
                            </UnifiedField>
                        </div>

                        {/* Program - Expandable */}
                        <UnifiedField label="Program" icon={BookOpen} isEditing={isEditing}>
                            <CustomSelect
                                value={formData.course}
                                disabled={!isEditing}
                                placeholder="Select Program"
                                isOpen={activeField === 'program'}
                                onToggle={() => toggleField('program')}
                                onChange={(val) => setFormData({ ...formData, course: val, year: 1, branch: '', semester: '' })}
                                options={programs.map((p: any) => ({ label: p.name, value: p.id }))}
                            />
                        </UnifiedField>

                        {/* Year - Expandable */}
                        <UnifiedField label="Year" icon={Calendar} isEditing={isEditing}>
                            <CustomSelect
                                value={formData.year}
                                disabled={!isEditing || !formData.course}
                                placeholder="Select Year"
                                isOpen={activeField === 'year'}
                                onToggle={() => toggleField('year')}
                                onChange={(val) => setFormData({ ...formData, year: parseInt(val), branch: '', semester: '' })}
                                options={years.map((y: any) => ({ label: y.name, value: y.id }))}
                            />
                        </UnifiedField>

                        {/* Branch - Expandable */}
                        <div className="md:col-span-2">
                            <UnifiedField label="Branch / Department" icon={Hash} isEditing={isEditing}>
                                <CustomSelect
                                    value={formData.branch}
                                    disabled={!isEditing || !formData.year}
                                    placeholder="Select Branch"
                                    isOpen={activeField === 'branch'}
                                    onToggle={() => toggleField('branch')}
                                    onChange={(val) => setFormData({ ...formData, branch: val, semester: '' })}
                                    options={courses.map((c: any) => ({ label: c.name, value: c.id }))}
                                />
                            </UnifiedField>
                        </div>

                        {/* Semester - Expandable */}
                        <UnifiedField label="Current Semester" isEditing={isEditing} icon={null}>
                            <CustomSelect
                                value={formData.semester}
                                disabled={!isEditing || !formData.branch}
                                placeholder="Select Semester"
                                isOpen={activeField === 'semester'}
                                onToggle={() => toggleField('semester')}
                                onChange={(val) => setFormData({ ...formData, semester: val })}
                                options={semesters.map((s: any) => ({ label: s.name, value: s.id }))}
                            />
                        </UnifiedField>

                    </div>
                </div>
            </div>
        </div>
    );
}
