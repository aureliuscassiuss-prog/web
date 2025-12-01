import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Save, AlertCircle, CheckCircle2, Pencil, Camera, LogOut, GraduationCap, School, Mail, Phone, Hash, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Neutral Default Avatar SVG
const NeutralAvatar = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="12" cy="12" r="12" className="fill-gray-100 dark:fill-gray-800" />
        <path
            d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
            className="fill-gray-400 dark:fill-gray-500"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 12.5C7.94278 12.5 4.47952 14.8697 2.80957 18.3697C2.56952 18.8724 2.93608 19.4632 3.49386 19.4632H20.5061C21.0639 19.4632 21.4305 18.8724 21.1904 18.3697C19.5205 14.8697 16.0572 12.5 12 12.5Z"
            className="fill-gray-400 dark:fill-gray-500"
        />
    </svg>
);

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // State for the new image file and preview
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Academic Structure State
    const [structure, setStructure] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '91',
        semester: user?.semester || 1,
        college: user?.college || 'Medicaps University',
        course: user?.course || '', // Program
        branch: user?.branch || '', // Course
        year: user?.year || 1,
        gender: user?.gender || 'male',
    });

    // Fetch structure on mount
    useEffect(() => {
        fetch('/api/admin?action=structure')
            .then(res => res.json())
            .then(data => setStructure(data))
            .catch(err => console.error('Failed to fetch structure', err));
    }, []);

    // Derived Options
    const programs = structure?.programs || [];

    const years = useMemo(() => {
        if (!formData.course) return [];
        const prog = programs.find((p: any) => p.id === formData.course);
        return prog?.years || [];
    }, [formData.course, programs]);

    const courses = useMemo(() => {
        if (!formData.year) return [];
        // Handle year as number or string
        const yr = years.find((y: any) => y.id === formData.year.toString() || y.id === formData.year);
        return yr?.courses || [];
    }, [formData.year, years]);

    // Handle File Selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError("Image size should be less than 5MB");
                return;
            }
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Create local preview
            setError(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please sign in again');
                setIsSaving(false);
                return;
            }

            // Create FormData to send file + text
            const dataToSend = new FormData();
            dataToSend.append('name', formData.name);
            dataToSend.append('phone', formData.phone);
            dataToSend.append('semester', formData.semester.toString());
            dataToSend.append('college', formData.college);
            dataToSend.append('branch', formData.branch);
            dataToSend.append('course', formData.course);
            dataToSend.append('year', formData.year.toString());
            dataToSend.append('gender', formData.gender);

            if (avatarFile) {
                dataToSend.append('avatar', avatarFile);
            }

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: dataToSend
            });

            const data = await response.json();

            if (response.ok) {
                updateUser(data.user);
                setSuccess(true);
                setIsEditing(false);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Shared styles
    const inputClass = "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-500 transition-all";
    const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 cursor-pointer`;
    const labelClass = "text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5";
    const cardClass = "bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Account Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal details and academic profile.</p>
                </div>
                {/* Feedback Alerts */}
                <div className="flex-1 max-w-md sm:ml-auto">
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Profile updated successfully!
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">

                {/* Left Column: Identity Card */}
                <div className={`lg:col-span-4 space-y-6 ${cardClass} p-6 h-fit`}>
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group mx-auto mb-4">
                            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-900 ring-2 ring-gray-100 dark:ring-gray-800">
                                {previewUrl && previewUrl !== 'avatar1' && previewUrl !== 'male' && previewUrl !== 'female' ? (
                                    <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <NeutralAvatar className="h-full w-full" />
                                )}
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                                    title="Upload new photo"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{formData.name || 'User Name'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{formData.email}</p>

                        <div className="w-full grid grid-cols-2 gap-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Sem</span>
                                <span className="font-bold text-lg text-gray-900 dark:text-white">{formData.semester}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Reputation</span>
                                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{user?.reputation || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Right Column: Forms */}
                <div className={`lg:col-span-8 ${cardClass}`}>
                    <div className="p-6 sm:p-8 space-y-8">

                        {/* Personal Info Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                                <User className="h-4 w-4 text-blue-500" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Personal Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className={labelClass}>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!isEditing}
                                        className={inputClass}
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={labelClass}><Mail className="h-3 w-3" /> Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled={true}
                                        className={`${inputClass} opacity-60 bg-gray-50 dark:bg-gray-900/50`}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={labelClass}><Phone className="h-3 w-3" /> Phone Number</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                                            +
                                        </span>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setFormData({ ...formData, phone: val });
                                            }}
                                            disabled={!isEditing}
                                            placeholder="919876543210"
                                            className={`${inputClass} pl-6`}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className={labelClass}>Gender</label>
                                    <div className="flex gap-3 h-10">
                                        {['male', 'female'].map((genderOption) => (
                                            <button
                                                key={genderOption}
                                                type="button"
                                                disabled={!isEditing}
                                                onClick={() => {
                                                    setFormData({ ...formData, gender: genderOption as 'male' | 'female' | 'other' });
                                                    if (!avatarFile) setPreviewUrl(genderOption === 'male' ? '/1.webp' : '/girl.webp');
                                                }}
                                                className={`flex-1 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2
                                                    ${formData.gender === genderOption
                                                        ? genderOption === 'male'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                                            : 'border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300'
                                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                                    } ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                            >
                                                {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Academic Info Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                                <GraduationCap className="h-4 w-4 text-purple-500" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Academic Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1 md:col-span-2">
                                    <label className={labelClass}><School className="h-3 w-3" /> College</label>
                                    <input
                                        type="text"
                                        value={formData.college}
                                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                        disabled={!isEditing}
                                        className={inputClass}
                                    />
                                </div>

                                {/* Program Selection */}
                                <div className="space-y-1">
                                    <label className={labelClass}><BookOpen className="h-3 w-3" /> Program</label>
                                    <select
                                        value={formData.course}
                                        onChange={(e) => setFormData({ ...formData, course: e.target.value, year: 1, branch: '' })}
                                        disabled={!isEditing}
                                        className={selectClass}
                                    >
                                        <option value="">Select Program</option>
                                        {programs.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Year Selection */}
                                <div className="space-y-1">
                                    <label className={labelClass}>Current Year</label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value), branch: '' })}
                                        disabled={!isEditing || !formData.course}
                                        className={selectClass}
                                    >
                                        <option value="">Select Year</option>
                                        {years.map((y: any) => (
                                            <option key={y.id} value={y.id}>{y.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Branch/Course Selection */}
                                <div className="space-y-1">
                                    <label className={labelClass}><Hash className="h-3 w-3" /> Branch / Course</label>
                                    <select
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        disabled={!isEditing || !formData.year}
                                        className={selectClass}
                                    >
                                        <option value="">Select Branch</option>
                                        {courses.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className={labelClass}>Semester</label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                        disabled={!isEditing}
                                        className={selectClass}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                            <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Action Footer */}
                    <div className="bg-gray-50/50 dark:bg-gray-900/30 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setError(null);
                                        setPreviewUrl(user?.avatar || null);
                                        setAvatarFile(null);
                                        setFormData({
                                            name: user?.name || '',
                                            email: user?.email || '',
                                            phone: user?.phone || '91',
                                            semester: user?.semester || 1,
                                            college: user?.college || 'Medicaps University',
                                            course: user?.course || '',
                                            branch: user?.branch || '',
                                            year: user?.year || 1,
                                            gender: user?.gender || 'male',
                                        });
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px]"
                                >
                                    {isSaving ? (
                                        <div className="flex items-center">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                                            Saving...
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}