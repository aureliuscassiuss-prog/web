import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Plus,
    Trash2,
    Edit2,
    PieChart,
    Clock,
    AlertTriangle,
    Save,
    Target,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Loader2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Subject, AttendanceLog, Schedule } from '../../types/attendance'

// --- Utility Components ---
function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all z-10 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
        </button>
    )
}

function ProgressBar({ percentage, color }: { percentage: number, color: string }) {
    return (
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
            />
        </div>
    )
}

export default function AttendanceManager() {
    const { user, token } = useAuth()
    const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'manage'>('overview')
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [logs, setLogs] = useState<AttendanceLog[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    // Load data from API (fallback to local storage)
    useEffect(() => {
        const loadData = async () => {
            try {
                if (token) {
                    const res = await fetch('/api/attendance', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.subjects && data.subjects.length > 0) {
                            setSubjects(data.subjects)
                            setLogs(data.logs || [])
                            setLoading(false)
                            return
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch attendance:', error)
            }

            // Fallback to local storage
            const savedSubjects = localStorage.getItem('attendance_subjects')
            const savedLogs = localStorage.getItem('attendance_logs')
            if (savedSubjects) setSubjects(JSON.parse(savedSubjects))
            if (savedLogs) setLogs(JSON.parse(savedLogs))
            setLoading(false)
        }
        loadData()
    }, [token])

    // Save data to API and local storage
    useEffect(() => {
        if (!loading) {
            // Local Storage
            localStorage.setItem('attendance_subjects', JSON.stringify(subjects))
            localStorage.setItem('attendance_logs', JSON.stringify(logs))

            // API Sync (Debounced)
            const syncData = async () => {
                if (!token) return
                setSyncing(true)
                try {
                    await fetch('/api/attendance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ subjects, logs })
                    })
                } catch (error) {
                    console.error('Failed to sync attendance:', error)
                } finally {
                    setSyncing(false)
                }
            }

            const timeoutId = setTimeout(syncData, 1000)
            return () => clearTimeout(timeoutId)
        }
    }, [subjects, logs, loading, token])

    const addSubject = (subject: Subject) => {
        setSubjects([...subjects, subject])
    }

    const updateSubject = (updatedSubject: Subject) => {
        setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s))
    }

    const deleteSubject = (id: string) => {
        if (confirm('Are you sure? This will delete all attendance history for this subject.')) {
            setSubjects(subjects.filter(s => s.id !== id))
            setLogs(logs.filter(l => l.subjectId !== id))
        }
    }

    const markAttendance = (subjectId: string, status: 'present' | 'absent' | 'cancelled', date: Date = new Date()) => {
        const dateStr = date.toDateString()
        const existingLogIndex = logs.findIndex(l => l.subjectId === subjectId && new Date(l.date).toDateString() === dateStr)

        let newLogs = [...logs]
        let subject = subjects.find(s => s.id === subjectId)
        if (!subject) return
        let updatedSubject = { ...subject }

        if (existingLogIndex >= 0) {
            const oldStatus = logs[existingLogIndex].status
            if (oldStatus === status) return // No change

            // Revert old stats
            if (oldStatus === 'present') {
                updatedSubject.attendedClasses--
                updatedSubject.totalClasses--
            } else if (oldStatus === 'absent') {
                updatedSubject.totalClasses--
            }

            // Update log
            newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], status }
        } else {
            // New log
            const log: AttendanceLog = {
                id: crypto.randomUUID(),
                subjectId,
                date: date.toISOString(),
                status
            }
            newLogs.push(log)
        }

        // Apply new stats
        if (status === 'present') {
            updatedSubject.attendedClasses++
            updatedSubject.totalClasses++
        } else if (status === 'absent') {
            updatedSubject.totalClasses++
        }

        setLogs(newLogs)
        updateSubject(updatedSubject)
    }

    const NeutralAvatar = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="24" height="24" className="fill-gray-100 dark:fill-gray-800" />
            <circle cx="12" cy="8" r="4" className="fill-gray-300 dark:fill-gray-600" />
            <path d="M4 20C4 16 8 15 12 15C16 15 20 16 20 20" strokeWidth="0" className="fill-gray-300 dark:fill-gray-600" />
        </svg>
    )

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Attendance Manager</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your academic progress and manage your schedule.</p>
                    </div>

                    {/* User Profile Card */}
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-2 pr-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <NeutralAvatar className="h-full w-full" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.name || 'Guest Student'}</div>
                                {syncing && <RefreshCw size={12} className="animate-spin text-gray-400" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                    {user?.course || 'Program N/A'} • {user?.year ? `${user.year} Year` : 'Year N/A'}
                                </span>
                                {user?.isTrusted && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Tabs Navigation --- */}
                <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="relative flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-full">
                        {/* Animated Indicator */}
                        <motion.div
                            layoutId="active-tab-indicator"
                            className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                            initial={false}
                            animate={{
                                left: activeTab === 'overview' ? '4px' : activeTab === 'daily' ? 'calc(33.33% + 2px)' : 'calc(66.66%)',
                                width: 'calc(33.33% - 4px)'
                            }}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />

                        <div className="relative z-10 flex w-full">
                            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<PieChart size={16} />} label="Overview" />
                            <TabButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<Calendar size={16} />} label="Daily Marking" />
                            <TabButton active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Edit2 size={16} />} label="Manage Subjects" />
                        </div>
                    </div>
                </div>

                {/* --- Content Area --- */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <OverviewTab subjects={subjects} />
                            </motion.div>
                        )}
                        {activeTab === 'daily' && (
                            <motion.div key="daily" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <DailyTab subjects={subjects} logs={logs} onMark={markAttendance} />
                            </motion.div>
                        )}
                        {activeTab === 'manage' && (
                            <motion.div key="manage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <ManageTab subjects={subjects} onAdd={addSubject} onUpdate={updateSubject} onDelete={deleteSubject} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

// --- Sub-Components ---

function OverviewTab({ subjects }: { subjects: Subject[] }) {
    if (subjects.length === 0) return <EmptyState message="No subjects added yet. Go to 'Manage Subjects' to get started." />

    return (
        <div className="space-y-3">
            {subjects.map(subject => <SubjectCard key={subject.id} subject={subject} />)}
        </div>
    )
}

function SubjectCard({ subject }: { subject: Subject }) {
    const [isExpanded, setIsExpanded] = useState(false)

    const percentage = subject.totalClasses > 0
        ? Math.round((subject.attendedClasses / subject.totalClasses) * 100)
        : 0
    const isLow = percentage < subject.minimumAttendance

    // Prediction Logic
    const classesToAttend = Math.ceil(((subject.minimumAttendance / 100) * subject.totalClasses - subject.attendedClasses) / (1 - (subject.minimumAttendance / 100)))
    const classesCanMiss = Math.floor((subject.attendedClasses - (subject.minimumAttendance / 100) * subject.totalClasses) / (subject.minimumAttendance / 100))

    return (
        <motion.div
            layout
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex items-center gap-4">
                    <div className="h-10 w-1 rounded-full" style={{ backgroundColor: subject.color }}></div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{subject.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{subject.attendedClasses}/{subject.totalClasses} • {percentage}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isLow ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {percentage}%
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-800 mt-2 pt-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-gray-500 dark:text-gray-400">Attendance Progress</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{subject.attendedClasses}/{subject.totalClasses}</span>
                                </div>
                                <ProgressBar percentage={percentage} color={subject.color || '#3b82f6'} />
                            </div>

                            <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                {isLow ? (
                                    <>
                                        <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                            Attendance is low! You need to attend <span className="font-bold text-red-600 dark:text-red-400">{classesToAttend > 0 ? classesToAttend : 0}</span> more classes to reach {subject.minimumAttendance}%.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                            On track! You can safely miss <span className="font-bold text-green-600 dark:text-green-400">{classesCanMiss > 0 ? classesCanMiss : 0}</span> classes and stay above {subject.minimumAttendance}%.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function DailyTab({ subjects, logs, onMark }: { subjects: Subject[], logs: AttendanceLog[], onMark: any }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
    const dateString = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const isToday = selectedDate.toDateString() === new Date().toDateString()

    // Filter subjects that have a class on the selected day
    const daysClasses = subjects.filter(subject =>
        subject.schedule.some(s => s.day === dayName)
    )

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(selectedDate.getDate() + days)
        setSelectedDate(newDate)
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
                    <ChevronDown className="rotate-90" size={20} />
                </button>

                <div className="text-center">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">{isToday ? 'Today' : dayName}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{dateString}</p>
                </div>

                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
                    <ChevronDown className="-rotate-90" size={20} />
                </button>
            </div>

            {daysClasses.length === 0 ? (
                <EmptyState message={`No classes scheduled for ${dayName}. Enjoy your day off!`} />
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</span>
                        <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-md font-medium">
                            {daysClasses.length} Classes
                        </span>
                    </div>

                    {daysClasses.map(subject => {
                        const log = logs.find(l =>
                            l.subjectId === subject.id &&
                            new Date(l.date).toDateString() === selectedDate.toDateString()
                        )

                        return (
                            <DailySubjectRow
                                key={subject.id}
                                subject={subject}
                                log={log}
                                date={selectedDate}
                                onMark={onMark}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function DailySubjectRow({ subject, log, date, onMark }: { subject: Subject, log?: AttendanceLog, date: Date, onMark: any }) {
    const [loading, setLoading] = useState<string | null>(null)

    const handleMark = async (status: string) => {
        setLoading(status)
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
        onMark(subject.id, status, date)
        setLoading(null)
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="h-10 w-1 bg-gray-200 dark:bg-gray-700 rounded-full" style={{ backgroundColor: subject.color }}></div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{subject.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Target size={12} /> Target: {subject.minimumAttendance}%</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                    onClick={() => handleMark('present')}
                    disabled={!!loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${log?.status === 'present'
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800 ring-2 ring-green-500/20'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                        }`}
                >
                    {loading === 'present' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className={log?.status === 'present' ? 'fill-current' : ''} />}
                    Present
                </button>
                <button
                    onClick={() => handleMark('absent')}
                    disabled={!!loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${log?.status === 'absent'
                            ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800 ring-2 ring-red-500/20'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                        }`}
                >
                    {loading === 'absent' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} className={log?.status === 'absent' ? 'fill-current' : ''} />}
                    Absent
                </button>
                <button
                    onClick={() => handleMark('cancelled')}
                    disabled={!!loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${log?.status === 'cancelled'
                            ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800 ring-2 ring-orange-500/20'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                        }`}
                >
                    {loading === 'cancelled' ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} className={log?.status === 'cancelled' ? 'fill-current' : ''} />}
                    Cancelled
                </button>
            </div>
        </div>
    )
}

function ManageTab({ subjects, onAdd, onUpdate, onDelete }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newSubject, setNewSubject] = useState<Partial<Subject>>({
        name: '',
        code: '',
        totalClasses: 0,
        attendedClasses: 0,
        minimumAttendance: 75,
        color: '#3b82f6',
        schedule: []
    })

    const handleSave = async () => {
        if (!newSubject.name) return

        setIsSaving(true)
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 600))

        if (editingId) {
            onUpdate({ ...newSubject, id: editingId } as Subject)
        } else {
            const subject: Subject = {
                id: crypto.randomUUID(),
                name: newSubject.name!,
                code: newSubject.code || '',
                totalClasses: Number(newSubject.totalClasses) || 0,
                attendedClasses: Number(newSubject.attendedClasses) || 0,
                minimumAttendance: Number(newSubject.minimumAttendance) || 75,
                color: newSubject.color || '#3b82f6',
                schedule: newSubject.schedule || []
            }
            onAdd(subject)
        }
        setIsSaving(false)
        resetForm()
    }

    const resetForm = () => {
        setIsEditing(false)
        setEditingId(null)
        setNewSubject({
            name: '',
            code: '',
            totalClasses: 0,
            attendedClasses: 0,
            minimumAttendance: 75,
            color: '#3b82f6',
            schedule: []
        })
    }

    const startEdit = (subject: Subject) => {
        setNewSubject(subject)
        setEditingId(subject.id)
        setIsEditing(true)
    }

    const addScheduleItem = () => {
        setNewSubject({
            ...newSubject,
            schedule: [...(newSubject.schedule || []), { day: 'Monday', startTime: '', endTime: '' }]
        })
    }

    const updateScheduleItem = (index: number, field: keyof Schedule, value: string) => {
        const updatedSchedule = [...(newSubject.schedule || [])]
        updatedSchedule[index] = { ...updatedSchedule[index], [field]: value }
        setNewSubject({ ...newSubject, schedule: updatedSchedule })
    }

    const removeScheduleItem = (index: number) => {
        const updatedSchedule = [...(newSubject.schedule || [])]
        updatedSchedule.splice(index, 1)
        setNewSubject({ ...newSubject, schedule: updatedSchedule })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg mx-1">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Subject' : 'Add New Subject'}</h2>
                                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Name & Code */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Subject Name</label>
                                        <input type="text" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Mathematics" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Subject Code (Optional)</label>
                                        <input type="text" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. CS101" />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Total</label>
                                        <input type="number" value={newSubject.totalClasses} onChange={e => setNewSubject({ ...newSubject, totalClasses: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Attended</label>
                                        <input type="number" value={newSubject.attendedClasses} onChange={e => setNewSubject({ ...newSubject, attendedClasses: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Target %</label>
                                        <input type="number" value={newSubject.minimumAttendance} onChange={e => setNewSubject({ ...newSubject, minimumAttendance: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Color Tag</label>
                                    <div className="flex gap-3">
                                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewSubject({ ...newSubject, color })}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newSubject.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Class Schedule</label>
                                        <button onClick={addScheduleItem} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                                            <Plus size={12} /> Add Day
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {newSubject.schedule?.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                                                <select value={item.day} onChange={e => updateScheduleItem(index, 'day', e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                                <button onClick={() => removeScheduleItem(index)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        {newSubject.schedule?.length === 0 && (
                                            <p className="text-xs text-gray-400 italic py-2">No classes scheduled yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 flex gap-3">
                                    <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-black text-white dark:bg-white dark:text-black py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                        {isSaving ? 'Saving...' : 'Save Subject'}
                                    </button>
                                    <button onClick={resetForm} disabled={isSaving} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isEditing && (
                <div className="flex justify-end">
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
                        <Plus size={16} /> Add Subject
                    </button>
                </div>
            )}

            {subjects.length === 0 ? (
                <EmptyState message="No subjects found. Add one to get started!" />
            ) : (
                <div className="space-y-3">
                    {subjects.map((subject: Subject) => (
                        <div key={subject.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between group hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: subject.color }}>
                                    {subject.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{subject.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{subject.code} • {subject.schedule.length} Days/Week</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(subject)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => onDelete(subject.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <PieChart size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
        </div>
    )
}
