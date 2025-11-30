import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BRANCHES, YEARS } from '../data/academicStructure';
import { User, Save, AlertCircle, CheckCircle2, Pencil, Camera, LogOut } from 'lucide-react';
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

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        semester: user?.semester || 1,
        college: user?.college || 'Medicaps University',
        branch: user?.branch || '',
        year: user?.year || 1,
    });

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
            dataToSend.append('year', formData.year.toString());

            if (avatarFile) {
                dataToSend.append('avatar', avatarFile);
            }

            const response = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type here; fetch sets it automatically for FormData
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

    // Shared input class matching global styles
    const inputClass = "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300 transition-all";

    // Custom select class for dropdowns
    const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700`;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                        <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account information</p>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="p-6 space-y-8">
                    {/* Feedback Messages */}
                    {error && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-md bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Profile updated successfully!
                        </div>
                    )}

                    {/* Section: Profile Picture Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-900">
                                {previewUrl && previewUrl !== 'avatar1' && previewUrl !== 'male' && previewUrl !== 'female' ? (
                                    <img
                                        src={previewUrl}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <NeutralAvatar className="h-full w-full" />
                                )}
                            </div>
                            {/* Upload Button Overlay */}
                            {isEditing && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2.5 bg-black text-white dark:bg-white dark:text-black rounded-full shadow-lg hover:scale-105 transition-transform"
                                    title="Change Profile Picture"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                        {isEditing && (
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                Click camera icon to upload (Max 5MB)
                            </p>
                        )}
                    </div>

                    {/* Section: Personal Info */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isEditing}
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled={true} // Email usually immutable
                                    className={`${inputClass} opacity-60 cursor-not-allowed`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="+91"
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">College</label>
                                <input
                                    type="text"
                                    value={formData.college}
                                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                    disabled={!isEditing}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Academic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Academic Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">Branch</label>
                                <select
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                    disabled={!isEditing}
                                    className={selectClass}
                                >
                                    <option value="">Select Branch</option>
                                    {BRANCHES.map((branch) => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">Year</label>
                                <select
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    disabled={!isEditing}
                                    className={selectClass}
                                >
                                    {YEARS.map((year) => (
                                        <option key={year} value={year}>Year {year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">Semester</label>
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">Reputation Score</label>
                                <div className="flex h-10 w-full items-center rounded-md border border-gray-100 bg-gray-50 px-3 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
                                    {user?.reputation || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="border-t border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-md transition-colors text-sm font-medium w-full sm:w-auto justify-center"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>

                    <div className="flex gap-3 justify-end w-full sm:w-auto">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn btn-primary w-full sm:w-auto"
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
                                        setPreviewUrl(user?.avatar || null); // Reset image preview
                                        setAvatarFile(null); // Clear selected file
                                        // Reset form data
                                        setFormData({
                                            name: user?.name || '',
                                            email: user?.email || '',
                                            phone: user?.phone || '',
                                            semester: user?.semester || 1,
                                            college: user?.college || 'Medicaps University',
                                            branch: user?.branch || '',
                                            year: user?.year || 1,
                                        });
                                    }}
                                    className="btn btn-ghost flex-1 sm:flex-initial"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn btn-primary min-w-[140px] flex-1 sm:flex-initial"
                                >
                                    {isSaving ? (
                                        <>Saving...</>
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
