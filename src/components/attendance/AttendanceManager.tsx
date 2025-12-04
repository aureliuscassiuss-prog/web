import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Plus,
    Trash2,
    Edit2,
    PieChart,
    Clock,
    BookOpen,
    AlertTriangle,
    Save,
    MoreVertical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Subject, AttendanceLog, Schedule } from '../../types/attendance';

// Utility to get day name
const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export default function AttendanceManager() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'manage'>('overview');

    // State
    const [subjects, setSubjects] = useState<Subject[]>(() => {
        const saved = localStorage.getItem('attendance_subjects');
        return saved ? JSON.parse(saved) : [];
    });

    const [logs, setLogs] = useState<AttendanceLog[]>(() => {
        const saved = localStorage.getItem('attendance_logs');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to local storage
    useEffect(() => {
        localStorage.setItem('attendance_subjects', JSON.stringify(subjects));
    }, [subjects]);

    useEffect(() => {
        localStorage.setItem('attendance_logs', JSON.stringify(logs));
    }, [logs]);

    // --- Actions ---

    const addSubject = (newSubject: Subject) => {
        setSubjects([...subjects, newSubject]);
    };

    const deleteSubject = (id: string) => {
        setSubjects(subjects.filter(s => s.id !== id));
        setLogs(logs.filter(l => l.subjectId !== id));
    };

    const markAttendance = (subjectId: string, status: 'present' | 'absent' | 'cancelled', date: Date = new Date()) => {
        const newLog: AttendanceLog = {
            id: crypto.randomUUID(),
            subjectId,
            date: date.toISOString(),
            status
        };

        setLogs([...logs, newLog]);

        // Update subject stats
        setSubjects(subjects.map(sub => {
            if (sub.id === subjectId) {
                return {
                    ...sub,
                    totalClasses: status !== 'cancelled' ? sub.totalClasses + 1 : sub.totalClasses,
                    attendedClasses: status === 'present' ? sub.attendedClasses + 1 : sub.attendedClasses
                };
            }
            return sub;
        }));
    };

    // --- Components ---

    const OverviewTab = () => {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map(subject => {
                        const percentage = subject.totalClasses > 0
                            ? Math.round((subject.attendedClasses / subject.totalClasses) * 100)
                            : 0;

                        const isLow = percentage < subject.minimumAttendance;

                        return (
                            <div key={subject.id} className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full`} style={{ backgroundColor: subject.color }} />

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{subject.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{subject.code || 'No Code'}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${isLow
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {percentage}%
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Attended: <span className="font-semibold text-gray-900 dark:text-white">{subject.attendedClasses}</span></span>
                                        <span className="text-gray-600 dark:text-gray-400">Total: <span className="font-semibold text-gray-900 dark:text-white">{subject.totalClasses}</span></span>
                                    </div>

                                    {/* Calculator / Prediction */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            Target: {subject.minimumAttendance}%
                                        </p>
                                        {percentage < subject.minimumAttendance ? (
                                            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4" />
                                                Need to attend next <strong>{Math.ceil(((subject.minimumAttendance / 100) * subject.totalClasses - subject.attendedClasses) / (1 - (subject.minimumAttendance / 100)))}</strong> classes
                                            </p>
                                        ) : (
                                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4" />
                                                On track! Can miss next <strong>{Math.floor((subject.attendedClasses - (subject.minimumAttendance / 100) * subject.totalClasses) / (subject.minimumAttendance / 100))}</strong> classes
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {subjects.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-full mb-4">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Subjects Added</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                                Start by adding your subjects and schedule to track your attendance effectively.
                            </p>
                            <button
                                onClick={() => setActiveTab('manage')}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Add Your First Subject
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const DailyTab = () => {
        const today = getDayName(new Date());
        const todaysSubjects = subjects.filter(s => s.schedule.some(sch => sch.day === today));

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                    <h2 className="text-3xl font-bold mb-2">Today is {today}</h2>
                    <p className="text-blue-100">Mark your attendance for today's classes.</p>
                </div>

                <div className="space-y-4">
                    {todaysSubjects.length > 0 ? (
                        todaysSubjects.map(subject => {
                            const schedule = subject.schedule.find(s => s.day === today);
                            // Check if already marked for today
                            const todayLog = logs.find(l =>
                                l.subjectId === subject.id &&
                                new Date(l.date).toDateString() === new Date().toDateString()
                            );

                            return (
                                <div key={subject.id} className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: subject.color }}>
                                            {subject.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{subject.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {schedule?.startTime} - {schedule?.endTime}
                                            </p>
                                        </div>
                                    </div>

                                    {todayLog ? (
                                        <div className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${todayLog.status === 'present'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : todayLog.status === 'absent'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {todayLog.status === 'present' && <CheckCircle2 className="w-4 h-4" />}
                                            {todayLog.status === 'absent' && <XCircle className="w-4 h-4" />}
                                            {todayLog.status.charAt(0).toUpperCase() + todayLog.status.slice(1)}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => markAttendance(subject.id, 'present')}
                                                className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors"
                                                title="Present"
                                            >
                                                <CheckCircle2 className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={() => markAttendance(subject.id, 'absent')}
                                                className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                title="Absent"
                                            >
                                                <XCircle className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={() => markAttendance(subject.id, 'cancelled')}
                                                className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                                                title="Class Cancelled"
                                            >
                                                <MoreVertical className="w-6 h-6" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No classes scheduled for today.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const ManageTab = () => {
        const [isAdding, setIsAdding] = useState(false);
        const [editingId, setEditingId] = useState<string | null>(null);
        const [newSubject, setNewSubject] = useState<Partial<Subject>>({
            name: '',
            code: '',
            totalClasses: 0,
            attendedClasses: 0,
            minimumAttendance: 75,
            color: '#3b82f6',
            schedule: []
        });

        const handleEdit = (subject: Subject) => {
            setNewSubject({
                name: subject.name,
                code: subject.code,
                totalClasses: subject.totalClasses,
                attendedClasses: subject.attendedClasses,
                minimumAttendance: subject.minimumAttendance,
                color: subject.color,
                schedule: subject.schedule
            });
            setEditingId(subject.id);
            setIsAdding(true);
        };

        const handleAddSchedule = () => {
            setNewSubject(prev => ({
                ...prev,
                schedule: [...(prev.schedule || []), { day: 'Monday', startTime: '09:00', endTime: '10:00' }]
            }));
        };

        const updateSchedule = (index: number, field: keyof Schedule, value: string) => {
            const updatedSchedule = [...(newSubject.schedule || [])];
            updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
            setNewSubject(prev => ({ ...prev, schedule: updatedSchedule }));
        };

        const removeSchedule = (index: number) => {
            const updatedSchedule = [...(newSubject.schedule || [])];
            updatedSchedule.splice(index, 1);
            setNewSubject(prev => ({ ...prev, schedule: updatedSchedule }));
        };

        const handleSave = () => {
            if (!newSubject.name) return;

            if (editingId) {
                // Update existing
                setSubjects(subjects.map(sub => {
                    if (sub.id === editingId) {
                        return {
                            ...sub,
                            name: newSubject.name!,
                            code: newSubject.code,
                            totalClasses: Number(newSubject.totalClasses) || 0,
                            attendedClasses: Number(newSubject.attendedClasses) || 0,
                            minimumAttendance: Number(newSubject.minimumAttendance) || 75,
                            color: newSubject.color || '#3b82f6',
                            schedule: newSubject.schedule || []
                        };
                    }
                    return sub;
                }));
            } else {
                // Create new
                const subject: Subject = {
                    id: crypto.randomUUID(),
                    name: newSubject.name,
                    code: newSubject.code,
                    totalClasses: Number(newSubject.totalClasses) || 0,
                    attendedClasses: Number(newSubject.attendedClasses) || 0,
                    minimumAttendance: Number(newSubject.minimumAttendance) || 75,
                    color: newSubject.color || '#3b82f6',
                    schedule: newSubject.schedule || []
                };
                addSubject(subject);
            }

            setIsAdding(false);
            setEditingId(null);
            setNewSubject({
                name: '',
                code: '',
                totalClasses: 0,
                attendedClasses: 0,
                minimumAttendance: 75,
                color: '#3b82f6',
                schedule: []
            });
        };

        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                {!isAdding ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Subjects</h2>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setNewSubject({
                                        name: '',
                                        code: '',
                                        totalClasses: 0,
                                        attendedClasses: 0,
                                        minimumAttendance: 75,
                                        color: '#3b82f6',
                                        schedule: []
                                    });
                                    setIsAdding(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Subject
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {subjects.map(subject => (
                                <div key={subject.id} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: subject.color }} />
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {subject.schedule.length} sessions/week • Target: {subject.minimumAttendance}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(subject)}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteSubject(subject.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Subject' : 'Add New Subject'}</h2>
                            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name</label>
                                    <input
                                        type="text"
                                        value={newSubject.name}
                                        onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Mathematics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={newSubject.code}
                                        onChange={e => setNewSubject({ ...newSubject, code: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. MAT101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewSubject({ ...newSubject, color })}
                                                className={`w-8 h-8 rounded-full transition-transform ${newSubject.color === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Attendance (Optional)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500">Attended</span>
                                            <input
                                                type="number"
                                                value={newSubject.attendedClasses}
                                                onChange={e => setNewSubject({ ...newSubject, attendedClasses: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Total Classes</span>
                                            <input
                                                type="number"
                                                value={newSubject.totalClasses}
                                                onChange={e => setNewSubject({ ...newSubject, totalClasses: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Attendance Target (%)</label>
                                    <input
                                        type="number"
                                        value={newSubject.minimumAttendance}
                                        onChange={e => setNewSubject({ ...newSubject, minimumAttendance: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Schedule</label>
                                <button
                                    onClick={handleAddSchedule}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    + Add Session
                                </button>
                            </div>
                            <div className="space-y-2">
                                {newSubject.schedule?.map((sch, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <select
                                            value={sch.day}
                                            onChange={e => updateSchedule(idx, 'day', e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white"
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="time"
                                            value={sch.startTime}
                                            onChange={e => updateSchedule(idx, 'startTime', e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white"
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="time"
                                            value={sch.endTime}
                                            onChange={e => updateSchedule(idx, 'endTime', e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white"
                                        />
                                        <button onClick={() => removeSchedule(idx)} className="text-red-500 hover:text-red-700">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {(!newSubject.schedule || newSubject.schedule.length === 0) && (
                                    <p className="text-sm text-gray-500 italic">No weekly sessions added yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!newSubject.name}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Subject
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Attendance Manager</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track your classes, manage attendance, and stay on target.</p>
                </div>

                {/* User Profile Snippet */}
                {user && (
                    <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                {user.displayName?.charAt(0) || 'U'}
                            </div>
                        )}
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{user.displayName}</span>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: PieChart },
                    { id: 'daily', label: 'Mark Attendance', icon: CheckCircle2 },
                    { id: 'manage', label: 'Manage Subjects', icon: Edit2 },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'daily' && <DailyTab />}
                {activeTab === 'manage' && <ManageTab />}
            </div>
        </div>
    );
}
